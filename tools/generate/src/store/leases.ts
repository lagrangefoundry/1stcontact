import { AsyncLocalStorage } from 'node:async_hooks'
import { SECTION_ID } from './sections'

/**
 * [[REQ-397]] — ONE AGENT PER DRAFT FILE AT A TIME.
 *
 * A session that is going to write a draft file holds a LEASE on it, and a
 * write to a file somebody else holds is refused. That is the whole of the
 * concurrency story for drafts: no scope algebra, no merging. Two builders may
 * run at once exactly when they write different files.
 *
 * THE FILES ARE THE STORE'S OWN UNITS ([[REQ-396]]): the site file `site.json`
 * (palette, text styles, fonts, nav, config), each page as its store name
 * (`home.json` — the whole page, or the frame of a decomposed one), each section
 * of a decomposed page (`home.json#hero`), and each asset (`assets/logo.svg`).
 * Names are compared exactly; holding a frame does not hold its sections.
 *
 * TWO KINDS OF WRITER. A SCOPED writer — a builder session, whose files were
 * declared up front on the delegation and claimed before it opened — may write
 * only those files, plus files it creates. Every other writer (the consultant,
 * the client's own hand edits, a `1c` command) is IMPLICIT: it takes a lease on
 * what it touches for the duration of the write and is refused if a builder
 * holds any of it.
 *
 * LEASES EXPIRE. A holder renews by acting (each builder tool call); one that
 * goes quiet for the idle period loses its files, so a session that dies or is
 * aborted silently cannot hold a file forever. Release is otherwise explicit.
 */

/** The site file's name. */
export const SITE_FILE = 'site.json'

/** An asset's file name. */
export function assetFileName(name: string): string {
  return `assets/${name}`
}

/** True when `name` has the shape of a draft file name. Says nothing about whether it exists. */
export function isDraftFileName(name: string): boolean {
  if (name === SITE_FILE) return true
  if (name.startsWith('assets/')) return name.length > 'assets/'.length && !name.includes('#')
  const [page, section, ...rest] = name.split('#')
  if (rest.length > 0 || !/^[^/#]+\.json$/.test(page) || page === SITE_FILE) return false
  return section === undefined || SECTION_ID.test(section)
}

/** One held file. Times are epoch milliseconds. */
export interface Lease {
  file: string
  holder: string
  acquiredAt: number
  expiresAt: number
}

/**
 * Where leases are kept. D1 in the Worker (`d1-leases.ts`), memory for the
 * single-process `1c` tiers. Every verb ignores expired leases.
 */
export interface DraftLeases {
  /**
   * Take every one of `files` for `holder`, or none of them. A file `holder`
   * already holds is renewed. Throws {@link DraftFileRefusal} (`FILE_HELD`)
   * naming a file somebody else holds.
   */
  acquire(site: string, files: readonly string[], holder: string, idleMs: number): Promise<void>
  /** Push back the expiry of everything `holder` holds on `site`. */
  renew(site: string, holder: string, idleMs: number): Promise<void>
  /** Let go of `files` (all of `holder`'s when omitted). Files held by others are untouched. */
  release(site: string, holder: string, files?: readonly string[]): Promise<void>
  /** Every unexpired lease on `site`, by file name. */
  held(site: string): Promise<Lease[]>
}

/** How long a builder may go without acting before its files are released (5 min). */
export const DEFAULT_LEASE_IDLE_MS = 5 * 60_000

/** How long an implicit write's lease lasts if its release never runs. */
export const IMPLICIT_LEASE_MS = 60_000

/**
 * A write refused because of who holds what. One class, three codes, because a
 * caller (the builder routes, the toolbox) answers all three the same way: the
 * write did not happen, and here is the sentence that says why.
 *
 * - `FILE_HELD` — somebody else holds the file.
 * - `NOT_IN_SCOPE` — a builder wrote a file its delegation did not declare.
 * - `FILE_CHANGED` — the file changed after this call read it (the per-file
 *   compare-and-set); re-read and redo the change.
 *
 * The code is deliberately not one the L1 surface declares, so the Toolbox
 * renders this message to the model verbatim.
 */
export class DraftFileRefusal extends Error {
  readonly name = 'DraftFileRefusal'
  constructor(
    readonly code: 'FILE_HELD' | 'NOT_IN_SCOPE' | 'FILE_CHANGED',
    readonly file: string,
    message: string,
    readonly holder: string | null = null,
    readonly since: number | null = null,
    /** `\`file\` is held by … since … (N min)` — for a caller re-wording the refusal. */
    readonly held: string | null = null,
  ) {
    super(message)
  }
}

/**
 * Who a holder id is, in words. Holder ids are session ids — a builder's
 * `worker-builder-…`, the consultant's `site-…` — or the fixed implicit writers
 * below; an implicit write's lease carries a `~n` suffix that is not part of it.
 */
export function describeHolder(holder: string): string {
  const who = holder.split('~')[0]
  if (who.startsWith('worker-')) return `builder ${who}`
  if (who.startsWith('site-')) return 'the consultant'
  if (who === CLIENT_HOLDER) return "the client's own edit"
  if (who === SYSTEM_HOLDER) return 'another change'
  return who
}

/** `14:02 UTC` — when a lease was taken, as a person reads it. */
export function clockOf(at: number): string {
  return `${new Date(at).toISOString().slice(11, 16)} UTC`
}

/** `since 14:02 UTC (3 min)` — when a lease was taken, and how long ago. */
export function heldSince(at: number, now: number = Date.now()): string {
  return `since ${clockOf(at)} (${Math.max(0, Math.round((now - at) / 60_000))} min)`
}

/**
 * [[BUG-217]] — what the site owner reads when a section they clicked is held:
 * who is on it in their words, and how long ago it started. Never a session id
 * or a UTC clock — those are for logs and 409 bodies (`describeHolder`).
 */
export function busyLine(lease: Lease, now: number = Date.now()): string {
  const who = lease.holder.split('~')[0]
  const what =
    who === CLIENT_HOLDER
      ? "You're already saving a change to this section"
      : who === SYSTEM_HOLDER
        ? 'Another change is being applied to this section'
        : 'Your AI assistant is updating this section right now'
  const minutes = Math.max(0, Math.round((now - lease.acquiredAt) / 60_000))
  const started = minutes < 1 ? 'just now' : `${minutes} minute${minutes === 1 ? '' : 's'} ago`
  return `${what} (started ${started}).`
}

/** The refusal for a file somebody else holds, as of `now`. */
export function heldRefusal(lease: Lease, now: number): DraftFileRefusal {
  const held = `\`${lease.file}\` is held by ${describeHolder(lease.holder)} ${heldSince(lease.acquiredAt, now)}`
  return new DraftFileRefusal(
    'FILE_HELD',
    lease.file,
    `${held}; nothing was written. It is free again when that work finishes.`,
    lease.holder,
    lease.acquiredAt,
    held,
  )
}

/** The implicit holder for the client's own edits in the builder. */
export const CLIENT_HOLDER = 'client'

/** The implicit holder for a write nobody attributed. */
export const SYSTEM_HOLDER = 'system'

/**
 * Who is writing, for the duration of one call. `scope` null is an implicit
 * writer; a list is a builder's declared files.
 */
export interface Writer {
  holder: string
  scope: readonly string[] | null
  /** How long a scoped writer's leases last between acts. */
  idleMs?: number
}

/** What one call has read, per site and file, so its write can be checked against it. */
export interface WriteContext {
  writer: Writer
  read: Map<string, Map<string, string>>
}

const context = new AsyncLocalStorage<WriteContext>()

/**
 * Run `fn` as `writer`. Everything `fn` reads and writes through a leased store
 * is attributed to that writer, and its writes are compared against what it
 * read. Contexts nest: the innermost writer wins, with a fresh record of reads.
 */
export function asWriter<T>(writer: Writer, fn: () => T): T {
  return context.run({ writer, read: new Map() }, fn)
}

/** The current call's context, or undefined outside any {@link asWriter}. */
export function currentWrite(): WriteContext | undefined {
  return context.getStore()
}

/** Leases held in this process. Correct where one process is the only writer (`1c`). */
export function memoryLeases(now: () => number = Date.now): DraftLeases {
  const sites = new Map<string, Map<string, Lease>>()
  const live = (site: string): Map<string, Lease> => {
    const held = sites.get(site) ?? new Map<string, Lease>()
    sites.set(site, held)
    const t = now()
    for (const [file, lease] of held) if (lease.expiresAt <= t) held.delete(file)
    return held
  }
  return {
    async acquire(site, files, holder, idleMs) {
      const held = live(site)
      for (const file of files) {
        const lease = held.get(file)
        if (lease && lease.holder !== holder) throw heldRefusal(lease, now())
      }
      const t = now()
      for (const file of files) {
        held.set(file, { file, holder, acquiredAt: held.get(file)?.acquiredAt ?? t, expiresAt: t + idleMs })
      }
    },
    async renew(site, holder, idleMs) {
      const t = now()
      for (const lease of live(site).values()) if (lease.holder === holder) lease.expiresAt = t + idleMs
    },
    async release(site, holder, files) {
      const held = live(site)
      for (const [file, lease] of held) {
        if (lease.holder === holder && (!files || files.includes(file))) held.delete(file)
      }
    },
    async held(site) {
      return [...live(site).values()].map((l) => ({ ...l })).sort((a, b) => a.file.localeCompare(b.file))
    },
  }
}

const LOCAL = new Map<string, DraftLeases>()

/**
 * The in-process leases for one local workspace, shared by everything in this
 * process that writes it — the `1c` builder's routes and its assistant — so they
 * see one table, as the Worker's routes and sessions share one D1 table.
 */
export function localLeases(workspace: string): DraftLeases {
  let leases = LOCAL.get(workspace)
  if (!leases) {
    leases = memoryLeases()
    LOCAL.set(workspace, leases)
  }
  return leases
}
