---
uid: report-e82b7ab4
id: REPORT-2706
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T05:34:08.169987+00:00'
updated_at: '2026-08-31T05:34:08.169987+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/bug-88dfa748.md` — **AA (both added)**, intent/bookkeeping
  ticket (BUG-17). Rules **2b** (AA: one side is a strict superset → keep the
  superset) and **2e** (incoming only added a field the other side never
  touched → keep the superset) agree. Resolved via
  `git checkout --theirs` + `git add --sparse`.

  Both sides were byte-identical except for a single added line in the
  `fields:` block on the incoming side:

  ```
  +  chat_comment: comment-7222e43c
  ```

  No field was changed differently on the two sides, so no per-fact timeline
  arbitration (`xgd working-timeline`) was required — there is no competing
  fact. The enrichment note's "take the more recent commit by timestamp and
  flag for post-merge review" fallback was not needed either: the superset
  relation is exact and total, so taking incoming loses nothing from HEAD.

  Ours blob:   `42f6db87d20d231c6c540cc1ed58c5492fd89c15`
  Theirs blob: `8e35cb6e15695a402126d461ffcb4d0eea6a5ce7`
  Resolved working-tree blob: `8e35cb6e15695a402126d461ffcb4d0eea6a5ce7`

  Note: the path is outside the sparse-checkout cone (DOC-986 §2/§4.1), so the
  conflict existed only in the index — the working-tree file carried no
  conflict markers and held the ours-side content until `--theirs` was applied.

## Incoming changes preserved

- `.xgd/tickets/hot/bug-88dfa748.md` — **fully preserved.** The incoming commit
  `4d662611d4538159f5e983711a2feba535ab29dd` adds this file whole
  (`new file mode 100644`, 91 insertions) with blob `8e35cb6e15`. The resolved
  working-tree file hashes to `8e35cb6e15695a402126d461ffcb4d0eea6a5ce7` —
  byte-identical to the incoming blob. Every line of the incoming diff is
  present in the resolution, including the `chat_comment: comment-7222e43c`
  field that is the sole substantive difference from the HEAD side.

No code/implementation files were in conflict, so no BUG-1301 precedence
exception was invoked and no hunk was dropped. No test function on either side
was deleted.

Staging verified: `git ls-files -u` reports 0 unmerged entries;
`git status --porcelain` shows `M  .xgd/tickets/hot/bug-88dfa748.md` with no
UU/AA/DU/UD lines remaining. The cherry-pick sequencer state
(`CHERRY_PICK_HEAD`) was left untouched for
`cherry_pick_finalize_resolution`.
