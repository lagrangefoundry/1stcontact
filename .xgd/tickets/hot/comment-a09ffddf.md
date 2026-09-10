---
uid: comment-a09ffddf
id: COMMENT-2501
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-09-10T08:43:46.755180+00:00'
updated_at: '2026-09-10T08:43:46.755180+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-db91345c
  kind: note
---

**REPORT-3702 (`report-db91345c`) — FAIL: 1 violation, 1 warning, 0 needs_review.**

The matrix is not the problem. All 17 ACs under STORY-115 have exactly one substantive UAT each, all in `tests/reconciliation-draft-change-journal.test.ts`, with the scripted Anthropic client as the only double — no internal mocking, no duplicates, no drift between test and criterion. Coverage and exclusivity both hold.

**Violation 1 — AC-1266 has no evidence (code-issue).** I ran the suite on a clean tree: 16 passed, 1 failed. `test_UAT_AC1266` throws `TypeError: Cannot add property reminder, object is not extensible` at `tools/generate/src/cli/ai/host-core.ts:596`, on its *first* turn (test:750), before any assertion executes. The installed `@lagrangefoundry/ai` `Role` now calls `Object.freeze(this)` (`src/roles.js:404`) and carries `reminders` (plural, provider-resolved per turn via `assembleReminders`, `src/priming.js:454`) rather than a mutable `reminder`. The per-turn refresh mutates a sealed instance, so the push signal — the one behaviour the whole capability exists to deliver — is never sent.

Two things I corrected against the prior ac-level report, which called this REQ-146 collateral: `git log -S "role.reminder"` shows the line was introduced by REQ-131's own commit and only *moved* by REQ-146. It's upstream package drift arriving out-of-band, so no in-repo bisect will find it. And because the throw sits in `streamPrompt` ahead of `manager.promptStream`, **no session on this branch can take a turn at all** — the blast radius is the whole AI host, not just this UAT. I flagged that the fix must re-run the entire case rather than assume green after line 596.

**Warning 1 — AC-1263's Verification is stale (ac-edit).** It prescribes comparing two published snapshots byte-for-byte; REQ-149 made an unchanged publish a no-op, so that method is no longer executable. The test adapted correctly and documents why; the AC text didn't.

I did not attempt the temporary-fix-run-revert probe on `host-core.ts` — the check is read-only, and the finding is already confirmed by a failing test against real code.
