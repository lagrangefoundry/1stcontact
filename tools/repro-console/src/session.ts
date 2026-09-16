/**
 * Carrying a round's context forward across iterations ([[REQ-261]] behavior 3).
 *
 * Every round used to be a fresh `claude -p`. Each one re-derived its bearings —
 * which files matter, what this site is, what it already ruled out — and a
 * second iteration on the same reproduction knew nothing of what the first
 * diagnosed. That is most of a round's reading spent twice.
 *
 * ## The scope, and why it is this one
 *
 * **One session per reproduction chain**: per site slug, for as long as the
 * chain of iterations under it is reproducing the SAME reference. That is the
 * unit because it is the unit the value comes from — a resumed round is cheaper
 * because it already knows *this page*, and it knows nothing useful about a
 * different one.
 *
 * ## What resets it, and why
 *
 * Resume is valuable because the round remembers, and dangerous for exactly the
 * same reason: it anchors the round on last round's hypothesis when the evidence
 * underneath it has moved, and its context grows without bound along a long
 * chain. Both risks are the brief's one rule turned against it — a round
 * reasoning from what it remembers rather than from what this iteration captured
 * is reconstructing, which is the failure mode loop 1 exists to remove. So the
 * chain is cut on any of three things:
 *
 *  1. **The reference moved** — a different bundle, or the same site re-captured.
 *     The remembered numbers are then about a page that no longer exists, and
 *     nothing in the memory can be trusted as a pointer either.
 *  2. **The brief changed** — a resumed round is not re-sent the brief (that is
 *     the point: re-sending it would grow the context by its own length every
 *     iteration), so a round resumed across an edit would be running the old
 *     instructions invisibly.
 *  3. **{@link RESUME_MAX_ROUNDS} rounds** — the bound on context growth, and on
 *     how long one hypothesis may keep its grip. Chosen small: the value of
 *     resume is front-loaded (the second round gains most) and the risk is not.
 *
 * A reset is never an error and is never announced as one. It is one round
 * paying the full reading cost again, which is what the first round of every
 * chain pays anyway.
 *
 * SCRATCH, LIKE THE GAP REGISTRY. The record lives beside the iterations it
 * belongs to. Losing it costs one un-resumed round.
 */
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'

/** How many rounds one session may carry before the chain is cut. */
export const RESUME_MAX_ROUNDS = 5

/** What a reproduction remembers about the session its rounds have been running in. */
export interface RoundSession {
  /** The CLI session id, as its own init event reported it. */
  sessionId: string
  /** The reference bundle the chain has been reproducing. */
  bundleDir: string
  /** The brief the chain was started under — see reset rule 2. */
  briefHash: string
  /** How many rounds have run in this session. */
  rounds: number
}

/** The session record, inside the site's own directory in the console workspace. */
export function sessionFile(siteDir: string): string {
  return path.join(siteDir, 'ai-session.json')
}

/** A short, stable fingerprint of the brief the chain was started under. */
export function briefFingerprint(brief: string): string {
  return createHash('sha256').update(brief).digest('hex').slice(0, 12)
}

/**
 * The session this site's rounds have been using, or none.
 *
 * An unreadable record is treated as none, for the same reason the gap registry
 * is: the cost is one un-resumed round, and refusing to run would be worse.
 */
export function readSession(siteDir: string): RoundSession | null {
  const file = sessionFile(siteDir)
  if (!existsSync(file)) return null
  try {
    const parsed = JSON.parse(readFileSync(file, 'utf8')) as Partial<RoundSession>
    if (typeof parsed.sessionId !== 'string' || !parsed.sessionId) return null
    return {
      sessionId: parsed.sessionId,
      bundleDir: typeof parsed.bundleDir === 'string' ? parsed.bundleDir : '',
      briefHash: typeof parsed.briefHash === 'string' ? parsed.briefHash : '',
      rounds: typeof parsed.rounds === 'number' ? parsed.rounds : 0,
    }
  } catch {
    return null
  }
}

export function writeSession(siteDir: string, session: RoundSession): void {
  mkdirSync(siteDir, { recursive: true })
  writeFileSync(sessionFile(siteDir), JSON.stringify(session, null, 2))
}

/** Cut the chain. The next round starts a new session and pays full price. */
export function clearSession(siteDir: string): void {
  rmSync(sessionFile(siteDir), { force: true })
}

/** What this round is reproducing, judged against what the saved chain was. */
export interface ResumeContext {
  bundleDir: string
  briefHash: string
}

/**
 * The session id this round may resume, or none — the three reset rules, applied.
 *
 * Returns the id rather than a boolean so the caller has nothing left to decide:
 * the rules live here, in one place, next to the reasoning for them.
 */
export function resumableSession(saved: RoundSession | null, ctx: ResumeContext): string | null {
  if (!saved) return null
  if (saved.bundleDir !== ctx.bundleDir) return null
  if (saved.briefHash !== ctx.briefHash) return null
  if (saved.rounds >= RESUME_MAX_ROUNDS) return null
  return saved.sessionId
}

/**
 * Record what the round just ran in, so the next one can continue it.
 *
 * The id comes from the round's own init event rather than from anything the
 * console chose: the CLI owns session identity, and a console that minted one
 * would be asserting a fact about a conversation it is not in.
 */
export function recordSession(
  siteDir: string,
  ctx: ResumeContext,
  sessionId: string | undefined,
  resumed: boolean,
): void {
  if (!sessionId) {
    // No init event means no session to continue. Leaving a stale record would
    // have the next round resume a conversation that may not be the one it
    // thinks; clearing costs that round its resume and nothing else.
    if (!resumed) clearSession(siteDir)
    return
  }
  const saved = resumed ? readSession(siteDir) : null
  writeSession(siteDir, {
    sessionId,
    bundleDir: ctx.bundleDir,
    briefHash: ctx.briefHash,
    rounds: (saved?.rounds ?? 0) + 1,
  })
}
