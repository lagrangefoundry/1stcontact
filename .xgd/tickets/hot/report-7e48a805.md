---
uid: report-7e48a805
id: REPORT-11111
type: report
title: Claude batch_fix_assessment report
created_by: xgd
created_at: '2026-11-07T07:56:23.298594+00:00'
updated_at: '2026-11-07T07:56:23.298594+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: batch_fix_assessment
  subject_uid: story-7b1025b8
  parent_report_uid: report-72de7cec
  batch_index: '0'
---

I fixed the invite selection bug in `people.js` and moved the stale UATs onto the add + invite-by-id surface. The full batch scope passes: 12 files, 123 tests.

**The one production change** (`apps/control-app/src/builder/people.js`, the only file the exception allowed)
- The Send handler now clears the selection only when at least one result is `sent`. A send where every result is `refused` or `failed` leaves every row ticked and Invite enabled, as REQ-199 and AC-2339 require.
- The clear now runs before `refresh()`, not after. Rows are drawn from the selection during refresh, so clearing afterwards left boxes showing ticked while the selection was empty.
- The modal still stays open over the per-contact report. The planner asked me to keep a "close-on-all-sent (BUG-318)" behaviour, but the handler has no such code and nothing references BUG-318, so there was nothing to keep.

**Tests**
- **AC2339 tab UAT:** a mixed send must now also clear every tick and disable Invite. Before, a fix that never cleared would have passed.
- **AC2175:** I deleted `tests/reconciliation-identity-invite-control.test.ts`. It held only that UAT, its AC is superseded, and AC2336 covers the Add dialog.
- **New fixture `tests/support/add-and-invite.ts`:** it calls `addContact`, then `invitePeople` by id with a recording mail port, and throws unless exactly one message went to the added address.
- **Duplicates deleted from the old files**, because `test_reconciliation_contacts_add_invite.workers.test.ts` already proves them: AC2253, AC2169, AC2171 (two copies), AC1743, AC1744 (two copies), AC2172 and AC2248.
- **Moved onto the new surface:**
  - AC2170, AC2176 and AC2257 (runtime) go through the add route, then the invite route with `{ids}`.
  - AC2254, AC2257 (source scan), AC1742, AC2115, AC2255 and AC2256 use the new fixture.
  - AC2247 and the other person/address UATs now create contacts through the add route.
- **AC2173:** now asserts the REQ-203 behaviour. The add and invite write no membership or grant; the invitee (terms not accepted, account owns no business) is admitted with an empty business set; provisioning lists exactly that business; a withdrawn membership is then refused with `no_membership`, and that reason is logged.
- **AC2176:** now also asserts that accepting the terms did not provision a second business.
- **AC1745:** the "add and invite need no platform tenant" half now uses the fixture with `TENANT_ID: ''`.
- **AC1759:** the `no_membership` case now uses an account that owns a business but whose membership was withdrawn. Under REQ-203, a fresh invitee is admitted, not refused. The structured log shape after BUG-62 (`{event, reason, email}`) already matched what the test asserts.

**Checks**
- **Typecheck:** the control-app build check (`tsc --noEmit`) passes. Test files aren't covered by any tsconfig.
- **Lint:** I couldn't run ESLint. It isn't installed here, and the sandbox blocked downloading it from npm.
- **Other suites:** five tests in other stories' files that mount `people.js` fail: AC2210, AC2230, AC2231, AC2232 and AC2186. They fail the same way with `people.js` reverted to HEAD, so they predate this change. I didn't touch them.
- **Tickets:** I edited no ACs or stories. The story still lists the selection-clearing CODE-ISSUE as open, although the code now does what AC-2339 says.

```yaml
## Assessment
blocked_by: null
```