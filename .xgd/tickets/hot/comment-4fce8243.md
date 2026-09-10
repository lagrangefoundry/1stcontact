---
uid: comment-4fce8243
id: COMMENT-2495
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-09-10T08:11:45.328265+00:00'
updated_at: '2026-09-10T08:11:45.328265+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-642edd91
  kind: note
---

**REPORT-3696 (`report-642edd91`) — FAIL.** 1 violation, 1 warning, 0 needs_review.

**Intent ledger.** CAP-99's cumulative intent is exactly one intent: **REQ-131**, reconciled via BUNDLE-19 (`free_and_reconciled`, merged at `b18b859d`). A full-corpus sweep (3038 tickets — title scan, body search, and `REQ-131` back-reference grep) found no second intent adding to or retiring any of this capability's behaviour. REQ-160 reuses the cursor pattern for the *knowledge corpus*, is `draft`, and does not count. I read both halves of REQ-131 — the planning spec and the appended "As built" section — since the pinned decisions (500 records / 300 chars, per-site grain, actor attribution, the every-write-returns-the-count widening) live only in the second half.

**The violation.** REQ-131 Part 2 names four surface deliverables. Three are expressed in the story tree — the declared `ReadSite` read operation and the untrusted marking (AC-1264, AC-1265), and the `absences`-on-undo adjustment (story Out-of-scope/Undo). The other two are expressed nowhere: the **`overview` paragraph** ("the site can change under you between turns, here is how you find out") and the **`sequences` entry** (signal → read → act). Both shipped — `tools/generate/src/cli/ai/l1-surface.json` carries the paragraph *"Your user can change the site themselves, while you are working on it…"* and the sequence *"Pick up after your user has been editing"* (`list_changes` → `describe_page` → `get_l1`). So this is matrix drift, not a code gap: the story describes the signal being *delivered* but never the manual guidance telling the assistant what to do when it fires. AC-1266 covers the reminder line only. Resolution is `story-body-edit` — one additive sentence — then `ac-add` downstream.

**The warning** is the omitted no-op rule ("a copy save that changes no field returns the current count without appending"), present in REQ-131's "As built" and in AC-1254, but missing from the story's otherwise-complete Technical Context. Non-blocking.

Everything else aligned: the story's in-scope/out-of-scope bullets map 1:1 onto REQ-131's, all nine of REQ-131's ACs land on named ACs, the four cross-referenced capabilities exist and are what the story says, and the story's *"Divergence from the intent, recorded not absorbed"* bullet correctly carries the post-write-not-transactional divergence forward rather than absorbing it. I spot-checked the pinned decisions against code — `JOURNAL_WINDOW = 500` / `JOURNAL_TEXT_LIMIT = 300` at `tools/generate/src/store/journal-model.ts:74,77`, `1c changes` at `tools/generate/src/cli/index.ts:1367` — and matrix and implementation agree.

Read-only throughout; no tickets, tests or code modified.
