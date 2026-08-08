---
uid: doc-aca10bce
id: DOC-30
type: doc
title: L1 Control Surface API — the documented, maintained way to change a site
created_by: xgd
created_at: '2026-08-08T21:12:39.376838+00:00'
updated_at: '2026-08-08T21:12:39.376838+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  doc_kind: architecture
---

# L1 Control Surface API — the documented, maintained way to change a site

Design record for a **clean, clearly identified control surface** over L1: a set of named
operations with declared inputs, outputs and failure modes, documented and maintained as an
API rather than discovered by reading `edit.ts`.

Related: **DOC-23** (L1 substrate), **DOC-8** (builder UI architecture — §5.2 forbidden list by
absence, §5.3 enums spelled literally, §6 structured edits), **DOC-2** (security policy),
**DOC-12** (storage and rendering model).

## Why now

The immediate trigger is the generic tooling object being designed in lagrange-framework: a
tool configuration will name into this surface, which promotes internal function names to
identifiers that configuration, generated documentation and model priming all depend on.

But the tooling work did not *create* this need — it exposed that we have been operating
without an API. The requirement stands on its own: the surface that can change a customer's
site should be documented, versioned and deliberately maintained.

## What exists today

`tools/generate/src/cli/ai/` and `tools/generate/src/cli/edit.ts` are the de-facto surface.
The genuinely good part: **`edit.ts` is already the single write path.** The `1c` CLI, the
click-to-edit modal, and the AI tool surface all dispatch to the same functions, so validation,
atomicity and re-render happen in one place and cannot be bypassed by adding a new caller. That
property is the foundation of this document and must survive it.

What is missing is everything that makes a module surface an API:

- no declared operation schemas — inputs are TypeScript types, invisible to configuration and
  to anything outside the compiler;
- no declared output contract — some operations return strings, some objects, shaped for
  whoever happened to call them;
- no stability contract or version;
- no maintained documentation — the closest thing is `declare.ts`, which documents the
  *AI-facing subset* only;
- no declared read/write classification, so nothing can enforce a read-only caller;
- an error taxonomy that exists (`CommandError` / `ErrorCode`) but is not published as part of
  a contract.

## Requirements

**R1. Named operations with declared schemas.** Every operation has a stable name and declared
input and output schemas, expressed as **data** — not as TypeScript types alone — because
configuration, documentation and priming all need to read them. TypeScript types should be
derived from or checked against the declaration, not maintained beside it.

**R2. Declared error taxonomy.** Each operation declares which `ErrorCode`s it can answer with,
and what each means *in terms of what the caller should do next*. This already exists in
miniature in `declare.ts`'s `ERROR_MEANINGS` and should be promoted into the API rather than
kept in the AI adapter, since a CLI user and a model need the same information.

**R3. Read/write classification per operation**, declared, so a policy layer can enforce it.
Today this is a `writes` boolean on the AI declaration, enforced by nothing.

**R4. Stable addressing.** The address a listing hands out must be the address a write resolves.
This is currently guaranteed by construction — `formatL1Path` stamps `data-l1-path` and
`resolveL1Node` consumes it — and that correspondence is a real asset. The API must state it as
a contract rather than leave it as an implementation coincidence, including the render-scoped
lifetime of an address (an address is read, not remembered).

**R5. Documented semantics, maintained beside the code.** Prose per operation covering
preconditions, effects, and what it deliberately does not do.

**R6. A version**, because config, documentation and priming all reference this surface.

**R7. Declared absences.** DOC-8 §5.2 enforces the forbidden list by absence — no operation
writes HTML, CSS, JavaScript or framework source, and none will. Absence is right for
enforcement and useless as guidance, so the surface should *declare* what it deliberately does
not offer and what to do instead. This exists today as `declare.ts`'s `absent` and belongs in
the API.

## Configuration is a projection, not a copy

The corresponding tooling configuration will select from this API — which operations, for which
role, under which policy, over which call type. It must **not** restate parameters,
descriptions, enums or error codes. If it does, it drifts, and the model is told something false
by the document meant to make it accurate. Everything descriptive projects from this API.

The practical consequence for this document: the API declaration must be rich enough that a
usable tool manual can be generated from it **with no prose written in the configuration**.
That is the acceptance bar.

## Deliverable: a gap list

This document must end with an explicit, itemised **gap list**: for each requirement above,
what today's `edit.ts` already satisfies and what is missing. The build REQ is scoped from that
list, and it is not knowable before the analysis — the gap may be modest, since the single
write path already exists and `CommandError` already carries codes, paths and hints; or it may
be substantial once declared schemas, output contracts and versioning are added.

## Out of scope

- The tooling object itself (lagrange-framework).
- The L1 typed element tree and its expressive vocabulary (DOC-23, DOC-27).
- Behaviour-module configuration surfaces (DOC-25) — related, and a likely second consumer of
  the same declaration discipline, but not this document.
