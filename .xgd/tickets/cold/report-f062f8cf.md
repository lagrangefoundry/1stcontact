---
uid: report-f062f8cf
id: REPORT-730
type: report
title: Claude reconciliation_uat_generation report
created_by: xgd
created_at: '2026-07-22T20:03:54.721015+00:00'
updated_at: '2026-07-22T20:03:54.721015+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_uat_generation
  subject_uid: story-179b8c06
---

All 8 UATs pass. ESLint has no root flat-config (the quality plugin lints per-package; tests follow the identical import/cast patterns as the existing `req85-*.test.ts` files, and vitest's transform accepts the file cleanly). My file is consistent with the established test conventions.

## Completion Report

```
UATs generated for story story-179b8c06 (plan item 3 of 9)

Story: story-179b8c06
Test file(s) created:
  - tests/reconciliation-capability-modules.test.ts

Tests written: 8
Tests passed: 8
Tests failed: 0

test_files_created:
  - "tests/reconciliation-capability-modules.test.ts"
```

**One UAT per acceptance criterion**, each exercised at the real boundary against existing code (no runtime changes, no existing-test edits):

| Test | AC | Boundary exercised |
|------|-----|--------------------|
| `test_UAT_AC697_config_validated_against_typed_contract` | AC-697 | `validateCapabilityConfig` on survivor metas — valid + each single defect (missing-required, wrong-type, integer-range, off-enum, list-bounds, malformed list item) yields exactly the field-scoped violation |
| `test_UAT_AC698_slots_validated_as_l1_subtrees` | AC-698 | `validateCapabilitySlots`/`validateCapabilityInstance` — the structured-only security line (raw-markup rejected), required/optional, repeated bounds, array-vs-single, config∪slot union |
| `test_UAT_AC699_carousel_renders_l1_slide_track_from_config` | AC-699 | Astro container render — snap track, one slide per L1 subtree, `view`/`controls` chrome, no aesthetic dials |
| `test_UAT_AC700_autoplay_loop_ship_as_vetted_client_behaviour` | AC-700 | SSR markers + `advanceTrack`/`enhanceCarousel` with injectable timer — advance/wrap-on-loop, and one-slide/missing-track/absent-timer isolation |
| `test_UAT_AC701_contact_form_renders_functional_form_with_l1_slots` | AC-701 | Container render — labelled typed controls, no-JS post form, honeypot + Turnstile, L1 intro/submit slots present vs plain baseline |
| `test_UAT_AC702_client_behaviour_ships_as_one_page_referenced_asset` | AC-702 | `1c` render pipeline (`cmdNew`/`cmdRender`) — one `capabilities.js` folding both capabilities, referenced once per page, no 404'd island script |
| `test_UAT_AC703_isolation_degrades_inertly_and_flags_a_throwing_core` | AC-703 | `assertModuleConforms(dimension:'isolation')` — degenerate survivors pass; a throwing core → `isolation.render-throws` |
| `test_UAT_AC704_survivors_declare_the_full_obligation_set` | AC-704 | Introspect `conformance.obligations` = exactly {safety, security, x-browser, responsive, isolation} |

**Two grounding notes** (behaviour matched AC + code, nothing weakened):
- **AC-697** — neither survivor has an *integer* config field, so the typed contract's integer-range rule is proven via a representative capability meta through the same `validateCapabilityConfig` path (all other defect kinds use the real survivor metas).
- **AC-702** — the "no client behaviour → no asset/reference" negative arm is counterfactual for the shipped catalog (both survivors ship `client.js`, and `getModuleClientJs()` reads the real registry, not an injectable resolver). The test proves the positive comprehensively and asserts the emission is gated on `getModuleClientJs()` being non-empty (the guard whose empty arm suppresses both outputs).
