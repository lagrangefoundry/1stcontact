---
uid: bug-d94308ad
id: BUG-293
type: bug
title: 'Section layouts: a button stretches into a giant pill when a composition lays
  it out'
created_by: EPIC-19
created_at: '2026-10-26T01:58:08.944446+00:00'
updated_at: '2026-10-26T02:28:53.169252+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  severity: high
  priority: high
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-6ecb92e4
  commits:
  - working_sha: 096aa10fec9167222ba0c736e6d898b77e739c24
    reconcile_sha: null
    main_sha: null
  - working_sha: 8125b7ce1e778db56fe4b2e5369da48b5cd89dab
    reconcile_sha: null
    main_sha: null
  version: 0.2.661
  story_points: 5
---

## Symptom

First-Draft-Test Dina's Diner 4 (site_99aa2f2e…), home page, rendered by the real renderer in Chromium:

- **"See the full menu" (button.primary) is a red pill 357×248 px at 1280 px,** with its label stuck in the
  top-left corner. At 375 px it is a full-width red bar with the label at its left.
- **"Our story" (button.secondary) is an outlined bar 548 px wide at 1280 px,** and full width at 375 px,
  with the label at its left edge.

The operator: "a big mistake on the homepage, an oversized button background that is not aligned
with its text".

## Cause

1. **`cards` takes the button as a card.** `composeSection` (`packages/site-schema/src/l1/design.ts`,
   REQ-463) splits a `cards` section into intro (the leading *text* runs) and items (everything
   after). Dina's "What to order" section starts with a group (heading + lead), so the intro is
   empty and the items are [heading group, price table, button]. That's a 3-column grid with
   `align: stretch`. The button cell stretches to the table's height and the column's width, and the
   component's 999 px radius turns it into an oval.
2. **`cards` never checks that its items are cards.** A heading group, a table and a button aren't
   a band of like items, but the composition applies anyway.
3. **A button stretches in any stretched stack or grid.** In `split`, the text column stretches its
   children, so "Our story" spans the column. On a phone (stack) both buttons span the page, with the
   label left-aligned in a long box.
4. **No layout check sees it.** Nothing flags a button whose painted box is far larger than its
   label and padding.

## Fix

1. **A button keeps its own size.** A text node drawn as a button component (or any text with a
   surface fill and a link) sizes to its label and padding in every layout: it doesn't stretch across
   a grid cell or a stack, and its label stays centred in its padding. Its position follows the
   container's alignment (start, centre or end), never stretch.
2. **`cards` only lays out cards.** The grid is built from like items: groups (or pictures with a
   caption). A leading group holding the heading counts as the intro. A trailing button or link goes
   below the grid as the section's action, not into it. If fewer than two real cards remain, the
   section is left as built.
3. **A layout check for oversized buttons.** At every checked width, the host's layout check reports
   a button whose painted box is more than twice its label's box plus the component's padding, in
   either dimension. It is reported to the builder like other layout faults.

## Test plan

UATs named `test_UAT_FC_BUG-293_*`, rendered by the real renderer and laid out in Chromium, on Dina 4's
stored home page:
- at 1280 and 375 px, "See the full menu" and "Our story" are no larger than label + padding (+1 px),
  with the label centred in the box;
- the "What to order" section under `cards` puts the heading group above, doesn't put the button in
  the grid, and leaves a heading group + table + button section as built rather than 3 columns;
- a `cards` section of three groups still lays out as a grid of three cards with its button below;
- the layout check reports Dina 4's old home page (the 357×248 pill) and is quiet on the fixed one.

## Implementation

1. **A button keeps its own size** (renderer, `packages/framework/src/l1/render.ts`, `buttonDecls`).
   A linked text run drawn as a box (a surface fill or a border, which is what a resolved
   `button.*` component is) gets `width: fit-content` (capped at 100%) and centred text. Its
   `align-self`/`justify-self` is the container's `align` when that is start, center or end;
   when the container stretches or says nothing, it goes where the run's own text aligns
   (centred text centres it, otherwise start). A run that sets its own width (`sizing.width`,
   `width`) or geometry keeps it. The parent's `align` now travels with the flow the
   renderer hands each child (`ParentFlow.align`), including inside a rhythm keep-group.
2. **`cards` only lays out cards** (`composeSection`, `packages/site-schema/src/l1/design.ts`).
   Intro = the leading text runs plus, right after them, a group holding a heading (a run with
   `heading` or role display/h1/h2/h3). Action = the trailing links, or groups holding only
   links, placed below the grid. The rest must be two or more groups; otherwise the section is
   left as built. A single group holding the cards is still the grid's own, but its children
   must all be groups too.
3. **Layout check `button_size`** (kind `oversized_button`, `tools/generate/src/cli/ai/layout-check.ts`,
   thresholds in `layout-check.json`). At every checked width, a button (`buttonLike`, not a
   form field, with words) whose box is more than `overLabel` (2) times its label's word box
   plus its own padding, across or down, is reported. A side under `minPx` (48) is never reported,
   so a short label raised to a tap target's size isn't a fault. The text names the button,
   both sizes, and the fix.

## Supersedes

REQ-447's Ariel snapshot (`tests/fixtures/req447-sites/ariel/layout-before.json`) recorded
Ariel's painted link buttons stretched across their column (up to 1184 px wide at 1280).
Under this ticket those buttons size to their labels, so the ten button entries in that
snapshot now hold the new x and width. Nothing else in the snapshot changed.

## Tests

`tests/test_UAT_FC_BUG-293_a_button_keeps_its_own_size.test.ts`, on Dina 4's stored home page
(`tests/fixtures/bug293/dinas-diner-4.json`: `home` as stored now, `before` as it was when the
operator saw the oval, rebuilt from the stored parts and the change log). Real renderer, real
Chromium:
- both buttons at 1280 and 375 are no larger than their label's lines + padding + border (+1 px),
  with the label centred both ways (`before` and `home`);
- `before`'s "What to order" stays one column: heading group, then the full-width table, then the button;
- three groups between the heading group and the button make a grid of three, with the button below;
- the check reports the 357×248 pill (laid over the page as CSS) once at 1280, naming "See the full
  menu", and reports nothing on either page as rendered now.

All four fail on the code before this change.

Related: [[REQ-463]], [[EPIC-19]].