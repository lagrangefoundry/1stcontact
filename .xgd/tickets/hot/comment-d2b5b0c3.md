---
uid: comment-d2b5b0c3
id: COMMENT-685
type: comment
title: Claude response for reconciliation_uat_generation report
created_by: xgd
created_at: '2026-08-06T01:25:50.492833+00:00'
updated_at: '2026-08-06T01:25:50.492833+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-f379333d
  kind: note
---

No duplicate test names across the suite. All six new UATs pass, and the surrounding L1 regression scope is green.

```
UATs generated for story story-d0a8cfad (plan item 1 of 12)

Story: story-d0a8cfad
Test file(s) created:
  - tests/reconciliation-l1-shared-axis-groups.test.ts

Tests written: 6
Tests passed: 6
Tests failed: 0

test_files_created:
  - "tests/reconciliation-l1-shared-axis-groups.test.ts"
```

**Coverage decision.** The story has 17 ACs. Twelve already carry passing reconciliation UATs in `tests/reconciliation-l1-substrate.test.ts` (AC-682/683/684/686/687/688/723) and `tests/reconciliation-l1-language.test.ts` (AC-725/726/727/728) — all marked `uat_coverage: pass`. The prompt forbids modifying existing test files and forbids extras, so I wrote UATs only for the six ACs without passing coverage:

| AC | Test | What it pins |
|---|---|---|
| AC-685 (`uat_coverage: fail`) | `test_UAT_AC685_structured_axis_and_resource_table_payloads_emit_no_raw_css` | The criterion's *second* paragraph, which the existing AC-685 test does not reach: payloads in gradient stops, border/shadow/overlay colours, background-image URL, mask/transform fields, and font-face family/source emit no `@import`, `javascript:`, `expression(`, or `</style>` — and unsafe URLs / non-hex colours are absent rather than emitted |
| AC-801 (new) | `test_UAT_AC801_one_container_carries_both_the_surface_and_its_layout` | Painted box + laying-out container vs. one painted container: one fewer `<div>`, one rule carrying both paint and `display/gap`; a slot paints its own frame |
| AC-802 (new) | `test_UAT_AC802_shared_groups_accepted_identically_and_strictly_on_every_kind` | All 9 node-level groups × all 11 surface axes × 6 kinds accepted; unknown key refused on every kind; per-kind fields still exclusive |
| AC-803 (new) | `test_UAT_AC803_measured_run_emits_its_width_and_the_gate_narrows_the_frame` | Run measure emits `width`/`min`/`max`, is opt-in, wrapper ≡ direct in the analytic gate at 1440 and 320, measured run predicted taller, cap inert when narrow, folded run untouched |
| AC-804 (new) | `test_UAT_AC804_measured_slot_emits_its_width_and_needs_no_wrapper` | Slot sizing emitted on the seam's own element, mounted module measured through it, wrapper form has one more element at the same 520px |
| AC-805 (new) | `test_UAT_AC805_background_handles_resolve_site_local_on_every_kind_or_are_reported` | `backgroundImageUrl` rewritten to `/assets/…` on container, slot and text run; rendered page requests nothing from the captured origin; unmirrorable handle reported in `unmirrored` |

Two self-corrections were needed, both in the AC-685 test and both mine, not the code's: I had asserted `</style>` and `body {` absent from `renderL1Page` output, but those are the page shell's own `<style>` block and the renderer's `html, body` reset. Retargeted to the payloads' own signatures (`} body {`, `.x {`, `display:none`) plus an exact-one-`<style>`-pair check.

The five new ACs are covered today by free-coded tests (`req97-text-measure.test.ts`, `req98-uniform-surface-axes.test.ts`, `req105-node-axis-groups.test.ts`) still named `test_UAT_FC_REQ-*`. Those remain on disk — retiring or renaming them is the reconciliation review step's job under the FC orphan invariant, not this one's.
