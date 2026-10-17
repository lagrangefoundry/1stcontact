---
uid: bug-b85e6c92
id: BUG-209
type: bug
title: 'Progress banner: looks like a line of text — boxes not ''|'', no colon, current-stage
  tint bleeds, not full width'
created_by: EPIC-19
created_at: '2026-10-17T14:10:11.145682+00:00'
updated_at: '2026-10-17T14:14:19.134914+00:00'
completed_at: null
last_field_updated: status
status: free_coding
fields:
  severity: low
  priority: high
  story_points: 2
  epic_parent: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-a3ef0be5
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
- REQ-398's existing UATs pass unchanged.