---
uid: comment-35dfe916
id: COMMENT-5810
type: comment
title: Claude response for batch_fix_assessment report
created_by: xgd
created_at: '2026-10-28T19:56:46.987367+00:00'
updated_at: '2026-10-28T19:56:46.987367+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-35fe09d3
  kind: note
---

This batch was already fixed and committed by an earlier pass (`67f7c41545`), so I made no edits this time.

**Test results**
- `npx vitest run --config vitest.node.config.mts tests/test_reconciliation_capture_site_egress.test.ts` passes 10 of 10 (AC2044 to AC2053).
- The five REQ-157 guard UATs in `tests/test_UAT_FC_REQ-157_fidelity_surface.test.ts` all pass. The other 22 tests in that file were left out by the name filter, not skipped by a marker.

**Checked against the ruling**
- **Scope:** commit `67f7c41545` touched only `tests/test_reconciliation_capture_site_egress.test.ts` and the xgd change log. No production file changed, and every test name is unchanged.
- **Test content:** each test drops only the clauses the ruling retires:
  - AC2045 no longer covers the "null for a bundle without a record" case.
  - AC2046 expects `Bundle '<name>' has no capture.json.` instead of `NOT_FOUND`.
  - AC2047 expects scheme and credential refusals to name the scheme or reason and never echo the secret; address-space refusals must still name the address.
  - AC2048 checks redirect hops on the Worker only, and states the Node gap as a limitation.
  - AC2049 checks the 6th hop trips `redirect-cap` and hops 6 to 8 are never sent.
  - AC2050 checks only the Worker `response-cap` trip, and that the bundle is still returned.
- **Tickets:** the six ACs and STORY-159 already carry the iteration-6 alignment notes and the "Known gaps (aligned to code, see fix_plan iteration 6)" section.

**Not verified**
- **Lint:** `eslint` isn't installed locally, and the sandbox blocked downloading it (`registry.npmjs.org` is not on the allow list), so lint did not run on the test file.
- **Suite entry:** the suite-level `javascript-vitest` "executed 0 tests" failure is the XGD plugin defect BUG-1574, out of scope as the planner said. This batch's direct run is green.

```yaml
## Assessment
status: done
blocked_by: null
notes: "All batch failures were already fixed in 67f7c41545 (tests only). Direct run is 10/10 and the REQ-157 dependency UATs are green. Lint was not run: eslint is not installed and the sandbox blocks registry.npmjs.org. The javascript-vitest suite entry is BUG-1574 (out of scope)."
```
