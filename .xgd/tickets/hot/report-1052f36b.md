---
uid: report-1052f36b
id: REPORT-2759
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T06:34:54.960227+00:00'
updated_at: '2026-08-31T06:34:54.960227+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/bug-fe8af80a.md` — class **AA** (both added), intent/bookkeeping
  ticket → rule **2e** (superset), not 2d (this is a `bug-*` ticket, not a
  matrix-defining spec ticket).
  Both sides are byte-identical across the entire body and every frontmatter
  field except one: the incoming side adds `fields.chat_comment: comment-ad8884dc`.
  Incoming is therefore a strict superset of HEAD — no field is changed
  differently on the two sides, so no timeline tie-break was needed.
  Resolved by taking the incoming version whole:
  `git checkout --theirs` then `git add --sparse`
  (path is outside the sparse-checkout cone — `!/.xgd/tickets/**` — so the
  conflict existed in the index only, with no working-tree markers; DOC-986 §2/§4.1).

## Incoming changes preserved

- Incoming commit: `068766b1acb60f1c2cd879caba5643686e72c97a`
  (`xgd(ticket): update bug bug-fe8af80a`, Martin Westhead, 2026-08-23).
  It touches exactly one file, the one resolved above.
- The staged blob is `27aa469caafbef6db3afbd4636dc3ddc1751c170`, which is
  byte-for-byte the incoming (stage-3) blob. Nothing from the incoming side was
  dropped or rewritten.
- Staged diff vs HEAD is `1 file changed, 1 insertion(+)` — the added
  `chat_comment: comment-ad8884dc` line, i.e. exactly the incoming delta.
- No hunks were dropped; the BUG-1301 precedence exception was not invoked.
- No code, test, or UAT files were involved in this conflict.

## Post-resolution state

- `git ls-files -u` returns 0 entries — no unmerged paths remain.
- `git status --porcelain` shows `M  .xgd/tickets/hot/bug-fe8af80a.md` (staged);
  all other entries are pre-existing untracked ticket files, not conflicts.
- The in-progress cherry-pick was left intact: CHERRY_PICK_HEAD is still present.
  No `--continue`/`--skip`/`--quit`/`--abort`/`reset` was run.
