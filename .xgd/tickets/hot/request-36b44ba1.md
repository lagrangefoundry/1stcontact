---
uid: request-36b44ba1
id: REQ-413
type: request
title: 'Builder: the consultant brings the right view to the client — switch the preview
  itself, or give a link the client follows'
created_by: EPIC-19
created_at: '2026-10-19T21:10:05.006619+00:00'
updated_at: '2026-10-19T22:20:11.120287+00:00'
completed_at: null
last_field_updated: status
status: free_coding
fields:
  priority: high
  story_points: 8
  epic_parent: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-6acbc860
---

## What the client experiences

The builder now has a lot on screen: the preview in View, Edit or Story mode, a looks carousel, comparison sites shown in the preview, the progress bar, and the questions panel. A novice won't know where to look. **The consultant should bring each surface to the client at the moment it matters, saying where to look and what to do**, so the client never has to work out what the modes are or hunt for them (operator, 2026-10-19, EPIC-19).

Two ways, both wanted, because we need to try both:

1. **The consultant switches the view itself.** For example: *"The three looks are ready. I've put them in front of you."* The preview changes to that view as the consultant's message arrives.
2. **The consultant gives a link the client chooses to follow.** For example: *"[Open the story board](…) when you have a minute"*. Clicking it changes the view. Links stay in the transcript and still work after a reload, while an automatic switch happens once.

## Requirements

1. **One "show the client" operation** on the consultant's surface. Its targets are:
   - the draft, at a given page;
   - Story mode;
   - the looks for a page, at a given look;
   - a comparison site;
   - a question on the panel, which is scrolled into view, expanded and briefly highlighted.

   The consultant passes the target and either `switch` or `link`.
2. **`switch`** changes the client's preview, or highlights the panel item, when that part of the consultant's turn reaches the browser, through the live turn stream. It's recorded in the transcript, so a reload shows that the view was changed, but doesn't change it again.
3. **`link`** returns a markdown line the consultant pastes into its reply, the same pattern as images in the chat (REQ-217). The chat panel recognises the link and changes the view in place. It never opens a new tab or leaves the builder. An unknown or no-longer-valid target, such as a deleted look, shows a short "that's no longer there" note.
4. **Guard against switching under the client.** If the client is in Edit mode with unsaved changes, has the image editor open, or is mid-way through a panel answer, `switch` turns into `link`. The consultant's result says so, and the client sees the link instead. The view is never changed under someone who is working.
5. **The client is never stuck.** After a switch, the client's own controls (mode buttons, "Back to your draft", the page selector) work exactly as they do now.
6. **The consultant's instructions:** bring a surface forward when there's something new on it or something the client needs to do there. Prefer `switch` right after you've made something to look at, and `link` for "when you have a minute". Never switch twice in a row without the client doing anything in between.
7. **This works in both 1:1 and group-chat mode.**

## Test plan

UATs `test_UAT_FC_<id>_*`, through the real builder with only the model scripted:
- `switch` to Story while the client is in View: the preview's mode is Story when the turn finishes;
- `switch` while the client has unsaved Edit changes: the preview doesn't change, and a link appears in the reply;
- a `link` to a look: clicking it shows that look in the carousel, and it still works after a reload;
- a `link` to a deleted look: the "no longer there" note appears;
- `switch` to a panel question: it's expanded and highlighted;
- a reload after a `switch` doesn't switch again.