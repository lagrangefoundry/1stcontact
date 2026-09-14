/**
 * Reconciliation UAT for story-e15a19ef — "1c CLI: flags parse correctly,
 * propagate into sub-commands, and --json emits a clean scriptable document".
 *
 * AC-1790 — `1c crop` is an offline verb: it is never gated, and it crops on a
 * tree with nothing installed.
 *
 * This is the *behavioural* consequence of REQ-156 (bundle-8e1807f6, plan item
 * 3, commit f5807330), which replaced the native imaging dependency with an
 * in-repo PNG codec and so left `crop` with no declared package it could be
 * missing. The entry was **removed** from the preflight map rather than emptied:
 * a gate on an empty requirement can only produce a refusal the operator has no
 * remedy for.
 *
 * The sibling criterion AC-1017 (`reconciliation-1c-install-preflight.test.ts`)
 * pins the *structural* fact — the gated set as a whole, from which `crop` is
 * absent. That criterion would still hold if `crop`'s entry had merely been
 * emptied rather than removed. This one pins what a caller can actually observe:
 * that `1c crop` runs to completion on a tree where neither the browser
 * automation package nor any imaging package resolves.
 *
 * Two boundaries, deliberately:
 *
 *   - `assertInstall` — the exact call dispatch makes — against synthetic trees
 *     with an injected resolver, for the tree shapes a live cwd cannot express
 *     (nothing resolves; only the browser package resolves; never installed at
 *     all). The contrast is drawn against `diff` on the *same* tree, so what is
 *     being demonstrated is the difference between two verbs and not between two
 *     trees.
 *   - the real `1c` binary, with `playwright` and `sharp` made genuinely
 *     unresolvable by a module-resolution shim, cropping a real PNG. In-process
 *     the CLI module is already loaded, so it can show that `crop` is not
 *     *refused* but not that it still *works* when the packages are actually
 *     gone — only the binary can tell those apart.
 *
 * Nothing here touches the repo's own `node_modules` or its lockfile.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { assertInstall, COMMAND_DEPS, INSTALL_COMMAND, INSTALLED_LOCKFILE_REL, LOCKFILE_REL } from '../tools/generate/src/cli'
import type { Resolver } from '../tools/generate/src/cli'
import { CommandError, EXIT_CODES } from '../tools/generate/src/cli/errors'
import { encodePng, pngDimensions } from '../tools/generate/src/cli/png'

const LOCK = "lockfileVersion: '9.0'\nimporters:\n  .: {}\n"

const repoRoot = fileURLToPath(new URL('..', import.meta.url))
const BIN = path.join(repoRoot, 'tools', 'generate', 'bin', '1c.mjs')

let cwd: string

beforeEach(() => {
  cwd = mkdtempSync(path.join(tmpdir(), 'story-e15a19ef-crop-offline-'))
})
afterEach(() => {
  rmSync(cwd, { recursive: true, force: true })
})

/** A resolver that finds exactly the named packages and nothing else. */
function resolves(...present: string[]): Resolver {
  return (pkg) => (present.includes(pkg) ? `/fake/node_modules/${pkg}/index.js` : undefined)
}

/** A synthetic tree installed at its own committed lockfile — so drift is never the fault. */
function installedTree(name: string): string {
  const dir = path.join(cwd, name)
  mkdirSync(path.join(dir, path.dirname(INSTALLED_LOCKFILE_REL)), { recursive: true })
  writeFileSync(path.join(dir, LOCKFILE_REL), LOCK)
  writeFileSync(path.join(dir, INSTALLED_LOCKFILE_REL), LOCK)
  return dir
}

/** Capture the CommandError a gated command refuses with. */
function refusalOf(command: string, opts: { repoRoot: string; resolve?: Resolver }): CommandError {
  try {
    assertInstall(command, opts)
  } catch (err) {
    expect(err).toBeInstanceOf(CommandError)
    return err as CommandError
  }
  throw new Error(`expected '1c ${command}' to refuse, but it passed the preflight`)
}

/**
 * A subprocess shim that makes packages behave exactly as if they had been
 * pruned off disk. Both resolution paths are hidden together: `require.resolve`
 * is what the preflight probes, and `import` is what the CLI's own module graph
 * uses — so a verb that survives both is one that genuinely loads neither.
 *
 * A shim rather than a real prune because this repo's own `node_modules` is not
 * the test's to mutate. Nothing on disk changes.
 */
const HIDE_HOOK = `
import { registerHooks } from 'node:module'
import Module from 'node:module'

const HIDDEN = JSON.parse(process.env.FC_HIDDEN_PACKAGES)
const hidden = (s) =>
  HIDDEN.includes(s) ||
  HIDDEN.some((p) => s.startsWith(p + '/')) ||
  HIDDEN.some((p) => s.includes('/node_modules/' + p + '/'))

const realResolve = Module._resolveFilename
Module._resolveFilename = function (request, ...rest) {
  if (hidden(request)) {
    const err = new Error("Cannot find module '" + request + "'")
    err.code = 'MODULE_NOT_FOUND'
    throw err
  }
  return realResolve.call(this, request, ...rest)
}

registerHooks({
  resolve(specifier, context, nextResolve) {
    const reject = () => {
      const err = new Error("Cannot find package '" + specifier + "'")
      err.code = 'ERR_MODULE_NOT_FOUND'
      throw err
    }
    if (hidden(specifier)) reject()
    const r = nextResolve(specifier, context)
    if (hidden(r.url)) reject()
    return r
  },
})
`

/** Run the real `1c` binary with `hidden` packages unresolvable, from the repo root. */
function runBinWithout(hidden: string[], args: string[]): { out: string; err: string; code: number } {
  const dir = mkdtempSync(path.join(tmpdir(), 'fc-hide-crop-'))
  const hook = path.join(dir, 'hide.mjs')
  writeFileSync(hook, HIDE_HOOK)
  try {
    const res = spawnSync('node', ['--import', hook, BIN, ...args], {
      cwd: repoRoot,
      encoding: 'utf8',
      env: { ...process.env, FC_HIDDEN_PACKAGES: JSON.stringify(hidden) },
    })
    return { out: res.stdout ?? '', err: res.stderr ?? '', code: res.status ?? -1 }
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

/** An 8×6 RGBA PNG with a distinguishable pixel at every position. */
async function writeFixturePng(file: string): Promise<void> {
  const width = 8
  const height = 6
  const data = new Uint8Array(width * height * 4)
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4
      data[i] = x * 30
      data[i + 1] = y * 40
      data[i + 2] = 128
      data[i + 3] = 255
    }
  }
  writeFileSync(file, await encodePng({ data, width, height, channels: 4 }))
}

// ── AC-1790: crop is never gated, and crops on a tree with nothing installed ──

describe('story-e15a19ef — 1c crop is an offline verb', () => {
  it(
    'test_UAT_AC1790_crop_is_never_gated_and_crops_on_an_uninstalled_tree',
    async () => {
      // ── 1. The entry was REMOVED, not emptied ─────────────────────────────
      // An emptied entry (`crop: []`) would satisfy "absent from the gated set"
      // when that set is read as keys-with-requirements, and would still leave
      // `crop` on the gate's path. The property is the absence of the key.
      expect(Object.prototype.hasOwnProperty.call(COMMAND_DEPS, 'crop')).toBe(false)
      expect(COMMAND_DEPS['crop']).toBeUndefined()

      // ── 2. Ungated on every tree shape, while a gated verb refuses on the
      //       same one — the contrast is between two verbs, not two trees ─────
      const nothing = installedTree('nothing-resolves')
      const onlyBrowser = installedTree('only-browser-resolves')

      // (a) Nothing resolves — neither the browser automation package nor any
      //     imaging package. `crop` passes; `diff` refuses on that same tree.
      expect(() => assertInstall('crop', { repoRoot: nothing, resolve: resolves() })).not.toThrow()
      const refusedThere = refusalOf('diff', { repoRoot: nothing, resolve: resolves() })
      expect(refusedThere.code).toBe('ENVIRONMENT')
      expect(refusedThere.message).toContain('playwright')

      // (b) Only the browser automation package resolves — no imaging package
      //     anywhere. `crop` is still ungated, and `diff` now passes, so the
      //     preceding refusal was about the package and not about the tree.
      expect(() => assertInstall('crop', { repoRoot: onlyBrowser, resolve: resolves('playwright') })).not.toThrow()
      expect(() => assertInstall('diff', { repoRoot: onlyBrowser, resolve: resolves('playwright') })).not.toThrow()

      // (c) A tree that was never installed at all — no lockfile snapshot, so
      //     even the drift half of the preflight has a finding to make. `crop`
      //     carries no entry, so the gate returns before it ever looks.
      const neverInstalled = path.join(cwd, 'never-installed')
      mkdirSync(neverInstalled, { recursive: true })
      writeFileSync(path.join(neverInstalled, LOCKFILE_REL), LOCK)
      expect(() => assertInstall('crop', { repoRoot: neverInstalled, resolve: resolves() })).not.toThrow()
      expect(refusalOf('diff', { repoRoot: neverInstalled, resolve: resolves() }).message).toContain('never been installed')

      // ── 3. It gets past the check and does its OWN work ───────────────────
      // Through the real binary, with both packages genuinely unresolvable —
      // in-process the CLI module is already loaded and cannot express that.
      const input = path.join(cwd, 'source.png')
      const outFile = path.join(cwd, 'cropped.png')
      await writeFixturePng(input)

      const cropped = runBinWithout(['playwright', 'sharp'], ['crop', input, '--box', '1,1,3,2', '--out', outFile])

      // It ran to completion, and on its own terms: the PNG it was given was
      // read and the cropped PNG was written, at the window it was asked for.
      expect(cropped.code).toBe(0)
      expect(cropped.err).not.toContain('Cannot find module')
      expect(cropped.err).not.toContain('Cannot find package')
      expect(cropped.out).toContain('Cropped')
      expect(existsSync(outFile)).toBe(true)
      expect(pngDimensions(new Uint8Array(readFileSync(outFile)), 'cropped')).toEqual({ width: 3, height: 2 })

      // No environment refusal anywhere in that run.
      expect(cropped.err).not.toContain('ENVIRONMENT')
      expect(cropped.err).not.toContain(INSTALL_COMMAND)

      // ── 4. The same tree still refuses a gated verb ───────────────────────
      // Same binary, same hidden packages, same cwd — so `crop`'s success above
      // cannot be explained by the shim having failed to hide anything.
      const gated = runBinWithout(['playwright', 'sharp'], ['diff', '--ref', 'nope', '--actual', 'nope.png'])
      expect(gated.code).toBe(EXIT_CODES.ENVIRONMENT)
      expect(gated.err).toContain("'1c diff' cannot run")
      expect(gated.err).toContain('playwright')
      // …and it names no imaging package: that dependency is gone from the tool.
      expect(gated.err).not.toContain("'sharp'")

      // ── 5. When crop fails, it fails on its own terms ─────────────────────
      // A missing input on the very same uninstalled-looking tree is reported as
      // a missing input, not as an unusable install.
      const missing = runBinWithout(['playwright', 'sharp'], ['crop', path.join(cwd, 'absent.png'), '--box', '0,0,2,2'])
      expect(missing.code).not.toBe(EXIT_CODES.ENVIRONMENT)
      expect(missing.err).toContain('input image not found')
      expect(missing.err).not.toContain(INSTALL_COMMAND)
    },
    300_000,
  )
})
