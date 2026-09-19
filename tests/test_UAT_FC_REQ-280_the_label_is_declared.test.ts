import { describe, expect, it } from 'vitest'
import {
  LIBRARY_DECLARATION,
  libraryOperations,
  type CatalogueItem,
  type LibraryDeps,
  type PlacedItem,
} from '../tools/generate/src/cli/ai/library-core'
import { labelOfMaterial, storedImageOf } from '../apps/control-app/src/material'
import { PRODUCT_ENTRY, primingText } from '../tools/generate/src/cli/ai/roles'

/**
 * [[REQ-280]] — **the label as the consultant is told about it**.
 *
 * THE SIBLING `.workers` SUITE PROVES WHERE THE NUMBER COMES FROM, over real D1
 * and the real counters table. This proves the half that is a decision rather
 * than a store: what the surface PUTS on a catalogue item, what it ACCEPTS back,
 * and — the part that is not code at all — that the consultant has been told it
 * may say the thing out loud.
 *
 * THAT LAST CLAIM IS NOT DECORATION. The priming tells a session that naming a
 * framework concept to its client is how it loses them, and a session that
 * reads a catalogue number as one of those concepts will never say it — which
 * would leave the operator saying `IMAGE-5` to somebody who has been instructed
 * to answer in other words. So the carve-out is asserted where it is written:
 * once in the priming the session reads about itself, and once in the surface
 * prose it reads about the catalogue.
 *
 * ONE DOUBLE, AND IT IS THE HOST. `LibraryDeps` is three functions over stores
 * that cannot be reached from a node suite; the naming is real, the filtering is
 * real, and the item fixture is built THROUGH `storedImageOf` so the aliases
 * under test are the ones production composes.
 */

// ── the doubled host ─────────────────────────────────────────────────────────

function item(over: { name: string; title?: string; label: string | null; kind?: string }): CatalogueItem {
  const filename = `${over.name}.png`
  const kind = over.kind ?? 'image'
  const row = {
    uid: over.name,
    type: 'material',
    title: over.title ?? over.name,
    filename,
    kind,
    content_type: 'image/png',
    role: 'site' as const,
    rights: 'owned',
    republishable: true,
    exportable: false,
    origin: 'uploaded',
    placed_on: [] as string[],
    source_url: null,
    description_status: 'ok',
    description_model: 'stub/vision-1',
    edits: [],
    label: over.label,
    updated_at: '2026-09-18T00:00:00Z',
  }
  return {
    ...storedImageOf(row),
    filename,
    kind,
    label: over.label,
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

function hostOver(items: CatalogueItem[]): LibraryDeps {
  return {
    slug: 'acme',
    list: async () => items,
    read: async (name) => ({
      ...(items.find((i) => i.name === name) as CatalogueItem),
      description: 'A crucible of molten metal leaning forward to pour.',
    }),
    place: async (): Promise<PlacedItem> => {
      throw new Error('this catalogue places nothing')
    },
  }
}

/** Three variants of one prompt — the shape the ticket opens with. */
const CRUCIBLES = [
  item({ name: 'material-3328dff9', title: 'A crucible of molten metal', label: 'IMAGE-3' }),
  item({ name: 'material-de9ac4ed', title: 'A crucible of molten metal', label: 'IMAGE-4' }),
  item({ name: 'material-bd70d8d9', title: 'A crucible of molten metal', label: 'IMAGE-5' }),
]

type Row = Record<string, unknown>
const rowsOf = (page: unknown): Row[] => (page as { items: Row[] }).items

// ── the label a kind takes ───────────────────────────────────────────────────

describe('REQ-280 — the prefix is the kind, said the way a person says it', () => {
  it('test_UAT_FC_REQ-280_a_kind_is_spelled_the_way_it_would_be_said_out_loud', () => {
    // The operator asked for `IMAGE-5, DOC-7`. Three of the four kinds are the
    // kind's own word in capitals, and `document` is the one that is not —
    // *"DOCUMENT-7"* is not what anybody types or reads out.
    expect(labelOfMaterial('image', 5)).toBe('IMAGE-5')
    expect(labelOfMaterial('document', 7)).toBe('DOC-7')
    expect(labelOfMaterial('font', 3)).toBe('FONT-3')
    expect(labelOfMaterial('capture', 2)).toBe('CAPTURE-2')

    // AND A KIND DOC-38 §9 HAS NOT ADDED YET STILL GETS A LABEL. The map holds
    // the exception and nothing else, so a fifth kind arrives labelled rather
    // than arriving unnameable and waiting for this table to hear about it.
    expect(labelOfMaterial('hologram', 1)).toBe('HOLOGRAM-1')
  })
})

// ── what the surface carries and accepts ─────────────────────────────────────

describe('REQ-280 — the catalogue item carries the name the client can see', () => {
  it('test_UAT_FC_REQ-280_every_listed_item_carries_its_label_beside_the_handle', async () => {
    // ON THE LISTING AND NOT ONLY ON THE ITEM THAT WAS READ, because the moment
    // the label is useful is the moment three items come back titled the same —
    // which is precisely a listing.
    const ops = libraryOperations(hostOver(CRUCIBLES))
    const rows = rowsOf(await ops.list_library({}))

    expect(rows.map((r) => r.title)).toEqual([
      'A crucible of molten metal',
      'A crucible of molten metal',
      'A crucible of molten metal',
    ])
    expect(rows.map((r) => r.label)).toEqual(['IMAGE-3', 'IMAGE-4', 'IMAGE-5'])
    // THE HANDLE IS UNCHANGED. This ticket adds a spoken name; it does not swap
    // the machine one, which is persisted in every stored edit recipe.
    expect(rows.map((r) => r.item)).toEqual(CRUCIBLES.map((c) => c.name))
  })

  it('test_UAT_FC_REQ-280_an_item_can_be_asked_for_by_the_label_the_client_said', async () => {
    // The reference has to work in both directions or it is not shared: the
    // client says *"the crucible, IMAGE-5"* and the consultant reaches exactly
    // that picture, through the one naming rule and with no translation.
    const ops = libraryOperations(hostOver(CRUCIBLES))
    const read = (await ops.get_library_item({ item: 'IMAGE-5' })) as Row
    expect(read.item).toBe('material-bd70d8d9')
    expect(read.label).toBe('IMAGE-5')
  })

  it('test_UAT_FC_REQ-280_an_item_with_no_label_yet_is_listed_rather_than_hidden', async () => {
    // Material that predates the label is labelled by the host's next listing,
    // not by this surface — so what this surface owes it is to carry the absence
    // honestly rather than to drop the item or invent a name for it.
    const ops = libraryOperations(hostOver([item({ name: 'material-old', label: null })]))
    const rows = rowsOf(await ops.list_library({}))
    expect(rows).toHaveLength(1)
    expect(rows[0].label).toBeNull()
    expect(rows[0].item).toBe('material-old')
  })
})

// ── the consultant has been told it may say this out loud ────────────────────

describe('REQ-280 — the carve-out from the no-vocabulary rule is written down', () => {
  it('test_UAT_FC_REQ-280_the_surface_tells_the_consultant_to_say_the_number_to_the_client', () => {
    const declaration = LIBRARY_DECLARATION as {
      overview: string
      shapes: Record<string, Record<string, string>>
      param_types: Record<string, { description: string }>
      surface_version: number
    }

    // DECLARED AS A FIELD, in the words the model reads about it.
    expect(Object.keys(declaration.shapes.catalogue_item)).toContain('label')
    expect(declaration.shapes.catalogue_item.label).toMatch(/IMAGE-5/)

    // AND AS AN INPUT. A name the surface accepts and does not advertise is a
    // capability the model has no reason to try.
    expect(declaration.param_types.item_name.description).toMatch(/IMAGE-5/)

    // AND THE PROSE SAYS IT IS FOR SAYING. The surface is where a session goes
    // to find out what a catalogue is for, so the instruction to use this name
    // in conversation belongs there rather than only in a field description.
    expect(declaration.overview).toMatch(/IMAGE-5/)
    expect(declaration.overview).toMatch(/say/i)

    // THE VERSION MOVED WITH THE SURFACE. The manual a session reads is
    // projected from this declaration, and its version is how a reader tells one
    // projection from another.
    expect(declaration.surface_version).toBeGreaterThan(1)
  })

  it('test_UAT_FC_REQ-280_the_priming_names_the_label_as_the_exception_to_its_own_rule', () => {
    // WITHOUT THIS, THE FEATURE IS INERT ON THE CONSULTANT'S SIDE. The priming
    // says naming a framework concept to a client is how you lose them; a
    // session that files a catalogue number under that rule will never say one,
    // and the operator ends up saying IMAGE-5 to somebody instructed to answer
    // in other words. So the carve-out is asserted in the same document as the
    // rule it carves out of.
    //
    // AUTHORED AS LINES AND READ AS A PARAGRAPH. `priming.json` holds prose as a
    // list of lines because JSON has no block scalar, so a sentence that spans a
    // line break is one sentence to the model and two to a regular expression.
    const priming = primingText(PRODUCT_ENTRY).replace(/\s+/g, ' ')
    expect(priming).toMatch(/you have already lost them/)
    expect(priming).toMatch(/One thing is not a framework concept/)
    expect(priming).toMatch(/IMAGE-5/)

    // AND IT SPELLS ONLY THE PICTURE EXAMPLE. `DOC-7` is a perfectly good label
    // and it is in the surface prose, but `DOC-\\d+` is ALSO how the product's own
    // corpus addresses a document ([[BUG-65]]) — and authored priming naming
    // something in that namespace is the exact defect that suite exists to stop.
    // The two never meet in the catalogue, where a label is always read beside
    // the item it is on; they would meet here, in a document about nothing in
    // particular, which is where a model would be most likely to go looking for
    // the wrong one.
    expect(priming).not.toMatch(/\bDOC-\d+\b/)
  })
})
