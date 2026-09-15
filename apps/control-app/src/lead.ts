/**
 * Lead capture — what a public form's submission DOES ([[REQ-223]]).
 *
 * WHY THIS LIVES IN CONTROL-APP AND NOT WHERE THE REQUEST ARRIVES. `addContact`
 * is the one definition of how a person enters a tenant ([[DOC-42]] §9), and a
 * second implementation in the site server would be two answers to that
 * question, free to drift — one of them written by whoever was in a hurry to
 * make a form work. So the request is received by `public-site`, which owns the
 * refusals a hostile caller meets, and the WRITE is handed here over a service
 * binding.
 *
 * AND THE SEAM IS AN RPC ENTRYPOINT RATHER THAN A PATH ([[REQ-223]] §3.2). A
 * path is something a request can name, so an internal route reachable at
 * `app.1stcontact.io/internal/…` is one Access misconfiguration away from being
 * public. There is no URL that reaches this function at all — see
 * {@link module:index}'s `LeadIntake`.
 *
 * NOTHING HERE TRUSTS THE PAYLOAD FOR ANYTHING THAT MATTERS. The tenant comes
 * from the site key, which came from the request path the server resolved. The
 * asset, the consent wording and the submit label come from the site's own
 * PUBLISHED definition, looked up by the form-instance handle — so a caller who
 * edits that handle can only name another instance that already exists in the
 * same site, and can never assert an asset or a wording of their own. What the
 * payload supplies is the words the visitor typed, and those are stored as what
 * they are.
 *
 * IT REPORTS AND NEVER RENDERS. Every outcome — a new contact, one already here,
 * an unresolvable site, an asset already delivered — comes back as data, and the
 * caller answers the visitor with the one frozen acknowledgement whatever it
 * says ([[REQ-223]] §2). Anything shaped like a status code here would be a
 * temptation to pass it through.
 */

import {
  ASSET_SENT,
  EMAIL_SENT,
  FORM_SUBMITTED,
} from './builder/contact-events.js'
import {
  holdsState,
  isAcceptanceKey,
  isRevocable,
  needsDocument,
} from './builder/acceptances.js'
import { acceptancesOf, recordAcceptance } from './acceptances'
import { recordEvent } from './events'
import { isEmailShape } from './builder/email-shape.js'
import { emailsOf, normaliseEmail, type IdentityEnv } from './identity'
import type { MailEnv, SendEmail } from './mail'
import { mailerFor, mailFrom } from './mail'
import {
  BOUNCED,
  COMPLAINED,
  sendRecordedEmail,
  messagesFor,
  type MessageRecord,
} from './messages'
import { addContact } from './people'
import { grantFor } from './grants'
import {
  DOWNLOAD_PATH,
  parseFormHandle,
} from '../../../packages/framework/src/modules/contact-form/fields'
// [[BUG-95]] — the capture path reads a stored instance under the contract it
// was WRITTEN at, not the one the catalogue happens to be at today. See
// `currentShapeOf`.
import { upgradePageModules } from '../../../packages/framework/src/modules/upgrade'
import type { StoredInstance } from '../../../packages/framework/src/modules/upgrade'
import { publicSiteUrl } from './public-url'
import type { Scope } from './scope'
import { renderCopy, type MessageCopy, type RenderedMessage } from './templates'
import { ticketStoreFor, type TicketStore, type TicketStoreEnv } from './tickets'
import { d1r2SiteStore, UnknownTenantError } from '../../../tools/generate/src/store/d1r2-store'
import { liveRevisionOf } from '../../../tools/generate/src/store/revision-model'
import type { StoredPage } from '../../../tools/generate/src/store/site-store'
// [[REQ-247]] — a message is a page of the site that sends it, so the receiver
// reads and renders one through exactly the code the site's own tooling uses.
import { emailPageOf } from '../../../packages/framework/src/l1/email-pages'
import { renderL1Email } from '../../../packages/framework/src/l1/email-render'

/** What a mail names an asset the form did not name. */
const UNNAMED_ASSET = 'your download'

/** Everything this module needs of the deployment. */
export type LeadEnv = IdentityEnv & TicketStoreEnv & MailEnv

/**
 * One submission, as the receiving Worker hands it over.
 *
 * `siteKey` IS NOT A FIELD OF THE FORM AND CANNOT BE. It is resolved from the
 * URL by the server that took the request, through the route grammar every other
 * published byte goes through — which is the whole of why a spammer cannot
 * retarget another tenant's contact list by editing a form's action.
 */
/**
 * Which rendering of the site the submitter was actually served ([[BUG-78]]).
 *
 * `published` is a visitor on the live site. `draft` is the OPERATOR, inside
 * `control-app`'s own preview, pressing the button on the form they are
 * building. Both write a real contact into the real tenant — a preview that
 * declined to submit would be one more thing to disbelieve — and the difference
 * between them is a fact about the lead rather than a mode of this function.
 */
export type LeadChannel = 'published' | 'draft'

export interface LeadSubmission {
  siteKey: string
  /**
   * Which form, from the module's own hidden handle: `<pageId>:<instanceId>`
   * ([[BUG-93]]). May be empty, and may be anything at all — it is untrusted.
   *
   * IT NAMES THE PAGE AS WELL AS THE INSTANCE, because a component name is
   * unique on one page and the same name is legal on the next. It was the
   * instance alone, and the receiver resolved it by taking the first instance in
   * the SITE whose id matched — so a submission from a whitepapers form called
   * `signup` was served the home page's waitlist definition, recorded under its
   * label, and mailed nobody.
   *
   * A HANDLE THAT DOES NOT PARSE RESOLVES TO NO DEFINITION, which is what a bare
   * instance id now is. The trust properties are unchanged by the extra half:
   * both halves name something that must already exist in the site the ROUTE
   * resolved, so a caller who edits the handle can still only name another form
   * in the same site, and can assert no template, no asset and no tenant.
   */
  formHandle: string
  /** Every field the visitor submitted, reserved names already stripped. */
  fields: Record<string, string>
  /** When the visitor pressed the button. Defaults to now. */
  submittedAt?: string
  /**
   * Which rendering they submitted from. Defaults to `published`, so every
   * existing caller — and every lead already recorded — keeps meaning what it
   * has always meant.
   */
  channel?: LeadChannel
}

/** Why a submission wrote nothing. Reaches a log; never a visitor. */
export type LeadRefusal = 'unknown_site' | 'no_email'

/** What became of a submission. Data, never a response — see the header. */
export interface LeadOutcome {
  accepted: boolean
  reason?: LeadRefusal
  /** The business the contact landed in, when one was resolved. */
  businessId?: string
  contactId?: string
  /** Whether this submission created the contact or found one already here. */
  created?: boolean
  /**
   * What became of each asset the form promised, in declaration order
   * ([[REQ-241]]). Empty for a form that promises nothing, and absent only when
   * the submission was refused before any form was resolved.
   *
   * ONE ENTRY PER ASSET AND NOT A SUMMARY. "Did they take both papers or one of
   * them" is the question this whole change exists to make expressible, and a
   * single `assetSent` boolean is precisely the shape that cannot answer it.
   */
  assets?: AssetOutcome[]
  /**
   * What became of the message a form promising NO assets sends ([[REQ-243]]).
   *
   * A SEPARATE MEMBER FROM `assets` BECAUSE IT IS A DIFFERENT THING. An entry in
   * `assets` answers *did they get this artifact*; this answers *did the welcome
   * go out*. Folding it into the list would need a fake key, and the key is the
   * ledger handle — inventing one would put a delivery in the record for an
   * artifact that does not exist.
   *
   * ABSENT WHENEVER THE FORM PROMISED AN ASSET, because the message it sends is
   * then the delivery and `assets` already reports it, and absent for a form
   * naming no template at all, because there was no message to become anything.
   */
  message?: MessageOutcome
}

/**
 * Why a message this form would have sent did not go out.
 *
 * FIVE REASONS AND ONE VOCABULARY, shared by the per-asset outcomes and the
 * message outcome so a reader does not have to learn which words apply where.
 *
 * THE LAST TWO ARE [[REQ-243]]'s AND SHOULD BE UNREACHABLE FROM A PUBLISHED
 * SITE, because publish refuses both. They are reachable from a DRAFT — the
 * builder's own preview submits against one and nothing validates it — which is
 * exactly why the send checks as well as the publish, and exactly why they are
 * reported rather than thrown.
 */
export type DeliverySkip =
  | 'already_sent'
  | 'suppressed'
  | 'no_address'
  /**
   * The form names a message this site does not hold ([[REQ-243]] §2, re-sourced
   * by [[REQ-247]] §4).
   *
   * IT ABSORBED `reserved_template`, which is gone. That outcome existed because
   * a form could name a credential template out of the business's ticket store;
   * a form names an email PAGE now, and no credential is one — so naming
   * `invite` is the same outcome as naming anything else that is not there, and
   * there is one fewer state for a reader to learn.
   */
  | 'no_template'

/** What became of one promised asset on one submission. */
export interface AssetOutcome {
  /** The stable ledger key, as the published definition declares it. */
  key: string
  /** Whether this asset left the building for this submission. */
  sent: boolean
  /** Why it did not, when it did not. */
  skipped?: DeliverySkip
}

/** What became of the one message a form with no assets sends. */
export interface MessageOutcome {
  /** Whether it left the building for this submission. */
  sent: boolean
  /** Why it did not, when it did not. */
  skipped?: DeliverySkip
}

/**
 * The form instance as its site's published definition describes it.
 *
 * EVERY FIELD HERE IS AUTHORED AND NONE IS SUBMITTED. That is the property the
 * whole lookup exists for: the consent wording has to be what was ON THE PAGE
 * that day, and a wording that arrived in the request is a wording the visitor's
 * browser could have rewritten.
 */
export interface FormDefinition {
  /** The store key of the page carrying it (`home.json`). */
  page: string
  /** What the submit button said. */
  submitLabel: string
  /**
   * The declared field schema, by field name.
   *
   * `acceptance` IS WHAT MAKES A TICK BOX MEAN SOMETHING ([[REQ-242]] §2). Named,
   * the box's answer becomes queryable state under that key and its label travels
   * as the wording that evidences it; unnamed, it is an ordinary answer and
   * reaches the submission's provenance like any other.
   */
  fields: Record<string, { label: string; type: string; acceptance?: string }>
  /**
   * The assets this form promises, in declaration order ([[REQ-241]]).
   *
   * ALWAYS PRESENT AND OFTEN EMPTY. A form that gates nothing has no assets,
   * which is a list of none rather than an absent field — so every caller
   * writes one loop and nobody writes the "does it promise anything" branch
   * that used to sit in front of it.
   */
  assets: Array<{ key: string; name: string; url: string }>
  /**
   * The acceptances PRESSING THE BUTTON asserts, in declaration order
   * ([[REQ-242]] §2, implied).
   *
   * ALWAYS PRESENT AND USUALLY EMPTY, on `assets`' reasoning: one loop, no
   * "does it assert anything" branch in front of it.
   *
   * THE WORDING IS READ FROM HERE AND NEVER FROM THE SUBMISSION, which is the
   * whole reason this lookup exists. A sentence that arrived in the request is a
   * sentence the visitor's browser could have rewritten, and the one thing an
   * acceptance record is for is evidencing what was on the page that day.
   */
  accepts: Array<{ key: string; wording: string }>
  /**
   * The message this form sends, or `''` for a form that sends none
   * ([[REQ-243]]).
   *
   * IT IS A KEY AND NOT COPY, and the difference is where each lives. This says
   * WHICH message; what the message SAYS is a ticket in the business's own store,
   * editable without a deploy — so two businesses may hold different words under
   * one key and neither needs a branch here.
   *
   * `''` IS AN ORDINARY CONFIGURATION AND NOT A MISSING VALUE. A form that only
   * joins a mailing list captures the contact, records what the press asserted,
   * and mails nobody; naming no template is how it says so.
   *
   * READ FROM THE SERVED DEFINITION LIKE EVERYTHING ELSE HERE, which is the
   * whole reason this lookup exists: a template key that arrived in the request
   * would be a stranger choosing which of a business's messages to send to an
   * address they typed.
   */
  template: string
  /**
   * The copy that message actually carries ([[REQ-247]] §2).
   *
   * RESOLVED IN THE SAME PASS AS THE FORM, AND OUT OF THE SAME SNAPSHOT. That
   * is the whole of what makes AC-6 true: the message a visitor is sent is the
   * one that was published, because it is a page of the very revision the form
   * they pressed came out of. An unpublished edit to the copy is sitting in the
   * draft, exactly where an unpublished edit to the page is, and reaches nobody
   * until somebody publishes.
   *
   * `null` WHEN THE FORM NAMES A PAGE THIS SNAPSHOT DOES NOT HOLD, which is
   * reachable only from a draft — publish refuses it, and so does the operation
   * that configured the form. It is reported as `no_template` rather than
   * thrown, because a preview that 500s tells the operator far less than a
   * submission that captures the lead and says what was missing.
   */
  message: MessageCopy | null
}

/**
 * The business a site key belongs to.
 *
 * IT READS `sites` DIRECTLY AND IS NOT A HOLE IN THE TENANT BARRIER. A site key
 * is 128 random bits and is the site's PUBLIC ADDRESS — `public-site` already
 * resolves one against `site_revisions` on every request for a published byte.
 * A caller who does not already hold one cannot produce one, and one who holds it
 * is naming a site whose owner published it deliberately. What this adds is the
 * business that owns it, which is the only thing a write needs and the one thing
 * the URL cannot carry.
 */
export async function businessOfSite(
  env: LeadEnv,
  siteKey: string,
): Promise<{ businessId: string } | null> {
  if (siteKey === '') return null
  // THE BUSINESS IS THE WHOLE ANSWER NOW ([[REQ-236]]). It used to hand back the
  // slug as well, because the store addressed a site by one and every caller
  // below needed it. The store takes the key — which the caller already holds —
  // so the only thing left to learn here is the one thing the URL cannot carry.
  const row = await env.DB.prepare('SELECT tenant_id FROM sites WHERE id = ?')
    .bind(siteKey)
    .first<{ tenant_id: string }>()
  if (!row) return null
  return { businessId: row.tenant_id }
}

/** One page's module list, defensively narrowed out of a stored definition. */
function instancesOf(page: Record<string, unknown>): Array<Record<string, unknown>> {
  const modules = page.modules
  if (!Array.isArray(modules)) return []
  return modules.filter((m): m is Record<string, unknown> => !!m && typeof m === 'object')
}

/**
 * One stored instance as the CURRENT contract would have written it ([[BUG-95]]).
 *
 * THE DEFECT THIS CLOSES. Migration is an explicit act — `upgradeSiteModules`
 * runs from a CLI command and an API route and from nowhere else, deliberately,
 * because an upgrade can drop config keys and should not happen behind an
 * operator's back. Reading is not an explicit act, and this path did not ask
 * what version it was reading: `instance.config` went straight into `assetsIn`
 * and `text(config, 'template')`, which are v7's rules. So between the day a
 * module gains a version and the day somebody runs the upgrade, stored data in
 * an old shape was interpreted by new code.
 *
 * THAT WINDOW HAD A SILENT FAILURE IN IT, WHICH IS WHY THIS IS NOT HOUSEKEEPING.
 * A v5 `contact-form` declares its download as three sibling strings — `asset`,
 * `assetName`, `assetUrl`. v7's `assetsIn` reads `config.assets`, a list, finds
 * nothing, and v7 reads an absent `template` as *send nothing*. A v5 form that
 * had been gating a whitepaper therefore captured the contact, told the visitor
 * it had worked, and mailed nobody — the exact failure `contactFormV6ToV7` was
 * written to prevent, arriving because the migration that prevents it was never
 * run against the revision being read.
 *
 * IN MEMORY, AND NOTHING IS WRITTEN. The store keeps its pin until an ordinary
 * edit rewrites the page or an operator runs `1c module upgrade --write`, which
 * goes on reporting these instances as stale because they are. This is the same
 * answer [[BUG-91]] gave the RENDER path in `assembleSite`, for the same reason
 * and on the same guarantee: [[BUG-85]] made a declared migration the
 * PRECONDITION for a version bump and `missingMigrations` enforces it in CI, so
 * a stored instance can ALWAYS be carried to the current contract. Interpreting
 * one under rules it was not written for is therefore a choice, not a necessity.
 *
 * ONLY THE INSTANCE BEING READ, AND NOT THE WHOLE PAGE. A migration that cannot
 * produce a valid instance throws, and a page-wide pass would let one broken
 * SIBLING take down a submission to a form that is perfectly well formed. The
 * caller has already picked the one instance whose config it is about to
 * interpret, so that is the one carried.
 *
 * ANYTHING NOT RECOGNISABLY A PINNED INSTANCE IS PASSED THROUGH UNTOUCHED, on
 * `instancesOf`'s own reasoning: this reads whatever a frozen revision holds,
 * including — on a bad day — something that is not a module at all. A type the
 * catalogue has never heard of is left alone by `upgradePageModules` itself,
 * which is the rule this reuses rather than restates.
 */
function currentShapeOf(instance: Record<string, unknown>): Record<string, unknown> {
  if (typeof instance.id !== 'string') return instance
  if (typeof instance.type !== 'string') return instance
  if (!Number.isInteger(instance.version)) return instance
  const { modules } = upgradePageModules([instance as unknown as StoredInstance])
  return modules[0] as unknown as Record<string, unknown>
}

/** A config value as a trimmed string, or `''` when it is not one. */
function text(config: Record<string, unknown>, key: string): string {
  const value = config[key]
  return typeof value === 'string' ? value.trim() : ''
}

/**
 * The assets one stored `contact-form` config declares ([[REQ-241]]).
 *
 * BOTH OR NEITHER, PER ITEM. A key with no URL is an asset nothing can deliver,
 * and a URL with no key is a delivery nothing can remember having made — and the
 * at-most-once rule is exactly a memory. Half an item is read as no item rather
 * than as a best effort, and the reading is CONFINED TO THAT ITEM: the rest of
 * the form's set is unaffected, because one author's half-finished line is not a
 * reason to withhold the artifacts they finished.
 *
 * THE NAME HAS A FALLBACK AND THE OTHER TWO DO NOT. A message that cannot say
 * what the recipient asked for is the one thing that makes an unsolicited-looking
 * mail illegible, so an unnamed asset gets neutral words; a keyless or urlless
 * one has nothing to send and nothing to remember, which no fallback can invent.
 */
function assetsIn(config: Record<string, unknown>): FormDefinition['assets'] {
  const declared = Array.isArray(config.assets) ? config.assets : []
  const assets: FormDefinition['assets'] = []
  for (const entry of declared) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) continue
    const item = entry as Record<string, unknown>
    const key = text(item, 'key')
    const url = text(item, 'url')
    if (key === '' || url === '') continue
    assets.push({ key, url, name: text(item, 'name') || UNNAMED_ASSET })
  }
  return assets
}

/**
 * The implied acceptances one stored `contact-form` config declares
 * ([[REQ-242]] §2).
 *
 * BOTH OR NEITHER, PER ITEM, AS `assetsIn` READS — and unlike `assets`, the
 * contract also REFUSES half an item at the write (`accepts[].wording` is
 * required). Both are wanted, and they are not the same guarantee: the refusal
 * stops one being authored, and this reading stops one already sitting in a
 * frozen revision from being recorded as though it meant something. An
 * acceptance with no wording could never be shown to have been agreed to by
 * anybody, so recording it would put an unevidenced consent in the CRM — worse
 * than not recording it at all, which is the reverse of the trade `assetsIn`
 * makes for an artifact somebody is waiting for.
 */
function acceptsIn(config: Record<string, unknown>): FormDefinition['accepts'] {
  const declared = Array.isArray(config.accepts) ? config.accepts : []
  const accepts: FormDefinition['accepts'] = []
  for (const entry of declared) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) continue
    const item = entry as Record<string, unknown>
    const key = text(item, 'key')
    const wording = text(item, 'wording')
    if (key === '' || wording === '') continue
    accepts.push({ key, wording })
  }
  return accepts
}

/**
 * Read one `contact-form` instance out of THE RENDERING THE SUBMITTER WAS SERVED.
 *
 * THE RULE IS "READ THE DEFINITION FROM THE SNAPSHOT THEY ACTUALLY SAW", and
 * `channel` is what selects which snapshot that is. For a visitor on the live
 * site that is the frozen published revision: the draft is whatever the operator
 * has been editing since, and reading the consent wording from it would evidence
 * a sentence that was never on the page. A site with nothing published served
 * nobody a form, so it resolves to nothing.
 *
 * FOR A PREVIEW SUBMISSION THE SAME RULE POINTS THE OTHER WAY ([[BUG-78]]). The
 * operator pressed the button on the DRAFT — that is what `control-app` rendered
 * into the frame — so the draft is the served snapshot and the published
 * revision is the stale one. Usually it is a form they have just changed, and
 * often one no revision has ever contained; resolving it against a live revision
 * would fail to find the address on a form that plainly has one, and would do it
 * silently. So this is not a relaxation for previews. It is the same rule, and
 * hardcoding `published` was the special case.
 *
 * IT RESOLVES A PAGE AND THEN AN INSTANCE ON IT, AND NEVER SCANS ([[BUG-93]]).
 * This used to take the FIRST instance in the site whose id matched, on the
 * reasoning that two pages carrying one id was an authoring collision whose only
 * cost was provenance naming the wrong page. Both halves of that were wrong. It
 * is not a collision — the edit path deliberately scopes a component name to its
 * page, because two pages may each reasonably hold a form called `signup` — and
 * the cost was not cosmetic: the wrong definition carries the wrong template and
 * the wrong asset set, so the form that promised two papers silently promised
 * nothing and the send path returned before it began. The handle names the page,
 * so this reads the page it names.
 *
 * AND THE INSTANCE IT FINDS IS CARRIED TO THE CURRENT CONTRACT BEFORE ANY OF IT
 * IS READ ([[BUG-95]]). Every reading below — the field list, the asset set, the
 * template key — is the catalogue's current version's, and a frozen revision may
 * hold an older one. See {@link currentShapeOf} for why the in-memory upgrade is
 * the right shape and why the PERSISTED one stays an explicit operator act.
 *
 * NO FALLBACK TO A SCAN, AND NO FALLBACK TO A BARE ID. A handle that does not
 * parse, or that names a page this site does not hold, or an instance that page
 * does not carry, resolves to `null` — the same answer an unknown instance has
 * always had. Guessing would be the defect itself, restored as a compatibility
 * branch.
 */
export async function formDefinitionOf(
  env: LeadEnv,
  businessId: string,
  site: string,
  handle: string,
  channel: LeadChannel = 'published',
): Promise<FormDefinition | null> {
  const named = parseFormHandle(handle)
  if (!named) return null
  let store
  try {
    store = await d1r2SiteStore({ DB: env.DB, SITES: env.SITES }).forTenant(businessId)
  } catch (err) {
    if (err instanceof UnknownTenantError) return null
    throw err
  }
  let pages
  let siteJson: Record<string, unknown> | null
  /**
   * WHICH RENDERING OF THE COPY THIS IS, for [[REQ-198]]'s record.
   *
   * A TEMPLATE TICKET HAD A UID AND A PAGE DOES NOT, so the record needs some
   * other stable name for *the exact words that went out*. A revision is
   * precisely that: it is immutable, it is what the visitor was served, and it
   * is the one thing that distinguishes this month's copy from last month's. A
   * draft has no such guarantee and says so in the name rather than pretending
   * to one.
   */
  let origin: string
  if (channel === 'draft') {
    pages = await store.readPages(site)
    siteJson = await store.readSiteJson(site)
    origin = `${site}@draft`
  } else {
    const live = liveRevisionOf(await store.revisions(site))
    if (live === null) return null
    const snapshot = await store.readRevision(site, live)
    if (!snapshot) return null
    pages = snapshot.pages
    siteJson = snapshot.siteJson
    origin = `${site}@${live}`
  }

  // THE PAGE FIRST, BY THE ID THE RENDERER STAMPED INTO THE HANDLE ([[BUG-93]]).
  // A store key is `<id>.json` and `findPageFile` addresses a page by its
  // definition's own `id`, so that is the one name the renderer and the receiver
  // already share — and the one this compares.
  for (const stored of pages) {
    if (String(stored.page.id ?? '') !== named.pageId) continue
    for (const pinned of instancesOf(stored.page)) {
      if (pinned.id !== named.instanceId) continue
      // CARRIED TO THE CURRENT CONTRACT BEFORE A LINE OF IT IS READ ([[BUG-95]])
      // — every reading below is v7's, and the stored pin may not be.
      const instance = currentShapeOf(pinned)
      const config = (instance.config ?? {}) as Record<string, unknown>
      const fields: FormDefinition['fields'] = {}
      const declared = Array.isArray(config.fields) ? config.fields : []
      for (const entry of declared) {
        if (!entry || typeof entry !== 'object') continue
        const field = entry as Record<string, unknown>
        const name = String(field.name ?? '')
        if (name === '') continue
        const acceptance = typeof field.acceptance === 'string' ? field.acceptance.trim() : ''
        fields[name] = {
          label: String(field.label ?? ''),
          type: String(field.type ?? 'text'),
          ...(acceptance === '' ? {} : { acceptance }),
        }
      }
      const template = text(config, 'template')
      return {
        page: stored.name,
        submitLabel: text(config, 'submitLabel') || 'Send',
        fields,
        assets: assetsIn(config),
        accepts: acceptsIn(config),
        template,
        message: template === '' ? null : messageCopyOf(pages, siteJson, template, origin),
      }
    }
  }
  return null
}

/**
 * The copy an email page carries, as the thing that renders it takes
 * ([[REQ-247]] §2).
 *
 * THE BODY IS RENDERED HERE AND NOT AT THE SEND, and the order matters: the
 * document becomes HTML first and the tokens are substituted into that HTML
 * afterwards. A token is text either way — `{{cta_url}}` sits in a text run or in
 * a link's `href` — and rendering first means the substitution is the same string
 * replacement it has always been, over the same escaped, table-wrapped output
 * every recipient gets. Substituting into the DOCUMENT first would mean every
 * message is a different document, and the one thing that could then differ
 * between "what we showed the operator" and "what the recipient received" is the
 * rendering itself.
 *
 * A TOKEN IN AN `href` CLEARS THE URL ALLOWLIST AS A RELATIVE URL, which is what
 * makes the button expressible at all: `{{cta_url}}` carries no scheme and none
 * of the characters that could break out of the attribute, so `isSafeUrl` reads
 * it as relative and the anchor is emitted. What eventually lands there is
 * whatever the SENDER substitutes — the gated-download link this Worker minted,
 * and nothing a visitor could influence — so the substituted value is ours by
 * construction rather than by a check.
 *
 * THE PALETTE COMES FROM THE SAME SNAPSHOT AS THE PAGE. A message painted from a
 * palette entry that has since been edited must show the colour that was
 * published beside it, not today's — which is automatic here, because both come
 * out of the one frozen revision.
 */
function messageCopyOf(
  pages: readonly StoredPage[],
  siteJson: Record<string, unknown> | null,
  templateKey: string,
  origin: string,
): MessageCopy | null {
  const page = emailPageOf(pages, templateKey)
  if (!page) return null
  const email = (page.email ?? {}) as Record<string, unknown>
  const document = page.l1
  if (!document || typeof document !== 'object') return null
  const from = String(email.from ?? '').trim()
  const declared = Array.isArray(email.placeholders) ? email.placeholders.map(String) : []
  return {
    subject: String(email.subject ?? ''),
    body: renderL1Email(document as never, {
      palette: (siteJson?.palette ?? undefined) as never,
      subject: String(email.subject ?? ''),
    }),
    // ABSENT RATHER THAN EMPTY, on `copyOf`'s reasoning: `MAIL_FROM` is the
    // fallback the caller applies, and a blank string here would be a third
    // state meaning the second that reaches a `check()` refusing a blank sender.
    ...(from === '' ? {} : { from }),
    declared,
    templateKey,
    // WHICH COPY, NOT WHICH TICKET. A page has no uid; the revision it was
    // frozen in is the stable name for the exact words that went out.
    templateUid: `${origin}/${templateKey}`,
  }
}

/**
 * The address this submission is FROM.
 *
 * THE DEFINITION'S `email` FIELD FIRST, and an email-shaped value second. The
 * first is what the form said its address field is called, and is the answer
 * whenever the definition resolved. The second is what makes capture survive a
 * form whose definition could not be read — an unpublished site, a renamed
 * instance — because a lead we can reach is worth more than a lead filed under
 * the tidier rule.
 */
export function addressIn(
  fields: Record<string, string>,
  definition: FormDefinition | null,
): string {
  for (const [name, spec] of Object.entries(definition?.fields ?? {})) {
    if (spec.type !== 'email') continue
    const value = normaliseEmail(fields[name] ?? '')
    if (isEmailShape(value)) return value
  }
  for (const value of Object.values(fields)) {
    const candidate = normaliseEmail(value)
    if (isEmailShape(candidate)) return candidate
  }
  return ''
}

/**
 * The provenance a submission leaves behind ([[REQ-223]] §4).
 *
 * IT IS THE POINT OF THE EVENT AND NOT AN EXTRA. The `users` row says a person
 * exists; nothing on it says which page they were reading, what the button they
 * pressed said, or what they typed into "What are you building?". None of that
 * is reconstructable later.
 *
 * THERE IS NO `consent[]` HERE ANY MORE ([[REQ-242]] §4). It was
 * `[{field, wording, answer}]` per declared checkbox, and it was good evidence
 * and no state: nothing read it back, and a box linked to nothing but its own
 * label could not answer "who is on the newsletter". A named box now writes a
 * real acceptance — state, plus an `acceptance.granted` / `acceptance.withdrawn`
 * row carrying the same wording — and the blob is REPLACED rather than kept
 * alongside it, because two records of one fact are two answers free to drift.
 *
 * A BOX NOBODY NAMED IS AN ORDINARY ANSWER, and is in the bag below. That is
 * what stops the replacement losing anything: the platform cannot know what an
 * unmapped box means, so there is no state to write, but its answer is still
 * something the visitor said and still belongs in the provenance.
 */
export function provenanceOfSubmission(
  spec: LeadSubmission,
  definition: FormDefinition | null,
  email: string,
): Record<string, unknown> {
  const answers: Record<string, string> = {}
  const declared = definition?.fields ?? {}
  /** A box whose answer is state now, and must not also be an answer here. */
  const isAcceptance = (name: string): boolean => {
    const field = declared[name]
    return field?.type === 'checkbox' && field.acceptance !== undefined
  }

  for (const [name, value] of Object.entries(spec.fields)) {
    if (isAcceptance(name)) continue
    // The address is on the row and on the address table; repeating it in the
    // bag would be a third copy of one fact with nothing keeping them equal.
    if (normaliseEmail(value) === email && email !== '') continue
    answers[name] = value
  }

  // EVERY DECLARED UNNAMED CHECKBOX, TICKED OR NOT — the one thing the deleted
  // `consent[]` was right about, kept. An unticked box submits nothing at all,
  // so a record built only from what arrived is silent exactly where "they were
  // asked and said no" is the fact worth having. A NAMED box's no is recorded as
  // state instead, which is strictly better; an unnamed one has only this.
  for (const [name, field] of Object.entries(declared)) {
    if (field.type !== 'checkbox' || isAcceptance(name)) continue
    answers[name] = spec.fields[name] ?? ''
  }

  return {
    site: spec.siteKey,
    /*
     * WHICH RENDERING THEY SUBMITTED FROM ([[BUG-78]]). A lead captured from the
     * operator's own preview is a real contact and is stored as one — there is
     * one contact table and one kind of lead — but a row that reads as a public
     * enquiry when nobody outside the business ever saw the page is a lie the
     * CRM would carry permanently, and these accumulate every time anyone tests
     * a form. It sits with the rest of the provenance because it is the same
     * kind of fact as the page and the submit label: where this came from.
     *
     * ALWAYS PRESENT, including for `published`. Recording it only for previews
     * would leave a reader unable to tell a live lead from one written before
     * this field existed.
     */
    channel: spec.channel ?? 'published',
    ...(definition ? { page: definition.page, submitLabel: definition.submitLabel } : {}),
    form: spec.formHandle,
    fields: answers,
    // WHICH ARTIFACTS THIS FORM WAS GATED ON, by key and in declaration order
    // ([[REQ-241]]). Recorded on the submission because it is a fact about the
    // page they were served, which the delivery events cannot supply: an asset
    // that was promised and skipped leaves no `asset.sent` row at all.
    ...(definition && definition.assets.length > 0
      ? { assets: definition.assets.map((asset) => asset.key) }
      : {}),
  }
}

/** One acceptance a submission asserts, before anything already held is consulted. */
interface AcceptanceIntent {
  key: string
  /** Which way. A tick is yes; an unticked named box is a recorded no. */
  granted: boolean
  /** The wording it was asserted under — a box's label, or the config's sentence. */
  wording: string
}

/**
 * What this submission says about acceptances, read off the SERVED DEFINITION
 * ([[REQ-242]] §2).
 *
 * TWO WAYS AND ONE LIST. An explicit tick box carries its own label as the
 * wording; an implied acceptance carries the sentence the press was asserted
 * under. Both end as the same kind of fact, so both are resolved here and the
 * writer below has one shape to deal with.
 *
 * A NAMED BOX'S `no` IS A FACT AND IS IN THE LIST. An unticked box submits
 * nothing at all, so a list built from what arrived would be silent exactly where
 * "they were asked and said no" is the thing worth recording — which is the
 * insight the deleted `consent[]` blob was built on and the one part of it that
 * survives intact.
 *
 * EXPLICIT OUTRANKS IMPLIED on a key both name. A tick box is the visitor's own
 * answer; an implied acceptance is the author's assertion about a press. When a
 * form manages to say both about one key, the visitor's answer is the honest
 * witness — so fields are walked first and the first mention of a key wins.
 */
function acceptanceIntents(
  spec: LeadSubmission,
  definition: FormDefinition | null,
): AcceptanceIntent[] {
  const intents: AcceptanceIntent[] = []
  const claimed = new Set<string>()
  const add = (intent: AcceptanceIntent): void => {
    if (claimed.has(intent.key)) return
    claimed.add(intent.key)
    intents.push(intent)
  }

  for (const [name, field] of Object.entries(definition?.fields ?? {})) {
    // READ ONLY ON A `checkbox`. A mapping on a text field would be this module
    // inventing what typing something into a box consents to, and the contract
    // says as much beside the declaration.
    if (field.type !== 'checkbox' || field.acceptance === undefined) continue
    add({
      key: field.acceptance,
      granted: (spec.fields[name] ?? '') !== '',
      wording: field.label,
    })
  }
  for (const entry of definition?.accepts ?? []) {
    add({ key: entry.key, granted: true, wording: entry.wording })
  }
  return intents
}

/**
 * Record what this submission accepted, revoked, or asked for ([[REQ-242]] §4).
 *
 * THE STATE IS THE POINT AND THE EVENT COMES WITH IT. `recordAcceptance` writes
 * both in one batch, so "who is on the newsletter" is an indexed query rather
 * than a scan of every form submission's `detail`, and the wording they were
 * shown is on the row that says which way it went.
 *
 * IT ASKS WHAT THEY ALREADY HOLD, ONCE, AND WRITES ONLY WHAT CHANGES. A second
 * submission by an address already on the list must not append a second
 * `acceptance.granted` — the state is the same and nothing happened, so a row
 * saying it did would make the history lie about how many times they agreed. One
 * they do NOT hold is written, which is why this is a diff and not a skip: a
 * returning contact ticking a new box is the ordinary case.
 *
 * A `request` HAS NO STATE AND IS THEREFORE ALWAYS RECORDED. "They asked for the
 * papers" is a thing that happened, and asking twice is two facts; the
 * at-most-once rule that stops them being SENT twice is the message ledger's and
 * is deliberately somewhere else.
 *
 * THE GUARD IS DEFENCE IN DEPTH BEHIND THE CONTRACT. `config`'s enum makes a
 * document key unauthorable, but the definition is read out of a frozen revision
 * that may predate the enum, so a key the registry does not declare — or one it
 * declares as a document — is dropped and reported rather than written. That is
 * the §3 rule stated where the write happens: no submission to a public form can
 * accept terms or produce a member.
 *
 * NOTHING HERE CAN LOSE THE LEAD. Every intent is filtered into a shape
 * `recordAcceptance` accepts before it is called, so the contact and the
 * submission event — already written by the time we get here — are never undone
 * by a misconfigured box.
 */
async function recordAcceptances(
  env: LeadEnv,
  scope: Scope,
  spec: LeadSubmission,
  definition: FormDefinition | null,
  contactId: string,
): Promise<void> {
  const intents = acceptanceIntents(spec, definition)
  if (intents.length === 0) return

  const held = new Map(
    (await acceptancesOf(env, scope, contactId)).map((record) => [record.key, record]),
  )
  for (const intent of intents) {
    if (!isAcceptanceKey(intent.key) || needsDocument(intent.key)) {
      reportAcceptanceSkipped(spec, scope.businessId, contactId, intent.key, 'not_settable')
      continue
    }
    // AN UNTICKED BOX ON SOMETHING THERE IS NOTHING TO TAKE BACK RECORDS NOTHING.
    // A request they did not make did not happen, and a document acceptance is
    // not the contact's to revoke — so there is no "no" to store, which is a
    // fact about those types rather than a submission we failed to handle.
    if (!intent.granted && !isRevocable(intent.key)) continue
    const current = held.get(intent.key)
    if (holdsState(intent.key) && current?.granted === intent.granted) continue
    await recordAcceptance(env, {
      contactId,
      key: intent.key,
      granted: intent.granted,
      wording: intent.wording,
      businessId: scope.businessId,
      ...(spec.submittedAt ? { occurredAt: spec.submittedAt } : {}),
    })
  }
}

/**
 * Whether this contact may be sent `asset`, given everything already sent to them.
 *
 * THE HISTORY IS READ ONCE AND PASSED IN ([[REQ-241]]). A form promising a set
 * asks this question once per item, and re-reading every message the contact
 * holds per item would be the same scan N times over for an answer that cannot
 * have changed between them — a bounce arrives from a webhook, never from the
 * middle of this loop.
 */
function deliveryState(
  history: readonly MessageRecord[],
  delivered: ReadonlySet<string>,
  asset: string,
): 'send' | 'already_sent' | 'suppressed' {
  // SUPPRESSION FIRST. An address that hard-bounced or reported us as spam is one
  // we must not write to whatever else is true of it, and checking the cheaper
  // condition first would let a first-time asset request mail a dead mailbox — or,
  // worse, one whose owner has already said they did not want to hear from us.
  //
  // BOTH, AND THEY ARE NOT THE SAME FACT. The bounce says the mailbox could not
  // take it; the complaint says the person did not want it. What they share is the
  // only thing this rule asks. The complaint is the one that damages the sending
  // domain, and a degraded domain's first casualty is sign-in links not arriving —
  // so abuse of a marketing form breaks the login, which is the whole reason the
  // suppression list is consulted before an address is mailed at all.
  //
  // AND IT APPLIES TO THE WHOLE SET, not to an item of it. A suppressed address
  // is sent none of the assets, because the rule is about the mailbox and the
  // set has nothing to do with it.
  if (suppressed(history)) return 'suppressed'
  if (delivered.has(asset)) return 'already_sent'
  return 'send'
}

/**
 * Whether this address must not be written to again ([[REQ-223]] §5).
 *
 * ITS OWN FUNCTION SINCE [[REQ-243]], because a form that promises no artifacts
 * has no asset to ask {@link deliveryState} about and must still be stopped. A
 * second `some(...)` written beside the welcome path is the shape that lets a
 * complaint be honoured for downloads and ignored for mailing lists, which is
 * the one direction this rule must never drift in.
 */
function suppressed(history: readonly MessageRecord[]): boolean {
  return history.some((message) => message.status === BOUNCED || message.status === COMPLAINED)
}

/**
 * Deliver what a form promised — its artifacts, or its one message — each at
 * most once, ever ([[REQ-223]] §5, per-asset by [[REQ-241]], per-template by
 * [[REQ-243]]).
 *
 * AT MOST ONCE AND NOT A RATE LIMIT. A per-day cap still permits sustained
 * harassment; one message per address per thing bounds a victim's exposure to
 * the same single message any newsletter signup produces, which is the floor for
 * a form a stranger can post an address they do not own into. The cost is real —
 * somebody who loses the mail cannot re-request it — and the intended remedy is
 * an operator re-send from the contacts surface, which is a different,
 * authenticated act. There is deliberately no public re-send path.
 *
 * PER ASSET, WHICH IS [[REQ-241]]'s DELIVERY CHANGE. A contact who has had paper
 * A and not paper B is sent B and is not sent A again, because the ledger keys
 * on the asset's key.
 *
 * AND PER TEMPLATE WHEN THERE IS NO ASSET, WHICH IS [[REQ-243]]'s. A form whose
 * whole deliverable is a place on a list has no artifact to key on, and it needs
 * a key or the cap does not exist — resubmitting the beta form with a stranger's
 * address a thousand times is exactly the harassment the asset rule was written
 * to bound. So the ledger handle is the TEMPLATE: this address has had this
 * business's welcome, and will not have it twice. Two forms naming one welcome
 * therefore send it once between them, which is what a welcome means.
 *
 * ONE MESSAGE PER ASSET, each naming its own artifact and linking at its own
 * URL. A single mail listing the set would be one record carrying one key, which
 * is exactly the ledger [[REQ-241]] widened.
 *
 * THE TEMPLATE IS RESOLVED ONCE, WHATEVER IT SENDS. Both shapes render the key
 * the FORM named — that is the whole of [[REQ-243]] — from the business's own
 * store, so two forms on one site send different mail with no branch here and no
 * platform-only path.
 *
 * THE LEDGER IS THE MESSAGE RECORD, which is written `queued` BEFORE the
 * provider is called. A counter kept anywhere else could say "sent" for a
 * message that never left, or say nothing for one that did.
 */
async function deliverForm(
  env: LeadEnv,
  store: TicketStore,
  scope: Scope,
  contactId: string,
  templateKey: string,
  /**
   * The copy this form's message carries, resolved from the site's own email
   * page, or null when the form names one the served snapshot does not hold.
   */
  template: MessageCopy | null,
  assets: readonly { key: string; name: string; url: string }[],
  /**
   * The per-contact page every artifact in this set is linked at ([[REQ-244]]).
   *
   * A THUNK, AND CALLED AT MOST ONCE, BECAUSE MINTING IS A WRITE. A form whose
   * whole set is `already_sent` or whose address is suppressed sends nothing, and
   * a link nobody holds is a row in `asset_grants` that can only ever be noise.
   * So the grant is minted at the first artifact that will ACTUALLY be sent, and
   * not before.
   */
  gateUrl: () => Promise<string>,
  send: SendEmail,
): Promise<{ assets: AssetOutcome[]; message?: MessageOutcome }> {
  /** The same answer in whichever shape this form's outcome takes. */
  const nothing = (skipped: DeliverySkip): { assets: AssetOutcome[]; message?: MessageOutcome } =>
    assets.length > 0
      ? { assets: assets.map((asset) => ({ key: asset.key, sent: false, skipped })) }
      : { assets: [], message: { sent: false, skipped } }

  /*
   * A MESSAGE THIS SITE DOES NOT HOLD, reported and not thrown ([[REQ-247]] §4).
   *
   * THERE IS NO CREDENTIAL CHECK HERE ANY MORE, and its absence is the point.
   * [[REQ-243]] had to refuse `invite` and `signin` explicitly, because the
   * template vocabulary was the business's whole ticket store and a form could
   * name anything in it. A form now names an email PAGE of its own site, and a
   * credential template is not a page of any site — so naming one lands here,
   * as the ordinary "no such message", and the rule that a public form cannot
   * send a redeemable credential has stopped being a check somebody could
   * forget to write.
   *
   * REACHABLE ONLY FROM A DRAFT, still. Publish refuses it and so does the
   * operation that configured the form; the builder's own preview submits
   * against a draft nothing validated, which is why this reports rather than
   * throws — a preview that 500s tells the operator far less than a submission
   * that captures the lead and says what was missing.
   */
  if (!template) return nothing('no_template')

  const primary = (await emailsOf(env, contactId)).find((row) => row.is_primary === 1)
  if (!primary) return nothing('no_address')

  const history = await messagesFor(store, contactId)
  // EVERY KEY ALREADY SENT TO, AND THE ONES SENT WITHIN THIS LOOP. The second
  // half matters for a form that names one key twice: the first item delivers,
  // and the second is `already_sent` for the same reason a second submission is.
  const delivered = new Set(
    history.map((message) => message.asset).filter((key): key is string => key !== null),
  )

  /** Queue, record and report one message. Shared so the two shapes cannot drift. */
  const post = async (
    outgoing: RenderedFor,
  ): Promise<MessageRecord> =>
    sendRecordedEmail(
      store,
      {
        contactId,
        addressId: primary.id,
        templateKey: outgoing.rendered.templateKey,
        templateUid: outgoing.rendered.templateUid,
        subject: outgoing.rendered.subject,
        from: outgoing.rendered.from?.trim() || mailFrom(env),
        // ONE RECIPIENT, AND THE TYPE IS WHAT SAYS SO — the same shape the invite
        // keeps, so a multi-recipient message is not expressible here either.
        to: primary.email,
        ...(outgoing.asset === null ? {} : { asset: outgoing.asset }),
        body: outgoing.rendered.body,
      },
      send,
    )

  // ── The form promises nothing: one message, keyed on the template ──────────
  if (assets.length === 0) {
    if (suppressed(history)) return { assets: [], message: { sent: false, skipped: 'suppressed' } }
    if (history.some((message) => message.asset === null && message.templateKey === templateKey)) {
      return { assets: [], message: { sent: false, skipped: 'already_sent' } }
    }
    // NO VALUES, AND THAT IS THE TOKEN CONTRACT DOING ITS JOB ([[REQ-243]] §3).
    // The capture path can supply the artifacts a form promised and nothing
    // else, so a form promising none supplies none — and a template declaring
    // `{{cta_url}}` is refused at render rather than sent with a dead button.
    const rendered = renderCopy(template, {})
    const message = await post({ rendered, asset: null })
    await recordEvent(env, scope, {
      contactId,
      kind: EMAIL_SENT,
      ref: message.uid,
      detail: { template: rendered.templateKey, status: message.status },
    })
    return { assets: [], message: { sent: true } }
  }

  // ── The form promises artifacts: one message each ─────────────────────────
  const outcomes: AssetOutcome[] = []
  for (const asset of assets) {
    const state = deliveryState(history, delivered, asset.key)
    if (state !== 'send') {
      outcomes.push({ key: asset.key, sent: false, skipped: state })
      continue
    }
    // `{{cta_url}}` IS THE GATED PAGE AND NO LONGER THE ARTIFACT ([[REQ-244]]
    // §2, superseding [[REQ-241]]'s "its own link"). A link straight at the paper
    // is the same link for everybody who was sent it, so it cannot say WHO
    // followed it — which is the fact the whole download-tracking change exists
    // to make expressible. Both mails in a two-paper set therefore carry the SAME
    // link, because §7 AC1 says it opens a page listing the SET; what keeps them
    // separately legible is `{{asset_name}}`, and what keeps the LEDGER separate
    // is the message's own asset key, both untouched.
    const rendered = renderCopy(template, { cta_url: await gateUrl(), asset_name: asset.name })
    const message = await post({ rendered, asset: asset.key })
    delivered.add(asset.key)
    // THE TIMELINE ENTRY IS WRITTEN WHATEVER THE PROVIDER SAID, for the reason the
    // invite moves its pipeline stage on the attempt: a refused send is still a
    // send this business made, the record carries the failure, and an operator
    // reading the history must see that it happened.
    await recordEvent(env, scope, {
      contactId,
      kind: ASSET_SENT,
      ref: message.uid,
      detail: { asset: asset.key, name: asset.name, status: message.status },
    })
    outcomes.push({ key: asset.key, sent: true })
  }
  return { assets: outcomes }
}

/** One rendered message and the ledger key it is remembered by, if any. */
interface RenderedFor {
  rendered: RenderedMessage
  asset: string | null
}

/*
 * WHAT THE LOG IS FOR, AND WHO READS IT.
 *
 * Every outcome below has always been computed correctly and then thrown away:
 * the sole `public-site` caller awaits {@link captureLead} and discards what it
 * returns, so a submission that wrote nothing left no row, no event and no line.
 * The visitor was told it worked — rightly — and the operator had no way to find
 * out otherwise, or to know there was anything to find. {@link LeadRefusal} has
 * said "reaches a log; never a visitor" since it was written; this is the log.
 *
 * RECORDED WHERE IT IS DECIDED, which is why these live here and not at the call
 * site. `denyAdmission` in `identity.ts` was filed from the same shape of bug —
 * a silent refusal that locked an operator out of their own deployment with
 * nothing in the running system saying why — and its rule is that deciding and
 * recording are the same statement, so a reason cannot be computed without being
 * reported. It binds harder here than it did there, because `captureLead` has
 * TWO callers: `public-site` over the service binding, and the builder preview
 * in-process (`router.ts`). A line written at either call site would leave the
 * other silent, which is the exact failure the rule exists to prevent.
 *
 * THERE IS NO DISCLOSURE RISK, for the reason `identity.ts` gives: the visitor
 * is told one frozen thing precisely BECAUSE they are unauthenticated and a
 * response that varied by outcome would be an oracle for which site keys exist
 * and who is already a contact. The operator reading the Worker's invocation log
 * is not the visitor, and the log is ours.
 *
 * STRUCTURED, in the shape `identity.ts`, `router.ts` and `email-webhook.ts`
 * already use — `console.warn(JSON.stringify({ event, … }))` — so these can be
 * queried out of the invocation logs rather than grepped out of prose. `warn`
 * and not `error` because none of this is a system failure: a refusal is a
 * DECISION this function reached deliberately, and the thrown case already has
 * its own `lead_capture_failed` at `error` in `public-site`.
 */

/**
 * Say that a submission wrote nothing, and why.
 *
 * FIELD NAMES AND NEVER FIELD VALUES. `no_email` is almost always a form whose
 * address field was authored without `type: 'email'`, and the question an
 * operator needs answered is *which fields did this form actually send* — which
 * the names answer completely. The values would answer it no better and would
 * turn an operational log into a store of whatever a stranger typed into a text
 * box, indexed by nothing and expiring on Cloudflare's schedule rather than on
 * this business's.
 */
function reportRefusal(spec: LeadSubmission, reason: LeadRefusal): void {
  console.warn(
    JSON.stringify({
      event: 'lead_not_captured',
      reason,
      site: spec.siteKey,
      form: spec.formHandle,
      ...(reason === 'no_email' ? { submittedFields: Object.keys(spec.fields).sort() } : {}),
    }),
  )
}

/**
 * Say that a form promised a download and it did not leave the building.
 *
 * ONE LINE PER SKIPPED ASSET, NAMING IT ([[REQ-241]]). A form promising a set
 * can deliver one artifact and skip another on the same submission, so a line
 * that did not say WHICH asset it was about would be unreadable exactly where
 * the set makes it worth reading.
 *
 * NOTHING IS WRITTEN FOR A FORM THAT PROMISED NOTHING — most of them. There is
 * no skipped asset to name, so there is no line, and a line per ordinary
 * submission would bury the skips that mean something. A log nobody can read is
 * the state this reporting exists to fix.
 *
 * THE CONTACT IS NAMED BY ID. It is the handle that opens the person's pane,
 * where the address already is; repeating the address here would put it in a
 * second place for no diagnostic gain.
 */
function reportAssetSkipped(
  spec: LeadSubmission,
  businessId: string,
  contactId: string,
  asset: string,
  reason: DeliverySkip,
): void {
  console.warn(
    JSON.stringify({
      event: 'lead_asset_not_sent',
      reason,
      site: spec.siteKey,
      form: spec.formHandle,
      business: businessId,
      contact: contactId,
      asset,
    }),
  )
}

/**
 * Say that a form named a message and it did not leave the building
 * ([[REQ-243]]).
 *
 * ITS OWN LINE RATHER THAN `lead_asset_not_sent` WITH A BLANK ASSET. The two are
 * different questions an operator asks — *why has nobody had the whitepaper* and
 * *why is the beta list not getting its welcome* — and a query that has to filter
 * one out of the other is a query nobody writes.
 *
 * IT NAMES THE MESSAGE, which is most of the diagnosis: `no_template` means this
 * site holds no email page under that name — a typo, a page removed with
 * `--force`, or a credential message a public form may never send. It is only
 * reachable from a draft, because publish refuses it and so does the operation
 * that configured the form ([[REQ-247]] §4).
 */
function reportMessageSkipped(
  spec: LeadSubmission,
  businessId: string,
  contactId: string,
  template: string,
  reason: DeliverySkip,
): void {
  console.warn(
    JSON.stringify({
      event: 'lead_message_not_sent',
      reason,
      site: spec.siteKey,
      form: spec.formHandle,
      business: businessId,
      contact: contactId,
      template,
    }),
  )
}

/**
 * Say that a form named an acceptance the write path will not set ([[REQ-242]]).
 *
 * THE ONLY WAY TO REACH THIS IS A STORED DEFINITION THE CONTRACT WOULD REFUSE —
 * a revision frozen before the enum existed, or one written by something other
 * than the edit path. It is therefore exactly the case that must not be silent:
 * the author believes the box means something, the page says so, and nothing is
 * recorded. `reason` is the class rather than the sentence, because a log line is
 * queried and not read as prose.
 */
function reportAcceptanceSkipped(
  spec: LeadSubmission,
  businessId: string,
  contactId: string,
  key: string,
  reason: 'not_settable',
): void {
  console.warn(
    JSON.stringify({
      event: 'lead_acceptance_not_recorded',
      reason,
      site: spec.siteKey,
      form: spec.formHandle,
      business: businessId,
      contact: contactId,
      acceptance: key,
    }),
  )
}

/**
 * Take one public form submission, end to end.
 *
 * THE ORDER IS THE SAFETY PROPERTY. The site is resolved before a store handle
 * exists, the definition is read before anything is written, and the address is
 * decided before a contact is touched — so a submission naming a site nobody
 * published writes nothing at all rather than half of something.
 */
export async function captureLead(
  env: LeadEnv,
  spec: LeadSubmission,
  deps: { send?: SendEmail } = {},
): Promise<LeadOutcome> {
  const site = await businessOfSite(env, spec.siteKey)
  if (!site) {
    reportRefusal(spec, 'unknown_site')
    return { accepted: false, reason: 'unknown_site' }
  }
  const scope: Scope = { businessId: site.businessId }

  const definition = await formDefinitionOf(
    env,
    site.businessId,
    spec.siteKey,
    spec.formHandle,
    spec.channel ?? 'published',
  )
  const email = addressIn(spec.fields, definition)
  // A SUBMISSION WITH NO ADDRESS IN IT IS NOT A LEAD. There is nobody to add and
  // nothing to send to, and inventing a contact from a name alone would put a
  // row in the CRM that no later submission could ever find again.
  if (email === '') {
    reportRefusal(spec, 'no_email')
    return { accepted: false, reason: 'no_email', businessId: site.businessId }
  }

  const added = await addContact(env, scope, { email })
  const contactId = added.person.id

  await recordEvent(env, scope, {
    contactId,
    kind: FORM_SUBMITTED,
    ...(spec.submittedAt ? { occurredAt: spec.submittedAt } : {}),
    detail: provenanceOfSubmission(spec, definition, email),
  })

  // AFTER THE SUBMISSION EVENT AND BEFORE ANY DELIVERY ([[REQ-242]]). The press
  // is what asserts an acceptance, so the timeline reads "submitted a form" and
  // then what that press agreed to; a download is a CONSEQUENCE of the press and
  // comes after. It also runs for a form that promises nothing, which is most of
  // them — the early return below is about assets and nothing else.
  await recordAcceptances(env, scope, spec, definition, contactId)

  const outcome: LeadOutcome = {
    accepted: true,
    businessId: site.businessId,
    contactId,
    created: added.created,
    assets: [],
  }
  // A FORM THAT SENDS NOTHING TOUCHES NO STORE. The ticket store is opened to
  // read the message ledger and the mail template, and a submission with nothing
  // to send needs neither.
  //
  // WHAT DECIDES IT IS THE TEMPLATE AND NO LONGER THE ASSETS ([[REQ-243]]). The
  // test used to be "does this form promise an artifact", which is why a form
  // whose whole deliverable is a place on a list mailed nobody. It is now "does
  // this form name a message", and a form promising artifacts necessarily names
  // one — `contact-form` v7's migration is what makes that true of every gated
  // download already in the stores.
  const promised = definition?.assets ?? []
  const templateKey = definition?.template ?? ''
  if (templateKey === '') return outcome

  const store = await ticketStoreFor(env, scope)
  /**
   * The link the mail carries, minted once and only if something is sent.
   *
   * MEMOISED HERE AND NOT INSIDE THE GRANT TABLE. `grantFor` is find-or-mint and
   * is safe to call twice, but calling it per artifact would be a round trip per
   * artifact for an answer that cannot differ between them.
   */
  let gate: Promise<string> | null = null
  const gateUrl = (): Promise<string> => {
    gate ??= grantFor(env, scope, {
      contactId,
      siteId: spec.siteKey,
      formHandle: spec.formHandle,
    }).then((grant) => publicSiteUrl(spec.siteKey, `/${DOWNLOAD_PATH}/${grant.id}`))
    return gate
  }

  const sent = await deliverForm(
    env,
    store,
    scope,
    contactId,
    templateKey,
    definition?.message ?? null,
    promised,
    gateUrl,
    // THE SENDER IS CHOSEN BY WHETHER THE DEPLOYMENT HOLDS A CREDENTIAL and by
    // nothing else ([[REQ-196]]): a development machine and a test runner have
    // none, so they get the adapter that records and cannot send.
    deps.send ?? mailerFor(env),
  )
  for (const asset of sent.assets) {
    if (asset.skipped) reportAssetSkipped(spec, site.businessId, contactId, asset.key, asset.skipped)
  }
  if (sent.message?.skipped) {
    reportMessageSkipped(spec, site.businessId, contactId, templateKey, sent.message.skipped)
  }
  return {
    ...outcome,
    assets: sent.assets,
    ...(sent.message ? { message: sent.message } : {}),
  }
}
