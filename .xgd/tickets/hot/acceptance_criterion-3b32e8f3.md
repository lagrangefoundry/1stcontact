---
uid: acceptance_criterion-3b32e8f3
id: AC-2303
type: acceptance_criterion
title: One business's message records are never visible or changed through another
  business's reads
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-04T18:03:35.386717+00:00'
updated_at: '2026-11-04T18:14:34.373650+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-219b4217
  kind: behavior
  regression_only: false
---

## Criterion
The per-contact messages read and the bounced-contacts list in business A return only records stored in business A. A contact id whose messages live in business B gets an empty list when asked for in business A, and B's bounced contacts never appear in A's bounced list.

## Verification
Seed businesses A and B, each with a bounced message for a different contact. In A's scope, read messages for B's contact and assert an empty list. Read A's people list and assert its bounced set contains only A's contact.