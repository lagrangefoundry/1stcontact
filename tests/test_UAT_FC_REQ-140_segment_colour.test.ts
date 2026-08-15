// @vitest-environment jsdom
/**
 * REQ-140 — **colour on the segment you clicked**: a text run's colour and a
 * panel's background, picked from the site's own palette.
 *
 * This is REQ-135 phase B, the half that was blocked on REQ-133's picker. Phase
 * A gave a run its typography; what it could not do was change a colour, so the
 * editor could re-set a headline in 96px bold and not move it off the one colour
 * the fold happened to capture.
 *
 * THE CRITERION THIS TICKET LIVES ON is AC-3: **the surface writes a palette
 * REFERENCE and never a hex.** That single rule is what makes "edit the entry
 * and every use follows" true, and it is what bounds the ugliness risk of
 * handing colour to a non-designer — from a segment you cannot invent an
 * off-system colour, only choose one the site already has. A control that wrote
 * hexes would look identical in the modal and be a different product.
 *
 * THE SUBTLE ONE IS AC-6. The modal posts every staged field, not only the
 * touched ones, and a folded site's axes hold hex LITERALS — so editing the
 * words of a run whose colour nobody touched posts that hex straight back at a
 * write side that refuses hexes. If the status quo did not pass, colour would
 * have made every OTHER edit on a folded site fail. Nothing in the feature
 * itself surfaces that; it is only visible from a test that edits something
 * else.
 *
 * SHAPED TO FAIL IF THIS BECOMES A SECOND MECHANISM. No new command and no new
 * route: the fields still come from `copyFieldsOf`, the write still goes through
 * `copy set` / `/api/copy`, and the whole-definition validator still gates the
 * file. No picker is built either — REQ-133's popup already implements pick mode
 * and already resolves to `{ref, shade}`; this supplies the caller it never had.
 *
 * REAL EVERYTHING EXCEPT THE ORIGIN'S PORT, on the pattern REQ-121/132/135
 * established: the page is what `1c render --edit` wrote, the commands are the
 * real `1c`, and the dialog is the real `defaultModal`.
 */

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { cmdNew, cmdRender, run, startBuilder, type BuilderHandle } from '../tools/generate/src/cli'
import { mountL1EditBridge } from '../packages/framework/src/l1/edit-client'
import {
  formatL1Path,
  L1_EDIT_MARKER_ATTR,
  L1_EDIT_PAGE_ATTR,
  L1_EDIT_PATH_ATTR,
} from '../packages/site-schema/src/l1/edit'
import type { L1Node } from '@1stcontact/site-schema'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

const REPO_ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..')

/** The site's palette — two real entries, so "not in the palette" has something to contrast with. */
const PALETTE = {
  ink: { value: '#101820' },
  brand: { value: '#2e86a3' },
}

/** A run whose colour is a hex LITERAL — the state every folded site is in. */
const A_HEADLINE = '0.0'
/** The panel that sits behind `A_PANEL_COPY`, painted with its own fill. */
const A_PANEL = '0.1'
/** A run nested one level down, so "nearest ancestor" and "outermost" differ. */
const A_PANEL_COPY = '0.1.0'
/** A segment that PAINTS but carries no fill — a radius is enough to be one. */
const A_BARE_BOX = '0.2'

const draftPath = (cwd: string, slug: string, ...rest: string[]) =>
  path.join(cwd, 'storage', 'sites', slug, 'draft', ...rest)

/**
 * A page shaped around the distinctions that decide behaviour.
 *
 * The root paints, the panel inside it paints, and a run sits inside each — so
 * the escalation has a wrong answer available (the outermost painted ancestor)
 * as well as a right one (the nearest). `A_HEADLINE` carries other axes on
 * purpose: AC-8 claims a colour edit disturbs nothing else on the node, and a
 * node with one axis could not tell "preserved" from "there was nothing to
 * lose".
 */
function seedSite(cwd: string, slug: string, palette: unknown = PALETTE): void {
  const homePath = draftPath(cwd, slug, 'pages', 'home.json')
  const home = JSON.parse(fs.readFileSync(homePath, 'utf8'))
  const root: L1Node = {
    kind: 'container',
    id: 'root',
    layout: 'stack',
    axes: { surfaceFill: '#0b1220' },
    children: [
      {
        kind: 'text',
        id: 'headline',
        text: 'Designed for developers who ship',
        axes: { fontSizePx: 48, fontWeight: 700, letterSpacingPx: -1.5, color: '#f6f7f4' },
      },
      {
        kind: 'container',
        id: 'panel',
        layout: 'stack',
        axes: { surfaceFill: '#101820' },
        children: [
          // NO colour axis: a run that inherits, so the derivation has to report
          // an absent value rather than a resolved one.
          { kind: 'text', id: 'panel-copy', text: 'Sitting on a panel.', axes: { fontSizePx: 18 } },
        ],
      },
      { kind: 'box', id: 'bare', axes: { borderRadiusPx: 8 } },
    ],
  } as L1Node
  home.l1 = { ...(home.l1 as Record<string, unknown>), root }
  fs.writeFileSync(homePath, JSON.stringify(home, null, 2))

  const sitePath = draftPath(cwd, slug, 'site.json')
  const site = JSON.parse(fs.readFileSync(sitePath, 'utf8'))
  if (palette) site.palette = palette
  else delete site.palette
  fs.writeFileSync(sitePath, JSON.stringify(site, null, 2))
}

interface CliResult {
  ok: boolean
  data?: Record<string, unknown>
  error?: { code: string; message: string; path?: string }
  exitCode: number
}

/** Drive the real `1c` entry point — argv in, envelope and exit code out. */
async function cli(cwd: string, ...argv: string[]): Promise<CliResult> {
  const prevCwd = process.cwd()
  const prevLog = console.log
  const prevErr = console.error
  const out: string[] = []
  process.chdir(cwd)
  process.exitCode = 0
  console.log = (...a: unknown[]) => void out.push(a.map(String).join(' '))
  console.error = (...a: unknown[]) => void out.push(a.map(String).join(' '))
  try {
    await run([...argv, '--json'])
  } finally {
    console.log = prevLog
    console.error = prevErr
    process.chdir(prevCwd)
  }
  const exitCode = typeof process.exitCode === 'number' ? process.exitCode : 0
  process.exitCode = 0
  return { ...(JSON.parse(out[out.length - 1]) as CliResult), exitCode }
}

interface Field {
  name: string
  label: string
  type: string
}

describe('REQ-140 — segment colour', () => {
  let cwd: string

  const get = (addr: string) => cli(cwd, 'copy', 'get', 'acme', 'home', addr)
  const set = (addr: string, values: Record<string, unknown>) =>
    cli(cwd, 'copy', 'set', 'acme', 'home', addr, '--values', JSON.stringify(values))

  const fieldsOf = async (addr: string): Promise<Field[]> =>
    (await get(addr)).data!.fields as Field[]
  const valuesOf = async (addr: string): Promise<Record<string, unknown>> =>
    (await get(addr)).data!.values as Record<string, unknown>

  /** The draft page file, byte for byte — what a refused edit must not touch. */
  const draftBytes = () => fs.readFileSync(draftPath(cwd, 'acme', 'pages', 'home.json'), 'utf8')

  /** The node at a dotted address, out of the draft on disk. */
  function draftNode(addr: string): Record<string, unknown> {
    let node = JSON.parse(draftBytes()).l1.root as Record<string, unknown>
    for (const i of addr.split('.').map(Number).slice(1)) {
      node = (node.children as Record<string, unknown>[])[i]
    }
    return node
  }

  const axesOf = (addr: string) => draftNode(addr).axes as Record<string, unknown>

  beforeEach(() => {
    cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'req140-'))
    cmdNew('acme', { cwd })
    seedSite(cwd, 'acme')
  })
  afterEach(() => {
    fs.rmSync(cwd, { recursive: true, force: true })
  })

  // AC-1 — clicking a run offers its COLOUR beside its words, and the palette it
  // must be chosen from travels in the same response. The value reported is the
  // axis as authored — a hex on a folded site — because reporting a resolved
  // colour for a run that declares none would make the modal claim the node
  // holds something it does not, and then write that claim back on Save.
  it('test_UAT_FC_REQ-140_a_text_run_offers_its_colour_and_the_palette_to_pick_from', async () => {
    const fields = await fieldsOf(A_HEADLINE)
    const colour = fields.find((f) => f.name === 'color')
    expect(colour).toMatchObject({ name: 'color', label: 'Text colour', type: 'color' })

    // The words stay FIRST — the modal opens into them, and colour arriving must
    // not displace the gesture REQ-121 added.
    expect(fields[0]).toMatchObject({ name: 'text', type: 'string' })

    expect(await valuesOf(A_HEADLINE)).toMatchObject({ color: '#f6f7f4' })

    // A run that declares no colour reports NO value, rather than an inherited
    // one dressed up as its own.
    expect(await valuesOf(A_PANEL_COPY)).not.toHaveProperty('color')

    // The closed list rides along with the descriptors that reference it, so a
    // swatch and the field naming it can never be reading two different
    // palettes.
    expect((await get(A_HEADLINE)).data!.palette).toEqual(PALETTE)
  })

  // AC-3 — THE CRITERION. A pick writes a palette REFERENCE, and the render
  // paints what that reference resolves to. Both halves matter: writing the ref
  // is what makes an entry edit reach every use, and painting the resolved hex
  // is what makes it invisible to the page.
  it('test_UAT_FC_REQ-140_picking_an_entry_writes_a_reference_and_the_page_paints_it', async () => {
    const saved = await set(A_HEADLINE, { color: { ref: 'brand' } })
    expect(saved.ok).toBe(true)
    expect(saved.data!.changed).toEqual(['color'])

    // The DEFINITION holds the reference — not the hex it resolves to.
    expect(axesOf(A_HEADLINE).color).toEqual({ ref: 'brand' })

    // AC-8 — and nothing else on the node moved.
    expect(axesOf(A_HEADLINE)).toMatchObject({
      fontSizePx: 48,
      fontWeight: 700,
      letterSpacingPx: -1.5,
    })

    // The PAGE paints the entry's colour, so the conversion literal→reference is
    // invisible downstream.
    const { outDir } = await cmdRender('acme', { cwd })
    const html = fs.readFileSync(path.join(outDir, 'index.html'), 'utf8')
    expect(html).toContain('#2e86a3')
  })

  // A shade rides on the REFERENCE (REQ-137), so one entry serves a whole
  // light↔dark family and moving the entry moves all of it.
  it('test_UAT_FC_REQ-140_a_shade_is_carried_on_the_reference_not_baked_into_a_colour', async () => {
    expect((await set(A_HEADLINE, { color: { ref: 'brand', shade: 0.4 } })).ok).toBe(true)
    expect(axesOf(A_HEADLINE).color).toEqual({ ref: 'brand', shade: 0.4 })

    // A zero shade is the entry's own colour, so it is PRUNED rather than
    // stored: `{ref, shade: 0}` and `{ref}` are the same colour, and a picker
    // that always sends its slider position must not put noise in the file.
    expect((await set(A_HEADLINE, { color: { ref: 'ink', shade: 0 } })).ok).toBe(true)
    expect(axesOf(A_HEADLINE).color).toEqual({ ref: 'ink' })
  })

  // AC-2 — background colour is a field on the PANEL, never on the text. A
  // folded run's box is glyph-tight, so a fill painted there is a rectangle
  // behind the words rather than the background anyone means.
  it('test_UAT_FC_REQ-140_a_panel_offers_its_background_colour_and_a_run_does_not', async () => {
    const panel = await fieldsOf(A_PANEL)
    expect(panel.find((f) => f.name === 'surfaceFill')).toMatchObject({
      label: 'Background colour',
      type: 'color',
    })
    expect(await valuesOf(A_PANEL)).toMatchObject({ surfaceFill: '#101820' })

    // The text segment offers its own colour and NOT the panel's fill.
    expect((await fieldsOf(A_HEADLINE)).map((f) => f.name)).not.toContain('surfaceFill')

    const saved = await set(A_PANEL, { surfaceFill: { ref: 'ink', shade: -0.25 } })
    expect(saved.ok).toBe(true)
    expect(axesOf(A_PANEL).surfaceFill).toEqual({ ref: 'ink', shade: -0.25 })
  })

  // A segment that paints by some axis other than a fill is still a segment, and
  // it can still be given one. Before REQ-140 this node had no fields at all and
  // read as "nothing to edit" — a box you could click, outline and open to be
  // told there was nothing inside it.
  it('test_UAT_FC_REQ-140_a_painted_box_with_no_fill_can_still_be_given_one', async () => {
    expect((await fieldsOf(A_BARE_BOX)).map((f) => f.name)).toEqual(['surfaceFill'])
    expect(await valuesOf(A_BARE_BOX)).not.toHaveProperty('surfaceFill')

    expect((await set(A_BARE_BOX, { surfaceFill: { ref: 'brand' } })).ok).toBe(true)
    expect(axesOf(A_BARE_BOX)).toEqual({ borderRadiusPx: 8, surfaceFill: { ref: 'brand' } })
  })

  // AC-4 — a reference the palette does not hold is refused AT THE FIELD, and
  // the draft is byte-unchanged. The envelope validator would also catch it, but
  // it could not say which field — and the case this exists for is a client
  // holding a stale listing, where "which entry" is the whole answer.
  it('test_UAT_FC_REQ-140_a_colour_outside_the_palette_is_refused_naming_the_field', async () => {
    const before = draftBytes()

    const unknown = await set(A_HEADLINE, { color: { ref: 'not-an-entry' } })
    expect(unknown.ok).toBe(false)
    expect(unknown.error!.path).toBe(`${A_HEADLINE}/color`)
    expect(unknown.error!.message).toContain('not-an-entry')
    // It names what IS available, so the message says what to do next.
    expect(unknown.error!.message).toContain('brand')

    // A HEX is refused too, even though it is a valid L1 colour — that is the
    // whole point of AC-3. Honouring it would put an off-system colour on the
    // page by the one route the design closes.
    const hex = await set(A_HEADLINE, { color: '#ff0000' })
    expect(hex.ok).toBe(false)
    expect(hex.error!.path).toBe(`${A_HEADLINE}/color`)

    // AC-5 — the reference's axes are bounded.
    const shade = await set(A_HEADLINE, { color: { ref: 'brand', shade: 2 } })
    expect(shade.ok).toBe(false)
    expect(shade.error!.message).toContain('-1')

    // An unknown key is refused rather than dropped: the schema is `.strict()`,
    // so a value this admits must be one the envelope validator will too.
    const extra = await set(A_HEADLINE, { color: { ref: 'brand', step: '900' } })
    expect(extra.ok).toBe(false)
    expect(extra.error!.message).toContain('step')

    // NOTHING LANDED — four refusals, and the file is byte-identical.
    expect(draftBytes()).toBe(before)
  })

  // AC-6 — THE SUBTLE ONE. The modal posts every staged field, so a words-only
  // edit re-posts the colour the run already had. On a folded site that is a HEX
  // — which the rule above refuses — so without the status-quo carve-out,
  // colour's arrival would have broken editing the words of any run that has a
  // literal colour, which is every run on every folded site.
  it('test_UAT_FC_REQ-140_reposting_an_untouched_literal_colour_is_not_an_edit', async () => {
    const saved = await set(A_HEADLINE, { text: 'Rewritten', color: '#f6f7f4' })
    expect(saved.ok).toBe(true)

    // The colour is not in the change list — it did not change — and the axis is
    // still the literal it was. A "helpful" conversion to a reference here would
    // be an edit nobody asked for.
    expect(saved.data!.changed).toEqual(['text'])
    expect(axesOf(A_HEADLINE).color).toBe('#f6f7f4')
    expect(draftNode(A_HEADLINE).text).toBe('Rewritten')
  })

  // AC-5 (navigation half) — the origin resolves WHICH panel sits behind a run,
  // because it is the only side holding the tree. Nearest, not outermost: the
  // panel someone means by "behind this text" is the one immediately behind it.
  it('test_UAT_FC_REQ-140_the_panel_behind_a_run_is_its_nearest_painted_ancestor', async () => {
    const nested = (await get(A_PANEL_COPY)).data!.panel as { path: string; fill: string }
    expect(nested.path).toBe(A_PANEL)
    expect(nested.fill).toBe('#101820')

    // The headline's own nearest painted ancestor is the root, which is also its
    // outermost — so the case above is the one that distinguishes them.
    const top = (await get(A_HEADLINE)).data!.panel as { path: string; fill: string }
    expect(top.path).toBe('0')
    expect(top.fill).toBe('#0b1220')

    // A panel is what a run escalates TO, so it carries no escalation of its own.
    expect((await get(A_PANEL)).data!.panel).toBeUndefined()

    // The address the escalation hands back resolves to a segment with a fill
    // field — the link cannot open an empty modal.
    expect((await fieldsOf(nested.path)).map((f) => f.name)).toContain('surfaceFill')
  })

  // AC-6 (empty palette) — most folded sites hold literals and no palette, so a
  // picker that opens onto nothing is the COMMON first state, not an edge case.
  // The field is still offered: the picker it opens is also where the first
  // entry gets added, and withdrawing it would make the palette unreachable from
  // the only surface that wants one.
  it('test_UAT_FC_REQ-140_a_site_with_no_palette_still_offers_the_colour_field', async () => {
    seedSite(cwd, 'acme', null)

    const colour = (await fieldsOf(A_HEADLINE)).find((f) => f.name === 'color')
    expect(colour).toMatchObject({ type: 'color' })
    expect((await get(A_HEADLINE)).data!.palette).toBeUndefined()

    // And a reference is still refused — with a message about the palette rather
    // than about the entry, because "this site has no palette yet" is the fact
    // that actually explains it.
    const refused = await set(A_HEADLINE, { color: { ref: 'brand' } })
    expect(refused.ok).toBe(false)
    expect(refused.error!.message).toMatch(/no palette yet/)
  })

  // AC-7 — the two dead example sites are gone. They were built on the semantic
  // layout modules the framework pivot deleted, so nothing could render them;
  // what kept them alive was two test fixtures, now stated directly.
  it('test_UAT_FC_REQ-140_the_dead_example_sites_are_gone_from_the_store', () => {
    for (const slug of ['1stcontact', 'harbor-cafe']) {
      expect(fs.existsSync(path.join(REPO_ROOT, 'storage', 'sites', slug))).toBe(false)
    }
    // The store is not empty — a deletion that took everything with it would
    // pass every assertion above.
    expect(fs.readdirSync(path.join(REPO_ROOT, 'storage', 'sites')).length).toBeGreaterThan(0)
  })

  // AC-1/AC-5, in the real dialog. The colour row is drawn by the modal itself
  // rather than by `mountFields` — a palette reference is a typed object, which
  // the component's hex-valued `format: 'color'` has no seam for — so this
  // asserts the split lands where the descriptor says, not where a segment kind
  // says.
  describe.skipIf(!WEBUI_INSTALLED)(`the dialog (${WEBUI_SKIP_REASON})`, () => {
    let html: string
    let pageId: string
    let builder: BuilderHandle
    let mountEditor: (doc: Document, options: Record<string, unknown>) => { destroy(): void }
    let editor: { destroy(): void } | undefined
    let restoreFetch: () => void
    let picked: unknown[]

    beforeAll(async () => {
      ;({ mountEditor } = await import('../apps/control-app/src/builder/editor.js'))
    }, 240000)

    afterAll(async () => {
      await builder?.close()
    })

    beforeEach(async () => {
      seedSite(cwd, 'acme')
      const { outDir } = await cmdRender('acme', { cwd, edit: true })
      html = fs.readFileSync(path.join(outDir, 'index.html'), 'utf8')
      pageId = new RegExp(`${L1_EDIT_PAGE_ATTR}="([^"]+)"`).exec(html)![1]
      builder = await startBuilder({ cwd })
      const real = globalThis.fetch
      const origin = builder.url
      globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) =>
        real(typeof input === 'string' ? new URL(input, origin) : input, init)) as typeof fetch
      restoreFetch = () => {
        globalThis.fetch = real
      }
      picked = []
      document.body.replaceChildren()
    }, 240000)

    afterEach(async () => {
      editor?.destroy()
      editor = undefined
      for (const m of document.querySelectorAll('.builder-modal')) m.remove()
      restoreFetch?.()
      await builder?.close()
    })

    const modals = () => [...document.querySelectorAll('.builder-modal')]

    async function settle(want: number): Promise<void> {
      for (let i = 0; i < 400 && modals().length !== want; i += 1) {
        await new Promise((r) => setTimeout(r, 5))
      }
    }

    /**
     * Open a segment with a STUB picker standing in for REQ-133's popup.
     *
     * The popup is REQ-133's, tested there; what is under test here is the
     * caller — that a colour row exists, that clicking it asks for a colour, and
     * that whatever comes back is staged. Driving the real popup would test the
     * popup a second time and couple this suite to its markup.
     */
    async function openAt(address: string, answer: unknown = { ref: 'brand' }): Promise<Element> {
      document.documentElement.innerHTML = /<html[^>]*>([\s\S]*)<\/html>/.exec(html)![1]
      document.body.setAttribute(L1_EDIT_MARKER_ATTR, '')
      document.body.setAttribute(L1_EDIT_PAGE_ATTR, pageId)
      editor = mountEditor(document, {
        slug: 'acme',
        bridge: { mountL1EditBridge, formatL1Path, L1_EDIT_PAGE_ATTR },
        colors: {
          open: (value: unknown) => {
            picked.push(value)
            return Promise.resolve(answer)
          },
        },
      })
      const el = document.querySelector(`[${L1_EDIT_PATH_ATTR}="${address}"]`)
      if (!el) throw new Error(`nothing rendered at ${address}`)
      el.dispatchEvent(new window.MouseEvent('click', { bubbles: true }))
      await settle(1)
      return modals()[0]
    }

    it('test_UAT_FC_REQ-140_the_colour_row_sits_in_the_sheet_and_opens_the_picker', async () => {
      const modal = await openAt(A_HEADLINE)

      const sheet = modal.querySelector('.builder-modal__props')!
      const row = sheet.querySelector('.builder-color')
      expect(row, 'no colour row in the parameter sheet').toBeTruthy()

      // Drawn by THIS dialog, not by the component: a `data-field` row would
      // mean `mountFields` had claimed it, and its value is a hex string.
      expect(sheet.querySelector('[data-field="color"]')).toBeFalsy()

      // The words are still in the box, and the colour is not among them.
      const box = modal.querySelector('.builder-modal__box')!
      expect(box.querySelector('.builder-color')).toBeFalsy()

      // Clicking asks for a colour, and it asks with what the segment holds —
      // which for a literal is `null`, because a hex names no entry to
      // pre-select.
      ;(row!.querySelector('.builder-color__swatch') as HTMLElement).click()
      await new Promise((r) => setTimeout(r, 0))
      expect(picked).toEqual([null])
    })

    it('test_UAT_FC_REQ-140_a_picked_colour_saves_in_the_same_diff_as_the_words', async () => {
      const modal = await openAt(A_HEADLINE)
      ;(modal.querySelector('.builder-color__swatch') as HTMLElement).click()
      await new Promise((r) => setTimeout(r, 0))

      // ONE modal, ONE diff (DOC-28 §11): Save posts the picked colour in the
      // same change map as everything else the dialog is holding.
      const save = [...modal.querySelectorAll('button')].find((b) => b.textContent === 'Save')!
      save.click()
      for (let i = 0; i < 400 && modals().length; i += 1) {
        await new Promise((r) => setTimeout(r, 5))
      }
      expect(axesOf(A_HEADLINE).color).toEqual({ ref: 'brand' })
    })

    it('test_UAT_FC_REQ-140_the_text_modal_shows_the_panel_behind_it_and_opens_it', async () => {
      const modal = await openAt(A_PANEL_COPY)

      // Variant B — the INHERITED ROW: a read-only swatch answering "what is
      // behind this?" as well as "where do I change it?". A bare link would only
      // route; this teaches where backgrounds live.
      const row = modal.querySelector('.builder-escalate')!
      expect(row, 'no escalation row on a run that sits on a panel').toBeTruthy()
      expect(row.textContent).toContain('from the panel behind this text')
      // Read-only: the row reports the panel's colour and offers no control for
      // it — the panel's own modal is the one place it is edited.
      expect(row.querySelector('.builder-color__swatch')).toBeFalsy()

      // Following it opens the PANEL's modal, which is where the fill lives.
      ;(row.querySelector('.builder-escalate__link') as HTMLElement).click()
      await settle(1)
      const panel = modals()[0]
      expect(panel.querySelector('.builder-color')).toBeTruthy()
      expect(panel.textContent).toContain('Background colour')
    })
  })
})
