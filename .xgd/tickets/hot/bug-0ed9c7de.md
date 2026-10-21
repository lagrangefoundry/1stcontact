---
uid: bug-0ed9c7de
id: BUG-250
type: bug
title: 'Looks become their own mode: a Looks tab showing only the looks, no Edit or
  Colours, no ''Current'' posing as a look'
created_by: EPIC-19
created_at: '2026-10-21T19:10:12.936153+00:00'
updated_at: '2026-10-21T19:10:12.936153+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  severity: medium
  priority: high
  story_points: 3
  epic_parent: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-c58de9a6
---

## Why (operator, 2026-10-21)

The builder now has named, visible modes — **View, Edit, Story, Comparisons** —
and the looks carousel (BUG-205 / REQ-402) is the odd one out: it lives inside
View, Edit stays offered but doesn't work on a look, Colours would apply to the
wrong thing, and "Current" sits in the carousel as if it were a look when it is
the real page (choosing it means "keep what I have"). This reverses BUG-205's
"no separate mode" decision, which was made when View/Edit were the only modes.

> Perhaps we need a new mode "Looks" that appears at this point. It doesn't show
> the draft, it only shows looks. Edit mode is not available nor is Colors.

## What changes

1. **A Looks tab** in the mode bar, present **only while the page shown has
   looks**; it disappears once a look is chosen (or the looks are cleared).
   `show_client`'s looks target opens it, so the consultant takes the client
   there when it has made looks.
2. **It shows only the looks** — no "Current" position. REQ-402's band moves into
   it unchanged: ‹ Name ›, "N of M", the full description, "Tell the consultant
   which look you prefer, and why", and the cross-fade.
3. **In Looks mode, Edit and Colours are not available**; width, View on your
   phone and Open in new tab are.
4. **A "Compare with your current page" link** in the band switches to View on the
   real page (and back), so the draft is a click away without posing as a look.
5. **Removed:** the toolbar carousel controls inside View and the "Current"
   carousel position (BUG-205 items 1–2). Choosing stays in the conversation;
   keeping the current page is a valid answer the consultant records.
6. BUG-246's view reporting includes `looks` (and which look).

## Test plan
- A page with looks shows the Looks tab; a page without doesn't; choosing a look
  removes it.
- Looks mode cycles only the looks (no Current), with the band; Edit and Colours
  are absent; width/phone/new-tab work.
- "Compare with your current page" switches to View on the real page and back.
- View mode has no carousel controls.