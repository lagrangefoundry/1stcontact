---
uid: comment-15f11953
id: COMMENT-1092
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-08-16T08:25:04.395506+00:00'
updated_at: '2026-08-16T08:25:04.395506+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-d0196843
  kind: note
---

Report **REPORT-2093** (`report-d0196843`) created — **FAIL**, 3 violations / 3 warnings / 0 needs_review. Schema verified.

## What I found

**The cascade precondition wasn't met.** The story-level cycle ran today at 08:14 (`report-6b02087e`) and returned FAIL with 4 violations — and no story has been edited since Aug 12. So the story bodies I'm supposed to use as reference are provably wrong in the exact places this level re-detects. I consulted intent directly there rather than inheriting the error, and sequenced every finding accordingly.

**Violations (all three are re-detections, not new drift):**

1. **AC-718** — unchanged since 2026-08-09T05:40, all four drifts intact: retired `capability` runtime type (code is `BehaviorMeta`/`kind: 'behavior'`, `meta.ts:28`), retired `intro`/`submit` slots (REQ-96 left one required `form` slot, `meta.ts:58-61`; `submit` is now a control, `:68`), stale config set (missing `submitLabel`, `labelMode`), and a flat negative that REQ-93 falsified.
2. **AC-719** — still says a colour is a literal "(or a named overlay role)". REQ-114 deleted that vocabulary; `palette.ts:55-60` is free-form kebab-case, and the only `role` hits in the L1 schema are REQ-106 navigation roles. Two sibling ACs assert the opposite *as criteria*.
3. **REQ-93 coverage gap** — a whole `free_and_reconciled` intent with live code (`schema.ts:469-599`, all five rejections; `render.ts:1816/1847/2119`; `mountInL1` in `tools/generate/src/conformance`), 10 passing UATs, and zero ACs. Term sweep across all 100 CAP-70 ACs: no hits for `moduleInstance`, `pageSchema`, `double-bound`, `orphan`, `mountInL1`.

## The part worth your attention

Findings 1 and 2 are now the **fourth consecutive cycle** raising the same two ACs, byte-identical each time. Three cycles prescribed `ac-edit` and three produced no edit. I think I found why, and I changed the recommendation:

**A faithful edit of either AC has no destination — it lands on top of a sibling that's already correct.** A fixed AC-718 would restate AC-701 nearly clause for clause; a fixed AC-719 would restate AC-716 + AC-928. Corroborating: AC-718 and AC-719 are the **only 2 `pending` ACs among all 424 in the project**, and STORY-82 is the only story here with `uat_coverage: stale`. So I've recommended **deprecate-and-fold** instead of edit, which is the action shape that actually terminates. If the next cycle re-prescribes `ac-edit`, expect a fifth no-op.

Two other things flagged for the editor: the REQ-93 evidence already exists but is named `test_UAT_FC_REQ-93_*` rather than `test_UAT_AC<n>_*`, so the uat cycle running next won't credit it to any AC — authoring the finding-3 ACs and renaming those 10 tests closes both gaps in one pass. And finding 3 is **blocked** behind the unrepaired story-level fix, since an AC can't assert behaviour its story body denies.

I also scanned the 18 intents created since the last ac cycle: all but REQ-136/REQ-128 (already covered) and REQ-137 (imminent, raised as warning) belong to the builder/control-surface capability. No new ac-level gap from them.
