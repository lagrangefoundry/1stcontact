/**
 * REQ-330 UATs — "Let an image be opened large: click-to-zoom / lightbox".
 *
 * The reporter asked for two things of quite different cost. The SMALL VERSION —
 * one flag on the picture, an overlay, dismissal, alt text carried across — landed
 * as REQ-327's `zoom` role and is proved by that ticket's own suite. What is
 * proved here is the remainder this ticket asked for and that one did not supply:
 *
 *   - **the fuller version**: several pictures form a set, the overlay steps
 *     between them, and the caption travels with the image;
 *   - **dismissal by scroll**, which the small version does not do;
 *   - **the overlay's chrome colour**, which the set makes necessary — a caption
 *     and two controls are ink drawn on the backdrop, and `backdrop` alone made
 *     the ground authorable while leaving everything on it fixed.
 *
 * The same boundaries REQ-327 is proved at, for the same reasons: the envelope
 * validator (what a document may say), the sole markup/CSS emitter (what a page
 * becomes), and the published page driven end to end in jsdom — which is the only
 * place stepping, wrapping and dismissal are observable at all.
 *
 * REUSE earns its own block here as it does there, and the claim is stronger: a
 * gallery is the overlay that already exists holding more than one picture, so a
 * second overlay implementation would be the failure even if every behavioural
 * assertion below passed.
 */
import { JSDOM } from 'jsdom'
import { describe, expect, it } from 'vitest'
import {
  l1BoxSchema,
  l1ImageSchema,
  l1TextSchema,
  validateL1,
  type L1Document,
  type L1Node,
} from '../packages/site-schema/src/index'
import {
  renderL1Document,
  L1_DIALOG_SCRIPT,
  L1_ZOOM_SCRIPT,
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
 * The page the reporter describes: four detailed plates, each openable large and
 * all four forming one set.
 *
 * They are deliberately NOT siblings — plate 3 is nested two boxes deep — because
 * a set's members being scattered through the tree is the whole reason the overlay
 * cannot be emitted at any one of them.
 */
const PLATES = [
  { n: 1, title: 'the ladder' },
  { n: 2, title: 'the garden' },
  { n: 3, title: 'the tower' },
  { n: 4, title: 'the sea' },
]

const plate = (n: number, title: string, zoom: Record<string, unknown>): L1Node => ({
  kind: 'image',
  src: `/assets/plate-${n}.png`,
  alt: `Plate ${n} — ${title}`,
  zoom,
})

/** A gallery of four, with per-member overrides applied by index. */
const gallery = (
  per: (i: number) => Record<string, unknown> = () => ({}),
  group = 'plates',
): L1Node => ({
  kind: 'container',
  layout: 'stack',
  children: [
    plate(1, PLATES[0].title, { group, ...per(0) }),
    plate(2, PLATES[1].title, { group, ...per(1) }),
    {
      kind: 'box',
      children: [
        {
          kind: 'box',
          children: [plate(3, PLATES[2].title, { group, ...per(2) })],
        },
      ],
    },
    plate(4, PLATES[3].title, { group, ...per(3) }),
  ],
})

/** The published page, in a browser that runs the scripts the renderer emitted. */
async function drive(root: L1Node): Promise<{ dom: JSDOM; doc: Document }> {
  const { html, css } = render(root)
  const dom = new JSDOM(
    `<!doctype html><html><head><style>${css}</style></head><body>${html}</body></html>`,
    { runScripts: 'dangerously' },
  )
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
const gesture = (dom: JSDOM, kind: string): void => {
  dom.window.document.dispatchEvent(
    new dom.window.Event(kind, { bubbles: true, cancelable: true }),
  )
}

/** The one overlay of a set, and the parts a visitor acts on. */
function set(d: Document): {
  shell: Element
  panel: Element
  triggers: Element[]
  members: Element[]
  prev: Element
  next: Element
} {
  const shell = d.querySelector('[data-l1-zoom]')!
  expect(shell).not.toBeNull()
  const panel = shell.firstElementChild!
  return {
    shell,
    panel,
    triggers: [...d.querySelectorAll('button[data-l1-zoom-to]')],
    members: [...panel.querySelectorAll('[data-l1-zoom-i]')],
    prev: panel.querySelector('.l1-zoom-prev')!,
    next: panel.querySelector('.l1-zoom-next')!,
  }
}

/** Which member the overlay is showing, by index. */
const showing = (d: Document): number =>
  set(d).members.findIndex((m) => m.hasAttribute('data-l1-zoom-cur'))

/** What the overlay is saying about the member it is showing. */
const caption = (d: Document): string =>
  set(d).members[showing(d)]?.querySelector('.l1-zoom-cap')?.textContent ?? ''

describe('REQ-330 — what the vocabulary accepts', () => {
  it('test_UAT_FC_REQ-330_pictures_may_form_a_set_and_say_what_they_show', () => {
    // The fuller version the reporter asked for, as five optional fields on the
    // role that already exists: the set, the caption that travels with the image,
    // and the overlay's own chrome.
    const image = { kind: 'image', src: '/assets/p.png', alt: 'a plate' }
    expect(
      l1ImageSchema.safeParse({ ...image, zoom: { group: 'plates' } }).success,
    ).toBe(true)
    expect(
      l1ImageSchema.safeParse({
        ...image,
        zoom: {
          group: 'plates',
          caption: 'Plate I, engraved 1603',
          ink: '#1b1b1b',
          backdrop: { color: '#f4f1ea', opacity: 0.97 },
          prevLabel: 'Planche précédente',
          nextLabel: 'Planche suivante',
        },
      }).success,
    ).toBe(true)
    // An unnamed set is not a set: the name IS the membership, so an empty one
    // would put every picture that wrote it into one nameless gallery.
    expect(l1ImageSchema.safeParse({ ...image, zoom: { group: '' } }).success).toBe(false)
  })

  it('test_UAT_FC_REQ-330_only_a_picture_can_belong_to_a_set', () => {
    // A box has no replaced content to open, so the whole role — the set with it —
    // is refused everywhere but a picture, by shape rather than by a rule someone
    // has to remember.
    const zoom = { group: 'plates', caption: 'x' }
    expect(l1TextSchema.safeParse({ kind: 'text', text: 'x', zoom }).success).toBe(false)
    expect(l1BoxSchema.safeParse({ kind: 'box', zoom, children: [] }).success).toBe(false)
  })

  it('test_UAT_FC_REQ-330_the_set_carries_no_way_to_paint_and_no_way_to_script', () => {
    // The overlay's presentation is the renderer's. `ink` is a colour and nothing
    // else — an axis smuggled in beside it would be a document deciding how the
    // substrate covers a viewport.
    const image = { kind: 'image', src: '/assets/p.png', alt: 'a plate' }
    for (const smuggled of [
      { group: 'g', ink: 'rgb(0,0,0)' },
      { group: 'g', ink: 'red; }' },
      { group: 'g', captionCss: '.x{}' },
      { group: 'g', onStep: 'alert(1)' },
      { group: 'g', navSize: 48 },
      { group: 'g', autoplay: true },
    ]) {
      expect(
        l1ImageSchema.safeParse({ ...image, zoom: smuggled }).success,
        JSON.stringify(smuggled),
      ).toBe(false)
    }
  })
})

describe('REQ-330 — what the envelope refuses', () => {
  it('test_UAT_FC_REQ-330_a_sets_members_must_agree_about_the_overlay_they_share', () => {
    // A set has ONE shell, so a member naming a second backdrop is a document
    // saying two things about one thing — and the renderer would have to pick.
    // Refused rather than resolved: taking the first answer would silently discard
    // the second, which is exactly the loss the author would never see.
    const said = refusals(
      gallery((i) =>
        i === 0
          ? { backdrop: { color: '#000000', opacity: 0.9 } }
          : i === 2
            ? { backdrop: { color: '#ffffff', opacity: 0.4 } }
            : {},
      ),
    )
    expect(said).toContain("members must agree about the overlay they share")
    expect(said).toContain("group 'plates'")
    expect(said).toContain('backdrop')
  })

  it('test_UAT_FC_REQ-330_members_that_name_nothing_are_always_fine', () => {
    // The common case: one plate carries the chrome and the rest carry `group`
    // alone. Agreement cannot mean "every member restates it", or a gallery of
    // twelve would carry the same backdrop twelve times.
    expect(
      refusals(
        gallery((i) =>
          i === 1 ? { backdrop: { color: '#101014', opacity: 0.95 }, ink: '#eeeeee' } : {},
        ),
      ),
    ).toBe('')
    // And restating it IDENTICALLY is agreement, not a clash.
    expect(refusals(gallery(() => ({ ink: '#eeeeee' })))).toBe('')
    // Two different sets on one page are two different overlays and never clash.
    expect(
      refusals({
        kind: 'container',
        layout: 'stack',
        children: [
          plate(1, 'a', { group: 'plates', ink: '#ffffff' }),
          plate(2, 'b', { group: 'portraits', ink: '#000000' }),
        ],
      }),
    ).toBe('')
  })
})

describe('REQ-330 — what the page becomes', () => {
  it('test_UAT_FC_REQ-330_a_set_of_four_pictures_is_one_overlay_not_four', () => {
    // The whole claim of the set: four triggers, ONE shell, four members inside it
    // in document order — including the one nested two boxes deep, which is why the
    // overlay cannot be written at any single member.
    const { html } = render(gallery())
    expect((html.match(/data-l1-dialog=/g) ?? []).length).toBe(1)
    expect((html.match(/data-l1-zoom=/g) ?? []).length).toBe(1)
    expect((html.match(/data-l1-zoom-to=/g) ?? []).length).toBe(4)
    expect((html.match(/class="l1-zoom-item"/g) ?? []).length).toBe(4)
    // Every trigger opens the SAME panel, and names its own member.
    const handles = [...html.matchAll(/data-l1-opens="([^"]+)" data-l1-zoom-to="(\d)"/g)]
    expect(handles.map((m) => m[2])).toEqual(['0', '1', '2', '3'])
    expect(new Set(handles.map((m) => m[1])).size).toBe(1)
    // In document order, which is the set's order: plate 3 sits third even though
    // it is deeper in the tree than plate 4.
    const alts = [...html.matchAll(/<img class="l1-zoom-img"[^>]*alt="([^"]+)"/g)].map(
      (m) => m[1],
    )
    expect(alts).toEqual(PLATES.map((p) => `Plate ${p.n} — ${p.title}`))
  })

  it('test_UAT_FC_REQ-330_a_caption_sits_with_the_picture_it_belongs_to', () => {
    // "The caption travels with the image" is a statement about WHERE it is: in the
    // member, not in the panel. A caption on the overlay would show one picture's
    // words under another's the moment the visitor stepped.
    const { html } = render(gallery((i) => ({ caption: `Plate ${i + 1}, engraved 1603` })))
    const items = [...html.matchAll(/<figure class="l1-zoom-item"[^>]*>(.*?)<\/figure>/g)]
    expect(items).toHaveLength(4)
    items.forEach((m, i) => {
      expect(m[1]).toContain(`alt="Plate ${i + 1}`)
      expect(m[1]).toContain(`<figcaption class="l1-zoom-cap">Plate ${i + 1}, engraved 1603`)
    })
  })

  it('test_UAT_FC_REQ-330_the_overlays_chrome_is_painted_in_the_documents_ink', () => {
    // The reporter's point about the scrim, applied to everything drawn ON it: a
    // site with a considered pale ground must not get chrome it cannot see. One
    // rule per overlay, on the panel, reaching the caption and both chevrons by
    // inheritance rather than by a rule each.
    const { css } = render(
      gallery((i) =>
        i === 0
          ? { ink: '#1b1b1b', backdrop: { color: '#f4f1ea', opacity: 0.97 }, caption: 'x' }
          : {},
      ),
    )
    expect(css).toMatch(/\.l1-zg-0-dlg \.l1-zoom \{ color: #1b1b1b \}/)
    expect(css).toContain('background-color: #f4f1ea')
    // The chevrons take their colour from that one declaration.
    expect(css).toContain('border-top: 2px solid currentColor')
    // Absent, the ink is the pair to the renderer's dim rather than nothing.
    expect(render(gallery()).css).toMatch(/\.l1-zg-0-dlg \.l1-zoom \{ color: #ffffff \}/)
  })

  it('test_UAT_FC_REQ-330_a_captioned_overlay_leaves_the_caption_room', () => {
    // A picture sized to the whole viewport plus a caption below it is taller than
    // the viewport, and the caption is the half that scrolls out of reach. Only
    // charged to an overlay that actually carries one.
    expect(render(gallery((i) => (i === 2 ? { caption: 'Plate 3' } : {}))).css).toContain(
      'calc(100vh - 96px)',
    )
    expect(render(gallery()).css).not.toContain('calc(100vh - 96px)')
  })

  it('test_UAT_FC_REQ-330_one_picture_is_given_no_way_to_step_to_itself', () => {
    // A set of one is a legitimate document — a gallery written one plate at a time
    // — and two controls that would move between a member and itself are chrome
    // that lies. The solitary zoom REQ-327 already emitted is the same case.
    const lone: L1Node = {
      kind: 'container',
      layout: 'stack',
      children: [plate(1, 'the ladder', { group: 'plates' })],
    }
    expect(render(lone).html).not.toContain('l1-zoom-nav')
    expect(render(plate(1, 'the ladder', {})).html).not.toContain('l1-zoom-nav')
    const two = render(gallery(() => ({}), 'plates')).html
    expect((two.match(/class="l1-zoom-nav/g) ?? []).length).toBe(2)
  })

  it('test_UAT_FC_REQ-330_the_controls_are_named_and_the_names_are_the_documents', () => {
    // A chevron drawn from two borders has no text to be named by, so the name has
    // to come from somewhere — and a site published in another language cannot be
    // left with two English buttons.
    expect(render(gallery()).html).toContain('aria-label="Previous image"')
    expect(render(gallery()).html).toContain('aria-label="Next image"')
    const french = render(
      gallery((i) =>
        i === 0 ? { prevLabel: 'Planche précédente', nextLabel: 'Planche suivante' } : {},
      ),
    ).html
    expect(french).toContain('aria-label="Planche précédente"')
    expect(french).toContain('aria-label="Planche suivante"')
    expect(french).not.toContain('Previous image')
  })

  it('test_UAT_FC_REQ-330_a_page_whose_script_never_runs_still_shows_every_plate', () => {
    // Fails VISIBLE, which is the rule the whole overlay already keeps: unenhanced,
    // every member lies in flow in document order, and the two controls — which can
    // do nothing there — are not painted, because a page never advertises a gesture
    // it cannot honour.
    const { css } = render(gallery((i) => ({ caption: `Plate ${i + 1}` })))
    expect(css).toContain('.l1-zoom-nav { display: none }')
    expect(css).toContain('html[data-l1-dialog-ready] .l1-zoom-nav { display: block')
    expect(css).toContain('.l1-zoom-item { display: block; margin: 0 }')
    expect(css).toContain(
      'html[data-l1-dialog-ready] .l1-zoom-item:not([data-l1-zoom-cur]) { display: none }',
    )
    // Nothing hides a member, and nothing hides the controls, without the marker
    // only the script sets.
    expect(css).not.toMatch(/^\.l1-zoom-item:not/m)
  })
})

describe('REQ-330 — the page a visitor is looking at', () => {
  it('test_UAT_FC_REQ-330_clicking_a_plate_opens_the_overlay_at_that_plate', async () => {
    // Not at the first one. The index is marked in the capture phase, so the
    // overlay is showing the clicked picture when it appears rather than the first
    // for a frame.
    const { dom, doc: d } = await drive(gallery((i) => ({ caption: `Plate ${i + 1}` })))
    click(dom, set(d).triggers[2])
    expect(set(d).shell.hasAttribute('data-l1-open')).toBe(true)
    expect(showing(d)).toBe(2)
    expect(caption(d)).toBe('Plate 3')
  })

  it('test_UAT_FC_REQ-330_the_overlay_steps_and_the_caption_travels_with_it', async () => {
    // The fuller version, driven: next/previous by control and by arrow key, and
    // the words changing with the picture they belong to.
    const { dom, doc: d } = await drive(gallery((i) => ({ caption: `Plate ${i + 1}` })))
    click(dom, set(d).triggers[0])
    click(dom, set(d).next)
    expect(showing(d)).toBe(1)
    expect(caption(d)).toBe('Plate 2')
    key(dom, 'ArrowRight')
    expect(showing(d)).toBe(2)
    expect(caption(d)).toBe('Plate 3')
    key(dom, 'ArrowLeft')
    expect(showing(d)).toBe(1)
    click(dom, set(d).prev)
    expect(showing(d)).toBe(0)
    expect(caption(d)).toBe('Plate 1')
  })

  it('test_UAT_FC_REQ-330_the_set_wraps_at_both_ends', async () => {
    // A visitor who has reached the last plate and wants the first should not have
    // to close the overlay and open it again.
    const { dom, doc: d } = await drive(gallery())
    click(dom, set(d).triggers[3])
    expect(showing(d)).toBe(3)
    click(dom, set(d).next)
    expect(showing(d)).toBe(0)
    click(dom, set(d).prev)
    expect(showing(d)).toBe(3)
  })

  it('test_UAT_FC_REQ-330_stepping_does_not_dismiss_the_overlay', async () => {
    // The panel closes on a click ANYWHERE in it, which is the forgiving reading
    // REQ-327 chose for a panel holding one picture and nothing interactive. The
    // controls are the first thing in it a click means something else on.
    const { dom, doc: d } = await drive(gallery())
    click(dom, set(d).triggers[0])
    click(dom, set(d).next)
    expect(set(d).shell.hasAttribute('data-l1-open')).toBe(true)
    // While a click on the picture still closes it, as it always did.
    click(dom, set(d).members[1].querySelector('img')!)
    expect(set(d).shell.hasAttribute('data-l1-open')).toBe(false)
  })

  it('test_UAT_FC_REQ-330_a_scroll_dismisses_the_overlay_and_a_touch_drag_does_not', async () => {
    // The reporter asked for dismissal "by click, escape, or scroll", and the
    // modal supplies the first two. Touch is deliberately excluded: a drag on a
    // touch screen is how a visitor pans and pinch-zooms the plate they just
    // opened, which is the thing the overlay exists to offer.
    const { dom, doc: d } = await drive(gallery())
    click(dom, set(d).triggers[1])
    gesture(dom, 'touchmove')
    expect(set(d).shell.hasAttribute('data-l1-open')).toBe(true)
    gesture(dom, 'wheel')
    expect(set(d).shell.hasAttribute('data-l1-open')).toBe(false)
    // And it dismisses the way every other dismissal does — the scroll lock comes
    // off and focus goes back to the plate that was clicked — because it closes by
    // the modal's own verb rather than by re-deriving the contract.
    expect(d.documentElement.hasAttribute('data-l1-dialog-lock')).toBe(false)
    expect(d.activeElement).toBe(set(d).triggers[1])
  })

  it('test_UAT_FC_REQ-330_focus_returns_to_the_plate_that_was_clicked', async () => {
    // The reporter's "focus returns to the image that opened it", over a set: the
    // trigger that opened the shared overlay is the one it goes back to, whichever
    // member the visitor stepped to before leaving.
    const { dom, doc: d } = await drive(gallery())
    click(dom, set(d).triggers[2])
    click(dom, set(d).next)
    expect(set(d).panel.contains(d.activeElement)).toBe(true)
    key(dom, 'Escape')
    expect(d.activeElement).toBe(set(d).triggers[2])
  })

  it('test_UAT_FC_REQ-330_the_overlay_announces_the_plate_it_is_actually_showing', async () => {
    // A derived name left alone would go on announcing the first plate while the
    // third is on screen. An AUTHORED one never moves, because a document that
    // named its gallery said something about the set rather than about whichever
    // member is up.
    const { dom, doc: d } = await drive(gallery())
    click(dom, set(d).triggers[0])
    expect(set(d).panel.getAttribute('aria-label')).toBe('Plate 1 — the ladder')
    click(dom, set(d).next)
    expect(set(d).panel.getAttribute('aria-label')).toBe('Plate 2 — the garden')

    const named = await drive(gallery((i) => (i === 0 ? { ariaLabel: 'The four plates' } : {})))
    click(named.dom, set(named.doc).triggers[0])
    click(named.dom, set(named.doc).next)
    expect(set(named.doc).panel.getAttribute('aria-label')).toBe('The four plates')
  })
})

describe('REQ-330 — it is the overlay that already exists', () => {
  it('test_UAT_FC_REQ-330_a_gallery_ships_the_modal_script_unchanged_and_no_third_overlay', () => {
    // The obligations this ticket lists are REQ-212's, and a gallery that
    // re-implemented any of them would be the failure even with every behavioural
    // assertion above passing. So the page ships that script verbatim, plus the one
    // vetted script that does the two things it does not: stepping, and the wheel.
    const { html, js } = render(gallery((i) => ({ caption: `Plate ${i + 1}` })))
    expect(js).toContain(L1_DIALOG_SCRIPT)
    expect(js).toContain(L1_ZOOM_SCRIPT)
    expect((html.match(/<script>/g) ?? []).length).toBe(1)
    // Neither script carries instance data of any kind: no plate, no caption, no
    // group name, no colour reaches either of them.
    for (const leak of ['plate', 'Plate', 'plates', '#ffffff', 'engraved']) {
      expect(L1_ZOOM_SCRIPT).not.toContain(leak)
    }
    // The set is carried by the very markers the modal already reads, so a channel
    // switch and `page-state` see a gallery as the panel it is.
    expect(html).toContain('class="l1-dlg')
    expect(html).toContain('data-l1-dialog=')
    expect(html).toContain('data-l1-closes=')
  })

  it('test_UAT_FC_REQ-330_a_page_with_no_zoom_ships_no_zoom_script', () => {
    // The second script rides in on exactly the terms the magnify stylesheet does:
    // a page with no picture to open pays nothing for either.
    const plain = render({ kind: 'text', text: 'no pictures here' })
    expect(plain.js).toBeUndefined()
    const modalOnly = render({
      kind: 'box',
      id: 'panel',
      dialog: {},
      children: [{ kind: 'text', text: 'a panel' }],
    })
    expect(modalOnly.js).toContain(L1_DIALOG_SCRIPT)
    expect(modalOnly.js).not.toContain(L1_ZOOM_SCRIPT)
  })

  it('test_UAT_FC_REQ-330_the_edit_channel_carries_no_attribute_that_would_act', () => {
    // A click in the editor means "edit this picture". The elements, the classes
    // and the boxes survive; the index and the step go the way `data-l1-opens`
    // already does, and no script ships at all.
    const edit = render(gallery((i) => ({ caption: `Plate ${i + 1}` })), { edit: true })
    expect(edit.js).toBeUndefined()
    for (const acting of [
      'data-l1-zoom-to',
      'data-l1-zoom-step',
      'data-l1-opens',
      'data-l1-closes',
      'data-l1-zoom-autoname',
    ]) {
      expect(edit.html, acting).not.toContain(acting)
    }
    // And keeps everything that is not an action.
    expect(edit.html).toContain('class="l1-zoomable"')
    expect(edit.html).toContain('class="l1-zoom-item"')
    expect(edit.html).toContain('class="l1-zoom-cap"')
    expect(edit.html).toContain('class="l1-zoom-nav l1-zoom-prev"')
  })
})
