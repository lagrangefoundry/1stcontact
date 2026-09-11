/**
 * REQ-220 — **the surface composes the one vocabulary, and draws only what is
 * pending**.
 *
 * WHAT THIS FILE PROVES. The ticket says the tools are *"the shared vocabulary
 * and nothing more — the same list the assistant's `edit_image` uses, because
 * there is one list"*, and that *"interaction is local; truth is rendered"*. Both
 * are claims about code rather than about a screen, so they are asserted here
 * without a DOM: the list the editor can emit is checked AGAINST `image-recipe.ts`
 * itself, and the local drawing is checked to be one operation over bytes the
 * renderer already produced.
 *
 * WHY THE LIST IS PINNED RATHER THAN IMPORTED. `image-recipe.ts` is the one
 * definition and the Worker imports it directly; the builder's sources are served
 * to a browser verbatim and cannot import TypeScript. So the editor names the four
 * it composes and this suite fails the moment that name-list and the vocabulary
 * disagree — which is the drift a comment could not have caught.
 *
 * THE CLAIMS:
 *
 *  1. THE EDITOR'S OPERATIONS ARE EXACTLY THE VOCABULARY'S. Not four that happen
 *     to match — the same four, compared.
 *  2. THE SURFACE HOLDS NO SECOND OPINION ABOUT WHAT AN OPERATION MEANS. What it
 *     composes is parsed by `image-recipe.ts` without translation.
 *  3. THE LOCAL DRAWING IS THE PENDING OPERATION AND NOTHING ELSE — a crop is a
 *     window, a rotate is a transform, an adjustment is a filter.
 *  4. A DRAG NEVER LEAVES THE PICTURE AND NEVER INVERTS.
 *  5. AND THE PICTURE IS NEVER DESTROYED: what the surface produces is
 *     parameters, and a crop is widened by sending a smaller inset — no bytes and
 *     no undo required.
 */

import { describe, expect, it } from 'vitest'
import {
  EDIT_OPS,
  parseRecipe,
  compileRecipe,
} from '../tools/generate/src/cli/image-recipe'
import { EDITOR_OPS } from '../apps/control-app/src/builder/image-editor.js'
import {
  CROP_START,
  adjustOp,
  cropRect,
  nudgeCrop,
  pendingStyle,
} from '../apps/control-app/src/builder/image-preview.js'

describe('REQ-220 — the tools are the shared vocabulary and nothing more', () => {
  it('test_UAT_FC_REQ-220_the_editor_composes_exactly_the_operations_the_assistant_can_say', () => {
    // ONE LIST, COMPARED. The claim is not that these four exist; it is that the
    // editor and `edit_image` cannot come to hold different ones. Asserting the
    // literal `['crop', …]` on both sides would pass on two modules that had each
    // grown a fifth.
    expect([...EDITOR_OPS]).toEqual([...EDIT_OPS])
  })

  it('test_UAT_FC_REQ-220_what_the_surface_composes_is_read_by_the_one_vocabulary_untranslated', () => {
    // EVERY TOOL'S OUTPUT, THROUGH THE VOCABULARY'S OWN PARSER. A surface that
    // had invented its own shape for a crop — a rectangle rather than four
    // insets, say — would be refused here, which is exactly the drift the ticket
    // means by *"no second definition of what an operation means"*.
    const composed = [
      { op: 'crop', ...CROP_START },
      { op: 'rotate', degrees: 270 },
      { op: 'resize', width: 400 },
      adjustOp({ brightness: 1.2, contrast: 1, saturation: 1 }),
    ]
    expect(parseRecipe(composed)).toEqual(composed)

    // AND IT COMPILES AGAINST A REAL PICTURE, which is the check that catches a
    // shape that parses and still means nothing.
    expect(compileRecipe(parseRecipe(composed), { width: 1000, height: 500 }).transforms).toHaveLength(4)
  })

  it('test_UAT_FC_REQ-220_an_adjustment_states_only_the_slider_that_moved', () => {
    // `parseRecipe` REFUSES *"an adjust that adjusts nothing"*, and three neutral
    // multipliers would be three facts nobody asserted. So a slider at rest is
    // absent from the entry, and a whole set at rest is not an entry at all.
    expect(adjustOp({ brightness: 1.2, contrast: 1, saturation: 1 })).toEqual({
      op: 'adjust',
      brightness: 1.2,
    })
    expect(adjustOp({ brightness: 1, contrast: 1, saturation: 1 })).toBeNull()
  })
})

describe('REQ-220 — interaction is local; truth is rendered', () => {
  it('test_UAT_FC_REQ-220_the_local_drawing_is_the_pending_operation_over_bytes_the_renderer_made', () => {
    // NOTHING PENDING IS THE ORDINARY STATE, and it draws the picture the file
    // route served — which already carries every committed operation. A surface
    // that folded the recipe locally would be a second renderer, and the client
    // would be shown one thing and publish another.
    const idle = pendingStyle(null)
    expect(idle.window.transform).toBe('none')
    expect(idle.window.filter).toBe('none')
    expect(idle.image).toEqual({ left: '0%', top: '0%', width: '100%', height: '100%' })

    // A ROTATE IS A TRANSFORM.
    expect(pendingStyle({ op: 'rotate', degrees: 90 }).window.transform).toBe('rotate(90deg)')

    // AN ADJUSTMENT IS A FILTER, and only of what moved.
    expect(pendingStyle({ op: 'adjust', brightness: 1.2 }).window.filter).toBe('brightness(1.2)')

    // A CROP IS A WINDOW: the frame keeps its place on screen and the picture
    // grows and shifts inside it, because a crop shows LESS of a picture rather
    // than a smaller picture.
    const half = pendingStyle({ op: 'crop', left: 0.25, top: 0, right: 0.25, bottom: 0 })
    expect(half.image.width).toBe('200%')
    expect(half.image.left).toBe('-50%')
    expect(half.image.height).toBe('100%')
  })

  it('test_UAT_FC_REQ-220_a_drag_never_leaves_the_picture_and_never_inverts', () => {
    const start = { ...CROP_START }

    // DRAGGED HARD PAST THE EDGE, the box stops at the edge — a crop is a
    // rectangle OF this picture, not one that happens to overlap it.
    const shoved = nudgeCrop(start, 'move', -5, -5)
    expect(cropRect(shoved).x).toBe(0)
    expect(cropRect(shoved).y).toBe(0)
    expect(cropRect(shoved).w).toBeCloseTo(cropRect(start).w, 6)

    // AND A HANDLE DRAGGED THROUGH ITS OPPOSITE SIDE STOPS SHORT rather than
    // inverting, so the surface cannot compose the one recipe the renderer would
    // have to refuse as *"that would leave nothing"*.
    const squashed = nudgeCrop(start, 'se', -5, -5)
    expect(cropRect(squashed).w).toBeGreaterThan(0)
    expect(cropRect(squashed).h).toBeGreaterThan(0)
    expect(() => parseRecipe([{ op: 'crop', ...squashed }])).not.toThrow()
    expect(
      compileRecipe(parseRecipe([{ op: 'crop', ...squashed }]), { width: 1000, height: 500 }).width,
    ).toBeGreaterThan(0)
  })

  it('test_UAT_FC_REQ-220_a_crop_is_widened_by_sending_a_smaller_inset_and_not_by_undoing_anything', () => {
    // **AND THE PICTURE IS NEVER DESTROYED.** A year later, *"the crop needs to
    // be a little wider"* is a change to one number in one operation — over an
    // original nothing ever touched — rather than an undo that was never
    // recorded. Nothing the surface produces can make that false, because
    // everything it produces is parameters.
    const tight = parseRecipe([{ op: 'crop', left: 0.3, right: 0.3 }])
    const wider = parseRecipe([{ op: 'crop', left: 0.1, right: 0.1 }])
    const source = { width: 1000, height: 500 }
    expect(compileRecipe(tight, source).width).toBe(400)
    expect(compileRecipe(wider, source).width).toBe(800)
  })
})
