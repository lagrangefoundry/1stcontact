---
uid: request-8738fc15
id: REQ-441
type: request
title: 'Preview: make the ''Updating'' spinner about an inch across, still see-through
  (REQ-435 follow-up)'
created_by: EPIC-19
created_at: '2026-10-23T23:42:52.988143+00:00'
updated_at: '2026-10-24T00:01:47.857174+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  parent_uid: epic-95bc3b15
  story_points: 1
  blocked_by:
  - request-55a6a706
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-5e94a494
  commits:
  - working_sha: 44ff2b40eeade2febbdf8a2b28b9a787b08d97ef
    reconcile_sha: null
    main_sha: null
  - working_sha: a48c53c9192ac563d6089ad1b1cf65a2f276eb07
    reconcile_sha: null
    main_sha: null
  version: 0.2.603
---

## Why

REQ-435 put a semi-transparent spinner with "Updating" over the preview while a
build changes the site (REQ-435 is at `ready_to_reconcile`, so this is a
follow-up rather than an edit to it). Seeing it for the first time, the operator:
"can you make the spinner itself much bigger (like an inch), still transparent so
we can see through it."

## What changes

- The spinner is about **one inch across** on screen: 96 CSS px, a constant beside
  REQ-435's other overlay values. It stays centred in the preview.
- It stays **see-through**: the page under it is still readable through the
  spinner, as now (same semi-transparency, or lighter if 96px makes it heavier).
- The "Updating" word stays with it, sized to sit comfortably with the larger
  spinner.
- Nothing else in REQ-435 changes: when it shows and hides, that it does not
  block the page, the single status announcement, and reduced motion.

## As implemented

- `builder.css`, REQ-435's overlay section: `--builder-updating-size: 96px` on
  `.builder-updating` is the constant; the spinner's width and height use it, with
  a 7px ring.
- The spinner and word are stacked (spinner above, "Updating" below at 1.15rem
  with a light text shadow) in a rounded backing that is lighter than before
  (35% dark instead of 55%), and the spinner itself is at 0.75 opacity — so the
  page shows through both the backing and the ring.
- The group stays centred in the preview. No JS changed; show/hide, pointer
  pass-through, the status region and reduced motion are REQ-435's, untouched.

## Test plan

- `tests/test_UAT_FC_REQ-441_bigger_updating_spinner.test.ts` (Playwright, real
  Chromium, shipped stylesheet + the real `updating.js` overlay over a stand-in
  preview): with the overlay showing, the spinner's laid-out size is 96px (±2) —
  measured with `offsetWidth/Height` because it is rotating — it and its group
  are centred in the preview, the word is "Updating", and the opacity the page is
  seen through (spinner × ancestors) is below 1. Skips loudly with no browser.
- Re-ran REQ-435's UATs and REQ-408's board-style UAT: pass.