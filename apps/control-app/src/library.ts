/**
 * REQ-228 — the Worker's half of the catalogue surface.
 *
 * THE COUNTERPART OF `ledger.ts`, and the same division of labour: `library-core.ts`
 * declares what the assistant may ask and decides how a name resolves and how a
 * page is bounded; this supplies the three things only a deployment with a
 * ticket store and a site store can do. Nothing here reads the declaration and
 * nothing here writes a sentence the model sees.
 *
 * IT ADDS NO CONCEPT AND NO SECOND OPINION. Every fact it hands over comes from
 * a function that already existed and already has the client's own UI as a
 * consumer: `listMaterial` is the Library tab's list, `readMaterial` is its
 * detail pane, `promoteToSiteAsset` is what its **Use on site** button calls,
 * and `storedImageOf` is how the merged image library already names a record.
 * That is the whole point of the ticket — the catalogue was built and the
 * assistant was never pointed at it — so a fact computed differently here would
 * mean the assistant and the client were looking at two catalogues again.
 *
 * THE GATE IS NOT RE-IMPLEMENTED, IT IS TRANSLATED. `promoteToSiteAsset`
 * refuses anything whose record is not `republishable`, on the record rather
 * than on an argument, and it did so before anything could call it ([[REQ-163]]).
 * What {@link chatLibrary} does with that refusal is give it the surface's
 * declared code, so the model reads `library-surface.json`'s sentence instead of
 * an exception's. A check written here would be a second gate to keep correct.
 *
 * THE TENANT HANDLE IS WHAT KEEPS THIS TO ONE BUSINESS. Both stores arrive
 * already bound — the ticket store by `forTenant`, the site store by
 * `storeFor` — so there is no argument on this path that could name another
 * client's material, and nothing below re-enforces a barrier it cannot reach
 * around anyway.
 */

import type { CatalogueItem, LibraryDeps, PlacedItem } from '../../../tools/generate/src/cli/ai/library-core'
import { LibraryRefusedError } from '../../../tools/generate/src/cli/ai/library-core'
import type { ImageRenderer } from '../../../tools/generate/src/cli/image-recipe'
import type { TenantSiteStore } from '../../../tools/generate/src/store/d1r2-store'
import {
  listMaterial,
  readMaterial,
  promoteToSiteAsset,
  storedImageOf,
  NotRepublishableError,
  type MaterialRow,
} from './material'
import type { TicketStore } from './tickets'

/**
 * One Library row as a catalogue item.
 *
 * THE NAME COMES FROM `storedImageOf` AND IS NOT COMPOSED HERE. That function is
 * the single projection from a record to a name ([[REQ-218]], extracted by this
 * ticket), and it is what the Library's half of the merged image library uses —
 * so a picture is spelled in the catalogue exactly as `screenshot` and
 * `edit_image` spell it, by construction rather than by care. Writing
 * `name: row.uid` here instead would be the drift in miniature.
 *
 * EVERY KIND, NOT ONLY IMAGES. `materialImageLibrary` filters to pictures
 * because a font is not a picture; the catalogue does not, because a font is
 * material and a client who uploaded their brand font uploaded it so it could go
 * on the site. The filter is the caller's; the naming is shared.
 */
function catalogueItem(row: MaterialRow): CatalogueItem {
  return {
    ...storedImageOf(row),
    filename: row.filename,
    kind: String(row.kind),
    role: row.role,
    rights: row.rights,
    republishable: row.republishable,
    exportable: row.exportable,
    origin: row.origin,
    placed_on: row.placed_on,
    source_url: row.source_url,
    edits: row.edits,
    description_status: row.description_status,
    description_model: row.description_model,
    updated_at: row.updated_at,
  }
}

/**
 * The catalogue this session can reach, bound to one site.
 *
 * THE SLUG IS CARRIED BECAUSE `placed_on` IS A LIST. "Is it on the site" is a
 * question about the site this conversation is about, and the record answers for
 * every site the bytes are on — so the surface needs to know which one it is
 * asking about, and it falls out of the session exactly as it does for the
 * fidelity and image surfaces.
 *
 * THE SITE STORE IS OPTIONAL AND ITS ABSENCE IS `NO_SITE`, not a broken
 * deployment. Reading the catalogue needs no site at all — the client's material
 * is theirs whether or not a site exists yet — so a deployment that can list and
 * describe and cannot place is a coherent thing to be, and the declaration has a
 * code for it.
 */
export function chatLibrary(
  tickets: TicketStore,
  sites: TenantSiteStore | null,
  slug: string,
  /**
   * The renderer, so a picture reaches the site AS IT CURRENTLY STANDS
   * ([[REQ-229]], [[REQ-219]]).
   *
   * PASSED THROUGH RATHER THAN DECIDED HERE. `promoteToSiteAsset` applies the
   * material's own recipe on the way across the bucket boundary; this surface's
   * job is to hand it the one renderer the deployment composed, exactly as the
   * fidelity and image surfaces are handed it, so the assistant's placement and
   * the client's put the same bytes on the site.
   */
  renderer?: ImageRenderer,
): LibraryDeps {
  return {
    slug,

    async list(): Promise<CatalogueItem[]> {
      // THE LIBRARY TAB'S OWN LIST, newest first, both material types. Not a
      // query written here: `listMaterial` is what [[REQ-161]] built and what
      // the client sees, and the one failure worth designing against is that the
      // two stop describing the same set.
      return (await listMaterial(tickets)).map(catalogueItem)
    },

    async read(name: string): Promise<CatalogueItem & { description: string }> {
      const full = await readMaterial(tickets, name)
      return {
        ...catalogueItem(full),
        // THE BODY IS THE DESCRIPTION. For a picture it is what the image
        // describer wrote about what it shows; for a document it is the digest
        // of what it says. `readMaterial` is what the detail pane reads, so the
        // assistant is given the same account of a file the client is.
        description: full.body,
      }
    },

    async place(name: string, as: string | null): Promise<PlacedItem> {
      if (!sites) {
        throw new LibraryRefusedError(
          'NO_SITE',
          'this conversation has no site store behind it, so there is nowhere to put a file.',
        )
      }
      // READ FIRST, FOR THE TWO THINGS THE PLACEMENT ITSELF DOES NOT RETURN: the
      // client's own filename, which is the default name on the site, and the
      // description, which is what the alt text gets written from. It is one
      // read either way — `promoteToSiteAsset` fetches the ticket again to check
      // the gate, and re-using this one instead would mean holding a ticket
      // across the write and checking the gate against a stale copy.
      const item = await readMaterial(tickets, name)
      try {
        const placed = await promoteToSiteAsset(
          tickets,
          sites,
          {
            uid: item.uid,
            slug,
            // THE CLIENT'S OWN FILENAME BY DEFAULT, which is what the upload
            // route passes and therefore what a file dropped on the conversation
            // is already called on the site. A picture placed by the assistant
            // and the same picture placed by the client should not land under
            // two different names.
            name: as && as.trim() !== '' ? as.trim() : item.filename,
          },
          { renderer },
        )
        return {
          asset: placed.name,
          size: placed.size,
          // RE-READ AFTER THE PLACEMENT AND NOT BEFORE. `promoteToSiteAsset`
          // writes `placed_on` after the bytes land, so the row this session
          // read a moment ago does not yet carry the mark it just made — and
          // reporting the stale list would tell the assistant its own placement
          // had not happened.
          placed_on: (await readMaterial(tickets, item.uid)).placed_on,
          description: item.body,
        }
      } catch (error) {
        // TRANSLATED, NOT RE-DECIDED. The gate fired on the record inside
        // `promoteToSiteAsset`; this only gives it the code the declaration
        // names, so the model reads the surface's sentence about rights rather
        // than an exception's.
        if (error instanceof NotRepublishableError) {
          throw new LibraryRefusedError('NOT_REPUBLISHABLE', error.message)
        }
        throw error
      }
    },
  }
}
