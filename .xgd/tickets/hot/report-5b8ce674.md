---
uid: report-5b8ce674
id: REPORT-4171
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-13T23:19:50.382002+00:00'
updated_at: '2026-09-13T23:19:50.382002+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/request-01ea4eec.md` (REQ-155) — class UU, sparse-excluded
  (index-only conflict, no working-tree markers). Rule 2e (intent/bookkeeping
  ticket), resolved per-fact:
  - **Body prose**: identical on both sides — HEAD already carries the entire
    incoming rewrite (seventeen-not-fourteen `mkdirSync` correction, "The shape
    of the port", the five design decisions, the AC3 non-determinism section,
    blast radius, tightened AC1/2/3/5, test plan). Nothing to compose.
  - **`status`**: same field changed differently. Incoming advances
    `draft -> free_coding` (2026-09-01T18:36:24Z); HEAD is `bundled`
    (updated_at 2026-09-11T18:53:53Z), i.e. the later lifecycle position, and it
    already records `fields.commits[0].working_sha = ab467d6c` — the free_coded
    work this very commit belongs to. Kept HEAD (`bundled`) and its `updated_at`.
  - **`fields.commits` / `fields.version: 0.2.32` / `fields.bundled_in:
    bundle-8e1807f6`**: present only on HEAD — HEAD is a strict superset here,
    kept. Incoming adds no field HEAD lacks.
  - Resolution taken as `checkout --ours --ignore-skip-worktree-bits`, verified
    byte-identical to index stage 2 (`341427c5`) before `git add --sparse`, so
    no marker residue and no auto-merged incoming hunk was dropped.

Staged diff vs HEAD is empty — the seeded local-overlay already carries this
`ticket update`'s effect, so the commit is redundant, not discarded. Per STEP 4
this is staged and exited @done; finalize will skip the commit. No
`--skip`/`--continue`/`--abort` was run; CHERRY_PICK_HEAD (`ffce0148`) intact.

## Incoming changes preserved

No code/implementation files were in this conflict — the incoming commit
`ffce0148` touches only `.xgd/tickets/hot/request-01ea4eec.md`.

STEP 3 check for that file: `git diff :2: :3:` shows the incoming side differs
from HEAD **only** in `updated_at`, `status`, the absence of HEAD's
`commits`/`version`/`bundled_in` fields, and a trailing-newline-at-EOF. Every
substantive insertion in the incoming diff (112 lines of ticket body) is present
verbatim in the resolved file. The one incoming fact not kept — `status:
free_coding` — is superseded, not discarded: HEAD holds the strictly later state
`bundled` for the same field, recording the free_coded commit that produced it.

No BUG-1301 precedence drops; no test functions involved.
