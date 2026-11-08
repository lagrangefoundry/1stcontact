---
uid: report-b5cfdad9
id: REPORT-11593
type: report
title: Claude batch_fix_assessment report
created_by: xgd
created_at: '2026-11-08T22:18:57.663209+00:00'
updated_at: '2026-11-08T22:18:57.663209+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: batch_fix_assessment
  subject_uid: story-58b2cec4
  parent_report_uid: report-8f9f5514
  batch_index: '0'
---

`test_UAT_AC2026_every_picture_parameter_offers_the_one_declared_shape` now passes. It and the other two tests in this batch's scope (AC2027 and AC2028) all pass when run with vitest. I couldn't lint the file: eslint isn't installed in the worktree, and the sandbox blocked downloading it from registry.npmjs.org.

**What changed:** only the test, in `tests/reconciliation-assistant-looking-surface.test.ts:479-500`. No production code and no tickets were touched.
- For each picture parameter (`screenshot.of`, `compare.a`, `compare.b`, `check_fidelity.actual`), the test now expects exactly nine keys: `after`, `bundle`, `image`, `kind`, `original`, `page`, `revision`, `url` and `viewport`.
- It expects six kinds: `reference`, `draft`, `edit`, `revision`, `url` and `image`.
- It now also checks that `after` is typed as an array and that its description says "Only a `draft` picture can be driven".
- The other checks are unchanged: the viewport enum, `revision` being an integer, `required` being `['kind']`, no additional properties, the banned per-operation picture parameters, and refusing an invalid picture before any browser is used.

**Does it prove the behaviour:** yes. The test compares against the full list of keys and the full enum. So the old five-kind, six-key schema would fail it, and so would dropping the draft-only wording from `after`.

**Upstream:** no ticket edit was needed. AC-2026 (acceptance_criterion-19a996bc) already describes the six kinds and nine keys, and the declaration in `fidelity-surface.json` matches it.

```yaml
## Assessment
status: fixed
failures:
  - test: test_UAT_AC2026_every_picture_parameter_offers_the_one_declared_shape
    fix: test-only; assertions aligned to the nine-key, six-kind picture shape and the draft-only `after` array
    verified: "npx vitest run tests/reconciliation-assistant-looking-surface.test.ts -t 'test_UAT_AC202[678]_' → 3 passed"
upstream_changes: none
production_changes: none
notes: "eslint not run: it is not installed in the worktree, and the sandbox blocked downloading it from registry.npmjs.org"
```