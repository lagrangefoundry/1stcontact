---
uid: acceptance_criterion-b39d0657
id: AC-1519
type: acceptance_criterion
title: One client's search reaches their own records only, and cannot be pointed at
  another account
created_by: xgd
created_at: '2026-09-04T03:19:39.992480+00:00'
updated_at: '2026-09-04T03:19:39.992480+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-bb91191c
  kind: behavior
  regression_only: false
---

## Criterion

A search of one client's knowledge returns results drawn from that client's records only. The
same query run for a second client returns none of the first client's records — not as a
low-ranked result, not at all — and no text taken from them, including the excerpt shown beside a
result.

The scoping is a property of the handle the caller was given, not of an argument the caller
supplies: there is no parameter on a search that can name a different account, so the isolation
cannot be defeated by passing the wrong value.

## Verification

Create two accounts. Give account A a record whose text is distinctive; give account B an
unrelated one. Bring both indexes up to date. Run one query, chosen to match A's text, for each
account: A's results contain that record; B's results contain neither the record nor any snippet
of its text. Inspect the search entry point for any argument by which a caller could name an
account other than the one its handle was opened for; there is none.
