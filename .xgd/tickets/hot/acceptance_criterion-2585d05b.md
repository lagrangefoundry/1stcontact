---
uid: acceptance_criterion-2585d05b
id: AC-1655
type: acceptance_criterion
title: It reads the account's own records and its landscape is generated, naming no
  shipped corpus
created_by: martin-github@westhead.me
created_at: '2026-09-11T03:30:21.553047+00:00'
updated_at: '2026-09-11T03:30:21.553047+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-5281f009
  kind: behavior
  regression_only: false
---

## Criterion

The client's knowledge base reads the account's own records, and its landscape is
generated rather than authored. It names no shipped corpus at all — not even the
one it would default to — while the shipped knowledge base continues to name one.

Naming a source here, even a redundant one, is the edit that later points the
client's knowledge base at a mounted corpus and makes one client's knowledge
another's; declaring the landscape as authored would make the map pipeline refuse
to rebuild, which is correct for a release artefact and wrong for a corpus that
grows every day.

## Verification

Assert the declared client knowledge base carries no source key whatsoever and
declares its landscape as generated; assert the shipped knowledge base still
declares its shipped source. Open the client knowledge base and assert it resolves
against the account's record store.
