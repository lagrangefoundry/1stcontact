---
uid: report-dba6369b
id: REPORT-11410
type: report
title: Claude batch_fix_assessment report
created_by: xgd
created_at: '2026-11-08T11:19:05.811301+00:00'
updated_at: '2026-11-08T11:19:05.811301+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: batch_fix_assessment
  subject_uid: report-d87c1fe2
  parent_report_uid: report-c877f8d0
  batch_index: '0'
---

The test this batch was about, `test_UAT_AC2380_nothing_the_model_sees_names_the_image_vendor`, passes, along with the rest of the batch: 3 files, 27 tests (AC-2379–AC-2392 and the whole `test_UAT_FC_REQ-208_` suite). I made no edits, as the planner expected.

I also read the AC-2380 test (`tests/reconciliation-consultant-image-generation.workers.test.ts:286-328`) to check that it proves something:
- **It runs the real flows the model sees:** a successful generation, a refusal from the image provider, an unsupported aspect ratio and an exhausted session budget. It checks the system text, the tool schemas and every tool result for vendor names: `openai`, `gpt-image`, `Google`, `Gemini`, `imagen`.
- **The "not mentioned" checks can't pass on empty input.** Line 317 requires the budget-exhausted refusal to actually appear. Line 324 looks up the image tool's schema and would throw if the tool weren't offered.
- **It asserts the tool takes no `provider` or `model` parameter.**
- **Its scope matches AC-2380 as currently worded:** what the model sees through the tool. It deliberately doesn't cover the stored material body or knowledge-base search. That is BUG-381, which the frozen code fails by design.

The `declined` ruling on `code_frozen` stands. I didn't touch any production file, any ticket, or any skip marker.

```yaml
## Assessment
status: verified
failures_fixed: []
failures_remaining: []
notes: "test_UAT_AC2380_nothing_the_model_sees_names_the_image_vendor passes with the batch scope (27/27). No edits made; code_frozen declined ruling unchanged; AC-2380 evidence is substantive for its current wording."
```