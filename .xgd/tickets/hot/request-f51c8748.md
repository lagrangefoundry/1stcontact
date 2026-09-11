---
uid: request-f51c8748
id: REQ-222
type: request
title: Publish builds the width ladder; the renderer emits srcset
created_by: EPIC-1
created_at: '2026-09-10T21:51:31.105525+00:00'
updated_at: '2026-09-11T21:29:11.526713+00:00'
completed_at: null
last_field_updated: body
status: free_coded
fields:
  priority: medium
  epic_parent: epic-34760bf1
  auto_merge_back: true
  needs_review: false
  depends_on:
  - REQ-219
  chat_comment: comment-f3ebfc8a
  commits:
  - working_sha: c2d79f8ca1f16c1b2c8a71f75f83fb0e4f752327
    reconcile_sha: null
    main_sha: null
  - working_sha: 9110d75b515a4c89f1627421aa717b6625a0c5f6
    reconcile_sha: null
    main_sha: null
  - working_sha: b58546d4dc00b73519ad58975d4d22bfc3eef6cf
    reconcile_sha: null
    main_sha: null
  - working_sha: 12fabc0ed0dd312ee5ba28b6b112735bf65496e1
    reconcile_sha: null
    main_sha: null
  - working_sha: c58ad7396bfa89a28092e6fdbbcce5df3f47bd82
    reconcile_sha: null
    main_sha: null
  - working_sha: 3fb77e4aa254348d37d0db20de49b89e7f580963
    reconcile_sha: null
    main_sha: null
  version: 0.2.165
  story_points: 8
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
(`backgroundImageUrl`) are a CSS `url()` rather than an `<img>`, so the `<img>`
sink cannot reach them — see the next section, which is how they get a ladder
anyway.


### The second sink: a background image's ladder

**A background image gets the same ladder as an `<img>`** — same rungs, same
content-addressed rendition names, same cap at the source width, same cache. The
ladder is built by walking the snapshot's **assets**, not the document, so a
picture qualifies by being a raster still in the site's assets and not by the tag
that places it. That is also what makes the "silently skipped" failure
unconstructible rather than merely avoided: there is no predicate anywhere in the
ladder that asks what kind of node a picture is placed on.

**Per-width `background-image` rules, not `image-set()`.** L1 already emits a
rule per breakpoint, and the widths those rules are keyed to are the same widths
the geometry keyframes describe — which makes the choice principled rather than
guessed, the same property that lets `sizes` be computed on the `<img>` side.

**The override restates the whole layer stack**, with one layer's URL swapped. A
surface is a composed stack — scrim over texture over wash over image over fill —
and a rule that restated only the picture would drop the client's scrim at the
first breakpoint it applied to. The stack is emitted from one function, so the
override cannot hold a second opinion about it.

**The base rule takes the smallest rung.** The base rule is what a viewport
*below* the ladder gets — the narrowest screen, on the worst connection, which is
the visitor this whole ticket is for. Each wider rung then overrides it, and an
override is emitted only where the choice actually changes: a picture that
answers three breakpoints with one rendition emits one rule.

**A background is chosen for a 2× screen**, because a `background-image` has no
candidate list for the browser to choose from — that is the price of not using
`image-set()`. Under-fetching is the unrecoverable error here: `cover` upscales a
rendition narrower than the box and the photograph is visibly soft, which is a
bug the client can see. Two is where the real population clusters, and the error
either side of it is bounded. A box whose width the renderer does not own is
assumed to span the viewport — that is what a band is, and the error is in the
safe direction.

**A rendition that would not pass the `url()` sink falls back to the authored
URL.** A rejected candidate must not remove the layer: that does not serve a
smaller picture, it serves none.

### Reachability: nothing else excludes a background

The risk the widening names is not that a background needs special handling; it
is that a predicate written against an `<img>` silently skips it and nobody
notices, because backgrounds are the pictures nobody clicks on. Checked, and each
already covers `backgroundImageUrl` explicitly: the L1 asset-reference sweep in
validation, the capture localiser that rewrites asset handles, and the derived
segmentation that decides a node is an editable container. Nothing to build; a
case pins the one that could have gone wrong — a site whose only picture is a
backdrop still gets renditions, and every rendition its stylesheet paints is a
file that same publish wrote.

### The two adjacent wins

**The picture states its own dimensions.** The publish had to measure the source
to cap its ladder, so `width` and `height` on the `<img>` cost nothing and give
the browser the aspect ratio before a byte of the photograph has arrived — the
box is reserved at first layout and the text below it does not jump. They are
presentational hints: every rule this renderer emits for the node's own size is a
stylesheet rule, and a stylesheet beats an attribute. No manifest, no dimensions,
which keeps the draft channel byte-identical.

**A rendition is cached forever.** `public-site` serves every published byte with
`max-age=60`, and its own note names the fix it is waiting for: paths whose name
cannot change meaning. A content-addressed rendition *is* that today —
`<sha>-<width><ext>` over the source bytes — whether or not it ever becomes true
of the rest of a revision, so the ladder takes it now. The requested path decides,
so nothing else inherits it. It matters most to exactly the visitor the ladder is
for: serving a phone a 640px photograph is half undone by a repeat visit that
pays for it again.



---

## Answered by the operator, 2026-09-11: typed sources yes, and what "slow" costs

Both questions this ticket left open are now decided. **The width ladder above has
already landed** (`status=free_coded`, six commits); everything in this section is
work *on top of* it, and it is written as an extension rather than a correction.
Nothing above is wrong.

### `<picture>` with typed sources — yes

The body above defers format deliberately: *"a JPEG's rungs are JPEGs… choosing a
better codec is a separate question with a separate answer."* That question is now
answered: **the sink emits `<picture>` with typed `<source>` elements.**

The reason to decide it now rather than later is the one the open question gave,
and it has not weakened: a static publish cannot vary on `Accept`, so format
negotiation can only be expressed in the *shape* of what the renderer emits. Adding
a `type=`d source later means changing the element the sink produces, which is a
different change from adding an attribute to it — every test that asserts an `<img>`
becomes a test that asserts an `<img>` wrapped in something. That is the retrofit
this avoids.

**Two formats, not three: the source's own format, plus WebP.** AVIF is deliberately
excluded from v1, for the same reason `flip` was: it is the expensive half of a
decision whose cheap half delivers most of the value.

- WebP is the saving. Against JPEG it is roughly a quarter to a third smaller at
  equivalent quality, and it is supported by every browser a client's visitor is
  realistically using.
- AVIF's *additional* saving over WebP is real but modest — on the order of 15–20%
  — while its encode cost is several times WebP's, and encode cost is precisely what
  the latency answer below is rationed by. It is the rung that most threatens the
  ceiling and least changes the visitor's experience.
- **And excluding it costs nothing later.** Once the sink emits `<picture>`, adding
  an AVIF `<source>` is one more entry in a list the shape already supports. That
  asymmetry — cheap to add, expensive to retrofit the shape — is the whole argument
  for taking the shape now and the format later.

**Source order matters and is not cosmetic.** The browser takes the first `<source>`
whose `type` it supports, so WebP precedes the original and the original is the
final fallback inside `<img>`. A browser that understands neither still gets the
picture it gets today.

**Every rung gains a format, so the ladder's arithmetic doubles**, and that is the
whole of why the latency question below is not a footnote.

**A format conversion is not a recipe operation.** It belongs on exactly the same
side of the line the body already draws: delivery, invisible, derived, disposable,
never a question the client is asked. `convert` must not appear in the editorial
vocabulary, or the assistant will start hand-picking codecs against this ladder the
same way the body already warns it would hand-optimise widths.

### Publish latency — minutes is the budget, and the ladder must be made to fit it

The operator's line: **minutes are acceptable if the client is told what is
happening; hours would require a different UX.** That is a budget, and the honest
finding is that the ladder as built does not obviously fit inside it once formats
double it — not because any single transform is slow, but because of how they are
ordered.

**The ladder is fully sequential today.** `ladder.ts` walks assets in a `for` loop
and each asset's widths in a nested `for` loop, awaiting every transform before
starting the next. That is correct, readable, and the right thing to have written
first — but it makes wall-clock the *sum* of every transform on the site, which is
the one arrangement that turns a large site's first publish into an open-ended wait.

**The arithmetic.** A photo-heavy small-business site is perhaps 20–40 pictures. A
phone photograph is several thousand pixels wide and so earns every rung. At six
rungs and two formats that is on the order of **300–500 transforms plus as many R2
writes for a 30-picture site** — where today, at six rungs and one format, it is
150–250. Sequentially that is minutes at best and is bounded by nothing in
particular at worst; the same work with bounded concurrency is tens of seconds.

**So three things are in scope here, and the first is not optional:**

1. **Bound the concurrency rather than the ambition.** Render renditions in parallel
   with a small fixed ceiling instead of one at a time. This is a change to code that
   has already landed and is what converts "minutes, maybe more" into "under a
   minute, predictably". It is the single highest-value change in this section.

2. **The publish says what it is doing.** A toolbar button that goes quiet for a
   minute reads as a hang, and a client who reloads mid-publish is a client who has
   learned not to trust the button. The operator's budget is explicitly *minutes with
   explanation*, so the explanation is part of the deliverable, not a nicety: the
   publish reports that it is preparing images and how far through it is.

3. **A budget the publish refuses to exceed, informatively.** A platform request has
   finite resources — a cap on outbound subrequests being the relevant one — and a
   sufficiently large site can exhaust them. The failure mode to design against is
   not slowness; it is a publish that dies most of the way through with a platform
   error naming nothing the client did. If the projected work exceeds what one
   request can carry, the publish must say so in terms of the site, before starting.

**A republish stays free, and that is what makes this bearable.** The
content-addressed derived cache above already means an unchanged picture costs zero
transforms. This whole section is about the *first* publish of a photo-heavy site,
and about the first publish after this ticket lands — every one after that reads the
cache.

### Not verified, and worth verifying before building

The precise per-request resource ceiling a publish runs into — and specifically
**whether an Images binding transform counts against the same outbound-subrequest
budget that an R2 write does** — is asserted here from general platform knowledge and
has **not** been confirmed against current documentation or measured. It is the
number that decides whether item 3 above is a real guard or a formality, and whether
two formats is comfortable or marginal. Confirm it before fixing the concurrency
ceiling or the budget, in the same spirit as the body's note about confirming the
transform vocabulary rather than trusting a remembered list.

Likewise the transform timings above are **estimates, not measurements**. The first
real photo-heavy publish is the measurement, and it is worth taking deliberately
rather than discovering.



---

## Operator decision, 2026-09-11: what a publish looks like while it runs

The latency section above makes "the publish says what it is doing" a deliverable
rather than a nicety. This is what it is. **Three things: the builder locks, a
message explains, and the bar is real.**

### The builder locks for the duration

**Today a publish disables the Publish button and nothing else.**
`publishAction` in `toolbar.js` sets `btn.disabled = true`, awaits, and re-enables
in a `finally`. Every other control in the builder stays live — so a client can
keep editing through a publish that takes a minute, which is precisely the window
this ticket is about to make longer.

**The lock is not only politeness.** A client who edits during a publish has a
reasonable and untested belief about whether that edit is in the site that just
went live. Whatever the server actually does — and that is worth confirming rather
than assuming — the honest fix is to remove the question instead of answering it:
while a publish is running, there is nothing to have edited.

**The mechanism already exists and should be reused, carefully.** [[REQ-173]]'s
`blockEverything` makes the shell `inert` — one attribute covering the tabs, the
toolbar and the pane — and deliberately puts its message *outside* the inert
subtree so the text stays selectable. That is exactly the shape this needs.

**But its meaning is wrong as-is, and that is the thing to get right.** REQ-173's
block says *something is broken and you cannot proceed*; a publish block says
*something is working, please wait*. Reusing the mechanism must not import the
banner's alarm — same `inert`, different register. A client who sees the
"blocked" chrome during a successful publish has been told their site is broken at
the exact moment it is going live.

**The chrome stays live**, on REQ-173's own precedent: the switcher, account,
theme and about are outside the block. Nothing there can change the draft.

### What it says

The message is the operator's, and it earns its length by naming the cause:

> **First-time publication of images requires resizing, which can take some
> time — please leave this tab open.**

**"First-time" is the load-bearing word** and it is true: the content-addressed
derived cache means an unchanged picture costs zero transforms, so the second
publish of the same site is fast. A client who is told this once understands why
the wait does not repeat, and does not learn to dread the button.

**So it is shown when it is true, not always.** The publish knows before it starts
how many renditions it must build — the cache tells it what already exists. A
republish with nothing to do should not display a warning about resizing; that
would train the client to ignore the one case where it matters. A publish with
nothing to build says nothing and simply completes.

### The progress bar is real, and cheaper than it looks

**Yes — and determinate, not a spinner pretending.** A spinner is the right
affordance for an unknown wait of a few seconds; for a wait of minutes it is the
thing that reads as a hang, which is the failure this section exists to prevent.
The operator's budget is *minutes with explanation*, and a spinner is not an
explanation.

**Two facts make it genuinely cheap here:**

- **The total is knowable before the first transform.** The ladder already walks
  the snapshot's assets, measures each one, and derives its rungs; the count of
  renditions to build — assets × rungs × formats, minus cache hits — is available
  up front. So the denominator is real rather than an animation on a timer.
- **The transport exists, with a parser already shared.** `router.ts` serves
  `text/event-stream` on three routes, and `api.js`'s `postEventStream` is an
  async generator whose own doc says it exists so there is exactly one
  split-on-blank-line parse — *"a second transcription is how a fix to one SSE
  route silently misses the other."* A publish progress stream is a fourth caller
  of that generator, not a new transport.

**`POST /api/publish` therefore gains a streaming form**, emitting a frame per
rendition completed — or per asset, if per-rendition proves chatty — and a
terminal frame carrying the result the JSON response carries today.

**The one real design cost, named: a failure after the headers are sent.** An SSE
response has already committed `200` by the time the first rendition is built, so
a publish that fails midway cannot report itself as an HTTP status. The terminal
frame must therefore distinguish success from failure explicitly, and the client
must treat *a stream that ends without a terminal frame* as a failure rather than
as success — otherwise a dropped connection renders as a completed publish, which
is the worst outcome available here. `postEventStream` already turns a non-OK
response into frames rather than a throw; this is the same principle extended to
the end of the stream.

**The non-streaming form does not disappear.** `1c publish` has no browser and no
use for frames, and `publishSite` in `publish.ts` is the one implementation both
go through. Progress is a property of the *route*, not of the publish — the same
line this ticket already draws around the ladder itself, which publish takes as an
optional argument and the CLI simply does not supply.
