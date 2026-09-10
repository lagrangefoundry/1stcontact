---
uid: comment-d333f1be
id: COMMENT-2581
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-09-10T18:52:23.440003+00:00'
updated_at: '2026-09-10T18:52:23.440003+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-0cde712b
  kind: note
---

Report created and schema verified: **REPORT-3778** (`report-0cde712b`), `result: fail`, `report_kind: capability_validation`, `subject_uid: capability-f753cecd`, `level: uat`, violations 3, warnings 2, needs_review 0.

## Verdict: FAIL — 3 violations, 2 warnings, 0 needs_review

**Intent ledger is clean.** One story (STORY-100, `upgrade`), 43 active ACs, `intent_uid: BUNDLE-16`, `updated_by: BUNDLE-19`. Both bundles and all ten intents the tests cite (REQ-82/117/118/119/132/133/135/136/137/140) are `free_and_reconciled`. Nothing abandoned or deprecated, so Step 2.5's stale-vehicle case never triggered and no UAT rests on retired behaviour.

**Evidence validity passes.** All 43 ACs have named, substantive UATs — 53 tests across 7 files, every one driving real entry points (`run(argv)`, the builder origin over HTTP, bytes on disk). No internal mocking anywhere, no skipped/focused tests. Every finding is about a test's completeness against its own AC, never its shape.

**All three violations are the same defect shape:** an AC's `## Verification` names a contrast case, and the fixture supplies only one side of it.

1. **AC-1045** — the criterion says the site's palette entries travel back with a painted panel's answer; the test never reads `data.palette`, and its fixture declares no palette at all (`cmdNew`'s scaffold deliberately ships none). Implemented at `edit.ts:652` for every region kind, asserted only for a *run*.
2. **AC-1117** — "a run declaring no weight reports the lowest declared face, and re-posting it alongside new words changes the words alone." Every run in the typography fixture declares a `fontWeight`; the one that doesn't is in a faceless family and gets no weight field. Both halves live at `edit.ts:564` and `:1317` with no covering evidence.
3. **AC-1130** — "hue shift and blur are held under the same name, with no conversion." Neither is ever written through this surface in any in-scope file. That's precisely the `scale: 1` vs `scale: 100` split at `edit.ts:795-800`; the test's only mention asserts they're absent when unsubmitted, which cannot see a wrong scale.

I verified each against the implementation first — all three behaviours are already correct, so these are `uat-edit` repairs, not `code-issue`s. Warnings cover AC-1049 (two own-verification clauses, one proven cross-AC by AC-1270's test) and AC-1269 (shaded reference's render unasserted).

Exclusivity is clean: the seven multi-test ACs divide complementary ground, recorded as info rows rather than duplicates.

One caution flagged for the editor: these 43 ACs are densely cross-referential, several deliberately asserting the *absence* of a field a neighbour asserts the presence of, and the tests carry long comments explaining which counts were relaxed as later REQs grew field lists. Re-pinning any of those while fixing F1–F3 would falsify a currently-correct neighbouring AC.
