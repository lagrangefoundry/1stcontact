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
  FORM_SUBMITTED,
} from './builder/contact-events.js'
import { recordEvent } from './events'
import { isEmailShape } from './builder/email-shape.js'
import { emailsOf, normaliseEmail, type IdentityEnv } from './identity'
import type { MailEnv, SendEmail } from './mail'
import { mailerFor, mailFrom } from './mail'
import { BOUNCED, COMPLAINED, sendRecordedEmail, messagesFor } from './messages'
import { addContact } from './people'
import type { Scope } from './scope'
import { copyOf, renderCopy, templateFor } from './templates'
import { ticketStoreFor, type TicketStore, type TicketStoreEnv } from './tickets'
import { d1r2SiteStore, UnknownTenantError } from '../../../tools/generate/src/store/d1r2-store'
import { liveRevisionOf } from '../../../tools/generate/src/store/revision-model'

/** The template every asset delivery renders from. Spelled once. */
export const ASSET_TEMPLATE = 'asset'

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
export interface LeadSubmission {
  siteKey: string
  /** Which form instance, from the module's own hidden handle. May be empty. */
  instanceId: string
  /** Every field the visitor submitted, reserved names already stripped. */
  fields: Record<string, string>
  /** When the visitor pressed the button. Defaults to now. */
  submittedAt?: string
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
  /** Whether an asset left the building for this submission. */
  assetSent?: boolean
  /** Why no asset was sent, when the form promised one. */
  assetSkipped?: 'already_sent' | 'suppressed' | 'no_address' | 'not_offered'
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
  /** The declared field schema, by field name. */
  fields: Record<string, { label: string; type: string }>
  /** The asset this form promises, when it promises one. */
  asset?: { key: string; name: string; url: string }
}

/**
 * The business and slug a site key names.
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
): Promise<{ businessId: string; slug: string } | null> {
  if (siteKey === '') return null
  const row = await env.DB.prepare('SELECT tenant_id, slug FROM sites WHERE id = ?')
    .bind(siteKey)
    .first<{ tenant_id: string; slug: string }>()
  if (!row) return null
  return { businessId: row.tenant_id, slug: row.slug }
}

/** One page's module list, defensively narrowed out of a stored definition. */
function instancesOf(page: Record<string, unknown>): Array<Record<string, unknown>> {
  const modules = page.modules
  if (!Array.isArray(modules)) return []
  return modules.filter((m): m is Record<string, unknown> => !!m && typeof m === 'object')
}

/** A config value as a trimmed string, or `''` when it is not one. */
function text(config: Record<string, unknown>, key: string): string {
  const value = config[key]
  return typeof value === 'string' ? value.trim() : ''
}

/**
 * Read one `contact-form` instance out of the site's LIVE PUBLISHED revision.
 *
 * THE PUBLISHED REVISION AND NOT THE DRAFT, deliberately. The visitor filled in
 * a form that was served to them out of a frozen snapshot; the draft is whatever
 * the operator has been editing since, and reading the consent wording from it
 * would evidence a sentence that was never on the page. A site with nothing
 * published served nobody a form, so it resolves to nothing.
 *
 * FIRST MATCH ACROSS PAGES. An instance id is unique within a page and nothing
 * enforces it across a site; two pages carrying one id is an authoring collision
 * rather than a submission the visitor can steer, and the cost of the collision
 * is provenance naming the wrong page — not a write anywhere it should not be.
 */
export async function formDefinitionOf(
  env: LeadEnv,
  businessId: string,
  slug: string,
  instanceId: string,
): Promise<FormDefinition | null> {
  if (instanceId === '') return null
  let store
  try {
    store = await d1r2SiteStore({ DB: env.DB, SITES: env.SITES }).forTenant(businessId)
  } catch (err) {
    if (err instanceof UnknownTenantError) return null
    throw err
  }
  const live = liveRevisionOf(await store.revisions(slug))
  if (live === null) return null
  const snapshot = await store.readRevision(slug, live)
  if (!snapshot) return null

  for (const stored of snapshot.pages) {
    for (const instance of instancesOf(stored.page)) {
      if (instance.id !== instanceId) continue
      const config = (instance.config ?? {}) as Record<string, unknown>
      const fields: FormDefinition['fields'] = {}
      const declared = Array.isArray(config.fields) ? config.fields : []
      for (const entry of declared) {
        if (!entry || typeof entry !== 'object') continue
        const field = entry as Record<string, unknown>
        const name = String(field.name ?? '')
        if (name === '') continue
        fields[name] = { label: String(field.label ?? ''), type: String(field.type ?? 'text') }
      }
      const key = text(config, 'asset')
      const url = text(config, 'assetUrl')
      return {
        page: stored.name,
        submitLabel: text(config, 'submitLabel') || 'Send',
        fields,
        // BOTH OR NEITHER. A key with no URL is an asset nothing can deliver, and
        // a URL with no key is a delivery nothing can remember having made — and
        // the at-most-once rule is exactly a memory. Half a declaration is
        // treated as none rather than as a best effort.
        ...(key !== '' && url !== ''
          ? { asset: { key, url, name: text(config, 'assetName') || UNNAMED_ASSET } }
          : {}),
      }
    }
  }
  return null
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
 * pressed said, what they typed into "What are you building?", or what sentence
 * they were shown above the tick box. None of that is reconstructable later, and
 * the last of them is what evidences consent.
 */
export function provenanceOfSubmission(
  spec: LeadSubmission,
  definition: FormDefinition | null,
  email: string,
): Record<string, unknown> {
  const consent: Array<{ field: string; wording: string; answer: boolean }> = []
  const answers: Record<string, string> = {}
  const declared = definition?.fields ?? {}

  for (const [name, value] of Object.entries(spec.fields)) {
    const spec2 = declared[name]
    if (spec2?.type === 'checkbox') continue
    // The address is on the row and on the address table; repeating it in the
    // bag would be a third copy of one fact with nothing keeping them equal.
    if (normaliseEmail(value) === email && email !== '') continue
    answers[name] = value
  }

  // EVERY DECLARED CHECKBOX, TICKED OR NOT. An unticked box submits nothing at
  // all, so a consent record built only from what arrived would be silent
  // exactly where "they were asked and said no" is the fact worth having.
  for (const [name, spec2] of Object.entries(declared)) {
    if (spec2.type !== 'checkbox') continue
    consent.push({ field: name, wording: spec2.label, answer: (spec.fields[name] ?? '') !== '' })
  }

  return {
    site: spec.siteKey,
    ...(definition ? { page: definition.page, submitLabel: definition.submitLabel } : {}),
    form: spec.instanceId,
    fields: answers,
    ...(consent.length > 0 ? { consent } : {}),
    ...(definition?.asset ? { asset: definition.asset.key } : {}),
  }
}

/** Whether this contact has already had `asset`, or must never be mailed again. */
async function deliveryState(
  store: TicketStore,
  contactId: string,
  asset: string,
): Promise<'send' | 'already_sent' | 'suppressed'> {
  const history = await messagesFor(store, contactId)
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
  if (history.some((message) => message.status === BOUNCED || message.status === COMPLAINED)) {
    return 'suppressed'
  }
  if (history.some((message) => message.asset === asset)) return 'already_sent'
  return 'send'
}

/**
 * Deliver the asset a form promised, at most once, ever ([[REQ-223]] §5).
 *
 * AT MOST ONCE AND NOT A RATE LIMIT. A per-day cap still permits sustained
 * harassment; one message per address per asset bounds a victim's exposure to
 * the same single message any newsletter signup produces, which is the floor for
 * an email-gated asset. The cost is real — somebody who loses the mail cannot
 * re-request it — and the intended remedy is an operator re-send from the
 * contacts surface, which is a different, authenticated act. There is
 * deliberately no public re-send path.
 *
 * THE LEDGER IS THE MESSAGE RECORD, which is written `queued` BEFORE the
 * provider is called. A counter kept anywhere else could say "sent" for a
 * message that never left, or say nothing for one that did.
 */
async function deliverAsset(
  env: LeadEnv,
  store: TicketStore,
  scope: Scope,
  contactId: string,
  asset: { key: string; name: string; url: string },
  send: SendEmail,
): Promise<LeadOutcome['assetSkipped'] | null> {
  const primary = (await emailsOf(env, contactId)).find((row) => row.is_primary === 1)
  if (!primary) return 'no_address'

  const state = await deliveryState(store, contactId, asset.key)
  if (state !== 'send') return state

  const rendered = renderCopy(copyOf(await templateFor(store, ASSET_TEMPLATE)), {
    cta_url: asset.url,
    asset_name: asset.name,
  })
  const message = await sendRecordedEmail(
    store,
    {
      contactId,
      addressId: primary.id,
      templateKey: rendered.templateKey,
      templateUid: rendered.templateUid,
      subject: rendered.subject,
      from: rendered.from?.trim() || mailFrom(env),
      // ONE RECIPIENT, AND THE TYPE IS WHAT SAYS SO — the same shape the invite
      // keeps, so a multi-recipient message is not expressible here either.
      to: primary.email,
      asset: asset.key,
      body: rendered.body,
    },
    send,
  )
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
  return null
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
  if (!site) return { accepted: false, reason: 'unknown_site' }
  const scope: Scope = { businessId: site.businessId }

  const definition = await formDefinitionOf(env, site.businessId, site.slug, spec.instanceId)
  const email = addressIn(spec.fields, definition)
  // A SUBMISSION WITH NO ADDRESS IN IT IS NOT A LEAD. There is nobody to add and
  // nothing to send to, and inventing a contact from a name alone would put a
  // row in the CRM that no later submission could ever find again.
  if (email === '') {
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

  const outcome: LeadOutcome = {
    accepted: true,
    businessId: site.businessId,
    contactId,
    created: added.created,
    assetSent: false,
  }
  if (!definition?.asset) return { ...outcome, assetSkipped: 'not_offered' }

  const store = await ticketStoreFor(env, scope)
  const skipped = await deliverAsset(
    env,
    store,
    scope,
    contactId,
    definition.asset,
    // THE SENDER IS CHOSEN BY WHETHER THE DEPLOYMENT HOLDS A CREDENTIAL and by
    // nothing else ([[REQ-196]]): a development machine and a test runner have
    // none, so they get the adapter that records and cannot send.
    deps.send ?? mailerFor(env),
  )
  return skipped ? { ...outcome, assetSkipped: skipped } : { ...outcome, assetSent: true }
}
