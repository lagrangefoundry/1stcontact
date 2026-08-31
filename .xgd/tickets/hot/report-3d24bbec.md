---
uid: report-3d24bbec
id: REPORT-2772
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T06:52:07.246805+00:00'
updated_at: '2026-08-31T06:52:07.246805+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/request-f3342338.md` — AA (both added), intent/bookkeeping ticket
  (`.xgd/tickets/hot/request-*.md`) → STEP 2 rule **2e** ("one side is a strict superset
  of the other: keep the superset"), consistent with **2b**. Path is outside the
  sparse-checkout cone (`!/.xgd/tickets/**`), so resolved via
  `git checkout --theirs` + `git add --sparse` per DOC-986 §2/§4.1.

  Both sides are byte-identical except that the incoming side adds one field:
  `fields.chat_comment: comment-e823d0e0`. Every other frontmatter field
  (uid, id, status `free_and_reconciled`, commits list, version 0.0.31,
  bundled_in bundle-adc60ee8) and the entire markdown body are the same on both
  sides. Incoming is therefore a strict superset — nothing from the HEAD-side
  (`sync_working_to_main` from xgd-working b8606f0d68b7) version was dropped, so
  the per-fact timeline tiebreak in 2e never had to be applied and no
  post-merge-review flag is warranted. No `intent_uid`/`story_uid`/`capability_uid`
  fields were touched; no content invented.

## Incoming changes preserved

- Incoming commit `e36ff57a486e0d8a2e604be791427ef2fb1e9d4d`
  ("xgd(ticket): update request request-f3342338", 2026-08-23) touches exactly one
  file, `.xgd/tickets/hot/request-f3342338.md`.
- Staged blob for that path is `9e3097349b6d79d76c1015036ab04afce414dcea`, which is
  the incoming (stage-3) blob verbatim — a byte-for-byte match, so 100% of the
  incoming commit's content is present in the resolution.
- Staged diff vs HEAD: `1 file changed, 1 insertion(+)` — the added
  `chat_comment: comment-e823d0e0` line, which is precisely the incoming change.
- No hunks were dropped; the BUG-1301 precedence exception was not invoked and does
  not apply here. No code, test, or UAT files were involved in this conflict.

Working tree verified free of conflict markers and of conflict-class status lines
(UU/AA/DU/UD/AU/UA). The in-progress cherry-pick was left untouched — CHERRY_PICK_HEAD
is still present for `cherry_pick_finalize_resolution`.
