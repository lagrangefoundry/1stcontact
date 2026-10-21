---
uid: bug-add573b7
id: BUG-246
type: bug
title: 'The consultant doesn''t know which view the client has open: report the view
  and unopened views, and link to the right one'
created_by: EPIC-19
created_at: '2026-10-21T17:33:54.640791+00:00'
updated_at: '2026-10-21T17:33:54.640791+00:00'
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
---

## Symptom (Ariel's AR Welding run, 2026-10-21)

With the **comparison board** open in the preview, the consultant wrote: "The
board has plenty from you and the shop now, but nothing yet in your customers'
words. **When a contractor recommends you to another contractor, what do they
say about you?**" — meaning the **story board**. The client was looking at a
different "board", and may not yet have known the preview can switch views.

> The consultant needs to know what I'm looking at and either change my context
> (risky) or give me a link to let me do it. At this point I may not have
> realized I can switch view yet. (operator)

The consultant knows the client's **width** (REQ-388) and has `show_client` and
the "say where they are looking" instruction (REQ-413), but nothing tells it
**which view** is open, or which views the client has never opened.

## What changes

1. **Every client message carries the current view**, alongside the width:
   draft (View), Edit, Story, Comparisons, Looks (and which look / how many
   comps where cheap). The per-turn digest states it: "The client is looking at:
   Comparisons (4 sites)."
2. **Which views the client has never opened** is recorded by the host (first
   open per view, per business) and stated in the digest: "Not yet opened:
   Story."
3. **Priming rule, backed by those facts:**
   - When the consultant asks about or refers to something on a view the client
     isn't looking at, the message includes a `show_client` **link** to it — a
     link, not a switch, because the client is in the middle of something.
   - The first time it points the client at a view they have never opened, the
     link comes with one line on where it lives ("The story board is under
     **Story**, beside View and Edit above the preview.").
   - It **switches** the view only right after it has made something new to look
     at and the client isn't mid-task (REQ-413's existing rule).
4. **Unambiguous names:** "the story board" and "the comparison board", never
   "the board" alone; likewise "the questions panel", "the looks".

## Test plan
- A message sent with the Comparisons view open reaches the host with view
  `comparisons`; the digest line names it.
- Opening Story for the first time clears it from "Not yet opened"; the record
  survives reload and is per business.
- Priming contains the link-when-elsewhere rule, the first-time where-it-lives
  line and the unambiguous-names rule.
