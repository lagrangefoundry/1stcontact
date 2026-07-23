---
uid: report-fc297865
id: REPORT-788
type: report
title: 'Capability-Intent Alignment: Capability Module Contract & Catalog (level=uat)'
created_by: xgd
created_at: '2026-07-23T06:51:58.495289+00:00'
updated_at: '2026-07-23T06:51:58.495289+00:00'
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

## Cumulative Intent Considered

At `uat` level the AC bodies are the working reference (story and ac cycles ran
first and passed — REPORT-787). Intent history was consulted only to confirm the
ac-level warning was not a symptom of drift; it is not. The single reconciled
intent bundle stands unchanged.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUNDLE-7 (bundle-31e474b9; REQ-63+REQ-79+REQ-82+REQ-83+REQ-84 +2) | free_and_reconciled | merged @ edeb1c2c | Framework pivot: module reframed as capability (vetted core + typed config + L1 slots + conformance incl. isolation); carousel v1→v2, contact-form v2→v3; shipped-client-JS asset | YES |

## Alignment Ledger

CAP-72 → STORY-85 (story-179b8c06) → 8 active ACs (AC-697…AC-704). Every AC has
exactly one UAT in `tests/reconciliation-capability-modules.test.ts`, each
exercising a real boundary (validator / Astro SSR container / `client.js` /
`tools/generate` render pipeline / conformance harness) — no AST-only or
structural no-op tests.

| Element (AC) | UAT | Outcome |
|---|---|---|
| AC-697 config-validation (acceptance_criterion-145872b3) | `test_UAT_AC697_config_validated_against_typed_contract` | aligned — valid→[]; one defect per case (missing-required, wrong-type, int-range, off-enum, list-bounds, itemSchema recurse) asserts exactly the field-scoped violation via real `validateCapabilityConfig` |
| AC-698 slot-L1-security-line (acceptance_criterion-7761b6dd) | `test_UAT_AC698_slots_validated_as_l1_subtrees` | aligned — valid subtrees→[]; raw-markup string + arbitrary object rejected as "not a valid L1 subtree"; required/optional, min/maxItems, array-vs-single both directions, config∪slot union all exercised |
| AC-699 carousel presentation/config (acceptance_criterion-f96f9925) | `test_UAT_AC699_carousel_renders_l1_slide_track_from_config` | aligned — real SSR: scroll-snap track, one `data-l1-slot="slide"` per subtree with verbatim content, view-single/multi/peek sizing, dots-per-slide vs none, and asserts zero aesthetic dials on the contract |
| AC-700 carousel autoplay/loop client (acceptance_criterion-9aad6ef1) | `test_UAT_AC700_autoplay_loop_ship_as_vetted_client_behaviour` | aligned — opt-in markers only when configured; drives real `advanceTrack`/`enhanceCarousel` (one slide/tick, wrap only under loop) and the three isolation degradations (one-slide, missing track, absent timer) |
| AC-701 contact-form functional + L1 slots (acceptance_criterion-742bed6d) | `test_UAT_AC701_contact_form_renders_functional_form_with_l1_slots` | aligned — real SSR: labelled control/type/required per field, post form at safe endpoint, hidden off-tab honeypot + Turnstile mount, intro/submit L1 slots present-vs-baseline |
| AC-702 folded client asset (acceptance_criterion-a2c7925e) | `test_UAT_AC702_client_behaviour_ships_as_one_page_referenced_asset` | aligned on the positive arm (real generate: one `capabilities.js` folding both capabilities, one `type="module"` ref/page, no 404 island script); negative-emission arm not exercised — see Finding 1 |
| AC-703 isolation conformance (acceptance_criterion-9a05baf2) | `test_UAT_AC703_isolation_degrades_inertly_and_flags_a_throwing_core` | aligned — degenerate-but-schema-valid input passes on both survivors; a throwing core is flagged `isolation.render-throws`, proving the dimension is a real discriminator |
| AC-704 five-dimension declaration (acceptance_criterion-ccefcbab) | `test_UAT_AC704_survivors_declare_the_full_obligation_set` | aligned — both survivors' contracts enumerate exactly {safety, security, x-browser, responsive, isolation}, `except` undefined; introspective shape is exactly what this declaration-AC calls for |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | coverage | AC-702 (acceptance_criterion-a2c7925e) / `test_UAT_AC702_*` | uat-edit | AC-702's Verification explicitly requires the negative branch — "Generate a build whose catalog ships no client behaviour and assert no asset and no script reference are produced." The UAT proves only the positive arm and asserts `getModuleClientJs().length > 0` (the gate is truthy), never the suppression arm (empty client-JS → no `capabilities.js`, no `<script>` ref). Architecturally the fixed catalog always ships client JS, so the branch cannot be hit without a stub. | Extend the UAT to drive the suppression arm via an injected empty `ModuleResolver` / stubbed `getModuleClientJs`, asserting neither asset nor script reference is emitted; or, if held architecturally infeasible, record that explicitly on AC-702 so the untested branch is not read as covered. |
| 2 | info | coverage | AC-703 (acceptance_criterion-9a05baf2) | — | The criterion names two isolation discriminators (core throws, OR core collapses to an empty page band); the UAT drives only the throwing-core arm. The AC's Verification asks only for the throwing case, and that arm already proves the dimension is a genuine discriminator, so intent is satisfied. | none |
| 3 | info | exclusivity | AC-700 vs AC-703 | — | Both touch "isolation", but at different layers (AC-700 = client-side `enhanceCarousel` defensive degradation; AC-703 = render-level conformance harness). Distinct scenarios and shapes — not redundant. | none |

## Notes for the Editor

- One substantive UAT per active AC; all exercise real entry points (no
  AST/structural-only tests), so the evidence set is valid at this level.
- Finding 1 is the direct UAT-level echo of the ac-level warning in REPORT-787
  (the contact-form/negative-emission surface the ACs under-express). It does not
  block the level (a substantive UAT covers AC-702's primary behaviour); it is
  the opportunistic repair target if the fix loop fires. No drift from intent.
