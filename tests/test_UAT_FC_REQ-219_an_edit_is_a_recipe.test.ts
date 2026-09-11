import { describe, expect, it } from 'vitest'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  compileRecipe,
  parseRecipe,
  RecipeRefusedError,
  EDIT_OPS,
  type EditOp,
} from '../tools/generate/src/cli/image-recipe'
import {
  IMAGE_DECLARATION,
  imageInstanceConfig,
  imageOperations,
  type ImageEditDeps,
} from '../tools/generate/src/cli/ai/image-core'
import { L1_DECLARATION } from '../tools/generate/src/cli/ai/toolbox-core'
import { FIDELITY_DECLARATION } from '../tools/generate/src/cli/ai/fidelity-core'
import { aiCore } from '../tools/generate/src/cli/ai/toolbox'
import type { ImageLibrary, StoredImage } from '../tools/generate/src/cli/image-library'
import type { Dimensions, ImageRenderer, RecipeStore } from '../tools/generate/src/cli/image-recipe'
import { readWranglerConfig } from './support/wrangler-toml'

/**
 * REQ-219 — **an edit is a recipe**: the operation vocabulary, and the
 * compilation of one into something a renderer can run.
 *
 * WHAT IS REAL HERE AND WHAT IS NOT. The vocabulary, the validation, the
 * compiler and the surface's operations are all the shipped code. The
 * declaration is checked by the framework's OWN validator, which is the check
 * DOC-30 puts in CI.
 *
 * ONE THING IS A DOUBLE: the renderer. That is deliberate and it is the point of
 * the file. The local Images binding the workerd suite runs against implements
 * `rotate`, `width` and `height` and silently drops trim and every colour
 * adjustment — so a suite that cropped a picture and compared pixels would pass
 * against an uncropped image, which is worse than no suite. The chain is where
 * the logic lives, so the chain is what is asserted here, exactly; the sibling
 * `.workers` suite proves the real binding runs it.
 */

const HERE = path.dirname(fileURLToPath(import.meta.url))

// ── AC1 — the vocabulary is closed ───────────────────────────────────────────

describe('REQ-219 AC1 — the vocabulary is closed and shared', () => {
  it('test_UAT_FC_REQ-219_v1_is_crop_rotate_resize_and_adjust', () => {
    // The list, asserted as a list rather than by exercising four code paths
    // and hoping there is no fifth. It is what the surface's overview enumerates
    // and what the editor UI will build its controls from.
    expect([...EDIT_OPS]).toEqual(['crop', 'rotate', 'resize', 'adjust'])
  })

  it('test_UAT_FC_REQ-219_an_operation_outside_the_vocabulary_is_refused', () => {
    // NOT IGNORED. An unknown operation quietly dropped is a picture that comes
    // out other than the way it was asked for, with nothing anywhere saying so.
    expect(() => parseRecipe([{ op: 'sharpen', amount: 2 }])).toThrow(RecipeRefusedError)
    expect(() => parseRecipe([{ op: 'sharpen' }])).toThrow(/not something a picture can be edited by/)
  })

  it('test_UAT_FC_REQ-219_flip_is_out_of_v1', () => {
    // Deliberately out, and the refusal names the whole vocabulary so the caller
    // learns what there is rather than only what there is not. The platform
    // renderer CAN flip — this is a scope decision, recorded here so that
    // reopening it is a decision rather than an accident.
    expect(() => parseRecipe([{ op: 'flip', direction: 'h' }])).toThrow(
      /crop, rotate, resize, adjust/,
    )
  })

  it('test_UAT_FC_REQ-219_an_empty_recipe_is_a_picture_as_it_was_stored', () => {
    // Absence reads as the empty recipe, so nothing that predates the field
    // needs migrating and no consumer treats "never edited" as a third state.
    expect(parseRecipe(undefined)).toEqual([])
    expect(parseRecipe(null)).toEqual([])
    expect(parseRecipe([])).toEqual([])
    // AND IT COMPILES TO NOTHING AT ALL — not to an identity transform. Every
    // picture in the Library is in this state today and none of them should
    // start paying for a renderer they do not use.
    expect(compileRecipe([], { width: 800, height: 600 })).toEqual({
      transforms: [],
      width: 800,
      height: 600,
    })
  })
})

// ── AC2 — coordinates are normalised, sizes are pixels ───────────────────────

describe('REQ-219 AC2 — coordinates are fractions, never pixels', () => {
  it('test_UAT_FC_REQ-219_a_crop_in_pixels_is_told_the_unit', () => {
    // THE MISTAKE GETS ITS OWN SENTENCE. "Not between 0 and 1" leaves the caller
    // to guess; naming the unit is what lets the next call be right.
    expect(() => parseRecipe([{ op: 'crop', top: 120 }])).toThrow(
      /fractions of the picture and not in pixels/,
    )
  })

  it('test_UAT_FC_REQ-219_a_crop_outside_the_frame_is_refused', () => {
    expect(() => parseRecipe([{ op: 'crop', left: -0.1 }])).toThrow(
      /cannot reach outside the picture/,
    )
  })

  it('test_UAT_FC_REQ-219_a_crop_that_would_leave_nothing_is_refused', () => {
    // Twice over, because there are two ways to reach it. This one is arithmetic
    // that cannot be right for any picture…
    expect(() => parseRecipe([{ op: 'crop', left: 0.6, right: 0.5 }])).toThrow(
      /there would be nothing left/,
    )
    // …and this one is legal arithmetic that leaves less than a pixel of THIS
    // picture, which only the dimensions can decide.
    expect(() =>
      compileRecipe(parseRecipe([{ op: 'crop', left: 0.499, right: 0.499 }]), {
        width: 10,
        height: 10,
      }),
    ).toThrow(/which is nothing/)
  })

  it('test_UAT_FC_REQ-219_a_crop_that_trims_nothing_is_refused', () => {
    expect(() => parseRecipe([{ op: 'crop' }])).toThrow(/no side trimmed/)
  })

  it('test_UAT_FC_REQ-219_a_resize_is_a_whole_number_of_pixels', () => {
    // The other side of the split: a resize takes pixels, because "a logo that
    // is 400px wide because that is what it is" is the case it exists for and a
    // fraction could not say it.
    expect(parseRecipe([{ op: 'resize', width: 400 }])).toEqual([{ op: 'resize', width: 400 }])
    expect(() => parseRecipe([{ op: 'resize', width: 0.5 }])).toThrow(
      /whole number of pixels/,
    )
    expect(() => parseRecipe([{ op: 'resize' }])).toThrow(/names no size/)
  })

  it('test_UAT_FC_REQ-219_a_resize_past_the_source_is_refused', () => {
    const recipe = parseRecipe([{ op: 'resize', width: 1600 }])
    expect(() => compileRecipe(recipe, { width: 800, height: 600 })).toThrow(
      /it cannot be made larger/,
    )
  })

  it('test_UAT_FC_REQ-219_rotate_is_a_quarter_turn', () => {
    for (const degrees of [90, 180, 270]) {
      expect(parseRecipe([{ op: 'rotate', degrees }])).toEqual([{ op: 'rotate', degrees }])
    }
    expect(() => parseRecipe([{ op: 'rotate', degrees: 45 }])).toThrow(/turns in quarters/)
  })

  it('test_UAT_FC_REQ-219_adjust_is_a_multiplier_where_one_is_unchanged', () => {
    expect(parseRecipe([{ op: 'adjust', saturation: 0 }])).toEqual([
      { op: 'adjust', saturation: 0 },
    ])
    // 120 is somebody who meant a percentage, and the refusal says so rather
    // than producing a white rectangle.
    expect(() => parseRecipe([{ op: 'adjust', brightness: 120 }])).toThrow(
      /1.2 is a fifth brighter, not 120/,
    )
    expect(() => parseRecipe([{ op: 'adjust' }])).toThrow(/adjusts nothing/)
  })
})

// ── AC3 — one operation, one step, in order ──────────────────────────────────

describe('REQ-219 AC3 — a recipe is a transform chain', () => {
  it('test_UAT_FC_REQ-219_each_operation_compiles_to_its_own_step_in_order', () => {
    // ONE ENTRY PER OPERATION IS A CORRECTNESS PROPERTY. Within a single
    // transform the platform applies trim before resize before rotate, so a
    // recipe collapsed into one call would silently reorder itself and
    // "crop, then rotate" would rotate and then crop somewhere else entirely.
    const recipe = parseRecipe([
      { op: 'crop', top: 0.25, bottom: 0.25 },
      { op: 'rotate', degrees: 90 },
      { op: 'adjust', saturation: 0, brightness: 1.2 },
    ])
    const compiled = compileRecipe(recipe, { width: 800, height: 400 })
    expect(compiled.transforms).toEqual([
      { trim: { left: 0, top: 100, width: 800, height: 200 } },
      { rotate: 90 },
      { brightness: 1.2, saturation: 0 },
    ])
  })

  it('test_UAT_FC_REQ-219_a_crop_compiles_to_pixels_off_each_edge', () => {
    // Rounded to pixels in exactly one place. The recipe stays in fractions so
    // it survives an operation being inserted before it; the renderer's own
    // primitive counts pixels; this is where the two meet.
    const compiled = compileRecipe(parseRecipe([{ op: 'crop', left: 0.1, right: 0.2, top: 0.5 }]), {
      width: 1000,
      height: 400,
    })
    expect(compiled.transforms).toEqual([{ trim: { left: 100, top: 200, width: 700, height: 200 } }])
    expect({ width: compiled.width, height: compiled.height }).toEqual({ width: 700, height: 200 })
  })

  it('test_UAT_FC_REQ-219_a_resize_keeps_the_aspect_ratio', () => {
    const compiled = compileRecipe(parseRecipe([{ op: 'resize', width: 400 }]), {
      width: 800,
      height: 600,
    })
    expect(compiled.transforms).toEqual([{ width: 400, fit: 'contain' }])
    expect({ width: compiled.width, height: compiled.height }).toEqual({ width: 400, height: 300 })
  })

  it('test_UAT_FC_REQ-219_dimensions_are_tracked_through_the_recipe', () => {
    // OPERATION N'S FRACTIONS ARE FRACTIONS OF WHAT 1..N-1 LEFT. A quarter turn
    // swaps the sides, and the crop after it is measured against the swapped
    // ones — which is the whole reason the recipe is normalised rather than
    // baked.
    const compiled = compileRecipe(
      parseRecipe([
        { op: 'rotate', degrees: 90 },
        { op: 'crop', left: 0.5 },
      ]),
      { width: 800, height: 200 },
    )
    expect(compiled.transforms).toEqual([
      { rotate: 90 },
      // 200 wide after the turn, so half of it is 100 — not half of 800.
      { trim: { left: 100, top: 0, width: 100, height: 800 } },
    ])
    expect({ width: compiled.width, height: compiled.height }).toEqual({ width: 100, height: 800 })
  })

  it('test_UAT_FC_REQ-219_an_operation_is_revisable_rather_than_merely_reversible', () => {
    // THE CLAUSE THE WHOLE MODEL EXISTS FOR: "the crop needs to be a little
    // wider" is not an undo, it is editing the crop operation's parameters —
    // and every later operation follows the new number without being rewritten.
    const january: EditOp[] = parseRecipe([
      { op: 'crop', left: 0.3, right: 0.3 },
      { op: 'resize', width: 200 },
    ])
    const june: EditOp[] = parseRecipe([
      { op: 'crop', left: 0.2, right: 0.2 },
      { op: 'resize', width: 200 },
    ])
    const source = { width: 1000, height: 500 }
    expect(compileRecipe(january, source).transforms[0]).toEqual({
      trim: { left: 300, top: 0, width: 400, height: 500 },
    })
    expect(compileRecipe(june, source).transforms[0]).toEqual({
      trim: { left: 200, top: 0, width: 600, height: 500 },
    })
    // AND REMOVING ONE FROM THE MIDDLE IS ORDINARY. Nothing downstream holds a
    // pixel that has to be recomputed by hand.
    const withoutTheCrop = compileRecipe(parseRecipe([{ op: 'resize', width: 200 }]), source)
    expect(withoutTheCrop.transforms).toEqual([{ width: 200, fit: 'contain' }])
    expect(withoutTheCrop.height).toBe(100)
  })
})

// ── AC4 — the surface ────────────────────────────────────────────────────────

/** A picture library holding exactly what a test put in it. */
function library(images: StoredImage[], bytes: Uint8Array): ImageLibrary {
  return {
    async list() {
      return images
    },
    async read() {
      return bytes
    },
  }
}

/** A recipe store in memory — the one thing a Library record contributes. */
function recipeStore(initial: EditOp[] = []): RecipeStore & { current: EditOp[] } {
  const held = { current: initial }
  return {
    get current() {
      return held.current
    },
    set current(next: EditOp[]) {
      held.current = next
    },
    async read() {
      return held.current
    },
    async write(_name: string, recipe: readonly EditOp[]) {
      held.current = [...recipe]
    },
  } as RecipeStore & { current: EditOp[] }
}

/** A renderer that only ever has to answer the one question this surface asks. */
function sizedRenderer(size: Dimensions): ImageRenderer {
  return {
    async measure() {
      return size
    },
    async render(bytes, mediaType) {
      return { bytes, mediaType, ...size }
    },
  }
}

const LIBRARY_PICTURE: StoredImage = {
  name: 'material-abc',
  where: 'library',
  mediaType: 'image/png',
  title: 'A wide shopfront at dusk',
  aliases: ['shopfront.png'],
}

const SITE_PICTURE: StoredImage = {
  name: 'logo.png',
  where: 'site',
  mediaType: 'image/png',
  aliases: ['/assets/logo.png', 'logo'],
}

function surface(
  opts: { recipes?: RecipeStore; images?: StoredImage[]; size?: Dimensions } = {},
): ReturnType<typeof imageOperations> {
  const deps: ImageEditDeps = {
    images: library(opts.images ?? [LIBRARY_PICTURE, SITE_PICTURE], new Uint8Array([1, 2, 3])),
    recipes: opts.recipes ? { library: opts.recipes } : { library: recipeStore() },
    renderer: sizedRenderer(opts.size ?? { width: 1000, height: 500 }),
  }
  return imageOperations(deps)
}

describe('REQ-219 AC4 — `edit_image`, the assistant’s half', () => {
  it('test_UAT_FC_REQ-219_the_declaration_validates_with_its_travelling_grant', async () => {
    // Through the framework's OWN validator, with the grant the surface carries
    // — so a group renamed in the declaration becomes a resolution failure here
    // rather than a session that silently grants nothing.
    const { validateData } = await aiCore()
    const report = validateData(
      [L1_DECLARATION, FIDELITY_DECLARATION, IMAGE_DECLARATION],
      { consultant: imageInstanceConfig() },
    )
    expect(report.problems).toEqual([])
    expect(report.surfaces.sort()).toEqual(['fidelity', 'image', 'l1'])
    // AND NO MANUAL LEAK. The Toolbox projects a manual by SELECTING blocks, so
    // prose inside one is copied verbatim — a sentence in the overview naming
    // the tool that writes would put it in a read-only session's manual, which
    // breaks the property that makes projecting the manual worth doing. It is an
    // author-time lint precisely because nothing fails at runtime.
    expect(report.warnings.filter((w: string) => w.includes("surface 'image'"))).toEqual([])
  })

  it('test_UAT_FC_REQ-219_the_editing_operations_are_not_on_a_looking_surface', () => {
    // `fidelity-surface.json` opens by promising that nothing on it changes
    // anything and that the site cannot move because you looked at it. An edit
    // is a write, so it is a surface of its own — asserted against the
    // declarations rather than by reading the diff.
    const ours = (IMAGE_DECLARATION.operations as { op: string }[]).map((o) => o.op)
    const looking = (FIDELITY_DECLARATION.operations as { op: string }[]).map((o) => o.op)
    const site = (L1_DECLARATION.operations as { op: string }[]).map((o) => o.op)
    expect(ours.sort()).toEqual(['edit_image', 'list_image_edits'])
    for (const op of ours) {
      expect(looking).not.toContain(op)
      expect(site).not.toContain(op)
    }
  })

  it('test_UAT_FC_REQ-219_a_recipe_is_replaced_whole_and_reported_whole', async () => {
    const held = recipeStore()
    const ops = surface({ recipes: held })
    const out = (await ops.edit_image({
      image: 'material-abc',
      edits: [{ op: 'crop', top: 0.35, bottom: 0.35 }],
    })) as Record<string, unknown>
    expect(held.current).toEqual([{ op: 'crop', left: 0, top: 0.35, right: 0, bottom: 0.35 }])
    // THE WHOLE RECIPE COMES BACK, which is the counterweight to replacing the
    // list wholesale: a call that dropped an operation says so on the turn it
    // happens rather than in a picture somebody looks at next week.
    expect(out.edits).toEqual(held.current)
    expect(out.original).toEqual({ width: 1000, height: 500 })
    expect(out.size).toEqual({ width: 1000, height: 150 })
    expect(out.image).toBe('material-abc')
    expect(out.title).toBe('A wide shopfront at dusk')
  })

  it('test_UAT_FC_REQ-219_the_recipe_is_read_back_before_it_is_revised', async () => {
    const held = recipeStore(parseRecipe([{ op: 'crop', left: 0.3, right: 0.3 }]))
    const ops = surface({ recipes: held })
    const before = (await ops.list_image_edits({ image: 'material-abc' })) as Record<string, unknown>
    expect(before.edits).toEqual(held.current)
    expect(before.size).toEqual({ width: 400, height: 500 })
  })

  it('test_UAT_FC_REQ-219_an_empty_list_puts_the_picture_back_as_it_arrived', async () => {
    // The original was never touched, so there is nothing to recover — which is
    // the whole promise of keeping a recipe instead of new bytes.
    const held = recipeStore(parseRecipe([{ op: 'crop', left: 0.4 }]))
    const out = (await surface({ recipes: held }).edit_image({
      image: 'material-abc',
      edits: [],
    })) as Record<string, unknown>
    expect(held.current).toEqual([])
    expect(out.size).toEqual({ width: 1000, height: 500 })
  })

  it('test_UAT_FC_REQ-219_a_refused_recipe_leaves_the_recipe_as_it_was', async () => {
    // THE WHOLE CONTENT OF A REFUSAL. Validation happens against the picture's
    // real pixels and before the write, so a recipe is never half-applied — and
    // the operation that was already there is untouched.
    const held = recipeStore(parseRecipe([{ op: 'crop', left: 0.1 }]))
    const ops = surface({ recipes: held })
    await expect(
      ops.edit_image({
        image: 'material-abc',
        edits: [{ op: 'crop', left: 0.1 }, { op: 'resize', width: 4000 }],
      }),
    ).rejects.toThrow(/cannot be made larger/)
    expect(held.current).toEqual([{ op: 'crop', left: 0.1, top: 0, right: 0, bottom: 0 }])
  })

  it('test_UAT_FC_REQ-219_a_refusal_carries_the_declared_code', async () => {
    // The declaration is what turns a thrown error into a sentence the model
    // reads, and it only does so for a code the operation declares.
    const ops = surface()
    const error = await ops
      .edit_image({ image: 'material-abc', edits: [{ op: 'rotate', degrees: 45 }] })
      .catch((e: unknown) => e)
    expect((error as { code?: string }).code).toBe('REFUSED')
    const declared = IMAGE_DECLARATION.errors as Record<string, unknown>
    expect(Object.keys(declared)).toContain('REFUSED')
  })

  it('test_UAT_FC_REQ-219_a_site_file_has_nowhere_to_keep_a_recipe', async () => {
    // REQ-218 recorded the reason and this makes it operative. It is a refusal
    // and not a gap: the picture is perfectly visible, it simply cannot carry a
    // list of edits, and the sentence says what to do instead.
    const error = await surface()
      .edit_image({ image: 'logo.png', edits: [{ op: 'rotate', degrees: 90 }] })
      .catch((e: unknown) => e)
    expect((error as { code?: string }).code).toBe('NOT_EDITABLE')
    expect((error as Error).message).toMatch(/nowhere to keep a list of edits/)
  })

  it('test_UAT_FC_REQ-219_a_picture_is_named_the_way_every_other_verb_names_one', async () => {
    // REQ-218's vocabulary, reused rather than re-invented: a picture the
    // assistant has just LOOKED at under some spelling is one it can now EDIT
    // under that same spelling.
    for (const spelling of ['material-abc', 'A wide shopfront at dusk', 'shopfront.png']) {
      const out = (await surface().list_image_edits({ image: spelling })) as Record<string, unknown>
      expect(out.image).toBe('material-abc')
    }
  })

  it('test_UAT_FC_REQ-219_an_ambiguous_name_is_refused_with_the_candidates', async () => {
    const twin: StoredImage = { ...LIBRARY_PICTURE, name: 'material-def', aliases: [] }
    const error = await surface({ images: [LIBRARY_PICTURE, twin] })
      .list_image_edits({ image: 'A wide shopfront at dusk' })
      .catch((e: unknown) => e)
    expect((error as { code?: string }).code).toBe('AMBIGUOUS')
    expect((error as Error).message).toContain('material-abc')
    expect((error as Error).message).toContain('material-def')
  })

  it('test_UAT_FC_REQ-219_a_name_that_means_nothing_is_refused_with_what_there_is', async () => {
    const error = await surface()
      .list_image_edits({ image: 'the blue one' })
      .catch((e: unknown) => e)
    expect((error as { code?: string }).code).toBe('NOT_FOUND')
    expect((error as Error).message).toContain('material-abc')
  })
})

// ── AC5 — what the manual has to say ─────────────────────────────────────────

describe('REQ-219 AC5 — the surface says the things it has to say', () => {
  const overview = String(IMAGE_DECLARATION.overview)

  it('test_UAT_FC_REQ-219_the_manual_says_delivery_sizes_are_automatic', () => {
    // WITHOUT THIS SENTENCE THE MODEL HAND-OPTIMISES BANDWIDTH against the
    // publish-time width ladder, which is machinery already doing a better job.
    // `resize` is editorial — a logo that is 400px because that is what it is —
    // and the manual has to draw that line or the tool is used for the wrong
    // thing on the turn it is introduced.
    expect(overview).toMatch(/widths visitors actually need, without anyone being asked/)
    expect(overview).toMatch(/Do not use it to save bandwidth/)
  })

  it('test_UAT_FC_REQ-219_the_manual_says_a_description_describes_the_original', () => {
    // A crop does not re-describe the picture, deliberately — a pass that
    // rewrote a client's own corrected description on every crop would be worse
    // than the staleness. So the staleness is stated rather than hidden, and the
    // assistant is told to look rather than trust the words.
    expect(overview).toMatch(/written description describes the original/)
    expect(overview).toMatch(/Look at the picture rather than trusting the words/)
  })

  it('test_UAT_FC_REQ-219_the_manual_says_a_call_replaces_the_whole_list', () => {
    // The one hazard of replacing wholesale is a model that sends its change
    // rather than the list. The prose is half the answer and the echoed recipe
    // is the other half.
    expect(overview).toMatch(/You send the whole recipe, every time/)
    expect(overview).toMatch(/Anything you leave out is removed/)
  })

  it('test_UAT_FC_REQ-219_the_manual_says_the_original_is_kept_forever', () => {
    expect(overview).toMatch(/the original is kept forever/i)
    expect(overview).toMatch(/Nothing you do here can destroy what your client gave you/)
  })
})

// ── AC6 — the binding is declared where it has to be ─────────────────────────

describe('REQ-219 AC6 — one renderer, declared in both environments', () => {
  it('test_UAT_FC_REQ-219_the_images_binding_is_declared_on_both_sides', () => {
    // A named environment inherits NEITHER vars NOR bindings, and forgetting the
    // repeat is not a silent degradation — it is a deployed Worker whose
    // assistant has no editing tool while the local one has, with nothing
    // anywhere reporting it. The same pairing every other binding in that file
    // is held to.
    const config = readWranglerConfig(path.join(HERE, '..', 'apps/control-app/wrangler.toml'))
    expect(config.topLevel.bindings).toContain('images:IMAGES')
    expect(config.envs.production.bindings).toContain('images:IMAGES')
  })
})
