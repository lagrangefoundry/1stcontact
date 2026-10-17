/**
 * **Tab icon and share card** — the Settings pane's section for how the site
 * shows up outside its own pages ([[REQ-400]]).
 *
 * WHERE SITE-WIDE DETAILS LIVE. The icon in a browser tab and the preview a
 * texted link unfolds into are facts about the whole site rather than any page,
 * and a client looking for them looks here, beside the web address — so this is
 * where they are shown and changed, with the assistant able to do the same.
 *
 * ONE API, TWO CALLERS, on `settings.js`'s rule: this section and the
 * assistant's `make_favicon` both reach `editFaviconMake`, so the icon a client
 * makes here and the one the assistant makes cannot come out differently.
 *
 * EVERY BOX SHOWS ITS DEFAULT. An empty title is not a card with no title: it is
 * the site's name, and the placeholder says so, so a client never wonders what
 * an empty field will publish.
 */

import { assetUrl, fetchLaunch, saveLaunch } from './api.js'
import { modalButton } from './modal.js'

export const LAUNCH_TITLE = 'Tab icon and share card'
export const LAUNCH_HINT =
  'How your site looks in a browser tab, and the preview people see when a link ' +
  'to it is texted or posted. Both go live the next time the site is published.'
export const ICON_LABEL = 'Make tab icon'
export const CARD_LABEL = 'Save share card'
export const NO_ICON = 'No tab icon yet. Choose a picture — your logo works best.'
export const NO_PICTURES = 'There are no pictures on the site yet to make these from.'
export const NO_SITE = 'Open a site to set its tab icon and share card.'
export const NO_CARD_IMAGE = 'No picture'

function el(tag, className, text) {
  const node = document.createElement(tag)
  if (className) node.className = className
  if (text !== undefined) node.textContent = text
  return node
}

function pictureSelect(images, chosen, emptyLabel) {
  const select = el('select', 'builder-launch__select')
  if (emptyLabel !== null) select.append(new Option(emptyLabel, ''))
  for (const name of images) select.append(new Option(name, name, false, name === chosen))
  if (chosen) select.value = chosen
  return select
}

/**
 * Mount the section.
 *
 * @param {object} [options]
 * @param {() => (string|null)} [options.site] which site the pane is about.
 * @param {{load?: Function, save?: Function}} [options.transport] injected by
 *   tests; defaults to the origin calls.
 */
export function createLaunchSection(options = {}) {
  const { site = () => null, transport = null } = options
  const load = transport?.load ?? fetchLaunch
  const save = transport?.save ?? saveLaunch

  const element = el('section', 'builder-settings__section builder-launch')
  const body = el('div', 'builder-launch__body')
  const line = el('p', 'builder-settings__hint builder-launch__line', '')
  line.setAttribute('role', 'status')
  element.append(el('h3', 'builder-settings__subtitle', LAUNCH_TITLE), el('p', 'builder-settings__hint', LAUNCH_HINT), body, line)

  /** Which read is still wanted — a site switch mid-read must not draw the old site. */
  let generation = 0

  function draw(slug, state) {
    body.replaceChildren()
    const images = state.images ?? []

    // ── the icon ──
    const icon = el('div', 'builder-launch__icon')
    if (state.favicon?.icon) {
      const img = el('img', 'builder-launch__icon-preview')
      img.src = assetUrl(slug, `assets/${state.favicon.appleTouchIcon ?? state.favicon.icon}`)
      img.alt = 'Your tab icon'
      icon.append(img)
    } else {
      icon.append(el('p', 'builder-settings__hint', NO_ICON))
    }
    const source = pictureSelect(images, null, null)
    const make = modalButton(ICON_LABEL, 'builder-modal__btn', () =>
      void write({ site: slug, op: 'icon', image: source.value }),
    )
    if (images.length === 0) {
      icon.append(el('p', 'builder-settings__hint', NO_PICTURES))
    } else {
      const row = el('div', 'builder-launch__row')
      row.append(source, make)
      icon.append(row)
    }

    // ── the card ──
    const card = state.shareCard ?? {}
    const form = el('div', 'builder-launch__card')
    const image = pictureSelect(images, card.image ?? '', NO_CARD_IMAGE)
    const title = el('input', 'builder-launch__input')
    title.type = 'text'
    title.value = card.title ?? ''
    title.placeholder = state.defaults?.title ?? ''
    title.setAttribute('aria-label', 'Share card title')
    const description = el('textarea', 'builder-launch__input')
    description.rows = 2
    description.value = card.description ?? ''
    description.placeholder = state.defaults?.description ?? ''
    description.setAttribute('aria-label', 'Share card description')
    const saveCard = modalButton(CARD_LABEL, 'builder-modal__btn', () =>
      void write({ site: slug, op: 'card', image: image.value, title: title.value, description: description.value }),
    )
    if (card.image) {
      const preview = el('img', 'builder-launch__card-preview')
      preview.src = assetUrl(slug, `assets/${card.image}`)
      preview.alt = 'Your share card picture'
      form.append(preview)
    }
    form.append(image, title, description, saveCard)
    body.append(icon, form)
  }

  async function write(request) {
    const mine = generation
    line.textContent = request.op === 'icon' ? 'Making your tab icon…' : 'Saving…'
    try {
      const state = await save(request)
      if (mine !== generation) return
      draw(request.site, state)
      line.textContent = request.op === 'icon' ? 'Your tab icon is made.' : 'Your share card is saved.'
    } catch (error) {
      if (mine !== generation) return
      line.textContent = error instanceof Error ? error.message : String(error)
    }
  }

  /** Read what the site holds now, and draw it. A failed read is silent. */
  async function refresh() {
    const slug = site()
    const mine = ++generation
    if (!slug) {
      body.replaceChildren(el('p', 'builder-settings__hint', NO_SITE))
      return
    }
    try {
      const state = await load(slug)
      if (mine === generation) draw(slug, state)
    } catch {
      /* a request the customer did not make — leave the section as it was */
    }
  }

  return {
    element,
    refresh,
    clear() {
      generation++
      body.replaceChildren()
      line.textContent = ''
    },
  }
}
