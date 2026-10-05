/**
 * The comp viewer ([[REQ-378]]) — a comparable site, shown in the preview pane.
 *
 * A SEPARATE "VIEWING" MODE, NOT THE DRAFT. The pane's chrome while it shows a comp
 * is this module's own: a banner naming the site, "Back to your draft", previous
 * and next between comps, and "Visit the live site". The mode lists no toolbar
 * actions, so edit, the page picker, colours and Publish are not there at all —
 * nobody can mistake a competitor's page for their own draft, and nothing here can
 * edit or publish anything. The chat is beside the pane and is untouched.
 *
 * A PICTURE, NEVER THE SITE. What is shown is the capture's full-page screenshot,
 * served from this business's own Library: never a live iframe (many sites refuse
 * to be framed) and never the captured HTML re-served (that would run a third
 * party's page and scripts from our origin). The desktop/phone toggle switches
 * between the capture's screenshots at two widths. A picture cannot show motion,
 * so the viewer says so in one line, adds what the capture recorded about the
 * site's animation where it recorded any, and "Visit the live site" is how the
 * client sees it move.
 *
 * IT HOLDS THE COMPS IT WAS OPENED WITH and which one is shown; everything else is
 * drawn from them. `mount(host)` is the pane mode's `mount`.
 *
 * THE SAME CAROUSEL AS THE LOOKS ([[REQ-391]]) — ‹ Duncan Plumbing · 1 of 3 › —
 * without "Choose this one", because a comp is never chosen onto the site.
 */
import { materialFileUrl } from './api.js'
import { carouselNav } from './carousel.js'
import {
  COMP_BACK,
  COMP_DESKTOP,
  COMP_MOTION_NOTE,
  COMP_NO_PICTURE,
  COMP_PHONE,
  COMP_VIEWING,
  COMP_VISIT,
} from './config.js'

const el = (tag, className, text) => {
  const node = document.createElement(tag)
  if (className) node.className = className
  if (text !== undefined) node.textContent = text
  return node
}

const button = (className, text, onClick) => {
  const node = el('button', className, text)
  node.type = 'button'
  node.addEventListener('click', onClick)
  return node
}

/** Only an http(s) address becomes a link: the comp's URL is a third party's. */
const safeHref = (url) => {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.href : null
  } catch {
    return null
  }
}

/**
 * @param {object} options
 * @param {() => void} options.onBack the client asked for their draft back
 */
export function createCompViewer({ onBack }) {
  let comps = []
  let index = 0
  let width = 'desktop'
  let host = null

  function draw() {
    if (!host) return
    const comp = comps[index]
    if (!comp) {
      host.replaceChildren()
      return
    }
    const root = el('div', 'comp-viewer')
    root.dataset.reference = comp.reference

    const banner = el('div', 'comp-viewer__banner')
    banner.append(
      button('comp-viewer__back', COMP_BACK, () => onBack()),
      el('span', 'comp-viewer__title', COMP_VIEWING),
      carouselNav({ label: comp.title, index, count: comps.length, onMove: show }),
    )
    // [[REQ-388]] — the same segmented control the preview's width uses.
    const widths = el('span', 'comp-viewer__widths builder-segmented')
    widths.setAttribute('role', 'group')
    for (const [id, label] of [
      ['desktop', COMP_DESKTOP],
      ['phone', COMP_PHONE],
    ]) {
      const b = button('comp-viewer__width', label, () => {
        width = id
        draw()
      })
      b.dataset.width = id
      b.setAttribute('aria-pressed', String(width === id))
      b.disabled = !comp[id]
      widths.append(b)
    }
    banner.append(widths)
    const href = safeHref(comp.url)
    if (href) {
      const visit = el('a', 'comp-viewer__visit', COMP_VISIT)
      visit.href = href
      visit.target = '_blank'
      visit.rel = 'noopener noreferrer'
      banner.append(visit)
    }

    const note = el('div', 'comp-viewer__motion')
    note.append(el('span', 'comp-viewer__motion-note', COMP_MOTION_NOTE))
    if (comp.motion) note.append(el('span', 'comp-viewer__motion-recorded', ` ${comp.motion}`))

    const stage = el('div', 'comp-viewer__stage')
    const member = comp[width] ?? comp.desktop
    if (member) {
      const shot = el('img', `comp-viewer__shot comp-viewer__shot--${comp[width] ? width : 'desktop'}`)
      shot.src = materialFileUrl(comp.reference, member)
      shot.alt = comp.title
      stage.append(shot)
    } else {
      stage.append(el('p', 'comp-viewer__empty', COMP_NO_PICTURE))
    }

    root.append(banner, note, stage)
    host.replaceChildren(root)
  }

  function show(at) {
    if (at < 0 || at >= comps.length) return
    index = at
    draw()
  }

  return {
    /** Which comps to page through, and which one to show first. */
    open(list, reference) {
      comps = list ?? []
      index = Math.max(0, comps.findIndex((c) => c.reference === reference))
      if (!comps[index]?.[width]) width = 'desktop'
      draw()
    },
    /** The pane mode's `mount`: draw into the host the pane gives. */
    mount(target) {
      host = target
      draw()
    },
    /** The comp being shown, or null. */
    current: () => comps[index] ?? null,
  }
}
