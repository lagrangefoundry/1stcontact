---
uid: report-ee44dfe9
id: REPORT-5470
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-29T05:19:48.110423+00:00'
updated_at: '2026-09-29T05:19:48.110423+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/request-bbff35c7.md` (REQ-160) — **UU**, intent/bookkeeping
  ticket (`request-*`), rule 2e. Outside the sparse-checkout cone, so the
  conflict lived in the index only; staged with `git add --sparse`.
  The conflict was confined to the frontmatter lifecycle block; every body
  hunk from the incoming commit applied cleanly.

  Per-fact resolution (2e: same field changed differently → later-positioned
  intent wins, per fact):
  - `updated_at` / `completed_at` / `last_field_updated` / `status`: HEAD side
    kept (`2026-09-19`, `completed_at: 2026-09-14`, `status:
    free_and_reconciled`). Incoming replays an older snapshot
    (`2026-09-01`, `completed_at: null`, `status: draft`); taking it would
    regress a completed, reconciled ticket back to draft.
  - `fields.commits`, `fields.version`, `fields.bundled_in`: HEAD-only
    additions, absent from the incoming side — kept (non-overlapping).
  - Body: incoming-only additions — kept (non-overlapping).

## Incoming changes preserved

Verified with `git diff $CHERRY_PICK_HEAD -- .xgd/tickets/hot/request-bbff35c7.md`:
the only difference between the incoming commit and the resolved file is the
frontmatter block above. All four body additions from `9081f1b091` are present:

- the `The cursor must not re-report the document it stopped on` bullet
  (plus the `corrupt cursor` and `A conversation is never reported to itself`
  bullets in the same hunk)
- the co-ranked-search section ending
  `Two independent indexes, co-ranked for presentation`
- the `A single oversized title is clipped, not dropped` decision
- the two-knowledge-base acceptance-criterion line

No hunk was dropped; the BUG-1301 precedence exception was not invoked.

## Staging state

`git status --porcelain` is empty: no conflict classes remain, and the staged
tree is identical to HEAD — the branch already contained this commit's body
additions, so the patch is a genuine no-op once the stale lifecycle header is
discarded. Per STEP 4, no `--skip` was issued; finalize should detect the clean
staged diff. `CHERRY_PICK_HEAD` (`9081f1b091`) left in place.
