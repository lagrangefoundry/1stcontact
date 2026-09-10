---
uid: request-a6dcbdef
id: REQ-219
type: request
title: 'An edit is a recipe: the operation vocabulary, one renderer, and edit_image'
created_by: EPIC-1
created_at: '2026-09-10T21:50:34.465379+00:00'
updated_at: '2026-09-10T22:29:19.818978+00:00'
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
