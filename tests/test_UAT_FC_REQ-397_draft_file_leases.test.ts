import { describe, expect, it } from 'vitest'
import { l1Operations } from '../tools/generate/src/cli/ai/toolbox-core'
import { draftClaims, scopeFiles } from '../tools/generate/src/cli/ai/lease-core'
import { delegationMethod, delegationReminder } from '../tools/generate/src/cli/ai/roles'
import {
  DEFAULT_LEASE_IDLE_SECONDS,
  DEFAULT_MAX_CONCURRENT,
  DelegationConfigError,
  delegationDocument,
  delegationFromMapping,
} from '../tools/generate/src/cli/ai/delegation'
import { starterHomePage } from '../tools/generate/src/cli/scaffold'
import { leasedStore } from '../tools/generate/src/store/leased-store'
import { asWriter, CLIENT_HOLDER, DraftFileRefusal, memoryLeases, type DraftLeases } from '../tools/generate/src/store/leases'
import type { SiteStore } from '../tools/generate/src/store/site-store'
import { makeMemorySite, type SiteFixture } from './support/site-factory'

/**
 * [[REQ-397]] — **one agent per draft file at a time.**
 *
 * A builder session holds a leased lock on each draft file it declared; a write
 * to a file it does not hold is refused, and so is a claim on a file somebody
 * else holds. The consultant's and the client's own writes respect the same
 * leases, and every draft write is compare-and-set per file.
 *
 * WHAT MAKES THIS EVIDENCE. Every write goes through the L1 surface's REAL
 * operations (`l1Operations` — what the `set_l1` / `decompose_page` tools run)
 * over a real store wrapped by the real lease decorator; every claim goes
 * through the host's real `claim` hook (`draftClaims`), the function the
 * framework calls before a worker opens. Nothing is mocked but the clock.
 */

const WORKER_A = 'worker-builder-aaaa'
const WORKER_B = 'worker-builder-bbbb'
const CONSULTANT = 'site-acme'
const IDLE = 5 * 60_000

/** A page whose root stacks two sections, so it can be stored as sections. */
function twoSectionPage(): Record<string, unknown> {
  const page = starterHomePage('acme') as Record<string, unknown>
  ;(page.l1 as Record<string, unknown>).root = {
    kind: 'container',
    id: 'root',
    layout: 'stack',
    children: [
      { kind: 'text', id: 'hero', text: 'Hero words', axes: { fontSizePx: 32 } },
      { kind: 'text', id: 'story', text: 'Story words', axes: { fontSizePx: 16 } },
    ],
  }
  page.modules = []
  return page
}

interface Fixture {
  site: SiteFixture
  store: SiteStore
  leases: DraftLeases
  clock: { t: number }
  ops: ReturnType<typeof l1Operations>
  claims: NonNullable<ReturnType<typeof draftClaims>>
}

/** A leased site with `home` stored as two sections, and a clock the case moves. */
async function fixture(): Promise<Fixture> {
  const clock = { t: Date.parse('2026-10-15T14:02:00Z') }
  const site = makeMemorySite({ pages: { 'home.json': twoSectionPage() } })
  const leases = memoryLeases(() => clock.t)
  const store = leasedStore(site.store, leases)
  const ops = l1Operations(site.slug, { ...site.opts, store })
  await ops.decompose_page({ page: 'home' })
  const claims = draftClaims(store, site.slug, IDLE)!
  return { site, store, leases, clock, ops, claims }
}

const textOf = async (f: Fixture, section: string): Promise<string> => {
  const page = (await f.site.store.readPages(f.site.slug))[0].page as {
    l1: { root: { children: Array<{ id: string; text: string }> } }
  }
  return page.l1.root.children.find((c) => c.id === section)!.text
}

const setText = (f: Fixture, section: string, text: string) =>
  f.ops.set_l1({ page: 'home', section, path: '0', node: { kind: 'text', id: section, text, axes: { fontSizePx: 16 } } })

async function refusal(work: Promise<unknown>): Promise<DraftFileRefusal> {
  const err = await work.then(
    () => null,
    (e: unknown) => e,
  )
  expect(err, 'the write was expected to be refused').toBeInstanceOf(DraftFileRefusal)
  return err as DraftFileRefusal
}

describe('REQ-397 builder sessions hold leases on the draft files they declared', () => {
  it('test_UAT_FC_REQ-397_a_second_claim_on_a_held_file_is_refused_naming_the_file_the_holder_and_how_long', async () => {
    const f = await fixture()
    await f.claims.claim(['home.json#hero'], { workerSid: WORKER_A })
    f.clock.t += 3 * 60_000

    const err = await f.claims.claim(['home.json#story', 'home.json#hero'], { workerSid: WORKER_B }).then(
      () => null,
      (e: Error) => e,
    )
    expect(err?.message).toContain('`home.json#hero`')
    expect(err?.message).toContain(`builder ${WORKER_A}`)
    expect(err?.message).toContain('since 14:02 UTC (3 min)')
    expect(err?.message).toContain('this builder was not started')
    // ALL OR NOTHING: the free file in the refused set was not taken either.
    expect((await f.leases.held(f.site.slug)).map((l) => [l.file, l.holder])).toEqual([
      ['home.json#hero', WORKER_A],
    ])
  })

  it('test_UAT_FC_REQ-397_a_builder_writing_outside_its_scope_is_refused_even_when_nothing_else_runs', async () => {
    const f = await fixture()
    await f.claims.claim(['home.json#story'], { workerSid: WORKER_A })

    const err = await refusal(f.claims.worker(WORKER_A)(() => setText(f, 'hero', 'Builder wrote here')))
    expect(err.code).toBe('NOT_IN_SCOPE')
    expect(err.message).toContain("`home.json#hero` is not in this session's scope (home.json#story)")
    expect(await textOf(f, 'hero')).toBe('Hero words')

    // Its own file is written.
    await f.claims.worker(WORKER_A)(() => setText(f, 'story', 'Builder story'))
    expect(await textOf(f, 'story')).toBe('Builder story')
  })

  it('test_UAT_FC_REQ-397_two_builders_on_different_sections_both_write', async () => {
    const f = await fixture()
    await f.claims.claim(['home.json#hero'], { workerSid: WORKER_A })
    await f.claims.claim(['home.json#story'], { workerSid: WORKER_B })

    await Promise.all([
      f.claims.worker(WORKER_A)(() => setText(f, 'hero', 'A wrote the hero')),
      f.claims.worker(WORKER_B)(() => setText(f, 'story', 'B wrote the story')),
    ])
    expect(await textOf(f, 'hero')).toBe('A wrote the hero')
    expect(await textOf(f, 'story')).toBe('B wrote the story')
  })

  it('test_UAT_FC_REQ-397_the_consultant_and_the_client_are_refused_on_a_builder_held_file_and_write_free_ones', async () => {
    const f = await fixture()
    await f.claims.claim(['home.json#hero'], { workerSid: WORKER_A })

    const consultant = await refusal(f.claims.consultant(CONSULTANT)(() => setText(f, 'hero', 'Consultant')))
    expect(consultant.code).toBe('FILE_HELD')
    expect(consultant.message).toContain(`\`home.json#hero\` is held by builder ${WORKER_A} since 14:02 UTC`)

    const client = await refusal(asWriter({ holder: CLIENT_HOLDER, scope: null }, () => setText(f, 'hero', 'Client')))
    expect(client.holder).toBe(WORKER_A)
    expect(await textOf(f, 'hero')).toBe('Hero words')

    // A file nobody holds is written, and the implicit lease ends with the write.
    await f.claims.consultant(CONSULTANT)(() => setText(f, 'story', 'Consultant story'))
    expect(await textOf(f, 'story')).toBe('Consultant story')
    expect((await f.leases.held(f.site.slug)).map((l) => l.file)).toEqual(['home.json#hero'])
  })

  it('test_UAT_FC_REQ-397_a_dead_sessions_lease_expires_and_the_file_is_reclaimable', async () => {
    const f = await fixture()
    await f.claims.claim(['home.json#hero'], { workerSid: WORKER_A })
    // Acting renews: four minutes, a write, four more minutes — still held.
    f.clock.t += 4 * 60_000
    await f.claims.worker(WORKER_A)(() => setText(f, 'hero', 'Still working'))
    f.clock.t += 4 * 60_000
    await expect(f.claims.claim(['home.json#hero'], { workerSid: WORKER_B })).rejects.toThrow(/is held by/)

    // The session goes quiet past the idle period: its file is free again.
    f.clock.t += IDLE
    await f.claims.claim(['home.json#hero'], { workerSid: WORKER_B })
    expect((await f.leases.held(f.site.slug)).map((l) => l.holder)).toEqual([WORKER_B])
  })

  it('test_UAT_FC_REQ-397_release_frees_every_file_the_builder_held', async () => {
    const f = await fixture()
    const release = await f.claims.claim(['home.json'], { workerSid: WORKER_A })
    expect((await f.leases.held(f.site.slug)).map((l) => l.file)).toEqual([
      'home.json',
      'home.json#hero',
      'home.json#story',
    ])
    await release()
    expect(await f.leases.held(f.site.slug)).toEqual([])
    await f.claims.claim(['home.json#story'], { workerSid: WORKER_B })
  })

  it('test_UAT_FC_REQ-397_naming_a_page_claims_its_sections_and_a_non_file_name_is_refused', async () => {
    const f = await fixture()
    expect(await scopeFiles(f.store, f.site.slug, ['home.json', 'site.json'])).toEqual([
      'home.json',
      'home.json#hero',
      'home.json#story',
      'site.json',
    ])
    await expect(scopeFiles(f.store, f.site.slug, ['home/hero'])).rejects.toThrow(
      "'home/hero' is not a draft file name. Files are site.json, a page (home.json), a section (home.json#hero)",
    )
  })

  it('test_UAT_FC_REQ-397_a_builder_holds_a_section_it_creates', async () => {
    const f = await fixture()
    await f.claims.claim(['home.json'], { workerSid: WORKER_A })
    await f.claims.worker(WORKER_A)(() =>
      f.ops.add_section({ page: 'home', node: { kind: 'text', id: 'faq', text: 'Questions', axes: { fontSizePx: 16 } } }),
    )
    expect((await f.leases.held(f.site.slug)).filter((l) => l.file === 'home.json#faq').map((l) => l.holder)).toEqual([
      WORKER_A,
    ])
    await expect(f.claims.claim(['home.json#faq'], { workerSid: WORKER_B })).rejects.toThrow(/is held by/)
  })
})

describe('REQ-397 every draft write is compare-and-set per file', () => {
  it('test_UAT_FC_REQ-397_a_write_that_lost_a_race_on_its_own_file_is_refused_not_silently_won', async () => {
    const f = await fixture()
    // The client reads the hero, the consultant writes it, then the client's
    // write — computed from the stale read — arrives.
    const err = await refusal(
      asWriter({ holder: CLIENT_HOLDER, scope: null }, async () => {
        await f.store.readPages(f.site.slug)
        await f.claims.consultant(CONSULTANT)(() => setText(f, 'hero', 'Consultant got there first'))
        await f.store.write(f.site.slug, {
          sections: [{ page: 'home.json', id: 'hero', unit: { node: { kind: 'text', id: 'hero', text: 'Stale', axes: { fontSizePx: 16 } } } }],
        })
      }),
    )
    expect(err.code).toBe('FILE_CHANGED')
    expect(err.message).toContain('`home.json#hero` changed after this call read it')
    expect(await textOf(f, 'hero')).toBe('Consultant got there first')
  })

  it('test_UAT_FC_REQ-397_a_write_to_another_file_in_between_is_not_a_conflict', async () => {
    const f = await fixture()
    await asWriter({ holder: CLIENT_HOLDER, scope: null }, async () => {
      await f.store.readPages(f.site.slug)
      await f.claims.consultant(CONSULTANT)(() => setText(f, 'story', 'Consultant story'))
      await f.store.write(f.site.slug, {
        sections: [{ page: 'home.json', id: 'hero', unit: { node: { kind: 'text', id: 'hero', text: 'Client hero', axes: { fontSizePx: 16 } } } }],
      })
    })
    expect(await textOf(f, 'hero')).toBe('Client hero')
    expect(await textOf(f, 'story')).toBe('Consultant story')
  })
})

describe('REQ-397 the consultant is told what may run at once', () => {
  it('test_UAT_FC_REQ-397_priming_says_one_at_a_time_until_concurrency_is_installed_then_states_the_overlap_rules', () => {
    // No scoped builders (a framework without REQ-207): today's words exactly.
    const before = delegationMethod(true, false, false, 3)!
    expect(before).toContain('Builders run one at a time.')
    expect(before).not.toContain('scope')
    expect(delegationReminder(true, false, false, 3)).toMatch(/Builders run one at a time, never in parallel\.$/)

    // Scoped builders, no concurrency: files and decomposition taught, still one at a time.
    const scoped = delegationMethod(true, false, true, 1)!
    expect(scoped).toContain('Every builder names the files it will write, in `scope`')
    expect(scoped).toContain('`home.json#hero`')
    expect(scoped).toContain('`decompose_page`')
    expect(scoped).toContain('Builders run one at a time.')
    expect(scoped).not.toContain('builders run at once')
    expect(delegationReminder(true, false, true, 1)).toContain('Builders run one at a time, never in parallel.')

    // Concurrency installed: the cap and exactly what may overlap.
    const parallel = delegationMethod(true, false, true, 3)!
    expect(parallel).toContain('Up to 3 builders run at once.')
    expect(parallel).toContain('never two on the same file')
    expect(parallel).toContain('a builder on `site.json` always alone')
    expect(parallel).toContain('Never tell your\nclient that work runs in parallel unless you commissioned it that way')
    expect(parallel).not.toContain('Builders run one at a time.')
    expect(delegationReminder(true, false, true, 3)).toContain('up to 3 run at once, only on different files')
  })

  it('test_UAT_FC_REQ-397_delegation_json_sets_the_concurrency_cap_and_the_lease_idle_period', () => {
    const shipped = delegationFromMapping(delegationDocument)
    expect(shipped.maxConcurrent).toBe(3)
    expect(shipped.leaseIdleSeconds).toBe(300)
    const absent = delegationFromMapping({ enabled: true })
    expect([absent.maxConcurrent, absent.leaseIdleSeconds]).toEqual([DEFAULT_MAX_CONCURRENT, DEFAULT_LEASE_IDLE_SECONDS])
    expect(delegationFromMapping({ enabled: true, max_concurrent: 1 }).maxConcurrent).toBe(1)
    expect(() => delegationFromMapping({ enabled: true, max_concurrent: 0 })).toThrow(DelegationConfigError)
    expect(() => delegationFromMapping({ enabled: true, lease_idle_seconds: -5 })).toThrow(DelegationConfigError)
  })
})
