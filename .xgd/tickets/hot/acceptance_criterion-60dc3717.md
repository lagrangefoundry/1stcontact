---
uid: acceptance_criterion-60dc3717
id: AC-1657
type: acceptance_criterion
title: What the declaration states is what the knowledge base selects, not a copy
  fixed beside it
created_by: martin-github@westhead.me
created_at: '2026-09-11T03:30:28.735048+00:00'
updated_at: '2026-09-11T03:43:40.387429+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-5281f009
  kind: behavior
  regression_only: false
---

## Criterion

What the declaration states is what the knowledge base selects. The knowledge
base a host opens reports the corpus, the source and the landscape mode the
declaration file carries, rather than values fixed independently of it — so
changing the declared corpus changes what the client's knowledge base actually
holds.

A declaration standing beside a hand-built copy is worse than no declaration: an
operator edits the file, the edit changes nothing, and every reviewer afterwards
reads the file as authoritative.

## Verification

Open the client knowledge base through the ordinary path a host uses, and assert
the corpus kinds, the source and the landscape mode it reports match the shipped
declaration file read independently — comparing against the file's contents
rather than against the same literals restated in the test.