---
uid: comment-79f4b85f
id: COMMENT-2533
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-09-10T12:57:37.008389+00:00'
updated_at: '2026-09-10T12:57:37.008389+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-6de02f6a
  kind: note
---

**REPORT-3734 (`report-6de02f6a`) — FAIL: 1 violation, 3 warnings, 0 needs_review.**

## What I did

Loaded all 108 ACs across the capability's 7 stories (105 active, 3 pending), indexed every `test_UAT_AC<n>_*` definition in the repo, and **ran 21 of the 22 test files** rather than reasoning statically.

**Attempt 7's work all holds.** I re-verified each of report-96284e49's seven findings independently: AC-685 narrowed to DOC-2 §2's Layer-2 families; AC-1009/1011/1012 split into engine-free + `it.runIf` arms (the file now reports 4 passed / 3 skipped, the lower pass count that *is* the fix); AC-702's `doUnmock` path corrected; AC-930 retargeted off STORY-97's duplicate and net-additive; AC-686/687 clauses re-attributed to AC-849/850; AC-718's `slots.form.required` asserted. Coverage stays complete — all 105 active ACs have a definition.

## The one violation

Closing the 5-cycle AC-685 finding was substantively right, but the edit **relocated the closed-enum guarantee onto the envelope validator and delegated its evidence to AC-686 and AC-726 — neither of whose tests carries an enum case.** AC-686's `rejected` map (`tests/reconciliation-l1-substrate.test.ts:368-440`) has 11 entries covering ranges, colours, URL schemes, unknown keys and caps, and no enum; AC-726's are colour/URL/range only. A repo-wide search for an out-of-vocabulary enum payload returns nothing.

The code is fine — `packages/site-schema/src/l1/schema.ts` declares these as `z.enum` — so this is `uat-add`, not `code-issue`. But `render.ts` still interpolates enums raw, so Layer 1 is now the sole defence for enum axes, and it's the Security Policy §2 invariant that no UAT proves fires. One entry in AC-686's existing map closes it.

## Warnings

Two are the **same silent-engine-gate defect attempt 7 fixed in one file but not two others** — `test_UAT_AC727_*` (bare `if (!chromiumReady || !FONT_ASSET) return`, while both the AC and the file's own comment promise "skips cleanly") and `test_UAT_AC684_*` (`if (chromiumReady) {…}` around 30 assertions, in a file that already defines `itChromium` nine lines above). My 15-file run reporting **`73 passed | 0 skipped` in 1.52 s** is the evidence. Third is one word of retired REQ-87 vocabulary the fix's `grep -n capability` couldn't match in "capabilities".

Three UATs (AC-703, AC-888, the workerd project) remain unverifiable here — `listen EPERM` — and are flagged as environment, not findings.
