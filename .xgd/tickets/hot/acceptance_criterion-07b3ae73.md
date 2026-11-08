---
uid: acceptance_criterion-07b3ae73
id: AC-2380
type: acceptance_criterion
title: The model is never told which vendor generates images
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T06:42:25.630590+00:00'
updated_at: '2026-11-08T10:38:16.768178+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-39c992d3
  kind: behavior
  regression_only: false
---

## Criterion
Nothing the model sees names the image vendor: not the tool's manual entry, not its parameter schema, not any tool result or error text (success, provider refusal, unsupported shape, budget exhausted), and not anything the session's knowledge base returns for a generated picture (its material body as stored and indexed). The tool has no parameter for choosing a provider or model. No vendor or model name (for example "OpenAI", "gpt-image", "Google", "Gemini") appears, matched without regard to case.

The generated picture's material body still carries the prompt verbatim, so it remains findable by what it shows. `description_model` keeps naming the generating model: that field is shown to the client in the Library and is not something the model reads.

## Verification
Capture the tool manual, the schema and the tool results for success and for each error path in a session. Assert that none contains a vendor or model name, and that the schema has no provider/model parameter. After a successful `create_image` turn, read the stored material body and search the session's knowledge base for the prompt. Assert that neither the body nor any search result contains a vendor or model name, that the body still contains the prompt verbatim, and that the record's `description_model` still names the model.

Erratum (fix_plan iteration 11, REQ-208 property 1): widened to the material body and knowledge base. The plugin writes `- Provider:` / `- Model:` lines into the body, `generatedMaterialStore` stored them unchanged and indexed them, so the vendor was reachable by search.
