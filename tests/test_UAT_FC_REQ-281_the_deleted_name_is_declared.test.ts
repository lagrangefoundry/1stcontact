import { describe, expect, it } from 'vitest'
import {
  LIBRARY_DECLARATION,
  LibraryRefusedError,
  libraryInstanceConfig,
  libraryOperations,
  type CatalogueItem,
  type LibraryDeps,
} from '../tools/generate/src/cli/ai/library-core'
import { L1_DECLARATION } from '../tools/generate/src/cli/ai/toolbox-core'
import { aiCore } from '../tools/generate/src/cli/ai/toolbox'
import { storedImageOf } from '../apps/control-app/src/material'

/**
 * [[REQ-281]] — **what the consultant is told about a name the client deleted**.
 *
 * THE SURFACE'S HALF. The `.workers` suite proves the refusal end to end over
 * real D1, resolving the real number the upload allocated. What is decided HERE
 * is what the SURFACE decides — that the trash is consulted only when a name has
 * already failed, that it is never a listing, and that the refusal carries a
 * code the declaration actually declares, since the Toolbox renders the
 * declaration's sentence rather than the exception's.
 *
 * THE DOUBLE IS THE HOST, which is the division `library-core.ts` is built on
 * and the same one [[REQ-228]]'s node suite uses. Its `deleted` is a RECORDER,
 * because *"only on the miss path"* is a claim about a call not happening.
 *
 * THE CLAIMS:
 *
 *  1. A NAME THE CLIENT DELETED IS REFUSED AS DELETED, not as never having
 *     existed — *"a refusal that says it was deleted rather than that it never
 *     existed"*.
 *  2. A NAME THAT NEVER EXISTED IS STILL `NOT_FOUND`. Collapsing the two would
 *     make the new code useless.
 *  3. THE TRASH IS NOT A LISTING. `list_library` never reads it, so the
 *     catalogue cannot come to include things the client has got rid of.
 *  4. IT COSTS NOTHING ON THE PATH THAT WORKS. A name that resolves never
 *     reaches the trash at all.
 *  5. THE CODE IS DECLARED, and the declaration still validates with its own
 *     travelling grant — the refusal the model reads is the surface's sentence.
 */

/** A catalogue item whose names come from the production projection. */
function item(over: { name: string; label?: string; title?: string }): CatalogueItem {
  const filename = `${over.name}.png`
  const named = storedImageOf({
    uid: over.name,
    type: 'material',
    title: over.title ?? over.name,
    filename,
    kind: 'image',
    content_type: 'image/png',
    role: 'site',
    rights: 'owned',
    republishable: true,
    exportable: false,
    origin: 'uploaded',
    placed_on: [],
    source_url: null,
    description_status: 'ok',
    description_model: 'stub/vision-1',
    edits: [],
    label: over.label ?? null,
    updated_at: '2026-09-18T00:00:00Z',
  })
  return {
    ...named,
    filename,
    label: over.label ?? null,
    kind: 'image',
    role: 'site',
    rights: 'owned',
    republishable: true,
    exportable: false,
    origin: 'uploaded',
    placed_on: [],
    source_url: null,
    edits: [],
    description_status: 'ok',
    description_model: 'stub/vision-1',
    updated_at: '2026-09-18T00:00:00Z',
  }
}

function hostOver(
  live: CatalogueItem[],
  gone: CatalogueItem[] = [],
): { deps: LibraryDeps; asked: { deleted: number } } {
  const asked = { deleted: 0 }
  const deps: LibraryDeps = {
    slug: 'acme',
    list: async () => live,
    deleted: async () => {
      asked.deleted += 1
      return gone
    },
    read: async (name) => ({
      ...live.find((i) => i.name === name)!,
      description: `What ${name} shows.`,
    }),
    place: async (name) => ({
      asset: `${name}.png`,
      size: 12,
      placed_on: ['acme'],
      description: `What ${name} shows.`,
    }),
  }
  return { deps, asked }
}

const refusalOf = async (run: Promise<unknown>): Promise<LibraryRefusedError> =>
  run.then(
    () => {
      throw new Error('the call was expected to be refused and was not')
    },
    (err: unknown) => err as LibraryRefusedError,
  )

describe('REQ-281 — a deleted name is refused as deleted', () => {
  it('test_UAT_FC_REQ-281_a_number_the_client_deleted_is_refused_as_deleted', async () => {
    // A CONSULTATION THAT SAID *"use IMAGE-5"* HOLDS A NAME THAT WAS REAL WHEN
    // IT WAS SAID. The refusal has to let the session say the one useful thing —
    // *they got rid of that* — rather than list the catalogue back at somebody
    // who is quoting their own client.
    const { deps } = hostOver(
      [item({ name: 'material-yard', label: 'IMAGE-6' })],
      [item({ name: 'material-crucible', label: 'IMAGE-5' })],
    )
    const refusal = await refusalOf(libraryOperations(deps).get_library_item({ item: 'IMAGE-5' }))

    expect(refusal.code).toBe('DELETED')
    expect(refusal.message).toMatch(/deleted/i)
    // AND IT SAYS WHO CAN UNDO IT AND HOW, because a session that reads *gone*
    // and nothing else has no next step to offer.
    expect(refusal.message).toMatch(/upload/i)
    // AND IT CARRIES THE SAFE HALF FORWARD, so the assistant does not tell the
    // client their placed picture has come off the site.
    expect(refusal.message).toMatch(/site/i)
  })

  it('test_UAT_FC_REQ-281_a_name_that_never_existed_is_still_not_found', async () => {
    // THE GUARD ON THE ABOVE. A session told DELETED about a name it invented
    // would stop believing the code — and the catalogue listing in the
    // `NOT_FOUND` refusal is what lets it correct itself.
    const { deps } = hostOver(
      [item({ name: 'material-yard', label: 'IMAGE-6' })],
      [item({ name: 'material-crucible', label: 'IMAGE-5' })],
    )
    const refusal = await refusalOf(libraryOperations(deps).get_library_item({ item: 'IMAGE-4000' }))

    expect(refusal.code).toBe('NOT_FOUND')
    expect(refusal.message).toMatch(/material-yard/)
  })

  it('test_UAT_FC_REQ-281_the_trash_is_never_a_listing_and_is_never_read_on_the_path_that_works', async () => {
    // TWO CLAIMS ABOUT ONE COUNTER. The catalogue the model sees is live
    // material and nothing else — one deleted item leaking into `list_library`
    // would be the catalogue lying about what the client has — and the extra
    // read only happens where a refusal was already going to be produced.
    const { deps, asked } = hostOver(
      [item({ name: 'material-yard', label: 'IMAGE-6' })],
      [item({ name: 'material-crucible', label: 'IMAGE-5' })],
    )
    const ops = libraryOperations(deps)

    const page = (await ops.list_library({})) as { items: Array<{ item: string }>; total: number }
    expect(page.items.map((r) => r.item)).toEqual(['material-yard'])
    expect(page.total).toBe(1)

    await ops.get_library_item({ item: 'IMAGE-6' })
    expect(asked.deleted).toBe(0)

    await refusalOf(ops.get_library_item({ item: 'IMAGE-5' }))
    expect(asked.deleted).toBe(1)
  })

  it('test_UAT_FC_REQ-281_an_ambiguous_live_name_is_still_ambiguous_rather_than_deleted', async () => {
    // AMBIGUITY IS DECIDED BEFORE THE TRASH IS CONSULTED, and it has to be: a
    // name that fits two live items is a question the session can answer, and
    // telling it the item was deleted would send it looking for a file that is
    // sitting in front of it. The trash is not read at all.
    const { deps, asked } = hostOver(
      [
        item({ name: 'material-a', title: 'The crucible' }),
        item({ name: 'material-b', title: 'The crucible' }),
      ],
      [item({ name: 'material-crucible', label: 'IMAGE-5' })],
    )
    const refusal = await refusalOf(
      libraryOperations(deps).get_library_item({ item: 'The crucible' }),
    )

    expect(refusal.code).toBe('AMBIGUOUS')
    expect(asked.deleted).toBe(0)
  })
})

describe('REQ-281 — the refusal the model reads is the declaration’s', () => {
  it('test_UAT_FC_REQ-281_deleted_is_declared_and_named_by_the_operations_that_resolve_a_name', async () => {
    // THE TOOLBOX RENDERS A FAILURE FROM THE DECLARATION when the error carries
    // a declared code, so a code the declaration does not know is a refusal the
    // model reads as an exception's message instead of the surface's sentence.
    const declaration = LIBRARY_DECLARATION as unknown as {
      surface_version: number
      errors: Record<string, { message: string }>
      operations: Array<{ op: string; errors?: string[] }>
      absences: Array<{ name: string; note: string }>
    }

    expect(Object.keys(declaration.errors)).toContain('DELETED')
    // AND THE SENTENCE SAYS THE TWO THINGS ONLY THE DECLARATION CAN SAY: that
    // arguing about it is pointless, and that the site is unaffected.
    expect(declaration.errors.DELETED.message).toMatch(/deleted/i)
    expect(declaration.errors.DELETED.message).toMatch(/site/i)

    const named = (op: string) =>
      declaration.operations.find((o) => o.op === op)?.errors ?? []
    expect(named('get_library_item')).toContain('DELETED')
    expect(named('place_on_site')).toContain('DELETED')
    // AND NOT ON THE LISTING, which resolves no name and cannot raise it.
    expect(named('list_library')).not.toContain('DELETED')

    // THE VERSION MOVED WITH THE SURFACE, which is how a reader tells one
    // projection of this manual from another ([[REQ-280]]'s own assertion).
    expect(declaration.surface_version).toBeGreaterThan(2)

    // AND THE ABSENCE STILL SAYS THE ASSISTANT MAY NOT DELETE. The client can
    // now; that is a different sentence, and conflating them would read as a
    // capability the surface does not grant.
    const removing = declaration.absences.find((a) => a.name === 'Removing anything')
    expect(removing?.note).toMatch(/no way for YOU to delete/i)
    expect(removing?.note).toMatch(/their own Library tab/i)
  })

  it('test_UAT_FC_REQ-281_the_declaration_still_validates_with_its_travelling_grant', async () => {
    // Through the framework's OWN validator, so a malformed error table or an
    // operation naming a code that does not exist fails here rather than in a
    // conversation.
    const { validateData } = await aiCore()
    const report = validateData([L1_DECLARATION, LIBRARY_DECLARATION], {
      consultant: libraryInstanceConfig(),
    })
    expect(report.problems).toEqual([])
    expect(report.surfaces.sort()).toEqual(['l1', 'library'])
  })
})
