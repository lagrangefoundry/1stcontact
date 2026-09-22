import { describe, expect, it } from 'vitest'
import { l1DocumentSchema } from '../packages/site-schema/src'
import { l1Operations } from '../tools/generate/src/cli/ai/toolbox-core'
import l1Surface from '../tools/generate/src/cli/ai/l1-surface.json'
import { STARTER_WIDTHS } from '../tools/generate/src/cli/scaffold'
import { renderSiteFiles } from '../tools/generate/src/render/render'
import { makeMemorySite, type SiteFixture } from './support/site-factory'

/**
 * REQ-300 — **a page that has just been added can be given content**.
 *
 * WHAT WENT WRONG. `add_page` wrote `{ id, slug, title, modules: [] }` and no L1
 * document. Every operation that could put something on a page replaces something
 * already there, so there was nothing to replace and no way to bring an address
 * into existence: `set_l1` at `0` refused with *"has no L1 document"*, so did
 * `set_page_style`, and `add_component` refused because the page had no tree to
 * mount into. The page could be created, renamed, re-pathed and deleted, and
 * nothing else — a site could never gain a second page.
 *
 * WHY IT WAS INVISIBLE. The page a site is *created* with has been scaffolded
 * since REQ-102, so every ordinary edit is a replacement of something that
 * already exists. The hole only opens on the first page added afterwards, which
 * is generally in front of a client who has just been told a second page is being
 * built.
 *
 * WHAT THESE PIN. Not "a document key exists on the record" — that is a claim
 * about a field. Each of the three operations that refused is driven through the
 * grant's own surface and has to SUCCEED, and the page it wrote has to reach the
 * renderer as bytes. The declaration is checked too, because the sentence *"the
 * page arrives with nothing on it"* was itself part of the wall: it told the
 * assistant the emptiness was the end of the story rather than a first step.
 *
 * Driven through `l1Operations` — the grant's operations, bound to one site, the
 * same functions the chat's Toolbox invokes — over a real store, and through the
 * real renderer. Nothing here rebuilds a page by hand.
 */

const PAGE = 'services'
const TITLE = 'What we do'

/** The grant's operations for a fixture site, exactly as a session gets them. */
function grant(site: SiteFixture): Record<string, (p: Record<string, unknown>) => unknown> {
  return l1Operations(site.slug, site.opts) as Record<
    string,
    (p: Record<string, unknown>) => unknown
  >
}

/** Every page of the site as the store holds it, keyed by page id. */
async function stored(site: SiteFixture): Promise<Record<string, Record<string, unknown>>> {
  const files = await site.store.readPages(site.slug)
  return Object.fromEntries(files.map((f) => [String(f.page.id), f.page]))
}

/**
 * Run one body against a fresh site, and dispose of it however it ends.
 *
 * The fixture's seed is the real scaffolder's output, so "the page the site was
 * created with" in these assertions is the page `1c new` actually writes.
 */
async function onFreshSite(body: (site: SiteFixture, ops: ReturnType<typeof grant>) => Promise<void>) {
  const site = makeMemorySite()
  try {
    await body(site, grant(site))
  } finally {
    await site.dispose()
  }
}

/** A replacement root — the shape a session sends when it starts painting. */
const PAINTED_ROOT = {
  kind: 'container',
  id: 'root',
  layout: 'stack',
  gapPx: 24,
  padding: { topPx: 64, rightPx: 24, bottomPx: 64, leftPx: 24 },
  children: [
    { kind: 'text', id: 'headline', text: 'Drains, boilers, emergencies', axes: { fontSizePx: 40 } },
  ],
}

describe('REQ-300 — a new page arrives with a document', () => {
  it('test_UAT_FC_REQ-300_an_added_page_carries_a_document', async () => {
    await onFreshSite(async (site, ops) => {
      await ops.add_page({ page: PAGE, title: TITLE })

      // AC-1 — the map the assistant reads is no longer blank. Before this the
      // three of these came back `{}`, `[]` and `[]`, which is what every worker
      // that hit this wall saw and read as "nothing here yet".
      const map = (await ops.describe_page({ page: PAGE })) as {
        style: Record<string, unknown>
        segments: unknown[]
        components: unknown[]
      }
      expect(map.segments.length).toBeGreaterThan(0)
      expect(map.style).toMatchObject({ widths: [...STARTER_WIDTHS] })
      expect(map.style.background).toEqual(expect.any(String))
      expect(map.style.textColor).toEqual(expect.any(String))

      // …and what was written is a document by the envelope's own reckoning, not
      // merely an object under an `l1` key.
      const page = (await stored(site))[PAGE]
      expect(l1DocumentSchema.safeParse(page.l1).success).toBe(true)
    })
  })

  it('test_UAT_FC_REQ-300_set_l1_writes_the_root_of_a_new_page', async () => {
    await onFreshSite(async (site, ops) => {
      await ops.add_page({ page: PAGE, title: TITLE })

      // AC-2 — THE REPRODUCTION, exactly: `set_l1` on the new page at address
      // `0`. It refused with NOT_FOUND "has no L1 document", and there was no
      // other call that could have made the address exist.
      const out = (await ops.set_l1({ page: PAGE, path: '0', node: PAINTED_ROOT })) as {
        changed: unknown
      }
      expect(out.changed).toEqual(['0'])

      // Strong observation: what the store holds is the node that was sent, so
      // the write landed rather than being reported.
      const page = (await stored(site))[PAGE]
      expect(JSON.stringify(page.l1)).toContain('Drains, boilers, emergencies')
      expect(l1DocumentSchema.safeParse(page.l1).success).toBe(true)
    })
  })

  it('test_UAT_FC_REQ-300_set_page_style_paints_a_new_page', async () => {
    await onFreshSite(async (site, ops) => {
      await ops.add_page({ page: PAGE, title: TITLE })

      // AC-3 — the second refusal in the report. A page nobody can paint is a
      // page that cannot be made to belong to the site it is on.
      await ops.set_page_style({ page: PAGE, style: { background: '#101820', textColor: '#f4f4f5' } })

      const style = (
        (await ops.get_page_style({ page: PAGE })) as { document: Record<string, unknown> }
      ).document
      expect(style.background).toBe('#101820')
      expect(style.textColor).toBe('#f4f4f5')
      // The ladder is untouched: naming two keys writes two keys.
      expect(style.widths).toEqual([...STARTER_WIDTHS])
    })
  })

  it('test_UAT_FC_REQ-300_a_component_mounts_onto_a_new_page', async () => {
    await onFreshSite(async (site, ops) => {
      await ops.add_page({ page: PAGE, title: TITLE })

      // AC-4 — the third refusal: `add_component` reported SCHEMA_INVALID
      // "names slot 'main' but the page has no L1 document to mount into". The
      // seam is written with `set_l1` like on any other page — which is the whole
      // point: the new page takes the ordinary two-step, not a special one.
      await ops.set_l1({
        page: PAGE,
        path: '0',
        node: {
          ...PAINTED_ROOT,
          children: [
            ...PAINTED_ROOT.children,
            { kind: 'slot', id: 'enquiry', name: 'enquiry', behavior: 'contact-form' },
          ],
        },
      })
      await ops.add_component({
        page: PAGE,
        name: 'enquiry',
        behavior: 'contact-form',
        slot: 'enquiry',
        config: {
          fields: [
            { name: 'email', label: 'Email address', labelMode: 'placeholder', type: 'email', required: true },
          ],
          submitLabel: 'Ask us',
        },
      })

      const components = (
        (await ops.describe_page({ page: PAGE })) as { components: { id: string; slot: string }[] }
      ).components
      expect(components).toEqual([expect.objectContaining({ id: 'enquiry', slot: 'enquiry' })])

      // Evidence that it MOUNTED and was not merely recorded: the module is the
      // only `<form>` sink there is, so a form in the rendered page is the proof.
      const loaded = await site.store.loadDraft(site.slug)
      expect(loaded!.result.ok, loaded!.result.ok ? '' : JSON.stringify(loaded!.result)).toBe(true)
      const out = await renderSiteFiles(loaded!.result.ok ? loaded!.result.value : null!)
      expect(out.files.get(`${PAGE}.html`)).toContain('<form')
    })
  })

  it('test_UAT_FC_REQ-300_a_new_page_renders_with_no_editing_in_between', async () => {
    await onFreshSite(async (site, ops) => {
      await ops.add_page({ page: PAGE, title: TITLE })

      // AC-5 — the client switches to the new page in the selector and sees
      // something. A document that validates but paints nothing would satisfy
      // every assertion above and still show a blank screen, so the rendered
      // bytes are asserted directly.
      const loaded = await site.store.loadDraft(site.slug)
      expect(loaded!.result.ok, loaded!.result.ok ? '' : JSON.stringify(loaded!.result)).toBe(true)
      const out = await renderSiteFiles(loaded!.result.ok ? loaded!.result.value : null!)

      expect(out.pages).toContain(`${PAGE}.html`)
      const html = out.files.get(`${PAGE}.html`)!
      // Asserted on the body, not the whole document: the title is in `<head>`
      // too, so "contains the title" would pass on an empty page.
      const body = html.slice(html.indexOf('<body>'))
      expect(body).toContain(TITLE)
    })
  })

  it('test_UAT_FC_REQ-300_an_added_page_starts_where_the_first_page_started', async () => {
    await onFreshSite(async (site, ops) => {
      await ops.add_page({ page: PAGE, title: TITLE })
      const pages = await stored(site)
      const first = pages.home.l1 as Record<string, unknown>
      const added = pages[PAGE].l1 as Record<string, unknown>

      // AC-6 — ONE DEFINITION OF THE STARTER, so the page a site is born with
      // and the page added on day ten are the same kind of thing. The ladder
      // matters most: it is what keyframes are declared against, so two pages
      // authored at different ladders cannot share pinned geometry.
      expect(added.widths).toEqual(first.widths)
      expect(added.background).toEqual(first.background)
      expect(added.textColor).toEqual(first.textColor)
      // Same root shape, its own words — the heading is the page's title rather
      // than the site's name.
      expect((added.root as { kind: string }).kind).toBe((first.root as { kind: string }).kind)
      expect(JSON.stringify(added.root)).toContain(TITLE)
    })
  })

  it('test_UAT_FC_REQ-300_a_message_still_arrives_as_a_message', async () => {
    await onFreshSite(async (site, ops) => {
      // AC-7 — the served starter must not have swallowed the email default.
      // A message is authored at the one width every mail client agrees on and
      // carries readable copy; handing it the served skeleton would give it a
      // six-rung ladder and a heading nobody could send.
      await ops.add_page({ page: 'thanks', title: 'Thank you', kind: 'email' })
      const message = (await stored(site)).thanks.l1 as Record<string, unknown>

      expect(message.widths).not.toEqual([...STARTER_WIDTHS])
      expect((message.widths as number[]).length).toBe(1)
      expect(JSON.stringify(message.root)).toContain('Hello,')
      expect(l1DocumentSchema.safeParse(message).success).toBe(true)
    })
  })
})

describe('REQ-300 — the declaration stops calling a new page the end of the story', () => {
  it('test_UAT_FC_REQ-300_add_page_is_declared_as_a_page_you_can_paint', () => {
    // The declaration is projected verbatim into the assistant's manual, so what
    // it says IS what the assistant is told. It said "The page arrives with
    // nothing on it" and named no next step — which is how two independent
    // workers read the refusals as a structural wall rather than a missing call.
    // This cannot prove obedience and is not written as though it does; it proves
    // the false ending is gone and the path is stated.
    const declaration = l1Surface as unknown as {
      operations: { op: string; summary: string; description: string }[]
      sequences: { name: string; steps: string[] }[]
    }
    const add = declaration.operations.find((o) => o.op === 'add_page')!
    const prose = `${add.summary}\n${add.description}`

    expect(prose).not.toMatch(/arrives with nothing on it/i)
    expect(prose).not.toMatch(/\bempty page\b/i)
    expect(prose).toMatch(/set_l1/)

    // …and the route from a new page to a painted one is recorded as a sequence,
    // where every other multi-step path on this surface is.
    const sequence = declaration.sequences.find((s) => s.steps.includes('add_page'))
    expect(sequence?.steps).toEqual(['add_page', 'describe_page', 'set_l1'])
  })
})
