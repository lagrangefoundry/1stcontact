/**
 * The sender ([[REQ-196]]) — the one way anything in this repository puts a
 * message in front of a person who is not already looking at the builder.
 *
 * THERE WAS NO SENDER, and the invite said so in its own docstring for
 * exactly as long as that was true: *"an 'invite' that silently sends nothing is
 * a feature an operator will assume exists and will not check."* This file is
 * what makes it exist. It does not make the invite send anything — the message
 * itself is [[REQ-197]]'s and the record of what was sent is [[REQ-198]]'s — it
 * supplies the verb both of them need.
 *
 * TWO FACTS MADE THIS A DECISION RATHER THAN A LINE OF CODE.
 *
 *   - **Workers have no SMTP.** There is no outbound port 25 from workerd, so
 *     sending is always an HTTPS call to somebody else's service. There is no
 *     "just send it" branch to fall back to.
 *   - **Cloudflare's own `send_email` binding cannot do it.** It delivers only to
 *     addresses pre-verified in the account, which is precisely the set an
 *     invitee is not in. It is the obvious-looking answer, it costs nothing, it
 *     is already in the platform we are on, and it does not work for the one case
 *     we need — which is worth writing down, because the next person to look will
 *     find it before they find this file.
 *
 * A PORT, WITH RESEND BEHIND IT. Resend is the least work inside a Worker and its
 * free tier covers the beta. The port exists so that is a REVERSIBLE decision:
 * deliverability reputation is the kind of thing that becomes a reason to move to
 * Postmark, and when it does the change should be one adapter and no call sites.
 *
 * `providerId` IS RETURNED AND IS NOT OPTIONAL. It is the provider's message id,
 * and it is the only thing that can later join a delivery or bounce webhook back
 * to the record of what we sent ([[REQ-198]]). An adapter that discarded it would
 * make bounce handling unimplementable without a second round trip — so the
 * LOCAL adapter mints one too, rather than returning nothing and leaving the
 * record path with a shape it only ever sees in production.
 */

/** One message, and the whole of what a sender is told. */
export interface Message {
  to: string
  /**
   * The sending address, passed IN rather than baked into the adapter.
   *
   * It is configuration — {@link mailFrom} is the one place it is read — and it
   * is an argument here because an adapter that owned it could not be handed a
   * different one, and the day a second address is wanted (a reply-to that
   * reaches a human, a per-business sender) the choice belongs to the caller
   * that knows which message this is.
   */
  from: string
  subject: string
  /**
   * THE MESSAGE, AND IT IS HTML — one body, still singular ([[REQ-196]] shape,
   * [[REQ-197]]'s decision, [[REQ-199]]'s first actual send).
   *
   * THIS SAID "PLAIN TEXT" AND THE ADAPTER SENT IT AS `text`, which was right
   * while nothing sent anything. [[REQ-197]] then wrote the copy, and required
   * the invite to carry its call to action AS A BUTTON — which does not exist in
   * plain text. Delivered as `text`, that template arrives as a screenful of
   * visible `<p>` and `<a href=…>` markup: a message that looks broken to the
   * one stranger it was written for, and looks fine everywhere on our side.
   *
   * STILL ONE FIELD AND NOT TWO, AND TWO PARTS ARE SENT ([[REQ-205]]). A second
   * `text` alternative is a second thing every template must decide about and a
   * second body that can disagree with the first — which was an argument about
   * AUTHORING, and it survives intact, because the text part is DERIVED and
   * never written. {@link textFrom} is the derivation; one body is still typed,
   * two parts leave the building, and the two cannot disagree because one is a
   * function of the other.
   *
   * WHY A SECOND PART IS SENT AT ALL: an HTML-only message is among the most
   * commonly weighted spam heuristics, and a real invite from this deployment
   * authenticated — SPF, DKIM and DMARC all passing — and landed in spam anyway.
   * Authentication is not reputation. A filter with no history for a domain
   * falls back to what the message looks like, and a single-part HTML mail
   * carrying a button and a bare pasted URL looks like phishing.
   */
  body: string
}

/** What a send is worth remembering by. */
export interface Sent {
  /** The provider's own message id — [[REQ-198]]'s join key for delivery events. */
  providerId: string
}

/** The port. Every caller uses this; nobody reaches a mail provider directly. */
export type SendEmail = (message: Message) => Promise<Sent>

/**
 * The configuration this file reads, as the env it is read from.
 *
 * `RouterEnv` EXTENDS THIS rather than restating the two keys, so there is one
 * declaration of what a mail-capable env carries and no second copy free to drift
 * by a character.
 */
export interface MailEnv {
  /**
   * The Resend credential, as a `wrangler secret` (pushed by
   * `bin/deploy.d/secrets/20-resend-api-key`).
   *
   * A SECRET AND NOT A VAR, for the reason `ANTHROPIC_API_KEY` is: a var is
   * readable in the dashboard and echoed by `wrangler deploy`, and this is a
   * bearer credential that can send mail as our domain.
   *
   * OPTIONAL, AND ABSENT IS WHAT SELECTS THE LOCAL ADAPTER. That is the whole of
   * why {@link mailerFor} needs no mode flag: there is no "test mode" to be
   * switched on or forgotten, only a credential that a development machine and a
   * test runner do not have.
   */
  RESEND_API_KEY?: string
  /**
   * The From address to fall back to — `1st Contact <no-reply@1stcontact.io>`,
   * declared in `wrangler.toml` on both sides.
   *
   * CONFIGURATION AND NOT A LITERAL AT A CALL SITE. A sending address is a fact
   * about the deployment, and the day it changes it must change in one place
   * rather than in however many templates were written by then.
   *
   * A FALLBACK AND NO LONGER THE ONLY ADDRESS ([[REQ-205]]). A message template
   * may name its own, and the invite does; this is what a template naming none
   * means, which is what every template written before that field existed
   * already meant. It was deployment-wide, so there was exactly one address for
   * the invite, the sign-in link and the lapse notice alike — and setting it to
   * a repliable `invite@` would have sent sign-in links from `invite@` too.
   *
   * IT CARRIES A DISPLAY NAME, in RFC 5322 `Name <address>` form, which the
   * provider takes as-is: an anonymous From is most of what makes a message from
   * a domain with no reputation look like phishing to a filter. {@link mailFrom}
   * trims and checks non-empty and passes the string through, so nothing between
   * here and the provider is entitled to take it apart.
   */
  MAIL_FROM?: string
}

/** Nothing was sent, because the deployment does not say who it would be from. */
export class MailNotConfiguredError extends Error {}

/** Refused before any network call: the message could not be delivered as given. */
export class InvalidMessageError extends Error {}

/**
 * The provider refused, or answered something we cannot use.
 *
 * IT IS THROWN, NOT RETURNED AS A STATUS. [[REQ-196]]'s acceptance is that a send
 * failure is reported to the caller rather than swallowed, and the failure this
 * guards against is the one where an operator presses "invite", sees a success,
 * and nobody is ever told the message bounced off the provider's front door.
 */
export class MailSendError extends Error {
  /** The provider's HTTP status, when there was one. */
  readonly status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.status = status
  }
}

/** Resend's send endpoint. Named once, here, so nothing else can name it. */
export const RESEND_ENDPOINT = 'https://api.resend.com/emails'

/** How much of a provider's refusal is worth carrying into an error message. */
const DETAIL_LIMIT = 300

/**
 * Every tag whose boundary is a LINE BREAK in text — the block-level set, plus
 * `br`.
 *
 * A LIST AND NOT A HEURISTIC. "Anything that is not inline" is a judgement this
 * file would have to keep making as HTML grows; a list is a thing that is either
 * right or visibly wrong, and the cost of an unlisted tag is one missing line
 * break rather than a paragraph that disappears.
 */
const BLOCK_TAG =
  /<\/?(?:address|article|aside|blockquote|br|div|dd|dl|dt|footer|h[1-6]|header|hr|li|main|nav|ol|p|pre|section|table|tbody|td|th|thead|tr|ul)\b[^>]*>/gi

/** Content that is markup ABOUT the message rather than the message. */
const NOT_CONTENT = /<(script|style|head|title)\b[^>]*>[\s\S]*?<\/\1>/gi

/** One anchor, kept whole so its address and its words can be read together. */
const ANCHOR = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi

/** The href off an anchor's attributes, quoted either way or bare. */
const HREF = /\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/i

/** Anything else that opens with `<` and closes with `>`. */
const ANY_TAG = /<[^>]*>/g

/** The break marker and the placeholder frame — both outside any body's alphabet. */
const BREAK = '\u0001'
const HOLD = '\u0002'

/**
 * The named entities a message body actually contains, and no more.
 *
 * A TABLE AND NOT A PARSER. The full HTML entity set is two thousand names, and
 * carrying it here would be carrying a dependency's worth of data to decode the
 * handful of things a template writes. Numeric references are handled generally,
 * so any character is still reachable — and an entity this table does not know
 * is left exactly as it was written rather than silently deleted.
 */
const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  mdash: '—',
  ndash: '–',
  hellip: '…',
  lsquo: '‘',
  rsquo: '’',
  ldquo: '“',
  rdquo: '”',
}

/** `&amp;` and `&#8212;` as the characters they stand for. */
function decodeEntities(text: string): string {
  return text.replace(
    /&(#[Xx][0-9A-Fa-f]+|#[0-9]+|[A-Za-z][A-Za-z0-9]*);/g,
    (whole, ref: string) => {
      if (ref.startsWith('#')) {
        const hex = ref[1] === 'x' || ref[1] === 'X'
        const code = Number.parseInt(hex ? ref.slice(2) : ref.slice(1), hex ? 16 : 10)
        if (!Number.isFinite(code) || code <= 0 || code > 0x10ffff) return whole
        try {
          return String.fromCodePoint(code)
        } catch {
          return whole
        }
      }
      return ENTITIES[ref.toLowerCase()] ?? whole
    },
  )
}

/** The words inside an anchor, with any markup of their own removed. */
function anchorText(inner: string): string {
  return decodeEntities(inner.replace(ANY_TAG, ' ')).replace(/\s+/g, ' ').trim()
}

/**
 * The plain-text alternative — DERIVED FROM THE HTML AND NEVER AUTHORED
 * ([[REQ-205]]).
 *
 * THE INVARIANT, AND THE ONE TO FALSIFY AGAINST: **every URL that appears in an
 * `href` in the HTML appears in the text**. A text alternative that has quietly
 * lost the only route in is worse than none — the recipient whose client prefers
 * text gets a message with no way to act on it, and nothing on our side looks
 * wrong. So an anchor renders as its words followed by its address —
 * `Accept your invitation <https://…>` — rather than as its words alone: the
 * words say what the link is for, and the address is the part that can be
 * pasted.
 *
 * AN ANCHOR WHOSE WORDS ARE ALREADY ITS ADDRESS RENDERS ONCE. Every template
 * here carries the call to action as a button AND the same URL again as
 * pasteable text, which is right in HTML and reads as a stutter in plain text.
 *
 * THE ORDER MATTERS AND IS NOT OBVIOUS. Anchors are lifted out to placeholders
 * BEFORE any tag is stripped, because the `<https://…>` they render to is
 * indistinguishable from a tag to anything that strips tags — a version of this
 * that substituted anchors in place deleted every link it had just written.
 *
 * WHITESPACE IN THE SOURCE IS NOT WHITESPACE IN THE MESSAGE. A template body is
 * wrapped across lines for whoever edits it and those newlines mean nothing in
 * HTML; the breaks that DO mean something are the block boundaries. So the two
 * are separated — blocks become a marker, every other run of space collapses —
 * and the result reads as the page reads rather than as the file looks.
 */
export function textFrom(html: string): string {
  const links: string[] = []
  const held = (html ?? '')
    .replace(NOT_CONTENT, ' ')
    .replace(ANCHOR, (_whole, attrs: string, inner: string) => {
      const match = HREF.exec(attrs ?? '')
      const href = decodeEntities((match?.[1] ?? match?.[2] ?? match?.[3] ?? '').trim())
      const words = anchorText(inner ?? '')
      if (href === '') return words
      links.push(words === '' || words === href ? href : `${words} <${href}>`)
      return `${HOLD}${links.length - 1}${HOLD}`
    })

  const flowed = decodeEntities(held.replace(BLOCK_TAG, BREAK).replace(ANY_TAG, ' '))
    .replace(/\s+/g, ' ')
    .replace(
      new RegExp(`${HOLD}(\\d+)${HOLD}`, 'g'),
      (_whole, index: string) => links[Number(index)] ?? '',
    )

  return flowed
    .split(BREAK)
    .map((line) => line.trim())
    .filter((line) => line !== '')
    .join('\n\n')
    .trim()
}

/**
 * The configured From address, or a refusal.
 *
 * IT THROWS RATHER THAN DEFAULTING. A default would be a second, undeclared
 * sending address that appears exactly when the configured one goes missing —
 * and mail from an address nobody registered is mail that is binned, which is
 * indistinguishable from mail that was never sent.
 */
export function mailFrom(env: MailEnv): string {
  const from = (env.MAIL_FROM ?? '').trim()
  if (from === '') {
    throw new MailNotConfiguredError(
      'MAIL_FROM is not configured for this deployment, so there is no address to ' +
        'send from. See apps/control-app/wrangler.toml.',
    )
  }
  return from
}

/**
 * The checks BOTH adapters make, before either does anything.
 *
 * SHARED ON PURPOSE. If the local adapter accepted what the provider rejects,
 * the test suite would prove nothing about whether a message is sendable — every
 * fixture would pass and the first real send would be the first check. So the
 * two adapters agree on what a message is by construction, and the only thing
 * that differs between them is whether it leaves the building.
 */
function check(message: Message): string {
  const missing = (['to', 'from', 'subject'] as const).filter(
    (field) => (message[field] ?? '').trim() === '',
  )
  if (missing.length > 0) {
    throw new InvalidMessageError(`A message needs ${missing.join(', ')}.`)
  }
  if ((message.body ?? '') === '') {
    throw new InvalidMessageError('A message needs a body.')
  }
  // AND IT RETURNS THE TEXT PART, which is why this is a function with a value
  // rather than an assertion ([[REQ-205]]). The derivation is a check — a body
  // it could not understand yields nothing — and the thing it produces is what
  // gets sent, so deriving it twice would be two answers to one question.
  const text = textFrom(message.body)
  if (text === '') {
    throw new InvalidMessageError(
      'No plain-text alternative could be derived from this body, so the message ' +
        'would go out either as HTML alone or with an empty text part. Both are the ' +
        'failure the text part exists to prevent.',
    )
  }
  return text
}

/**
 * The Resend adapter — the one thing in this repository that sends mail.
 *
 * `fetchImpl` IS AN ARGUMENT so a UAT can prove the request this builds — the
 * URL, the bearer header, the JSON shape, the id it reads back — against a double
 * rather than against Resend. A test that reached the real endpoint would either
 * fail without a credential or, far worse, succeed with one.
 */
export function resendMailer(apiKey: string, fetchImpl: typeof fetch = fetch): SendEmail {
  return async (message) => {
    const text = check(message)

    let response: Response
    try {
      response = await fetchImpl(RESEND_ENDPOINT, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${apiKey}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          from: message.from,
          // An array because the API takes one, even for a single recipient.
          to: [message.to],
          subject: message.subject,
          // BOTH PARTS, AND ONLY ONE OF THEM WAS WRITTEN ([[REQ-205]]). `html`
          // is the body as authored — the templates put their call to action in
          // an anchor, and text alone would deliver the markup for somebody to
          // read. `text` is derived from it by {@link textFrom}, carrying every
          // href through, so a client that prefers text still has the link.
          html: message.body,
          text,
        }),
      })
    } catch (err) {
      const why = err instanceof Error ? err.message : String(err)
      throw new MailSendError(`The mail provider could not be reached: ${why}`)
    }

    if (!response.ok) {
      // The provider's own words, truncated: a refusal is usually one useful
      // sentence and occasionally a page of HTML, and an error message that is a
      // page of HTML is one nobody reads.
      const detail = (await response.text().catch(() => '')).slice(0, DETAIL_LIMIT)
      throw new MailSendError(
        `The mail provider refused the message (${response.status}). ${detail}`.trim(),
        response.status,
      )
    }

    const payload = (await response.json().catch(() => null)) as { id?: unknown } | null
    const providerId = typeof payload?.id === 'string' ? payload.id : ''
    if (providerId === '') {
      // Accepted-with-no-id is a success we cannot record, and [[REQ-198]] joins
      // bounces on this value — so it is a failure here rather than a hole that
      // only shows up the first time a message bounces.
      throw new MailSendError(
        'The mail provider accepted the message and returned no message id, so ' +
          'nothing can join a later delivery or bounce event back to it.',
        response.status,
      )
    }
    return { providerId }
  }
}

/** A local mailer, and the messages it did not send. */
export interface CapturingMailer {
  send: SendEmail
  /** Every message this mailer was given, in order. */
  readonly sent: Message[]
}

/**
 * The local adapter: it records, and it delivers nothing.
 *
 * THIS IS NOT A CONVENIENCE. A suite that can reach a real provider is a suite
 * that can mail a real person from a fixture, and the first time it happens it
 * will be to somebody on the beta list. So the thing the tests run is the thing
 * that has no way to send: it holds no credential, calls no `fetch`, and imports
 * nothing that could.
 *
 * IT STILL RETURNS A `providerId`, prefixed `local_`. The record path
 * ([[REQ-198]]) then has the same shape in a test as in production — and the
 * prefix is what lets a UAT assert WHICH adapter answered, which is the only
 * observable difference between the two once neither has thrown.
 *
 * `log` IS FOR `wrangler dev`. A development builder that silently swallowed
 * every message would reproduce, locally, the exact failure this ticket exists to
 * remove; a line on the console is how the operator sees that mail happened and
 * where it went.
 */
export function capturingMailer(log?: (line: string) => void): CapturingMailer {
  const sent: Message[] = []
  return {
    sent,
    send: async (message) => {
      // THE SAME CHECK, WHICH NOW DERIVES THE TEXT PART TOO ([[REQ-205]]). The
      // derived text is discarded here because nothing is delivered — what
      // matters is that a body the derivation cannot read is refused HERE as
      // well, so the suite cannot pass a message the provider would refuse.
      check(message)
      sent.push(message)
      const providerId = `local_${crypto.randomUUID().replace(/-/g, '')}`
      log?.(`[mail] not sent (no provider configured): to=${message.to} subject=${message.subject}`)
      return { providerId }
    },
  }
}

/**
 * The mailer this deployment has, chosen by whether it holds a credential.
 *
 * THE CREDENTIAL IS THE SWITCH, and nothing else is. There is no mode var, no
 * `NODE_ENV`, no "is this a test" predicate — those are all things that can be
 * set wrongly, and the failure mode of setting one wrongly is mail sent from a
 * fixture. A development machine and a test runner do not hold a Resend key, so
 * they get the adapter that cannot send; a deployment does, and gets the one that
 * can. The falsifier [[REQ-196]] names — *a code path where running the tests can
 * send mail* — is closed by there being no path to {@link resendMailer} that does
 * not go through a real credential.
 */
export function mailerFor(env: MailEnv, deps: { fetch?: typeof fetch } = {}): SendEmail {
  const apiKey = (env.RESEND_API_KEY ?? '').trim()
  if (apiKey === '') return capturingMailer((line) => console.log(line)).send
  return resendMailer(apiKey, deps.fetch)
}
