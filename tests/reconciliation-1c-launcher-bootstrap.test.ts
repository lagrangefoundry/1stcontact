/**
 * Reconciliation UATs for story-e15a19ef — "1c CLI: flags parse correctly,
 * propagate into sub-commands, and --json emits a clean scriptable document".
 *
 * Guarantee 4, reconciled from bundle-b3b7c399 (BUNDLE-20), plan item 6
 * (REQ-150), commits `258381e2d` and `aa64b3e15`: the launcher every `1c`
 * command boots through is now a plain Vite SSR server it configures itself,
 * and the build framework that used to configure it has left the repository.
 *
 *   • AC-1415 — the launcher takes `createServer` from `vite` by name, pins the
 *     config file off, and names no Astro specifier and no `createRequire` hop.
 *   • AC-1416 — Astro is absent from every workspace manifest, from the
 *     lockfile's importers, from both Vitest project configs and every tsconfig's
 *     ambient types, and is genuinely off disk. `@astrojs/markdown-remark` — a
 *     separately published markdown processor, not the framework — survives.
 *   • AC-1417 — `1c assets` still bootstraps on a fresh checkout by dispatching
 *     ahead of the CLI barrel, and its `--json` output is one clean document.
 *
 * WHY SO MUCH OF THIS IS READ RATHER THAN RUN. A successful boot cannot
 * establish any of it: a plugin that happens to find nothing to transform boots
 * exactly as cleanly as no plugin at all — which was this repository's actual
 * state before the change. The configuration, the manifests and the dispatch
 * order are therefore the evidence, with a real binary run alongside them to
 * prove the configuration described is the one that actually works.
 *
 * The sibling criteria of this story are covered in
 * `reconciliation-1c-cli-output-hygiene.test.ts` (AC-656/657/658/659),
 * `reconciliation-1c-aligned-crops-sandbox-routing.test.ts` (AC-720),
 * `reconciliation-1c-astro-free-render.test.ts` (AC-738/739) and
 * `reconciliation-1c-install-preflight.test.ts` (AC-1013…AC-1017).
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { spawnSync } from 'node:child_process'
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  symlinkSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse as parseYaml } from 'yaml'
import { expectNoAstroContainerToConstruct } from './support/astro-absent'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

const REPO = fileURLToPath(new URL('..', import.meta.url))
const BIN = path.join(REPO, 'tools', 'generate', 'bin', '1c.mjs')

/**
 * A file's executable lines, with comments stripped.
 *
 * Every one of these files deliberately explains in prose what it no longer
 * does — the launcher's header is three paragraphs about Astro — so a raw scan
 * for a forbidden specifier would hit the explanation rather than the code. The
 * same strip the sibling suites use (`reconciliation-workspace-build-artifacts`,
 * `test_UAT_FC_REQ-145_build_artifacts`), so "runtime source" means one thing
 * across the repository.
 */
function runtimeSourceOf(rel: string): string {
  return readFileSync(path.join(REPO, rel), 'utf8')
    .split('\n')
    .filter((line) => !/^\s*(\/\/|\*|\/\*)/.test(line))
    .join('\n')
}

/** Every workspace manifest: the root, plus each member the workspace file globs in. */
function workspaceManifests(): Array<{ rel: string; pkg: Record<string, unknown> }> {
  const globs = (parseYaml(readFileSync(path.join(REPO, 'pnpm-workspace.yaml'), 'utf8')) as {
    packages: string[]
  }).packages
  const rels = ['package.json']
  for (const glob of globs) {
    // `apps/*`, `packages/*`, `tools/*` — enumerated from the workspace file, so
    // a member (or a whole new directory of them) added later is covered without
    // this test being edited. A fixed list is exactly the re-entry the uninstall
    // exists to prevent.
    const dir = glob.replace(/\/\*$/, '')
    for (const entry of readdirSync(path.join(REPO, dir), { withFileTypes: true })) {
      const rel = path.join(dir, entry.name, 'package.json')
      if (entry.isDirectory() && existsSync(path.join(REPO, rel))) rels.push(rel)
    }
  }
  return rels.map((rel) => ({
    rel,
    pkg: JSON.parse(readFileSync(path.join(REPO, rel), 'utf8')) as Record<string, unknown>,
  }))
}

let mirror: string
beforeEach(() => {
  // Realpath'd: on macOS `os.tmpdir()` is `/tmp`, a symlink to `/private/tmp`,
  // and the subprocess reports its cwd resolved. Comparing the report's `outDir`
  // against the resolved path is what makes "it built where it was pointed" a
  // real assertion rather than a platform coincidence.
  mirror = realpathSync(mkdtempSync(path.join(tmpdir(), 'story-e15a19ef-launcher-')))
})
afterEach(() => {
  rmSync(mirror, { recursive: true, force: true })
})

// ── AC-1415: a plain Vite SSR server, configured by the launcher alone ───────

describe('story-e15a19ef — the launcher configures its own plain Vite SSR server', () => {
  it(
    'test_UAT_AC1415_launcher_boots_a_plain_vite_ssr_server_it_configures_itself',
    () => {
      const launcher = runtimeSourceOf(path.join('tools', 'generate', 'bin', '1c.mjs'))

      // The bundler arrives by NAME, from a direct import — not by walking into
      // another package's module graph to find where it was installed.
      expect(launcher).toMatch(/import\s*\{\s*createServer\s*\}\s*from\s*'vite'/)
      expect(launcher).toMatch(/createServer\(/)

      // Declared where the launcher can actually import it at run time: the
      // `dependencies` of the package whose `bin` this file is. `devDependencies`
      // would be a packaging bug that only shows up in an installed tree.
      const generate = JSON.parse(
        readFileSync(path.join(REPO, 'tools', 'generate', 'package.json'), 'utf8'),
      ) as { bin: Record<string, string>; dependencies: Record<string, string> }
      expect(generate.bin['1c']).toBe('./bin/1c.mjs')
      expect(generate.dependencies).toHaveProperty('vite')

      // The config comes from here and NOWHERE else. Vite would otherwise search
      // the root for a `vite.config.*`, which would make the launcher's behaviour
      // depend on a file that exists for some other purpose entirely — and this
      // repo has three of them at the root.
      expect(launcher).toMatch(/configFile:\s*false/)
      expect(existsSync(path.join(REPO, 'vitest.config.mts'))).toBe(true)

      // Still started the way the earlier CLI guarantees require: middleware
      // mode, the HMR WebSocket off (so a running `1c serve` holding 24678 does
      // not make every other invocation log a port clash), and the bundler's own
      // log level high enough that only genuine errors reach a stream.
      expect(launcher).toMatch(/middlewareMode:\s*true/)
      expect(launcher).toMatch(/hmr:\s*false/)
      expect(launcher).toMatch(/ws:\s*false/)
      expect(launcher).toMatch(/logLevel:\s*'error'/)

      // No build-framework plugin anywhere in that configuration, and no hop into
      // another package to locate the bundler. A dynamic specifier counts too: a
      // bundler resolves it whether or not the branch runs.
      expect(launcher).not.toMatch(/getViteConfig/)
      expect(launcher).not.toMatch(/astro/)
      expect(launcher).not.toMatch(/createRequire/)
      expect(launcher).not.toMatch(/import\.meta\.resolve/)

      // …and the configuration just read is the one that actually works: a real
      // command, through the real binary, boots on it and exits 0.
      const res = spawnSync('node', [BIN, 'list'], { cwd: REPO, encoding: 'utf8' })
      expect(res.status, res.stderr).toBe(0)
    },
    120_000,
  )
})

// ── AC-1416: Astro is undeclared, unlocked, unreferenced and off disk ────────

describe('story-e15a19ef — Astro has left the repository', () => {
  it('test_UAT_AC1416_astro_absent_from_manifests_lockfile_configs_and_disk', () => {
    // ── (a) no manifest in the workspace declares it ─────────────────────────
    const manifests = workspaceManifests()
    for (const { rel, pkg } of manifests) {
      for (const field of ['dependencies', 'devDependencies', 'peerDependencies'] as const) {
        const deps = (pkg[field] ?? {}) as Record<string, string>
        expect(Object.keys(deps), `${rel} → ${field}`).not.toContain('astro')
      }
    }
    // Non-vacuous: a scan that found nothing to check proves nothing. The root
    // and the real members were all enumerated.
    expect(manifests.map((m) => m.rel)).toEqual(
      expect.arrayContaining([
        'package.json',
        path.join('apps', 'control-app', 'package.json'),
        path.join('packages', 'framework', 'package.json'),
        path.join('tools', 'generate', 'package.json'),
      ]),
    )
    expect(manifests.length).toBeGreaterThanOrEqual(4)

    // ── (b) the lockfile carries no `astro` importer entry ───────────────────
    const lock = parseYaml(readFileSync(path.join(REPO, 'pnpm-lock.yaml'), 'utf8')) as {
      importers: Record<string, Record<string, Record<string, unknown>>>
    }
    const importerDeps = Object.entries(lock.importers).flatMap(([importer, sections]) =>
      ['dependencies', 'devDependencies', 'peerDependencies'].flatMap((field) =>
        Object.keys(sections[field] ?? {}).map((name) => `${importer} → ${name}`),
      ),
    )
    expect(importerDeps.filter((entry) => entry.endsWith('→ astro'))).toEqual([])
    // Non-vacuous again: the importers really were read, and they carry the
    // package that must SURVIVE the removal.
    expect(importerDeps).toContain('packages/framework → @astrojs/markdown-remark')
    expect(importerDeps).toContain('tools/generate → vite')

    // ── (c) the two must-survive declarations ────────────────────────────────
    // `@astrojs/markdown-remark` is a standalone markdown processor the framework
    // renders callouts with — published separately from, and unrelated to, the
    // framework it shares a scope prefix with. Removing it with Astro would break
    // callouts; it stays.
    const framework = JSON.parse(
      readFileSync(path.join(REPO, 'packages', 'framework', 'package.json'), 'utf8'),
    ) as { dependencies: Record<string, string> }
    expect(framework.dependencies).toHaveProperty('@astrojs/markdown-remark')
    expect(framework.dependencies).not.toHaveProperty('astro')

    // ── (d) no config or type entry names an Astro specifier ─────────────────
    // Comments stripped: the one surviving occurrence anywhere is prose
    // explaining what these files used to be, which is not a reference.
    for (const config of ['vitest.node.config.mts', 'vitest.workers.config.mts']) {
      const source = runtimeSourceOf(config)
      expect(source, config).toMatch(/from 'vitest\/config'/) // took defineConfig from Vitest…
      expect(source, config).not.toMatch(/from ['"]astro/) // …not getViteConfig from Astro.
      expect(source, config).not.toMatch(/import\(['"]astro/)
      expect(source, config).not.toMatch(/getViteConfig/)
    }
    const tsconfigs = [
      'tsconfig.base.json',
      ...manifests
        .map((m) => path.join(path.dirname(m.rel), 'tsconfig.json'))
        .filter((rel) => existsSync(path.join(REPO, rel))),
    ]
    for (const rel of tsconfigs) {
      expect(runtimeSourceOf(rel), rel).not.toMatch(/astro\/client/)
    }
    expect(tsconfigs.length).toBeGreaterThanOrEqual(4)

    // ── (e) genuinely off disk, not merely undeclared ────────────────────────
    // Leaving it installed is how a removed integration comes back: the next
    // config wanting a bundler plugin finds `astro/config` already there and
    // reaches for it. The uninstall is what holds the removal in place.
    expectNoAstroContainerToConstruct()
  })
})

// ── AC-1417: `1c assets` bootstraps ahead of the CLI barrel ──────────────────

describe('story-e15a19ef — 1c assets bootstraps without loading the CLI barrel', () => {
  it(
    'test_UAT_AC1417_assets_dispatches_ahead_of_the_barrel_and_emits_one_json_document',
    () => {
      // ── (a) the cycle the dispatch exists to break, link by link ────────────
      // The barrel reaches the builder transport, which reaches the Worker's
      // router, whose chrome document imports the very import map `assets`
      // generates — and that map is NOT committed, so on a fresh checkout the
      // barrel cannot load at all and `assets` could never run to fix it.
      expect(runtimeSourceOf(path.join('tools', 'generate', 'src', 'cli', 'index.ts'))).toMatch(
        /from '\.\/builder'/,
      )
      expect(runtimeSourceOf(path.join('tools', 'generate', 'src', 'cli', 'builder.ts'))).toMatch(
        /apps\/control-app\/src\/router/,
      )
      expect(runtimeSourceOf(path.join('apps', 'control-app', 'src', 'router.ts'))).toMatch(
        /from '\.\/chrome'/,
      )
      expect(runtimeSourceOf(path.join('apps', 'control-app', 'src', 'chrome.ts'))).toMatch(
        /from '\.\/generated\/importmap\.json'/,
      )
      // …and the map really is absent from a fresh checkout: git tracks nothing
      // under the generated directory. Were it committed, there would be no cycle
      // to break and this whole branch would be dead code.
      const tracked = spawnSync('git', ['ls-files', 'apps/control-app/src/generated/'], {
        cwd: REPO,
        encoding: 'utf8',
      })
      expect(tracked.status).toBe(0)
      expect(tracked.stdout.trim()).toBe('')

      // ── (b) the dispatch itself — the property a populated checkout hides ───
      // On this machine both branches load fine, so only the ORDER can be
      // observed: `assets` is served by the single module that implements it,
      // and the barrel is loaded strictly on the other side of the branch.
      const launcher = runtimeSourceOf(path.join('tools', 'generate', 'bin', '1c.mjs'))
      const loads = [...launcher.matchAll(/ssrLoadModule\('([^']+)'\)/g)].map((m) => ({
        specifier: m[1],
        at: m.index ?? -1,
      }))
      expect(loads.map((l) => l.specifier)).toEqual([
        '/tools/generate/src/cli/assets.ts',
        '/tools/generate/src/cli/index.ts',
      ])
      const branch = launcher.indexOf("argv[0] === 'assets'")
      const otherSide = launcher.indexOf('} else {')
      expect(branch).toBeGreaterThan(-1)
      expect(otherSide).toBeGreaterThan(branch)
      // The assets module is loaded inside the branch …
      expect(loads[0].at).toBeGreaterThan(branch)
      expect(loads[0].at).toBeLessThan(otherSide)
      // … and the barrel strictly after it, so `assets` never touches the barrel.
      expect(loads[1].at).toBeGreaterThan(otherSide)
      // The branch formats its own human and --json output rather than going
      // through the barrel's formatter, which it could not reach.
      const assetsBranch = launcher.slice(branch, otherSide)
      expect(assetsBranch).toMatch(/cmdAssets\(/)
      expect(assetsBranch).toMatch(/formatAssetReport\(/)
      expect(assetsBranch).toMatch(/JSON\.stringify\(/)

      // ── (c) and it runs, emitting one clean document ────────────────────────
      if (!WEBUI_INSTALLED) {
        // The build copies the shared `webui-*` components into `dist-assets`, so
        // it cannot run where they are absent. Same presence gate, and the same
        // visible skip, the other suites that mount them use — a green run that
        // silently proved nothing would be worse than a reported gap.
        console.warn(`story-e15a19ef assets run skipped: ${WEBUI_SKIP_REASON}`)
        return
      }

      // Run against a MIRROR root rather than this checkout. `1c assets` empties
      // `dist-assets` before rebuilding it, and sibling suites serve the real one
      // over a live builder origin — wiping it mid-run would fail them for
      // reasons that have nothing to do with them. The mirror symlinks every
      // directory the build READS and owns every path it WRITES, so the command
      // is the real one and this checkout is untouched.
      const link = (rel: string): void => {
        const dest = path.join(mirror, rel)
        mkdirSync(path.dirname(dest), { recursive: true })
        symlinkSync(path.join(REPO, rel), dest)
      }
      link(path.join('packages', 'site-schema'))
      link(path.join('packages', 'framework', 'src', 'l1'))
      link(path.join('apps', 'control-app', 'src', 'builder'))
      // The modules directory is written into (`module-assets.ts`), so it is a
      // real directory here with each module symlinked in — a symlinked generated
      // file would be followed and clobber this checkout's copy.
      const modules = path.join('packages', 'framework', 'src', 'modules')
      mkdirSync(path.join(mirror, modules), { recursive: true })
      for (const entry of readdirSync(path.join(REPO, modules))) {
        if (entry === 'module-assets.ts') continue
        symlinkSync(path.join(REPO, modules, entry), path.join(mirror, modules, entry))
      }

      // Human mode: it exits 0 …
      const human = spawnSync('node', [BIN, 'assets'], { cwd: mirror, encoding: 'utf8' })
      expect(human.status, human.stderr).toBe(0)
      expect(human.stdout).toContain('out        ')

      // … and `--json` satisfies the scriptable-output contract: nothing on
      // stderr, and stdout is exactly one parseable document.
      const json = spawnSync('node', [BIN, 'assets', '--json'], { cwd: mirror, encoding: 'utf8' })
      expect(json.status, json.stderr).toBe(0)
      expect(json.stderr).toBe('')
      const report = JSON.parse(json.stdout) as {
        outDir: string
        builderFiles: number
        webuiFiles: number
        frameworkFiles: string[]
        imports: Record<string, string>
        styles: string[]
        aiWorkersEntry: string
        modules: { file: string }
      }

      // The real report, not an empty object that would also parse.
      expect(report.builderFiles).toBeGreaterThan(0)
      expect(report.webuiFiles).toBeGreaterThan(0)
      expect(Object.keys(report.imports).length).toBeGreaterThan(0)
      expect(report.frameworkFiles).toEqual([
        'edit-client.js',
        'site-schema-edit.js',
        'site-schema-shade.js',
      ])
      expect(report.modules.file).toBe('packages/framework/src/modules/module-assets.ts')

      // It built where it was pointed — which is also the proof this checkout's
      // own `dist-assets` was never touched.
      expect(report.outDir).toBe(path.join(mirror, 'apps', 'control-app', 'dist-assets'))
      expect(existsSync(path.join(report.outDir, 'builder'))).toBe(true)
      expect(existsSync(path.join(mirror, 'apps/control-app/src/generated/importmap.json'))).toBe(
        true,
      )
    },
    180_000,
  )
})
