/**
 * Reconciliation UATs for story-5e7eb0c5 — "Colour census and repeatable palette
 * retrofit: measure a site's colours, then migrate it onto a palette without
 * moving a pixel".
 *
 * The palette *model* (STORY-80) makes a reference an admissible form for any
 * colour axis. This story is the trip an already-authored site takes to reach
 * it: measure what is there (`1c colors <slug>`), then convert it (`--assign`)
 * under two proofs — every derived reference reproduces the literal it replaces
 * within a stated bound, and the converted definition still validates. Either
 * failing aborts before anything touches disk.
 *
 * REQ-137 reshaped the guarantee the retrofit is gated on. A *named step* stored
 * a family member's exact hex, so byte-identity was free; a **shade** computes it
 * from the entry, so a genuine ramp member lands within a measured 8/255 of where
 * it was, and a colour the mix cannot reach at all — one more saturated than its
 * family's base — is filed as its own exact entry rather than approximated. This
 * file proves that shape:
 *
 *   AC-939   the census reports distinct literals with counts, distinct RGB
 *            ignoring alpha, and the alpha families — and writes nothing.
 *   AC-940   the census is a single machine-readable JSON document.
 *   AC-941   the retrofit writes a palette, rewrites every literal as a
 *            reference, and reports the counts, entries, drift and files.
 *   AC-942   one RGB at several opacities is ONE entry; opacity rides on the
 *            reference and survives the trip byte-exactly.
 *   AC-943   a family is one entry plus a shade on each reference, based on the
 *            member that reaches the most others; unreachable and
 *            mis-classifying fits are refused.
 *   AC-944   nothing moves outside 8/255; unshaded references are byte-exact;
 *            the accepted drift is reported, worst first.
 *   AC-945   a retrofit that cannot be proved lossless writes nothing.
 *   AC-946   derived names describe the colour and rename to role vocabulary
 *            from the command line.
 *   AC-947   assignment is a separate pass, and a second run is a byte-identical
 *            fixpoint.
 *   AC-932   the palette is materially smaller than the distinct colour count,
 *            with no colour lost and no entry carrying a step.
 *   AC-1146  a colour the shade axis cannot reach becomes its own exact entry.
 *   AC-1147  the fit is searched over the same shade function the definition
 *            resolves through, so the reported drift is the drift that paints.
 *
 * Boundary. The ACs that speak about stdout, stderr, exit status or the command
 * line are driven through the shipped `1c` launcher as a subprocess — that is the
 * surface they describe. Those runs are made from the repo root against the
 * `--sandbox` store (`storage/sandbox/`, gitignored throwaway scratch) under
 * slugs unique to each test, seeded by copying a real site or by painting a
 * synthetic one, and removed afterwards. The ACs that speak about the derived
 * palette or the converted definition drive the same command handlers the
 * launcher dispatches, against isolated temp working directories. Nothing is
 * mocked; the repo's own `storage/sites/` tree is only ever read.
 */
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, describe, expect, it } from 'vitest'
import type { L1Palette, L1PaletteRef } from '../packages/site-schema/src/index'
import { validateSite } from '../packages/site-schema/src/index'
import { resolveL1Color, resolveL1Palette, shadeHex } from '../packages/site-schema/src/l1/palette'
import { cmdNew } from '../tools/generate/src/cli/commands'
import {
  SHADE_FIT_TOLERANCE,
  cmdColors,
  cmdColorsAssign,
  collectColorLiterals,
  fitShade,
  splitColor,
  toHcl,
} from '../tools/generate/src/cli/colors'
import { writeL1 } from '../tools/generate/src/cli/capture/bundle'
import { cmdRepro } from '../tools/generate/src/cli/repro'
import { listFilesRel } from '../tools/generate/src/store'

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const BIN = path.join(REPO_ROOT, 'tools', 'generate', 'bin', '1c.mjs')
const SITES = path.join(REPO_ROOT, 'storage', 'sites')
const SANDBOX = path.join(REPO_ROOT, 'storage', 'sandbox')

/** `#rrggbb` or `#rrggbbaa`, the only shape an L1 colour literal takes. */
const HEX = /^#[0-9a-f]{6}([0-9a-f]{2})?$/

// ── harness ──────────────────────────────────────────────────────────────────

const tmpDirs: string[] = []
const sandboxSlugs: string[] = []

afterAll(() => {
  for (const d of tmpDirs) rmSync(d, { recursive: true, force: true })
  for (const s of sandboxSlugs) rmSync(path.join(SANDBOX, s), { recursive: true, force: true })
})

function freshCwd(): string {
  const cwd = mkdtempSync(path.join(tmpdir(), 'story5e7eb0c5-shade-'))
  tmpDirs.push(cwd)
  return cwd
}

/** Copy a real stored site into the throwaway sandbox store under `slug`. */
function seedSandbox(source: string, slug: string): string {
  const dir = path.join(SANDBOX, slug)
  sandboxSlugs.push(slug)
  rmSync(dir, { recursive: true, force: true })
  mkdirSync(SANDBOX, { recursive: true })
  cpSync(path.join(SITES, source), dir, { recursive: true })
  return dir
}

/** Copy a real stored site into an isolated temp working directory. */
function seedTemp(cwd: string, source: string, slug: string): string {
  const dir = path.join(cwd, 'storage', 'sites', slug)
  mkdirSync(path.dirname(dir), { recursive: true })
  cpSync(path.join(SITES, source), dir, { recursive: true })
  return dir
}

/** Run the shipped `1c` launcher, capturing both streams and the exit status. */
function cli(args: string[]): { status: number | null; stdout: string; stderr: string } {
  const res = spawnSync('node', [BIN, ...args], { cwd: REPO_ROOT, encoding: 'utf8' })
  return { status: res.status, stdout: res.stdout ?? '', stderr: res.stderr ?? '' }
}

/** sha256 of every file under `dir`, keyed by its path relative to `dir`. */
function hashTree(dir: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const rel of listFilesRel(dir)) {
    out[rel] = createHash('sha256').update(readFileSync(path.join(dir, rel))).digest('hex')
  }
  return out
}

const readJsonFile = <T>(file: string): T => JSON.parse(readFileSync(file, 'utf8')) as T

const draftOf = (siteDir: string): string => path.join(siteDir, 'draft')

function paletteOf(siteDir: string): L1Palette | undefined {
  return readJsonFile<{ palette?: L1Palette }>(path.join(draftOf(siteDir), 'site.json')).palette
}

function pageFiles(siteDir: string): string[] {
  const pages = path.join(draftOf(siteDir), 'pages')
  return listFilesRel(pages)
    .filter((rel) => rel.endsWith('.json'))
    .map((rel) => path.join(pages, rel))
}

/** Every page of a site, as it stands on disk. */
const pagesOf = (siteDir: string): unknown[] => pageFiles(siteDir).map((f) => readJsonFile<unknown>(f))

/**
 * Every page of a site with its palette resolved back to literals — the colours
 * the site actually paints, whether it carries a palette or not.
 */
function paintedPages(siteDir: string): unknown[] {
  const palette = paletteOf(siteDir)
  return pagesOf(siteDir).map((p) => resolveL1Palette(p, palette))
}

/** Structural test for a palette reference, matching the schema's own shape. */
function isRef(v: unknown): v is L1PaletteRef {
  return typeof v === 'object' && v !== null && !Array.isArray(v) && typeof (v as { ref?: unknown }).ref === 'string'
}

/** Every palette reference reachable from `input`. */
function collectRefs(input: unknown): L1PaletteRef[] {
  const out: L1PaletteRef[] = []
  const walk = (v: unknown): void => {
    if (Array.isArray(v)) return v.forEach(walk)
    if (typeof v !== 'object' || v === null) return
    if (isRef(v)) {
      out.push(v)
      return
    }
    for (const item of Object.values(v)) walk(item)
  }
  walk(input)
  return out
}

/**
 * Walk a pre-conversion tree and its converted counterpart in step, pairing each
 * colour literal with the reference that replaced it **in that same position**.
 * Position-wise rather than by value, so "the literal it replaced" is the literal
 * that was actually there.
 */
function pairLiteralsWithRefs(
  before: unknown,
  after: unknown,
  out: { literal: string; ref: L1PaletteRef }[] = [],
): { literal: string; ref: L1PaletteRef }[] {
  if (typeof before === 'string' && isRef(after)) {
    out.push({ literal: before.toLowerCase(), ref: after })
    return out
  }
  if (Array.isArray(before) && Array.isArray(after)) {
    before.forEach((item, i) => pairLiteralsWithRefs(item, after[i], out))
    return out
  }
  if (typeof before === 'object' && before !== null && typeof after === 'object' && after !== null) {
    const b = before as Record<string, unknown>
    const a = after as Record<string, unknown>
    for (const key of Object.keys(b)) pairLiteralsWithRefs(b[key], a[key], out)
  }
  return out
}

/**
 * The largest per-channel byte difference between two `#rrggbb` values —
 * re-derived here rather than imported, so the bound is measured independently
 * of the code that enforces it.
 */
function maxChannelDelta(a: string, b: string): number {
  let worst = 0
  for (let i = 1; i < 7; i += 2) {
    worst = Math.max(worst, Math.abs(parseInt(a.slice(i, i + 2), 16) - parseInt(b.slice(i, i + 2), 16)))
  }
  return worst
}

/** Chroma as the sRGB byte spread — zero for any grey, maximal for a pure hue. */
function chroma(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
  return Math.max(r, g, b) - Math.min(r, g, b)
}

/**
 * A minimal, valid L1 document painted with exactly `colors` — the document
 * background plus one text run per colour, so the census of the site it lands in
 * is precisely the set under test.
 */
function synthDoc(colors: string[]): unknown {
  return {
    widths: [1440],
    background: colors[0],
    root: {
      kind: 'container',
      id: 'root',
      layout: 'stack',
      children: colors.map((c, i) => ({
        kind: 'text',
        id: `swatch-${i}`,
        text: `swatch ${i}`,
        axes: { color: c, fontSizePx: 16, lineHeightPx: 24 },
      })),
    },
  }
}

/** Paint `colors` onto the home page of a site that already exists. */
function paint(draftDir: string, colors: string[]): void {
  const homePath = path.join(draftDir, 'pages', 'home.json')
  const home = readJsonFile<Record<string, unknown>>(homePath)
  home.l1 = synthDoc(colors)
  writeFileSync(homePath, `${JSON.stringify(home, null, 2)}\n`)
}

/** Create a site under `cwd` whose only page is painted with `colors`. */
function paintedSite(cwd: string, slug: string, colors: string[]): string {
  const { draftDir } = cmdNew(slug, { cwd })
  paint(draftDir, colors)
  return path.join(cwd, 'storage', 'sites', slug)
}

/** The same, in the throwaway sandbox store, so the `1c` launcher can reach it. */
function paintedSandboxSite(slug: string, colors: string[]): string {
  sandboxSlugs.push(slug)
  rmSync(path.join(SANDBOX, slug), { recursive: true, force: true })
  const { draftDir } = cmdNew(slug, { cwd: REPO_ROOT, sandbox: true })
  paint(draftDir, colors)
  return path.join(SANDBOX, slug)
}

/**
 * A capture bundle carrying a folded `l1.json` — the input to the reproduction
 * path, which emits colour literals only and never a palette.
 */
function capturedBundle(cwd: string, colors: string[]): string {
  const dir = path.join(cwd, 'bundle')
  mkdirSync(path.join(dir, 'assets'), { recursive: true })
  writeL1(dir, synthDoc(colors) as never)
  writeFileSync(
    path.join(dir, 'capture.json'),
    JSON.stringify({ url: 'https://example.test/', host: 'example.test', assets: [] }, null, 2),
  )
  return dir
}

/**
 * A hue-family ramp that is a ramp *by construction*: every member is generated
 * from one teal by the shade axis itself, which is precisely the family the model
 * claims to capture. The base sits third of five by lightness, so an entry chosen
 * as "the lightest member" would be a different colour.
 */
const RAMP_BASE = '#2e86a3'
const RAMP = [-0.4, -0.2, 0, 0.2, 0.4].map((s) => shadeHex(RAMP_BASE, s))

/**
 * Two teals a whisker off the shade axis of `RAMP_BASE`: near enough to be fitted
 * as shades of it, far enough that the fit is not byte-exact. This is the fixture
 * that makes "accepted drift" observable at all — the two stored sites happen to
 * fit every one of their colours exactly.
 */
const DRIFTERS = ['#5aa3bb', '#7baabf']

// ── AC-939 — the census measures, orders, annotates, and writes nothing ──────

describe('AC-939 censusing a site reports its colours and changes nothing', () => {
  it('test_UAT_AC939_census_reports_literals_counts_alpha_families_and_writes_nothing', () => {
    // A site whose colours are known: `xgd` carries an RGB used at three
    // opacities (#2e86a3 at full, 0.65 and 0.33), which is the alpha family the
    // census must surface. `harbor-cafe` carries no colour literals at all.
    const colourful = seedSandbox('xgd', 'shade939-colourful')
    const bare = seedSandbox('harbor-cafe', 'shade939-bare')
    const beforeColourful = hashTree(colourful)
    const beforeBare = hashTree(bare)

    const report = cli(['colors', 'shade939-colourful', '--sandbox'])
    expect(report.status, report.stderr).toBe(0)
    const lines = report.stdout.trimEnd().split('\n')

    // The header carries both counts, and ignoring alpha never distinguishes
    // MORE than the literals do — here it strictly collapses.
    const header = lines[0].match(
      /^shade939-colourful: (\d+) distinct colour\(s\), (\d+) distinct RGB ignoring alpha$/,
    )
    expect(header, lines[0]).not.toBeNull()
    const literalCount = Number(header?.[1])
    const rgbCount = Number(header?.[2])
    expect(literalCount).toBeGreaterThan(0)
    expect(rgbCount).toBeLessThanOrEqual(literalCount)
    expect(rgbCount).toBeLessThan(literalCount)

    // One line per distinct literal — as many as the header claims.
    const entryLines = lines
      .slice(1)
      .filter((l) => /^ {2}#/.test(l))
      .map((l) => {
        const m = l.match(/^ {2}(#[0-9a-f]{6,8})(?: \(α (\d\.\d\d)\))? {2}×(\d+)$/)
        expect(m, l).not.toBeNull()
        return { literal: m?.[1] as string, alpha: m?.[2], count: Number(m?.[3]) }
      })
    expect(entryLines).toHaveLength(literalCount)

    // Ordered most-used first.
    const counts = entryLines.map((e) => e.count)
    expect(counts).toEqual([...counts].sort((a, b) => b - a))

    // Opacity is annotated only where the literal is not fully opaque.
    expect(entryLines.find((e) => e.literal === '#2e86a3a6')?.alpha).toBe('0.65')
    expect(entryLines.find((e) => e.literal === '#2e86a355')?.alpha).toBe('0.33')
    expect(entryLines.find((e) => e.literal === '#2e86a3')?.alpha).toBeUndefined()

    // The alpha-families section names the RGB and every opacity it is used at.
    expect(report.stdout).toContain('alpha families')
    expect(report.stdout).toContain('#2e86a3 at α 1.00, 0.65, 0.33')

    // A site with no colour literals censuses successfully at zero, and prints
    // no alpha-families section because it has no family to report.
    const empty = cli(['colors', 'shade939-bare', '--sandbox'])
    expect(empty.status, empty.stderr).toBe(0)
    expect(empty.stdout.trim()).toBe('shade939-bare: 0 distinct colour(s), 0 distinct RGB ignoring alpha')
    expect(empty.stdout).not.toContain('alpha families')

    // Read-only: every file under both sites is byte-identical afterwards.
    expect(hashTree(colourful)).toEqual(beforeColourful)
    expect(hashTree(bare)).toEqual(beforeBare)
  }, 120_000)
})

// ── AC-940 — the census as one machine-readable document ─────────────────────

describe('AC-940 the census is a single JSON document for scripting', () => {
  it('test_UAT_AC940_census_json_is_one_parseable_document_agreeing_with_the_human_form', () => {
    seedSandbox('xgd', 'shade940-site')

    const machine = cli(['colors', 'shade940-site', '--sandbox', '--json'])
    expect(machine.status, machine.stderr).toBe(0)

    // Exactly one JSON value on stdout and nothing else: the whole stream parses
    // with a standard parser, no pre-processing, no trailing prose.
    expect(machine.stdout.trim().startsWith('{')).toBe(true)
    expect(machine.stdout.trim().endsWith('}')).toBe(true)
    const doc = JSON.parse(machine.stdout) as {
      slug: string
      colors: { literal: string; rgb: string; alpha: number; count: number }[]
      distinctRgb: number
      alphaFamilies: { rgb: string; alphas: number[] }[]
    }

    expect(doc.slug).toBe('shade940-site')

    // One record per distinct literal, each fully specified.
    expect(Array.isArray(doc.colors)).toBe(true)
    expect(doc.colors.length).toBeGreaterThan(0)
    for (const c of doc.colors) {
      // The literal as authored, normalised to lower case …
      expect(typeof c.literal).toBe('string')
      expect(c.literal).toMatch(HEX)
      expect(c.literal).toBe(c.literal.toLowerCase())
      // … its opaque RGB …
      expect(c.rgb).toMatch(/^#[0-9a-f]{6}$/)
      expect(c.literal.startsWith(c.rgb)).toBe(true)
      // … its alpha as a 0–255 byte …
      expect(Number.isInteger(c.alpha)).toBe(true)
      expect(c.alpha).toBeGreaterThanOrEqual(0)
      expect(c.alpha).toBeLessThanOrEqual(255)
      // … and its use count.
      expect(Number.isInteger(c.count)).toBe(true)
      expect(c.count).toBeGreaterThan(0)
    }

    // The distinct-RGB count ignoring alpha.
    expect(Number.isInteger(doc.distinctRgb)).toBe(true)
    expect(doc.distinctRgb).toBe(new Set(doc.colors.map((c) => c.rgb)).size)

    // The alpha families: an RGB and the opacities it is used at.
    expect(Array.isArray(doc.alphaFamilies)).toBe(true)
    expect(doc.alphaFamilies.length).toBeGreaterThan(0)
    for (const f of doc.alphaFamilies) {
      expect(f.rgb).toMatch(/^#[0-9a-f]{6}$/)
      expect(Array.isArray(f.alphas)).toBe(true)
      expect(f.alphas.length).toBeGreaterThan(1)
      for (const a of f.alphas) expect(Number.isInteger(a)).toBe(true)
    }
    expect(doc.alphaFamilies.find((f) => f.rgb === '#2e86a3')?.alphas).toEqual([255, 166, 85])

    // Its numbers agree with the human-readable census of the same site.
    const human = cli(['colors', 'shade940-site', '--sandbox'])
    expect(human.status, human.stderr).toBe(0)
    expect(human.stdout.split('\n')[0]).toBe(
      `shade940-site: ${doc.colors.length} distinct colour(s), ${doc.distinctRgb} distinct RGB ignoring alpha`,
    )
  }, 120_000)
})

// ── AC-941 — the retrofit writes the palette and reports what it did ─────────

describe('AC-941 the retrofit writes a palette and reports the conversion', () => {
  it('test_UAT_AC941_assign_writes_palette_rewrites_pages_and_reports_entries_drift_and_files', () => {
    const siteDir = seedSandbox('xgd', 'shade941-site')
    const draft = draftOf(siteDir)
    const before = hashTree(draft)

    // Census first, so the "materially smaller" claim is measured rather than
    // assumed from a number baked into the test.
    const census = cli(['colors', 'shade941-site', '--sandbox', '--json'])
    expect(census.status, census.stderr).toBe(0)
    const literalCount = (JSON.parse(census.stdout) as { colors: unknown[] }).colors.length

    const run = cli(['colors', 'shade941-site', '--assign', '--sandbox'])
    expect(run.status, run.stderr).toBe(0)

    // The report opens with the before/after counts …
    const header = run.stdout
      .split('\n')[0]
      .match(/^shade941-site: (\d+) colour literal\(s\) → (\d+) palette entr(?:y|ies)$/)
    expect(header, run.stdout).not.toBeNull()
    expect(Number(header?.[1])).toBe(literalCount)
    const entryCount = Number(header?.[2])
    // A palette, not a colour list.
    expect(entryCount).toBeLessThan(literalCount / 2)

    // … the palette it wrote onto the site, with that many entries …
    const palette = paletteOf(siteDir) as L1Palette
    expect(palette).toBeDefined()
    expect(Object.keys(palette)).toHaveLength(entryCount)

    // … each entry by name with its SINGLE value. An entry is one colour: the
    // named steps REQ-137 deleted are neither stored nor reported.
    for (const [name, entry] of Object.entries(palette)) {
      expect(Object.keys(entry), name).toEqual(['value'])
      expect(run.stdout).toContain(`  ${name}: ${entry.value}\n`)
    }
    expect(run.stdout).not.toMatch(/step/i)

    // … every colour a fitted shade does not reproduce exactly. `xgd` fits all of
    // its colours exactly, so the honest report here is no drift section at all.
    expect(run.stdout).not.toMatch(/re-expressed as a shade/)

    // … and the files it wrote: every rewritten page plus the site definition,
    // each named in the report, not merely counted.
    const pages = pageFiles(siteDir)
    expect(run.stdout).toContain(`wrote ${pages.length + 1} file(s):`)
    const reported = run.stdout
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line === 'site.json' || line.startsWith('pages/'))
    expect(reported.slice().sort(), run.stdout).toEqual(
      ['site.json', ...pages.map((p) => `pages/${path.basename(p)}`)].sort(),
    )

    // No colour literal is left behind in any page.
    for (const file of pages) {
      expect(collectColorLiterals(readJsonFile(file)), file).toEqual([])
      expect(collectRefs(readJsonFile(file)).length, file).toBeGreaterThan(0)
    }

    // Every file named in the report differs from its pre-retrofit content, and
    // no other file under the site was touched.
    const after = hashTree(draft)
    expect(Object.keys(after).sort()).toEqual(Object.keys(before).sort())
    const changed = Object.keys(after).filter((rel) => after[rel] !== before[rel])
    expect(changed.sort()).toEqual(reported.slice().sort())
    expect(changed).toHaveLength(pages.length + 1)

    // The palette is also obtainable as a single machine-readable document, and
    // it is the palette stored on the site.
    const machine = cli(['colors', 'shade941-site', '--assign', '--sandbox', '--json'])
    expect(machine.status, machine.stderr).toBe(0)
    expect(JSON.parse(machine.stdout)).toEqual(palette)
  }, 180_000)
})

// ── AC-942 — one RGB at N opacities is one entry ─────────────────────────────

describe('AC-942 an alpha family collapses to one entry with opacity on the reference', () => {
  it('test_UAT_AC942_one_rgb_at_three_opacities_becomes_one_entry_carrying_opacity_on_each_reference', () => {
    const cwd = freshCwd()
    const siteDir = seedTemp(cwd, 'xgd', 'alpha')

    // The census names the family: one RGB used at three opacities.
    const census = cmdColors('alpha', { cwd })
    const family = census.alphaFamilies.find((f) => f.alphas.length === 3)
    expect(family, JSON.stringify(census.alphaFamilies)).toBeDefined()
    const rgb = family?.rgb as string
    const literals = (family?.alphas ?? []).map((a) =>
      a === 255 ? rgb : `${rgb}${a.toString(16).padStart(2, '0')}`,
    )
    expect(literals).toHaveLength(3)
    for (const literal of literals) {
      expect(census.colors.some((c) => c.literal === literal), literal).toBe(true)
    }

    cmdColorsAssign('alpha', { cwd })
    const palette = paletteOf(siteDir) as L1Palette
    expect(palette).toBeDefined()

    // Exactly ONE palette entry carries that RGB — a conceptual colour occupies
    // one entry regardless of how many opacities it is used at.
    const carriers = Object.entries(palette).filter(([, entry]) => entry.value === rgb)
    expect(carriers, JSON.stringify(palette)).toHaveLength(1)
    const [entryName] = carriers[0]

    // No palette entry carries an opacity of its own: every stored value is an
    // opaque `#rrggbb`, because alpha is a reference axis, not an entry axis.
    for (const entry of Object.values(palette)) expect(entry.value).toMatch(/^#[0-9a-f]{6}$/)

    // Each of the site's uses became a reference to that ONE entry carrying its
    // own opacity, and every one resolves back to the translucent literal that
    // was authored, byte for byte.
    const namesByLiteral = new Map<string, Set<string>>()
    for (const page of pagesOf(siteDir)) {
      for (const ref of collectRefs(page)) {
        const resolved = resolveL1Color(ref, palette)
        const set = namesByLiteral.get(resolved) ?? new Set<string>()
        set.add(ref.ref)
        namesByLiteral.set(resolved, set)
      }
    }
    for (const literal of literals) {
      expect([...(namesByLiteral.get(literal) ?? [])], literal).toEqual([entryName])
    }

    // The opacities that ride the references are exactly the three authored ones.
    const alphas = new Set(
      pagesOf(siteDir)
        .flatMap((p) => collectRefs(p))
        .filter((r) => r.ref === entryName)
        .map((r) => Math.round((r.alpha ?? 1) * 255)),
    )
    expect([...alphas].sort((a, b) => b - a)).toEqual(family?.alphas)
  }, 120_000)
})

// ── AC-943 — one entry plus a shade, based on the member that reaches most ───

describe('AC-943 a hue family is one entry plus a shade, with unreachable and mis-classifying fits refused', () => {
  it('test_UAT_AC943_families_collapse_onto_the_most_reaching_member_and_refused_fits_stand_alone', () => {
    const cwd = freshCwd()

    // (a) A ramp generated from one teal by the shade axis itself, alongside an
    //     isolated vermilion that clusters with nothing.
    const ISOLATE = '#d94f2b'
    const rampSite = paintedSite(cwd, 'ramp', [...RAMP, ISOLATE])
    cmdColorsAssign('ramp', { cwd })
    const rampPalette = paletteOf(rampSite) as L1Palette
    const rampRefs = pagesOf(rampSite).flatMap((p) => collectRefs(p))

    // The family is ONE entry whose value is the member that reaches the most
    // others — the mid-lightness base, NOT the lightest member. A shade only
    // removes chroma, so the pale end reaches nothing.
    const rampEntry = Object.entries(rampPalette).find(([, e]) => e.value === RAMP_BASE)
    expect(rampEntry, JSON.stringify(rampPalette)).toBeDefined()
    const rampName = rampEntry?.[0] as string
    const lightest = RAMP[RAMP.length - 1]
    expect(rampPalette[rampName].value).not.toBe(lightest)
    expect(Object.values(rampPalette).some((e) => e.value === lightest)).toBe(false)

    // No entry carries named steps — an entry holds one colour and nothing else.
    for (const [name, entry] of Object.entries(rampPalette)) expect(Object.keys(entry), name).toEqual(['value'])

    // Every other member of the family is carried as a shade on the references
    // that used it, and the base itself carries none.
    for (const member of RAMP) {
      const refs = rampRefs.filter((r) => resolveL1Color(r, rampPalette) === member)
      expect(refs.length, member).toBeGreaterThan(0)
      for (const ref of refs) {
        expect(ref.ref, member).toBe(rampName)
        if (member === RAMP_BASE) expect(ref.shade, member).toBeUndefined()
        else expect(typeof ref.shade, member).toBe('number')
      }
    }

    // The isolated colour keeps its OWN entry rather than being forced into the
    // nearest family, and its references carry no shade.
    const isolateEntry = Object.entries(rampPalette).find(([, e]) => e.value === ISOLATE)
    expect(isolateEntry, JSON.stringify(rampPalette)).toBeDefined()
    expect(isolateEntry?.[0]).not.toBe(rampName)
    for (const ref of rampRefs.filter((r) => r.ref === isolateEntry?.[0])) {
      expect(ref.shade).toBeUndefined()
    }

    // (b) A fit that lands INSIDE the bound but would paint a colour the grouping
    //     files differently is refused, and the colour gets its own entry. Both
    //     colours are muted slates; the fit is Δ3, well within 8/255 — so the
    //     refusal is the classification test, not the distance test.
    const MISFIT_BASE = '#314158'
    const MISFIT = '#f1f5f9'
    const misfit = fitShade(MISFIT_BASE, MISFIT)
    expect(misfit.delta).toBeLessThanOrEqual(SHADE_FIT_TOLERANCE)
    expect(toHcl(MISFIT).c).toBeGreaterThanOrEqual(6) // a tinted near-grey …
    expect(toHcl(misfit.resolved).c).toBeLessThan(6) //  … painted as a true grey
    const misfitSite = paintedSite(cwd, 'misfit', [MISFIT_BASE, MISFIT])
    cmdColorsAssign('misfit', { cwd })
    const misfitPalette = paletteOf(misfitSite) as L1Palette
    expect(Object.values(misfitPalette).map((e) => e.value).sort()).toEqual([MISFIT, MISFIT_BASE].sort())
    for (const ref of pagesOf(misfitSite).flatMap((p) => collectRefs(p))) expect(ref.shade).toBeUndefined()

    // (c) A vivid brand blue and a near-grey only 11° away in hue are two roles,
    //     not one ramp.
    const splitSite = paintedSite(cwd, 'split', ['#1447e6', '#e2e8f0'])
    cmdColorsAssign('split', { cwd })
    const splitPalette = paletteOf(splitSite) as L1Palette
    expect(Math.abs(toHcl('#1447e6').h - toHcl('#e2e8f0').h)).toBeLessThan(15)
    expect(Object.values(splitPalette).map((e) => e.value).sort()).toEqual(['#1447e6', '#e2e8f0'])

    // (d) True greys, black and white group as one neutral entry — including
    //     near-white and near-black values a few units off the extreme, whose hue
    //     arithmetic reports 0° and 270° respectively.
    const NEUTRALS = ['#ffffff', '#fffefe', '#010002', '#000000']
    const neutralSite = paintedSite(cwd, 'neutrals', NEUTRALS)
    cmdColorsAssign('neutrals', { cwd })
    const neutralPalette = paletteOf(neutralSite) as L1Palette
    expect(Object.keys(neutralPalette)).toEqual(['neutral'])
    for (const ref of pagesOf(neutralSite).flatMap((p) => collectRefs(p))) expect(ref.ref).toBe('neutral')

    // (e) Determinism: the same colours derive the same palette — same entry
    //     names, same shade on every reference — on a second, independent run.
    const rerunSite = paintedSite(cwd, 'rerun', [...RAMP, ISOLATE])
    cmdColorsAssign('rerun', { cwd })
    expect(paletteOf(rerunSite)).toEqual(rampPalette)
    expect(pagesOf(rerunSite).flatMap((p) => collectRefs(p))).toEqual(rampRefs)
  }, 180_000)
})

// ── AC-944 — the measured 8/255 bound, and the drift that is reported ────────

describe('AC-944 a completed retrofit moves no colour outside 8/255 and reports what it moved', () => {
  it('test_UAT_AC944_unshaded_references_are_exact_shaded_stay_within_the_bound_and_drift_is_reported', () => {
    const cwd = freshCwd()
    const siteDir = seedTemp(cwd, 'xgd', 'bounded')

    // The colours the site painted before the conversion, in document order.
    const before = paintedPages(siteDir)
    const slotsBefore = before.flatMap((p) => collectColorLiterals(p))
    expect(slotsBefore.length).toBeGreaterThan(0)

    const result = cmdColorsAssign('bounded', { cwd })
    const palette = paletteOf(siteDir) as L1Palette
    const converted = pagesOf(siteDir)

    // Every reference, paired with the literal that occupied its own position.
    const pairs = before.flatMap((page, i) => pairLiteralsWithRefs(page, converted[i]))
    expect(pairs.length).toBe(slotsBefore.length)

    const inexact = new Map<string, number>()
    for (const { literal, ref } of pairs) {
      const was = splitColor(literal)
      const now = splitColor(resolveL1Color(ref, palette))
      expect(was, literal).not.toBeNull()
      expect(now, literal).not.toBeNull()
      // Opacity rides the reference untouched — byte-identity in every case, so
      // any difference there is a defect rather than an accepted approximation.
      expect(now?.alpha, literal).toBe(was?.alpha)
      const delta = maxChannelDelta(now?.rgb as string, was?.rgb as string)
      if (ref.shade === undefined || ref.shade === 0) {
        // No shade — byte-exact, not merely close.
        expect(delta, `${literal} → ${JSON.stringify(ref)}`).toBe(0)
      } else {
        expect(delta, `${literal} → ${JSON.stringify(ref)}`).toBeLessThanOrEqual(SHADE_FIT_TOLERANCE)
      }
      if (delta > 0) inexact.set(was?.rgb as string, Math.max(inexact.get(was?.rgb as string) ?? 0, delta))
    }

    // The number of painted colour slots is unchanged: nothing was added or lost.
    const slotsAfter = converted.flatMap((p) => collectColorLiterals(resolveL1Palette(p, palette)))
    expect(slotsAfter).toHaveLength(slotsBefore.length)

    // The report lists exactly the colours whose resolution is not exact. `xgd`
    // fits every one of its colours exactly, so the honest report is none.
    expect(new Map(result.drift.map((d) => [d.rgb, d.delta]))).toEqual(inexact)

    // A fixture that DOES drift, so "worst first" and "within the bound" are
    // observations rather than vacuous truths about an empty list.
    const driftSite = paintedSite(cwd, 'drifting', [RAMP_BASE, ...DRIFTERS, '#ffffff'])
    const drifted = cmdColorsAssign('drifting', { cwd })
    const driftPalette = paletteOf(driftSite) as L1Palette
    expect(drifted.drift.length).toBeGreaterThan(1)
    expect(drifted.drift.map((d) => d.delta)).toEqual([...drifted.drift.map((d) => d.delta)].sort((a, b) => b - a))
    for (const d of drifted.drift) {
      expect(d.delta).toBeGreaterThan(0)
      expect(d.delta).toBeLessThanOrEqual(SHADE_FIT_TOLERANCE)
      expect(resolveL1Color({ ref: d.ref, shade: d.shade }, driftPalette)).toBe(d.resolved)
    }
    // …and the colours that ARE exact — the two entry values — are not listed:
    // the report is the drift that was accepted, not a tally of every colour.
    const driftedRgbs = new Set(drifted.drift.map((d) => d.rgb))
    for (const rgb of [RAMP_BASE, '#ffffff']) expect(driftedRgbs.has(rgb)).toBe(false)

    // Drive the conversion with colours the shade axis cannot reproduce within
    // the bound — collapsing two distinct families onto one name destroys one of
    // them — and assert nothing is written.
    const guardDir = seedSandbox('xgd', 'shade944-guard')
    const guardBefore = hashTree(guardDir)
    const guard = cli([
      'colors',
      'shade944-guard',
      '--assign',
      '--sandbox',
      '--names',
      'slate=shared,teal=shared',
    ])
    expect(guard.status).not.toBe(0)
    expect(guard.stderr).toMatch(/exceeds the shade bound/i)
    expect(hashTree(guardDir)).toEqual(guardBefore)
  }, 180_000)
})

// ── AC-945 — a retrofit that cannot be proved lossless writes nothing ────────

describe('AC-945 an unprovable retrofit fails and leaves every file untouched', () => {
  it('test_UAT_AC945_unprovable_retrofit_exits_nonzero_diagnoses_and_writes_nothing', () => {
    // (a) No stored draft definition to convert.
    sandboxSlugs.push('shade945-missing')
    const missingDir = path.join(SANDBOX, 'shade945-missing')
    rmSync(missingDir, { recursive: true, force: true })
    const missing = cli(['colors', 'shade945-missing', '--assign', '--sandbox'])
    expect(missing.status).not.toBe(0)
    expect(missing.stderr).toContain('shade945-missing')
    expect(missing.stderr).toMatch(/no draft/i)
    // Nothing was created on the way to failing.
    expect(existsSync(missingDir)).toBe(false)

    // (b) A derived reference that would not reproduce the literal it replaces
    //     within the bound.
    const collideDir = seedSandbox('xgd', 'shade945-collide')
    const beforeCollide = hashTree(collideDir)
    const collide = cli([
      'colors',
      'shade945-collide',
      '--assign',
      '--sandbox',
      '--names',
      'slate=shared,teal=shared',
    ])
    expect(collide.status).not.toBe(0)
    // The diagnostic identifies the cause, names the colours that failed to
    // reproduce, and states the bound a shaded reference had to meet.
    //
    // The bound is carried on the CommandError's `hint` ("a fitted shade must
    // land within 8/255"), which the `1c` launcher drops: it catches whatever
    // escapes `run()` and prints only `err.message`, so `toHuman()` — the
    // rendering that appends the hint — never runs for this path. The AC
    // requires the bound on standard error, so this asserts the AC rather than
    // the current behaviour.
    expect(collide.stderr).toMatch(/exceeds the shade bound/i)
    expect(collide.stderr).toMatch(/#[0-9a-f]{6}/)
    expect(collide.stderr).toContain(`${SHADE_FIT_TOLERANCE}/255`)
    // Every file is byte-identical: no page rewritten, no palette written, and
    // no partial write in which one page moved and another did not.
    expect(hashTree(collideDir)).toEqual(beforeCollide)

    // (c) A conversion whose result would not satisfy the site-definition
    //     contract — an entry name outside the definition's naming rules.
    const invalidDir = seedSandbox('xgd', 'shade945-invalid')
    const beforeInvalid = hashTree(invalidDir)
    const invalid = cli(['colors', 'shade945-invalid', '--assign', '--sandbox', '--names', 'neutral=NotKebab'])
    expect(invalid.status).not.toBe(0)
    // The diagnostic identifies the cause and names the validation problems.
    expect(invalid.stderr).toMatch(/invalid definition/i)
    expect(invalid.stderr).toContain('/palette/NotKebab')
    expect(hashTree(invalidDir)).toEqual(beforeInvalid)
  }, 180_000)
})

// ── AC-946 — descriptive names, promotable to role vocabulary ────────────────

describe('AC-946 derived names describe the colour and rename from the command line', () => {
  it('test_UAT_AC946_derived_names_describe_colours_and_rename_to_role_vocabulary', () => {
    // Names the derivation may produce: what a family IS, never a role it may
    // not play. A second family that would derive the same name is suffixed.
    const DESCRIPTIVE = new Set([
      'neutral',
      'slate',
      'sand',
      'moss',
      'mauve',
      'red',
      'orange',
      'amber',
      'lime',
      'green',
      'teal',
      'blue',
      'indigo',
      'violet',
      'pink',
    ])

    const derivedDir = seedSandbox('xgd', 'shade946-derived')
    const derivedRun = cli(['colors', 'shade946-derived', '--assign', '--sandbox', '--json'])
    expect(derivedRun.status, derivedRun.stderr).toBe(0)
    const derived = JSON.parse(derivedRun.stdout) as L1Palette
    const names = Object.keys(derived)
    expect(names.length).toBeGreaterThan(1)

    for (const name of names) {
      // Satisfies the definition's entry-naming rules (kebab-case) …
      expect(name, name).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
      // … and describes the colour rather than naming a role.
      expect(DESCRIPTIVE.has(name.replace(/-\d+$/, '')), name).toBe(true)
    }
    // Every entry name is unique, including the families formed in a later
    // grouping round that derived a name an earlier one had already taken.
    expect(new Set(names).size).toBe(names.length)
    expect(names.some((n) => /-\d+$/.test(n))).toBe(true)

    // Supplying a mapping renames those entries in the written palette …
    const renamedDir = seedSandbox('xgd', 'shade946-renamed')
    const renamedRun = cli([
      'colors',
      'shade946-renamed',
      '--assign',
      '--sandbox',
      '--json',
      '--names',
      'slate=text,teal=primary',
    ])
    expect(renamedRun.status, renamedRun.stderr).toBe(0)
    const renamed = JSON.parse(renamedRun.stdout) as L1Palette
    expect(Object.keys(renamed)).toContain('text')
    expect(Object.keys(renamed)).toContain('primary')
    expect(Object.keys(renamed)).not.toContain('slate')
    expect(Object.keys(renamed)).not.toContain('teal')

    // … changing names ONLY: the value under each renamed entry, and every other
    // entry, are exactly what the un-renamed run produced.
    expect(renamed.text).toEqual(derived.slate)
    expect(renamed.primary).toEqual(derived.teal)
    const rest = (p: L1Palette, drop: string[]): Record<string, unknown> =>
      Object.fromEntries(Object.entries(p).filter(([k]) => !drop.includes(k)))
    expect(rest(renamed, ['text', 'primary'])).toEqual(rest(derived, ['slate', 'teal']))

    // … and the shade on every reference into a renamed entry is unchanged: the
    // two converted definitions differ by entry name and nothing else.
    const back: Record<string, string> = { text: 'slate', primary: 'teal' }
    const renamedRefs = pagesOf(renamedDir).flatMap((p) => collectRefs(p))
    const derivedRefs = pagesOf(derivedDir).flatMap((p) => collectRefs(p))
    expect(renamedRefs).toHaveLength(derivedRefs.length)
    expect(renamedRefs.map((r) => ({ ...r, ref: back[r.ref] ?? r.ref }))).toEqual(derivedRefs)

    // … so resolving both converted definitions yields the same colours.
    const painted = (dir: string): string[] =>
      paintedPages(dir).flatMap((p) => collectColorLiterals(p))
    expect(painted(renamedDir)).toEqual(painted(derivedDir))

    // A supplied mapping naming a family the derivation did not produce leaves
    // the palette otherwise intact.
    seedSandbox('xgd', 'shade946-unknown')
    const unknownRun = cli([
      'colors',
      'shade946-unknown',
      '--assign',
      '--sandbox',
      '--json',
      '--names',
      'nosuchfamily=whatever',
    ])
    expect(unknownRun.status, unknownRun.stderr).toBe(0)
    expect(JSON.parse(unknownRun.stdout)).toEqual(derived)

    // One command line reproduces the whole of `xgd`'s curated role vocabulary —
    // including the second teal, which exists because the site's brighter teal is
    // both lighter AND more saturated than its brand teal.
    seedSandbox('xgd', 'shade946-roles')
    const roleRun = cli([
      'colors',
      'shade946-roles',
      '--assign',
      '--sandbox',
      '--json',
      '--names',
      'slate=text,teal=primary,orange=accent,sand=surface,slate-2=surface-accent,teal-2=primary-bright',
    ])
    expect(roleRun.status, roleRun.stderr).toBe(0)
    const roles = JSON.parse(roleRun.stdout) as L1Palette
    expect(Object.keys(roles).sort()).toEqual(
      ['accent', 'neutral', 'primary', 'primary-bright', 'surface', 'surface-accent', 'text'].sort(),
    )
    expect(roles['primary-bright'].value).toEqual(derived['teal-2'].value)
    expect(chroma(roles['primary-bright'].value)).toBeGreaterThan(chroma(roles.primary.value))
  }, 300_000)
})

// ── AC-947 — a separate, re-runnable pass, and a byte-identical fixpoint ─────

describe('AC-947 assignment is a separate pass and a second run is a byte-identical fixpoint', () => {
  it('test_UAT_AC947_reproduced_sites_carry_literals_and_re_assignment_is_a_byte_identical_fixpoint', () => {
    const cwd = freshCwd()

    // A site produced by reproducing a captured reference carries its colours as
    // literals and NO palette — assignment is a pass an author runs, never
    // something a site arrives with.
    const ref = capturedBundle(cwd, ['#fffef8', '#1f2937', '#2e86a3', '#2e86a3a6', '#2e86a355', '#4aafc9'])
    cmdRepro('reproduced', { cwd, ref })
    const siteDir = path.join(cwd, 'storage', 'sites', 'reproduced')
    expect(paletteOf(siteDir)).toBeUndefined()
    expect(pagesOf(siteDir).flatMap((p) => collectColorLiterals(p)).length).toBeGreaterThan(0)
    expect(pagesOf(siteDir).flatMap((p) => collectRefs(p))).toEqual([])

    // Censusing before the retrofit …
    const before = cmdColors('reproduced', { cwd })
    expect(before.colors.length).toBeGreaterThan(0)
    expect(before.alphaFamilies.length).toBeGreaterThan(0)

    cmdColorsAssign('reproduced', { cwd })
    expect(paletteOf(siteDir)).toBeDefined()
    expect(pagesOf(siteDir).flatMap((p) => collectColorLiterals(p))).toEqual([])

    // … and again afterwards: references are measured as the colours they
    // resolve to, not as a new kind of value, so the two censuses are the same
    // measurement — the same distinct literals, counts and alpha families.
    const after = cmdColors('reproduced', { cwd })
    expect(after.colors).toEqual(before.colors)
    expect(after.distinctRgb).toBe(before.distinctRgb)
    expect(after.alphaFamilies).toEqual(before.alphaFamilies)

    // Re-running the retrofit on an already-retrofitted STORED site is a
    // fixpoint: the site definition and every page are byte-identical to what
    // the previous run wrote — not merely equivalent. That is what makes adding
    // a page or renaming a family one command rather than a manual
    // un-assignment, and it is a consequence of the grouping refusing any fit
    // whose painted result would be classified into a different family.
    const stored = seedSandbox('xgd', 'shade947-fixpoint')
    const first = cli(['colors', 'shade947-fixpoint', '--assign', '--sandbox'])
    expect(first.status, first.stderr).toBe(0)
    const afterFirst = hashTree(draftOf(stored))
    const second = cli(['colors', 'shade947-fixpoint', '--assign', '--sandbox'])
    expect(second.status, second.stderr).toBe(0)
    expect(hashTree(draftOf(stored))).toEqual(afterFirst)
    expect(second.stdout).toBe(first.stdout)
  }, 180_000)
})

// ── AC-932 — a palette, not a colour list, with no colour lost ───────────────

describe('AC-932 the palette is materially smaller than the distinct colour count, with no colour lost', () => {
  it('test_UAT_AC932_palette_is_materially_smaller_carries_no_step_and_loses_no_colour', () => {
    const cwd = freshCwd()

    for (const [source, slug] of [
      ['xgd', 'small-xgd'],
      ['gigabytealchemy', 'small-gba'],
    ]) {
      const siteDir = seedTemp(cwd, source, slug)

      // The distinct colours the site used before the conversion, and the colours
      // it painted, in document order.
      const census = cmdColors(slug, { cwd })
      const before = paintedPages(siteDir)
      const slotsBefore = before.flatMap((p) => collectColorLiterals(p))
      expect(census.colors.length, slug).toBeGreaterThan(0)
      expect(slotsBefore.length, slug).toBeGreaterThan(0)

      const result = cmdColorsAssign(slug, { cwd })
      const palette = paletteOf(siteDir) as L1Palette

      // A palette rather than a colour list: alpha families collapse to one entry
      // and reachable ramps collapse to one entry plus a shade on each reference.
      expect(Object.keys(palette).length, slug).toBe(result.after)
      expect(Object.keys(palette).length, slug).toBeLessThanOrEqual(census.colors.length / 2)

      // No entry carries a step — the light↔dark family is generated, not stored.
      for (const [name, entry] of Object.entries(palette)) {
        expect(Object.keys(entry), `${slug}/${name}`).toEqual(['value'])
      }

      // Every colour the site painted before is still painted after — within the
      // bound the conversion is gated on — and no new colour appears: the number
      // of painted slots is unchanged and each one is accounted for in order.
      const slotsAfter = paintedPages(siteDir).flatMap((p) => collectColorLiterals(p))
      expect(slotsAfter, slug).toHaveLength(slotsBefore.length)
      slotsBefore.forEach((literal, i) => {
        const was = splitColor(literal)
        const now = splitColor(slotsAfter[i])
        expect(now?.alpha, `${slug}[${i}] ${literal}`).toBe(was?.alpha)
        expect(
          maxChannelDelta(now?.rgb as string, was?.rgb as string),
          `${slug}[${i}] ${literal} → ${slotsAfter[i]}`,
        ).toBeLessThanOrEqual(SHADE_FIT_TOLERANCE)
      })
    }

    // A site with no L1 colour axes carries no palette at all and still
    // satisfies the site-definition contract.
    const bareDir = seedTemp(cwd, 'harbor-cafe', 'small-bare')
    expect(cmdColors('small-bare', { cwd }).colors).toEqual([])
    expect(paletteOf(bareDir)).toBeUndefined()
    const bare = readJsonFile<Record<string, unknown>>(path.join(draftOf(bareDir), 'site.json'))
    const validated = validateSite({ ...bare, pages: pagesOf(bareDir) })
    expect(validated.ok ? [] : validated.errors).toEqual([])
    // Retrofitting it derives no entry, so there is still no colour to name.
    expect(Object.keys(cmdColorsAssign('small-bare', { cwd }).palette)).toEqual([])
  }, 180_000)
})

// ── AC-1146 — a colour the shade axis cannot reach earns its own exact entry ─

describe('AC-1146 a colour the shade axis cannot reach becomes its own exact entry', () => {
  it('test_UAT_AC1146_a_more_saturated_member_earns_its_own_byte_exact_entry_rather_than_a_shade', () => {
    const cwd = freshCwd()

    // A family whose second member is MORE saturated than every candidate base.
    // Mixing toward black or white drives chroma to zero and never raises it, so
    // no position on the axis reproduces it — it is not a shade of anything.
    const BASE = '#2e86a3'
    const BRIGHTER = '#4aafc9'
    expect(chroma(BRIGHTER)).toBeGreaterThan(chroma(BASE))
    expect(fitShade(BASE, BRIGHTER).delta).toBeGreaterThan(SHADE_FIT_TOLERANCE)

    const siteDir = paintedSite(cwd, 'unreached', [BASE, BRIGHTER])
    const result = cmdColorsAssign('unreached', { cwd })
    const palette = paletteOf(siteDir) as L1Palette

    // It resolves to its OWN entry rather than being approximated into a family
    // it does not belong to …
    const own = Object.entries(palette).find(([, e]) => e.value === BRIGHTER)
    expect(own, JSON.stringify(palette)).toBeDefined()
    expect(own?.[0]).not.toBe(Object.entries(palette).find(([, e]) => e.value === BASE)?.[0])

    // … its references carry no shade, and resolving one yields the original
    // literal byte for byte.
    const refs = pagesOf(siteDir).flatMap((p) => collectRefs(p)).filter((r) => r.ref === own?.[0])
    expect(refs.length).toBeGreaterThan(0)
    for (const ref of refs) {
      expect(ref.shade).toBeUndefined()
      expect(resolveL1Color(ref, palette)).toBe(BRIGHTER)
    }

    // It is not reported as accepted drift, because it was never approximated.
    expect(result.drift.map((d) => d.rgb)).not.toContain(BRIGHTER)

    // Over a retrofitted stored site: EVERY reference carrying no shade resolves
    // byte-exactly to the literal that occupied its position before the
    // conversion. Seven such colours split out this way across the stored sites,
    // and every one of them still resolves to exactly the colour it always was.
    const storedDir = seedTemp(cwd, 'gigabytealchemy', 'unreached-stored')
    const before = paintedPages(storedDir)
    cmdColorsAssign('unreached-stored', { cwd })
    const storedPalette = paletteOf(storedDir) as L1Palette
    const pairs = before.flatMap((page, i) => pairLiteralsWithRefs(page, pagesOf(storedDir)[i]))
    const unshaded = pairs.filter(({ ref }) => ref.shade === undefined || ref.shade === 0)
    expect(unshaded.length).toBeGreaterThan(0)
    for (const { literal, ref } of unshaded) {
      expect(resolveL1Color(ref, storedPalette), `${literal} → ${JSON.stringify(ref)}`).toBe(literal)
    }
  }, 180_000)
})

// ── AC-1147 — the fit is searched over the model's own shade function ────────

describe('AC-1147 the retrofit fits over the same shade function the definition resolves through', () => {
  it('test_UAT_AC1147_reported_drift_is_reproduced_exactly_by_the_palette_models_own_resolution', () => {
    const cwd = freshCwd()

    // A site whose colours sit a whisker off the shade axis of one teal, so the
    // retrofit genuinely has drift to report.
    const siteDir = paintedSite(cwd, 'insync', [RAMP_BASE, ...DRIFTERS, '#ffffff'])
    const result = cmdColorsAssign('insync', { cwd })
    const palette = paletteOf(siteDir) as L1Palette
    expect(result.drift.length).toBeGreaterThan(0)

    // For every colour the command reports as re-expressed as a shade: resolving
    // that entry-and-shade pair through the palette model's OWN resolution path —
    // the path any consumer of the site definition takes — yields exactly the
    // colour the report said it would, and exactly the reported distance from the
    // literal it replaced.
    for (const d of result.drift) {
      expect(palette[d.ref], d.ref).toBeDefined()
      expect(resolveL1Color({ ref: d.ref, shade: d.shade }, palette), d.rgb).toBe(d.resolved)
      expect(maxChannelDelta(d.resolved, d.rgb), d.rgb).toBe(d.delta)
      // And the shade axis itself is the one the renderer publishes, not a
      // second copy of the colour arithmetic living in the retrofit.
      expect(shadeHex(palette[d.ref].value, d.shade), d.rgb).toBe(d.resolved)
    }

    // The same equality holds for EVERY shaded reference in the converted
    // definition, not only the ones that drifted — here, and over a retrofitted
    // stored site whose references all fit exactly.
    const storedDir = seedTemp(cwd, 'xgd', 'insync-stored')
    cmdColorsAssign('insync-stored', { cwd })
    const storedPalette = paletteOf(storedDir) as L1Palette

    let shadedSeen = 0
    for (const [dir, pal] of [
      [siteDir, palette],
      [storedDir, storedPalette],
    ] as [string, L1Palette][]) {
      for (const ref of pagesOf(dir).flatMap((p) => collectRefs(p))) {
        if (ref.shade === undefined || ref.shade === 0) continue
        shadedSeen += 1
        const resolved = resolveL1Color({ ref: ref.ref, shade: ref.shade }, pal)
        expect(resolved, JSON.stringify(ref)).toBe(shadeHex(pal[ref.ref].value, ref.shade))
        // A fitted shade never leaves the bound the retrofit is gated on.
        expect(fitShade(pal[ref.ref].value, resolved).delta, JSON.stringify(ref)).toBeLessThanOrEqual(
          SHADE_FIT_TOLERANCE,
        )
      }
    }
    expect(shadedSeen).toBeGreaterThan(0)

    // The sandbox surface agrees with the handler: the same drift, reported on
    // stdout by the shipped launcher, names the same colours and distances.
    paintedSandboxSite('shade1147-drift', [RAMP_BASE, ...DRIFTERS, '#ffffff'])
    const run = cli(['colors', 'shade1147-drift', '--assign', '--sandbox'])
    expect(run.status, run.stderr).toBe(0)
    for (const d of result.drift) {
      expect(run.stdout).toContain(
        `${d.rgb} → ${d.ref} @ shade ${d.shade >= 0 ? '+' : ''}${d.shade} = ${d.resolved}  (Δ${d.delta})`,
      )
    }
  }, 180_000)
})
