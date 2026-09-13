---
uid: report-56878c3e
id: REPORT-4154
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-13T22:22:47.782065+00:00'
updated_at: '2026-09-13T22:22:47.782065+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/request-13a5e206.md` (REQ-162) — **UU**, intent/bookkeeping
  ticket (`type: request`), rule **2e**. Resolved per-fact, two hunks:

  1. **Frontmatter block** (`updated_at` / `completed_at` /
     `last_field_updated` / `status`) — kept the HEAD side. HEAD is a strict
     superset: it carries the post-reconcile state
     (`status: free_and_reconciled`, `completed_at: 2026-09-02T01:34:00Z`,
     `last_field_updated: result`) plus the entire `fields.commits`,
     `fields.orphan_commits`, `fields.version`, `fields.merged_at_commit` and
     `result: pass` bookkeeping. The incoming side is the older in-flight
     snapshot of the same facts (`status: free_coding`, `completed_at: null`,
     `updated_at: 2026-08-31T21:40:00Z`, none of the reconcile bookkeeping).
     Superset-keeps-superset; nothing on the incoming side is absent from HEAD
     except strictly older values of the same fields.

  2. **File tail** — took the incoming side. The two sides were byte-identical
     apart from the final newline: HEAD ended `Cloudflare does not.` with no
     trailing newline, incoming ended with one. Kept the trailing newline.

  The incoming commit's third change — one blank line after the frontmatter
  fence — auto-merged cleanly and is present in the resolved file.

## Incoming changes preserved

Confirmed. The incoming commit (`40765e3d6b`, `xgd(ticket): update request
request-13a5e206`) changed three things in this file:

1. `updated_at` bumped to `2026-08-31T21:40:00.013990+00:00` — superseded by
   HEAD's strictly later `2026-09-02T01:34:36.152341+00:00`. Same fact, later
   intent wins (2e).
2. A blank line inserted after the frontmatter fence — **present** in the
   resolved file (auto-merged).
3. A 109-line `## What landed (free-coded, 2026-08-31)` section appended, with
   `### Evidence`, `### Collateral` and `### Not done here` subsections — this
   is the substantive payload of the commit and it is **already present in HEAD
   verbatim**, integrated via an earlier route. Verified by diffing the merge
   base against the incoming stage (`git show :1:` vs `git show :3:`): that
   section is the whole of the base->incoming body delta, and diffing the HEAD
   stage against the incoming stage (`git show :2:` vs `git show :3:`) shows the
   section does not appear as a difference at all. Nothing was discarded.

Residual staged diff vs HEAD is therefore just the blank line and the trailing
newline. No code/implementation files were involved, so no BUG-1301 precedence
exception was invoked and no hunk was dropped.
