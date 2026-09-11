---
uid: report-c85c36d2
id: REPORT-3847
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-26'
created_by: xgd
created_at: '2026-09-11T01:26:05.348057+00:00'
updated_at: '2026-09-11T01:26:05.348057+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-26
---

## Files resolved

- `.xgd/tickets/hot/request-439cd0c8.md` — UU, index-only (path is outside the
  sparse-checkout cone, so there were no working-tree markers). Class 2e
  (intent/bookkeeping ticket, `request-*`). Rule applied: **strict superset** —
  kept HEAD's version via `git checkout --ours` + `git add --sparse`.

  Base = `6d32b77e`, ours = `67db22b9`, theirs = `6087865d`.
  Diffed base-relative rather than side-relative: the incoming commit
  (`59a11113`, `xgd(ticket): update request request-439cd0c8`) changed exactly
  **one line** against its own parent — it added `fields.chat_comment:
  comment-0fb97f84`. Everything else in the ours-vs-theirs diff is HEAD-side
  content that the incoming never touched and never intended to remove; git
  surfaced it only because the two edits land in one large region.

  HEAD already carries that field, plus the `bundled` status, the
  `commits`/`version`/`bundled_in` bookkeeping, and the full "shadow →
  description" rewrite with the implementation-review body. Taking theirs would
  have reverted `status: bundled` to `draft`, dropped the bundle bookkeeping,
  and deleted ~240 lines of ticket body — all of it content the incoming commit
  did not author a removal of.

## Incoming changes preserved

- `.xgd/tickets/hot/request-439cd0c8.md` — **present**. The incoming commit's
  sole change, `chat_comment: comment-0fb97f84`, appears verbatim in the
  resolved file at `fields.chat_comment`. Verified by reading the staged blob's
  frontmatter, and independently visible as unchanged *context* (not a `+`/`-`
  line) in `git diff <ours> <theirs>`, which is what it means for the field to
  exist identically on both sides.

No hunks were dropped, so the BUG-1301 precedence exception does not apply here.

## Note for the finalize step

This resolution nets to **no diff vs HEAD** — the staged tree equals HEAD
exactly (`git diff --cached HEAD` is empty; index entry is at stage 0 with blob
`67db22b9`). That is the redundant-commit case, not a discarded one: the
incoming commit's effect had already reached this branch through a later
working-timeline commit that carried the same field forward alongside the
bundling bookkeeping. Per STEP 4, no `--skip` was issued; `CHERRY_PICK_HEAD`
is left intact for `cherry_pick_finalize_resolution` to detect the clean staged
diff and skip the commit itself.
