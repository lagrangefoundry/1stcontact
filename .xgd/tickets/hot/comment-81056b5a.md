---
uid: comment-81056b5a
id: COMMENT-2378
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-09-09T23:44:43.127224+00:00'
updated_at: '2026-09-09T23:44:43.127224+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-6c3ed8d8
  kind: note
---

**REPORT-3584** (`report-6c3ed8d8`) — **FAIL**: 12 violations, 2 warnings, 0 needs_review.

## What the check found

Seven stories, 68 ACs. **Four stories are clean** — STORY-78, STORY-79, STORY-124, STORY-125. The violations sit on three stories in two shapes:

**Ten `ac-add` coverage gaps.** Nine are the directly predicted consequence of this cycle's story-level repair. The last ac-level report (`report-aec8af1b`, 2026-08-16) closed by naming the exact set that would become ac-adds "once the story bodies are repaired" — REQ-73's gap axis, BUG-22 split-control attribution, BUG-24 band-overlay, BUG-25 run geometry, BUG-16 offline re-extract, REQ-72 hexification, REQ-76 clustering, `--multi-viewport` — and told the next cycle to re-run after those fixes landed. They landed today (`report-7617e6fa`, 8 fixes, 23:32); the AC surface hasn't grown to match. All eight are here, plus REQ-64's `--collapse`.

**Two STORY-76 findings on their fifth identical filing** — AC-638's palette-role clause (REQ-114 retired it) and the missing surface-gradient capture-selection AC — plus one new consistency break the repair itself created: the body now puts "the authoring path in any live form" out of scope, which orphans the still-active AC-638 whose code is live.

I verified every finding against source at HEAD rather than carrying the prior report's text — each cites file:line (`validate.ts:130-134`, `extract.ts:1047`, `values-diff.ts:2493`, `fidelity.ts:309`, `reextract.ts:67-72`, and so on), and I re-read all intent statuses from the request/bug stores.

## One thing worth flagging beyond the report

Findings 6 and 7 have now survived five cycles, and there's a plausible mechanical reason. The code is correct — every gradient stop routes through `validateColor`, which rejects a palette role — but two comments within a few lines of it still carry the retired formulation: `validate.ts:131` ("A stop is a bare colour string (hex/role)") and `validate.ts:167-168` ("the same literal-or-role rule"). A fix pass that verifies the AC by reading nearby source instead of following the call graph would conclude AC-638 is already right and move on. I didn't file it as `code-issue` — the behavior matches what the matrix should say, only the comments are stale — but it's worth cleaning up outside this check.

STORY-124's stale `CAP-102` numeral, recorded as an open defect in the capability's History, is now fixed in the story body; that History note is moot.
