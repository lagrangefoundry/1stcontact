/**
 * story-e674c60a / AC-1030 — **the components consumed are the repository's
 * own, identically from any of its working trees**.
 *
 * Which installed copy of the shared UI components this repository consumes is
 * decided by which repository the run belongs to, never by where on disk the run
 * happens to execute from. `tools/generate/src/cli/webui.ts` is the single point
 * at which a component is resolved, and it anchors resolution at the
 * repository's MAIN CHECKOUT — the directory the out-of-band install was told to
 * sit beside. A linked working tree therefore reads the identical store the main
 * checkout does.
 *
 * WHY THE EVIDENCE IS BUILT OUT OF FIXTURES. This suite runs inside one checkout
 * shape at a time, and the shape it happens to run in decides which branches of
 * the anchor execute. From the main checkout, ordinary upward resolution already
 * finds the store, so every remaining branch could be broken and the suite would
 * still be green — the coverage would be an accident of the layout under the test
 * runner rather than a statement about the behaviour. So each shape is
 * reproduced as a temporary directory tree and resolution is exercised with its
 * starting location inside that tree, which is what makes this evidence
 * checkout-independent.
 *
 * NOTHING HERE STANDS IN FOR THE RESOLVER. The file exercised in each fixture is
 * the shipped `webui.ts`, copied byte-for-byte and run by a real `node`, so the
 * logic under test is production's and cannot drift away from it — a change to
 * the anchor is picked up here on the next run. The fixtures supply checkout
 * SHAPES and stand-in installed copies whose only job is to be distinguishable:
 * one is planted at every location the anchor could land on, so the copy that
 * gets consumed NAMES the location that was anchored to. The identity of the
 * real components is asserted unsubstituted in
 * {@link linked_working_tree_and_main_checkout_consume_the_identical_copy} and
 * in `bug32-webui-scope-rebrand`.
 *
 * The scope is not written here as a literal: it has exactly one declaration
 * site (AC-960) and every specifier below composes from it.
 */

import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { WEBUI_PACKAGES, WEBUI_SCOPE, webuiPackageDir } from '../tools/generate/src/cli/webui'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

const REPO = path.resolve(__dirname, '..')

/** The shipped resolver, and where it sits inside a checkout of this repository. */
const RESOLVER_DIR_REL = path.join('tools', 'generate', 'src', 'cli')
const RESOLVER = path.join(REPO, RESOLVER_DIR_REL, 'webui.ts')

/** Whether this run is inside a checkout at all — see the last UAT. */
function gitCommonDir(): string | null {
  try {
    const out = execFileSync('git', ['rev-parse', '--git-common-dir'], {
      cwd: REPO,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
    return path.resolve(REPO, out)
  } catch {
    return null
  }
}

const GIT_COMMON_DIR = gitCommonDir()

let BASE: string

/**
 * Runs `webuiPackageDir` from a given copy of the resolver, in a real `node`.
 *
 * A child process, not an in-process import, for two reasons: the anchor is
 * computed once at module load from the resolver's OWN location, so each shape
 * needs a fresh module instance; and resolution then happens through Node's
 * ordinary upward lookup rather than through the test runner's transform-time
 * resolver, which is the mechanism the behaviour actually relies on.
 */
function resolveVia(resolverFile: string, name: string): { dir?: string; error?: string } {
  const probe = path.join(BASE, 'probe.mjs')
  let out: string
  try {
    out = execFileSync(
      process.execPath,
      ['--experimental-transform-types', '--no-warnings', probe, resolverFile, name],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
    )
  } catch (e) {
    const err = e as { stdout?: string; stderr?: string }
    throw new Error(
      `probing ${resolverFile} failed\nstdout: ${err.stdout ?? ''}\nstderr: ${err.stderr ?? ''}`,
    )
  }
  return JSON.parse(out) as { dir?: string; error?: string }
}

/** The shipped resolver, planted verbatim at its own path inside a fixture tree. */
function plantResolver(root: string): string {
  const dir = path.join(root, RESOLVER_DIR_REL)
  fs.mkdirSync(dir, { recursive: true })
  const dest = path.join(dir, 'webui.ts')
  fs.copyFileSync(RESOLVER, dest)
  expect(
    fs.readFileSync(dest, 'utf8'),
    'the fixture must exercise the shipped resolver, unmodified',
  ).toBe(fs.readFileSync(RESOLVER, 'utf8'))
  return dest
}

/**
 * A stand-in installed store beneath `at`, tagged so the copy that gets consumed
 * identifies the location it was found from. Returns that location's component
 * directories by name.
 */
function plantStore(at: string, marker: string): Map<string, string> {
  fs.mkdirSync(at, { recursive: true })
  fs.writeFileSync(path.join(at, 'package.json'), JSON.stringify({ name: marker, type: 'module' }))
  const dirs = new Map<string, string>()
  for (const name of WEBUI_PACKAGES) {
    const dir = path.join(at, 'node_modules', WEBUI_SCOPE, name)
    fs.mkdirSync(path.join(dir, 'src'), { recursive: true })
    fs.writeFileSync(
      path.join(dir, 'package.json'),
      JSON.stringify({
        name: `${WEBUI_SCOPE}/${name}`,
        version: '0.0.0',
        type: 'module',
        marker,
        exports: { '.': './src/index.js' },
      }),
    )
    fs.writeFileSync(path.join(dir, 'src', 'index.js'), 'export {}\n')
    dirs.set(name, dir)
  }
  return dirs
}

/** The tag on whichever stand-in copy was consumed. */
function markerOf(dir: string): string {
  return (JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8')) as { marker?: string })
    .marker!
}

/**
 * Asserts that resolving from `resolverFile` lands on `expected` for EVERY
 * component the workspace consumes — never one of them by luck.
 */
function expectAnchoredAt(
  resolverFile: string,
  expected: Map<string, string>,
  marker: string,
  why: string,
): void {
  for (const name of WEBUI_PACKAGES) {
    const got = resolveVia(resolverFile, name)
    expect(got.error, `${name}: resolution failed — ${got.error}`).toBeUndefined()
    expect(got.dir, `${name}: ${why}`).toBe(fs.realpathSync(expected.get(name)!))
    expect(markerOf(got.dir!), `${name}: ${why}`).toBe(marker)
  }
}

/** The nearest directory at or above `dir` holding repository data, if any. */
function repositoryDataAbove(dir: string): string | null {
  for (let d = dir; ; ) {
    if (fs.existsSync(path.join(d, '.git'))) return d
    const up = path.dirname(d)
    if (up === d) return null
    d = up
  }
}

/** Ordinary upward resolution anchored at `from` — the oracle, not the anchor logic. */
function resolveUpwardFrom(from: string, name: string): string {
  const entry = createRequire(path.join(from, 'package.json')).resolve(`${WEBUI_SCOPE}/${name}`)
  let dir = path.dirname(entry)
  while (!fs.existsSync(path.join(dir, 'package.json'))) dir = path.dirname(dir)
  return fs.realpathSync(dir)
}

function git(cwd: string, ...args: string[]): void {
  execFileSync('git', args, { cwd, stdio: ['ignore', 'ignore', 'pipe'] })
}

beforeAll(() => {
  BASE = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'ac1030-'))
  fs.writeFileSync(
    path.join(BASE, 'probe.mjs'),
    [
      "import { pathToFileURL } from 'node:url'",
      'const [, , resolverFile, name] = process.argv',
      'try {',
      '  const m = await import(pathToFileURL(resolverFile).href)',
      '  process.stdout.write(JSON.stringify({ dir: m.webuiPackageDir(name) }))',
      '} catch (e) {',
      '  process.stdout.write(JSON.stringify({ error: String(e?.message ?? e) }))',
      '}',
      '',
    ].join('\n'),
  )
})

afterAll(() => {
  if (BASE) fs.rmSync(BASE, { recursive: true, force: true })
})

describe('story-e674c60a component resolution anchors at the repository, not the location', () => {
  it('test_UAT_AC1030_a_main_checkout_anchors_to_itself', () => {
    // A checkout owning its repository data directly anchors to its own
    // directory — not to the location the resolver happens to sit at within it,
    // and not to whatever lies above the checkout.
    const root = path.join(BASE, 'own-repository-data')
    const checkout = path.join(root, 'checkout')
    const above = plantStore(root, 'above-the-checkout')
    const own = plantStore(checkout, 'the-checkout-itself')
    const resolver = plantResolver(checkout)
    plantStore(path.dirname(resolver), 'where-the-resolver-sits')
    fs.mkdirSync(path.join(checkout, '.git'), { recursive: true })

    expect(
      fs.statSync(path.join(checkout, '.git')).isDirectory(),
      'the fixture must reproduce a checkout that owns its repository data',
    ).toBe(true)

    expectAnchoredAt(resolver, own, 'the-checkout-itself', 'a main checkout anchors to itself')
    // Non-vacuity: the copies it declined are real and reachable, so landing on
    // the checkout's own is a decision rather than the only option.
    for (const name of WEBUI_PACKAGES) {
      expect(fs.existsSync(above.get(name)!)).toBe(true)
    }
  })

  it('test_UAT_AC1030_a_linked_working_tree_anchors_to_the_main_checkout', () => {
    // The load-bearing case: the same repository parked outside the directory
    // the components were installed to sit beside. The shapes are made by git
    // itself rather than hand-forged, so the fixture cannot quietly encode an
    // assumption about them that git does not share.
    const root = path.join(BASE, 'linked-working-tree')
    const main = path.join(root, 'main')
    const wt = path.join(root, 'working-tree')
    const above = plantStore(root, 'above-both')
    const mainStore = plantStore(main, 'the-main-checkout')

    git(main, 'init', '--quiet', '.')
    git(main, '-c', 'user.email=t@t', '-c', 'user.name=t', 'commit', '--quiet', '--allow-empty', '-m', 'init')
    git(main, 'worktree', 'add', '--quiet', '--no-checkout', '--detach', wt)

    const pointer = path.join(wt, '.git')
    expect(
      fs.statSync(pointer).isFile(),
      'a linked working tree holds a pointer to shared repository data, not a directory',
    ).toBe(true)

    // A copy at the pointer's TARGET too, so this shape pins the step that only
    // a linked working tree takes — reading the target's `commondir` to find the
    // shared repository — rather than merely landing somewhere inside the main
    // checkout, which several wrong answers also do.
    const target = path.resolve(wt, fs.readFileSync(pointer, 'utf8').replace(/^gitdir:/, '').trim())
    plantStore(target, 'the-pointer-target')

    plantStore(wt, 'the-working-tree')
    const resolver = plantResolver(wt)
    plantStore(path.dirname(resolver), 'where-the-resolver-sits')

    expectAnchoredAt(
      resolver,
      mainStore,
      'the-main-checkout',
      'a linked working tree anchors to the main checkout, never to itself',
    )
    for (const name of WEBUI_PACKAGES) {
      expect(fs.existsSync(above.get(name)!)).toBe(true)
    }
  })

  it('test_UAT_AC1030_a_pointer_naming_no_shared_repository_anchors_to_its_own_directory', () => {
    // Repository data that is a pointer but names no shared repository: there is
    // no main checkout to defer to, so the directory holding the pointer is the
    // only honest answer.
    const root = path.join(BASE, 'pointer-without-shared-repository')
    const holder = path.join(root, 'holder')
    const gitdir = path.join(root, 'repository-data')
    const above = plantStore(root, 'above-the-holder')
    const own = plantStore(holder, 'the-pointer-holder')
    const resolver = plantResolver(holder)
    plantStore(path.dirname(resolver), 'where-the-resolver-sits')
    fs.mkdirSync(gitdir, { recursive: true })
    fs.writeFileSync(path.join(holder, '.git'), `gitdir: ${gitdir}\n`)

    expect(
      fs.existsSync(path.join(gitdir, 'commondir')),
      'the fixture must reproduce a pointer that names no shared repository',
    ).toBe(false)

    expectAnchoredAt(
      resolver,
      own,
      'the-pointer-holder',
      'a pointer naming no shared repository anchors to the directory holding it',
    )
    for (const name of WEBUI_PACKAGES) {
      expect(fs.existsSync(above.get(name)!)).toBe(true)
    }
  })

  it('test_UAT_AC1030_no_repository_data_anchors_to_the_walk_origin_and_terminates', () => {
    // An extracted archive: nothing to anchor to. The search stops where it
    // began instead of failing or climbing out of the tree it was asked about.
    const root = path.join(BASE, 'no-repository-data')
    const outside = plantStore(root, 'above-the-tree')
    const resolver = plantResolver(root)
    const origin = plantStore(path.dirname(resolver), 'where-the-search-began')

    expect(
      repositoryDataAbove(root),
      'the fixture must sit under no repository data — otherwise this shape is not reproduced',
    ).toBeNull()

    expectAnchoredAt(
      resolver,
      origin,
      'where-the-search-began',
      'with no repository data anywhere above, resolution anchors where the search began',
    )
    // It terminated: it neither threw nor climbed past the walk origin to a copy
    // higher up the tree.
    for (const name of WEBUI_PACKAGES) {
      expect(fs.existsSync(outside.get(name)!)).toBe(true)
    }
  })

  it.skipIf(!WEBUI_INSTALLED || !GIT_COMMON_DIR)(
    'test_UAT_AC1030_linked_working_tree_and_main_checkout_consume_the_identical_copy',
    () => {
      // The consequence that matters, against the REAL installation: one
      // installed copy per repository, and two locations of that repository can
      // never be silently reading different ones.
      //
      // The working tree is built here rather than by `git worktree add` against
      // this repository: adding one would mutate repository state that concurrent
      // workflow processes read. It is the shape git makes — a pointer to
      // repository data whose `commondir` names this repository's real shared
      // repository directory — so it belongs to this repository exactly as a git
      // -made one would, and it consumes the real store, not a stand-in.
      const mainCheckout = path.dirname(GIT_COMMON_DIR!)
      const root = path.join(BASE, 'this-repository')
      const wt = path.join(root, 'working-tree')
      const gitdir = path.join(root, 'repository-data')
      fs.mkdirSync(gitdir, { recursive: true })
      fs.writeFileSync(path.join(gitdir, 'commondir'), `${GIT_COMMON_DIR}\n`)
      const decoy = plantStore(wt, 'the-working-tree')
      fs.writeFileSync(path.join(wt, '.git'), `gitdir: ${gitdir}\n`)
      const resolver = plantResolver(wt)

      for (const name of WEBUI_PACKAGES) {
        const fromWorkingTree = resolveVia(resolver, name)
        expect(fromWorkingTree.error, `${name}: ${fromWorkingTree.error}`).toBeUndefined()

        // Compared as locations, against both the resolution this suite itself
        // performs and an independent upward lookup anchored at the main
        // checkout git names — never against contents.
        expect(
          fromWorkingTree.dir,
          `${name}: a working tree consumes a different copy than the main checkout`,
        ).toBe(resolveUpwardFrom(mainCheckout, name))
        expect(fromWorkingTree.dir, `${name}: the single resolution point disagrees with itself`).toBe(
          fs.realpathSync(webuiPackageDir(name)),
        )

        // Non-vacuity: a copy sits inside the working tree, and it is not the one
        // consumed — so the equality above is anchoring, not absence of a choice.
        expect(fs.existsSync(decoy.get(name)!), 'the decoy copy must exist').toBe(true)
        expect(fromWorkingTree.dir!.startsWith(wt + path.sep)).toBe(false)
      }
    },
  )
})

// Reported rather than silent when the deliberate out-of-band install has not
// been run for this repository: that is an environment precondition, and only
// the last UAT above depends on it.
if (!WEBUI_INSTALLED) {
  // eslint-disable-next-line no-console
  console.info(`AC-1030 real-installation evidence skipped: ${WEBUI_SKIP_REASON}`)
}
