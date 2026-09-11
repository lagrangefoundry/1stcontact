---
uid: report-fb30eaf3
id: REPORT-3888
type: report
title: 'Fix Site Authoring Beyond The Element Tree: Settings, Components, Page Metadata
  & Generated Images (story) — attempt 2'
created_by: xgd
created_at: '2026-09-11T03:11:02.428376+00:00'
updated_at: '2026-09-11T03:11:02.428376+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-2d32662d
  level: story
  fixes_applied: 5
  progress_made: true
  needs_more_work: false
  violations_remaining: 0
  anchor_report_uid: report-e37a6b4a
---

# Fix Summary — Site Authoring Beyond The Element Tree: Settings, Components, Page Metadata & Generated Images (story)

**Attempt**: 2
**Fixes applied this call**: 5
**Violations remaining**: 0
**Needs more work**: false

Both violations in REPORT (`report-f08cca9a`) were the same retired-palette-vocabulary drift
in two elements, and finding 3 recorded the AC half of the same drift. All three were repaired
in one pass, as the report asked. Finding 4 (warning, coverage) was also resolved: the
ownership question was decided in favour of CAP-94 on the evidence of REQ-130's own text.

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| 1 | story-body-edit | STORY-107 (`story-b3de4571`) Settings ¶ | **Finding 1 (violation).** Rewrote the illustration in entry vocabulary: "a colour palette **and its named entries**" (was "with its families and steps"); "an **entry** left unnamed is not silently deleted" (was "a family"). The merge rule itself is unchanged — object/object merges, list-or-scalar replaces, omitted group writes at top level, nothing newly validated. Per finding 5, the *depth* justification now rides on the theme's typography ("naming one field inside the theme's typography leaves the rest of that group standing") rather than on a palette, since a palette entry is one colour deep since REQ-137 and a guarded palette surface now exists at STORY-113. That is exactly what `test_UAT_FC_REQ_130_naming_one_setting_leaves_its_siblings_alone` (`:137`) already demonstrates. |
| 2 | story-body-edit | CAP-94 (`capability-2d32662d`) body | **Finding 2 (violation).** "palette **families**" → "palette **entries**" in the scope parenthetical. Second sentence also picks up the modal-reachability clause from finding 4, so capability and story say the same thing. |
| 3 | ac-edit | AC-1095 (`acceptance_criterion-3e72e4c7`) | **Finding 3 (warning).** Verification rewritten to entry vocabulary: "several **named entries, each one colour**"; re-write one entry and the others survive; the deeper-than-one-level merge is shown on theme typography. Criterion unchanged (it was already shape-neutral). Now reads as evidence of what the UATs at `tests/test_UAT_FC_REQ-130_beyond_l1.test.ts:118`, `:137`, `:162` actually do — those tests were already repaired for REQ-137 (`XGD_PALETTE` is a flat map of `{ value }` entries, `:105-110`), so the AC was behind its own test. |
| 4 | ac-edit | AC-1097 (`acceptance_criterion-411cb7f0`) | **Finding 3 (warning).** "a palette **family whose steps** are not the declared form" → "a palette **entry whose colour is not an opaque hex value**, or a navigation pattern the schema does not name" — the two refusals the UAT at `:185` actually performs (`{ ink: { value: 'red' } }` and `{ pattern: 'carousel' }`). Criterion unchanged. |
| 5 | ac-add | **AC-1650** (`acceptance_criterion-3eae0d6b`), new | **Finding 4 (warning, coverage).** Criterion: copy inside a component instance the assistant created is addressable and editable in the operator's click-to-edit modal, over the same `/api/copy` transport the browser uses. Body cites the existing evidencing UAT by name and line. |

Mutations 1 and the Components/Technical-Context half of finding 4 landed in a single
`ticket update` on STORY-107 (one write, two findings).

## Finding 4 — the ownership call, and why it should stop resurfacing

The report left this open across two story-level checks because it does not resolve capability
ownership. I resolved it toward **CAP-94**, on evidence rather than preference:

- REQ-130 (`request-ed6ba145`) — the originating intent for this capability — states it in its
  own body, under "⚠️ The operator's editor must not break" (`:146-153`): the modal's contract
  (`editCopyGet` / `editCopySet` / `copyFieldsOf`) is *"Untouched"*, and then **"Additionally
  proven rather than assumed: copy inside a component the assistant instantiated is addressable
  and editable in the modal."** The intent that created CAP-94 asks for this proof; it is not
  borrowed from REQ-117 / REQ-118.
- The evidencing UAT lives in this capability's own test file, under a describe block named for
  REQ-130 (`tests/test_UAT_FC_REQ-130_beyond_l1.test.ts:645`).
- Substantively it is a consequence of a claim STORY-107 already made on its own behalf — "what
  arrives is ordinary page content". The modal reaching it is that sentence being true from the
  other side, not a second capability's behaviour.

So the Components ¶ now carries the guarantee, AC-1650 states it, and a new Technical Context
bullet ("**The modal's reach into an instance is claimed here, not borrowed**") records the
reasoning and explicitly disclaims the modal's own contract as CAP-94's. That last bullet is
there so a future story-level check sees the ownership decided rather than re-opening it.

## Note for the uat_coverage check (not a gap I am claiming closed)

AC-1650 was created **without** a `uat_coverage` value, deliberately — that field is owned by
check/fix_uat_coverage, and setting it here would be manufacturing progress. It should map to the
already-passing `test_UAT_FC_REQ_130_copy_inside_the_component_is_addressable_and_editable`
(`tests/test_UAT_FC_REQ-130_beyond_l1.test.ts:670`); no new test needs authoring. I did not
execute that suite this call — it stands up a real builder over a socket and this sandbox denies
`listen`, and I changed no code or test, so there was nothing for a run to prove.

## Code Edits (if any)

None this call. Matrix-only: four ticket bodies edited, one AC created. No production code and no
test file was touched — the tests were already correct for REQ-137, which is precisely why the
matrix was the side in drift.

## Follow-ups for the assessor

| # | Item |
|---|---|
| 1 | **Re-run the `ac` level for CAP-94**, as finding 3 asked. The AC repairs are already applied here, so that run should confirm rather than discover — its last check (`report-10ed4fd2`) passed with the drift in place. It will also see AC-1650 for the first time. |
| 2 | AC-1650 needs `uat_coverage` bound by the coverage check (see above). |
| 3 | Findings 5, 6 and 7 were `info` with "none" as the suggested edit; 5's optional advice was taken (the merge illustration no longer leans on the palette). Nothing outstanding from them. |

## needs_review Items Forwarded

None. No finding in `report-f08cca9a` was categorized `needs_review`, and the one judgment call
(finding 4) was resolvable from REQ-130's own text without operator input.
