---
uid: comment-a13eda0f
id: COMMENT-789
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-08-07T19:00:39.653779+00:00'
updated_at: '2026-08-07T19:00:39.653779+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-962c67e7
  kind: note
---

Report created and verified. Working tree clean (the ticketing API auto-committed the report).

## Result: **PASS** — REPORT-1609 (`report-962c67e7`)

`violations: 0`, `warnings: 1`, `needs_review_count: 0`

**The finding:** CAP-88 is a *retired* capability with an empty story tree, and that is the correct end state — not drift. Attempt 1's fix (REPORT-1608) retired it exactly as REPORT-1599 finding 3 prescribed: `status=superseded`, `superseded_by_uid=capability-b4ac88fc` (CAP-89). There is no matrix element left under it that could be misaligned, and no intent whose asked behaviour was stranded.

**How I verified it, given the index is untrustworthy:** `xgd ticket list --filter fields.capability_uid=capability-105cfacf` *does* still return STORY-102 — so a list-based check would have manufactured a phantom story here. I re-derived the zero-story claim by fetching all 25 stories individually with `xgd ticket get --json` and reading `capability_uid` off each ticket. Zero point at CAP-88; STORY-102 sits under CAP-89 with its six ACs intact and `uat_coverage=pass`.

**Intent ledger:** two intents ever touched this scope — REQ-11 (original registry-only `asset list`) and REQ-118 (replaced it in place with the union listing), both `free_and_reconciled`. No later intent retires or re-homes the store. I traced all eight of CAP-88's scope/out-of-scope statements into CAP-89's body and confirmed the absorption was lossless — the three the attempt-1 fix added (handle vocabulary, usage kind, reachable-without-gesture) had genuinely been stranded before it ran.

**The one warning:** the stale search index. It's real and reproduced this run, but it's an XGD tooling defect — `xgd ticket rebuild-index` refuses to run from a branch worktree by design, so it cannot be fixed from this regression worktree. It has already been escalated to you twice (REPORT-1599 finding 4, REPORT-1608's forwarded `needs_review`). I deliberately classified it as a *warning* rather than `needs_review`: raising it again would fail this level and spin a fix loop with no available action. It needs a reindex from `xgd-working`.

Two things worth your attention beyond this scope: until that reindex happens, every capability→story survey will keep resurfacing this phantom; and `xgd ticket list --type capability --json` omits `superseded_by_uid` entirely, which is how CAP-83's half-retired state slipped through an earlier pass.
