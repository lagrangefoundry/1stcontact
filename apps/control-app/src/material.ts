/**
 * Ingestion — from a dropped file to an indexed `material` ticket (REQ-163).
 *
 * [[DOC-38]] §10 specifies the path from bytes to knowledge and nothing
 * implemented it. [[REQ-162]] gave the tickets somewhere to live; this creates
 * them, and until it existed there was no way to put a byte into the system at
 * all.
 *
 * THE FIVE STEPS, AND WHERE EACH ONE ACTUALLY RUNS:
 *
 *   1. **Store the blob** — the ticketing component's `attach`, which puts the
 *      bytes and then writes the record. Content-addressed inside the tenant
 *      prefix, so one file uploaded twice is one blob and two records.
 *   2. **Classify** — {@link classify} below. `kind` from the content type;
 *      **`rights` from PROVENANCE, never from a question**.
 *   3. **Describe** — `describe.ts`. The step that makes the material findable.
 *   4. **Create the ticket** with that description as its body, plus §9's fields.
 *   5. **Index incrementally** — {@link IngestDeps.index}, wired in the router to
 *      the project KB's own `onMaterialWritten`.
 *
 * THE ORDER IS 4 THEN 1, NOT 1 THEN 4, AND THE CRASH PROPERTY SURVIVES IT.
 * [[DOC-38]] §7.3 asks for blob-first-then-record so that a crash leaves an
 * orphan blob a sweep collects rather than a dangling pointer nothing can heal.
 * `attach` needs a subject ticket to hang off, so the material record is created
 * first — but the material record HOLDS NO POINTER. The sha256 lives on the
 * attachment record, and `attach` writes the blob before it. So the two things a
 * crash can leave are a material with no bytes (visible, honest, sweepable) and a
 * blob with no record (collected). Neither is a record naming absent bytes, which
 * is the failure §7.3 names.
 *
 * WHAT IS DELIBERATELY NOT HERE. Capture bundles: [[DOC-38]] §9 makes a bundle N
 * attachment records on one `reference` ticket, with its own re-extraction
 * lifecycle, and that is its own ticket. The Library surfaces: [[REQ-161]]. The
 * n-gram quarantine gate on control-surface text: [[DOC-38]] §11 — v1 is the
 * prompt-level constraint plus {@link promoteToSiteAsset}'s refusal.
 */

import { MAX_BLOB_BYTES } from './generated/ticketing'
import type { TenantSiteStore } from '../../../tools/generate/src/store/d1r2-store'
import {
  describe,
  type DescribeImage,
  type Description,
  type MaterialKind,
} from './describe'
import { guardedFetch, tooBig } from './fetch-guard'
import type { Ticket, TicketStore } from './tickets'

/**
 * The per-blob ceiling ([[DOC-38]] §14), which is the component's and not a
 * second opinion about it.
 *
 * Re-exported rather than restated: `attach` enforces this number, so a local
 * copy that drifted would produce a refusal at one layer and an acceptance at
 * the other. What this module adds is not a different limit but an EARLIER and
 * KINDER one — see {@link ingestUpload}.
 */
export const MAX_MATERIAL_BYTES: number = MAX_BLOB_BYTES

/** Where a piece of material came from — the input to every rights decision. */
export type Provenance = 'uploaded' | 'fetched'

/** The §9 field block, as this pipeline computes it. */
export interface Classification {
  kind: MaterialKind
  rights: 'owned' | 'licensed' | 'third_party'
  republishable: boolean
  exportable: boolean
  origin: Provenance
  source_url?: string
}

/**
 * Classify one piece of material — step 2.
 *
 * **RIGHTS ARE INFERRED, NEVER ASKED** ([[DOC-38]] §10.1). This is a decision and
 * not a default, and the third reason is the decisive one: a per-file *"do you
 * own this?"* is a legal question put to a café owner; it is clicked through
 * unread; and most importantly it asks for information the client frequently DOES
 * NOT HAVE. Was the photo stock? Did the photographer license it for web use? A
 * dialog cannot extract an answer the user does not possess — it produces a
 * confident answer that means nothing while transferring liability to someone who
 * did not understand the question.
 *
 * SO THE TWO BITS COME FROM PROVENANCE, AND THEY INVERT ([[DOC-38]] §4.2):
 *
 *   | source | `republishable` | `exportable` |
 *   |---|---|---|
 *   | client upload (4a, 4b) | yes | **no** |
 *   | fetched background (3c) | **no** | yes |
 *
 * Neither bit derives from the other and neither derives from `rights`, which is
 * why [[REQ-162]] made both required: a rule that produced one from the other
 * would be wrong for half the corpus.
 *
 * The residual risk is stated rather than defended: a client can upload material
 * they do not hold rights to and we will not detect it. That is accepted
 * deliberately — no dialog we could write would catch it, the account-level terms
 * carry the assertion once where legal language belongs, and it is the position
 * every website builder occupies. The DANGEROUS case needs no question at all,
 * because {@link promoteToSiteAsset} forbids it outright.
 */
export function classify(input: {
  contentType: string
  filename: string
  origin: Provenance
  sourceUrl?: string
}): Classification {
  const kind = kindOf(input.contentType, input.filename)
  if (input.origin === 'fetched') {
    return {
      kind,
      origin: input.origin,
      rights: 'third_party',
      // NEVER republishable. Publishing bytes or copy out of something we fetched
      // on a client's behalf is the one scenario where our own automation would
      // be the proximate cause of infringement.
      republishable: false,
      // Exportable, because [[DOC-38]] §4.2's second bit runs the other way: a
      // third-party public document is what [[DOC-15]]'s cross-client corpus is
      // allowed to learn from, precisely because it is not the client's business.
      exportable: true,
      source_url: input.sourceUrl,
    }
  }
  return {
    kind,
    origin: input.origin,
    rights: 'owned',
    republishable: true,
    // NOT exportable: an upload is the client's own business — [[DOC-36]] §6
    // flags exactly this material as confidential — so it must not leave the
    // tenant as aggregate.
    exportable: false,
  }
}

/**
 * `kind` from the content type, with the filename as a fallback.
 *
 * THE CONTENT TYPE LEADS because it is what the browser observed about the bytes;
 * the extension is what someone typed. But a `.woff2` served as
 * `application/octet-stream` is common enough that ignoring the name would
 * misfile most fonts, so the name is consulted where the type says nothing.
 *
 * ANYTHING UNRECOGNISED IS A `document`, not a refusal. The four values are
 * [[DOC-38]] §9's closed vocabulary and there is no "other"; filing an unknown
 * binary as a document costs a `description_status` of `unsupported` and keeps
 * the file, which is the trade this whole pipeline makes everywhere else.
 */
export function kindOf(contentType: string, filename: string): MaterialKind {
  const ct = (contentType || '').split(';')[0].trim().toLowerCase()
  if (ct.startsWith('image/')) return 'image'
  if (ct.startsWith('font/') || ct === 'application/font-woff' || ct === 'application/x-font-ttf') {
    return 'font'
  }
  const ext = (filename.match(/\.([A-Za-z0-9]+)$/)?.[1] ?? '').toLowerCase()
  if (ct === '' || ct === 'application/octet-stream') {
    if (['woff', 'woff2', 'ttf', 'otf', 'ttc'].includes(ext)) return 'font'
    if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'avif'].includes(ext)) return 'image'
  }
  return 'document'
}

/**
 * The index seam — step 5.
 *
 * A SEAM RATHER THAN A DIRECT CALL, so a UAT can prove it is invoked exactly once
 * per created material without standing up an embedder. The router wires it to
 * the project KB's `onMaterialWritten`, which refreshes the vector index inline
 * (so the document is searchable the instant the upload returns) and defers the
 * awareness-map rebuild behind it ([[DOC-39]] §5.2).
 *
 * OPTIONAL, BUT NEVER SILENTLY SO. [[DOC-39]] §4 is explicit that an unindexed
 * document is **invisible**, not merely stale — search cannot return what it has
 * not embedded. An unwired optional hook is therefore the worst kind of silent
 * failure: uploads succeed, the Library fills up, and the assistant cannot find
 * any of it. So {@link ingest} reports whether the hook was present and the
 * router LOGS LOUDLY when it was not.
 */
export type IndexMaterial = (uid: string) => Promise<unknown>

export interface IngestDeps {
  /**
   * `null` as well as absent, because the router distinguishes "no indexer is
   * configured on this deployment" from "this caller did not supply one" and
   * both have to travel through the same field. Collapsing them would make the
   * loud log's condition unrepresentable.
   */
  index?: IndexMaterial | null
  describeImage?: DescribeImage
}

/** What one ingestion produced. */
export interface Ingested {
  ticket: Ticket
  attachment: Ticket
  classification: Classification
  description: Description
  /** False when no indexer was wired — the router turns this into a loud log. */
  indexed: boolean
}

/** Raised for a file we will not store. Carries a message a client can act on. */
export class MaterialRejectedError extends Error {
  readonly name = 'MaterialRejectedError'
  constructor(message: string) {
    super(message)
  }
}

/**
 * A file from the client — entry point one ([[DOC-38]] 4a, 4b).
 *
 * THE CEILING IS CHECKED HERE AS WELL AS IN `attach`, and the duplication is the
 * point. The component's refusal is *"attachment is 41943040 bytes, above the
 * 26214400-byte ceiling"* — correct, and addressed to a programmer. A client who
 * has just dragged their brand book onto the page needs a sentence they can act
 * on, which is what {@link tooBig} writes. Checking early also means the material
 * ticket is never created for a file that will not fit.
 */
export async function ingestUpload(
  store: TicketStore,
  file: { bytes: Uint8Array; filename: string; contentType: string; siteSlug?: string },
  deps: IngestDeps = {},
): Promise<Ingested> {
  if (file.bytes.length > MAX_MATERIAL_BYTES) {
    throw new MaterialRejectedError(tooBig(file.bytes.length, MAX_MATERIAL_BYTES))
  }
  if (file.bytes.length === 0) {
    throw new MaterialRejectedError('That file is empty, so there is nothing to store.')
  }
  return ingest(
    store,
    {
      bytes: file.bytes,
      filename: file.filename,
      contentType: file.contentType,
      origin: 'uploaded',
      siteSlug: file.siteSlug,
    },
    deps,
  )
}

/**
 * Material we pull on the client's behalf — entry point two ([[DOC-38]] 3c).
 *
 * A PLAIN FETCH, NOT A RENDERED ONE. A rendered fetch — a browser, a settle, a
 * screenshot — is a *capture*, which is a different artefact with a different
 * shape (N members on a `reference` ticket) and its own ticket. Blurring the two
 * here would produce a `material` that is really half a bundle.
 *
 * The guard is `fetch-guard.ts`, and its module note explains why the redirect
 * re-validation is the part that actually matters.
 */
export async function ingestFetch(
  store: TicketStore,
  url: string,
  deps: IngestDeps & { fetch?: typeof fetch; siteSlug?: string } = {},
): Promise<Ingested> {
  const fetched = await guardedFetch(url, MAX_MATERIAL_BYTES, { fetch: deps.fetch })
  if (fetched.bytes.length === 0) {
    throw new MaterialRejectedError('That address returned an empty document, so there is nothing to store.')
  }
  return ingest(
    store,
    {
      bytes: fetched.bytes,
      filename: filenameFromUrl(fetched.finalUrl),
      contentType: fetched.contentType,
      origin: 'fetched',
      // THE FINAL HOP, not the requested one. What we stored came from there, and
      // a `source_url` that named an address we were redirected away from would
      // be a provenance record that is quietly wrong.
      sourceUrl: fetched.finalUrl,
      siteSlug: deps.siteSlug,
    },
    deps,
  )
}

/** Steps 2–5, shared by both entry points — they converge after step 1's bytes. */
async function ingest(
  store: TicketStore,
  input: {
    bytes: Uint8Array
    filename: string
    contentType: string
    origin: Provenance
    sourceUrl?: string
    siteSlug?: string
  },
  deps: IngestDeps,
): Promise<Ingested> {
  const classification = classify({
    contentType: input.contentType,
    filename: input.filename,
    origin: input.origin,
    sourceUrl: input.sourceUrl,
  })

  const description = await describe(
    {
      bytes: input.bytes,
      kind: classification.kind,
      contentType: input.contentType,
      filename: input.filename,
      sourceUrl: input.sourceUrl,
    },
    { describeImage: deps.describeImage },
  )

  const { ticket } = await store.create({
    type: 'material',
    title: description.title,
    body: description.body,
    fields: {
      ...classification,
      ...(input.siteSlug ? { site_slug: input.siteSlug } : {}),
      description_status: description.status,
      // `null` rather than omitted where nothing wrote it: the field is then
      // present on every material, so a predicate over it never has to reason
      // about absence as a third state.
      description_model: description.describer,
      filename: input.filename,
    },
  })

  const { attachment } = await store.attach({
    uid: ticket.uid,
    bytes: input.bytes,
    filename: input.filename,
    content_type: input.contentType,
  })

  // AWAITED, NOT DEFERRED. [[DOC-39]] §5.2's decomposition depends on it: the
  // index refresh is what makes the document searchable the instant this returns,
  // which is what lets the expensive map rebuild run asynchronously behind it. A
  // deferred index would leave the assistant blind for exactly as long as the
  // client is waiting to talk about what they just uploaded.
  if (deps.index) await deps.index(ticket.uid)

  return { ticket, attachment, classification, description, indexed: Boolean(deps.index) }
}

/** A filename from a URL's last path segment, or the host where it has none. */
function filenameFromUrl(url: string): string {
  try {
    const parsed = new URL(url)
    const tail = parsed.pathname.split('/').filter(Boolean).pop()
    return tail ? decodeURIComponent(tail) : parsed.hostname
  } catch {
    return url
  }
}

/**
 * Raised when promotion is refused. Its own class, because it is not a bad
 * request and not a server failure — it is a rule.
 */
export class NotRepublishableError extends Error {
  readonly name = 'NotRepublishableError'
  constructor(readonly uid: string) {
    super(
      'That material cannot be published on a site: it came from somewhere else, ' +
        'and we do not hold the right to republish it. Use it as reference, or ' +
        'upload something of your own in its place.',
    )
  }
}

/**
 * Put a piece of material into a site's asset library — **gated** ([[DOC-38]] §5).
 *
 * THE GATE IS THE REASON THIS FUNCTION EXISTS NOW RATHER THAN LATER. [[DOC-38]]
 * §5 calls promoting a capture-sourced asset *"the most damaging single action
 * available in the system"* — it publishes third-party copyright under the
 * client's own domain — and notes it is "one plausible tool call away". Today
 * there is no promotion path at all, which is not safety: it is exactly how an
 * ungated one reaches production, written in a hurry by whoever needs it first.
 * So the function ships WITH its refusal, unrouted, and [[REQ-161]] wires a
 * surface to something that is already safe.
 *
 * IT COPIES THE BYTES; IT DOES NOT POINT AT THEM. The two buckets are separate on
 * purpose ([[REQ-162]], [[DOC-38]] §7.1): `SITES` is bound by the Worker that
 * serves the public internet and `BLOBS` holds the client's confidential
 * material, and `readAsset` resolves `site_assets.r2_key` against `SITES` alone.
 * A row pointing into `BLOBS` would therefore 404 — and making it resolve would
 * mean handing the public Worker a binding on the private bucket, which is the
 * disclosure the bucket boundary exists to prevent. So promotion is a copy across
 * that boundary, which is also what it MEANS: taking something private and making
 * it publishable is a real act, and the byte copy is that act made honest.
 *
 * It goes through the site store's ordinary `write`, so the asset lands by the
 * same path an import or an edit lands one — one write path, one set of rules
 * about names.
 */
export async function promoteToSiteAsset(
  tickets: TicketStore,
  sites: TenantSiteStore,
  args: { uid: string; slug: string; name: string },
): Promise<{ name: string; size: number; sha256: string }> {
  const { ticket } = await tickets.get({ uid: args.uid })
  // CHECKED ON THE TICKET, not on an argument. The caller does not get to assert
  // that something is republishable; the material's own record says so, and it
  // was written from provenance at ingestion time.
  if (ticket.fields.republishable !== true) throw new NotRepublishableError(args.uid)

  const { attachments } = await tickets.attachments({ uid: args.uid })
  const attachment = attachments[0]
  if (!attachment) {
    throw new MaterialRejectedError(
      `That material has no file attached to it, so there is nothing to publish (${args.uid}).`,
    )
  }
  const sha256 = String(attachment.fields.sha256 ?? '')
  const bytes = await readBlob(tickets, args.uid, sha256)
  await sites.write(args.slug, { assets: [{ name: args.name, bytes }] })
  return { name: args.name, size: bytes.byteLength, sha256 }
}

/**
 * The attachment's bytes.
 *
 * Through the store's own blob handle rather than a bucket reach-around: the
 * handle is tenant-bound, so this cannot address another account's blob even by
 * a correctly-formed key.
 */
async function readBlob(store: TicketStore, uid: string, sha256: string): Promise<Uint8Array> {
  const blobs = store.blobs
  if (!blobs) {
    throw new MaterialRejectedError(
      'The ticket store has no blob handle, so attached files cannot be read.',
    )
  }
  const bytes = await blobs.get(sha256)
  if (!bytes) {
    // A record naming absent bytes — the failure [[DOC-38]] §7.3's ordering
    // exists to make unconstructible. Reaching it means a sweep collected a blob
    // that was still named, so it is reported as such rather than as a 404.
    throw new MaterialRejectedError(
      `The file for ${uid} is no longer in storage (${sha256.slice(0, 12)}…).`,
    )
  }
  return bytes
}
