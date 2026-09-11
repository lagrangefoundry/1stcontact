import {
  FORM_INSTANCE_FIELD,
  HONEYPOT_FIELD,
  RESERVED_FIELDS,
  TURNSTILE_FIELD,
} from '../../../packages/framework/src/modules/contact-form/fields'
import { TURNSTILE_VERIFY_URL } from '../../../packages/framework/src/modules/contact-form/turnstile'

/**
 * `POST /api/lead` — the one thing this Worker receives ([[REQ-223]]).
 *
 * THIS FILE IS THE AMENDMENT TO "PUBLIC-SITE RECEIVES NOTHING". Every public
 * form in the product was broken and none of them by a bug: the endpoint they
 * post to had never existed. `index.ts` answered every non-GET with `405` by
 * construction, and `control-app` — the only Worker that could write a contact —
 * gates every request through Cloudflare Access, which answers a cross-origin
 * form's CORS preflight `403` before any Worker runs ([[BUG-78]]).
 *
 * SO THE ENDPOINT IS HERE, ON THE PAGE'S OWN ORIGIN, and the four reasons are
 * worth keeping together:
 *
 *   1. **No CORS.** Same-origin, so no preflight, so nothing for Access to
 *      answer `403` to.
 *   2. **The site key is not caller-controlled.** It arrives as part of the path
 *      the server resolves through the grammar every published byte goes
 *      through, so a spammer cannot retarget another tenant's contact list by
 *      editing a form's `action`.
 *   3. **Relative URLs are environment-portable.** `/api/lead` is correct in
 *      local dev, in preview and in production; the absolute
 *      `https://app.1stcontact.io/…` one site was using is broken locally for
 *      exactly that reason.
 *   4. **No Access bypass policy is required.** The write is handed to
 *      `control-app` over a SERVICE BINDING, and a service-binding call never
 *      traverses the edge. That matters because the bypass policies are
 *      currently missing — `GET /sign-in` and `GET /api/email/webhook` both
 *      answer `302` to the Access login origin in production today — and lead
 *      capture must not inherit that dependency.
 *
 * EVERY CONTROL HERE HOLDS FOR A CALLER THAT IS NOT A BROWSER. CORS constrains
 * browsers and nothing else; `curl` ignores it. So nothing below is a browser
 * rule, and the UATs are written from the assumption that the caller is hostile
 * and scripted.
 *
 * THE ORDER OF THE CONTROLS IS DELIBERATE, cheapest and most certain first:
 * shape, then size, then rate, then honeypot, then Turnstile. Each one that
 * fires spares the next; in particular the honeypot fires before the one control
 * that costs an outbound request, so an unsophisticated bot never spends our
 * siteverify budget.
 */

/** The store-relative path the route grammar yields for this endpoint. */
export const LEAD_PATH = 'api/lead'

/**
 * The largest body this endpoint will read, in bytes.
 *
 * REFUSED BEFORE IT IS READ where the caller declared a length, and again after
 * — a `content-length` is a claim and a chunked body carries none. Eight
 * kilobytes is comfortably more than the longest honest submission a form with
 * eight fields can produce and far less than anything worth streaming.
 */
export const MAX_BODY_BYTES = 8 * 1024

/** The most named values a submission may carry. `contact-form` allows eight fields. */
export const MAX_FIELDS = 24

/** The longest a single value may be. A `textarea` is the only field that comes near. */
export const MAX_FIELD_BYTES = 4000

/** The seam to `control-app`, as narrowly as this Worker types it. */
export interface LeadIntakeBinding {
  captureLead(spec: {
    siteKey: string
    instanceId: string
    fields: Record<string, string>
    submittedAt?: string
  }): Promise<unknown>
}

/** The configuration this endpoint reads, as the env it is read from. */
export interface LeadEnv {
  /**
   * The RPC entrypoint on `control-app` that owns the write ([[REQ-223]] §3.2).
   *
   * ABSENT IS A REFUSAL AND NEVER AN ACCEPTANCE. A deployment with no binding
   * cannot record anything, and answering the visitor "thank you" while dropping
   * their address on the floor is the worst of the available outcomes — it is
   * the failure [[DOC-47]] warns about, arriving silently.
   */
  LEAD_INTAKE?: LeadIntakeBinding
  /**
   * The Turnstile secret, as a `wrangler secret`.
   *
   * ABSENT MEANS REFUSE, on `access.ts`'s reasoning: a deployment that forgot the
   * secret is refused, not opened. Verification that only runs when a token
   * happens to be present is not verification, and a control that switches OFF
   * when its configuration goes missing is the opposite of a control.
   */
  TURNSTILE_SECRET?: string
  /**
   * The public half of the same widget, stamped onto served pages.
   *
   * A VAR AND NOT A SECRET — it is printed in the markup of every page carrying
   * a form. It is read in `index.ts` rather than here; it is declared on this
   * interface so that the two halves of one piece of configuration are described
   * in one place.
   */
  TURNSTILE_SITEKEY?: string
  /**
   * Cloudflare's own rate limiter, keyed on what the caller cannot vary.
   *
   * ABSENT MEANS REFUSE, for the reason the secret does. The binding is declared
   * in `wrangler.toml` in both environments, so its absence is a misconfigured
   * deployment rather than a deployment that has chosen not to limit — and the
   * failure of guessing the second is an unmetered write endpoint.
   */
  LEAD_RATE_LIMIT?: RateLimit
}

/**
 * How a submission arrived, which decides how it is answered.
 *
 * TWO SHAPES BECAUSE THE FORM HAS TWO SUBMIT PATHS, not because the endpoint is
 * lenient. `contact-form` renders a real `<form method="post">` and `client.js`
 * only upgrades it; a browser whose enhancement did not run posts the native
 * form encoding and expects a page back, and answering it with JSON would show
 * the visitor a screenful of braces.
 */
type Shape = 'json' | 'form'

/** The one acknowledgement a JSON submission ever receives. */
const ACK_JSON = '{"ok":true}'

/**
 * The one acknowledgement a native form submission ever receives.
 *
 * GENERIC AND NOT THE FORM'S OWN `successMessage`, deliberately. The
 * acknowledgement must be frozen across every outcome ([[REQ-223]] §2), and copy
 * looked up per submission is copy that can fail to be found — which would make
 * the one response that must never vary vary by exactly the thing being probed.
 * A visitor whose JavaScript ran never sees this page at all: the client swaps in
 * the form's own success copy without navigating.
 */
const ACK_HTML = [
  '<!doctype html>',
  '<html lang="en"><head><meta charset="utf-8">',
  '<meta name="viewport" content="width=device-width, initial-scale=1">',
  '<meta name="robots" content="noindex">',
  '<title>Thank you</title></head>',
  '<body><h1>Thank you</h1>',
  '<p>Your message has been received.</p>',
  '</body></html>',
].join('')

/**
 * THE ACKNOWLEDGEMENT IS THE SAME FOR EVERY OUTCOME ([[REQ-223]] §2).
 *
 * A new address, an address already a contact, a rate-limited submission, a
 * filled honeypot and an address that has already had the asset are
 * indistinguishable to the caller — byte for byte, header for header. That is
 * what stops this endpoint being used to test whether an address is already a
 * contact, and it is the property `account-chrome`'s client already honours by
 * never reading a response body.
 *
 * `no-store` BECAUSE A `POST` RESPONSE IS NOBODY ELSE'S. It says nothing about
 * anybody, and it is still not a thing to leave in a cache.
 */
export function acknowledge(shape: Shape): Response {
  return shape === 'json'
    ? new Response(ACK_JSON, {
        status: 200,
        headers: {
          'content-type': 'application/json; charset=utf-8',
          'cache-control': 'no-store',
        },
      })
    : new Response(ACK_HTML, {
        status: 200,
        headers: {
          'content-type': 'text/html; charset=utf-8',
          'cache-control': 'no-store',
          'x-robots-tag': 'noindex',
        },
      })
}

/**
 * A refusal, which is deliberately NOT the acknowledgement.
 *
 * THE TWO SETS ARE DIFFERENT AND THE DIFFERENCE IS THE POINT. What must be
 * indistinguishable is every outcome that depends on WHO submitted — whether the
 * address is known, whether the asset has gone before, whether this caller has
 * submitted too often. What is refused instead is every submission that is
 * malformed or unverified, and a caller learning that their oversized body was
 * oversized learns nothing about anybody.
 */
function refuse(shape: Shape, status: number, error: string): Response {
  return shape === 'json'
    ? new Response(JSON.stringify({ error }), {
        status,
        headers: {
          'content-type': 'application/json; charset=utf-8',
          'cache-control': 'no-store',
        },
      })
    : new Response(`<!doctype html><meta charset="utf-8"><title>Sorry</title><p>${error}</p>`, {
        status,
        headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' },
      })
}

/** Which shape this request is, or `null` when it is neither. */
function shapeOf(request: Request): Shape | null {
  const type = (request.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase()
  if (type === 'application/json') return 'json'
  if (type === 'application/x-www-form-urlencoded' || type === 'multipart/form-data') return 'form'
  return null
}

/**
 * The submitted values, flattened to strings.
 *
 * FLAT AND STRING-VALUED, WHATEVER ARRIVED. A form posts strings; JSON can post
 * anything, and a nested object or an array reaching a record or a mail body
 * would be a shape nothing downstream declared. A value that is not a string is
 * dropped rather than coerced — `[object Object]` in a contact's provenance is
 * worse than a missing field, because it looks like something the visitor typed.
 */
function flatten(source: Iterable<[string, unknown]>): Record<string, string> {
  const fields: Record<string, string> = {}
  for (const [name, value] of source) {
    if (typeof value === 'string') fields[name] = value
    else if (typeof value === 'number' || typeof value === 'boolean') fields[name] = String(value)
  }
  return fields
}

/** Read and parse the body, refusing anything outside the declared limits. */
async function readFields(
  request: Request,
  shape: Shape,
): Promise<{ fields: Record<string, string> } | { error: string; status: number }> {
  // THE DECLARED LENGTH IS CHECKED FIRST, so the common oversized case is
  // refused without the bytes ever being read. It is a CLAIM and not a
  // guarantee, which is why the read below is bounded as well.
  const declared = Number(request.headers.get('content-length') ?? '')
  if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) {
    return { error: 'That submission is too large.', status: 413 }
  }

  // READ AS BYTES AND DECODED HERE, not `request.text()`. The size limit is a
  // limit on BYTES, and re-encoding a decoded string to measure it is a second
  // answer to how big the body was — one that disagrees with the first for any
  // input that is not valid UTF-8. (It also spares the runtime's warning about
  // calling `.text()` on a form encoding, which is a real signal worth not
  // drowning.)
  let raw: ArrayBuffer
  try {
    raw = await request.arrayBuffer()
  } catch {
    return { error: 'That submission could not be read.', status: 400 }
  }
  if (raw.byteLength > MAX_BODY_BYTES) {
    return { error: 'That submission is too large.', status: 413 }
  }
  const body = new TextDecoder().decode(raw)

  let fields: Record<string, string>
  if (shape === 'json') {
    let parsed: unknown
    try {
      parsed = JSON.parse(body)
    } catch {
      return { error: 'That submission could not be read.', status: 400 }
    }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { error: 'That submission could not be read.', status: 400 }
    }
    fields = flatten(Object.entries(parsed as Record<string, unknown>))
  } else {
    fields = flatten(new URLSearchParams(body).entries())
  }

  const names = Object.keys(fields)
  if (names.length > MAX_FIELDS) {
    return { error: 'That submission has too many fields.', status: 400 }
  }
  for (const name of names) {
    if (new TextEncoder().encode(fields[name]).length > MAX_FIELD_BYTES) {
      return { error: 'One of those answers is too long.', status: 400 }
    }
  }
  return { fields }
}

/**
 * Verify a Turnstile token with Cloudflare, server-side.
 *
 * `fetchImpl` IS AN ARGUMENT so a UAT can prove the request this builds — the
 * endpoint, the form encoding, the secret it carries — against a double rather
 * than against Cloudflare. A test that reached the real endpoint would either
 * fail without a secret or, far worse, pass with one.
 *
 * A NETWORK FAILURE IS A REFUSAL. "We could not check" and "it checked out" are
 * different facts, and treating the first as the second turns an outage at
 * Cloudflare into an open write endpoint.
 */
export async function verifyTurnstile(
  secret: string,
  token: string,
  remoteIp: string | null,
  fetchImpl: typeof fetch = fetch,
): Promise<boolean> {
  const form = new URLSearchParams({ secret, response: token })
  if (remoteIp) form.set('remoteip', remoteIp)
  try {
    const response = await fetchImpl(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
    })
    if (!response.ok) return false
    const payload = (await response.json()) as { success?: unknown }
    return payload?.success === true
  } catch {
    return false
  }
}

/**
 * Take one submission for the site the URL named.
 *
 * `siteKey` COMES FROM THE CALLER OF THIS FUNCTION AND NEVER FROM THE BODY — the
 * route grammar resolved it out of the path, so a body field claiming to name a
 * tenant is simply one more answer the visitor typed, and is stored as that.
 */
export async function handleLead(
  request: Request,
  context: {
    siteKey: string
    env: LeadEnv
    /** The verifier's transport, so a UAT need not reach Cloudflare. */
    fetchImpl?: typeof fetch
  },
): Promise<Response> {
  const shape = shapeOf(request)
  // NEITHER SHAPE MEANS NEITHER SUBMIT PATH PRODUCED THIS. A caller sending
  // something else is not a form, and answering a shape nothing renders would be
  // widening the endpoint for no visitor's benefit. `json` is chosen for the
  // refusal because a scripted caller is what this is.
  if (shape === null) {
    return refuse('json', 415, 'That submission was not a form.')
  }

  const read = await readFields(request, shape)
  if ('error' in read) return refuse(shape, read.status, read.error)
  const { fields } = read

  const { LEAD_INTAKE, TURNSTILE_SECRET, LEAD_RATE_LIMIT } = context.env
  if (!LEAD_INTAKE) {
    return refuse(shape, 503, 'This site cannot take messages at the moment.')
  }

  /*
   * KEYED ON WHAT THE CALLER CANNOT VARY: the site, which came from the path,
   * and the source IP, which came from the edge. Everything in the body is
   * caller-chosen and worthless as a key.
   *
   * THE TENSION IS RECORDED RATHER THAN RESOLVED. A per-site cap is itself a
   * denial of service against that customer — fill the bucket and their real
   * enquiries are refused — so the cap is a BACKSTOP set generously and Turnstile
   * is the sharp instrument. Zone-level WAF rules are complementary and are
   * configuration rather than code.
   *
   * EXCEEDING IT IS THE ACKNOWLEDGEMENT AND NOT A REFUSAL. Nothing is written and
   * nothing is sent; a caller who could tell the difference would have a probe
   * for how much they had already spent.
   */
  if (!LEAD_RATE_LIMIT) {
    return refuse(shape, 503, 'This site cannot take messages at the moment.')
  }
  const ip = request.headers.get('cf-connecting-ip')
  try {
    const { success } = await LEAD_RATE_LIMIT.limit({ key: `${context.siteKey}:${ip ?? 'unknown'}` })
    if (!success) return acknowledge(shape)
  } catch {
    return refuse(shape, 503, 'This site cannot take messages at the moment.')
  }

  // THE HONEYPOT WRITES NOTHING AND SENDS NOTHING, and says so with the same
  // acknowledgement everything else gets. It is free, it catches only
  // unsophisticated bots, and it catches them BEFORE the one control that costs
  // an outbound request.
  if ((fields[HONEYPOT_FIELD] ?? '').trim() !== '') return acknowledge(shape)

  if ((TURNSTILE_SECRET ?? '').trim() === '') {
    // FAIL CLOSED. A deployment that forgot the secret is refused, not opened —
    // and the refusal is loud, at the endpoint, rather than quiet, on the page.
    return refuse(shape, 503, 'This site cannot take messages at the moment.')
  }
  const token = (fields[TURNSTILE_FIELD] ?? '').trim()
  if (token === '') {
    return refuse(shape, 400, 'Please complete the verification and try again.')
  }
  const verified = await verifyTurnstile(
    (TURNSTILE_SECRET ?? '').trim(),
    token,
    ip,
    context.fetchImpl,
  )
  if (!verified) {
    return refuse(shape, 403, 'That verification could not be confirmed. Please try again.')
  }

  // THE RESERVED NAMES DO NOT REACH THE RECORD. They are the wire's business —
  // a trap, a token and a handle — and storing them would put three machine
  // artefacts in a contact's provenance beside the words a person typed.
  const submitted: Record<string, string> = {}
  for (const [name, value] of Object.entries(fields)) {
    if (!RESERVED_FIELDS.includes(name)) submitted[name] = value
  }

  try {
    await LEAD_INTAKE.captureLead({
      siteKey: context.siteKey,
      instanceId: (fields[FORM_INSTANCE_FIELD] ?? '').trim(),
      fields: submitted,
    })
  } catch (err) {
    // A THROW IS A SYSTEM FAILURE AND NOT AN OUTCOME. Every outcome a submission
    // can have comes back as data; an exception means the write did not happen
    // for a reason nobody modelled, and acknowledging it would drop the address
    // on the floor while telling the visitor it had landed.
    console.error(
      JSON.stringify({
        event: 'lead_capture_failed',
        site: context.siteKey,
        error: err instanceof Error ? err.message : String(err),
      }),
    )
    return refuse(shape, 503, 'This site cannot take messages at the moment.')
  }

  return acknowledge(shape)
}
