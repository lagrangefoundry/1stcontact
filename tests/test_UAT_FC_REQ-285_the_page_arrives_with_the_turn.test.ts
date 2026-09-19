import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { rmSync } from 'node:fs'
import { editCopySet } from '../tools/generate/src/cli/edit'
import {
  openSession,
  resetAiHost,
  sessionsDir,
  setModelClient,
  streamPrompt,
} from '../tools/generate/src/cli/ai/host'
import { aiCore } from '../tools/generate/src/cli/ai/toolbox'
import { sharedModuleUrl } from '../tools/generate/src/cli/webui'
import { openSession as openSessionCore, streamPrompt as streamPromptCore, type HostDeps }
  from '../tools/generate/src/cli/ai/host-core'
import {
  consultantRole,
  MAX_DIGEST_CHARS,
  pageDigest,
  PAGE_DIGEST_PROVIDER,
  registerMemoryProviders,
  registerSiteProviders,
} from '../tools/generate/src/cli/ai/roles'
import { collectSiteDigest, siteDigestSource } from '../tools/generate/src/cli/ai/digest-core'
import type { SiteDigest } from '../tools/generate/src/cli/ai/digest-core'
import primingDocument from '../tools/generate/src/cli/ai/priming.json'
import { makeFsSite, fsOpts } from './support/site-factory'
import type { SiteFixture } from './support/site-factory'
import { says, scriptedClient, systemText, turnTailText } from './support/scripted-model-client'

/**
 * [[REQ-285]] — **the page arrives with the turn.**
 *
 * The consultant's own account of why it re-reads everything: *"Most of my
 * re-reading exists because I do not trust my memory of the page across a
 * failure — correctly, as the `since: 120` slip demonstrates."* It had asked the
 * site for changes since revision 120 when the true count was 76. It had not
 * misread anything; it had INVENTED a state marker and believed it: *"That is
 * not a system fault, it is me confabulating a state marker."*
 *
 * The other recommendations reduce the COST of re-establishing state. This one
 * removes the NEED — a session handed the page every turn has no reason to go
 * and look, no reason to remember a revision number, and nothing to confabulate.
 *
 * WHAT MAKES THIS EVIDENCE. The end-to-end claims are assertions on WHAT THE
 * MODEL WAS SENT, through the real host: a real session manager, the real
 * `priming.json` loaded through the framework's own loader, the real providers
 * this host registers, a real filesystem store and a real change journal. The
 * only double is the Anthropic client, which is the network. Nothing restates
 * the prose: an entry naming an unregistered provider, or a template name with
 * no template behind it, fails here exactly as it would fail at start-up.
 *
 * THE CLAIMS:
 *
 *   1. The digest arrives on EVERY turn, and it sits after the cache boundary —
 *      so re-assembling it cannot invalidate the cached prefix in front of it.
 *   2. It carries the pages that exist and which one is being worked on.
 *   3. It carries each page's bands in order, named, with the address that
 *      reaches them.
 *   4. It carries the change counter, so the number the session quotes is one it
 *      was GIVEN rather than one it produced.
 *   5. It says whether anything is unpublished.
 *   6. It carries the assets a page references, by the Library label where the
 *      deployment has a catalogue and by the site handle where it does not.
 *   7. It does NOT carry the L1 subtree, the copy below a band, or the paint
 *      axes — those are what `get_l1` is for.
 *   8. It is BOUNDED, and what it sheds first is detail per page, never a page.
 *   9. A host with nothing to say says nothing, and leaves no residue.
 */

type Untyped = any // eslint-disable-line @typescript-eslint/no-explicit-any

const SLUG = 'req285'
const BAND = 'Fresh bread, every morning'
const DEEP = 'A line three levels down that no digest should carry'

/** A home page with three bands, a nested run, and two pictures. */
const HOME: Record<string, unknown> = {
  id: 'home',
  slug: 'home',
  title: 'Home',
  modules: [],
  l1: {
    widths: [390, 768, 1280],
    background: '#ffffff',
    textColor: '#111111',
    root: {
      kind: 'container',
      id: 'root',
      layout: 'stack',
      children: [
        { kind: 'text', text: BAND, axes: { fontSizePx: 48, fontWeight: 700 } },
        {
          kind: 'container',
          id: 'story',
          layout: 'row',
          padding: { topPx: 40, rightPx: 24, bottomPx: 40, leftPx: 24 },
          children: [
            { kind: 'text', text: DEEP, axes: { fontSizePx: 16 } },
            { kind: 'image', src: '/assets/loaf.jpg', alt: 'A loaf' },
          ],
        },
        { kind: 'image', src: '/assets/wordmark.svg', alt: 'The wordmark' },
      ],
    },
  },
}

/** A second page, so "which one is being worked on" has two answers to choose from. */
const ABOUT: Record<string, unknown> = {
  id: 'about',
  slug: 'about',
  title: 'About us',
  modules: [],
  l1: {
    widths: [390, 768, 1280],
    background: '#ffffff',
    textColor: '#111111',
    root: {
      kind: 'container',
      id: 'root',
      layout: 'stack',
      children: [{ kind: 'text', text: 'We bake here.', axes: { fontSizePx: 24 } }],
    },
  },
}

let site: SiteFixture

function seed(): SiteFixture {
  return makeFsSite({
    slug: SLUG,
    pages: { 'home.json': HOME, 'about.json': ABOUT },
    assets: {
      'loaf.jpg': new Uint8Array([1, 2, 3]),
      'wordmark.svg': new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"/>'),
    },
  })
}

beforeEach(() => {
  site = seed()
  rmSync(sessionsDir({ cwd: site.cwd! }), { recursive: true, force: true })
  resetAiHost()
})

afterEach(() => {
  setModelClient(null)
  resetAiHost()
  site.dispose?.()
})

/** Run one turn to completion against the real host, and answer what it sent. */
async function turn(sessionId: string, text: string): Promise<void> {
  const drained: unknown[] = []
  for await (const event of streamPrompt(sessionId, text, { cwd: site.cwd! })) drained.push(event)
  expect(drained.length).toBeGreaterThan(0)
}

// ── 1–5, 7: the digest as the model actually receives it ─────────────────────

describe('REQ-285 — the site as it stands arrives with the turn', () => {
  it('test_UAT_FC_REQ-285_the_digest_arrives_on_every_turn_after_the_cache_boundary', async () => {
    const client = scriptedClient([says('Right.'), says('Still right.')])
    setModelClient(client)
    const { sessionId } = await openSession(SLUG, { cwd: site.cwd! })

    await turn(sessionId, 'hello')
    await turn(sessionId, 'hello again')

    for (const seen of [client.seen[0], client.seen[1]]) {
      // It is in the per-turn tail, which is re-sent every turn…
      expect(turnTailText(seen)).toContain('The site as it stands')
      // …and it is NOT in the system prompt, which is the cached prefix. That is
      // the whole of why a digest re-assembled per turn is affordable: a cache
      // marker on a block guaranteed to differ next turn would invalidate
      // everything in front of it, which is the priming and the whole manual.
      expect(systemText(seen)).not.toContain('The site as it stands')
    }
  })

  it('test_UAT_FC_REQ-285_it_names_the_pages_their_bands_and_the_page_last_worked_on', async () => {
    // An edit on the second page — so "which one is being worked on" has a real
    // answer that was READ OUT OF THE RECORD rather than remembered.
    await editCopySet(
      SLUG,
      'about',
      '0.0',
      { text: 'We have baked here since 1974.' },
      { ...fsOpts(site.cwd!), actor: 'client' },
    )

    const client = scriptedClient([says('Right.')])
    setModelClient(client)
    const { sessionId } = await openSession(SLUG, { cwd: site.cwd! })
    await turn(sessionId, 'where are we')
    const digest = turnTailText(client.seen[0])

    // Every page that exists, by the id every operation takes.
    expect(digest).toContain('### home')
    expect(digest).toContain('### about')
    // Which one is being worked on — the page the record says moved last.
    expect(digest).toMatch(/### about[^\n]*last changed/)
    expect(digest).not.toMatch(/### home[^\n]*last changed/)

    // Each page's structure at ONE level: the bands in order, named, each
    // carrying the address a write takes. A band the session can see and cannot
    // reach is an invitation to compose an address.
    expect(digest).toContain('0.0')
    expect(digest).toContain('0.1')
    expect(digest).toContain('0.2')
    expect(digest).toContain(BAND)
    expect(digest.indexOf('0.0')).toBeLessThan(digest.indexOf('0.1'))
    expect(digest.indexOf('0.1')).toBeLessThan(digest.indexOf('0.2'))
  })

  it('test_UAT_FC_REQ-285_the_counter_it_quotes_is_one_it_was_given', async () => {
    await editCopySet(
      SLUG,
      'home',
      '0.0',
      { text: 'Fresh bread, every single morning' },
      { ...fsOpts(site.cwd!), actor: 'client' },
    )
    const client = scriptedClient([says('Right.')])
    setModelClient(client)
    const { sessionId } = await openSession(SLUG, { cwd: site.cwd! })
    await turn(sessionId, 'what has happened')

    // THE WHOLE ANSWER TO `since: 120`. The session was handed the number, and
    // the number it was handed is the store's own — not a rendering of one, and
    // not a number the conversation happens to contain.
    const at = await site.store.counter(SLUG)
    expect(at).toBeGreaterThan(0)
    expect(turnTailText(client.seen[0])).toContain(`The draft stands at change ${at}.`)
  })

  it('test_UAT_FC_REQ-285_it_says_whether_anything_is_unpublished', async () => {
    const client = scriptedClient([says('Right.')])
    setModelClient(client)
    const { sessionId } = await openSession(SLUG, { cwd: site.cwd! })
    await turn(sessionId, 'can anyone see this')

    // Read off the record, not asserted as prose: this site has never published.
    const facts = await collectSiteDigest(SLUG, fsOpts(site.cwd!))
    expect(facts.live).toBeNull()
    expect(turnTailText(client.seen[0])).toContain('Nothing has been published yet')
  })

  it('test_UAT_FC_REQ-285_it_carries_neither_the_subtree_nor_the_copy_nor_the_axes', async () => {
    const client = scriptedClient([says('Right.')])
    setModelClient(client)
    const { sessionId } = await openSession(SLUG, { cwd: site.cwd! })
    await turn(sessionId, 'hello')
    const digest = turnTailText(client.seen[0])

    // The band is named; what is INSIDE the band is not. `get_l1` is for that,
    // and putting it here would recreate the very cost this removes — a page map
    // plus two element reads is already several thousand tokens.
    expect(digest).toContain(BAND)
    expect(digest).not.toContain(DEEP)
    // Nor how anything is painted or laid out.
    expect(digest).not.toContain('fontSizePx')
    expect(digest).not.toContain('fontWeight')
    expect(digest).not.toContain('padding')
    expect(digest).not.toContain('#ffffff')
  })
})

// ── 6: the shared name ───────────────────────────────────────────────────────

describe('REQ-285 — a picture is named the way the client names it', () => {
  it('test_UAT_FC_REQ-285_without_a_catalogue_a_picture_is_named_by_its_handle', async () => {
    const client = scriptedClient([says('Right.')])
    setModelClient(client)
    const { sessionId } = await openSession(SLUG, { cwd: site.cwd! })
    await turn(sessionId, 'what pictures are on this')
    const digest = turnTailText(client.seen[0])

    // The `1c` CLI has no client Library, so there is no shared name to use and
    // the handle is the only name that exists. That is the honest answer rather
    // than a degraded one.
    expect(digest).toContain('/assets/loaf.jpg')
    expect(digest).toContain('/assets/wordmark.svg')
  })

  it('test_UAT_FC_REQ-285_with_a_catalogue_a_picture_is_named_by_its_library_label', async () => {
    // THE WHOLE LIBRARY AND NOT ITS CORE, because this case builds a real
    // manager with a real backend — `aiCore` is the half that carries no
    // provider client, which is right for the assembly-only cases below.
    const lib = (await import(/* @vite-ignore */ sharedModuleUrl('ai'))) as Untyped
    const deps: HostDeps = {
      lib: lib as HostDeps['lib'],
      store: site.store,
      archive: new lib.NullArchive(),
      junctions: lib.memoryJunctions(),
      apiKey: 'test-key',
      // The deployment that HAS a catalogue — the Worker's shape, assembled here
      // rather than doubled: the label reaches the digest through the same
      // `placed_as` record the client's own Library row is drawn from.
      library: () => ({
        list: async () => [
          {
            name: 'material-1',
            where: 'library',
            mediaType: 'image/jpeg',
            aliases: [],
            filename: 'loaf.jpg',
            kind: 'image',
            label: 'IMAGE-5',
            role: null,
            rights: 'owned',
            republishable: true,
            exportable: true,
            origin: 'upload',
            placed_on: [SLUG],
            placed_as: [{ slug: SLUG, name: 'loaf.jpg' }],
            source_url: null,
            edits: [],
            description_status: null,
            description_model: null,
            updated_at: '2026-01-01T00:00:00.000Z',
          },
        ],
        deleted: async () => [],
        read: async () => {
          throw new Error('the digest reads no item')
        },
      }),
    } as unknown as HostDeps

    const client = scriptedClient([says('Right.')])
    setModelClient(client)
    const opened = await openSessionCore(SLUG, { cwd: site.cwd! }, deps)
    for await (const _e of streamPromptCore(opened.sessionId, 'hello', { cwd: site.cwd! }, deps)) {
      void _e
    }
    const digest = turnTailText(client.seen[0])

    // THE ONE STRING THAT MEANS THE SAME THING ON BOTH SIDES ([[REQ-280]]). The
    // client says "replace IMAGE-5"; a session whose digest said
    // `/assets/loaf.jpg` would have to translate, and translating is where it
    // goes wrong.
    expect(digest).toContain('IMAGE-5')
    expect(digest).not.toContain('/assets/loaf.jpg')
    // The picture with no Library record keeps its handle — there is no shared
    // name for it, and inventing one would be worse than naming the file.
    expect(digest).toContain('/assets/wordmark.svg')
  })
})

// ── 8: the bound ─────────────────────────────────────────────────────────────

/** A site of `pages` pages, each with `bands` bands and two pictures. */
function bigDigest(pages: number, bands: number): SiteDigest {
  return {
    pages: Array.from({ length: pages }, (_, p) => ({
      id: `page-${p}`,
      title: `Page number ${p}`,
      address: p === 0 ? '/' : `/page-${p}`,
      kind: 'web' as const,
      bands: Array.from({ length: bands }, (_, b) => ({
        path: `0.${b}`,
        label: `a band with a reasonably long descriptive label, number ${b}`,
      })),
      assets: ['IMAGE-1', 'IMAGE-2', 'IMAGE-3'],
    })),
    focus: 'page-0',
    counter: 76,
    live: 4,
    pending: 3,
  }
}

describe('REQ-285 — the bound is the design constraint', () => {
  it('test_UAT_FC_REQ-285_a_site_that_outgrows_the_ceiling_sheds_detail_not_pages', () => {
    const big = bigDigest(10, 8)
    const rendered = pageDigest(big)!

    // Volatile content is re-sent on every turn for the life of an engagement, so
    // a digest that grew with the site would become the very problem the epic is
    // about. The ceiling holds.
    expect(rendered.length).toBeLessThanOrEqual(MAX_DIGEST_CHARS)
    // Ten pages are listed with less about each — not five pages in full. A page
    // a session is not told about is a page it will build a second time.
    for (const page of big.pages) expect(rendered).toContain(page.id)
    // What went is the detail, and it went from the pages that are NOT being
    // worked on first: the page the next turn is most likely about keeps its
    // bands longest.
    expect(rendered).toContain('0.0')
    expect(rendered.match(/^- 0\.0 /gm)?.length).toBe(1)
  })

  it('test_UAT_FC_REQ-285_a_small_site_is_carried_whole_and_cheaply', () => {
    const rendered = pageDigest(bigDigest(3, 4))!

    expect(rendered.length).toBeLessThanOrEqual(MAX_DIGEST_CHARS)
    // Every page keeps every band, and its pictures with it — the trade this
    // entry has to win is against one page map plus two element reads, which is
    // already several thousand tokens.
    expect(rendered.match(/^- 0\.3 /gm)?.length).toBe(3)
    expect(rendered).toContain('IMAGE-3')
  })

  it('test_UAT_FC_REQ-285_a_site_too_big_even_for_bare_lines_says_it_was_cut', () => {
    const rendered = pageDigest(bigDigest(200, 2))!

    expect(rendered.length).toBeLessThanOrEqual(MAX_DIGEST_CHARS)
    // A silent truncation reads exactly like a complete listing, and this entry's
    // whole value is that it can be trusted. So it says it was cut, and names the
    // cheap call that completes it ([[REQ-284]]).
    expect(rendered).toMatch(/more pages\. Call list_pages/)
  })
})

// ── 9: nothing to say, nothing said ──────────────────────────────────────────

describe('REQ-285 — a host with nothing to say says nothing', () => {
  it('test_UAT_FC_REQ-285_no_digest_source_renders_no_entry_and_no_residue', async () => {
    const lib = (await aiCore()) as Untyped
    const providers = new lib.PrimingProviders()
    // A host with no digest to give. The entry is still NAMED by the shipped
    // configuration, so the provider must be registered either way or the role
    // could not load at all — and it renders `null`, which drops the entry and
    // its separator with it.
    registerSiteProviders(providers, {
      slug: SLUG,
      box: { manual: async () => '## Your tools' },
      signal: () => undefined,
    })
    // EVERY NAME THE CONSULTANT'S CONFIGURATION USES, OR THE ROLE WILL NOT LOAD
    // ([[REQ-283]]). `null` is the same wiring as the digest above it: a host
    // with nowhere to keep a record registers the name and renders nothing.
    registerMemoryProviders(providers, null)
    const role = consultantRole(lib, providers, false)
    const reminder: string = await lib.assembleReminders(
      role,
      new lib.SessionContext({ role: 'consultant', backend: 'test' }),
      { providers },
    )

    expect(reminder).not.toContain('The site as it stands')
    expect(reminder).not.toMatch(/\n\n\n/)
    expect(pageDigest(null)).toBeNull()
  })

  it('test_UAT_FC_REQ-285_a_store_that_cannot_be_read_costs_the_client_no_turn', async () => {
    // The record is what makes a turn cheap, not what makes one possible.
    const broken = {
      version: async () => {
        throw new Error('the store is gone')
      },
    }
    const source = siteDigestSource(SLUG, { store: broken } as never)
    expect(await source()).toBeNull()
  })

  it('test_UAT_FC_REQ-285_the_entry_is_declared_volatile_and_bound_to_a_registered_name', () => {
    // The seam already existed: this is a third provider of the same kind in the
    // same tier as `site.line` and `site.changes`, with no new mechanism. Being
    // in `reminders` — the tier that declares no cache boundary — is what makes
    // it volatile by construction rather than by arithmetic.
    const entry = (primingDocument.reminders as { name?: string; provider?: string }[]).find(
      (e) => e.name === 'page-digest',
    )
    expect(entry?.provider).toBe(PAGE_DIGEST_PROVIDER)
    expect(
      (primingDocument.priming as { provider?: string }[]).some(
        (e) => e.provider === PAGE_DIGEST_PROVIDER,
      ),
    ).toBe(false)
  })
})
