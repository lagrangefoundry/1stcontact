import { describe, expect, it } from 'vitest'
import {
  SETTINGS_DECLARATION,
  SETTINGS_SURFACE,
  SettingsRefusedError,
  settingsInstanceConfig,
  settingsOperations,
  type RenamedBusiness,
  type SettingsDeps,
} from '../tools/generate/src/cli/ai/settings-core'
import { L1_DECLARATION } from '../tools/generate/src/cli/ai/toolbox-core'
import { LIBRARY_DECLARATION } from '../tools/generate/src/cli/ai/library-core'
import { libraryInstanceConfig } from '../tools/generate/src/cli/ai/library-core'
import { aiCore } from '../tools/generate/src/cli/ai/toolbox'

/**
 * REQ-237 — **the settings surface: the business's record, as the assistant
 * reads and changes it.**
 *
 * WHAT IS REAL HERE AND WHAT IS NOT. The declaration is the shipped one, checked
 * by the framework's OWN validator with the grant the surface actually carries.
 * The operations are the production operations. ONE THING IS A DOUBLE:
 * {@link SettingsDeps}, the host — which is the division the surface is built on,
 * and the sibling `.workers` suite drives the real one against real D1.
 *
 * THE CLAIMS:
 *
 *  1. THE OPERATIONS ARE DECLARED WHERE THEY LIVE. `roles.ts`'s rule — the tool
 *     manual is projected from the declaration, and a hand-written inventory
 *     *"is worse than no inventory because the model believes it"* — so the
 *     overview, the parameter descriptions and the refusals are all in the
 *     declaration and validate with it.
 *  2. A RENAME REPORTS ITS EFFECTS AND DOES NOT ANSWER A BOOLEAN.
 *  3. THE REFUSALS ARE THE HOST'S, RE-CODED AND NOT RE-DECIDED — except the one
 *     the host could not answer.
 *  4. IT IS A SURFACE OF ITS OWN, not bolted onto the surface that promises to be
 *     the documented way to change a SITE.
 *  5. THE PROSE SAYS WHICH NAME IS WHICH. The business's name and the public
 *     hostname sit on the same tab with opposite lifecycles, and the settings
 *     assistant has to be able to tell a client them apart.
 */

// ── the doubled host ─────────────────────────────────────────────────────────

const RENAMED: RenamedBusiness = {
  businessId: 'biz_9f3a',
  name: 'Cole’s Bakery',
  previousName: 'Unnamed business',
  effects: {
    siteKey: 'site_4b21',
    siteName: 'Unnamed business',
    siteNameDiffers: true,
    pagesNamingPreviousName: ['home.json', 'about.json'],
  },
}

function hostOver(
  over: Partial<SettingsDeps> = {},
): { deps: SettingsDeps; log: { renamed: string[] } } {
  const log = { renamed: [] as string[] }
  return {
    log,
    deps: {
      read: async () => ({ businessId: RENAMED.businessId, name: RENAMED.previousName }),
      rename: async (name: string) => {
        log.renamed.push(name)
        return { ...RENAMED, name }
      },
      ...over,
    },
  }
}

// ── AC1 — the declaration, its groups and its travelling grant ───────────────

describe('REQ-237 AC1 — the operations are declared where they live', () => {
  it('test_UAT_FC_REQ-237_the_declaration_validates_with_its_travelling_grant', async () => {
    // Through the framework's OWN validator, alongside the surfaces this project
    // already composes — so a group renamed in the declaration becomes a
    // resolution failure here rather than a session that silently grants nothing.
    const { validateData } = await aiCore()
    const report = validateData([L1_DECLARATION, LIBRARY_DECLARATION, SETTINGS_DECLARATION], {
      consultant: { ...libraryInstanceConfig(), ...settingsInstanceConfig() },
    })
    expect(report.problems).toEqual([])
    expect(report.surfaces.sort()).toEqual(['l1', 'library', 'settings'])
    expect(report.warnings.filter((w: string) => w.includes("surface 'settings'"))).toEqual([])
  })

  it('test_UAT_FC_REQ-237_reading_the_name_is_separable_from_changing_it', async () => {
    // The separation is only worth having if it is usable, so: the read group
    // alone resolves. That is the deployment a distinct group is FOR — a session
    // that should know the business's name in order to write it into page copy is
    // not thereby a session that may change the record.
    const { validateData } = await aiCore()
    const report = validateData([L1_DECLARATION, SETTINGS_DECLARATION], {
      consultant: { settings: { groups: ['ReadBusiness'] } },
    })
    expect(report.problems).toEqual([])
  })

  it('test_UAT_FC_REQ-237_every_group_is_effect_homogeneous', () => {
    const groups = SETTINGS_DECLARATION.groups as {
      group: string
      effect: string
      operations: string[]
    }[]
    const ops = SETTINGS_DECLARATION.operations as { op: string; effect: string }[]
    const effectOf = new Map(ops.map((o) => [o.op, o.effect]))
    for (const group of groups) {
      for (const op of group.operations) expect(effectOf.get(op)).toBe(group.effect)
    }
  })

  it('test_UAT_FC_REQ-237_the_grant_travels_with_the_surface_and_is_not_in_instances_json', async () => {
    // `instances.json` is validated against the declarations THIS repository
    // hands the validator, so a key there for a surface composed per deployment
    // would be a grant nothing can check.
    const instances = (await import('../tools/generate/src/cli/ai/instances.json'))
      .default as Record<string, Record<string, unknown>>
    expect(instances.consultant).not.toHaveProperty(SETTINGS_SURFACE)
    // THE TWO THIS TICKET GRANTS, and `arrayContaining` rather than equality
    // because [[REQ-238]] added the address groups to the same travelling grant.
    // What REQ-237 claims is that ITS groups travel with the surface and appear
    // nowhere in `instances.json`; it claims nothing about being the only ticket
    // ever to put a group here.
    expect(
      (settingsInstanceConfig()[SETTINGS_SURFACE] as { groups: string[] }).groups,
    ).toEqual(expect.arrayContaining(['ReadBusiness', 'RenameBusiness']))
  })
})

// ── AC2 — a rename reports its effects ───────────────────────────────────────

describe('REQ-237 AC2 — a rename reports what it left out of date', () => {
  it('test_UAT_FC_REQ-237_the_rename_hands_back_the_offers_rather_than_a_boolean', async () => {
    // EVERY LINE IS AN OFFER AND NONE OF IT IS AN ACTION. This is the whole of how
    // a change that deliberately propagates to nothing stays safe.
    const { deps, log } = hostOver()

    const result = (await settingsOperations(deps).rename_business({
      name: 'Cole’s Bakery',
    })) as Record<string, unknown>

    expect(log.renamed).toEqual(['Cole’s Bakery'])
    expect(result.name).toBe('Cole’s Bakery')
    expect(result.previous_name).toBe('Unnamed business')
    expect(result.effects).toEqual({
      site: 'site_4b21',
      // WHAT THE SITE SAYS, unchanged, under a key that says so — `site_says`
      // rather than `business_name`, because a model reading the second one back
      // would have every reason to think the rename had written it.
      site_says: 'Unnamed business',
      site_is_out_of_date: true,
      pages_naming_the_old_name: ['home.json', 'about.json'],
    })
  })

  it('test_UAT_FC_REQ-237_the_typed_name_reaches_the_host_trimmed_and_otherwise_untouched', async () => {
    const { deps, log } = hostOver()
    await settingsOperations(deps).rename_business({ name: '  Cole’s Bakery  ' })
    expect(log.renamed).toEqual(['Cole’s Bakery'])
  })

  it('test_UAT_FC_REQ-237_reading_the_record_names_the_business_by_its_key', async () => {
    const { deps } = hostOver()
    expect(await settingsOperations(deps).read_business({})).toEqual({
      business: 'biz_9f3a',
      name: 'Unnamed business',
    })
  })
})

// ── AC3 — the refusals ───────────────────────────────────────────────────────

describe('REQ-237 AC3 — the refusals are declared, and mostly the host’s', () => {
  it('test_UAT_FC_REQ-237_an_empty_name_never_reaches_the_host', async () => {
    // A PROPERTY OF THE CALL, NOT OF THE RECORD. A name made only of whitespace
    // cannot collide with anything, so there is no host answer worth waiting for.
    const { deps, log } = hostOver()
    const refused = await settingsOperations(deps)
      .rename_business({ name: '   ' })
      .catch((error: unknown) => error)
    expect(refused).toBeInstanceOf(SettingsRefusedError)
    expect((refused as SettingsRefusedError).code).toBe('NAME_EMPTY')
    expect(log.renamed).toEqual([])
  })

  it('test_UAT_FC_REQ-237_a_conversation_with_no_business_is_refused_with_the_declared_code', async () => {
    const { deps } = hostOver({ read: async () => null })
    for (const op of ['read_business', 'rename_business']) {
      const refused = await settingsOperations(deps)
        [op]({ name: 'Anything' })
        .catch((error: unknown) => error)
      expect((refused as SettingsRefusedError).code).toBe('NO_BUSINESS')
    }
  })

  it('test_UAT_FC_REQ-237_the_surface_does_not_pre_judge_a_collision_from_what_it_read', async () => {
    // THE COUNTERWEIGHT. Whether a name is free is decided over the OWNING
    // ACCOUNT, which this surface cannot see — so a name that looks taken from
    // here still reaches the host, and the host's refusal is the one that
    // decides. Two gates would mean the record's stopped being the one that does.
    const { deps, log } = hostOver()
    await settingsOperations(deps)
      .rename_business({ name: 'Unnamed business' })
      .catch(() => undefined)
    expect(log.renamed).toEqual(['Unnamed business'])
  })

  it('test_UAT_FC_REQ-237_every_error_an_operation_names_is_declared', () => {
    const declared = Object.keys(SETTINGS_DECLARATION.errors as Record<string, unknown>)
    for (const op of SETTINGS_DECLARATION.operations as { errors?: string[] }[]) {
      for (const code of op.errors ?? []) expect(declared).toContain(code)
    }
  })
})

// ── AC4/AC5 — its own surface, and prose that tells the two names apart ──────

describe('REQ-237 AC4 — a surface of its own, saying which name is which', () => {
  it('test_UAT_FC_REQ-237_the_business_record_is_not_bolted_onto_the_site_surface', () => {
    // `l1-surface.json` is the documented way to change a SITE, and a business is
    // not a site — it is the thing the site belongs to, and it has a name whether
    // or not any site exists.
    const named = (d: Record<string, unknown>) =>
      (d.operations as { op: string }[]).map((o) => o.op)
    for (const op of ['read_business', 'rename_business']) {
      expect(named(L1_DECLARATION)).not.toContain(op)
      expect(named(LIBRARY_DECLARATION)).not.toContain(op)
    }
    // ON THIS SURFACE AND ON NO OTHER. `arrayContaining` since [[REQ-238]] put
    // the public address on the same declaration — which is the same claim, not
    // a weakening of it: the business's record is here, and the site surfaces do
    // not have it.
    expect(named(SETTINGS_DECLARATION)).toEqual(
      expect.arrayContaining(['read_business', 'rename_business']),
    )
  })

  it('test_UAT_FC_REQ-237_the_overview_separates_the_record_from_what_the_site_says', () => {
    // THE CONFUSION THIS TICKET EXISTS TO END, stated where the model will read
    // it: `tenants.name` is what the business IS CALLED, `config.businessName` is
    // what the SITE SAYS, and they are allowed to differ.
    const overview = SETTINGS_DECLARATION.overview as string
    expect(overview).toContain('config.businessName')
    expect(overview).toMatch(/allowed to differ/i)
    // AND THAT A RENAME IS NOT A PUBLISH AND NOT AN EDIT.
    expect(overview).toMatch(/does not publish/i)
  })

  it('test_UAT_FC_REQ-237_the_prose_distinguishes_this_name_from_the_public_address', () => {
    // The two names sit on the same tab and have opposite lifecycles: this one is
    // internal and free to change, the hostname is global, first-come and final.
    // A settings assistant that cannot say which is which will eventually let
    // somebody change the wrong one.
    const overview = SETTINGS_DECLARATION.overview as string
    expect(overview).toMatch(/final/i)
    // THE ADDRESS IS ON THIS SURFACE NOW ([[REQ-238]]) AND THE DISTINCTION IS
    // SHARPER FOR IT, not softer: what used to be declared as an absence is
    // declared as an absence of CHANGE. The name may be changed whenever they
    // like; the hostname may not be changed at all, by anybody.
    const absences = SETTINGS_DECLARATION.absences as { name: string; note: string }[]
    expect(absences.map((a) => a.name)).toContain('Changing or releasing a hostname')
  })

  it('test_UAT_FC_REQ-237_the_surface_declares_that_it_edits_no_site_and_publishes_nothing', () => {
    const absences = SETTINGS_DECLARATION.absences as { name: string; note: string }[]
    expect(absences.map((a) => a.name)).toEqual(
      expect.arrayContaining(['Changing what the site says', 'Publishing']),
    )
  })
})
