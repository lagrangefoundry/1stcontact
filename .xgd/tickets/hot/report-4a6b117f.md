---
uid: report-4a6b117f
id: REPORT-3618
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-26'
created_by: xgd
created_at: '2026-09-10T01:04:42.089174+00:00'
updated_at: '2026-09-10T01:04:42.089174+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-26
---

## Files resolved

- `.xgd/tickets/hot/bug-23d1ec27.md` — **UU**, intent/bookkeeping ticket (rule 2e).
  Two frontmatter hunks, both resolved toward HEAD as the strict superset:
  1. `updated_at` / `last_field_updated` / `status` — HEAD `status: bundled`
     (`updated_at: 2026-08-31T05:05:09Z`) vs incoming `status: free_coded`
     (`updated_at: 2026-08-25T23:28:10Z`). `bundled` is downstream of `free_coded`
     in the lifecycle, and HEAD's last touch of this file
     (`fe03200d`, 2026-08-31) post-dates the incoming side's (`7f1350e9`,
     2026-08-25). Taking incoming here would have reverted an operator-advanced
     status. Also matches the auto-enrichment rule ("take the more recent commit
     by timestamp") for the intent-unknown case.
  2. `fields.bundled_in: bundle-8eef3846` — present on HEAD only, absent on
     incoming. Kept (field the incoming side never touched).

  No fields were invented; nothing outside the two conflict regions was altered.
  `fields.intent_uid` / `story_uid` / `capability_uid` untouched.

## Incoming changes preserved

The incoming commit `148b2c20` (merge of `free-BUG-39` into `xgd-working`)
contributed exactly these to this file:

- `fields.commits[0].working_sha: 759cd87405a4b50f81995b2c9b510bf23be54fbd`,
  `reconcile_sha: null`, `main_sha: null` — **present** (lines 19-22), merged
  cleanly outside the conflict regions.
- `fields.version: 0.2.15` — **present** (line 23).
- `fields.story_points: 3` — **present** (line 24).
- Body: removal of the trailing newline after `emits it.` — **present**; it is
  the only net change the staged resolution makes against HEAD
  (`git diff --cached HEAD` shows one line, `\ No newline at end of file`).
- `status: free_coded` — superseded, not discarded. HEAD reached this state and
  then advanced past it: the same `free-BUG-39` merge already landed on this
  branch via a later route (`fe03200d`, 2026-08-31, identical subject), carrying
  the identical `working_sha`, `version` and `story_points`, after which the
  bundling step set `status: bundled` and `bundled_in: bundle-8eef3846`.

No BUG-1301 precedence exception was needed — no hunk was dropped as obsolete,
and no code or UAT test files were involved in this conflict.

Verification: `git diff --name-only --diff-filter=U` is empty; no conflict
markers remain in the resolved file; the file is staged. The cherry-pick
sequencer state (`CHERRY_PICK_HEAD`) was left intact for
`cherry_pick_finalize_resolution`.
