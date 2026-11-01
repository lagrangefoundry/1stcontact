---
uid: report-c1c724a7
id: REPORT-7559
type: report
title: Claude reconciliation_uat_generation report
created_by: xgd
created_at: '2026-11-01T10:42:52.262459+00:00'
updated_at: '2026-11-01T10:42:52.262459+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_uat_generation
  subject_uid: story-0cd18650
---

I wrote 11 tests for the terms-of-service gate story (story-0cd18650), one per acceptance criterion, and all 11 pass. I didn't change any runtime code.

```
UATs generated for story story-0cd18650 (plan item 6 of 10)

Story: story-0cd18650
Test file(s) created:
  - tests/reconciliation-terms-of-service-gate.workers.test.ts

Tests written: 11
Tests passed: 11
Tests failed: 0

test_files_created:
  - "tests/reconciliation-terms-of-service-gate.workers.test.ts"
```

| Test | What it proves |
|---|---|
| `test_UAT_AC2132_…` | An unaccepted person (never accepted, or accepted an old version) who opens `/` or `/b/<id>/...` gets the terms page at that URL, with no redirect and no builder content. |
| `test_UAT_AC2133_…` | Stylesheets, scripts, images, `/api/businesses`, wildcard-`Accept` requests, requests with no headers and POSTs all get 403 plain text pointing to `/terms`. A request with `Accept: text/html` gets the terms page. |
| `test_UAT_AC2134_…` | Every gate response is `no-store` and `noindex`: the terms page, `/terms`, the 403, and the accept endpoint's 415, 405 and 204. |
| `test_UAT_AC2135_…` | A JSON POST gets 204 with no body and stores the version plus an ISO timestamp. Accepting again moves the timestamp forward. |
| `test_UAT_AC2136_…` | A POST with no content type or any of the three form types gets 415, a GET gets 405, the user's record is unchanged, and the terms page is still served. |
| `test_UAT_AC2137_…` | After accepting, the same URLs serve the builder, assets and API. The page's script reloads the current URL rather than navigating away. |
| `test_UAT_AC2138_…` | Raising the current version re-prompts a person who accepted, and so does lowering their stored version. The stored value is unchanged until they accept the new version. |
| `test_UAT_AC2139_…` | Every paragraph of the terms text appears in its own `<p>`. The page has inline style and script and no external links, script sources, module scripts or import map. |
| `test_UAT_AC2140_…` | `/terms` and `/b/<id>/terms` work before and after acceptance. Afterwards they show "Accepted on YYYY-MM-DD" and no button. |
| `test_UAT_AC2141_…` | The page has exactly one button, the agree one, and no decline wording. Posts to decline-style paths are refused and the record stays empty. |
| `test_UAT_AC2142_…` | In loopback dev-open mode, a request with no token gets the builder and assets without a terms check. With Access configured, the gate applies. |

The tests follow the pattern of the existing free-coding test: the Worker's own `fetch` running in workerd, a real D1 database, and real RS256 Access tokens. The only stub is the key-set fetch, the one call the Worker makes outside itself.

Two tests also call `guardTerms` directly instead of only going through `fetch`:
- **AC2138:** the current version is a fixed constant, so overriding the gate's version option is the only way to raise it without editing source.
- **AC2135:** the second acceptance uses an injected time so the "timestamp moves forward" check is exact.

The type check isn't wired up for this file either: the repo has no lint or type-check script for test files, so the file passes tests but hasn't been linted or type-checked. I couldn't run eslint separately: `npx eslint` isn't installed in the project, and the sandbox blocked downloading it from registry.npmjs.org.
