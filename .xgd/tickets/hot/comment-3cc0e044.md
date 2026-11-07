---
uid: comment-3cc0e044
id: COMMENT-7918
type: comment
title: Claude response for fix_plan report
created_by: xgd
created_at: '2026-11-07T07:44:48.697614+00:00'
updated_at: '2026-11-07T07:44:48.697614+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-72de7cec
  kind: note
---

I filed the iteration-7 fix plan as **REPORT-11109** (report-72de7cec). It's a single batch, and I edited two ACs.

**Why the 34 tests fail:** iteration 6 ended 35/35 green. These failures come from commits the bundle brought in afterwards (REQ-199, REQ-202, REQ-203, BUG-62), so this is a new cause, not the earlier one coming back.
- **Invite route changed:** `POST /api/people/invite` now takes `{ids}` of existing contacts and returns 400 "Nobody was selected" when given an address. Adding someone by address is now a separate route, `POST /api/people/add`.
- **Function moved:** `invitePerson` is no longer in `people.ts`; the old tests import it from there and get `undefined`. It now lives in `invites.ts` with an injected mail port.
- **Admission rule changed:** under REQ-203, an invitee who hasn't signed up and whose account owns no business is now admitted with an empty business set, instead of refused as `no_membership`.
- **Most stale tests:** three older `.workers.test.ts` files and the AC2175 invite-control test still use the removed surface. AC-2175 had already been marked superseded earlier in this run.
- **One real code bug (AC2339):** `apps/control-app/src/builder/people.js` (lines 1576–1580 at the pinned reference) clears the selection after every send. REQ-199 says "the selection survives a send in which nothing was sent", and the code's own comment says the same.

**AC changes I made:**
- **AC-2173:** an invitee holding nothing is now admitted with nothing rather than refused, per REQ-203. A withdrawn membership is still refused `no_membership`.
- **AC-2176:** the sequence is now add, invite by id, provision, sign in.

The other affected ACs were already rewritten earlier in this run (07:21Z).

**The batch:**
- **Code-freeze exception:** it grants one exception to the reconcile code freeze, for `people.js` only, so the selection is cleared only when something was actually sent. The six people-panel suites that use that send path are added as tests that must also pass.
- **Test realignment:** the builder moves the old tests onto add plus invite-by-ids. It reuses the patterns in `tests/test_reconciliation_contacts_add_invite.workers.test.ts`, which already passes on the new routes.
- **Duplicates and the 10 orphan ACs:** old tests for ACs that file already covers can be deleted. The 10 orphan ACs have no other test yet, so their tests must be moved over and pass.
- **AC2175:** its test is deleted.

I couldn't run the `.workers.test.ts` suites here because the sandbox blocks local port binding. Their diagnosis comes from the quality report's 400 message and from reading the reference code. I did run the two non-worker tests (AC2175 and AC2339) locally, and both fail as described.