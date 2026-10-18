import { describe, expect, it } from 'vitest'
import { l1Operations } from '../tools/generate/src/cli/ai/toolbox-core'
import { draftClaims, scopeFiles } from '../tools/generate/src/cli/ai/lease-core'
import { delegationMethod } from '../tools/generate/src/cli/ai/roles'
import { starterHomePage } from '../tools/generate/src/cli/scaffold'
import { leasedStore } from '../tools/generate/src/store/leased-store'
import { asWriter, CLIENT_HOLDER, DraftFileRefusal, memoryLeases, type DraftLeases } from '../tools/generate/src/store/leases'
import type { SiteStore } from '../tools/generate/src/store/site-store'
import { makeMemorySite, type SiteFixture } from './support/site-factory'

/**
 * [[REQ-406]] — **a page's style is claimed only when it is named.**
 *
 * Page style — the L1 document keys other than `root`: background, text
 * colour, widths, fonts (`resources`), column — is its own draft file,
 * `home.json#style`. A builder scoped to a page holds the page's body and its
 * sections, not its style, so "work on the home page" can no longer repaint the
 * whole page to fix one section (BUG-219, gap 2). The refusal comes before
 * anything is written and says to fill the section's own box instead.
 *
 * WHAT MAKES THIS EVIDENCE. As REQ-397's: every write goes through the L1
 * surface's real operations (`set_page_style`, `use_font`, `set_l1`) over a real
 * store wrapped by the real lease decorator, and every claim through the host's
 * real `claim` hook. Nothing is mocked but the clock.
 */

const WORKER_A = 'worker-builder-aaaa'
const WORKER_B = 'worker-builder-bbbb'
const IDLE = 5 * 60_000

/** A page whose root stacks a coloured header box and some words. */
function page(): Record<string, unknown> {
  const home = starterHomePage('acme') as Record<string, unknown>
  ;(home.l1 as Record<string, unknown>).root = {
    kind: 'container',
    id: 'root',
    layout: 'stack',
    children: [
      { kind: 'container', id: 'header', layout: 'stack', axes: { surfaceFill: '#ffffff' }, children: [] },
      { kind: 'text', id: 'story', text: 'Story words', axes: { fontSizePx: 16 } },
    ],
  }
  return home
}

interface Fixture {
  site: SiteFixture
  store: SiteStore
  leases: DraftLeases
  ops: ReturnType<typeof l1Operations>
  claims: NonNullable<ReturnType<typeof draftClaims>>
}

async function fixture(decomposed = false): Promise<Fixture> {
  const clock = { t: Date.parse('2026-10-17T14:02:00Z') }
  const site = makeMemorySite({ pages: { 'home.json': page() } })
  const leases = memoryLeases(() => clock.t)
  const store = leasedStore(site.store, leases)
  const ops = l1Operations(site.slug, { ...site.opts, store })
  if (decomposed) await ops.decompose_page({ page: 'home' })
  return { site, store, leases, ops, claims: draftClaims(store, site.slug, IDLE)! }
}

/** The draft exactly as stored, to prove a refused write wrote nothing. */
const stored = async (f: Fixture): Promise<string> => JSON.stringify(await f.site.store.readPages(f.site.slug))

const home = async (f: Fixture) =>
  (await f.site.store.readPages(f.site.slug)).find((p) => p.name === 'home.json')!.page as {
    l1: Record<string, unknown> & { root: { children: Array<{ id: string; axes?: { surfaceFill?: string } }> } }
  }

async function refusal(work: Promise<unknown>): Promise<DraftFileRefusal> {
  const err = await work.then(
    () => null,
    (e: unknown) => e,
  )
  expect(err, 'the write was expected to be refused').toBeInstanceOf(DraftFileRefusal)
  return err as DraftFileRefusal
}

const repaint = (f: Fixture) => f.ops.set_page_style({ page: 'home', style: { background: '#112233' } })

describe('REQ-406 naming a page does not claim its style', () => {
  it('test_UAT_FC_REQ-406_a_builder_scoped_to_a_page_cannot_repaint_it_and_nothing_is_written', async () => {
    const f = await fixture()
    await f.claims.claim(['home.json'], { workerSid: WORKER_A })
    const before = await stored(f)

    const err = await refusal(f.claims.worker(WORKER_A)(() => repaint(f)))
    expect(err.code).toBe('NOT_IN_SCOPE')
    expect(err.file).toBe('home.json#style')
    expect(err.message).toContain('This changes the page style of `home.json` (`background`)')
    expect(err.message).toContain('nothing was written')
    expect(err.message).toContain("To colour one section, fill that section's own box.")
    expect(err.message).toContain('Ask for `home.json#style` only when the brief changes the page itself.')
    expect(await stored(f)).toBe(before)

    // `use_font` writes `resources`, a style key, and is refused the same way.
    const font = await refusal(f.claims.worker(WORKER_A)(() => f.ops.use_font({ family: 'ABeeZee', page: 'home' })))
    expect(font.code).toBe('NOT_IN_SCOPE')
    expect(font.message).toContain('(`resources`)')
    expect(await stored(f)).toBe(before)
  })

  it('test_UAT_FC_REQ-406_the_same_builder_colours_its_section_by_filling_the_sections_own_box', async () => {
    const f = await fixture()
    await f.claims.claim(['home.json'], { workerSid: WORKER_A })
    await f.claims.worker(WORKER_A)(() =>
      f.ops.set_l1({
        page: 'home',
        path: '0.0',
        node: { kind: 'container', id: 'header', layout: 'stack', axes: { surfaceFill: '#112233' }, children: [] },
      }),
    )
    const after = await home(f)
    expect(after.l1.root.children[0].axes?.surfaceFill).toBe('#112233')
    expect(after.l1.background).not.toBe('#112233')
  })

  it('test_UAT_FC_REQ-406_any_write_whose_result_changes_a_document_key_is_refused_the_same_way', async () => {
    const f = await fixture()
    await f.claims.claim(['home.json'], { workerSid: WORKER_A })
    const before = await stored(f)
    // A whole-page write (an import, a checkout) that moves the column and the
    // text colour along with a body change.
    const current = await home(f)
    const changed = structuredClone(current) as Record<string, unknown> & { l1: Record<string, unknown> }
    changed.title = 'Welcome'
    changed.l1.textColor = '#ff0000'
    changed.l1.widths = [390, 1280]

    const err = await refusal(
      f.claims.worker(WORKER_A)(() => f.store.write(f.site.slug, { pages: [{ name: 'home.json', page: changed }] })),
    )
    expect(err.code).toBe('NOT_IN_SCOPE')
    expect(err.message).toContain('(`textColor`, `widths`)')
    expect(await stored(f)).toBe(before)
  })

  it('test_UAT_FC_REQ-406_a_decomposed_pages_style_is_refused_to_a_builder_holding_the_page', async () => {
    const f = await fixture(true)
    const release = await f.claims.claim(['home.json'], { workerSid: WORKER_A })
    expect((await f.leases.held(f.site.slug)).map((l) => l.file)).toEqual([
      'home.json',
      'home.json#header',
      'home.json#story',
    ])
    const err = await refusal(f.claims.worker(WORKER_A)(() => repaint(f)))
    expect(err.file).toBe('home.json#style')
    await release()
  })

  it('test_UAT_FC_REQ-406_a_builder_given_the_style_by_name_repaints_the_page', async () => {
    const f = await fixture()
    expect(await scopeFiles(f.store, f.site.slug, ['home.json', 'home.json#style'])).toEqual([
      'home.json',
      'home.json#style',
    ])
    await f.claims.claim(['home.json', 'home.json#style'], { workerSid: WORKER_A })
    await f.claims.worker(WORKER_A)(() => repaint(f))
    expect((await home(f)).l1.background).toBe('#112233')
  })

  it('test_UAT_FC_REQ-406_a_section_cannot_be_called_style', async () => {
    const site = makeMemorySite({ pages: { 'home.json': page() } })
    const p = (await site.store.readPages(site.slug))[0].page as {
      l1: { root: { children: Array<{ id: string }> } }
    }
    p.l1.root.children[1].id = 'style'
    await site.store.write(site.slug, { pages: [{ name: 'home.json', page: p }] })
    const ops = l1Operations(site.slug, site.opts)
    await expect(ops.decompose_page({ page: 'home' })).rejects.toThrow(/share its name with the page's style/)
  })
})

describe('REQ-406 the style is leased like any other file', () => {
  it('test_UAT_FC_REQ-406_a_held_style_refuses_a_second_claim_on_it_but_not_on_the_page', async () => {
    const f = await fixture()
    await f.claims.claim(['home.json#style'], { workerSid: WORKER_A })

    await expect(f.claims.claim(['home.json#style'], { workerSid: WORKER_B })).rejects.toThrow(
      `\`home.json#style\` is held by builder ${WORKER_A}`,
    )
    // Holding the style does not hold the page body, and the reverse.
    await f.claims.claim(['home.json'], { workerSid: WORKER_B })
    expect((await f.leases.held(f.site.slug)).map((l) => [l.file, l.holder])).toEqual([
      ['home.json', WORKER_B],
      ['home.json#style', WORKER_A],
    ])
  })

  it('test_UAT_FC_REQ-406_a_client_page_style_edit_is_refused_while_a_builder_holds_the_style', async () => {
    const f = await fixture()
    await f.claims.claim(['home.json#style'], { workerSid: WORKER_A })
    const before = await stored(f)

    const client = await refusal(asWriter({ holder: CLIENT_HOLDER, scope: null }, () => repaint(f)))
    expect(client.code).toBe('FILE_HELD')
    expect(client.holder).toBe(WORKER_A)
    expect(client.message).toContain(`\`home.json#style\` is held by builder ${WORKER_A}`)
    expect(await stored(f)).toBe(before)

    // A builder on the page body leaves the client free to restyle the page.
    const g = await fixture()
    await g.claims.claim(['home.json'], { workerSid: WORKER_A })
    await asWriter({ holder: CLIENT_HOLDER, scope: null }, () => repaint(g))
    expect((await home(g)).l1.background).toBe('#112233')
  })
})

describe('REQ-406 the consultant is taught the style file', () => {
  it('test_UAT_FC_REQ-406_priming_names_the_style_file_and_when_to_commission_it', () => {
    const scoped = delegationMethod(true, false, true, 1)!
    expect(scoped).toContain('`home.json#style`')
    expect(scoped).toContain('but not its style')
    expect(scoped).toContain('only when the brief asks for a change to the whole page')
  })
})
