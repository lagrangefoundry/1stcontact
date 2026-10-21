---
uid: bug-0ed9c7de
id: BUG-250
type: bug
title: 'Looks become their own mode: a Looks tab showing only the looks, no Edit or
  Colours, no ''Current'' posing as a look'
created_by: EPIC-19
created_at: '2026-10-21T19:10:12.936153+00:00'
updated_at: '2026-10-21T21:54:36.750831+00:00'
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
  chat_comment: comment-c58de9a6
  commits:
  - working_sha: 5657a56e40101a2b4838f8f24b3557545f46afa5
    reconcile_sha: null
    main_sha: null
  - working_sha: 3b150d409dcb463ac5339e92bde050dc0440e36b
    reconcile_sha: null
    main_sha: null
  version: 0.2.577
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

## As built

- **Looks is a document mode of the display panel** (`id: looks`, label from
  `PANE_LABELS.looks`), registered after Comparisons, with its own frame like
  View and Edit. Its toolbar is exactly `mode-toggle`, `preview-width`,
  `open-new-tab`, `phone-preview` — no Pages, Subject, Mark Points, Panels,
  Colours or Publish. The toggle's Edit tab is still there, as a way *out* of
  Looks to edit the real page; nothing edits a look.
- **Offered** while the page shown (or, in Looks, the page the shown look is a
  look at) has a live set; the toggle redraws whenever that changes (listing
  re-taken, page moved). When a set is chosen from or cleared while Looks is
  shown, the pane goes to **View on the real page** and the tab goes.
- **Which look Looks shows**: the look the client was last on in that set (so
  "and back" via the tab returns to it), else the page's first look. The
  remembered look is forgotten when View/Edit moves to a page it is not a look
  of, and on a site change. Neighbours either side are preloaded so ‹ › is an
  animated swap; the ring wraps.
- **Looks is never restored from a previous visit** — the builder opens in View
  instead, since the listing isn't known yet and the set may have been chosen.
- **`show_client` / `#looks=` / `#show=looks&set=…&look=…` links** open Looks on
  that look, from any page or mode. A look no longer on offer still answers
  "That's no longer there." (REQ-413).
- **"Compare with your current page"** is a link-styled button in the band, after
  the invitation; it switches to View on the real page.
- **View reporting (BUG-246)**: the pane is `looks` exactly when Looks mode is
  shown, and the report carries `look: "<label>"`. `readClientView` accepts
  `look` (non-empty string ≤120 chars, trimmed; anything else refuses the view)
  and the digest line reads *The client is looking at: Looks (the "Workwear"
  look).*
- **Page index**: a pending page (set by the page selector until its document
  arrives) is cleared on a mode switch, because it described the frame being
  left — the newly shown frame's own document is the answer.
- **Consultant text**: the priming and `choose_look`/`show_client` descriptions no
  longer mention "Choose this one" or the carousel; they name the Looks tab, and
  say that a client who keeps their page is recorded with `set_decision`. No new
  server operation was added for "keep current" — the looks stay on offer until
  the consultant chooses or clears them.
- **Removed**: `LOOKS_CURRENT`, `LOOKS_CURRENT_DESCRIPTION`,
  `LOOKS_EDIT_REAL_PAGE` and the `.looks-band__note` line; the `modes` option of
  `mountLooksBand`; the `draftPath` option of `createLooks`.

## Supersedes

BUG-205 items 1–2 and REQ-402's "in whichever channel the pane is in / Current
is a position": `tests/test_UAT_FC_BUG-205_looks_on_the_toolbar.test.ts` is
deleted (its still-true checks — no "Choose this one", the invitation, a link
showing the first look, a chosen set returning the pane to its page — are in the
BUG-250 suite), and the REQ-391 / REQ-402 / REQ-413 suites are retargeted to
Looks mode (looks-only ring, `getMode() === 'looks'`). BUG-79's frame count is 3
(View, Edit, Looks).

## Test plan

- `tests/test_UAT_FC_BUG-250_looks_mode.test.ts` (real builder in jsdom):
  the tab is offered only on a page with looks and goes once one is chosen
  (pane back to View on the page); Looks cycles only the looks with the band, no
  Current, no choose control, toolbar exactly width/new-tab/phone; "Compare with
  your current page" goes to View on the real page and the tab returns to the
  same look; View and Edit have no carousel; a message sent in Looks reports
  `pane: 'looks', look: '<label>'`; Looks isn't reopened after a reload.
- `tests/test_UAT_FC_BUG-250_the_consultant_is_told_the_look.test.ts` (real
  host): the digest names the look; a malformed `look` is not a view.
- Regression: REQ-391, REQ-402, REQ-413 (builder + workers), REQ-419, REQ-388,
  REQ-248, BUG-246, BUG-79, REQ-179 and every suite reading the priming / tool
  surface. Remaining failures were compared against the base commit and are
  identical there (pre-existing: BUG-52/53/63, REQ-127/259/285/295/342/398/416,
  AC1065/1070/1320, REQ-117).