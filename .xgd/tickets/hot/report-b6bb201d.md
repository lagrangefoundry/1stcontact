---
uid: report-b6bb201d
id: REPORT-6808
type: report
title: Claude batch_fix_assessment report
created_by: xgd
created_at: '2026-10-27T21:41:31.864844+00:00'
updated_at: '2026-10-27T21:41:31.864844+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: batch_fix_assessment
  subject_uid: story-31204812
  parent_report_uid: report-e63d5b68
  batch_index: '0'
---

I couldn't fix this batch without changing frozen production code, so I made no edits; the work tree is as I found it. Five of the six failing tests in `tests/test_reconciliation_capture_site_egress.test.ts` fail because of real code bugs, and the `code_frozen` rule forbids touching production code.

**What fails (6 of 10 tests):**

| Test | Cause |
|---|---|
| AC2045 `list_references` | Code bug. `readCapture` (`tools/generate/src/cli/capture/bundle.ts:95`) throws when a bundle has no `capture.json`, so the `capture?.url ?? null` fallback in `list_references` (`fidelity-core.ts:345`) never runs. One bundle with no record makes the whole list fail. |
| AC2046 `describe_reference` | Same root cause. `captureOf` (`fidelity-core.ts:245`) is meant to raise `PictureNotFoundError` ("no reference called … Use list_references"), but `readCapture` throws first. So the `NOT_FOUND` path never runs and the model gets "has no capture.json". |
| AC2048 every request checked | Code bug and a real SSRF hole. On Node, Playwright's `page.route` doesn't see redirect hops, so a public page redirecting to `http://10.0.0.1/` is followed and never refused. The Worker side passes. |
| AC2049 redirect cap | Story code issues 1 and 4: the cap counts every distinct origin, so 8 CDN origins trip it, and a tripped capture still returns a reference. |
| AC2050 byte and time caps | Story code issues 2–4: the Node driver never counts bytes, the 60 s limit is never applied, and a tripped capture isn't refused. |
| AC2047 pre-flight | The only test-side problem. Scheme and credential refusals are correctly `REFUSED` but don't echo the URL, which is right for credentialed URLs (echoing would leak the secret). The test and AC should accept naming the scheme or the reason instead. |

The cap failures in AC2049 and AC2050 match the story's own "Code issues" list, and those ACs say outright that they fail against the code as landed. Rewriting those tests to match the code would mean accepting an SSRF hole and missing caps, which is the weakened-assertion fix the rules forbid.

The full vitest run has another 63 failures in unrelated files (public-site, assistant-conversation, knowledge-base and others). They look environmental: the sandbox blocked network calls to Cloudflare. They're out of this batch's scope, and I didn't investigate them.

```yaml
## Assessment
blocked_by:
  rule: code_frozen
  evidence: "Ran `npx vitest run --config vitest.node.config.mts tests/test_reconciliation_capture_site_egress.test.ts`: 6 failed / 4 passed. Read tools/generate/src/cli/ai/fidelity-core.ts:245-380 and tools/generate/src/cli/capture/bundle.ts:95-99. readCapture throws `Bundle '<name>' has no capture.json.` on a missing record, so the null fallback in list_references and PictureNotFoundError (NOT_FOUND) in captureOf can never run (AC2045, AC2046). The Playwright double follows Playwright's documented rule that route() is not called for redirect hops; the Node driver therefore forwards a redirect to http://10.0.0.1/ unguarded (AC2048 node). AC2049/AC2050 failures are exactly story code issues 1-4: origin-count redirect cap trips on 8 CDN origins, the Node driver records no response bytes, the 60 s cap is never applied, and capture_site returns a bundle when guard.tripped. The ACs were written as intent the code contradicts; satisfying them in tests alone would mean weakening assertions around an SSRF boundary."
  proposed_change: "(1) tools/generate/src/cli/capture/bundle.ts: add a tolerant `readCaptureOrNull` (readJson without throw); use it in fidelity-core.ts list_references and captureOf so the null and NOT_FOUND paths run. (2) tools/generate/src/cli/capture/egress guard module: count redirect hops per navigation (document redirect chain only, not subresource origins), and refuse with reason `redirect-cap` beyond 5 hops. (3) tools/generate/src/cli/capture/playwright-driver.ts (guardedPlaywrightDriver): guard redirect hops (on 'response' with a 3xx Location, check the target against the guard and abort navigation / route redirects manually, e.g. by fulfilling the 3xx and re-requesting through the route), and record response bytes against the guard as cf-driver does; stop forwarding once the guard trips. (4) fidelity-core.ts capture_site: wrap cmdCapturePage in a 60 s deadline (AbortSignal/Promise.race that closes the driver) and fail naming the limit; after capture, if guard.tripped (response-cap or redirect-cap) throw `REFUSED: …` and delete/not register the bundle so list_references stays unchanged. (5) Test-only, within the same pass: tests/test_reconciliation_capture_site_egress.test.ts AC2047 `namesAddress` check accepts the refused scheme or credential reason instead of the literal URL for scheme/credential refusals (code deliberately does not echo credentialed URLs), and update AC acceptance_criterion-7db0225c wording to match."
```
