---
uid: request-6db99075
id: REQ-325
type: request
title: 'Scroll-position-driven state: pinning, and properties that track scroll progress'
created_by: xgd
created_at: '2026-09-25T23:28:50.293953+00:00'
updated_at: '2026-09-26T07:20:02.509897+00:00'
completed_at: null
last_field_updated: body
status: free_coded
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-d74728d8
  commits:
  - working_sha: 6b9f256e0b5a14368c29efa9069c92f22cff402d
    reconcile_sha: null
    main_sha: null
  - working_sha: e793087f690cf598f78c7e4be5f692cc1585b6f8
    reconcile_sha: null
    main_sha: null
  - working_sha: c70b4b4cce87e9086327881fab8eb2cef299a14b
    reconcile_sha: null
    main_sha: null
  version: 0.2.373
  story_points: 5
---

## What I was trying to achieve

An editorial page where a full-bleed image **pins** while the content above it scrolls up behind it, then releases once a following element reaches the image's bottom edge. The specific composition: hero image locks at the top of the viewport; the masthead and sub-line scroll up and disappear behind it; when the next section's rule approaches the image's lower edge, the image releases (or fades, or shrinks) and normal scrolling resumes.

More generally: **any element property driven by scroll position rather than by a one-shot entry trigger.**

## What stopped me

`reveal` is the only motion primitive available, and it is a one-shot entry animation — it fires once when the node enters the viewport and is then done. There is nothing that:

- pins an element to the viewport for a scroll range (CSS `position: sticky` semantics), or
- maps scroll progress within a range onto a property value (opacity, scale, translate, blur).

I checked the element vocabulary rather than assuming. There is no sticky positioning mode in `sizing`/`position`, and `motion` has no scroll-linked variant.

## What would let me finish

Two capabilities, usefully separable:

**1. Sticky positioning.** A positioning mode meaning "behave normally until your top edge reaches offset X from the viewport top, then hold there until your containing block scrolls past." Needs: the offset, and a defined release boundary (natural choice: the parent container's box, as CSS sticky does it). This alone covers most editorial pinning.

**2. Scroll-linked property tracks.** A motion variant where the driver is scroll progress rather than time. Something like a `scrollRange` naming the start and end conditions (e.g. element top enters viewport bottom → element bottom leaves viewport top) and a set of property keyframes across 0..1. Properties worth supporting first: `opacity`, `translateYPct`, `scale`.

Both should be no-ops — or degrade to their end state — when the visitor has asked their platform for reduced motion.

## Priority note

For editorial/portfolio pages this is the single largest expressive gap I have hit. The page can currently do "appear once" and nothing else, which means every scroll-driven composition — pinned imagery, layered reveals, an image that resolves as you descend — is unavailable. Sticky positioning (1) is the cheaper half and delivers most of the value.

---

## What is being built (implementation scope)

Two new node-level axis groups in `nodeAxisGroupsShape`, so every element kind
carries both. Both are typed value bags with the renderer as their sole emitter —
no selector, no keyframe string, no per-site script, nothing an author can write
as CSS.

### 1. `sticky` — the pin

```
sticky: { topPx?: number, fromPx?: number }
```

- `topPx` — the offset from the viewport top the node holds at. Absent → 0.
- `fromPx` — the viewport width at and above which the node pins; below it the
  node scrolls normally. Absent → pins at every width.

Compiles to `position: sticky; top: <topPx>px` on the node's own rule, which
overrides the `position: relative` an in-flow node otherwise takes. The release
boundary is CSS's own: the node holds until its containing block — its parent's
box — has scrolled past, which is the boundary the request asked for and needs no
second declaration.

`fromPx` exists because a pin is a desktop affordance: a full-bleed hero pinned
on a 320px screen holds the whole viewport. Without a width gate the only way to
pin on desktop and not on mobile is to author the subtree twice under paired
`visibility` gates, which is the duplicate-subtree anti-pattern
`responsiveLayout` was added to remove.

**Pinning requires flow.** `position: sticky` and `position: absolute` are
alternatives, and an absolute geometry track already owns `top` — so a node
carrying `sticky` may not carry an absolutely-placed `geometry`. It may carry an
in-flow one (`place: "flow"`), whose offsets are margins and which leaves `top`
free. Refused by a structural rule rather than silently resolved.

A pin only has an effect where the containing block is taller than the pinned
node; a parent that hugs it has nothing to hold it through. That is CSS, and it
is stated in the field's own documentation so the vocabulary reference carries
it.

### 2. `scrollTrack` — properties that track scroll progress

```
scrollTrack: {
  range?: 'cover' | 'contain' | 'enter' | 'exit',
  stops: [{ at: 0..1, opacity?, translateYPct?, scale? }, ...]   // 2 or more
}
```

- `range` names the start and end conditions as a closed set of the four CSS
  named view-progress ranges. Absent → `cover`: from the moment any part of the
  node enters the viewport to the moment the last part leaves it — the range the
  request described longhand.
- `stops` are the property values across that range, `at` being progress 0..1.
  `opacity`, `translateYPct` (a share of the node's own height, the same
  semantics `transform.translateYPct` already has) and `scale` are the three
  properties, exactly as requested.

Compiles to a renderer-named `@keyframes` block plus `animation-timeline: view()`
and an `animation-range`, gated behind `@supports (animation-timeline: view())`.
No script: the driver is the browser's own view-progress timeline, so there is no
scroll listener to write, to vet, or to keep from janking.

**Reduced motion, and the capture, are one mechanism.** The animation
declarations are additionally gated behind
`@media not (prefers-reduced-motion: reduce)`, so a visitor who asked their
platform for no motion gets the settled page — the node's own authored opacity,
position and scale, with the track absent rather than frozen. The capture driver
emulates `prefers-reduced-motion: reduce`, so the same gate is what keeps the L1
round-trip honest: a scroll-tracked page captures settled.

**It fails visible.** A browser without view-progress timelines matches neither
gate, so it gets no animation declarations at all and paints the design. Nothing
is hidden in CSS waiting for something to reveal it.

**One motion driver per node.** `reveal` is a transition to a settled state;
`scrollTrack` is an animation over a scroll range. CSS animations beat
transitions, so a node carrying both would have its `reveal` silently discarded.
Refused as a structural rule rather than shipped as a trap. For the same reason
the renderer emits no scroll track on a `dialog` panel (a fixed overlay never
scrolls, so its progress would never advance) and none in the edit channel
(which renders settled, as it already does for `reveal`).

### Envelope

- `scale` is held to the existing `transformScale` bound, `translateYPct` to
  `translatePct`, `opacity` and `at` to 0..1 by the shape. No new envelope
  constant: these are the same quantities the transform axis already bounds.
- New structural refusals: stops ascend strictly by `at`; a stop must name at
  least one property it moves (a stop that names none interpolates nothing and is
  a silent no-op); `sticky` cannot ride on an absolute geometry track; `reveal`
  and `scrollTrack` cannot share a node.

### Not in scope

Recovering either axis from a capture. The fold reads what a reference *shows*,
and neither a pin nor a scroll track is visible in a single frame at scroll 0 —
`stacked` sets the precedent for an axis a capture cannot recover. Both axes are
authoring vocabulary; a folded document never carries one.

An email page may carry neither: both are added to the refused node-axis list, so
they are named in the refusal rather than silently dropped.

## Test plan

`tests/test_UAT_FC_REQ-325_scroll_position_state.test.ts` — the renderer and the
envelope as the two observation points, the same shape `req100-scroll-reveal`
uses (no browser is needed to prove what the emitter emits):

1. a node declaring `sticky` renders `position: sticky` with its offset, and that
   wins over the `position: relative` an in-flow node otherwise takes;
2. `sticky.fromPx` confines the pin to a `min-width` block, leaving the node in
   normal flow below it;
3. `sticky` on an absolute geometry track is refused by name;
4. a `scrollTrack` compiles to a `@keyframes` block over its stops plus a
   view-timeline animation on the node, inside both the `@supports` and the
   reduced-motion gates;
5. the four `range` values each map to their CSS named range;
6. the settled page is what a browser without the feature, and a visitor who
   asked for reduced motion, actually get — no pre-state hidden anywhere, and the
   edit channel and a dialog panel emit no track at all;
7. the envelope refusals: a non-ascending stop list, a stop naming no property,
   an out-of-range scale or translate, an unknown key, and `reveal` +
   `scrollTrack` on one node;
8. neither axis reaches an email page.


9. a **mounted behaviour module's** own track travels whole. These are
   node-level axis groups, so a node inside a mounted fragment carries them like
   any other — and a fragment's CSS is emitted separately from the page's, so the
   `@keyframes` block must travel with the rule that names it or the mounted node
   references a block the page never received: an animation naming nothing, which
   is a node frozen at its authored state with no error anywhere to say why. The
   block is named from the fragment's own prefixed class counter, so two mounts of
   one module cannot drive each other's animation; an untracked fragment emits no
   keyframes at all.

### Existing suites extended

Both axes are added to `nodeAxisGroupsShape`, which three standing sweeps assert
over by construction — so each is extended rather than left to fail:

- `reconciliation-l1-shared-axis-groups.test.ts` (AC-802) and
  `req105-node-axis-groups.test.ts` — every node kind admits every shared axis
  group. Both new groups are swept on every kind. In the envelope sweep the two
  are checked as **alternatives** rather than as two more additions, because each
  has a pair the envelope refuses: `sticky` is swept in the company of everything
  it composes with minus the absolute `geometry` track, and `scrollTrack` minus
  `reveal`. The kind-level sweep is shape-only, where no structural rule applies,
  so both sit alongside everything else.
- `test_UAT_FC_BUG-48_the_reference_covers_its_source.test.ts` — the vocabulary
  reference covers every structural rule, each provoked by a document that trips
  it. The four new refusals (`stickyIsInFlow`, `oneMotionDriver`,
  `ascendingScrollStops`, `scrollStopMoves`) are added to that table, which is
  also what carries the two new axes' own documentation into the reference.

### Stylesheet emission (a consequence of the feature gate)

`Rule` gains an optional `supports`, and the serializer emits every feature-gated
rule in its own `@supports` block **after** the ungated ones, both groups through
the identical function. A block that cannot be entered must not change what the
rules above it say, and a gated rule that *is* entered is an addition to the
design rather than a replacement — so its place in the cascade is after, always. A
document with no scroll track emits no `@supports` and no `@keyframes`, and its
stylesheet is byte-identical to what it was.


### Merge with REQ-326's composed entrance

REQ-326 landed on `xgd-working` while this was being built, changing `reveal`
from one behaviour to `l1EntranceSchema` — one behaviour, or a list of two or
more that compose — and factoring REQ-100's inline reveal-bounds check into a
`checkEntrance` helper. This branch takes that refactor and keeps its own two
blocks after it.

`oneMotionDriver` is unaffected by the union: it tests `reveal` for presence,
which is truthy for either spelling. Covered explicitly — a **composed**
entrance is refused beside a `scrollTrack` on the same terms as a single one,
because the reason is the cascade and not the arity: an animation beats a
transition however many transitions there are, so the whole composition would be
the half that disappears. Either axis alone remains ordinary in either entrance
spelling.
