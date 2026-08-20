---
uid: story-8acc338d
id: STORY-84
type: story
title: Fold a multi-viewport capture into one L1 reproduction document with advisory
  structural hints
created_by: xgd
created_at: '2026-07-22T19:41:46.012167+00:00'
updated_at: '2026-08-20T14:51:45.909915+00:00'
completed_at: null
last_field_updated: uat_coverage
status: updated
fields:
  intent_uid: bundle-31e474b9
  capability_uid: capability-2049c9ec
  story_kind: upgrade
  story_points: 3
  uat_coverage: pass
  updated_by: request-8a132869
---

## Story
**As a** site reproducer, **I want** capturing a page to fold its multi-viewport
sample ladder into one renderable L1 reproduction document in the *full* L1
language — text, media, painted surfaces, backdrops, the page band and the
behaviour seams with their controls — plus advisory structural hints, while
keeping the raw ladder as an acceptance oracle, materializing the result as a
servable site, letting me re-fold offline against it, and signalling anything it
still cannot express, **so that** reproducing a captured site becomes
near-mechanical — capture, fold, render, gate — and whatever the folder still
lacks is named rather than lost.

## Description
`1c capture page <url>` samples a page across a fixed width ladder (the retained
multi-state oracle). This capability adds a *fold* over that ladder: every node is
matched across the sampled widths and emitted as a single L1 document — an
**absolute-base** reproduction where each node carries its authored axes, a
geometry keyframe per sampled width, per-segment `interpolate|snap` transition
flags, and a visibility rule derived from the widths it is present at. The raw
ladder is retained unchanged as the acceptance oracle the fold is gated against.

The fold emits the **full language**, not text alone:
- a **text** leaf for a styled run, carrying the typography axes plus the text
  pixel-mover families the language expresses (gradient fill, decoration,
  small-caps, list marker, text shadow) — and, when the run is **self-painting**
  (its own border box already spans the surface it sits on: a fully-rounded pill,
  or a control with authored vertical inset), that surface too, so the fill,
  corner radius, border and shadow ride on the text leaf itself;
- an **image** leaf for a text-free media element, carrying its resolved source
  and alternative text (captured onto the media field and carried through the
  manifest), a height-bearing geometry track and its image axes — including how
  the picture is *seen*: which part of itself its box shows, and the colour
  adjustment painted over it;
- a **box** leaf for a text-free element that paints a standalone surface,
  carrying the surface's own colour adjustment alongside the fill, border,
  shadow and backdrop blur it already folded;
- a **backdrop** box leaf for a captured element that paints *behind* content — a
  background photograph at any depth, or a full-bleed panel fill, opaque or
  translucent. The same box also carries the band's **translucent scrim** — a
  colour with its own alpha, layered above the background image within that one
  box — so a hero veil over a photograph survives the fold instead of the picture
  reproducing unveiled at full brightness. A section therefore folds when it
  paints an image **or** a scrim, so an overlay over a solid band with no image is
  carried just as faithfully; and each of the two axes is read from the widest
  width that carries *it*, rather than both off one widest sample, since a section
  may paint an image at some widths and only a scrim at others. A
  backdrop is placed in the document's **background layer**, behind the runs of
  the band it sits under, rather than in document order (which would paint a hero
  photograph over the hero's own headline). Its edges join the section-edge set
  that bounds how far a reconstructed band may tile, and its fill counts toward
  the page-base inference — on a page whose panels are all nested, the measured
  backdrops are the only direct evidence of what the page is mostly painted in;
- **reconstructed run surfaces**: the capture composites a card/panel/section fill
  *onto* each run rather than emitting a standalone box, so the fold recovers it —
  the solid fill the most runs sit on becomes the document background band, and
  every run whose surface differs from the band (or carries a gradient the body
  cannot paint) gets a backing box emitted before the content so each leaf paints
  over its own surface. A fill **also** seeds a band on a second path: when its
  same-fill, untreated runs share a horizontal row whose union spans the full
  content width *and* whose largest internal horizontal gap dominates — a
  full-bleed footer or nav strip whose items hug the left and right edges
  (space-between). No single run there is full-width, so the majority rule alone
  misses it and each run wrongly becomes a tiny card exposing the page background
  across the bar. The dominant-gap test is what discriminates a distributed bar
  from an evenly-tiled card grid, whose small, even gaps keep it as cards. A
  **self-painting run is the exception in both
  directions**: it carries its surface on its own text leaf (above) and
  contributes nothing to this reconstruction — no row, no backing box — because a
  box behind it would duplicate the pill as a card and its own fill would
  otherwise be read as evidence of the band or card it sits in. The enclosing card
  is defined by its other runs;
- a **font resource table** binding each painted family handle to its served
  substance, populated only with the families a folded text leaf actually paints.

**A reconstructed surface takes its rect from the element that painted it.** A
card's edges and corners are a measured fact rather than arithmetic over where its
text happens to sit: the fold adopts the *captured* surface-bearing box wherever the
capture resolved one. Two rules qualify that adoption. A surface as wide as the
viewport is the page **band**, not a card — bands are reconstructed separately, and
adopting a band's rect stretches a narrow accent rule across the whole section — so
such a row keeps its own run box instead. And where no card-shaped fill was resolved
but the run bears an **asymmetric accent rule**, the fold takes the rect of the
element that *bears* the rule, which is commonly a fill-less wrapper the run sits
inside: without it the rule lands indented from the reference by that wrapper's
padding and, because a border paints inside its own border box, prints over the
first glyph. The bearer's rect is consulted only where no fill was resolved, so a
card painting both a fill and an accent keeps one rect for both; and corner rounding
follows the resolved *surface* shape only, so a row that fell back to its accent
bearer never inherits a radius that was not its own. The captured rect doubles as an
**exact grouping identity** — runs painted by the same element are one card and runs
painted by different elements never merge, with proximity arbitrating only those
rows whose surface the capture could not resolve — so sibling tiles can neither
merge nor drift.

**What varies across the ladder becomes a track — not geometry alone.** Any scalar
axis whose measured value differs across the sampled widths folds to its own
per-width keyframe track; an axis holding one value everywhere stays a plain
scalar read from the widest sample, so a page that does not vary gains no bloat.
Two axis families use this rule today — a text run's numeric type axes (size, line
height, letter spacing) and the four sides of an element's padding — and they are
written as mirrors of one another so the next axis to become responsive inherits
the rule rather than re-deriving it. Before this the fold read *every* non-geometry
axis from the widest present sample alone, so a desktop font size and a desktop
inset were both replayed at mobile.

**The ladder has a second sampling axis: the viewport's HEIGHT.** Width alone
cannot tell a `100vh` hero from a hero that happens to be 800px tall, so selected
ladder widths are re-shot at a second viewport height, and the fold reads that
pair as **evidence about the height axis rather than as a keyframe** — the
keyframe ladder deliberately skips the probe, so no width gains a sample the page
was never laid out at. Each node's measured change in top edge and in height per
unit of viewport height folds to a small derivative carried on its geometry:
`{heightFactor: 1}` on the hero and `{yFactor: 1}` on everything below it state
the same fact in the same units, which a locally-pinned pixel height cannot. Two
attribution rules keep it honest: a **band takes its response from its section
edges**, not from the runs it contains (a `min-h-screen` hero's copy sits in the
top half and does not move, while the band below it starts a full viewport height
down), and a **reconstructed card inherits its representative row's**. A response
indistinguishable from zero emits no axis at all, so a page with no
viewport-relative rule gains nothing. The response is **measured, never
inferred**: the fold reads two boxes and a height difference, not an authored unit.

**Padding is a folded axis, not a geometry side-effect.** A text, image or box leaf
carries the per-side padding the reference painted — a scalar, plus a track for a
side that varies. Without it a leaf's pinned box reproduced with its content flush
to its own edges.

**A run is pinned unbreakable from the width the reference stopped wrapping it.**
The fold hands a run a fixed-width box whose slack over its own glyphs is routinely
a fraction of a pixel, and each engine measures glyphs differently — so a no-wrap
threshold axis carries the reference's own line count across engines instead of
letting rounding re-decide it per browser.

**The page's centred content column is recovered as a document constant.** Where
content actually sits at each captured width is fitted to a container maximum and a
horizontal inset that reproduce every sampled *origin*, plus — where the page's
content stops short of that container — a **content cap** that reproduces the
*extent*; and the fit is rejected unless it reproduces *all* of the samples, so a
page with no centred column keeps its keyframes untouched. A node inside the column
expresses its geometry against that column (a column anchor) rather than against
the page edge, so the reproduction re-centres at unsampled widths instead of
holding a captured absolute offset.

**A column anchor is fitted per axis, not as one undivided thing.** A node's **left
edge** and its **extent** are fitted against the column separately, and either may
anchor while the other keeps its keyframes — because alignment is a property the
page shares across siblings while a node's width is its own business. Coupling them
(anchoring only where both axes fit) leaves neighbouring runs on two different
models and splits text the reference keeps flush: one hero line whose width happened
to equal the column extent anchored while its three neighbours kept drifting
keyframes, 31px apart at an unsampled width — worse than not anchoring at all. An
extent may also anchor with its own **narrower maximum** — a nested cap, where a run
fills the column until that maximum takes over — admitted only when more samples
than unknowns support the fit and only at a plausible share of the column, so a
width that merely *correlates* with the column over the sampled range (a
shrink-to-fit glyph extent under responsive type) is refused rather than
extrapolated off-sample.

Two further rules keep an anchored left edge honest. Where a node's offset inside
the column has no closed form — typically because the page changes layout **mode**
at a breakpoint, a 3-up grid stacking below `md` — the column origin still carries
the node and only the small residual offset inside the column is keyframed,
snapping wherever the node's own geometry snaps; without that agreement the two
halves of one position disagree about where the page's breakpoints are and a grid
column slides off the right edge between samples. And a **full-bleed element
spanning the viewport is never anchored at all**: its left edge is absolutely zero,
and writing that as origin-plus-negative-origin and then interpolating the residual
walks the band off the left edge at unsampled widths.

**How a measured value becomes a typed axis.** Folding is not transcription: a
computed CSS string is admitted only on terms that keep the folded definition
honest and small. **The browser's own default is not worth carrying** — a value
the browser would paint anyway (a picture centred in its own box, no colour
adjustment at all, an adjustment function sitting at the value that changes
nothing) folds to nothing rather than being recorded, because a definition that
wrote it in would grow on every page with declarations that cost a composite
layer and move no pixel. **The value that changes nothing differs per adjustment**
— full desaturation and no desaturation are opposite ends of two differently
oriented scales, so the skip rule is per-function rather than one constant; a
single rule would silently fold a fully desaturated photograph to no adjustment
at all and reproduce it in full colour. **The same value spelled two ways folds
the same** — a ratio written as a percentage and as a decimal are one filter, and
which spelling a browser reports is not something the reproduction should depend
on. **An unreadable form is a gap, never a guess** — a form the fold cannot parse
(a keyword or length pair where it expects percentages) writes no axis, so the
definition never states a framing the page did not, and the difference stays
visible to the comparison that gates a reproduction instead of being closed with
an invented number. **A value past the envelope is carried at the nearest
expressible one**, because a real treatment the target paints reproduces better
near-missed than absent — while a value that is not a treatment at all (a
negative amount) is skipped.

**Behaviour seams and their controls.** A captured form control belongs to a
behavior module, so the fold never synthesizes a raw `<input>`. Each cluster of
captured controls becomes one **slot** node pinned at the cluster's union rect per
width — the seam the module mounts at — and every control in it folds to a
**control** leaf naming the module-declared element it binds, carrying the paint
the capture measured and a geometry track **rebased from the page origin to the
seam**. The reference's own field heights and its submit button's per-width
position therefore survive the fold instead of being replaced by module defaults.
A control with no geometry at any sampled width has nothing to mount at and stays
a residual.

The fold derives each seam's **behavioural config from the capture alone**, and
the enumeration is complete — the field list; each field's label from the a11y
tree's accessible name; each field's type from the captured input type, falling
back to the control's height when the bundle recorded none, a control materially
taller than the form's shortest being a multi-line box; **where the reference
renders each field's label**; the submission endpoint from the captured form
action; and, where a claimed submit button was lifted into the seam, **that
button's own words** as the form's submit copy. Nothing else about a seam is
derived.

Label placement is read from the a11y tree's **name source**: a name sourced from
the placeholder folds to placeholder labelling, anything else to a visible label
above the box. It has to be derived rather than styled because the a11y tree is
its only witness — a label above the box and the same words inside it are both
just text near a box, so no painted axis can hold the difference — and getting it
wrong costs geometry, not polish: a label row the reference never had pushes every
field below it down, so the whole form drifts progressively further off with each
field. The captured submit wording is behavioural copy in the same sense — it
names the action, while the button's *look* is already owned by its `control`
leaf — and carrying it is what keeps the reproduction saying the reference's verb
instead of falling back to the module's own default. It **invents nothing**: where the capture carries no such fact, or
carries an endpoint that is not a safe URL, the derivation takes an honest default
(an unnamed control still becomes a field under a positional label; a form with no
action posts to its own URL) and records a **derivation gap** naming what was
missing, so an honest default is never mistaken for a captured fact. That channel
is deliberately **distinct from the typed element residual** below: the form *was*
mounted, so a missing endpoint names a gap in what the capture saw, not a gap in
L1's expressive power, and conflating the two would make a successfully mounted
form read as an un-foldable field.

Anything the fold still cannot express is **signalled, not dropped**: each such
element becomes a typed residual naming its kind, the reason, the painted axes it
carried and the widths it appeared at, so a folder-power gap reads as a framework
gap instead of vanishing.

**A folded bundle is materialized as a servable site.** The fold produces a
document; a second verb (`1c repro <slug> --ref <bundle>`) makes it a site — one
whose page document *is* the bundle's folded L1 document, with the recovered
behaviour seams mounted into it, so the ordinary render / serve / shot / compare
loop runs against the reproduction unchanged. Materialization is where the
reproduction is made **self-contained**: every media handle the folded document
names is rewritten from the captured origin to the bundle's own mirrored asset,
and a handle with **no** mirrored asset fails the run outright with a re-capture
instruction rather than hotlinking the origin — a reproduction that reaches over
the network is neither reproducible offline nor honestly gate-able, since the
perceptual gate would then be blind to image regressions. The rewrite reports the
**opposite channel** too: a mirrored `image` or `font` asset the folded document
references **nowhere** — the bundle carries the bytes but the fold emitted no leaf
and no `@font-face` for them — is surfaced as a **fold gap** rather than silently
dropped, because it names folder power the reproduction is missing rather than a
broken reproduction. It is a different measure from the gate's reference-coverage
media proxy, which asks the same question of the retained *reference manifest* on
the gate verb rather than of the folded document, so the two numbers are not one.
Rewriting handles is a materialization concern, not a fold concern: the folded
document keeps the handles the capture recorded. The verb is **idempotent** — a
re-run wipes the target and rebuilds it, so re-materializing after a fold change never leaves half
of a previous reproduction behind. (How an imported reproduction interacts with an
already-scaffolded slug — that it replaces the page document wholesale — is
AC-876's under the site-import capability and is not restated here.)

Because the folded document and its forms are a pure function of the retained
oracle and the *current* fold, the capability also exposes an **offline re-fold**:
re-deriving both from a bundle's own retained ladder, rewriting only what the fold
produced and leaving the oracle, screenshots, mirrored assets and hints untouched,
so a fold change can be picked up without re-hitting the captured origin (which
would re-roll the reference in the same step).

A separate **advisory structural-hint** pass emits a sidecar describing the CSS
*relationships* the painted-geometry fold deliberately omits — parent computed
layout, authored sizing units, position mode, ancestry, sibling repetition, and
the page's real `@media` breakpoints. Hints are read for DIRECTION (which
structure an AI may later recover over the absolute base), never for EXECUTION:
nothing in the render/reproduction path consumes them, and the folded L1 document
renders as a complete reproduction on its own.

**In scope:** the fold to one L1 document in the full language (text, image, box,
backdrops in the background layer, reconstructed surfaces measured from the
captured surface-bearing rect — never a viewport-wide band — with the accent
bearer's rect as the no-fill fallback and that rect's use as an exact grouping
identity, with the self-painting
run excepted from them and the full-bleed bar as a second band-seeding path, page
band, behaviour seams with rebased control leaves and their capture-derived
behavioural config (field list, each field's label and the reference-side
placement of that label, each field's type, the endpoint, and the claimed submit
button's wording) with its distinct derivation-gap channel,
font table), the band's translucent scrim carried on the section-background box
(the image-or-scrim fold condition and its per-axis widest read), the framing and
colour-adjustment axes a captured picture or surface
carries, per-side padding and the per-width scalar track any non-geometry axis
earns by varying across the ladder, the viewport-height probe pair and the
measured per-node height response the fold derives from it (including its
section-edge and representative-row attribution rules), the no-wrap
threshold axis, the recovered centred content column (container, inset and content
cap) and the column-anchored node geometry that refers to it — fitted per axis,
with the capped extent, the keyframed inset fallback and the full-bleed
refusal — oracle retention, the materialization of a folded
bundle into a servable site (page document, mounted seams, asset localization with
a hard failure on an unmirrored handle and a reported fold gap on a mirrored asset
no node references, idempotent rebuild), the offline re-fold,
geometry keyframes + interpolate/snap classification + visibility rules, the typed
residual signal for unexpressed elements, the advisory hint sidecar, and
supersession of the pre-L1 `adopt-values` reproduction command.

**Out of scope:** the L1 typed tree / envelope / renderer themselves, including the
axis vocabulary these folded values land in (the height-response axis among them)
and how the renderer replays it, the `control` node kind and its emitter, and the
resource-table form (owned by the L1 Layout Substrate capability); what a behavior
module declares and how it wires a bound control (owned by the behavior-module
contract); the capture-side rules that decide a band's extent, index the backdrops,
detect a band's scrim and project it onto the section values, and shoot the height
probe, and the values-diff axis coverage (owned by the
values-diff fidelity capability); the editor surface that writes the same framing
parameters by hand (owned by the structured copy-editing capability); how an
import interacts with an already-scaffolded slug (owned by the site-import
capability); the end-to-end reproduction acceptance gate, its fidelity pairing of
non-text leaves, and structure recovery (owned by the 3-Probe Reproduction Gate
story); how the gate presents the residual channel.

## Technical Context
- Builds on the L1 Layout Substrate (CAP-70, plan item 1): the fold emits a typed
  L1 document validated by the L1 envelope; an invalid fold is rejected.
- Reuses the existing responsive-diff node alignment to match nodes across widths.
- Absolute-base form (REQ-79 D1): leaves are absolutely placed by per-width
  keyframes with empty structure primitives — always a valid layout, zero
  structural inference. Structure recovery is a later, optional overlay.
- Box and image leaves pin all four sides (height included) because their extent is
  not derivable from content; a text leaf's height stays natural from flow, so its
  keyframes omit height.
- The height response is a **finite difference**, so it needs a pair: a probe is
  joined to its ladder projection at the same width and the same engine, and a
  width with no such pair simply contributes no response. Elements are joined
  across the pair by the same identity + document-order queue the responsive
  tables use; sections join by index. The factors are measured at the probe width
  and applied at every width — the rules that produce them (`min-h-screen` and its
  kin) are not themselves width-varying, and re-probing at every width would
  multiply capture cost by the ladder length. Ratios are snapped to eighths to
  absorb sub-pixel noise (a measured 0.9975 is the `100vh` rule) without inventing
  structure.
- A backdrop is recognised from the folded geometry rather than from a capture-side
  flag: a painted background image always is one, and a solid fill is one when it
  spans the viewport. Backdrops are ordered after the section-background boxes they
  are a peer of, because a nested backdrop sits inside the section it overlays.
- BUG-24 — the scrim had **two** independent root causes, and only one of them is
  this story's. The capture-side half (detecting the veil and projecting it onto
  the section values) belongs to the values-diff fidelity capability; the fold-side
  half is here — the projection was carried end to end all along, but the section
  fold read the background-image handle *only*, so a correctly captured scrim could
  not round-trip and a hero veil over a photograph was dropped. Nothing new is
  emitted for it: the renderer already layers the scrim above the background image
  within one box, so the scrim needs no node of its own — which is why the fold
  condition widens to image-or-scrim rather than the box gaining a child.
- BUG-19 — the bar rule is a *second* seeding path within the per-surface fill
  attribution the majority rule already implements, not a replacement for it. The
  two are ordered so the majority band still wins the page, and the bar only
  rescues a strip the majority rule cannot see.
- **Two families of self-painting run**, both discovered as reconstruction defects.
  A **pill** (BUG-20) is recognised by radius saturation — a radius reaching half
  the run's painted height is what a badge is and what a card never is; its
  authored radius is often a sentinel (`rounded-full` computes to 33554400px) and
  is clamped into the envelope, which renders identically. A **padded control**
  (BUG-21) — a button, a submit link — has only modest rounding, so pill
  saturation misses it; it is recognised by authored vertical inset over its own
  fill, guarded so an ancestor-attributed treatment (a gradient, an accent
  `borderLeft`) stays on the card box where the text leaf cannot carry it. Before
  BUG-21 the card path outset such a run by an inferred padding, giving every
  button twice its height.
- The derived config is bounded by what a resting capture can see, which is why
  each fallback carries a gap rather than a guess: height is the only evidence of
  a multi-line box when no input type was recorded, and no evidence at all names
  an endpoint. A fabricated endpoint would be the one derivation that silently
  sends real leads somewhere, so it is the one the fold refuses outright.
- Label placement and submit wording are the two derived facts with **no painted
  witness** — both are read off what the capture recorded *about* the controls (the
  accessible tree's name source; the claimed chip's text) rather than off pixels,
  and both cost geometry when wrong rather than merely looking different. A label
  row the reference never had displaces every field beneath it, so the error
  accumulates down the form; a submit button rendered from the module's default
  wording leaves the reference's own chip stranded as a page-level run beside the
  form it belongs to. Where the parameter lives in the module's declared config,
  and why it is not an L1 axis, is the behavior-module contract's to state, not
  this story's — the fold's half is only that the fact is read off the capture.
- Rebasing a control to its seam changes only the ORIGIN of its geometry, never the
  measured box: the seam's own rect is the union of the cluster (widened to hold a
  claimed submit button), and each control's keyframe is its captured box minus the
  seam's at the same width. A submit button is matched to its form geometrically,
  since the capture reads painted boxes rather than `<form>` boundaries.
- The residual signal is an **opt-in channel**: a caller that asks for residuals
  receives one per unexpressed element; a caller that does not still gets the same
  reproduction document, and the elements are dropped without a signal. This kept
  the fold's published return shape unchanged.
- The residual channel is per **element**. An unreadable *value* on an element the
  fold can otherwise express is not a residual — the leaf is still emitted, minus
  the axis. The gap stays findable because both framing values are axes the
  reproduction comparison already checks: an unfolded one reports as a difference
  rather than being silently closed with a guess. This is the value-level analogue
  of the element-level promise, reported through the comparison instead of the
  residual list.
- REQ-88 — taking a capture bundle all the way to a servable, gate-able site is the
  largest single intent shaping this fold. Driving a real reproduction end to end is
  what surfaced the fidelity gaps it closed: per-width padding tracks, the no-wrap
  threshold, the centred content column with column-anchored geometry, the
  viewport-height probe and the response it folds to, and the use of the *captured*
  surface-bearing box for a reconstructed card, so a card's edges are a measured
  fact rather than arithmetic over where its text happens to sit — with the two
  qualifiers the Description states: a viewport-wide surface is the band and is
  refused as a card's rect, and the accepted rect doubles as the grouping identity
  that decides which runs are one card.
- The column fit is a *reproduction* test, not a resemblance test, in two further
  ways the Description's rules rest on. Its origin is the **modal** left edge —
  the edge the most content shares, not the minimum — because a real page has more
  than one gutter (this reference sets its header wider than its content column)
  and taking the extreme made the fit fail outright. And a nested cap on an
  anchored extent is admitted only on an **over-determined** fit, because a
  two-unknown fit through two points is interpolation rather than evidence: the
  hero title's shrink-to-fit width fits any two of its samples and then "verifies"
  against the cap, yielding a coefficient that runs kilometres wide off-sample.
- BUG-17 / BUG-18 / BUG-21 are three of the defects behind those axes. The fold
  dropped element padding outright (BUG-17); it read a text run's axes from the
  widest cell only, so type rendered at desktop size on mobile (BUG-18); and a
  control surface box double-applied padding when the fold computed its own
  inset/outset pair rather than adopting the captured surface shape (BUG-21).
  BUG-18's own root cause — axes taken from the widest present sample — is still
  the rule for the *base* value of every axis; the responsive track is layered over
  it, not a replacement for it.
- BUG-23 — a reproduction that still named the captured origin rendered only while
  that origin stayed up and blinded the perceptual gate to image regressions, so
  handle rewriting and its hard failure live in the materialization verb, not in
  the fold. The bundle's mirrored assets are the only source consulted; nothing is
  fetched at materialization time. The bug had **two** halves and both are here:
  the hard failure on an unmirrored handle (a broken reproduction) and its
  converse, the mirrored asset no node references (a fold gap). The second is
  reported rather than treated as a no-op precisely because the bytes prove the
  capture saw something the fold could not place.
- REQ-136 — the framing pair (which part of a picture its box shows) and the
  colour-adjustment stack were both read by the capture all along and dropped by
  the fold, because the substrate had nowhere to put them. The adjustment was
  already a compared axis, so before this every target that painted one reported a
  difference that no fold could close. Only the percentage-pair form of the framing
  value is read; keyword and length forms are left unfolded.
- The clamp ceilings the fold applies are the envelope's own (the adjustment
  amount, the rotation range for a hue shift, the effect-length range for a blur),
  so a clamped fold always validates.
- A shadow written as an adjustment function is deliberately NOT read: the
  substrate already carries a typed shadow, and folding it here would give it two
  ways to say one thing — the legacy-mode state the project forbids. It stays
  unfolded until it has one home.
- Geometry-affecting axes (transform / mask) are deliberately **not** folded: the
  captured box is post-transform, so folding them would double-apply against the
  geometry the fold already pins. Paint-only treatments (text shadow, the colour
  adjustment) and pure framing (which part of a picture its box shows, which does
  not move the box) are idempotency-safe and are folded.
- The re-fold is a *derivation* refresh: a bundle with no retained ladder has no
  oracle to re-fold and is rejected with a re-capture instruction rather than
  silently producing a document from nothing.
- The hint pass runs as a separate capture read from the values extraction, so the
  values pipeline is untouched; hints are advisory-only by construction.
- Supersedes the pre-L1 `adopt-values` command (REQ-66), a vestige of the
  old-model reproduction path; the independent `adopt-gaps` (REQ-74) feature is
  left untouched.
- The earlier "text leaves only" divergence is closed: text-free media, painted
  surfaces, backdrops, the page band and the controls of a behaviour seam now fold;
  only unclassifiable text-free elements and geometry-less elements remain
  residuals by design.

## Dependencies
Plan item 1 — L1 Layout Substrate + Safety Envelope (CAP-70), whose axis vocabulary,
`control` node kind and document-level font resource table this fold populates.

## Story Points
3