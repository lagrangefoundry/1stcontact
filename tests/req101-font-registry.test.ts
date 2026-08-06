/**
 * REQ-101 — font provenance registry + `1c fonts check`.
 *
 * There was no font-acquisition path for an authored site and no record of where
 * any font came from or what its licence permits: every font in the repo arrived
 * as a side effect of a capture bundle. These UATs cover the closed hole:
 *
 *   - registry     `fonts/registry.yaml` records family, foundry, source URL,
 *                  download date, licence name/URL, the three permission flags,
 *                  outstanding actions, and the file list — for every font on disk.
 *   - enforcement  `1c fonts check` fails on a family no registry entry records,
 *                  and on a file the family's entry does not list.
 *   - the gate     a site declaring `config.distribution: "product"` fails when a
 *                  referenced family's `redistribute_in_product` is not `true` —
 *                  "may I use this here" and "may I ship this to 10,000 customer
 *                  sites" are different questions, and REVIEW_REQUIRED means the
 *                  second one is unanswered, so it must not pass.
 *   - advisory     an outstanding `actions` entry warns but does NOT fail, which
 *                  is the state a font legitimately sits in while cleared for
 *                  this repo and not yet cleared for the product.
 *
 * The checks run through the CLI's real entry point (`run(['fonts','check'])`)
 * against real on-disk site trees built in a temp workspace, so the file layout,
 * YAML parse, site load and exit code are all exercised end-to-end.
 */
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { parse as parseYaml } from 'yaml'
import { validateFontRegistry, validateSite } from '../packages/site-schema/src/index'
import {
  cmdFontsCheck,
  collectFontFilesOnDisk,
  assetBasename,
  REGISTRY_REL,
} from '../tools/generate/src/cli/fonts'
import { starterSiteJson } from '../tools/generate/src/cli/scaffold'
import { run } from '../tools/generate/src/cli/index'

const REPO_ROOT = path.resolve(__dirname, '..')

// ── Workspace fixture ────────────────────────────────────────────────────────

/**
 * A schema-valid `site.json`, optionally declaring product distribution. Built
 * from the same starter `1c new` scaffolds, so the fixture cannot drift out of
 * step with the theme-token contract.
 */
function siteJson(id: string, distribution?: 'internal' | 'product'): Record<string, unknown> {
  const site = starterSiteJson(id)
  const config = { ...(site.config as Record<string, unknown>) }
  if (distribution) config.distribution = distribution
  return { ...site, config }
}

/** A page whose L1 document declares `fonts` — the surface `fonts check` reads. */
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

/** Build a throwaway repo-shaped workspace: `fonts/registry.yaml` + site trees. */
function makeWorkspace(registryYaml: string | null, sites: WorkspaceSite[]): string {
  const cwd = mkdtempSync(path.join(tmpdir(), 'req101-'))
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

/** A registry declaring one family, with the redistribution flag under test. */
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

const workspaces: string[] = []
function workspace(registryYaml: string | null, sites: WorkspaceSite[]): string {
  const cwd = makeWorkspace(registryYaml, sites)
  workspaces.push(cwd)
  return cwd
}

afterEach(() => {
  while (workspaces.length > 0) {
    const cwd = workspaces.pop()
    if (cwd) rmSync(cwd, { recursive: true, force: true })
  }
})

// ── UATs ─────────────────────────────────────────────────────────────────────

describe('REQ-101 — font provenance registry', () => {
  it('test_UAT_FC_REQ-101_registry_records_provenance_for_every_font_on_disk', () => {
    // The shipped registry must parse, validate, and actually account for the
    // bytes in the repo — a registry that omits a file on disk is the exact
    // drift this ticket exists to prevent.
    const file = path.join(REPO_ROOT, REGISTRY_REL)
    expect(existsSync(file)).toBe(true)

    const parsed = validateFontRegistry(parseYaml(readFileSync(file, 'utf8')))
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return

    // Every required provenance field is present on every entry.
    for (const entry of parsed.value.fonts) {
      expect(entry.family.length).toBeGreaterThan(0)
      expect(entry.foundry.length).toBeGreaterThan(0)
      expect(entry.source).toMatch(/^https?:\/\//)
      expect(entry.downloaded).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(entry.licence.name.length).toBeGreaterThan(0)
      expect(entry.licence.url).toMatch(/^https?:\/\//)
      expect(typeof entry.licence.commercial_use).toBe('boolean')
      expect(typeof entry.licence.self_host).toBe('boolean')
      expect(entry.files.length).toBeGreaterThan(0)
    }

    // Backfill is complete: the authored fonts and the capture-derived ones.
    const registeredFiles = new Set(parsed.value.fonts.flatMap((f) => f.files.map((x) => x.path)))
    for (const expected of [
      'satoshi-400.woff2',
      'satoshi-500.woff2',
      'satoshi-700.woff2',
      'satoshi-900.woff2',
      'jetbrains-mono.woff2',
      '8vIJ7ww63mVu7gt79mT7PkRXMw.woff2', // capture-derived, hashed CDN name
      'eicons.woff2', // capture-derived, licence explicitly not cleared
    ]) {
      expect(registeredFiles.has(expected)).toBe(true)
    }
  })

  it('test_UAT_FC_REQ-101_check_passes_over_the_real_repo_trees', () => {
    // The gate is only worth having if it holds green on the actual repo: every
    // family any site references must already be registered post-backfill.
    const report = cmdFontsCheck(REPO_ROOT)
    expect(report.violations).toEqual([])
    expect(report.pass).toBe(true)
    // And it genuinely scanned something, rather than passing vacuously.
    expect(report.usages.length).toBeGreaterThan(0)
    expect(report.usages.map((u) => u.family)).toContain('Satoshi')
  })

  it('test_UAT_FC_REQ-101_unregistered_family_fails_the_check', async () => {
    const cwd = workspace(registryFor('Satoshi', ['satoshi-400.woff2'], 'REVIEW_REQUIRED'), [
      { slug: 'authored', fonts: [{ family: 'Poppins', src: '/assets/poppins-400.woff2' }] },
    ])

    const report = cmdFontsCheck(cwd)
    expect(report.pass).toBe(false)
    expect(report.violations).toHaveLength(1)
    expect(report.violations[0].kind).toBe('unregistered-family')
    expect(report.violations[0].message).toContain('Poppins')
    expect(report.violations[0].hint).toContain(REGISTRY_REL)

    // The same failure through the real CLI entry point sets a non-zero exit code.
    const prevCwd = process.cwd()
    const prevExit = process.exitCode
    try {
      process.chdir(cwd)
      process.exitCode = 0
      await run(['fonts', 'check'])
      expect(process.exitCode).toBe(1)
    } finally {
      process.chdir(prevCwd)
      process.exitCode = prevExit
    }
  })

  it('test_UAT_FC_REQ-101_registered_family_with_unlisted_file_fails_the_check', () => {
    // The family is known but this particular weight is not — a file added by
    // hand would otherwise slip past a family-only join with no provenance.
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
    expect(report.violations[0].kind).toBe('unregistered-file')
    expect(report.violations[0].message).toContain('satoshi-900.woff2')
  })

  it('test_UAT_FC_REQ-101_product_distribution_gates_on_unresolved_redistribution', () => {
    // The load-bearing distinction: the SAME font, the SAME registry entry, is
    // fine for an internal site and a failure for a product-distributed one.
    // REVIEW_REQUIRED means the question was asked and not answered — it must
    // never pass by default.
    const registry = registryFor('Satoshi', ['satoshi-400.woff2'], 'REVIEW_REQUIRED')
    const fonts = [{ family: 'Satoshi', src: '/assets/satoshi-400.woff2', weight: 400 }]

    const internal = cmdFontsCheck(workspace(registry, [{ slug: 'xgd', fonts }]))
    expect(internal.pass).toBe(true)

    const product = cmdFontsCheck(
      workspace(registry, [{ slug: 'customer', distribution: 'product', fonts }]),
    )
    expect(product.pass).toBe(false)
    expect(product.violations.map((v) => v.kind)).toEqual(['redistribution-not-permitted'])
    expect(product.violations[0].message).toContain('REVIEW_REQUIRED')

    // A settled `false` fails product distribution just as an unresolved one does.
    const denied = cmdFontsCheck(
      workspace(registryFor('Satoshi', ['satoshi-400.woff2'], false), [
        { slug: 'customer', distribution: 'product', fonts },
      ]),
    )
    expect(denied.pass).toBe(false)
    expect(denied.violations[0].kind).toBe('redistribution-not-permitted')

    // Only a settled `true` clears the product gate.
    const cleared = cmdFontsCheck(
      workspace(registryFor('Satoshi', ['satoshi-400.woff2'], true), [
        { slug: 'customer', distribution: 'product', fonts },
      ]),
    )
    expect(cleared.pass).toBe(true)
  })

  it('test_UAT_FC_REQ-101_outstanding_actions_warn_but_do_not_fail', () => {
    // An open licence action is exactly the state a font sits in while it is
    // cleared for this repo and not yet cleared for the product. Failing on it
    // would make the registry unusable; dropping it would lose the obligation.
    const action = 'Legal review before inclusion in the 1stcontact font menu.'
    const cwd = workspace(registryFor('Satoshi', ['satoshi-400.woff2'], 'REVIEW_REQUIRED', [action]), [
      { slug: 'xgd', fonts: [{ family: 'Satoshi', src: '/assets/satoshi-400.woff2' }] },
    ])

    const report = cmdFontsCheck(cwd)
    expect(report.pass).toBe(true)
    expect(report.warnings).toHaveLength(1)
    expect(report.warnings[0].family).toBe('Satoshi')
    expect(report.warnings[0].actions).toEqual([action])
    expect(report.warnings[0].usedBy).toEqual(['sites/xgd'])
  })

  it('test_UAT_FC_REQ-101_check_spans_both_site_trees_and_a_missing_registry_is_an_error', () => {
    // A licence attaches to the font, not the site, so sandbox reproduction
    // sites are in scope too — they are where capture-derived fonts land.
    const cwd = workspace(registryFor('Satoshi', ['satoshi-400.woff2'], true), [
      { root: 'sites', slug: 'xgd', fonts: [{ family: 'Satoshi', src: '/assets/satoshi-400.woff2' }] },
      { root: 'sandbox', slug: 'repro', fonts: [{ family: 'Karla', src: '/assets/karla.woff2' }] },
    ])
    const report = cmdFontsCheck(cwd)
    expect(report.pass).toBe(false)
    expect(report.violations[0].kind).toBe('unregistered-family')
    expect(report.violations[0].usage?.root).toBe('sandbox')

    // No registry must be a hard error, never a vacuous pass over un-provenanced
    // fonts — that would defeat the whole gate.
    const bare = workspace(null, [
      { slug: 'xgd', fonts: [{ family: 'Satoshi', src: '/assets/satoshi-400.woff2' }] },
    ])
    expect(() => cmdFontsCheck(bare)).toThrowError(/registry not found/i)
  })

  it('test_UAT_FC_REQ-101_site_config_accepts_the_distribution_marker', () => {
    // The marker that arms the product gate is part of the validated site
    // contract, not an ad-hoc field a check reads out of raw JSON.
    for (const distribution of ['internal', 'product'] as const) {
      const candidate = { ...siteJson('s', distribution), pages: [] }
      const result = validateSite(candidate)
      expect(result.ok).toBe(true)
      if (result.ok) expect(result.value.config.distribution).toBe(distribution)
    }
    // Absent is legal and means internal.
    const bare = validateSite({ ...siteJson('s'), pages: [] })
    expect(bare.ok).toBe(true)
    if (bare.ok) expect(bare.value.config.distribution).toBeUndefined()
  })

  it('test_UAT_FC_REQ-101_asset_src_resolves_to_the_registry_file_key', () => {
    // The join between a page's served `src` and the registry's `files[].path`.
    expect(assetBasename('/assets/satoshi-400.woff2')).toBe('satoshi-400.woff2')
    expect(assetBasename('assets/jetbrains-mono.woff2')).toBe('jetbrains-mono.woff2')
    expect(assetBasename('/assets/karla.woff2?v=2')).toBe('karla.woff2')
    expect(assetBasename('https://cdn.example.com/f/oswald.woff2#x')).toBe('oswald.woff2')
  })

  it('test_UAT_FC_REQ-101_unreferenced_font_file_on_disk_fails_the_check', () => {
    // The reference join alone cannot see the class the ticket cares most about:
    // a capture bundle mirrors a third party's fonts into storage/references/,
    // and those bytes sit in the repo whether or not a page points at them —
    // with exactly the redistribution status least likely to be clear. So
    // provenance is demanded of the file, not of the reference to it.
    const cwd = workspace(registryFor('Satoshi', ['satoshi-400.woff2'], true), [
      { root: 'sites', slug: 'xgd', fonts: [{ family: 'Satoshi', src: '/assets/satoshi-400.woff2' }] },
    ])
    writeFontFile(cwd, 'storage/sites/xgd/draft/assets/satoshi-400.woff2')
    expect(cmdFontsCheck(cwd).pass).toBe(true)

    // A capture drops an unregistered face in, referenced by nothing at all.
    writeFontFile(cwd, 'storage/references/example.com/index/assets/aH8kZq2.woff2')
    const report = cmdFontsCheck(cwd)
    expect(report.pass).toBe(false)
    const violation = report.violations.find((v) => v.kind === 'unprovenanced-file')
    expect(violation?.file?.file).toBe('aH8kZq2.woff2')
    expect(violation?.file?.locations).toEqual([
      'storage/references/example.com/index/assets/aH8kZq2.woff2',
    ])
    expect(violation?.message).toContain('aH8kZq2.woff2')

    // Rendered output is derived byte-for-byte from a draft and is gitignored,
    // so it must not be scanned — otherwise every finding doubles and the check
    // starts depending on whether anyone rendered recently.
    writeFontFile(cwd, 'storage/dist/sites/xgd/draft/assets/aH8kZq2.woff2')
    expect(cmdFontsCheck(cwd).violations.filter((v) => v.kind === 'unprovenanced-file')).toHaveLength(
      1,
    )
  })

  // The registry tracks capture-derived faces under `storage/references/`, which
  // is gitignored, so both directions can only agree in a worktree that holds the
  // captures. AC-867 carries the same rule on a constructed tree, everywhere.
  it.skipIf(!existsSync(path.join(REPO_ROOT, 'storage', 'references')))(
    'test_UAT_FC_REQ-101_shipped_registry_accounts_for_every_font_file_in_the_repo', () => {
    // Acceptance criterion 4 as a live gate rather than a sampled list: the real
    // repo's font bytes and the real registry must agree in BOTH directions, so
    // neither a new capture bundle nor a deleted face can drift the record.
    const registry = validateFontRegistry(
      parseYaml(readFileSync(path.join(REPO_ROOT, REGISTRY_REL), 'utf8')),
    )
    expect(registry.ok).toBe(true)
    if (!registry.ok) return

    const registered = new Set(registry.value.fonts.flatMap((f) => f.files.map((x) => x.path)))
    const onDisk = collectFontFilesOnDisk(REPO_ROOT)
    expect(onDisk.length).toBeGreaterThan(0)
    expect(onDisk.filter((f) => !registered.has(f.file)).map((f) => f.locations[0])).toEqual([])
    expect([...registered].filter((p) => !onDisk.some((f) => f.file === p))).toEqual([])
  })
})
