/**
 * The sender ([[REQ-196]]) — the one way anything in this repository puts a
 * message in front of a person who is not already looking at the builder.
 *
 * THERE WAS NO SENDER, and `invitePerson` said so in its own docstring for
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
   * PLAIN TEXT. The port shape [[REQ-196]] specifies is `body`, singular, and
   * this is it — the Resend adapter sends it as `text`.
   *
   * No HTML alternative, deliberately: a second field is a second thing every
   * template must decide about, and nothing sends a message yet. When [[REQ-197]]
   * writes one that wants markup, adding it is one field here and one line in the
   * adapter — which is a smaller change than the guesswork of carrying it now.
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
   * The From address — `no-reply@1stcontact.io`, declared in `wrangler.toml` on
   * both sides.
   *
   * CONFIGURATION AND NOT A LITERAL AT A CALL SITE. A sending address is a fact
   * about the deployment, and the day it changes it must change in one place
   * rather than in however many templates were written by then.
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
function check(message: Message): void {
  const missing = (['to', 'from', 'subject'] as const).filter(
    (field) => (message[field] ?? '').trim() === '',
  )
  if (missing.length > 0) {
    throw new InvalidMessageError(`A message needs ${missing.join(', ')}.`)
  }
  if ((message.body ?? '') === '') {
    throw new InvalidMessageError('A message needs a body.')
  }
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
    check(message)

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
          text: message.body,
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
