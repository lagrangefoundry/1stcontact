---
uid: report-83f4cb21
id: REPORT-4295
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-18T04:58:24.861396+00:00'
updated_at: '2026-09-18T04:58:24.861396+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/request-23fd6e61.md` — **AA** (both added; no stage-1 base), intent/bookkeeping ticket → rule **2e** (strict-superset branch), with **2b** superset tie-break. Out of the sparse-checkout cone (DOC-986 §2/§4.1), so the conflict existed only in the index with no working-tree markers: resolved with `git checkout --ours` + `git add --sparse`.

Why the AA arose: the two sides share history through `5ff5688a81` (2026-08-19). On the incoming side, `0d11a0146e` stripped `.xgd/tickets` from a main snapshot (BUG-904), so the incoming commit `7fb577286f` (2026-08-23) re-adds the file as 182 pure insertions rather than modifying it — an add/add artifact of the strip, not two independent creations.

## Incoming changes preserved

Per-fact comparison of the two blobs (ours `2a61089c`, theirs `8c50ebfb`) — the body prose is byte-identical; all differences are in frontmatter, and every incoming value is an **earlier state of a field HEAD has since advanced**:

| fact | incoming (`7fb577286f`, Aug 23) | ours (HEAD, `02c0d39001`, Aug 31) |
|---|---|---|
| `status` | `reconciling` | `free_and_reconciled` |
| `completed_at` | `null` | `2026-08-31T14:22:44` |
| `updated_at` | `2026-08-20T12:51:32` | `2026-08-31T14:22:44` |
| `fields.bundled_in` | absent | `bundle-b3b7c399` |

The incoming commit's own two contributions were verified individually against its parent state (`80cdf17160:.xgd/tickets/hot/request-23fd6e61.md`) and both are **already present in HEAD**:

- `fields.commits[0].working_sha` advanced `fc75f0ca…` → `de2e2993…` with `fc75f0ca…` appended to `working_sha_history` — present in ours at lines 21/26.
- `fields.chat_comment: comment-d6476701` added — present in ours at line 28.

So nothing authored on the incoming side is discarded; ours contains the incoming state plus three later field advances. Taking theirs would have reverted `status` from `free_and_reconciled` back to `reconciling`, cleared `completed_at`, and dropped `bundled_in` — a backwards move on operator-owned status, not an integration.

No BUG-1301 precedence exception was invoked; no test files were involved; no UAT function on either side was deleted.

## Staging state

Staged resolution nets to **no diff vs HEAD** (`git diff --cached --stat HEAD` is empty) — the BUG-1109/BUG-1122 redundant-commit case: the incoming commit's effect already reached this branch by a different route (HEAD's `4bc54decb2` / `e0ffd3bfb4` / `02c0d39001`). This is distinct from a discard, and STEP 3's guard is satisfied by the field-level evidence above. `--skip` was not called; `CHERRY_PICK_HEAD` is still present for `cherry_pick_finalize_resolution`. `git status --porcelain` is empty — no conflict classes remain.
