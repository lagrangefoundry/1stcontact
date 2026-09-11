/**
 * REQ-219 — the `image` surface: the assistant's half of the recipe.
 *
 * A FOURTH SURFACE, for the reason `ledger-core.ts` gives for being a third.
 * `l1-surface.json` is the documented way to change a *site* ([[DOC-30]]) and
 * nothing here touches one; `fidelity-surface.json` opens by promising that
 * every operation on it is a way of *looking* and that the site cannot move
 * because you looked at it, and an edit is a write. Bolting this onto either
 * would make that surface's claim about itself false.
 *
 * IT REUSES [[REQ-218]]'s VOCABULARY FOR NAMING A PICTURE AND DOES NOT INVENT A
 * SECOND. `resolveStoredImage` already decided what a stored picture is called
 * across both namespaces — the site's own files and the Library's records — and
 * a picture the assistant has just *looked* at has to be a picture it can now
 * *edit*, spelled the same way. A second matcher here would be the drift this
 * ticket exists to prevent, one layer up from the one it is about.
 *
 * A SITE FILE IS REFUSED, AND THE REFUSAL IS MADE OF AN ABSENCE. [[REQ-218]]
 * recorded why — a recipe lives on a Library record, and a site asset is bytes
 * with nowhere to carry one — and this is where that becomes operative: the
 * namespace simply has no {@link RecipeStore}, so `NOT_EDITABLE` falls out of
 * the deps rather than out of a condition somebody has to remember to write.
 *
 * THE RECIPE IS VALIDATED AGAINST REAL PIXELS BEFORE ANYTHING IS WRITTEN. A
 * refusal's whole promise is that the recipe is left as it was, which is only
 * true if the check happens first — so both operations measure the stored bytes
 * and compile the whole list, and the write is the last thing that happens.
 */
import imageSurface from './image-surface.json'
import {
  compileRecipe,
  parseRecipe,
  RecipeRefusedError,
  type Dimensions,
  type EditOp,
  type ImageRenderer,
  type RecipeStore,
} from '../image-recipe'
import {
  resolveStoredImage,
  type ImageLibrary,
  type StoredImage,
  type StoredImageWhere,
} from '../image-library'

/** The declaration, imported as data for the reason `toolbox-core.ts` gives. */
export const IMAGE_DECLARATION: Record<string, unknown> = imageSurface as unknown as Record<
  string,
  unknown
>

/** The surface name, so nothing addresses it as a literal. */
export const IMAGE_SURFACE = 'image'

/**
 * What a session may do to a picture's recipe. Travels with the surface.
 *
 * AN ENTRY IN `instances.json` WAS THE ALTERNATIVE AND IS WRONG HERE, for the
 * ledger's reason and one of its own. The ledger's: what a session may do to a
 * picture is a property of the surface, not a per-role decision, and two places
 * to say it is two places to drift. Its own: `instances.json` is validated
 * against the declarations the L1 suite passes in, so adding a key there makes
 * that suite's configuration name a surface it was never handed — a grant
 * nothing can check, which is exactly the thing the validator exists to catch.
 *
 * `createL1Toolbox` narrows it away wherever the surface was not composed, so a
 * deployment with no renderer starts an assistant that edits sites perfectly
 * well and simply cannot crop anything.
 */
export function imageInstanceConfig(): Record<string, unknown> {
  // TWO GROUPS AND NOT ONE, because a group is effect-homogeneous: the
  // framework's own validator refuses a `write` group holding a `read`
  // operation, and it is right to — the manual's read-only projection is what
  // makes "nothing here changes anything" a checkable claim rather than a
  // sentence. Reading a recipe and rewriting one are genuinely different acts.
  return { [IMAGE_SURFACE]: { groups: ['SeeImageEdits', 'EditImages'] } }
}

/** Raised when a name matched nothing or matched too much. */
class PictureNameError extends Error {
  constructor(
    readonly code: 'NOT_FOUND' | 'AMBIGUOUS' | 'NOT_EDITABLE' | 'UNREADABLE',
    message: string,
  ) {
    super(message)
    this.name = 'PictureNameError'
  }
}

/** What this surface needs from the deployment it is composed into. */
export interface ImageEditDeps {
  /** Every stored picture, both namespaces — [[REQ-218]]'s merged library. */
  images: ImageLibrary
  /**
   * Where each namespace keeps its recipes.
   *
   * PARTIAL ON PURPOSE. A namespace with no entry is one whose pictures cannot
   * carry a recipe, which is a fact about that namespace rather than a
   * degradation of this surface.
   */
  recipes: Partial<Record<StoredImageWhere, RecipeStore>>
  /** The renderer, for the one thing this surface asks of it: real dimensions. */
  renderer: ImageRenderer
}

type Params = Record<string, unknown>
type Untyped = any // eslint-disable-line @typescript-eslint/no-explicit-any

/** The picture a name means, refusing both ways a name can fail to mean one. */
function pictureNamed(name: string, images: readonly StoredImage[]): StoredImage {
  const { match, candidates } = resolveStoredImage(name, images)
  if (match) return match
  if (candidates.length > 1) {
    throw new PictureNameError(
      'AMBIGUOUS',
      `'${name}' is the name of ${candidates.length} pictures: ` +
        `${candidates.map((c) => `'${c.name}'`).join(', ')}. Ask again with one of those.`,
    )
  }
  throw new PictureNameError(
    'NOT_FOUND',
    `there is no stored picture called '${name}'.` +
      (images.length === 0
        ? ` This deployment holds none yet.`
        : ` The ones there are: ${images
            .slice(0, 12)
            .map((i) => `'${i.name}'`)
            .join(', ')}${images.length > 12 ? ', …' : ''}.`),
  )
}

/** The recipe store for a picture's namespace, or the refusal for having none. */
function recipesFor(image: StoredImage, deps: ImageEditDeps): RecipeStore {
  const store = deps.recipes[image.where]
  if (!store) {
    throw new PictureNameError(
      'NOT_EDITABLE',
      `'${image.name}' is a file on the site rather than an item in the Library, so there is ` +
        `nowhere to keep a list of edits for it.`,
    )
  }
  return store
}

/** The stored picture's real dimensions — what the fractions are fractions of. */
async function measured(image: StoredImage, deps: ImageEditDeps): Promise<Dimensions> {
  // THE ORIGINAL, ALWAYS. A recipe is a list over the stored bytes, so operation
  // one's fractions are fractions of those — reading the current state here
  // would make every recipe a recipe over the last one, compounding silently.
  const bytes = await deps.images.read(image, { original: true })
  try {
    return await deps.renderer.measure(bytes, image.mediaType)
  } catch (error) {
    throw new PictureNameError(
      'UNREADABLE',
      `'${image.name}' could not be measured: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
}

/** What both operations answer with — the same shape, so one read teaches both. */
function report(
  image: StoredImage,
  recipe: readonly EditOp[],
  original: Dimensions,
): Record<string, unknown> {
  const compiled = compileRecipe(recipe, original)
  return {
    image: image.name,
    ...(image.title ? { title: image.title } : {}),
    // THE WHOLE RECIPE, EVERY TIME, and this is the counterweight to replacing
    // the list wholesale: a call that dropped an operation says so on the turn
    // it happens rather than in a picture somebody looks at next week.
    edits: recipe,
    original: { width: original.width, height: original.height },
    size: { width: compiled.width, height: compiled.height },
  }
}

/** The operations, bound to one deployment's pictures. */
export function imageOperations(
  deps: ImageEditDeps,
): Record<string, (p: Params) => Promise<Untyped>> {
  async function locate(p: Params): Promise<{ image: StoredImage; store: RecipeStore }> {
    const image = pictureNamed(String(p.image ?? ''), await deps.images.list())
    return { image, store: recipesFor(image, deps) }
  }

  return {
    list_image_edits: async (p: Params) => {
      const { image, store } = await locate(p)
      const [recipe, original] = await Promise.all([store.read(image.name), measured(image, deps)])
      return report(image, recipe, original)
    },

    edit_image: async (p: Params) => {
      const { image, store } = await locate(p)
      const original = await measured(image, deps)
      // PARSED, THEN COMPILED, THEN WRITTEN, IN THAT ORDER. The parse catches
      // what is wrong with the recipe on its own; the compile catches what is
      // wrong with it *for this picture*; and the write happens after both,
      // because "the recipe is left as it was" is the whole content of a
      // refusal. Both throw `RecipeRefusedError`, which carries the declared
      // REFUSED code, so neither needs translating here.
      // AN ABSENT LIST IS NOT AN EMPTY ONE, and the distinction is worth a line
      // of its own: `edits: []` is the deliberate *"put it back as it arrived"*,
      // while a call that omitted the parameter altogether is a mistake — and
      // treating the two alike would silently throw away a client's crop because
      // an argument went missing. The declaration marks it required; this is
      // what makes that true rather than merely stated.
      if (p.edits === undefined || p.edits === null) {
        throw new RecipeRefusedError(
          `no list of edits was given. Pass the complete recipe this picture should carry — ` +
            `an empty list puts it back exactly as it arrived.`,
        )
      }
      const recipe = parseRecipe(p.edits)
      compileRecipe(recipe, original)
      await store.write(image.name, recipe)
      return report(image, recipe, original)
    },
  }
}

const bound = new WeakMap<object, Promise<Untyped>>()

function imageToolboxClass(lib: Untyped): Promise<Untyped> {
  return Promise.resolve(lib).then((mod: Untyped) => {
    const existing = bound.get(mod as object)
    if (existing) return existing
    const built = Promise.resolve(
      class ImageToolbox extends mod.ToolboxSurface {
        constructor(deps: ImageEditDeps) {
          super(IMAGE_DECLARATION)
          for (const [op, run] of Object.entries(imageOperations(deps))) {
            ;(this as unknown as Params)[op] = run
          }
        }
      },
    )
    bound.set(mod as object, built)
    return built
  })
}

/** The surface, bound to this deployment's pictures. */
export async function imageSurfaceFor(lib: Untyped, deps: ImageEditDeps): Promise<Untyped> {
  const ImageToolbox = await imageToolboxClass(lib)
  return new ImageToolbox(deps)
}

/** Re-exported so a consumer of the surface needs one import, not three. */
export { RecipeRefusedError }
export type { EditOp, ImageRenderer, RecipeStore }
