---
uid: request-f51c8748
id: REQ-222
type: request
title: Publish builds the width ladder; the renderer emits srcset
created_by: EPIC-1
created_at: '2026-09-10T21:51:31.105525+00:00'
updated_at: '2026-09-11T02:16:13.156283+00:00'
completed_at: null
last_field_updated: body
status: draft
fields:
  priority: medium
  epic_parent: epic-34760bf1
  auto_merge_back: true
  needs_review: false
  depends_on:
  - REQ-219
  chat_comment: comment-f3ebfc8a
---

## The gap

A photograph taken on a modern phone is several thousand pixels wide and several
megabytes. We serve it to every visitor at that size, on their phone, over their
data. The site is slow for a reason no one chose and the client is paying
bandwidth for pixels nobody can see.

There is nothing between the file a client uploads and the file the public
downloads.

## What changes

**The width ladder is built at publish, in the Worker, and it is JAMStack all the
way down.** `POST /api/publish` (REQ-149) already freezes the draft and writes
rendered bytes to R2; `public-site` only serves what is there. Sizing is part of
that render — nothing is resized on request, ever.

**Into the revision's own R2 prefix**, so the ladder is immutable and versioned
with the revision it belongs to. That is not a new idea imposed on the store: a
published revision is already a frozen byte snapshot, and this is more of the
same bytes.

**The draft gets no ladder.** It is not the public site. It serves the working
rendition, which halves the work and removes any question about keeping a
draft's sizes fresh as a client edits.

**Conventional widths, capped at the source.** Nothing is ever upscaled — a
client's 600px logo does not gain a fictional 2048px rendition. A picture smaller
than the smallest step is simply served as it is.

**`render.ts:2459` is the one place an `<img>` is emitted**, so it gains
`srcset` and `sizes` from the ladder manifest. **`assetRefSchema` does not
change**: it stays `{id, src, alt, focalPoint?}`, and the site document stays
innocent of delivery. Delivery is not a property of the document — it is a
property of the publish that rendered it.

**Renditions are content-addressed** on the original, the recipe and the width.
Publishes are frequent and image edits are rare, so republishing an unchanged
picture costs zero transforms. The material store already content-addresses
blobs (`t/<tenant>/blob/<sha256>`); this is that pattern, applied to derived
bytes.

**The client is never asked about any of this.** Delivery renditions are a
consequence of publishing, not a decision anyone should have to make about their
own photograph. A client answering *"what size should this be?"* is a question we
failed to absorb.

## The line between this and editing

Two axes, and conflating them is how a Library ends up holding five copies of
everything:

- **Editorial versions** are what the picture *is* — the recipe. Visible, the
  client's business, and theirs to change.
- **Delivery renditions** are the same picture at several widths. Invisible,
  derived, disposable, regenerated at publish.

`resize` exists in the editorial vocabulary for the case where a size is part of
what the picture is. The surface prose must state plainly that delivery sizes are
automatic, or the assistant will start hand-optimising bandwidth against this
ladder.

## Falls out of this

The chat's inline picture (REQ-217) wants a small rendition rather than the full
bytes constrained by a stylesheet. Once a ladder exists, it has one.

## Depends on

The renderer from the recipe ticket — the publish path applies a recipe and asks
for a width through the same call the editor and the assistant use.


---

## Answered from EPIC-1, 2026-09-10

### The dependency really is weaker, and the epic now says so

The investigation's central argument is accepted and has been carried up into
REQ-219 as the answer to the epic's biggest open question. **Renditions
content-address on the promoted asset's own bytes plus width and format.** A
recipe change re-promotes new bytes, which is a new hash, which is a new
rendition — correct by construction, with no material-to-asset join for the
publish path to walk. This ticket needs nothing from REQ-219 but the `[images]`
binding declaration.

**So the body above is corrected**: *"the publish path applies a recipe and asks
for a width through the same call"* is wrong. Publish applies **sizing**, to
whatever bytes promotion left in the site's assets. The recipe was already
applied, at promotion. `depends_on` stays, because the binding does.

### Answered

**The cache is revision-independent; the revision prefix gets a copy.** Take the
option the investigation recommends. A per-revision prefix has nothing to reuse
across a republish, so "zero transforms on republish" and "the revision's own
prefix" only coexist if a shared derived cache is populated once and copied in.
Zero transforms, non-zero R2 ops — and consistent with the fact that
`writeRevision` already duplicates every asset per revision. Serving from a
shared prefix instead would need a public-site route change and would break
REQ-109's document-relative flatness invariant, which is not worth it.

**`1c publish` renders exactly as it does today, and the ticket says so.** No
binding, no ladder, no `srcset` — the manifest is simply absent and the sink
emits what it always emitted. This is a real divergence from `publish.ts`'s "ONE
implementation" property and is acceptable **only** because it is stated: a
divergence discovered later reads as a bug in the port.

**Cap the rungs at the source width, from `info()`.** Not because the transform
would refuse — miniflare's local `fit: 'contain'` will happily scale up, and only
the real binding defaults to scale-down. Making the cap ours is what makes local
and remote agree by construction rather than by luck.

**`assetRefSchema` is the wrong object to name.** The sink reads
`l1ImageSchema.src`. The intent — *no schema change; delivery is a property of
the publish* — is right and holds; the sentence names the wrong schema. Correct
it, and note that the `<img>` sink has drifted to `render.ts:2484`.

**Take all three of the adjacent wins.** They are cheap here and expensive
later: computing `sizes` from L1 geometry keyframes rather than hand-guessing it
(without an accurate `sizes` the browser assumes `100vw` and downloads too much
anyway, which would undercut the whole ticket); stamping `width`/`height` from
`info()` to kill layout shift; and `immutable` on content-addressed rendition
names, which `public-site/src/index.ts:63` already names as the fix it is waiting
for.

### Open — raised with the operator, not answered here

**Background images.** The only raster site asset in the repo is referenced as
`axes.backgroundImageUrl`, which `srcset` cannot reach — so as scoped this ticket
saves nothing on the only photograph we have. Widening to per-width
`background-image` rules, or filing it separately, is a scope call.

**Format negotiation.** A static publish cannot vary on `Accept`, so serving
WebP/AVIF means `<picture>` with typed `<source>`s — which changes the *shape* of
what the sink emits, not just its attributes. Cheaper to decide now than to
retrofit.

**Publish latency.** First publish of a photo-heavy site is N images × M widths
of transforms plus R2 puts, inside a synchronous route behind a toolbar button.
Republishes are near-free once the derived cache exists; the first one is not,
and nothing today batches or defers it.

Whoever picks this up: do not start on the background-image or `<picture>` work
before those come back.


---

## Widened by the operator, 2026-09-10: background images are in scope

The investigation's finding stands and decides the scope: the only raster site
asset in the repo is referenced as `axes.backgroundImageUrl`, which `srcset`
cannot reach. **A ticket that saved bandwidth on every picture except the one
real photograph we have would be a ticket that reported success and changed
nothing.** Background images are in scope, for delivery and for reachability
both.

### Delivery

**A background image gets the same ladder as an `<img>`.** Same rungs, same
content-addressed rendition names, same cap at the source width, same derived
cache copied into the revision prefix. The ladder is a property of the picture,
not of the tag that happens to place it.

**Per-width `background-image` rules, not `image-set()`.** L1 already emits
per-width rules, so the ladder rides machinery that exists rather than
introducing a second mechanism with different browser support. The width the
rule is chosen at is the same width the geometry keyframes already describe,
which is what makes the choice principled rather than guessed — the same
property that lets `sizes` be computed rather than hand-written on the `<img>`
side.

**So there are two sinks, not one, and the ticket's "single place" claim
narrows.** `render.ts` remains the only place an `<img>` is emitted; the
background rule is emitted elsewhere and needs finding. The underlying intent is
unchanged and still holds: **no schema change** — a background image is an asset
reference already, and which renditions exist is a property of the publish.

### Reachability

**A background image must be reachable by every capability in this epic, not
just by the ladder.** It is an ordinary site asset, so most of this already
follows and needs only to be verified rather than built:

- **Looking at it** — [[REQ-218]]'s site-asset namespace covers it, and
  `list_assets` already enumerates it, so the assistant can ask to see a
  background exactly as it asks to see any other asset.
- **Editing it** — it reaches the recipe by the same route as any placed picture:
  material, promoted, re-promoted on a recipe change ([[REQ-219]]). Nothing about
  a background makes that path different.
- **Naming it** — [[REQ-220]]'s editable Library name is a property of the
  material, so it holds for a background too.

**The check that matters is that none of these quietly exclude it.** The risk is
not that a background needs special handling; it is that a predicate written
against `kind === 'image'` placed via an `<img>` will silently skip it and nobody
will notice, because backgrounds are exactly the pictures nobody clicks on. Where
a capability is asserted for pictures in this epic, it wants a case covering one
placed as a background.

### Consequence for sequencing

This widens the ticket materially — a second sink, its own rendition wiring, and
a reachability sweep across three siblings. It does not change what it depends
on. Worth splitting only if the `<img>` half is ready to ship well before the
background half; do not split it to make the first half look finished.


## How it works

### The ladder

The conventional widths are **320, 640, 960, 1280, 1600 and 1920**. A picture's
ladder is every conventional width *strictly below its own*, plus **the original
at its own width as the top rung** — so the widest entry in a `srcset` is always
bytes that already exist and nothing is ever upscaled. A 600px logo gets 320 and
itself; a 5000px photograph gets all six steps and itself; a 300px icon gets no
ladder at all and is served exactly as it is, with a plain `src` and no `srcset`.

**A rendition keeps its source's format.** This is a width ladder, not a format
change: a JPEG's rungs are JPEGs. Choosing a better codec is a separate question
with a separate answer (`<picture>`, `type=`), and conflating the two would make
neither reviewable.

**Only raster stills get one.** An SVG is resolution-independent, so a width
ladder for it is a contradiction; a GIF is animated, and a transform would
flatten it. Both are served as they are. The same is true of anything the
transform cannot read: a picture that cannot be measured gets no ladder rather
than a failed publish.

### `sizes` comes from the node, not from the picture

A `srcset` the browser cannot choose from is worse than no `srcset`: with no
`sizes` the browser assumes the image fills the viewport and takes the largest
rung, which is the behaviour we came to remove. So the renderer states the box's
real width.

**It can, exactly, because L1 already pins it.** The renderer emits the image's
width per breakpoint today, from one of three places, and each yields a `sizes`
list:

- a **column anchor** — a closed form in the viewport width, evaluated at each
  rung of the document's own width ladder;
- a **keyframe track** — the captured width per breakpoint, taken at its upper
  bound across each segment so the attribute never understates the box;
- a **fixed px extent** on the node's sizing axis — one length, no conditions.

A node whose width is none of these (fluid, hug) gets **no `sizes`**, which
falls back to the browser's assumption: an over-fetch, never a picture too small
for its box.

### Where the bytes live

Renditions ride into **the revision's own `out/assets/`**, under a `d/` segment
that marks them as derived. They are **not** written to `source/`: a checkout
restores a definition, and a delivery rendition is not part of what the site
*is*. So a revision serves its ladder and a checkout never sees one.

**The content-addressed cache is what makes a republish free.** A rendition is
named for the SHA-256 of the bytes it came from and the width it was rendered
at, and the cache is consulted before any transform. It sits at
`derived/<tenant>/…` — **outside the served root**, so no URL can address it,
and **tenant-prefixed**, because a global content address is an existence oracle
across the tenant barrier (the same reason `t/<tenant>/blob/<sha256>` carries
one). A republish of an unchanged picture reads the cache and transforms
nothing.

### No binding, no ladder

The ladder is built through the **Cloudflare Images binding**, declared in both
the top-level and the production environment of `apps/control-app`, pinned by a
UAT like every other binding in that file.

Where there is no binding there is **no ladder, and an otherwise unchanged
publish** — not a refusal. That is what `1c publish` against an operator's disk
does, and it is the honest answer: a publish without delivery sizes is exactly
today's publish, whereas a publish that refused because images were unconfigured
would take away something that works.

### What does not change

The draft and edit channels never receive a manifest, so the request-time render
is untouched — the ladder is an argument publish alone supplies. `site.json`,
the page definitions and the L1 image node are all unchanged: the manifest is a
render input, and the document stays innocent of delivery. Background images
(`backgroundImageUrl`) are a CSS `url()` rather than an `<img>` and keep no
ladder here; they are a separate question.
