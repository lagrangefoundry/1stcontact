---
uid: comment-0ed3c428
id: COMMENT-8029
type: comment
title: Claude response for fix_review_free_coded report
created_by: xgd
created_at: '2026-11-08T20:18:27.375008+00:00'
updated_at: '2026-11-08T20:18:27.375008+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-ed156b30
  kind: note
---

I fixed the critical finding and the `fontStyle` warning from the review. The REQ-211 and REQ-82 test suites pass. ESLint isn't installed in this repo and the sandbox blocks downloading it, so the workflow's quality checks will be the first lint run.

**Issues fixed**
- **Critical, `packages/framework/src/l1/render.ts` (`textRunsHtml`, ~line 2163):** `sizeScale` and `baselineShiftEm` are now written to the CSS only when `Number.isFinite` passes, matching the neighbouring emitters. I added the same check to `fontWeight`, as the review asked.
- **Warning, `render.ts:2165`:** a run's `fontStyle` is now written only when it is `'italic'` or `'normal'`, the schema's closed list (`schema.ts:1067`).
- **New test:** `test_UAT_FC_REQ_211_run_axes_are_inert_at_emit_time` in `tests/test_UAT_FC_REQ-211_multi_variate_text.test.ts`. It skips `validateL1` and passes `renderL1Document` an injection string in each of the four run axes. It checks that the CSS contains no `}body{`, `display:none` or `color:red`, and that the run text still renders, escaped, with no raw `<script>`.

**Not changed**
- **`points.js` `evaluateMeasure` warning:** this was advisory with no specific fix requested, so I left it.
- **Validator and schema:** untouched, as instructed.

**Verification**
- `tests/test_UAT_FC_REQ-211_multi_variate_text.test.ts`: 12/12 pass, including the new test.
- `tests/test_UAT_FC_REQ-211_runs_survive_a_capture.test.ts`: passes, with 2 tests skipped.
- `tests/req82-l1-substrate.test.ts` (the REQ-82 suite): 5 pass, 3 skipped.
- I didn't check whether the 5 skipped tests skip on the unchanged code too.
- The changes are not committed; I've left them for the workflow.

**Confidence:** high. The critical finding was the only failing item, and the fix follows the review's own fix-it steps exactly.