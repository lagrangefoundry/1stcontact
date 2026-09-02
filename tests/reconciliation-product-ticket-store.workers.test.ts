import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { Accessor, MultiTenantTicketStore } from '../apps/control-app/src/generated/ticketing'
import {
  BlobsNotConfiguredError,
  TenantNotConfiguredError,
  productTypePack,
  ticketStoreFor,
  type TicketStoreEnv,
} from '../apps/control-app/src/tickets'
import { applySchema } from './support/d1-site-factory'
import { d1r2SiteStore } from '../tools/generate/src/store/d1r2-store'
import type { SiteStoreEnv } from '../tools/generate/src/store/d1r2-store'

/**
 * story-ab1ecd62 — **the product ticket store, in the runtime it is deployed to**.
 *
 * Every assertion below runs inside workerd, against a real D1 database and a
 * real R2 bucket, through the same `ticketStoreFor` the Worker itself calls. The
 * tables come from `db/migrations` applied in the order the deployment declares,
 * by the same helper the site-store suites use — so what is proved here is the
 * schema that will be deployed rather than a fixture's approximation of it.
 *
 * THE ACCOUNT BARRIER IS ASSERTED AGAIN HERE, not argued from the site store's.
 * Several claims in this file rhyme with claims already made about the site store
 * — one account per handle, no operation taking an account, an unusable account
 * refused when the handle is asked for. They are claims about different rows in
 * different tables, and a proof about `sites` says nothing about `tickets`.
 */

const ACCOUNT_A = 'story-ab1ecd62-a'
const ACCOUNT_B = 'story-ab1ecd62-b'

/** The Worker's own bindings, as a ticket-store env. */
function ticketEnv(overrides: Partial<TicketStoreEnv> = {}): TicketStoreEnv {
  return {
    DB: env.DB as D1Database,
    BLOBS: env.BLOBS as R2Bucket,
    TENANT_ID: ACCOUNT_A,
    ...overrides,
  }
}

/** The `material` shape [[DOC-38]] §9 requires, stated once. */
function material(over: Record<string, unknown> = {}) {
  return {
    rights: 'owned',
    republishable: true,
    exportable: false,
    origin: 'uploaded',
    kind: 'document',
    ...over,
  }
}

/**
 * A database handle that cannot be used without saying so.
 *
 * The construction-time refusals below claim more than "it throws": they claim
 * the refusal happens BEFORE any operation is attempted. An assertion on the
 * error type alone cannot tell a refusal raised up front from one raised after a
 * read that happened to fail. This one can — any touch at all raises a different
 * error, and the named-error assertion then fails.
 */
function untouchableDb(): D1Database {
  return new Proxy(
    {},
    {
      get(_target, prop) {
        throw new Error(`the database was touched before the refusal: ${String(prop)}`)
      },
    },
  ) as D1Database
}

/** Every column name on a table, as the database itself reports them. */
async function columnsOf(table: string): Promise<string[]> {
  const { results } = await env.DB.prepare(`PRAGMA table_info(${table})`).all<{ name: string }>()
  return (results ?? []).map((r) => r.name)
}

beforeAll(async () => {
  await applySchema()
})

describe('story-ab1ecd62 — the schema step and the registry it reconciles', () => {
  it('test_UAT_AC1478_one_registry_serves_both_stores_and_carries_the_ticket_store_field', async () => {
    // ── one registry, not two ────────────────────────────────────────────────
    // A rival registry is the failure this AC exists to exclude: two places for
    // one fact that could disagree about whether an account is suspended.
    const { results } = await env.DB.prepare(
      "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name",
    ).all<{ name: string }>()
    const tables = (results ?? []).map((r) => r.name)
    expect(tables).toContain('tenants')
    expect(
      tables.filter((n) => /tenant|account/i.test(n)),
      'exactly one account registry exists, and both stores answer to it',
    ).toEqual(['tenants'])

    // ── it carries the field the ticket store writes ─────────────────────────
    // `0001_site_store.sql` created `tenants` without `config`, and the
    // component's own CREATE is `IF NOT EXISTS` — so it sees that table and
    // leaves it alone. The ALTER in `0003` is what closes the gap.
    expect(await columnsOf('tenants')).toEqual(
      expect.arrayContaining(['id', 'name', 'status', 'created_at', 'config']),
    )

    // ── a row the SITE store wrote carries a usable value, not nothing ───────
    const shared = 'story-ab1ecd62-shared'
    await d1r2SiteStore(env as unknown as SiteStoreEnv).createTenant({ id: shared, name: shared })
    const before = await env.DB.prepare('SELECT config, status FROM tenants WHERE id = ?')
      .bind(shared)
      .first<{ config: string; status: string }>()
    expect(before?.config, 'a row written without `config` still reads back usable').toBe('{}')

    // ── and the ticket store answers to that same row ────────────────────────
    // It finds the account the site store registered rather than adding its own:
    // one row before, one row after.
    const store = await ticketStoreFor(ticketEnv({ TENANT_ID: shared }))
    const { ticket } = await store.create({
      type: 'material',
      title: 'Written against the shared registry',
      fields: material(),
    })
    expect(ticket.uid).toBeTruthy()
    const rows = await env.DB.prepare('SELECT COUNT(*) AS n FROM tenants WHERE id = ?')
      .bind(shared)
      .first<{ n: number }>()
    expect(rows?.n, 'the ticket store did not add a rival row for the same account').toBe(1)

    // ── the first registration through the ticket store succeeds ─────────────
    // Without the ALTER this is where the story ends: `putTenant` INSERTs
    // `config`, and a registry lacking the column fails with `no such column`
    // against a schema step that appeared to apply cleanly.
    const fresh = 'story-ab1ecd62-first-registration'
    const firstStore = await ticketStoreFor(ticketEnv({ TENANT_ID: fresh }))
    const { ticket: firstTicket } = await firstStore.create({
      type: 'brief',
      title: 'First registration',
      fields: { site_slug: 'home' },
      body: 'It registered, and the row took a config value.',
    })
    expect(firstTicket.uid).toBeTruthy()
    const registered = await env.DB.prepare('SELECT config FROM tenants WHERE id = ?')
      .bind(fresh)
      .first<{ config: string }>()
    expect(registered?.config).toBeTruthy()
  })

  it('test_UAT_AC1479_a_ticket_created_through_the_wiring_reads_back_through_a_second_handle', async () => {
    // The acceptance in its plainest form, in the runtime the Worker is deployed
    // to: the migration applied, the account registered itself, the pack
    // validated, D1 took the row.
    const store = await ticketStoreFor(ticketEnv())
    const { ticket } = await store.create({
      type: 'material',
      title: 'Brand guidelines',
      fields: material(),
      body: 'The palette is oxblood and bone.',
    })
    expect(ticket.uid).toBeTruthy()

    // A SECOND, independently obtained handle — not the one that wrote. A round
    // trip through a single instance would pass with an in-memory cache and no
    // working schema at all.
    const fresh = await ticketStoreFor(ticketEnv())
    expect(fresh, 'the reader is a different handle from the writer').not.toBe(store)
    const { ticket: read } = await fresh.get({ uid: ticket.uid })
    expect(read.uid).toBe(ticket.uid)
    expect(read.type).toBe('material')
    expect(read.title).toBe('Brand guidelines')
    expect(read.fields).toMatchObject(material())
    expect(read.body).toBe('The palette is oxblood and bone.')
  })

  it('test_UAT_AC1480_the_configured_account_is_registered_on_demand_and_a_recorded_one_keeps_its_status', async () => {
    // ── a migrated-but-unregistered database is not a dead builder ───────────
    const unseen = 'story-ab1ecd62-never-seen'
    const before = await env.DB.prepare('SELECT COUNT(*) AS n FROM tenants').first<{ n: number }>()
    const store = await ticketStoreFor(ticketEnv({ TENANT_ID: unseen }))
    const { ticket } = await store.create({
      type: 'brief',
      title: 'Decisions',
      fields: { site_slug: 'home' },
      body: 'Ship the one-pager first.',
    })
    const { ticket: read } = await store.get({ uid: ticket.uid })
    expect(read.title).toBe('Decisions')

    // ── exactly one account was added, and it is the configured one ─────────
    const after = await env.DB.prepare('SELECT COUNT(*) AS n FROM tenants').first<{ n: number }>()
    expect(after!.n - before!.n).toBe(1)
    const row = await env.DB.prepare('SELECT id, status FROM tenants WHERE id = ?')
      .bind(unseen)
      .first<{ id: string; status: string }>()
    expect(row?.id).toBe(unseen)
    expect(row?.status).toBe('active')

    // ── an account already recorded is left exactly as it stands ────────────
    // The registration write is an UPSERT that overwrites status, so an
    // unconditional one would reactivate a suspended account on the next
    // request — turning account suspension into a suggestion.
    await env.DB.prepare('UPDATE tenants SET status = ? WHERE id = ?').bind('deactivated', unseen).run()
    await expect(
      ticketStoreFor(ticketEnv({ TENANT_ID: unseen })),
      'a deactivated account is refused, not served',
    ).rejects.toMatchObject({ code: 'validation' })
    const afterAttempt = await env.DB.prepare('SELECT status FROM tenants WHERE id = ?')
      .bind(unseen)
      .first<{ status: string }>()
    expect(afterAttempt?.status, 'the attempt did not reactivate a deactivated account').toBe(
      'deactivated',
    )
  })
})

describe('story-ab1ecd62 — the wiring point refuses a deployment it cannot serve', () => {
  it('test_UAT_AC1481_a_deployment_that_names_no_account_is_refused_when_the_store_is_built', async () => {
    // Absent, empty, and whitespace-only are one claim with three spellings —
    // a var declared and left blank is the shape a half-finished deploy takes.
    for (const TENANT_ID of [undefined, '', '   ', '\t\n']) {
      const attempt = ticketStoreFor(ticketEnv({ TENANT_ID, DB: untouchableDb() }))
      // The database is untouchable, so this rejecting with the NAMED error is
      // also the evidence that nothing was created, read or written: any access
      // at all would surface as a different error.
      await expect(attempt, `TENANT_ID=${JSON.stringify(TENANT_ID)}`).rejects.toBeInstanceOf(
        TenantNotConfiguredError,
      )
      await expect(attempt).rejects.toMatchObject({ name: 'TenantNotConfiguredError' })
    }

    // A distinct, named error a program can branch on — and it is not the other
    // refusal wearing a different message.
    expect(new TenantNotConfiguredError()).not.toBeInstanceOf(BlobsNotConfiguredError)

    // The message identifies the missing configuration, says this deployment
    // serves exactly one account and cannot infer which, and names BOTH
    // declaration sites — a named environment inherits neither.
    const message = new TenantNotConfiguredError().message
    expect(message).toContain('TENANT_ID')
    expect(message).toMatch(/serves one tenant and cannot\s+infer which/)
    expect(message).toContain('[vars]')
    expect(message).toContain('[env.production.vars]')
    expect(message).toContain('does not inherit')
  })

  it('test_UAT_AC1482_a_deployment_with_nowhere_to_put_attachment_bytes_is_refused_when_the_store_is_built', async () => {
    // Refused when the store is OBTAINED, before any operation is attempted —
    // including operations that would never touch bytes. The untouchable
    // database is what makes "before" observable rather than asserted.
    const attempt = ticketStoreFor(ticketEnv({ BLOBS: undefined, DB: untouchableDb() }))
    await expect(attempt).rejects.toBeInstanceOf(BlobsNotConfiguredError)
    await expect(attempt).rejects.toMatchObject({ name: 'BlobsNotConfiguredError' })

    // Distinct from the missing-account refusal, and in the same shape.
    expect(new BlobsNotConfiguredError()).not.toBeInstanceOf(TenantNotConfiguredError)
    const message = new BlobsNotConfiguredError().message
    expect(message).toContain('BLOBS')
    expect(message).toContain('no home for')
    expect(message).toContain('[[r2_buckets]]')
    expect(message).toContain('[[env.production.r2_buckets]]')
    expect(message).toContain('does not inherit')
    expect(message).toMatch(/bucket of its own/)
    expect(message).toContain('1stcontact-sites')

    // ── and the component's own policy is NOT changed ───────────────────────
    // This refusal is this platform's decision, taken at its wiring layer. The
    // component deliberately treats attachments as an optional capability and
    // refuses them at first use, which is correct for a general component that
    // cannot know whether its host has bytes to store — so a store built the
    // component's way, without blobs, still constructs and still serves records.
    const account = 'story-ab1ecd62-component-policy'
    const base = new MultiTenantTicketStore(new Accessor(env.DB), productTypePack())
    await base.registerTenant({ id: account, name: account })
    const componentStore = await base.forTenant(account)
    const { ticket } = await componentStore.create({
      type: 'material',
      title: 'A record with no bytes',
      fields: material(),
    })
    expect(ticket.uid).toBeTruthy()
    await expect(
      componentStore.attach({ uid: ticket.uid, bytes: new TextEncoder().encode('x') }),
      'upstream refuses attachments at first call, not at construction',
    ).rejects.toMatchObject({ code: 'validation' })
  })
})

describe('story-ab1ecd62 — the account barrier on ticket rows', () => {
  it('test_UAT_AC1483_a_handle_sees_only_its_own_accounts_tickets_on_reads_and_listings', async () => {
    const a = await ticketStoreFor(ticketEnv({ TENANT_ID: ACCOUNT_A }))
    const b = await ticketStoreFor(ticketEnv({ TENANT_ID: ACCOUNT_B }))

    const { ticket } = await a.create({
      type: 'material',
      title: 'A private paper',
      fields: material(),
    })

    // ── fetch by identifier: not found, never a distinct refusal ────────────
    // The same answer an identifier that was never minted receives, so the
    // existence of another account's ticket is not disclosed even as an error.
    await expect(b.get({ uid: ticket.uid })).rejects.toMatchObject({ code: 'not_found' })
    await expect(b.get({ uid: 'ticket-never-minted' })).rejects.toMatchObject({
      code: 'not_found',
    })

    // ── and absent from listings, which a fetch-time guard alone would miss ──
    // A fetch takes an identifier the caller had to obtain somehow; a listing is
    // handed out freely and would enumerate the barrier away.
    const { tickets: queried } = await b.query({ predicate: 'type=material', limit: 'all' })
    expect(queried.map((t) => t.uid)).not.toContain(ticket.uid)
    const { tickets: listed } = await b.list({ limit: 'all' })
    expect(listed.map((t) => t.uid)).not.toContain(ticket.uid)

    // Non-vacuity: the ticket is real and its own account's handle can see it
    // on both paths, so the absences above are the barrier and not an empty
    // table.
    const { tickets: own } = await a.query({ predicate: 'type=material', limit: 'all' })
    expect(own.map((t) => t.uid)).toContain(ticket.uid)

    // ── no operation takes an account as an argument ────────────────────────
    // There is no call site at which the wrong one could be supplied: supplying
    // one anyway is inert, and the scoped handle exposes no way to re-scope, so
    // holding one account's store conveys no reach into another's.
    const surface = b as unknown as Record<string, unknown>
    for (const escape of ['forTenant', 'registerTenant', 'listTenants']) {
      expect(surface[escape], `a scoped handle must not expose ${escape}`).toBeUndefined()
    }
    await expect(
      (b.get as (a: Record<string, unknown>) => Promise<unknown>)({
        uid: ticket.uid,
        tenant_id: ACCOUNT_A,
      }),
    ).rejects.toMatchObject({ code: 'not_found' })
  })

  it('test_UAT_AC1484_a_write_aimed_at_another_accounts_ticket_is_refused_and_the_target_is_unchanged', async () => {
    const a = await ticketStoreFor(ticketEnv({ TENANT_ID: ACCOUNT_A }))
    const b = await ticketStoreFor(ticketEnv({ TENANT_ID: ACCOUNT_B }))

    const { ticket } = await a.create({
      type: 'material',
      title: 'Untouched',
      fields: material({ kind: 'image' }),
      body: 'As written.',
    })

    // Not found — disclosing no more than a read would.
    await expect(
      b.update({ uid: ticket.uid, patch: { title: 'Overwritten' } }),
    ).rejects.toMatchObject({ code: 'not_found' })

    // Asserted, not assumed: the target is re-read through a handle for its own
    // account. A refusal is a refusal, not a write that landed somewhere else or
    // a partial application rolled back inconsistently.
    const { ticket: after } = await a.get({ uid: ticket.uid })
    expect(after.title).toBe('Untouched')
    expect(after.body).toBe('As written.')
    expect(after.fields).toMatchObject(material({ kind: 'image' }))
    expect(after.version).toBe(ticket.version)

    // And the attempt produced nothing in the attempting account's own material.
    const { tickets: attackers } = await b.list({ limit: 'all' })
    expect(attackers).toEqual([])
  })
})
