/**
 * [[REQ-316]] — exactly one `workerd` resolves in this tree.
 *
 * On 2026-09-24 `1c builder` died before serving anything with
 *
 *     table _cf_ALARM has 3 columns but 2 values were supplied
 *
 * naming a table that appears in no schema this repository owns. `.wrangler/state`
 * is workerd's own store; `wrangler` and `miniflare` were declared with separate
 * `^` ranges, those ranges drifted a generation apart, and the newer runtime —
 * reached through `miniflare` by `1c fonts seed` — migrated both apps' stores
 * forward silently. The older one then crashed on them.
 *
 * These UATs pin the ticket's acceptance in both halves. The DECLARATION: both
 * packages are pinned to exact versions in every manifest that names them, and
 * the committed lockfile records those exact specifiers, so a bump is a
 * reviewable edit rather than a resolution that happens overnight. The CHECK: a
 * tree resolving one runtime passes silently, a tree resolving two refuses,
 * the refusal names every version AND the package that brought it, it names the
 * manifests and `pnpm install` as the remedy, it travels the CLI's `ENVIRONMENT`
 * failure contract, and it is scoped to the commands that open the store.
 *
 * The walk is driven against synthetic `node_modules` trees and an injected
 * scan, so the suite never mutates a real install.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import {
  assertOneWorkerd,
  checkWorkerd,
  scanWorkerd,
  workerdGateKey,
  workspaceManifests,
  WORKERD_GATED_COMMANDS,
  type WorkerdScan,
} from '../tools/generate/src/cli/workerd'
import { checkInstall } from '../tools/generate/src/cli/preflight'
import { CommandError, EXIT_CODES } from '../tools/generate/src/cli/errors'

const REPO = path.resolve(__dirname, '..')

/**
 * Whether this checkout's `node_modules` is the tree its lockfile describes —
 * REQ-44's own drift signal, read at COLLECTION so the one UAT that asserts
 * against the live install skips with its reason visible rather than deciding
 * inside its body.
 */
const installedAtLockfile = checkInstall({ repoRoot: REPO, required: [] }).ok

/** The manifests this repository declares `wrangler` or `miniflare` in. */
const PINNED = [
  'package.json',
  'apps/control-app/package.json',
  'apps/public-site/package.json',
  'tools/generate/package.json',
] as const

// -- part 1: the declaration, in this repository ------------------------------

describe('REQ-316 — wrangler and miniflare are pinned exactly', () => {
  it('test_UAT_FC_REQ-316_manifests_declare_exact_versions', () => {
    // A caret on each is what let the two drift independently. An exact version
    // is not a stronger claim about correctness — it converts floating into
    // manual, which is the state the check in part 2 can then guard.
    const seen: string[] = []
    for (const rel of PINNED) {
      const pkg = JSON.parse(readFileSync(path.join(REPO, rel), 'utf8')) as {
        dependencies?: Record<string, string>
        devDependencies?: Record<string, string>
      }
      const declared = { ...pkg.dependencies, ...pkg.devDependencies }
      for (const name of ['wrangler', 'miniflare']) {
        const range = declared[name]
        if (range === undefined) continue
        seen.push(`${rel}:${name}`)
        expect(range, `${rel} declares ${name} as '${range}'`).toMatch(/^\d+\.\d+\.\d+$/)
      }
    }
    // The four manifests named in the ticket, and no silent narrowing of them:
    // a loop that found nothing would pass the assertion above vacuously.
    expect(seen.sort()).toEqual([
      'apps/control-app/package.json:wrangler',
      'apps/public-site/package.json:wrangler',
      'package.json:miniflare',
      'package.json:wrangler',
      'tools/generate/package.json:miniflare',
    ])
  })

  it('test_UAT_FC_REQ-316_no_manifest_in_the_workspace_floats_either_package', () => {
    // Generalised over the workspace rather than over the four known manifests:
    // a fifth package that starts declaring a runtime must be pinned by the same
    // rule, and a check that only knew about today's four would not say so.
    for (const rel of workspaceManifests(REPO)) {
      const pkg = JSON.parse(readFileSync(path.join(REPO, rel), 'utf8')) as {
        dependencies?: Record<string, string>
        devDependencies?: Record<string, string>
      }
      const declared = { ...pkg.dependencies, ...pkg.devDependencies }
      for (const name of ['wrangler', 'miniflare', 'workerd']) {
        if (declared[name] === undefined) continue
        expect(declared[name], `${rel} declares ${name}`).toMatch(/^\d+\.\d+\.\d+$/)
      }
    }
  })

  it('test_UAT_FC_REQ-316_lockfile_records_the_exact_specifiers', () => {
    // The manifest is what a human edits; the lockfile is what `pnpm install
    // --frozen-lockfile` enforces. A pinned manifest whose lockfile still records
    // a caret is a pin that no install has ever been asked to honour.
    const lock = readFileSync(path.join(REPO, 'pnpm-lock.yaml'), 'utf8')
    const specifiers = [...lock.matchAll(/^\s+(wrangler|miniflare):\n\s+specifier: (.+)$/gm)]
    expect(specifiers.length).toBeGreaterThanOrEqual(5)
    for (const [, name, spec] of specifiers) {
      expect(spec.trim(), `lockfile specifier for ${name}`).toMatch(/^\d+\.\d+\.\d+$/)
    }
  })
})

// -- part 2: the check --------------------------------------------------------

let root: string

beforeEach(() => {
  root = mkdtempSync(path.join(tmpdir(), 'req316-'))
})
afterEach(() => {
  rmSync(root, { recursive: true, force: true })
})

/** Write a package directory in the virtual store, with a package.json. */
function storePkg(id: string, name: string, version: string): string {
  const dir = path.join(root, 'node_modules', '.pnpm', id, 'node_modules', name)
  mkdirSync(dir, { recursive: true })
  writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ name, version }))
  return dir
}

/** Link `name` into an importer directory's own `node_modules`. */
function link(from: string, name: string, target: string): void {
  const nm = path.join(from, 'node_modules')
  mkdirSync(nm, { recursive: true })
  symlinkSync(target, path.join(nm, name))
}

/**
 * Link a dependency BESIDE a store package, which is how pnpm expresses it: a
 * package and everything it depends on share one `node_modules`, and Node finds
 * the dependency by walking up out of the package rather than down into it.
 */
function sibling(pkgDir: string, name: string, target: string): void {
  symlinkSync(target, path.join(path.dirname(pkgDir), name))
}

/**
 * A synthetic pnpm tree: a root importer declaring `deps`, each of which brings
 * the `workerd` version given. Mirrors the real layout — importer symlinks into
 * `.pnpm`, and each store package's dependency parked beside it.
 */
function tree(deps: Record<string, { version: string; workerd?: string }>): void {
  writeFileSync(
    path.join(root, 'package.json'),
    JSON.stringify({
      name: 'synthetic',
      devDependencies: Object.fromEntries(
        Object.entries(deps).map(([name, d]) => [name, d.version]),
      ),
    }),
  )
  writeFileSync(path.join(root, 'pnpm-workspace.yaml'), 'packages:\n  - apps/*\n')
  for (const [name, d] of Object.entries(deps)) {
    const dir = storePkg(`${name}@${d.version}`, name, d.version)
    if (d.workerd !== undefined) {
      sibling(dir, 'workerd', storePkg(`workerd@${d.workerd}`, 'workerd', d.workerd))
    }
    link(root, name, dir)
  }
}

describe('REQ-316 — the workerd preflight', () => {
  it('test_UAT_FC_REQ-316_one_runtime_passes_silently', () => {
    tree({
      wrangler: { version: '4.111.0', workerd: '1.20260710.1' },
      miniflare: { version: '4.20260710.0', workerd: '1.20260710.1' },
    })
    const report = checkWorkerd({ repoRoot: root })
    expect(report.ok).toBe(true)
    expect(report.versions).toEqual(['1.20260710.1'])
    // Silent on success: nothing is thrown for any gated command.
    for (const command of WORKERD_GATED_COMMANDS) {
      expect(() => assertOneWorkerd(command, { repoRoot: root })).not.toThrow()
    }
  })

  it('test_UAT_FC_REQ-316_two_runtimes_are_named_with_what_brought_each', () => {
    // The observed split, exactly: two ranges over the same runtime, resolved a
    // generation apart. The operator's next question is "which one do I change",
    // so the report has to carry the dependant, not just the versions.
    tree({
      wrangler: { version: '4.106.0', workerd: '1.20260630.1' },
      miniflare: { version: '4.20260710.0', workerd: '1.20260710.1' },
    })
    const report = checkWorkerd({ repoRoot: root })
    expect(report.ok).toBe(false)
    expect(report.versions).toEqual(['1.20260630.1', '1.20260710.1'])
    expect(report.instances).toEqual([
      { version: '1.20260630.1', broughtBy: 'wrangler@4.106.0', declaredIn: ['package.json'] },
      {
        version: '1.20260710.1',
        broughtBy: 'miniflare@4.20260710.0',
        declaredIn: ['package.json'],
      },
    ])
  })

  it('test_UAT_FC_REQ-316_transitive_bringers_are_reported_but_marked_uneditable', () => {
    // A split shows up on more rows than an operator can edit: `wrangler` carries
    // its own `miniflare`, and peers take `workerd` too. Dropping those rows
    // would hide that both generations are live; leaving them unmarked would
    // leave the operator guessing which row is theirs to change. So they are
    // reported, ordered after the declared ones, and carry no manifest.
    tree({
      wrangler: { version: '4.106.0', workerd: '1.20260630.1' },
      miniflare: { version: '4.20260710.0', workerd: '1.20260710.1' },
    })
    // A peer consumer of the old runtime, reached through wrangler's own scope.
    const peer = storePkg('unenv-preset@2.16.1', 'unenv-preset', '2.16.1')
    symlinkSync(
      peer,
      path.join(root, 'node_modules', '.pnpm', 'wrangler@4.106.0', 'node_modules', 'unenv-preset'),
    )
    symlinkSync(
      path.join(root, 'node_modules', '.pnpm', 'workerd@1.20260630.1', 'node_modules', 'workerd'),
      path.join(path.dirname(peer), 'workerd'),
    )
    const report = checkWorkerd({ repoRoot: root })
    expect(report.ok).toBe(false)
    expect(report.instances).toEqual([
      { version: '1.20260630.1', broughtBy: 'wrangler@4.106.0', declaredIn: ['package.json'] },
      { version: '1.20260630.1', broughtBy: 'unenv-preset@2.16.1', declaredIn: [] },
      {
        version: '1.20260710.1',
        broughtBy: 'miniflare@4.20260710.0',
        declaredIn: ['package.json'],
      },
    ])
    // The remedy still names only what can be edited.
    expect(report.manifests).toEqual(['package.json'])
  })

  it('test_UAT_FC_REQ-316_refusal_names_every_version_its_bringer_and_the_remedy', () => {
    tree({
      wrangler: { version: '4.106.0', workerd: '1.20260630.1' },
      miniflare: { version: '4.20260710.0', workerd: '1.20260710.1' },
    })
    let err: unknown
    try {
      assertOneWorkerd('builder', { repoRoot: root })
    } catch (e) {
      err = e
    }
    expect(err).toBeInstanceOf(CommandError)
    const e = err as CommandError
    // The whole table, so nothing has to be re-derived by hand.
    expect(e.message).toContain('workerd 1.20260630.1')
    expect(e.message).toContain('wrangler@4.106.0')
    expect(e.message).toContain('workerd 1.20260710.1')
    expect(e.message).toContain('miniflare@4.20260710.0')
    // Which command refused, and why the fault is unreadable where it lands.
    expect(e.message).toContain("'1c builder'")
    expect(e.message).toContain('.wrangler/state')
    expect(e.message).toContain('_cf_ALARM')
    // The remedy, in REQ-44's and REQ-144's voice: the manifests, then the command.
    expect(e.hint).toContain('package.json')
    expect(e.hint).toContain('pnpm install')
    // The CLI's environment failure contract, so it exits 6 rather than 1.
    expect(e.code).toBe('ENVIRONMENT')
    expect(EXIT_CODES[e.code]).toBe(6)
  })

  it('test_UAT_FC_REQ-316_orphaned_store_version_is_not_a_finding', () => {
    // A virtual store keeps versions nothing links any more. Counting one of
    // those would refuse a tree that is completely healthy — so the walk follows
    // the links an importer actually resolves through, and never descends into
    // `.pnpm` itself.
    tree({ wrangler: { version: '4.111.0', workerd: '1.20260710.1' } })
    storePkg('workerd@1.20260630.1', 'workerd', '1.20260630.1')
    storePkg('wrangler@4.106.0', 'wrangler', '4.106.0')
    const report = checkWorkerd({ repoRoot: root })
    expect(report.ok).toBe(true)
    expect(report.versions).toEqual(['1.20260710.1'])
  })

  it('test_UAT_FC_REQ-316_uninstalled_tree_is_left_to_the_install_preflight', () => {
    // Zero copies is an UNINSTALLED tree, which REQ-44 already reports exactly —
    // naming the lockfile and the install. Refusing here too would give an
    // operator two refusals for one fault and no order to fix them in.
    tree({})
    const report = checkWorkerd({ repoRoot: root })
    expect(report.ok).toBe(true)
    expect(report.versions).toEqual([])
    expect(() => assertOneWorkerd('builder', { repoRoot: root })).not.toThrow()
  })

  it('test_UAT_FC_REQ-316_gate_is_scoped_to_the_commands_that_open_the_store', () => {
    const skewed: WorkerdScan = () => [
      { version: '1.20260630.1', broughtBy: 'wrangler@4.106.0' },
      { version: '1.20260710.1', broughtBy: 'miniflare@4.20260710.0' },
    ]
    // The store-openers: `wrangler dev`, the seeder, and the deliberate way back
    // to empty.
    for (const command of ['builder', 'reset', 'fonts seed', 'fonts mirror']) {
      expect(() => assertOneWorkerd(command, { repoRoot: root, scan: skewed })).toThrow(CommandError)
    }
    // Everything else reads and writes files. A skew it cannot cause must never
    // block it — that is REQ-44's COMMAND_DEPS rule, and the reason this gate is
    // per-command rather than global.
    for (const command of ['render', 'capture', 'page', 'preflight', 'fonts check', 'fonts publish']) {
      expect(() => assertOneWorkerd(command, { repoRoot: root, scan: skewed })).not.toThrow()
    }
  })

  it('test_UAT_FC_REQ-316_subcommand_selects_the_gate_for_fonts', () => {
    // `1c fonts` is seven verbs and only two of them open a store. The key a
    // dispatch builds has to carry the subcommand, or refreshing a catalogue
    // would be refused on a runtime it never starts.
    expect(workerdGateKey('fonts', 'seed')).toBe('fonts seed')
    expect(workerdGateKey('fonts', 'mirror')).toBe('fonts mirror')
    expect(workerdGateKey('fonts', 'check')).toBe('fonts')
    expect(workerdGateKey('fonts', undefined)).toBe('fonts')
    // A verb with no store-opening subcommand keeps its own key whatever follows.
    expect(workerdGateKey('builder', '--port')).toBe('builder')
    expect(workerdGateKey('reset', undefined)).toBe('reset')
  })

  it('test_UAT_FC_REQ-316_remedy_names_the_manifests_that_declare_the_bringers', () => {
    // "Pin them" is only actionable with the list of files to edit. Derived from
    // the findings rather than hardcoded, so it stays right when a new workspace
    // package starts declaring one.
    mkdirSync(path.join(root, 'apps', 'site'), { recursive: true })
    writeFileSync(
      path.join(root, 'apps', 'site', 'package.json'),
      JSON.stringify({ name: 'site', devDependencies: { wrangler: '^4.106.0' } }),
    )
    tree({
      wrangler: { version: '4.106.0', workerd: '1.20260630.1' },
      miniflare: { version: '4.20260710.0', workerd: '1.20260710.1' },
    })
    const report = checkWorkerd({ repoRoot: root })
    expect(report.manifests).toEqual(['package.json', path.join('apps', 'site', 'package.json')])
    try {
      assertOneWorkerd('fonts seed', { repoRoot: root })
      expect.unreachable('a skewed tree must refuse')
    } catch (err) {
      expect((err as CommandError).hint).toContain(path.join('apps', 'site', 'package.json'))
    }
  })

  it('test_UAT_FC_REQ-316_workspace_packages_are_discovered_not_listed', () => {
    // Discovered from `pnpm-workspace.yaml`, so a workspace package that brings
    // its own runtime is covered by existing rather than by someone remembering
    // to extend a constant.
    writeFileSync(path.join(root, 'package.json'), JSON.stringify({ name: 'synthetic' }))
    writeFileSync(path.join(root, 'pnpm-workspace.yaml'), "packages:\n  - apps/*\n  - tools/*\nallowBuilds:\n  workerd: true\n")
    for (const rel of ['apps/site', 'tools/gen']) {
      mkdirSync(path.join(root, rel), { recursive: true })
      writeFileSync(path.join(root, rel, 'package.json'), JSON.stringify({ name: path.basename(rel) }))
    }
    expect(workspaceManifests(root)).toEqual([
      'package.json',
      path.join('apps', 'site', 'package.json'),
      path.join('tools', 'gen', 'package.json'),
    ])

    // And the runtime a workspace package brings on its own is found by the walk.
    const dir = storePkg('miniflare@4.20260710.0', 'miniflare', '4.20260710.0')
    sibling(dir, 'workerd', storePkg('workerd@1.20260710.1', 'workerd', '1.20260710.1'))
    link(path.join(root, 'tools', 'gen'), 'miniflare', dir)
    expect(scanWorkerd(root)).toEqual([
      { version: '1.20260710.1', broughtBy: 'miniflare@4.20260710.0' },
    ])
  })

  it('test_UAT_FC_REQ-316_nested_node_modules_layout_is_walked_too', () => {
    // pnpm parks a dependency BESIDE its dependant; npm and yarn nest it
    // underneath. The walk follows both, because a check that only understood
    // one layout would report a clean tree on the other — the loudest possible
    // way to be wrong, since silence is what success looks like.
    writeFileSync(
      path.join(root, 'package.json'),
      JSON.stringify({ name: 'nested', devDependencies: { wrangler: '4.106.0' } }),
    )
    const dir = path.join(root, 'node_modules', 'wrangler')
    mkdirSync(path.join(dir, 'node_modules', 'workerd'), { recursive: true })
    writeFileSync(
      path.join(dir, 'package.json'),
      JSON.stringify({ name: 'wrangler', version: '4.106.0' }),
    )
    writeFileSync(
      path.join(dir, 'node_modules', 'workerd', 'package.json'),
      JSON.stringify({ name: 'workerd', version: '1.20260630.1' }),
    )
    expect(scanWorkerd(root)).toEqual([
      { version: '1.20260630.1', broughtBy: 'wrangler@4.106.0' },
    ])
  })

  it('test_UAT_FC_REQ-316_gate_runs_at_dispatch_before_any_command_body', () => {
    // The refusal has to arrive BEFORE the store is opened — a check that fires
    // once workerd has already migrated it has watched the damage happen, and
    // the migration is effectively one-way. So the call belongs in the dispatch
    // preamble beside REQ-44's, not inside the three command bodies where a
    // fourth store-opening verb could quietly be added without one.
    const cli = readFileSync(path.join(REPO, 'tools/generate/src/cli/index.ts'), 'utf8')
    const gate = cli.indexOf('assertOneWorkerd(')
    const install = cli.indexOf('assertInstall(command)')
    const dispatch = cli.indexOf('switch (command) {')
    expect(gate, 'the dispatch preamble calls assertOneWorkerd').toBeGreaterThan(-1)
    expect(gate).toBeGreaterThan(install)
    expect(gate).toBeLessThan(dispatch)
    // Keyed with the subcommand, so `fonts seed` is gated and `fonts check` is not.
    expect(cli.slice(gate, gate + 200)).toContain('workerdGateKey(command, rest[0])')
  })

  // The invariant asserted against the checkout the suite is running in — the
  // thing nothing asserted on 2026-09-24.
  //
  // GATED ON THE TREE BEING INSTALLED AT ITS LOCKFILE, and gated at COLLECTION
  // so the reason is visible in the report rather than decided inside the body.
  // The subject of this UAT is a resolution, and a `node_modules` that lags its
  // lockfile has no settled resolution to be right or wrong about — a worktree
  // cut from a checkout whose manifests have since moved is exactly that. REQ-44
  // owns reporting it, and naming one fault from two checks is how an operator
  // comes to fix the wrong one first.
  it.skipIf(!installedAtLockfile)('test_UAT_FC_REQ-316_this_repository_resolves_one_runtime', () => {
    const report = checkWorkerd({ repoRoot: REPO })
    // The table is the failure message, so a red here is already the diagnosis
    // rather than a count an operator has to go and re-derive.
    const table = report.instances.map((i) => `workerd ${i.version} <- ${i.broughtBy}`).join('; ')
    expect(report.versions.length, table).toBeLessThanOrEqual(1)
  })
})
