---
uid: acceptance_criterion-1038b70f
id: AC-2083
type: acceptance_criterion
title: 'Recapturing the same bundle name updates the same ticket: unchanged members
  (by content hash) write neither blob nor record, changed members replace and detach
  their superseded records'
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T01:51:22.908976+00:00'
updated_at: '2026-11-01T01:51:22.908976+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-31204812
  kind: behavior
  regression_only: false
---

## Criterion
Recapturing a bundle with the same bundle name updates the same `reference` ticket in place and never creates a second one. The ticket is found by bundle name, not by URL. On recapture:
- The ticket's title and body are rewritten from the new capture, including a body the client had edited.
- `reference.created` is `false`.
- A member whose bytes are unchanged (same content hash as the record that already holds it) gets no new blob and no new attachment record. Its existing record stays live.
- A member whose bytes changed gets a new attachment record, and the record it supersedes is detached (moved to the trash, not purged). Exactly one live record per member name remains.
- A member the new capture no longer holds has its record detached.

## Verification
1. Adopt a fixture bundle, then adopt it again unchanged. Assert there is still one `reference` ticket with that bundle name, no new attachment records or blobs were written, and every member is reported unchanged.
2. Change `screenshot.full.png` and adopt again. Assert one live `screenshot.full.png` record holding the new bytes, and that the previous record is detached and recoverable.
3. Remove an asset member and adopt again. Assert its record is detached.
4. Edit the ticket body by hand and adopt again. Assert the body is rewritten.
