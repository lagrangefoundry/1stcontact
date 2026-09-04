---
uid: report-acfc0e95
id: REPORT-3349
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-23'
created_by: xgd
created_at: '2026-09-02T20:23:22.368913+00:00'
updated_at: '2026-09-02T20:23:22.368913+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-23
---

## Files resolved

- `.xgd/tickets/hot/bug-6612c4b7.md` (BUG-37) — class **UU**, rule **2e**
  (intent/bookkeeping ticket, `.xgd/tickets/hot/bug-*`). Resolved toward
  **HEAD** via `git checkout --ours` + `git add --sparse`, because HEAD is a
  strict superset of the incoming side on every fact the incoming commit
  actually changed.

  Incoming commit `1eb1dd1586d5db0eb5aaa6f904a51b72f3a665d5` (2026-08-24
  14:42 -0700) vs base `af15f9ef` touches **frontmatter only** — 1 hunk,
  7 insertions / 2 deletions. Per-fact comparison against HEAD
  (`5a37f67dcdc9ace098d26e347d9912ad534a39bc`, 2026-08-31 12:19 -0700):

  | incoming fact | HEAD state | resolution |
  |---|---|---|
  | `status: free_coding` → `free_coded` | `free_and_reconciled` | HEAD — strictly downstream of `free_coded` in the lifecycle; it cannot precede it |
  | `commits[0].working_sha: 2058a16449a8e783bdd655d22bade58fd6b8d0fc` | present verbatim as `commits[0]`, plus `working_sha_history: []` and two later entries (`0fe586d1…`, `999579b3…`) | HEAD — incoming's fact **present** |
  | `version: 0.2.11` | `0.2.13` | HEAD — later |
  | `updated_at: 2026-08-24T21:42:43` | `2026-08-31T19:19:36` | HEAD — later |
  | `completed_at: null` | `2026-08-31T19:19:36` | HEAD — later |

  No `working-timeline` call was needed: neither side's frontmatter carries an
  `intent_uid`, and the ordering is unambiguous from both the commit timestamps
  (HEAD is 7 days later) and the lifecycle position. Taking the incoming side
  would have demoted a reconciled ticket back to `free_coded`, dropped two
  recorded `working_sha`s and the `bundled_in: bundle-78f4e2fe` field — real
  data loss, not a merge.

  The body-text differences between the two sides (HEAD's "Observability —
  added here" / "Deployment" sections replacing the older "Still outstanding"
  section) originate entirely from HEAD's later evolution. The incoming diff
  against the merge base touches none of them, so none of that prose is an
  incoming contribution being discarded.

## Incoming changes preserved

Yes. The incoming commit's only substantive change — recording
`working_sha: 2058a16449a8e783bdd655d22bade58fd6b8d0fc` under `fields.commits`
— is present verbatim in the resolved file as `commits[0]`. Its remaining
changes (`status`, `version`, `updated_at`, `completed_at`) are bookkeeping
scalars that HEAD has since advanced past on the same working timeline.

This resolution nets to **no diff vs HEAD** (`git diff --cached HEAD` is
empty): the post-watermark sync already landed this commit's effect, refined.
Per STEP 4 this is a redundant commit, not a discarded one — STEP 3's
distinguishing check confirms the incoming's key change is present in HEAD via
a different route rather than absent. `--skip` was NOT called; CHERRY_PICK_HEAD
remains at `1eb1dd1586d5db0eb5aaa6f904a51b72f3a665d5` for
`cherry_pick_finalize_resolution` to handle.

No code, UAT, or spec-ticket files were involved; no BUG-1301 precedence
exception was invoked.
