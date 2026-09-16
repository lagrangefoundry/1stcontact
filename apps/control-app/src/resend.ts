/**
 * **Resend's domain API** — registering a customer's domain for sending, and
 * asking whether it has verified yet ([[REQ-259]]).
 *
 * WHY THERE IS A CLIENT AT ALL, when `MAIL.md` §2 describes this as three
 * dashboard steps. Those steps are *"add the domain, paste the records it gives
 * back, press verify"*, and the middle one is the reason: **the DKIM public key
 * is minted by Resend per domain and cannot be known any other way**. A product
 * that asked a furniture restorer to paste a 400-character key into a form would
 * have put the machinery on the screen, which is the one thing [[REQ-259]] says
 * must never happen. So the paste becomes an API call and the records are
 * written into the zone by `sending.ts`.
 *
 * IT IS SEPARATE FROM `mail.ts` BECAUSE IT IS A DIFFERENT CAPABILITY, not
 * because it is a different vendor. That module sends one message and knows
 * nothing about domains; this one configures a domain and sends nothing. They
 * share a credential and a hostname, and the hostname is declared here — see
 * {@link RESEND_API_BASE} — precisely so there is one spelling of it.
 *
 * THE SHAPE IS `cloudflare.ts`'S, DELIBERATELY. A closed set of named
 * operations, no method that takes a path, `null` for a deployment with no
 * credential, and one error type carrying the status. The reasoning is that
 * file's and is not restated; what is worth saying here is that the blast radius
 * is smaller — this token can create and delete SENDING DOMAINS, and the worst
 * it can do to somebody's mail is stop it being signed.
 *
 * A DOUBLE IS WHAT THE SUITES DRIVE, for `cloudflare.ts`'s reason exactly: a
 * suite holding a live key would not fail against the real API, it would succeed
 * — and register test domains on the account this product actually sends from.
 */

/** Where every call in this module goes. `mail.ts` composes its endpoint from it. */
export const RESEND_API_BASE = 'https://api.resend.com'

/** How much of a refusal's body is worth repeating — `cloudflare.ts`'s limit. */
const DETAIL_LIMIT = 400

/** The configuration this module reads, as the env it is read from. */
export interface ResendEnv {
  /**
   * The sending credential, as a `wrangler secret` — the same one `mail.ts`
   * sends with.
   *
   * ONE KEY AND NOT TWO. Resend scopes an API key to *sending* or to *full
   * access*, and domain management needs the second; a deployment that could
   * send but not manage domains would offer the toggle and refuse it, which is
   * worse than not offering it. Absent is a refusal and not a boot failure,
   * exactly as `CLOUDFLARE_DNS_TOKEN` is: a deployment with no key still serves
   * the builder and still attaches a domain for the WEB, and what it does not do
   * is pretend to configure sending.
   */
  RESEND_API_KEY?: string
}

/** Nothing was done, because this deployment has no sending credential. */
export class ResendNotConfiguredError extends Error {
  readonly name = 'ResendNotConfiguredError'
  constructor() {
    super(
      'This deployment has no RESEND_API_KEY, so it cannot set a domain up for ' +
        'sending. See apps/control-app/MAIL.md.',
    )
  }
}

/** Resend refused, or could not be reached. */
export class ResendApiError extends Error {
  readonly name = 'ResendApiError'
  constructor(
    message: string,
    /** The HTTP status, or 0 where the call never got an answer. */
    readonly status: number = 0,
  ) {
    super(message)
  }
}

/**
 * One record Resend wants published, as this module reports it.
 *
 * THE NAME IS ALWAYS THE WHOLE NAME. Resend answers some of these relative to
 * the domain (`send`, `resend._domainkey`) and some absolute, and a caller
 * writing a relative name into a Cloudflare zone creates a record at
 * `send.send.alicesplumbing.com` — which resolves, verifies nothing, and is
 * invisible until somebody's mail stops being signed. {@link toRecord}
 * normalises once, here, so no caller has to know which shape arrived.
 */
export interface SendingRecord {
  type: string
  /** The whole name — `send.alicesplumbing.com`, never `send`. */
  name: string
  value: string
  /** `MX` only; absent everywhere else. */
  priority?: number
}

/** Where a sending domain is in its own, third, wait. */
export type SendingDomainStatus = 'not_started' | 'pending' | 'verified' | 'failed'

/** One sending domain, as this module reports it. */
export interface SendingDomain {
  /** Resend's id. Every later call about this domain is addressed by it. */
  id: string
  name: string
  status: SendingDomainStatus
  /** What has to be published for it to verify. */
  records: SendingRecord[]
}

/**
 * The whole surface. Four operations, and nothing that takes a path.
 *
 * READ THIS AS THE CREDENTIAL'S SCOPE WRITTEN OUT, on `cloudflare.ts`'s
 * reasoning. Anything a caller wants that is not here is a deliberate absence.
 */
export interface ResendClient {
  /** Register a domain for sending. Idempotent — see {@link resendFor}. */
  createDomain(domain: string): Promise<SendingDomain>
  /** Ask Resend to look for the records now, rather than on its own schedule. */
  verifyDomain(id: string): Promise<void>
  /** Where the verification got to, or `null` where Resend has no such domain. */
  readDomain(id: string): Promise<SendingDomain | null>
  /** Unregister it. What release runs through. */
  deleteDomain(id: string): Promise<void>
}

/** Resend's domain JSON, as much of it as this module reads. */
interface DomainPayload {
  id?: unknown
  name?: unknown
  status?: unknown
  records?: unknown
}

interface RecordPayload {
  record?: unknown
  name?: unknown
  type?: unknown
  value?: unknown
  priority?: unknown
}

/**
 * Resend's status vocabulary, mapped onto ours.
 *
 * FOUR WORDS AND NOT RESEND'S SIX. `pending`, `temporary_failure` and a status
 * nobody has seen before all mean the same thing to every surface here — *keep
 * waiting* — and the one that does not is `failure`, which means *this will not
 * come right on its own*. An unrecognised value maps to `pending` rather than to
 * `failed`, because the failure of guessing wrong in that direction is a wait,
 * and in the other it is telling a customer their mail is broken when it is not.
 */
function toStatus(raw: unknown): SendingDomainStatus {
  const said = String(raw ?? '').toLowerCase()
  if (said === 'verified') return 'verified'
  if (said === 'failure' || said === 'failed') return 'failed'
  if (said === 'not_started') return 'not_started'
  return 'pending'
}

/** One record, with its name made absolute against the domain it belongs to. */
function toRecord(domain: string, raw: RecordPayload): SendingRecord {
  const said = String(raw.name ?? '').replace(/\.$/, '').toLowerCase()
  const lower = domain.toLowerCase()
  const name =
    said === '' || said === '@'
      ? lower
      : said === lower || said.endsWith(`.${lower}`)
        ? said
        : `${said}.${lower}`
  const priority = Number(raw.priority)
  return {
    type: String(raw.type ?? '').toUpperCase(),
    name,
    value: String(raw.value ?? ''),
    ...(Number.isFinite(priority) && String(raw.type ?? '').toUpperCase() === 'MX'
      ? { priority }
      : {}),
  }
}

function toDomain(raw: DomainPayload): SendingDomain {
  const name = String(raw.name ?? '').toLowerCase()
  const records = Array.isArray(raw.records) ? (raw.records as RecordPayload[]) : []
  return {
    id: String(raw.id ?? ''),
    name,
    status: toStatus(raw.status),
    records: records.map((record) => toRecord(name, record)),
  }
}

/**
 * One call, and it is NOT EXPORTED — `cloudflare.ts`'s rule, for its reason.
 *
 * A caller must not be able to reach an arbitrary endpoint, so the four
 * operations share one set of headers and one reading of a refusal without
 * becoming four copies of it, and nothing outside this file can call it.
 */
async function call<T>(
  key: string,
  fetchImpl: typeof fetch,
  method: string,
  path: string,
  body?: unknown,
): Promise<T | null> {
  let response: Response
  try {
    response = await fetchImpl(`${RESEND_API_BASE}${path}`, {
      method,
      headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch (err) {
    const why = err instanceof Error ? err.message : String(err)
    throw new ResendApiError(`Resend could not be reached: ${why}`)
  }

  const payload = (await response.json().catch(() => null)) as (T & { message?: string }) | null
  if (!response.ok) {
    const said = String(payload?.message ?? '').slice(0, DETAIL_LIMIT)
    throw new ResendApiError(
      `Resend refused ${method} ${path} (${response.status}). ${said}`.trim(),
      response.status,
    )
  }
  return payload
}

/**
 * The client, or `null` where this deployment has no key.
 *
 * `null` AND NOT A THROW, on `cloudflareFor`'s reasoning: *"can this deployment
 * configure sending at all"* is a question the domain surface asks before
 * deciding whether to offer the toggle, and a gate built out of try/catch is a
 * gate nobody reads.
 *
 * `createDomain` IS IDEMPOTENT AND THAT IS NOT A CONVENIENCE. Resend refuses a
 * domain it already holds, and the domain it already holds is very often one we
 * put there — a release whose Resend delete failed, an attach retried after a
 * record write went wrong. Refusing on that would leave a customer permanently
 * unable to turn sending on for a domain that is already half-configured, with
 * no surface that could fix it. So a 4xx naming the domain is answered by
 * reading the existing registration back.
 */
export function resendFor(env: ResendEnv, fetchImpl: typeof fetch = fetch): ResendClient | null {
  const key = (env.RESEND_API_KEY ?? '').trim()
  if (key === '') return null

  return {
    async createDomain(domain) {
      const name = domain.trim().toLowerCase()
      try {
        const made = await call<DomainPayload>(key, fetchImpl, 'POST', '/domains', { name })
        if (made === null) throw new ResendApiError('Resend registered the domain and said nothing.')
        return toDomain(made)
      } catch (err) {
        if (!(err instanceof ResendApiError) || err.status < 400 || err.status >= 500) throw err
        const held = await call<{ data?: DomainPayload[] }>(key, fetchImpl, 'GET', '/domains')
        const already = (held?.data ?? []).find(
          (row) => String(row.name ?? '').toLowerCase() === name,
        )
        if (!already) throw err
        // THE LIST ANSWERS WITHOUT RECORDS, so the registration is re-read by id
        // — a caller handed a domain with no records would publish nothing and
        // then wait forever for a verification that cannot happen.
        const full = await this.readDomain(String(already.id ?? ''))
        if (full === null) throw err
        return full
      }
    },

    async verifyDomain(id) {
      await call(key, fetchImpl, 'POST', `/domains/${encodeURIComponent(id)}/verify`)
    },

    async readDomain(id) {
      try {
        const got = await call<DomainPayload>(key, fetchImpl, 'GET', `/domains/${encodeURIComponent(id)}`)
        return got === null ? null : toDomain(got)
      } catch (err) {
        // NOT THERE IS AN ANSWER — the domain was deleted at Resend by somebody
        // else. Every other refusal propagates, because a key without permission
        // and a domain that does not exist must not arrive as the same thing.
        if (err instanceof ResendApiError && err.status === 404) return null
        throw err
      }
    },

    async deleteDomain(id) {
      try {
        await call(key, fetchImpl, 'DELETE', `/domains/${encodeURIComponent(id)}`)
      } catch (err) {
        // DELETING SOMETHING ALREADY GONE IS NOT A FAILURE, on `revokeHostname`'s
        // reasoning: release must be repeatable, and a 404 here would strand a
        // customer's domain in a state only the operator could clear.
        if (err instanceof ResendApiError && err.status === 404) return
        throw err
      }
    },
  }
}

/**
 * The client, or a refusal.
 *
 * For the callers whose only correct response to a missing key is to stop —
 * turning sending ON is one, because a record set written for a registration
 * that does not exist verifies nothing and is indistinguishable from mail that
 * was configured correctly and binned.
 */
export function requireResend(env: ResendEnv, fetchImpl: typeof fetch = fetch): ResendClient {
  const client = resendFor(env, fetchImpl)
  if (client === null) throw new ResendNotConfiguredError()
  return client
}
