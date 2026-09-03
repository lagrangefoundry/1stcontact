/**
 * Capture → ticket: a bundle becomes a corpus member ([[REQ-166]], [[DOC-38]] §9).
 *
 * THE ASYMMETRY THIS CLOSES. [[REQ-163]] makes an uploaded file into a `material`
 * ticket the assistant can find. A capture produces far richer material — a whole
 * rendered site, its copy, its palette, its imagery — and produced **nothing
 * searchable**: `capture_site` wrote a bundle into the `ReferenceStore` and
 * stopped there. The client uploads a PDF and the AI can discuss it; the client
 * points us at the site they admire, we capture it in full, and the AI cannot
 * recall a thing about it.
 *
 * A BUNDLE IS N ATTACHMENT RECORDS ON ONE `reference` TICKET, which is [[DOC-38]]
 * §9's shape and not a choice made here. Re-extraction reads members
 * SELECTIVELY — `capture.json`, then a screenshot, falling back to
 * `rendered.html` — so one record over an archive would force a Worker to pull an
 * entire 11–23MB bundle to read one member of it. Each record carries
 * `meta.member` naming its role.
 *
 * ONE TICKET PER BUNDLE, FOREVER. The identity is the bundle name — what storage
 * itself keys on — and never the URL, because `bundleNameFor` slugs the path and
 * drops the query string, so two addresses can land in one bundle. Keying on the
 * URL would let a recapture under a slightly different address write a SECOND
 * ticket pointing at bytes the first one already owns.
 *
 * WHAT A RECAPTURE DOES TO THE BODY: **it overwrites it**, including one the
 * client corrected. That is a deliberate exception to the `description_model:
 * client` protection [[REQ-161]] added, and the reason is in the ticket: a
 * description of a page that has since changed is stale prose about somebody
 * else's site, and archiving third-party sites is not what this is for. The
 * protection exists to stop a BACKGROUND re-describe pass silently replacing a
 * client's words about their OWN material; a recapture is an explicit act about a
 * page that has demonstrably moved.
 */

import {
  captureTitle,
  describeCapture,
  type CaptureEssence,
  type DescribeImage,
  type Description,
} from './describe'
import type { IndexMaterial } from './material'
import type { Ticket, TicketStore } from './tickets'
import {
  ASSETS_PREFIX,
  CAPTURE_MEMBER,
  SCREENSHOT_MEMBER,
  type ReferenceBundle,
} from '../../../tools/generate/src/store/reference-store'

/** The ticket type a capture lands as — [[DOC-38]] §9's second material type. */
export const REFERENCE_TYPE = 'reference'

/**
 * Raised for a bundle that is not a capture.
 *
 * NAMED, because "this bundle has no `capture.json`" is a fact about the input
 * and not a failure of this code. A caller can say *"that is not a capture"*
 * rather than *"undefined is not an object"*.
 */
export class NotACaptureError extends Error {
  readonly name = 'NotACaptureError'
  constructor(readonly bundle: string) {
    super(`Bundle '${bundle}' has no ${CAPTURE_MEMBER}, so it is not a capture.`)
  }
}

/** The seams this needs, both at model or index boundaries — never a store. */
export interface AdoptDeps {
  /**
   * `null` as well as absent, for the reason [[REQ-163]]'s is: the router
   * distinguishes *no indexer on this deployment* from *this caller supplied
   * none*, and collapsing them would make the loud log's condition
   * unrepresentable.
   */
  index?: IndexMaterial | null
  describeImage?: DescribeImage
}

/** What one adoption produced. */
export interface Adopted {
  ticket: Ticket
  /** Every member now attached, sorted — what the bundle currently holds. */
  members: string[]
  /** False when a previous capture of this bundle was updated in place. */
  created: boolean
  /** Members whose bytes were unchanged, so no blob was written for them. */
  unchanged: string[]
  description: Description
  /** False when no indexer was wired — the caller turns this into a loud log. */
  indexed: boolean
}

/**
 * The client's own site, or somebody else's — [[DOC-38]] §10.1, and the case
 * that motivates the whole section.
 *
 * | captured host | `republishable` | `exportable` |
 * |---|---|---|
 * | the client's declared domain (3a — their own old site) | yes | **no** |
 * | any other domain (3b — a reference) | **no** | yes |
 *
 * THE TWO BITS INVERT, which is why neither is derived from the other
 * ([[DOC-38]] §4.2). Their own old site is their business: republishable onto
 * their new one, and never exportable into [[DOC-15]]'s cross-client corpus. A
 * competitor's site is the exact opposite — public marketing we may learn
 * structure from and must never republish.
 *
 * A SUBDOMAIN OF THE DECLARED DOMAIN COUNTS. A client who declares `example.com`
 * and points us at `www.example.com` has named their own site, and treating that
 * as a third party would mark their own copy unpublishable on their own new site.
 * Nothing wider: a suffix test alone would match `notexample.com`.
 */
export function captureRights(
  host: string,
  clientDomain?: string,
): { rights: 'owned' | 'third_party'; republishable: boolean; exportable: boolean } {
  const theirs = ownDomain(host, clientDomain)
  return theirs
    ? { rights: 'owned', republishable: true, exportable: false }
    : { rights: 'third_party', republishable: false, exportable: true }
}

/** Whether `host` is the declared domain or a subdomain of it. */
function ownDomain(host: string, clientDomain?: string): boolean {
  const declared = (clientDomain ?? '').trim().toLowerCase().replace(/^www\./, '')
  if (declared === '') return false
  const h = host.trim().toLowerCase()
  return h === declared || h.endsWith(`.${declared}`)
}

/** The component's own blob address, recomputed — see {@link membersToWrite}. */
async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', bytes as BufferSource)
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('')
}

/** A member's content type, from its extension. Bundles hold a small, known set. */
export function memberContentType(member: string): string {
  const ext = (member.match(/\.([A-Za-z0-9]+)$/)?.[1] ?? '').toLowerCase()
  const table: Record<string, string> = {
    json: 'application/json',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    webp: 'image/webp',
    avif: 'image/avif',
    svg: 'image/svg+xml',
    html: 'text/html',
    css: 'text/css',
    js: 'text/javascript',
    woff: 'font/woff',
    woff2: 'font/woff2',
    ttf: 'font/ttf',
    otf: 'font/otf',
  }
  return table[ext] ?? 'application/octet-stream'
}

/** `meta.member` off an attachment record, or null on one that carries none. */
function memberOf(attachment: Ticket): string | null {
  const meta = attachment.fields.meta
  if (typeof meta !== 'object' || meta === null) return null
  const member = (meta as Record<string, unknown>).member
  return typeof member === 'string' && member !== '' ? member : null
}

/**
 * Adopt a completed bundle as a `reference` ticket.
 *
 * THE ORDER IS TICKET-THEN-BLOBS, and the crash property [[DOC-38]] §7.3 asks
 * for survives it, exactly as it does in [[REQ-163]]'s ingestion. `attach` needs
 * a subject to hang off, so the record is created first — but it HOLDS NO
 * POINTER: the address lives on the attachment record, and `attach` writes the
 * blob before it. So the two things a crash can leave are a reference with fewer
 * members than the bundle (visible, honest, and repaired by re-running this) and
 * a blob with no record (collected by the sweep). Neither is a record naming
 * absent bytes.
 */
export async function adoptCapture(
  store: TicketStore,
  bundle: ReferenceBundle,
  args: { clientDomain?: string } = {},
  deps: AdoptDeps = {},
): Promise<Adopted> {
  const capture = await readCaptureEssence(bundle)
  const members = await bundle.list()

  const screenshot = await bundle.read(SCREENSHOT_MEMBER)
  const description = await describeCapture(
    { capture, screenshot },
    { describeImage: deps.describeImage },
  )

  const rights = captureRights(capture.host, args.clientDomain)
  const fields = {
    ...rights,
    kind: 'capture',
    origin: 'captured',
    // ALWAYS `reference`, and nobody was asked. A capture is by construction
    // background for the assistant to work from; what varies is whether its
    // bytes may be republished, which `captureRights` has already settled from
    // provenance. [[DOC-38]] §10.1 refuses to put the legal question to anyone.
    role: 'reference',
    source_url: capture.url,
    bundle: bundle.name,
    description_status: description.status,
    description_model: description.describer,
    // NO `filename`. A capture is 11–99 files and the Library's *File* field is
    // a single-file affordance; writing the ticket title into it — which is what
    // the row's fallback does when the field is absent — would state a filename
    // that is not one. See `library.js`, which shows the member count instead.
    content_type: memberContentType(CAPTURE_MEMBER),
  }

  const existing = await findByBundle(store, bundle.name)
  const created = existing === null
  const ticket = created
    ? (
        await store.create({
          type: REFERENCE_TYPE,
          title: captureTitle(capture),
          body: description.body,
          fields,
        })
      ).ticket
    : (
        await store.update({
          uid: existing.uid,
          // THE TITLE AND BODY MOVE WITH THE FIELDS. A recapture is the site as
          // it is NOW, so a title from the page's old `<title>` and a body
          // describing a layout it no longer has are both stale — see the module
          // note on why this overwrites rather than preserves.
          patch: { title: captureTitle(capture), body: description.body, fields },
        })
      ).ticket

  const unchanged = await syncMembers(store, ticket.uid, bundle, members)

  // AWAITED, NOT DEFERRED — [[DOC-39]] §5.2, and the same call [[REQ-163]] makes
  // for the same reason: the index refresh is what makes the capture findable the
  // instant this returns, which is what lets the map rebuild run behind it.
  if (deps.index) await deps.index(ticket.uid)

  return {
    ticket,
    members,
    created,
    unchanged,
    description,
    indexed: Boolean(deps.index),
  }
}

/** The bundle's `capture.json`, decoded. Refuses a bundle that has none. */
async function readCaptureEssence(bundle: ReferenceBundle): Promise<CaptureEssence> {
  const bytes = await bundle.read(CAPTURE_MEMBER)
  if (!bytes) throw new NotACaptureError(bundle.name)
  try {
    return JSON.parse(new TextDecoder().decode(bytes)) as CaptureEssence
  } catch (err) {
    throw new NotACaptureError(bundle.name)
  }
}

/**
 * The one `reference` ticket for this bundle, or null.
 *
 * A LISTING RATHER THAN A PREDICATE, which is what `listMaterial` does and for
 * the same reason: the predicate language is the component's rather than ours,
 * and one tenant holds tens to low hundreds of references. A call that cannot be
 * mis-spelled beats a string that can.
 */
async function findByBundle(store: TicketStore, name: string): Promise<Ticket | null> {
  const { tickets } = await store.list({ type: REFERENCE_TYPE, limit: 'all' })
  return tickets.find((t) => t.fields.bundle === name) ?? null
}

/**
 * Make the ticket's attachment set mirror the bundle's members.
 *
 * **UNCHANGED BYTES ARE LEFT ALONE, AND THAT IS THE DEDUP.** The ticket asked for
 * "no new blobs" on recapturing an unchanged site, which was written when
 * attachments were content-addressed. The component has since WITHDRAWN that —
 * `attach` addresses a blob by the attachment record's own uid, because a blob
 * shared between two records cannot be moved to the trash without breaking
 * whichever sibling still names it. So the dedup is done here instead, against
 * the `sha256` the component still records: a member whose hash matches the
 * attachment already holding it is not re-attached, and no blob is written. An
 * unchanged recapture therefore writes neither a new blob NOR a new record.
 *
 * SUPERSEDED AND VANISHED MEMBERS ARE DETACHED, not left beside their
 * replacements. `detach` is the trash, not a purge — the bytes remain
 * recoverable and the retention sweep collects them — so this is reversible in
 * exactly the way deleting the wrong thing needs to be. Leaving them would make
 * the attachment set a history of every capture ever taken, and there would be no
 * way to ask which `screenshot.full.png` is the current one.
 */
async function syncMembers(
  store: TicketStore,
  uid: string,
  bundle: ReferenceBundle,
  members: string[],
): Promise<string[]> {
  const { attachments } = await store.attachments({ uid })
  const held = new Map<string, Ticket>()
  for (const attachment of attachments) {
    const member = memberOf(attachment)
    if (member !== null) held.set(member, attachment)
  }

  const unchanged: string[] = []
  for (const member of members) {
    const bytes = await bundle.read(member)
    // A member that listed but will not read is a bundle changing underneath us.
    // Skipping it leaves the previous record in place, which is the honest state:
    // this ticket holds what the bundle held, and a half-written member is not it.
    if (!bytes) continue
    const previous = held.get(member)
    if (previous && previous.fields.sha256 === (await sha256Hex(bytes))) {
      unchanged.push(member)
      held.delete(member)
      continue
    }
    await store.attach({
      uid,
      bytes,
      // The MEMBER KEY as the filename, so a downloaded `assets/hero.jpg` arrives
      // called `hero.jpg` rather than by a uid, and the record reads the way the
      // bundle does.
      filename: member.startsWith(ASSETS_PREFIX) ? member.slice(ASSETS_PREFIX.length) : member,
      content_type: memberContentType(member),
      // WHAT MAKES A MEMBER ADDRESSABLE. Re-extraction and the Library both ask
      // for one member by name; without this the only way to find the screenshot
      // among 99 records would be to guess from filenames.
      meta: { member },
    })
    if (previous) await store.detach({ uid: previous.uid })
    held.delete(member)
  }

  // Whatever is left held a member this bundle no longer has.
  for (const stale of held.values()) await store.detach({ uid: stale.uid })

  return unchanged
}
