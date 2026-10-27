---
uid: report-ecdedc3f
id: REPORT-6809
type: report
title: 'Report: blocked_by_handoff for story-31204812'
created_by: xgd
created_at: '2026-10-27T21:41:37.088003+00:00'
updated_at: '2026-10-27T23:53:42.922952+00:00'
completed_at: null
last_field_updated: ruling
fields:
  report_kind: blocked_by_handoff
  subject_uid: story-31204812
  rule: code_frozen
  evidence: 'Ran `npx vitest run --config vitest.node.config.mts tests/test_reconciliation_capture_site_egress.test.ts`:
    6 failed / 4 passed. Read tools/generate/src/cli/ai/fidelity-core.ts:245-380 and
    tools/generate/src/cli/capture/bundle.ts:95-99. readCapture throws `Bundle ''<name>''
    has no capture.json.` on a missing record, so the null fallback in list_references
    and PictureNotFoundError (NOT_FOUND) in captureOf can never run (AC2045, AC2046).
    The Playwright double follows Playwright''s documented rule that route() is not
    called for redirect hops; the Node driver therefore forwards a redirect to http://10.0.0.1/
    unguarded (AC2048 node). AC2049/AC2050 failures are exactly story code issues
    1-4: origin-count redirect cap trips on 8 CDN origins, the Node driver records
    no response bytes, the 60 s cap is never applied, and capture_site returns a bundle
    when guard.tripped. The ACs were written as intent the code contradicts; satisfying
    them in tests alone would mean weakening assertions around an SSRF boundary.'
  proposed_change: '(1) tools/generate/src/cli/capture/bundle.ts: add a tolerant `readCaptureOrNull`
    (readJson without throw); use it in fidelity-core.ts list_references and captureOf
    so the null and NOT_FOUND paths run. (2) tools/generate/src/cli/capture/egress
    guard module: count redirect hops per navigation (document redirect chain only,
    not subresource origins), and refuse with reason `redirect-cap` beyond 5 hops.
    (3) tools/generate/src/cli/capture/playwright-driver.ts (guardedPlaywrightDriver):
    guard redirect hops (on ''response'' with a 3xx Location, check the target against
    the guard and abort navigation / route redirects manually, e.g. by fulfilling
    the 3xx and re-requesting through the route), and record response bytes against
    the guard as cf-driver does; stop forwarding once the guard trips. (4) fidelity-core.ts
    capture_site: wrap cmdCapturePage in a 60 s deadline (AbortSignal/Promise.race
    that closes the driver) and fail naming the limit; after capture, if guard.tripped
    (response-cap or redirect-cap) throw `REFUSED: …` and delete/not register the
    bundle so list_references stays unchanged. (5) Test-only, within the same pass:
    tests/test_reconciliation_capture_site_egress.test.ts AC2047 `namesAddress` check
    accepts the refused scheme or credential reason instead of the literal URL for
    scheme/credential refusals (code deliberately does not echo credentialed URLs),
    and update AC acceptance_criterion-7db0225c wording to match.'
  batch_index: 0
  parent_report_uid: report-e63d5b68
  anchor_ticket: bundle-5607a08d
  ruling: denied
  ruling_reason: the planner terminal-failed the plan (needs_review)
---

# Builder blocked by `code_frozen`

**Evidence**: Ran `npx vitest run --config vitest.node.config.mts tests/test_reconciliation_capture_site_egress.test.ts`: 6 failed / 4 passed. Read tools/generate/src/cli/ai/fidelity-core.ts:245-380 and tools/generate/src/cli/capture/bundle.ts:95-99. readCapture throws `Bundle '<name>' has no capture.json.` on a missing record, so the null fallback in list_references and PictureNotFoundError (NOT_FOUND) in captureOf can never run (AC2045, AC2046). The Playwright double follows Playwright's documented rule that route() is not called for redirect hops; the Node driver therefore forwards a redirect to http://10.0.0.1/ unguarded (AC2048 node). AC2049/AC2050 failures are exactly story code issues 1-4: origin-count redirect cap trips on 8 CDN origins, the Node driver records no response bytes, the 60 s cap is never applied, and capture_site returns a bundle when guard.tripped. The ACs were written as intent the code contradicts; satisfying them in tests alone would mean weakening assertions around an SSRF boundary.

**Proposed change**: (1) tools/generate/src/cli/capture/bundle.ts: add a tolerant `readCaptureOrNull` (readJson without throw); use it in fidelity-core.ts list_references and captureOf so the null and NOT_FOUND paths run. (2) tools/generate/src/cli/capture/egress guard module: count redirect hops per navigation (document redirect chain only, not subresource origins), and refuse with reason `redirect-cap` beyond 5 hops. (3) tools/generate/src/cli/capture/playwright-driver.ts (guardedPlaywrightDriver): guard redirect hops (on 'response' with a 3xx Location, check the target against the guard and abort navigation / route redirects manually, e.g. by fulfilling the 3xx and re-requesting through the route), and record response bytes against the guard as cf-driver does; stop forwarding once the guard trips. (4) fidelity-core.ts capture_site: wrap cmdCapturePage in a 60 s deadline (AbortSignal/Promise.race that closes the driver) and fail naming the limit; after capture, if guard.tripped (response-cap or redirect-cap) throw `REFUSED: …` and delete/not register the bundle so list_references stays unchanged. (5) Test-only, within the same pass: tests/test_reconciliation_capture_site_egress.test.ts AC2047 `namesAddress` check accepts the refused scheme or credential reason instead of the literal URL for scheme/credential refusals (code deliberately does not echo credentialed URLs), and update AC acceptance_criterion-7db0225c wording to match.

## Ruling: denied

the planner terminal-failed the plan (needs_review)
