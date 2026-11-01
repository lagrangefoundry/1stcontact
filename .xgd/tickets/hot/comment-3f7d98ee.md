---
uid: comment-3f7d98ee
id: COMMENT-6235
type: comment
title: Claude response for fix_plan report
created_by: xgd
created_at: '2026-11-01T18:45:47.647381+00:00'
updated_at: '2026-11-01T18:45:47.647381+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-1c22d467
  kind: note
---

I filed the iteration 3 fix plan as **REPORT-7804 (report-1c22d467)**. It has one batch, changes tests only, and was decided at rung 1. After it was created, xgd tried to reach `github.com:22` (probably a sync push), and the sandbox blocked it. The report exists locally but may not have synced yet.

**Root cause: this is not the problem the last two iterations fixed.** Those iterations dealt with renaming `accountId` to `businessId`, and the builder fixed that: all 36 tests passed. After that, the REQ-186 commit was cherry-picked onto the branch, and it deleted `provisionInvite` from `apps/control-app/src/identity.ts`. All 32 failures are `TypeError: provisionInvite is not a function`, coming from three older test files that still import it:
- `tests/reconciliation-identity-invite-and-admission.workers.test.ts`
- `tests/reconciliation-identity-multi-business-admission.workers.test.ts`
- `tests/reconciliation-identity-business-lapse.workers.test.ts`

**The ladder:**
- **Rung 1 decides it.** REQ-186 replaces the one-call invite with `invitePerson`, which writes only the person, followed by a separate `provisionBusiness`. The story's ACs were already updated before this quality run: AC-1740, AC-2078 and AC-2079 are superseded, and AC-1742, AC-1743, AC-1745, AC-2115 and AC-2173 are reworded. Only the tests were left behind.
- **Rung 2 agrees.** At `reconcile-src-BUNDLE-36`, `identity.ts` mentions `provisionInvite` only in a comment (line 34) and no longer exports it.
- **No production change, override or blocked_by ruling is needed.**

**What the batch tells the builder:**
- **Superseded ACs:** delete the tests for AC-1740 (both copies), AC-2078 and AC-2079.
- **Duplicates:** a newer file, `tests/reconciliation-identity-invite-provision-admission.workers.test.ts`, already uses the `inviteAccount` test helper and covers every active AC the three old files cover. Several old tests have exactly the same name as tests in the newer file, so in the report the failing old copies can't be told apart from the passing new ones. The builder should remove each duplicate after checking the new test asserts at least as much.
- **Unique assertions:** anything only an old test checks, and the current AC still requires, moves into the newer file, written on `inviteAccount` or on `invitePerson` + `provisionBusiness`.
- **Files:** delete any of the three files left with nothing unique.
- **Blast radius:** the batch also runs the tests for AC1746, AC1747, AC1755, AC1757 and AC2169–2176 so they stay green.

**Outside this story:** three more test files still call `provisionInvite`:
- `reconciliation-terms-of-service-gate.workers.test.ts`
- `test_reconciliation_business_fulfilment.workers.test.ts`
- `reconciliation-builder-businesses-endpoint.workers.test.ts`

They will fail the same way when their own stories run quality checks, and the same switch to `inviteAccount` applies. I recorded this in the plan but did not add them to the batch.
