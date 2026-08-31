---
uid: report-771d721d
id: REPORT-2713
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T05:42:05.964400+00:00'
updated_at: '2026-08-31T05:42:05.964400+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/request-488d874b.md` — class **AA** (both added), intent/bookkeeping ticket → rule **2e** (strict-superset case), with **2b** confirming the same outcome.
  - Both sides added the same 321/322-line request ticket. Full blob diff between stage 2 (`f410bdc`, ours) and stage 3 (`db41d7c`, incoming) is a **single added frontmatter line**:
    `+  chat_comment: comment-a0602b67`
  - No other line differs — no competing edit to any field, section, or body text. Incoming is a strict superset of ours, so the superset was kept via `git checkout --theirs` + `git add --sparse`.
  - Staged blob is `db41d7c` (byte-identical to the incoming side); nothing from the HEAD side was lost, since HEAD's content is wholly contained in it.

## Incoming changes preserved

- `.xgd/tickets/hot/request-488d874b.md`: the incoming commit `b0186896` adds the file with `chat_comment: comment-a0602b67` in frontmatter. Verified present in the resolved file at line 37. `grep` for conflict markers (`<<<<<<<` / `>>>>>>>`) returns nothing. `git ls-files -s` confirms the staged object is the incoming blob, so the incoming diff is preserved in full.

No hunks were dropped; the BUG-1301 precedence exception was not invoked. No code/implementation, UAT, or spec-ticket files were involved in this conflict.

`git status --porcelain` shows no remaining conflict classes — only `M  .xgd/tickets/hot/request-488d874b.md` (staged). CHERRY_PICK_HEAD left intact for `cherry_pick_finalize_resolution`.
