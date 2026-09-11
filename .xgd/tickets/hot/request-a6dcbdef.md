---
uid: request-a6dcbdef
id: REQ-219
type: request
title: 'An edit is a recipe: the operation vocabulary, one renderer, and edit_image'
created_by: EPIC-1
created_at: '2026-09-10T21:50:34.465379+00:00'
updated_at: '2026-09-11T02:17:20.001234+00:00'
completed_at: null
last_field_updated: body
status: draft
fields:
  priority: high
  epic_parent: epic-34760bf1
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-cbce646b
---

## The gap

There is no image editing anywhere in the product — not in the Library, not as a
tool. A client who wants a picture cropped has to leave, crop it somewhere else,
and upload it again. DOC-48 already instructs the assistant to *"crop an
interesting strip and set the text beneath it"*: advice it cannot act on.

The obvious implementation — edit the bytes, keep the result — is the wrong one,
and this ticket exists to build the right one before any UI depends on it.

## An edit is a recipe, not new bytes

**The original is kept forever.** An ordered list of parameterised operations
sits on the material's record. Any state of the picture is the original plus a
prefix of that list. The bytes anyone is shown are derived and disposable.

**This is what delivers "the crop needs to be a little wider."** That is not
undo — it is editing the crop operation's parameters. Because operations are
parameterised rather than baked, every past state stays reachable by editing or
removing an operation, in any order, months after the fact. A picture cropped in
January can be widened in June without going back to the client for the file.

**So the recipe is persisted and the undo stack is not.** Undo and redo are
editor session state. The recipe is a better history than a history log would be,
because its entries are individually revisable rather than merely reversible, and
persisting both would mean two things that could disagree about what the picture
is.

**Coordinates are normalised** — fractions, never pixels. A pixel crop silently
moves the moment a resize is inserted before it, and the whole value of a
revisable recipe is that editing one operation does not quietly relocate another.

**The vocabulary is closed and shared.** One list, used by the editor UI and by
the assistant's tool. Two implementations of "crop" drift within a month.

v1 is `crop`, `rotate`, `resize`, and `adjust` over brightness, contrast and
saturation.

**`flip` is deliberately out of v1.** The platform renderer cannot do it, and
keeping it would mean standing up a second renderer for one operation. It can
return when there is a second reason to want one.

**`resize` is editorial, not a bandwidth control.** A logo that is 400px wide
because that is what it is. The surface prose must say plainly that delivery
sizes are handled automatically at publish, or the model will start
hand-optimising bandwidth and fight the width ladder.

## One renderer, in three places

**The Cloudflare Images binding applies the recipe.** Its transform pipeline maps
almost one-to-one onto the vocabulary above, so a recipe is a transform chain
rather than a canvas program. The same call renders the editor's true preview,
the assistant's view of a picture, and the published output.

**The client's browser does interaction only** — dragging a crop box over a CSS
overlay, then committing the recipe and re-fetching the real bytes. That is how
editors behave anyway, and it is what stops a client cropping one thing and
publishing another: preview and artifact come out of the same code.

**Browser Rendering was the alternative and was rejected.** `[browser]` is
already bound and already paid for (REQ-154), but it is heavier per publish and
it cannot decode HEIC — so it would have solved this and left the upload path
needing a second answer.

**Renditions are content-addressed** on the original, the recipe and the size
asked for. Nothing is recomputed that has not changed. The material store already
content-addresses blobs (`t/<tenant>/blob/<sha256>`), so this is the pattern the
store was built with rather than a new one.

## `edit_image`, the assistant's half

**The same vocabulary, as a tool.** It changes the recipe; it does not produce
bytes. Composed with the sixth `picture` kind, the loop the assistant needs is
available to it: look, crop, look again.

**Refusing is normal and must read as information.** An operation that would
leave nothing, a crop outside the frame, a resize past the source's own
dimensions — each is refused with the reason, the recipe is left as it was, and
the assistant can correct the call. A refusal that silently clamps is how a
client ends up with a picture nobody chose.

## Not in this change

The modal, the editing controls and the editable Library name are the editor
ticket. The publish-time width ladder is its own. HEIC is its own. This ticket is
the model, the renderer and the tool — the things all three of those need to
exist first.


---

## Answered from EPIC-1, 2026-09-10

### The material ↔ site-asset join: the recipe is applied at promotion, not at publish

Of the three candidates, **the third**: the material records the site asset name
it was promoted to, and a recipe change re-promotes. REQ-222's own investigation
reached the same place independently and argued it is *correct by construction*
rather than merely cheapest, which is what decides it.

**Why not bake at promotion.** It loses *"widen the crop in June"*, which is the
one property the whole recipe design exists to deliver. Ruled out by the epic.

**Why not a `material_uid` column on `site_assets`.** It is the only option that
makes *publish reads the material and applies the recipe* literally true — but
nothing needs that to be true. Promotion already copies bytes across the bucket
boundary deliberately (`BLOBS` is private, `SITES` is public), so a flattened
copy in the site's assets is not a new compromise introduced by this design; it
is what promotion has always meant. Adding a column and a cross-bucket read at
publish buys a purity nobody consumes.

**What the third option gives, concretely:**

- **REQ-222 stops depending on the recipe at all.** Renditions content-address on
  the promoted asset's own bytes plus width and format. A recipe change
  re-promotes new bytes, which is a new hash, which is a new rendition —
  correct by construction, with no join for the publish path to walk.
- **`edit_image` addresses material**, where the picture and its recipe live.
- **The reverse lookup exists** — recording the promoted name on the material is
  what lets an asset be traced back to the recipe that produced it, which is the
  gap the investigation correctly identified. `promoteToSiteAsset` records
  `placed_on` slugs today and must additionally record the resulting asset name,
  which it may have renamed via `freeAssetName`.
- **A material placed on several sites re-promotes to each**, driven by
  `placed_on`.

**And SVG drawings are out of scope for editing entirely**, which dissolves the
third problem the investigation raised. A drawing is a site asset with no
material record, so there is nowhere for a recipe to live — and there does not
need to be: `write_image` can redraw, cropping a vector is changing its viewBox
rather than trimming pixels, and Cloudflare Images cannot transform SVG anyway.
Drawings are in scope for being *seen* (REQ-217) and *looked at* (REQ-218), and
out of scope for being *edited*. The refusal must be named.

### `flip`: the decision stands, the stated reason does not

The investigation is right that `ImageTransform` carries `flip`. **The reason in
the body above is wrong and is corrected here: flip is out of v1 for simplicity,
not because the platform cannot do it.** Reconciliation must not be told
otherwise. It is a cheap addition whenever there is a reason to want it.

### Corrections to the body above

- *"The material store already content-addresses blobs
  (`t/<tenant>/blob/<sha256>`), so this is the pattern the store was built with."*
  **Stale and load-bearing.** The ticketing component *withdrew* content
  addressing (upstream REQ-108); keys are `t/<tenant>/<attachmentUid>`. So
  renditions would be **introducing** content addressing, not following it. The
  design still stands — it is just not free, and must be argued rather than
  assumed.
- **`crop` is not a platform verb.** It is `trim: {top, left, width, height}` in
  **pixels**, applied before resizing and rotation. A normalised crop therefore
  needs the source's pixel dimensions from `info()`, and op *N* needs the
  dimensions after ops 1..N−1. Those are computable analytically, which is the
  argument for `compileRecipe(recipe, sourceDims) → {transforms, finalDims}`
  being a pure, separately testable function.
- **Each recipe op must be its own `.transform()` call.** Within one call the
  platform reorders trim → resize → rotate, and the author's order — which is the
  whole meaning of an ordered recipe — would be silently lost.
- **`rotate` is `0 | 90 | 180 | 270` only.** The vocabulary must say so.
- **Renditions must not live in the ticketing keyspace.** `sweep_orphans` lists
  everything under `t/<tenant>/` and deletes what no attachment record names.
  Renditions want their own prefix on the raw `BLOBS` bucket.
- **Miniflare honours only `rotate`, `width` and `height` locally**, with `fit`
  hardcoded to `contain`. Three of the four v1 operations cannot be proved
  end-to-end in CI, so the UAT shape is: assert the compiled transform chain
  (where the logic is), keep byte assertions to what local mode honours, and gate
  one real-binding test behind a flag. Say this in the ticket rather than letting
  a green suite imply coverage it does not have.
- **`edit_image` is Worker-only**, since the CLI host has no binding — the
  `imagegen.ts` precedent exactly. "One renderer in three places" is one renderer
  *in the Worker*.

### Still open — raised with the operator, not answered here

**Description staleness.** A crop can change what a picture shows, and the
description body is what the KB indexes. The investigation's cheapest answer
("leave it, and say so") is not obviously right, but making it a query is not
free either: `description_status` is
`['ok','no_describer','no_text','unsupported','too_large','failed']` — **every
value is a reason a description could not be produced**, and none means *produced
but no longer true*. Adding one widens every predicate over the field. Flagged to
the operator; do not invent a value.


---

## What this ticket builds, settled at implementation time

### The vocabulary, exactly

Four operations, each a plain object with `op` and its own parameters. **Nothing
else is accepted**, and an unknown `op` is refused by name rather than ignored —
an operation silently dropped is a picture nobody chose.

| `op` | parameters | |
|---|---|---|
| `crop` | `left`, `top`, `right`, `bottom` | fractions of the **current** picture trimmed off each edge; absent is `0` |
| `rotate` | `degrees` | `90`, `180` or `270` — a quarter turn, because that is what the renderer has |
| `resize` | `width`, `height` | **pixels**, at least one of the two |
| `adjust` | `brightness`, `contrast`, `saturation` | multipliers where `1` is unchanged; at least one of the three |

**`crop` is four insets and not a rectangle**, and that is what stops `width`
meaning a fraction in one operation and a pixel count in another. *"Crop an
interesting strip"* is `{op: 'crop', top: 0.35, bottom: 0.35}`. It is also
exactly the shape the renderer's own primitive takes, so the mapping is a
multiplication rather than a coordinate system.

**`resize` is in pixels because that is the whole point of it** — a logo that is
400px wide because that is what it is. A fraction could not say that. So
*coordinates* are normalised and *sizes* are pixels, and the two never share a
parameter name.

### The refusals, each naming what was wrong

`crop` whose insets leave nothing (`left + right >= 1`, or a side that rounds to
under one pixel); `crop` reaching outside the frame (a negative inset); `crop`
given a number greater than one, which is the pixels-for-fractions mistake and is
told as such; `rotate` by anything but a quarter turn; `resize` past the source's
own dimensions; `resize` and `adjust` with no parameter at all; an unknown
operation; a picture that is not a raster this renderer can read.

**A refused call leaves the recipe exactly as it was.** The whole list is
validated against the picture's real dimensions before a single byte is written,
so a recipe is never half-applied.

### Naming a picture: REQ-218's vocabulary, not a second one

[[REQ-218]] landed first and already unified how a stored picture is named across
the two namespaces — the site's assets and the Library's records — behind
`resolveStoredImage`. `edit_image` takes a name in exactly that vocabulary, so a
picture the assistant just looked at is a picture it can now edit, spelled the
same way. Ambiguity is refused with the candidates named, because that is what
resolution already does.

**A site asset is refused, and it is a refusal rather than a gap.** [[REQ-218]]
recorded the reason and this makes it operative: an edit recipe lives on a
Library record, and a site asset is bytes with nowhere to carry one. The refusal
says so and names what the client can do instead.

### The recipe is replaced whole, and read back before it is

`edit_image` takes the entire list and replaces the entire list. `list_image_edits`
hands it back. That pairing is what makes *"the crop needs to be a little wider"*
one call: read the recipe, change the one number, send it back. A partial-update
verb was considered and rejected — the client's editor commits a whole recipe
too, and two shapes for one idea is the drift this ticket exists to prevent.

The result of every call is the **whole** resulting recipe and the dimensions it
produces, so a list sent back short of an operation is visible on the turn it
happens rather than discovered in a picture later.

### One renderer, and what it actually does

The Cloudflare Images binding, declared as `IMAGES` in both wrangler
environments — a named environment inherits no bindings, so the pair is pinned by
a UAT like every other binding in that file.

**Each operation is its own step in the chain, in the author's order.** Within a
single transform the platform applies trim before resize before rotate, so a
recipe collapsed into one call would silently reorder itself. One operation, one
step.

**Dimensions are tracked through the recipe** — a crop scales them, a resize sets
them, a quarter turn swaps them — because a normalised inset means nothing
without the pixels it is a fraction of, and operation *N* is a fraction of what
operations 1..*N*−1 left.

**An empty recipe renders nothing at all.** A picture nobody has edited is served
as the bytes it was stored as, with no transform and no re-encode. Every picture
in the Library is in that state today and must not start paying for a renderer it
does not use.

### Renditions are content-addressed, and deliberately not where the blobs are

Keyed on the original's hash, the recipe and the width asked for, so nothing is
recomputed that has not changed.

**They do not go in the ticketing component's keyspace**, and this is the one
storage decision worth stating plainly. That store's orphan sweep lists every key
under `t/<tenant>/` and deletes whatever no attachment record names. A rendition
is by construction a key no record names, so putting one there would be writing a
cache into a collector's input. Renditions live under their own `rendition/<tenant>/`
prefix on the same bucket, reached directly — tenant-prefixed, because a
content address shared across the barrier is an existence oracle across it.

### The surface

A surface of its own, `image`, with one group `EditImages` over `edit_image` and
`list_image_edits`. Not folded into the fidelity surface, whose overview promises
that nothing on it changes anything; not folded into the L1 surface, which is the
documented way to change a *site*.

**Its grant travels with it**, as the ledger's does and for the ledger's reason:
what a session may do to a picture's recipe is a property of the surface rather
than a per-role decision, and the narrowing already in `createL1Toolbox` removes
it wherever the surface was not composed.

**A deployment with no Images binding has no editing tool** — the surface is
`null`, the manual never mentions it, and the model cannot propose it. The same
shape a missing browser and a missing image credential already have.

### Where the rendered bytes come out

Two consumers land here, which is two of the three the section above promises:

- **The assistant's view.** The stored-picture half of [[REQ-218]]'s image library
  fills in the `original` argument it declared and left as a seam — `false` is the
  picture as it currently stands, `true` is what the crop took away.
- **The builder's.** `/api/material/file` serves the current state by default and
  the original on request, so the Library's existing detail pane shows the edited
  picture with no change of its own, and [[REQ-220]]'s modal has the route it needs.

The published output is [[REQ-222]]'s, and it needs something this ticket does not
supply — see below.

## Three corrections to the text above

**`flip` is out of v1, but not for the reason given.** The platform renderer
*can* flip: `ImageTransform` declares `flip: 'h' | 'v' | 'hv'`. It stays out
because four operations answer the ask and a fifth with no caller is a fifth to
maintain, and because the local renderer the tests run against implements neither
it nor most of the rest. It can return when something wants it.

**The material store does not content-address its blobs.** It did, and the
component withdrew it deliberately: a blob shared between two records cannot be
moved to the trash without breaking whichever sibling still names it. Keys are
`t/<tenant>/<attachment-uid>`. So renditions are not *following* an established
pattern here — they are introducing content addressing, for derived bytes where
it is safe precisely because nothing else names them.

**The local renderer implements a third of the surface.** Miniflare's Images
binding honours `rotate`, `width` and `height` and silently drops trim, gravity
and every colour adjustment. So the compiled transform chain is asserted directly
— it is where the logic is — and the byte-level assertions are held to what the
local renderer actually performs. A test that cropped and compared pixels would
pass against an uncropped image, which is worse than no test.

## Left undone, deliberately

**A crop does not re-describe the picture.** The body text a client and the
knowledge index both read describes the original, and after a crop it describes
something that is no longer quite what is shown. `description_status` is the
mechanism that would drive a re-describe pass and it is not driven here: the
surface prose says plainly that a description describes the original, and a pass
that rewrote a client's own corrected description on every crop would be worse
than the staleness.

**Publishing an edited picture is not wired, because there is nothing to wire it
to.** `promoteToSiteAsset` copies bytes across the bucket boundary and records
only which sites a material was placed on — not the asset name it landed under,
and `site_assets` has no column for the record it came from. So a published site
serves the bytes as promoted, recipe or no recipe. [[REQ-222]] needs that join key
and this ticket does not invent one: which side carries it is a decision about
publishing, and guessing here would leave that ticket with a column it has to
work around.
