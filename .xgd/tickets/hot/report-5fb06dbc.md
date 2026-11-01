---
uid: report-5fb06dbc
id: REPORT-7697
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-36'
created_by: xgd
created_at: '2026-11-01T15:16:23.492446+00:00'
updated_at: '2026-11-01T15:16:23.492446+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-36
---

## Files resolved

All six resolved to HEAD (ours) and staged. The staged diff against HEAD is empty, so the commit is redundant; leaving it to finalize to skip.

- apps/control-app/src/builder/config.js — UU code (2c): HEAD kept (adds BUSINESS_NONE_SELECTABLE_MESSAGE from REQ-179 reopen; incoming lacks it)
- apps/control-app/src/identity.ts — UU code (2c): HEAD kept (`business_id` + `account_id IS NULL` per REQ-184; incoming used pre-rename `account_id`)
- apps/control-app/src/router.ts — UU code (2c): HEAD kept (NoBusinessError import still used at lines 871/930/1644; null-safe `scope ?`; extended DOC-42 §7 comment)
- tests/test_UAT_FC_REQ-180_admin_adds_a_business.workers.test.ts — AA (2b/2f): HEAD kept (`business_id` column names)
- tests/test_UAT_FC_REQ-180_business_vocabulary.test.ts — AA (2b/2f): HEAD kept, a superset (REQ-184-narrowed tenant_id guard + REQ-180 A3 test functions; no test function lost from either side)
- tests/test_UAT_FC_REQ-180_lapse_reason.workers.test.ts — AA (2b/2f): HEAD kept (`business_id` column names)

## Incoming changes preserved

Incoming 6b081dc405 (Merge free-REQ-180, 2026-09-03 17:22) is ALREADY INTEGRATED in HEAD as 45aa623a6c. The two merges have the same `git patch-id --stable` over apps/ and tests/ (8e9dd732…). The commit is redundant (BUG-1109/BUG-1122 shape), not discarded. Every conflicting hunk is a spot where a LATER HEAD commit changed the code that 45aa623a6c had already brought in:
- f97867a847 Merge free-REQ-184 (2026-09-04 17:12) — migration 0006_entitlement_subject.sql renames memberships.account_id and entitlements.account_id to business_id. Restoring incoming's `account_id` would query columns that no longer exist.
- aa4b3332c6 Merge free-REQ-180 follow-up (2026-09-04 17:13) — narrowed vocabulary guard, A3 tests.
- c6a3db1a65 Merge free-REQ-178 (2026-09-04 17:24) and the REQ-179 merge — router/config changes.
All non-conflicting parts of the incoming commit (boot-guard.ts, business.js, builder.css, knowledge.ts, account_surface test, REQ-179 endpoint test) staged with no diff against HEAD, so they are already present.

## Arbitration of last resort (BUG-1460)

Tier 1 (most-recent intent): for every conflicted file, the incoming side was dropped in favour of HEAD. Evidence: the incoming patch is the same as HEAD's 45aa623a6c, and REQ-184 / the REQ-180 follow-up / REQ-178 / REQ-179 later superseded the incoming lines (dates above). This matches the enrichment rule "take the more recent commit by timestamp". Flag for post-merge review: none needed beyond the normal review, since the result equals HEAD.
