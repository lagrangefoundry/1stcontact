import { spawnSync } from 'node:child_process'
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { expectNoAstroContainerToConstruct } from './support/astro-absent'

/**
 * REQ-150 — the `1c` launcher boots a plain Vite SSR server, and Astro is gone
 * from the repository.
 *
 * The launcher is an entry point and nothing about it is observable in-process:
 * it configures a Vite server, loads the CLI through `ssrLoadModule`, and exits.
 * So every behavioural claim here drives the real `node tools/generate/bin/1c.mjs`
 * as a subprocess and reads its exit code and its two streams — which is also the
 * only way to see boot chatter at all, since anything the server says while
 * starting is said before a single line of CLI code runs.
 *
 * WHY THE DEPENDENCY CLAIM IS PART OF THE SAME TICKET. The Astro Vite plugin was
 * the last thing in the repo that needed `astro` at runtime; REQ-148 had already
 * removed the `.astro` files it existed to transform. Leaving the dependency
 * declared after removing its only consumer is how a "removed" integration comes
 * back — the next config that wants a Vite plugin finds `astro/config` already
 * installed and reaches for it. So the launcher rewrite and the uninstall are one
 * change, and the last test here is what holds the uninstall in place.
 */

const repoRoot = fileURLToPath(new URL('..', import.meta.url))
const LAUNCHER = path.join(repoRoot, 'tools', 'generate', 'bin', '1c.mjs')
const launcherSource = readFileSync(LAUNCHER, 'utf8')

/**
 * The launcher with its comments removed.
 *
 * The absence assertions below have to run against this rather than the raw
 * file: the launcher's header explains at length what it no longer does, and
 * naming `getViteConfig` and `astro` in that explanation is the point of writing
 * it. Only executable lines can put a dependency back. (REQ-145's render-path
 * test strips comments for the same reason.)
 */
const launcherCode = launcherSource
  .split('\n')
  .filter((line) => !/^\s*(\/\/|\*|\/\*)/.test(line))
  .join('\n')

/** Drive the real binary from the repo root, the way the operator does. */
function run1c(...argv: string[]): { status: number | null; stdout: string; stderr: string } {
  const res = spawnSync('node', [LAUNCHER, ...argv], { cwd: repoRoot, encoding: 'utf8' })
  return { status: res.status, stdout: res.stdout, stderr: res.stderr }
}

/** Every `package.json` the workspace actually owns — root plus each member. */
function workspaceManifests(): Array<{ rel: string; json: Record<string, unknown> }> {
  const out = [{ rel: 'package.json', json: readManifest('package.json') }]
  for (const group of ['apps', 'packages', 'tools']) {
    const dir = path.join(repoRoot, group)
    if (!existsSync(dir)) continue
    for (const member of readdirSync(dir)) {
      const rel = path.join(group, member, 'package.json')
      if (existsSync(path.join(repoRoot, rel))) out.push({ rel, json: readManifest(rel) })
    }
  }
  return out
}

function readManifest(rel: string): Record<string, unknown> {
  return JSON.parse(readFileSync(path.join(repoRoot, rel), 'utf8'))
}

function deps(json: Record<string, unknown>): Record<string, string> {
  return {
    ...((json.dependencies as Record<string, string>) ?? {}),
    ...((json.devDependencies as Record<string, string>) ?? {}),
    ...((json.peerDependencies as Record<string, string>) ?? {}),
  }
}

describe('REQ-150 — the 1c launcher runs on plain Vite', () => {
  it('test_UAT_FC_REQ-150_the_launcher_configures_vite_with_no_astro_plugin', () => {
    // AC-1, read off the one file that decides it. A successful boot cannot
    // distinguish "no Astro plugin" from "an Astro plugin that happened to find
    // nothing to do" — that is precisely the state the repo was in between
    // REQ-148 and this ticket, and it booted fine. The specifier is the evidence.
    expect(launcherCode).toContain("import { createServer } from 'vite'")
    expect(launcherCode).toMatch(/await createServer\(\{/)

    // Nothing Astro-shaped survives: not the config helper, not the import, and
    // not the `createRequire(import.meta.resolve('astro/package.json'))` hop that
    // existed only because `vite` had to be found through Astro's module graph.
    expect(launcherCode).not.toContain('getViteConfig')
    expect(launcherCode).not.toMatch(/['"]astro/)
    expect(launcherCode).not.toContain('createRequire')

    // And the server is still configured the way the earlier tickets require:
    // middleware mode with the HMR WebSocket off (REQ-37), and Vite's own logger
    // quiet enough that only genuine errors reach a stream.
    expect(launcherCode).toContain('middlewareMode: true')
    expect(launcherCode).toContain('ws: false')
    expect(launcherCode).toContain("logLevel: 'error'")
  })

  it('test_UAT_FC_REQ-150_a_quiet_command_boots_with_both_streams_clean', () => {
    // AC-2. `help` and `list` are non-rendering: everything either stream carries
    // is either the command's own output or boot noise, with nothing in between
    // to explain an ambiguous byte away.
    //
    // stderr is asserted EMPTY, and that is the sharper half of the pair. The
    // launcher diverts stdout to stderr for the whole of the server's startup, so
    // anything the bootstrap emits — on either stream, from any source — arrives
    // here. An empty stderr therefore says something stronger than "the Astro
    // warning is suppressed": it says the boot produced no output to divert.
    for (const command of ['help', 'list']) {
      const res = run1c(command)

      expect(res.status, command).toBe(0)
      expect(res.stderr, command).toBe('')

      // stdout carries the command's own output and only that.
      expect(res.stdout.trim().length, command).toBeGreaterThan(0)
      expect(res.stdout, command).not.toContain('[vite]')
      expect(res.stdout, command).not.toContain('[WARN]')
      expect(res.stdout, command).not.toContain('Missing pages directory')
    }

    // Non-vacuous: `help` really produced the usage text, so the clean streams
    // above were not bought by a command that printed nothing.
    expect(run1c('help').stdout).toContain('1c —')
  }, 120_000)

  it('test_UAT_FC_REQ-150_a_json_command_emits_exactly_one_document', () => {
    // AC-2's other half, and the reason the stdout diversion is kept rather than
    // deleted with the rest of the Astro workaround: a `--json` command's
    // contract is that its stdout IS the document. One stray boot line prepended
    // to it makes the whole thing unparseable to the caller, so the assertion is
    // `JSON.parse` on the raw stream, not a substring search.
    const res = run1c('assets', '--json')

    expect(res.status).toBe(0)
    expect(res.stderr).toBe('')

    const report = JSON.parse(res.stdout)
    // A real report, not an empty object that would parse just as happily.
    expect(Object.keys(report)).toContain('modules')
    expect(Object.keys(report)).toContain('imports')
  }, 120_000)

  it('test_UAT_FC_REQ-150_assets_still_bootstraps_without_the_cli_barrel', () => {
    // AC-3 — REQ-145's cycle, preserved across the rewrite. `1c assets` generates
    // `apps/control-app/src/generated/importmap.json`, which the chrome document
    // imports, which the CLI barrel reaches; so on a checkout where that file does
    // not exist yet, loading the barrel to run `assets` cannot work. The launcher
    // breaks the cycle by loading `assets.ts` alone.
    //
    // ASSERTED ON THE SOURCE, deliberately. On a populated checkout both paths
    // succeed, so a passing run distinguishes nothing; the specifier the `assets`
    // branch names is the property, exactly as REQ-145 argued for `render.ts`.
    // (Reproducing the empty state for real would mean moving the generated
    // directory aside mid-suite, which several sibling test files import through
    // — a shared-state race, not a stronger test.)
    const assetsBranch = launcherCode.slice(launcherCode.indexOf("argv[0] === 'assets'"))
    const barrelBranch = launcherCode.indexOf("ssrLoadModule('/tools/generate/src/cli/index.ts')")

    expect(assetsBranch).toContain("ssrLoadModule('/tools/generate/src/cli/assets.ts')")
    // The barrel is loaded only on the OTHER side of that branch.
    expect(barrelBranch).toBeGreaterThan(launcherCode.indexOf('} else {'))

    // And the command it protects actually runs.
    expect(run1c('assets').status).toBe(0)
  }, 120_000)

  it('test_UAT_FC_REQ-150_astro_is_declared_nowhere_in_the_workspace', () => {
    // AC-1's other direction. The plugin cannot come back through a config that
    // finds the package already installed if the package is not installed.
    const manifests = workspaceManifests()
    expect(manifests.length).toBeGreaterThan(3) // root plus real members

    for (const { rel, json } of manifests) {
      expect(Object.keys(deps(json)), rel).not.toContain('astro')
    }

    // …and it is genuinely off disk, not merely undeclared.
    expectNoAstroContainerToConstruct()

    // The two dependencies that MUST survive the removal, because neither is
    // Astro-the-framework: `@astrojs/markdown-remark` is a standalone markdown
    // processor the framework renders callouts with, and `vite` is now named
    // directly by the launcher instead of being borrowed from Astro's graph.
    expect(deps(readManifest('packages/framework/package.json'))).toHaveProperty(
      '@astrojs/markdown-remark',
    )
    expect(deps(readManifest('tools/generate/package.json'))).toHaveProperty('vite')
  })
})
