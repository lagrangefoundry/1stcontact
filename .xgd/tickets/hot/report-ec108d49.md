---
uid: report-ec108d49
id: REPORT-7837
type: report
title: Claude reconciliation_uat_generation report
created_by: xgd
created_at: '2026-11-01T20:23:33.700407+00:00'
updated_at: '2026-11-01T20:23:33.700407+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_uat_generation
  subject_uid: story-83ff6262
---

UATs generated for story story-83ff6262 (plan item 6 of 8)

All 15 pass, one per acceptance criterion, and no runtime code was changed. I couldn't run lint: eslint isn't installed in this worktree, and the sandbox blocks npm from fetching it.

Story: story-83ff6262
Test file(s) created:
  - `tests/test_reconciliation_customer_portal.test.ts` (12 UATs: AC2213, AC2214, AC2215, AC2216, AC2218, AC2220, AC2221, AC2222, AC2223, AC2224, AC2225, AC2226)
    - These request the page over real HTTP from the builder's local server, backed by a temporary site store on disk.
    - The served page is loaded into a simulated DOM (JSDOM) and run by the portal's own browser script.
    - The only mock is the reply from the account endpoint (`/api/businesses`), so each account shape the ACs name can be served.
  - `tests/test_reconciliation_customer_portal.workers.test.ts` (3 UATs: AC2212, AC2217, AC2219)
    - These call the deployed Worker entry point with a real signed Access token, against real D1 and R2.
    - The only stub is Cloudflare's Access key endpoint.

Tests written: 15
Tests passed: 15
Tests failed: 0

Things to know about how some ACs are tested:
- **AC2219 (nothing is deleted):** my first run failed, and the test was at fault, not the code. Every signed-in request updates the user row's `first_seen_at`, `last_seen_at` and `updated_at`, whatever the page. The test now ignores those three fields. It still checks that the rest of the user row, memberships, entitlements and businesses are unchanged, and that no table gained a row.
- **AC2219 (only GETs are sent):** the workers runtime has no DOM, so this test doesn't press the buttons. Instead it checks that:
  - the page has no form and both buttons are plain `type="button"`;
  - the served script's only request method is GET;
  - every request the page would make (the page, its two assets, the account endpoint) is a GET that succeeds.
  The actual clicking of Delete account and Close is covered in the node file under AC2218.
- **AC2216 (404 with neither identity nor scope):** this calls the control-app's route table, `route()`, directly with no scope, the same entry point the local Node server uses. The Worker can't reach that state, because without an identity it falls back to its configured business.
- **AC2215 (HEAD has no body):** this is checked over HTTP, where the server drops the body. The route table itself returns the body on HEAD and leaves it to the HTTP layer to drop.

test_files_created:
  - "tests/test_reconciliation_customer_portal.test.ts"
  - "tests/test_reconciliation_customer_portal.workers.test.ts"
