---
uid: request-dbdc904a
id: REQ-125
type: request
title: Complete DOC-30 — the L1 control surface API design and its gap list
created_by: xgd
created_at: '2026-08-08T21:14:37.419676+00:00'
updated_at: '2026-08-08T21:14:37.419676+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
---

# Complete DOC-30 — the L1 control surface API, and the gap list

Take **DOC-30** (`doc-aca10bce`) from draft to a design record that specifies the surface and
states exactly how far today's code is from it.

## Done when

Requirements R1–R7 are each specified concretely — operation naming, declared input/output
schemas as data, error taxonomy with caller-facing meanings, read/write classification,
addressing contract, documented semantics, versioning, declared absences.

And the document ends with the **itemised gap list**: per requirement, what `edit.ts` already
satisfies and what is missing. That list is the deliverable that scopes the build request, and
it cannot be written in advance — the gap may be modest, since the single write path already
exists and `CommandError` already carries code, path and hint; or substantial, once declared
schemas, output contracts and a version are added.

## The acceptance bar for the declaration format

A usable tool manual must generate from the API declaration **with no prose written in the
tooling configuration**. If the manual needs hand-written explanation to be usable, the
declaration is underspecified and config will drift toward carrying the difference.

## Preserve

`edit.ts` as the **single write path**. The `1c` CLI, the click-to-edit modal and the AI tool
surface all dispatch to the same functions, so validation, atomicity and re-render happen once
and cannot be bypassed by adding a caller. This document formalises that surface; it must not
fork it.

The addressing correspondence — `formatL1Path` stamps `data-l1-path`, `resolveL1Node` consumes
it — becomes a stated contract rather than an implementation coincidence, including the
render-scoped lifetime of an address.
