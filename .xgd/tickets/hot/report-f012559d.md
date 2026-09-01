---
uid: report-f012559d
id: REPORT-3153
type: report
title: 'Reconcile resolve conflicts: reconcile-REQ-162'
created_by: xgd
created_at: '2026-09-01T00:57:17.601370+00:00'
updated_at: '2026-09-01T00:57:17.601370+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-REQ-162
---

## Files resolved

- `.xgd/tickets/hot/request-34dd9049.md` (REQ-150) — class **AA** (both added, no
  merge base). Intent/bookkeeping ticket → rule **2e**, plus the auto-enrichment's
  "intent unknown on one or both sides → take the more recent commit by timestamp,
  flag for post-merge review". Resolved by taking **ours (HEAD)**.

  The two sides' bodies are **byte-identical**. `git diff <ours-blob> <theirs-blob>`
  showed exactly three frontmatter facts differing, matching the two working-tree
  marker hunks one-for-one:

  | fact | ours (HEAD) | theirs (incoming `3e9239d68a`) |
  |---|---|---|
  | `updated_at` | `2026-08-24T02:10:41` | `2026-08-22T21:54:23` |
  | `status` | `bundled` | `ready_to_reconcile` |
  | `fields.bundled_in` | `bundle-b3b7c399` | *(absent)* |

  Ours is later on **both** clocks — content `updated_at` (08-24 vs 08-22) and commit
  date (HEAD-side `274c14daf5` "seed_local_overlay" 2026-08-30 vs incoming 2026-08-23)
  — and is a strict superset per 2e: `bundled` is downstream of `ready_to_reconcile`
  in the lifecycle, and `bundled_in` is a field the incoming side never touched.
  Taking theirs would have reverted the bundling that this reconcile run itself
  depends on.

  Staged with `git add --sparse` (DOC-986 §2/§4.1 — `.xgd/tickets/` is outside the
  sparse-checkout cone on reconcile branches).

## Incoming changes preserved

No code/implementation files were in conflict — the incoming commit `3e9239d68a`
("xgd(ticket): update request request-34dd9049") touches exactly one file, this
bookkeeping ticket, and nothing else.

Nothing was discarded. The incoming commit's substantive content — the entire
225-line ticket body: Settled scope, the Astro-removal disposition table, Test
approach, and the 2026-08-21 free_coded Implementation record — is present in HEAD
**verbatim**, byte-for-byte. Verified by direct blob diff: the body produced zero
diff hunks. Only the three superseded bookkeeping facts above differ, and on each
one HEAD carries the later value.

Before `checkout --ours` was issued, the reverting-auto-merged-content risk was
ruled out: because the sides' bodies are identical, the *only* incoming deltas in
this add/add were the two conflicted frontmatter hunks themselves, so `--ours`
could not silently drop auto-merged incoming lines. Confirmed after the fact —
`git diff HEAD -- <path>` is empty and the file carries zero conflict markers.

## Resulting tree state

`git ls-files -u` is empty; `git status --porcelain` shows no conflict-class lines.
`git diff --cached HEAD` is **empty** — this resolution nets to no change vs HEAD,
the BUG-1109/BUG-1122 case: HEAD already reached this ticket's state via a later
route (the 08-30 seed_local_overlay overlay), so the commit is genuinely redundant
rather than discarded. Per STEP 4 this is **not** a @fail and `--skip` was **not**
called — the finalize step will detect the clean staged diff. CHERRY_PICK_HEAD is
intact; no continue/skip/quit/abort/reset was run.

## Flagged for post-merge review

Per the enrichment rule, this file is flagged: REQ-150's `status`/`bundled_in` were
decided by timestamp, not by a declared operation narrative on either side.
