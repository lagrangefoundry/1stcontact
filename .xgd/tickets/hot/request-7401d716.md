---
uid: request-7401d716
id: REQ-439
type: request
title: 'Builder chrome: no Tool use pane in the client''s chat, and the story board''s
  React choice as a small icon strip that leaves the words clear'
created_by: EPIC-19
created_at: '2026-10-23T23:32:45.743295+00:00'
updated_at: '2026-10-24T00:01:43.963701+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  parent_uid: epic-95bc3b15
  story_points: 2
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-974c1836
  commits:
  - working_sha: 77a53e12a753b5a0d43b44a616bbf1ed30acde5b
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: 4c8e2648abe0b5456daa809aaa078715ea368689
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  version: 0.2.602
---

## Why

Two pieces of the builder's chrome that get in the client's way:

1. **The chat window's "Tool use" pane.** The operator: "It is not relevant to this
   user base." The site conversation mounts the chat with `toolPane: true`
   (`apps/control-app/src/builder/chat.js` ~1298). The group-room chat already
   mounts it with `toolPane: false` (~1498).
2. **The story board's React choice is giant and covers the story.** REQ-431's
   choice (`.story-note__choices`, `builder.css` ~6787) is a vertical list at
   least 15em wide, with each option's full label ("Not right, or not how I'd say
   it"…). It opens *upward* from the pill (`bottom: 100%`) and sits over the
   note's words. The operator wants "a small selector with just the icons that
   appears over the react button and the lower part of the post-it and does not
   obscure the words".

## What changes

### 1. No Tool use pane in the client's conversation

- The site conversation's chat mounts with `toolPane: false`, as the room chat
  does. No tool-use pane, divider or toggle is drawn, and no control opens it.
- Nothing else is lost to the client. The status widget, working notes, progress
  and "How you can help" are unchanged. Tool activity stays in the transcripts and
  in the operator's Debug tab (REQ-353), which is where the operator looks at it.
- Remove what then has no use: CSS and layout space reserved for the pane in the
  builder chat, and any "Tool use" label constant. Leave nothing half-wired.

### 2. The React choice is a small strip of icons that leaves the words clear

- The choice is a **single row of the four icons only**: ❤️ 👍 👎 🗑. Each icon is a
  compact button, with no text label shown.
- It **opens over the React pill and the lower edge of the note**, anchored to the
  pill's position. It never opens upward over the note's text, and it does not
  cover any of the note's words at any note size. On a short note it may extend
  just below the note's bottom edge rather than up into the text.
- **Each icon keeps its meaning without the visible label:** its full label
  ("That's us", "True, keep it", "Not right, or not how I'd say it", "Delete — it
  doesn't belong", from `config.js`) is its accessible name and its tooltip.
- **Behaviour is otherwise REQ-431's:** opens on hover with a pointer and on
  click or tap; Escape or a click elsewhere closes it; it is reachable from the
  keyboard; the current reaction is marked, and picking it again clears it; on a
  reacted note the reaction's icon replaces the pill and opens the same strip.

## Test plan

`tests/test_UAT_FC_REQ-439_quiet_chrome.*`:

- jsdom: the site chat renders no tool-use pane or toggle (the room chat is
  unchanged).
- jsdom: the React strip holds exactly four buttons, icon-only text, each with
  the full label as its accessible name and title. The current reaction is
  `aria-pressed`, and picking it clears it.
- Playwright, at the builder's default size and with a long note: when the strip
  is open, its box does not intersect the box of any line of the note's text, and
  it overlaps the pill.
- Re-run the REQ-431 story board UATs and the chat mounting UATs.

## Supersedes

**AC-1066** ("What the assistant did during a turn is shown in the pane alongside
what it said") is INVALIDATED by this ticket: the client's conversation no longer
shows tool activity at all. Its UAT
(`test_UAT_AC1066_what_the_assistant_did_is_shown_in_the_panes_activity_area`,
`tests/reconciliation-builder-assistant-pane.test.ts`) is deleted, along with the
suite's unused tool-pane interface members. The new rule: a turn that calls a tool
draws no pane. The reply is shown as before, and the tool's name never appears in
the chat's text.

## As built

- `chat.js`: the site conversation mounts with `toolPane: false`. The builder had
  no CSS or label of its own for the pane (it is entirely `webui-chat`'s), so there
  was nothing else to remove.
- `story-board.js`: each choice button's text is its emoji only. Its label is its
  `aria-label` and `title`, and the current reaction's title still reads
  "<label> — pick again to clear". The separate label span is gone.
- `builder.css` `.story-note__choices`: a single-row rounded strip of 26px round
  icon buttons, absolutely positioned at the top-right of the React row
  (`top: -1px; right: -4px`). It covers the pill and the note's lower edge, and
  hangs a few px below a short note. It sits below the text in the note's own frame
  at every note size.

Tests: `tests/test_UAT_FC_REQ-439_quiet_chrome.test.ts`. The Chromium layout check
measures each note with its tilt removed, because the tilt rotates the strip and
the words together and axis-aligned boxes of rotated lines overstate overlap. It
checks a long, a short and a reacted (scaled ❤️) note at 700px and 320px. At each,
the strip does not touch any line of the note's text, it overlaps the pill, and it
is under 160px wide.