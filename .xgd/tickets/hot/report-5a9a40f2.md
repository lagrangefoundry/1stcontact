---
uid: report-5a9a40f2
id: REPORT-5155
type: report
title: 'Resync resolve conflicts: d7587990b588ef6c03b752fe16afa93745aa9da3'
created_by: xgd
created_at: '2026-09-26T22:13:43.419113+00:00'
updated_at: '2026-09-26T22:13:43.419113+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/request-94e93caa.md` — **UU**, intent/bookkeeping ticket
  (`request-*`), rule **2e** ("one side a strict superset: keep the
  superset"). Resolved via `git checkout --ours` + `git add --sparse`.

  Both sides descend from the same base (`updated_at`
  `2026-08-23T03:29:52`, `status: ready_to_reconcile`):

  - **Incoming** (`082425ccd3`, authored 2026-08-23 13:15:17 -0700) adds
    exactly one field: `fields.chat_comment: comment-18e5a285`. Nothing
    else — status, `updated_at`, `completed_at` and the body are
    untouched from base.
  - **Ours** (`f7bd4caa5e`, authored 2026-08-31 07:22:27 -0700) contains
    that same `chat_comment: comment-18e5a285` verbatim, **plus** the
    lifecycle advance (`status: ready_to_reconcile` →
    `free_and_reconciled`, `completed_at` set to
    `2026-08-31T14:22:27`, `updated_at` bumped to match) **plus**
    `fields.bundled_in: bundle-b3b7c399`.

  `diff theirs ours` shows additions only in ours' favour — ours is a
  strict superset, so no per-fact timeline tiebreak was needed and no
  fact was composed by hand (the ticket file was never hand-edited;
  `checkout --ours` restores HEAD's exact blob, preserving frontmatter
  integrity). Body sections are byte-identical on both sides.

  Taking the incoming side here would have regressed `status`
  `free_and_reconciled` → `ready_to_reconcile`, nulled `completed_at`,
  and dropped `bundled_in: bundle-b3b7c399` — i.e. discarded
  operator-owned lifecycle state that HEAD had already advanced past.

## Incoming changes preserved

- `.xgd/tickets/hot/request-94e93caa.md` — **fully preserved.**
  `git show 082425ccd3 -- <file>` is a single-line addition,
  `+  chat_comment: comment-18e5a285`. That line is present in the
  resolved file at line 25. The incoming commit's entire contribution
  had already been integrated into HEAD by the later commit
  `f7bd4caa5e`, which carried it forward alongside further updates.

No hunks were dropped, so the BUG-1301 precedence exception was not
invoked and does not apply to this resolution.

## Net effect

The staged tree is byte-identical to HEAD for this path
(`git diff --cached HEAD -- <file>` is empty), because the incoming
commit's only change was already present in HEAD. `git status
--porcelain` is fully clean: no `UU`/`AA`/`DU`/`UD` lines, and zero
conflict markers remain in the working-tree file.

Per the stage instructions, `--skip` was **not** invoked — the empty
staged diff is left for the finalize step to detect and skip.
`CHERRY_PICK_HEAD` remains present at `082425ccd333debca6a7cb520dfdeca19ca4eaa8`;
no `--continue`/`--skip`/`--quit`/`--abort` was run.
