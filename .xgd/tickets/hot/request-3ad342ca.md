---
uid: request-3ad342ca
id: REQ-22
type: request
title: Consolidate site-data trees under storage/
created_by: xgd
created_at: '2026-07-02T16:36:13.154059+00:00'
updated_at: '2026-07-09T21:42:36.937045+00:00'
completed_at: '2026-07-09T21:42:36.937045+00:00'
last_field_updated: status
status: free_and_reconciled
fields:
  story_points: 2
  priority: medium
  auto_merge_back: true
  needs_review: false
  commits:
  - 6328691dec5a63ebf3213af201c92eef8a549346
  - 98569bf29a15ce8e66587d4f1d7119526506ea87
  version: 0.0.15
  bundled_in: bundle-f39884d2
---

## Scope

Consolidate the four site-data trees under a single top-level **`storage/`** directory to declutter the repo root (clean code / data split):

```
storage/
  sites/        (git-tracked — authored sites)
  sandbox/      (gitignored — scratch)
  dist/         (gitignored — rendered output)
  references/   (gitignored — captured external sites)
```

Purely a **path/layout refactor** — no behaviour change. Touches the centralized path builders, `.gitignore`, tests, and the layout in the docs. Done now, before the flagship sites and `references/` captures accumulate content that would have to be moved later.

## Deliverables

- `tools/generate/src/store/paths.ts` — `siteDir` and `distDir` resolve under `storage/`.
- `tools/generate/src/cli/capture/bundle.ts` — capture bundles write under `storage/references/`.
- `.gitignore` — ignore `/storage/{sandbox,dist,references}/`; `storage/sites/` stays tracked.
- `git mv sites storage/sites` (and `dist` → `storage/dist`) to preserve history / move existing content.
- Update path assertions in existing UATs (REQ-9/11/12/13 tests).
- Update the layout in [[DOC-12]], [[DOC-13]], [[DOC-15]].

## UATs (`test_UAT_FC_REQ-22_*`)
- `test_UAT_FC_REQ-22_new_and_render_use_storage` — `1c new` creates under `storage/sites/<slug>/`, `1c render` outputs under `storage/dist/sites/<slug>/`.
- `test_UAT_FC_REQ-22_capture_writes_under_storage` — a capture bundle lands under `storage/references/<host>/`.
- `test_UAT_FC_REQ-22_gitignore_tracks_sites_ignores_rest` — `storage/sites/**` tracked; `storage/{sandbox,dist,references}/**` ignored.

## Out of scope
Any behaviour change; D1 paths (later).

## Shipped & verified (6328691)

- Path builders (`store/paths.ts`, `cli/capture/bundle.ts`, `cli/commands.ts` list scan) resolve under `storage/`.
- `.gitignore` retargeted: `storage/sites/` tracked; `storage/{sandbox,dist,references}/` ignored.
- `git mv sites storage/sites`; captured `gigabytealchemy.ai` bundle relocated to `storage/references/`.
- Fixed two spots tests missed (req14/15 paths, `cmdList` scan — now covered by a REQ-22 UAT).
- `1c list`/`render` work under `storage/`. **All 102 tests pass.** Layout updated in [[DOC-12]]/[[DOC-13]].