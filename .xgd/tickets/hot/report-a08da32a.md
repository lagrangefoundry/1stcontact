---
uid: report-a08da32a
id: REPORT-5541
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-29T11:13:55.908445+00:00'
updated_at: '2026-09-29T11:13:55.908445+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- **package.json** — config file (STEP 2g / enrichment rule). Both sides are
  scalar `version` edits. Enrichment rule for this file is "take the more
  recent commit by timestamp": OURS `52c9debcf2` (2026-09-29 04:07:00 -0700,
  "bump version: 0.2.66 was claimed by REQ-184 concurrently") is newer than
  THEIRS `fa0b857db7` (2026-09-04 17:18:51 -0700). Kept `0.2.67`. This also
  preserves the reason that commit exists: `0.2.66` was claimed concurrently
  by REQ-184, so taking the incoming `0.2.66` would reintroduce the exact
  duplicate-version collision HEAD's commit was made to resolve. Resolution
  is byte-identical to HEAD, so the file no longer appears in `git status`
  — no staged delta, which is expected and correct.

- **tests/test_UAT_FC_REQ-167_identity.workers.test.ts** — UAT test file
  (STEP 2c / 2f). Single conflicting hunk inside
  `test_UAT_FC_REQ-167_the_refusal_does_not_say_which_check_failed`. Took the
  INCOMING side (`UPDATE memberships SET revoked_at = ? WHERE user_id = ?`
  bound to `invited.user.id`) over HEAD's `UPDATE entitlements SET ends_at`.
  Incoming is authoritative per 2c, and the surrounding context — which had
  already auto-merged from the incoming commit — requires it: the comment
  block at :521-527 states the case is now driven by a withdrawn membership
  rather than a lapsed grant, and the assertion at :540 expects
  `reason: 'no_membership'`. Under DOC-42 §10.1 a lapsed grant now *admits*,
  so HEAD's statement could no longer produce the refusal the test asserts.
  The resolved statement is verbatim identical to the already-on-HEAD
  `test_UAT_FC_REQ-167_a_revoked_membership_refuses_whatever_the_grant_says`
  at :437. No test function was deleted on either side; no hunk was dropped.

## Schema adaptation (not a conflict, but required for correctness)

- **tests/test_UAT_FC_REQ-178_lapsed_session.workers.test.ts** — added
  wholesale by the cherry-pick (status `A`), so it applied verbatim with no
  three-way merge and therefore no conflict markers. `fa0b857db7` predates
  migration `0006_entitlement_subject.sql` (REQ-184, on HEAD as `273cf7da37`),
  which renamed `entitlements.account_id` -> `business_id` and added a NEW
  `entitlements.account_id` holding the grant's *subject*. The file's
  `lapse()` helper keyed `entitlements` on `account_id` while binding a
  `businessId`. Post-0006 that column still EXISTS, so the UPDATE raises no
  error — it simply matches zero rows, leaving every grant live while the
  file's cases assert lapsed-session behaviour. Re-keyed to `business_id`.
  This preserves the incoming test's intent rather than altering it.

## Incoming changes preserved

- **tests/test_UAT_FC_REQ-167_identity.workers.test.ts** — verified against
  `git show fa0b857db7 -- <file>`. All incoming additions for the conflicted
  test are present in the resolved file: `UPDATE memberships SET revoked_at`
  (:530), `const known = await worker.fetch` (:533), `reason: 'no_membership'`
  (:540), and the "DRIVEN WITH A WITHDRAWN MEMBERSHIP" rationale (:521).
  The incoming DOC-42 §10.1 grant-window rework is also present: the four
  grant-window UATs now observe `businesses.some((b) => b.selectable)`
  (:395, :413, :427) rather than the person's `ok`.

- **apps/control-app/src/{identity,index,router,scope}.ts** — applied cleanly,
  no conflicts. Confirmed the incoming §10.1 semantics landed:
  `scope.ts:241` ("NULL WHEN AN ADMITTED ACCOUNT HAS NOTHING SELECTABLE
  ([[DOC-42]] §10.1)") and `router.ts:521` ("AN ADMITTED ACCOUNT WITH NOTHING
  SELECTABLE STILL GETS ITS LIST"). The staged source diff touches no SQL and
  no column names, so these files needed no schema adaptation.

- **tests/test_UAT_FC_REQ-178_businesses.workers.test.ts** — applied cleanly,
  no conflicts; already consistent with the post-0006 column names.

No hunks were dropped under the BUG-1301 precedence exception; it did not
apply to this cherry-pick.

## Verification not possible in this environment

Static verification only: `npx tsc --noEmit -p apps/control-app/tsconfig.json`
passes clean. The workers tests could NOT be executed here — miniflare needs
to bind `127.0.0.1` and write to `~/Library/Preferences/.wrangler`, both
blocked by the session sandbox (`EPERM` on `listen` and on the log file).
The resolution is verified by typecheck plus exact-pattern match against the
existing on-HEAD revoked-membership UAT, not by a green test run.

## Pre-existing issue observed (out of scope, not introduced here)

`tests/reconciliation-identity-invite-and-admission.workers.test.ts` carries
~13 of the same stale `entitlements ... WHERE account_id` references. The 0006
commit `273cf7da37` updated 10 test files but missed this one, so it is stale
on HEAD independently of this cherry-pick, with the same silent zero-row
failure mode. Left untouched — it is outside this conflict — but worth a
follow-up.
