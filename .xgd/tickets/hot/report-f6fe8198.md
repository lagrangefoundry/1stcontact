---
uid: report-f6fe8198
id: REPORT-3625
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-26'
created_by: xgd
created_at: '2026-09-10T01:22:34.622388+00:00'
updated_at: '2026-09-10T01:22:34.622388+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-26
---

## Files resolved

- `.xgd/tickets/hot/request-b88b79fe.md` — UU, intent/bookkeeping ticket (rule 2e).
  Single conflicting hunk, entirely frontmatter: `updated_at` / `last_field_updated` /
  `status`. Same facts changed on both sides, so the per-fact timeline rule applies.
  - Ours (HEAD, `afd199743a`, 2026-08-31 12:21:41 -0700, `seed_local_overlay`):
    `status: draft -> bundled`, `updated_at: 2026-08-31T05:05:09`.
  - Theirs (incoming `baf4842709`, 2026-08-26 16:27:04 -0700, `update request`):
    `status: draft -> free_coding`, `updated_at: 2026-08-26T23:27:04`.
  - HEAD's intent is the later-positioned one (5 days later, and `bundled` is downstream
    of `free_coding` in the same request lifecycle), so HEAD's value was kept for each of
    the three facts. `git checkout --ours` + `git add --sparse`.
  - The incoming commit touched nothing else in this file; the body/AC-status additions
    that only exist on the HEAD side merged cleanly and are intact.

## Incoming changes preserved

- `.xgd/tickets/hot/request-b88b79fe.md`: the incoming commit's only change is the
  `draft -> free_coding` status advance plus its `updated_at`/`last_field_updated`
  bookkeeping. That intent is present in HEAD via a later route — HEAD has already
  advanced the same ticket past `free_coding` to `bundled` with a newer `updated_at`.
  Nothing from the incoming diff is absent in the sense of STEP 3; re-applying it would
  regress an operator-set status backwards in the lifecycle. No BUG-1301 precedence
  exception was needed, and no code or test files were involved in this conflict.

Note: with the incoming change already subsumed by HEAD, the staged tree nets to no diff
vs HEAD (`git diff --cached HEAD` is empty for this path). Per STEP 4 this is left for
`cherry_pick_finalize_resolution` to skip; no `--skip`/`--continue` was invoked here.
