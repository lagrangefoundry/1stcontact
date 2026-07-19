---
uid: request-37368e82
id: REQ-68
type: request
title: footer copyrightOpacity + services-grid raw card fill/gradient/badge (framework
  growth)
created_by: xgd
created_at: '2026-07-18T15:18:27.287400+00:00'
updated_at: '2026-07-18T15:26:57.328713+00:00'
completed_at: null
last_field_updated: body
status: free_coded
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  commits:
  - working_sha: 33c0bc78c5736121c5e6c6718a85d992d52f4330
    reconcile_sha: null
    main_sha: null
  version: 0.0.144
---

## Goal
Add a `copyrightOpacity` dial to the footer so the copyright line's opacity (hard-wired
to `0.7`) is authorable (absolute-or-overlay). Closes 1 gigabytealchemy Type-A delta
([[REQ-64]]): the reference renders the copyright at full opacity, ours ghosts it to 0.7.
## Scope
- `copyrightOpacity` — an absolute 0..1 value; emits `--fc-copyright-opacity` consumed by
  `.footer__copyright` with `0.7` as the CSS fallback (omitted dial == today).


---

**Combined with the former REQ-69** (services-grid per-card raw `surfaceFill`/`surfaceGradient` + `badge.fill`): both capabilities shipped together in the single free-coded commit `33c0bc78`, so they share this scope ticket (one commit ↔ one ticket). UATs `test_UAT_FC_REQ-68_*` and `test_UAT_FC_REQ-69_*`.
