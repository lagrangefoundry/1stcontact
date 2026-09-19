// @vitest-environment jsdom
/**
 * REQ-282 Part 2, the surface half — **the grid offers the catalogue, and a
 * pick is staged until Save**.
 *
 * THE WORKERS SUITE (`…_the_picker_offers_the_library.workers.test.ts`) proves
 * what the origin computes and what a Save actually does to the store. This one
 * proves the other half of the same sentence: that the control PUTS the
 * catalogue in front of a person, marks it in the vocabulary Part 1 settled, and
 * commits nothing until the flush point.
 *
 * WHAT IS ASSERTED:
 *
 *   1. EVERY PICTURE IN THE CATALOGUE GETS A TILE — including the ones not yet
 *      on the site, which is the whole report.
 *   2. A PICTURE THE SITE DOES NOT HOLD DRAWS ITS THUMBNAIL FROM THE LIBRARY,
 *      because there is no `/assets/` path for it yet.
 *   3. THE MARK IS PART 1's VOCABULARY — accent and weight for in use, quiet for
 *      not, and the state in words for a screen reader. One set of words means
 *      one thing on both surfaces.
 *   4. WHAT WE MAY NOT PUBLISH IS SHOWN, UNPICKABLE, WITH THE REASON.
 *   5. A PICK IS STAGED, NEVER COMMITTED: it changes what the control reports
 *      and nothing else.
 *   6. THE CURRENT HANDLE IS ALWAYS AMONG THE TILES, even when no listing found
 *      it — otherwise a Save that touched only the alt text would swap the
 *      picture.
 *   7. AN ORIGIN WITH NO LIBRARY STILL DRAWS THE DESCRIPTOR'S OWN LIST, and
 *      marks nothing: that is not a degraded mode, it is what a deployment
 *      without a ticket store actually holds.
 *   8. THE TRANSPORT SENDS THE PLACEMENT IN THE SAME BODY AS THE VALUES — one
 *      Save, one post, one diff.
 */

import { beforeEach, describe, expect, it } from 'vitest'
import { mountImagePicker, pictureTiles } from '../apps/control-app/src/builder/image-picker.js'
import { saveCopy } from '../apps/control-app/src/builder/api.js'

const DRAWN = '/assets/drawn.png'
const WORDMARK = '/assets/wordmark.png'
/** A handle the fold could not mirror — on no listing, but still a node's value. */
const REMOTE = 'https://cdn.example.com/offsite.jpg'

const FIELD = { name: 'src', label: 'Image', type: 'enum', format: 'image', enum: [DRAWN, WORDMARK] }

/** What the origin sends: the Library, with a mark on the entries it has copied. */
const CATALOGUE = [
  { value: 'library:material-shopfront', label: 'shopfront.png', placed: false, place: 'material-shopfront' },
  { value: WORDMARK, label: 'wordmark.png', placed: true },
  {
    value: 'library:material-stock',
    label: 'stock.png',
    placed: false,
    place: 'material-stock',
    reason: 'Not ours to publish',
  },
  { value: DRAWN, label: 'drawn.png', placed: true },
]

let host: HTMLElement
beforeEach(() => {
  document.body.replaceChildren()
  host = document.createElement('div')
  document.body.append(host)
})

const tiles = () => [...host.querySelectorAll<HTMLElement>('.builder-modal__tile')]
const tileFor = (value: string) => tiles().find((t) => t.dataset.handle === value)!
const nameOf = (tile: Element) => tile.querySelector('.builder-modal__tile-name')!
const inputOf = (tile: Element) => tile.querySelector<HTMLInputElement>('.builder-modal__tile-input')!

function mount(value = DRAWN, pictures: unknown = CATALOGUE) {
  return mountImagePicker(host, { field: FIELD, value, site: 'acme', pictures })
}

/** The same control mounted by an origin that holds no Library at all. */
function mountWithoutCatalogue(value = DRAWN) {
  return mountImagePicker(host, { field: FIELD, value, site: 'acme' })
}

describe('REQ-282 — the grid is the catalogue', () => {
  it('test_UAT_FC_REQ-282_every_picture_gets_a_tile_including_the_ones_not_yet_used', async () => {
    mount()

    // CLAIM 1 — the report, in one assertion. The picker used to list only what
    // the site already held, so `shopfront.png` was unreachable from the editor
    // and the operator had to leave, place it in the Library, and come back.
    expect(tiles().map((t) => t.dataset.handle)).toEqual(CATALOGUE.map((c) => c.value))
    expect(nameOf(tileFor('library:material-shopfront')).textContent).toBe('shopfront.png')

    // CLAIM 2 — and its thumbnail comes from the Library, because there is no
    // `/assets/` path for it: that is precisely what the tile is offering to fix.
    const fresh = tileFor('library:material-shopfront').querySelector('img')!
    expect(fresh.getAttribute('src')).toContain('/api/material/file?uid=material-shopfront')
    const held = tileFor(WORDMARK).querySelector('img')!
    expect(held.getAttribute('src')).toContain('/assets/wordmark.png')
  })

  it('test_UAT_FC_REQ-282_the_mark_is_the_librarys_own_vocabulary', async () => {
    mount()

    // CLAIM 3 — accent and weight for in use, quiet for not. The two halves of
    // this ticket are the same confusion between what the client HAS and what
    // the site is USING, so they resolve into the same two treatments.
    expect(nameOf(tileFor(WORDMARK)).classList.contains('is-placed')).toBe(true)
    expect(nameOf(tileFor('library:material-shopfront')).classList.contains('is-placed')).toBe(
      false,
    )

    // …and the state in words for a reader who gets neither channel, which is
    // deliberately NOT a second visible word — it is clipped.
    const spoken = tileFor(WORDMARK).querySelector('.builder-modal__tile-state')!
    expect(spoken.textContent).toBe('— in use')
    expect(
      tileFor('library:material-shopfront').querySelector('.builder-modal__tile-state')!.textContent,
    ).toBe('— not yet used')
  })

  it('test_UAT_FC_REQ-282_what_we_may_not_publish_is_shown_unpickable_with_the_reason', async () => {
    const picker = mount()
    const blocked = tileFor('library:material-stock')

    // CLAIM 4 — SHOWN. Filtering it out is the same mistake Part 1 makes in the
    // other direction: a client who cannot find their own photograph has been
    // told nothing at all.
    expect(blocked).toBeTruthy()
    expect(blocked.querySelector('.builder-modal__tile-reason')!.textContent).toBe(
      'Not ours to publish',
    )
    expect(blocked.classList.contains('is-blocked')).toBe(true)
    expect(inputOf(blocked).disabled).toBe(true)
    // The reason is the tooltip too, in place of a handle nobody can act on.
    expect(blocked.title).toBe('Not ours to publish')

    // …and it cannot become the value.
    expect(picker.getValue()).toBe(DRAWN)
  })

  it('test_UAT_FC_REQ-282_a_pick_is_staged_and_names_the_material_the_save_must_place', async () => {
    const picker = mount()
    expect(picker.getPlacement()).toBeNull()
    expect(picker.isDirty()).toBe(false)

    const input = inputOf(tileFor('library:material-shopfront'))
    input.checked = true
    input.dispatchEvent(new window.Event('change', { bubbles: true }))

    // CLAIM 5 — staged, never committed. Nothing here posts, copies bytes or
    // touches the site; the modal's Save is the single flush point, which is
    // what stops a cancelled edit leaving an asset behind.
    expect(picker.getValue()).toBe('library:material-shopfront')
    expect(picker.getPlacement()).toBe('material-shopfront')
    expect(picker.isDirty()).toBe(true)

    // Picking something the site already holds asks for no placement at all.
    const already = inputOf(tileFor(WORDMARK))
    already.checked = true
    already.dispatchEvent(new window.Event('change', { bubbles: true }))
    expect(picker.getValue()).toBe(WORDMARK)
    expect(picker.getPlacement()).toBeNull()
  })

  it('test_UAT_FC_REQ-282_the_handle_the_node_holds_is_always_among_the_tiles', async () => {
    // CLAIM 6 — a folded reproduction can hold a handle no listing found, and a
    // radio group whose options omit its own value renders with nothing checked.
    // A Save that touched only the alt text would then swap the picture.
    const picker = mount(REMOTE)
    expect(tileFor(REMOTE)).toBeTruthy()
    expect(nameOf(tileFor(REMOTE)).textContent).toBe('offsite.jpg')
    expect(inputOf(tileFor(REMOTE)).checked).toBe(true)
    expect(picker.getValue()).toBe(REMOTE)

    // It is not claimed to be in use OR not: nothing asked, so nothing is said.
    expect(tileFor(REMOTE).querySelector('.builder-modal__tile-state')).toBeNull()
  })

  it('test_UAT_FC_REQ-282_an_origin_with_no_library_draws_the_descriptors_own_list', async () => {
    // CLAIM 7 — the `1c` dev builder is a site store with no ticket store, so
    // there is no catalogue to send. Every option it has IS a site asset, which
    // makes "which of these is on the site" a question with no information in
    // it — so nothing is marked rather than everything being marked.
    const picker = mountWithoutCatalogue()
    expect(tiles().map((t) => t.dataset.handle)).toEqual([DRAWN, WORDMARK])
    expect(host.querySelector('.builder-modal__tile-state')).toBeNull()
    expect(host.querySelector('.builder-modal__tile-name.is-placed')).toBeNull()
    expect(picker.getPlacement()).toBeNull()

    // The adapter is the one place that decides, and it says the same thing.
    expect(pictureTiles(FIELD, DRAWN, undefined).every((c) => c.placed === undefined)).toBe(true)
  })

  it('test_UAT_FC_REQ-282_the_transport_sends_the_placement_in_the_same_body_as_the_values', async () => {
    // CLAIM 8 — one Save is one post. `place` rides with `values` rather than
    // being a call before it, so a modal that both placed a picture and retyped
    // its alt text still produces one diff and one re-render.
    const calls: Array<{ url: string; body: Record<string, unknown> }> = []
    const fake = async (url: string, init: RequestInit) => {
      calls.push({ url: String(url), body: JSON.parse(String(init.body)) })
      return new Response('{"changed":["src"]}', {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    }
    const target = { site: 'acme', page: 'home', path: '0.0' }
    await saveCopy(
      target,
      { src: 'library:material-shopfront', alt: 'Our shopfront' },
      { src: 'material-shopfront' },
      fake as unknown as typeof fetch,
    )
    expect(calls).toHaveLength(1)
    expect(calls[0].url).toContain('/api/copy')
    expect(calls[0].body.values).toEqual({ src: 'library:material-shopfront', alt: 'Our shopfront' })
    expect(calls[0].body.place).toEqual({ src: 'material-shopfront' })

    // AND IT IS OMITTED WHEN NOTHING WAS STAGED, which is every Save that did
    // not pick something new.
    await saveCopy(target, { alt: 'Just the words' }, {}, fake as unknown as typeof fetch)
    expect(calls[1].body.place).toBeUndefined()
  })
})
