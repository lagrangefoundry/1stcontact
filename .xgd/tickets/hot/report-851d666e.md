---
uid: report-851d666e
id: REPORT-3368
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-23'
created_by: xgd
created_at: '2026-09-02T21:25:42.967119+00:00'
updated_at: '2026-09-02T21:25:42.967119+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-23
---

## Files resolved

- `.xgd/tickets/hot/bug-23d1ec27.md` (BUG-39) — UU, intent/bookkeeping ticket
  (rule 2e). Resolved by keeping the HEAD side, which is a strict superset of
  the incoming side.

  - Incoming (`7f1350e9a56f`, `xgd(ticket): update bug bug-23d1ec27`,
    2026-08-25T23:28:10Z): adds `fields.story_points: 3`, sets
    `last_field_updated: story_points`, bumps `updated_at`. `status` stays
    `free_coded`. No body change (the only body-side difference is the
    incoming's missing final newline).
  - HEAD (merge of `free-BUG-39` into `xgd-working`, `updated_at`
    2026-08-31T05:05:09Z): already carries `story_points: 3` verbatim, plus
    `bundled_in: bundle-8eef3846`, with `status` advanced `free_coded` →
    `bundled`.

  Per 2e ("one side is a strict superset of the other: keep the superset").
  The one field whose value differs is `status`, and the two values are
  consecutive positions on the same lifecycle — `bundled` is the later state,
  written by the bundling step that consumed this commit's branch. Writing
  `free_coded` back would regress operator-owned lifecycle state and orphan
  `bundled_in: bundle-8eef3846`. `last_field_updated`/`updated_at` are
  derived bookkeeping that follow whichever write landed last, which on HEAD
  is the bundling write. No fact is genuinely in competition, so no
  `working-timeline` lookup was needed.

  This is the second consecutive commit in this bundle to touch this ticket
  the same way (the previous pick, `0941885b7b73`, added `commits[]` and
  `version: 0.2.15` — also already in HEAD). Both are frontmatter-only
  bookkeeping writes that HEAD has already absorbed.

## Incoming changes preserved

- `.xgd/tickets/hot/bug-23d1ec27.md`: `git show 7f1350e9a56f -- <file>` shows
  one substantive change — `fields.story_points: 3`. It is present verbatim in
  the resolved file (line 24). The accompanying `last_field_updated` /
  `updated_at` bumps are derived metadata superseded by HEAD's later write.
  Nothing from the incoming commit is absent.

- No hunks were dropped under the BUG-1301 precedence exception. No code
  files, no test files, and no spec tickets were involved in this conflict.

The resolution therefore nets to no diff vs HEAD; staged as instructed
(no `--skip` called). Cherry-pick sequencer state left intact.
