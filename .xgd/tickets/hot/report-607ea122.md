---
uid: report-607ea122
id: REPORT-3257
type: report
title: 'Reconcile resolve conflicts: reconcile-REQ-162'
created_by: xgd
created_at: '2026-09-01T23:09:07.099041+00:00'
updated_at: '2026-09-01T23:09:07.099041+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-REQ-162
---

## Files resolved

- `.xgd/tickets/hot/doc-92653384.md` — **AA (both added)**, sparse-excluded (index-only conflict, staged with `git add --sparse`). Rule 2b / 2e: incoming (`free_coded`, 5536b596 `xgd(ticket): update doc doc-92653384`, 2026-08-31) is a strict superset of intent over the HEAD side (`xgd(ticket): create doc doc-92653384`, 2026-08-21) — identical body text, plus the field retirement the incoming commit was authored to make. Later timestamp and superset both point the same way, so incoming was taken whole (`git checkout --theirs`).

## Incoming changes preserved

Incoming diff for this file vs the HEAD-side blob was exactly three hunks, all present in the staged result:

- `fields.system_kb: true` removed — the substantive change, per the commit message "retire system_kb boolean; membership moves to doc_kind (DOC-39 3.3)". `doc_kind: architecture` retained.
- `updated_at` advanced `2026-08-21T02:16:02` → `2026-08-31T19:43:28`; `last_field_updated` `created_at` → `system_kb`.
- Trailing newline dropped on the final line (as authored incoming).

Staged blob hash equals the incoming stage-3 blob `1f03daf0` byte-for-byte. No hunks dropped; the BUG-1301 precedence exception was not invoked. No code, spec-ticket, or UAT-test conflicts were present in this bundle step.

Post-merge review flag (per the enrichment rule for unknown intent on one side): the HEAD-side commit was a bare `create` with no competing field edits, so nothing from that side was discarded beyond the `system_kb` field the incoming commit deliberately retires.
