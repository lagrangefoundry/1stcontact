---
uid: report-93abec86
id: REPORT-11632
type: report
title: Claude reconciliation_uat_generation report
created_by: xgd
created_at: '2026-11-09T00:38:39.909441+00:00'
updated_at: '2026-11-09T00:38:39.909441+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_uat_generation
  subject_uid: story-f2e5032c
---

UATs generated for story story-f2e5032c (plan item 7 of 8)

Story: story-f2e5032c (STORY-177)
Test file(s) created:
  - `tests/test_reconciliation_public_lead_capture.workers.test.ts` (workerd: AC-2500 to AC-2513, AC-2516)
  - `tests/test_reconciliation_public_form_surface.test.ts` (node: AC-2514, AC-2515)

Tests written: 17 (one per AC)
Tests passed: 16
Tests failed: 1

⚠️ TESTS FAILING — downstream fix-it loop required

Failures:
  - `test_UAT_AC2503_a_no_javascript_form_post_is_captured_identically_and_gets_an_html_page`: **the code doesn't do what the AC says; the test is correct.** AC-2503 says a `multipart/form-data` submission is captured the same way a JSON one is. The endpoint accepts that content type (`shapeOf` in `apps/public-site/src/lead.ts:216`). But `readFields` (`lead.ts:281`) parses every form-shaped body with `URLSearchParams`, so a multipart body yields no usable fields. The Turnstile token isn't found and the submission is refused with `400`. A URL-encoded submission in the same test passes every assertion. The fix belongs in runtime code: parse multipart with `request.formData()` or equivalent.

How the tests are built:
- **Endpoint tests:** they go through `public-site`'s real `worker.fetch`, against real D1 and R2 inside workerd.
- **Write path:** the binding calls the real `captureLead` with a recording mailer, so message counts come from the stored message record.
- **Doubles:** only Cloudflare siteverify (a stubbed global `fetch`) and the rate limiter.
- **Suppression (AC-2512):** bounces and complaints are recorded through the real signed email-delivery webhook handler.
- **Seam probe (AC-2513):** it POSTs lead-shaped bodies to the control app's HTTP surface, both with Access configured and in dev-open mode. It then checks that no contact row exists.

Not done:
- **Lint:** ESLint isn't installed in the repo, and fetching it was blocked by the sandbox's network allowlist.
- **Type check:** the `tsconfig` projects don't cover `tests/`, so no type check ran on these files.
- **Fixture helper:** I added a local helper in the workerd file for forms that declare only half an asset, because `tests/support/lead-site.ts` can't express that and I didn't modify existing test files.
- **FC tests:** the existing `test_UAT_FC_REQ-223_*` files are untouched. Renaming or deleting them is the review step's job.

test_files_created:
  - "tests/test_reconciliation_public_lead_capture.workers.test.ts"
  - "tests/test_reconciliation_public_form_surface.test.ts"