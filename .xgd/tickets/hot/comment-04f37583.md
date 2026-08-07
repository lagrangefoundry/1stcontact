---
uid: comment-04f37583
id: COMMENT-790
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-08-07T19:05:25.193438+00:00'
updated_at: '2026-08-07T19:05:25.193438+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-5746c198
  kind: note
---

**Result: PASS** — REPORT-1610 (`report-5746c198`), 0 violations, 1 warning, 0 needs_review.

## What I found

CAP-88 has **no AC tree to check, because it has no story tree** — it is a retired capability (`status: superseded`, `superseded_by_uid: capability-b4ac88fc` → CAP-89). The ac-level check set is empty, so consistency, coverage and exclusivity hold vacuously.

I did not take the prior report's word for that. Because REPORT-1599/1609 established the ticket search index is stale for this capability, I rebuilt the check set from authoritative state:

- **All 25 stories** fetched individually via `xgd ticket get --json` — **zero** carry `capability_uid = capability-105cfacf`. Four sit under CAP-89 (STORY-92/93/97/102); the other 21 account fully across seven live capabilities.
- **All 50 ACs** fetched individually — every `story_uid` resolves to a live story, **zero orphans**, none under CAP-88, and no AC body or field mentions CAP-88.
- CAP-88's retirement fields confirmed directly off the ticket.

Nothing is stranded at AC level. REQ-118's asks live as six active ACs (AC-1018…AC-1023, all `uat_coverage=pass`) under STORY-102, which now hangs off CAP-89 — where the ac-level check **has already passed** (REPORT-1602), along with uat level (REPORT-1605) and UAT coverage (REPORT-1606). Re-assessing them here would file a duplicate against the wrong subject.

## The one warning, and why it isn't `needs_review`

The stale-index defect reproduces again: `xgd ticket list --filter fields.capability_uid=capability-105cfacf` still returns STORY-102. **At ac level its blast radius is bigger than at story level** — a walker that trusts the filter resolves the phantom story's six ACs too, so AC-1018…AC-1023 get double-counted, once under CAP-89 where they belong and once under a retired capability.

It's an XGD tooling bug, not matrix drift, and `xgd ticket rebuild-index` refuses to run from a branch worktree by design — so it is unfixable from this regression worktree. Classifying it `needs_review` would fail the level and spin a fix loop with no available action, so I recorded it as a warning, consistent with the story-level treatment. This is now its **third** escalation (REPORT-1599, 1608, 1609); it should be cleared from `xgd-working` before the next structural pass, since every capability→story→AC walk depends on it.

No tickets, tests or code were modified; working tree is clean.
