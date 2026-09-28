import { describe, expect, it } from 'vitest'
import {
  BUILDER_ROLE,
  CONSULTANT_ROLE,
  DELEGATION_METHOD_PROVIDER,
  delegationMethod,
  registerSiteProviders,
} from '../tools/generate/src/cli/ai/roles'
import {
  DelegationConfigError,
  delegationDocument,
  delegationFromMapping,
} from '../tools/generate/src/cli/ai/delegation'
import {
  L1_DECLARATION,
  L1_INSTANCES,
  readOnlyGrant,
} from '../tools/generate/src/cli/ai/toolbox-core'
import { FIDELITY_DECLARATION } from '../tools/generate/src/cli/ai/fidelity-core'
import { aiCore } from '../tools/generate/src/cli/ai/toolbox'
import primingDocument from '../tools/generate/src/cli/ai/priming.json'

/** The AI library is untyped JavaScript; the boundary is here, as it is in the host. */
type Untyped = any // eslint-disable-line @typescript-eslint/no-explicit-any

/**
 * [[REQ-343]] — **the consultant stops writing L1, as one deploy-time key**.
 *
 * The half of the ticket that is decided by DOCUMENTS rather than by a turn. The
 * sibling `.workers` suite drives the real route inside workerd and proves what
 * reaches the wire; everything here is what the deployment IS before a model is
 * involved — the key and its refusals, the derivation that decides which groups
 * go, and the framing the prose swaps.
 *
 * NOTHING ABOUT THE SURFACE IS RESTATED. Which groups are writes is read back out
 * of the declarations, so a group added upstream moves these cases rather than
 * leaving them asserting against a constant that holds last month's answer. That
 * is the same property the code under test has, and it is the reason to test it
 * this way round: a test with its own list of write groups would agree with a
 * narrowing that had fallen behind the surface.
 */

/** Group names the declarations call a WRITE, which are the ones a narrowed grant loses. */
function writeGroups(declaration: Record<string, unknown>): string[] {
  const groups = (declaration.groups ?? []) as Array<{ group: string; effect: string }>
  return groups.filter((entry) => entry.effect === 'write').map((entry) => entry.group)
}

/** Group names the declarations call a READ, which are the ones it keeps. */
function readGroups(declaration: Record<string, unknown>): string[] {
  const groups = (declaration.groups ?? []) as Array<{ group: string; effect: string }>
  return groups.filter((entry) => entry.effect === 'read').map((entry) => entry.group)
}

const DECLARATIONS = [L1_DECLARATION, FIDELITY_DECLARATION]

/** The consultant's grant as `instances.json` states it — its MAXIMUM authority. */
const CONSULTANT_GRANT = L1_INSTANCES[CONSULTANT_ROLE] as Record<
  string,
  { groups: string[] }
>

// ── the key ──────────────────────────────────────────────────────────────────

describe('REQ-343 — the narrowing is a deploy-time key and flipping it back is one edit', () => {
  it('test_UAT_FC_REQ-343_the_shipped_document_ships_the_narrowing_and_states_it', () => {
    // "`false` is this ticket's end state and IS WHAT SHIPS." Stated rather than
    // left to the absent-key default, so an operator reads the value where the
    // rest of the deployment's settings are instead of deriving it from code.
    expect(delegationDocument).toHaveProperty('primary_writes', false)
    expect(delegationFromMapping(delegationDocument).primaryWrites).toBe(false)
    // And it ships BESIDE a switch that is still on: the narrowing only means
    // anything where there is a worker to commission.
    expect(delegationFromMapping(delegationDocument).enabled).toBe(true)
  })

  it('test_UAT_FC_REQ-343_absent_reads_as_false_and_true_is_the_flip_back', () => {
    // "Absent means `false` — the design rather than the state the design
    // replaced." A replacement document that says nothing gets the design.
    const silent = delegationFromMapping({ enabled: true, workers: {} })
    expect(silent.primaryWrites).toBe(false)
    // AND `true` IS THE FLIP-BACK, which is the whole reason this is a key: "a
    // deployment that goes wrong is recovered by restoring the key and
    // redeploying — not by reverting a merge."
    expect(delegationFromMapping({ ...delegationDocument, primary_writes: true }).primaryWrites).toBe(
      true,
    )
    expect(
      delegationFromMapping({ ...delegationDocument, primary_writes: false }).primaryWrites,
    ).toBe(false)
  })

  it('test_UAT_FC_REQ-343_a_primary_writes_that_is_not_a_boolean_is_refused_by_name', () => {
    // "Present and not a boolean is a start-up refusal naming the key, as
    // `enabled` already is." A `"false"` that read as truthy would silently hand
    // the consultant's hands back and go on paying $0.54 an element write.
    for (const bad of ['false', 'true', 0, 1, null, {}]) {
      expect(() =>
        delegationFromMapping({ ...delegationDocument, primary_writes: bad }),
      ).toThrow(DelegationConfigError)
      expect(() => delegationFromMapping({ ...delegationDocument, primary_writes: bad })).toThrow(
        /primary_writes/,
      )
    }
  })
})

// ── which groups go ──────────────────────────────────────────────────────────

describe('REQ-343 — the withheld groups are derived from the declaration, not listed', () => {
  it('test_UAT_FC_REQ-343_the_consultant_keeps_every_read_and_holds_no_write_group', () => {
    // BEHAVIOUR 1. "It keeps every read, every measurement and every camera; it
    // loses the authority to replace an element, author a page, write
    // configuration or change the palette."
    const narrowed = readOnlyGrant(CONSULTANT_GRANT, DECLARATIONS) as Record<
      string,
      { groups: string[] }
    >
    for (const declaration of DECLARATIONS) {
      const surface = String(declaration.surface)
      const granted = CONSULTANT_GRANT[surface]?.groups ?? []
      for (const group of writeGroups(declaration)) {
        expect(narrowed[surface].groups).not.toContain(group)
      }
      // Every read it was granted survives — the narrowing takes writes and
      // nothing else. Reading the whole site is the half it keeps.
      for (const group of readGroups(declaration)) {
        if (granted.includes(group)) expect(narrowed[surface].groups).toContain(group)
      }
    }
    // Named once, because the ticket names them: reading the site, measuring a
    // drawing, and the camera.
    expect(narrowed.l1.groups).toContain('ReadSite')
    expect(narrowed.l1.groups).toContain('MeasureDrawings')
    expect(narrowed.fidelity.groups).toContain('SeeSite')
    expect(narrowed.l1.groups).not.toContain('AuthorPages')
    expect(narrowed.l1.groups).not.toContain('ManagePages')
    expect(narrowed.l1.groups).not.toContain('WriteConfig')
    expect(narrowed.l1.groups).not.toContain('ManagePalette')
  })

  it('test_UAT_FC_REQ-343_drawing_an_image_becomes_a_workers_job', () => {
    // THE CONSEQUENCE THE TICKET NAMES. `write_image` is declared `effect:
    // "write"`, so the derivation withholds it rather than carrying an exception
    // list — and the builder holds the group already, so the capability moves
    // rather than disappearing.
    const narrowed = readOnlyGrant(CONSULTANT_GRANT, DECLARATIONS) as Record<
      string,
      { groups: string[] }
    >
    expect(CONSULTANT_GRANT.l1.groups).toContain('DrawImages')
    expect(narrowed.l1.groups).not.toContain('DrawImages')
    expect((L1_INSTANCES[BUILDER_ROLE] as { l1: { groups: string[] } }).l1.groups).toContain(
      'DrawImages',
    )
  })

  it('test_UAT_FC_REQ-343_a_write_group_added_to_the_surface_later_is_withheld_with_no_edit', () => {
    // "A write group added later is withheld without an edit." The failure this
    // prevents is the hand-written inventory: a list of the consultant's write
    // groups is precisely the text that still describes last month's surface, and
    // it fails in the expensive direction — a group missing from it stays granted.
    const invented = {
      ...L1_DECLARATION,
      groups: [
        ...(L1_DECLARATION.groups as unknown[]),
        { group: 'RewriteEverything', effect: 'write', operations: [] },
      ],
    }
    const grant = { l1: { groups: [...CONSULTANT_GRANT.l1.groups, 'RewriteEverything'] } }
    const narrowed = readOnlyGrant(grant, [invented, FIDELITY_DECLARATION]) as Record<
      string,
      { groups: string[] }
    >
    expect(narrowed.l1.groups).not.toContain('RewriteEverything')
  })

  it('test_UAT_FC_REQ-343_the_narrowing_only_ever_removes_and_instances_json_is_left_alone', () => {
    // ONE-DIRECTIONAL, like the surface narrowing it sits beside: no arrangement
    // of declarations can widen a grant through it. A read group the consultant
    // was never granted does not arrive.
    const grant = { l1: { groups: ['ReadSite'] } }
    const narrowed = readOnlyGrant(grant, DECLARATIONS) as Record<string, { groups: string[] }>
    expect(narrowed.l1.groups).toEqual(['ReadSite'])
    expect(narrowed.l1.groups).not.toContain('MeasureDrawings')
    // AND THE DOCUMENT IS UNTOUCHED, which is what makes the rollback restore the
    // right thing: `instances.json` goes on stating the maximum authority the key
    // hands back, so nothing has to remember what was taken away.
    const stated = [...CONSULTANT_GRANT.l1.groups]
    readOnlyGrant(CONSULTANT_GRANT, DECLARATIONS)
    expect(CONSULTANT_GRANT.l1.groups).toEqual(stated)
    expect(stated).toContain('AuthorPages')
  })

  it('test_UAT_FC_REQ-343_a_surface_nobody_declared_is_a_start_up_failure_naming_it', () => {
    // The only safe direction. Passing an undeclared surface through would leave
    // its groups granted — which on this path means granting WRITES because a
    // declaration was missing.
    expect(() => readOnlyGrant({ ledger: { groups: ['Everything'] } }, DECLARATIONS)).toThrow(
      /ledger/,
    )
    // AND SO IS A SCOPE THIS CANNOT READ, for the same reason: keeping an
    // unfamiliar axis whole is keeping whatever authority it carried. Every grant
    // this is applied to is group-scoped; a surface scoped by document or by
    // operation does not belong in the document it narrows.
    expect(() => readOnlyGrant({ l1: { documents: ['all'] } }, DECLARATIONS)).toThrow(/l1/)
  })

  it('test_UAT_FC_REQ-343_only_the_consultant_narrows', () => {
    // "The worker's own grant is untouched." A role that does not delegate has
    // nothing to commission with, and the builder is the role construction now
    // arrives at.
    const builder = L1_INSTANCES[BUILDER_ROLE] as { l1: { groups: string[] } }
    for (const group of ['AuthorPages', 'ManagePages', 'ManageComponents', 'WriteConfig', 'ManagePalette'])
      expect(builder.l1.groups).toContain(group)
  })
})

// ── the prose that goes with it ───────────────────────────────────────────────

describe('REQ-343 — a session that cannot write is not told to weigh a choice', () => {
  const bind = async (delegating: boolean, writing: boolean): Promise<Untyped> => {
    const lib = await aiCore()
    const providers = new lib.PrimingProviders()
    registerSiteProviders(providers, {
      slug: 'req343-fixture',
      box: { manual: async () => '## Your tools' },
      signal: () => undefined,
      delegating,
      writing,
    })
    return providers
  }

  it('test_UAT_FC_REQ-343_the_method_prose_describes_commissioning_where_the_consultant_cannot_write', async () => {
    // BEHAVIOUR 2. "Its method prose says so: a deployment where it cannot write
    // must not be told to weigh handing work over against doing it itself,
    // because there is nothing to weigh."
    const rendered = await (await bind(true, false)).get(DELEGATION_METHOD_PROVIDER)({})
    const templates = primingDocument.templates as Record<string, string>
    expect(rendered).toBe(
      templates['delegation-method'].replace(
        '{framing}',
        templates['delegation-method-commissioning'],
      ),
    )
    // The framing that would be false is GONE, not merely outweighed: prose
    // telling a session to do the work itself is an instruction it cannot follow.
    expect(rendered).not.toContain('do it yourself')
    expect(rendered).not.toContain('Keep for yourself')
    // …and the shared body is still there. How to write a brief and what to ask
    // to have checked are true either way, which is why they are stated once.
    expect(rendered).toMatch(/Write the brief/)
    expect(rendered).toMatch(/believe them/i)
  })

  it('test_UAT_FC_REQ-343_the_flip_back_restores_the_framing_with_the_grant', async () => {
    // Where `primary_writes: true` puts the consultant's hands back, the prose
    // goes back with them — a session that HAS the choice is told how to make it.
    const rendered = await (await bind(true, true)).get(DELEGATION_METHOD_PROVIDER)({})
    const templates = primingDocument.templates as Record<string, string>
    expect(rendered).toBe(
      templates['delegation-method'].replace('{framing}', templates['delegation-method-choosing']),
    )
    expect(rendered).toContain('do it yourself')
  })

  it('test_UAT_FC_REQ-343_with_delegation_off_there_is_no_framing_to_choose', async () => {
    // BEHAVIOUR 3, in the prose. Off drops the entry and its separator whichever
    // way the second key is set, because there is no tool for prose to describe.
    expect(await (await bind(false, false)).get(DELEGATION_METHOD_PROVIDER)({})).toBeNull()
    expect(await (await bind(false, true)).get(DELEGATION_METHOD_PROVIDER)({})).toBeNull()
    expect(delegationMethod(false, false)).toBeNull()
  })

  it('test_UAT_FC_REQ-343_the_two_framings_share_one_body', () => {
    // Two whole copies of the method was the alternative, and the copy nobody
    // deployed is the copy that still describes last month's method. So the body
    // is one template with a slot, and each framing is only the paragraph that
    // differs.
    const templates = primingDocument.templates as Record<string, string>
    expect(templates['delegation-method']).toContain('{framing}')
    for (const framing of ['delegation-method-choosing', 'delegation-method-commissioning'])
      expect(templates[framing]).not.toContain('Write the brief')
  })
})
