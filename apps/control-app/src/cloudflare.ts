/**
 * The Cloudflare zone API — the WRITE half of [[REQ-257]]'s DNS layer.
 *
 * ONE MODULE, ONE TOKEN, AND THE OPERATIONS ARE ENUMERATED. There is no method
 * that takes a path and a body. That is the ticket's own falsifier and it is
 * worth more than the convenience it costs: a passthrough makes the question
 * *"what can this deployment do to our DNS"* unanswerable without reading every
 * call site, and the answer to that question is exactly what the token's scope
 * is supposed to be checkable against. What {@link CloudflareClient} declares IS
 * the surface, and it maps one-to-one onto `Zone:DNS:Edit` and
 * `Workers Routes:Edit`. It grew by one read in [[REQ-258]] — `listRoutes`,
 * which taking a domain back down needs — and the scope it maps onto did not
 * move, which is the property this arrangement exists to keep checkable.
 *
 * THE CREDENTIAL IS THIS MODULE'S OWN, AND DELIBERATELY NOT THE EMBEDDER'S.
 * `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` already exist here —
 * `embedder.ts` reads them as the REST transport for Workers AI ([[BUG-73]]) —
 * and reusing either name would be wrong twice over. It would put a Workers-AI
 * token where a zone token is needed; and that pair is BOTH-OR-NEITHER, so
 * declaring the account id in `wrangler.toml` to make it reachable in production
 * would hand `transportFor` half a credential and break the project knowledge
 * base on a deployment that never asked for REST. {@link CloudflareEnv} names
 * one key, it is called something else, and nothing in this file reads theirs.
 *
 * AND THERE IS NO SECOND KEY, because the account id is not configuration. Every
 * zone Cloudflare returns carries its own `account.id`, so {@link accountId}
 * reads it from the zones the token can already see and remembers it. One fewer
 * value to get wrong, it cannot drift from the account the token actually
 * reaches, and *"one module, one token"* stays literally true.
 *
 * ABSENT MEANS REFUSE, NOT DEGRADE — the fail-closed rule `lead.ts` and
 * `gate.ts` already follow. {@link cloudflareFor} answers `null` for a
 * deployment with no token, and {@link requireCloudflare} throws; what neither
 * does is manage zones optimistically and reconcile later. A deployment that
 * cannot reach Cloudflare manages no DNS, and says so.
 *
 * `fetchImpl` IS AN ARGUMENT, on `resendMailer`'s reasoning exactly: a UAT must
 * be able to prove the request this builds — the URL, the bearer header, the
 * JSON shape, the fields read back — against a double. A test that reached the
 * real API would either fail without a credential or, far worse, succeed with
 * one and start deleting zones that carry a customer's mail.
 */

/** Where every call in this module goes. */
export const CLOUDFLARE_API_BASE = 'https://api.cloudflare.com/client/v4'

/** How much of a refusal's body is worth repeating — `mail.ts`'s limit. */
const DETAIL_LIMIT = 400

/**
 * The configuration this module reads, as the env it is read from.
 *
 * One key. See the module docstring on why it is not `CLOUDFLARE_API_TOKEN`.
 */
export interface CloudflareEnv {
  /**
   * The zone credential, as a `wrangler secret` (pushed by
   * `bin/deploy.d/secrets/40-cloudflare-dns-token`).
   *
   * A SECRET AND NOT A VAR, for the reason `RESEND_API_KEY` is: a var is
   * readable in the dashboard and echoed by `wrangler deploy`, and this one can
   * rewrite the DNS of every domain this deployment manages — including, if it
   * were scoped that widely, the records that carry a customer's mail.
   *
   * SCOPED TO `Zone:DNS:Edit` AND `Workers Routes:Edit`, AND NOTHING ELSE. The
   * enumerated surface below is what that scope admits; a token with more is a
   * token whose blast radius nobody can read off this file.
   *
   * OPTIONAL, AND ABSENT IS A REFUSAL rather than a boot failure. A deployment
   * with no token still serves the builder, still publishes and still sends
   * mail; what it does not do is pretend to manage DNS.
   */
  CLOUDFLARE_DNS_TOKEN?: string
}

/** Nothing was done, because this deployment has no zone credential. */
export class CloudflareNotConfiguredError extends Error {
  readonly name = 'CloudflareNotConfiguredError'
  constructor() {
    super(
      'This deployment has no CLOUDFLARE_DNS_TOKEN, so it manages no DNS. ' +
        'See bin/deploy.d/secrets/40-cloudflare-dns-token.',
    )
  }
}

/** Cloudflare refused, or could not be reached. */
export class CloudflareApiError extends Error {
  readonly name = 'CloudflareApiError'
  constructor(
    message: string,
    /** The HTTP status, or 0 where the call never got an answer. */
    readonly status: number = 0,
  ) {
    super(message)
  }
}

/**
 * There are no zones, so there is no account id to read off one.
 *
 * ITS OWN ERROR because the remedy is specific and is not *"check your token"*:
 * the account has to contain at least one zone before a zone can be created
 * into it. Unreachable for this deployment, which holds the two platform zones,
 * and named anyway so a fresh account fails with a sentence rather than with
 * Cloudflare's own complaint about a missing `account` field.
 */
export class CloudflareAccountUnknownError extends Error {
  readonly name = 'CloudflareAccountUnknownError'
  constructor() {
    super(
      'The account id is read from a zone this token can see, and it can see ' +
        'none — so there is nothing to create a zone into.',
    )
  }
}

/** One zone, as this module reports it. Cloudflare's fields, renamed once. */
export interface CloudflareZone {
  /** Cloudflare's id, which every call against the zone is addressed by. */
  id: string
  /** The apex. Cloudflare calls it `name`. */
  apex: string
  /**
   * Cloudflare's own state machine: `pending`, `active`, and the rest of its
   * vocabulary passed through verbatim.
   *
   * NOT NARROWED TO A UNION HERE. `zones.ts` maps it onto the four values that
   * table admits, and it is the one place that mapping is written; a union in
   * this file would be a second opinion about a vocabulary that is not ours.
   */
  status: string
  /** The nameserver pair Cloudflare assigned. */
  nameServers: string[]
  /** The Cloudflare account this zone sits in. */
  accountId: string
}

/** One DNS record, as Cloudflare holds it. */
export interface DnsRecord {
  id: string
  type: string
  name: string
  content: string
  ttl: number
  /** `MX` and `SRV` only; absent everywhere else. */
  priority?: number
  proxied?: boolean
}

/** A record to write. The id is Cloudflare's to mint. */
export interface DnsRecordSpec {
  type: string
  name: string
  content: string
  /** Seconds, or 1 for Cloudflare's "automatic". Defaults to automatic. */
  ttl?: number
  priority?: number
  proxied?: boolean
}

/** One Worker route on a zone. */
export interface WorkerRoute {
  id: string
  pattern: string
  /** The Worker script the pattern runs. */
  script: string
}

/**
 * The whole surface. Eleven operations, and nothing that takes a path.
 *
 * READ THIS AS THE TOKEN'S SCOPE WRITTEN OUT. Zones and records are
 * `Zone:DNS:Edit`; the two route methods are `Workers Routes:Edit`. Anything a
 * caller wants that is not here is a deliberate absence, and adding it is a
 * decision about what this deployment may do to somebody's domain rather than a
 * line of plumbing.
 */
export interface CloudflareClient {
  /** The Cloudflare account these zones sit in, read from one of them. */
  accountId(): Promise<string>
  /** Every zone this token can see. */
  listZones(): Promise<CloudflareZone[]>
  /** One zone by Cloudflare's id, or `null` where there is no such zone. */
  readZone(cfZoneId: string): Promise<CloudflareZone | null>
  /** Add an apex to the account. Cloudflare assigns the nameserver pair. */
  createZone(apex: string): Promise<CloudflareZone>
  /** Remove a zone from the account. What the customer's exit runs through. */
  deleteZone(cfZoneId: string): Promise<void>
  listRecords(cfZoneId: string): Promise<DnsRecord[]>
  createRecord(cfZoneId: string, record: DnsRecordSpec): Promise<DnsRecord>
  updateRecord(cfZoneId: string, recordId: string, record: DnsRecordSpec): Promise<DnsRecord>
  deleteRecord(cfZoneId: string, recordId: string): Promise<void>
  /**
   * Every Worker route on the zone ([[REQ-258]]).
   *
   * THE ELEVENTH OPERATION, AND IT IS A READ. Taking a domain back down means
   * deleting the route that was created for it, and `deleteRoute` is addressed
   * by Cloudflare's route id — a value this deployment does not keep, because a
   * `site_domains` row records an address and not a vendor's handle for one.
   * The alternative was a column holding that id, which is exactly the
   * data-as-key shape `0010`'s own comment rejects for the zone.
   *
   * `Workers Routes:Edit` ALREADY ADMITS IT, so the token's scope is unchanged
   * and the surface-as-scope reading in this file's header still holds.
   */
  listRoutes(cfZoneId: string): Promise<WorkerRoute[]>
  createRoute(cfZoneId: string, pattern: string, script: string): Promise<WorkerRoute>
  deleteRoute(cfZoneId: string, routeId: string): Promise<void>
}

/** Cloudflare's envelope. Every endpoint answers in this shape. */
interface Envelope<T> {
  success?: boolean
  errors?: { code?: number; message?: string }[]
  result?: T
}

/**
 * One call, and it is NOT EXPORTED.
 *
 * The falsifier is *"a method that takes a path and a body"*, and the word doing
 * the work is METHOD: a caller must not be able to reach an arbitrary endpoint.
 * A module-private helper is how eleven operations share one set of headers and
 * one reading of Cloudflare's envelope without becoming eleven copies of it, and
 * nothing outside this file can call it.
 */
async function call<T>(
  token: string,
  fetchImpl: typeof fetch,
  method: string,
  path: string,
  body?: unknown,
): Promise<T | undefined> {
  let response: Response
  try {
    response = await fetchImpl(`${CLOUDFLARE_API_BASE}${path}`, {
      method,
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch (err) {
    const why = err instanceof Error ? err.message : String(err)
    throw new CloudflareApiError(`Cloudflare could not be reached: ${why}`)
  }

  // A 404 IS AN ANSWER AND NOT ALWAYS A FAILURE — `readZone` turns it into
  // `null`. It is raised here like any other refusal and caught there, so this
  // helper holds no opinion about which endpoints have a meaningful absence.
  const payload = (await response.json().catch(() => null)) as Envelope<T> | null

  if (!response.ok || payload?.success === false) {
    // Cloudflare's own words, truncated on `mail.ts`'s reasoning: a refusal is
    // usually one useful sentence and occasionally a page, and an error message
    // that is a page is one nobody reads.
    const said = (payload?.errors ?? [])
      .map((e) => e.message ?? '')
      .filter((m) => m !== '')
      .join('; ')
      .slice(0, DETAIL_LIMIT)
    throw new CloudflareApiError(
      `Cloudflare refused ${method} ${path} (${response.status}). ${said}`.trim(),
      response.status,
    )
  }

  // A NULL RESULT IS RETURNED AS `undefined` RATHER THAN CRASHING A READER.
  // A delete answers `{result: null}` legitimately and its caller discards the
  // value; anything that needed one passes the answer through {@link required},
  // which is where accepted-with-no-result becomes the failure it is.
  const result = payload?.result
  return (result === null ? undefined : result) as T | undefined
}

/**
 * The value, or a refusal naming what was missing.
 *
 * ACCEPTED-WITH-NO-RESULT IS A FAILURE and not an empty success: a caller that
 * asked Cloudflare to create a zone and was handed nothing cannot report what it
 * did, and the alternative — a zone object of empty strings — is a row written
 * against an id that does not exist.
 */
function required<T>(value: T | undefined, what: string): T {
  if (value === undefined) {
    throw new CloudflareApiError(
      `Cloudflare accepted the request and returned no ${what}, so nothing here ` +
        'can report what it did.',
    )
  }
  return value
}

/** Cloudflare's zone JSON, as much of it as this module reads. */
interface ZonePayload {
  id?: unknown
  name?: unknown
  status?: unknown
  name_servers?: unknown
  account?: { id?: unknown }
}

function toZone(payload: ZonePayload): CloudflareZone {
  return {
    id: String(payload.id ?? ''),
    apex: String(payload.name ?? '').toLowerCase(),
    status: String(payload.status ?? ''),
    nameServers: Array.isArray(payload.name_servers)
      ? payload.name_servers.map((ns) => String(ns).toLowerCase())
      : [],
    accountId: String(payload.account?.id ?? ''),
  }
}

interface RecordPayload {
  id?: unknown
  type?: unknown
  name?: unknown
  content?: unknown
  ttl?: unknown
  priority?: unknown
  proxied?: unknown
}

function toRecord(payload: RecordPayload): DnsRecord {
  const record: DnsRecord = {
    id: String(payload.id ?? ''),
    type: String(payload.type ?? ''),
    name: String(payload.name ?? '').toLowerCase(),
    content: String(payload.content ?? ''),
    ttl: typeof payload.ttl === 'number' ? payload.ttl : 1,
  }
  if (typeof payload.priority === 'number') record.priority = payload.priority
  if (typeof payload.proxied === 'boolean') record.proxied = payload.proxied
  return record
}

/** What Cloudflare is sent for a record. `undefined` fields are omitted. */
function recordBody(record: DnsRecordSpec): Record<string, unknown> {
  const body: Record<string, unknown> = {
    type: record.type,
    name: record.name,
    content: record.content,
    // 1 IS CLOUDFLARE'S "AUTOMATIC", and it is the default because a TTL this
    // deployment picked would be a number nobody chose deliberately. Ticket E
    // writes records that want a short one during a cutover and will say so.
    ttl: record.ttl ?? 1,
  }
  if (record.priority !== undefined) body.priority = record.priority
  if (record.proxied !== undefined) body.proxied = record.proxied
  return body
}

/**
 * The client, or `null` where this deployment has no token.
 *
 * `null` AND NOT A THROW, because *"can this deployment manage DNS at all"* is a
 * question several surfaces ask before deciding whether to offer anything, and a
 * gate built out of try/catch is a gate nobody reads. {@link requireCloudflare}
 * is the throwing form, for the callers whose only correct response is to stop.
 */
export function cloudflareFor(
  env: CloudflareEnv,
  fetchImpl: typeof fetch = fetch,
): CloudflareClient | null {
  const token = (env.CLOUDFLARE_DNS_TOKEN ?? '').trim()
  if (token === '') return null

  // MEMOISED PER CLIENT AND NOT PER MODULE. The account id cannot change for a
  // given token, but a module-level cache would outlive the request in a warm
  // isolate and would be shared by every env that reached this file — which is
  // one deployment today and is the kind of assumption that is expensive to
  // discover is false.
  let account: string | null = null

  return {
    async accountId() {
      if (account !== null) return account
      const zones = await this.listZones()
      const found = zones.map((zone) => zone.accountId).find((id) => id !== '')
      if (found === undefined) throw new CloudflareAccountUnknownError()
      account = found
      return account
    },

    async listZones() {
      // `per_page=50` IS CLOUDFLARE'S MAXIMUM PAGE AND THIS DOES NOT PAGINATE.
      // Fifty zones is a deployment far past the point where an operator drift
      // report is the right surface, and a silent first page would be worse
      // than either — so the count is checked and a full page is a refusal
      // naming what it could not see.
      const page = await call<ZonePayload[]>(token, fetchImpl, 'GET', '/zones?per_page=50')
      const zones = (page ?? []).map(toZone)
      if (zones.length >= 50) {
        throw new CloudflareApiError(
          'This account holds 50 or more zones, which is more than one page, and ' +
            'this client does not paginate — so any answer it gave would be a ' +
            'partial one presented as complete.',
        )
      }
      return zones
    },

    async readZone(cfZoneId) {
      try {
        const zone = await call<ZonePayload>(token, fetchImpl, 'GET', `/zones/${cfZoneId}`)
        return zone === undefined ? null : toZone(zone)
      } catch (err) {
        // NOT THERE IS AN ANSWER. Every other refusal propagates, because a
        // token without permission and a zone that does not exist must not
        // arrive at the caller as the same thing.
        if (err instanceof CloudflareApiError && err.status === 404) return null
        throw err
      }
    },

    async createZone(apex) {
      const id = await this.accountId()
      const zone = await call<ZonePayload>(token, fetchImpl, 'POST', '/zones', {
        name: apex,
        account: { id },
        // A FULL ZONE AND NOT A PARTIAL ONE. `type: 'partial'` is CNAME setup,
        // which leaves the customer's nameservers where they are and manages one
        // hostname — the opposite of this epic's arrangement, where the zone
        // moves to us and we hold the whole of it.
        type: 'full',
      })
      return toZone(required(zone, 'zone'))
    },

    async deleteZone(cfZoneId) {
      await call<unknown>(token, fetchImpl, 'DELETE', `/zones/${cfZoneId}`)
    },

    async listRecords(cfZoneId) {
      const page = await call<RecordPayload[]>(
        token,
        fetchImpl,
        'GET',
        `/zones/${cfZoneId}/dns_records?per_page=100`,
      )
      return (page ?? []).map(toRecord)
    },

    async createRecord(cfZoneId, record) {
      const created = await call<RecordPayload>(
        token,
        fetchImpl,
        'POST',
        `/zones/${cfZoneId}/dns_records`,
        recordBody(record),
      )
      return toRecord(required(created, 'record'))
    },

    async updateRecord(cfZoneId, recordId, record) {
      // PUT AND NOT PATCH. A record is replaced wholesale, so what is written is
      // exactly what the caller described — a PATCH would leave whatever it did
      // not mention in place, and ticket E's job is to write a known record set,
      // not to merge with one it did not read.
      const updated = await call<RecordPayload>(
        token,
        fetchImpl,
        'PUT',
        `/zones/${cfZoneId}/dns_records/${recordId}`,
        recordBody(record),
      )
      return toRecord(required(updated, 'record'))
    },

    async deleteRecord(cfZoneId, recordId) {
      await call<unknown>(token, fetchImpl, 'DELETE', `/zones/${cfZoneId}/dns_records/${recordId}`)
    },

    async listRoutes(cfZoneId) {
      const page = await call<{ id?: unknown; pattern?: unknown; script?: unknown }[]>(
        token,
        fetchImpl,
        'GET',
        `/zones/${cfZoneId}/workers/routes`,
      )
      return (page ?? []).map((route) => ({
        id: String(route.id ?? ''),
        pattern: String(route.pattern ?? ''),
        script: String(route.script ?? ''),
      }))
    },

    async createRoute(cfZoneId, pattern, script) {
      const created = required(
        await call<{ id?: unknown; pattern?: unknown; script?: unknown }>(
          token,
          fetchImpl,
          'POST',
          `/zones/${cfZoneId}/workers/routes`,
          { pattern, script },
        ),
        'route',
      )
      return {
        id: String(created.id ?? ''),
        // Cloudflare echoes both back; falling through to what was asked for
        // keeps the returned route usable when a future API version stops.
        pattern: String(created.pattern ?? pattern),
        script: String(created.script ?? script),
      }
    },

    async deleteRoute(cfZoneId, routeId) {
      await call<unknown>(token, fetchImpl, 'DELETE', `/zones/${cfZoneId}/workers/routes/${routeId}`)
    },
  }
}

/**
 * The client, or a refusal.
 *
 * For the callers whose only correct response to a missing token is to stop —
 * the backfill and the drift check both are, because a report assembled from no
 * data is a report saying everything is fine.
 */
export function requireCloudflare(
  env: CloudflareEnv,
  fetchImpl: typeof fetch = fetch,
): CloudflareClient {
  const client = cloudflareFor(env, fetchImpl)
  if (client === null) throw new CloudflareNotConfiguredError()
  return client
}
