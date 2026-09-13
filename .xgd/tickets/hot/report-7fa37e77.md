---
uid: report-7fa37e77
id: REPORT-4172
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-13T23:22:08.587060+00:00'
updated_at: '2026-09-13T23:22:08.587060+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/comment-2c16318b.md` — AA (both added), intent/bookkeeping ticket (chat transcript comment, COMMENT-915 on CHAT-21). Rule 2e applied: incoming is a **strict superset** of ours — it contains every byte of the HEAD-side version plus one appended chat turn (user turn `9d65d2ca-422e-45a4-8fb5-a2b93219f3bc-user`, ts 2026-09-01T18:41:14, "ok can you summarize what the document would look like?") and the matching `updated_at` bump from `2026-08-21T02:20:17` to `2026-09-01T18:41:14`. Kept the superset via `git checkout --theirs` + `git add --sparse` (path is outside the sparse-checkout cone, DOC-986 §2/§4.1).

Diff between the two sides was 7 insertions / 1 deletion across a 1918-line file; no HEAD-side content was present that incoming lacked, so there was nothing to compose.

## Incoming changes preserved

- `.xgd/tickets/hot/comment-2c16318b.md`: the incoming commit `cc53fc8` ("xgd(ticket): update comment comment-2c16318b") adds this file in full (1918 insertions). The staged blob is `3aeb94d29372e7541f39007a498dfe3c4ce012a6`, byte-identical to stage 3 (theirs) of the conflict, so 100% of the incoming content is present in the resolution.

No hunks were dropped; the BUG-1301 precedence exception was not invoked.

Cherry-pick sequencer state (CHERRY_PICK_HEAD) left intact for `cherry_pick_finalize_resolution`.
