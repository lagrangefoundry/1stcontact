import { mkdirSync, readFileSync, realpathSync, rmSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'

/**
 * A CROSS-PROCESS lock made of one directory, for state that several Vitest
 * workers share on disk (the local D1 file, the served `dist-assets` tree).
 *
 * `mkdir` is the acquire: it is atomic on every filesystem these suites run on
 * and needs no dependency. The holder writes its pid into the directory, so a
 * waiter can tell a crashed holder (pid gone) from a slow one, and breaks only
 * the former. A lock older than `staleMs` is broken too, whoever holds it — so
 * `staleMs` MUST exceed the longest anyone legitimately holds the lock, or a
 * waiter breaks a live one. A waiter gives up after `staleMs` of waiting.
 */
export interface LockOptions {
  /** Age past which a lock is presumed abandoned, and the most a waiter waits. */
  staleMs: number
  /** What the lock guards, for the timeout message. */
  what: string
}

const POLL_MS = 100

function tryAcquire(lock: string): boolean {
  try {
    mkdirSync(lock)
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'EEXIST') throw err
    return false
  }
  try {
    writeFileSync(path.join(lock, 'owner'), String(process.pid))
  } catch {
    /* the directory alone is the lock; the pid only helps detect a crash */
  }
  return true
}

function holderIsGone(lock: string): boolean {
  let pid: number
  try {
    pid = Number(readFileSync(path.join(lock, 'owner'), 'utf8'))
  } catch {
    return false // no pid yet: just acquired, or an older holder — age decides
  }
  if (!Number.isInteger(pid) || pid <= 0) return false
  try {
    process.kill(pid, 0)
    return false
  } catch (err) {
    return (err as NodeJS.ErrnoException).code === 'ESRCH'
  }
}

function breakIfStale(lock: string, staleMs: number): void {
  try {
    if (Date.now() - statSync(lock).mtimeMs > staleMs || holderIsGone(lock)) {
      rmSync(lock, { recursive: true, force: true })
    }
  } catch {
    /* released between the check and the stat */
  }
}

function timedOut(lock: string, what: string): Error {
  return new Error(`Timed out waiting for the ${what} lock at ${lock}.`)
}

function sleepSync(ms: number): void {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms)
}

/** Hold `lock` for the duration of a synchronous `body`. */
export function withLockSync<T>(lock: string, opts: LockOptions, body: () => T): T {
  mkdirSync(path.dirname(lock), { recursive: true })
  const deadline = Date.now() + opts.staleMs
  while (!tryAcquire(lock)) {
    breakIfStale(lock, opts.staleMs)
    if (Date.now() > deadline) throw timedOut(lock, opts.what)
    sleepSync(POLL_MS)
  }
  try {
    return body()
  } finally {
    rmSync(lock, { recursive: true, force: true })
  }
}

/** Hold `lock` for the duration of an asynchronous `body`, waiting without blocking. */
export async function withLock<T>(lock: string, opts: LockOptions, body: () => Promise<T>): Promise<T> {
  mkdirSync(path.dirname(lock), { recursive: true })
  const deadline = Date.now() + opts.staleMs
  while (!tryAcquire(lock)) {
    breakIfStale(lock, opts.staleMs)
    if (Date.now() > deadline) throw timedOut(lock, opts.what)
    await new Promise((resolve) => setTimeout(resolve, POLL_MS))
  }
  try {
    return await body()
  } finally {
    rmSync(lock, { recursive: true, force: true })
  }
}

/**
 * The lock over this checkout's served asset tree (`apps/control-app/dist-assets`).
 *
 * `1c assets` swaps that tree by renaming it away and renaming a shared
 * `.staging` folder into place, so a reader concurrent with a build sees no tree
 * or half of one, and two concurrent builds clear each other's staging. Every
 * suite-initiated build holds this lock for its whole run, and every suite that
 * reads the served tree as evidence holds it across its reads.
 *
 * Held at most ~4 minutes by the longest holder (the asset-swap UAT's 240 s
 * budget), so ten minutes is past any live holder.
 */
export const DIST_ASSETS_LOCK_OPTIONS: LockOptions = { staleMs: 600_000, what: 'dist-assets build' }

export function distAssetsLock(repoRoot: string): string {
  // Real path, so suites that spell the checkout differently (a symlinked
  // prefix, a trailing slash) still contend for the one lock.
  return path.join(realpathSync(repoRoot), 'apps', 'control-app', '.wrangler', 'test-dist-assets.lock')
}

export function withDistAssetsLock<T>(repoRoot: string, body: () => Promise<T>): Promise<T> {
  return withLock(distAssetsLock(repoRoot), DIST_ASSETS_LOCK_OPTIONS, body)
}

export function withDistAssetsLockSync<T>(repoRoot: string, body: () => T): T {
  return withLockSync(distAssetsLock(repoRoot), DIST_ASSETS_LOCK_OPTIONS, body)
}
