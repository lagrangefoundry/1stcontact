---
uid: request-5fddbe0d
id: REQ-464
type: request
title: 'Builder composer: the attach "+" sits as far from the text box''s left edge
  as from its top and bottom'
created_by: martin-github@westhead.me
created_at: '2026-10-25T23:59:34.547708+00:00'
updated_at: '2026-10-26T00:39:15.217502+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-b91b28b5
  story_points: 1
  commits:
  - working_sha: 59e0130f6a42c6fab829ba6a637dec805a15b49f
    reconcile_sha: null
    main_sha: null
  - working_sha: e6a94c527261dfa8c1f2f9330c6b28d09258661c
    reconcile_sha: null
    main_sha: null
  version: 0.2.652
---

## What changes (user-visible)

The attach "+" inside the builder chat's text box (BUG-244, the composer's leading action) sits too far right. At rest, the gap from the "+"'s left edge to the text box's left edge must equal the gap from its top to the box's top and from its bottom to the box's bottom.

Geometry today (lagrange-framework webui-chat `chat.css`): the pill is 64px tall at rest and the 36px button is vertically centred in it, so the vertical gap is (64 − 36) / 2 = 14px; but the button is placed `left: 18px`, so the horizontal gap is 18px. The drawn plus is centred in its button, so the same 4px excess holds for the visible glyph (≈26.8px left vs ≈22.8px top/bottom).

## Fix

Host rule in `apps/control-app/src/builder/builder.css`, beside the builder's other composer overrides (REQ-401's font-size rule): `.builder-chat .chat-input-wrapper .chat-widget-composer-action { left: 14px }` — the button's inset from the left edge is the pill's at-rest vertical inset. Three classes so it wins on specificity, not sheet order. Send (▶) is unchanged.

## Why free-coded

A one-rule CSS fix to the builder's own composer styling.

## Test plan

`tests/test_UAT_FC_REQ-464_attach_plus_inset_matches_vertical_gap.test.ts` — a real Chromium (launchAnyChromium) lays out the framework's composer markup under the installed `webui-chat` chat.css plus the source `builder.css`, inside `.builder-chat`, and asserts the drawn plus's left gap to the text box equals its top gap and its bottom gap (within 0.5px). Loud skip when no browser can be launched.