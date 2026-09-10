---
uid: comment-7c6ef5f9
id: COMMENT-2498
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-09-10T08:27:05.156004+00:00'
updated_at: '2026-09-10T08:27:05.156004+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-cb2da564
  kind: note
---

**REPORT-3699** (`report-cb2da564`) — **FAIL**: 1 violation, 1 warning, 0 needs_review.

## What the ledger showed

CAP-99 has one story, STORY-115 (`feature`, 16 ACs). Four intents touch it, all counting toward cumulative intent, none retired:

- **REQ-131** (in BUNDLE-19, `free_and_reconciled`, merged `b18b859d74`) — the originating intent, plus its "As built" half pinning the four open decisions (gitignored `.journal.json`, 500 records / 300 chars, actor attribution shipped, per-site grain) and the one widening the spec didn't anticipate (`add_asset`/`write_image` also hand the count back).
- **REQ-142** (same bundle) — the async store port behind the journal.
- **BUNDLE-20** (`free_and_reconciled`) — re-homed the journal onto rows in the ported store.
- **BUG-39** (via BUNDLE-22) — test-double repair only.

## The violation

STORY-115's AC tree covers the journal's *mechanism* exhaustively — 16 ACs, every one matched by a `test_UAT_AC12xx_*` in `tests/reconciliation-draft-change-journal.test.ts` — and its *guidance* not at all.

In-scope item 6 of the story body is a whole deliverable: the manual gains the cross-cutting rule in its **overview** and a named **sequence** walking signal → read the changes → act. REQ-131 Part 2 asks for both verbatim. No AC claims either — AC-1264 covers only the operation's presence/absence by grant, AC-1265 its untrusted marking, AC-1266 the reminder line.

The behavior *is* implemented: `tools/generate/src/cli/ai/l1-surface.json:7` carries the overview paragraph, and the `sequences` array carries `"Pick up after your user has been editing"` (`list_changes → describe_page → get_l1`). Nothing asserts either — grepping for that text over `tests/` and `tools/` hits only the declaration itself. So this is `ac-add`, not `code-issue`.

The warning is the same omission's smaller half: REQ-131's revisited undo `absences` note (now citing `list_changes` for prior values) is also implemented and also unclaimed; it can fold into the same new AC.

Step 2.5 never triggered — no story or AC text names a delivery-vehicle ticket, and no intent in the ledger is abandoned, so nothing was escalated. Three of the six findings are `info` ledger entries, including that BUNDLE-20's storage move required no AC edit because all 16 are phrased mechanism-neutrally.
