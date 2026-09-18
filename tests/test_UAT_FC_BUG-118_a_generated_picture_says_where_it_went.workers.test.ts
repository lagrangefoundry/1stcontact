import { describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { imageSurface } from '../apps/control-app/src/imagegen'
import { chatLibrary } from '../apps/control-app/src/library'
import { ticketStoreFor } from '../apps/control-app/src/tickets'
// THE WORKER'S OWN COPY OF THE LIBRARY, which is the one the Worker composes
// surfaces from. `ai/toolbox.ts`'s `aiCore` is the Node wrapper and reaches
// modules workerd has not got.
import * as aiLib from '../apps/control-app/src/generated/ai-workers.js'
import { librarySurfaceFor } from '../tools/generate/src/cli/ai/library-core'
import { applySchema, ensureTenant } from './support/d1-site-factory'

/**
 * [[BUG-118]] — **a generated picture's result says where the picture went**, and
 * what it says is true.
 *
 * THE MOMENT THIS IS ABOUT IS THE ONE THE ASSISTANT IS CERTAIN TO BE READING.
 * `create_image` hands back a ticket id, an attachment id, a filename, a size and
 * a shape, and said of none of them which of this deployment's two stores now
 * holds the bytes. So an assistant that went looking in the site's assets, found
 * nothing, and told its client it could not see its own work was reasoning
 * soundly from everything it had been given. A rule about when to go and fetch a
 * fuller manual entry cannot fix that, because a rule has to fire; a sentence in
 * the result arrives unasked.
 *
 * SO THE EVIDENCE IS NOT THAT A STRING CONTAINS A WORD. It is that the name the
 * result hands over RESOLVES — taken out of the sentence as written and passed to
 * the catalogue's own resolver, through the same surface a session calls, over the
 * same D1 store the Library tab reads. If it resolves, the sentence is true and
 * the assistant can act on it. If it did not, the sentence would be a second way
 * to be confidently wrong.
 *
 * AND THAT THE OTHER HALF OF THE SENTENCE IS TRUE TOO: the picture is NOT on the
 * site. `placed_on` is empty, which is what makes *"it is on the site only once
 * you place it there"* a fact about this record rather than a piece of advice.
 *
 * ONE DOUBLE, at a boundary that is genuinely external: the image provider's HTTP
 * endpoint, which is a second vendor's REST API that miniflare has none of and
 * the seam the imagegen component opens precisely so the plugin is demonstrable
 * with no key and no spend. The plugin, its normalising store, the material
 * vocabulary, the catalogue and its resolver are all the real ones.
 */

const APPLIED = applySchema()

/** A one-pixel PNG, as the provider's own API hands one back. */
const PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAMAAAACCAYAAAAAAAAA'

/** The provider's endpoint, and nothing else, substituted. */
const provider = (async () => ({
  status: 200,
  ok: true,
  json: async () => ({ data: [{ b64_json: PNG }] }),
})) as unknown as typeof fetch

describe('BUG-118 — the result of making a picture says where the picture is', () => {
  it('test_UAT_FC_BUG-118_the_result_names_the_library_and_the_name_it_gives_resolves', async () => {
    await APPLIED
    await ensureTenant('bug118-said')
    const scope = { businessId: 'bug118-said' }
    const tickets = await ticketStoreFor(
      { DB: env.DB as D1Database, BLOBS: env.BLOBS as R2Bucket },
      scope,
    )

    const built = imageSurface({ OPENAI_API_KEY: 'k' }, tickets, null, {
      fetch: provider,
      materialUrl: (uid: string) => `/b/${scope.businessId}/api/material/file?uid=${uid}`,
    })
    expect(built).toBeTruthy()

    const record = (await built!.surface.create_image({ prompt: 'a shopfront at dusk' })) as {
      ticket: string
      display?: string
    }

    // THE THREE THINGS THE SENTENCE HAS TO SAY, in the words a session reads:
    // which store holds it, that a name is how you look at it, and that looking
    // at it is not the same as it being on the site.
    const said = record.display ?? ''
    expect(said).toContain('Library')
    expect(said).toContain('screenshot')
    expect(said).toContain('only once you place it there')

    // THE NAME, TAKEN OUT OF THE SENTENCE RATHER THAN OFF THE RECORD. What is
    // under test is what the assistant is *told* to look with, so the assertion
    // reads the sentence the way the assistant would.
    const named = (said.match(/catalogued as (\S+)/) ?? [])[1]
    expect(named).toBe(record.ticket)

    // AND IT RESOLVES, THROUGH THE SURFACE A SESSION ACTUALLY CALLS. No site
    // store, because placing is not what is being proved and a catalogue needs no
    // site to be read — which is the deployment `chatLibrary` documents as
    // coherent rather than degraded.
    const library = await librarySurfaceFor(aiLib, chatLibrary(tickets, null, 'no-site'))
    const item = (await library.get_library_item({ item: named })) as {
      item: string
      kind: string
      origin?: string
      placed_on: string[]
    }
    expect(item.item).toBe(record.ticket)
    expect(item.kind).toBe('image')

    // THE SECOND CLAUSE, PROVED RATHER THAN ASSERTED. The picture the sentence
    // says is not on the site is on no site.
    expect(item.placed_on).toEqual([])
  })
})
