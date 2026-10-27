---
uid: report-b9baaed2
id: REPORT-6804
type: report
title: Claude reconciliation_uat_generation report
created_by: xgd
created_at: '2026-10-27T21:30:55.169778+00:00'
updated_at: '2026-10-27T21:30:55.169778+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_uat_generation
  subject_uid: story-31204812
---

I wrote 10 UATs for story-31204812, one per acceptance criterion: 4 pass and 6 fail. In each failing case the AC asks for something the landed code doesn't do, so I left the assertions at the AC's strength. Two of the failures go beyond the story's known code issues: Node redirect hops reach the network unchecked, and `list_references` / `describe_reference` break on a bundle with no capture record.

```
UATs generated for story story-31204812 (plan item 6 of 9)

Story: story-31204812
Test file(s) created:
  - tests/test_reconciliation_capture_site_egress.test.ts

Tests written: 10
Tests passed: 4
Tests failed: 6

⚠️ TESTS FAILING — downstream fix-it loop required

Failures:
  - test_UAT_AC2045_list_references_reports_recorded_url_and_capture_time: a bundle with no capture record makes list_references fail ("Bundle 'gamma/orphan' has no capture.json") instead of listing it with url/capturedAt null.
  - test_UAT_AC2046_describe_reference_reports_widths_images_findings_and_refuses_unknown: an unknown name gives "Bundle '…' has no capture.json", not the not-found message that points at list_references.
  - test_UAT_AC2047_capture_site_preflight_refuses_unsafe_addresses_without_leasing: refusals for file:, data:, javascript: and credentialed URLs don't name the address.
  - test_UAT_AC2048_every_request_is_guarded_refused_ones_never_sent_and_reported: on Node, a redirect hop to http://10.0.0.1/ is sent to the network and never reported.
  - test_UAT_AC2049_redirect_cap_counts_hops_not_subresource_origins: a redirect loop returns a usable reference instead of REFUSED; a page loading from 8 CDN origins trips redirect-cap and cdn5–8 are never fetched (story code issues 1 and 4).
  - test_UAT_AC2050_byte_and_time_budgets_abandon_the_capture_in_both_hosts: a capture over 32 MiB still returns a reference in both hosts, and Node keeps fetching after the cap; no 60 s limit is applied in either host (story code issues 2–4).

test_files_created:
  - "tests/test_reconciliation_capture_site_egress.test.ts"
```

**The Node redirect gap is a real SSRF hole that the story doesn't list.** Playwright's own documentation says a `page.route` handler "will only be called for the first url if the response is a redirect". So the Node driver's guard never sees redirect hops: a public URL that redirects to private space gets fetched. The Worker driver checks every hop correctly, and its side of AC-2048 passes. This needs a code fix (for example, checking hops in the response handler, or not following redirects automatically), not a test change.

**How the tests are built:**
- Everything runs through the composed Toolbox, which is what produces the audit record and the untrusted marking.
- Each host uses its production driver, wired the way `apps/control-app/src/shot.ts` and `tools/generate/src/cli/ai/host.ts` wire it. Only the browser and a scripted network are doubled. For Node that means a mocked `playwright` module.
- Each browser double copies its engine's real interception behaviour: puppeteer checks every redirect hop, Playwright only the first request.
- The 60-second test uses fake timers, so the whole file runs in under a second.

**Judgement calls you may want to check:**
- **AC-2048:** a capture loads the page many times (once per viewport width), so the same blocked image is refused once per load. I asserted that the set of distinct refused URLs is exactly the metadata URL, rather than "exactly one entry".
- **AC-2046:** the code returns `unreferenced` as a list of paths, while the AC calls it a count. I accept either form, given the reconciliation decision to formalise the fields the code returns.
- **AC-2047:** I counted the host name as naming the address. That's why the private and local-name cases pass and only the scheme and credential cases fail.

**Checks:**
- The new file typechecks with tsc against `tsconfig.base.json`.
- The existing REQ-157 suite still passes (27/27).
- I couldn't run lint: ESLint isn't installed here, and the sandbox blocks downloading it from the npm registry.
- No runtime code or existing tests were changed. I deleted my temporary probe test and tsconfig.
