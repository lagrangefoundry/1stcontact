---
uid: story-8acc338d
id: STORY-84
type: story
title: Fold a multi-viewport capture into one L1 reproduction document with advisory
  structural hints
created_by: xgd
created_at: '2026-07-22T19:41:46.012167+00:00'
updated_at: '2026-09-10T14:41:52.614822+00:00'
completed_at: null
last_field_updated: body
status: updated
fields:
  intent_uid: bundle-31e474b9
  capability_uid: capability-2049c9ec
  story_kind: upgrade
  story_points: 3
  uat_coverage: fail
  updated_by: request-8a132869
---

## Story
**As a** site reproducer, **I want** capturing a page to fold its multi-viewport
sample ladder into one renderable L1 reproduction document in the *full* L1
language — text, media, painted surfaces, backdrops, the page band and the
behaviour seams with their controls — plus advisory structural hints, while
keeping the raw ladder as an acceptance oracle, letting me materialize that
document as a servable site and re-fold it offline against the ladder, and
signalling anything it still cannot express, **so that**
reproducing a captured site becomes near-mechanical — capture, fold, render,
gate — and whatever the folder still lacks is named rather than lost.

## Description
`1c capture page <url>` samples a page across a fixed width ladder (the retained
multi-state oracle). This capability adds a *fold* over that ladder: every node is
matched across the sampled widths and emitted as a single L1 document — an
**absolute-base** reproduction where each node carries its authored axes, a
geometry keyframe per sampled width, per-segment `interpolate|snap` transition
flags, and a visibility rule derived from the widths it is present at. The raw
ladder is retained unchanged as the acceptance oracle the fold is gated against.

The fold emits the **full language**, not text alone:
- a **text** leaf for a styled run, carrying the typography axes and the run's own
  per-side padding, plus the text pixel-mover families the language expresses
  (gradient fill, decoration, small-caps, list marker, text shadow);
- an **image** leaf for a text-free media element, carrying its resolved source
  and alternative text (captured onto the media field and carried through the
  manifest), a height-bearing geometry track, its per-side padding and its image
  axes — including how the picture is *seen*: which part of itself its box shows,
  and the colour adjustment painted over it;
- a **box** leaf for a text-free element that paints a standalone surface,
  carrying its per-side padding and the surface's own colour adjustment alongside
  the fill, border, shadow and backdrop blur it already folded;
- a **section-background** box for a captured band that paints behind its own
  content, carrying two axes: the band's background photograph *and* its
  translucent **scrim**. A hero veil is a colour with its **own alpha**, not
  element opacity, so it folds as a second axis of that one box rather than as a
  node of its own. Each axis is read from the widest width that carries it,
  independently — a band may paint an image at some widths and only a scrim at
  others — and a section folds when it paints an image **or** a scrim, so a veil
  over a solid band is carried as faithfully as one over a photograph. A band that
  paints neither folds no box, and a plain band never gains a scrim it did not
  have. Without this the veil is dropped and the band reproduces at full
  brightness, under text the reference had darkened its backdrop for;
- a **backdrop** box leaf for a captured element that paints *behind* content — a
  background photograph at any depth, or a full-bleed opaque panel fill (*opaque*
  deliberately: a full-bleed **translucent** fill is not a backdrop, it is the
  band's own scrim, and is folded as the section-background box's overlay axis
  instead). A
  backdrop is placed in the document's **background layer**, behind the runs of
  the band it sits under, rather than in document order (which would paint a hero
  photograph over the hero's own headline). Its edges join the section-edge set
  that bounds how far a reconstructed band may tile, and its fill counts toward
  the page-base inference — on a page whose panels are all nested, the measured
  backdrops are the only direct evidence of what the page is mostly painted in;
- **reconstructed run surfaces**: the capture composites a card/panel/section fill
  *onto* each run rather than emitting a standalone box, so the fold recovers it.
  The document background band is the fill covering the greatest total band height
  across the reconstructed full-bleed bands *and* the captured backdrops together —
  the page base is chosen by painted extent, from measured evidence, not by counting
  runs. The fill the most runs sit on is only the fallback for a page that
  reconstructs no full-bleed band at all, and the captured canvas fill only the last
  resort beneath that: where bands do not quite meet, the dominant band reads truer
  than the canvas hiding behind them. A **full-bleed bar** — a footer or nav strip
  whose same-fill runs share a row spanning the content width but are individually
  narrow and horizontally *distributed*, hugging the left and right edges with a
  large empty stretch between — seeds a band rather than one tiny card per run,
  which would expose the page background across the bar; an evenly-tiled card grid
  on one fill, with small even gaps, stays cards. A run
  whose **own** border box already spans the surface it paints is **self-painting**:
  it folds that surface onto its own text leaf and contributes no backing box,
  because there is nothing left behind it to paint. Two families qualify — a pill
  badge, whose corner radius reaches at least half its painted height, and a padded
  control (a button, a submit link), whose authored vertical inset means the box the
  capture measured already covers the fill. Every *other* run whose surface differs
  from the band (or carries a gradient the body cannot paint) still gets a backing
  box emitted before the content so each leaf paints over its own surface — and that
  box's edges, radius and grouping come from the **captured surface rect**: the
  capture already resolves which ancestor paints the run and records that element's
  own box, so a card's geometry is a measured fact. Only a run whose surface the
  capture did not resolve falls back to the runs' own union, and then reaches no
  further than that box. Nothing is inferred from where the text happens to sit;
- a **font resource table** binding each painted family handle to its served
  substance, populated only with the families a folded text leaf actually paints.

**An axis the page makes responsive folds to a track, not to one desktop value.**
The width ladder does not only fix geometry. A numeric axis whose value differs
across the sampled widths is emitted as a per-width keyframe track on the same
terms as geometry — the numeric type axes (font size, line height, letter spacing) and
each padding side independently — while an axis holding a single value everywhere
stays a plain scalar. Reading every axis from the node's widest present sample (the
desktop rendering) is correct only for an axis the page holds constant: for one the
page varies it painted the desktop value at every width, which rendered text
oversized at mobile and replayed a desktop pad at 320. A track earns its place only
by varying, so a static axis is never bloated into one.

**Padding folds inward, never outward.** A captured box is a *border* box — it
already includes the element's own padding — so folding the per-side pad insets the
leaf's content inside geometry the fold has already pinned, rather than inflating
it. That is what gives a badge or a control its shape and its click target while
its measured box stays exactly where the capture found it.

**The ladder also fixes where a run stopped wrapping.** Alongside the visibility
rule — which is the same shape of fact, read off the same ladder — the fold
derives for each text run the smallest captured width at which the reference set
it on a single line at that width *and at every wider one*. It is a **width, not a
flag**, and that distinction is the whole of it: a threshold can never claim more
than the reference showed, so a run that is one line at 1024 but two at 1280
yields the higher rung rather than the lower, and a width whose line count cannot
be measured breaks the suffix rather than reading as "one line" — the reading that
would pin a real paragraph unbreakable and overprint whatever sits absolutely
positioned below it. The fold derives the threshold and carries it on the run;
what the renderer then does with it above that width is the copy-editing
capability's floor (CAP-70, STORY-83 / AC-1010), not this story's.

**A second sampling axis: viewport height.** The width ladder alone cannot see a
viewport-relative extent. A `100vh` hero measuring 1024 at 768x1024 and 768 at
1024x768 is indistinguishable from an element that simply shrinks with width, so the
axis is not merely unmodelled but *unfittable*, and the rule reproduces as a pinned
pixel height that stops short of the fold in any window of another size. The fold
therefore also consumes **height probes** — one ladder width re-shot at a second
viewport height — and derives from each pair a per-node `{yFactor, heightFactor}`
response carried on the node's geometry. The response is a **measured finite
difference**, never an inference from a correlation: with no probe the fold emits no
response at all rather than guessing. A probe is *evidence about the height axis and
never a keyframe of its own* — the ladder alone defines keyframes, screenshots and
diff cells, so the first projection at a width defines the ladder and any later one
at that width is read as evidence. Each response is applied against its own
keyframe's captured height, so a keyframe still evaluates to exactly its captured
pixels at capture size; a reconstructed card inherits the response of the
representative row it was built from.

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

Anything the fold still cannot express is **signalled, not dropped**: each such
element becomes a typed residual naming its kind, the reason, the painted axes it
carried and the widths it appeared at, so a folder-power gap reads as a framework
gap instead of vanishing.

Because the folded document and its forms are a pure function of the retained
oracle and the *current* fold, the capability also exposes an **offline re-fold**:
re-deriving both from a bundle's own retained ladder, rewriting only what the fold
produced and leaving the oracle, screenshots, mirrored assets and hints untouched,
so a fold change can be picked up without re-hitting the captured origin (which
would re-roll the reference in the same step).

**Materializing a folded bundle as a servable site.** A folded document is only a
file until something can serve it, so the capability also owns the operator verb
`1c repro <slug> --ref <bundle>`, which imports a bundle as **a site whose home
page *is* its folded L1 document**,
mirroring the bundle's assets into the draft so the existing render / serve / shot
/ diff / values-diff loop works on the reproduction unchanged. It is **idempotent**
— re-running wipes and rebuilds — and on the reproduction values it adds and
subtracts nothing: a verbatim copy of what the fold produced. Every media handle is
rebound from the captured origin to that mirror *before* the document is written,
and a handle with no mirrored asset **fails the import outright** rather than
yielding a reproduction that hotlinks the origin — which would render only while
that host is up and would blind the perceptual gate to image regressions. Mirrored
assets the folded document references nowhere are reported as a fold gap to close
rather than ignored.

A separate **advisory structural-hint** pass emits a sidecar describing the CSS
*relationships* the painted-geometry fold deliberately omits — parent computed
layout, authored sizing units, position mode, ancestry, sibling repetition, and
the page's real `@media` breakpoints. Hints are read for DIRECTION (which
structure an AI may later recover over the absolute base), never for EXECUTION:
nothing in the render/reproduction path consumes them, and the folded L1 document
renders as a complete reproduction on its own.

**In scope:** the fold to one L1 document in the full language (text, image, box,
section-background boxes carrying a band's image and its translucent scrim,
backdrops in the background layer, reconstructed surfaces, page band, behaviour
seams with rebased control leaves, font table), the framing and colour-adjustment
axes a captured picture or surface carries, the per-side padding fold, per-width
responsive tracks for the type and padding axes that vary, the self-painting-run
discrimination, the full-bleed-bar band rule and captured-surface-rect card
geometry, the extent-measured page-base inference, the viewport-height
response derived from height probes, the derived nowrap threshold a run carries,
oracle retention, the offline re-fold, the materialization of a bundle as a
servable L1 site with its assets localized (`1c repro`),
geometry keyframes + interpolate/snap classification + visibility rules, the typed
residual signal for unexpressed elements, the advisory hint sidecar, and
supersession of the pre-L1 `adopt-values` reproduction command.

**Out of scope:** the L1 typed tree / envelope / renderer themselves, including the
axis vocabulary these folded values land in, the `control` node kind and its
emitter, and the resource-table form (owned by the L1 Layout Substrate capability);
what a behavior module declares and how it wires a bound control (owned by the
behavior-module contract); the capture-side rules that decide a band's extent,
index the backdrops, shoot the height probe, record a run's surface shape, and
resolve a band's scrim through the canvas colour probe (including the exclusion
that keeps a translucent fill out of the backdrop index — CAP-63, STORY-75), and
the values-diff axis coverage (owned by the values-diff fidelity capability);
how the renderer spends the derived nowrap threshold as a wrapping floor above
that width (owned by the structured copy-editing capability, STORY-83 / AC-1010); the
editor surface that writes the same framing parameters by hand (owned by the
structured copy-editing capability); the end-to-end reproduction acceptance gate,
its fidelity pairing of non-text leaves, and structure recovery (owned by the
3-Probe Reproduction Gate story); how the gate presents the residual channel.

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
- A responsive track is emitted only when at least two sampled widths carry the axis
  AND its values differ there; the widest keyframe reads its value exactly as the
  scalar would have, so the two forms agree at the desktop end. Segments are omitted
  so the default is `interpolate`, mirroring geometry's fluid default.
- Padding sides that are zero, absent or out of range are dropped, and an all-zero
  padding emits no axis at all — the pad is folded because the renderer's box model
  is border-box, so an inset content area and a pinned outer box are consistent.
- The self-painting discriminators are read from the element's OWN computed style,
  unlike `surfaceFill` / `surfaceGradient` / the left-accent border, which the
  capture resolves by walking ancestors. A radius reaching half the painted height
  is pill saturation — what a badge is and what a card never is; an authored
  *vertical* inset marks a padded control, since normal block flow gives a text
  element none. Horizontal padding alone is deliberately not enough (a `pl`-indented
  run inside a card is a common shape and its fill belongs to the card), and a
  gradient or a left-accent rule keeps the treatment on the backing box, where a
  run's own axes cannot carry it.
- The captured surface rect doubles as an exact grouping identity — two runs painted
  by the same element share it, two runs on different cards never do — so sibling
  tiles can neither merge nor drift. A surface as wide as the viewport is the band,
  not a card. The earlier inferred card padding/outset estimates are deleted rather
  than corrected: fixing them per edge only reversed the error's direction, and a
  run is square while the panel element carries its own radius.
- A backdrop is recognised from the folded geometry rather than from a capture-side
  flag: a painted background image always is one, and a solid fill is one when it
  spans the viewport. Backdrops are ordered after the section-background boxes they
  are a peer of, because a nested backdrop sits inside the section it overlays.
- A section-background box is folded from the capture's per-band section values
  rather than from the element manifest, because a band's photograph and its veil
  are painted by the band itself and never enter the manifest. Both axes ride one
  box: the substrate already carried a typed overlay and the renderer already
  layered it above the background image, so nothing downstream needed changing —
  the fold reading only the image URL was the whole of the gap, and a scrim that
  was captured correctly still could not round-trip. The per-axis widest-width read
  is what lets an image and a scrim that appear at different rungs both survive.
- The height probe deliberately re-shoots an *existing* ladder width rather than
  adding a new one: the ladder defines keyframes, screenshots and diff cells, and a
  duplicate width would perturb all three. A band takes its response from its
  section edges rather than from its runs — a hero's copy sits in the top half and
  never moves while the band's bottom travels a full viewport height.
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
- REQ-136 — the framing pair (which part of a picture its box shows) and the
  colour-adjustment stack were both read by the capture all along and dropped by
  the fold, because the substrate had nowhere to put them. The adjustment was
  already a compared axis, so before this every target that painted one reported a
  difference that no fold could close. Only the percentage-pair form of the framing
  value is read; keyword and length forms are left unfolded.
- The clamp ceilings the fold applies are the envelope's own (the adjustment
  amount, the rotation range for a hue shift, the effect-length range for a blur),
  so a clamped fold always validates. A pill's authored radius is often a saturating
  sentinel and is clamped the same way, which renders identically.
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
- The site config the materialization writes is disposable — the durable output is
  the framework growth each residual forces. The import also fails loudly when a
  bundle's L1 seams and its behaviour bindings disagree: both are written by one
  fold, so a mismatch means the bundle is part-stale, and importing it anyway would
  render the behaviours as inert placeholders.
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