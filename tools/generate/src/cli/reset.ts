import fs from 'node:fs'
import net from 'node:net'
import path from 'node:path'

/**
 * `1c reset` — put the local dev store back to a known-empty state (BUG-51).
 *
 * WHY A COMMAND EXISTS AT ALL. BUG-51 is a site that vanished because something
 * overwrote it without being asked. The fix for that is the guards on the import
 * route and on provisioning; this is the other half, and it is not optional. An
 * operator who cannot deliberately get back to empty will get back to empty
 * accidentally — by deleting a directory they guessed at, or by publishing a
 * scaffold over something. The way to stop an accident is not "be careful", it
 * is to make the deliberate version obvious enough that nobody improvises one.
 *
 * WHAT "THE LOCAL DEV STORE" IS. `1c builder` runs `wrangler dev`, which
 * persists D1 and R2 to `<app>/.wrangler/state` and reads them back on the next
 * start. That directory is therefore the whole of what survives a restart: every
 * site, page, change journal, asset, published revision, chat transcript,
 * ticket, tenant, user and audit record. There is no second place and no partial
 * reset — removing it is exactly what a fresh clone would have.
 *
 * WHAT IS NEVER TOUCHED, and why it is stated rather than merely omitted.
 * `storage/` holds the operator's git-tracked authored sites, which are the only
 * copy a re-seed can come from. A reset that took those with it would be
 * unrecoverable BY DESIGN, which is the failure this ticket is about, committed
 * a second time by the command meant to answer it. {@link ResetPlan.preserved}
 * puts that in the preview so it is a promise the operator can read, not one
 * they have to take on trust.
 */

/** One state directory a reset would remove. */
export interface ResetTarget {
  /** The app it belongs to, repo-relative — what the operator recognises. */
  readonly label: string
  /** Absolute path, because a preview that names a relative path names nothing. */
  readonly dir: string
  readonly present: boolean
  /** Files beneath it, 0 when absent. */
  readonly files: number
  /** Bytes beneath it, 0 when absent. */
  readonly bytes: number
}

export interface ResetPlan {
  readonly targets: readonly ResetTarget[]
  /** Repo-relative directories this command will not touch, for the preview. */
  readonly preserved: readonly string[]
}

/** The state directory `wrangler dev` persists to, relative to an app. */
export const STATE_DIR = path.join('.wrangler', 'state')

/** The apps that hold one, in the order the preview lists them. */
const CONTROL_APP = path.join('apps', 'control-app')
const PUBLIC_SITE = path.join('apps', 'public-site')

/**
 * What a reset would remove, without removing anything.
 *
 * REPO-ANCHORED, NOT CWD-ANCHORED, for the reason BUG-50 gave for `1c builder`:
 * a command that derives `apps/control-app` from the working directory only
 * works when typed at the repo root, and any package script that calls it
 * inherits that as a silent requirement rather than as a mistake someone makes
 * visibly once.
 */
export function resetPlan(opts: {
  repoRoot: string
  /** Include the public site's own miniflare state (published output). */
  includePublic?: boolean
  /** Seam for tests; defaults to a real recursive walk. */
  measure?: (dir: string) => { present: boolean; files: number; bytes: number }
}): ResetPlan {
  const measure = opts.measure ?? measureDir
  const apps = [CONTROL_APP, ...(opts.includePublic === true ? [PUBLIC_SITE] : [])]
  return {
    targets: apps.map((app) => {
      const dir = path.join(opts.repoRoot, app, STATE_DIR)
      return { label: path.join(app, STATE_DIR), dir, ...measure(dir) }
    }),
    // Named individually rather than as "everything else": the point of the line
    // is that the operator can check the two they care about are on it.
    preserved: ['storage/sites', 'storage/chat', 'storage/references'],
  }
}

/** Files and bytes beneath `dir`, or absent. Symlinks are counted, never followed. */
export function measureDir(dir: string): { present: boolean; files: number; bytes: number } {
  if (!fs.existsSync(dir)) return { present: false, files: 0, bytes: 0 }
  let files = 0
  let bytes = 0
  const walk = (at: string): void => {
    for (const entry of fs.readdirSync(at, { withFileTypes: true })) {
      const full = path.join(at, entry.name)
      if (entry.isDirectory()) {
        walk(full)
        continue
      }
      files += 1
      // A file that disappears mid-walk is not an error worth failing a PREVIEW
      // over — the number is there to give the operator a sense of scale, and a
      // reset that refused because the size was off by one file would be absurd.
      try {
        bytes += fs.lstatSync(full).size
      } catch {
        /* counted, unmeasured */
      }
    }
  }
  walk(dir)
  return { present: true, files, bytes }
}

/**
 * Is something answering on the builder's port?
 *
 * THE RESET REFUSES WHILE IT IS, and that refusal is about correctness rather
 * than tidiness. A running miniflare holds those SQLite files open with a WAL
 * and a shared-memory segment beside them; deleting the tree underneath it does
 * not reset the store, it leaves the process writing to unlinked inodes and the
 * next start reading whatever was recreated. The operator would get a BROKEN
 * server rather than an empty one, and would have no reason to connect the two.
 *
 * A CONNECT, NOT A PID FILE OR A PROCESS SCAN. What matters is whether something
 * has the store open on the port this repo's builder uses, and the only honest
 * test of that is to reach it. A pid file can be stale; a process scan matches
 * another checkout's server, which is a different store entirely.
 */
export function builderIsRunning(port: number, timeoutMs = 400): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket()
    const done = (answer: boolean): void => {
      socket.removeAllListeners()
      socket.destroy()
      resolve(answer)
    }
    socket.setTimeout(timeoutMs)
    socket.once('connect', () => done(true))
    // Refused, unreachable or too slow to answer all mean the same thing here:
    // nothing this command can corrupt is listening.
    socket.once('timeout', () => done(false))
    socket.once('error', () => done(false))
    socket.connect(port, '127.0.0.1')
  })
}

export interface ResetOutcome {
  /** The targets actually removed. Empty on a preview. */
  readonly removed: readonly ResetTarget[]
}

/**
 * Remove every present target in `plan`.
 *
 * Absent targets are skipped rather than reported as failures: "already empty"
 * is a successful reset, and the command that says otherwise is the one an
 * operator learns to ignore.
 */
export function performReset(
  plan: ResetPlan,
  remove: (dir: string) => void = (dir) => fs.rmSync(dir, { recursive: true, force: true }),
): ResetOutcome {
  const removed: ResetTarget[] = []
  for (const target of plan.targets) {
    if (!target.present) continue
    remove(target.dir)
    removed.push(target)
  }
  return { removed }
}

/** `12.3 MB` — for a preview, where the exact byte count answers no question. */
export function humanBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  const units = ['KB', 'MB', 'GB', 'TB']
  let value = bytes / 1024
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit += 1
  }
  return `${value.toFixed(1)} ${units[unit]}`
}
