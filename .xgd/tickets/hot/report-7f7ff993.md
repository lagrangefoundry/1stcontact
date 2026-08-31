---
uid: report-7f7ff993
id: REPORT-2761
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T06:38:02.157815+00:00'
updated_at: '2026-08-31T06:38:02.157815+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/request-34dd9049.md` — **AA** (both added), intent/bookkeeping
  ticket (rule **2e**, with the **2b** "strict superset" reading; path is outside the
  sparse-checkout cone per DOC-986 §2/§4.1, so the conflict existed only in the index
  with no working-tree markers). Resolved to the **HEAD (ours)** side via
  `git checkout --ours` + `git add --sparse`.

  Both sides are byte-identical for the entire document body — all ~200 lines of the
  request narrative, settled scope, test approach, and implementation record. The only
  divergence is three frontmatter facts:

  | Fact | Ours (HEAD) | Theirs (incoming) |
  |---|---|---|
  | `status` | `bundled` | `ready_to_reconcile` |
  | `updated_at` | `2026-08-24T02:10:41Z` | `2026-08-22T21:54:23Z` |
  | `fields.bundled_in` | `bundle-b3b7c399` | *(absent)* |

  HEAD is a strict superset on every fact: it carries the same body plus the bundling
  state, and its commit (`274c14daf`, `seed_local_overlay`, 2026-08-30) is later than
  the incoming commit (`3e9239d68`, 2026-08-23). The incoming side asserts nothing HEAD
  lacks — it asserts two of the same facts at an *earlier* point in the timeline.
  Taking theirs would have regressed `status` from `bundled` back to
  `ready_to_reconcile` and dropped `bundled_in: bundle-b3b7c399` — i.e. unbundled the
  ticket from the very bundle this reconcile run is processing.

## Incoming changes preserved

The incoming commit `3e9239d68af7e90b87307b951a529ed4df328c20` changed exactly one file
(`.xgd/tickets/hot/request-34dd9049.md`, 225 insertions — an add on both sides) and no
code/implementation files. Every line of its content is present in the resolved version:
a direct `diff` of the two index stages shows only the three frontmatter lines tabulated
above, on each of which HEAD holds the later value. Nothing authored by the developer on
the incoming side is absent from the result.

No BUG-1301 precedence exception was invoked; no hunk was dropped; no test function on
either side was deleted.

**Net effect:** the resolution equals HEAD, so the staged tree carries no diff vs HEAD
for this path. Per STEP 4 this is the benign redundant-commit case (BUG-1109/BUG-1122),
distinguished from a discard by STEP 3's check above — the incoming commit's content is
*present* in HEAD (via the `seed_local_overlay` route that also advanced the status),
not merely missing. `--skip` was not called; the finalize step will detect the clean
staged diff. `CHERRY_PICK_HEAD` is intact and `git ls-files -u` is empty.
