/**
 * REQ-228 — the `library` surface: the client's catalogue, as the assistant
 * sees it.
 *
 * A FIFTH SURFACE, for the reason `image-core.ts` gives for being a fourth and
 * `ledger-core.ts` for being a third. `l1-surface.json` is the documented way to
 * change a *site* ([[DOC-30]]), and the catalogue is not a site — it is the
 * client's own material, which exists whether or not any of it has been placed.
 * `fidelity-surface.json` opens by promising every operation on it is a way of
 * LOOKING; `place_on_site` copies bytes across the boundary between the client's
 * private bucket and what their site serves. Bolting either half onto either
 * surface would make that surface's claim about itself false.
 *
 * WHAT WAS ACTUALLY MISSING, because it was not the data model. The Library has
 * been one catalogue of items with metadata since [[REQ-161]], `placed_on` has
 * been the mark since [[BUG-47]], and `promoteToSiteAsset` has carried its own
 * refusal since [[REQ-163]]. Every one of those was wired to an HTTP route for
 * the client's own UI, and the assistant's toolbox was never pointed at the same
 * store. So this file adds no concept: it is the wire.
 *
 * IT REUSES [[REQ-218]]'s VOCABULARY FOR NAMING AND DOES NOT INVENT A SECOND.
 * `resolveStoredImage` is *the* rule for what a stored picture is called, and a
 * picture the assistant has just found in the catalogue has to be a picture it
 * can now `screenshot` and `edit_image`, spelled identically. So this surface
 * calls that same function — over a candidate set that covers every catalogue
 * item rather than only the images, which widens what is being named without
 * adding a second opinion about how naming works. The projection from a record
 * to a named item lives with the records (`material.ts`'s `storedImageOf`) and
 * is shared with the Library's half of the merged image library, so the two
 * cannot drift.
 *
 * A PORT, NOT A STORE. Everything the operations need arrives as
 * {@link LibraryDeps}: the catalogue as rows, one item read in full, and the
 * placement. The implementation is the Worker's, over a ticket store and a site
 * store — neither of which can be imported here without putting a runtime into a
 * module the `1c` CLI also loads. It is the same division `ledger-core.ts`
 * keeps, and for the same reason.
 *
 * THE REFUSALS ARE THE HOST'S, RE-CODED AND NOT RE-DECIDED. `place_on_site`
 * does not check `republishable`; `promoteToSiteAsset` does, on the record
 * rather than on an argument, and has since before anything could call it. What
 * this file does is give that refusal the surface's declared code so the model
 * reads the declaration's sentence — the same treatment `image-core.ts` gives
 * `RecipeRefusedError`.
 */
import librarySurface from './library-surface.json'
import { resolveStoredImage, type StoredImage } from '../image-library'

/** The declaration, imported as data for the reason `toolbox-core.ts` gives. */
export const LIBRARY_DECLARATION: Record<string, unknown> =
  librarySurface as unknown as Record<string, unknown>

/** The surface name, so nothing addresses it as a literal. */
export const LIBRARY_SURFACE = 'library'

/**
 * How many items a listing returns when the caller names no limit.
 *
 * THE LISTING MUST BE BOUNDED, which is the ticket's requirement and not a
 * defensive default: an engagement's Library holds every upload of the whole
 * engagement, and an unbounded listing spends exactly the context this surface
 * exists to save. Twenty is the size of a screenful of the Library tab, which is
 * the thing being reproduced.
 *
 * A BOUND THAT DID NOT SAY SO WOULD BE WORSE THAN NONE. The page reports the
 * total it matched and whether anything was held back, so a truncated listing is
 * never mistaken for a complete one — the same obligation `list_references`
 * carries.
 */
export const LIBRARY_PAGE = 20

/**
 * One catalogue item, as the host reports it.
 *
 * IT EXTENDS {@link StoredImage} rather than restating its fields, and that is
 * load-bearing rather than tidy: `resolveStoredImage` takes `StoredImage[]`, so
 * a catalogue item IS something that rule can name, by its type. An item shaped
 * some other way would have needed a translation into the rule's vocabulary,
 * which is where a second vocabulary starts.
 *
 * The rest is [[REQ-161]]'s `MaterialRow` as the model needs it — the metadata a
 * person scrolling the Library tab reads, which is what the ticket means by
 * *"picture-shaped rows carrying the item's metadata"*.
 */
export interface CatalogueItem extends StoredImage {
  filename: string
  kind: string
  role: string | null
  rights: string
  republishable: boolean
  exportable: boolean
  origin: string
  /** The sites this item's bytes are ON — [[BUG-47]]'s mark, and the point. */
  placed_on: string[]
  source_url: string | null
  edits: unknown[]
  description_status: string | null
  description_model: string | null
  updated_at: string
}

/** What this surface needs from the deployment it is composed into. */
export interface LibraryDeps {
  /**
   * Every catalogue item, newest first.
   *
   * THE WHOLE SET, UNBOUNDED, and the bounding happens here rather than in the
   * host. Filtering and limiting are the surface's decisions — a host that
   * paged would have to be told this surface's filter vocabulary, and then
   * there would be two places that know what `placed` means.
   */
  list(): Promise<CatalogueItem[]>
  /** One item in full: the row, plus what the describer wrote about it. */
  read(name: string): Promise<CatalogueItem & { description: string }>
  /**
   * Put the item's bytes on the site, and report where they landed.
   *
   * RAISES RATHER THAN RETURNING A REFUSAL. The gate lives on the record and is
   * the host's (`promoteToSiteAsset`), so the host is what knows it fired;
   * translating it into the declared code is {@link libraryOperations}'s job.
   */
  place(name: string, as: string | null): Promise<PlacedItem>
  /** Which site this session is about, for reading `placed_on` as a boolean. */
  slug: string
}

/** Where an item's bytes landed, as the host reports it. */
export interface PlacedItem {
  /** The name the bytes took on the site — renamed where one was taken. */
  asset: string
  size: number
  /** Every site the item is now on, re-read after the placement. */
  placed_on: string[]
  /** What this picture shows, for the alt text the assistant writes. */
  description: string
}

/**
 * Raised for the two ways a name can fail to mean one item, and the two ways a
 * placement can be refused.
 *
 * ITS CODES ARE THE DECLARATION'S. The Toolbox renders a failure from the
 * declaration when the error carries a declared code, so the sentence the model
 * reads is `library-surface.json`'s — this class carries the *diagnosis*, which
 * is the part only the call knows.
 */
export class LibraryRefusedError extends Error {
  readonly name = 'LibraryRefusedError'
  constructor(
    readonly code: 'NOT_FOUND' | 'AMBIGUOUS' | 'NOT_REPUBLISHABLE' | 'NO_SITE',
    message: string,
  ) {
    super(message)
  }
}

type Params = Record<string, unknown>
type Untyped = any // eslint-disable-line @typescript-eslint/no-explicit-any

/**
 * What a session may do with the client's catalogue. Travels with the surface.
 *
 * AN ENTRY IN `instances.json` WAS THE ALTERNATIVE AND IS WRONG HERE, for the
 * reason `image-core.ts` states: that file is validated in CI against the
 * declarations THIS repository hands the validator, and a key there naming a
 * surface built per deployment is a grant nothing can check.
 *
 * TWO GROUPS AND NOT ONE. A group is effect-homogeneous — the framework's
 * validator refuses a `write` group holding a `read` operation — but the split
 * is not merely mechanical. Reading what the client has given you and copying
 * one of their private files onto the site they publish are different acts, and
 * a distinct group is what lets a deployment grant the first without the second.
 * Both are granted here, because an assistant that can see a picture and not
 * place it is the half-feature this ticket is about; the separation is what
 * makes narrowing it later a configuration change rather than a redesign.
 */
export function libraryInstanceConfig(): Record<string, unknown> {
  return { [LIBRARY_SURFACE]: { groups: ['ReadLibrary', 'PlaceOnSite'] } }
}

/**
 * The item a name means, refusing both ways a name can fail to mean one.
 *
 * THE ONE RULE, OVER THE WHOLE CATALOGUE. See this file's header: the candidate
 * set widens, the rule does not change. Ambiguity is refused rather than
 * resolved, and the refusal names the unambiguous spellings — a picture handed
 * back as though it were the one that was asked for is a wrong answer that looks
 * like a right one, and nothing downstream can tell.
 */
function itemNamed(name: string, items: readonly CatalogueItem[]): CatalogueItem {
  const { match, candidates } = resolveStoredImage(name, items)
  if (match) return match as CatalogueItem
  if (candidates.length > 1) {
    throw new LibraryRefusedError(
      'AMBIGUOUS',
      `'${name}' is the name of ${candidates.length} catalogue items: ` +
        `${candidates.map((c) => `'${c.name}'`).join(', ')}. Ask again with one of those.`,
    )
  }
  throw new LibraryRefusedError(
    'NOT_FOUND',
    `there is no catalogue item called '${name}'.` +
      (items.length === 0
        ? ` Your client has not given you anything yet.`
        : ` The ones there are: ${items
            .slice(0, 12)
            .map((i) => `'${i.name}'`)
            .join(', ')}${items.length > 12 ? ', …' : ''}.`),
  )
}

/** One item as the model reads it — the declaration's `catalogue_item`. */
function itemView(item: CatalogueItem): Record<string, unknown> {
  return {
    // `item` AND NOT `name`, because this is the string every other operation on
    // every other surface takes back: `screenshot`'s `of.image`, `edit_image`'s
    // `image`, and this surface's own two named parameters. Calling the field
    // what the parameter is called is what stops the model translating.
    item: item.name,
    title: item.title ?? item.filename,
    filename: item.filename,
    kind: item.kind,
    content_type: item.mediaType,
    role: item.role,
    rights: item.rights,
    republishable: item.republishable,
    placed_on: item.placed_on,
    source_url: item.source_url,
    edits: item.edits,
    described: { status: item.description_status, by: item.description_model },
    updated_at: item.updated_at,
  }
}

/** Everything one item answers to, for the text filter. Title included. */
function haystack(item: CatalogueItem): string {
  return [item.name, item.title ?? '', item.filename, ...item.aliases].join('\n').toLowerCase()
}

/** The operations, bound to one deployment's catalogue. */
export function libraryOperations(
  deps: LibraryDeps,
): Record<string, (p: Params) => Promise<Untyped>> {
  return {
    list_library: async (p: Params) => {
      const all = await deps.list()

      // FILTERED HERE AND NOT IN THE HOST. See `LibraryDeps.list` — the filter
      // vocabulary is this surface's, and a host that knew it would be a second
      // place that decides what `placed` means.
      const kind = p.kind === undefined || p.kind === null ? null : String(p.kind)
      const role = p.role === undefined || p.role === null ? null : String(p.role)
      const placed = typeof p.placed === 'boolean' ? p.placed : null
      const matching =
        p.matching === undefined || p.matching === null
          ? null
          : String(p.matching).trim().toLowerCase()

      const matched = all.filter((item) => {
        if (kind !== null && item.kind !== kind) return false
        if (role !== null && item.role !== role) return false
        // AGAINST THIS SESSION'S SITE, not against emptiness. `placed_on` is
        // every site the bytes are on, and the question the model asked is
        // "is it on the site I am working on" — which for a business with one
        // site is the same answer and for a business with several is not.
        if (placed !== null && item.placed_on.includes(deps.slug) !== placed) return false
        if (matching !== null && matching !== '' && !haystack(item).includes(matching)) return false
        return true
      })

      const limit = Number.isInteger(p.limit) && (p.limit as number) > 0 ? (p.limit as number) : LIBRARY_PAGE
      const items = matched.slice(0, limit)
      return {
        items: items.map(itemView),
        // THE TOTAL IS OF WHAT MATCHED, not of the catalogue. A model that
        // filtered to three items wants to know it is looking at all three, and
        // a total of 200 beside a page of 3 would read as heavy truncation.
        total: matched.length,
        more: matched.length > items.length,
      }
    },

    get_library_item: async (p: Params) => {
      const item = itemNamed(String(p.item ?? ''), await deps.list())
      const full = await deps.read(item.name)
      return {
        ...itemView(full),
        // THE DESCRIPTION IS WHY THIS OPERATION EXISTS BESIDE THE LISTING. It is
        // the material's body — tens of kilobytes for a brand book — so the
        // listing deliberately omits it and this fetches the one that was asked
        // for. It is also what the alt text is written from.
        description: full.description,
      }
    },

    place_on_site: async (p: Params) => {
      const item = itemNamed(String(p.item ?? ''), await deps.list())
      const as = p.as === undefined || p.as === null ? null : String(p.as)
      const placed = await deps.place(item.name, as)
      return {
        item: item.name,
        asset: placed.asset,
        // THE HANDLE, NOT JUST THE NAME. The next thing the assistant does with
        // this is write it into a picture element's `src`, and deriving
        // `/assets/…` from a filename is a translation with exactly one correct
        // answer — so it is given rather than left to be reconstructed.
        src: `/assets/${placed.asset}`,
        size: placed.size,
        // CARRIED FORWARD FROM THE RECORD ([[BUG-44]]). The site's asset store
        // has nowhere to hold anything about a file but its bytes, so the
        // description stays on the material ticket and the assistant is the one
        // that writes it onto the element that places the image. Handing it back
        // here is what makes that a thing it can do without a second call.
        description: placed.description,
        placed_on: placed.placed_on,
      }
    },
  }
}

const bound = new WeakMap<object, Promise<Untyped>>()

function libraryToolboxClass(lib: Untyped): Promise<Untyped> {
  return Promise.resolve(lib).then((mod: Untyped) => {
    const existing = bound.get(mod as object)
    if (existing) return existing
    const built = Promise.resolve(
      class LibraryToolbox extends mod.ToolboxSurface {
        constructor(deps: LibraryDeps) {
          super(LIBRARY_DECLARATION)
          // Installed as OWN methods, not prototype ones, so the Toolbox's
          // startup binding check sees exactly the declared set and no more.
          for (const [op, run] of Object.entries(libraryOperations(deps))) {
            ;(this as unknown as Params)[op] = run
          }
        }
      },
    )
    bound.set(mod as object, built)
    return built
  })
}

/** The surface, bound to this deployment's catalogue. */
export async function librarySurfaceFor(lib: Untyped, deps: LibraryDeps): Promise<Untyped> {
  const LibraryToolbox = await libraryToolboxClass(lib)
  return new LibraryToolbox(deps)
}
