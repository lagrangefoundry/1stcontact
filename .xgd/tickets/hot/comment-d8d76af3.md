---
uid: comment-d8d76af3
id: COMMENT-2500
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-09-10T08:36:40.734653+00:00'
updated_at: '2026-09-10T08:36:40.734653+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-3180c22d
  kind: note
---

**PASS** — REPORT-3701 (`report-3180c22d`), 0 violations, 1 warning, 0 needs_review.

**What I checked.** CAP-99 has one story (STORY-115, `feature`) whose intent is BUNDLE-19 → **REQ-131** (`free_and_reconciled`). A store-wide search found no intent that retires or re-scopes it; REQ-146/REQ-142 touch its plumbing behaviour-preservingly. Step 2.5 isn't triggered anywhere — no story/AC text names a delivery vehicle, and no ledger intent is abandoned.

**Attempt 1's repair holds.** AC-1621 closes the guidance gap on all three parts. I verified independently rather than trusting REPORT-3700: the overview paragraph, the `list_changes → describe_page → get_l1` sequence, and the undo absence citing `list_changes` all exist in `l1-surface.json` and match the story body; the UAT at `tests/reconciliation-draft-change-journal.test.ts:617` is substantive (it selects the paragraph and sequence out of `L1_DECLARATION` by wording and asserts each is exactly one before requiring it in the manual) and passes when run. Coverage of the story body's in-scope list is now complete, exclusivity holds across all 17 ACs.

**One warning carried forward — a real code defect, reproduced.** `host-core.ts:596` assigns `role.reminder = …` onto a `lib.Role` instance that is no longer extensible, so `streamPrompt` throws `TypeError: Cannot add property reminder, object is not extensible`. AC-1266's UAT fails on that line on this branch — I ran it. The push signal is dead in production today.

I recorded it as a **warning**, not a violation, deliberately: AC-1266, its UAT and the story body all say the right thing; only the code disagrees, and the cause is upstream (REQ-146's move of the host into workerd changed how the role is constructed). That's not matrix-vs-intent drift, and a level=`ac` fixer making an unevidenced production edit is the wrong repair shape — attempt 1's fixer was right to decline it. It needs a bug ticket and a code cycle; I'm read-only at this level, so the report carries the reproduction and a pointer that `host-core.ts:583`'s comment still asserts the old "refreshed rather than re-registered" contract.
