---
uid: request-4becf2db
id: REQ-407
type: request
title: 'Builder toolbar: Open in new tab is a button like Publish'
created_by: martin-github@westhead.me
created_at: '2026-10-18T00:46:47.552943+00:00'
updated_at: '2026-10-18T00:50:59.139039+00:00'
completed_at: null
last_field_updated: title
status: draft
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-c36940d0
---

## What changes

In the builder toolbar, **Open in new tab** is rendered as a plain accent-coloured link (`<a>`), while its neighbours — **View on your phone**, **Colors**, **Publish** — are buttons. It now becomes a button of the same kind, so the strip reads as one row of controls.

- `openInNewTabAction` renders a `<button type="button" class="builder-toolbar__open">` labelled "Open in new tab".
- Clicking it opens the DRAFT render of the page the pane is on (the same `honestUrl(panel.getSrc())` it linked to before — BUG-131 / REQ-376 behaviour unchanged) in a new tab via `window.open(url, '_blank', 'noopener')`.
- The address it will open tracks the pane's page as before, and is exposed as the button's tooltip (`title`) so the operator can still see where it goes.
- It keeps its place at the right-hand end of the strip (`margin-left: auto`) and takes the toolbar's control font like the other buttons (BUG-70); the accent link colour is dropped.

## Why free-coded

Small presentational change to one toolbar action, requested directly by the operator.

## Test plan

- `tests/test_UAT_FC_REQ-407_open_in_tab_is_a_button.test.ts`: the control is a `<button>` styled with the same declared control font as Publish / View on your phone, and clicking it opens the draft URL in a new tab with `noopener`.
- Existing BUG-131 and REQ-376 UATs read the address the button opens (by clicking it with `window.open` captured) instead of an `href`; BUG-70 toolbar typography UAT still passes.
