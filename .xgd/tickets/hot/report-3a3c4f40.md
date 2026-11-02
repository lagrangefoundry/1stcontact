---
uid: report-3a3c4f40
id: REPORT-7998
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-37'
created_by: xgd
created_at: '2026-11-02T00:26:04.682538+00:00'
updated_at: '2026-11-02T00:26:04.682538+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-37
---

## Files resolved

- `.xgd/tickets/hot/bug-61165116.md` (BUG-51): intent/bookkeeping ticket (2e). Kept HEAD's version (`git checkout --ours` + `git add --sparse`).
  - Incoming `ac0145bb27` (2026-09-05T18:42, `status: draft`, `last_field_updated: body`) is an early body revision of BUG-51.
  - All five conflicting hunks change the same fact on both sides. In each one HEAD has the later, expanded revision:
    - front matter: HEAD is `free_and_reconciled`, completed 2026-11-01
    - B1 `--force`: HEAD adds the absent-not-false wire semantics and the per-run scope
    - B2: HEAD adds the "structural guard, not a live failure" rationale
    - B3 port probe: HEAD adds TCP-connect wording, the "something is listening" message and the already-absent = success bullet
    - test plan: HEAD refines the reset bullets (file count/size, `--include-public`, repo-anchored, already-empty, port probe)
  - Per fact, the later revision wins (2e). The enrichment timestamp rule gives the same answer.

## Incoming changes preserved

- No code files were involved.
- The incoming commit's non-conflicting body changes (Required behaviour B1–B3 skeleton, Out of scope, Test plan base) were already in HEAD.
- The only hunks dropped are earlier wordings that HEAD later refined. This commit is redundant on this branch, not discarded. The staged diff vs HEAD is empty; finalize should skip it.

## Note

This is the second consecutive stale BUG-51 draft revision in this window (previously `a8da3db5de`). Further Sep-5 `update bug bug-61165116` commits will probably conflict the same way and resolve to HEAD.
