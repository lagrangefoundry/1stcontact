/**
 * REQ-219 — **an edit is a recipe**: the operation vocabulary, and the one
 * function that turns it into something a renderer can run.
 *
 * THE ORIGINAL IS KEPT FOREVER. What sits on a picture's record is an ordered
 * list of parameterised operations; any state of the picture is the original
 * plus a prefix of that list, and the bytes anyone is shown are derived and
 * disposable. That is what delivers *"the crop needs to be a little wider"* —
 * not undo, but editing the crop operation's own parameters, months after the
 * fact, without going back to the client for the file.
 *
 * SO THE RECIPE IS PERSISTED AND THE UNDO STACK IS NOT. Undo and redo are editor
 * session state. The recipe is the better history because its entries are
 * individually revisable rather than merely reversible, and persisting both
 * would mean two things that could disagree about what the picture is.
 *
 * COORDINATES ARE NORMALISED AND SIZES ARE PIXELS, and the two never share a
 * parameter name. A crop is four fractions trimmed off four edges; a resize is
 * a whole number of pixels, because *"a logo that is 400px wide because that is
 * what it is"* is the case `resize` exists for and a fraction could not say it.
 * A pixel crop would silently move the moment a resize were inserted before it,
 * and the whole value of a revisable recipe is that editing one operation does
 * not quietly relocate another.
 *
 * THE VOCABULARY IS CLOSED AND SHARED — one list, used by the editor UI and by
 * the assistant's tool. Two implementations of "crop" drift within a month.
 *
 * WHY THIS MODULE KNOWS NOTHING ABOUT A BINDING. {@link compileRecipe} is a pure
 * function from a recipe and a pair of dimensions to a transform chain, and that
 * is deliberate rather than incidental: the local renderer the tests run against
 * implements `rotate`, `width` and `height` and silently drops trim and every
 * colour adjustment, so a test that cropped and compared pixels would pass
 * against an uncropped image. The chain is where the logic is, so the chain is
 * what is asserted. {@link ImageRenderer} is the seam the real one arrives
 * through.
 *
 * `flip` IS OUT OF V1, AND NOT FOR THE REASON FIRST WRITTEN DOWN. The platform
 * renderer can flip — `ImageTransform` declares `flip: 'h' | 'v' | 'hv'`. It
 * stays out because four operations answer the ask, a fifth with no caller is a
 * fifth to maintain, and the local renderer implements neither it nor most of
 * the rest. It can return when something wants it.
 */

/** The operations a recipe may hold. Closed, and shared with the editor UI. */
export const EDIT_OPS = ['crop', 'rotate', 'resize', 'adjust'] as const

/** The quarter turns the renderer has. Nothing between them is expressible. */
export const ROTATIONS = [90, 180, 270] as const

/**
 * The ceiling on an `adjust` multiplier.
 *
 * A bound rather than an open range, because the parameter is a multiplier where
 * `1` is unchanged and a value in the hundreds is a client who meant a
 * percentage. Zero is allowed at the bottom: `saturation: 0` is greyscale, which
 * is a thing somebody actually wants.
 */
export const MAX_ADJUSTMENT = 10

/**
 * Trim a fraction off each edge.
 *
 * FOUR INSETS AND NOT A RECTANGLE, which is what stops `width` meaning a
 * fraction in one operation and a pixel count in another. *"Crop an interesting
 * strip"* is `{ op: 'crop', top: 0.35, bottom: 0.35 }`. It is also the shape the
 * renderer's own primitive takes, so the mapping is a multiplication rather than
 * a change of coordinate system.
 *
 * Every side is optional and absent means zero, so a recipe never has to state
 * the three edges it is not moving.
 */
export interface CropOp {
  op: 'crop'
  left?: number
  top?: number
  right?: number
  bottom?: number
}

/** A quarter turn clockwise. */
export interface RotateOp {
  op: 'rotate'
  degrees: 90 | 180 | 270
}

/**
 * Set the picture's size, in pixels, preserving its aspect ratio.
 *
 * EDITORIAL, NOT A BANDWIDTH CONTROL. Delivery sizes are built automatically at
 * publish and nobody is asked about them; this is for the case where a size is
 * part of what the picture *is*.
 */
export interface ResizeOp {
  op: 'resize'
  width?: number
  height?: number
}

/** Brightness, contrast and saturation, as multipliers where `1` is unchanged. */
export interface AdjustOp {
  op: 'adjust'
  brightness?: number
  contrast?: number
  saturation?: number
}

/** One parameterised operation. */
export type EditOp = CropOp | RotateOp | ResizeOp | AdjustOp

/** How big a picture is at some point in its recipe. */
export interface Dimensions {
  width: number
  height: number
}

/**
 * Raised when a recipe will not be accepted, with the reason in the message.
 *
 * ONE CLASS FOR EVERY REFUSAL, carrying the surface's declared code, because
 * every one of them is the same kind of event: the caller described something
 * that cannot be done to this picture, nothing was written, and the recipe is
 * exactly as it was. *"Refusing is normal and must read as information."* A
 * refusal that silently clamped is how a client ends up with a picture nobody
 * chose.
 */
export class RecipeRefusedError extends Error {
  readonly name = 'RecipeRefusedError'
  /** The code `image-surface.json` declares for this refusal. */
  readonly code = 'REFUSED'
  constructor(message: string) {
    super(message)
  }
}

/** `x`, when it is a number a recipe may carry at all. */
function finite(value: unknown, where: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new RecipeRefusedError(
      `${where} must be a number, and it was ${value === undefined ? 'left out' : JSON.stringify(value)}.`,
    )
  }
  return value
}

/**
 * One side of a crop, as a fraction.
 *
 * THE TWO WRONG NUMBERS GET DIFFERENT SENTENCES, because they are different
 * mistakes. Below zero is a crop reaching outside the frame. Above one is
 * somebody who passed pixels, and telling them "that is not between 0 and 1"
 * leaves them to guess; telling them the unit is what lets the next call be
 * right.
 */
function inset(raw: unknown, side: string): number {
  if (raw === undefined || raw === null) return 0
  const value = finite(raw, `the ${side} of a crop`)
  if (value < 0) {
    throw new RecipeRefusedError(
      `a crop cannot reach outside the picture, and ${side} is ${value}. ` +
        `Every side is a fraction of the picture trimmed off that edge, so it is never negative.`,
    )
  }
  if (value > 1) {
    throw new RecipeRefusedError(
      `a crop is measured in fractions of the picture and not in pixels, so ${side} ` +
        `must be between 0 and 1 — you asked for ${value}. To keep the middle half of ` +
        `a picture, trim 0.25 off each side.`,
    )
  }
  return value
}

/** Shape-check one operation. Dimensions are not consulted — see {@link compileRecipe}. */
function parseOp(raw: unknown, index: number): EditOp {
  const at = `operation ${index + 1}`
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new RecipeRefusedError(`${at} is not an operation — each entry is an object with an 'op'.`)
  }
  const entry = raw as Record<string, unknown>
  const op = entry.op
  if (typeof op !== 'string' || !(EDIT_OPS as readonly string[]).includes(op)) {
    throw new RecipeRefusedError(
      `${at} asks for '${String(op)}', which is not something a picture can be edited by. ` +
        `The whole vocabulary is ${EDIT_OPS.join(', ')}.`,
    )
  }

  if (op === 'crop') {
    const crop: CropOp = {
      op: 'crop',
      left: inset(entry.left, 'left'),
      top: inset(entry.top, 'top'),
      right: inset(entry.right, 'right'),
      bottom: inset(entry.bottom, 'bottom'),
    }
    // A CROP THAT TRIMS NOTHING IS NOT A CROP. It would sit in the recipe doing
    // nothing, and the client who added it would be left wondering which of the
    // other operations was the one that did not work.
    if (crop.left === 0 && crop.top === 0 && crop.right === 0 && crop.bottom === 0) {
      throw new RecipeRefusedError(
        `${at} is a crop with no side trimmed, so it would do nothing. Give at least one of ` +
          `left, top, right or bottom.`,
      )
    }
    // CHECKED HERE AND AGAIN AGAINST REAL PIXELS. This catches the arithmetic
    // that cannot be right for any picture; `compileRecipe` catches the crop
    // that is legal arithmetic and still leaves less than a pixel of this one.
    if (crop.left! + crop.right! >= 1) {
      throw new RecipeRefusedError(
        `${at} trims ${crop.left} off the left and ${crop.right} off the right, which is the ` +
          `whole picture or more — there would be nothing left.`,
      )
    }
    if (crop.top! + crop.bottom! >= 1) {
      throw new RecipeRefusedError(
        `${at} trims ${crop.top} off the top and ${crop.bottom} off the bottom, which is the ` +
          `whole picture or more — there would be nothing left.`,
      )
    }
    return crop
  }

  if (op === 'rotate') {
    const degrees = finite(entry.degrees, `${at}'s degrees`)
    if (!(ROTATIONS as readonly number[]).includes(degrees)) {
      throw new RecipeRefusedError(
        `${at} asks to rotate by ${degrees}°, and a picture turns in quarters — ` +
          `${ROTATIONS.join('°, ')}°. Nothing between them can be drawn without ` +
          `inventing corners that were never photographed.`,
      )
    }
    return { op: 'rotate', degrees: degrees as 90 | 180 | 270 }
  }

  if (op === 'resize') {
    const resize: ResizeOp = { op: 'resize' }
    for (const side of ['width', 'height'] as const) {
      if (entry[side] === undefined || entry[side] === null) continue
      const value = finite(entry[side], `${at}'s ${side}`)
      if (!Number.isInteger(value) || value < 1) {
        throw new RecipeRefusedError(
          `${at} asks for a ${side} of ${value}, and a size is a whole number of pixels, ` +
            `at least 1.`,
        )
      }
      resize[side] = value
    }
    if (resize.width === undefined && resize.height === undefined) {
      throw new RecipeRefusedError(
        `${at} is a resize that names no size. Give a width, a height, or both — in pixels.`,
      )
    }
    return resize
  }

  const adjust: AdjustOp = { op: 'adjust' }
  for (const knob of ['brightness', 'contrast', 'saturation'] as const) {
    if (entry[knob] === undefined || entry[knob] === null) continue
    const value = finite(entry[knob], `${at}'s ${knob}`)
    if (value < 0 || value > MAX_ADJUSTMENT) {
      throw new RecipeRefusedError(
        `${at} asks for a ${knob} of ${value}. It is a multiplier where 1 is the picture ` +
          `unchanged, so it runs from 0 to ${MAX_ADJUSTMENT} — 1.2 is a fifth brighter, not 120.`,
      )
    }
    adjust[knob] = value
  }
  if (
    adjust.brightness === undefined &&
    adjust.contrast === undefined &&
    adjust.saturation === undefined
  ) {
    throw new RecipeRefusedError(
      `${at} is an adjust that adjusts nothing. Give at least one of brightness, contrast ` +
        `or saturation.`,
    )
  }
  return adjust
}

/**
 * A recipe, shape-checked.
 *
 * SEPARATE FROM {@link compileRecipe} because the two answer different questions
 * at different moments. This one needs no picture: it is what reads a stored
 * recipe back, and what refuses a malformed one before any bytes are fetched.
 * The other needs the real pixels, because a normalised inset means nothing
 * without the dimensions it is a fraction of.
 */
export function parseRecipe(value: unknown): EditOp[] {
  if (value === undefined || value === null) return []
  if (!Array.isArray(value)) {
    throw new RecipeRefusedError(
      `a recipe is an ordered list of operations, and this was ${typeof value}.`,
    )
  }
  return value.map(parseOp)
}

/** The dimensions a resize produces — `contain`, so the aspect ratio is kept. */
function contain(source: Dimensions, want: ResizeOp): Dimensions {
  const byWidth = want.width === undefined ? Infinity : want.width / source.width
  const byHeight = want.height === undefined ? Infinity : want.height / source.height
  const scale = Math.min(byWidth, byHeight)
  return {
    width: Math.max(1, Math.round(source.width * scale)),
    height: Math.max(1, Math.round(source.height * scale)),
  }
}

/** What one operation compiles to, and what the picture measures afterwards. */
interface Step {
  transform: ImageTransform
  after: Dimensions
}

function compileOp(op: EditOp, from: Dimensions, index: number): Step {
  const at = `operation ${index + 1}`
  switch (op.op) {
    case 'crop': {
      // ROUNDED TO PIXELS HERE AND NOWHERE ELSE. The recipe stays in fractions
      // so it survives an operation being inserted before it; the renderer's
      // primitive counts pixels; this line is the only place the two meet.
      const left = Math.round((op.left ?? 0) * from.width)
      const right = Math.round((op.right ?? 0) * from.width)
      const top = Math.round((op.top ?? 0) * from.height)
      const bottom = Math.round((op.bottom ?? 0) * from.height)
      const width = from.width - left - right
      const height = from.height - top - bottom
      if (width < 1 || height < 1) {
        throw new RecipeRefusedError(
          `${at} would leave ${width}×${height} of a ${from.width}×${from.height} picture, ` +
            `which is nothing. Trim less, or resize before cropping rather than after.`,
        )
      }
      return { transform: { trim: { left, top, width, height } }, after: { width, height } }
    }
    case 'rotate': {
      const quarter = op.degrees === 90 || op.degrees === 270
      return {
        transform: { rotate: op.degrees },
        // A QUARTER TURN SWAPS THE SIDES, which every later operation's
        // fractions are measured against.
        after: quarter ? { width: from.height, height: from.width } : { ...from },
      }
    }
    case 'resize': {
      // PAST WHAT THE PICTURE IS AT THIS POINT, not past what it started as. A
      // crop earlier in the recipe threw those pixels away, and enlarging is how
      // a client ends up with a soft picture nobody asked for.
      if (op.width !== undefined && op.width > from.width) {
        throw new RecipeRefusedError(
          `${at} asks for a width of ${op.width} and the picture is ${from.width} wide at that ` +
            `point, so it would have to be enlarged. A picture can be made smaller without ` +
            `inventing detail; it cannot be made larger.`,
        )
      }
      if (op.height !== undefined && op.height > from.height) {
        throw new RecipeRefusedError(
          `${at} asks for a height of ${op.height} and the picture is ${from.height} tall at ` +
            `that point, so it would have to be enlarged. A picture can be made smaller ` +
            `without inventing detail; it cannot be made larger.`,
        )
      }
      return {
        transform: {
          ...(op.width === undefined ? {} : { width: op.width }),
          ...(op.height === undefined ? {} : { height: op.height }),
          // `contain` and not `crop`: a resize changes the size and must never
          // quietly throw away the edges, which is what cropping-to-fit is.
          fit: 'contain',
        },
        after: contain(from, op),
      }
    }
    default:
      return {
        transform: {
          ...(op.brightness === undefined ? {} : { brightness: op.brightness }),
          ...(op.contrast === undefined ? {} : { contrast: op.contrast }),
          ...(op.saturation === undefined ? {} : { saturation: op.saturation }),
        },
        after: { ...from },
      }
  }
}

/** A compiled recipe: the chain to run, and what it produces. */
export interface CompiledRecipe extends Dimensions {
  /** One entry per operation, in the recipe's own order. */
  transforms: ImageTransform[]
}

/**
 * Turn a recipe into a transform chain, against the picture it will run on.
 *
 * ONE ENTRY PER OPERATION, IN ORDER, and that is a correctness property rather
 * than a formatting choice. Within a single transform the platform applies trim
 * before resize before rotate — so a recipe collapsed into one call would
 * silently reorder itself, and *"crop, then rotate"* would rotate and then crop
 * somewhere else entirely.
 *
 * DIMENSIONS ARE TRACKED THROUGH THE CHAIN because operation *N*'s fractions are
 * fractions of what operations 1..*N*−1 left, not of the original. This is the
 * whole reason the recipe is normalised: inserting a resize before a crop
 * changes what that crop's pixels are, and nothing has to be rewritten.
 *
 * AN EMPTY RECIPE COMPILES TO NOTHING AT ALL — not to an identity transform.
 * Every picture in the Library is unedited today, and none of them should start
 * paying for a renderer they do not use.
 */
export function compileRecipe(ops: readonly EditOp[], source: Dimensions): CompiledRecipe {
  let dims: Dimensions = { width: source.width, height: source.height }
  const transforms: ImageTransform[] = []
  ops.forEach((op, index) => {
    const step = compileOp(op, dims, index)
    transforms.push(step.transform)
    dims = step.after
  })
  return { transforms, width: dims.width, height: dims.height }
}

/**
 * The renderer, as a port.
 *
 * ONE RENDERER, REACHED THREE WAYS — the editor's true preview, the assistant's
 * view of a picture, and (when [[REQ-222]] wires it) the published output. The
 * point of the seam is that preview and artifact come out of the same code: it
 * is what stops a client cropping one thing and publishing another.
 *
 * The Cloudflare Images binding is the implementation; it is assembled where the
 * bindings are, exactly as the browser is.
 */
export interface ImageRenderer {
  /**
   * What the stored bytes measure, before anything is applied.
   *
   * Its own verb rather than a field on {@link render}, because it is what
   * *validating* a recipe needs and validation must happen before a write — the
   * point of a refusal is that the recipe is left as it was.
   */
  measure(bytes: Uint8Array, mediaType: string): Promise<Dimensions>
  /**
   * The picture with the recipe applied, and a delivery width if one was asked
   * for.
   *
   * `width` IS NOT PART OF THE RECIPE and never becomes one. Editorial versions
   * are what the picture *is*; delivery renditions are the same picture at
   * several widths, and conflating the two is how a Library ends up holding five
   * copies of everything.
   */
  render(
    bytes: Uint8Array,
    mediaType: string,
    recipe: readonly EditOp[],
    opts?: { width?: number },
  ): Promise<RenderedImage>
}

/** What a render produced. */
export interface RenderedImage extends Dimensions {
  bytes: Uint8Array
  mediaType: string
}

/**
 * Where a picture's recipe is kept, as a port.
 *
 * KEYED BY NAMESPACE BY THE CALLER, because only one of the two has anywhere to
 * put one. A Library item is a record and the recipe is a field on it; a site
 * asset is bytes, with nowhere to carry a recipe and no record to hang one from
 * — so it has no store here, and that absence is what the refusal is made of
 * rather than a flag somebody has to remember to check.
 */
export interface RecipeStore {
  read(name: string): Promise<EditOp[]>
  write(name: string, recipe: readonly EditOp[]): Promise<void>
}
