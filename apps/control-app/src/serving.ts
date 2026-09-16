/**
 * **Serving a custom domain** — the records, the runtime Worker route, and the
 * row, in the one order that never leaves a half-attached address ([[REQ-258]]).
 *
 * THREE MECHANISMS, AND ALL THREE ARE NEEDED FOR ONE REQUEST TO SUCCEED. A
 * `site_domains` row with no DNS record is a hostname that resolves nowhere; a
 * DNS record with no Worker route reaches Cloudflare and is answered by nothing;
 * a route with no row arrives at `public-site` and meets a 404. Each of the three
 * is invisible on its own and the symptom of any one missing is identical, which
 * is why they are composed here rather than at three call sites.
 *
 * THE ORDER IS THE CONTRACT. Records, then routes, then the row — and every step
 * is undone in reverse if a later one fails. Two of this ticket's falsifiers are
 * statements about this ordering: *\"a Worker route created without the DNS record
 * that makes it reachable\"*, and *\"a `site_domains` row whose host resolves
 * nowhere after the mechanism reports success\"*. The row is written last
 * precisely because it is the thing every other part of the product reads as
 * *\"this address works\"*.
 *
 * THE ROUTE IS CREATED AT RUNTIME AND IS NEVER A CONFIG EDIT. `wrangler.toml`
 * declares the platform's own two routes and must never learn a customer's
 * domain: a deploy would then be the only way to attach one, every attachment
 * would be a commit, and a customer's address would be coupled to this repo's
 * release cycle. {@link CloudflareClient.createRoute} is the mechanism and
 * `Workers Routes:Edit` is the scope it needs. See
 * `tests/test_UAT_FC_REQ-258_runtime_routes_survive_a_deploy.test.ts` for the
 * evidence that a later `wrangler deploy` does not take them away again — the
 * risk the ticket says to settle before building, settled out of wrangler's own
 * deploy path rather than out of an experiment nobody can repeat.
 *
 * NOTHING HERE READS OR WRITES `site_domains`. That table has one reader and one
 * writer (`hostname.ts`), and this module composes its operations with
 * Cloudflare's rather than reaching past it — which is what keeps *\"every read is
 * filtered to `status = 'active'`\"* a property of one file.
 */

import type {
  CloudflareClient,
  DnsRecord,
  DnsRecordSpec,
  WorkerRoute,
} from './cloudflare'
import { applyRecords, revertRecords, type AppliedRecord } from './records'
import {
  addressByHost,
  attachCustomHosts,
  ensureCanonical,
  hostRefusal,
  InvalidHostnameError,
  normaliseHost,
  releaseCustomHosts,
  type SiteAddress,
} from './hostname'
import type { IdentityEnv } from './identity'
import { isPlatformApex, zoneForHost, type Zone } from './zones'

/**
 * The Worker a customer's domain is routed to.
 *
 * IT IS `apps/public-site/wrangler.toml`'S `name` AND MUST STAY SO. A route
 * naming a script that does not exist is accepted by Cloudflare and answers
 * every request with an error page, so the failure of getting this wrong is a
 * domain that resolves, presents a valid certificate, and serves nothing — the
 * most expensive shape of broken there is. A UAT reads the TOML and asserts the
 * two agree, because a rename over there would otherwise be silent over here.
 */
export const PUBLIC_SITE_SCRIPT = '1stcontact-public-site'

/**
 * The address a proxied serving record points at, and it is deliberately
 * unroutable.
 *
 * `192.0.2.1` IS RFC 5737 TEST-NET-1 and `100::` IS RFC 6666's DISCARD PREFIX.
 * Neither is an origin and neither can become one by accident. That is the whole
 * point: the record exists so Cloudflare will accept the hostname as proxied —
 * *\"a route alone would resolve to nothing\"*, as `wrangler.toml` already records
 * for the apex — and the Worker answers at the edge before any origin is
 * consulted. If the proxy were ever bypassed, a request must fail rather than
 * arrive at whoever happens to own a real address somebody picked as a
 * placeholder.
 */
export const SERVING_IPV4 = '192.0.2.1'
export const SERVING_IPV6 = '100::'

/** The record types written at every serving name, in the order they are written. */
const SERVING_TYPES: ReadonlyArray<{ type: string; content: string }> = [
  { type: 'A', content: SERVING_IPV4 },
  { type: 'AAAA', content: SERVING_IPV6 },
]

/** This deployment holds no zone for that domain, so it cannot write its DNS. */
export class NoZoneForHostError extends Error {
  readonly name = 'NoZoneForHostError'
}

/**
 * The zone is here but may not be pointed at a site.
 *
 * TWO REASONS, ONE ERROR, BECAUSE THE OPERATOR'S NEXT ACTION IS THE SAME — go
 * and fix the zone. A zone with no `account_id` is [[REQ-257]]'s second guard
 * (*\"selectable by nobody\"*) and a zone Cloudflare has not reported `active`
 * cannot serve whatever we write into it, because the delegation has not landed.
 */
export class ZoneNotReadyError extends Error {
  readonly name = 'ZoneNotReadyError'
}

/** What one attachment did, in full. */
export interface ServingResult {
  siteKey: string
  zone: Zone
  /** The rows written — the canonical address first. */
  addresses: SiteAddress[]
  /** The records written, whether created or replaced. */
  records: DnsRecord[]
  /**
   * Records that already existed at a serving name and were overwritten.
   *
   * REPORTED RATHER THAN REFUSED, AND REPORTED RATHER THAN SWALLOWED. Pointing a
   * domain at us IS replacing whatever its apex pointed at, so refusing would
   * refuse the operation. Deciding whether a domain is safe to take over — what
   * its live mail, its existing site and its verification records say — is the
   * pre-cutover sweep, and it is a different ticket with a different shape. What
   * this owes that work is that nothing is replaced silently.
   */
  replaced: DnsRecord[]
  routes: WorkerRoute[]
}

/** Which hosts one attachment serves, and which of them is the address. */
export interface ServingPlan {
  /** The host that becomes **the** address. */
  canonicalHost: string
  /** Hosts that reach the same site and 301 to the canonical one. */
  aliases: string[]
}

/**
 * The hosts an attachment writes, from the one the operator named.
 *
 * PURE, AND SEPARATE FROM THE MECHANISM, so the whole policy — which is the part
 * with the judgement in it — is testable without a zone, a client or a database.
 *
 * `www` IS NOT A QUESTION WE ASK ANYBODY. A customer attaching
 * `alicesplumbing.com` means their website, and a visitor who types
 * `www.alicesplumbing.com` must not meet a certificate error — so both records
 * are written, the apex is the address, and `www` 301s to it. Somebody who names
 * the `www` form is naming the same website, so it resolves to the same plan
 * rather than to an inverted one: **decide once**.
 *
 * A DEEPER LABEL IS NOT GIVEN A `www`. `shop.alicesplumbing.com` is a deliberate
 * choice of host and `www.shop.…` is nothing anybody would type.
 */
export function servingPlan(rawHost: string, apex: string): ServingPlan {
  const host = normaliseHost(rawHost)
  const zoneApex = normaliseHost(apex)
  if (host === zoneApex || host === `www.${zoneApex}`) {
    return { canonicalHost: zoneApex, aliases: [`www.${zoneApex}`] }
  }
  return { canonicalHost: host, aliases: [] }
}

/** Every host a plan serves, the canonical one first. */
export function servedHosts(plan: ServingPlan): string[] {
  return [plan.canonicalHost, ...plan.aliases]
}

/**
 * The records a plan needs — `A` and `AAAA` at every served name, proxied.
 *
 * PROXIED IS THE LOAD-BEARING FLAG and not a performance preference. A Worker
 * route only intercepts a hostname whose record is proxied; an unproxied record
 * sends the visitor straight to {@link SERVING_IPV4}, which is deliberately
 * nothing, so the site would be down rather than slow.
 *
 * BOTH FAMILIES, THOUGH CLOUDFLARE WOULD ANSWER BOTH FROM EITHER. A zone whose
 * apex holds only an `A` still answers `AAAA` for the proxied name — so the
 * second record buys nothing from the edge, and it buys something from the
 * dashboard: an operator looking at the zone sees a complete, deliberate record
 * set rather than one whose missing half looks like a mistake somebody should
 * fix.
 */
export function servingRecords(plan: ServingPlan): DnsRecordSpec[] {
  return servedHosts(plan).flatMap((name) =>
    SERVING_TYPES.map(({ type, content }) => ({ type, name, content, proxied: true })),
  )
}

/** The Worker route pattern that sends a host to `public-site`. */
export function routePatternFor(host: string): string {
  // `/*` AND NOT `/`. A zone route matches a pattern, not a prefix, so
  // `alicesplumbing.com/` would route the front page and nothing beneath it —
  // every stylesheet, every image and every other page missing, on a site that
  // looks like it loaded.
  return `${normaliseHost(host)}/*`
}

/**
 * Point a host at a site. Records, then routes, then the row.
 *
 * THE GUARDS RUN BEFORE ANYTHING IS WRITTEN, all of them, because a refusal
 * halfway through is a zone left holding records for a domain that was never
 * attached — and nothing afterwards would ever look at them again.
 *
 * THE CERTIFICATE IS WHY DEPTH IS REFUSED. Universal SSL covers a zone's apex
 * and one label beneath it, automatically and free; `a.b.alicesplumbing.com`
 * gets records, gets a route, resolves, and then presents a certificate the
 * browser refuses — which reads to a customer as *\"you broke my domain\"* and is
 * unfixable without an Advanced Certificate Manager subscription. Refusing at
 * the door is the honest version of that.
 */
export async function serveHostOnSite(
  env: IdentityEnv,
  client: CloudflareClient,
  request: { siteKey: string; host: string },
): Promise<ServingResult> {
  const host = normaliseHost(request.host)
  const refusal = hostRefusal(host)
  if (refusal !== null) throw new InvalidHostnameError(refusal)

  const zone = await zoneForHost(env, host)
  if (zone === null) {
    throw new NoZoneForHostError(
      `This deployment holds no zone for \`${host}\`, so it cannot write its DNS. ` +
        'Record the zone first.',
    )
  }
  // [[REQ-257]]'s FIRST GUARD, RESTATED WHERE IT BITES. `1stc.site` carries every
  // customer's platform hostname, and pointing one customer's site at that zone's
  // apex would hand them the namespace. `recordZone` already refuses to attribute
  // it to an account; this refuses to serve from it whatever the table says.
  if (isPlatformApex(zone.apex)) {
    throw new ZoneNotReadyError(`\`${zone.apex}\` is ours and is not a customer's domain.`)
  }
  // [[REQ-257]]'s SECOND GUARD: a zone with no account is selectable by nobody.
  if (zone.accountId === null) {
    throw new ZoneNotReadyError(
      `\`${zone.apex}\` has not been attributed to an account, so nothing may be served from it.`,
    )
  }
  if (zone.status !== 'active') {
    throw new ZoneNotReadyError(
      `Cloudflare reports \`${zone.apex}\` as ${zone.status}, so records written into it would not ` +
        'serve. The nameserver change has not landed yet.',
    )
  }

  const plan = servingPlan(host, zone.apex)
  const hosts = servedHosts(plan)
  for (const served of hosts) {
    const depth = served === zone.apex ? 0 : served.slice(0, -zone.apex.length - 1).split('.').length
    if (depth > 1) {
      throw new InvalidHostnameError(
        `\`${served}\` is more than one level below \`${zone.apex}\`, and the automatic ` +
          'certificate only covers the domain and one level beneath it.',
      )
    }
  }

  const applied: AppliedRecord[] = []
  const created: WorkerRoute[] = []
  const replaced: DnsRecord[] = []
  try {
    // RECORDS FIRST, THROUGH `records.ts` — the zone is read once and every
    // decision is made against that reading, an already-correct record is not
    // rewritten, and what was replaced is reported rather than swallowed. That
    // was written here first and moved out when the sending toggle became its
    // second caller ([[REQ-259]]); the sequence is unchanged, which is what the
    // ordering claims in this ticket's suite are about.
    const wrote = await applyRecords(client, zone.cfZoneId, servingRecords(plan))
    applied.push(...wrote.applied)
    replaced.push(...wrote.replaced)

    // ROUTES SECOND. A route is what makes a proxied hostname reach this Worker
    // at all, and creating it before the record would leave a window in which
    // Cloudflare routes a hostname it has no record for.
    for (const served of hosts) {
      created.push(
        await client.createRoute(zone.cfZoneId, routePatternFor(served), PUBLIC_SITE_SCRIPT),
      )
    }

    // THE ROW LAST. Every other part of the product reads a row as *"this address
    // works"* — `publish` lets a site go live on the strength of one, and a mailed
    // link is composed from one — so it is written only once the address does.
    const addresses = await attachCustomHosts(env, request.siteKey, {
      canonicalHost: plan.canonicalHost,
      aliases: plan.aliases,
    })
    return { siteKey: request.siteKey, zone, addresses, records: applied.map((a) => a.record), replaced, routes: created }
  } catch (error) {
    await undo(client, zone, applied, created)
    throw error
  }
}

/**
 * Put the zone back the way it was found.
 *
 * IN REVERSE, AND EVERY FAILURE SWALLOWED. A rollback runs because something has
 * already gone wrong; the error the caller needs to see is that one, and a
 * second failure here must not replace it with a less informative one. What the
 * operator is left with is reported by the original refusal, and the zone is
 * visible to them in any case.
 *
 * THE ROUTES ARE THIS MODULE'S AND THE RECORDS ARE `records.ts`'S, which is the
 * same division the forward path makes: what to write is a purpose's judgement,
 * and how to put a record back is one answer shared by every purpose.
 */
async function undo(
  client: CloudflareClient,
  zone: Zone,
  applied: readonly AppliedRecord[],
  routes: readonly WorkerRoute[],
): Promise<void> {
  for (const route of [...routes].reverse()) {
    try {
      await client.deleteRoute(zone.cfZoneId, route.id)
    } catch {
      /* the original error is the one worth reporting */
    }
  }
  await revertRecords(client, zone.cfZoneId, applied)
}

/**
 * Stop serving a host. The mechanism, reversed.
 *
 * IT EXISTS BECAUSE A CUSTOM DOMAIN IS NOT FINAL, which is the rule this ticket
 * introduces and the one most likely to be got wrong by whoever reads
 * `hostname.ts`'s header and applies the platform rule uniformly. An attachment
 * that cannot be undone is an attachment nobody can safely make: a mistyped
 * domain would otherwise be repairable only by editing the database by hand.
 * The customer-facing release control is a different ticket; this is the
 * operator's, and the mechanism is the same one either will run.
 *
 * ANSWERS `null` FOR A HOST THAT WAS NOT SERVING, on `revokeHostname`'s
 * reasoning: undoing something already undone is not an error, and an operator
 * repeating a command should get the same answer twice.
 *
 * THE PLATFORM HOSTNAME GETS THE TITLE BACK. A site whose custom domain was the
 * canonical address and is now gone would otherwise hold no canonical row at all,
 * and every remaining host would 301 to nothing. Promotion is part of the
 * operation rather than a thing a caller remembers.
 */
export async function stopServingHost(
  env: IdentityEnv,
  client: CloudflareClient,
  rawHost: string,
): Promise<{ siteKey: string; hosts: string[] } | null> {
  const host = normaliseHost(rawHost)
  const zone = await zoneForHost(env, host)
  if (zone === null) return null

  const plan = servingPlan(host, zone.apex)
  const hosts = servedHosts(plan)

  const live = await Promise.all(hosts.map((served) => addressByHost(env, served)))
  const siteKey = live.find((address) => address?.kind === 'custom')?.siteKey
  if (!siteKey) return null

  for (const route of await routesFor(client, zone, hosts)) {
    await client.deleteRoute(zone.cfZoneId, route.id)
  }
  const records = await client.listRecords(zone.cfZoneId)
  for (const record of records) {
    if (!hosts.includes(record.name.toLowerCase())) continue
    if (!SERVING_TYPES.some(({ type }) => record.type.toUpperCase() === type)) continue
    await client.deleteRecord(zone.cfZoneId, record.id)
  }
  const released = await releaseCustomHosts(env, hosts)
  await ensureCanonical(env, siteKey)
  return { siteKey, hosts: released }
}

/** The routes on this zone that point one of these hosts at `public-site`. */
async function routesFor(
  client: CloudflareClient,
  zone: Zone,
  hosts: readonly string[],
): Promise<WorkerRoute[]> {
  const patterns = new Set(hosts.map(routePatternFor))
  // SCOPED TO OUR OWN SCRIPT, not to the pattern alone. A zone may carry routes
  // for Workers this product did not put there, and deleting one because its
  // pattern matched would be this deployment reaching into somebody else's
  // configuration.
  return (await client.listRoutes(zone.cfZoneId)).filter(
    (route) => patterns.has(route.pattern) && route.script === PUBLIC_SITE_SCRIPT,
  )
}
