import { leasesOf } from '../../store/leased-store'
import {
  asWriter,
  DraftFileRefusal,
  isDraftFileName,
  type DraftLeases,
  type Writer,
} from '../../store/leases'
import { sectionFileName } from '../../store/sections'
import type { SiteStore } from '../../store/site-store'

/**
 * [[REQ-397]] — the host's half of draft-file leases: a builder's declared files
 * claimed before it opens, and every session's tool calls run as a known writer.
 * ([[BUG-215]] withdrew the build's status line naming what is held: worker ids
 * and file names are plumbing the client never sees.)
 *
 * THE FRAMEWORK'S HALF IS lagrange-framework REQ-207: Delegate takes an opaque
 * `scope`, a worker config's `claim` hook runs before the worker session exists,
 * a refusal comes back as `scope_held` with this host's sentence and costs
 * nothing, and the release handle runs in the `finally` that ends the
 * delegation whatever ended it. Against a framework without it the hook is never
 * called, no builder is scoped, and every builder write is an implicit one —
 * still refused on a file somebody else holds.
 */

/** The AI library is untyped JavaScript; the boundary is here, as in the host. */
type Untyped = any // eslint-disable-line @typescript-eslint/no-explicit-any

/** The installed Delegate operation, or null. */
function delegateOperation(lib: Untyped): Record<string, unknown> | null {
  const operations = (lib?.DelegationToolbox?.DECLARATION?.operations ?? []) as Array<Record<string, unknown>>
  return operations.find((op) => op.op === 'delegate') ?? null
}

/** Whether the installed framework's Delegate takes a `scope` (REQ-207). */
export function scopeSupported(lib: Untyped): boolean {
  const params = delegateOperation(lib)?.params
  return params !== null && typeof params === 'object' && 'scope' in (params as object)
}

/** Whether the installed framework runs Delegate calls concurrently (REQ-207). */
export function concurrentSupported(lib: Untyped): boolean {
  return delegateOperation(lib)?.concurrent === true
}

/**
 * The files a delegation's `scope` names, validated and expanded. A page name
 * claims the page and, where the page is stored as sections, every section it
 * has now — so "build the About page" is one name. It does NOT claim the page's
 * style (`home.json#style`, [[REQ-406]]): a builder briefed on a page must not
 * repaint the whole of it to fix one part, so the style is claimed only when
 * named. Anything that is not a draft file name is refused with the list of
 * what is.
 */
export async function scopeFiles(store: SiteStore, slug: string, scope: unknown): Promise<string[]> {
  if (scope === undefined || scope === null) return []
  if (!Array.isArray(scope) || scope.some((f) => typeof f !== 'string')) {
    throw new Error('scope must be a list of draft file names.')
  }
  const bad = (scope as string[]).filter((f) => !isDraftFileName(f))
  if (bad.length) {
    throw new Error(
      `${bad.map((f) => `'${f}'`).join(', ')} ${bad.length === 1 ? 'is not a draft file name' : 'are not draft file names'}. ` +
        'Files are site.json, a page (home.json), a section (home.json#hero), a page\'s style (home.json#style) ' +
          'or an asset (assets/logo.svg).',
    )
  }
  const files = new Set(scope as string[])
  const pages = await store.readPages(slug)
  for (const page of pages) {
    if (!files.has(page.name)) continue
    for (const id of page.sections ?? []) files.add(sectionFileName(page.name, id))
  }
  return [...files].sort()
}

/** Run each call as `writer`, renewing a scoped writer's leases first. */
function around(leases: DraftLeases, slug: string, writer: () => Writer) {
  return async <T>(run: () => Promise<T>): Promise<T> => {
    const who = writer()
    if (who.scope !== null) await leases.renew(slug, who.holder, who.idleMs ?? 0)
    return asWriter(who, run)
  }
}

/** [[REQ-410]] — the refusal for a delegation that names no files. */
export const NO_SCOPE =
  'This builder names no files in `scope`, so it was not started and nothing was spent. Name the files it ' +
  "will write: a section (`home.json#hero`), a page (`home.json`), a page's style (`home.json#style`), " +
  '`site.json`, or a picture (`assets/logo.svg`).'

/** What a site's host needs to lease draft files, or null when its store is not leased. */
export interface DraftClaims {
  /** The worker config's `claim` hook (REQ-207). */
  claim(scope: unknown, ids: { workerSid: string }): Promise<() => Promise<void>>
  /** Wrap one worker session's tool calls. */
  worker(sid: string): <T>(run: () => Promise<T>) => Promise<T>
  /** Wrap the consultant's tool calls. */
  consultant(sid: string): <T>(run: () => Promise<T>) => Promise<T>
}

export function draftClaims(store: SiteStore, slug: string, idleMs: number): DraftClaims | null {
  const leases = leasesOf(store)
  if (!leases) return null
  const scopes = new Map<string, readonly string[]>()
  return {
    async claim(scope, { workerSid }) {
      const files = await scopeFiles(store, slug, scope)
      // [[REQ-410]] — a builder that names no files holds none, so nothing can
      // run beside it and every existing file it touches is refused. Refused
      // here, before it opens, rather than after it has spent its run finding out.
      if (files.length === 0) throw new Error(NO_SCOPE)
      try {
        await leases.acquire(slug, files, workerSid, idleMs)
      } catch (err) {
        if (!(err instanceof DraftFileRefusal) || err.held === null) throw err
        throw new Error(
          `${err.held}, so this builder was not started and nothing was spent. Wait for that work to finish, ` +
            'or give this builder files nobody holds.',
        )
      }
      scopes.set(workerSid, files)
      return async () => {
        scopes.delete(workerSid)
        await leases.release(slug, workerSid)
      }
    },
    worker: (sid) =>
      around(leases, slug, () => ({ holder: sid, scope: scopes.get(sid) ?? null, idleMs })),
    consultant: (sid) => around(leases, slug, () => ({ holder: sid, scope: null })),
  }
}
