---
uid: request-4f7a263e
id: REQ-402
type: request
title: 'Looks: a band at the top of the preview with ‹ name ›, the full description
  and ''Tell the consultant…'' — only when the page has looks'
created_by: EPIC-19
created_at: '2026-10-17T15:17:00.556053+00:00'
updated_at: '2026-10-17T15:36:14.222327+00:00'
completed_at: null
last_field_updated: status
status: free_coding
fields:
  priority: high
  story_points: 3
  epic_parent: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-703576d6
---

## What changes

The look selector (REQ-391, reworked by BUG-205 onto the preview toolbar) doesn't have enough room. The operator likes the look descriptions, but squeezed into the toolbar the selector is broken. Decided 2026-10-17, it moves into a **band of its own at the top of the preview area**, shown only when there are looks to compare.

The word stays **"look"**, both in what the client sees and in the code.

## Requirements

1. **There's no band unless the page has looks.** For a page with none, nothing is shown at all: no dimmed controls and no reserved space.
2. **When the page has looks, a band takes the top of the preview area,** full width, above the rendered page. The page moves down to make room; the band isn't overlaid on it. The band appears and disappears as the page in the pane changes.
3. **On the left of the band: `‹ Name ›`**, the look's label between previous/next arrows, with a small "N of M".
   - The current draft is one of the looks, labelled **"Current"** (BUG-205), and stepping wraps around.
   - The cross-fade between looks and the preloading (REQ-391) stay.
4. **To the right, a description area that takes the rest of the band's width,** showing the look's `alternative.description` in full. It wraps to as many lines as it needs and is never cut short. "Current" shows a short line saying it's the page as it stands.
5. **Under the description, the instruction:** **"Tell the consultant which look you prefer, and why."**
   - The wording is exact: "Tell the consultant", not "THE consultant" and not "your consultant".
   - It replaces `LOOKS_TELL_CONSULTANT` in `apps/control-app/src/builder/config.js`, which today reads "Tell your consultant which look you prefer, and why."
   - This is a deliberate exception to DOC-66's "your consultant" for running copy, decided by the operator. Record that next to the string so a later pass doesn't "fix" it back.
6. **The look controls come off the preview toolbar** (BUG-205's carousel action). The band replaces them, and there's one place to change looks.
7. **BUG-205's other behaviour stays:**
   - there's no separate looks mode;
   - there's no "Choose this one" button, because choosing happens in conversation through `choose_look`;
   - the Page selector never lists a look and shows the real page while a look is displayed.

## Out of scope

- How looks are made or chosen.
- The comp viewer (REQ-378), unless it shares the component. If it does, it must keep working.

## Test plan

UATs `test_UAT_FC_<this ticket>_*`, on the builder's preview:

- For a page with no looks, no band element exists and the preview starts at the top of the pane.
- For a page with looks, the band is rendered above the page frame, not overlapping it, and spans the pane's width.
- The band shows `‹ label ›` and "N of M". Stepping goes Current → each look → Current and updates both the label and the description.
- A long description is shown in full, wrapped, with no ellipsis.
- The instruction under it reads exactly "Tell the consultant which look you prefer, and why."
- The preview toolbar contains no look controls.