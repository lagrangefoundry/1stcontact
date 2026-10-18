---
uid: request-4becf2db
id: REQ-407
type: request
title: 'Builder toolbar: Open in new tab is a button like Publish'
created_by: martin-github@westhead.me
created_at: '2026-10-18T00:46:47.552943+00:00'
updated_at: '2026-10-18T00:53:56.941681+00:00'
completed_at: null
last_field_updated: body
status: free_coding
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-c36940d0
---

## What changes

In the builder toolbar, **Open in new tab** used to be a plain accent-coloured link (`<a>`), while the controls next to it (**View on your phone**, **Colors**, **Publish**) are buttons. It now becomes a button of the same kind, so the strip reads as one row of controls.

- `openInNewTabAction` renders a `<button type="button" class="builder-toolbar__open">` labelled "Open in new tab".
- The address it opens is the DRAFT render of the page the pane is on. This is the same `honestUrl(panel.getSrc())` it linked to before, so the BUG-131 / REQ-115 / REQ-179 / REQ-376 / REQ-391 behaviour is unchanged. The address is kept on the button as `data-href` (in place of the old `href`). It is re-derived on the pane's `src` event and stops updating once the control is replaced, exactly as the old `href` did. The address is also shown as the button's tooltip (`title`).
- Clicking the button opens that `data-href` in a new tab with `window.open(url, '_blank', 'noopener')`.
- It stays at the right-hand end of the strip (`margin-left: auto`). It now takes the toolbar's shared control font rule alongside Publish / View on your phone (BUG-70), and it no longer has its own accent link colour.

## Why free-coded

A small presentational change to one toolbar action, requested directly by the operator.

## Design decisions

- Real `<button>` rather than an `<a>` styled to look like one. The neighbouring buttons use the user-agent button look, which CSS cannot reliably reproduce on an anchor, so a real button is the only way to match exactly.
- `data-href` keeps the address observable on the element, including the frozen value on a replaced control (AC1110 lifetime semantics).

## Test plan

- New `tests/test_UAT_FC_REQ-407_open_in_tab_is_a_button.test.ts`:
  - the control is a `<button>` like View on your phone, with no `href`, and its tooltip names the draft address;
  - clicking it calls `window.open('/preview/acme/draft/', '_blank', 'noopener')`;
  - `builder.css` styles it in the same rule as Publish and View on your phone, and gives it no colour of its own.
- Existing suites now read `data-href` instead of `href`: BUG-131, REQ-376, REQ-115, REQ-179, REQ-391, reconciliation toolbar-lifetime, and workspace-chrome. Their old `target === '_blank'` checks now assert that the click opens in `_blank`.
