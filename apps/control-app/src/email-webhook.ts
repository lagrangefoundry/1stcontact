/**
 * The delivery webhook — bounces and deliveries landing on the record
 * ([[REQ-198]], [[CHAT-39]]).
 *
 * THIS IS MOST OF THE VALUE OF KEEPING THE RECORD. In a beta the single most
 * useful signal available is *which addresses are wrong*, and without this the
 * operator's first evidence is somebody never showing up — which arrives days
 * late and does not say why.
 *
 * IT IS AN UNAUTHENTICATED PUBLIC ENDPOINT, BY NECESSITY. A provider cannot
 * present a Cloudflare Access token, so a webhook behind the gate is a webhook
 * that never fires. It is therefore mounted AHEAD of the gate in `index.ts`,
 * which makes the signature the only thing standing between the internet and a
 * function whose whole job is mutating records on instruction.
 *
 * SO THE ORDER HERE IS THE SECURITY PROPERTY, exactly as it is in `index.ts`:
 * the secret must be configured, the headers must be present, the timestamp must
 * be recent, and the signature must verify over the exact bytes received —
 * before the body is parsed, before anything is looked up, and before any store
 * handle exists. A verification that ran after a lookup would already have told
 * an unauthenticated caller whether a message id exists.
 *
 * THE BYTES ARE VERIFIED, NOT THE PARSE. The signature covers the raw payload,
 * so the text is read once and both verified and parsed from that one copy.
 * Re-serialising a parsed object and verifying THAT would verify a different
 * string, and would do it in a way that passes in testing and fails on the first
 * message whose JSON key order differs.
 *
 * THE SCHEME IS THE STANDARD ONE RESEND USES (Svix): an id, a unix timestamp and
 * a space-separated list of versioned signatures, over `id.timestamp.payload`,
 * keyed by the base64 half of a `whsec_…` secret. Implemented here on WebCrypto
 * rather than taken as a dependency — it is forty lines of HMAC, and the cost of
 * a dependency is not its installation but its maintenance.
 */

import {
  applyDeliveryEvent,
  BOUNCED,
  COMPLAINED,
  DELIVERED,
  type DeliveryOutcome,
} from './messages'
import { ticketStoreBase, type TicketStoreEnv } from './tickets'

/** Where the webhook lives. One constant; the router and the suites read it here. */
export const EMAIL_WEBHOOK_PATH = '/api/email/webhook'

/**
 * How far out of date a signed request may be, in seconds.
 *
 * A SIGNATURE ALONE IS NOT ENOUGH. Without a bound on the timestamp, a request
 * captured once is valid forever and can be replayed to re-mark a repaired
 * address as bounced. Five minutes is the provider's own tolerance and is
 * generous for a retry; it is not a clock-skew allowance for us to widen at the
 * first flaky test.
 */
export const WEBHOOK_TOLERANCE_SECONDS = 300

export interface EmailWebhookEnv extends TicketStoreEnv {
  /**
   * The endpoint's signing secret, in the provider's `whsec_<base64>` spelling.
   *
   * A SECRET AND NEVER A VAR. It is what proves a request came from the
   * provider, so committing it into `wrangler.toml` would publish the ability to
   * mark any customer's address bounced. Absent, the endpoint refuses everything
   * — see {@link handleEmailWebhook}.
   */
  EMAIL_WEBHOOK_SECRET?: string
}

/** Why a request was refused. Logged; never returned to the caller — see below. */
export type WebhookRefusal =
  | 'not_configured'
  | 'missing_headers'
  | 'stale_timestamp'
  | 'bad_signature'
  | 'malformed_body'

/** The provider's headers, under either of the two prefixes it sends them with. */
function header(request: Request, name: string): string {
  return (
    request.headers.get(`webhook-${name}`) ?? request.headers.get(`svix-${name}`) ?? ''
  ).trim()
}

/** Base64 → bytes, without pulling in a codec for six lines. */
function fromBase64(text: string): Uint8Array {
  const binary = atob(text)
  const out = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) out[i] = binary.charCodeAt(i)
  return out
}

function toBase64(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

/**
 * Compare in time independent of where the two differ.
 *
 * A `===` ON A SIGNATURE IS A TIMING ORACLE. String equality returns at the
 * first differing byte, which leaks how much of a guess was right and lets an
 * attacker find a valid signature one byte at a time. The cost of not caring is
 * a loop over two strings, so there is no reason to take it.
 */
function equalInConstantTime(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

/**
 * The signature over `id.timestamp.payload`, as the provider computes it.
 *
 * Exported because the suite has to be able to sign a request the way the
 * provider does — a test that signed some OTHER way would prove that this file
 * agrees with the test rather than that it agrees with the provider.
 */
export async function signWebhook(
  secret: string,
  id: string,
  timestamp: string,
  payload: string,
): Promise<string> {
  const raw = secret.startsWith('whsec_') ? secret.slice('whsec_'.length) : secret
  const key = await crypto.subtle.importKey(
    'raw',
    fromBase64(raw) as unknown as ArrayBuffer,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signed = new TextEncoder().encode(`${id}.${timestamp}.${payload}`)
  const mac = await crypto.subtle.sign('HMAC', key, signed as unknown as ArrayBuffer)
  return toBase64(new Uint8Array(mac))
}

/**
 * Verify the request's signature over the exact bytes received.
 *
 * THE HEADER CARRIES A LIST, and any one match is enough. That is how a secret is
 * rotated without dropping messages: the provider signs with both for a window,
 * and an implementation that read only the first would drop half of them.
 */
export async function verifyWebhook(
  secret: string,
  request: Request,
  payload: string,
  nowSeconds: number,
): Promise<WebhookRefusal | null> {
  const id = header(request, 'id')
  const timestamp = header(request, 'timestamp')
  const signature = header(request, 'signature')
  if (id === '' || timestamp === '' || signature === '') return 'missing_headers'

  const sentAt = Number(timestamp)
  if (!Number.isFinite(sentAt)) return 'stale_timestamp'
  if (Math.abs(nowSeconds - sentAt) > WEBHOOK_TOLERANCE_SECONDS) return 'stale_timestamp'

  const expected = await signWebhook(secret, id, timestamp, payload)
  for (const candidate of signature.split(/\s+/)) {
    // `v1,<base64>` — the version prefix is part of the header's grammar and is
    // not part of what was signed.
    const value = candidate.includes(',') ? candidate.slice(candidate.indexOf(',') + 1) : candidate
    if (equalInConstantTime(value, expected)) return null
  }
  return 'bad_signature'
}

/**
 * The event types this handles, and everything else ignored.
 *
 * OPENS AND CLICKS ARE DELIBERATELY NOT HANDLED ([[REQ-198]]). They are a privacy
 * cost with no beta value, so an event carrying one is acknowledged and dropped
 * rather than recorded. `email.sent` is likewise ignored: the send path already
 * wrote `sent` from the call that returned the id, and re-deriving it from a
 * webhook would let a slow event overwrite a `bounced` that arrived first.
 *
 * COMPLAINTS ARE HANDLED BECAUSE SOMETHING NOW DEPENDS ON THEM ([[REQ-223]] §5).
 * A public endpoint that mails an address it has never seen must never mail an
 * address that reported the last message as spam, and the only way to know is for
 * the provider's complaint event to reach the record — so it is recorded as its
 * own status rather than folded into `bounced`, which is a different fact.
 */
function eventStatus(type: string): typeof DELIVERED | typeof BOUNCED | typeof COMPLAINED | null {
  if (type === 'email.delivered') return DELIVERED
  if (type === 'email.bounced') return BOUNCED
  if (type === 'email.complained') return COMPLAINED
  return null
}

/** What a request did, so the caller can log it and the suite can assert it. */
export interface WebhookResult {
  response: Response
  refusal: WebhookRefusal | null
  outcome: DeliveryOutcome | null
  ignored: boolean
}

function plain(status: number, text: string): Response {
  return new Response(text, {
    status,
    headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' },
  })
}

/**
 * Handle one provider event.
 *
 * EVERY REFUSAL SAYS THE SAME THING ON THE WIRE, for the reason `index.ts` gives
 * about admission: the caller may be anybody, and telling them which of "no
 * secret configured", "signature does not verify" and "timestamp too old" they
 * hit is a map of how to try next. The distinction goes to the invocation log,
 * where the operator is.
 *
 * AN UNMATCHED EVENT IS A 404 AND WRITES NOTHING. Providers retry, and they also
 * deliver events for messages something else sent; inventing a record for one
 * would put a message in a contact's history that we never sent. A 200 would be
 * kinder to the provider's retry queue and would hide the one misconfiguration
 * worth finding — two deployments pointed at one endpoint — so the honest answer
 * is that we do not know this message.
 */
export async function handleEmailWebhook(
  request: Request,
  env: EmailWebhookEnv,
  now: () => number = () => Date.now(),
): Promise<WebhookResult> {
  const refuse = (refusal: WebhookRefusal, status = 401): WebhookResult => {
    console.warn(JSON.stringify({ event: 'email_webhook_refused', reason: refusal }))
    return { response: plain(status, 'Refused.'), refusal, outcome: null, ignored: false }
  }

  const secret = (env.EMAIL_WEBHOOK_SECRET ?? '').trim()
  // FAILS CLOSED. An unconfigured secret must refuse rather than skip the check:
  // a deployment that forgot the secret would otherwise be an open mutation
  // endpoint, and would look exactly like a working one.
  if (secret === '') return refuse('not_configured')

  const payload = await request.text()
  const refusal = await verifyWebhook(secret, request, payload, Math.floor(now() / 1000))
  if (refusal) return refuse(refusal)

  let parsed: { type?: unknown; data?: Record<string, unknown> }
  try {
    parsed = JSON.parse(payload) as typeof parsed
  } catch {
    return refuse('malformed_body', 400)
  }

  const status = eventStatus(typeof parsed.type === 'string' ? parsed.type : '')
  if (!status) {
    return { response: plain(200, 'Ignored.'), refusal: null, outcome: null, ignored: true }
  }

  const data = (parsed.data ?? {}) as Record<string, unknown>
  const providerId = typeof data.email_id === 'string' ? data.email_id : ''
  if (providerId === '') return refuse('malformed_body', 400)

  const bounce = (data.bounce ?? {}) as Record<string, unknown>
  const reason = typeof bounce.message === 'string' ? bounce.message : undefined

  const outcome = await applyDeliveryEvent(ticketStoreBase(env), {
    providerId,
    status,
    ...(reason ? { reason } : {}),
  })
  if (!outcome.matched) {
    console.warn(JSON.stringify({ event: 'email_webhook_unmatched', providerId }))
    return { response: plain(404, 'No such message.'), refusal: null, outcome, ignored: false }
  }
  console.info(
    JSON.stringify({
      event: 'email_webhook_applied',
      providerId,
      status,
      business: outcome.businessId,
    }),
  )
  return { response: plain(200, 'Recorded.'), refusal: null, outcome, ignored: false }
}
