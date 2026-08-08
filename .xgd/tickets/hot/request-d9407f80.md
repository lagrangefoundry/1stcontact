---
uid: request-d9407f80
id: REQ-126
type: request
title: 'Build the L1 control surface API: declared schemas, error taxonomy, addressing
  contract, version'
created_by: xgd
created_at: '2026-08-08T21:14:42.246096+00:00'
updated_at: '2026-08-08T21:14:42.246096+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
---

# Build the L1 control surface API

Bring the L1 control surface up to what **DOC-30** (`doc-aca10bce`) specifies. Scope comes from
that document's gap list and is not fully knowable until it is written — this request is
deliberately created ahead of its own scope so the work is not absorbed silently into the
tooling configuration request, where it would be invisible.

## Behaviour

The operations that change or describe a site become an API: stable names, declared input and
output schemas expressed as data, a published error taxonomy with caller-facing meanings,
declared read/write classification, a stated addressing contract, maintained per-operation
documentation, declared absences, and a version.

Consumers — the `1c` CLI, the click-to-edit modal, and the AI tool surface — continue to reach
the same single write path. This is a formalisation of `edit.ts`, not a second surface beside
it, and no consumer should gain a way to bypass validation, atomicity or re-render.

## Dependency note

Blocks the tooling configuration request, which projects its entire surface from this API.
