/**
 * The local half of *"interaction is local; truth is rendered"* ([[REQ-220]]).
 *
 * WHAT THIS FILE IS NOT. It is not a vocabulary and it is not a renderer.
 * `image-recipe.ts` ([[REQ-219]]) says what an operation MEANS — it is the one
 * list, shared with the assistant's `edit_image` — and the Images binding behind
 * `/api/material/file` is the one thing that applies a recipe to bytes. Nothing
 * here parses a stored recipe, validates one, or produces an image.
 *
 * WHAT IT IS FOR. The editor shows the picture AS IT CURRENTLY STANDS: the file
 * route serves the stored bytes with the committed recipe already applied. So
 * the only thing that ever needs drawing locally is the ONE operation the client
 * is in the middle of — the crop box they are dragging, the turn they are about
 * to make. That is a single transform over what is already on screen, and every
 * operation in the vocabulary has an exact CSS counterpart for it: a crop is a
 * window, a rotate is a transform, an adjustment is a filter.
 *
 * WHICH IS WHY THERE IS NO FOLD HERE. An earlier pass of this ticket folded a
 * whole recipe in the browser to work out what the picture should look like —
 * which was a second implementation of `compileRecipe`, arrived at honestly and
 * wrong for exactly the reason the epic keeps naming. Committing and re-fetching
 * is both simpler and true: what the client looks at after a commit came out of
 * the renderer that will publish it.
 *
 * COORDINATES ARE FRACTIONS OF WHAT IS ON SCREEN, which is what the vocabulary's
 * crop already is: four insets, each a fraction of the frame at that point in the
 * recipe. Since the frame on screen IS the recipe so far, a box dragged here is
 * the next operation's parameters with no conversion at all.
 */

/** The smallest crop the overlay will let a client drag — as a fraction. */
export const MIN_CROP = 0.05

/** Where a fresh crop box starts: inset enough to show it is a box. */
export const CROP_START = Object.freeze({ left: 0.1, top: 0.1, right: 0.1, bottom: 0.1 })

/** What an adjustment means when nobody has touched it. */
export const NEUTRAL_ADJUST = Object.freeze({ brightness: 1, contrast: 1, saturation: 1 })

/**
 * The crop box as a rectangle, for drawing it.
 *
 * THE VOCABULARY STORES INSETS AND A BOX IS DRAWN FROM A CORNER, so one of these
 * two has to convert. It happens here, once, rather than in the editor and again
 * in a test — and the insets stay the thing that is sent, because they are what
 * the operation IS.
 */
export function cropRect(insets) {
  return {
    x: insets.left,
    y: insets.top,
    w: 1 - insets.left - insets.right,
    h: 1 - insets.top - insets.bottom,
  }
}

/**
 * Move or resize a crop, in the frame's own fractions.
 *
 * PURE, AND SEPARATE FROM THE POINTER, because the arithmetic is the part that
 * can be wrong in a way nobody sees until a client's crop lands somewhere they
 * did not point. The DOM half turns pixels into fractions and calls this.
 *
 * A DRAG NEVER LEAVES THE PICTURE AND NEVER INVERTS. Clamping at the edges is
 * what makes a crop *a rectangle of this picture* rather than a rectangle that
 * happens to overlap it, and the minimum size is what stops a careless drag
 * producing an operation the renderer would refuse — *"that would leave nothing"*
 * is a true sentence the client should never have to read.
 */
export function nudgeCrop(insets, handle, dx, dy) {
  const r = cropRect(insets)
  let { x, y, w, h } = r
  if (handle === 'move') {
    x = Math.min(Math.max(0, x + dx), 1 - w)
    y = Math.min(Math.max(0, y + dy), 1 - h)
  } else {
    if (handle.includes('w')) {
      const nx = Math.min(Math.max(0, x + dx), x + w - MIN_CROP)
      w += x - nx
      x = nx
    }
    if (handle.includes('e')) w = Math.min(Math.max(MIN_CROP, w + dx), 1 - x)
    if (handle.includes('n')) {
      const ny = Math.min(Math.max(0, y + dy), y + h - MIN_CROP)
      h += y - ny
      y = ny
    }
    if (handle.includes('s')) h = Math.min(Math.max(MIN_CROP, h + dy), 1 - y)
  }
  return round4({ left: x, top: y, right: 1 - x - w, bottom: 1 - y - h })
}

/**
 * Four places, because a drag should not write a number nobody could have meant.
 *
 * FINER THAN ANY POINTER AND COARSER THAN FLOATING-POINT NOISE. The recipe is a
 * record a person reads — and that the assistant writes with `edit_image` — so a
 * crop dragged to a fifth of the way in should say `0.2` rather than
 * `0.19999999999999996`.
 */
function round4(insets) {
  const out = {}
  for (const [k, v] of Object.entries(insets)) out[k] = Math.max(0, Math.round(v * 1e4) / 1e4)
  return out
}

/**
 * The one pending operation, as CSS over the picture already on screen.
 *
 * @param {object|null} op  an operation in the vocabulary's own shape, or `null`
 *   for *nothing is pending*, which is the ordinary state
 * @returns {{window: object, image: object}} two style bags, outermost first,
 *   ready for `Object.assign` onto a `style`
 */
export function pendingStyle(op) {
  const window = { transform: 'none', filter: 'none' }
  const image = { left: '0%', top: '0%', width: '100%', height: '100%' }
  if (!op) return { window, image }
  if (op.op === 'rotate') {
    window.transform = `rotate(${op.degrees}deg)`
    return { window, image }
  }
  if (op.op === 'adjust') {
    window.filter = filterOf(op)
    return { window, image }
  }
  if (op.op === 'crop') {
    // THE WINDOW KEEPS ITS PLACE AND THE PICTURE MOVES INSIDE IT. Scaling the
    // window instead would shrink the picture on screen, which is not what a
    // crop does — a crop shows less of it at the same size.
    const r = cropRect(op)
    image.left = `${pct(-r.x / r.w)}%`
    image.top = `${pct(-r.y / r.h)}%`
    image.width = `${pct(1 / r.w)}%`
    image.height = `${pct(1 / r.h)}%`
    return { window, image }
  }
  return { window, image }
}

/** `none` rather than `brightness(1) …`, so an untouched picture says so. */
function filterOf(op) {
  const parts = []
  if (op.brightness !== undefined && op.brightness !== 1) parts.push(`brightness(${op.brightness})`)
  if (op.contrast !== undefined && op.contrast !== 1) parts.push(`contrast(${op.contrast})`)
  if (op.saturation !== undefined && op.saturation !== 1) parts.push(`saturate(${op.saturation})`)
  return parts.length ? parts.join(' ') : 'none'
}

const pct = (n) => Math.round(n * 1e4) / 1e2

/**
 * An adjustment as the vocabulary wants it: only the sliders that moved.
 *
 * THE ABSENT ONES ARE ABSENT AND NOT `1`, because `parseRecipe` refuses *"an
 * adjust that adjusts nothing"* and a record that stated three neutral
 * multipliers would be three facts nobody asserted. `null` here is the same
 * answer read the other way: there is no operation to make.
 */
export function adjustOp(values) {
  const op = { op: 'adjust' }
  for (const key of ['brightness', 'contrast', 'saturation']) {
    const v = Math.round(Number(values[key]) * 1e3) / 1e3
    if (Number.isFinite(v) && v !== 1) op[key] = v
  }
  return Object.keys(op).length > 1 ? op : null
}
