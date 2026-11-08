---
uid: bug-da5f9050
id: BUG-381
type: bug
title: A generated picture's stored description names the image vendor, and the assistant
  can find it by search
created_by: workflow:test_fix_plan_prompt/planner
created_at: '2026-11-08T10:47:17.127827+00:00'
updated_at: '2026-11-08T10:47:17.127827+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: medium
  severity: medium
  auto_merge_back: true
  needs_review: false
---

# A generated picture's stored description names the image vendor, and the assistant can find it by search

## Symptom

[[REQ-208]] says *"the model never learns which vendor drew the image … a deployment can
move from OpenAI to Google without the assistant noticing."* The tool's manual, its
schema and its error text keep that promise. The generated picture's material body
does not.

The `ai-imagegen` plugin writes provenance lines into the body it hands its store:

```
- Provider: openai
- Model: gpt-image-1
```

(`node_modules/@lagrangefoundry/ai-imagegen/src/toolbox.js:757-758`, and again at
`:810-811`.) `generatedMaterialStore.create` in `apps/control-app/src/imagegen.ts`
(~218-231) spreads `args` into `tickets.create` without changing the body, and `attach`
indexes the material (`imagegen.ts:260`) through the same path an upload uses. So the
vendor and model name land in the session knowledge base. A `search` for the prompt, or
a read of the material, shows them to the assistant.

## Why this is a ticket and not a fix in BUNDLE-40

This was found in reconciliation review of BUNDLE-40 (gap 5(a)). Reconciliation
freezes production code. The fix planner asked for a `code_frozen` override, and the
validator refused it for that batch. So BUNDLE-40 records the divergence: AC-2380 is
narrowed to what the code guarantees, and a Reconciliation Decision on STORY-172
(`story-39c992d3`) points here. This ticket is the upgrade that makes AC-2380's
original scope true.

## Required behaviour

- After a successful `create_image`, the stored material body and every knowledge-base
  result for that picture contain no vendor or model name (case-insensitive: openai,
  gpt-image, google, gemini, imagen, and the configured model id).
- The body still contains the prompt verbatim, so the picture stays findable by what it
  shows (AC-2385).
- `description_model` still names the generating model. That field is shown to the
  client in the Library, and the model never reads it.
- The fix lives in this product's scoped store (`generatedMaterialStore.create`). It
  removes exactly the plugin's `Provider` and `Model` provenance lines. It does not run a
  word-replace over the prompt, and it does not change the plugin. REQ-208 forbids changing
  the plugin's write to suit this product. If the provenance lines cannot be removed
  reliably from this side, report that upstream as a request for the plugin to make them
  optional.

## Acceptance

- AC-2380 is widened again, to cover the stored body and the knowledge base. Its UAT
  searches the knowledge base after a generation, and fails against the code as it is
  today.
- AC-2381 to AC-2392 and the `test_UAT_FC_REQ-208_` suite stay green.

**Falsifier:** the assistant searches for a picture it just made and reads back the name
of the company that drew it.
