import { describe, expect, it } from 'vitest'
import { aiCore } from '../tools/generate/src/cli/ai/toolbox'
import { createL1Toolbox, L1_DECLARATION } from '../tools/generate/src/cli/ai/toolbox-core'
import {
  FIDELITY_DECLARATION,
  fidelitySurfaceFor,
} from '../tools/generate/src/cli/ai/fidelity-core'
import type { FidelityDeps } from '../tools/generate/src/cli/ai/fidelity-core'
import { memoryReferenceStore } from '../tools/generate/src/store/memory-reference-store'
import { makeMemorySite } from './support/site-factory'
import {
  consultantRole,
  registerSettingsProviders,
  registerBudgetProvider,
  registerMemoryProviders,
  registerSiteProviders,
  settingsRole,
} from '../tools/generate/src/cli/ai/roles'

/**
 * [[REQ-284]] — **the cheap instrument is the one that is written down.**
 *
 * The consultant's own account of the failure, from the Lagrange Foundry
 * transcript: *"I have been treating looking as free. It is the most expensive
 * thing I do."* — and, on the reminder it was handed after each truncation,
 * *"Each recovery makes the next truncation arrive sooner. It is a doom loop,
 * and the system is steering me into it."*
 *
 * Nothing here is a mechanism. Every claim is about WHAT A SESSION IS TOLD at
 * the moment it chooses an instrument, and the two places that happens are the
 * summary manual it is primed with — group prose, surface overview, and one line
 * per tool — and the reminder it is handed on a turn that follows an interrupted
 * one.
 *
 * WHAT MAKES THIS EVIDENCE. Nothing restates the words. The reminder assertions
 * render the REAL role through the framework's own loader and its own
 * `assembleReminders`, out of the `priming.json` that actually ships, with the
 * providers this host actually registers — so an entry naming an unregistered
 * provider, or a template name with no template behind it, fails here exactly as
 * it would fail at start-up. The manual assertions go through the REAL Toolbox's
 * own projection at the level a session is actually primed at, rather than
 * reading the declaration and hoping the projection carries it.
 *
 * THE CLAIMS:
 *
 *   1. A consultant recovering from an interrupted turn is told to call
 *      `list_changes`, and is no longer told to look at the site first.
 *   2. The settings assistant gets the same situation and NOT the same
 *      instruments: its line names a read it was granted, and names neither
 *      `list_changes` nor a site it does not have.
 *   3. Neither role carries any of it on an ordinary turn.
 *   4. The one line a session reads before reaching for the camera prices the
 *      call and names the cheap alternative; the one line beside the cheap call
 *      says it is the cheap one.
 *   5. Both survive into the summary manual, which is the only place they do any
 *      good.
 */

type Untyped = any // eslint-disable-line @typescript-eslint/no-explicit-any

const SLUG = 'req284'

/** The reminder tier as the framework assembles it, for a turn with this signal. */
async function reminderFor(
  role: 'consultant' | 'settings',
  signal: { interrupted?: boolean } | undefined,
): Promise<string> {
  const lib = (await aiCore()) as Untyped
  const providers = new lib.PrimingProviders()
  // THE FRAMEWORK'S DEFAULTS FIRST, THIS PROJECT'S ON TOP — `host-core.ts`'s own
  // order, and the order is the whole of it: the project's memory bindings below
  // deliberately REPLACE three of upstream's, so registering the shipped set
  // afterwards would quietly put upstream's back. [[REQ-296]] is why they are
  // needed at all — the settings role's tail now names the occupancy gauge, which
  // is an upstream provider, so a registry of only this project's bindings can no
  // longer load that role.
  lib.registerDefaults(providers, {})
  registerBudgetProvider(providers, async () => 0)
  // The box is the one double: what it stands in for — a projected manual — is
  // the subject of claims 4 and 5, against the real Toolbox, below.
  const box = { manual: async () => '## Your tools\n\n- `list_changes`' }
  // EVERY NAME THE CONSULTANT'S CONFIGURATION USES, OR THE ROLE WILL NOT LOAD
  // ([[REQ-283]]). `null` is the wiring of a host with nowhere to keep a record:
  // the trigger is registered and renders nothing, which is what keeps the two
  // cases below asserting an ABSENCE of advice rather than a failure to build.
  registerMemoryProviders(providers, null)
  const built =
    role === 'consultant'
      ? (registerSiteProviders(providers, { slug: SLUG, box, signal: () => signal }),
        consultantRole(lib, providers, false))
      : (registerSettingsProviders(providers, {
          box,
          name: async () => 'Cole’s Bakery',
          signal: () => signal,
        }),
        settingsRole(lib, providers))
  return lib.assembleReminders(built, new lib.SessionContext({ role, backend: 'test' }), {
    providers,
  })
}

/** The summary manual a primed session reads, with both surfaces composed. */
async function summaryManual(): Promise<string> {
  const site = makeMemorySite({ slug: SLUG })
  try {
    const lib = (await aiCore()) as Untyped
    const deps: FidelityDeps = {
      slug: site.slug,
      origin: 'http://localhost:0',
      references: memoryReferenceStore(),
      // Never reached: a manual projection takes no picture. A factory that
      // throws is what says so.
      driverFactory: async () => {
        throw new Error('the manual does not open a browser')
      },
      guardedDriver: () => async () => {
        throw new Error('the manual does not open a browser')
      },
    } as unknown as FidelityDeps
    const box = (await createL1Toolbox(
      site.slug,
      {},
      {
        lib,
        store: site.store,
        extraSurfaces: [{ surface: await fidelitySurfaceFor(lib, deps) }],
      },
    )) as Untyped
    return box.manual({ level: 'summary' }) as string
  } finally {
    site.dispose?.()
  }
}

/** One operation's declared summary — the single line the manual renders for it. */
function summaryOf(declaration: Untyped, op: string): string {
  const found = (declaration.operations as { op: string; summary: string }[]).find(
    (o) => o.op === op,
  )
  if (!found) throw new Error(`no operation named ${op}`)
  return found.summary
}

// ── 1 & 2: recovery advice, per role ─────────────────────────────────────────

describe('REQ-284 — the recovery advice names the cheap instrument', () => {
  it('test_UAT_FC_REQ-284_an_interrupted_consultant_turn_is_sent_to_list_changes', async () => {
    const reminder = await reminderFor('consultant', { interrupted: true })

    expect(reminder).toContain('did not finish')
    // The cheap instrument, by name. "The expensive one is the one that comes to
    // mind" unless the cheap one is written down.
    expect(reminder).toContain('list_changes')
  })

  it('test_UAT_FC_REQ-284_it_is_no_longer_told_to_look_at_the_site_first', async () => {
    const reminder = await reminderFor('consultant', { interrupted: true })

    // The exact instruction that produced the doom loop: recovering from having
    // run out of context by spending context on the most expensive call there is.
    expect(reminder).not.toContain('Look at the site before you answer')
    // A picture is still available — it is the LAST resort and it is priced, not
    // forbidden. What must not survive is a picture being the FIRST move, so the
    // cheap instrument is named before the expensive one is mentioned at all.
    expect(reminder.indexOf('list_changes')).toBeLessThan(reminder.indexOf('picture'))
  })

  it('test_UAT_FC_REQ-284_the_settings_assistant_is_not_told_of_tools_it_lacks', async () => {
    const reminder = await reminderFor('settings', { interrupted: true })

    // The situation is the same and is said the same way…
    expect(reminder).toContain('did not finish')
    // …and the instruments are not. This session has no site, no journal and no
    // camera; a line naming `list_changes` would name a tool it was never granted,
    // and a session told about a capability it lacks will offer it.
    expect(reminder).not.toContain('list_changes')
    expect(reminder).not.toMatch(/look at the site/i)
    // What it does have, named: a read that costs almost nothing.
    expect(reminder).toContain('read_business')
  })

  it('test_UAT_FC_REQ-284_neither_role_carries_the_advice_on_an_ordinary_turn', async () => {
    for (const role of ['consultant', 'settings'] as const) {
      const quiet = await reminderFor(role, undefined)
      expect(quiet).not.toContain('did not finish')
      expect(quiet).not.toContain('read_business')
      // A dropped entry takes its separator with it: no blank section is left
      // where the advice would have been.
      expect(quiet).not.toMatch(/\n\n\n/)
    }
  })
})

// ── 4 & 5: the two lines read at the moment of choosing ──────────────────────

describe('REQ-284 — looking is priced where the choice is made', () => {
  it('test_UAT_FC_REQ-284_the_screenshot_line_prices_the_call_and_names_the_alternative', () => {
    const line = summaryOf(FIDELITY_DECLARATION, 'screenshot')

    // It costs: the most expensive call available, and the cost does not end
    // with the turn.
    expect(line).toMatch(/most expensive/i)
    expect(line).toMatch(/every turn after this one/i)
    // And the cheap one is named in the same breath, because a session told what
    // things cost but not what to reach for instead has been told half an answer.
    expect(line).toContain('list_changes')
  })

  it('test_UAT_FC_REQ-284_the_list_changes_line_says_it_is_the_cheap_one', () => {
    const line = summaryOf(L1_DECLARATION, 'list_changes')

    expect(line).toMatch(/cheap/i)
    // Named against the thing it is an alternative TO. "Cheap" on its own is not
    // a comparison, and the choice being made is a comparison.
    expect(line).toMatch(/picture/i)
  })

  it('test_UAT_FC_REQ-284_the_pricing_reaches_the_manual_a_session_is_primed_with', async () => {
    const manual = await summaryManual()

    // The summary level drops every parameter, return shape and error code. What
    // it keeps is the group prose, the surface overview and ONE LINE PER TOOL —
    // so pricing that lived only in an operation's long description would be
    // invisible at the moment of choosing. These are the lines that survive.
    expect(manual).toContain('**screenshot**')
    expect(manual).toContain('**list_changes**')
    expect(manual).toMatch(/most expensive/i)
    expect(manual).toMatch(/cheapest answer/i)

    // And the surface's own prose prices reading against looking, including the
    // measurement that answers *do these match?* without either picture reaching
    // the conversation at all.
    expect(manual).toMatch(/pay for it again on every turn/i)
    expect(manual).toContain('hands back numbers rather than the pictures')
  })
})
