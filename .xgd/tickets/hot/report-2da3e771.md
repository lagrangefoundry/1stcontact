---
uid: report-2da3e771
id: REPORT-2807
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T07:35:40.555224+00:00'
updated_at: '2026-08-31T07:35:40.555224+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/request-58b6a329.md` — **AA** (both added), intent/bookkeeping
  ticket (`request-*`, REQ-122). Rule **2b / 2e — strict superset wins**.
  Both sides added the file independently; the two blobs are byte-identical
  except that the incoming (free_coded) side carries one additional frontmatter
  field:

  ```
  +  chat_comment: comment-3a4e4f6f
  ```

  No field is changed differently on the two sides, so there is no per-fact
  conflict and no timeline lookup was needed. Resolved by taking the incoming
  side whole (`git checkout --theirs`), which is the union of both sides.

  Path is outside the sparse-checkout cone, so staging used `git add --sparse`.

## Incoming changes preserved

- `.xgd/tickets/hot/request-58b6a329.md` — **fully preserved, verified by blob
  identity.** The staged index entry hashes to `8768287920` — exactly the
  incoming commit's stage-3 blob. `git diff --cached HEAD` for this path shows
  precisely the one incoming addition (`chat_comment: comment-3a4e4f6f`) and
  nothing else. Nothing from the HEAD side was dropped: HEAD's blob
  (`4e4e34d253`) is a proper subset of the incoming blob.

- No hunks were dropped; the BUG-1301 precedence exception was not invoked.

- No code, test, or UAT files were involved in this conflict.

### Note for post-merge review (informational, not a defect)

The field taken from the incoming side references `comment-3a4e4f6f`, and that
comment ticket is not yet present in this worktree's `.xgd/tickets/hot/`. It
does exist in the wider repository history, so the reference is valid on the
working timeline — the comment ticket is presumably carried by another commit in
bundle `bundle-b3b7c399` that has not been cherry-picked yet. No content was
invented to compensate; the dangling-for-now reference is exactly what the
developer authored.

Cherry-pick sequencer state (`CHERRY_PICK_HEAD` = `2e3caa75c07a`) left intact for
`cherry_pick_finalize_resolution`. No `--continue` / `--skip` / `--abort` /
`reset` was issued.
