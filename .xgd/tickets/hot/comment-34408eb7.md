---
uid: comment-34408eb7
id: COMMENT-2499
type: comment
title: Claude response for fix_structural_validation report
created_by: xgd
created_at: '2026-09-10T08:30:38.216319+00:00'
updated_at: '2026-09-10T08:30:38.216319+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-b90a2271
  kind: note
---

Done — attempt 1 complete.

## What I did

The report's one violation and one warning were the same omission: STORY-115's AC tree covered the journal's *mechanism* exhaustively (16 ACs, all with UATs) and its *guidance* not at all. Both fold into one repair, exactly as the assessor's editor note directed.

**2 mutations:**

1. **ac-add** — created **AC-1621** (`acceptance_criterion-aa0adbc3`) under STORY-115, with a three-part criterion: the overview's cross-cutting rule (reaching the manual *through the projection of the declaration*), a named sequence whose first step is the change read rather than a page re-read, and the undo absence citing the change log while still declaring no undo. Field shape matches AC-1253…AC-1268 (`story_uid`, `kind: behavior`).

2. **uat-add** — authored `test_UAT_AC1621_the_manual_carries_the_rule_the_sequence_and_the_undo_note` in `tests/reconciliation-draft-change-journal.test.ts`, paired in the same call so the new AC isn't an immediate coverage gap. It uses the real `createL1Toolbox` against a real site, selects the overview paragraph and the sequence *out of `L1_DECLARATION` by wording* and asserts each is exactly one before requiring it in `manual()` — so the rule can't be satisfied by a preamble written beside the manual. It passes.

No production code touched — the assessor's "do not resolve this as `code-issue`" holds; all three surface elements were already present in `l1-surface.json` and match the story body word for word.

## Two things to flag

- **Pre-existing failure, not mine.** `test_UAT_AC1266` fails with `TypeError: Cannot add property reminder, object is not extensible` at `tools/generate/src/cli/ai/host-core.ts:596`. I verified it fails identically against `HEAD` (restored the file to a scratch path and ran it there), so it predates my edit. It's a runtime regression in the reminder write path, not an AC-tree defect — flagged for a later cycle rather than fixed here.
- **`uat_coverage` deliberately not set** on AC-1621: no sibling AC on this story carries the field, and it's owned by the `check`/`fix_uat_coverage` pair.

Completion report: **REPORT-3700** (`report-b90a2271`) — `progress_made: true`, `needs_more_work: false`, `violations_remaining: 0`. Control goes back to the assessor to verify.
