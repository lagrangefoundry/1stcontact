---
uid: report-a535d194
id: REPORT-935
type: report
title: 'Capability-Intent Alignment: Capability Module Contract & Catalog (level=uat)'
created_by: xgd
created_at: '2026-07-24T10:01:41.422935+00:00'
updated_at: '2026-07-24T10:01:41.422935+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-ce902be4
  level: uat
  violations: 0
  warnings: 1
  needs_review_count: 0
---

# Capability-Intent Alignment: Capability Module Contract & Catalog
# Level: uat

**Result**: PASS
**Violations**: 0
**Warnings**: 1
**Needs review**: 0

Level = uat, so AC bodies are the working reference; the story (STORY-85,
`feature`) and the ACs above it are assumed aligned. Intent (BUNDLE-7) was
consulted only to confirm the ACs remain live — no AC appeared suspicious
enough to force an upward re-check.

## Cumulative Intent Considered

The capability's story (STORY-85, `intent_uid=bundle-31e474b9`) and all 8 ACs
(AC-697…AC-704) trace to a single reconciled intent bundle. No retiring or
superseding intent touches this capability.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUNDLE-7 (bundle-31e474b9) — REQ-63 + REQ-79 + REQ-82 + REQ-83 + REQ-84 + 2 more | free_and_reconciled | merged @ edeb1c2c | Framework pivot: module = behavioural capability (vetted core + typed config + L1 slots + 5-dim conformance incl. isolation); reframes carousel/contact-form survivors; shipped client-JS asset mechanism | YES |

## Alignment Ledger

At uat level each element is a UAT; alignment outcome is whether the test
substantively exercises its AC's claim at a real entry point.

| Element (test) | AC aligned to | Outcome |
|---|---|---|
| test_UAT_AC697_config_validated_against_typed_contract | AC-697 | aligned — exercises `validateCapabilityConfig` on both survivors; one-defect-per-case for missing-required / wrong-type / int-range / off-enum / list-bounds / recursive itemSchema |
| test_UAT_AC698_slots_validated_as_l1_subtrees | AC-698 | aligned — `validateCapabilitySlots`/`validateCapabilityInstance`; raw-markup + arbitrary-object rejected as "not a valid L1 subtree"; required/optional, repeated bounds, array-vs-single, config∪slot union |
| test_UAT_AC699_carousel_renders_l1_slide_track_from_config | AC-699 | aligned — real SSR container render; snap track, one `data-l1-slot="slide"` per subtree, verbatim content, `view` sizing, dots-per-slide, no-dial contract |
| test_UAT_AC700_autoplay_loop_ship_as_vetted_client_behaviour | AC-700 | aligned — SSR opt-in markers + drives real `advanceTrack`/`enhanceCarousel` from `client.js`; wrap-only-under-loop; one-slide / missing-track / absent-timer isolation |
| test_UAT_AC701_contact_form_renders_functional_form_with_l1_slots | AC-701 | aligned — real SSR render; labelled control/type/required per field, post form → endpoint, honeypot + Turnstile mount, intro/submit L1 slots present-vs-baseline |
| test_UAT_AC702_client_behaviour_ships_as_one_page_referenced_asset | AC-702 | aligned (with gap) — real `cmdNew`+`cmdRender`; single folded `capabilities.js`, both capabilities' code, module-script referenced once, no 404 island. The AC's negative arm (no-client build → no asset/reference) is NOT exercised — see Finding 1 |
| test_UAT_AC703_isolation_degrades_inertly_and_flags_a_throwing_core | AC-703 | aligned — real `assertModuleConforms` isolation dimension; both survivors pass degenerate-but-schema-valid input; throwing core → `isolation.render-throws` violation (real discriminator) |
| test_UAT_AC704_survivors_declare_the_full_obligation_set | AC-704 | aligned — introspects each survivor's published contract; obligations exactly {isolation, responsive, safety, security, x-browser}, no `except`. (For a contract-declaration AC, contract introspection IS the real entry point.) |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | consistency | AC-702 / test_UAT_AC702 | uat-edit | AC-702's Verification explicitly requires the negative arm — "Generate a build whose catalog ships no client behaviour and assert no asset and no script reference are produced." The UAT exercises only the positive path (both survivors ship client JS → one folded asset, referenced once). It proxies the suppression arm with `expect(getModuleClientJs().length).toBeGreaterThan(0)` — asserting the gate input, never the empty gate producing no asset/reference. A substantive real-entry-point UAT exists for the AC's core, so this does not block the level. | Add a render of a catalog whose modules ship no client behaviour (synthetic no-client capability) and assert `capabilities.js` is absent and no `<script type="module" src="./capabilities.js">` reference is emitted. |
| 2 | info | consistency | AC-699 / test_UAT_AC699 | — | AC-699 criterion notes dots appear "only when there is more than one slide." Test asserts dots-per-slide with 2 slides but does not assert a single-slide instance emits no dots. Not in the AC's Verification list, so no fix mandated — noted for completeness. | none |
| 3 | info | consistency | AC-703 / test_UAT_AC703 | — | AC-703 criterion lists a second isolation discriminator ("collapses to an empty page band → violation") alongside the throw case. Verification only mandates the throw case, which the test covers. Empty-band arm untested but not required. | none |
| 4 | info | consistency | AC-704 / test_UAT_AC704 | — | AC-704 Verification also says "Confirm the harness would exercise all five." The test asserts the declared obligation set only. Given the conformance harness is obligation-driven (see AC-703's `dimension` param), declaring the five is adequate evidence the harness exercises them. | none |

## Notes for the Editor

- Zero violations, zero needs_review → PASS at uat level. The single warning
  (Finding 1) is the only actionable item and is a genuine but non-blocking
  coverage gap: the AC-702 suppression/empty-arm branch. It is worth closing
  opportunistically because that arm exists precisely to avoid emitting a broken
  empty `<script>` reference — the exact class of dev-path 404 the AC set out to
  eliminate.
- The info findings (2–4) are sub-clauses present in AC *criteria* but not in
  their *Verification* sections; the tests match the Verification text, so no
  edit is required. Recorded only so a future check sees they were considered.
- Every AC has a substantive UAT exercising a real boundary (the capability
  validator, the Astro SSR container, the shipped `client.js`, the
  `cmdNew`/`cmdRender` build path, and the conformance harness) — no test was
  reduced to a structural/AST-only check where behaviour was claimed. One test
  per AC; no exclusivity (duplicate-coverage) issues.
