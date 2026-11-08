---
uid: comment-22abbed0
id: COMMENT-8003
type: comment
title: Claude response for reconciliation_uat_generation report
created_by: xgd
created_at: '2026-11-08T15:33:56.266264+00:00'
updated_at: '2026-11-08T15:33:56.266264+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-49dcea5c
  kind: note
---

UATs generated for story STORY-159 (plan item 7 of 8)

Story: STORY-159
Test file(s) created:
  - `tests/test_reconciliation_capture_site_host_resolution.test.ts`

Tests written: 2
Tests passed: 2
Tests failed: 0

The other 15 ACs on this story already have UATs in `tests/test_reconciliation_capture_site_egress.test.ts` and `tests/test_reconciliation_capture_site_reference_material.workers.test.ts`, so I only wrote tests for the two ACs this bundle added. Both run `capture_site` through the composed Toolbox (L1 plus the fidelity surface), against a browser double that resolves only the hostnames it is given and records every navigation.

- **`test_UAT_AC2465_unresolved_host_is_navigated_once_and_one_guarded_alternate_is_tried`** covers:
  - `www.` to apex, keeping the path and query.
  - Apex to `www.`.
  - A timeout uses all 3 attempts and tries no other host.
  - The Node errors `ENOTFOUND` and `EAI_AGAIN` count as a host that does not resolve.
  - No alternate for an IPv4 or IPv6 address, or for `intranet`.
  - An alternate the egress rule refuses is never navigated.
- **`test_UAT_AC2466_alternate_host_carries_through_every_pass_and_no_such_host_is_actionable`** covers:
  - The returned URL, the capture record's URL and host, the bundle name, and the ladder, screenshot and hints passes all use the alternate. The typed host is navigated only once.
  - When no form resolves, the message names both forms tried and gives the spelling advice, with no raw browser code.
  - A host with no alternate names only the typed form.
  - When the alternate resolves but then times out, the error is "Capture failed for <alternate> after 3 attempt(s)".

`capture_site` refuses `127.0.0.1`, `[::1]`, `localhost` and `www.localhost` before any browser is leased, so it can never navigate them. For those cases (part of AC-2465 points 4 and 5) the test calls `runCapturePipeline`, the pipeline `capture_site` composes, which the AC allows. I tried `www.169.254.169.254` to cover the refused alternate through `capture_site` itself, but it is not a valid URL, so I dropped it.

There is no ESLint in the project and the sandbox blocked fetching it, so lint was not run. The type check reported no errors for the new file. No runtime code or existing tests were changed.

test_files_created:
  - "tests/test_reconciliation_capture_site_host_resolution.test.ts"