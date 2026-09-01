---
uid: report-b321edd9
id: REPORT-3239
type: report
title: 'Reconcile resolve conflicts: reconcile-REQ-162'
created_by: xgd
created_at: '2026-09-01T22:31:30.672744+00:00'
updated_at: '2026-09-01T22:31:30.672744+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-REQ-162
---

## Files resolved

- `.xgd/tickets/hot/doc-db9ba2aa.md` — class **AA** (both added; sparse-excluded,
  index-only conflict with no working-tree markers, DOC-986 §2/§4.1). Rule
  applied: **2b (AA) with 2e per-fact judgment** — one side was a strict
  superset/successor of the other, so no composition was needed; resolved with
  `git checkout --theirs` + `git add --sparse`.

  Both sides are the same doc ticket (`doc-db9ba2aa`, "Security Policy"). The
  full three-way diff between stage 2 (ours, HEAD) and stage 3 (theirs,
  incoming `d5d5c096cc`) is two lines:
    - `updated_at`: `2026-08-16T01:20:56` (ours) → `2026-08-31T19:43:03` (theirs)
    - `fields.system_kb: true` — present on ours, removed on theirs

  There is no competing fact: ours carries no field, section, or body content
  that theirs lacks. The incoming commit's message body states the operation
  narrative directly — "field: retire system_kb boolean; membership moves to
  doc_kind (DOC-39 3.3)" — and `fields.doc_kind: security_policy` is already
  present and identical on both sides, so the retirement is complete and the
  membership information is not lost. Theirs is also the later intent by
  timestamp (2026-08-31 vs 2026-08-16), which agrees with the enrichment
  metadata's fallback rule.

  Note: `last_field_updated: system_kb` remains in the resolved file. It is
  byte-identical on both sides of this conflict, so it was left untouched —
  changing it would be inventing content present on neither side (2e
  PROHIBITED). It is a stale bookkeeping breadcrumb, not matrix state.

## Incoming changes preserved

- `.xgd/tickets/hot/doc-db9ba2aa.md` — **fully preserved.** The resolved
  working-tree file is byte-identical to the incoming blob (verified by
  `diff -u` against stage 3: no differences), and the staged blob hash matches
  stage 3 exactly (`7a500474fe`). `git diff --cached HEAD` for this path shows
  precisely the incoming commit's two changes and nothing else: the
  `system_kb: true` removal and the `updated_at` bump.

  `git show d5d5c096cc -- <file>` renders as an 83-line whole-file insertion
  because the path did not exist at that commit's parent on the incoming
  branch; the substantive delta relative to HEAD is the two lines above, both
  of which are present in the resolution.

No hunks were dropped; the BUG-1301 precedence exception was not invoked. No
code, test, or UAT files were involved in this conflict. Cherry-pick sequencer
state (`CHERRY_PICK_HEAD` = `d5d5c096cc`) left intact for
`cherry_pick_finalize_resolution`.
