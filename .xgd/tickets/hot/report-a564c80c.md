---
uid: report-a564c80c
id: REPORT-11399
type: report
title: 'Report: fix_plan for report-d87c1fe2'
created_by: xgd
created_at: '2026-11-08T10:38:58.084820+00:00'
updated_at: '2026-11-08T10:38:58.084820+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: fix_plan
  subject_uid: report-d87c1fe2
  fix_iteration: 11
  items:
  - index: 0
    tests:
    - tests/reconciliation-consultant-image-generation.workers.test.ts::test_UAT_AC2380_nothing_the_model_sees_names_the_image_vendor
    dependency_tests:
    - test_UAT_AC2381_
    - test_UAT_AC2382_
    - test_UAT_AC2383_
    - test_UAT_AC2384_
    - test_UAT_AC2385_
    - test_UAT_AC2386_
    - test_UAT_AC2387_
    - test_UAT_AC2388_
    - test_UAT_AC2389_
    - test_UAT_AC2390_
    - test_UAT_AC2391_
    - test_UAT_AC2392_
    - test_UAT_FC_REQ-208_
    hypothesis: generatedMaterialStore.create in apps/control-app/src/imagegen.ts
      stores the ai-imagegen plugin's body unchanged, including its '- Provider:'
      and '- Model:' lines, and attach indexes it into the session knowledge base,
      so the model can find the image vendor by search.
    instructions: 'AC-2380 has been widened to cover the stored material body and
      the session knowledge base; its UAT currently collects only the manual, schema
      and tool results, so it passes despite the leak. First extend test_UAT_AC2380
      to match the widened AC. After a successful create_image turn, read the generated
      material''s stored body and search the session knowledge base for the prompt.
      Assert that no vendor or model name appears in either (case-insensitive: openai,
      gpt-image, google, gemini, imagen, and the configured model id). Assert that
      the body still contains the prompt verbatim, and that the record''s description_model
      still names the model. That test must fail on the current code. Then fix generatedMaterialStore.create
      in apps/control-app/src/imagegen.ts so the plugin''s provider and model provenance
      lines are removed from args.body before tickets.create. Remove exactly those
      lines and nothing else: no word-replace over the prompt, no change to description_model,
      no change to the plugin in node_modules. The rest of story-39c992d3''s tests
      and the REQ-208 FC suite must stay green; in particular AC2383 (vocabulary written
      at create) and AC2385 (findable by prompt without a describe call).'
    test_scope: test_UAT_AC2380_nothing_the_model_sees_names_the_image_vendor or test_UAT_AC2381_
      or test_UAT_AC2382_ or test_UAT_AC2383_ or test_UAT_AC2384_ or test_UAT_AC2385_
      or test_UAT_AC2386_ or test_UAT_AC2387_ or test_UAT_AC2388_ or test_UAT_AC2389_
      or test_UAT_AC2390_ or test_UAT_AC2391_ or test_UAT_AC2392_ or test_UAT_FC_REQ-208_
    ladder:
      rung1: REQ-208 is in scope and explicitly requires that the model never learn
        which vendor drew the image, and names the scoped store (not the plugin) as
        where this product adapts the plugin's record; this decides.
      rung2: 'Not needed: the reference state stores and indexes the plugin''s Provider/Model
        lines (imagegen.ts:218-231, 260), which is the defect itself rather than an
        expression of intent.'
      rung3: AC-2380's UAT, widened to cover the indexed body, stands and the code
        changes to satisfy it.
    override:
      rule: code_frozen
      rung: 1
      justification: REQ-208 property 1 says the model never learns the image vendor,
        and REQ-208 forbids changing the plugin's write and points to this product's
        scoped store instead. generatedMaterialStore.create stores the plugin body
        unchanged, so its Provider/Model lines are indexed into the session knowledge
        base. The widened AC-2380 is right and the code is wrong; the fix is confined
        to stripping those lines in imagegen.ts.
      files:
      - apps/control-app/src/imagegen.ts
      tip_evidence: []
      trust_boundary: false
---

# Fix Plan — Iteration 11

## Hypothesis
`generatedMaterialStore.create` (apps/control-app/src/imagegen.ts:218-231) stores the image plugin's material body unchanged. That body carries `- Provider: …` / `- Model: …` lines (ai-imagegen toolbox.js:757-758, 810-811). `attach` then indexes it into the session knowledge base (imagegen.ts:260), so the model can learn the image vendor by search. This breaks REQ-208 property 1.

## Analysis
- **Why this iteration exists:** the scoped quality run is clean (report-ca8d211d: 244 passed, 0 failed). The run came back through the pending-handoff gate on report-ddb736df (`blocked_by_handoff`, rule `code_frozen`) and the fixer's report-b37233c7 (BUG-1668). Both say the one remaining review gap, 5(a), needs a production change to `imagegen.ts`. Nothing else is outstanding.
- **Earlier iterations do not bear on this.** Iterations 1-10 fixed unrelated failures (AC2364 imports after REQ-182, REQ-209 font metrics, AC1817/1818). None touched the image vendor gap.
- **The leak is confirmed in the working tree:** `create` spreads `args` (the body included) straight into `tickets.create`, and `attach` awaits `index(args.uid)`.
- **`vendorless()` only rewrites error text.** It never touches the stored body.
- **Material fields are client-facing only.** They reach people through the Library detail view (material.ts:810) and the upload response (router.ts:945). No model-facing operation reads them. So the body, through the index, is the only channel to the model. `description_model` must keep the model id: REQ-208 requires it to name what generated the picture, for the client.
- **Why the test passes:** the current AC-2380 UAT (tests/reconciliation-consultant-image-generation.workers.test.ts:286-328) collects only the manual, the schema and the tool results, so it never sees the leak.

## Spec Changes Made
- **AC-2380 (acceptance_criterion-07b3ae73) widened in place:**
  - Its scope now includes the stored material body and anything the session knowledge base returns for a generated picture.
  - It now also requires that the body keep the prompt verbatim, and that `description_model` keep the model id.
  - The erratum note is in its body.

## Weak Evidence Flags (preventative — best effort)
- tests/reconciliation-consultant-image-generation.workers.test.ts::test_UAT_AC2380_nothing_the_model_sees_names_the_image_vendor — weak-observation — collects only manual, schema and tool results, so a vendor in the indexed body passes; this batch fixes it.
- tests/reconciliation-consultant-image-generation.workers.test.ts::test_UAT_AC2383_a_generated_picture_carries_the_full_material_vocabulary — weak-observation — reads the record only after generation finishes (review item 13); the sibling "before its bytes are attached" case covers the window, so keep both green.

## Batches
**Batch 0, one batch.**
- **Scope:** AC-2380's UAT plus the rest of story-39c992d3's tests (AC-2381 to AC-2392) and REQ-208's FC suite as blast radius. All of them exercise `imagegen.ts` and `generatedMaterialStore`.
- **Production change:** in `generatedMaterialStore.create`, remove exactly the plugin's provider and model provenance lines from the body before storing. Leave the prompt and all other body text byte-for-byte. Do not run a word-replace over the body.
- **Test change:** extend the AC-2380 UAT per the widened AC:
  - after a successful generation, read the stored material body and search the session knowledge base for the prompt;
  - assert that no vendor or model name appears, matched without regard to case;
  - assert that the prompt is still in the body;
  - assert that `description_model` still names the model.

## Mode overrides (REQ-892)
- **Batch 0, `code_frozen`, files `apps/control-app/src/imagegen.ts`, rung 1.**
  - REQ-208 states: "The model never learns which vendor drew the image."
  - It names the scoped store as the seam where this product fills what the plugin writes: "What is not acceptable is changing the plugin's write to accommodate us".
  - The code contradicts that intent, and the widened AC-2380 is the settled test.
  - The rule applies to `imagegen.ts` alone, the same scope as the earlier audited override report-483291fe.
  - `trust_boundary` is false: this removes two provenance lines from a stored body and adds no marking, escaping or sanitising of untrusted content.

## Resolution ladder (REQ-938)
- **Batch 0, decided at rung 1.**
  - REQ-208 is in scope and explicitly requires that no channel tell the model the vendor ("A deployment can move from OpenAI to Google without the assistant noticing").
  - Rung 2 was not needed: the reference state shows the leak, and that is the defect, not an expression of intent.
  - The tests stand once widened.
