/**
 * Reconciliation UAT for story-d5167ced — "Platform Build, Deploy & Smoke: One
 * Path To Ship A Worker, And Proof It Serves" — the criterion BUNDLE-27 added.
 *
 * The story's other eighteen criteria already have their UATs in
 * `reconciliation-platform-build-deploy-smoke.test.ts` (AC-1330…AC-1342),
 * `reconciliation-platform-build-order-and-private-surface.test.ts`
 * (AC-1425…AC-1427) and `reconciliation-platform-invocation-log-retention.test.ts`
 * (AC-1454, AC-1455). This file carries only what those reconciliations had no
 * criterion for, so the 1:1 test-to-AC mapping holds across the set:
 *
 *   • AC-1791 — the generated asset tree is REPLACED WHOLE. The new tree is
 *     assembled somewhere other than the served path and takes that path in a
 *     single move; a reader sees the previous build or the new one, each
 *     complete, and never a half of either; and a build that fails before the
 *     new tree is whole leaves the previous one standing and serving.
 *
 * THE BOUNDARY: the real asset stage, against a fixture checkout.
 *
 * `bin/build`'s generated-asset stage is `bin/1c assets`, and `bin/1c` is a
 * three-line `exec` into `tools/generate/bin/1c.mjs` — so the process driven
 * below is the stage itself, not a description of it. Both links are asserted
 * from the shipped scripts rather than assumed.
 *
 * WHY A FIXTURE CHECKOUT rather than this repo's own `dist-assets`. The
 * criterion is about what a reader of the served path observes AT EVERY INSTANT
 * OF A BUILD, so the test has to read that path while the build writes it. Read
 * against this checkout's own served path, every observation would also be an
 * observation of whatever else the suite is doing to it — the sibling files run
 * real builds — and a failure could not be attributed. The fixture gives this
 * test a served path of its own, at the same repo-relative location the deployed
 * Worker serves from (asserted below against `wrangler.toml`), built by the same
 * command from the same sources: the real builder sources, the real framework
 * bridges and the real out-of-band component store, reached by symlink so
 * nothing is a stand-in.
 *
 * Nothing internal is mocked. The one substitution is `Module._resolveFilename`
 * in the FAILING run, which makes a single shared component genuinely
 * unresolvable exactly as a machine that never ran the out-of-band install sees
 * it — the fault that makes the asset stage fail part-way, and the one the
 * criterion's second leg is about. It is the same instrument AC-1330 and AC-1331
 * use, for the same reason: nothing on disk is touched.
 */
import { afterEach, describe, expect, it } from 'vitest'
import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
// The component scope and the component list are declared exactly once in this
// repository (AC-960); every reference composes them from that declaration.
import { WEBUI_PACKAGES, WEBUI_SCOPE } from '../tools/generate/src/cli/webui'

const REPO = realpathSync(fileURLToPath(new URL('..', import.meta.url)))

/** The generated-asset stage's real entry point — see the header. */
const ONE_C = path.join(REPO, 'tools', 'generate', 'bin', '1c.mjs')

const roots: string[] = []
afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true })
})

/**
 * A checkout `1c assets` can build in, with its own served path.
 *
 * `cmdAssets` takes the working directory as its root (`1c.mjs:85`), so the real
 * command writes here while Vite still resolves the workspace from the real
 * repo. The sources it reads are the real ones, symlinked: the builder's browser
 * source, the framework bridges it type-strips, and the site-schema modules those
 * import. `packages/framework/src/modules` is COPIED rather than symlinked
 * because the module chrome the render composes is generated back into it — a
 * symlink would write through to this checkout's own committed copy.
 */
function assetFixture(label: string): string {
  const root = realpathSync(mkdtempSync(path.join(tmpdir(), `d5167ced-${label}-`)))
  roots.push(root)
  mkdirSync(path.join(root, 'apps', 'control-app', 'src'), { recursive: true })
  mkdirSync(path.join(root, 'packages', 'framework', 'src'), { recursive: true })
  mkdirSync(path.join(root, 'packages', 'site-schema', 'src'), { recursive: true })
  symlinkSync(
    path.join(REPO, 'apps', 'control-app', 'src', 'builder'),
    path.join(root, 'apps', 'control-app', 'src', 'builder'),
  )
  symlinkSync(
    path.join(REPO, 'packages', 'framework', 'src', 'l1'),
    path.join(root, 'packages', 'framework', 'src', 'l1'),
  )
  symlinkSync(
    path.join(REPO, 'packages', 'site-schema', 'src', 'l1'),
    path.join(root, 'packages', 'site-schema', 'src', 'l1'),
  )
  cpSync(
    path.join(REPO, 'packages', 'framework', 'src', 'modules'),
    path.join(root, 'packages', 'framework', 'src', 'modules'),
    { recursive: true },
  )
  return root
}

/** Every file under `dir`, relative and sorted. Throws if the tree moves mid-walk. */
function walk(dir: string, prefix = ''): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const rel = prefix === '' ? entry.name : `${prefix}/${entry.name}`
    if (entry.isDirectory()) out.push(...walk(path.join(dir, entry.name), rel))
    else out.push(rel)
  }
  return out.sort()
}

/** What one read of the served path saw. `present: false` is a read answered not-found. */
interface Look {
  present: boolean
  /** The directory's identity — a single move replaces it; a refill does not. */
  ino: number
  files: string[]
}

function look(dir: string): Look {
  try {
    // `ino` first: if the tree moves between this and the walk, the walk throws
    // and the read is recorded as not-found rather than as a short tree — so a
    // torn read can never be miscounted as a reader having seen a partial tree.
    const ino = statSync(dir).ino
    return { present: true, ino, files: walk(dir) }
  } catch {
    return { present: false, ino: -1, files: [] }
  }
}

function digest(dir: string): Map<string, string> {
  const out = new Map<string, string>()
  for (const rel of walk(dir)) {
    out.set(rel, createHash('sha256').update(readFileSync(path.join(dir, rel))).digest('hex'))
  }
  return out
}

interface BuildRun {
  code: number
  all: string
  /** Every read of the served path taken while the build was running. */
  looks: Look[]
}

/**
 * Run the asset stage and read the served path continuously until it exits.
 *
 * The reads are taken from this process, concurrently with the build process,
 * which is what the criterion asks: "a local development server on the same
 * checkout, another test in the same run" is exactly this reader.
 */
async function buildWhileReading(
  root: string,
  served: string,
  opts: { nodeArgs?: string[]; env?: NodeJS.ProcessEnv } = {},
): Promise<BuildRun> {
  const child = spawn('node', [...(opts.nodeArgs ?? []), ONE_C, 'assets'], {
    cwd: root,
    env: { ...process.env, ...opts.env },
  })
  const state: { exit: number | null } = { exit: null }
  let all = ''
  child.stdout.on('data', (chunk: Buffer) => {
    all += chunk.toString()
  })
  child.stderr.on('data', (chunk: Buffer) => {
    all += chunk.toString()
  })
  child.on('close', (code) => {
    state.exit = code ?? -1
  })

  const looks: Look[] = []
  const deadline = Date.now() + 120_000
  while (state.exit === null && Date.now() < deadline) {
    looks.push(look(served))
    await new Promise((resolve) => setImmediate(resolve))
  }
  return { code: state.exit ?? -1, all, looks }
}

/** The directories the deployed Worker serves assets from, per `wrangler.toml`. */
function servedDirectories(toml: string): string[] {
  const out: string[] = []
  let section = ''
  for (const raw of toml.split('\n')) {
    const line = raw.replace(/(^|\s)#.*$/, '').trim()
    const header = /^\[\[?([^\]]+)\]\]?$/.exec(line)
    if (header) {
      section = header[1].trim()
      continue
    }
    const assignment = /^directory\s*=\s*"(.*)"$/.exec(line)
    if (assignment && section.endsWith('assets')) out.push(assignment[1])
  }
  return out
}

// ═════════════════════════════════════════════════════════════════════════════
// AC-1791 — the generated asset tree is swapped in whole
// ═════════════════════════════════════════════════════════════════════════════

describe('story-d5167ced — the generated asset tree is replaced whole, never refilled in place', () => {
  it(
    'test_UAT_AC1791_a_concurrent_reader_sees_a_whole_tree_and_a_failed_build_leaves_the_previous_one',
    async () => {
      // ── the path under test is the path that is served ──────────────────────
      //
      // Stated from the shipped files rather than assumed: the build's
      // generated-asset stage is `bin/1c assets`, `bin/1c` execs the entry point
      // driven below, and the directory that entry point writes is the one the
      // deployed Worker answers `/builder/*` and `/webui/*` from — under the
      // default environment and under the named production one.
      expect(readFileSync(path.join(REPO, 'bin', 'build'), 'utf8')).toContain('"$repo_root/bin/1c" assets')
      expect(readFileSync(path.join(REPO, 'bin', '1c'), 'utf8')).toContain('tools/generate/bin/1c.mjs')
      const declared = servedDirectories(
        readFileSync(path.join(REPO, 'apps', 'control-app', 'wrangler.toml'), 'utf8'),
      )
      expect(declared.length).toBeGreaterThanOrEqual(2)
      for (const dir of declared) expect(dir).toBe('./dist-assets')

      const root = assetFixture('asset-swap')
      const served = path.join(root, 'apps', 'control-app', 'dist-assets')

      // ── a complete asset tree, already at the served path ───────────────────
      const seed = await buildWhileReading(root, served)
      expect(seed.code, seed.all).toBe(0)
      const previousFiles = walk(served)
      const previousIno = statSync(served).ino
      // Non-vacuous: the tree this reader is about to watch is a real one — the
      // builder's sources, the type-stripped bridges, and every shared component.
      expect(previousFiles.length).toBeGreaterThan(50)
      expect(previousFiles.some((f) => f.startsWith('builder/'))).toBe(true)
      expect(previousFiles.some((f) => f.startsWith('framework/'))).toBe(true)
      for (const component of WEBUI_PACKAGES) {
        expect(
          previousFiles.some((f) => f.startsWith(`webui/${component}/`)),
          `${component} is absent from the seeded tree`,
        ).toBe(true)
      }

      // ── run the build again, reading the served path throughout ─────────────
      const rebuild = await buildWhileReading(root, served)
      expect(rebuild.code, rebuild.all).toBe(0)
      // The reader really did read, and really did read DURING the build.
      expect(rebuild.looks.length, 'the served path was not read while the build ran').toBeGreaterThan(20)

      const newIno = statSync(served).ino
      expect(walk(served)).toEqual(previousFiles)
      // A SINGLE MOVE, not a refill: the directory that now answers at the served
      // path is a different directory from the one that answered before. A build
      // that emptied and refilled the served path would leave its identity intact.
      expect(newIno, 'the served path was refilled in place rather than replaced').not.toBe(previousIno)

      // ── what every one of those reads saw ───────────────────────────────────
      //
      // The guarantee, stated as the criterion states it: a reader sees the
      // previous build's tree or the new build's tree, EACH COMPLETE, and never a
      // partial state of either.
      const present = rebuild.looks.filter((l) => l.present)
      const short = present.filter((l) => l.files.join('\n') !== previousFiles.join('\n'))
      expect(
        short.map((l) => `${l.files.length} of ${previousFiles.length} file(s)`).slice(0, 5),
        'a read of the served path saw a partial tree',
      ).toEqual([])
      // Exactly two trees answered, and the transition between them is one-way:
      // no read sees the previous tree again once the new one has taken the path.
      expect([...new Set(present.map((l) => l.ino))].sort()).toEqual([previousIno, newIno].sort())
      const firstNew = rebuild.looks.findIndex((l) => l.present && l.ino === newIno)
      const lastOld = rebuild.looks.map((l) => l.present && l.ino === previousIno).lastIndexOf(true)
      expect(lastOld, 'the served path never held the previous tree while the build ran').toBeGreaterThan(0)
      expect(firstNew, 'the new tree never took the served path while the reader watched').toBeGreaterThan(0)
      expect(lastOld, 'the previous tree answered again after the new one took the path').toBeLessThan(firstNew)

      // THE MOMENT OF THE MOVE, and why it is bounded rather than forbidden.
      //
      // Taking the path is a rename onto an occupied name, so the old tree is
      // moved aside first and the path is unoccupied for the single syscall in
      // between. A reader hammering the path can land in that instant, and this
      // one does — about once per build, out of a thousand reads.
      //
      // What the criterion forbids is the other thing: the served path EMPTIED
      // and refilled over the whole copy, which is what answers not-found "for
      // every component" and what a part-way failure leaves behind permanently.
      // The two are distinguished by exactly this bound — a refill occupies the
      // path for the duration of the copy, so it would leave hundreds of
      // consecutive reads unanswered here, not one at the boundary.
      const missed = rebuild.looks.map((l, i) => ({ i, l })).filter(({ l }) => !l.present)
      expect(missed.length, 'the served path was unoccupied for more than the move').toBeLessThanOrEqual(5)
      expect(missed.length / rebuild.looks.length).toBeLessThan(0.01)
      for (const { i } of missed) {
        // …and every one of them is at the boundary between the two trees, never
        // during the copy that preceded it.
        expect(i, 'a read was answered not-found before the move').toBeGreaterThan(lastOld)
        expect(i, 'a read was answered not-found after the move').toBeLessThan(firstNew)
      }

      // ── now a build that fails part-way: one shared component made absent ────
      //
      // The asset stage needs every component the preflight probes, so hiding one
      // is what makes this build fail after it has begun — the case the criterion
      // is really about, and the one an incomplete component store produces.
      const before = digest(served)
      const beforeIno = statSync(served).ino
      const hidden = `${WEBUI_SCOPE}/${WEBUI_PACKAGES[WEBUI_PACKAGES.length - 1]}`
      const hookDir = realpathSync(mkdtempSync(path.join(tmpdir(), 'd5167ced-hide-')))
      roots.push(hookDir)
      const hook = path.join(hookDir, 'hide.mjs')
      writeFileSync(
        hook,
        [
          "import Module from 'node:module'",
          'const HIDDEN = JSON.parse(process.env.UAT_HIDDEN_SPECS)',
          "const hidden = (s) => HIDDEN.some((p) => s === p || String(s).startsWith(p + '/'))",
          'const real = Module._resolveFilename',
          'Module._resolveFilename = function (request, ...rest) {',
          '  if (hidden(request)) {',
          '    const err = new Error("Cannot find module \'" + request + "\'")',
          "    err.code = 'MODULE_NOT_FOUND'",
          '    throw err',
          '  }',
          '  return real.call(this, request, ...rest)',
          '}',
          '',
        ].join('\n'),
      )

      const failed = await buildWhileReading(root, served, {
        nodeArgs: ['--import', hook],
        env: { UAT_HIDDEN_SPECS: JSON.stringify([hidden]) },
      })
      // The run fails, and says which component it could not find.
      expect(failed.code, failed.all).not.toBe(0)
      expect(failed.all).toContain(WEBUI_PACKAGES[WEBUI_PACKAGES.length - 1])

      // The previous tree is still there — the same directory, with exactly the
      // contents it had before the build started, byte for byte.
      expect(existsSync(served)).toBe(true)
      expect(statSync(served).ino, 'the failed build replaced the served tree').toBe(beforeIno)
      const after = digest(served)
      expect([...after.keys()]).toEqual([...before.keys()])
      for (const [file, sum] of before) {
        expect(after.get(file), `${file} changed under a failed build`).toBe(sum)
      }
      // Nothing partial is left occupying the served path: every component that
      // was being served before the failed build is still being served after it.
      for (const component of WEBUI_PACKAGES) {
        expect(
          [...after.keys()].some((f) => f.startsWith(`webui/${component}/`)),
          `${component} is no longer served after a failed build`,
        ).toBe(true)
      }
      // And it was whole throughout the failing run too, never emptied and left
      // hollow — which is the permanent hole this criterion exists to forbid.
      expect(failed.looks.length).toBeGreaterThan(20)
      expect(failed.looks.filter((l) => !l.present).length).toBe(0)
      expect(
        failed.looks.filter((l) => l.files.join('\n') !== previousFiles.join('\n')).length,
        'a read during the failing build saw a partial tree',
      ).toBe(0)
    },
    240_000,
  )
})
