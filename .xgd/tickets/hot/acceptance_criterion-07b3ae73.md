---
uid: acceptance_criterion-07b3ae73
id: AC-2380
type: acceptance_criterion
title: The image tool never tells the model which vendor generates images
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T06:42:25.630590+00:00'
updated_at: '2026-11-08T10:47:29.759168+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-39c992d3
  kind: behavior
  regression_only: false
---

## Criterion
Nothing the image tool itself tells the model names the image vendor: not the tool's manual entry, not its parameter schema, and not any tool result or error text (success, provider refusal, unsupported shape, budget exhausted). The tool has no parameter for choosing a provider or model. No vendor or model name (for example "OpenAI", "gpt-image", "Google", "Gemini") appears in any of these, matched without regard to case.

## Verification
Capture the tool manual, the schema and the tool results for success and for each error path in a session. Assert that none contains a vendor or model name, and that the schema has no provider/model parameter.

## Scope note (reconciliation, fix_plan iteration 11, attempt 2)
This criterion does NOT cover the generated picture's stored material body or the session knowledge base. The code does not keep REQ-208's promise there. The `ai-imagegen` plugin writes `- Provider:` / `- Model:` lines into the body (`toolbox.js:757-758`). `generatedMaterialStore.create` (`apps/control-app/src/imagegen.ts`) stores the body unchanged, and `attach` indexes it (`imagegen.ts:260`), so a search can reach the vendor name. Iteration 11's first attempt widened this AC to cover that channel and asked for a `code_frozen` override to fix `imagegen.ts`. The validator refused the override, so in reconciliation the code stands. The divergence is recorded on STORY-172 (Reconciliation Decisions), and the fix is tracked as BUG-381 (`bug-da5f9050`). When BUG-381 lands, it widens this criterion again.
