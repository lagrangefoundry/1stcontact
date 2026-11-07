---
uid: report-5f8ee531
id: REPORT-11120
type: report
title: Claude reconciliation_uat_generation report
created_by: xgd
created_at: '2026-11-07T08:30:04.345045+00:00'
updated_at: '2026-11-07T08:30:04.345045+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_uat_generation
  subject_uid: story-e0ca0a36
---

I wrote one UAT per AC, 13 in total. 5 pass and 8 fail, all for the same reason: the database schema has fallen behind the sign-in component, not a problem in the tests.

```
⚠️ TESTS FAILING — downstream fix-it loop required

UATs generated for story story-e0ca0a36 (plan item 6 of 7)

Story: story-e0ca0a36
Test file(s) created:
  - tests/test_reconciliation_passwordless_sign_in.workers.test.ts

Tests written: 13
Tests passed: 5
Tests failed: 8

Failures (all the same cause: POST /sign-in/<token> returns 503 instead of 303,
"D1_ERROR: table sessions has no column named issued_at"):
  - test_UAT_AC2347_opening_a_link_shows_a_continue_page_and_leaves_it_unused
  - test_UAT_AC2348_pressing_continue_signs_in_with_a_cookie_the_builder_and_apex_read
  - test_UAT_AC2349_expired_used_and_unknown_links_get_one_identical_page_offering_a_fresh_link
  - test_UAT_AC2350_a_cross_site_post_is_refused_and_the_link_stays_usable
  - test_UAT_AC2351_signing_out_ends_the_session_clears_the_cookie_and_succeeds_unsigned
  - test_UAT_AC2352_the_builder_admits_on_a_session_or_access_and_a_dead_session_falls_through
  - test_UAT_AC2354_withdrawing_a_login_ends_every_session_and_stops_further_links
  - test_UAT_AC2353_an_invites_call_to_action_is_a_redeemable_link_that_needs_no_access

Passing: AC2343, AC2344, AC2345, AC2346, AC2355

test_files_created:
  - "tests/test_reconciliation_passwordless_sign_in.workers.test.ts"
```

**Why they fail:** the shared `auth-passwordless` component installed in the shared store now writes two columns, `sessions.issued_at` and `sessions.origin_id`. `db/migrations/0001_baseline.sql` doesn't have them, so every attempt to create a session fails. It's not specific to these tests:
- `test_UAT_FC_REQ-202_passwordless_wiring` fails too: "migration is missing: CREATE TABLE IF NOT EXISTS sessions …".
- 4 tests in the existing REQ-202 FC suites (the sign-in tests and the component conformance test) fail with the same D1 error.

The fix is to bring the migration back in line with the component's `SCHEMA_STATEMENTS`, which is runtime/schema work I'm not allowed to do here. As a temporary diagnostic, I added the two columns in the test setup, and all 13 tests passed. I then removed that change, so the file as committed has no schema patch.

**How the tests are built:**
- Every test goes through `worker.fetch` against real D1. Each link is read back out of the message recorded in the contact's history, not from a spy.
- "Admitted as X" is checked on `GET /api/businesses`, which names the admitted person's email. Cloudflare Access is configured and `fetch` is not stubbed, so a session-only admission can't actually be an Access admission.
- The clock is moved forward by faking `Date` (already shown working in the passing rate-cap test).
- Withdrawal goes through the real `/api/people/status` route as an owner of the platform business.

**Gaps:**
- AC2346's clause "a request with no host sends nothing" isn't tested, because a `Request` can't be built without a host.
- ESLint didn't run: it isn't installed locally and the npm registry is blocked by the sandbox. The file follows the patterns of the existing worker test files.