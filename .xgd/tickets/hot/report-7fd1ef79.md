---
uid: report-7fd1ef79
id: REPORT-5504
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-29T07:48:30.088656+00:00'
updated_at: '2026-09-29T07:48:30.088656+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/bug-360c5a44.md` — UU, intent/bookkeeping ticket (STEP 2e;
  outside the sparse-checkout cone, so the conflict lived only in the index with
  no working-tree markers — staged via `git add --sparse`). Two conflict hunks,
  both in the YAML frontmatter, both resolved in favour of HEAD:

  | fact | HEAD (kept) | incoming eb9960199f (dropped) |
  |---|---|---|
  | `status` | `free_and_reconciled` | `free_coded` |
  | `completed_at` | `2026-09-14T10:29:01.338349+00:00` | `null` |
  | `updated_at` | `2026-09-19T15:15:28.543268+00:00` | `2026-09-01T22:36:06.978393+00:00` |
  | `fields.bundled_in` | `bundle-8e1807f6` | (absent) |

  Rule applied: the auto-enriched intent metadata for this file reports intent
  unknown on both sides and directs "take the more recent commit by timestamp,"
  which is HEAD by 18 days. This agrees with 2e's per-fact later-intent rule —
  all four conflicting facts are the same lifecycle snapshot, and HEAD's is
  strictly downstream of the incoming one (`free_coded` → … →
  `free_and_reconciled`, then bundled). Taking the incoming side would have
  regressed a completed, bundled, reconciled ticket back to `free_coded` and
  dropped `bundled_in`.

  Per the metadata's instruction, flagging this file for post-merge review.

  No prose/body conflict: the only body change in the incoming commit was
  removal of the trailing newline.

## Incoming changes preserved

- `.xgd/tickets/hot/bug-360c5a44.md` — the substantive payload of
  eb9960199f is present in the resolved index version, verified against
  `git show $CHERRY_PICK_HEAD:...`:
  - `fields.commits[0].working_sha: 84cc117aa1ee0525b9b615088051db8170e2ed87` ✓
  - `fields.commits[0].reconcile_sha: null`, `main_sha: null` ✓
  - `fields.version: 0.2.40` ✓

  These three merged cleanly rather than conflicting, because HEAD already
  contains them byte-identically — which is itself the evidence that
  eb9960199f is fully superseded on this branch. Nothing the incoming commit
  contributed has been discarded; only its older lifecycle snapshot was, in
  favour of the newer one HEAD already carries.

  No hunk was dropped under the BUG-1301 precedence exception; no test file
  was touched by this conflict.

## Staging state

`git status --porcelain` is empty: no UU/AA/DU/UD lines remain and no conflict
markers are present in the file. The resolution is byte-identical to HEAD, so
the staged diff against HEAD is empty — per STEP 4 this is left as-is for
Python's finalize step to detect and skip. CHERRY_PICK_HEAD (eb9960199f) is
still present and untouched; no `--continue`/`--skip`/`--quit`/`--abort` was
issued.
