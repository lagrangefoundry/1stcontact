---
uid: report-accb91dc
id: REPORT-3727
type: report
title: 'Fix Framework Substrate: L1 Layout, Values & Behavior Modules (ac) — attempt
  8'
created_by: xgd
created_at: '2026-09-10T12:02:49.801291+00:00'
updated_at: '2026-09-10T12:02:49.801291+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-ae9d65d6
  level: ac
  fixes_applied: 8
  progress_made: true
  needs_more_work: false
  violations_remaining: 0
  anchor_report_uid: report-e37a6b4a
---

# Fix Summary — Framework Substrate: L1 Layout, Values & Behavior Modules (ac)

**Attempt**: 8
**Fixes applied this call**: 8
**Violations remaining**: 0
**Needs more work**: false

All five violations and the one warning from report-d3e53eaf are addressed in this
call. The two clusters the assessor identified were applied together as instructed:
findings 1+5 (STORY-82's two ACs plus its body) in one pass, and findings 2/3/4 (the
three REQ-93 `ac-add`s) in another.

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| 1 | ac-edit | AC-718 (`acceptance_criterion-f3328e22`) | **Finding 1.** Repointed from the deleted `intro`/`submit` slots to the REQ-96 shape: no aesthetic dial survives; the whole presentation is one L1 subtree in the **required `form`** slot with a `control` leaf per `config.fields` entry plus the optional `submit`; `label`/`honeypot`/`turnstile` are invariant and never bindable; the headline "compact placeholder-labelled" promise is `config.fields[].labelMode` (a captured a11y fact, not a dial), with the accessible name emitted either way. Written as the **reproduction-treatment** claim with an explicit scope note deferring the contract to STORY-85 AC-701 and the axes to STORY-83, per the assessor's exclusivity warning. Retitled to post-REQ-87 vocabulary. Cleared the deprecation: `status: pending → active`, `uat_coverage: deprecated → pass`, and the non-schema `lifecycle: deprecated` field removed. |
| 2 | ac-edit | AC-719 (`acceptance_criterion-da7c62ec`) | **Finding 5.** "(or a named overlay role)" → "(or a reference to a site palette entry)". Also cleared the stale `status: pending` on a plainly live criterion (`uat_coverage: pass`, passing UAT). |
| 3 | story-body-edit | STORY-82 (`story-46e3b3c7`) | **Finding 5.** Both occurrences of the retired overlay-role phrase corrected — the REQ-84 bullet ("colour / border / opacity literals (or, for colour, a reference to a site palette entry)") and the Technical Context bullet. Added a sub-bullet recording the supersession explicitly: REQ-114 retired the closed colour-**role** vocabulary, the matrix asserts its absence positively at AC-935, and the surviving overlay is a free-form-named palette reference (AC-928). Everything else preserved verbatim. |
| 4 | ac-add | AC-1622 (`acceptance_criterion-b796e4c7`), STORY-83 | **Finding 2.** "A mounted slot emits its behavior fragment verbatim; an unmounted one stays the inert placeholder." Covers both emitted states, the identical seam markup/rule across them (so mounting stays invisible to AC-804's measure), no cross-talk for an unmatched `mounts` key, and states the carve-out's two preconditions as the criterion's own scope — framework-rendered markup whose instance values already cleared the module's sinks, and a binding proved by the page validator (AC-1623). |
| 5 | ac-add | AC-1623 (`acceptance_criterion-5334b71f`), STORY-85 | **Finding 3.** "Page-level slot binding: every mounted module names a live, unique seam, and each failure carries a path." All five rejected shapes with their error paths (four at `modules/N/slot`, the duplicate-name case at `l1`), the rule's one-directional statement, and both legal states — both-empty and the orphan seam. |
| 6 | ac-add | AC-1624 (`acceptance_criterion-26894f8d`), STORY-85 | **Finding 4.** "Conformance obligations are unweakened inside a seam: mountInL1 runs the same five dimensions." Covers the same-five-dimensions claim, the non-interfering host (a keyframe at every probed width so the wrapper can never be what overflows), the proof the mode really mounts, and the consequence — conforms standalone, overflows pinned, still a violation. |
| 7 | ac-edit | AC-1144 (`acceptance_criterion-51c333aa`) | **Finding 6 (warning).** Removed the fourth bullet restating shade↔alpha composition and its near-identical verification sentence; replaced with a cross-reference to AC-930, which owns that claim. AC-1144 keeps the shade axis itself (continuity, Oklab, verbatim zero, endpoint validation). AC-930 untouched. |
| 8 | uat-edit | `tests/reconciliation-reproduction-treatments.test.ts:170-192` | Extended the existing `test_UAT_AC718_contact_form_presentation_via_config_and_l1_controls` with the `labelMode` clause finding 1 added to AC-718: renders the same config at `labelMode: 'placeholder'` and at the default `visible`, asserting the `placeholder` attribute appears only in the first while the associated programmatic `<label>` is emitted in both, plus that the enum is behavioural config and the three invariant controls are declared invariant. **Passes** (`npm test -- tests/reconciliation-reproduction-treatments.test.ts` → 2/2 passed); `tsc --noEmit` reports nothing on the file. Without this, AC-718's new criterion would have outrun its evidence. |

## Code Edits

None. No production code was touched this call — consistent with the assessor's
note that findings 2/3/4 need no code and no test change, only criteria.

## UAT coverage on the three new ACs

AC-1622 / AC-1623 / AC-1624 were created with `uat_coverage` unset. Their evidence
already exists and passes, but under intent-bound names rather than `test_UAT_AC<N>_`:

| New AC | Existing evidence |
|---|---|
| AC-1622 | `tests/req93-l1-slot-mounted-behaviors.test.ts:349` — `test_UAT_FC_REQ-93_mounted_fragment_replaces_the_inert_placeholder` |
| AC-1623 | `tests/req93-l1-slot-mounted-behaviors.test.ts:154` — `test_UAT_FC_REQ-93_unresolvable_bindings_fail_with_a_machine_readable_path` (plus the accept case at `:145`) |
| AC-1624 | `tests/req93-l1-slot-mounted-behaviors.test.ts:415` — `test_UAT_FC_REQ-93_mounted_behavior_carries_its_conformance_obligations` |

I deliberately did **not** set `uat_coverage` on them: that field is owned by the
uat-coverage check/fix pair, and binding the evidence is a `uat`-level decision —
whether to rename these three tests to `test_UAT_AC<N>_` (which drops their REQ-93
intent binding) or to add AC-named tests alongside. Each new AC also states one
clause the existing test does not yet reach: AC-1622's "seam emitted identically in
both states" (the current test asserts the attributes but not the rule), AC-1623's
orphan-seam legal state, and AC-1624's conforms-standalone-but-overflows-pinned
fixture. Flagging these for the uat phase rather than silently marking them covered.

## needs_review Items Forwarded

None. Every finding in report-d3e53eaf carried an actionable resolution category.

## Assessor note acted on

The report's observation that STORY-82's two ACs both carried `status: pending`
while all 103 siblings were `active` was fixed while there (items 1 and 2) — it was
stale metadata, not a lifecycle statement. STORY-82 now has two live, non-deprecated
ACs, one per half of its own title.
