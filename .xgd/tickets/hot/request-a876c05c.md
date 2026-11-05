---
uid: request-a876c05c
id: REQ-636
type: request
title: 'Builder chrome: the Publish button shows the publish state, and the progress
  panel above the chat is a fixed height'
created_by: EPIC-19
created_at: '2026-11-03T00:28:08.608812+00:00'
updated_at: '2026-11-03T01:55:27.977829+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  priority: medium
  parent_uid: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-602e4332
  commits:
  - working_sha: 13f1c7c36cf4500b15570398eaa36708cac4cfc0
    reconcile_sha: null
    main_sha: null
  - working_sha: 6789e3cd39ea2e89e1b8d97bc98a20cd237893b9
    reconcile_sha: null
    main_sha: null
  version: 0.2.742
  story_points: 3
---

## Why

Operator, 2026-11-02:
1. "Get rid of 'Not yet Published': too much real estate, not enough value. Make the Publish button itself reflect the state: inactive, greyed out and reading 'Published' when the site is up; when it isn't, an active call to action, matching Open in new tab and View on your phone."
2. "The progress panel above the chat is variable size. That made sense when the questions could go in there. Now it holds up to two lines, and the panel should be fixed so they are always visible."

Clarified in session: the lines are the ones under "How you can help". There are 7 kinds (first draft, questions, notes, sites, headline, position card, Look summary): "Can we put them into columns and get away with 3 lines?" And: "remove the drag - fixed sized panel".

## What

1. **The publish state lives on the Publish button; the separate status indicator goes.** BUG-327's draft-vs-live indicator ("Not published yet" / "Unpublished changes" / "Published, up to date") is removed as its own element. The Publish button carries the state:
   - **Site live and the draft matches it:** the button reads **"Published"**, greyed out and inactive (not clickable). Its tooltip says when it was last published. To give it that time, `GET /api/publish/status` also returns `publishedAt` (the live revision's publish time, or null when never published).
   - **Never published, or the draft has changes since the last publish:** the button reads **"Publish"** and is an active call to action, styled exactly like **Open in new tab** and **View on your phone** (same height, type, radius, colours and hover/focus states), so the toolbar's actions match. With changes, its tooltip lists what changed.
   - **Publishing in progress:** the button reads "Publishing…" and is inactive until it finishes; a failure shows BUG-327's message and returns the button to "Publish".
   - **Before the status is known** (status not yet read, or unreadable), the button reads "Publish" and is enabled, so publishing is never blocked by a status read.
   - The state is the same dry-run change list BUG-327 computes, updating when the draft changes and after a publish.
2. **The progress panel above the chat is a fixed-size block, no longer a draggable split.** The vertical divider between the progress panel and the chat is removed: the panel cannot be dragged or resized, and the chat takes the rest of the column.
3. **How you can help is laid out in columns, three lines high.** Its lines sit in a grid of 3 columns × 3 rows, filled row by row, so all 7 kinds fit without the list growing. The list is always exactly three lines tall, whether one line or seven are owed: it never collapses and never pushes the chat down. A line too long for its column is truncated with an ellipsis, with its full text on hover (tooltip). The fixed height holds at desktop and phone widths.

## Supersedes

- **BUG-327's indicator element** (not its status computation): the `publish-status` toolbar action, its CSS, and its jsdom UATs (`test_UAT_FC_BUG-327_draft_differs_indicator.test.ts`, removed) are replaced by the button states above. The Worker-side status UAT stays, now also asserting `publishedAt`.
- **REQ-364's draggable divider between the progress area and the chat**: removed with its persisted split position/collapsed state (`site:plan-split` storage key) and its UAT `test_UAT_FC_REQ-364_the_panels_divider_position_and_collapsed_state_survive_a_reload`.

## Test plan

- `tests/test_UAT_FC_REQ-636_publish_button_state.test.ts` (jsdom, the shipped `mountBuilder` and toolbar):
  - `test_UAT_FC_REQ-636_publish_button_published_state`: with the draft matching the live site, the button reads "Published", is disabled, its tooltip says when it was last published, a click publishes nothing, and no separate publish-status indicator appears in either channel.
  - `test_UAT_FC_REQ-636_publish_button_active_state`: on a never-published site and after a draft edit the button reads "Publish" and is enabled (tooltip lists what changed); pressed, it reads "Publishing…" and is disabled until the publish ends, then reads "Published".
  - `test_UAT_FC_REQ-636_progress_panel_is_not_a_split`: the chat column holds the progress area and the chat directly, with no divider.
- `tests/test_UAT_FC_REQ-636_builder_chrome_layout.test.ts` (Chromium, the shipped modules and `builder.css`):
  - `test_UAT_FC_REQ-636_publish_button_matches_open_in_new_tab`: active Publish has the same computed height, font, radius, background, colour, border and padding as Open in new tab and View on your phone; "Published" is disabled and greyed.
  - `test_UAT_FC_REQ-636_progress_panel_fixed_height` (at 1280px and 390px): the progress area's height and the chat's position are the same with none, one, three and seven help lines; every line is inside the panel; seven lines sit in three columns over three rows; every line has an ellipsis overflow and its full text as tooltip, and at phone width at least one line is actually truncated.
- `tests/test_UAT_FC_BUG-327_publish_failure.workers.test.ts`: `GET /api/publish/status` returns `publishedAt` (null before the first publish, a valid time after).