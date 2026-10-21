---
uid: bug-add573b7
id: BUG-246
type: bug
title: 'The consultant doesn''t know which view the client has open: report the view
  and unopened views, and link to the right one'
created_by: EPIC-19
created_at: '2026-10-21T17:33:54.640791+00:00'
updated_at: '2026-10-21T18:40:47.607315+00:00'
completed_at: null
last_field_updated: status
status: free_coded
fields:
  severity: medium
  priority: high
  story_points: 3
  epic_parent: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-fc4865df
  commits:
  - working_sha: 350af29245d9ea1c9bbdf45afd6acc23a2fbb1ea
    reconcile_sha: null
    main_sha: null
  - working_sha: 03f5d6ccc71e816e6cfd1eb875684f8e69061b62
    reconcile_sha: null
    main_sha: null
  version: 0.2.571
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


## 5. Pages too (operator, 2026-10-21)

The consultant created an Art page, showed it to the client, then asked about "the layout now that there are two pages" — but the client had never been told how to move between pages in the builder.

- The view report and digest also carry **which page** is shown ("The client is looking at: Art & commissions (art), View").
- When the consultant creates a page or first shows the client a page other than home, it says in one line how to move between pages: "Use the page menu above the preview to switch between Home and Art." (Then not again.)
- Test: a message sent while viewing `art` reaches the host with page `art`; the priming carries the page-switching line rule.


## Implementation (as landed)

- **Builder** (`apps/control-app/src/builder/`): `client-pane.js` is the one
  definition of the pane names and labels (View, Edit, Story, Comparisons,
  Looks), shared by the toggle (`config.js` labels) and the digest.
  `opened-views.js` records, per business (site), every pane the client has had
  open — whoever opened it, including Story put up by the host before the first
  draft — in the builder's own storage, so it survives reload. `app.js` adds to
  each prompt's `view`: `pane` (a look shown in View/Edit reports `looks`),
  `comps` (sites on the comparison board, when Comparisons is open) and
  `unopened` (panes on offer — mode toggle entries offered, plus Looks when the
  page has looks — never opened for this business).
- **Host** (`tools/generate/src/cli/ai/roles.ts`): `readClientView` accepts and
  validates `pane` / `comps` / `unopened` (an unknown pane, a bad count or an
  unknown unopened entry is a malformed view, refused by the route). The page
  digest states, beside the width line: "The client is looking at: Comparisons
  (4 sites)." and "Not yet opened: Edit, Story." Nothing is said on a turn that
  reported no pane.
- **Priming** (`priming.json`, the `showing` entry, in both declared orders):
  the link-when-elsewhere rule, the first-time where-it-lives line, the
  switch-only-after-making-something-new rule, and the unambiguous-names rule.

## Test evidence

- `tests/test_UAT_FC_BUG-246_the_builder_reports_the_pane.test.ts` (jsdom, real
  builder): Comparisons open → view carries `pane: comparisons`, `comps: 4`,
  `unopened: [edit, story]`; opening Story clears it and survives a remount over
  the same storage; the record is per business (another site still lists Story).
- `tests/test_UAT_FC_BUG-246_the_consultant_is_told_the_pane.test.ts` (real
  host): the digest lines; malformed pane reports refused; priming rules present
  in both orders.
- `tests/test_UAT_FC_REQ-388_preview_width.test.ts`: the submission assertion
  changed from exact equality to `toMatchObject`, since the view now carries the
  pane alongside the width (REQ-388's width contract unchanged).