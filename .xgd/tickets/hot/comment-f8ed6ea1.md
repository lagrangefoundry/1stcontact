---
uid: comment-f8ed6ea1
id: COMMENT-7949
type: comment
title: Claude response for fix_reconciliation_review report
created_by: xgd
created_at: '2026-11-07T22:34:46.645325+00:00'
updated_at: '2026-11-07T22:34:46.645325+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-8cfad78e
  kind: note
---

I've fixed all three blocking findings from the review (report-770ee6b7). I didn't run the new tests, because this step's instructions leave that to the workflow's own run afterwards.

1. **AC-2154 superseded.** It is now `status: superseded` with `superseded_by_uid: bundle-7988e925`, since REQ-203 overturns its "invited-only is refused `no_membership`" claim. I left its old test untouched, as the instructions require.
2. **AC-2341 and AC-2342 now have tests and are active.** The new file is `tests/test_reconciliation_terms_signup_provisioning.workers.test.ts`. Every case goes through the real accept request on the real worker:
   - **AC-2341 (signing up creates a business):**
     - Accepting creates one business for the contact's existing account, with no new account row. It is named after the contact, or "Unnamed business" if they have no name, and has an owner membership, an open-ended grant and a starter site.
     - A second acceptance, including after a terms version bump, creates nothing more.
     - An operator, or someone who already holds another account's business, gets nothing.
     - When provisioning fails, no acceptance is recorded, the person is shown the terms again, and a retry succeeds. The failure is forced with a temporary database trigger on that one contact's membership insert.
   - **AC-2342 (where accepting lands you):** the accept button sends `/terms` to `/` and reloads any other page, and after accepting, `/` serves the builder with the Site tab first. The button's script can't run in the Workers test runtime, so the test checks the script text, as the existing terms tests do. I updated the AC's Verification text to say so.
   - **Main risk:** the forced-failure case assumes the test database accepts the trigger and rolls back the partly written business. If the workflow's test run fails, look there first.
3. **The out-of-scope migration is gone.** I deleted `db/migrations/0002_session_rotation.sql`. In `0001_baseline.sql` I only rewrote the comment so it no longer mentions `0002` or REQ-231; the nine-column `sessions` table and its indexes are unchanged.

I also fixed the two minor points the review raised: I removed the stale AC-2173 aside from AC-1760, and STORY-85 now records that the capability-record issue was fixed.

**Left alone:**
- Five other test suites still import `invitePerson` from `people.ts` and can't load. The review listed them as belonging to other stories.
- I didn't add the optional deployment-contract AC for REQ-202, because the review called it a judgment call, not a failure.

The completion report is REPORT-11188, filed with `progress_made=true` and `needs_more_work=false`. It was created locally, but the sandbox blocked its attempt to reach `github.com:22`, so it may not have synced remotely. The file changes are uncommitted, so the workflow's next commit should pick them up.