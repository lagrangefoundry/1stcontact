/**
 * **The platform hostname namespace, routed** — `*.1stc.site` reaches
 * `public-site` ([[REQ-394]]).
 *
 * WHAT WAS WRONG. Every `<label>.1stc.site` this product has ever issued was
 * unreachable in production: the zone was in the account, `public-site` already
 * knew how to resolve a host through `site_domains`, and nothing sent the
 * request from one to the other. A customer's own domain gets a record and a
 * route from `serving.ts` the moment it is attached; the platform's own
 * namespace was never given either.
 *
 * NOT IN `wrangler.toml`, AND THAT IS [[REQ-258]]'S RULE RATHER THAN A CHOICE.
 * One zone route there makes every deploy `PUT` the whole route list and delete
 * every customer route attached at runtime. So this route is created the way
 * `serving.ts` creates a customer's — over the API, additively — by an operator
 * command (`bin/platform-route`) that is run once per environment and is safe to
 * run again.
 *
 * NOT IN THE `zones` TABLE EITHER. That table is customer zones, and
 * `recordZone`/`serveHostOnSite` deliberately refuse the platform apex
 * ([[REQ-257]]). This is platform infrastructure: it is read from Cloudflare,
 * written to Cloudflare, and the product's own data never learns about it.
 *
 * ADDITIVE AND IDEMPOTENT, BY CONSTRUCTION. Every step reads first and writes
 * only what is missing; nothing here deletes or overwrites. Where what is there
 * conflicts with what is wanted — an unproxied wildcard record, or the pattern
 * routed to some other Worker — it REFUSES, naming the thing, because replacing
 * a record or a route this command did not create is a decision for the
 * operator and not one a re-run should make on their behalf.
 */

import type { CloudflareClient, CloudflareZone, DnsRecord } from './cloudflare'
import { PLATFORM_APEX } from './hostname'
import { PUBLIC_SITE_SCRIPT, routePatternFor, servingRecords } from './serving'

/** Every platform hostname — one label beneath the platform apex. */
export const PLATFORM_WILDCARD = `*.${PLATFORM_APEX}`

/** The zone is missing, not delegated, or holds something this must not replace. */
export class PlatformRouteError extends Error {
  readonly name = 'PlatformRouteError'
}

/** One thing this command looked at, and what it did about it. */
export interface PlatformRouteStep {
  kind: 'record' | 'route'
  /** `A *.1stc.site`, or the route pattern. */
  target: string
  /** Already there; written now; would be written without `--dry-run`. */
  outcome: 'present' | 'created' | 'would-create'
}

/** What one run found and did. */
export interface PlatformRouteReport {
  zone: Pick<CloudflareZone, 'id' | 'apex' | 'status' | 'nameServers'>
  dryRun: boolean
  steps: PlatformRouteStep[]
}

/** The record types that put a name behind Cloudflare's proxy. */
const ADDRESS_TYPES = new Set(['A', 'AAAA', 'CNAME'])

/**
 * Make `*.1stc.site/*` reach `public-site`. Zone check, then records, then route.
 *
 * THE ORDER IS `serving.ts`'s, for its reason: a route on a hostname with no
 * proxied record intercepts nothing, so the record is written first.
 *
 * ANY PROXIED WILDCARD IS ENOUGH. A route intercepts a hostname whose record is
 * proxied, whatever it points at — so an existing proxied `CNAME *` is left
 * exactly as it is, and only a wildcard with no record at all is given
 * `serving.ts`'s deliberately unroutable `A`/`AAAA` pair.
 */
export async function provisionPlatformRoute(
  client: CloudflareClient,
  options: { dryRun?: boolean } = {},
): Promise<PlatformRouteReport> {
  const dryRun = options.dryRun === true
  const zone = (await client.listZones()).find((z) => z.apex.toLowerCase() === PLATFORM_APEX)
  if (!zone) {
    throw new PlatformRouteError(
      `\`${PLATFORM_APEX}\` is not a zone in the Cloudflare account this token can see. ` +
        'Add it to the account (and point its registrar at the assigned nameservers) first.',
    )
  }
  if (zone.status !== 'active') {
    const ns = zone.nameServers.length > 0 ? ` (${zone.nameServers.join(', ')})` : ''
    throw new PlatformRouteError(
      `Cloudflare reports \`${PLATFORM_APEX}\` as ${zone.status}: it is not yet on Cloudflare's ` +
        `nameservers${ns}, so a record and a route written into it would serve nothing.`,
    )
  }

  const steps: PlatformRouteStep[] = []
  const pending = dryRun ? 'would-create' : 'created'

  const wildcard = (await client.listRecords(zone.id)).filter(
    (record) =>
      record.name.toLowerCase() === PLATFORM_WILDCARD && ADDRESS_TYPES.has(record.type.toUpperCase()),
  )
  const unproxied = wildcard.filter((record) => record.proxied !== true)
  if (unproxied.length > 0) {
    throw new PlatformRouteError(
      `\`${PLATFORM_WILDCARD}\` already has an unproxied record (${describe(unproxied)}), which ` +
        'sends visitors past the Worker. Proxy or remove it in the dashboard; this command ' +
        'does not replace records it did not write.',
    )
  }
  if (wildcard.length > 0) {
    for (const record of wildcard) {
      steps.push({ kind: 'record', target: `${record.type} ${record.name}`, outcome: 'present' })
    }
  } else {
    for (const spec of servingRecords({ canonicalHost: PLATFORM_WILDCARD, aliases: [] })) {
      if (!dryRun) await client.createRecord(zone.id, spec)
      steps.push({ kind: 'record', target: `${spec.type} ${spec.name}`, outcome: pending })
    }
  }

  const pattern = routePatternFor(PLATFORM_WILDCARD)
  const existing = (await client.listRoutes(zone.id)).find((route) => route.pattern === pattern)
  if (existing && existing.script !== PUBLIC_SITE_SCRIPT) {
    throw new PlatformRouteError(
      `\`${pattern}\` is already routed to \`${existing.script || '(no Worker)'}\`, not ` +
        `\`${PUBLIC_SITE_SCRIPT}\`. This command never moves a route it did not create.`,
    )
  }
  if (existing) {
    steps.push({ kind: 'route', target: pattern, outcome: 'present' })
  } else {
    if (!dryRun) await client.createRoute(zone.id, pattern, PUBLIC_SITE_SCRIPT)
    steps.push({ kind: 'route', target: pattern, outcome: pending })
  }

  return {
    zone: { id: zone.id, apex: zone.apex, status: zone.status, nameServers: zone.nameServers },
    dryRun,
    steps,
  }
}

/** The report, as an operator reads it. */
export function formatPlatformRouteReport(report: PlatformRouteReport): string {
  const lines = [`zone ${report.zone.apex} (${report.zone.status})`]
  for (const step of report.steps) {
    lines.push(`  ${step.outcome.padEnd(12)} ${step.kind.padEnd(6)} ${step.target}`)
  }
  const changed = report.steps.some((step) => step.outcome !== 'present')
  lines.push(
    !changed
      ? `Nothing to do: every ${PLATFORM_APEX} hostname already reaches ${PUBLIC_SITE_SCRIPT}.`
      : report.dryRun
        ? 'Dry run: nothing was written.'
        : `Done: every ${PLATFORM_APEX} hostname now reaches ${PUBLIC_SITE_SCRIPT}.`,
  )
  return lines.join('\n')
}

function describe(records: readonly DnsRecord[]): string {
  return records.map((r) => `${r.type} → ${r.content}`).join(', ')
}
