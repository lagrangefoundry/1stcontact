import { describe, expect, it } from 'vitest'
import {
  BUILDER_ROLE,
  BUILDER_ROLE_ENTRY,
  BUILDER_MANUAL_PROVIDER,
  CONSULTANT_ROLE,
  DELEGATION_METHOD_PROVIDER,
  PRODUCT_ENTRY,
  ROLE_ENTRY,
  SETTINGS_ROLE_ENTRY,
  builderRole,
  primingConfig,
  primingText,
  delegationMethod,
  registerBuilderProviders,
  registerSiteProviders,
} from '../tools/generate/src/cli/ai/roles'
import {
  DelegationConfigError,
  configureDelegation,
  delegationDocument,
  delegationFor,
  delegationFromMapping,
} from '../tools/generate/src/cli/ai/delegation'
import { backendsDocument } from '../tools/generate/src/cli/ai/backends'
import { ratesFor } from '../tools/generate/src/cli/ai/spend-core'
import { L1_DECLARATION, L1_INSTANCES } from '../tools/generate/src/cli/ai/toolbox-core'
import { FIDELITY_DECLARATION } from '../tools/generate/src/cli/ai/fidelity-core'
import { aiCore } from '../tools/generate/src/cli/ai/toolbox'
import primingDocument from '../tools/generate/src/cli/ai/priming.json'

/** The AI library is untyped JavaScript; the boundary is here, as it is in the host. */
type Untyped = any // eslint-disable-line @typescript-eslint/no-explicit-any

/**
 * [[REQ-295]] — **the switch, the worker's grant, and the worker's prose**.
 *
 * The half of the ticket that is decided by DOCUMENTS rather than by a turn. The
 * sibling `.workers` suite drives a real delegation through the real Worker and
 * proves what reaches the wire; everything here is what the deployment is
 * configured to be before a model is involved at all, which is where three of the
 * ticket's conditions are actually settled:
 *
 *   - condition 9 — a worker bound to a backend `backends.json` does not declare
 *     fails at START-UP naming the key, not at the first delegation;
 *   - condition 5 — the worker's capabilities are the builder role's grant, which
 *     is a line in `instances.json` and nothing a brief can widen;
 *   - condition 1 — with the switch off the consultant's PROMPT is unchanged, and
 *     the prose that would change it is a provider that renders nothing.
 *
 * NOTHING ABOUT THE WORDS IS RESTATED. What the assertions compare against is
 * read back out of `priming.json`, `backends.json` and `delegation.json`, so an
 * edit to a document is what moves a case rather than an edit to a constant that
 * happens to hold a copy of it.
 */

/** The backends `backends.json` declares — what a worker's may be one of. */
const DECLARED_BACKENDS = Object.keys(backendsDocument).filter((key) => key !== 'about')

// ── the switch, and how it fails ─────────────────────────────────────────────

describe('REQ-295 — the switch is a document, and a bad one is a start-up failure', () => {
  it('test_UAT_FC_REQ-295_the_switch_ships_on_with_a_builder_bound_to_a_declared_backend', () => {
    const settings = delegationFor([BUILDER_ROLE])

    // IT SHIPS ON, and it shipped off first. Of the two reasons it shipped off,
    // the context window is discharged outright — REQ-296 landed, so a worker on
    // the smaller window meets a start-up check and a host-side guard rather than
    // a provider error mid-turn — and the wait for REQ-292's undelegated baseline
    // was overruled: the before-figure is this ticket's modelling, and a week
    // spent measuring what construction costs is a week spent paying it.
    expect(settings.enabled).toBe(true)
    // AND THE WIRING IS CHECKED WHICHEVER WAY THE SWITCH POINTS, which is what
    // makes it a switch rather than an experiment. A worker misconfiguration that
    // only surfaced on the day somebody flipped it would make it untrustworthy.
    expect(Object.keys(settings.workers)).toEqual([BUILDER_ROLE])
    expect(DECLARED_BACKENDS).toContain(settings.workers[BUILDER_ROLE].backend)
  })

  it('test_UAT_FC_REQ-295_a_worker_bound_to_an_undeclared_backend_is_refused_by_name', () => {
    // CONDITION 9. `backends.json` is the document that says which model a name
    // runs on, so a name that is not in it resolves to no model, no ceiling and
    // the framework's own defaults — silently, and on the EXPENSIVE side, which
    // is the one failure mode this whole ticket exists to remove. Refused here,
    // naming both halves, rather than at the first delegation.
    let raised: unknown = null
    try {
      delegationFromMapping({ enabled: true, workers: { builder: { backend: 'claude_cheap' } } })
    } catch (error) {
      raised = error
    }
    expect(raised).toBeInstanceOf(DelegationConfigError)
    expect(String((raised as Error).message)).toContain('builder')
    expect(String((raised as Error).message)).toContain('claude_cheap')
    // And it says what WOULD have been accepted, so the answer is in the error
    // rather than in a hunt through a second file.
    for (const name of DECLARED_BACKENDS) {
      expect(String((raised as Error).message)).toContain(name)
    }
  })

  it('test_UAT_FC_REQ-295_a_malformed_switch_is_refused_at_the_key_that_is_wrong', () => {
    // Each of these is a setting written in good faith that would otherwise do
    // nothing at all — the class of failure `configureBackends` refuses one file
    // over, refused here on the same terms.
    expect(() => delegationFromMapping({ workers: {} })).toThrow(/enabled/)
    expect(() => delegationFromMapping({ enabled: 'yes' })).toThrow(/enabled/)
    expect(() => delegationFromMapping({ enabled: true, workers: [] })).toThrow(/workers/)
    expect(() =>
      delegationFromMapping({ enabled: true, workers: { builder: { model: 'x' } } }),
    ).toThrow(/model/)
    expect(() => delegationFromMapping({ enabled: true, workers: { builder: {} } })).toThrow(
      /backend/,
    )
  })

  it('test_UAT_FC_REQ-295_a_worker_role_this_host_cannot_build_is_refused_at_start_up', () => {
    // WHICH ROLES EXIST IS THE HOST'S KNOWLEDGE AND NOT THE DOCUMENT'S, so this
    // half of the check lives where the host asks. Without it a role nothing can
    // build would surface as an `unknown_role` refusal at the first delegation —
    // a configuration mistake reported in the middle of a customer's turn.
    const settings = { enabled: true, workers: { copywriter: { backend: 'claude_builder' } } }

    // THE DOCUMENT ALONE IS WELL FORMED — it names a backend that exists, and a
    // document does not know which roles a host can stand up.
    expect(() => delegationFromMapping(settings)).not.toThrow()

    try {
      configureDelegation(settings)
      expect(() => delegationFor([BUILDER_ROLE])).toThrow(/copywriter/)
      // AND WITH THE SWITCH OFF TOO, so flipping it later is a decision rather
      // than an experiment.
      configureDelegation({ ...settings, enabled: false })
      expect(() => delegationFor([BUILDER_ROLE])).toThrow(/copywriter/)
    } finally {
      configureDelegation(null)
    }
    // Restored: the bundled document is in force again.
    expect(delegationFor([BUILDER_ROLE]).enabled).toBe(true)
  })
})

// ── the worker's backend ─────────────────────────────────────────────────────

describe('REQ-295 — the worker runs a cheaper model and the consultant does not move', () => {
  it('test_UAT_FC_REQ-295_the_workers_backend_entry_names_its_own_model_and_ceiling', () => {
    const worker = backendsDocument.claude_builder

    // The whole lever, as configuration: the worker is a VARIANT of the same
    // adapter on a cheaper model. Read from the document rather than restated,
    // so editing the file is what changes the request.
    expect(worker.model).toMatch(/haiku/)
    expect(worker.model).not.toBe(backendsDocument.claude.model)
    expect(Number.isInteger(worker.max_tokens)).toBe(true)
    expect(worker.max_tokens).toBeGreaterThan(0)

    // AND THE CONSULTANT IS UNTOUCHED. A delegation that quietly changed the
    // caller's model would be the one change this must not make.
    expect(backendsDocument.claude.model).toBe('claude-opus-5')
    expect(backendsDocument.claude.max_tokens).toBe(64000)
  })

  it('test_UAT_FC_REQ-295_a_workers_tokens_can_be_priced_at_its_own_rates', () => {
    // CONDITION 7's second half. A worker's spend is attributed to the caller's
    // turn as an entry naming its OWN backend and its own model — kept whole
    // rather than folded into the caller's four counters precisely so it can be
    // priced at its own rates. A pair the table does not name would leave that
    // entry permanently unpriceable.
    const rates = ratesFor(
      delegationDocument.workers.builder.backend,
      backendsDocument.claude_builder.model,
    )
    expect(rates).not.toBeNull()
    // And cheaper than the caller's, which is the entire point of the exercise.
    const caller = ratesFor('claude', backendsDocument.claude.model)
    expect(rates!.input).toBeLessThan(caller!.input)
    expect(rates!.output).toBeLessThan(caller!.output)
  })
})

// ── the worker's grant ───────────────────────────────────────────────────────

describe('REQ-295 — the builder has the construction half and not the judgement half', () => {
  it('test_UAT_FC_REQ-295_the_builder_grant_is_narrower_than_the_consultants_and_takes_nothing_from_it', () => {
    const consultant = L1_INSTANCES[CONSULTANT_ROLE] as { l1: { groups: string[] } }
    const builder = L1_INSTANCES[BUILDER_ROLE] as {
      l1: { groups: string[] }
      fidelity: { groups: string[] }
    }

    // CONDITION 5. The brief is open prose and no phrasing of it can widen the
    // worker, because authority comes from THIS and not from the goal.
    expect(builder.l1.groups).toEqual([
      'ReadSite',
      'AuthorPages',
      'ManageComponents',
      'MeasureDrawings',
      'DrawImages',
    ])
    expect(builder.fidelity.groups).toEqual(['SeeSite'])

    // Creating and deleting pages, the site's configuration and its palette are
    // the consultant's judgement and not the builder's hands.
    for (const withheld of ['ManagePages', 'WriteConfig', 'ManagePalette']) {
      expect(consultant.l1.groups).toContain(withheld)
      expect(builder.l1.groups).not.toContain(withheld)
    }

    // AND THE CONSULTANT KEEPS EVERYTHING. The grant is ADDITIVE: the narrower
    // design — moving construction out of the consultant so delegating is
    // compulsory — is deliberately not taken here, and this is where that would
    // first show up if it were taken by accident.
    for (const group of builder.l1.groups) expect(consultant.l1.groups).toContain(group)
  })

  it('test_UAT_FC_REQ-295_both_grants_validate_against_the_declarations_they_name', async () => {
    // The startup-failure rule, run at author time: a group the surface does not
    // declare, or a surface nobody hands the validator, is caught here rather
    // than by a session failing to construct a Toolbox.
    const { validateData } = await aiCore()
    const report = validateData([L1_DECLARATION, FIDELITY_DECLARATION], L1_INSTANCES)

    expect(report.problems).toEqual([])
    expect(report.ok).toBe(true)
    expect(report.roles).toContain(CONSULTANT_ROLE)
    expect(report.roles).toContain(BUILDER_ROLE)
  })
})

// ── the worker's prose ───────────────────────────────────────────────────────

describe('REQ-295 — the builder reads its own words, never the consultants', () => {
  it('test_UAT_FC_REQ-295_the_builder_role_loads_with_its_declared_providers_and_its_grant', async () => {
    const lib = await aiCore()
    const providers = new lib.PrimingProviders()
    // The box is a double HERE and only here: what it stands in for — a manual
    // projected from the worker's own grant — is proved against the real Toolbox
    // in the `.workers` suite.
    registerBuilderProviders(providers, {
      box: { manual: async () => '## Your tools\n\n- `set_l1`' },
    })
    // AND THE SITE'S OWN NAMES, because the worker reads two of them. That is
    // the point of them NOT being rebound: which site this is and what is on it
    // are facts about the SITE, and both roles are on the same one in the same
    // manager — so a second binding would be a second answer to one question.
    // The host registers these before it builds either role, and a role loaded
    // without them is the load failure the case below is about.
    registerSiteProviders(providers, {
      slug: 'delegation-fixture',
      box: { manual: async () => '## Your tools' },
      signal: () => undefined,
      digest: async () => null,
    })

    const role = builderRole(lib, providers, L1_INSTANCES[BUILDER_ROLE] as Record<string, unknown>)

    expect(role).toBeTruthy()
    // `tools` IS THE POINT. It has been carried by every role since roles existed
    // and read by nothing at all; the delegation surface builds each worker's
    // Toolbox from it, which is what makes "the worker's authority is its role's
    // grant" true rather than aspirational.
    expect(role.tools).toEqual(L1_INSTANCES[BUILDER_ROLE])
  })

  it('test_UAT_FC_REQ-295_the_two_operations_model_facing_names_are_what_the_workers_suite_scripts', async () => {
    // WHERE THE DRIFT IS CAUGHT. `delegate` and `report` are the OPERATION ids;
    // what a model is offered is each operation's `tool`, and this surface names
    // them differently. Getting that wrong does not fail loudly — the call comes
    // back `Tool delegate not enabled`, which reads like a missing grant rather
    // than a misspelled tool, and a suite written against the wrong name would
    // assert nothing while passing. Pinned here, against the INSTALLED
    // declaration, so an upstream rename fails one case rather than silently
    // hollowing out the sibling `.workers` suite.
    const lib = await aiCore()
    const declaration = lib.DelegationToolbox.DECLARATION as {
      operations: { op: string; tool?: string }[]
    }
    const named = Object.fromEntries(
      declaration.operations.map((operation) => [operation.op, operation.tool ?? operation.op]),
    )
    expect(named.delegate).toBe('Delegate')
    expect(named.report).toBe('ReportResult')
  })

  it('test_UAT_FC_REQ-295_an_unregistered_provider_name_is_a_load_failure', async () => {
    // The whole reason the role goes through `rolesFromMapping`: hand-building a
    // `Role` skips every check the format has, and this role names a provider
    // that did not exist before this ticket.
    const lib = await aiCore()
    expect(() => builderRole(lib, new lib.PrimingProviders(), {})).toThrow()
  })

  it('test_UAT_FC_REQ-295_it_reuses_none_of_the_other_roles_static_entries', () => {
    const priming = primingDocument.builder_priming as { name?: string; provider?: string }[]
    const named = priming.map((entry) => entry.name)

    expect(named).toContain(BUILDER_ROLE_ENTRY)
    // `consultant-role` is a register — form a view, argue for it, lead — and a
    // worker that argued with its brief would duplicate the judgement it was
    // handed the work to avoid paying for. `product-system` is half about a
    // conversation this session does not have.
    expect(named).not.toContain(ROLE_ENTRY)
    expect(named).not.toContain(PRODUCT_ENTRY)
    expect(named).not.toContain(SETTINGS_ROLE_ENTRY)
    // The role text first, the manual last before the marker — the shape both
    // other roles already have, so the three cannot drift in HOW they are
    // assembled, only in what they say.
    expect(named[0]).toBe(BUILDER_ROLE_ENTRY)
    expect(priming.at(-1)).toEqual({ cache_boundary: true })
    expect(priming.at(-2)?.provider).toBe(BUILDER_MANUAL_PROVIDER)
  })

  it('test_UAT_FC_REQ-295_every_worker_this_deployment_opens_sends_the_same_cacheable_prefix', () => {
    // WHAT VARIES PER DELEGATION IS IN THE REMINDER TIER. A worker lives one
    // turn, so nothing is lost by delivering which site it is on and what is
    // currently on that site there — and putting either in the prefix would give
    // every delegation a prefix of its own, which for a feature whose entire
    // justification is cost is the wrong way round.
    const priming = primingDocument.builder_priming as { provider?: string }[]
    const reminders = primingDocument.builder_reminders as { provider?: string }[]
    const volatile = reminders.map((entry) => entry.provider)

    expect(volatile).toContain('site.line')
    expect(volatile).toContain('site.digest')
    for (const name of volatile) expect(priming.map((e) => e.provider)).not.toContain(name)
  })

  it('test_UAT_FC_REQ-295_the_role_text_tells_the_worker_what_a_schema_cannot', () => {
    const text = primingText(BUILDER_ROLE_ENTRY)

    // The load-bearing sentence, and the one the caller's whole saving rests on:
    // a consultant that cannot trust a verdict re-inspects everything, and the
    // tokens have then been moved to the expensive side rather than saved.
    expect(text).toMatch(/not a check you\s*\n?\s*passed/i)
    // A refusal is a useful answer where a plausible substitute is not — which is
    // condition 5 stated to the worker, not just enforced around it.
    expect(text).toMatch(/refusal/i)
    // And it never talks to the client. That is the consultant's conversation.
    expect(text).toMatch(/report/i)
  })
})

// ── the consultant's method prose is the switch ──────────────────────────────

describe('REQ-295 — with the switch off the consultant is not told how to delegate', () => {
  it('test_UAT_FC_REQ-295_the_method_entry_is_declared_in_both_of_the_consultants_orders', () => {
    for (const withCorpus of [true, false]) {
      const config = primingConfig(withCorpus) as {
        priming: { name?: string; provider?: string }[]
      }
      const entry = config.priming.find((e) => e.provider === DELEGATION_METHOD_PROVIDER)
      expect(entry).toBeDefined()
      // A `provider:` and never `text:`. Prose telling a session how to use a
      // tool it has not got is an instruction to reach for one, and a model will
      // offer it, apologise for it, or probe for it.
      expect(entry).not.toHaveProperty('text')
    }
  })

  it('test_UAT_FC_REQ-295_the_provider_renders_nothing_with_the_switch_off_and_the_shipped_words_with_it_on', async () => {
    const lib = await aiCore()

    const bind = (delegating: boolean): Untyped => {
      const providers = new lib.PrimingProviders()
      registerSiteProviders(providers, {
        slug: 'delegation-fixture',
        box: { manual: async () => '## Your tools' },
        signal: () => undefined,
        delegating,
      })
      return providers
    }

    // CONDITION 1. `null` drops the entry AND its separator, so the prompt a
    // deployment with the switch off sends is what this host sent before
    // delegation existed.
    expect(await bind(false).get(DELEGATION_METHOD_PROVIDER)({})).toBeNull()
    // AND THE DEFAULT IS OFF, which is the safe direction for a host that
    // forgot to answer the question at all.
    expect(delegationMethod(false)).toBeNull()

    const rendered = await bind(true).get(DELEGATION_METHOD_PROVIDER)({})
    // The SHIPPED words, not a copy of them: the prose is configuration and the
    // condition is code, which is the split this host keeps everywhere.
    expect(rendered).toBe(primingDocument.templates['delegation-method'])
    // …and what it has to say. Re-inspecting checked work does not save the
    // tokens, it moves them to the more expensive side.
    expect(rendered).toMatch(/believe them/i)
    expect(rendered).toMatch(/expensive/i)
  })
})
