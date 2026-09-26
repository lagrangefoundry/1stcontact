---
uid: request-9f377353
id: REQ-329
type: request
title: Multiple animations per element, composed rather than replaced
created_by: xgd
created_at: '2026-09-25T23:35:20.106096+00:00'
updated_at: '2026-09-26T20:08:28.270807+00:00'
completed_at: null
last_field_updated: status
status: free_coded
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-9ebd9398
  commits:
  - working_sha: a8fc4f256c4fb88e7c646061a28cac00bf58ddbb
    reconcile_sha: null
    main_sha: null
  - working_sha: 531a16c186459ed66b6376c3d61479bfcfa26959
    reconcile_sha: null
    main_sha: null
  version: 0.2.379
---

## What I was trying to achieve

An element that both rises-and-fades on entry **and** does something else — shifts at a different rate as the reader scrolls, or has a hover state, or carries a second entrance on a different delay for a child.

## What stopped me

`reveal` is a single object on an element. One element, one animation. There is no way to express "this element has two behaviours" — a second one has to replace the first.

Today this is a soft constraint because `reveal` is the only motion there is. It becomes a hard blocker the moment scroll-linked motion or hover states exist, because the natural authoring request is immediately *"fade in on entry, and then drift as I scroll"* — two animations on one node, with different triggers.

## What would have let me finish

Let the motion field take **a list** rather than a single object. Each entry names its own trigger (entry, scroll range, hover, focus), its own target properties, and its own timing.

Composition rules need deciding, and they are the substance of this request rather than a detail:

- **Two entries targeting the same property.** Later-wins is the simplest rule and probably right. Additive composition is more powerful and much harder to reason about.
- **Transform in particular.** An entrance that translates Y and a scroll-link that also translates Y must compose rather than clobber, or the common case is broken on day one. This is where CSS itself is awkward and where a considered answer would be genuinely better than the web platform's.
- **Ordering.** Whether the list order is meaningful or whether triggers are independent.

## Migration

A single object should keep working — accept either an object or a list, so nothing already authored breaks.

## Why it matters beyond this site

The one-animation-per-element limit will not be visible as a constraint until the *second* motion primitive ships, and at that point it becomes visible everywhere at once. Deciding the composition semantics before then is cheaper than retrofitting them after authors have built against single-slot behaviour.

---

## What changed

Since this was filed, two of the three triggers it anticipated have shipped — REQ-325's `scrollTrack` (scroll-linked motion) and REQ-99's `interaction.hover` / `focus` — and REQ-326 gave the *entrance* the list form. That turned the soft constraint into the hard blocker this ticket predicted, by name: REQ-325 shipped a structural rule `oneMotionDriver` reading **"a node cannot carry both `reveal` and `scrollTrack`"**. The headline composition this request asks for — *fade in on entry, then drift as I scroll* — was the specific document the envelope refused.

Three changes, all in the L1 substrate:

**1. Composition is per CSS PROPERTY, not per axis pairing.** `oneMotionDriver` is gone. In its place, one structural rule spanning every motion on a node — `animatedPropertyIsExclusive`: *"a property a `scrollTrack` animates cannot be animated by anything else on the node"*. An entrance, one or more scroll tracks, a hover and a focus state may now all sit on one node; what they may not do is both move the same CSS property. The reason `oneMotionDriver` gave was true of a *property* (a CSS animation wins the properties it names outright, against any transition or state declaration) and the rule drawn from it covered the whole *pairing* — so it refused every composition that had no contest in it, which is most of them.

The rule spans **hover and focus too**, not just the two motion axes. A hover that dims `opacity` beside a track that fades is the identical trap wearing a third trigger's clothes: the animation wins for the length of the range and the hover moves nothing, with nothing anywhere to say why. Excluding it would be exactly the retrofit this ticket says is more expensive later.

**2. `scrollTrack` takes a list**, one track or two-or-more, mirroring `reveal`'s union exactly. One track carries one `range`, so *"resolve on the way in, lift away on the way out"* had no spelling — naming a second track replaced the first. The renderer emits one `@keyframes` block and one entry in each `animation-*` longhand per track, which is CSS's own composition mechanism.

**3. One projection, read by both the validator and the renderer.** `l1MotionClaims(node)` returns every CSS property every motion on the node claims — per entrance behaviour, per scroll track, per interaction state — with where it was authored and whether it compiles to an animation. The envelope refuses from it and the renderer emits from it, so what is refused and what is emitted cannot come apart. This extends REQ-326's `l1EntranceSteps` construction to span triggers rather than adding a second reading beside it.

### The three decisions the ticket asked for

- **Two entries on the same property → REFUSED, not later-wins.** The ticket offers later-wins as "the simplest rule and probably right". The deliberate departure: the codebase had already answered the same question for two behaviours of one entrance (REQ-326) and answered it with a refusal, on the grounds that the dropped half moves no pixel and says nothing about why — an author meets it as a design that did not arrive rather than as a refusal naming the contest. One question, one answer, now across every trigger. Additive composition was not taken up: the ticket itself calls it much harder to reason about, and nothing in the current vocabulary needs it.
- **Transform in particular → already composed, kept that way rather than merged.** No merge had to be invented, because the renderer had already chosen the independent CSS properties over `transform`: an entrance rises on `translate`, a track drives `translate` / `scale`, a hover nudges `transform`. CSS applies the independent properties and then `transform`, so a hover's lift ADDS to wherever the track has the node rather than replacing it. What remained was the case the independent properties cannot save — two motions on the *same* independent property — and that is what rule 1 refuses.
- **Ordering → triggers are independent; order matters only within a list.** Within `reveal` or `scrollTrack` the list order is the emission order (unchanged from REQ-326). Across triggers nothing is ordered. Declaration order does decide which claimant a refusal names as the offender — the second one — so an entrance that predates the track added beside it reads as the incumbent rather than as the offender.

### Bound

`L1_ENVELOPE.scrollTracks = { min: 2, max: 3 }` — the floor because a one-element array is not a legal spelling of the single form (the schema refuses it outright, as `reveal` does), and the ceiling because a track claims at least one of the three properties a scroll animation can drive and no two may claim the same one, so a fourth could not animate anything. The bound states what the exclusivity rule already implies, as one number an author can read before meeting three separate contests.

### Migration

By construction. Both fields are unions whose first member is the single object, so every document already authored stays valid — and a single track renders byte-identically, keeping REQ-325's `@keyframes` name (`…-sc`, not `…-sc0`) and its single-valued longhands rather than one-element lists.

### Supersession

**REQ-325's AC8 (`oneMotionDriver`) is invalidated by this ticket.** Its reason survives and is carried by the narrower rule; its refusal of the whole pairing does not. `test_UAT_FC_REQ-325_one_motion_driver_per_node` has been rewritten in place to assert what still holds (the contested pair is still refused, now naming the property) and to point at this ticket's suite for the composition it used to forbid. Two other suites carried the old rule as an assumption and were updated: BUG-48's structural-rule coverage map, and the shared-axis-group sweep, where `scrollTrack` was listed as an ALTERNATIVE to `reveal` and is now an ordinary member that composes with every other group.

## Files

- `packages/site-schema/src/l1/motion.ts` — `L1MotionProperty`, `l1ScrollTracks`, `l1ScrollTrackProperties`, `l1MotionClaims` beside the existing `l1EntranceSteps`.
- `packages/site-schema/src/l1/schema.ts` — `l1ScrollMotionSchema` (the union); `scrollTrack` retyped to it; the `oneMotionDriver` paragraph on `l1ScrollTrackSchema` replaced.
- `packages/site-schema/src/l1/validate.ts` — `oneMotionDriver` → `animatedPropertyIsExclusive`; `scrollTracks` envelope bound; `checkScrollMotion` (per-track, indexed paths) and `checkMotionComposition` (the cross-trigger rule).
- `packages/site-schema/src/l1/{types,index}.ts` — `L1ScrollMotion` and the new projection exports.
- `packages/framework/src/l1/render.ts` — `scrollTrackRules` over a list: one block per track, comma-joined `animation-*` longhands.

## Test plan

`tests/test_UAT_FC_REQ-329_composed_motion.test.ts` — seven UATs:

1. an entrance and a scroll track compose on one node (the composition the ticket was filed for): the entrance's pre-state and transition on `opacity`, the track's block and animation on `translate`, neither emitter dropping anything for the other, and both still degrading to the design under reduced motion;
2. a contested property is refused naming the property and both claimants, across all three pairings (entrance↔track, track↔track, hover↔track) — and two *transitions* on one property are not a contest;
3. two scroll tracks compose, each over its own range: two blocks, one entry per track in every animation longhand;
4. a single object is unchanged (same keyframes name, single-valued longhands) and a one-element list is refused;
5. each track is bounded on its own and the refusal names which, single-track paths verbatim, plus the list's own ceiling;
6. a hover composes with an entrance and with two tracks — three properties, three owners, nothing replaced — and the transitions still merge into one declaration set;
7. a composed track keeps REQ-325's safety properties: nothing outside the feature + reduced-motion gate, and the edit channel still renders settled.

Regression scope: the L1 envelope, renderer, reference-projection and axis-group suites, plus the full default vitest project.