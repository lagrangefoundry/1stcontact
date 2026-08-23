---
uid: request-f522d726
id: REQ-100
type: request
title: 'L1 has no motion: typed scroll-reveal and stagger axes (evidence-gated)'
created_by: xgd
created_at: '2026-07-26T01:26:28.363459+00:00'
updated_at: '2026-08-06T04:55:01.385710+00:00'
completed_at: '2026-08-06T04:55:01.385710+00:00'
last_field_updated: status
status: free_and_reconciled
fields:
  priority: medium
  auto_merge_back: true
  needs_review: false
  commits:
  - working_sha: bba7df6e5691dc3f3418fb41a2bd3b2f54649334
    reconcile_sha: null
    main_sha: null
  version: 0.0.212
  story_points: 5
  bundled_in: bundle-ee56a66e
  chat_comment: comment-798b6013
---

## The gap

L1 had no motion of any kind. `grep` for `transition` / `animation` / `scroll`
returned nothing in either `packages/site-schema/src/l1/schema.ts` or
`packages/framework/src/l1/render.ts`.

[[doc-…]] DOC-17 states the cost plainly: *"Purposeful entrance / scroll-reveal
/ hover is the single biggest 'alive vs static-template' signal — on every
polished site."* It is the largest single distance between the current xgd.dev
hero ([[request-d41fd017]], REQ-95) and the Tier-1 bar.

## Where motion belongs — resolved

Operator session (2026-07-25) considered and rejected the behavior-module route.
[[doc-20979492]] (DOC-25) §1 lists "scroll-animation" among future behavior
modules, but that is a throwaway enumeration; [[doc-debbaf9a]] (DOC-16) §4's
*considered* build order lists **REQ-16 motion as a framework primitive**,
alongside REQ-14 background and REQ-15 layer. The primitive reading wins on
three structural grounds:

1. **Modules are nouns; motion is an adjective.** A behavior module wraps L1
   subtrees in *named slots* (DOC-25 §1). Reveal wraps nothing — it modifies a
   node already in the tree. Staggering five hero elements would need five
   module instances, or one repeated slot that flattens the hero's real
   structure into a list.
2. **Capture cannot reach a module.** `fold` maps captured node axes → L1 node
   axes; modules are authored, never folded. If motion lives in a module,
   animated content is unfoldable *by construction* — which already bites us
   (animated text and lazy images come back blank in captures).
3. **Smaller attack surface.** Motion-as-L1-axis compiles to a CSS transition
   plus one renderer-owned IntersectionObserver, vetted once, with zero per-site
   JS. Motion-as-module ships style-mutating JS per module per site — against
   DOC-24 / DOC-2.

**The three-way split:**

| kind | home |
|---|---|
| reveal, stagger | **L1 axes** (this ticket) |
| hover, focus | **L1 axes** (REQ-99 — landed before this) |
| parallax, scroll-scrub, marquee | **behavior module** (DOC-25's entry, correctly scoped) |
| choreography defaults ("restrained editorial") | **L2 preset** — presets are parameterised L1 subtrees (`packages/framework/src/l2/contact-form.ts`), so motion presets compose for free once motion is an axis |

## Sequencing — discharged

The hold said: *do not implement until xgd.dev sections 2–5 are authored to
L1-exhaustion*, resolving toward DOC-21 (grow the framework on evidence) over
DOC-16 §4 (primitives first).

That hold was honoured. At session start `storage/sites/xgd/draft/pages/home.json`
contained only `nav` and `hero`. **§2–§5 were authored first**, on the authoring
face (flow containers with `sizing` / `distribution` / `align` / `visibility`,
no hand-written keyframe track), and verified correct at 375 and 1280 before a
single axis was added:

- **§2 The problem** — three `problem-items` cards
- **§3 How it works** — the capability-matrix chain, four `how-steps` cards
- **§4 The contract** — two `contract-panels` (you own / XGD owns)
- **§5 Evidence** — closing statement + CTA pair, plus a footer

## Axes adopted — each with the section that demanded it

The candidate set in the original body was a hypothesis. It survived contact
with the page, with one addition earned by a concrete failure:

| axis | demanded by |
|---|---|
| `reveal.yPx`, `reveal.fromOpacity` | every band heading block in §2–§5 — a rise and a fade |
| `reveal.durationMs`, `reveal.easing` | the same; **reuses REQ-99's `l1EasingSchema`** rather than minting a second timing vocabulary |
| `container.staggerMs` | §3's four `how-steps` cards (strongest case), §2's three `problem-items`, §4's two `contract-panels` — rows of peers that read mechanical landing together |
| `reveal.delayMs` | **the hero.** Its `cta-row` (`fromPx: 520`) and `cta-stack` (`untilPx: 520`) are a visibility-paired duplicate subtree. A positional stagger counts both and hands the visible one the wrong slot, so the hero uses explicit per-node delays. This is the escape hatch that case earns. |

**Not adopted:** no `xPx`, no entry scale. §2–§5 asked for neither, and the
ticket's discipline was to add only what the page demanded.

## How it works

Construction mirrors REQ-99: the document names a **typed value bag** and only
the renderer knows it compiles to a class, a pre-state rule, and one shared
IntersectionObserver. No document can name a selector, a keyframe, or a script.

Three properties carry the safety:

1. **It fails visible.** The pre-state rule is gated on a `data-l1-motion`
   marker that the script sets *only* when motion will actually run. No JS, no
   `IntersectionObserver`, a thrown error, or a reduced-motion preference → the
   marker is absent, the rule never matches, the reader gets the whole page.
   Hiding content in CSS and revealing it in JS is how a scroll library turns a
   broken script into a blank page; this construction cannot.
2. **Settling needs no second rule.** The pre-state sits under `:not(.l1-in)`,
   so revealing simply stops it matching and the node's own authored opacity and
   geometry resume. A reveal never restates the design and cannot drift from it.
3. **It composes with `interaction`.** Entrance moves the independent
   `translate` property; a hover's motion moves `transform`. Their transitions
   are merged into one declaration set — emitted independently, the second would
   have silently cancelled the first (a revealing CTA losing its hover feedback,
   invisible to either feature's own tests). The merge collapses to a single
   value when uniform, so **REQ-99's emitted CSS is unchanged byte-for-byte**.

**Reduced motion** is honoured twice over: the script declines to set the marker,
and a `@media (prefers-reduced-motion: reduce)` rule restores the node's *own*
settled opacity (not `1` — a node authored at `0.6` stays at `0.6`). The schema
gives the author no vocabulary to override either.

### Defect found by driving a real browser

The observer's root is expanded upward past any real document height
(`rootMargin: '200000px 0px -8% 0px'`), so a node the reader has scrolled beyond
is still intersecting and settles.

This was not designed in — it was found. An instantaneous jump to the foot of the
page (End key, an anchor link, a reload restoring scroll position) produces **no
intersecting frame**, so the observer never delivers an entry and a test inside
the callback never runs. Every band jumped over stayed laid out, occupying space,
and invisible. Expanding the root fixes it declaratively, with no scroll listener
and no per-frame layout cost.

## Evidence

- **8 UATs** — `tests/req100-scroll-reveal.test.ts`. The observer is *executed*
  against a DOM with a stubbed `IntersectionObserver`, not string-matched.
- **`bin/verify_req100_reveal.mjs`** — drives a real browser across five
  scenarios: scroll-through (desktop + mobile), jump-to-foot, JS disabled,
  `prefers-reduced-motion`. All pass.
- Full suite green: 120 files / 845 tests. Typecheck clean across
  `site-schema`, `framework`, `generate`.
- Worked example: xgd.dev §2–§5 + hero choreography, in
  `storage/sites/xgd/draft/pages/home.json`.

## Acceptance — met

- ✅ Typed, closed-enum motion axes; no raw CSS, no keyframe strings, no
  per-site JS (the script is a renderer-owned constant, byte-identical across
  documents, absent entirely from a page that reveals nothing).
- ✅ One renderer-owned IntersectionObserver drives reveal; vetted once.
- ✅ `prefers-reduced-motion` honoured by the renderer, not the author.
- ✅ The axes adopted are the ones xgd.dev §2–5 demanded, each named above.

## Follow-ups (NOT fixed here — REQ-95 AC5 gap-list material)

Surfaced while authoring §2–§5; each is an authoring-face gap, not a motion gap:

- **No responsive `layout` axis.** Switching a container row→stack at a
  breakpoint requires duplicating the subtree behind a `visibility` pair. §2/§3/§4
  each carry a duplicate, and it is also the root cause of the `delayMs` escape
  hatch above.
- **`border` is uniform (all four sides).** A single hairline divider has to be
  authored as a 1px-high `box`.
- **`storage/sites/xgd/import/`** (4.6MB of unreferenced brand-exploration
  images) is left untracked — operator scratch material, not part of the DOC-12
  site layout.