---
uid: request-aa42dbaf
id: REQ-280
type: request
title: 'A shared name for a Library item: IMAGE-5 and DOC-7, readable by the client
  and the consultant'
created_by: EPIC-19
created_at: '2026-09-18T23:42:27.052918+00:00'
updated_at: '2026-09-19T00:40:14.104059+00:00'
completed_at: null
last_field_updated: body
status: free_coding
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


---

## What is being built (implementation scope, 2026-09-18)

### The label itself

A material's label is `<PREFIX>-<n>`, where the prefix is derived from `kind` and
`n` comes from that kind's own per-tenant counter. `document` is the one kind
whose word is not what anybody says out loud, so it is the one entry in the
prefix table (`DOC`); every other kind is its own name in capitals (`IMAGE`,
`FONT`, `CAPTURE`, and whatever [[DOC-38]] §9 adds next). The number is allocated
from `counters` under the key `material:<kind>` — the same table `human_id` uses,
keyed `(tenant_id, type)`, so the per-tenant guarantee the ticket calls
load-bearing is inherited rather than re-implemented. The allocation goes through
the store's own `accessor.nextCounter`, which is atomic.

The label is **stored on the record** (`fields.label`) rather than derived at
read time. It has to be: a counter cannot be recomputed from a row, and a label
that moved when the catalogue was re-sorted or an item archived would be the one
thing a shared reference may not do.

### Where a label is assigned

At every one of the three places a material record is born:

- an upload or a fetch (`ingest`),
- a capture being adopted (`adoptCapture`) — on **create** only, so a recapture
  keeps the label the client already has,
- a generated picture (`generatedMaterialStore`), which is the path that produced
  the three identical crucibles this ticket opens with.

**And once, late, for material that predates the field.** Everything already in a
client's Library was created before labels existed, and that material is exactly
what the operator was looking at when they said they had no common frame of
reference. So `listMaterial` — the one read both halves go through — labels any
row it finds without one, oldest first, so the earliest upload is `IMAGE-1`. This
is a one-time convergence and not a per-read write: once a row carries a label
nothing writes again. A failed label write leaves the listing intact and
unlabelled; the next listing retries. A label write that loses a version race is
abandoned rather than retried, which can leave a gap in the sequence — density is
the intent, not an invariant a reference depends on.

### Where a label is read

1. **The catalogue item the consultant reads** — `label` on `CatalogueItem` and
   on the declaration's `catalogue_item` shape, described as the name to use when
   speaking about a picture.
2. **The Library row the operator reads** — beside the title, and in the row
   filter's haystack, so typing `IMAGE-5` finds it. It is also shown in the
   detail pane's record block, because that is where somebody goes to read what
   one item actually is.
3. **As an input the consultant accepts** — the label joins `aliases` in
   `storedImageOf`, which is the single projection from a record to a name. That
   makes `IMAGE-5` resolve through `resolveStoredImage` — so it is accepted by
   `get_library_item` and `place_on_site` and, because the same projection feeds
   the merged image library, by `screenshot` and `edit_image` too. The operator
   says "use IMAGE-5" and the consultant needs no translation.

`name` stays `row.uid`. Nothing about the machine handle changes.

### The carve-out, written down

The priming's *"never name a framework concept to your client"* paragraph gains
one sentence saying a catalogue label is not one of those concepts and may be
said out loud, and the library surface's own prose says the same where the
consultant reads it. The surface version moves with the surface.

## Test plan

UATs named `test_UAT_FC_REQ-280_*`:

- **Over the real stores** (workers suite, real D1 counters): two uploads of the
  same kind take `IMAGE-1` and `IMAGE-2`; a document takes `DOC-1` from its own
  sequence; a second tenant's first upload is also `IMAGE-1`, which is the
  cross-tenant leak the ticket names; material created before the field is
  labelled by the first listing and keeps that label on every listing after.
- **Over the surface** (node suite, doubled host): the catalogue item carries the
  label; `get_library_item` resolves an item by its label; the declaration
  describes the label and says the consultant may use it in conversation.
- **Over the Library tab** (jsdom): the row shows the label beside the title, and
  the filter matches on it.


### One thing the operator should know: `DOC-n` is already a namespace

The prefix table is the operator's own (*"IMAGE-5, DOC-7"*), and `DOC-7` is what
a client's uploaded brand book is now called. `DOC-33` is also how the product's
OWN knowledge corpus addresses one of its method documents — the same session can
reach both, through different tools.

**The prefix stays `DOC`.** The two never meet where either is used: a catalogue
label is always read beside the item it is on, and a corpus document is reached
by search and is never said to a client at all. Renaming the client-facing thing
to avoid an internal id would be paying for the internal one.

**But the priming carve-out spells only `IMAGE-5`.** [[BUG-65]] is explicit that
no authored priming text may name anything in the corpus's id namespace, and its
guard fires on `DOC-\d+` exactly — correctly, because the priming is the one
document in a session where such a string is read with no item beside it to say
which kind of thing it is. The surface prose, where a label is always read in the
catalogue's own context, carries both examples. Both halves are asserted.

If the collision ever does bite in practice the cheap fix is the prefix table: it
is one entry in one map (`LABEL_PREFIX`), and every label already written stays
valid, because a label is a stored string rather than one recomposed on read.


### One consequence of the catch-up worth stating

A label written by the catch-up pass is an ordinary write, so it appears in the
material change feed ([[REQ-201]]) as an `update` on that row. A Library tab open
while the first listing runs therefore redraws those rows, once, with their new
numbers on them — which is the correct behaviour and not a side effect to
suppress. What it also means is that a fixture creating material with no label is
modelling a PRE-LABEL record, and any case reading the feed frame-by-frame after
such a fixture sees the catch-up's frame first. The change-feed suite's fixture
now writes a label, because the state it means to model is the ordinary one.


### Details settled during implementation

- **The row draws nothing where there is no label yet**, rather than an empty
  cell. The first listing allocates one, so the gap closes itself; an empty box
  would be the only lasting trace of a state that is about to stop existing.
- **The number is `flex: none` and never wraps.** The Library row is one line and
  its one shrinkable element is the title ([[REQ-176]]) — a number that ellipsed
  to `IMA…` would not be something anybody could say.
- **The detail pane's record block gains `Refer to it as`, read-only**, first in
  the block. It is the answer to the question somebody opened that pane to ask,
  and a number the client could type over would stop being a reference the moment
  they did.
- **`TicketStore.accessor` grows `nextCounter`**, named on the typed boundary the
  way `changeHead` and `blobs` already are rather than reached for with a cast.
  It is the component's own `human_id` allocator addressed by a second key.
- **`imagegen` gains `GENERATED_KIND`**, because two lines now read it — the
  record's `kind` and the sequence its label draws from — and they must be the
  same word.
