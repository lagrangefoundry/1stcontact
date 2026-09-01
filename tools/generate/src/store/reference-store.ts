/**
 * The `ReferenceStore` port (REQ-155): everything a capture bundle needs from
 * storage, and nothing that says where storage is.
 *
 * WHY IT EXISTS. [[REQ-154]] gave the cloud a browser; it did not give it
 * anywhere to put what the browser produced. `capture/bundle.ts` wrote a bundle
 * as a directory tree — seventeen `mkdirSync`/`writeFileSync` call sites — and
 * `capture/reextract.ts` read one back with `readdirSync`. None of that exists in
 * a Worker. This is the same seam {@link SiteStore} is, cut for the same reason
 * and separated into its own ticket for the same one: a storage contract buried
 * inside a feature change is a storage contract nobody reviewed.
 *
 * A PORT, NOT A REDESIGN. [[DOC-13]] §8 is explicit — *"`storage/references/`
 * bytes move to R2. The capture pipeline, schema, and bundle are unchanged."* A
 * bundle written by the laptop and one written by the cloud are the same
 * artifact, readable by either, member for member. Nothing here invents a new
 * bundle shape; the member names below are the names already on disk.
 *
 * TWO LEVELS, BECAUSE A BUNDLE IS THE UNIT. Every verb that touches a capture
 * already operates on a whole bundle — `--ref <dir>` names one, `refold` rewrites
 * two of its members, the gate reads three. So the handle a codec function takes
 * is a {@link ReferenceBundle}, not a store plus a name it has to keep passing;
 * {@link ReferenceStore} is what hands one out, and {@link ReferenceStoreRoot} is
 * what binds a tenant before either exists.
 *
 * NO PATHS, for the reason `site-store.ts` sets out at length: a verb handing
 * back a filesystem location is the filesystem leaking through the port, and a
 * caller that takes one is a caller the R2 adapter cannot serve. Members move as
 * bytes. The one string that looks like a path — a member key such as
 * `assets/hero.jpg` — is a KEY: it is what the member is called inside the
 * bundle, it is what a directory happens to name a file, and it is
 * forward-slashed on every adapter regardless of the host's separator.
 *
 * ASYNC, TOTALLY. R2 is async, so every verb is, including the ones the
 * filesystem could answer synchronously. A port with a fast half and a slow half
 * is a port callers learn the shape of, and the whole point is that they cannot
 * tell which adapter they got. The cost is real and was priced in the ticket:
 * `cmdRepro`, `cmdRefold`, `cmdL1Gate`, `referenceCoverage` and
 * `cmdResponsiveDiff` all become async because their dependency did.
 *
 * WHAT IS NOT HERE. There is no `delete`, because nothing deletes a bundle
 * today: re-capturing a URL replaces its members in place (see
 * {@link bundleNameFor}), and bundle retention — [[DOC-38]] §12's detach-and-sweep
 * — is a lifecycle policy above this layer rather than a verb on it.
 */

/** The capture record. */
export const CAPTURE_MEMBER = 'capture.json'
/** The full-page screenshot (the default desktop shot). */
export const SCREENSHOT_MEMBER = 'screenshot.full.png'
/** The post-script DOM — the AI's escape hatch, and what re-extraction serves. */
export const RENDERED_MEMBER = 'rendered.html'
/** The original server response, pre-script. */
export const RAW_MEMBER = 'raw.html'
/** The multi-viewport projection matrix — the acceptance oracle (REQ-48). */
export const MULTISTATE_MEMBER = 'multistate.json'
/** The ladder folded into one L1 document (REQ-83). */
export const L1_MEMBER = 'l1.json'
/** The behaviour bindings the fold recovered (REQ-93). */
export const FORMS_MEMBER = 'forms.json'
/** The advisory structural-hint sidecar (REQ-83). */
export const HINTS_MEMBER = 'hints.json'
/** Every mirrored subresource lives under this prefix. */
export const ASSETS_PREFIX = 'assets/'

/** The per-width reference screenshot's member key (REQ-61). */
export function ladderMember(width: number): string {
  return `screenshot-${width}.png`
}

/**
 * Storage for one bundle's members.
 *
 * Deliberately byte-level and untyped: the bundle's *schemas* are
 * `capture/bundle.ts`'s business and are the same on every adapter, so putting
 * them here would make each adapter re-implement a codec and give three places
 * for one JSON shape to be.
 */
export interface ReferenceBundle {
  /** What this bundle is called in the store. See {@link bundleNameFor}. */
  readonly name: string

  /** One member's bytes, or null when the bundle holds no such member. */
  read(member: string): Promise<Uint8Array | null>

  /** Write one member's bytes, creating or replacing it. */
  write(member: string, bytes: Uint8Array): Promise<void>

  /**
   * The bundle's member keys, sorted, optionally restricted to those under
   * `prefix`.
   *
   * THIS IS THE VERB `SiteStore` DID NOT NEED. `reextract.ts` has to know which
   * subresources a bundle actually mirrored — it rewrites absolute URLs to
   * loopback-relative ones only for basenames it holds — and a bundle's asset
   * set is not recorded anywhere else. R2 lists by prefix and the filesystem
   * lists by directory; one verb, two implementations.
   */
  list(prefix?: string): Promise<string[]>
}

/** The bundles one tenant holds. */
export interface ReferenceStore {
  /**
   * A handle on one bundle. Cheap and total: it does not check the bundle
   * exists, because a capture's first act is to write into a bundle that does
   * not, and a store that refused would have to grow a create verb whose only
   * caller is the thing that would rather just write.
   */
  bundle(name: string): ReferenceBundle

  /** The names of every bundle this store holds, sorted. */
  list(): Promise<string[]>
}

/**
 * The store before a tenant is chosen — the R2 adapter's entry point.
 *
 * Mirrors {@link SiteStoreRoot} exactly, including the async, because the tenant
 * is *checked* here and deferring that check to the first read would move the
 * failure to somewhere it reads as an empty bundle. The filesystem adapter has
 * no root: it serves one operator, there is no registry to check against, and a
 * `forTenant` that always said yes would be a barrier in name only.
 */
export interface ReferenceStoreRoot {
  forTenant(tenantId: string): Promise<ReferenceStore>
}

/** Turn a URL path into a single safe name segment. */
export function pathSlug(urlPath: string): string {
  const trimmed = urlPath.replace(/^\/+|\/+$/g, '')
  if (!trimmed) return 'index'
  return trimmed.replace(/[^a-zA-Z0-9._-]+/g, '_')
}

/**
 * A capture's bundle name: `<host>/<pathSlug>` ([[DOC-13]] §4).
 *
 * URL-DERIVED AND OVERWRITING, DELIBERATELY. REQ-155 asked for a name derived
 * from the URL *and the capture time*; the time lives in `capture.json`'s
 * `capturedAt` instead, and the name does not carry it, for three reasons.
 * Re-capturing a URL must keep replacing it in place — that is today's semantics
 * and what [[DOC-13]] §9's "capture once, re-map forever" assumes when it re-maps
 * *the* bundle for a site. `--ref storage/references/<host>/<path>` is a path an
 * operator types and a runbook records. And a name a caller cannot predict is a
 * name every verb downstream has to be handed rather than derive.
 *
 * What the ticket was actually guarding against — a name taken from whatever
 * directory the caller happened to choose — is what this replaces: the name comes
 * from the captured URL on every adapter, and the filesystem's directory is
 * derived from it rather than the other way round.
 *
 * A timestamped scheme with a `latest` alias remains available and is additive:
 * it changes this function and nothing above it.
 */
export function bundleNameFor(capture: { host: string; path: string }): string {
  return `${capture.host}/${pathSlug(capture.path)}`
}
