---
uid: report-a59ac174
id: REPORT-3151
type: report
title: 'Reconcile resolve conflicts: reconcile-REQ-162'
created_by: xgd
created_at: '2026-09-01T00:52:34.517133+00:00'
updated_at: '2026-09-01T00:52:34.517133+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-REQ-162
---

## Files resolved

- `.xgd/tickets/hot/request-0cdfdc5b.md` — AA (both added), intent/bookkeeping ticket
  (rule 2e). Both sides added the same REQ-146 request ticket. The only difference
  between the two blobs is 5 lines of lifecycle metadata (body is byte-identical):
  - ours (HEAD): `updated_at: 2026-08-24T02:10:41`, `status: bundled`,
    `fields.bundled_in: bundle-b3b7c399`
  - theirs (458b7fc9c2, authored 2026-08-23): `updated_at: 2026-08-20T02:59:27`,
    `status: ready_to_reconcile`, no `bundled_in`

  Same fact (status/updated_at) set differently on each side → per-fact timeline rule.
  `xgd ticket history request-0cdfdc5b` shows HEAD's lineage already contains the
  incoming side's state (`ready_to_reconcile`, set 2026-08-19 in 3f8e120da1) and then
  advances past it in 434f316f19 (2026-08-30, seed_local_overlay) to `bundled` +
  `bundled_in: bundle-b3b7c399`. HEAD is the later-positioned intent for that fact;
  the incoming side is an earlier snapshot of the same lifecycle. Taking incoming
  would have regressed the status and dropped `bundled_in`.

  Resolved with `git checkout --ours` (verified lossless: stage-2 blob 8f9aab447a ==
  `HEAD:.xgd/tickets/hot/request-0cdfdc5b.md`; the only marker hunks were the two
  metadata regions at lines 8-18 and 58-61 — no body content on either side dropped),
  then `git add --sparse` (path is outside the sparse-checkout cone, DOC-986 §2/§4.1).

## Incoming changes preserved

No code/implementation files were conflicted — the single conflict is a bookkeeping
ticket. The incoming commit 458b7fc9c2 (`xgd(ticket): update request request-0cdfdc5b`)
adds the file with 370 insertions; that entire 370-line body is present verbatim in the
resolved file. `git diff :2: :3:` reports only 2 insertions / 3 deletions, all in the
YAML front matter. Nothing from the incoming side is absent except the three stale
lifecycle-metadata values, which HEAD supersedes by a later intent as described above.

No hunks were dropped under the BUG-1301 precedence exception.

## Staging state

`git status --porcelain --untracked-files=no` is empty and `git diff --cached HEAD` is
empty: the resolution nets to no change vs HEAD, because HEAD already carries this
commit's content (and more) via a later route. Per STEP 4 this is the redundant-commit
case, not a discard (STEP 3 check above confirms the incoming content is present in
HEAD, not merely absent) — staged and exiting @done; the finalize step will detect the
clean staged diff and skip the commit. CHERRY_PICK_HEAD (458b7fc9c2) left intact; no
`--continue`/`--skip`/`--quit`/`--abort` was run.
