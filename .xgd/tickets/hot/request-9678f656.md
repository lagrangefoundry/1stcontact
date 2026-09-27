---
uid: request-9678f656
id: REQ-335
type: request
title: No way to author an animated or interactive illustration — drawings are static-only
  and raster art cannot be driven at all
created_by: xgd
created_at: '2026-09-27T00:30:19.279491+00:00'
updated_at: '2026-09-27T21:03:16.074163+00:00'
completed_at: null
last_field_updated: body
status: draft
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

**One primitive, not three features.** The "Related" note above asks for one coherent model of *what animates, when it is triggered, and how several animations on one node compose*. That is what this delivers: a single **timed animation track** (`animate`) that a node may carry, and which may be aimed either at the node itself or at a **named part inside an inlined drawing**. B and C are the same primitive pointed at two different targets, so there is one schema, one collision rule, one reduced-motion gate and one emitter rather than two of each.

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

### What remains out of scope, stated deliberately

**Raster decomposition is a non-goal.** There is no path from a generated PNG to independently addressable parts, and nothing in the platform grows into one cheaply. The answer for an illustration that should perform is to author it as a drawing. This is recorded so the migration story is not left implied.

**An inlined drawing does not round-trip through capture.** The fold recovers no motion today — neither `reveal` nor `scrollTrack` is ever produced from a capture — and an inlined drawing joins them: it is an authored structure, never a folded one. The round-trip gate projects from the L1 document and supplies no drawings, so a document using `parts` renders there as the plain `<img>` and the gate is unaffected rather than weakened.