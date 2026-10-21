---
uid: bug-bae7a6f0
id: BUG-244
type: bug
title: 'Composer and status: the ''+'' inside the text box and the status widget under
  the progress banner (BUG-236 item 7, now unblocked)'
created_by: EPIC-19
created_at: '2026-10-21T14:54:45.179356+00:00'
updated_at: '2026-10-21T14:54:45.179356+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  severity: medium
  priority: high
  story_points: 2
  epic_parent: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
---

## Why

BUG-236 item 7 (operator, 2026-10-20) — not built when BUG-236 landed, because
it depends on lagrange-framework **REQ-214**, which has now landed and is in the
shared install (`composerAction` / `statusContainer` in `webui-chat`). BUG-236 is
frozen at `ready_to_reconcile`, so the item lands here.

> The bottom of the screen is getting pretty busy. I want to loose the paper clip
> and "Attach files" and instead add a "+" symbol inside the text entry area to
> mirror the send button … Same functionality as we have now. Can we move the
> widget showing the progress to be an area UNDER but connected to the progress
> bar that we have at the top please?

## What changes

- **Attach becomes a "+" inside the text entry area**, mirroring Send, via
  REQ-214's `composerAction`. The separate "📎 Attach files" row and button go
  (`attachments.js` ~132, `ATTACH_BUTTON` in `config.js`). Everything else about
  attachments is unchanged: drag and drop, chips above the text box (capped per
  BUG-236 item 1), site/reference per file, going with the next message.
- **The status widget moves to the plan panel**, into an area directly under the
  progress banner (REQ-398 / BUG-209) and visually joined to it, via REQ-214's
  `statusContainer`. It keeps "The consultant is …", elapsed time and Stop
  building, and shows as soon as a worker round opens (LF BUG-89). It is present
  only while the worker works; nothing of it remains above the composer.

## Test plan
- The composer shows a "+" inside the input that opens the file picker; no
  "Attach files" control exists.
- With a build running, the status widget is inside the plan panel under the
  progress banner and not in the chat; Stop building still stops the worker;
  the composer shows Send (BUG-239 unaffected).
