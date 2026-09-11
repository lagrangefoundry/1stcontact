/**
 * REQ-218 — every stored picture, and the one rule for naming one.
 *
 * WHY THIS IS A VOCABULARY AND NOT A LOOKUP. The product stores pictures in two
 * places that were drawn for different reasons and have never had to agree about
 * anything. A SITE ASSET is bytes under a site's `assets/`, named by its
 * filename, written by `write_image` or by promoting something onto the site;
 * `list_assets` is its listing. A LIBRARY ITEM is a material ticket, named by
 * its record and titled the way the Library titles it; it is what the client
 * dropped on the conversation and what the generator made. They live in
 * different buckets on purpose — one serves the public internet and one holds
 * the client's confidential material — so unifying the STORAGE was never on the
 * table. What can be unified is the NAME, and that is all this module does.
 *
 * A client asking about "the logo" does not know which of the two holds it, and
 * neither does the assistant answering them. So a stored picture is addressable
 * however it is referenced — the site filename, the `/assets/…` handle a page
 * holds, the bare name a drawing was written under, the Library record, or the
 * Library title — and {@link resolveStoredImage} is the only thing that decides.
 *
 * THE SPELLINGS TRAVEL WITH THE PICTURE, NOT WITH THE MATCHER. Each namespace
 * declares its own {@link StoredImage.aliases}, so the matcher is one comparison
 * over a flat set and knows nothing about `/assets/` or `.svg`. A third
 * namespace would add a list and change nothing here — which is the difference
 * between a vocabulary and a pile of special cases.
 *
 * AMBIGUITY IS REFUSED, NEVER RESOLVED. Two pictures answering to one name is
 * the one case where guessing is worse than asking again: a picture handed back
 * as though it were the one that was asked for is a wrong answer that looks like
 * a right one, and nothing downstream can tell. So the refusal names the
 * candidates and their unambiguous names, and the caller asks again.
 */

/** Which namespace holds a picture — and, for a merge, which half answers. */
export type StoredImageWhere = 'site' | 'library'

/** One stored picture, as a namespace reports it. */
export interface StoredImage {
  /**
   * The unambiguous name — the one a refusal offers back when a name was
   * ambiguous, and therefore the one that must always mean exactly one picture.
   *
   * It has to be unique ACROSS namespaces, because a merged listing is one list.
   * A site asset's filename and a Library record's uid cannot collide (`material-…`
   * is not a filename), which is why those are the two canonical names.
   */
  name: string
  where: StoredImageWhere
  /** The type the bytes are stored as — what the browser is told to decode. */
  mediaType: string
  /** What the Library calls it. Absent for a site asset, which has no title. */
  title?: string
  /**
   * Every other spelling this picture answers to.
   *
   * Not merely convenience: a page holds an asset's `/assets/…` handle and a
   * drawing is written under a bare stem, so a caller that has just read a node
   * or just drawn something is holding a name that is not the canonical one. A
   * listing that did not declare those would make the model translate, and
   * translating is where it goes wrong.
   */
  aliases: string[]
}

/** What a name matched — and, when it matched too much, what it matched. */
export interface StoredImageMatch {
  /** The one picture, or null when none matched or several did. */
  match: StoredImage | null
  /** Every picture the name reached. Length > 1 is the ambiguous case. */
  candidates: StoredImage[]
}

/**
 * Read a stored picture's bytes, and list what there is to read.
 *
 * A PORT, for the reason every seam in this graph is one: the site's assets come
 * from a `SiteStore` that may have no filesystem, and the Library's come from a
 * ticket store that only the Worker has. Neither can be imported here without
 * putting a runtime into a module the other runtime also loads.
 */
export interface ImageLibrary {
  /**
   * Every picture this half holds.
   *
   * FOR RESOLUTION, NOT FOR THE MODEL. No operation exposes this: a Library
   * listing is a different capability and is deliberately out of scope, because
   * a picture's handle arrives in the result of whatever made it. What it is for
   * is {@link resolveStoredImage}, which needs the whole set to tell a name that
   * means one picture from a name that means two.
   */
  list(): Promise<StoredImage[]>
  /**
   * The picture's bytes, as stored.
   *
   * `original` asks for the bytes before any edit recipe, as against the picture
   * as it currently stands. Until the recipe exists ([[REQ-219]]) every picture
   * is its own original and both answers are the same bytes — which is what
   * "where no recipe exists the two are the same image" means. The argument is
   * carried now because this is the seam the renderer fills in, and a parameter
   * added later would be a second shape for callers to learn.
   */
  read(image: StoredImage, opts: { original: boolean }): Promise<Uint8Array>
}

/** Every spelling one picture answers to, canonical name first. */
function spellings(image: StoredImage): string[] {
  return [image.name, ...(image.title ? [image.title] : []), ...image.aliases]
}

/**
 * The one rule: which stored picture, if any, is called `name`.
 *
 * EXACT BEFORE LOOSE, and that ordering is load-bearing. Matching is otherwise
 * case- and whitespace-insensitive, because a Library title is a sentence
 * somebody typed and holding the model to its capitalisation would be a riddle.
 * But a store can hold `Logo.png` and `logo.png` as two different pictures, and
 * a loose-only match would call that ambiguous and refuse a name that is in fact
 * exact. So an exact hit wins outright, and the loose pass only runs when
 * nothing matched exactly.
 */
export function resolveStoredImage(name: string, images: readonly StoredImage[]): StoredImageMatch {
  const asked = name.trim()
  const exact = images.filter((image) => spellings(image).some((s) => s === asked))
  if (exact.length === 1) return { match: exact[0], candidates: exact }
  if (exact.length > 1) return { match: null, candidates: exact }

  const loose = asked.toLowerCase()
  const near = images.filter((image) =>
    spellings(image).some((s) => s.trim().toLowerCase() === loose),
  )
  return { match: near.length === 1 ? near[0] : null, candidates: near }
}

/**
 * One library over several namespaces.
 *
 * KEYED BY NAMESPACE RATHER THAN A LIST, so `read` dispatches on the picture's
 * own `where` and there is no second place recording which half a picture came
 * from. A host that has one namespace passes one key; that is not a degraded
 * mode, it is what a deployment without a ticket store actually holds.
 */
export function mergeImageLibraries(
  parts: Partial<Record<StoredImageWhere, ImageLibrary>>,
): ImageLibrary {
  const entries = Object.entries(parts) as [StoredImageWhere, ImageLibrary][]
  return {
    async list() {
      const lists = await Promise.all(entries.map(([, library]) => library.list()))
      return lists.flat()
    },
    async read(image, opts) {
      const part = parts[image.where]
      if (!part) {
        throw new Error(`this deployment holds no '${image.where}' pictures.`)
      }
      return part.read(image, opts)
    },
  }
}
