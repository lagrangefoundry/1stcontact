---
uid: comment-a55ec989
id: COMMENT-6236
type: comment
title: Claude response for fix_plan report
created_by: xgd
created_at: '2026-11-01T19:47:45.152947+00:00'
updated_at: '2026-11-01T19:47:45.152947+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-7c2db52c
  kind: note
---

I filed the iteration 2 fix plan as **REPORT-7825 (report-7c2db52c)**. It grants a `code_frozen` override, because the tests are right and the router is wrong.

**Diagnosis.** I checked the builder's blocked report (report-839b67f9) against the pinned reference `reconcile-src-BUNDLE-36`, and both causes are real. Both are in `apps/control-app/src/router.ts`:
- **AC2198 and AC2199 get 500 instead of 400.** `people.ts` already throws `InvalidGrantError` with the messages the tests expect (lines 1107–1108 and 1175). The router's error mapper (lines 8079–8093) has no case for that error, so it falls through to the generic 500.
- **AC2200 gets 200 instead of 403 for a non-owner.** The handlers for `POST /api/grants`, `POST /api/grants/revoke` (lines 5414–5450) and `POST /api/people/status` (lines 5067–5073) never check who owns the business. The record, invite and delegate routes in the same file do.

Iteration 1 was a mechanical plan with no instructions, so this is not a repeated hypothesis. The failures happen in isolation too, so another test interfering is ruled out.

**Ruling.** The ladder decides at rung 1. REQ-170 is in this bundle and says "The gate that matters is at the API", with condition 1 "you are an owner of this business", and that "a grant that names no business is refused". The reference has neither behaviour, but rung 1 outranks it, so the tests stand.

**The batch (one batch):**
- **Override scope:** `code_frozen`, for `router.ts` only, marked as trust-boundary code.
- **Builder instructions:**
  - Map `InvalidGrantError` to 400 next to the existing `InvalidPersonRecordError` mapping.
  - Gate the three routes on `ownsBusiness` before the request body is read, returning 403.
  - Leave `people.ts` unchanged.
- **Tests that must also stay green:** the other contacts-tab editing ACs (AC2190–AC2197, AC2201), AC2178, AC2181 and AC2185, and the REQ-170 and REQ-189 UAT suites. If one of those fixtures calls these routes without owning the business, the builder should give it an owner membership rather than loosen the gate.

**Weak-evidence flag.** `test_UAT_FC_REQ-170_a_grant_that_names_no_business_is_refused` probably only checks that the function throws, which is why it passed while the route answered 500.

No AC or story edits. After the report was created, the sandbox denied an outbound connection to `github.com:22` (probably xgd syncing). The report exists locally, but it may not have synced.
