import { describe, expect, it } from 'vitest'
import {
  BUSINESS_LINE_PROVIDER,
  BUSINESS_MANUAL_PROVIDER,
  CONSULTANT_ROLE,
  PRODUCT_ENTRY,
  ROLE_ENTRY,
  SETTINGS_ROLE,
  SETTINGS_ROLE_ENTRY,
  businessLine,
  primingText,
  registerSettingsProviders,
  settingsPrimingConfig,
  settingsRole,
  siteLine,
} from '../tools/generate/src/cli/ai/roles'
import {
  businessBackendName,
  businessSessionIdFor,
  sessionIdFor,
  siteBackendName,
} from '../tools/generate/src/cli/ai/host-core'
import { L1_INSTANCES } from '../tools/generate/src/cli/ai/toolbox-core'
import { aiCore } from '../tools/generate/src/cli/ai/toolbox'

/**
 * [[REQ-239]] — **the settings role, and the identity of a business-scoped
 * conversation.**
 *
 * WHAT MAKES THIS EVIDENCE. The role is built by the FRAMEWORK'S OWN loader, with
 * the providers this host actually registers, out of the priming file that
 * actually ships — so a malformed entry, a stray cache marker or a `provider:`
 * naming something nobody registered fails here exactly as it would fail at
 * start-up. Nothing about the words is restated: what the assertions compare
 * against is read back out of `priming.json`.
 *
 * The sibling `.workers` suite proves the other half — that a real turn through
 * the real Worker is primed with these words and granted these tools.
 *
 * THE CLAIMS:
 *
 *   1. THERE IS A SECOND ROLE, and it loads. It is this project's first, and the
 *      header of `roles.ts` has anticipated it since [[REQ-171]].
 *   2. IT DOES NOT INHERIT THE CONSULTANT'S TEXT. Neither of the consultant's two
 *      static entries is about anything this session can do, and a session told
 *      about a capability it was not granted will offer it.
 *   3. IT HAS NO SITE LINE. A settings session is about a BUSINESS, so the framing
 *      it needs is which business it is in.
 *   4. THE TWO SESSION IDENTITIES CANNOT COLLIDE, in the id or in the backend
 *      registry — where a collision would not merely be wrong, it would hand a
 *      site conversation the settings surface.
 *   5. THE GRANT IS NOT IN `instances.json`, and that is [[REQ-237]]'s settlement
 *      rather than this ticket's original wording — see the ticket body.
 */

// ── 1 & 2: the role, and whose words it uses ─────────────────────────────────

describe('REQ-239 AC1 — a second role, loaded by the framework', () => {
  it('test_UAT_FC_REQ-239_the_settings_role_loads_with_its_declared_providers', async () => {
    const lib = await aiCore()
    const providers = new lib.PrimingProviders()
    // The box is a double HERE and only here: what it stands in for — a projected
    // manual — is proved against the real Toolbox in the `.workers` suite.
    registerSettingsProviders(providers, {
      box: { manual: async () => '## Your tools\n\n- `rename_business`' },
      name: async () => 'Cole’s Bakery',
    })

    const role = settingsRole(lib, providers)

    expect(role).toBeTruthy()
    expect(SETTINGS_ROLE).not.toBe(CONSULTANT_ROLE)
  })

  it('test_UAT_FC_REQ-239_an_unregistered_provider_name_is_a_load_failure', async () => {
    // THE WHOLE REASON THE ROLE GOES THROUGH `rolesFromMapping`. Hand-building a
    // `Role` skips every check the format has, and the one this role is most
    // exposed to is the last of them: it names two providers that did not exist
    // before this ticket.
    const lib = await aiCore()
    expect(() => settingsRole(lib, new lib.PrimingProviders())).toThrow()
  })

  it('test_UAT_FC_REQ-239_it_does_not_reuse_the_consultants_static_entries', () => {
    const config = settingsPrimingConfig() as {
      priming: { name?: string; provider?: string }[]
      reminders: { name?: string; provider?: string }[]
    }
    const named = config.priming.map((e) => e.name)

    expect(named).toContain(SETTINGS_ROLE_ENTRY)
    // `product-system` IS ABOUT BUILDING A SITE — how a page is changed, what a
    // tool will accept, what publishing means. This session is granted none of it.
    expect(named).not.toContain(ROLE_ENTRY)
    expect(named).not.toContain(PRODUCT_ENTRY)
    // THE ROLE TEXT IS FIRST, because the first thing a model reads about itself
    // sets the register for everything after it ([[REQ-171]]).
    expect(named[0]).toBe(SETTINGS_ROLE_ENTRY)
    // AND THE MANUAL IS THE LAST THING BEFORE THE MARKER, because the last thing
    // read is the first thing done.
    expect(config.priming.at(-1)).toEqual({ cache_boundary: true })
    expect(config.priming.at(-2)?.provider).toBe(BUSINESS_MANUAL_PROVIDER)
  })

  it('test_UAT_FC_REQ-239_the_role_text_sets_a_register_that_is_not_the_consultants', () => {
    const text = primingText(SETTINGS_ROLE_ENTRY)
    // A CONSULTANT FORMS A VIEW AND ARGUES FOR IT; what a business is called is
    // not a matter of taste. The role text says so rather than leaving the model
    // to infer it from the tools.
    expect(text).toContain('not here to form a view')
    // AND THE FIELD IS NOT A FALLBACK. The pane can do everything this role can,
    // and a role that did not know that would talk the customer out of using it.
    expect(text).toContain('without you')
  })
})

// ── 3: the framing ───────────────────────────────────────────────────────────

describe('REQ-239 AC2 — which business, never which site', () => {
  it('test_UAT_FC_REQ-239_the_reminder_names_the_business_and_not_a_site', () => {
    const config = settingsPrimingConfig() as { reminders: { provider?: string }[] }
    const providers = config.reminders.map((e) => e.provider).filter(Boolean)

    expect(providers).toContain(BUSINESS_LINE_PROVIDER)
    // `site.line`, `site.changes` AND `corpus.delta` ARE ALL ABSENT. Each is a
    // fact about a site or a corpus this session has no tool to reach.
    expect(providers).not.toContain('site.line')
    expect(providers).not.toContain('site.changes')
    expect(providers).not.toContain('corpus.delta')
  })

  it('test_UAT_FC_REQ-239_the_business_line_renders_the_name_rather_than_the_id', () => {
    const line = businessLine('Cole’s Bakery')

    // THE NAME AND NOT THE ID: the id is opaque and is never shown to the
    // customer, so a session framed by one could not say which business it was in
    // without first calling a tool to find out.
    expect(line).toContain('Cole’s Bakery')
    expect(line).not.toBe(siteLine('Cole’s Bakery'))
  })
})

// ── 4: the two identities ────────────────────────────────────────────────────

describe('REQ-239 AC3 — a business session and a site session cannot collide', () => {
  it('test_UAT_FC_REQ-239_the_ids_and_the_backend_names_are_distinct_namespaces', () => {
    // THE WORST CASE: a business id and a site key that are the same string. A
    // shared namespace would give them one manager and therefore ONE ROLE, which
    // would hand a site conversation the settings surface.
    const same = 'acme'

    expect(businessSessionIdFor(same)).not.toBe(sessionIdFor(same))
    expect(businessBackendName(same)).not.toBe(siteBackendName(same))
    expect(businessSessionIdFor(same)).toBe('business-acme')
  })

  it('test_UAT_FC_REQ-239_the_business_id_is_a_key_and_is_never_the_business_name', () => {
    // THIS IS THE CONVERSATION ABOUT RENAMING THE BUSINESS. An id derived from the
    // name would be moved by the very operation the session exists to perform —
    // and the ticket holding the transcript is found by `fields.session_id`, so
    // the first rename would silently replace the conversation with an empty one.
    const before = businessSessionIdFor('biz_9f3a')
    expect(before).toBe('business-biz_9f3a')
    expect(before).not.toContain('Cole')
  })
})

// ── 5: where the grant lives ─────────────────────────────────────────────────

describe('REQ-239 AC4 — the grant travels with the surface', () => {
  it('test_UAT_FC_REQ-239_instances_json_declares_no_settings_role', () => {
    // THE TICKET ASKED FOR AN ENTRY HERE AND [[REQ-237]] SETTLED IT OTHERWISE.
    // `instances.json` is validated in CI against the declarations THIS repository
    // hands the validator, so a key for a surface composed per deployment would be
    // a grant nothing can check. The property the ticket wanted is unchanged —
    // the settings surface and nothing else — and the `.workers` suite proves it
    // on the wire, which is where it is worth proving.
    //
    // ABSENCE RATHER THAN A ROLE COUNT ([[REQ-295]]). This read `toEqual([
    // CONSULTANT_ROLE])` while the consultant was the only role with an L1
    // grant. The claim was never about how many roles there are — it is that the
    // SETTINGS role is not one of them — and a delegated worker now has an entry
    // here for the opposite reason: its surfaces are the ones `instances.json` is
    // validated against, so its grant is exactly the kind a key here can check.
    expect(Object.keys(L1_INSTANCES)).toContain(CONSULTANT_ROLE)
    expect(Object.keys(L1_INSTANCES)).not.toContain(SETTINGS_ROLE)
  })
})
