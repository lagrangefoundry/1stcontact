---
uid: acceptance_criterion-e026a081
id: AC-1658
type: acceptance_criterion
title: A fresh workspace is scaffolded the same client knowledge base the product
  ships, field for field
created_by: martin-github@westhead.me
created_at: '2026-09-11T03:30:29.666662+00:00'
updated_at: '2026-09-11T03:30:29.666662+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-5281f009
  kind: behavior
  regression_only: false
---

## Criterion

A checkout with no declaration file gets a complete one: the starting-point
declaration written for a fresh workspace declares the client's knowledge base
field for field as the repository ships it — the same corpus kinds, the same
absence of a source, the same landscape mode, the same description.

The same declaration is necessarily spelled twice, and the copy that only ever
runs on a workspace that has none is the copy nobody would notice going stale. A
fresh checkout given half a declaration has a client knowledge base that is
subtly a different knowledge base under the same name.

## Verification

Scaffold a declaration into an empty workspace, read it back, and assert its
client knowledge base entry equals the committed one field for field — not merely
that an entry of that name exists.
