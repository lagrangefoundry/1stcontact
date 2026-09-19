---
uid: acceptance_criterion-d513b7e4
id: AC-1820
type: acceptance_criterion
title: Every bundle member written through the store reads back as the artifact that
  went in, identically on every backing
created_by: martin-github@westhead.me
created_at: '2026-09-19T13:36:52.692951+00:00'
updated_at: '2026-09-19T13:36:52.692951+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-177897a0
  kind: behavior
  regression_only: false
---

## Criterion

A bundle's members survive a write-then-read through the store as the artifacts
that went in, and do so identically on every backing the contract has (the
operator's own reference tree, the deployment's object storage, and an in-memory
one).

Concretely, for a bundle written with all of them:

- the capture record, the multi-viewport oracle, the folded L1 document, the
  recovered form model and the structural hints each read back **equal** to what
  was written — as parsed artifacts, not merely as bytes of the same length;
- the full-page screenshot, each per-width ladder screenshot and each mirrored
  subresource read back as the bytes written;
- the mirrored-asset list reports exactly the subresources the capture record
  declares;
- a ladder screenshot is requested by width, and a width the ladder never shot
  reads as absent rather than falling back to another width;
- the member keys a bundle reports are **sorted** and **forward-slashed**
  regardless of the host's path separator, and can be narrowed to those under a
  given prefix;
- the per-width ladder member carries the same key on every backing
  (`screenshot-<width>.png`).

## Verification

One body of assertions is written once and run against each backing in turn,
including from inside the deployed runtime for the object-storage one. Write
every member through the bundle codec, then read each back and assert equality of
the parsed artifact; assert the key list is sorted, prefix-narrowable, and
contains the ladder key for a width that was shot and not for one that was not.
A backing that answers differently fails the same assertion in its own runtime.
