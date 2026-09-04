---
uid: acceptance_criterion-c3fe4e44
id: AC-1529
type: acceptance_criterion
title: A conversation is re-indexed in batches, measured from a durable mark kept
  off the conversation
created_by: xgd
created_at: '2026-09-04T03:36:34.590590+00:00'
updated_at: '2026-09-04T03:36:34.590590+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-0fb17a68
  kind: behavior
  regression_only: false
---

## Criterion

A conversation is re-indexed in batches, never per turn, and the batching is measured against a
durable mark of how long that conversation was when it was last indexed:

- Growth since the mark that is **below** the configured threshold indexes nothing: the operation
  reports that no indexing was done, and reports how much the conversation has grown since the mark
  so a caller can see how close it is.
- Growth since the mark that reaches the threshold indexes the conversation: the operation reports
  that it did so, and the conversation's text is thereafter returned by a search of the client's
  knowledge on words that appear only in it.
- The mark then advances to the length just indexed, so the same growth is never counted twice: a
  further increase smaller than the threshold indexes nothing, even though the conversation is now
  far longer than the threshold in absolute terms.
- The mark is held with the client's knowledge, not on the conversation record: indexing a
  conversation leaves the conversation record itself unchanged, and the mark is still in force for a
  freshly opened handle to the same client's knowledge.
- A mark that cannot be read back is treated as "not yet indexed" rather than as a failure — the
  conversation is indexed again, which costs a pass and is never wrong.

## Verification

Record a conversation. Report growth just under the threshold and observe nothing was indexed and
that the reported growth matches. Report growth past the threshold, observe indexing happened and
that a search on a phrase unique to the conversation returns it. Report a further small increase and
observe nothing is indexed and that the mark equals the length at the last indexing. Re-open the
client's knowledge from scratch and observe the mark persists; inspect the conversation record and
observe no bookkeeping was written onto it. Corrupt the stored mark and observe the next report
indexes rather than errors.
