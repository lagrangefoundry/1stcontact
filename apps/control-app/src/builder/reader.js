/**
 * The reader window — a document shown rather than named (REQ-172).
 *
 * The Library's detail pane could render a photograph and not a document: a
 * client who had just uploaded their brand guidelines got a filename and a
 * download link, which is the same *"recognise it by its path"* problem REQ-132
 * removed from the image picker, surviving one file type later.
 *
 * WHAT DECIDES THE RENDERING IS THE CONTENT TYPE, NOT `kind`. DOC-38 §9's `kind`
 * is a four-value vocabulary for FILING, and it calls a markdown note, a
 * plain-text export and a brand PDF all `document` — three files that have to be
 * shown three different ways. So the row carries the resolved content type
 * (`material.ts`) and {@link readerKind} is the only thing that reads it.
 *
 * MARKDOWN IS SANITIZED AND PLAIN TEXT IS NOT PARSED, and neither is incidental.
 * Rendered markdown reaches the DOM as HTML and these bytes are not necessarily
 * the client's own — `/api/material/fetch` will happily pull a `.md` off the
 * public internet — so it goes through the same `renderSafe` seam the chat panel
 * uses rather than a second sanitizer beside it. A `.txt` put through the same
 * parser would lose its own line breaks and gain headings its author did not
 * write, so it is shown as itself.
 *
 * A PDF IS THE BROWSER'S OWN VIEWER, AND THAT IS THE WHOLE IMPLEMENTATION. The
 * file route already serves the stored content type with `content-disposition:
 * inline`, which is exactly what that viewer needs, so a frame pointed at the
 * same URL the download link uses is a real scrollable reader with no library,
 * no build step and no second transport. Its chrome differs a little between
 * browsers because it IS the browser's, and iOS Safari renders only the first
 * page in a frame — accepted while the builder is a desktop surface (DOC-14 §8).
 *
 * ONE BODY BUILDER, TWO PLACES TO PUT IT. The pane's window and the expanded
 * modal are the same content at two sizes, so {@link mountReader} paints every
 * registered body from one piece of state — which is also what lets a fetch or a
 * late markdown engine land in a modal that is already open, rather than only in
 * whichever surface happened to be showing when it arrived.
 */

import {
  markdownEngineReady,
  markdownReady as defaultMarkdownReady,
  renderSafe,
} from './markdown.js'
import { createModalShell, modalButton, modalFooter } from './modal.js'

/**
 * Two arrows pointing away from each other — the expand affordance.
 *
 * A GLYPH IN AN `aria-hidden` SPAN, on the upload overlay's pattern: the button
 * carries the words, the span carries the picture, and a screen reader is never
 * asked to pronounce an arrow.
 */
const EXPAND_GLYPH = '⤢'

/** What the expand button is called where the glyph cannot be seen. */
const EXPAND_LABEL = 'Open this in a larger window'

/** Said of a record whose bytes did not come back. */
const GONE = 'That file is no longer in storage.'

/** Said while the bytes are still on their way. */
const LOADING = 'Reading…'

/**
 * How a piece of material should be READ, or `null` for one that cannot be.
 *
 * Pure and exported so the mapping is provable without a DOM. The three answers
 * are the three renderings; everything else — a font, a zip, an unrecognised
 * binary — is `null`, which the pane reads as *offer the download and nothing
 * else*, exactly as it did before this existed.
 *
 * `image/svg+xml` IS DELIBERATELY NOT TEXT even though it decodes as text: it is
 * a picture, `kindOf` files it as one, and the pane already has an `<img>` for
 * it. Showing a client their logo as angle brackets would be a regression
 * dressed as a feature.
 */
export function readerKind(contentType) {
  const ct = String(contentType || '')
    .split(';')[0]
    .trim()
    .toLowerCase()
  if (ct === 'text/markdown' || ct === 'text/x-markdown') return 'markdown'
  if (ct === 'application/pdf') return 'pdf'
  if (ct === 'image/svg+xml') return null
  // The textual set `describe.ts` already reads, minus the SVG above — so what
  // the origin was willing to EXTRACT is what the pane is willing to SHOW.
  if (ct.startsWith('text/') || ct === 'application/json' || ct === 'application/xml') return 'text'
  return null
}

function el(tag, className, text) {
  const node = document.createElement(tag)
  if (className) node.className = className
  if (text != null) node.textContent = text
  return node
}

/**
 * Mount a reader for one piece of material.
 *
 * @param {object} spec
 * @param {string} spec.kind      one of {@link readerKind}'s answers
 * @param {string} spec.href      where the bytes are — the file route
 * @param {string} spec.filename  the name, used as the modal's accessible title
 * @param {Element} [spec.host]   where the expanded modal is appended (see `modal.js`)
 * @param {typeof fetch} [spec.fetchImpl]
 * @param {Promise<void>} [spec.markdownReady] when the markdown engines settle
 * @returns {{element: Element, expand: () => void, destroy: () => void}}
 */
export function mountReader(spec) {
  const {
    kind,
    href,
    filename,
    host = null,
    fetchImpl = typeof fetch === 'function' ? fetch : null,
    markdownReady = defaultMarkdownReady,
  } = spec

  /**
   * What every body is painted from. `source` is the decoded text for the two
   * textual kinds and stays `null` for a PDF, which is read by the browser from
   * the same URL rather than by us.
   */
  const state = { source: null, error: null, loading: kind !== 'pdf' }

  /** Every body currently on screen — the pane's, and the modal's while open. */
  const bodies = new Set()

  const element = el('div', 'builder-reader')

  // THE BUTTON SITS IN A BAR ABOVE THE WINDOW rather than floating over it. The
  // window scrolls, and a control overlaying scrolling prose covers a different
  // word every time the client moves — the one place in this pane where a
  // position that is merely tidy is also unreadable.
  const bar = el('div', 'builder-reader__bar')
  const expandButton = el('button', 'builder-reader__expand')
  expandButton.type = 'button'
  expandButton.setAttribute('aria-label', EXPAND_LABEL)
  expandButton.title = EXPAND_LABEL
  const glyph = el('span', null, EXPAND_GLYPH)
  glyph.setAttribute('aria-hidden', 'true')
  expandButton.append(glyph)
  bar.append(expandButton)
  element.append(bar)

  const paneBody = el('div', 'builder-reader__body')
  element.append(paneBody)
  bodies.add(paneBody)

  /**
   * Fill one body from the current state.
   *
   * REPAINTED RATHER THAN APPENDED TO, so this is safe to call again — which is
   * what the two late arrivals below depend on: the fetch, and the markdown
   * engines. A body painted as escaped source during a cold load is repainted as
   * rendered markdown the moment the engines land, which is BUG-42's repair
   * applied to the surface BUG-42 did not yet cover.
   */
  function paint(body) {
    body.textContent = ''
    body.classList.remove('md-body')
    if (kind === 'pdf') {
      // A frame, not an `<object>`: `<iframe>` is the element every current
      // browser routes to its built-in viewer, and its `title` is the only
      // accessible name the embedded document gets.
      const frame = document.createElement('iframe')
      frame.className = 'builder-reader__frame'
      frame.src = href
      frame.title = filename
      body.append(frame)
      return
    }
    if (state.error) {
      body.append(el('p', 'builder-library__missing', state.error))
      return
    }
    if (state.loading) {
      body.append(el('p', 'builder-reader__note', LOADING))
      return
    }
    const source = state.source ?? ''
    if (kind === 'markdown') {
      body.classList.add('md-body')
      // The one place in this module that writes HTML, and it writes only what
      // `renderSafe` returns — rendered and scrubbed where the engines are
      // present, escaped source where they are not, never raw.
      body.innerHTML = renderSafe(source)
      body.dataset.readerPaint = markdownEngineReady() ? 'rendered' : 'escaped'
      return
    }
    // ITS OWN LINE BREAKS, KEPT. `<pre>` is the element that means "this text's
    // own whitespace is part of it", which is the entire claim being made about
    // a `.txt`.
    body.append(el('pre', 'builder-reader__text', source))
  }

  function repaint() {
    for (const body of bodies) paint(body)
  }

  // --- the bytes ----------------------------------------------------------------
  // A PDF is never fetched here: the frame above asks for the same URL itself,
  // and reading it twice would double the transfer to show it once.
  const controller = typeof AbortController === 'function' ? new AbortController() : null
  if (kind !== 'pdf') {
    void (async () => {
      try {
        if (!fetchImpl) throw new Error('no fetch')
        const res = await fetchImpl(href, controller ? { signal: controller.signal } : undefined)
        if (!res.ok) throw new Error(`GET ${href} → ${res.status}`)
        state.source = await res.text()
        state.loading = false
      } catch (err) {
        // An abort is this component being destroyed, not a failure to report —
        // repainting a body that has already left the document would be the only
        // effect, and the message would be a lie about the file.
        if (err?.name === 'AbortError') return
        state.error = GONE
        state.loading = false
      }
      repaint()
    })()
  }

  paint(paneBody)

  // Once more when the engines land, for a detail opened during a cold load: the
  // paint above will have escaped the source, honestly and wrongly (BUG-42).
  if (kind === 'markdown') void markdownReady.then(repaint)

  // --- the expanded window ------------------------------------------------------
  let modal = null

  /**
   * The same content, at modal size.
   *
   * A SECOND BODY RATHER THAN THE PANE'S BODY MOVED. Moving it would leave a hole
   * in the pane behind the dialog and would have to put it back on every one of
   * the three ways out; a second body registered against the same state is one
   * `add`, one `delete`, and no ordering to get wrong.
   *
   * `mount()` LAST, as `modal.js` requires.
   */
  function expand() {
    if (modal) return
    const shell = createModalShell({
      host,
      title: filename,
      onClose: () => {
        bodies.delete(body)
        modal = null
      },
    })
    modal = shell
    const box = el('div', 'builder-modal__reader')
    const body = el('div', 'builder-reader__body builder-reader__body--modal')
    box.append(body)
    bodies.add(body)
    paint(body)
    shell.panel.append(box, modalFooter([modalButton('Close', 'builder-modal__btn', shell.close)]))
    shell.mount()
  }

  expandButton.addEventListener('click', expand)

  return {
    element,
    expand,
    destroy() {
      controller?.abort()
      modal?.close()
      bodies.clear()
      element.remove()
    },
  }
}
