---
uid: report-438eca76
id: REPORT-3283
type: report
title: Claude reconciliation_story_generation report
created_by: xgd
created_at: '2026-09-02T00:32:25.594642+00:00'
updated_at: '2026-09-02T00:32:25.594642+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_story_generation
  subject_uid: request-13a5e206
  plan_item_index: '3'
---

Story and criteria are in place and correctly parented under CAP-106.

**Grounding**: read the intent body (REQ-162) and its chat comment first — the comment's two unanswered questions were settled by the operator's "re-read the ticket", and the body settles both in favour of `reference` and `brief` each keeping their own type, which is what the code does. Then read `apps/control-app/src/tickets.ts:60-188` and the seven `material types` UATs in `tests/test_UAT_FC_REQ-162_ticket_store.workers.test.ts:228-362`.

**Four intent-silent behaviours formalized as decisions** (recorded in the story, not deferred): material/reference bodies optional pending extraction (AC-1497); a brief's body required and non-blank (AC-1496); the optional `site_slug` on material and reference — present in code, *not* exercised by the landed suite, so it will surface as an AC needing a UAT (AC-1498); and the chat-persistence consequence the intent only implies by asking for the merge (AC-1499).

**No intent/code contradiction** in this item, so nothing is flagged for the code-issue lever.

```
Story #3 created for reconciliation request-13a5e206

Story UID: story-e07c589b (STORY-128)
Title: Material Types: The Vocabulary Of What A Site Is Made From, With Rights And Provenance Stated Rather Than Inferred
Type: feature
Acceptance Criteria: 9 created (AC-1491 … AC-1499)

Progress: 3 of 4 plan items complete
```

One note for the driver: each `ticket create`/`update` reported `Push failed (may be offline)` — the proxy refused authentication. The commits are local and the tickets are correct on disk; only the remote push didn't happen.
