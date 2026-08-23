---
uid: request-c0435b4c
id: REQ-99
type: request
title: 'L1 has no interaction-state vocabulary: typed hover / focus axes'
created_by: xgd
created_at: '2026-07-26T01:26:05.669620+00:00'
updated_at: '2026-08-06T04:55:01.902377+00:00'
completed_at: '2026-08-06T04:55:01.902377+00:00'
last_field_updated: status
status: free_and_reconciled
fields:
  priority: medium
  auto_merge_back: true
  needs_review: false
  commits:
  - working_sha: 4ccd42bc9f1d0205ebebea40f3a5ae7b25eb4af0
    reconcile_sha: null
    main_sha: null
  version: 0.0.211
  story_points: 3
  bundled_in: bundle-ee56a66e
  chat_comment: comment-f4d684d3
---

## The gap

L1 has no vocabulary for **interaction state**. There is no `:hover`, no
`:focus`, no `:focus-visible` anywhere in the schema or in
`packages/framework/src/l1/render.ts`.

Every control L1 paints is therefore visually inert: a button gives no pointer
feedback, and a form field gets whatever focus treatment the user agent supplies
by default.

## What is NOT wrong (verified)

There is **no accessibility regression** here, and an earlier reading of
[[request-3a064234]] (REQ-96) that claimed one was wrong. `grep` finds no
`outline: none` anywhere in `packages/framework/src`, so deleting a module's
stylesheet leaves the UA default focus ring intact. Keyboard users keep a
visible focus indicator.

The defect is a **quality ceiling**, not a correctness bug.

## Why it matters now

REQ-96 makes L1 the sole owner of appearance and deletes the modules'
stylesheets. After that change, a form on a Tier-1 site renders with the
*browser default* focus ring and no hover feedback at all — because L1 has no
axis capable of expressing anything else, and the module is no longer permitted
to.

That is acceptable for a functional form and unacceptable for the "expensive,
template-free" bar [[doc-debbaf9a]] (DOC-16) §4 sets for the flagship sites. It
is a gap REQ-96's own scope does not mention.

Found while authoring the xgd.dev hero ([[request-d41fd017]], REQ-95), where
both CTAs are inert on pointer.

## Relationship to the other motion work

This is **interaction state** (discrete, state-driven, always needed).
**Scroll-driven motion** (reveal / stagger) is separate work with a different
driver and timeline — see the companion ticket. They share an easing/duration
vocabulary and should agree on it, but neither blocks the other.

---

# What was built

## The axes — `node.interaction`

A **node-level** field (like `transform` / `mask` / `padding`), carried
identically by all six kinds — `text`, `image`, `slot`, `control`, `box`,
`container`. Node-level rather than per-kind for the reason REQ-98 gives: a
capability each kind re-derives its own slice of is a capability that ends up
asymmetric.

```jsonc
"interaction": {
  "transition": { "durationMs": 160, "easing": "ease-out" },
  "hover": { "surfaceFill": "#1A1A1E", "color": "#FFFFFF",
             "motion": { "offsetYPx": -2, "scale": 1.02 } },
  "focus": { "ring": { "widthPx": 2, "color": "#FAFAF9", "offsetPx": 2 } }
}
```

A **state** is a *delta bag* of axes the base node could already paint: the
shared REQ-98 surface group (`surfaceFill`, `borderRadiusPx`, `opacity`,
gradients, shadow, borders, backdrop blur, blend, background image, overlay)
plus `color`, `textDecoration`, and a typed `motion`
(`offsetXPx` / `offsetYPx` / `scale` / `rotateDeg`). Nothing new had to be
invented for a state to restate anything the node could paint.

`transition` sits on the interaction rather than inside `hover` **on purpose**: a
CSS transition lives on the base rule and therefore governs the *leave* as well
as the enter. Nested inside one state it would describe half the motion and
silently make un-hovering instant. `easing` is a closed enum
(`linear|ease|ease-in|ease-out|ease-in-out`) — never a raw `cubic-bezier(…)`.

## Structured-only holds

The renderer is the **sole pseudo-class sink**. A pseudo-class is a *selector*,
and nothing in an L1 document names one: the instance declares typed value bags
and only `render.ts` knows they compile to `:hover` / `:focus-visible`. Every
object is `.strict()`, so `{ "selector": ":hover" }` / `{ "css": "…" }` are
rejected outright, and a state's `backgroundImageUrl` clears the same
`isSafeUrl` allowlist as an image `src` — a hole that opens only on
pointer-over is still a hole.

The envelope bounds the new surface: `transitionMs ∈ [0, 10000]`,
`focusRingPx ∈ [1, 100]`, motion under the existing effect/transform bounds, and
the shared surface check (`checkSurface`, extracted so `axes` and interaction
states use one code path).

## The focus-indicator obligation

Two halves, both needed:

1. **The schema gives no way to say "no ring."** `widthPx` is positive and the
   field has no `none` variant, so `{ "ring": { "widthPx": 0 } }` fails
   validation with a message that says why.
2. **The renderer supplies a default.** Every bound `control` node gets
   `outline: 2px solid currentColor; outline-offset: 2px` under
   `:focus-visible` when it authored no ring — including when it authored a
   *hover* and nothing else. `currentColor` rather than a fixed hue so it
   inherits the node's own colour and stays visible on a light or dark surface
   without the substrate guessing at a palette. An authored ring replaces it;
   taste may restyle the indicator, never remove it.

This matters specifically because the control emitter neutralises UA chrome
(`appearance: none`) — silence is what would actually strip the indicator.

The ring is **excluded from the transition property list**: a focus ring that
fades in is a focus ring that is briefly absent.

## Two compositional details

- **State motion composes with the base transform.** CSS `transform` replaces
  rather than accumulates, so a hover that only wants to nudge would otherwise
  silently discard an authored rotation. The emitter merges them.
- **`prefers-reduced-motion: reduce`** drops the transition
  (`transition-duration: 0ms`) and collapses state motion back to the base
  transform — the paint change survives, the travel does not.

The transition property list is derived from the declarations the states
actually emit, never a blanket `transition: all` (which would animate the
geometry the keyframe track owns).

## L2 preset

`contactFormPreset` now authors both states — a border that warms on hover, a
ring in the form's own accent colour, a submit button that lifts 1px. A vetted
default look that responds only when the user agent decides to is exactly the
ceiling this ticket names.

## Test plan

`tests/req99-interaction-state.test.ts` — 6 UATs:

- `..._hover_and_focus_axes_emit_pseudo_class_rules` — typed values in, `:hover`
  / `:focus-visible` rules out; transition on the base rule, over a derived
  property list, never `all`.
- `..._no_raw_css_or_selector_can_enter_through_interaction` — 10 hostile
  documents (CSS-string colour, `javascript:` / `data:` URLs, a `selector` key, a
  `css` key, a string length, a raw cubic-bezier, `currentColor` as a hex field,
  a 0-width and a negative-width ring, an undeclared `active` state) all rejected.
- `..._interactive_node_always_has_a_focus_indicator` — default ring with no
  interaction, with a hover-only interaction, replaced by an authored ring; and
  no `outline: none` / `outline: 0` anywhere in any of the three.
- `..._state_motion_composes_with_the_base_transform`
- `..._reduced_motion_drops_movement_but_keeps_the_paint`
- `..._interaction_is_carried_by_every_node_kind` — all six kinds.

Regression scope: full suite, 837 tests green; clean `tsc` across
site-schema / framework / tools-generate.

## Acceptance

- ✅ A node declares `hover` / `focus` as typed values; the renderer emits the
  corresponding rules.
- ✅ No raw CSS or selector can enter through these fields.
- ✅ An interactive node cannot end up with no focus indicator.
- ⚠️ **The xgd.dev CTAs respond to pointer — not yet to keyboard.** Both CTAs
  now carry an authored hover (lift + fill/shadow, 160ms ease-out, reduced-motion
  respected) and the site validates and renders. Keyboard focus is *not*
  reachable for them, and no interaction axis can make it so: they are L1 `box`
  nodes, which render as `<div>`. Only a `control` node bound to a behavior
  module is focusable today. Making a plain CTA focusable needs a navigation
  surface (a typed link/href axis, with its own URL allowlist) — a different
  capability from interaction *state*, and out of this ticket's scope.

  The xgd.dev site definition itself (`storage/sites/xgd/`) is untracked and
  belongs to REQ-95; the CTA edit is applied in the working tree but is **not**
  in this ticket's commit. Site config/theme is exempt from free-coding ceremony
  ([[DOC-21]] §1).