---
uid: request-8a601134
id: REQ-13
type: request
title: '1c shot: page screenshot primitive (AI eyes)'
created_by: xgd
created_at: '2026-07-01T00:44:36.160058+00:00'
updated_at: '2026-07-09T20:00:46.753765+00:00'
completed_at: null
last_field_updated: status
status: bundled
fields:
  story_points: 2
  priority: medium
  auto_merge_back: true
  needs_review: false
  commits:
  - 19fdbf37d4b6e28f3fc85685290b89e900a0ded3
  version: 0.0.10
  bundled_in: bundle-f39884d2
---

## Scope

Build `1c shot` — a page **screenshot primitive** using the `BrowserDriver` from the capture REQ, to give the AI **eyes** ([[DOC-13]] §6): screenshot our own rendered draft/published output, or any URL.

## Why free-coded

Thin command over the existing driver + render/serve pipeline. Single intent.

## Dependencies

- **Depends on:** the capture REQ (the `BrowserDriver` seam), REQ-9 (`1c render` / `1c serve`).

## Deliverables

- `1c shot <slug> [--source draft|published] [--out <file>]` — `1c render` the chosen source, `1c serve` it locally, and screenshot the **served** page (localhost) so `/assets/` images load. Fixes first-contact's blank-screenshot bug (screenshotting a page that couldn't reach its own assets).
- `1c shot --url <url> [--out <file>]` — screenshot any URL via the same driver.
- Deterministic viewport (default desktop; `--viewport mobile|tablet|desktop`). PNG output; optional per-section crops when a capture/segmentation is available.

## UATs (`test_UAT_FC_REQ-13_*`)

- `test_UAT_FC_REQ-13_shot_draft_assets_load` — screenshot of a served draft is a non-blank PNG whose referenced `/assets/` images actually rendered (not the missing-asset bug).
- `test_UAT_FC_REQ-13_shot_url` — `--url` produces a PNG of an arbitrary (fixture) page.
- `test_UAT_FC_REQ-13_deterministic_viewport` — a given `--viewport` yields stable dimensions.

## Out of scope

- Multimodal AI comparison of screenshot vs capture (that's the AI mapping/closed-loop step, later).
- CF Browser Rendering driver.