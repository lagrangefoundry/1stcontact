---
uid: report-d654b309
id: REPORT-3540
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-26'
created_by: xgd
created_at: '2026-09-09T22:18:18.327209+00:00'
updated_at: '2026-09-09T22:18:18.327209+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-26
---

## Files resolved

- `.xgd/tickets/hot/request-0cdfdc5b.md` — class **AA** (both added); intent/bookkeeping ticket → rule **2e** (with the auto-enriched metadata rule: "take the more recent commit by timestamp"). Resolved to the **HEAD/ours** side.

  Both sides differed only in a single fact-cluster — the request's status progression:

  | field | ours (HEAD) | theirs (incoming `458b7fc9c2`) |
  |---|---|---|
  | `status` | `free_and_reconciled` | `ready_to_reconcile` |
  | `completed_at` | `2026-08-31T14:22:38` | `null` |
  | `updated_at` | `2026-08-31T14:22:38` | `2026-08-20T02:59:27` |
  | `fields.bundled_in` | `bundle-b3b7c399` | *(absent)* |

  Same field changed differently on each side, so the timeline rule applies per-fact. Both timestamp measures agree that HEAD is the later-positioned intent:
  - last HEAD-side commit touching the file: `9981276295` @ 2026-09-01 15:04:28 -0700
  - incoming commit: `458b7fc9c2` @ 2026-08-23 12:48:08 -0700
  - ticket `updated_at`: 2026-08-31 (ours) vs 2026-08-20 (theirs)

  Ours is also a strict superset: it carries `fields.bundled_in`, which the incoming version never had, and its `status`/`completed_at` are the forward continuation of the same lifecycle the incoming side left at `ready_to_reconcile`. Taking theirs would have reverted an operator-owned status backwards and dropped the `bundled_in` linkage. No content was invented; no field outside the two conflict hunks was touched.

## Incoming changes preserved

No code/implementation files were conflicted in this commit — the sole conflict was a bookkeeping ticket, resolved under 2e rather than the 2c "incoming is authoritative" rule (which governs code files).

For `request-0cdfdc5b.md`, the incoming side's hunks are intentionally not carried forward, and this is not a discard of developer code:
- The incoming hunks contain no additive content whatsoever — every line they introduce is an **older** value of a field that HEAD already advanced (`git diff <ours-blob> <theirs-blob>` shows exactly 4 changed lines, all status-lifecycle bookkeeping, plus the removal of `bundled_in`).
- HEAD's values are the later state of the *same* facts, reached by the later-positioned intent. So the incoming intent ("this request has reached `ready_to_reconcile`") is present in HEAD via a strictly further-along route (`free_and_reconciled`), not absent.

No BUG-1301 precedence hunks were dropped; no test functions were involved.

Resulting staged tree nets to no diff vs HEAD for this path, which is expected here and is handled by the finalize step (per STEP 4 — `--skip` was not called).

Verification: `git ls-files -u` is empty and `git status --porcelain` shows no UU/AA/DU/UD entries (only pre-existing untracked comment/report tickets and `.xgd/_changes/`). `CHERRY_PICK_HEAD` left intact for `cherry_pick_finalize_resolution`.
