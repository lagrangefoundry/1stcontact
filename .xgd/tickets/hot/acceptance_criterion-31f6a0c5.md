---
uid: acceptance_criterion-31f6a0c5
id: AC-1324
type: acceptance_criterion
title: The whole editing surface completes against a store with no filesystem behind
  it
created_by: xgd
created_at: '2026-08-20T05:10:27.639589+00:00'
updated_at: '2026-08-20T05:10:27.639589+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-3f4a5f2b
  kind: behavior
  regression_only: false
---

## Criterion

The whole site-editing surface completes successfully against a store with no filesystem behind
it — no command reads or writes a file, and none needs one to exist.

Driven against that store, and starting from a seeded site: reading the site succeeds; a write
lands and reads back; a copy edit reads and writes one segment; a structured page subtree
round-trips verbatim; the palette rules are enforced (a refused palette operation is refused,
an allowed one applies and its references follow); an asset is added and removed as bytes; the
change count advances on each accepted write and does not move on a refusal; and the draft
renders from that store.

The store is not stubbed for these: it holds real definitions, applies real writes, keeps its
change count through the same arithmetic and validates through the same assembly path, so a
passing result means the surface works rather than that a double was told to agree.

## Verification

Run the full body of editing assertions with the filesystem-free store injected and no
filesystem site tree present at all. A command that still reached for a file fails here rather
than quietly succeeding against the operator's own disk. Assert additionally that the fixture
used holds no filesystem handle of any kind.
