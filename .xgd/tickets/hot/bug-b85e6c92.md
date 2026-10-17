---
uid: bug-b85e6c92
id: BUG-209
type: bug
title: 'Progress banner: looks like a line of text — boxes not ''|'', no colon, current-stage
  tint bleeds, not full width'
created_by: EPIC-19
created_at: '2026-10-17T14:10:11.145682+00:00'
updated_at: '2026-10-17T14:49:55.744158+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  severity: low
  priority: high
  story_points: 2
  epic_parent: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-a3ef0be5
  commits:
  - working_sha: 04938d7927e0ecc6a711dd6da05aea485875d532
    reconcile_sha: null
    main_sha: null
  - working_sha: 7a159f8741e05e4ca524954e6705a5e73b752f0a
    reconcile_sha: null
    main_sha: null
  version: 0.2.509
---

## Symptom

REQ-398's progress banner is semantically right but looks like a line of text, not a UI control. The operator's four points (2026-10-17):

1. **The title reads "Progress:".** It should be **"Progress"**, with no colon.
2. **The stages are separated by literal "|" characters.** The operator wants **boxes**.
3. **The in-progress stage's blue shading also covers the "|" before it.**
4. **It doesn't span the full width of the chat panel.**

## Root cause

- **(1):** `PLAN_STAGES_TITLE = 'Progress:'` in `apps/control-app/src/builder/config.js`.
- **(2) and (3):** the divider is drawn as CSS generated content inside each stage: `.plan-stage + .plan-stage::before { content: '|' }` in the builder stylesheet's progress-banner block. Since the "|" belongs to the stage that follows it, the in-progress stage's `background` paints behind its own leading divider.
- **(4):** the stages sit as `flex: none` pills inside the list. The banner is sized by its content and doesn't fill the row. It's also wrapped by the plan panel's own margins, not running edge to edge across the chat column.

## Fix

The banner becomes a **segmented progress bar**: a row of boxes, one per stage, filling the whole width.

1. **Title:** "Progress", no colon. It's a label at the left of the bar, visually part of the control, not running text.
2. **Each stage is a box:** a bordered, rounded segment with the stage number centred, separated from its neighbours by a small gap.
   - **No "|" characters anywhere.** The text separators are deleted, not hidden.
   - The boxes share the available width, so the bar always reaches the right-hand edge. The in-progress box takes more width so its name fits next to the number. Its name ends in an ellipsis if there's still not enough room.
3. **State styling applies to the box itself,** and nothing outside it is tinted:
   - **not started:** grey outline, grey number;
   - **done:** green fill with a ✓;
   - **in progress:** blue fill or outline, expanded with its name, plus the spinner while a turn runs;
   - **skipped:** yellow with a dash.

   No colour bleeds into a gap or a neighbouring box. Colour is still never the only signal (✓, dash, expansion), as REQ-398 requires.
4. **Full width of the chat panel:** the bar runs edge to edge across the chat column, above the questions, and stays pinned while they scroll. It still never wraps; on a narrow panel the boxes shrink to their numbers.
5. **REQ-398's behaviour is unchanged:** the skipped rule, the hover/focus/tap explanation, read-only stages and the spinner. This is presentation only.

## Test plan

UATs `test_UAT_FC_<this ticket>_*`, on the rendered plan panel:

- The title text is exactly "Progress".
- No "|" character appears in the banner's text or in any generated content of its stage elements.
- Each stage renders as its own box element. The in-progress stage's background is confined to its own box: no divider or sibling element is inside it.
- The bar's width equals the chat panel's content width at more than one panel width. It stays on one line at a narrow width.
- REQ-398's existing UATs pass. The one exception is its title assertion, which this ticket explicitly supersedes: `'Progress:'` becomes `'Progress'`.

## What changed

- `PLAN_STAGES_TITLE` is now `'Progress'`.
- The builder stylesheet's progress-banner block is rewritten as a segmented bar:
  - The list is a flex row with a 4px gap.
  - Each `.plan-stage` is a box: `flex: 1 1 0`, a minimum width of about one number, a 1px solid border tinted from `--stage-colour`, a 6px radius, and its content centred.
  - The fill comes from a per-state `--stage-fill`: transparent for not started, light green for done, light yellow for skipped, light blue for in progress.
  - The in-progress box is `flex: 3 1 auto` with `min-width: 0` and a full-strength blue border. Its label still ellipsises.
- The `.plan-stage + .plan-stage::before { content: '|' }` rule and its container-query tweak are **deleted**. The banner's existing negative margins already cancel the panel's padding, so the bar runs edge to edge across the panel. The boxes now grow to fill it.
- The DOM, text, `data-state`, the ✓ and – marks, the spinner, the tip and the aria attributes are unchanged. This is presentation only. The stage text (`'3.First draft'`, `'1✓'`) is kept so REQ-390 and REQ-398 still hold.

## Design decisions made during implementation

- **The border is written as longhands** (`border-width` / `border-style` / `border-color`), not the `border` shorthand. jsdom cannot expand a shorthand that contains `color-mix()`, and the longhands are equivalent in browsers.
- **"Full width" is asserted through the CSS rules that produce it,** since jsdom does no layout:
  - the banner's margins equal minus the panel's padding;
  - the list has `flex-grow: 1`;
  - every box has a non-zero grow;
  - the current box grows more, with `flex-basis: auto` and `min-width: 0`;
  - the list has `nowrap` and `overflow: hidden`.

  Because those rules hold at any width, they cover "more than one panel width" without measuring.

UAT file: `tests/test_UAT_FC_BUG-209_progress_bar_boxes.test.ts`. It has four tests: the title, no "|" in text or generated content, box-per-stage with state confined to its own box, and full width on one line with the current box larger.