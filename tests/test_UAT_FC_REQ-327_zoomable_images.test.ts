/**
 * REQ-327 UATs — "Zoomable images: let a visitor open a picture large".
 *
 * The reported gap was that a picture could be linked and nothing else, so a site
 * whose argument is carried by detailed plates had no way to let anyone read their
 * detail — and the only substitute, a link to a page holding the same picture,
 * navigates away and loses the scroll position.
 *
 * The three boundaries every other L1 capability is proved at, and for the same
 * reasons: the envelope validator (what a document may say), the sole markup/CSS
 * emitter (what a page becomes), and — because the dismissals, the focus move and
 * the scroll lock are not observable in markup at all — the published page driven
 * end to end in jsdom, running exactly the script the renderer emitted.
 *
 * The fourth boundary is REUSE, and it earns its own describe block: the ticket's
 * obligations are the modal's, and a second overlay implementation beside REQ-212's
 * would be the failure even if every behavioural assertion below passed. So the
 * suite asserts the page ships REQ-212's script and no other, and that a zoom is
 * carried by the very markers `page-state` already reads.
 */
import { JSDOM } from 'jsdom'
import { describe, expect, it } from 'vitest'
import {
  danglingAssetReferences,
  emailTargetErrors,
  l1AssetReferences,
  l1BoxSchema,
  l1ContainerSchema,
  l1ControlSchema,
  l1ImageSchema,
  l1SlotSchema,
  l1TextSchema,
  validateL1,
  type L1Document,
  type L1Node,
} from '../packages/site-schema/src/index'
import {
  listL1Dialogs,
  renderL1Document,
  L1_DIALOG_SCRIPT,
  L1_ZOOM_CSS,
} from '../packages/framework/src/index'

const WIDTHS = [320, 768, 1440]

const doc = (root: L1Node): L1Document => ({ widths: WIDTHS, root })
const render = (
  root: L1Node,
  opts: Parameters<typeof renderL1Document>[1] = {},
): { html: string; css: string; js?: string } => renderL1Document(doc(root), opts)

/** The messages a rejected document reported, joined for substring assertions. */
const refusals = (root: L1Node): string => {
  const result = validateL1(doc(root))
  return result.ok ? '' : result.errors.map((e) => `${e.path}: ${e.message}`).join('\n')
}

/**
 * The page the ticket describes: a plate at its placed width, openable large.
 *
 * `zoom: {}` deliberately — the empty form is the claim that one field is the
 * whole of the common case, so every behavioural assertion below is made about a
 * document that named nothing but the role itself.
 */
const platePage = (zoom: Record<string, unknown> = {}): L1Node => ({
  kind: 'container',
  layout: 'stack',
  children: [
    { kind: 'text', text: 'Plate I — the ladder', heading: { level: 2 } },
    {
      kind: 'image',
      id: 'plate-1',
      src: '/assets/plate-1.png',
      alt: 'Plate I — a lettered diagram of the ladder',
      sizing: { width: { mode: 'fluid' }, height: { mode: 'hug' } },
      zoom,
    },
  ],
})

/** The manifest a publish of one 2400px-wide plate would produce. */
const PLATE_MANIFEST = {
  'plate-1.png': {
    width: 2400,
    height: 1600,
    renditions: [
      { src: 'assets/d/abc123-320.png', width: 320 },
      { src: 'assets/d/abc123-640.png', width: 640 },
      { src: 'assets/plate-1.png', width: 2400 },
    ],
  },
}

/**
 * The published page, in a browser that runs its inline script.
 *
 * `runScripts: 'dangerously'` is what makes these end-to-end rather than markup
 * assertions: the script under test is the one the renderer emitted, in the markup
 * the renderer emitted, with nothing stubbed.
 */
async function drive(root: L1Node): Promise<{ dom: JSDOM; doc: Document }> {
  const { html, css } = render(root)
  const dom = new JSDOM(
    `<!doctype html><html><head><style>${css}</style></head><body>${html}</body></html>`,
    { runScripts: 'dangerously' },
  )
  // The script wires itself on `DOMContentLoaded`, which jsdom delivers on a later
  // turn of the loop than the constructor returns on. Yielding once is what makes
  // every assertion below about the WIRED page rather than a race.
  await new Promise((resolve) => dom.window.setTimeout(resolve, 0))
  return { dom, doc: dom.window.document }
}

const click = (dom: JSDOM, el: Element): void => {
  el.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, cancelable: true }))
}
const key = (dom: JSDOM, k: string): void => {
  dom.window.document.dispatchEvent(
    new dom.window.KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }),
  )
}

/** The trigger, the shell and the panel of the one zoom on the page. */
function parts(d: Document): { trigger: Element; shell: Element; panel: Element; large: Element } {
  const trigger = d.querySelector('button[data-l1-opens]')
  const shell = d.querySelector('[data-l1-dialog]')
  expect(trigger).not.toBeNull()
  expect(shell).not.toBeNull()
  const panel = shell!.firstElementChild!
  return { trigger: trigger!, shell: shell!, panel, large: panel.querySelector('img')! }
}

describe('REQ-327 — what the vocabulary accepts', () => {
  it('test_UAT_FC_REQ-327_a_picture_may_be_openable_large', () => {
    // The empty form is the whole of the common case, and every field is optional
    // for something the empty form cannot state.
    const image = { kind: 'image', src: '/assets/p.png', alt: 'a plate' }
    expect(l1ImageSchema.safeParse({ ...image, zoom: {} }).success).toBe(true)
    expect(
      l1ImageSchema.safeParse({
        ...image,
        zoom: {
          src: '/assets/p-full.png',
          alt: 'a plate, in full detail',
          backdrop: { color: '#0b1020', opacity: 0.8 },
          ariaLabel: 'Plate I, enlarged',
        },
      }).success,
    ).toBe(true)
  })

  it('test_UAT_FC_REQ-327_only_a_picture_can_be_openable_large', () => {
    // A box has no replaced content to open, so the role would be inert everywhere
    // else it was accepted. `.strict()` is what refuses the rest — by shape, rather
    // than by a rule someone has to remember.
    const zoom = {}
    expect(l1TextSchema.safeParse({ kind: 'text', text: 'x', zoom }).success).toBe(false)
    expect(l1BoxSchema.safeParse({ kind: 'box', zoom, children: [] }).success).toBe(false)
    expect(
      l1ContainerSchema.safeParse({ kind: 'container', layout: 'stack', zoom, children: [] }).success,
    ).toBe(false)
    expect(l1ControlSchema.safeParse({ kind: 'control', control: 'submit', zoom }).success).toBe(false)
    expect(l1SlotSchema.safeParse({ kind: 'slot', name: 'form', zoom }).success).toBe(false)
  })

  it('test_UAT_FC_REQ-327_the_role_carries_no_way_to_paint_and_no_way_to_script', () => {
    // The overlay's presentation is the renderer's, because it is a statement about
    // the page AROUND the picture. An axis smuggled in here would be a document
    // deciding how the substrate covers a viewport.
    const image = { kind: 'image', src: '/assets/p.png', alt: 'a plate' }
    for (const smuggled of [
      { zIndex: 9999 },
      { placement: 'top' },
      { onClick: 'alert(1)' },
      { css: '.x{}' },
      { dismissOnEscape: false },
    ]) {
      expect(
        l1ImageSchema.safeParse({ ...image, zoom: smuggled }).success,
        JSON.stringify(smuggled),
      ).toBe(false)
    }
  })
})

describe('REQ-327 — what the envelope refuses', () => {
  it('test_UAT_FC_REQ-327_a_picture_cannot_both_navigate_away_and_open_here', () => {
    // The emitter emits ONE interactive element, so which role it took would be its
    // decision rather than the document's — the rule `action` and `link` answer to.
    const said = refusals({
      kind: 'image',
      src: '/assets/p.png',
      alt: 'a plate',
      link: { href: '/plates' },
      zoom: {},
    })
    expect(said).toContain('cannot carry both `link` and `zoom`')
  })

  it('test_UAT_FC_REQ-327_a_larger_source_clears_the_same_url_allowlist_as_the_placed_one', () => {
    // It reaches the SAME `<img src>` sink, so a second, looser rule here would be
    // a hole in the envelope reachable only through the new field.
    for (const bad of ['javascript:alert(1)', 'data:image/svg+xml,<svg/>', 'file:///etc/passwd']) {
      const said = refusals({
        kind: 'image',
        src: '/assets/p.png',
        alt: 'a plate',
        zoom: { src: bad },
      })
      expect(said, bad).toContain('is not an allowed URL')
      expect(said, bad).toContain('/zoom/src')
    }
  })

  it('test_UAT_FC_REQ-327_a_larger_source_the_site_does_not_hold_is_reported', () => {
    // A zoom that opens onto a broken image is worse than no zoom: the visitor has
    // already committed a click to it before finding out.
    const page = platePage({ src: '/assets/plate-1-full.png' })
    const seen = l1AssetReferences(page).map((r) => r.value)
    expect(seen).toContain('/assets/plate-1.png')
    expect(seen).toContain('/assets/plate-1-full.png')

    const dangling = danglingAssetReferences(page, ['/assets/plate-1.png'])
    expect(dangling.map((d) => d.value)).toEqual(['/assets/plate-1-full.png'])
    expect(dangling[0].path).toContain('/zoom/src')
    expect(dangling[0].message).toContain('must name an asset the site holds')

    // And nothing is reported once the site holds it.
    expect(
      danglingAssetReferences(page, ['/assets/plate-1.png', '/assets/plate-1-full.png']),
    ).toEqual([])
  })

  it('test_UAT_FC_REQ-327_an_email_page_refuses_a_zoomable_picture_by_name', () => {
    // An overlay is a script and a message has no script, so a zoom there would
    // silently ignore the one field asking for it — the failure `dialog` and
    // `action` are already refused by name to avoid.
    const said = emailTargetErrors({
      widths: [600],
      root: {
        kind: 'container',
        layout: 'stack',
        children: [{ kind: 'image', src: '/assets/p.png', alt: 'a plate', zoom: {} }],
      },
    })
      .map((e) => `${e.path}: ${e.message}`)
      .join('\n')
    expect(said).toContain('/zoom')
  })

  it('test_UAT_FC_REQ-327_the_page_of_plates_the_ticket_describes_validates', () => {
    expect(validateL1(doc(platePage())).ok).toBe(true)
  })
})

describe('REQ-327 — the trigger', () => {
  it('test_UAT_FC_REQ-327_the_picture_is_wrapped_in_a_real_button_that_opens_the_overlay', () => {
    const { html } = render(platePage())
    // A REAL button, because the keyboard has to reach it and Enter/Space have to
    // work without the shared script learning two more keys.
    const m = /<button([^>]*)>(<img[^>]*class="l1-\d+"[^>]*\/>)<\/button>/.exec(html)
    expect(m, html).not.toBeNull()
    const attrs = m![1]
    expect(attrs).toContain('type="button"')
    expect(attrs).toContain('aria-haspopup="dialog"')
    // The server renders the panel OPEN, so the control's state starts honest and
    // the script corrects it once it has folded the panel away.
    expect(attrs).toContain('aria-expanded="true"')
    expect(attrs).toMatch(/aria-controls="[^"]+"/)
    expect(attrs).toMatch(/data-l1-opens="[^"]+"/)
    // The document's own `id` stays on the picture, not on the wrapper: `plate-1`
    // is what an anchor and the editor address.
    expect(m![2]).toContain('id="plate-1"')
  })

  it('test_UAT_FC_REQ-327_the_wrapper_generates_no_box_so_the_pictures_own_rules_still_land', () => {
    const { html, css } = render(platePage())
    // Every geometry, sizing and paint rule is emitted against the PICTURE's own
    // selector, so a boxless wrapper is what keeps the placed picture laying out
    // exactly as the bare `<img>` did.
    expect(L1_ZOOM_CSS).toContain('display: contents')
    expect(css).toContain('.l1-zoomable { display: contents; cursor: zoom-in }')
    const cls = /<img class="(l1-\d+)"[^>]*id="plate-1"/.exec(html)
    expect(cls, html).not.toBeNull()
    expect(css).toContain(`.${cls![1]} { `)
    expect(css).toContain('width: 100%')
  })

  it('test_UAT_FC_REQ-327_the_cursor_says_the_picture_is_openable_and_the_overlay_says_how_to_leave', () => {
    // The reporter names this: a picture that gives no sign of being openable is a
    // capability nobody discovers. `cursor` inherits, which is what lets the boxless
    // wrapper set it on the picture with no second selector.
    const { css } = render(platePage())
    expect(css).toContain('cursor: zoom-in')
    // And the overlay's own cursor is gated on the marker only the script sets, so
    // an unenhanced page never advertises a gesture it cannot honour.
    expect(css).toContain('html[data-l1-dialog-ready] .l1-zoom { cursor: zoom-out }')
    expect(css).not.toMatch(/^\.l1-zoom \{[^}]*cursor: zoom-out/m)
  })

  it('test_UAT_FC_REQ-327_the_focus_ring_is_drawn_on_the_picture_because_the_wrapper_paints_nothing', () => {
    // A boxless element paints no outline, so a ring on the wrapper would be a ring
    // nobody sees — the exact cost REQ-106 refuses to pay when it retags a link.
    const { css } = render(platePage())
    expect(css).toContain('.l1-zoomable:focus-visible img { outline:')
  })
})

describe('REQ-327 — the overlay and the large picture', () => {
  it('test_UAT_FC_REQ-327_the_panel_carries_the_dialog_role_its_modality_and_the_pictures_own_name', () => {
    const { html } = render(platePage())
    const m = /<div class="l1-zoom" id="([^"]+)"([^>]*)>/.exec(html)
    expect(m, html).not.toBeNull()
    expect(m![2]).toContain('role="dialog"')
    expect(m![2]).toContain('aria-modal="true"')
    // Focus has somewhere to land in a panel holding nothing focusable.
    expect(m![2]).toContain('tabindex="-1"')
    // Named by what it is showing, which the alt text already wrote down.
    expect(m![2]).toContain('aria-label="Plate I — a lettered diagram of the ladder"')
    // And the trigger points at exactly this region.
    expect(html).toContain(`aria-controls="${m![1]}"`)
  })

  it('test_UAT_FC_REQ-327_a_document_that_names_a_label_is_not_overridden_by_the_alt_text', () => {
    const { html } = render(platePage({ ariaLabel: 'Plate I, enlarged' }))
    expect(html).toContain('aria-label="Plate I, enlarged"')
  })

  it('test_UAT_FC_REQ-327_the_ground_is_dimmed_even_when_the_document_names_no_scrim', () => {
    // The one place this role's defaults differ from a dialog's: a modal with no
    // scrim is a legitimate design, but a picture opened large onto an undimmed
    // page is the feature failing to happen.
    const { css } = render(platePage())
    expect(css).toMatch(/html\[data-l1-dialog-ready\] \.l1-\d+-dlg\[data-l1-open\] \{[^}]*background-color: #000000/)
  })

  it('test_UAT_FC_REQ-327_a_document_that_names_a_scrim_gets_its_own', () => {
    const { css } = render(platePage({ backdrop: { color: '#0b1020', opacity: 0.5 } }))
    expect(css).toContain('background-color: #0b102080')
  })

  it('test_UAT_FC_REQ-327_the_large_picture_is_the_original_and_never_a_rendered_down_variant', () => {
    // The whole point of opening it is the detail a rendered-down variant has
    // already thrown away, so offering the browser a ladder here would let it
    // choose the picture the overlay exists to escape.
    const { html } = render(platePage(), { delivery: PLATE_MANIFEST })
    const large = /<img class="l1-zoom-img"([^>]*)\/>/.exec(html)
    expect(large, html).not.toBeNull()
    expect(large![1]).toContain('src="assets/plate-1.png"')
    expect(large![1]).not.toContain('srcset')
    expect(large![1]).not.toContain('sizes')
    // The PLACED picture keeps its ladder: this changes nothing about REQ-222.
    expect(html).toContain('srcset="assets/d/abc123-320.png 320w')
  })

  it('test_UAT_FC_REQ-327_the_large_picture_reserves_its_box_and_is_fetched_lazily', () => {
    const { html } = render(platePage(), { delivery: PLATE_MANIFEST })
    const large = /<img class="l1-zoom-img"([^>]*)\/>/.exec(html)!
    // Intrinsic dimensions from the manifest: the overlay reserves the right box
    // before a byte of a 2400px plate has arrived.
    expect(large[1]).toContain('width="2400"')
    expect(large[1]).toContain('height="1600"')
    // A page of four plates should not pay for four originals before anyone has
    // clicked one.
    expect(large[1]).toContain('loading="lazy"')
    expect(large[1]).toContain('decoding="async"')
  })

  it('test_UAT_FC_REQ-327_a_higher_resolution_original_is_shown_in_place_of_the_placed_one', () => {
    const { html } = render(platePage({ src: '/assets/plate-1-full.png', alt: 'every letter legible' }))
    const large = /<img class="l1-zoom-img"([^>]*)\/>/.exec(html)!
    expect(large[1]).toContain('src="assets/plate-1-full.png"')
    expect(large[1]).toContain('alt="every letter legible"')
    // And the placed picture is untouched by the choice.
    expect(html).toContain('src="assets/plate-1.png"')
  })

  it('test_UAT_FC_REQ-327_the_large_picture_is_sized_to_fit_what_covers_the_viewport', () => {
    const { css } = render(platePage())
    expect(css).toContain('max-width: 100vw')
    expect(css).toContain('max-height: 100vh')
    expect(css).toContain('object-fit: contain')
  })

  it('test_UAT_FC_REQ-327_the_overlay_is_gated_on_a_marker_only_the_script_sets', () => {
    // It fails VISIBLE: with no script the shell contributes no box and the large
    // picture is an ordinary part of the page, open and usable — never content
    // hidden behind a gesture nothing can perform.
    const { css } = render(platePage())
    expect(css).toContain('.l1-dlg { display: contents }')
    expect(css).toContain('html[data-l1-dialog-ready] .l1-dlg { display: none }')
    // The markup AS SERVED (the shell and its panel, not the script that later
    // subtracts from them) carries neither marker: the panel is open, in flow.
    const shell = /<div class="l1-dlg [^"]*"([^>]*)>/.exec(render(platePage()).html)
    expect(shell).not.toBeNull()
    expect(shell![1]).not.toContain('data-l1-open')
    expect(shell![1]).not.toContain('data-l1-dialog-ready')
  })
})

describe('REQ-327 — it is REQ-212 reused, not a second overlay', () => {
  it('test_UAT_FC_REQ-327_a_page_of_zoomable_plates_ships_the_modal_script_once_and_no_other', () => {
    const plates: L1Node = {
      kind: 'container',
      layout: 'stack',
      children: [1, 2, 3, 4].map((n) => ({
        kind: 'image' as const,
        src: `/assets/plate-${n}.png`,
        alt: `Plate ${n}`,
        zoom: {},
      })),
    }
    const { html, js } = render(plates)
    // The one vetted script, byte-identical to the modal's.
    expect(js ?? '').toContain(L1_DIALOG_SCRIPT)
    expect((js ?? '').split('data-l1-dialog-ready').length - 1).toBeGreaterThan(0)
    expect((html.match(/<script>/g) ?? []).length).toBe(1)
    // Four panels, four triggers, one stylesheet rule set.
    expect((html.match(/data-l1-dialog="/g) ?? []).length).toBe(4)
    const { css } = render(plates)
    expect((css.match(/\.l1-dlg \{ display: contents \}/g) ?? []).length).toBe(1)
    expect((css.match(/\.l1-zoomable \{/g) ?? []).length).toBe(1)
  })

  it('test_UAT_FC_REQ-327_the_script_carries_nothing_taken_from_the_document', () => {
    // Every colour, source and label the author wrote is compiled into the
    // stylesheet or into an attribute, so the script stays vetted-once.
    const { js } = render(platePage({ src: '/assets/plate-1-full.png', backdrop: { color: '#0b1020' } }))
    for (const instance of ['plate-1', '0b1020', 'Plate I', 'zoom-in']) {
      expect(js ?? '', instance).not.toContain(instance)
    }
  })

  it('test_UAT_FC_REQ-327_a_zoom_is_a_panel_the_page_declares_so_a_channel_switch_can_carry_it', async () => {
    // REQ-215 reads panels off the DOCUMENT. Because a zoom compiles to the same
    // shell and the same handle, an open zoom travels between the two preview
    // channels with nothing new asked of the renderer.
    const { doc: d } = await drive(platePage())
    const declared = listL1Dialogs(d)
    expect(declared).toHaveLength(1)
    expect(declared[0].label).toBe('Plate I — a lettered diagram of the ladder')
  })

  it('test_UAT_FC_REQ-327_the_edit_render_keeps_the_elements_and_loses_only_what_would_act', () => {
    // A click in the edit channel means "edit this picture", and a live overlay
    // would give the same click a second meaning.
    const { html, js } = render(platePage(), { edit: true })
    expect(js).toBeUndefined()
    expect(html).toContain('<button type="button" class="l1-zoomable">')
    expect(html).not.toContain('data-l1-opens')
    expect(html).not.toContain('data-l1-closes')
    expect(html).not.toContain('aria-haspopup')
    // The panel, its class, its role and its box all stay — the channel differs by
    // the missing target and nothing else.
    expect(html).toContain('class="l1-zoom"')
    expect(html).toContain('role="dialog"')
    expect(html).toContain('data-l1-dialog=')
  })
})

describe('REQ-327 — what the visitor can actually do', () => {
  it('test_UAT_FC_REQ-327_the_plate_opens_large_on_a_click_and_the_page_behind_stops_scrolling', async () => {
    const { dom, doc: d } = await drive(platePage())
    const { trigger, shell, panel } = parts(d)
    // Closed after wiring: the script only ever SUBTRACTS from the served page.
    expect(shell.hasAttribute('data-l1-open')).toBe(false)
    expect(trigger.getAttribute('aria-expanded')).toBe('false')

    click(dom, trigger)
    expect(shell.hasAttribute('data-l1-open')).toBe(true)
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    // Focus moves into the overlay — onto the panel itself, which is why it carries
    // `tabindex="-1"`: there is nothing else in there to focus.
    expect(d.activeElement).toBe(panel)
    // And the page behind does not scroll while it is open.
    expect(d.documentElement.hasAttribute('data-l1-dialog-lock')).toBe(true)
  })

  it('test_UAT_FC_REQ-327_escape_closes_it_and_focus_comes_back_to_the_picture', async () => {
    const { dom, doc: d } = await drive(platePage())
    const { trigger, shell } = parts(d)
    click(dom, trigger)
    key(dom, 'Escape')
    expect(shell.hasAttribute('data-l1-open')).toBe(false)
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    // Back to where the visitor was, not to the top of the document.
    expect(d.activeElement).toBe(trigger)
    expect(d.documentElement.hasAttribute('data-l1-dialog-lock')).toBe(false)
  })

  it('test_UAT_FC_REQ-327_a_click_away_closes_it', async () => {
    const { dom, doc: d } = await drive(platePage())
    const { trigger, shell } = parts(d)
    click(dom, trigger)
    click(dom, shell)
    expect(shell.hasAttribute('data-l1-open')).toBe(false)
    expect(d.activeElement).toBe(trigger)
  })

  it('test_UAT_FC_REQ-327_a_click_on_the_large_picture_closes_it_too', async () => {
    // A dialog's rule that a click inside the panel never closes it protects a panel
    // holding fields. A panel holding one picture and nothing interactive has no
    // such click to protect, and "click away" read strictly would leave a visitor
    // stabbing at the one part of the screen that is not the picture.
    const { dom, doc: d } = await drive(platePage())
    const { trigger, shell, large } = parts(d)
    click(dom, trigger)
    click(dom, large)
    expect(shell.hasAttribute('data-l1-open')).toBe(false)
    expect(d.activeElement).toBe(trigger)
  })

  it('test_UAT_FC_REQ-327_the_keyboard_can_open_it_because_the_trigger_is_a_button', async () => {
    // The reason the wrapper is a real `<button>` and not a picture with a click
    // handler: a keyboard visitor has to be able to reach and activate it. jsdom
    // implements the element's own activation behaviour, so `click()` here is the
    // Enter/Space path rather than a synthesised mouse event.
    const { doc: d } = await drive(platePage())
    const { trigger, shell, panel } = parts(d)
    expect(trigger.tagName).toBe('BUTTON')
    ;(trigger as HTMLElement).focus()
    expect(d.activeElement).toBe(trigger)
    ;(trigger as HTMLElement).click()
    expect(shell.hasAttribute('data-l1-open')).toBe(true)
    expect(d.activeElement).toBe(panel)
  })

  it('test_UAT_FC_REQ-327_tab_cannot_leave_the_open_overlay', async () => {
    const { dom, doc: d } = await drive(platePage())
    const { trigger, panel } = parts(d)
    click(dom, trigger)
    // Nothing in the panel is tabbable, so Tab keeps focus on the panel rather than
    // walking out into the page the overlay is covering.
    key(dom, 'Tab')
    expect(d.activeElement).toBe(panel)
  })

  it('test_UAT_FC_REQ-327_four_plates_open_and_close_independently', async () => {
    const plates: L1Node = {
      kind: 'container',
      layout: 'stack',
      children: [1, 2, 3, 4].map((n) => ({
        kind: 'image' as const,
        src: `/assets/plate-${n}.png`,
        alt: `Plate ${n}`,
        zoom: {},
      })),
    }
    const { dom, doc: d } = await drive(plates)
    const triggers = [...d.querySelectorAll('button[data-l1-opens]')]
    const shells = [...d.querySelectorAll('[data-l1-dialog]')]
    expect(triggers).toHaveLength(4)
    // Each trigger names its OWN panel: a shared handle would open the wrong plate.
    expect(new Set(triggers.map((t) => t.getAttribute('data-l1-opens'))).size).toBe(4)

    click(dom, triggers[2])
    expect(shells.map((s) => s.hasAttribute('data-l1-open'))).toEqual([false, false, true, false])
    expect(d.activeElement).toBe(shells[2].firstElementChild)
    key(dom, 'Escape')
    expect(shells.some((s) => s.hasAttribute('data-l1-open'))).toBe(false)
    expect(d.documentElement.hasAttribute('data-l1-dialog-lock')).toBe(false)
  })
})
