---
uid: report-f5700db7
id: REPORT-6734
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-32'
created_by: xgd
created_at: '2026-10-25T23:48:03.843079+00:00'
updated_at: '2026-10-25T23:48:03.843079+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-32
---

## Files resolved

- `.xgd/tickets/hot/doc-5f79420d.md` (DOC-40 "Identity, Accounts & Entitlement"): DU, doc ticket. Rule 2a, restore and keep incoming (`git checkout --theirs`, then `git add --sparse`).
  - "Deleted by us" was not a real deletion. HEAD has no add/delete history for this path. The commit that created the doc (`c3752ca649`) and two earlier updates (`edfac6d775`, `23b5eb04b9`) are on `reconcile-src-BUNDLE-32`/`xgd-working` but were never applied to this branch, so incoming `d987c927cc` ("update doc doc-5f79420d") had no base to apply to.
  - Ticket files store the whole ticket state, so stage 3 is the complete, latest DOC-40. It is also the most recent commit by timestamp, as the enrichment rule asks. Taken whole.

## Incoming changes preserved

- The staged blob `da3233a1a6` is the same as the incoming stage-3 blob. All of the incoming change is present: §2 "Four nouns" (Business/Account split), §2.1–2.3, the invite/first-login table rewrite, the per-business entitlement paragraph, and open question 3b.

## Flag for post-merge review

- DOC-40's creating commit and first two updates are missing from this branch's applied history, so the bundle's cherry-pick window may have a gap. If DOC-40 was meant to stay out of BUNDLE-32, unstage it with `git rm --cached --sparse .xgd/tickets/hot/doc-5f79420d.md`.
