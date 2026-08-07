/**
 * Reconciliation UATs for story-5e7eb0c5 — "Colour census and repeatable palette
 * retrofit: measure a site's colours, then migrate it onto a palette without
 * moving a pixel".
 *
 * The palette *model* (STORY-80) makes a reference an admissible form for any
 * colour axis. This story is the trip an already-authored site takes to reach
 * it: measure what is there (`1c colors <slug>`), then convert it (`--assign`)
 * under two proofs — every derived reference reproduces the literal it replaces
 * byte-for-byte, and the converted definition still validates. Either failing
 * aborts before anything touches disk.
 *
 *   AC-939  the census reports distinct literals with counts, distinct RGB
 *           ignoring alpha, and the alpha families — and writes nothing.
 *   AC-940  the census is a single machine-readable JSON document.
 *   AC-941  the retrofit writes a palette, rewrites every literal as a
 *           reference, and reports the before/after counts and files written.
 *   AC-942  one RGB at several opacities is ONE entry; opacity rides on the
 *           reference.
 *   AC-943  a lightness ramp is one entry with steps; a vivid colour and a
 *           near-neutral sharing its hue stay apart; an unclustered colour keeps
 *           its own entry; greys/black/white share one neutral entry.
 *   AC-944  a completed retrofit moves no pixel — the render is byte-identical.
 *   AC-945  a retrofit that cannot be proved lossless writes nothing.
 *   AC-946  derived names describe the colour and can be promoted to role
 *           vocabulary from the command line.
 *   AC-947  assignment is a separate, re-runnable pass.
 *
 * Boundary. The ACs that speak about stdout, stderr, exit status or the command
 * line are driven through the shipped `1c` launcher as a subprocess — that is
 * the surface they describe. The launcher roots its Astro/Vite server at the
 * repo and its compile cache is cwd-sensitive, so those runs are made from the
 * repo root against the `--sandbox` store (`storage/sandbox/`, gitignored
 * throwaway scratch) under slugs unique to each test, seeded by copying a real
 * site and removed afterwards. The ACs that speak about the derived palette, the
 * converted definition or the rendered bytes drive the same command handlers the
 * launcher dispatches, against isolated temp working directories.
 */
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, describe, expect, it } from 'vitest'
import type { L1Palette } from '../packages/site-schema/src/index'
import { resolveL1Color, resolveL1Palette } from '../packages/site-schema/src/l1/palette'
import { cmdNew, cmdRender } from '../tools/generate/src/cli/commands'
import { cmdColors, cmdColorsAssign, collectColorLiterals } from '../tools/generate/src/cli/colors'
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
  const cwd = mkdtempSync(path.join(tmpdir(), 'story5e7eb0c5-'))
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

/** Every palette reference (`{ ref, step?, alpha? }`) reachable from `input`. */
function collectRefs(input: unknown): { ref: string; step?: string; alpha?: number }[] {
  const out: { ref: string; step?: string; alpha?: number }[] = []
  const walk = (v: unknown): void => {
    if (Array.isArray(v)) return v.forEach(walk)
    if (typeof v !== 'object' || v === null) return
    const obj = v as Record<string, unknown>
    if (typeof obj.ref === 'string') out.push(obj as { ref: string; step?: string; alpha?: number })
    for (const item of Object.values(obj)) walk(item)
  }
  walk(input)
  return out
}

/** The entry name a colour landed in — searching base values then steps. */
function entryOf(palette: L1Palette, rgb: string): string | undefined {
  for (const [name, entry] of Object.entries(palette)) {
    if (entry.value === rgb) return name
    if (Object.values(entry.steps ?? {}).includes(rgb)) return name
  }
  return undefined
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

/** Create a site under `cwd` whose only page is painted with `colors`. */
function paintedSite(cwd: string, slug: string, colors: string[]): string {
  const { draftDir } = cmdNew(slug, { cwd })
  const homePath = path.join(draftDir, 'pages', 'home.json')
  const home = readJsonFile<Record<string, unknown>>(homePath)
  home.l1 = synthDoc(colors)
  writeFileSync(homePath, `${JSON.stringify(home, null, 2)}\n`)
  return path.join(cwd, 'storage', 'sites', slug)
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

// ── AC-939 — the census measures, orders, annotates, and writes nothing ──────

describe('story-5e7eb0c5 — censusing a site reports its colours and changes nothing', () => {
  it('test_UAT_AC939_census_reports_literals_counts_alpha_families_and_writes_nothing', () => {
    // A site whose colours are known: `xgd` carries an RGB used at three
    // opacities (#2e86a3 at full, 0.65 and 0.33), which is the alpha family the
    // census must surface. `harbor-cafe` carries no colour literals at all.
    const colourful = seedSandbox('xgd', 'ac939-colourful')
    const bare = seedSandbox('harbor-cafe', 'ac939-bare')
    const beforeColourful = hashTree(colourful)
    const beforeBare = hashTree(bare)

    const report = cli(['colors', 'ac939-colourful', '--sandbox'])
    expect(report.status, report.stderr).toBe(0)
    const lines = report.stdout.trimEnd().split('\n')

    // The header carries both counts, and ignoring alpha never distinguishes
    // MORE than the literals do — here it strictly collapses.
    const header = lines[0].match(
      /^ac939-colourful: (\d+) distinct colour\(s\), (\d+) distinct RGB ignoring alpha$/,
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
    const translucent = entryLines.find((e) => e.literal === '#2e86a3a6')
    expect(translucent?.alpha).toBe('0.65')
    expect(entryLines.find((e) => e.literal === '#2e86a3')?.alpha).toBeUndefined()

    // The alpha-families section names the RGB and every opacity it is used at.
    expect(report.stdout).toContain('alpha families')
    expect(report.stdout).toContain('#2e86a3 at α 1.00, 0.65, 0.33')

    // A site with no colour literals censuses successfully at zero, and prints
    // no alpha-families section because it has no family to report.
    const empty = cli(['colors', 'ac939-bare', '--sandbox'])
    expect(empty.status, empty.stderr).toBe(0)
    expect(empty.stdout.trim()).toBe('ac939-bare: 0 distinct colour(s), 0 distinct RGB ignoring alpha')
    expect(empty.stdout).not.toContain('alpha families')

    // Read-only: every file under both sites is byte-identical afterwards.
    expect(hashTree(colourful)).toEqual(beforeColourful)
    expect(hashTree(bare)).toEqual(beforeBare)
  }, 120_000)
})

// ── AC-940 — the census as one machine-readable document ─────────────────────

describe('story-5e7eb0c5 — the census is a single JSON document for scripting', () => {
  it('test_UAT_AC940_census_json_is_one_parseable_document_agreeing_with_the_human_form', () => {
    seedSandbox('xgd', 'ac940-site')

    const machine = cli(['colors', 'ac940-site', '--sandbox', '--json'])
    expect(machine.status, machine.stderr).toBe(0)

    // Exactly one JSON value on stdout and nothing else: the whole stream parses
    // with a standard parser, no pre-processing, no trailing prose.
    const doc = JSON.parse(machine.stdout) as {
      slug: string
      colors: { literal: string; rgb: string; alpha: number; count: number }[]
      distinctRgb: number
      alphaFamilies: { rgb: string; alphas: number[] }[]
    }
    expect(machine.stdout.trim().startsWith('{')).toBe(true)
    expect(machine.stdout.trim().endsWith('}')).toBe(true)

    expect(doc.slug).toBe('ac940-site')

    // One record per distinct literal, each fully specified.
    expect(Array.isArray(doc.colors)).toBe(true)
    expect(doc.colors.length).toBeGreaterThan(0)
    for (const c of doc.colors) {
      // The literal as authored, normalised to lower case.
      expect(typeof c.literal).toBe('string')
      expect(c.literal).toMatch(HEX)
      expect(c.literal).toBe(c.literal.toLowerCase())
      // Its opaque RGB …
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
    const human = cli(['colors', 'ac940-site', '--sandbox'])
    expect(human.status, human.stderr).toBe(0)
    expect(human.stdout.split('\n')[0]).toBe(
      `ac940-site: ${doc.colors.length} distinct colour(s), ${doc.distinctRgb} distinct RGB ignoring alpha`,
    )
  }, 120_000)
})

// ── AC-941 — the retrofit writes the palette and reports what it did ─────────

describe('story-5e7eb0c5 — the retrofit writes a palette and reports the conversion', () => {
  it('test_UAT_AC941_assign_writes_palette_rewrites_pages_and_reports_counts_and_files', () => {
    const siteDir = seedSandbox('xgd', 'ac941-site')
    const draft = draftOf(siteDir)
    const before = hashTree(draft)

    // Census first, so the "materially smaller" claim is measured rather than
    // assumed from a number baked into the test.
    const census = cli(['colors', 'ac941-site', '--sandbox', '--json'])
    expect(census.status, census.stderr).toBe(0)
    const literalCount = (JSON.parse(census.stdout) as { colors: unknown[] }).colors.length

    const run = cli(['colors', 'ac941-site', '--assign', '--sandbox'])
    expect(run.status, run.stderr).toBe(0)

    // The report opens with the before/after counts …
    const header = run.stdout
      .split('\n')[0]
      .match(/^ac941-site: (\d+) colour literal\(s\) → (\d+) palette entr(?:y|ies)$/)
    expect(header, run.stdout).not.toBeNull()
    expect(Number(header?.[1])).toBe(literalCount)
    const entryCount = Number(header?.[2])
    // A palette, not a colour list.
    expect(entryCount).toBeLessThan(literalCount / 2)

    // … the palette it wrote onto the site, with that many entries …
    const palette = paletteOf(siteDir)
    expect(palette).toBeDefined()
    expect(Object.keys(palette as L1Palette)).toHaveLength(entryCount)

    // … each entry by name, with its base value and how many steps it carries …
    for (const [name, entry] of Object.entries(palette as L1Palette)) {
      const steps = entry.steps ? Object.keys(entry.steps).length : 0
      expect(run.stdout).toContain(
        steps === 0 ? `  ${name}: ${entry.value}\n` : `  ${name}: ${entry.value} + ${steps} step(s)\n`,
      )
    }

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
    }

    // Every file named in the report differs from its pre-retrofit content, and
    // no other file under the site was touched.
    const after = hashTree(draft)
    const changed = Object.keys(after).filter((rel) => after[rel] !== before[rel])
    expect(Object.keys(after).sort()).toEqual(Object.keys(before).sort())
    expect(changed.sort()).toEqual(reported.slice().sort())
    expect(changed).toHaveLength(pages.length + 1)

    // The palette is also obtainable as a single machine-readable document, and
    // it is the palette stored on the site.
    const machine = cli(['colors', 'ac941-site', '--assign', '--sandbox', '--json'])
    expect(machine.status, machine.stderr).toBe(0)
    expect(JSON.parse(machine.stdout)).toEqual(palette)
  }, 120_000)
})

// ── AC-942 — one RGB at N opacities is one entry ─────────────────────────────

describe('story-5e7eb0c5 — an alpha family collapses to one entry with opacity on the reference', () => {
  it('test_UAT_AC942_one_rgb_at_three_opacities_becomes_one_entry', () => {
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

    // Exactly one palette entry carries that RGB — a conceptual colour occupies
    // one entry regardless of how many opacities it is used at.
    const carriers = Object.entries(palette).filter(
      ([, entry]) => entry.value === rgb || Object.values(entry.steps ?? {}).includes(rgb),
    )
    expect(carriers).toHaveLength(1)

    // No palette entry carries an opacity of its own — every stored value, base
    // or step, is an opaque `#rrggbb`.
    for (const entry of Object.values(palette)) {
      expect(entry.value).toMatch(/^#[0-9a-f]{6}$/)
      for (const step of Object.values(entry.steps ?? {})) expect(step).toMatch(/^#[0-9a-f]{6}$/)
    }

    // Each of the site's uses became a reference carrying its own opacity, and
    // every one resolves back to the translucent literal that was authored.
    const resolved = new Set<string>()
    for (const file of pageFiles(siteDir)) {
      for (const ref of collectRefs(readJsonFile(file))) resolved.add(resolveL1Color(ref, palette))
    }
    for (const literal of literals) expect([...resolved]).toContain(literal)
  }, 120_000)
})

// ── AC-943 — grouping into roles, deterministically ──────────────────────────

describe('story-5e7eb0c5 — derivation groups colours into roles rather than listing or merging them', () => {
  it('test_UAT_AC943_ramps_group_vivid_and_neutral_split_isolates_stand_alone', () => {
    const cwd = freshCwd()

    // (a) A five-step single-hue ramp (teal, hues 192–196) alongside an isolated
    //     vermilion that clusters with nothing.
    const RAMP = ['#1a5266', '#236d87', '#2e86a3', '#4aafc9', '#6fc4da']
    const ISOLATE = '#d94f2b'
    const rampSite = paintedSite(cwd, 'ramp', [...RAMP, ISOLATE])
    cmdColorsAssign('ramp', { cwd })
    const rampPalette = paletteOf(rampSite) as L1Palette

    // The ramp is ONE entry carrying the rest as named steps.
    const rampNames = new Set(RAMP.map((c) => entryOf(rampPalette, c)))
    expect(rampNames.size, JSON.stringify(rampPalette)).toBe(1)
    const rampEntry = rampPalette[[...rampNames][0] as string]
    expect(Object.keys(rampEntry.steps ?? {})).toHaveLength(RAMP.length - 1)

    // The isolated colour keeps its OWN single-value entry rather than being
    // forced into the nearest family.
    const isolateName = entryOf(rampPalette, ISOLATE)
    expect(isolateName).toBeDefined()
    expect(isolateName).not.toBe([...rampNames][0])
    expect(rampPalette[isolateName as string].steps).toBeUndefined()

    // (b) A vivid brand blue and a near-grey only 11° away in hue are two roles,
    //     not one ramp.
    const splitSite = paintedSite(cwd, 'split', ['#1447e6', '#e2e8f0'])
    cmdColorsAssign('split', { cwd })
    const splitPalette = paletteOf(splitSite) as L1Palette
    expect(entryOf(splitPalette, '#1447e6')).toBeDefined()
    expect(entryOf(splitPalette, '#e2e8f0')).toBeDefined()
    expect(entryOf(splitPalette, '#1447e6')).not.toBe(entryOf(splitPalette, '#e2e8f0'))

    // (c) True greys, black and white group as one neutral entry — including
    //     near-white and near-black values a few units off the extreme, whose
    //     hue arithmetic reports 0° and 270° respectively.
    const NEUTRALS = ['#ffffff', '#fffefe', '#010002', '#000000']
    const neutralSite = paintedSite(cwd, 'neutrals', NEUTRALS)
    cmdColorsAssign('neutrals', { cwd })
    const neutralPalette = paletteOf(neutralSite) as L1Palette
    expect(Object.keys(neutralPalette)).toHaveLength(1)
    expect(NEUTRALS.map((c) => entryOf(neutralPalette, c))).toEqual(NEUTRALS.map(() => 'neutral'))

    // (d) Determinism: the same colours derive the same palette — same entry
    //     names, same step assignments — on a second, independent run.
    const rerunSite = paintedSite(cwd, 'rerun', [...RAMP, ISOLATE])
    cmdColorsAssign('rerun', { cwd })
    expect(paletteOf(rerunSite)).toEqual(rampPalette)
  }, 120_000)
})

// ── AC-944 — a completed retrofit moves no pixel ─────────────────────────────

describe('story-5e7eb0c5 — a completed retrofit renders byte-identically', () => {
  it('test_UAT_AC944_render_is_byte_identical_before_and_after_the_retrofit', async () => {
    const cwd = freshCwd()
    // A site of colour literals, including one RGB at three opacities so the
    // alpha path is exercised by the pixel-identity proof too.
    const ref = capturedBundle(cwd, [
      '#fffef8',
      '#1f2937',
      '#2e86a3',
      '#2e86a3a6',
      '#2e86a355',
      '#4aafc9',
      '#ffffff',
    ])
    cmdRepro('painted', { cwd, ref })
    const siteDir = path.join(cwd, 'storage', 'sites', 'painted')
    expect(paletteOf(siteDir)).toBeUndefined()

    // The definition exactly as it stood before the conversion.
    const beforePages = new Map(pageFiles(siteDir).map((f) => [f, readJsonFile<unknown>(f)]))
    expect([...beforePages.values()].flatMap((p) => collectColorLiterals(p)).length).toBeGreaterThan(0)

    // Render every page of the stored site …
    const outA = path.join(cwd, 'render-before')
    await cmdRender('painted', { cwd, out: outA })
    const rendered = new Map(listFilesRel(outA).map((rel) => [rel, readFileSync(path.join(outA, rel))]))
    expect(rendered.size).toBeGreaterThan(0)

    // … retrofit it …
    cmdColorsAssign('painted', { cwd })
    const palette = paletteOf(siteDir) as L1Palette
    expect(palette).toBeDefined()

    // … and render again. The output is byte-identical, file for file.
    const outB = path.join(cwd, 'render-after')
    await cmdRender('painted', { cwd, out: outB })
    expect(listFilesRel(outB)).toEqual([...rendered.keys()])
    for (const [rel, bytes] of rendered) {
      expect(readFileSync(path.join(outB, rel)).equals(bytes), rel).toBe(true)
    }

    // Independently: every reference in the converted definition resolves back
    // to exactly the literal that occupied that position before the conversion,
    // including its opacity. Pixel-identity is a property, not a tolerance.
    for (const [file, original] of beforePages) {
      const converted = readJsonFile<unknown>(file)
      expect(collectRefs(converted).length, file).toBeGreaterThan(0)
      expect(resolveL1Palette(converted, palette), file).toEqual(original)
    }
  }, 120_000)
})

// ── AC-945 — a retrofit that cannot be proved lossless writes nothing ────────

describe('story-5e7eb0c5 — an unprovable retrofit fails and leaves every file untouched', () => {
  it('test_UAT_AC945_unprovable_retrofit_exits_nonzero_diagnoses_and_writes_nothing', () => {
    // (a) No stored draft definition to convert.
    sandboxSlugs.push('ac945-missing')
    const missingDir = path.join(SANDBOX, 'ac945-missing')
    rmSync(missingDir, { recursive: true, force: true })
    const missing = cli(['colors', 'ac945-missing', '--assign', '--sandbox'])
    expect(missing.status).not.toBe(0)
    expect(missing.stderr).toContain('ac945-missing')
    expect(missing.stderr).toMatch(/no draft/i)
    // Nothing was created on the way to failing.
    expect(existsSync(missingDir)).toBe(false)

    // (b) A derived reference that would not reproduce the literal it replaces.
    //     Collapsing two distinct families onto one name destroys one of them,
    //     so its members' references no longer resolve to their own colours.
    const collideDir = seedSandbox('xgd', 'ac945-collide')
    const beforeCollide = hashTree(collideDir)
    const collide = cli([
      'colors',
      'ac945-collide',
      '--assign',
      '--sandbox',
      '--names',
      'slate=shared,teal=shared',
    ])
    expect(collide.status).not.toBe(0)
    // The diagnostic identifies the cause and names the colours that failed.
    expect(collide.stderr).toMatch(/not lossless/i)
    expect(collide.stderr).toMatch(/#[0-9a-f]{6}/)
    // Every file is byte-identical: no page rewritten, no palette written.
    expect(hashTree(collideDir)).toEqual(beforeCollide)

    // (c) A conversion whose result would not satisfy the site-definition
    //     contract — an entry name outside the definition's naming rules.
    const invalidDir = seedSandbox('xgd', 'ac945-invalid')
    const beforeInvalid = hashTree(invalidDir)
    const invalid = cli([
      'colors',
      'ac945-invalid',
      '--assign',
      '--sandbox',
      '--names',
      'neutral=NotKebab',
    ])
    expect(invalid.status).not.toBe(0)
    // The diagnostic identifies the cause and names the validation problems.
    expect(invalid.stderr).toMatch(/invalid definition/i)
    expect(invalid.stderr).toContain('/palette/NotKebab')
    expect(hashTree(invalidDir)).toEqual(beforeInvalid)
  }, 180_000)
})

// ── AC-946 — descriptive names, promotable to role vocabulary ────────────────

describe('story-5e7eb0c5 — derived names describe the colour and rename from the command line', () => {
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

    const derivedDir = seedSandbox('xgd', 'ac946-derived')
    const derivedRun = cli(['colors', 'ac946-derived', '--assign', '--sandbox', '--json'])
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
    // Every entry name is unique, including the two families that derived the
    // same descriptive name and were disambiguated.
    expect(new Set(names).size).toBe(names.length)
    expect(names.some((n) => /-\d+$/.test(n))).toBe(true)

    // Supplying a mapping renames those entries in the written palette …
    const renamedDir = seedSandbox('xgd', 'ac946-renamed')
    const renamedRun = cli([
      'colors',
      'ac946-renamed',
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

    // … changing names only: the values, the steps and every other entry are
    // exactly what the un-renamed run produced.
    expect(renamed.text).toEqual(derived.slate)
    expect(renamed.primary).toEqual(derived.teal)
    const rest = (p: L1Palette, drop: string[]) =>
      Object.fromEntries(Object.entries(p).filter(([k]) => !drop.includes(k)))
    expect(rest(renamed, ['text', 'primary'])).toEqual(rest(derived, ['slate', 'teal']))

    // … and which colour each reference resolves to is unchanged: resolving both
    // converted definitions yields the same colours.
    const resolvedLiterals = (dir: string): string[] => {
      const palette = paletteOf(dir) as L1Palette
      return pageFiles(dir)
        .flatMap((f) => collectColorLiterals(resolveL1Palette(readJsonFile(f), palette)))
        .sort()
    }
    expect(resolvedLiterals(renamedDir)).toEqual(resolvedLiterals(derivedDir))

    // A mapping naming a family the derivation did not produce leaves the
    // palette otherwise intact.
    seedSandbox('xgd', 'ac946-unknown')
    const unknownRun = cli([
      'colors',
      'ac946-unknown',
      '--assign',
      '--sandbox',
      '--json',
      '--names',
      'nosuchfamily=whatever',
    ])
    expect(unknownRun.status, unknownRun.stderr).toBe(0)
    expect(JSON.parse(unknownRun.stdout)).toEqual(derived)
  }, 180_000)
})

// ── AC-947 — assignment is a separate, re-runnable pass ──────────────────────

describe('story-5e7eb0c5 — a site arrives with literals, and re-assignment is idempotent', () => {
  it('test_UAT_AC947_repro_carries_literals_and_re_assignment_reproduces_the_palette', () => {
    const cwd = freshCwd()

    // A site produced by reproducing a captured reference carries its colours as
    // literals and NO palette — assignment is a pass an author runs, never
    // something a site arrives with.
    const ref = capturedBundle(cwd, ['#fffef8', '#1f2937', '#2e86a3', '#2e86a3a6', '#2e86a355', '#4aafc9'])
    cmdRepro('reproduced', { cwd, ref })
    const siteDir = path.join(cwd, 'storage', 'sites', 'reproduced')
    expect(paletteOf(siteDir)).toBeUndefined()
    const literalsOnArrival = pageFiles(siteDir).flatMap((f) => collectColorLiterals(readJsonFile(f)))
    expect(literalsOnArrival.length).toBeGreaterThan(0)
    expect(pageFiles(siteDir).flatMap((f) => collectRefs(readJsonFile(f)))).toEqual([])

    // Census before the retrofit …
    const before = cmdColors('reproduced', { cwd })
    expect(before.colors.length).toBeGreaterThan(0)
    expect(before.alphaFamilies.length).toBeGreaterThan(0)

    const first = cmdColorsAssign('reproduced', { cwd })
    const firstPalette = paletteOf(siteDir) as L1Palette
    expect(firstPalette).toBeDefined()
    // A palette appears only once the retrofit is run, and the pages now carry
    // references in place of every literal.
    expect(pageFiles(siteDir).flatMap((f) => collectColorLiterals(readJsonFile(f)))).toEqual([])

    // … and again afterwards: references are measured as the colours they
    // resolve to, so the two censuses are the same measurement.
    const after = cmdColors('reproduced', { cwd })
    expect(after.colors).toEqual(before.colors)
    expect(after.distinctRgb).toBe(before.distinctRgb)
    expect(after.alphaFamilies).toEqual(before.alphaFamilies)

    // Re-running the retrofit on an already-retrofitted site produces the same
    // palette rather than a palette derived from a palette.
    const second = cmdColorsAssign('reproduced', { cwd })
    expect(paletteOf(siteDir)).toEqual(firstPalette)
    expect(second.palette).toEqual(first.palette)
    expect(second.before).toBe(first.before)
    expect(second.after).toBe(first.after)
  }, 120_000)
})
