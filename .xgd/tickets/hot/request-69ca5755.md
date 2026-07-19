---
uid: request-69ca5755
id: REQ-74
type: request
title: 'gap inversion: --fix-gaps sets spacingTop to close a gap delta (one-shot)'
created_by: xgd
created_at: '2026-07-18T20:45:19.196183+00:00'
updated_at: '2026-07-18T20:54:40.525030+00:00'
completed_at: null
last_field_updated: commits
status: free_coded
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  commits:
  - working_sha: f2db6c7e118a7129dfa4df14cc3d64dcf86e34f1
    reconcile_sha: null
    main_sha: null
  - 5b3442d9d37dd2d63541937e6657179256c0151b
  version: 0.0.149
---

## Goal
Turn a `gap` delta into a one-shot authored fix. A gap is linear in one spacing knob
(∂gap/∂spacingTop = 1), so `new_spacingTop = current + (ref_gap − our_gap)`. Add a
`--fix-gaps` mode that reads the draft's current section spacing, maps each section-
boundary gap (B = a module's heading) to that module's `spacingTop`, and sets it to close
the gap — the linear inversion that makes vertical spacing a mechanical correction like a
Type-A copy (REQ-73 measured it; this fixes it).

## Scope
- Pure `planGapFixes(gapDeltas, pages)` — match a gap's B-fragment to a module heading,
  read current spacingTop (token→px or module default), set new = current + correction
  (nearest token, else literal px). Dry-run by default; `--apply` writes.
- Edge: new < 0 (base already exceeds ref gap) → can't close via spacingTop; report it
  (reduce previous module's spacingBottom / a framework margin).