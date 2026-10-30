---
uid: report-7e85a8da
id: REPORT-4587
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-21T00:03:32.754163+00:00'
updated_at: '2026-09-21T00:03:32.754163+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/bundle-78f4e2fe.md` — **AA** (both added), intent/bookkeeping
  ticket (`bundle-*`), rule **2e**. Resolved to the **HEAD** side as a strict
  superset.

  Two conflict hunks:

  1. **Frontmatter (lines 8–94)** — lifecycle-state conflict.
     - HEAD: `status: free_and_reconciled`, `completed_at: 2026-08-31T19:19:32Z`,
       `result: pass`, `merged_at_commit: 96a76934e010d272feb2d2bfc2b5d9645db10fe8`,
       21 resolved `orphan_commits` old→new pairs, `commits` collapsed to a single
       entry carrying `main_sha`.
     - Incoming (`efdc5802db`): `status: ready_to_reconcile`, `completed_at: null`,
       five raw `commits` entries with `working_sha` only, no `main_sha`,
       `working_sha_history: []`.
  2. **EOF (lines 681–685)** — identical text on both sides; the sides differed
     only in a trailing newline. Kept HEAD's byte-exact form (no trailing
     newline) so the resolution is a no-op against HEAD.

  The ticket **body is byte-identical** between the two sides — `git diff -U0`
  between index stages 2 and 3 produced hunks only at lines 8–63 and the single
  EOF line. There was no prose or structural content to compose.

### Why HEAD, not a per-fact merge

Per 2e the two ledgers were replayed and compared rather than picking by raw
`updated_at`:

- `xgd ticket history bundle-78f4e2fe` (HEAD): the creation operation **plus
  ~15 subsequent `xgd(ticket): update bundle` operations**, the last at
  `4b197af0` / Mon Aug 31 12:19:50 -0700, which is the commit that wrote
  `merged_at_commit` and `result: pass`.
- `xgd ticket history bundle-78f4e2fe --rev efdc5802db` (incoming): a **single**
  operation — `xgd(ticket): create bundle bundle-78f4e2fe`, Wed Aug 26 10:36:26
  -0700.

The incoming ledger is therefore a proper prefix of HEAD's: the same creation
event, with HEAD continuing five days past it. This is not two sides editing
disjoint facts and not a genuine intent conflict — it is the creation snapshot
of a bundle whose reconciliation HEAD already records as complete. Taking the
incoming side, in whole or per-fact, would regress a `free_and_reconciled`,
`result: pass` bundle back to `ready_to_reconcile` and discard the
orphan-commit remapping.

The five `working_sha` values in the incoming `commits` list are not lost
information: each appears as an `old_sha` in the resync anchor's
`orphan_commits` remapping (e.g. `ea48502d0d90bb607ac528e34099e71eaab6df40`
→ `ae82bdfe21e963569dde9c3a158521dc5596b4ef`), which is precisely the
transformation HEAD's later `orphan_commits` / `main_sha` fields record.

## Incoming changes preserved

No code, test, or implementation files were in conflict — the sole conflicted
path is a bookkeeping ticket, so STEP 3's `git show $CPHEAD -- <file>`
verification applies only to `.xgd/tickets/hot/bundle-78f4e2fe.md`.

For that file the incoming content is **intentionally not carried forward**, and
this is not a BUG-1301 precedence case (no refactor, no deleted target, no test
function involved). It is rule 2e's strict-superset branch: the incoming state
is an earlier point on the same ticket's own lifecycle, already superseded by
later operations on the same ticket that are present in HEAD. The incoming
`create` operation itself *is* preserved — it is the first entry in HEAD's
ledger.

No UAT test function on either side of this conflict was deleted. No incoming
developer code was discarded.

## Staging state

- `git ls-files -u` → empty (no unmerged index entries).
- `grep "<<<<<<<\|>>>>>>>"` on the resolved file → no matches.
- `git status --porcelain` → empty. The staged blob is byte-identical to HEAD
  (`d51c00436b22170bdf8332ac597ca5bbca18bebf` on both), so this cherry-pick
  produces no net change; per STEP 4 that is left for the finalize step to
  detect and skip.
- `CHERRY_PICK_HEAD` still present at `efdc5802dbeffa2254dcc3fc00ec12a873e64560`;
  no `--continue` / `--skip` / `--quit` / `--abort` was invoked.

Staging note: `.xgd/tickets/` is outside this worktree's sparse-checkout cone
(11% of tracked files present), so `git checkout --ours` and a plain `git add`
were both refused with "paths ... exist outside of your sparse-checkout
definition". Resolved by writing stage 2 to the working tree and staging with
`git add --sparse`, per DOC-986 §2/§4.1.
