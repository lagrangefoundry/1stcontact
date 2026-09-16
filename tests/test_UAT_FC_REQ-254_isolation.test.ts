/**
 * REQ-254 — the reproduction console is a dev tool and must never be deployable
 * ([[EPIC-12]] §8.6).
 *
 * WHY THIS IS A TEST AND NOT A CONVENTION. Requirement 13 is explicit: "a
 * convention nobody checks is precisely how a dev tool ends up in production."
 * Each assertion below names the deploy path it closes, so a future change that
 * reopens one fails here with the reason attached rather than at a deploy.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const REPO_ROOT = fileURLToPath(new URL('..', import.meta.url))
const CONSOLE_DIR = path.join(REPO_ROOT, 'tools', 'repro-console')
const CONSOLE_PKG = '@1stcontact/repro-console'

interface Manifest {
  name?: string
  private?: boolean
  scripts?: Record<string, string>
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
}

function manifest(dir: string): Manifest {
  return JSON.parse(readFileSync(path.join(dir, 'package.json'), 'utf8')) as Manifest
}

/** Every file under `dir`, relative, skipping installed trees and build output. */
function walk(dir: string, rel = ''): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === 'dist' || entry === '.wrangler') continue
    const abs = path.join(dir, entry)
    const key = rel ? `${rel}/${entry}` : entry
    if (statSync(abs).isDirectory()) out.push(...walk(abs, key))
    else out.push(key)
  }
  return out
}

/** The workspace packages a deploy can reach: everything under apps/ and packages/. */
function deployablePackages(): Array<{ dir: string; manifest: Manifest }> {
  const found: Array<{ dir: string; manifest: Manifest }> = []
  for (const group of ['apps', 'packages']) {
    const root = path.join(REPO_ROOT, group)
    for (const entry of readdirSync(root)) {
      const dir = path.join(root, entry)
      if (statSync(dir).isDirectory()) found.push({ dir, manifest: manifest(dir) })
    }
  }
  return found
}

describe('REQ-254 the console cannot be deployed', () => {
  it('test_UAT_FC_REQ_254_the_console_lives_in_tools_and_is_private', () => {
    // Requirement 11 — `apps/` is where the two deployable units live, and both
    // deploy scripts name their package explicitly. Staying out of `apps/`
    // keeps every deploy path structurally unable to reach the console.
    expect(statSync(CONSOLE_DIR).isDirectory()).toBe(true)
    expect(readdirSync(path.join(REPO_ROOT, 'apps'))).not.toContain('repro-console')
    expect(manifest(CONSOLE_DIR).private).toBe(true)
    expect(manifest(CONSOLE_DIR).name).toBe(CONSOLE_PKG)
  })

  it('test_UAT_FC_REQ_254_the_console_declares_no_build_script', () => {
    // Requirement 11 — `pnpm-workspace.yaml` globs `tools/*`, so the console IS
    // a workspace package and `pnpm -r build` WILL visit it. Having no `build`
    // script is what makes that visit a no-op.
    const workspace = readFileSync(path.join(REPO_ROOT, 'pnpm-workspace.yaml'), 'utf8')
    expect(workspace).toContain('tools/*')
    expect(Object.keys(manifest(CONSOLE_DIR).scripts ?? {})).not.toContain('build')
  })

  it('test_UAT_FC_REQ_254_the_console_ships_no_wrangler_configuration', () => {
    // Requirement 11 — a wrangler config is the thing that makes a directory
    // deployable at all. `bin/build` discovers Workers by finding
    // `apps/*/wrangler.toml`, so one here would be a new deployable unit.
    const configs = walk(CONSOLE_DIR).filter((file) => path.basename(file).startsWith('wrangler.'))
    expect(configs).toEqual([])
  })

  it('test_UAT_FC_REQ_254_nothing_deployable_depends_on_the_console', () => {
    // Requirement 12 — the dependency direction is one-way. The console may
    // import the reproduction engine (that is the thing under test); nothing
    // under `apps/` or `packages/` may reach back.
    for (const pkg of deployablePackages()) {
      const declared = {
        ...pkg.manifest.dependencies,
        ...pkg.manifest.devDependencies,
        ...pkg.manifest.peerDependencies,
      }
      expect(Object.keys(declared), `${pkg.manifest.name} declares a dependency on the console`).not.toContain(
        CONSOLE_PKG,
      )
      // And not by relative path either — `apps/control-app` reaches the engine
      // that way, so a package name check alone would miss the same move here.
      for (const file of walk(pkg.dir)) {
        if (!/\.(ts|tsx|mts|js|mjs|jsx)$/.test(file)) continue
        const source = readFileSync(path.join(pkg.dir, file), 'utf8')
        expect(source.includes('repro-console'), `${pkg.manifest.name}/${file} reaches into the console`).toBe(false)
      }
    }
  })

  it('test_UAT_FC_REQ_254_the_console_is_started_by_its_own_launcher', () => {
    // Requirement 1 — started from the CLI. It is deliberately not a `1c`
    // subcommand: `apps/control-app` imports the engine straight out of
    // `tools/generate/src`, so a CLI that reached into the console would put it
    // into the import graph of the package a deployed Worker reads from.
    const launcher = readFileSync(path.join(REPO_ROOT, 'bin', 'repro-console'), 'utf8')
    expect(launcher).toContain('tools/repro-console/bin/repro-console.mjs')
    expect(statSync(path.join(REPO_ROOT, 'bin', 'repro-console')).mode & 0o111).toBeGreaterThan(0)

    const cli = readFileSync(path.join(REPO_ROOT, 'tools', 'generate', 'src', 'cli', 'index.ts'), 'utf8')
    expect(cli.includes('repro-console')).toBe(false)
  })
})
