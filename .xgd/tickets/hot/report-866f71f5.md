---
uid: report-866f71f5
id: REPORT-2855
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T08:34:42.979771+00:00'
updated_at: '2026-08-31T08:34:42.979771+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/request-5fb63a3a.md` — AA (both added), intent/bookkeeping ticket
  (`request-*`, rule 2e). Incoming (free_coded `xgd(ticket): update request
  request-5fb63a3a`, 6c14426) is a **strict superset** of ours
  (`sync_working_to_main` b8606f0d): the two blobs are byte-identical except that
  incoming adds one frontmatter field, `fields.chat_comment: comment-42a042b2`.
  No competing fact, no section changed on both sides — so 2e's "keep the
  superset" branch applies and no timeline lookup was needed.
  Resolved with `git checkout --theirs` + `git add --sparse` (path is outside the
  sparse-checkout cone, DOC-986 §2/§4.1).

## Incoming changes preserved

- `.xgd/tickets/hot/request-5fb63a3a.md`: the incoming commit's only delta versus
  the HEAD side is `+  chat_comment: comment-42a042b2`. `git diff --cached`
  confirms exactly that one insertion is staged (1 file changed, 1 insertion).
  The whole rest of the ticket — goal, behaviour, `regions.json` contract, UAT
  list, and the free-coded implementation-status section — is identical on both
  sides and is retained verbatim.

No hunks were dropped; the BUG-1301 precedence exception was not invoked.
No code/implementation files were in conflict — this bundle's only conflict was
the single bookkeeping ticket above.
