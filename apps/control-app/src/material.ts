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
 *      bytes and then writes the record. Addressed by the ATTACHMENT RECORD'S
 *      OWN UID inside the tenant prefix, so one record owns exactly one blob.
 *      (It was content-addressed and deduplicating; the component withdrew that,
 *      because a blob shared between two records cannot be moved to the trash
 *      without breaking whichever sibling still names it — and moving it is what
 *      makes deletion actually revoke reach. See {@link readBlob}.)
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
 * first — but the material record HOLDS NO POINTER. The address lives on the
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
import { editAssetAdd } from '../../../tools/generate/src/cli/edit'
import type { TenantSiteStore } from '../../../tools/generate/src/store/d1r2-store'
import {
  describe,
  type DescribeImage,
  type DescribeText,
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

/**
 * What the client said the material is FOR ([[REQ-161]], [[DOC-38]] §4.2).
 *
 * The two drop areas of the upload overlay, and the only thing that surface asks
 * anybody. See `tickets.ts`'s `role` for why this question is askable when
 * [[DOC-38]] §10.1's *"do you own this?"* is not.
 */
export type MaterialRole = 'site' | 'reference'

/** The §9 field block, as this pipeline computes it. */
export interface Classification {
  kind: MaterialKind
  rights: 'owned' | 'licensed' | 'third_party'
  republishable: boolean
  exportable: boolean
  origin: Provenance
  role: MaterialRole
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
  role?: MaterialRole
  sourceUrl?: string
}): Classification {
  const kind = kindOf(input.contentType, input.filename)
  if (input.origin === 'fetched') {
    return {
      kind,
      origin: input.origin,
      // ALWAYS REFERENCE. Nobody was asked, and nobody needs to be: something we
      // pulled on the client's behalf is by construction background for the
      // assistant to read rather than something the client handed us to publish.
      role: 'reference',
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
  // THE ROLE NARROWS; IT NEVER WIDENS ([[REQ-161]]). [[DOC-38]] §10.1's table
  // says an upload is republishable, full stop, and accepts as residual risk that
  // a client may hand us something they do not hold rights to. Asking what the
  // file is FOR closes the commonest shape of that risk — the competitor
  // screenshot — without asking a legal question, because a client who says
  // "just for you to read" has told us not to publish it whatever the law says.
  //
  // An ABSENT role therefore lands on §10.1's answer unchanged, which is what
  // keeps this a narrowing rather than a new gate: the programmatic entry points
  // that predate the overlay behave exactly as they did. It is the OVERLAY, not
  // this function, that guarantees a human chose — it has no drop target that is
  // not one of the two areas, so nothing it sends can be role-less.
  const role: MaterialRole = input.role ?? 'site'
  return {
    kind,
    origin: input.origin,
    role,
    rights: 'owned',
    republishable: role !== 'reference',
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
 * A content type for a file whose own type says nothing — **the repair**.
 *
 * WHY THIS EXISTS AT ALL (BUG-41). A browser has no registered MIME type for
 * `.md`, so `File.type` is the EMPTY STRING and the upload route falls back to
 * `application/octet-stream`. That fallback is honest about what the browser
 * observed and useless to everything downstream: `describeDocument` asks
 * `isTextual` and gets `false`, so a client's markdown is stored with a body
 * saying *"nothing here can read application/octet-stream"* — a plain text file
 * the system declined to read.
 *
 * IT REPAIRS ONLY SILENCE. A type the browser or the server actually STATED is
 * returned untouched, including one this table would map differently: the sender
 * observed the bytes and we did not, and second-guessing that would make a
 * mislabelled `.txt` unreadable in a new way to fix an old one. Only `''` and
 * `application/octet-stream` — the two ways of saying nothing — consult the name.
 *
 * ONE RESOLUTION, THREE CONSUMERS. {@link ingest} calls this once and hands the
 * result to `classify`, to `describe` and to `attach`, so `kind`, the description
 * and the attachment record cannot disagree about what the file is. Recording the
 * repaired type on the attachment is what makes it durable: a later re-describe
 * pass reads that record, and an `application/octet-stream` frozen there would
 * make the same wrong decision again.
 *
 * AN UNMAPPED EXTENSION STILL DEGRADES. `.xyz` stays `application/octet-stream`,
 * lands as a `document`, and gets the honest `unsupported` body. This widens what
 * can be read; it does not change what happens to what cannot.
 */
export function resolveContentType(contentType: string, filename: string): string {
  const ct = (contentType || '').split(';')[0].trim().toLowerCase()
  if (ct !== '' && ct !== 'application/octet-stream') return contentType
  const ext = (filename.match(/\.([A-Za-z0-9]+)$/)?.[1] ?? '').toLowerCase()
  return TYPE_BY_EXTENSION[ext] ?? 'application/octet-stream'
}

/**
 * Extension to content type, for the silent case only.
 *
 * DELIBERATELY NOT A GENERAL MIME DATABASE. Every entry is a format some step of
 * this pipeline can actually do something with — the textual ones `isTextual`
 * reads, the PDF `unpdf` extracts, the images the vision call accepts, the fonts
 * the name-table parser opens. A row for a format nothing can read would change
 * the words in a degraded body and nothing else.
 */
const TYPE_BY_EXTENSION: Record<string, string> = {
  // Textual — the reason this table exists. A client's notes, brief or export.
  md: 'text/markdown',
  markdown: 'text/markdown',
  mdx: 'text/markdown',
  txt: 'text/plain',
  text: 'text/plain',
  log: 'text/plain',
  csv: 'text/csv',
  tsv: 'text/tab-separated-values',
  html: 'text/html',
  htm: 'text/html',
  css: 'text/css',
  json: 'application/json',
  xml: 'application/xml',
  yaml: 'text/yaml',
  yml: 'text/yaml',
  // Extracted rather than decoded, but just as badly served by silence.
  pdf: 'application/pdf',
  // Images and fonts, which {@link kindOf} already rescues for `kind` alone —
  // named here too so the ATTACHMENT RECORD is right as well as the routing.
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  avif: 'image/avif',
  svg: 'image/svg+xml',
  woff: 'font/woff',
  woff2: 'font/woff2',
  ttf: 'font/ttf',
  otf: 'font/otf',
  ttc: 'font/collection',
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
  describeText?: DescribeText
}

/**
 * The `kind` marking the comment that holds a document's own text (REQ-173).
 *
 * A MARKED KIND, THE WAY `chat_transcript` IS MARKED. The chunk indexer has to be
 * able to find this comment among a ticket's others without chunking all of them,
 * which is a different and much larger change; a designated kind keeps it narrow.
 * `knowledge.ts` selects on it, and the framework's own comment-chunking change
 * will select on it too.
 */
export const MATERIAL_TEXT_KIND = 'material_text'

/** What one ingestion produced. */
export interface Ingested {
  ticket: Ticket
  attachment: Ticket
  classification: Classification
  description: Description
  /** False when no indexer was wired — the router turns this into a loud log. */
  indexed: boolean
  /**
   * The `material_text` comment holding the document's own text, or `null` for
   * material that has none — an image, a font, a scan (REQ-173).
   */
  text: Ticket | null
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
  file: {
    bytes: Uint8Array
    filename: string
    contentType: string
    /** Which drop area the client chose ([[REQ-161]]). Absent = §10.1 unchanged. */
    role?: MaterialRole
  },
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
      role: file.role,
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
  deps: IngestDeps & { fetch?: typeof fetch } = {},
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
    role?: MaterialRole
    sourceUrl?: string
  },
  deps: IngestDeps,
): Promise<Ingested> {
  // ONCE, AT THE HEAD, FOR ALL THREE CONSUMERS (BUG-41). `classify`, `describe`
  // and `attach` each ask what this file is; resolving separately in each — or in
  // only some of them, which is what the bug was — lets them disagree, and the
  // one that disagreed was the describer.
  const contentType = resolveContentType(input.contentType, input.filename)

  const classification = classify({
    contentType,
    filename: input.filename,
    origin: input.origin,
    role: input.role,
    sourceUrl: input.sourceUrl,
  })

  const description = await describe(
    {
      bytes: input.bytes,
      kind: classification.kind,
      contentType,
      filename: input.filename,
      sourceUrl: input.sourceUrl,
    },
    { describeImage: deps.describeImage, describeText: deps.describeText },
  )

  const { ticket } = await store.create({
    type: 'material',
    title: description.title,
    body: description.body,
    fields: {
      ...classification,
      // NO PLACEMENT HERE (BUG-47). Which site was open when the file arrived is
      // not where its bytes ended up, and writing it as though it were is what
      // badged a file dropped on *"just for you to read"* as being on the site.
      // `promoteToSiteAsset` writes `placed_on`, after the copy it records.
      description_status: description.status,
      // `null` rather than omitted where nothing wrote it: the field is then
      // present on every material, so a predicate over it never has to reason
      // about absence as a third state.
      description_model: description.describer,
      filename: input.filename,
      // WRITTEN BESIDE THE FILENAME, from the same resolved variable the
      // attachment below records (REQ-172). The Library's detail pane renders a
      // document from its content type and `kind` files markdown, text and PDF
      // alike as `document`, so the type has to travel on the row — and reading
      // it off the attachment would be a call per row to draw the list.
      content_type: contentType,
    },
  })

  const { attachment } = await store.attach({
    uid: ticket.uid,
    bytes: input.bytes,
    filename: input.filename,
    // THE RESOLVED TYPE, NOT THE CALLER'S. This record is what a later
    // re-describe pass reads, so an `application/octet-stream` frozen here would
    // make it repeat exactly the decision BUG-41 is about.
    content_type: contentType,
  })

  // THE DOCUMENT'S OWN TEXT, BESIDE THE TICKET RATHER THAN INSIDE IT (REQ-173).
  //
  // BEFORE THE INDEX REFRESH, and that ordering is the whole of the cache
  // question the split raises. The chunk manifest keys on this ticket's
  // `updated_at` and assumes what it chunks is a function of it; writing the
  // comment first means the very first index pass over this material already sees
  // the text, and a comment nothing ever edits keeps the assumption true
  // afterwards. Written after `create` because a comment needs a subject.
  const text = description.fullText
    ? (await store.comment({ uid: ticket.uid, kind: MATERIAL_TEXT_KIND, body: description.fullText }))
        .comment
    : null

  // AWAITED, NOT DEFERRED. [[DOC-39]] §5.2's decomposition depends on it: the
  // index refresh is what makes the document searchable the instant this returns,
  // which is what lets the expensive map rebuild run asynchronously behind it. A
  // deferred index would leave the assistant blind for exactly as long as the
  // client is waiting to talk about what they just uploaded.
  if (deps.index) await deps.index(ticket.uid)

  return { ticket, attachment, classification, description, indexed: Boolean(deps.index), text }
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
  const bytes = await readBlob(tickets, args.uid, attachment.uid)
  // A FREE NAME, NEVER THE REQUESTED ONE BLIND. `write` puts bytes at a name and
  // says nothing about what was already there, so promoting a second `logo.png`
  // would REPLACE the first — silently changing a picture that is live on the
  // client's site, from a surface whose whole promise is that it only adds. The
  // CLI's `asset add` refuses a collision instead, because it has an operator to
  // tell; this has a client who dragged a file, so it renames and reports.
  const name = await freeAssetName(sites, args.slug, args.name)
  // THROUGH `editAssetAdd`, NOT PAST IT (BUG-45). This wrote the bytes directly,
  // which meant a file dropped on the chat arrived by a path no other asset took
  // — and so was described differently by the one listing every picker reads.
  // Going through it is the same collision rules and the same draft-journal note
  // every other asset write makes, so the assistant is TOLD a picture arrived on
  // the turn it arrives instead of having to notice. The name is already free, so
  // the CONFLICT branch cannot fire from here.
  //
  // IT CARRIES NO ALT (BUG-44). It passed the material's own title, which
  // ingestion had already written as a description of the picture ([[DOC-38]] §6),
  // and `editAssetAdd` recorded that in `site.json`'s asset registry. The registry
  // is gone — there is nowhere site-side to hold anything about an asset but its
  // bytes — so this is the one thing the deletion cost. The description is NOT
  // lost: it is on the material ticket this promotion came from, and the surface
  // tells the assistant to read it there and write it onto the picture element
  // that places the image, which is the only place a renderer has ever read alt
  // text from anyway.
  await editAssetAdd(args.slug, name, bytes, { store: sites, actor: 'client' })
  // PLACEMENT IS RECORDED HERE, AND ONLY HERE (BUG-47). This is the one function
  // that puts a material's bytes on a site, so it is the only thing that knows
  // the fact the Library's pill, its `Used on` field and its "used on this site"
  // filter are all trying to state. Recording it anywhere earlier would restate
  // the upload's context instead — which is the bug — and recording it before
  // this line would badge a promotion that threw identically to one that landed.
  await recordPlacement(tickets, ticket, args.slug)
  return { name, size: bytes.byteLength, sha256 }
}

/**
 * Append a slug to the material's `placed_on`, idempotently.
 *
 * A SET UNION RATHER THAN A PUSH. Promoting the same logo onto the same site
 * twice is an ordinary thing for a client to do — they drag it again because
 * they forgot — and it must not leave the row claiming two placements where
 * there is one. Absence reads as the empty list, so material that predates the
 * field needs no migration to grow its first placement.
 *
 * READ OFF THE TICKET WE ALREADY HOLD, not re-fetched: `promoteToSiteAsset` got
 * it to check `republishable`, and a second read would be a window in which the
 * two could disagree.
 */
async function recordPlacement(
  tickets: TicketStore,
  ticket: Ticket,
  slug: string,
): Promise<void> {
  const placed = placedOn(ticket.fields)
  if (placed.includes(slug)) return
  await tickets.update({ uid: ticket.uid, patch: { fields: { placed_on: [...placed, slug] } } })
}

/**
 * `fields.placed_on` as a list of slugs, whatever the row actually holds.
 *
 * ABSENCE IS THE EMPTY LIST, so no consumer has to treat "never placed" as a
 * third state distinct from "placed nowhere" — and material written before the
 * field existed reads as unplaced rather than as unknown. Non-strings are
 * dropped rather than rendered: the field's declared type only asserts that the
 * value is a list, so a caller could put anything in one.
 */
function placedOn(fields: Record<string, unknown>): string[] {
  const raw = fields.placed_on
  if (!Array.isArray(raw)) return []
  return raw.filter((v): v is string => typeof v === 'string' && v !== '')
}

/**
 * `hero.png`, or `hero-2.png` when that is taken, or `hero-3.png` when that is.
 *
 * The suffix goes before the extension rather than after it, because the
 * extension is what every consumer reads the type from — `hero.png-2` is not a
 * PNG to a content-type lookup, a picker's icon, or an operator.
 */
async function freeAssetName(
  sites: TenantSiteStore,
  slug: string,
  wanted: string,
): Promise<string> {
  const taken = new Set(await sites.listAssets(slug))
  if (!taken.has(wanted)) return wanted
  const dot = wanted.lastIndexOf('.')
  const stem = dot > 0 ? wanted.slice(0, dot) : wanted
  const ext = dot > 0 ? wanted.slice(dot) : ''
  for (let n = 2; ; n++) {
    const candidate = `${stem}-${n}${ext}`
    if (!taken.has(candidate)) return candidate
  }
}

/**
 * The attachment's bytes.
 *
 * Through the store's own blob handle rather than a bucket reach-around: the
 * handle is tenant-bound, so this cannot address another account's blob even by
 * a correctly-formed key.
 *
 * **KEYED BY THE ATTACHMENT RECORD'S OWN UID, NOT BY `sha256`.** This read
 * `blobs.get(sha256)` and found nothing, every time, because the component's
 * addressing moved underneath it: `attach` used to content-address and dedup,
 * and gave that up deliberately — a shared blob cannot be moved to the trash
 * without breaking whichever sibling record still names it, and moving it is
 * what makes deletion actually revoke reach. `sha256` stays on the record for
 * INTEGRITY and is no longer the address.
 *
 * It was invisible because nothing had ever read a blob back: `promoteToSiteAsset`
 * shipped with its refusal proved and its success path unexercised, so the only
 * covered branch was the one that returns before reaching here ([[REQ-163]]).
 * [[REQ-161]] is the first surface that shows a client their own file, which is
 * why it is the ticket that found this.
 */
async function readBlob(store: TicketStore, uid: string, blobKey: string): Promise<Uint8Array> {
  const blobs = store.blobs
  if (!blobs) {
    throw new MaterialRejectedError(
      'The ticket store has no blob handle, so attached files cannot be read.',
    )
  }
  const bytes = await blobs.get(blobKey)
  if (!bytes) {
    // A record naming absent bytes — the failure [[DOC-38]] §7.3's ordering
    // exists to make unconstructible. Reaching it means a sweep collected a blob
    // that was still named, so it is reported as such rather than as a 404.
    throw new MaterialRejectedError(
      `The file for ${uid} is no longer in storage (${blobKey.slice(0, 20)}…).`,
    )
  }
  return bytes
}

/**
 * The two ticket types the Library shows ([[REQ-161]], [[DOC-38]] §9).
 *
 * BOTH, ALWAYS, and never one type as a shortcut. `material` and `reference`
 * carry the identical `MATERIAL_FIELDS` block precisely so that every query
 * across the client's material spans them — a Library that listed only
 * `material` would silently omit every capture the moment captures land, and
 * would do it without an empty state to notice.
 */
export const MATERIAL_TYPES = ['material', 'reference'] as const

/**
 * One row of the Library's list.
 *
 * THE BODY IS NOT HERE, and its absence is the whole shape of this type. A
 * material's body is its extracted text — a brand book runs to tens of
 * kilobytes — so a list that carried bodies would ship the entire corpus to draw
 * a column of filenames. {@link readMaterial} fetches the one the client
 * selected.
 *
 * `filename` is read off the material's own field rather than its attachment,
 * which is exactly why `tickets.ts` duplicates it there: the alternative is an
 * `attachments` call per row to render a list.
 */
export interface MaterialRow {
  uid: string
  type: string
  title: string
  filename: string
  kind: MaterialKind | string
  /**
   * What the bytes are — the row's answer to *how should this be shown?*
   *
   * SEPARATE FROM `kind` BECAUSE IT ANSWERS A DIFFERENT QUESTION. [[DOC-38]] §9's
   * `kind` is a four-value vocabulary for filing, and it calls a markdown note, a
   * plain-text export and a brand PDF all `document` — three files [[REQ-172]]'s
   * detail pane has to render three different ways.
   */
  content_type: string
  role: string | null
  rights: string
  republishable: boolean
  exportable: boolean
  origin: string
  /**
   * The sites this material's bytes are ON — [[BUG-47]].
   *
   * WHERE IT LANDED, NOT WHERE IT WAS UPLOADED FROM. It replaces `site_slug`,
   * which held the slug of whichever site was open when the file arrived and
   * was read by three separate consumers as though it meant placement.
   *
   * ALWAYS AN ARRAY, never null: the Library asks `includes(site)` of it on
   * every row it draws and every row it filters, and a nullable field would put
   * a guard in front of each of those.
   */
  placed_on: string[]
  source_url: string | null
  description_status: string | null
  description_model: string | null
  updated_at: string
}

function rowOf(ticket: Ticket): MaterialRow {
  const f = ticket.fields
  const str = (v: unknown): string | null => (typeof v === 'string' && v !== '' ? v : null)
  const filename = str(f.filename) ?? ticket.title
  return {
    uid: ticket.uid,
    type: ticket.type,
    title: ticket.title,
    filename,
    kind: String(f.kind ?? 'document'),
    // RESOLVED RATHER THAN READ, so material that predates the field is not a
    // second state the pane has to handle (REQ-172). `resolveContentType`
    // repairs only silence, so a stated type is returned untouched and an absent
    // one falls back to the filename — the same mapping that would have been
    // stored, recomputed. That is what makes this a cache rather than a
    // migration.
    content_type: resolveContentType(str(f.content_type) ?? '', filename),
    role: str(f.role),
    rights: String(f.rights ?? 'owned'),
    republishable: f.republishable === true,
    exportable: f.exportable === true,
    origin: String(f.origin ?? 'uploaded'),
    placed_on: placedOn(f),
    source_url: str(f.source_url),
    description_status: str(f.description_status),
    description_model: str(f.description_model),
    updated_at: ticket.updated_at,
  }
}

/**
 * Everything the tenant has given us, newest first ([[REQ-161]]).
 *
 * TENANT-WIDE, NEVER SITE-SCOPED, and that is a decision rather than an
 * omission. [[DOC-38]] §7.7 allows one blob to back two sites and [[DOC-10]]
 * §4.1 makes shared knowledge across a client's sites deliberate — their second
 * site should not start as cold as their first. So `placed_on` travels on the
 * row as something to BADGE and FILTER BY, and the store is never asked to hide
 * anything on the strength of it.
 *
 * IT IS PLACEMENT, NOT UPLOAD CONTEXT (BUG-47). The badge this feeds says the
 * bytes are on a site, so it is written by `promoteToSiteAsset` when the copy
 * lands and by nothing else — a row whose promotion failed, or whose file was
 * dropped on *"just for you to read"*, carries no placement at all.
 *
 * TWO LISTS RATHER THAN ONE PREDICATE, because `list` takes a type and the
 * predicate language is the component's rather than ours; two calls that cannot
 * be mis-spelled beat one string that can.
 */
export async function listMaterial(store: TicketStore): Promise<MaterialRow[]> {
  const pages = await Promise.all(
    MATERIAL_TYPES.map((type) => store.list({ type, limit: 'all' })),
  )
  return pages
    .flatMap((page) => page.tickets)
    .map(rowOf)
    .sort((a, b) => (a.updated_at < b.updated_at ? 1 : a.updated_at > b.updated_at ? -1 : 0))
}

/** Raised for a uid that is not this tenant's material. */
export class NotMaterialError extends Error {
  readonly name = 'NotMaterialError'
  constructor(readonly uid: string) {
    super(`${uid} is not a piece of material.`)
  }
}

async function materialTicket(store: TicketStore, uid: string): Promise<Ticket> {
  const { ticket } = await store.get({ uid })
  // CHECKED RATHER THAN ASSUMED. Every route below takes a uid off the wire, and
  // without this a caller could read a `chat` body or rewrite an awareness map
  // through a surface that is supposed to reach material and nothing else. The
  // tenant handle already stops it reaching another account; this stops it
  // reaching another KIND of thing inside its own.
  if (!(MATERIAL_TYPES as readonly string[]).includes(ticket.type)) throw new NotMaterialError(uid)
  return ticket
}

/** One piece of material in full — the row, plus the body the list omits. */
export async function readMaterial(
  store: TicketStore,
  uid: string,
): Promise<MaterialRow & { body: string; members: string[] }> {
  const ticket = await materialTicket(store, uid)
  return { ...rowOf(ticket), body: ticket.body ?? '', members: await membersOf(store, ticket) }
}

/** `meta.member` off an attachment record, or null on one carrying none. */
function memberOf(attachment: Ticket): string | null {
  const meta = attachment.fields.meta
  if (typeof meta !== 'object' || meta === null) return null
  const value = (meta as Record<string, unknown>).member
  return typeof value === 'string' && value !== '' ? value : null
}

/**
 * What a capture holds, by member name — [[REQ-166]].
 *
 * ON THE DETAIL AND NEVER ON THE ROW, which is the same trade {@link MaterialRow}
 * makes about bodies. Listing attachments is a call per ticket, so carrying this
 * on the list would cost one per row to draw a column of filenames — and the
 * three things that need it (the screenshot preview, the file count, the
 * download) are all on the pane the client has actually opened.
 *
 * EMPTY FOR ORDINARY MATERIAL, not absent. A `material` is one file and has no
 * member vocabulary at all, so an empty list is the honest answer and keeps the
 * caller from having to treat two shapes.
 */
async function membersOf(store: TicketStore, ticket: Ticket): Promise<string[]> {
  if (ticket.type !== 'reference') return []
  const { attachments } = await store.attachments({ uid: ticket.uid })
  return attachments
    .map(memberOf)
    .filter((member): member is string => member !== null)
    .sort()
}

/**
 * The attached bytes, with enough about them to serve a response.
 *
 * THE PREVIEW IS WHY THIS EXISTS. A Library row that could not show the picture
 * would be a list of filenames, which is the thing [[REQ-132]] already rejected
 * for the image picker: choosing a photograph by reading a path asks the client
 * to recognise a property of where the file is filed rather than of the picture.
 */
export async function materialFile(
  store: TicketStore,
  uid: string,
  member?: string,
): Promise<{ bytes: Uint8Array; contentType: string; filename: string }> {
  await materialTicket(store, uid)
  const { attachments } = await store.attachments({ uid })
  // ONE MEMBER BY NAME, WHICH IS WHAT A BUNDLE NEEDS ([[REQ-166]]). A capture is
  // 11–99 attachment records, so `attachments[0]` is an ARBITRARY one of them —
  // it answered correctly only while every material had exactly one file. Naming
  // the member is also what lets the Library show a capture's screenshot without
  // pulling the other 98 members to find it.
  const attachment = member === undefined
    ? attachments[0]
    : attachments.find((a) => memberOf(a) === member)
  if (!attachment) {
    throw new MaterialRejectedError(
      member === undefined
        ? `That material has no file attached to it (${uid}).`
        : `That capture holds no member called '${member}' (${uid}).`,
    )
  }
  return {
    bytes: await readBlob(store, uid, attachment.uid),
    contentType: String(attachment.fields.content_type ?? 'application/octet-stream'),
    filename: String(attachment.fields.filename ?? 'file'),
  }
}

/**
 * The client corrects what we said their material is ([[REQ-161]]).
 *
 * THE BODY IS THE DESCRIPTION ([[DOC-38]] §6), so correcting it is an ordinary
 * ticket write and not a new mechanism. What makes it worth a function rather
 * than a bare `update` is the two fields that must move with it.
 *
 * `description_model` BECOMES THE CLIENT, and `description_status` becomes `ok`.
 * That pair is not bookkeeping: [[REQ-163]] declared the status precisely so a
 * later re-describe pass could be a QUERY (`description_status = no_describer`)
 * rather than a migration — and a client who has just written a better
 * description than any model could must not have it overwritten by that pass.
 * Recording who wrote it is what makes the correction survive.
 *
 * AND IT RE-INDEXES. [[DOC-39]] §4 is explicit that the index, not the body, is
 * what retrieval sees: a corrected description that was never re-embedded would
 * leave the Library showing the client's words while search kept answering with
 * ours. The ticket's acceptance says the correction is *reflected in retrieval*,
 * and this call is the only place that can be true.
 */
export async function reviseDescription(
  store: TicketStore,
  args: { uid: string; body: string },
  index?: IndexMaterial | null,
): Promise<{ row: MaterialRow & { body: string }; indexed: boolean }> {
  const body = args.body.trim()
  if (body === '') {
    throw new MaterialRejectedError(
      'A description cannot be empty — it is the only thing that makes this file findable.',
    )
  }
  await materialTicket(store, args.uid)
  await store.update({
    uid: args.uid,
    patch: {
      body,
      fields: { description_status: 'ok', description_model: CLIENT_DESCRIBER },
    },
  })
  if (index) await index(args.uid)
  return { row: await readMaterial(store, args.uid), indexed: Boolean(index) }
}

/** `description_model` for a description the client wrote themselves. */
export const CLIENT_DESCRIBER = 'client'
