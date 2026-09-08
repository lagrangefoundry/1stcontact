import type { Ticket, TicketStore } from './tickets'

/**
 * Message templates — [[REQ-197]], [[DOC-40]] §2.1, design ref [[CHAT-39]].
 *
 * A MESSAGE BODY IS CONTENT, AND CONTENT IS A TICKET. The invite mail, the
 * sign-in mail and the lapse mail all need copy that changes without a deploy,
 * and this repository already has exactly one place where that is true of
 * anything: the tenant's own ticket store. So a template is a ticket, read back
 * by {@link templateFor} and rendered by {@link renderTemplate}.
 *
 * IT LIVES IN THE TENANT'S STORE, AND THAT IS THE WHOLE REASON TO DO IT THIS
 * WAY. Nothing here knows which business it is serving: the store handle it is
 * given is already bound to one ([[DOC-10]] §4.1), so templates written for the
 * 1st Contact business are 1st Contact's, and the same code gives a customer
 * their own templates for their own contacts with no second path and no
 * platform-only branch. [[DOC-40]] §2.1 rule 1 names the alternative — a
 * capability built only for the platform — as the failure mode, and a hardcoded
 * body string in the Worker would be precisely that.
 *
 * THE SENDER LOOKS A TEMPLATE UP BY {@link TemplateKey}, NEVER BY UID. That is
 * what makes replacing a template *writing a new ticket* rather than editing a
 * live one in place: the newest ticket carrying the key wins, and the record of
 * what was sent last month still points at the ticket that said it
 * ([[REQ-198]]).
 *
 * THE BODY IS ONE THING, AND IT IS HTML. [[REQ-197]] defers the multipart
 * decision until there is a reason for it, and the invite is required to carry a
 * call to action *as a button* — which does not exist in plain text. So there is
 * one body, it is HTML, and the pasteable-URL fallback below is what carries the
 * recipients whose client mangles the button.
 */

/** The ticket type. Spelled once; `tickets.ts` registers the pack under it. */
export const TEMPLATE_TYPE = 'template'

/**
 * The messages this platform sends, and therefore the templates that exist.
 *
 * A CLOSED SET RATHER THAN A FREE STRING, because the key is what a sender looks
 * up by: an open vocabulary would let a template be authored under `sign-in`
 * while the sender asks for `signin`, and the two would never meet. The failure
 * of a closed set is a refusal at authoring time; the failure of an open one is
 * a send that finds nothing at the moment somebody is waiting for mail.
 */
export const TEMPLATE_KEYS = ['invite', 'signin', 'lapsed'] as const

export type TemplateKey = (typeof TEMPLATE_KEYS)[number]

/**
 * The type's schema, merged into `productTypePack()`.
 *
 * `placeholders` IS A LIST AND IS NOT REQUIRED. A template with no tokens is an
 * ordinary template — a lapse notice that says the same thing to everybody needs
 * none — and absence reads as the empty list rather than as a third state.
 *
 * THE BODY IS REQUIRED AND NON-EMPTY, unlike `material`'s. A material's body is
 * written asynchronously by an extractor, so an empty one is a stage rather than
 * an error; a template with no body is not a template, and the moment it is read
 * somebody is trying to send it.
 *
 * `from` IS OPTIONAL, AND ABSENT MEANS `MAIL_FROM` ([[REQ-205]]). The sending
 * address used to be the deployment's and nothing else, which meant one address
 * for every message this platform sends: setting it to `invite@` would have sent
 * sign-in links from `invite@` too. It belongs to the TEMPLATE because "who is
 * this from" is a property of which message it is — an invitation somebody may
 * well reply to is not a sign-in link nobody should — and optional because
 * absent has to keep meaning what every template ticket written so far already
 * means.
 */
export const TEMPLATE_SCHEMA = {
  fields: {
    template_key: { type: 'enum', enum: [...TEMPLATE_KEYS], required: true },
    subject: { type: 'string', required: true },
    placeholders: { type: 'list' },
    from: { type: 'string' },
  },
  body: { required: true, non_empty: true },
}

/** A rendered message, ready for a sender ([[REQ-196]]) and a record ([[REQ-198]]). */
export interface RenderedMessage {
  subject: string
  body: string
  /** The address to send from, when the copy named one ([[REQ-205]]). */
  from?: string
  /** Which template said it — the key the sender asked for. */
  templateKey: string
  /** Which *ticket* said it, so [[REQ-198]]'s record can name the exact copy. */
  templateUid: string
}

/**
 * Copy to render, WHEREVER IT CAME FROM ([[REQ-199]]).
 *
 * THE TEMPLATE IS ONE SOURCE OF THIS AND NO LONGER THE ONLY ONE. The invite
 * modal prefills its Subject and Body from the `invite` template and lets the
 * operator change them *for this send* — so what is rendered is not always what
 * a ticket says, and {@link renderCopy} has to be able to take the edited text.
 *
 * `declared` STILL COMES FROM THE TEMPLATE, AND THAT IS THE POINT. An operator
 * who deletes `{{cta_url}}` out of the body has deleted the only route in, and
 * the message would go out looking perfectly ordinary with a dead button. The
 * declaration is the template's promise about what its copy must carry, so it
 * travels with the edited text and refuses it — which is [[REQ-197]]'s first
 * refusal doing exactly the job it was written for, one surface further along.
 *
 * THE TEMPLATE'S IDENTITY TRAVELS WITH IT TOO, both halves. [[REQ-198]]'s record
 * names which template a message came from even when the operator changed the
 * words, because *which template was this* and *what did this person receive*
 * are two different questions and the record answers both.
 */
export interface MessageCopy {
  subject: string
  body: string
  /**
   * The address this message goes out from, when the template names one
   * ([[REQ-205]]). Absent means the deployment's `MAIL_FROM`.
   *
   * IT TRAVELS WITH THE SUBJECT AND THE BODY because it is the same kind of
   * thing: part of what this particular message IS. The alternative — resolving
   * it at each call site from the template key — would be a second place that
   * knows which address belongs to which message, free to disagree with the
   * ticket.
   *
   * IT IS NOT OPERATOR-EDITABLE, and that is a different claim from this one. An
   * operator-set sender fails DKIM and lands in spam, so the invite modal shows
   * the address and refuses to take an edit ([[REQ-199]], [[REQ-205]]); what
   * changes is only which address the server resolves and displays.
   */
  from?: string
  /** The tokens the template promises its body carries. Absent reads as none. */
  declared?: readonly string[]
  templateKey: string
  templateUid: string
}

/**
 * The render refused — [[REQ-197]]'s central promise.
 *
 * IT NAMES THE TEMPLATE AND THE TOKEN, both, because neither alone is
 * actionable: "a placeholder is missing" sends the operator looking through
 * three templates, and "{{cta_url}} is missing" does not say which one to fix.
 */
export class TemplateRefusedError extends Error {
  readonly name = 'TemplateRefusedError'
  constructor(
    readonly templateKey: string,
    readonly templateUid: string,
    readonly token: string,
    reason: string,
  ) {
    super(
      `Refusing to render the ${templateKey} template (${templateUid}): ` +
        `the token {{${token}}} ${reason}. Nothing was sent.`,
    )
  }
}

/** No template carries this key in this business's store. */
export class TemplateNotFoundError extends Error {
  readonly name = 'TemplateNotFoundError'
  constructor(readonly templateKey: string) {
    super(`No ${templateKey} template exists in this business.`)
  }
}

/**
 * The token grammar: `{{name}}`, with optional inner whitespace.
 *
 * DELIBERATELY NARROW. Anything richer — a filter pipeline, a conditional, a
 * loop — is a template *language*, which is a thing to maintain and a thing an
 * operator can get wrong in ways this file would then have to report on. The
 * whole contract here is substitution, and the value of that contract is that it
 * either happens completely or it refuses.
 */
const TOKEN = /\{\{\s*([A-Za-z0-9_]+)\s*\}\}/g

/** Every token that actually appears in a piece of copy, in order, deduplicated. */
function tokensIn(text: string): string[] {
  const found: string[] = []
  for (const m of text.matchAll(TOKEN)) {
    if (!found.includes(m[1])) found.push(m[1])
  }
  return found
}

/**
 * The tokens a template declares, tolerant of both spellings.
 *
 * An operator authoring the ticket by hand will write `cta_url` or `{{cta_url}}`
 * about equally often, and refusing one of them would be a contract about
 * punctuation rather than about content.
 */
function declaredTokens(template: Ticket): string[] {
  const raw = template.fields.placeholders
  const list = Array.isArray(raw) ? raw : []
  const out: string[] = []
  for (const entry of list) {
    const name = String(entry).trim().replace(/^\{\{\s*/, '').replace(/\s*\}\}$/, '')
    if (name !== '' && !out.includes(name)) out.push(name)
  }
  return out
}

/**
 * Substitute a template's tokens, or refuse.
 *
 * THREE REFUSALS, AND THEY ARE THE POINT OF THE TICKET:
 *
 *  1. a declared token that does not appear in the body — the declaration and
 *     the copy have come apart, and the one thing the template promised to say
 *     is the thing it no longer says;
 *  2. a declared token with no value, or an empty one — the caller has nothing
 *     to put there;
 *  3. any token left unsubstituted after the pass, declared or not — which is
 *     the falsifier stated in the round, and is what catches a token somebody
 *     added to the copy and forgot to declare.
 *
 * THE FAILURE THIS PREVENTS IS SILENT AND ARRIVES AT A STRANGER. An invite whose
 * `{{cta_url}}` never got substituted is a mail with a dead button that looks
 * entirely normal to the person who receives it, and produces a beta user who
 * cannot get in and does not know why. A refusal is loud, reaches the operator,
 * and happens before anybody is emailed.
 *
 * AN EMPTY VALUE IS A MISSING VALUE. Substituting `""` produces exactly the mail
 * the refusal exists to prevent — a button whose href is nothing — and it does
 * it while reporting success, which is worse than either honest outcome.
 *
 * THE SUBJECT IS SUBSTITUTED TOO, AND IS NOT WHERE THE DECLARATION IS CHECKED.
 * A token may be used in the subject line and it will be filled in; what the
 * declaration promises is about the *body*, which is where the call to action
 * lives and where an unfilled token does the damage.
 */
export function renderTemplate(
  template: Ticket,
  values: Record<string, string | null | undefined> = {},
): RenderedMessage {
  return renderCopy(copyOf(template), values)
}

/**
 * The copy a template holds, as the thing that renders it takes.
 *
 * ONE PLACE THAT READS A TEMPLATE TICKET'S FIELDS. The invite modal has to
 * prefill from a template and then render something else ([[REQ-199]]), so
 * "where the subject lives on a template ticket" is asked in two moments and
 * must have one answer.
 */
export function copyOf(template: Ticket): MessageCopy {
  const from = String(template.fields.from ?? '').trim()
  return {
    subject: String(template.fields.subject ?? ''),
    body: template.body ?? '',
    // ABSENT RATHER THAN EMPTY. `MAIL_FROM` is the fallback and the caller
    // applies it, so an empty string here would be a third state meaning the
    // same as the second and reaching a `check()` that refuses a blank sender.
    ...(from === '' ? {} : { from }),
    declared: declaredTokens(template),
    templateKey: String(template.fields.template_key ?? template.type),
    templateUid: template.uid,
  }
}

/**
 * The same three refusals, over copy that may have been edited ([[REQ-199]]).
 *
 * THE REFUSALS DO NOT WEAKEN BECAUSE A HUMAN TYPED THE WORDS. If anything the
 * edited case is the one they exist for: a template is written once and read by
 * whoever wrote it, and a subject-and-body edited in a modal at the moment
 * somebody is about to press send is where a `{{cta_url}}` gets deleted by
 * accident. The refusal names the template it came from, which is still the
 * right thing to name — it is the copy's origin and the place to go and look.
 */
export function renderCopy(
  copy: MessageCopy,
  values: Record<string, string | null | undefined> = {},
): RenderedMessage {
  const key = copy.templateKey
  const subject = copy.subject ?? ''
  const body = copy.body ?? ''
  const refuse = (token: string, reason: string): never => {
    throw new TemplateRefusedError(key, copy.templateUid, token, reason)
  }

  const inBody = tokensIn(body)
  for (const token of copy.declared ?? []) {
    if (!inBody.includes(token)) {
      refuse(token, 'is declared by this template and does not appear in its body')
    }
    const value = values[token]
    if (value == null || String(value).trim() === '') {
      refuse(token, 'is declared by this template and no value was given for it')
    }
  }

  const fill = (text: string): string =>
    text.replace(TOKEN, (whole, name: string) => {
      const value = values[name]
      return value == null || String(value).trim() === '' ? whole : String(value)
    })

  const rendered = { subject: fill(subject), body: fill(body) }
  const leftover = [...tokensIn(rendered.body), ...tokensIn(rendered.subject)]
  if (leftover.length > 0) {
    refuse(leftover[0], 'was left unsubstituted, so the message would have gone out with a hole in it')
  }

  // THE SENDING ADDRESS PASSES THROUGH VERBATIM AND IS NOT SUBSTITUTED
  // ([[REQ-205]]). It is not copy: a token in it would be a sender assembled at
  // send time, and an address that varies per message is an address DKIM cannot
  // vouch for.
  return {
    ...rendered,
    ...(copy.from ? { from: copy.from } : {}),
    templateKey: key,
    templateUid: copy.templateUid,
  }
}

/**
 * The template in force for `key` in this business, seeding the default if the
 * business has never had one.
 *
 * NEWEST WINS, WHICH IS WHAT MAKES REPLACEMENT A WRITE RATHER THAN AN EDIT.
 * Several tickets may carry one key; the most recently created is the one that
 * sends. Editing a live template in place stays possible and is the ordinary
 * case for a typo — what this ordering buys is that rewriting the copy wholesale
 * need not destroy the ticket [[REQ-198]]'s records already point at.
 *
 * SEED-IF-ABSENT, NEVER SEED-UNCONDITIONALLY — the same shape, and the same
 * argument, as `ticketStoreFor`'s tenant registration. A business that has never
 * been asked for a template has none, and the first send would otherwise fail on
 * a fresh deployment for want of content nobody knew they had to write. The seed
 * is written *as a ticket*, so the very next act on it is ordinary authoring; it
 * is a starting point, not a fallback the sender reaches for behind the
 * operator's back.
 *
 * (An operator who archives a template will therefore be given the default back
 * the next time one is asked for. That is the useful failure of the two: a
 * message type with no template cannot be sent at all.)
 */
export async function templateFor(store: TicketStore, key: TemplateKey): Promise<Ticket> {
  const { tickets } = await store.query({
    predicate: `type=${TEMPLATE_TYPE} AND fields.template_key=${key}`,
    sort: '-created_at',
    limit: 'all',
  })
  if (tickets.length > 0) return tickets[0]

  const seed = SEED_TEMPLATES[key]
  if (!seed) throw new TemplateNotFoundError(key)
  const { ticket } = await store.create({
    type: TEMPLATE_TYPE,
    title: seed.title,
    fields: {
      template_key: key,
      subject: seed.subject,
      placeholders: [...seed.placeholders],
      ...(seed.from ? { from: seed.from } : {}),
    },
    body: seed.body,
  })
  return ticket
}

/**
 * Every template this business sends, seeding whichever are absent.
 *
 * The plural of {@link templateFor} rather than a second mechanism, so there is
 * exactly one definition of what "the invite template" is.
 */
export async function ensureTemplates(store: TicketStore): Promise<Ticket[]> {
  const out: Ticket[] = []
  for (const key of TEMPLATE_KEYS) out.push(await templateFor(store, key))
  return out
}

interface SeedTemplate {
  title: string
  subject: string
  placeholders: readonly string[]
  body: string
  /** The address this message sends from, when it is not the deployment's. */
  from?: string
}

/**
 * The copy a business starts with.
 *
 * DELIBERATELY BUSINESS-NEUTRAL. The same seed is written into whichever store
 * asks, so naming 1st Contact here would put our name in a plumber's mail to
 * their own customers. Naming the business through a token was the alternative
 * and is worse: it would make every send depend on a value the sender has no
 * reason to hold, and the refusal above would then fire on the ordinary path.
 * Putting the business's own name in is an edit to the ticket, which is exactly
 * the authoring this type exists for.
 *
 * `{{cta_url}}` IS THE ONLY DECLARED TOKEN, in all three. The link is the one
 * thing that cannot be written in advance and the one thing whose absence is
 * fatal, so it is the one thing declared — a `{{name}}` here would refuse every
 * send to a contact whose name we do not hold, which is most of them.
 */
export const SEED_TEMPLATES: Record<TemplateKey, SeedTemplate> = {
  /**
   * The invite, which [[REQ-197]] requires to carry three things: a welcome, a
   * call to action as a button, and the same URL again in full as pasteable
   * text with wording that says why it is there.
   *
   * THE THIRD PART IS NOT DECORATION. A meaningful share of mail clients strip
   * or mangle styled anchors, and the button is the only route in; without the
   * fallback those recipients are simply lost, and they are lost silently.
   */
  invite: {
    title: 'Invite email',
    subject: 'Your invitation',
    placeholders: ['cta_url'],
    /**
     * THE ONE SEED THAT NAMES AN ADDRESS ([[REQ-205]]), and the two reasons are
     * the two problems with `no-reply@`.
     *
     * IT IS A MAILBOX SOMEBODY READS. A reply is one of the strongest positive
     * engagement signals a recipient can produce, and somebody *will* reply to
     * an invitation; `no-reply@` refuses every one of them and is itself a
     * weighted negative signal. (A repliable address that bounces is worse than
     * `no-reply@`, so this depends on the routing being in place — the operator
     * half of this change.)
     *
     * IT CARRIES A DISPLAY NAME, in RFC 5322 form, because an anonymous From is
     * most of what makes an invitation from a domain with no reputation look
     * like phishing.
     *
     * AND IT IS THE ONE PLACE THIS SEED IS NOT BUSINESS-NEUTRAL, which is worth
     * being uncomfortable about. The copy below stays neutral for the reason the
     * header gives — our name has no business in a plumber's mail to their own
     * customers. An ADDRESS is a different kind of thing: there is exactly one
     * sending domain on this deployment and every message already leaves from
     * it, so this names what is true rather than adding anything. The day a
     * business sends from its own domain, this field is what has to move, and it
     * moves as an edit to a ticket rather than as a deploy.
     */
    from: '1st Contact <invite@1stcontact.io>',
    body: [
      '<p>Hello,</p>',
      '<p>You have been invited to set up your account. Everything is ready —',
      'the link below takes you straight in, and there is no password to choose.</p>',
      '<p><a href="{{cta_url}}" style="display:inline-block;padding:12px 20px;',
      'background:#111111;color:#ffffff;text-decoration:none;border-radius:6px;',
      'font-weight:600">Accept your invitation</a></p>',
      '<p>If that button does not work, copy the address below and paste it into',
      'your browser:</p>',
      '<p>{{cta_url}}</p>',
      '<p>If you were not expecting this, you can ignore it and nothing will happen.</p>',
    ].join('\n'),
  },

  /** The sign-in link. Same fallback, same reason. */
  signin: {
    title: 'Sign-in email',
    subject: 'Your sign-in link',
    placeholders: ['cta_url'],
    body: [
      '<p>Hello,</p>',
      '<p>Here is the sign-in link you asked for.</p>',
      '<p><a href="{{cta_url}}" style="display:inline-block;padding:12px 20px;',
      'background:#111111;color:#ffffff;text-decoration:none;border-radius:6px;',
      'font-weight:600">Sign in</a></p>',
      '<p>If that button does not work, copy the address below and paste it into',
      'your browser:</p>',
      '<p>{{cta_url}}</p>',
      '<p>If you did not ask to sign in, you can ignore this message.</p>',
    ].join('\n'),
  },

  /**
   * The lapse notice. Nothing sends it yet ([[REQ-197]] creates the template and
   * no ticket triggers it), and it is seeded anyway so that whoever does write
   * that trigger finds copy rather than an empty store.
   */
  lapsed: {
    title: 'Lapsed access email',
    subject: 'Your access has ended',
    placeholders: ['cta_url'],
    body: [
      '<p>Hello,</p>',
      '<p>Your access has come to an end. Your work is still here and nothing has',
      'been deleted — you can still reach your own details and your payment',
      'history at any time.</p>',
      '<p><a href="{{cta_url}}" style="display:inline-block;padding:12px 20px;',
      'background:#111111;color:#ffffff;text-decoration:none;border-radius:6px;',
      'font-weight:600">Open your account</a></p>',
      '<p>If that button does not work, copy the address below and paste it into',
      'your browser:</p>',
      '<p>{{cta_url}}</p>',
    ].join('\n'),
  },
}
