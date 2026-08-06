---
uid: report-de772a45
id: REPORT-1425
type: report
title: Claude reconciliation_uat_generation report
created_by: xgd
created_at: '2026-08-06T18:59:18.052792+00:00'
updated_at: '2026-08-06T18:59:18.052792+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_uat_generation
  subject_uid: story-d34eccd8
---

Only the new test file is added — no runtime code and no existing tests touched.

## Notes on two judgement calls

**AC-906 vs AC-910 (headers).** AC-906 asks that the four not-found cases be "indistinguishable … in status, headers and body", while AC-910 mandates `x-robots-tag: noindex` on every preview-channel response including its not-found. Two of AC-906's four cases are inherently published-channel (unknown site, site with nothing published) and two are preview-channel, so a literal cross-channel header comparison would contradict AC-910. I resolved it in favour of AC-906's stated purpose ("a stranger cannot learn from the response whether a site exists"): the test byte-compares status/type/body across all four, asserts *full* header equality within each channel (which is where an existence oracle could actually live), and then pins that the only cross-channel header difference is the crawler directive — which the requester's own URL choice determines, not the store. This is not a weakened assertion; it is strictly stronger than a plain four-way body comparison.

**AC-914 (reserved-segment gate).** The story records this as a "standing invariant, not currently reachable" — rendered pages are emitted flat, so no site definition can produce a top-level `out/draft` entry, and the AC's "attempt a deploy" cannot be driven through `cmdDeploy` today. The test drives the gate at its own entry point (`assertNoReservedSegment`) using a **real** snapshot file list taken from a real deploy, asserts the message names the entry, the reserved segment and the unreachability reason, and asserts the store is byte-for-byte unchanged. The AC's "proceeds normally" half *is* driven all the way through the real `cmdDeploy`: a page slugged `draft` (→ `out/draft.html`, prefix-sharing) and an asset at `out/assets/draft/logo.svg` (→ nested one level deeper) both deploy and both serve.

```
UATs generated for story story-d34eccd8 (plan item 4 of 5)

Story: story-d34eccd8
Test file(s) created:
  - tests/reconciliation-serve-deployed-snapshot.test.ts

Tests written: 13
Tests passed: 13
Tests failed: 0

test_files_created:
  - "tests/reconciliation-serve-deployed-snapshot.test.ts"
```

Coverage is 1:1 with the story's ACs (AC-902 … AC-914). Every claim is observed at the HTTP boundary through the Worker's real `fetch` entry point, over a bucket seeded by real `1c deploy` runs; R2 is faked only at the binding, with the route grammar, deploy index, header policy and edge cache all real. The seven adjacent deploy/serving suites (54 tests) still pass.
