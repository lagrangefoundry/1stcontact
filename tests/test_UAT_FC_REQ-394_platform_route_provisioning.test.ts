import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import type {
  CloudflareClient,
  CloudflareZone,
  DnsRecord,
  DnsRecordSpec,
  WorkerRoute,
} from '../apps/control-app/src/cloudflare'
import {
  PLATFORM_WILDCARD,
  PlatformRouteError,
  provisionPlatformRoute,
} from '../apps/control-app/src/platform-route'
import { PUBLIC_SITE_SCRIPT, SERVING_IPV4, SERVING_IPV6 } from '../apps/control-app/src/serving'

/**
 * [[REQ-394]] — **`*.1stc.site/*` is routed to `public-site` by a repeatable,
 * additive step, and never by `wrangler.toml`.**
 *
 * THE CLOUDFLARE CLIENT IS A DOUBLE, on [[REQ-257]]'s reasoning: the real one
 * holds a credential that can rewrite the platform's DNS. The double keeps the
 * zone's state and records every write, so "re-running changes nothing" and
 * "never deletes" are assertions about calls that were or were not made.
 */

const ZONE_ID = 'zone-1stc'

function zone(status = 'active'): CloudflareZone {
  return {
    id: ZONE_ID,
    apex: '1stc.site',
    status,
    nameServers: ['ada.ns.cloudflare.com', 'bob.ns.cloudflare.com'],
    accountId: 'acct',
  }
}

interface Double {
  client: CloudflareClient
  records: DnsRecord[]
  routes: WorkerRoute[]
  writes: string[]
}

function double(state: { zones?: CloudflareZone[]; records?: DnsRecord[]; routes?: WorkerRoute[] } = {}): Double {
  const zones = state.zones ?? [zone()]
  const records = [...(state.records ?? [])]
  const routes = [...(state.routes ?? [])]
  const writes: string[] = []
  let seq = 0
  const refuse = (op: string) => async () => {
    writes.push(op)
    throw new Error(`${op} must never be called`)
  }
  const client: CloudflareClient = {
    accountId: async () => 'acct',
    listZones: async () => zones,
    readZone: async () => null,
    createZone: refuse('createZone'),
    deleteZone: refuse('deleteZone'),
    listRecords: async () => [...records],
    createRecord: async (_zone: string, spec: DnsRecordSpec) => {
      writes.push(`createRecord ${spec.type} ${spec.name}`)
      const record = { id: `rec-${(seq += 1)}`, ttl: 1, ...spec }
      records.push(record)
      return record
    },
    updateRecord: refuse('updateRecord'),
    deleteRecord: refuse('deleteRecord'),
    listRoutes: async () => [...routes],
    createRoute: async (_zone: string, pattern: string, script: string) => {
      writes.push(`createRoute ${pattern} ${script}`)
      const route = { id: `route-${(seq += 1)}`, pattern, script }
      routes.push(route)
      return route
    },
    deleteRoute: refuse('deleteRoute'),
  } as unknown as CloudflareClient
  return { client, records, routes, writes }
}

describe('REQ-394 — provisioning the platform route', () => {
  it('test_UAT_FC_REQ-394_provisioning_adds_a_proxied_wildcard_and_the_route_on_public_site', async () => {
    const cf = double({ routes: [{ id: 'customer', pattern: 'alice.example/*', script: PUBLIC_SITE_SCRIPT }] })
    const report = await provisionPlatformRoute(cf.client)

    expect(cf.writes).toEqual([
      `createRecord A ${PLATFORM_WILDCARD}`,
      `createRecord AAAA ${PLATFORM_WILDCARD}`,
      `createRoute *.1stc.site/* ${PUBLIC_SITE_SCRIPT}`,
    ])
    expect(cf.records.map((r) => [r.type, r.content, r.proxied])).toEqual([
      ['A', SERVING_IPV4, true],
      ['AAAA', SERVING_IPV6, true],
    ])
    // The customer route that was already there is untouched.
    expect(cf.routes.map((r) => r.pattern)).toEqual(['alice.example/*', '*.1stc.site/*'])
    expect(report.steps.every((s) => s.outcome === 'created')).toBe(true)
  })

  it('test_UAT_FC_REQ-394_provisioning_is_idempotent_and_never_deletes', async () => {
    const cf = double()
    await provisionPlatformRoute(cf.client)
    const firstWrites = cf.writes.length

    const again = await provisionPlatformRoute(cf.client)
    expect(cf.writes.length).toBe(firstWrites)
    expect(again.steps.every((s) => s.outcome === 'present')).toBe(true)
    expect(cf.writes.some((w) => w.startsWith('delete') || w.startsWith('update'))).toBe(false)

    // An existing proxied wildcard of any address type is enough and is left alone.
    const cname = double({
      records: [{ id: 'c', type: 'CNAME', name: PLATFORM_WILDCARD, content: 'x.example', ttl: 1, proxied: true }],
    })
    await provisionPlatformRoute(cname.client)
    expect(cname.writes).toEqual([`createRoute *.1stc.site/* ${PUBLIC_SITE_SCRIPT}`])
  })

  it('test_UAT_FC_REQ-394_dry_run_writes_nothing', async () => {
    const cf = double()
    const report = await provisionPlatformRoute(cf.client, { dryRun: true })
    expect(cf.writes).toEqual([])
    expect(report.steps.map((s) => s.outcome)).toEqual(['would-create', 'would-create', 'would-create'])
  })

  it('test_UAT_FC_REQ-394_provisioning_refuses_a_missing_or_undelegated_zone_naming_it', async () => {
    await expect(provisionPlatformRoute(double({ zones: [] }).client)).rejects.toThrow(/1stc\.site.*not a zone/)
    const pending = double({ zones: [zone('pending')] })
    await expect(provisionPlatformRoute(pending.client)).rejects.toThrow(
      /1stc\.site.*pending.*ada\.ns\.cloudflare\.com/,
    )
    expect(pending.writes).toEqual([])
  })

  it('test_UAT_FC_REQ-394_provisioning_refuses_rather_than_replaces_what_it_did_not_write', async () => {
    const unproxied = double({
      records: [{ id: 'a', type: 'A', name: PLATFORM_WILDCARD, content: '203.0.113.9', ttl: 1, proxied: false }],
    })
    await expect(provisionPlatformRoute(unproxied.client)).rejects.toBeInstanceOf(PlatformRouteError)
    expect(unproxied.writes).toEqual([])

    const elsewhere = double({ routes: [{ id: 'r', pattern: '*.1stc.site/*', script: 'someone-else' }] })
    await expect(provisionPlatformRoute(elsewhere.client)).rejects.toThrow(/someone-else/)
    expect(elsewhere.writes.filter((w) => w.startsWith('createRoute') || w.startsWith('delete'))).toEqual([])
  })

  it('test_UAT_FC_REQ-394_wrangler_toml_declares_no_platform_zone_route', () => {
    // The route lives in Cloudflare, not in config: a zone route in
    // wrangler.toml would make every deploy delete runtime customer routes.
    const toml = readFileSync(new URL('../apps/public-site/wrangler.toml', import.meta.url), 'utf8')
    const routeLines = toml.split('\n').filter((line) => /pattern\s*=/.test(line))
    expect(routeLines.length).toBeGreaterThan(0)
    for (const line of routeLines) expect(line).toMatch(/custom_domain\s*=\s*true/)
    expect(routeLines.some((line) => line.includes('1stc.site'))).toBe(false)
  })
})
