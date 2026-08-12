/**
 * Reading the page's own presentation back off the live preview (REQ-121).
 *
 * The editing box shows the copy AS IT APPEARS ON THE PAGE — the site's family,
 * weight, colour and background — so the user edits the thing they are looking
 * at rather than a grey form field a theme away from it.
 *
 * IT READS RATHER THAN INFERS. Every value here comes from `getComputedStyle` on
 * the element the bridge resolved, not from the L1 node behind it. Those two can
 * disagree, and when they do the *rendered* one is the truthful one: a text run
 * inherits most of its presentation from its ancestors, so the node's own axes
 * describe only what it overrode. Deriving from the definition would mean
 * reimplementing the cascade in the client, against a renderer free to change —
 * and the preview iframe is same-origin by construction (DOC-8 §4.2), which is
 * exactly what makes reading the real thing available at zero cost.
 */

/**
 * The size range the preview renders in.
 *
 * A 72px display headline reproduced faithfully is unusable in a dialog, and a
 * 11px legal line is unreadable. The box previews *style*, not layout — the page
 * itself is behind the modal for layout — so size is the one axis deliberately
 * not reproduced. Family, weight, colour and background are exact.
 */
export const PREVIEW_MIN_PX = 14
export const PREVIEW_MAX_PX = 32

/** The page's size brought into the editing range, keeping ordinary copy exact. */
export function clampPreviewSize(px) {
  if (!Number.isFinite(px) || px <= 0) return PREVIEW_MIN_PX
  return Math.min(PREVIEW_MAX_PX, Math.max(PREVIEW_MIN_PX, px))
}

/**
 * The scale the dialog dressed this run at: previewed px per authored px.
 *
 * Two separate reductions land in this one number, and folding them together is
 * the point. The clamp above is one — a 56px headline previews at 32. The other
 * is responsive: `fontSizePx` is a TRACK sampled at six widths (BUG-18), so the
 * authored base the control edits and the size the iframe happens to be
 * rendering at its current width are routinely different numbers. Neither
 * reduction is worth reproducing separately; what the box needs is the single
 * ratio that maps one to the other.
 *
 * Falls back to 1 — preview the authored size as-is — whenever either end is
 * missing, which is every document with no computed styles and every segment
 * that declares no size.
 */
export function previewScale(previewVars, authoredPx) {
  const shown = pxOf(previewVars?.['--preview-font-size'])
  const authored = Number(authoredPx)
  if (!shown || !Number.isFinite(authored) || authored <= 0) return 1
  return shown / authored
}

/**
 * The size the box previews an authored size at.
 *
 * SCALED, NOT RE-CLAMPED (REQ-138). Putting the authored value back through
 * {@link clampPreviewSize} looks like the obvious reuse and would make this
 * feature silently fail for exactly the runs it matters most for: a headline
 * already sits at the 32px ceiling, so 56 → 80 would move nothing at all, and a
 * control that answers every change with "no visible difference" is worse than
 * one that never claimed to preview.
 *
 * The floor stays. Below it the operator is typing into text they cannot read,
 * which is the same legibility contract the opening clamp is enforcing — so
 * shrinking far below the run's own size does saturate, and that is deliberate.
 * There is no ceiling: the box scrolls.
 */
export function previewSizePx(authoredPx, scale) {
  const px = Number(authoredPx)
  if (!Number.isFinite(px) || px <= 0) return null
  const factor = Number.isFinite(scale) && scale > 0 ? scale : 1
  return Math.max(PREVIEW_MIN_PX, Math.round(px * factor))
}

/**
 * One edited parameter as the custom property that shows it, or `null`.
 *
 * A TABLE RATHER THAN A CHAIN OF IFS, because the interesting property is what
 * is ABSENT from it. A parameter with no entry here is one the box cannot show,
 * and returning `null` for it is the honest answer — the alternative, a default
 * that writes *something*, would dress the box in a value the page will not use.
 * Colour is the live example: `edit.ts` defers the descriptor to REQ-133's
 * palette control, so it is a row this gains rather than a branch it has.
 *
 * Every value must also be able to say "off" — `none`, `normal` — because these
 * are written on change and a parameter turned back off has to clear the
 * property it set. Omitting the declaration would leave the previous value
 * standing, which reads as the control having stopped working.
 */
const PREVIEW_PARAMETERS = {
  fontSizePx: (value, scale) => {
    const px = previewSizePx(value, scale)
    return px === null ? null : ['--preview-font-size', `${px}px`]
  },
  fontWeight: (value) => {
    const weight = Number(value)
    return Number.isFinite(weight) ? ['--preview-font-weight', String(weight)] : null
  },
  italic: (value) => ['--preview-font-style', value === true ? 'italic' : 'normal'],
  textTransform: (value) => [
    '--preview-text-transform',
    typeof value === 'string' && value ? value : 'none',
  ],
}

/** @returns {[string, string] | null} the property and value to set, if any. */
export function previewVarFor(name, value, scale) {
  return PREVIEW_PARAMETERS[name]?.(value, scale) ?? null
}

/** `rgba(0, 0, 0, 0)` and friends — a colour that paints nothing. */
function isTransparent(color) {
  if (!color) return true
  const c = color.replace(/\s+/g, '')
  return c === 'transparent' || /^rgba\(\d+,\d+,\d+,0(\.0+)?\)$/.test(c)
}

/** Whether a box paints anything of its own: a colour, an image, or both. */
function paints(cs) {
  if (!cs) return false
  const image = cs.backgroundImage
  if (image && image !== 'none') return true
  return !isTransparent(cs.backgroundColor)
}

/** A computed colour's alpha: 1 for `rgb(…)`, the fourth channel otherwise. */
function alphaOf(color) {
  if (!color || color === 'transparent') return 0
  const inner = /^rgba?\(([^)]+)\)/.exec(color)
  if (!inner) return 1
  const parts = inner[1].split(/[,/\s]+/).filter(Boolean).map(Number)
  return parts.length > 3 ? parts[3] : 1
}

/**
 * Everything painting behind a text run, bottom-most last.
 *
 * NOT AN ANCESTOR WALK. The obvious implementation — climb `parentElement`
 * until something paints — is wrong for the renderer this reads. An L1 fold
 * emits absolutely positioned boxes (REQ-88), so a hero photograph is routinely
 * a SIBLING layer beneath the copy rather than an ancestor of it; the walk sails
 * straight past it and lands on whatever neutral wrapper happens to carry a
 * fill. Observed on `gigabytealchemy/home`: gold copy over a dark photograph
 * resolved to gold on cream, which is both wrong and unreadable — the one
 * outcome a preview of contrast must never produce.
 *
 * `elementsFromPoint` asks the question actually being asked — *what is under
 * this pixel* — and answers it in paint order, so it sees the sibling backdrop,
 * the scrim over it and the ancestors under it alike.
 *
 * The stack is collected DOWN TO THE FIRST OPAQUE FILL and no further: nothing
 * below an opaque layer contributes a pixel, and stopping there keeps a
 * translucent scrim composited over the photograph it is dimming rather than
 * flattened onto it.
 */
export function paintedBehind(element) {
  const doc = element?.ownerDocument
  const view = doc?.defaultView
  if (!view) return []

  const rect = element.getBoundingClientRect?.()
  let candidates = null
  if (rect?.width && rect?.height && typeof doc.elementsFromPoint === 'function') {
    const stack = doc.elementsFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2)
    const self = Array.prototype.indexOf.call(stack ?? [], element)
    // Everything ABOVE the text is chrome the operator is not editing through
    // (the hover outline, the modal's own backdrop once it exists), and the text
    // itself is not its own background — so the answer starts one past it.
    if (self >= 0) candidates = Array.prototype.slice.call(stack, self + 1)
  }
  // The fallback is the ancestor chain, which is correct whenever nothing is
  // absolutely positioned and is the only thing available with no layout at all
  // (a headless run measures every rect as zero).
  if (!candidates) {
    candidates = []
    for (let n = element.parentElement; n; n = n.parentElement) candidates.push(n)
    if (doc.body && !candidates.includes(doc.body)) candidates.push(doc.body)
  }

  const layers = []
  for (const node of candidates) {
    const cs = view.getComputedStyle(node)
    if (paints(cs)) layers.push({ node, cs })
    // An opaque fill is the floor. Anything under it is invisible by definition.
    if (alphaOf(cs.backgroundColor) >= 1) break
    // A pathological stack is a bug somewhere else; it must not become an
    // unbounded pile of layer elements in the dialog.
    if (layers.length >= 4) break
  }
  return layers
}

/** A computed length in px, or `null` when the value is not one. */
function pxOf(value) {
  const n = Number.parseFloat(value ?? '')
  return Number.isFinite(n) ? n : null
}

/**
 * The typography of one rendered element, as CSS custom properties.
 *
 * Returned as a property map rather than applied here so the caller decides
 * where it lands — the stylesheet is what consumes them, and a value that is
 * absent from the page (jsdom computes very little) simply never appears rather
 * than being written as an empty declaration that would override the fallback.
 */
export function readTypography(element) {
  const view = element?.ownerDocument?.defaultView
  if (!view) return {}
  const cs = view.getComputedStyle(element)
  const vars = {}
  const put = (name, value) => {
    if (value && value !== 'normal' && value !== 'auto') vars[name] = value
  }
  put('--preview-font-family', cs.fontFamily)
  put('--preview-font-weight', cs.fontWeight)
  put('--preview-font-style', cs.fontStyle)
  put('--preview-letter-spacing', cs.letterSpacing)
  put('--preview-line-height', cs.lineHeight)
  put('--preview-text-transform', cs.textTransform !== 'none' ? cs.textTransform : '')
  put('--preview-color', cs.color)
  // Size is the one value that is transformed rather than copied — see the
  // range constants above. It is still *derived* from the page, so a headline
  // still previews larger than body copy; it just stops short of the extremes.
  const size = pxOf(cs.fontSize)
  if (size !== null) vars['--preview-font-size'] = `${clampPreviewSize(size)}px`
  return vars
}

/**
 * The background behind a text run, reproduced exactly.
 *
 * WHY A SIZED LAYER AND NOT A COPIED SHORTHAND. An L1 surface is routinely
 * several layers — a scrim over a pattern over a gradient over a `cover` photo
 * (`render.ts` `surfaceDecls`) — and every one of those resolves against the box
 * it is painted on. Copying the shorthand onto a differently-sized box would
 * re-resolve `cover`, every gradient stop and every tile against the wrong
 * dimensions, so the preview would show a *different* crop of the same
 * background and quietly misreport the contrast the user is judging.
 *
 * So the layer is given the painted ancestor's own dimensions and offset back by
 * the text's position within it, then clipped by the box. Every layer resolves
 * against the dimensions it resolved against on the page, and what shows through
 * is precisely the region that sits behind the copy — with no intrinsic-size
 * maths, and correct for layer stacks this code never has to understand.
 *
 * Returns `null` when nothing paints, which the caller reads as "use the theme's
 * own surface".
 */
export function readBackground(element) {
  const stack = paintedBehind(element)
  if (!stack.length) return null

  // Geometry is measured in the iframe's viewport coordinates for BOTH boxes, so
  // the difference is layout-relative and immune to how far the preview happens
  // to be scrolled.
  const here = element.getBoundingClientRect?.() ?? { left: 0, top: 0 }

  const layers = stack.map(({ node, cs }) => {
    const there = node.getBoundingClientRect?.() ?? { left: 0, top: 0, width: 0, height: 0 }
    return withAbsoluteUrls(
      {
        'background-color': cs.backgroundColor,
        'background-image': cs.backgroundImage,
        'background-size': cs.backgroundSize,
        'background-position': cs.backgroundPosition,
        'background-repeat': cs.backgroundRepeat,
        'background-origin': cs.backgroundOrigin,
        width: `${there.width ?? 0}px`,
        height: `${there.height ?? 0}px`,
        left: `${-(here.left - there.left)}px`,
        top: `${-(here.top - there.top)}px`,
      },
      element.ownerDocument,
    )
  })

  // The FLOOR colour — the deepest opaque fill — carried separately so the box
  // is right even where a layer cannot be placed: a document with no layout
  // computes every rect as zero, which makes every layer a 0×0 box that paints
  // nothing. Read from the bottom up, because that is the one the others
  // composite over.
  const base = [...stack].reverse().find(({ cs }) => !isTransparent(cs.backgroundColor))
  return {
    color: base ? base.cs.backgroundColor : null,
    // Bottom-most FIRST, so appending them in order reproduces the page's own
    // paint order — a scrim has to land on top of the photograph it dims.
    layers: layers.reverse(),
  }
}

/**
 * Rewrite every `url(...)` against the document it came from.
 *
 * The preview and the builder are the same origin but NOT the same base URL —
 * the render is served under `/preview/<slug>/<channel>/`, so a relative asset
 * handle that resolves there resolves to nothing here. Absolutising against the
 * source document is what makes a copied declaration mean the same thing in the
 * parent, and it is the only edit made to any value on the way across.
 */
function withAbsoluteUrls(style, sourceDoc) {
  const base = sourceDoc?.baseURI
  if (!base) return style
  const fix = (value) =>
    String(value ?? '').replace(/url\((['"]?)([^'")]+)\1\)/g, (whole, quote, href) => {
      try {
        return `url(${quote}${new URL(href, base).href}${quote})`
      } catch {
        return whole
      }
    })
  const out = {}
  for (const [k, v] of Object.entries(style)) out[k] = fix(v)
  return out
}

/** Where the copied faces are parked, so a re-open replaces rather than stacks. */
const FONT_FACE_MARKER = 'data-1c-preview-fonts'

/**
 * Copy the preview document's `@font-face` rules into the builder's document.
 *
 * The site's faces are declared in the IFRAME's stylesheet. The parent document
 * cannot see them, so naming the family in the modal would silently fall back to
 * a system font — the preview would then be wrong in exactly the axis it exists
 * to show. Same-origin lets us read the rules and re-declare them here.
 *
 * ONLY `@font-face` CROSSES. Copying the whole stylesheet would drag the site's
 * layout, its resets and its `body` rules into the builder chrome, where they
 * would fight the shell for control of a document the site knows nothing about.
 * One rule type, chosen because it is the only one whose absence breaks the
 * preview and the only one that carries no layout.
 */
export function copyFontFaces(sourceDoc, targetDoc = document) {
  const seen = new Set()
  for (const sheet of Array.from(sourceDoc?.styleSheets ?? [])) {
    let rules
    try {
      rules = sheet.cssRules
    } catch {
      // Same-origin by construction, so this cannot happen — but a security
      // error here would otherwise take out the whole modal for a font.
      continue
    }
    for (const rule of Array.from(rules ?? [])) {
      const text = rule?.cssText ?? ''
      if (/^\s*@font-face/i.test(text)) seen.add(text)
    }
  }
  const head = targetDoc?.head
  if (!head) return 0

  let host = head.querySelector(`style[${FONT_FACE_MARKER}]`)
  if (!seen.size) {
    host?.remove()
    return 0
  }
  if (!host) {
    host = targetDoc.createElement('style')
    host.setAttribute(FONT_FACE_MARKER, '')
    head.append(host)
  }
  // Replaced wholesale rather than appended: the faces belong to the document
  // currently in the frame, and a switch of site or channel must not leave the
  // previous site's families resolvable.
  host.textContent = [...seen]
    .map((text) => withAbsoluteUrls({ rule: text }, sourceDoc).rule)
    .join('\n')
  return seen.size
}

/**
 * Everything the modal needs to render a segment the way the page does.
 *
 * One call so the caller has one thing to hold and one thing to forget to do.
 */
export function readPageStyle(element) {
  return {
    vars: readTypography(element),
    background: readBackground(element),
  }
}
