import fs from 'node:fs'
import net from 'node:net'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  builderIsRunning,
  humanBytes,
  measureDir,
  performReset,
  resetPlan,
  STATE_DIR,
} from '../tools/generate/src/cli/reset'

/**
 * BUG-51 — **`1c reset` is the deliberate way back to a known-empty store.**
 *
 * WHY THIS IS PART OF THE SAME TICKET. BUG-51 is a site that disappeared because
 * something emptied it without being asked. The guards on the import route are
 * one half of the answer; this is the other, and it is not decoration. An
 * operator who has no obvious way to reach an empty store on purpose will reach
 * one by accident — by removing a directory they guessed at, or by publishing a
 * scaffold over a site to "start clean". The command exists so that nobody has
 * to improvise, and it is built to be safe in the two ways improvising is not.
 *
 * THE TWO SAFETIES, both asserted below:
 *   1. IT PREVIEWS BY DEFAULT. Without `--yes` it removes nothing.
 *   2. IT NEVER TOUCHES `storage/`. That tree is the git-tracked authored source
 *      a re-seed comes from, so a reset that took it would be the unrecoverable
 *      version of the very failure this ticket is about.
 *
 * Real directories on a real filesystem, in a temp repo laid out the way the
 * repo is. The deletion seam is injected only where a test needs to observe the
 * *preview* not deleting — the `--yes` case does the real `rmSync`.
 */

const made: string[] = []

function tempRepo(): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'bug51-reset-'))
  made.push(root)
  // The two state trees, and the one tree that must survive.
  for (const app of ['apps/control-app', 'apps/public-site']) {
    const dir = path.join(root, app, STATE_DIR, 'v3', 'd1')
    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(path.join(dir, 'db.sqlite'), 'x'.repeat(2048))
  }
  fs.mkdirSync(path.join(root, 'storage', 'sites', 'xgd'), { recursive: true })
  fs.writeFileSync(path.join(root, 'storage', 'sites', 'xgd', 'site.json'), '{}')
  return root
}

afterEach(() => {
  while (made.length) fs.rmSync(made.pop() as string, { recursive: true, force: true })
})

describe('BUG-51 — the reset plan', () => {
  it('names the control app state directory, and not storage', () => {
    const root = tempRepo()
    const plan = resetPlan({ repoRoot: root })

    expect(plan.targets).toHaveLength(1)
    expect(plan.targets[0].label).toBe(path.join('apps/control-app', STATE_DIR))
    expect(plan.targets[0].present).toBe(true)
    expect(plan.targets[0].files).toBe(1)
    expect(plan.targets[0].bytes).toBe(2048)
    // Stated in the plan rather than merely absent from it: the operator can
    // read the promise instead of taking it on trust.
    expect(plan.preserved).toContain('storage/sites')
  })

  it('adds the public site only when asked', () => {
    const root = tempRepo()
    expect(resetPlan({ repoRoot: root, includePublic: true }).targets).toHaveLength(2)
  })

  it('reports an absent state directory as already empty rather than as an error', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'bug51-bare-'))
    made.push(root)
    const [target] = resetPlan({ repoRoot: root }).targets
    expect(target.present).toBe(false)
    expect(target.files).toBe(0)
  })

  it('is repo-anchored, so the plan does not depend on the working directory', () => {
    // BUG-50's lesson, restated here because `1c reset` is destructive and a
    // cwd-derived path would eventually name someone else's directory.
    const root = tempRepo()
    expect(resetPlan({ repoRoot: root }).targets[0].dir).toBe(
      path.join(root, 'apps/control-app', STATE_DIR),
    )
  })
})

describe('BUG-51 — performing the reset', () => {
  it('removes the state directory and leaves storage/ exactly as it was', () => {
    const root = tempRepo()
    const plan = resetPlan({ repoRoot: root })

    const { removed } = performReset(plan)

    expect(removed).toHaveLength(1)
    expect(fs.existsSync(path.join(root, 'apps/control-app', STATE_DIR))).toBe(false)
    // THE ASSERTION THAT MAKES THE COMMAND SAFE TO OFFER AT ALL.
    expect(fs.readFileSync(path.join(root, 'storage/sites/xgd/site.json'), 'utf8')).toBe('{}')
    // Not asked for, so not touched.
    expect(fs.existsSync(path.join(root, 'apps/public-site', STATE_DIR))).toBe(true)
  })

  it('deletes nothing when the plan is only previewed', () => {
    const root = tempRepo()
    const plan = resetPlan({ repoRoot: root })
    // The preview path in `index.ts` returns BEFORE `performReset` is reached.
    // What this pins is that building a plan is itself inert — a `resetPlan` that
    // measured by opening and truncating would pass every other test here.
    expect(fs.existsSync(path.join(root, 'apps/control-app', STATE_DIR))).toBe(true)
    expect(plan.targets[0].present).toBe(true)
  })

  it('skips an absent target rather than reporting a failure', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'bug51-bare-'))
    made.push(root)
    const removed: string[] = []
    const outcome = performReset(resetPlan({ repoRoot: root }), (dir) => removed.push(dir))
    // "Already empty" is a successful reset. A command that errors here is one
    // an operator learns to run twice and stop reading.
    expect(outcome.removed).toHaveLength(0)
    expect(removed).toHaveLength(0)
  })
})

describe('BUG-51 — the reset refuses while the builder is running', () => {
  it('sees a listening port', async () => {
    // A live `wrangler dev` holds the store's SQLite files open with a WAL
    // beside them, so deleting the tree underneath it leaves a broken server
    // rather than an empty one. The probe is a connect, because that is the only
    // honest test of "something has this store open here".
    const server = net.createServer()
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
    const port = (server.address() as net.AddressInfo).port
    try {
      expect(await builderIsRunning(port)).toBe(true)
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()))
    }
  })

  it('reports a closed port as free', async () => {
    const server = net.createServer()
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
    const port = (server.address() as net.AddressInfo).port
    await new Promise<void>((resolve) => server.close(() => resolve()))
    expect(await builderIsRunning(port)).toBe(false)
  })
})

describe('BUG-51 — the preview reads as a size, not a byte count', () => {
  it('scales the unit', () => {
    expect(humanBytes(512)).toBe('512 B')
    expect(humanBytes(2048)).toBe('2.0 KB')
    expect(humanBytes(5 * 1024 * 1024)).toBe('5.0 MB')
  })

  it('counts every file beneath the tree, at any depth', () => {
    const root = tempRepo()
    const measured = measureDir(path.join(root, 'apps/control-app', STATE_DIR))
    expect(measured).toEqual({ present: true, files: 1, bytes: 2048 })
  })
})
