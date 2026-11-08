---
uid: report-1e41ab09
id: REPORT-11403
type: report
title: Claude batch_fix_assessment report
created_by: xgd
created_at: '2026-11-08T10:56:16.761806+00:00'
updated_at: '2026-11-08T10:56:16.761806+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: batch_fix_assessment
  subject_uid: report-d87c1fe2
  parent_report_uid: report-5715bca5
  batch_index: '0'
---

The batch's one failure, `test_UAT_AC2380_nothing_the_model_sees_names_the_image_vendor`, passes as it stands, and I made no edits.

**What I ran:**
- `tests/reconciliation-consultant-image-generation.workers.test.ts` (AC2380–AC2391) and `tests/test_UAT_FC_REQ-208_the_assistant_can_make_pictures.workers.test.ts`: 26 of 26 passed.
- `tests/reconciliation-consultant-image-generation-deploy.test.ts` (AC2392): 1 of 1 passed.

**AC2380 is still a real test** (`tests/reconciliation-consultant-image-generation.workers.test.ts:286-328`):
- It runs four real turns through the router and session: a successful generation, a provider refusal, an unsupported aspect ratio (21:9), and the per-session budget running out.
- From those turns it collects what the model actually receives: the system prompt including the tool manual, the tool schemas, and every tool result.
- It checks that none of the vendor names (OpenAI, gpt-image, Google, Gemini, imagen) appear in any of that.
- It checks that the image tool's schema has no `provider` or `model` parameter. If the tool were never offered, that check would throw, so the test cannot pass on a session with no image tool.
- It checks that once the budget is used up the result says so (`'as many images as it is allowed'`), so the failure path is really exercised.
- That matches AC-2380 as it now reads: the manual, the schema, and the tool results and error text.

**Not changed:** I did not extend the test to the stored material body or knowledge-base search, as the planner instructed. That is BUG-381's acceptance, and it fails on the frozen code by design. I did not touch `apps/control-app/src/imagegen.ts`, anything under `node_modules`, or any ticket, so nothing was propagated to ACs or stories.

```yaml
## Assessment
status: passing
edits: none
blocked_by: null
evidence: "vitest run of the image-generation workers suite plus the REQ-208 FC suite: 26/26 passed; the image-generation deploy suite: 1/1 passed. test_UAT_AC2380 (tests/reconciliation-consultant-image-generation.workers.test.ts:286-328) passes unchanged and asserts the narrowed AC: no vendor name in the manual, the tool schemas or the tool results/errors, and no provider or model parameter on the image tool."
```