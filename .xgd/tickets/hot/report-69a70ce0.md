---
uid: report-69a70ce0
id: REPORT-5350
type: report
title: 'Resync resolve conflicts: 6ba006de764d843fa7f4357df2b341e72f20e2f6'
created_by: xgd
created_at: '2026-09-28T19:28:24.670979+00:00'
updated_at: '2026-09-28T19:28:24.670979+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/request-439cd0c8.md` — **UU**, intent/bookkeeping ticket
  (`request-*`), rule **2e** + the enrichment's timestamp rule. Six conflict
  hunks (frontmatter, acceptance bullets, three `shadow_*` → `description_*`
  terminology blocks, and the Open-questions tail). Resolved by taking the
  **HEAD** side in full, because on every hunk HEAD is a strict superset of
  the incoming side rather than a competing edit:

  | Incoming hunk | HEAD side |
  |---|---|
  | frontmatter `status: draft`, `updated_at` 2026-08-31T22:08 | `status: bundled`, `updated_at` 2026-09-09T21:32, `bundled_in: bundle-87be4669` |
  | 4 new acceptance bullets | all 4 present, plus a 5th (no-store directive on the two new routes) |
  | `## Decisions from implementation review` (all eight) | present verbatim, with `shadow_status`/`shadow_model`/`re-shadow` renamed to `description_status`/`description_model`/`re-describe` |
  | 2 open questions (vision ownership; re-shadow policy) | both **answered** in HEAD's `## Resolved after implementation (2026-08-31)` section; HEAD's Open-questions list replaced with the unresolved DNS item |

  No per-fact merge was needed: there is no field or section where the two
  sides assert the same fact differently. Taking the incoming side on any
  hunk would have reverted the terminology rename, dropped ~150 lines
  (`## What was built, and where it departs from the decisions above`, the
  bundle-measurement table for REQ-158, the Evidence section), and reopened
  two questions HEAD explicitly closes.

  Timestamp rule agrees: HEAD `updated_at` 2026-09-09 > incoming 2026-08-31.

## Incoming changes preserved

No code/implementation files were in conflict — the sole conflicted path is a
`request-*` intent ticket, so STEP 3's `git show $CPHEAD -- <file>` check
applies only to it.

Verified against `git show 3a7f62aa53 -- .xgd/tickets/hot/request-439cd0c8.md`:
**every** insertion in the incoming commit is present in the resolved file.
The incoming commit message names eight decisions — routes, index seam, vision
path, `shadow_status`, unpdf and the bundle budget, fetch guard and untrusted
marking, promotion gate — and all eight appear under
`## Decisions from implementation review` in the resolved version, with the
`shadow_*` identifiers spelled in their later `description_*` form.

No hunk was dropped, so the BUG-1301 precedence exception was not invoked.

## Note for the finalize step

HEAD already contains this edit in full (it arrived via
`d58e8e3fd3 xgd(ticket): seed_local_overlay request request-439cd0c8`), so the
resolved tree is byte-identical to HEAD and `git status --porcelain` is empty.
This cherry-pick therefore has an empty staged diff. Per STEP 4 this step did
not call `--skip`; the cherry-pick remains paused with CHERRY_PICK_HEAD intact
for Python's finalize step to handle.
