---
uid: bug-88dfa748
id: BUG-17
type: bug
title: Fold drops element padding — badges/buttons render cramped (0 padding) and
  inter-element gaps inflate
created_by: xgd
created_at: '2026-07-23T23:35:10.980687+00:00'
updated_at: '2026-07-23T23:59:34.071695+00:00'
completed_at: null
last_field_updated: body
status: free_coded
fields:
  severity: high
  priority: high
  auto_merge_back: true
  needs_review: false
  commits:
  - working_sha: b3e14ab524d9ea2585c622ff87343a07843be1b5
    reconcile_sha: null
    main_sha: null
  version: 0.0.189
  story_points: 2
---

Scope under [[request-7ff1bacd]] (REQ-88). From the round-3 gigabytealchemy
values-diff (now trustworthy via [[bug-9dafeb0b]]). Relates to [[bug-29b55835]]
(BUG-14 surface reconstruction).

## Behavior (bug)
Element padding was not folded. From `values-diff --collapse`, `paddingTop/
Right/Bottom/LeftPx` for the badges/buttons is captured but reproduced as 0
`@all`:
- "Coming soon" / "In development": 4 / 12 / 4 / 12 → 0
- "Send message": 12 / 32 / 12 / 32 → 0
- "Subscribe": 12 / 24 / 12 / 24 → 0

Two consequences:
1. **Cramped controls** — pill badges/buttons render as tight text with no
   pill/button shape or click target.
2. **Inflated gaps** — element box heights lost their padding, so many of the
   19 A-structural `gap` deltas were ours-larger-than-target by ~the missing
   padding.

## What changed (fix as implemented)
Added a **node-level `padding` structured axis** to L1 — `{ topPx, rightPx,
bottomPx, leftPx }`, all optional/non-negative — mirroring the existing
node-level `transform`/`mask` precedent so it applies to any leaf/box kind
(text/image/slot/box/container).

- **schema** (`packages/site-schema/src/l1/schema.ts`): `l1PaddingSchema`,
  strict, wired onto every node kind; `L1Padding` type exported.
- **envelope** (`.../l1/validate.ts`): `paddingPx` bound `0..10_000`; rejected
  out-of-range/negative before render (robustness by construction).
- **renderer** (`packages/framework/src/l1/render.ts`): emits per-side
  `padding-*` longhands through the numeric-only sink. Because the document
  reset sets `box-sizing: border-box`, padding **insets content inside** the
  pinned keyframe box rather than inflating geometry — so folding a captured
  (padding-inclusive) box is round-trip-safe. Only present sides emit; an
  absent side never resets the others.
- **fold** (`tools/generate/src/l1/fold.ts`): `foldPadding()` carries the
  captured `paddingTop/Right/Bottom/LeftPx` onto text/image/box leaves;
  zero / absent / out-of-range sides dropped.

### Scope note
The badges ("Coming soon" / "In development") are **text leaves** and now fold
+ render with their captured padding — the L1 mechanism this ticket adds. The
buttons ("Send message" / "Subscribe") are form controls (`a11yRole=button`),
which the fold correctly routes to a `contact-form` **behavior module** as
typed field residuals, not raw L1 leaves (DOC-25/26) — so their padding is a
behavior-module concern, out of L1's scope. The padding axis is nonetheless
available to any leaf a behavior module presents.

## Acceptance
Badges render with their captured padding; the padding axis is `box-sizing:
border-box`-safe (does not inflate the pinned geometry), so it does not regress
`sampleFidelity`. Tests `test_UAT_FC_BUG-17_*`
(`tests/bug17-fold-padding.test.ts`): validator accept/reject (typed,
non-negative, no freeform key), renderer longhands + border-box insetting, and
a design check that the real gigabytealchemy badges fold + render with padding.

## Verification
- `tests/bug17-fold-padding.test.ts` — 7/7 pass.
- Typecheck clean: `site-schema`, `framework`, `tools/generate`.
- L1 regression scope green except two **pre-existing** failures unrelated to
  this change (confirmed failing at baseline with this work stashed):
  `test_UAT_FC_REQ-92_form_controls_stay_residuals` (expects `surface-N` box
  ids) and `test_UAT_AC682_...` (uses slot `capability`, schema field is
  `behavior`).
