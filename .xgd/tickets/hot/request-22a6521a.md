---
uid: request-22a6521a
id: REQ-127
type: request
title: L1 tooling configuration over the control surface API (deletes declare.ts)
created_by: xgd
created_at: '2026-08-08T21:14:47.241627+00:00'
updated_at: '2026-08-08T21:14:47.241627+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
---

# L1 tooling configuration over the control surface API

Replace the builder's hand-built AI tool surface with a **configuration** over the L1 control
surface API, dispatched through the framework tooling object.

Depends on the L1 API (DOC-30, `doc-aca10bce`) and on the framework tooling object
(`ticket://lagrangefoundry/lagrange-framework/DOC-20`, and its build request REQ-74 there).
Best sequenced after at least one framework refactor has landed, so the tooling object has been
proven against a second consumer rather than shaped by this one.

## Behaviour

The builder's AI reaches the site through operations selected from the declared L1 API, under a
declared policy, bound to an in-process call type — shelling out to reach a store the process
is already holding is not acceptable.

Configuration carries **selection, policy and binding only**. Descriptions, schemas, enums,
error meanings and declared absences project from the API. No prose is written in the config;
if any is needed, that is a finding against the API declaration, not a licence to write it here.

Existing guarantees are unchanged and must be demonstrably so: the AI still cannot write HTML,
CSS, JavaScript or framework source, because no operation accepts them; every write still goes
through the same validated path as the CLI and the modal; a refused call still returns its code,
path and hint so the model corrects within the turn.

Two things get **stronger**. The site binding, today a closed-over slug, becomes a declared
scope predicate the tooling object enforces. And the read/write split, today a `writes` flag
that nothing checks, becomes enforced classification.

## Removal

`tools/generate/src/cli/ai/declare.ts` is **deleted**. Its renderer half becomes the framework's
projection; its handler-binding half becomes configuration; nothing remains. Per no-legacy-modes
this is a removal, not a parallel path — there must not be a second way to declare a tool
surface in this project when the work lands.

`tools.ts` is reduced to declaration and configuration, with no hand-written `Tool` construction
and no hand-written manual.
