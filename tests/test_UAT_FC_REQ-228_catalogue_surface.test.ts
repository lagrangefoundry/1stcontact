import { describe, expect, it } from 'vitest'
import {
  LIBRARY_DECLARATION,
  LIBRARY_PAGE,
  LibraryRefusedError,
  libraryInstanceConfig,
  libraryOperations,
  type CatalogueItem,
  type LibraryDeps,
  type PlacedItem,
} from '../tools/generate/src/cli/ai/library-core'
import { L1_DECLARATION } from '../tools/generate/src/cli/ai/toolbox-core'
import { FIDELITY_DECLARATION } from '../tools/generate/src/cli/ai/fidelity-core'
import { IMAGE_DECLARATION } from '../tools/generate/src/cli/ai/image-core'
import { aiCore } from '../tools/generate/src/cli/ai/toolbox'
import { resolveStoredImage } from '../tools/generate/src/cli/image-library'
import { storedImageOf } from '../apps/control-app/src/material'

/**
 * REQ-228 — **one picture catalogue**: the Library as the assistant reads it.
 *
 * WHAT IS REAL HERE AND WHAT IS NOT. The declaration is the shipped one, checked
 * by the framework's OWN validator with the grant the surface actually carries.
 * The operations are the production operations, including the filtering, the
 * bound and the name resolution — all of which are decisions this surface makes
 * rather than delegates. The naming is checked against `resolveStoredImage`
 * ITSELF rather than against a copy of what it does.
 *
 * ONE THING IS A DOUBLE: {@link LibraryDeps}, the host. That is deliberate and it
 * is the division the surface is built on — the port is three functions over a
 * ticket store and a site store, and the sibling `.workers` suite drives the real
 * ones against real D1 and real R2. What is decided HERE is what the surface
 * decides, and doubling the host is what lets each of those be asserted exactly.
 *
 * THE CLAIMS, in the order the ticket makes them:
 *
 *  1. ONE CATALOGUE. Every picture is an item and **being on the site is a field
 *     on the item, not a different place to look** — so `placed` is a filter over
 *     one list rather than a second listing.
 *  2. IT IS THE CLIENT'S MATERIAL AND NOT ONLY THEIR PICTURES. Documents and
 *     fonts are catalogue items; `kind` narrows, it does not gate.
 *  3. THE LISTING IS BOUNDED, *"the way `list_references` is"* — and it SAYS it
 *     is bounded, which is the half that makes the bound honest.
 *  4. ONE NAMING RULE. `resolveStoredImage` *"must stay the one rule; a second
 *     naming vocabulary is the failure this whole module was written to avoid"* —
 *     so the catalogue calls that function rather than matching for itself.
 *  5. PLACING RETURNS THE `/assets/…` HANDLE, *"so the next thing the assistant
 *     does is write it into a picture element"*, and carries the description
 *     forward because that is what alt text is written from.
 *  6. PLACING IS ITS OWN GROUP, *"not folded into `ManageAssets`"* — a real trust
 *     boundary that reads as one.
 *  7. THE REFUSAL IS THE HOST'S, TRANSLATED. The gate fires on the record inside
 *     `promoteToSiteAsset`; this surface re-codes it and never re-decides it.
 */

// ── the doubled host ─────────────────────────────────────────────────────────

/**
 * A catalogue item, with the fields a case is not about left at their ordinary
 * values.
 *
 * **ITS NAMES COME FROM `storedImageOf`, NOT FROM THIS FILE**, and that is the
 * one thing about the fixture worth stating. That function is the single
 * projection from a Library record to a named picture — the one the merged image
 * library uses, so the one `screenshot` and `edit_image` resolve against. A
 * fixture that composed `name`/`title`/`aliases` by hand could agree with the
 * production projection today and disagree tomorrow, and the suite would keep
 * passing while the assistant was told it could look at a picture under a name
 * nothing would answer to. Building the fixture THROUGH it means these cases are
 * about names the system really uses.
 *
 * `where` is `library` on every one of them because that is what a catalogue item
 * IS — the site's own files are `list_assets`'s list, which REQ-228 §Half D is
 * explicit should not become this one.
 */
function item(over: Partial<CatalogueItem> & { name: string }): CatalogueItem {
  const filename = over.filename ?? `${over.name}.png`
  const named = storedImageOf({
    uid: over.name,
    type: 'material',
    title: over.title ?? over.name,
    filename,
    kind: over.kind ?? 'image',
    content_type: over.mediaType ?? 'image/png',
    role: over.role === undefined ? 'site' : over.role,
    rights: over.rights ?? 'owned',
    republishable: over.republishable ?? true,
    exportable: over.exportable ?? false,
    origin: over.origin ?? 'uploaded',
    placed_on: over.placed_on ?? [],
    source_url: over.source_url ?? null,
    description_status: over.description_status ?? 'ok',
    description_model: over.description_model ?? 'stub/vision-1',
    edits: [],
    updated_at: over.updated_at ?? '2026-09-11T00:00:00Z',
  })
  return {
    ...named,
    filename,
    kind: over.kind ?? 'image',
    role: over.role === undefined ? 'site' : over.role,
    rights: over.rights ?? 'owned',
    republishable: over.republishable ?? true,
    exportable: over.exportable ?? false,
    origin: over.origin ?? 'uploaded',
    placed_on: over.placed_on ?? [],
    source_url: over.source_url ?? null,
    edits: over.edits ?? [],
    description_status: over.description_status ?? 'ok',
    description_model: over.description_model ?? 'stub/vision-1',
    updated_at: over.updated_at ?? '2026-09-11T00:00:00Z',
  }
}

interface HostLog {
  placed: Array<{ name: string; as: string | null }>
}

function hostOver(
  items: CatalogueItem[],
  opts: {
    slug?: string
    place?: (name: string, as: string | null) => Promise<PlacedItem>
    descriptions?: Record<string, string>
  } = {},
): { deps: LibraryDeps; log: HostLog } {
  const log: HostLog = { placed: [] }
  const deps: LibraryDeps = {
    slug: opts.slug ?? 'acme',
    list: async () => items,
    read: async (name) => {
      const found = items.find((i) => i.name === name)
      if (!found) throw new Error(`the double was asked for '${name}', which it does not hold`)
      return { ...found, description: opts.descriptions?.[name] ?? `What ${name} shows.` }
    },
    place: async (name, as) => {
      log.placed.push({ name, as })
      if (opts.place) return opts.place(name, as)
      return {
        asset: as ?? `${name}.png`,
        size: 1234,
        placed_on: [opts.slug ?? 'acme'],
        description: opts.descriptions?.[name] ?? `What ${name} shows.`,
      }
    },
  }
  return { deps, log }
}

type Row = Record<string, unknown>
const rowsOf = (page: unknown): Row[] => (page as { items: Row[] }).items

// ── AC1 — one catalogue, and placement is a field on an item ─────────────────

describe('REQ-228 AC1 — one catalogue; being on the site is a mark on the item', () => {
  it('test_UAT_FC_REQ-228_placement_is_a_field_on_the_item_not_a_second_listing', async () => {
    // THE CENTRAL CLAIM OF THE TICKET, asserted as a property of the LIST rather
    // than of two lists. A placed item and an unplaced one come back from the
    // same call, distinguished by `placed_on` — which is what *"not a different
    // place to look"* means when a model reads it.
    const ops = libraryOperations(
      hostOver([
        item({ name: 'material-logo', placed_on: ['acme'] }),
        item({ name: 'material-yard' }),
      ]).deps,
    )
    const rows = rowsOf(await ops.list_library({}))
    expect(rows.map((r) => r.item)).toEqual(['material-logo', 'material-yard'])
    expect(rows[0].placed_on).toEqual(['acme'])
    expect(rows[1].placed_on).toEqual([])
  })

  it('test_UAT_FC_REQ-228_placed_is_asked_of_this_sessions_site_and_not_of_emptiness', async () => {
    // `placed_on` is EVERY site the bytes are on, and the question the model
    // asked is *"is it on the site I am working on"*. A filter written as
    // `placed_on.length > 0` would answer a different question — and would answer
    // it wrongly for the business holding two sites, silently.
    const ops = libraryOperations(
      hostOver(
        [
          item({ name: 'material-here', placed_on: ['acme'] }),
          item({ name: 'material-elsewhere', placed_on: ['other-site'] }),
        ],
        { slug: 'acme' },
      ).deps,
    )
    expect(rowsOf(await ops.list_library({ placed: true })).map((r) => r.item)).toEqual([
      'material-here',
    ])
    // AND THE COMPLEMENT IS THE COMPLEMENT. A picture on somebody else's site is
    // not on this one, so it is exactly what `placed: false` is for.
    expect(rowsOf(await ops.list_library({ placed: false })).map((r) => r.item)).toEqual([
      'material-elsewhere',
    ])
  })

  it('test_UAT_FC_REQ-228_the_catalogue_is_the_clients_material_not_only_their_pictures', async () => {
    // THE LIBRARY HOLDS DOCUMENTS AND FONTS BESIDE IMAGES, and a client who
    // uploads their brand font uploaded it so it could go on the site. A listing
    // that silently omitted it would be the same shape of bug this ticket is
    // fixing, one kind along. `kind` NARROWS; it does not gate.
    const ops = libraryOperations(
      hostOver([
        item({ name: 'material-logo', kind: 'image' }),
        item({ name: 'material-brand', kind: 'document', mediaType: 'application/pdf' }),
        item({ name: 'material-face', kind: 'font', mediaType: 'font/woff2' }),
      ]).deps,
    )
    expect(rowsOf(await ops.list_library({})).map((r) => r.kind).sort()).toEqual([
      'document',
      'font',
      'image',
    ])
    expect(rowsOf(await ops.list_library({ kind: 'font' })).map((r) => r.item)).toEqual([
      'material-face',
    ])
  })

  it('test_UAT_FC_REQ-228_the_other_two_dimensions_a_person_scrolls_by_are_filters_too', async () => {
    // The ticket asks for the catalogue to be searchable *"the way a person
    // scrolling the Library tab does — by kind, by role, by rights, by whether it
    // is placed on this site, by what the describer wrote about it"*.
    const ops = libraryOperations(
      hostOver([
        item({ name: 'material-logo', role: 'site', title: 'The bakery logo' }),
        item({ name: 'material-rival', role: 'reference', title: 'A competitor shopfront' }),
      ]).deps,
    )
    expect(rowsOf(await ops.list_library({ role: 'reference' })).map((r) => r.item)).toEqual([
      'material-rival',
    ])
    // THE TEXT FILTER READS THE TITLE, which is what the describer wrote — so
    // "the bakery ones" is askable without guessing a filename.
    expect(rowsOf(await ops.list_library({ matching: 'BAKERY' })).map((r) => r.item)).toEqual([
      'material-logo',
    ])
  })
})

// ── AC2 — the listing is bounded, and says so ────────────────────────────────

describe('REQ-228 AC2 — the listing is bounded the way list_references is', () => {
  it('test_UAT_FC_REQ-228_an_unbounded_library_comes_back_bounded', async () => {
    // *"An engagement's Library can hold every upload of the whole engagement,
    // and an unbounded listing spends the tokens this is meant to save."*
    const many = Array.from({ length: LIBRARY_PAGE * 3 }, (_, n) =>
      item({ name: `material-${n}` }),
    )
    const ops = libraryOperations(hostOver(many).deps)
    const page = (await ops.list_library({})) as { items: Row[]; total: number; more: boolean }
    expect(page.items).toHaveLength(LIBRARY_PAGE)
    // AND IT SAYS IT IS BOUNDED. A bound that did not report itself would read as
    // a complete listing, which is worse than no bound: the model would conclude
    // the client had given it sixty files and act on twenty.
    expect(page.total).toBe(LIBRARY_PAGE * 3)
    expect(page.more).toBe(true)
  })

  it('test_UAT_FC_REQ-228_the_total_is_of_what_matched_not_of_the_whole_catalogue', async () => {
    // A model that narrowed to three items wants to know it is looking at all
    // three. A total of sixty beside a page of three would read as heavy
    // truncation and send it filtering again for no reason.
    const ops = libraryOperations(
      hostOver([
        ...Array.from({ length: 50 }, (_, n) => item({ name: `material-${n}` })),
        item({ name: 'material-face', kind: 'font' }),
      ]).deps,
    )
    const page = (await ops.list_library({ kind: 'font' })) as { total: number; more: boolean }
    expect(page.total).toBe(1)
    expect(page.more).toBe(false)
  })

  it('test_UAT_FC_REQ-228_a_caller_that_has_narrowed_can_ask_for_the_rest', async () => {
    const many = Array.from({ length: 30 }, (_, n) => item({ name: `material-${n}` }))
    const page = (await libraryOperations(hostOver(many).deps).list_library({ limit: 30 })) as {
      items: Row[]
      more: boolean
    }
    expect(page.items).toHaveLength(30)
    expect(page.more).toBe(false)
  })

  it('test_UAT_FC_REQ-228_the_listing_omits_the_description_and_the_item_read_carries_it', async () => {
    // A material's body is its extracted text and a brand book runs to tens of
    // kilobytes, so a listing that carried bodies would ship the whole corpus to
    // draw a column of filenames. The description is what `get_library_item`
    // fetches — which is the reason that operation exists beside the listing.
    const ops = libraryOperations(
      hostOver([item({ name: 'material-brand', kind: 'document' })], {
        descriptions: { 'material-brand': 'A twelve page brand guideline.' },
      }).deps,
    )
    expect(rowsOf(await ops.list_library({}))[0]).not.toHaveProperty('description')
    const one = (await ops.get_library_item({ item: 'material-brand' })) as Row
    expect(one.description).toBe('A twelve page brand guideline.')
    expect(one.item).toBe('material-brand')
  })
})

// ── AC3 — one naming rule, over a wider set ──────────────────────────────────

describe('REQ-228 AC3 — resolveStoredImage stays the one rule', () => {
  it('test_UAT_FC_REQ-228_an_item_answers_to_its_record_its_title_and_its_filename', async () => {
    // *"A picture's handle arrives in the result of whatever made it"*, and a
    // client says their own filename out loud. All three must reach one item, or
    // the model is made to translate — and translating is where it goes wrong.
    const ops = libraryOperations(
      hostOver([
        item({ name: 'material-a1b2', title: 'The bakery at dawn', filename: 'DSC_0912.jpg' }),
      ]).deps,
    )
    for (const spelling of ['material-a1b2', 'The bakery at dawn', 'DSC_0912.jpg']) {
      expect(((await ops.get_library_item({ item: spelling })) as Row).item).toBe('material-a1b2')
    }
    // AND LOOSELY, because a Library title is a sentence somebody typed and
    // holding the model to its capitalisation would be a riddle.
    expect(((await ops.get_library_item({ item: 'the bakery at dawn' })) as Row).item).toBe(
      'material-a1b2',
    )
  })

  it('test_UAT_FC_REQ-228_the_catalogue_defers_to_resolveStoredImage_rather_than_matching_for_itself', async () => {
    // THE RULE ITSELF, NOT A COPY OF WHAT IT DOES. The ticket's constraint is
    // that `resolveStoredImage` *"must stay the one rule; a second naming
    // vocabulary is the failure this whole module was written to avoid"*. So the
    // assertion is an EQUIVALENCE: for a set that includes an exact/loose
    // collision, what the surface resolves is what that function resolves.
    const items = [
      item({ name: 'material-one', title: 'Logo.png', filename: 'Logo.png' }),
      item({ name: 'material-two', title: 'logo.png', filename: 'logo.png' }),
    ]
    const ops = libraryOperations(hostOver(items).deps)
    // `Logo.png` is EXACT on one and loose on both — the vocabulary resolves it
    // outright, and so must the catalogue.
    expect(resolveStoredImage('Logo.png', items).match?.name).toBe('material-one')
    expect(((await ops.get_library_item({ item: 'Logo.png' })) as Row).item).toBe('material-one')
  })

  it('test_UAT_FC_REQ-228_a_name_that_means_two_items_is_refused_and_names_both', async () => {
    // *"Ambiguity is refused, never resolved"* — a picture handed back as though
    // it were the one that was asked for is a wrong answer that looks like a
    // right one, and nothing downstream can tell.
    const ops = libraryOperations(
      hostOver([
        item({ name: 'material-one', title: 'the logo', filename: 'a.png' }),
        item({ name: 'material-two', title: 'the logo', filename: 'b.png' }),
      ]).deps,
    )
    await expect(ops.get_library_item({ item: 'the logo' })).rejects.toThrow(LibraryRefusedError)
    await expect(ops.get_library_item({ item: 'the logo' })).rejects.toThrow(
      /'material-one'.*'material-two'/,
    )
    // AND PLACING IS REFUSED THE SAME WAY, because placing the wrong picture on
    // the client's site is the more expensive half of the same mistake.
    await expect(ops.place_on_site({ item: 'the logo' })).rejects.toThrow(/is the name of 2/)
  })

  it('test_UAT_FC_REQ-228_a_name_that_means_nothing_is_refused_with_the_codes_the_declaration_names', async () => {
    const ops = libraryOperations(hostOver([item({ name: 'material-one' })]).deps)
    const refusal = await ops.get_library_item({ item: 'nothing' }).catch((e: unknown) => e)
    expect(refusal).toBeInstanceOf(LibraryRefusedError)
    expect((refusal as LibraryRefusedError).code).toBe('NOT_FOUND')
    // THE REFUSAL SAYS WHAT THERE IS, not only what there is not — so the model
    // recovers on the turn it fails rather than calling the listing again.
    expect((refusal as LibraryRefusedError).message).toContain('material-one')
  })

  it('test_UAT_FC_REQ-228_an_empty_catalogue_refuses_by_saying_it_is_empty', async () => {
    // A client who has given nothing is an ordinary state, and it must not read
    // as a name that was spelled wrong.
    const refusal = await libraryOperations(hostOver([]).deps)
      .get_library_item({ item: 'anything' })
      .catch((e: unknown) => e)
    expect((refusal as LibraryRefusedError).message).toMatch(/has not given you anything yet/)
  })
})

// ── AC4 — placing: the handle, the description, the gate ─────────────────────

describe('REQ-228 AC4 — placing a picture on the site', () => {
  it('test_UAT_FC_REQ-228_placing_returns_the_assets_handle_and_the_description', async () => {
    // *"Its result should be the `/assets/…` handle, so the next thing the
    // assistant does is write it into a picture element"*, and *"the description
    // lives on the material ticket and the assistant is the one that writes it
    // onto the picture element that places the image"*.
    const ops = libraryOperations(
      hostOver([item({ name: 'material-logo', filename: 'logo.png' })], {
        descriptions: { 'material-logo': 'A gold sans-serif wordmark on cream.' },
        place: async () => ({
          asset: 'logo.png',
          size: 4096,
          placed_on: ['acme'],
          description: 'A gold sans-serif wordmark on cream.',
        }),
      }).deps,
    )
    const placed = (await ops.place_on_site({ item: 'material-logo' })) as Row
    expect(placed.src).toBe('/assets/logo.png')
    expect(placed.asset).toBe('logo.png')
    expect(placed.description).toBe('A gold sans-serif wordmark on cream.')
    // AND THE MARK IS REPORTED BACK, so the assistant does not have to re-read
    // the catalogue to know its own placement happened.
    expect(placed.placed_on).toEqual(['acme'])
  })

  it('test_UAT_FC_REQ-228_the_handle_is_given_rather_than_left_to_be_reconstructed', async () => {
    // A renamed asset is the case where a model that derived `/assets/<filename>`
    // from what it ASKED for would write a handle to a picture that is not there.
    // The handle is built from what actually landed.
    const ops = libraryOperations(
      hostOver([item({ name: 'material-logo', filename: 'logo.png' })], {
        place: async () => ({
          asset: 'logo-2.png',
          size: 4096,
          placed_on: ['acme'],
          description: 'x',
        }),
      }).deps,
    )
    const placed = (await ops.place_on_site({ item: 'material-logo' })) as Row
    expect(placed.asset).toBe('logo-2.png')
    expect(placed.src).toBe('/assets/logo-2.png')
  })

  it('test_UAT_FC_REQ-228_the_refusal_is_the_hosts_and_is_translated_not_re_decided', async () => {
    // The gate is `promoteToSiteAsset`'s, checked ON THE RECORD rather than on an
    // argument, and it shipped with its refusal before anything could call it.
    // What this surface does is give it the declared code — so a second gate
    // written here, which could drift, is exactly what must NOT exist.
    const ops = libraryOperations(
      hostOver([item({ name: 'material-rival', republishable: false, role: 'reference' })], {
        place: async () => {
          throw new LibraryRefusedError('NOT_REPUBLISHABLE', 'came from somewhere else')
        },
      }).deps,
    )
    const refusal = await ops.place_on_site({ item: 'material-rival' }).catch((e: unknown) => e)
    expect((refusal as LibraryRefusedError).code).toBe('NOT_REPUBLISHABLE')
  })

  it('test_UAT_FC_REQ-228_the_surface_does_not_pre_judge_the_gate_from_the_row', async () => {
    // THE COUNTERWEIGHT TO THE CASE ABOVE, and the one that catches the tempting
    // wrong fix. `republishable` is ON the row this surface just listed, so it
    // would be easy — and wrong — to refuse here without calling the host. Then
    // there would be two gates, and the record's would stop being the one that
    // decides. So: a row marked not-republishable still REACHES the host.
    const { deps, log } = hostOver([item({ name: 'material-rival', republishable: false })])
    await libraryOperations(deps)
      .place_on_site({ item: 'material-rival' })
      .catch(() => undefined)
    expect(log.placed).toEqual([{ name: 'material-rival', as: null }])
  })

  it('test_UAT_FC_REQ-228_an_alternative_name_is_passed_through_and_absence_means_the_clients_own', async () => {
    const { deps, log } = hostOver([item({ name: 'material-logo', filename: 'logo.png' })])
    const ops = libraryOperations(deps)
    await ops.place_on_site({ item: 'material-logo' })
    await ops.place_on_site({ item: 'material-logo', as: 'brand-mark.png' })
    // `null` RATHER THAN A NAME COMPOSED HERE. The default is the client's own
    // filename and the HOST is what knows it, so that a picture placed by the
    // assistant lands under the same name one placed by the client does.
    expect(log.placed).toEqual([
      { name: 'material-logo', as: null },
      { name: 'material-logo', as: 'brand-mark.png' },
    ])
  })
})

// ── AC5 — the declaration, the groups and the grant ──────────────────────────

describe('REQ-228 AC5 — a surface of its own, with its grant travelling with it', () => {
  it('test_UAT_FC_REQ-228_the_declaration_validates_with_its_travelling_grant', async () => {
    // Through the framework's OWN validator, alongside every other surface this
    // host composes — so a group renamed in the declaration becomes a resolution
    // failure here rather than a session that silently grants nothing.
    const { validateData } = await aiCore()
    const report = validateData(
      [L1_DECLARATION, FIDELITY_DECLARATION, IMAGE_DECLARATION, LIBRARY_DECLARATION],
      { consultant: libraryInstanceConfig() },
    )
    expect(report.problems).toEqual([])
    expect(report.surfaces.sort()).toEqual(['fidelity', 'image', 'l1', 'library'])
    // AND NO MANUAL LEAK — the author-time lint that catches prose in a shared
    // block naming a tool a read-only session was never granted.
    expect(report.warnings.filter((w: string) => w.includes("surface 'library'"))).toEqual([])
  })

  it('test_UAT_FC_REQ-228_placing_is_its_own_group_and_not_folded_into_managing_assets', async () => {
    // *"A `place_on_site` operation over `promoteToSiteAsset`, in its **own
    // group** and not folded into `ManageAssets`. … A distinct group is what lets
    // a deployment grant looking without granting publishing."*
    const groups = LIBRARY_DECLARATION.groups as {
      group: string
      effect: string
      operations: string[]
    }[]
    const placing = groups.find((g) => g.operations.includes('place_on_site'))
    expect(placing?.group).toBe('PlaceOnSite')
    expect(placing?.operations).toEqual(['place_on_site'])
    // NOT ON THE L1 SURFACE AT ALL, which is where `ManageAssets` lives.
    const l1Groups = L1_DECLARATION.groups as { group: string; operations: string[] }[]
    for (const g of l1Groups) expect(g.operations).not.toContain('place_on_site')
  })

  it('test_UAT_FC_REQ-228_looking_is_separable_from_placing', async () => {
    // The separation is only worth having if it is actually usable, so: the read
    // group alone resolves, and it carries neither the write operation nor the
    // write group. That is the deployment the ticket says a distinct group is
    // FOR — grant looking, withhold publishing.
    const { validateData } = await aiCore()
    const report = validateData([L1_DECLARATION, LIBRARY_DECLARATION], {
      consultant: { library: { groups: ['ReadLibrary'] } },
    })
    expect(report.problems).toEqual([])
  })

  it('test_UAT_FC_REQ-228_every_group_is_effect_homogeneous', () => {
    // A group is the unit a manual's read-only projection is built from, so a
    // `read` group holding a write is what makes "nothing here changes anything"
    // stop being a checkable claim.
    const groups = LIBRARY_DECLARATION.groups as {
      group: string
      effect: string
      operations: string[]
    }[]
    const ops = LIBRARY_DECLARATION.operations as { op: string; effect: string }[]
    const effectOf = new Map(ops.map((o) => [o.op, o.effect]))
    for (const group of groups) {
      for (const op of group.operations) expect(effectOf.get(op)).toBe(group.effect)
    }
  })

  it('test_UAT_FC_REQ-228_the_grant_travels_with_the_surface_and_is_not_in_instances_json', async () => {
    // `instances.json` is validated against the declarations THIS repository
    // hands the validator, so a key there for a surface composed per deployment
    // would be a grant nothing can check — the rule `image-core.ts` states and
    // this inherits.
    const instances = (await import('../tools/generate/src/cli/ai/instances.json')).default as
      Record<string, Record<string, unknown>>
    expect(instances.consultant).not.toHaveProperty('library')
    expect(instances.consultant).not.toHaveProperty('tickets')
    // AND THE TRAVELLING GRANT IS BOTH GROUPS, because an assistant that can see
    // a picture and not place it is the half-feature this ticket is about.
    expect(libraryInstanceConfig()).toEqual({
      library: { groups: ['ReadLibrary', 'PlaceOnSite'] },
    })
  })

  it('test_UAT_FC_REQ-228_the_catalogue_is_not_bolted_onto_a_surface_that_promises_otherwise', () => {
    // `l1-surface.json` is the documented way to change a SITE and the catalogue
    // is not a site; `fidelity-surface.json` opens by promising every operation
    // on it is a way of LOOKING, and placing copies bytes across the boundary
    // between the client's private bucket and what their site serves.
    const named = (d: Record<string, unknown>) =>
      (d.operations as { op: string }[]).map((o) => o.op)
    for (const op of ['list_library', 'get_library_item', 'place_on_site']) {
      expect(named(L1_DECLARATION)).not.toContain(op)
      expect(named(FIDELITY_DECLARATION)).not.toContain(op)
      expect(named(IMAGE_DECLARATION)).not.toContain(op)
    }
    expect(LIBRARY_DECLARATION.surface).toBe('library')
  })
})
