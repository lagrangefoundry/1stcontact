/**
 * Which material the picture editor is offered over ([[REQ-220]]).
 *
 * ONE PREDICATE, ASKED BY THE SURFACE AND BY THE ORIGIN, so the Library cannot
 * offer a button the route would refuse — and the route cannot be talked into
 * storing a recipe by a caller that skipped the Library. It is its own module,
 * importing nothing, because both askers live on different sides of the wire:
 * `library.js` is served to a browser verbatim and `material.ts` runs in the
 * Worker.
 *
 * THE TWO REFUSALS IT CARRIES ARE THE TWO [[REQ-220]] NAMES:
 *
 * A CAPTURE IS NOT THE CLIENT'S PICTURE. Its bytes are a screenshot of somebody
 * else's site held as reference ([[REQ-166]]), which is why `kind` files it as
 * `capture` rather than `image` — and the one thing a crop of it could be for is
 * publishing it.
 *
 * A DRAWING IS NOT A PHOTOGRAPH, even though `kindOf` files it as an `image`.
 * The platform renderer cannot transform a vector at all, cropping one means
 * changing its viewBox rather than choosing a rectangle of a raster, and the
 * assistant can simply redraw it — so offering the four operations over an SVG
 * would be offering four operations that do not apply.
 */

/** The one thing filed as a picture that no operation in the recipe can touch. */
export const VECTOR_TYPE = 'image/svg+xml'

/** Whether these operations mean anything about this material. */
export function isEditablePicture(row) {
  if (row?.kind !== 'image') return false
  return String(row?.content_type ?? '').split(';')[0].trim().toLowerCase() !== VECTOR_TYPE
}
