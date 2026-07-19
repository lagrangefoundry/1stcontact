---
uid: request-3a11304d
id: REQ-76
type: request
title: 'values-diff cause clustering: group counted defects into a ranked cause view
  with dispositions'
created_by: xgd
created_at: '2026-07-18T23:37:50.616841+00:00'
updated_at: '2026-07-18T23:41:18.763430+00:00'
completed_at: null
last_field_updated: status
status: free_coded
fields:
  priority: high
  auto_merge_back: true
  needs_review: false
  commits:
  - working_sha: d4031c5e6fc744cd9bad152f3f6c8d250a73b069
    reconcile_sha: null
    main_sha: null
  version: 0.0.153
---

## Goal

After the false-positive kills (position derived, text-box-size), the collapsed diff is still a flat list of ~112 rows. Group them into a small ranked set of CAUSES (each with a disposition: fix / review / accept), so 'do I care about Type-B' is a per-cause decision, not a per-row slog.

## Cause taxonomy (property -> cause)

- renderedTextBox -> text extent / wrapping (sub-visual glyph width vs real line-count change)
- gap -> vertical spacing (fix: adopt-gaps)
- listMarker -> list-marker treatment (fix)
- arrangement + containment -> layout structure (review: e.g. form label-vs-placeholder)
- shape + border -> control styling (fix)
- size -> box dimensions of non-text elements (fix)
- fontLoad (ref fontLoaded=false) -> CAPTURE ARTIFACT / webfont FOUT (accept or re-capture)
- contentAnchor / overflow -> tail

## Requirements

- clusterDefects(collapsedDefects) -> ranked causes with count, worst tier, representative elements, disposition.
- --clusters flag on values-diff prints the cause view.
- VIEWPORT-AWARE where it matters: the collapsed view merged a mobile-only wrapping cause with a desktop glyph-width cause into a phantom 'big cause' (cause #1). A cluster that fires only at some widths must say so.

## Evidence

gigabyte cause-1 drill: looked like '61 deltas, our columns too wide'; per-viewport it was 45 invisible box-bounds (removed, REQ-64) + desktop glyph-width mixed-sign sub-visual + mobile-only badge wrapping. Clustering must not manufacture that phantom.

Follow-on: accepted-residual baseline (separate).