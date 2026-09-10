/**
 * Marked Points — the overlay half (REQ-210, DOC-52 §4).
 *
 * THE PROBLEM IT SOLVES IS BANDWIDTH, not intelligence. *"Move the st a little
 * closer to the 1"* asks language to carry a continuous quantity it has no
 * efficient encoding for, so every iteration is a lossy round trip and nothing
 * converges. This gives the quantity a channel: the reader points, and the
 * pointing becomes text in the message.
 *
 * THE SPLIT, and it is the same one the edit loop already uses. What a point
 * RESOLVES TO is `marked-points.ts`, beside the renderer, because inverting the
 * transform chain reads the same stamp the renderer writes. What a point LOOKS
 * LIKE and how it is placed, dragged and referred to is here, because this is
 * where the chrome and the composer are.
 *
 * IT REASSIGNS EDIT MODE'S PRIMARY GESTURE, deliberately and visibly. A click
 * in edit mode opens a segment's modal; with Mark Points on it places a point
 * and opens nothing. That is a real cost — so the mode is unmistakable
 * (crosshair, a pressed toggle, the hover outline kept but dimmed) rather than
 * a modifier-click, which is a power-user idiom, undiscoverable, and absent on
 * touch.
 *
 * IT IS CAPTURE-PHASE AND SELF-CONTAINED. The bridge is not modified and not
 * consulted: this listens on the way down and stops the event, so the bridge's
 * own bubble-phase click never runs. Turning the mode off removes the listener
 * and the bridge is exactly what it was.
 *
 * NOTHING HERE WRITES TO THE SITE. There is no diff, no validation and no
 * re-render — a gesture produces a message. That is why none of it comes near
 * DOC-28 §7.3's scope wall.
 */

/** Marks the preview's `<body>` while the mode is on; the injected CSS keys off it. */
const BODY_FLAG = 'data-fc-points'

/**
 * The overlay's own chrome, injected into the preview rather than emitted by the
 * renderer.
 *
 * A published or standalone edit render has no business carrying a builder
 * feature's stylesheet, and injecting it means the mode needs no re-render to
 * appear. The one rule that reaches *outward* is the dimmed hover: the renderer
 * says what a hot segment looks like, and this says what it looks like while a
 * different gesture is in force — the outline is kept, because knowing which
 * element you are marking inside previews what the pill will say.
 */
const OVERLAY_CSS = `
[${BODY_FLAG}], [${BODY_FLAG}] * { cursor: crosshair !important }
[${BODY_FLAG}] [data-l1-segment].l1-edit-hot { outline: 1px solid rgba(99, 102, 241, 0.4); outline-offset: -1px }
.fc-points { position: absolute; left: 0; top: 0; width: 0; height: 0; z-index: 2147483000 }
.fc-point { position: absolute; width: 0; height: 0; cursor: grab }
.fc-point.is-sent { cursor: default; opacity: 0.4; filter: grayscale(1) }
.fc-point__x {
  position: absolute; left: -11px; top: -11px; width: 22px; height: 22px;
  touch-action: none;
}
.fc-point__x::before {
  content: ''; position: absolute; inset: 4px; border-radius: 50%;
  background: #e11d48; box-shadow: 0 0 0 2px #fff, 0 1px 2px rgba(0, 0, 0, 0.45);
}
.fc-point__bar {
  position: absolute; left: 50%; top: 50%; width: 8px; height: 2px;
  margin-left: -4px; margin-top: -1px; border-radius: 1px; background: #fff;
}
.fc-point__bar--a { transform: rotate(45deg) }
.fc-point__bar--b { transform: rotate(-45deg) }
.fc-point__label {
  position: absolute; left: 13px; top: -11px; display: inline-flex; align-items: center; gap: 6px;
  padding: 2px 4px 2px 8px; border-radius: 11px; white-space: nowrap;
  background: #18181b; color: #fff; font: 600 11px/1.6 ui-sans-serif, system-ui, sans-serif;
  opacity: 0; transition: opacity 120ms; pointer-events: none;
}
.fc-point.is-fresh .fc-point__label, .fc-point:hover .fc-point__label { opacity: 1; pointer-events: auto }
.fc-point__btn {
  all: unset; cursor: pointer; width: 15px; height: 15px; border-radius: 50%;
  display: inline-flex; align-items: center; justify-content: center;
  background: rgba(255, 255, 255, 0.16); font: 600 11px/1 ui-sans-serif, system-ui, sans-serif;
}
.fc-point__btn:hover { background: rgba(255, 255, 255, 0.34) }
.fc-point.is-sent .fc-point__btn { display: none }
`

/**
 * How far the pointer may stray from a fresh mark before its label fades.
 *
 * ASYMMETRIC, BECAUSE THE LABEL IS (BUG-72). It sits to the RIGHT of the point
 * and carries its own `+` and `×`, so the journey from the mark to a control is
 * a horizontal one of about a hundred pixels. Measured as one radius from the
 * point, the label went out from under the cursor before the cursor arrived —
 * and a hidden label takes its pointer-events with it, so there was nothing
 * left to hover and no way back except the mark itself. The reach therefore
 * matches where the label actually is: generous rightward, tight everywhere
 * else.
 */
const FADE_AWAY_PX = 56
/** How far right the label and its controls reach — see {@link FADE_AWAY_PX}. */
const LABEL_REACH_PX = 200

/**
 * Measure a drawing the way `measure_drawing` measures it (REQ-209).
 *
 * `measureScript` is a string of browser JS by design — it is what the capture
 * driver evaluates in a page, and evaluating the same string here is what keeps
 * `near:` and `measure_drawing` answering from ONE measurement rather than two
 * that agree until they do not.
 *
 * IT RUNS IN THE BUILDER'S OWN DOCUMENT, not the preview's, and that is not a
 * shortcut. The drawing is painted by an `<img>`, which renders its SVG as an
 * isolated document: the page's `@font-face` rules cannot reach inside it, so
 * measuring against the page would measure a drawing the visitor never sees.
 * The script hosts the drawing in a shadow root under `all: initial`, which is
 * the same isolation from whichever document it is called in.
 */
async function evaluateMeasure(measureScript, svg) {
  // eslint-disable-next-line no-new-func -- see above: this string IS the contract.
  return await new Function(`return ${measureScript(svg)}`)()
}

/** `{f0: metrics}` — the shape `nearestAnchors` reads ratios out of. */
function fontIndex(measurement) {
  const out = {}
  for (const font of measurement.fonts ?? []) out[font.key] = font
  return out
}

/**
 * The controller. One per builder, outliving every frame load and every toolbar
 * re-render — the toolbar throws its controls away on a mode change, so state
 * kept in a button would be lost the first time the reader switched channel.
 *
 * @param {object} options
 * @param {object} options.api        the served framework modules (see `main.js`)
 * @param {(token: string) => void} options.insertToken  put a pill in the composer
 * @param {(label: string) => void} [options.removeToken] take one out again
 * @param {() => void} [options.onChanged] the toggle's pressed state follows this
 * @param {(svg: string) => Promise<object>} [options.measure] injected by suites
 * @param {(url: string) => Promise<Response>} [options.fetch] injected by suites
 */
export function createMarkedPoints(options = {}) {
  const {
    api,
    insertToken = () => {},
    removeToken = () => {},
    onChanged = () => {},
    measure = null,
    fetch: fetchImpl = null,
  } = options
  const points = api?.markedPoints ?? null

  let doc = null
  let container = null
  let style = null
  let active = false
  /**
   * Which render the points on screen were taken against.
   *
   * A COUNTER RATHER THAN A CLOCK. It has to be comparable, not meaningful: a
   * later message quoting a lower ordinal is a stale reference, and that is
   * decidable without anyone knowing what time it is.
   */
  let ordinal = 0
  /** @type {Array<{point: object, el: HTMLElement, sent: boolean}>} */
  let marks = []
  /** Per-asset, because a drawing is measured once however many points land in it. */
  const drawings = new Map()

  const win = () => doc?.defaultView ?? null
  const live = () => marks.filter((m) => !m.sent)

  // ── the overlay's own layer ────────────────────────────────────────────────

  /**
   * The container's own document origin.
   *
   * Marks are positioned in DOCUMENT coordinates — that is what makes scroll
   * position stop mattering rather than become a third number to carry — and an
   * absolutely-positioned child of `<html>` resolves against the initial
   * containing block, whose origin is the document's. A site that positions
   * `<html>` would move it, so the offset is measured rather than assumed.
   */
  function origin() {
    if (!container || !win()) return { x: 0, y: 0 }
    const rect = container.getBoundingClientRect()
    return { x: rect.left + win().scrollX, y: rect.top + win().scrollY }
  }

  function placeMark(mark) {
    const at = origin()
    mark.el.style.left = `${mark.point.doc.x - at.x}px`
    mark.el.style.top = `${mark.point.doc.y - at.y}px`
  }

  function install() {
    if (!doc || container) return
    style = doc.createElement('style')
    style.textContent = OVERLAY_CSS
    doc.head?.append(style)
    container = doc.createElement('div')
    container.className = 'fc-points'
    doc.documentElement.append(container)
    doc.body?.setAttribute(BODY_FLAG, '')
    doc.addEventListener('click', onClick, true)
    doc.addEventListener('pointermove', onPointerMove, true)
    for (const mark of marks) {
      container.append(mark.el)
      placeMark(mark)
    }
  }

  function uninstall() {
    if (!doc) return
    doc.removeEventListener('click', onClick, true)
    doc.removeEventListener('pointermove', onPointerMove, true)
    doc.body?.removeAttribute(BODY_FLAG)
    container?.remove()
    style?.remove()
    container = null
    style = null
  }

  // ── placing, dragging, deleting ────────────────────────────────────────────

  /**
   * Everything the frames need that only the DOM can answer.
   *
   * `from` is the element the gesture already named — a click knows its own
   * target, and asking the document to hit-test a coordinate it just delivered
   * would be a second, weaker answer. A drag has no such target (the mark
   * itself is under the pointer), so it hit-tests, which is why the parameter
   * exists at all rather than one of the two paths being the only one.
   */
  function framesFor(clientX, clientY, from) {
    const view = win()
    const hit = api.resolveEditTarget(from ?? doc.elementFromPoint(clientX, clientY))
    const docPoint = { x: clientX + (view?.scrollX ?? 0), y: clientY + (view?.scrollY ?? 0) }
    let node = null
    if (hit) {
      const rect = hit.element.getBoundingClientRect()
      node = { x: clientX - rect.left, y: clientY - rect.top, width: rect.width, height: rect.height }
    }
    return {
      element: hit ? hit.element : null,
      point: {
        target: hit ? hit.target : null,
        kind: hit ? hit.kind : null,
        doc: docPoint,
        viewportWidth: doc.documentElement.clientWidth || view?.innerWidth || 0,
        node,
        drawing: null,
        near: [],
        render: { page: doc.body?.getAttribute(api.L1_EDIT_PAGE_ATTR) ?? null, ordinal },
      },
    }
  }

  function markup(label) {
    const el = doc.createElement('div')
    el.className = 'fc-point is-fresh'
    el.dataset.point = label
    const x = doc.createElement('div')
    x.className = 'fc-point__x'
    // TWO BARS, NOT A GLYPH (BUG-72). `✕` centred by flexbox centres the LINE
    // BOX, and the glyph's ink is not centred within its own em box — so the
    // cross sat off the disc by a font-dependent amount that differed by
    // platform. A bar is offset by exactly half its own size, so it is centred
    // by construction and no font is consulted.
    for (const side of ['a', 'b']) {
      const bar = doc.createElement('span')
      bar.className = `fc-point__bar fc-point__bar--${side}`
      x.append(bar)
    }
    const tag = doc.createElement('div')
    tag.className = 'fc-point__label'
    tag.append(Object.assign(doc.createElement('span'), { textContent: `Point ${label}` }))
    const add = doc.createElement('button')
    add.type = 'button'
    add.className = 'fc-point__btn'
    add.dataset.act = 'refer'
    add.title = `Refer to Point ${label} again`
    add.textContent = '+'
    const drop = doc.createElement('button')
    drop.type = 'button'
    drop.className = 'fc-point__btn'
    drop.dataset.act = 'delete'
    drop.title = `Delete Point ${label}`
    drop.textContent = '×'
    tag.append(add, drop)
    el.append(x, tag)
    add.addEventListener('click', (ev) => {
      ev.stopPropagation()
      insertToken(points.pointToken(label))
    })
    drop.addEventListener('click', (ev) => {
      ev.stopPropagation()
      remove(label)
    })
    x.addEventListener('pointerdown', (ev) => startDrag(ev, label))
    return el
  }

  function place(clientX, clientY, from) {
    // No bridge supplied → no points. The browser entry always supplies one; a
    // host that does not (a suite mounting only the chrome) gets an inert
    // toggle rather than a module that fails to load — the same bargain
    // `editBridge` already makes for the edit loop.
    if (!points || !doc) return null
    const label = points.nextPointLabel(marks.map((m) => m.point.label))
    // 26 at once is far past useful, and a silent no-op is worse than nothing
    // happening for a visible reason — so the gesture simply declines.
    if (!label) return null
    const frames = framesFor(clientX, clientY, from)
    // The element stays on the MARK, never on the point. A point is what will be
    // written into a message, and a live DOM node in it is both meaningless
    // there and a handle onto a document that is about to be replaced.
    const mark = {
      point: { label, ...frames.point },
      element: frames.element,
      el: markup(label),
      sent: false,
    }
    // A fresh label is the one thing on screen; the previous one has said what
    // it had to say and must not occlude where this point is going.
    for (const other of marks) other.el.classList.remove('is-fresh')
    marks.push(mark)
    container?.append(mark.el)
    placeMark(mark)
    insertToken(points.pointToken(label))
    void enrich(mark)
    onChanged()
    return mark
  }

  function remove(label) {
    const mark = marks.find((m) => m.point.label === label)
    if (!mark) return
    mark.el.remove()
    marks = marks.filter((m) => m !== mark)
    // The pill goes with it. A dangling `[Point A]` is not merely untidy: labels
    // are reused as soon as they are free, so a reference left behind would
    // quietly bind to a DIFFERENT point the next time A is handed out.
    removeToken(label)
    onChanged()
  }

  function startDrag(ev, label) {
    const mark = marks.find((m) => m.point.label === label)
    if (!mark || mark.sent) return
    ev.preventDefault()
    ev.stopPropagation()
    const move = (e) => {
      const at = origin()
      mark.el.style.left = `${e.clientX + (win()?.scrollX ?? 0) - at.x}px`
      mark.el.style.top = `${e.clientY + (win()?.scrollY ?? 0) - at.y}px`
    }
    const up = (e) => {
      doc.removeEventListener('pointermove', move, true)
      doc.removeEventListener('pointerup', up, true)
      // Re-resolved from scratch, because a drag can leave the element it
      // started in — the hit chain is a property of where the point ENDS, and
      // carrying the old one over would report the wrong node with the right
      // coordinates, which is the worst of both.
      if (container) container.style.pointerEvents = 'none'
      const next = framesFor(e.clientX, e.clientY)
      if (container) container.style.pointerEvents = ''
      mark.point = { label, ...next.point }
      mark.element = next.element
      placeMark(mark)
      void enrich(mark)
      onChanged()
    }
    doc.addEventListener('pointermove', move, true)
    doc.addEventListener('pointerup', up, true)
  }

  function onClick(ev) {
    if (!active) return
    // The overlay's own controls are not the page. `+` and `×` sit on a label
    // floating over whatever the point was placed in, so without this the mode
    // would consume its own buttons before they ever fired — and place a second
    // point on top of the first every time someone tried to delete it.
    if (ev.target?.closest?.('.fc-point')) return
    // The mode owns the gesture. Stopping it here is what keeps the bridge's own
    // click — and the modal behind it — from also firing, without the bridge
    // having to know this mode exists.
    ev.preventDefault()
    ev.stopPropagation()
    place(ev.clientX, ev.clientY, ev.target)
  }

  /**
   * A fresh label fades when the pointer leaves it — never on a timer.
   *
   * "LEAVES IT" MEANS THE LABEL, NOT THE POINT (BUG-72). The region is the one
   * the mark's chrome occupies (see {@link FADE_AWAY_PX}), and a pointer that
   * has actually landed on that chrome has plainly not left it — so it holds the
   * label open for as long as it takes to press `+` or `×`, which is the whole
   * reason those controls are on it.
   */
  function onPointerMove(ev) {
    if (ev.target?.closest?.('.fc-point')) return
    const at = origin()
    for (const mark of marks) {
      if (!mark.el.classList.contains('is-fresh')) continue
      const dx = ev.clientX + (win()?.scrollX ?? 0) - at.x - Number.parseFloat(mark.el.style.left)
      const dy = ev.clientY + (win()?.scrollY ?? 0) - at.y - Number.parseFloat(mark.el.style.top)
      if (dx > LABEL_REACH_PX || dx < -FADE_AWAY_PX || Math.abs(dy) > FADE_AWAY_PX) {
        mark.el.classList.remove('is-fresh')
      }
    }
  }

  // ── the drawing a point may have landed in ─────────────────────────────────

  /** The asset's source, its viewBox, and its measurement — read once per asset. */
  async function drawingFor(src) {
    if (drawings.has(src)) return drawings.get(src)
    const promise = (async () => {
      const get = fetchImpl ?? win()?.fetch ?? globalThis.fetch
      const response = await get(src)
      if (!response.ok) throw new Error(`${response.status}`)
      const svg = await response.text()
      const intrinsics = points.readDrawingIntrinsics(svg)
      if (!intrinsics) throw new Error('no viewBox')
      let measurement = null
      try {
        measurement = measure ? await measure(svg) : await evaluateMeasure(api.measureScript, svg)
      } catch {
        // A measurement that could not be taken costs the `near:` line and
        // nothing else — every other frame is already exact. Reporting lines
        // that were not measured would be worse than reporting none.
      }
      return { intrinsics, measurement }
    })()
    drawings.set(src, promise)
    return promise
  }

  /**
   * Fill in the two frames the DOM alone cannot answer.
   *
   * ASYNCHRONOUS, AND THE POINT IS ALREADY PLACED. The mark appears on the
   * gesture and the pill is in the composer before anything is fetched; this
   * only enriches what the expansion will say. A reader who sends before it
   * lands gets exact coordinates in every other frame — never a wrong one, and
   * never a wait.
   */
  async function enrich(mark) {
    const el = mark.element
    if (!el || el.tagName !== 'IMG') return
    const src = el.currentSrc || el.src
    if (!src || !/\.svg(\?|#|$)/i.test(src)) return
    let asset
    try {
      asset = await drawingFor(src)
    } catch {
      return
    }
    if (!marks.includes(mark) || mark.point.node === null) return
    const view = win()
    const css = view?.getComputedStyle ? view.getComputedStyle(el) : null
    const user = points.toUserSpace(
      { x: mark.point.node.x, y: mark.point.node.y },
      {
        width: mark.point.node.width,
        height: mark.point.node.height,
        objectFit: css?.objectFit || 'fill',
        objectPosition: css?.objectPosition || '50% 50%',
      },
      asset.intrinsics,
    )
    if (!user) return
    mark.point = {
      ...mark.point,
      drawing: {
        asset: el.getAttribute('src') ?? src,
        viewBox: asset.intrinsics.viewBox,
        x: user.x,
        y: user.y,
      },
      near: nearFor(asset, user),
    }
    mark.el.title = points.formatMarkedPoint(mark.point)
  }

  function nearFor(asset, user) {
    const measurement = asset.measurement
    if (!measurement || !api.anchors?.nearestAnchors) return []
    const [, , vw, vh] = asset.intrinsics.viewBox
    try {
      return api.anchors.nearestAnchors(measurement.nodes ?? [], fontIndex(measurement), user, {
        x: vw / 2,
        y: vh / 2,
      })
    } catch {
      return []
    }
  }

  // ── the mode, and the send ─────────────────────────────────────────────────

  return {
    isActive: () => active,
    setActive(next) {
      const want = next === true
      if (want === active) return
      active = want
      if (active) install()
      else uninstall()
      onChanged()
    },
    toggle() {
      this.setActive(!active)
    },
    /**
     * Adopt whatever the frame is now showing.
     *
     * A NEW DOCUMENT IS A NEW RENDER, so the ordinal advances and the marks go —
     * including the greyed ones a send left behind, which have been waiting for
     * exactly this. Points cannot survive a render: a reader marks a point
     * BECAUSE they want that thing to move, and then it moves.
     */
    bind(next) {
      if (doc) uninstall()
      for (const mark of marks) mark.el.remove()
      marks = []
      drawings.clear()
      doc = next ?? null
      ordinal += 1
      if (doc && active) install()
      onChanged()
    },
    /**
     * Expand a draft on its way to the assistant, and retire the points it used.
     *
     * THE PILLS CLEAR AND THE MARKS DO NOT. The reader is owed a view of what
     * they referred to while the answer is being written, and the marks are
     * already inert by then, so leaving them visible reintroduces no staleness.
     * They go on the next render, which is what `bind` is for.
     */
    expand(markdown) {
      if (!points) return markdown
      const { markdown: out, used } = points.expandMarkedPoints(
        markdown,
        live().map((m) => m.point),
      )
      if (!used.length) return out
      for (const mark of live()) {
        mark.sent = true
        mark.el.classList.add('is-sent')
        mark.el.classList.remove('is-fresh')
      }
      onChanged()
      return out
    },
    /** The live points, for a suite and for the toggle's own label. */
    list: () => live().map((m) => m.point),
    getRenderOrdinal: () => ordinal,
    destroy() {
      uninstall()
      for (const mark of marks) mark.el.remove()
      marks = []
      doc = null
    },
  }
}
