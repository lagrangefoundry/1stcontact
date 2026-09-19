---
uid: request-aa42dbaf
id: REQ-280
type: request
title: 'A shared name for a Library item: IMAGE-5 and DOC-7, readable by the client
  and the consultant'
created_by: EPIC-19
created_at: '2026-09-18T23:42:27.052918+00:00'
updated_at: '2026-09-18T23:58:40.518298+00:00'
completed_at: null
last_field_updated: body
status: draft
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-63c3126e
---

Parent: [[EPIC-19]]. Operator, 2026-09-18: *"the consultant and I are lacking a
common frame of reference for assets."*

## The problem, in the operator's own Library

Three rows from the Lagrange Foundry catalogue:

```
material-3328dff9 | MATERIAL-3 | A crucible of molten metal leaning forward to …
material-de9ac4ed | MATERIAL-4 | A crucible of molten metal leaning forward to …
material-bd70d8d9 | MATERIAL-5 | A crucible of molten metal leaning forward to …
```

Three generated variants with identical titles. **The operator sees three rows
that read the same. The consultant sees three opaque uids. Neither can say "that
one".**

## Why there is no shared reference today

The two halves are labelled by different things, and neither can see the other's.

- **The consultant's handle is the uid.** `storedImageOf`
  (`apps/control-app/src/material.ts:1396`) sets `name: row.uid`, so
  `list_library` returns `item: "material-bd70d8d9"`. The declared
  `catalogue_item` shape carries `item`, `title`, `filename`, `kind`, `role`,
  `rights`, `placed_on` — and no human-readable id.
- **The Library shows the title.** `builder/library.js:527` renders
  `row.title || row.filename`, and the row filter matches
  `${row.title} ${row.filename}`. The uid is used internally and never displayed.

So what the two currently share is title and filename — exactly the ambiguous
pair. The `human_id` that would settle it (`MATERIAL-5`) exists on the ticket row
and is projected to neither side.

## The label: kind-derived prefix, existing number

`MATERIAL-n` is the ticket type's own sequence, and `material` is the right TYPE —
it is genuinely what the client gave us whether it is a photograph or a brand
book. It is the wrong LABEL to put in front of anyone.

**Show the kind instead, over the number the ticket already has**
(operator decision, 2026-09-18 — *"I would like to say IMAGE-5, DOC-7"*):

| kind | label |
|---|---|
| `image` | `IMAGE-12` |
| `document` | `DOC-7` |
| `font` | `FONT-3` |
| `capture` | `CAPTURE-2` |

`kind` is already a field on the row and already declared on the surface. The
number is `human_id`'s, unchanged.

**Dense per-kind numbering, decided 2026-09-18.** The operator's preference was
`IMAGE-1, IMAGE-2` and the two objections that would have blocked it both fail on
inspection, so it is the decision rather than the fallback.

- **It needs no schema change.** `counters` is already
  `PRIMARY KEY (tenant_id, type)`, so a per-kind counter is another key in the
  same table (`material:image`) rather than a new mechanism.
- **Reclassification cannot break a reference.** `kind` is assigned once at
  ingest, from the classification of the uploaded bytes
  (`apps/control-app/src/material.ts:660`), and no route mutates it afterwards.
  So a label is never renumbered under a client who has already said it out loud.
  This is the objection that would have forced the sparse scheme, and it does not
  hold.

**The accepted cost:** the client-facing number no longer matches the ticket's own
`human_id` — `IMAGE-3` may be `MATERIAL-9`. That is a debugging inconvenience and
nothing more: the catalogue item carries both, and the uid is still the machine
handle every other surface takes. Anyone reading D1 directly can join them.

**If that divergence later proves worse than the density is worth**, the fallback
is to label with the kind over `human_id`'s existing number — sparse
(`IMAGE-3, IMAGE-6, IMAGE-13`) but exactly recoverable. Recorded so the choice is
legible rather than rediscovered.

## The numbering is per tenant, and must stay that way

`counters` keys on `(tenant_id, type)`, and three businesses in the local store
each hold their own `MATERIAL-1`. Every client's catalogue therefore starts at 1.

**That is load-bearing, not cosmetic.** A globally sequenced label would tell one
client how much material every other client has uploaded — an information leak
across the tenant barrier, in a string the consultant is now cleared to say out
loud. The per-kind counter inherits this by staying in the same table with the
same tenant-scoped key; a counter keyed on kind alone would break it.

## It has to land in three places, or it is not a shared frame

1. **The catalogue item the consultant reads.** Project the label into
   `catalogueItem` / `itemView` (`library-core.ts:213`), and describe it in
   `library-surface.json` as the name to USE when speaking about a picture.
2. **The Library row the operator reads.** Beside the title in
   `builder/library.js`, and matchable by the row filter so typing `IMAGE-5` finds
   it.
3. **As an INPUT the consultant accepts.** The reference has to work in both
   directions: the operator says "use IMAGE-5" and the consultant resolves it
   without translation. `StoredImage.aliases` already exists and `haystack`
   (`library-core.ts:236`) already searches `name`, `title`, `filename` and
   `aliases`, so adding the label to `aliases` covers the text filter; `itemNamed`
   (`library-core.ts:190`) is where an exact-match lookup would resolve it.

## Do not replace the uid

`name` stays `row.uid`. `library.ts:55` states why and it still holds:

> THE NAME COMES FROM `storedImageOf` AND IS NOT COMPOSED HERE. That function is
> the single projection from a record to a name […] so a picture is spelled in the
> catalogue exactly as `screenshot` and `edit_image` spell it, by construction
> rather than by care. Writing `name: row.uid` here instead would be the drift in
> miniature.

The uid is the machine handle shared with `screenshot` and `edit_image` and is
persisted in stored edit recipes. This ticket ADDS a spoken name; it does not swap
the handle, which would be a migration across every persisted reference.

## The consultant may say it out loud

Checked against the priming's rule — *"If you ever find yourself naming a
framework concept in a message to your client, you have already lost them"* — and
the operator has ruled that this clears it (*"this is not too technical"*). A
catalogue number is how a gallery or a print shop refers to a piece, and
"the crucible, IMAGE-5" is plainer than three identical titles. So the label is
client-facing, not operator scaffolding, and the surface prose should say the
consultant may use it in conversation.

That is a carve-out from the no-vocabulary rule and should be written down as one,
so a later reading of the priming does not treat it as a violation to clean up.