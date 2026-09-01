---
uid: report-6a2f400c
id: REPORT-3248
type: report
title: 'Reconcile resolve conflicts: reconcile-REQ-162'
created_by: xgd
created_at: '2026-09-01T22:49:19.592974+00:00'
updated_at: '2026-09-01T22:49:19.592974+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-REQ-162
---

## Files resolved

- `.xgd/tickets/hot/doc-976cde0e.md` — class **AA** (both added; no stage-1 base
  in the index). Intent/bookkeeping doc ticket, sparse-excluded on this branch
  (staged via `git add --sparse`). Rule applied: **2b (AA) — one side is a strict
  superset/later authoritative revision**, confirmed against the enrichment rule
  ("take the more recent commit by timestamp").

  Full ours-vs-theirs diff was exactly two frontmatter hunks — the 496-line body
  is byte-identical on both sides:
  1. `updated_at`: HEAD `2026-08-16T01:20:03` vs incoming `2026-08-31T19:43:15`
  2. `fields.system_kb: true` present on HEAD, removed by incoming

  HEAD's side is the older revision (commit `386de5cc`, 2026-08-15) and carries no
  content edit that competes with the incoming change — its only delta is the stale
  timestamp and the very field the incoming commit deliberately retires. Incoming
  (`422b7cce`, 2026-08-31, "field: retire system_kb boolean; membership moves to
  doc_kind (DOC-39 3.3)") is the later, documented operation. Resolved with
  `git checkout --theirs` + `git add --sparse`.

  Note: `fields.doc_kind: architecture` is already present on both sides, so the
  "membership moves to doc_kind" half of the retirement is satisfied in the result.
  No fields were invented; no `intent_uid`/`story_uid`/`capability_uid` touched.

## Incoming changes preserved

- `.xgd/tickets/hot/doc-976cde0e.md`: verified. The staged blob is byte-identical
  to the incoming commit's version —
  `git diff 422b7cce:<path> :0:<path>` returns empty. The staged diff vs HEAD is
  exactly the incoming commit's intent (drop `system_kb`, advance `updated_at`).

No hunks were dropped; the BUG-1301 precedence exception was not invoked. No code,
test, or UAT files were involved in this conflict. Cherry-pick sequencer state
(CHERRY_PICK_HEAD `422b7ccefc11d91a7f92ef8be20f741224ded48c`) left intact for
cherry_pick_finalize_resolution.
