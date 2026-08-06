/**
 * story-8685be2d — Font provenance: every font file in the project is accounted
 * for, and an unresolved licence cannot ship as product.
 *
 * The provenance record (`fonts/registry.yaml`, schema in `@1stcontact/site-schema`)
 * says where every font file came from and what its licence permits; `1c fonts
 * check` is the gate that keeps the record honest in both directions — it joins
 * every site's `l1.resources.fonts` against the record AND scans the source trees
 * on disk, so a capture-mirrored face nothing references is still held to account.
 *
 * The load-bearing distinction is between two questions with different answers:
 * "may we use this on a site we run ourselves" and "may we ship this across ten
 * thousand customer sites". `licence.redistribute_in_product` carries a
 * three-state answer to the second, and `'REVIEW_REQUIRED'` — asked, not yet
 * answered — is treated as *no* by every gate.
 *
 * These UATs run through the real surfaces: the CLI entry point (`run(['fonts',
 * 'check'])`), the command function, the report renderer, and the exported
 * schema validators — against real on-disk site trees built in throwaway
 * workspaces, so the YAML parse, site load, join, scan and exit code are all
 * exercised end to end.
 */
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { parse as parseYaml } from 'yaml'
import { validateFontRegistry, validateSite } from '../packages/site-schema/src/index'
import {
  cmdFontsCheck,
  formatFontsReport,
  collectFontFilesOnDisk,
  assetBasename,
  REGISTRY_REL,
} from '../tools/generate/src/cli/fonts'
import { CommandError } from '../tools/generate/src/cli/errors'
import { starterSiteJson } from '../tools/generate/src/cli/scaffold'
import { run } from '../tools/generate/src/cli/index'

const REPO_ROOT = path.resolve(__dirname, '..')

// ── Workspace fixture ────────────────────────────────────────────────────────

/** A schema-valid `site.json`, optionally declaring its distribution. */
function siteJson(id: string, distribution?: 'internal' | 'product'): Record<string, unknown> {
  const site = starterSiteJson(id)
  const config = { ...(site.config as Record<string, unknown>) }
  if (distribution) config.distribution = distribution
  return { ...site, config }
}

/** A page whose L1 document declares `resources.fonts` — the surface the check reads. */
function pageJson(fonts: { family: string; src: string; weight?: number }[]): unknown {
  return {
    id: 'home',
    slug: 'home',
    title: 'Home',
    modules: [],
    l1: {
      widths: [320, 1280],
      resources: { fonts },
      root: {
        kind: 'container',
        id: 'root',
        layout: 'stack',
        children: [
          {
            kind: 'text',
            id: 'h',
            text: 'Hello',
            axes: { color: '#111827', fontFamily: fonts[0]?.family ?? 'system-ui', fontSizePx: 24 },
            geometry: { keyframes: [{ at: 320, x: 0, y: 0, width: 320 }] },
          },
        ],
        geometry: { keyframes: [{ at: 320, x: 0, y: 0, width: 320 }] },
      },
    },
  }
}

interface WorkspaceSite {
  root?: 'sites' | 'sandbox'
  slug: string
  distribution?: 'internal' | 'product'
  fonts: { family: string; src: string; weight?: number }[]
}

const workspaces: string[] = []

/** Build a throwaway repo-shaped workspace: the record plus one or more site trees. */
function workspace(registryYaml: string | null, sites: WorkspaceSite[]): string {
  const cwd = mkdtempSync(path.join(tmpdir(), 'font-provenance-'))
  workspaces.push(cwd)
  if (registryYaml !== null) {
    mkdirSync(path.join(cwd, 'fonts'), { recursive: true })
    writeFileSync(path.join(cwd, REGISTRY_REL), registryYaml, 'utf8')
  }
  for (const s of sites) {
    const draft = path.join(cwd, 'storage', s.root ?? 'sites', s.slug, 'draft')
    mkdirSync(path.join(draft, 'pages'), { recursive: true })
    mkdirSync(path.join(draft, 'assets'), { recursive: true })
    writeFileSync(
      path.join(draft, 'site.json'),
      JSON.stringify(siteJson(s.slug, s.distribution), null, 2),
      'utf8',
    )
    writeFileSync(
      path.join(draft, 'pages', 'home.json'),
      JSON.stringify(pageJson(s.fonts), null, 2),
      'utf8',
    )
  }
  return cwd
}

/** A record declaring one family, with the redistribution answer under test. */
function registryFor(
  family: string,
  files: string[],
  redistribute: boolean | 'REVIEW_REQUIRED',
  actions: string[] = [],
): string {
  return (
    [
      'fonts:',
      `  - family: ${family}`,
      '    foundry: Test Foundry',
      '    source: https://example.com/font',
      "    downloaded: '2026-07-25'",
      '    licence:',
      '      name: Test Licence',
      '      url: https://example.com/licence',
      '      commercial_use: true',
      '      self_host: true',
      `      redistribute_in_product: ${String(redistribute)}`,
      ...(actions.length === 0
        ? ['    actions: []']
        : ['    actions:', ...actions.map((a) => `      - ${JSON.stringify(a)}`)]),
      '    files:',
      ...files.map((f) => `      - { path: ${f} }`),
    ].join('\n') + '\n'
  )
}

/** Drop a placeholder font file at a repo-relative path inside a workspace. */
function writeFontFile(cwd: string, relPath: string): void {
  const abs = path.join(cwd, relPath)
  mkdirSync(path.dirname(abs), { recursive: true })
  writeFileSync(abs, 'wOF2', 'utf8')
}

/**
 * Invoke the CLI inside a workspace, capturing stdout, stderr and the exit code.
 * `fonts check` reads `process.cwd()`, so the workspace has to be the cwd.
 */
async function runCli(
  cwd: string,
  argv: string[],
): Promise<{ code: number; out: string; err: string }> {
  const out: string[] = []
  const err: string[] = []
  const logSpy = vi
    .spyOn(console, 'log')
    .mockImplementation((...a: unknown[]) => void out.push(a.join(' ')))
  const errSpy = vi
    .spyOn(console, 'error')
    .mockImplementation((...a: unknown[]) => void err.push(a.join(' ')))
  const prevCwd = process.cwd()
  const prevExit = process.exitCode
  process.chdir(cwd)
  process.exitCode = 0
  try {
    await run(argv)
    const code = typeof process.exitCode === 'number' ? process.exitCode : 0
    return { code, out: out.join('\n'), err: err.join('\n') }
  } finally {
    process.chdir(prevCwd)
    process.exitCode = prevExit
    logSpy.mockRestore()
    errSpy.mockRestore()
  }
}

/** Run `fn`, asserting it threw a {@link CommandError}, and hand the error back. */
function caught(fn: () => unknown): CommandError {
  try {
    fn()
  } catch (err) {
    expect(err).toBeInstanceOf(CommandError)
    return err as CommandError
  }
  throw new Error('expected the check to refuse to run, but it returned a report')
}

afterEach(() => {
  while (workspaces.length > 0) {
    const cwd = workspaces.pop()
    if (cwd) rmSync(cwd, { recursive: true, force: true })
  }
})

// ── AC-857 — the record is a stated contract ─────────────────────────────────

describe('story-8685be2d — the provenance record is a stated contract', () => {
  it('test_UAT_AC857_record_entries_state_origin_licence_and_files_or_are_rejected', () => {
    // The shipped record must satisfy the contract entry by entry.
    const file = path.join(REPO_ROOT, REGISTRY_REL)
    expect(existsSync(file)).toBe(true)
    const shipped = validateFontRegistry(parseYaml(readFileSync(file, 'utf8')))
    expect(shipped.ok).toBe(true)
    if (!shipped.ok) return
    expect(shipped.value.fonts.length).toBeGreaterThan(0)

    for (const entry of shipped.value.fonts) {
      expect(entry.family.length).toBeGreaterThan(0)
      expect(entry.foundry.length).toBeGreaterThan(0)
      expect(entry.source).toMatch(/^https?:\/\//)
      expect(entry.downloaded).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(entry.licence.name.length).toBeGreaterThan(0)
      expect(entry.licence.url).toMatch(/^https?:\/\//)
      expect(typeof entry.licence.commercial_use).toBe('boolean')
      expect(typeof entry.licence.self_host).toBe('boolean')
      expect(
        typeof entry.licence.redistribute_in_product === 'boolean' ||
          entry.licence.redistribute_in_product === 'REVIEW_REQUIRED',
      ).toBe(true)
      expect(Array.isArray(entry.actions)).toBe(true)
      for (const action of entry.actions) expect(typeof action).toBe('string')
      expect(entry.files.length).toBeGreaterThan(0)
      for (const f of entry.files) expect(f.path.length).toBeGreaterThan(0)
    }

    // A deliberately damaged entry is rejected, naming the entry and the field.
    const sound = {
      family: 'Satoshi',
      foundry: 'Indian Type Foundry',
      source: 'https://example.com/font',
      downloaded: '2026-07-25',
      licence: {
        name: 'Test Licence',
        url: 'https://example.com/licence',
        commercial_use: true,
        self_host: true,
        redistribute_in_product: 'REVIEW_REQUIRED' as const,
      },
      actions: [],
      files: [{ path: 'satoshi-400.woff2' }],
    }
    expect(validateFontRegistry({ fonts: [sound] }).ok).toBe(true)

    const damaged: { name: string; entry: Record<string, unknown>; path: RegExp }[] = [
      {
        name: 'missing licence URL',
        entry: { ...sound, licence: { ...sound.licence, url: undefined } },
        path: /^\/fonts\/0\/licence\/url$/,
      },
      {
        name: 'permission answer of the wrong type',
        entry: { ...sound, licence: { ...sound.licence, commercial_use: 'yes' } },
        path: /^\/fonts\/0\/licence\/commercial_use$/,
      },
      {
        name: 'undeclared extra field',
        entry: { ...sound, colour: 'red' },
        path: /^\/fonts\/0/,
      },
      { name: 'no files', entry: { ...sound, files: [] }, path: /^\/fonts\/0\/files$/ },
    ]
    for (const c of damaged) {
      const result = validateFontRegistry({ fonts: [c.entry] })
      expect(result.ok, `${c.name} must be rejected`).toBe(false)
      if (result.ok) continue
      expect(result.errors.some((e) => c.path.test(e.path)), `${c.name} → ${JSON.stringify(result.errors)}`).toBe(true)
    }
    // The extra-field rejection names the offending key, not just the entry.
    const extra = validateFontRegistry({ fonts: [{ ...sound, colour: 'red' }] })
    expect(extra.ok).toBe(false)
    if (!extra.ok) expect(extra.errors.map((e) => e.message).join(' ')).toContain('colour')

    // The date reads identically whether written bare or quoted — a human need
    // not remember to quote it, and a YAML `Date` normalises to the same day.
    const bare = validateFontRegistry(
      parseYaml(registryFor('Satoshi', ['satoshi-400.woff2'], true).replace("'2026-07-25'", '2026-07-25')),
    )
    const quoted = validateFontRegistry(parseYaml(registryFor('Satoshi', ['satoshi-400.woff2'], true)))
    const asDate = validateFontRegistry({ fonts: [{ ...sound, downloaded: new Date('2026-07-25T00:00:00Z') }] })
    expect(bare.ok && quoted.ok && asDate.ok).toBe(true)
    if (bare.ok && quoted.ok && asDate.ok) {
      expect(bare.value.fonts[0].downloaded).toBe('2026-07-25')
      expect(quoted.value.fonts[0].downloaded).toBe(bare.value.fonts[0].downloaded)
      expect(asDate.value.fonts[0].downloaded).toBe(bare.value.fonts[0].downloaded)
    }
  })
})

// ── AC-858 — an unaccounted family fails ─────────────────────────────────────

describe('story-8685be2d — a family no record accounts for fails the check', () => {
  it('test_UAT_AC858_unregistered_family_fails_and_exits_non_zero', async () => {
    const cwd = workspace(registryFor('Satoshi', ['satoshi-400.woff2'], 'REVIEW_REQUIRED'), [
      { slug: 'authored', fonts: [{ family: 'Poppins', src: '/assets/poppins-400.woff2' }] },
    ])

    const report = cmdFontsCheck(cwd)
    expect(report.pass).toBe(false)
    expect(report.violations).toHaveLength(1)
    const [violation] = report.violations
    expect(violation.kind).toBe('unregistered-family')
    expect(violation.message).toContain('Poppins')
    expect(violation.message).toContain('sites/authored')
    // The remediation names the record and the fields the new entry needs.
    expect(violation.hint).toContain(REGISTRY_REL)
    expect(violation.hint).toMatch(/foundry/)
    expect(violation.hint).toMatch(/licence/)

    // The same failure through the real CLI entry point exits non-zero.
    const { code } = await runCli(cwd, ['fonts', 'check'])
    expect(code).not.toBe(0)
  })
})

// ── AC-859 — accounting is per file, not per family ──────────────────────────

describe('story-8685be2d — a family entry that omits the served file fails', () => {
  it('test_UAT_AC859_recorded_family_with_unlisted_file_fails_naming_that_file', () => {
    // The record lists one weight; the site serves two. A second weight added by
    // hand must not ride in on its family's existing record.
    const cwd = workspace(registryFor('Satoshi', ['satoshi-400.woff2'], 'REVIEW_REQUIRED'), [
      {
        slug: 'authored',
        fonts: [
          { family: 'Satoshi', src: '/assets/satoshi-400.woff2', weight: 400 },
          { family: 'Satoshi', src: '/assets/satoshi-900.woff2', weight: 900 },
        ],
      },
    ])

    const report = cmdFontsCheck(cwd)
    expect(report.pass).toBe(false)
    expect(report.violations).toHaveLength(1)
    const [violation] = report.violations
    expect(violation.kind).toBe('unregistered-file')
    expect(violation.message).toContain('satoshi-900.woff2')
    expect(violation.message).not.toContain('satoshi-400.woff2')
    expect(violation.message).toContain('Satoshi')
    expect(violation.message).toContain('sites/authored')
    expect(violation.hint).toContain('satoshi-900.woff2')
  })
})

// ── AC-860 — provenance is demanded of the file, not the reference ───────────

describe('story-8685be2d — unaccounted bytes on disk fail even unreferenced', () => {
  it('test_UAT_AC860_unreferenced_font_file_fails_and_derived_trees_are_not_scanned', () => {
    const cwd = workspace(registryFor('Satoshi', ['satoshi-400.woff2'], true), [
      { slug: 'xgd', fonts: [{ family: 'Satoshi', src: '/assets/satoshi-400.woff2' }] },
    ])
    // Record and site agree, and the recorded file is genuinely on disk.
    writeFontFile(cwd, 'storage/sites/xgd/draft/assets/satoshi-400.woff2')
    expect(cmdFontsCheck(cwd).pass).toBe(true)

    // A capture bundle mirrors a third party's face in — referenced by nothing.
    writeFontFile(cwd, 'storage/references/example.com/index/assets/aH8kZq2.woff2')
    const report = cmdFontsCheck(cwd)
    expect(report.pass).toBe(false)
    const unprovenanced = report.violations.filter((v) => v.kind === 'unprovenanced-file')
    expect(unprovenanced).toHaveLength(1)
    expect(unprovenanced[0].file?.file).toBe('aH8kZq2.woff2')
    expect(unprovenanced[0].file?.locations).toEqual([
      'storage/references/example.com/index/assets/aH8kZq2.woff2',
    ])
    expect(unprovenanced[0].message).toContain('aH8kZq2.woff2')
    expect(unprovenanced[0].message).toContain('storage/references/example.com/index/assets/aH8kZq2.woff2')
    expect(unprovenanced[0].hint).toMatch(/delete/i)
    expect(unprovenanced[0].hint).toContain(REGISTRY_REL)

    // Derived render output is a byte-for-byte copy of a draft, and vendored
    // dependencies are not project source: neither is scanned, so the same file
    // still yields exactly one finding and the verdict does not depend on when
    // the project was last rendered.
    writeFontFile(cwd, 'storage/dist/sites/xgd/draft/assets/aH8kZq2.woff2')
    writeFontFile(cwd, 'storage/node_modules/some-pkg/fonts/aH8kZq2.woff2')
    const after = cmdFontsCheck(cwd)
    expect(after.violations.filter((v) => v.kind === 'unprovenanced-file')).toHaveLength(1)
    expect(
      after.filesOnDisk
        .find((f) => f.file === 'aH8kZq2.woff2')
        ?.locations.filter((l) => l.startsWith('storage/dist/') || l.startsWith('storage/node_modules/')),
    ).toEqual([])
  })
})

// ── AC-861 — the product gate ────────────────────────────────────────────────

describe('story-8685be2d — product distribution gates on a settled redistribution answer', () => {
  it('test_UAT_AC861_product_distribution_requires_settled_yes_redistribution', () => {
    // Hold the record entry and the served font constant; vary only the two
    // inputs — the site's declared distribution and the redistribution answer.
    const fonts = [{ family: 'Satoshi', src: '/assets/satoshi-400.woff2', weight: 400 }]
    const check = (
      redistribute: boolean | 'REVIEW_REQUIRED',
      distribution?: 'internal' | 'product',
    ) =>
      cmdFontsCheck(
        workspace(registryFor('Satoshi', ['satoshi-400.woff2'], redistribute), [
          { slug: 'customer', distribution, fonts },
        ]),
      )

    // Unresolved + no product declaration → the looser bar; it passes.
    expect(check('REVIEW_REQUIRED').pass).toBe(true)

    // Unresolved + product declaration → fails, and says the answer is unresolved
    // rather than reading as a plain refusal.
    const unresolved = check('REVIEW_REQUIRED', 'product')
    expect(unresolved.pass).toBe(false)
    expect(unresolved.violations.map((v) => v.kind)).toEqual(['redistribution-not-permitted'])
    expect(unresolved.violations[0].message).toContain('unresolved')
    expect(unresolved.violations[0].message).toContain('REVIEW_REQUIRED')

    // A settled no + product declaration → fails identically, reported as not permitted.
    const denied = check(false, 'product')
    expect(denied.pass).toBe(false)
    expect(denied.violations.map((v) => v.kind)).toEqual(['redistribution-not-permitted'])
    expect(denied.violations[0].message).toContain('is not permitted')

    // Only a settled yes clears the gate.
    expect(check(true, 'product').pass).toBe(true)

    // Every failing case names the site and the family, and offers the same
    // remediation: resolve the licence question, or use a font that permits it.
    for (const failing of [unresolved, denied]) {
      expect(failing.violations[0].message).toContain('sites/customer')
      expect(failing.violations[0].message).toContain('Satoshi')
      expect(failing.violations[0].hint).toContain('redistribute_in_product')
      expect(failing.violations[0].hint).toMatch(/permits (product )?redistribution/)
    }
  })
})

// ── AC-862 — the distribution marker is part of the site contract ────────────

describe('story-8685be2d — the distribution marker is validated site contract', () => {
  it('test_UAT_AC862_site_definition_declares_internal_or_product_or_nothing', () => {
    for (const distribution of ['internal', 'product'] as const) {
      const result = validateSite({ ...siteJson('s', distribution), pages: [] })
      expect(result.ok).toBe(true)
      if (result.ok) expect(result.value.config.distribution).toBe(distribution)
    }

    // Absent validates, and the gate holds such a site to the looser bar: an
    // unresolved product answer passes when no distribution is declared.
    const bare = validateSite({ ...siteJson('s'), pages: [] })
    expect(bare.ok).toBe(true)
    if (bare.ok) expect(bare.value.config.distribution).toBeUndefined()
    const cwd = workspace(registryFor('Satoshi', ['satoshi-400.woff2'], 'REVIEW_REQUIRED'), [
      { slug: 'undeclared', fonts: [{ family: 'Satoshi', src: '/assets/satoshi-400.woff2' }] },
    ])
    const report = cmdFontsCheck(cwd)
    expect(report.pass).toBe(true)
    expect(report.usages[0].distribution).toBe('internal')

    // Any other value is rejected by validation.
    const bogus = validateSite({
      ...siteJson('s'),
      config: { ...(siteJson('s').config as Record<string, unknown>), distribution: 'oem' },
      pages: [],
    })
    expect(bogus.ok).toBe(false)
  })
})

// ── AC-863 — outstanding licence work warns without failing ──────────────────

describe('story-8685be2d — an open licence action warns and passes', () => {
  it('test_UAT_AC863_outstanding_actions_warn_with_family_actions_and_sites', () => {
    // Registration is provenance, not approval: a font legitimately sits in the
    // state "cleared for this repo, not yet cleared for the product".
    const action = 'Legal review before inclusion in the 1stcontact font menu.'
    const fonts = [{ family: 'Satoshi', src: '/assets/satoshi-400.woff2' }]
    const report = cmdFontsCheck(
      workspace(registryFor('Satoshi', ['satoshi-400.woff2'], 'REVIEW_REQUIRED', [action]), [
        { slug: 'xgd', fonts },
      ]),
    )

    expect(report.pass).toBe(true)
    expect(report.violations).toEqual([])
    expect(report.warnings).toHaveLength(1)
    expect(report.warnings[0].family).toBe('Satoshi')
    expect(report.warnings[0].actions).toEqual([action])
    // An open obligation has a visible blast radius: every site referencing it.
    expect(report.warnings[0].usedBy).toEqual(['sites/xgd'])

    // Remove the outstanding work and no advisory entry is produced.
    const settled = cmdFontsCheck(
      workspace(registryFor('Satoshi', ['satoshi-400.woff2'], 'REVIEW_REQUIRED'), [
        { slug: 'xgd', fonts },
      ]),
    )
    expect(settled.pass).toBe(true)
    expect(settled.warnings).toEqual([])
  })
})

// ── AC-864 — the record's own integrity is a hard error ──────────────────────

describe("story-8685be2d — the record's own integrity is a hard error", () => {
  it('test_UAT_AC864_broken_record_stops_the_run_rather_than_passing_vacuously', async () => {
    const sites: WorkspaceSite[] = [
      { slug: 'xgd', fonts: [{ family: 'Satoshi', src: '/assets/satoshi-400.woff2' }] },
    ]

    // (a) Absent — checking against nothing would report clean over entirely
    // un-provenanced fonts.
    const absent = workspace(null, sites)
    const absentErr = caught(() => cmdFontsCheck(absent))
    expect(absentErr.message).toMatch(/registry not found/i)
    expect(absentErr.path).toBe(REGISTRY_REL)
    expect(absentErr.hint).toMatch(/every font file .* must be registered/i)

    // (b) Unparseable.
    const unparseable = workspace('fonts: [oops\n', sites)
    const unparseableErr = caught(() => cmdFontsCheck(unparseable))
    expect(unparseableErr.message).toMatch(/not valid YAML/i)
    expect(unparseableErr.path).toBe(REGISTRY_REL)

    // (c) Well-formed YAML that violates the contract — the error names the
    // first offending field and how many issues were found.
    const invalid = workspace('fonts:\n  - family: Satoshi\n', sites)
    const invalidErr = caught(() => cmdFontsCheck(invalid))
    expect(invalidErr.message).toMatch(/structurally invalid/i)
    expect(invalidErr.path).toMatch(new RegExp(`^${REGISTRY_REL.replace(/\\/g, '\\\\')}/fonts/0/`))
    expect(invalidErr.hint).toMatch(/\d+ issue\(s\)/)

    // (d) The same family declared twice — one family, one provenance record.
    const duplicated = workspace(
      registryFor('Satoshi', ['satoshi-400.woff2'], true) +
        registryFor('Satoshi', ['satoshi-900.woff2'], true).replace(/^fonts:\n/, ''),
      sites,
    )
    const duplicateErr = caught(() => cmdFontsCheck(duplicated))
    expect(duplicateErr.message).toMatch(/more than once/i)
    expect(duplicateErr.message).toContain('Satoshi')
    expect(duplicateErr.hint).toMatch(/merge/i)

    // Every one of them exits non-zero from the command line — never a pass and
    // never an empty report.
    for (const cwd of [absent, unparseable, invalid, duplicated]) {
      const { code, out } = await runCli(cwd, ['fonts', 'check'])
      expect(code).not.toBe(0)
      expect(out).not.toContain('PASS')
    }
  })
})

// ── AC-865 — the check is project-wide and attributes each finding ───────────

describe('story-8685be2d — the check spans both site trees', () => {
  it('test_UAT_AC865_scans_tracked_and_scratch_trees_and_attributes_violations', () => {
    // A licence attaches to the font, not to the site that happens to reference
    // it, so the scratch tree where capture-derived reproductions land is in
    // scope too — that is where the murkiest provenance actually arrives.
    const cwd = workspace(registryFor('Satoshi', ['satoshi-400.woff2'], true), [
      {
        root: 'sites',
        slug: 'xgd',
        fonts: [{ family: 'Satoshi', src: '/assets/satoshi-400.woff2' }],
      },
      { root: 'sandbox', slug: 'repro', fonts: [{ family: 'Karla', src: '/assets/karla.woff2' }] },
    ])

    const report = cmdFontsCheck(cwd)
    expect(report.pass).toBe(false)
    expect(report.violations).toHaveLength(1)
    const [violation] = report.violations
    expect(violation.kind).toBe('unregistered-family')
    // The operator can tell an authored site's problem from a reproduction's.
    expect(violation.usage?.root).toBe('sandbox')
    expect(violation.usage?.slug).toBe('repro')
    expect(violation.message).toContain('sandbox/repro')

    // Both trees were genuinely scanned, and the tracked site's recorded font
    // raised nothing.
    expect(report.usages.map((u) => `${u.root}/${u.slug}`).sort()).toEqual([
      'sandbox/repro',
      'sites/xgd',
    ])
    expect(report.violations.filter((v) => v.usage?.root === 'sites')).toEqual([])
  })
})

// ── AC-866 — the join is on the file, not the form of the reference ──────────

describe('story-8685be2d — every reference form resolves to the same file key', () => {
  it('test_UAT_AC866_reference_forms_reduce_to_the_recorded_file_key', () => {
    for (const src of [
      '/assets/satoshi-400.woff2',
      'assets/satoshi-400.woff2',
      'satoshi-400.woff2',
      '/assets/satoshi-400.woff2?v=2',
      '/assets/satoshi-400.woff2#hash',
      'https://cdn.example.com/f/satoshi-400.woff2',
    ]) {
      expect(assetBasename(src), src).toBe('satoshi-400.woff2')
    }

    // And a page serving a recorded font by a query-bearing reference raises
    // nothing — the form of the reference cannot make an accounted-for font
    // look unaccounted-for.
    const report = cmdFontsCheck(
      workspace(registryFor('Satoshi', ['satoshi-400.woff2'], true), [
        { slug: 'xgd', fonts: [{ family: 'Satoshi', src: '/assets/satoshi-400.woff2?v=2' }] },
      ]),
    )
    expect(report.pass).toBe(true)
    expect(report.violations.filter((v) => v.kind === 'unregistered-file')).toEqual([])
    expect(report.usages[0].file).toBe('satoshi-400.woff2')
  })
})

// ── AC-867 — a run states its own scope ──────────────────────────────────────

describe('story-8685be2d — a run reports what it examined', () => {
  it('test_UAT_AC867_report_states_families_references_and_files_scanned', () => {
    // Against the project as it stands: a pass that could equally have come from
    // finding nothing is not a pass this criterion admits.
    const report = cmdFontsCheck(REPO_ROOT)
    expect(report.violations).toEqual([])
    expect(report.pass).toBe(true)
    expect(report.registered.length).toBeGreaterThan(0)
    expect(report.usages.length).toBeGreaterThan(0)
    expect(report.filesOnDisk.length).toBeGreaterThan(0)
    expect(collectFontFilesOnDisk(REPO_ROOT).length).toBe(report.filesOnDisk.length)

    const rendered = formatFontsReport(report)
    const siteCount = new Set(report.usages.map((u) => `${u.root}/${u.slug}`)).size
    expect(rendered).toContain(`${report.registered.length} registered famil`)
    expect(rendered).toContain(`${report.usages.length} reference(s) across ${siteCount} site(s)`)
    expect(rendered).toContain(`${report.filesOnDisk.length} font file(s) on disk`)
    expect(rendered).toContain('PASS')

    // A failing run lists each violation with its kind, message and remediation.
    const failing = cmdFontsCheck(
      workspace(registryFor('Satoshi', ['satoshi-400.woff2'], 'REVIEW_REQUIRED'), [
        { slug: 'authored', fonts: [{ family: 'Poppins', src: '/assets/poppins-400.woff2' }] },
      ]),
    )
    const failedText = formatFontsReport(failing)
    expect(failedText).toContain(`FAIL — ${failing.violations.length} violation(s)`)
    for (const v of failing.violations) {
      expect(failedText).toContain(`[${v.kind}] ${v.message}`)
      expect(failedText).toContain(`hint: ${v.hint}`)
    }
    expect(failedText).not.toContain('PASS')
  })
})

// ── AC-868 — the machine-readable form ───────────────────────────────────────

describe('story-8685be2d — the machine-readable form carries the whole report', () => {
  it('test_UAT_AC868_json_mode_emits_one_document_whose_flag_matches_the_exit_status', async () => {
    // A passing project that has something to say in every section of the report.
    const passing = workspace(
      registryFor('Satoshi', ['satoshi-400.woff2'], true, ['Re-obtain from the canonical release.']),
      [{ slug: 'xgd', fonts: [{ family: 'Satoshi', src: '/assets/satoshi-400.woff2' }] }],
    )
    writeFontFile(passing, 'storage/sites/xgd/draft/assets/satoshi-400.woff2')

    const ok = await runCli(passing, ['fonts', 'check', '--json'])
    expect(ok.code).toBe(0)
    expect(ok.err).toBe('')
    // Nothing else on the stream: it parses as a single structured document.
    const okDoc = JSON.parse(ok.out)
    expect(ok.out).not.toContain('fonts check —')
    expect(okDoc.ok).toBe(true)
    expect(okDoc.data.pass).toBe(true)
    expect(okDoc.data.registered).toContain('Satoshi')
    expect(okDoc.data.usages).toHaveLength(1)
    expect(okDoc.data.usages[0]).toMatchObject({
      root: 'sites',
      slug: 'xgd',
      family: 'Satoshi',
      file: 'satoshi-400.woff2',
    })
    expect(okDoc.data.filesOnDisk).toEqual([
      {
        file: 'satoshi-400.woff2',
        locations: ['storage/sites/xgd/draft/assets/satoshi-400.woff2'],
      },
    ])
    expect(okDoc.data.violations).toEqual([])
    expect(okDoc.data.warnings).toHaveLength(1)
    expect(okDoc.data.warnings[0].family).toBe('Satoshi')

    // A failing project: the flag flips with the exit status, same shape.
    const failing = workspace(registryFor('Satoshi', ['satoshi-400.woff2'], 'REVIEW_REQUIRED'), [
      { slug: 'authored', fonts: [{ family: 'Poppins', src: '/assets/poppins-400.woff2' }] },
    ])
    const bad = await runCli(failing, ['fonts', 'check', '--json'])
    expect(bad.code).not.toBe(0)
    expect(bad.err).toBe('')
    const badDoc = JSON.parse(bad.out)
    expect(bad.out).not.toContain('fonts check —')
    expect(badDoc.ok).toBe(false)
    expect(badDoc.data.pass).toBe(false)
    expect(badDoc.data.violations).toHaveLength(1)
    expect(badDoc.data.violations[0].kind).toBe('unregistered-family')
    expect(badDoc.data.violations[0].message).toContain('Poppins')
    expect(badDoc.data.registered).toContain('Satoshi')
  })
})
