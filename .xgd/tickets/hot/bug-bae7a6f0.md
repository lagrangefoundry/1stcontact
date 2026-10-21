---
uid: bug-bae7a6f0
id: BUG-244
type: bug
title: 'Composer and status: the ''+'' inside the text box and the status widget under
  the progress banner (BUG-236 item 7, now unblocked)'
created_by: EPIC-19
created_at: '2026-10-21T14:54:45.179356+00:00'
updated_at: '2026-10-21T15:14:28.257471+00:00'
completed_at: null
last_field_updated: status
status: free_coded
fields:
  severity: medium
  priority: high
  story_points: 2
  epic_parent: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-2e24d6a8
  commits:
  - working_sha: d52fd4f7ee3870503b053946dfb55042ad7b6bc5
    reconcile_sha: null
    main_sha: null
  - working_sha: 04c9b3ef7ed96525b063fb072b0749975645ee98
    reconcile_sha: null
    main_sha: null
  version: 0.2.569
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


## As built

- **"+" in the composer.** `createAttachmentTray` now exposes `action`
  (`{label: 'Attach files', onClick}`: opens the tray's hidden file input), and
  the chat pane passes it to `mountChat` as `composerAction`. The tray's own
  "📎 Attach files" button and its CSS are gone. With no chip waiting, the tray
  row takes no room. "Attach files" survives only as the "+"'s accessible name and
  tooltip.
- **Status widget under the banner.** The plan panel puts a status slot
  (`.plan-stages__status`) inside the pinned progress banner, after the stages,
  and exposes it as `statusSlot`. `app.js` hands it to the chat pane as
  `statusContainer`, and the pane passes it to `mountChat` (the main and group
  conversations). The banner wraps onto a second row only while the widget shows;
  the slot is `display: contents`, so a hidden widget adds no row or gap. The
  settings conversation is unaffected and keeps its widget above its own composer.
- **REQ-398 UAT adjusted.** Its "no collapse toggle in the banner" check
  (`bar.querySelector('button')`) now ignores buttons inside the status slot. The
  hidden widget's Stop building button sits in the banner by design.

## UATs

`tests/test_UAT_FC_BUG-244_plus_in_composer_and_status_under_banner.test.ts`:
- the "+" sits inside the input bar, opens the picker, and a picked file becomes a
  chip; no "Attach files" row or button exists;
- with a build running in the real builder, the widget is inside the banner after
  the stages and not in the chat; the composer shows Send;
- with a talker session, the widget opens with the round under the banner, and
  Stop building asks the origin to stop the work. The widget is gone once the round ends.