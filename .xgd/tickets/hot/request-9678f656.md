---
uid: request-9678f656
id: REQ-335
type: request
title: No way to author an animated or interactive illustration — drawings are static-only
  and raster art cannot be driven at all
created_by: xgd
created_at: '2026-09-27T00:30:19.279491+00:00'
updated_at: '2026-09-28T19:10:00.038402+00:00'
completed_at: null
last_field_updated: status
status: free_coding
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-dc48909f
---

## What I was trying to achieve

A site's hero illustrations are detailed line drawings. The intended effect is that each one **comes to life under the cursor**: mechanical arms that begin to draw each other, a lever that actually lifts its load, a block diagram that assembles itself element by element, field lines that drift, a portrait whose eyes move.

This is the single strongest idea available to that page. The illustrations are its most memorable asset and they are currently inert decoration.

## What stopped me

**Two independent walls, and between them the whole class of effect is unreachable.**

**1. Generated drawings are static-only.** Writing an SVG containing a declarative animation is refused whole:

```
byte 116: <animate> is not an element a generated image may use.
byte 125: 'attributeName' is not an attribute a generated image may carry.
byte 144: 'values' is not an attribute a generated image may carry.
byte 162: 'dur' is not an attribute a generated image may carry.
byte 171: 'repeatCount' is not an attribute a generated image may carry.
```

The refusal is correct under the stated rules — the drawing surface permits shapes, paths, gradients, text and grouping, and nothing else. But `<animate>` and `<animateTransform>` are **declarative and non-executable**. They are not script. The security argument that excludes `<script>`, event handlers, stylesheets and external references does not obviously reach them, and excluding them costs the entire category of motion graphics.

**2. Element-level motion is entrance-only and single-shot.** What exists is a scroll-entrance reveal (opacity + Y translate, once) and hover state changes (colour, filter, shadow, border, opacity). Neither can express a sequence, neither loops, and neither can address *part* of an image — which is the whole point: the arms must move while the parchment does not.

**3. Raster art cannot be decomposed.** Most illustrations arrive as PNGs. Even with animation available on the drawing surface, there is no path from "a generated raster illustration" to "the same illustration with independently addressable parts". That gap deserves saying out loud because it determines the migration story for any site already built on generated imagery.

## What would have let me finish

In rough order of cost and of how much each unlocks:

**A — Permit declarative SMIL in generated drawings.** `<animate>`, `<animateTransform>`, `<animateMotion>`, `<set>`, with `attributeName`, `values`, `from`/`to`, `dur`, `begin`, `repeatCount`, `keyTimes`, `calcMode`, `fill`. No scripting, no external references, no event handlers — the existing prohibitions stand untouched. This is the cheapest change and on its own it delivers looping ambient motion (drifting field lines, a breathing spiral).

Worth deciding deliberately: `begin="mouseover"` is a *declarative* trigger, not an event handler in the scripting sense. Allowing it would give hover-driven illustration with no executable surface at all. That single attribute is most of what I actually wanted.

**B — CSS-style animation on L1 elements: keyframes, duration, easing, iteration, direction, and a trigger (`load`, `hover`, `in-view`).** This composes with REQ-329 (multiple animations per element) and would let a whole plate pulse or drift without touching the drawing surface. It does not solve moving *part* of an image.

**C — Addressable parts within a drawing.** The largest and most valuable: let a page target an `id` inside a generated SVG and animate it — `#left-arm`, `#lever-beam`, `#eye-l`. That is what "the arms draw each other on hover" actually requires, and it is the difference between ambient motion and illustration that performs.

## Why this is worth more than it looks

An illustration that responds is the most quotable thing a page can have — it is what a visitor screenshots, records and sends to someone else. For a site whose distribution is word of mouth rather than search, that is not decoration, it is the distribution mechanism.

There is also a consistency argument. The platform will generate rich imagery for a site and will pin, reveal and zoom it — but the imagery itself is frozen. Every other layer has gained expressiveness; the drawing layer has not moved.

## Related

Overlaps REQ-329 (multiple animations per element) and REQ-328 (scroll-driven state). If B is built, all three want one coherent model of *what animates, when it is triggered, and how several animations on one node compose* — cheaper to design once than to reconcile three times.

## Reproduction

Write a drawing containing `<circle><animate attributeName="cx" values="20;80;20" dur="3s" repeatCount="indefinite"/></circle>`. Refused, with the five messages quoted above. No stored drawing is modified.


---

## Scope as built (REQ-335)

**One primitive, not four features.** The "Related" note above asks for one coherent model of *what animates, when it is triggered, and how several animations on one node compose*. That is what this delivers: a single **timed motion** field (`animate`) that a node may carry, one track or several composed, each aimed at one of three subjects — the **node itself**, a **named part inside a drawing placed in the page**, or **which frame of a film strip is showing**. B, C and D are one primitive pointed at three targets, so there is one trigger set, one loop model, one collision rule, one reduced-motion gate and one emitter rather than three of each.

The four lettered sections below are the request's own A/B/C plus **D — a film strip, stepped**, which is where the body's strongest examples (arms that draw each other, a lever that lifts its load, a diagram that assembles itself) actually become reachable: those are motion an animator draws frame by frame, not motion this schema has an axis for.

### A — declarative SMIL is deliberately NOT permitted

The request is refused on evidence, and the reason is not the security argument the body anticipates. `<animate>` really is declarative and really is not script; that much is granted. Two other facts decide it:

1. **SMIL cannot honour `prefers-reduced-motion`.** It has no media-query gate and can be paused only by script. Every other motion in the platform is emitted behind `not (prefers-reduced-motion: reduce)` and degrades to the authored design. A drawing carrying SMIL would animate for a visitor who has asked their operating system for no motion, and there is no declarative way to stop it. The only in-document alternative — a `<style>` block with an `@media` query — is the raw-CSS line DOC-2 draws.
2. **It breaks capture determinism.** `prefers-reduced-motion: reduce` is the freeze-determinism precondition for the whole capture gate: an unfrozen page projects a different frame every run. SMIL ignores the emulated preference, so an animated drawing would be photographed at an arbitrary animation time and the fidelity gate would go flaky.

There is a third fact that removes most of the motive. `begin="mouseover"` — named in the body as "most of what I actually wanted" — **cannot work at all** through the channel a drawing arrives on. A generated drawing reaches the page as `<img src="...">`, and browsers run `<img>`-embedded SVG in secure animated mode: animation plays, but scripting, external references *and interactivity* are off, so the document receives no pointer events. Permitting the attribute would accept it and then do nothing, which is worse than refusing it.

`validateSvg` therefore keeps its element and attribute sets exactly as they are, and the closed-by-construction property is untouched. What replaces A is C: the drawing is placed **in** the page rather than referenced as an image, at which point it has real pointer events, real cascade participation, and the platform's own reduced-motion gate — and the animation is authored in L1 as structured data instead of as free-form timing strings inside a file.

### B — a timed animation track on any node

A node may carry `animate`: one track, or two or more composed. Each track names

- **stops** — two or more, ascending by progress `at` (0..1), each naming any of `opacity`, `translateXPct`, `translateYPct`, `scale`, `rotateDeg`. A property no stop mentions is not animated.
- **`durationMs`**, and optionally **`delayMs`**, **`easing`** (`linear`, `ease`, `ease-in`, `ease-out`, `ease-in-out`), **`iterations`** (a count, or `infinite`), **`direction`** (`normal`, `reverse`, `alternate`, `alternate-reverse`).
- **`trigger`** — `load` (the default), `hover`, or `in-view`.

This is the looping, sequenced, re-triggerable form the body says is missing: `reveal` fires once and is spent, and `interaction` can only state a second resting state. A plate can now breathe, drift or pulse indefinitely, and can be told to do so when the reader reaches it or while the cursor is over it.

`in-view` reuses REQ-100's existing entrance observer rather than adding a second one — the same class the observer already sets is what the animation is gated on, so a document with no script, a thrown error, or a reduced-motion preference renders fully settled. `hover` compiles to a `:hover` selector and needs no script at all.

Every track is emitted behind `not (prefers-reduced-motion: reduce)`, so a visitor who asked for no motion gets the node's authored opacity, position and scale. The edit channel emits no animation, as it emits no other motion.

**Composition is per property, and it is refused where it would be silent.** A node may carry an entrance, a scroll track, interaction states and a timed animation at once. What it may not do is have two animations claim the same property on the same target: within one CSS animation list the last to name a property wins and the earlier one moves no pixel. That contest is reported as a refusal naming both claimants, which is the rule REQ-329 already states for two entrance behaviours and two scroll tracks — extended to cover timed tracks rather than duplicated for them.

### C — addressable parts within a drawing

An `image` node may carry **`parts: true`**, which declares that its drawing is to be placed into the page rather than referenced as an image, so that ids inside it can be animated. A track on such a node may then name **`part`** — an id in the drawing, written without the `#`.

- The drawing's bytes are **not** carried in the document. They stay the one asset the existing generated-image channel already wrote and validated; the render is handed the source it needs by its caller, the same way behaviour-module fragments and the delivery ladder already reach it. A drawing that cannot be supplied, cannot be found, or does not pass `validateSvg` renders as the plain `<img>` it would have been, with no motion — an inert degradation, like a slot with no module bound to it.
- Nothing rewrites the drawing. Part selectors are scoped by the node's own class, so two copies of one drawing on a page do not need distinct ids and the accepted bytes reach the page exactly as they were accepted.
- The inlined drawing is announced to assistive technology as one image carrying the node's `alt`, exactly as the `<img>` form was.
- A part is transformed about **its own centre**, not about the drawing's viewBox origin, so a rotation or a scale on an arm turns where an author expects it to.
- **Two parts of one drawing animate independently.** This is the capability the body asks for and the one nothing else here delivers: the arms may move while the parchment does not, and a hover-triggered part track is reachable because the drawing is now real DOM with real pointer events.
- Naming a part on a node that has not declared `parts` is **refused** — the envelope can see that, and the author's mistake is one word while the symptom would be a page that simply does not move. Naming a part the drawing does not actually contain is **dropped** rather than refused: only the render holds the drawing, and a renderer that refused a document would take a site off the air over a renamed id. The track emits nothing, so there is no dead rule to mislead whoever debugs it.

### D — a film strip, stepped: motion somebody animated

B and C both move a picture the way *this schema* has axes to move it — drift, breathe, turn, fade. Neither can play motion an **animator drew**, and the body's strongest examples are exactly that: arms that draw each other, a lever that lifts its load, a diagram that assembles itself element by element. A property track cannot express those; a sequence of drawn frames can.

**Why a strip and not an animated GIF.** The obvious answer is refused on evidence, not taste. A GIF begins the instant it decodes and runs on a clock nothing in the page can reach: no property pauses it, nothing restarts it, and there is no way to hold it still for a visitor who has asked their system for no motion. It therefore cannot be given the `hover` and `in-view` triggers this request asks for, and it cannot pass the reduced-motion gate every other motion here passes through. The same two facts that refused A refuse the GIF. A strip gives all of it away for free, because the thing being animated is an ordinary CSS property and the platform already knows how to gate one.

**The declaration is on the node, because it changes the layout.** An `image` may carry **`frames: N`** — *this `src` is a strip of N equal-width frames laid left to right, and this box is a window onto one of them*. The box then shows exactly `1/N` of the file's width. This windowing is **static and unconditional**: a strip with no track, a visitor who asked for no motion, a browser that ran no animation, and a capture taken with motion frozen all show **frame 0** rather than the whole strip squashed into the box. Motion is the only part behind the gate. Frame 0 is the strip's poster and should be the pose the illustration is designed to rest at.

A node becomes a **window with the picture inside it**, because one element cannot be both: the box is one frame wide, the strip is `frames` times that, and a replaced element cannot clip itself. The node's class, id, edit hooks and every geometry, sizing and paint rule land on the wrapper exactly as they landed on the `<img>` — including inside `<picture>`, so format negotiation and the delivery ladder keep working — and the strip is announced to assistive technology as the one picture it was, carrying the node's `alt`.

**A frame track** is the second kind of timed track a node may carry. It names

- **`frames: { from, to }`** — an inclusive frame range of the strip, indexed from 0, so one file can hold several sequences and a node can play the one it wants. Both ends are written out rather than defaulted: the author already had to know the strip's length to declare it, and a range running off the end is then a refusal with a number in it instead of a page showing a frame that is not there.
- **`durationMs`**, and optionally **`delayMs`**, **`iterations`** (a count or `infinite`), **`direction`**, and **`trigger`** (`load`, `hover`, `in-view`) — the same triggers, loop and composition model B already defines, so *"plays while the cursor is over it and stops when it leaves"* and *"starts when the reader scrolls to it"* are the existing mechanism pointed at a new subject.
- **No `easing`.** A frame either is showing or is not, so the timing function is `steps(n, jump-none)` **derived from the range** — `n` frames, landing on both ends, so a pass finishes on the frame the author named rather than one past it. An author who could write `ease-in` here would be writing a value the renderer must ignore, which is the accepted-and-inert failure this envelope refuses everywhere.
- **No `part`.** A strip is one picture per frame; there is nothing inside it to name. `parts` and `frames` are refused together on a node for the same reason — a strip is stepped, a drawing is placed in the page, and a node is one or the other.

**A strip plays while its plate moves.** A frame track's subject is the picture inside the window; a property track's subject is the node itself. They are different elements, so they compose in one list rather than contesting: the film can run while the plate holding it drifts. Two frame tracks on one node *do* contest — both claim the same picture — and are refused by the same collision rule B states, naming both claimants.

**Refused rather than silently inert**, each because the author's mistake is one field and the symptom would be a picture that simply never moves: a frame track on a node that declared no `frames`; a range that does not run forward (`to` must exceed `from` — one frame is a still, and backwards is a `direction`); a range at or past the frame count; `objectFit` or `objectPosition` alongside `frames`, since a strip's box is a window whose fit and position are the frame mechanism's to set.

**The strip's frame count is bounded** — two at the floor, because a one-frame strip is a picture and already has a spelling, and a ceiling that is a *download* bound rather than a taste one: every frame of a strip is fetched before the first one paints, so a strip is as heavy as all of it.

**Where the frames come from is a content question, not a code one.** A strip is an ordinary image asset on the existing generated-image channel; nothing here reads it, and nothing needs to. An operator-supplied strip and a generated one are the same file to this mechanism.

### What remains out of scope, stated deliberately

**Raster DECOMPOSITION is a non-goal — but a raster illustration is not stuck.** There is no path from a generated PNG to independently addressable parts, and nothing in the platform grows into one cheaply; that half of the body's third wall stands. What the body implies and this does not accept is that a raster is therefore inert: a piece of it can be **composed over** rather than cut out of. A second `image` node placed over the first, windowed onto the region that should move and carrying a track from B, moves that part of a photograph with nothing new built — and because it sits exactly on top at rest, a visitor who asked for no motion sees the original illustration pixel for pixel. Where the overlay must be a free-form silhouette rather than a rectangle or a soft shape, the transparency has to be in a supplied file; where the movement is large enough to expose what was beneath it, the base needs retouching. Both are asset work, not platform work. This is recorded because the migration story for a site already built on generated imagery is otherwise left implied.

**An inlined drawing does not round-trip through capture.** The fold recovers no motion today — neither `reveal` nor `scrollTrack` is ever produced from a capture — and an inlined drawing joins them: it is an authored structure, never a folded one. The round-trip gate projects from the L1 document and supplies no drawings, so a document using `parts` renders there as the plain `<img>` and the gate is unaffected rather than weakened.
