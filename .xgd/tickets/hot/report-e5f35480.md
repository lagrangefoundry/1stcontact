---
uid: report-e5f35480
id: REPORT-7727
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-36'
created_by: xgd
created_at: '2026-11-01T15:37:53.028241+00:00'
updated_at: '2026-11-01T15:37:53.028241+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-36
---

## Files resolved

Incoming commit: 9d4fe1170518a07026a0cab627035805e4999567 (Merge branch 'free-REQ-184' into xgd-working, 2026-09-04). After resolution the staged diff vs HEAD is EMPTY — HEAD already carries this commit's effect via later commits (BUG-1109/BUG-1122 shape); finalize step should detect the clean diff and skip.

- package.json — config scalar (2g). Incoming bumped 0.2.65 -> 0.2.66; HEAD is already at 0.2.69 via later bumps. Kept 0.2.69 (taking incoming would regress the version; incoming intent "bump version" is already satisfied). FLAG for post-merge review per enrichment rule.
- tests/support/local-d1.ts — code (2c), non-overlapping. Incoming's accountId->businessId rename of seedIdentity is already present in HEAD; HEAD additionally adds localD1() helper (incoming side of the hunk was empty). Combined = HEAD content. FLAG for post-merge review.
- tests/test_UAT_FC_REQ-167_identity.workers.test.ts — UAT test (2f), same hunk modified differently. Kept HEAD (see Arbitration). FLAG for post-merge review.
- tests/test_UAT_FC_REQ-180_business_vocabulary.test.ts — UAT test (2f), non-overlapping. Incoming's REQ-184 narrowing (RENAME COLUMN tenant_id / ALTER TABLE tenants RENAME assertions + comment) already in HEAD; HEAD adds REQ-180 A3 describe block (two tests). Kept both -> HEAD content. No test function deleted.
- tests/test_UAT_FC_REQ-184_entitlement_subject.workers.test.ts — AA (2b), one overlapping hunk. Kept HEAD (see Arbitration). No test function deleted.

## Incoming changes preserved

- package.json: version bump superseded by later bumps (0.2.69 > 0.2.66).
- local-d1.ts: businessId rename + REQ-184 comment present in resolved file.
- REQ-167: every account_id->business_id rename from the incoming diff is present in the resolved file. The one exception is the request-path oracle test hunk (UPDATE entitlements SET ends_at ... WHERE business_id), whose target was replaced on HEAD by a membership-withdrawal setup — see Arbitration.
- REQ-180: incoming narrowing comment and both new assertions present.
- REQ-184: all of the file except the one admission hunk matches; see Arbitration.

## Arbitration of last resort (BUG-1460)

- tests/test_UAT_FC_REQ-167_identity.workers.test.ts (test_UAT_FC_REQ-167_the_refusal_does_not_say_which_check_failed) — Tier 1. Incoming drives the oracle case with an expired grant; HEAD drives it with a revoked membership. HEAD's version is from later commits (Merge free-REQ-178 / REQ-184 follow-up) implementing DOC-42 §10.1 (membership admits; a lapsed grant closes the business rather than refusing). The surrounding merged comment ("DRIVEN WITH A WITHDRAWN MEMBERSHIP RATHER THAN A LAPSED GRANT") and the assertion reason 'no_membership' are both HEAD-side and contradict the incoming setup; taking incoming would make the test fail against current admission semantics. Dropped incoming hunk.
- tests/test_UAT_FC_REQ-184_entitlement_subject.workers.test.ts (account-grant case) — Tier 1. HEAD side is a later FREE-CODED commit "test(identity): REQ-184's account-grant case observes the business, not the door" that explicitly supersedes the incoming expectation (admission.ok false / reason no_entitlement) with admitted + business not selectable + lapse never_granted, consistent with DOC-42 §10.1 and REQ-178. Both sides free_coded; later working-timeline position (HEAD) wins. Dropped incoming hunk.
