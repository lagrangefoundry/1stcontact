---
uid: report-a313553e
id: REPORT-11322
type: report
title: 'Report: fix_plan for story-39c992d3'
created_by: xgd
created_at: '2026-11-08T06:54:47.980082+00:00'
updated_at: '2026-11-08T06:54:47.980082+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: fix_plan
  subject_uid: story-39c992d3
  items:
  - index: 0
    tests:
    - tests/reconciliation-consultant-image-generation.workers.test.ts::test_UAT_AC2380_nothing_the_model_sees_names_the_image_vendor
    dependency_tests:
    - test_UAT_AC2379_
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
    - test_UAT_FC_REQ-208_
    hypothesis: 'apps/control-app/src/imagegen.ts passes the framework image plugin''s
      unknown_aspect_ratio error detail (''The host reports: Backend "openai" does
      not support ...'') to the model unchanged, so the unsupported-shape path names
      the vendor.'
    instructions: 'Production code is unfrozen for apps/control-app/src/imagegen.ts
      only (override below). The unsupported-shape (21:9) tool result names the vendor
      through the plugin''s ''The host reports: Backend "openai" ...'' detail. No
      other path leaks. In imagegen.ts, where imageSurface() composes the create_image
      plugin (next to the existing meteredDraws wrapper), make every tool error the
      model reads vendor-free: no IMAGE_PROVIDER and no backend model id. Keep the
      declared sentence ''That is not a shape this generator offers'' and keep the
      list of supported ratios, because the shape ACs depend on them. Do not edit
      the generated ai-imagegen.js, which is gitignored and rebuilt. Do not edit the
      framework plugin either, because it is outside the override. Do not change AC-2380
      or its test. All sibling AC tests and the REQ-208 FC tests must stay green.'
    test_scope: test_UAT_AC2380_ or test_UAT_AC2379_ or test_UAT_AC2381_ or test_UAT_AC2382_
      or test_UAT_AC2383_ or test_UAT_AC2384_ or test_UAT_AC2385_ or test_UAT_AC2386_
      or test_UAT_AC2387_ or test_UAT_AC2388_ or test_UAT_AC2389_ or test_UAT_AC2390_
      or test_UAT_AC2391_ or test_UAT_FC_REQ-208_
    ladder:
      rung1: 'Decided: REQ-208 (bundled, in scope) says ''no error sentence or line
        of the manual names one'', and AC-2380 lists the unsupported-shape path, so
        the code must change.'
      rung2: The reference has the same leak (imagegen.ts:677-720 composes the plugin
        with no error rewrite), and its FC test never checked the shape path, so it
        does not settle the question the other way.
      rung3: The test stands unchanged.
    override:
      rule: code_frozen
      rung: 1
      justification: REQ-208 is in scope and requires that no error sentence the model
        sees names the image vendor. AC-2380 covers the unsupported-shape path. The
        code leaks 'openai' there, so the test is right and imagegen.ts must scrub
        the vendor from the error text.
      files:
      - apps/control-app/src/imagegen.ts
      tip_evidence:
      - file: apps/control-app/src/imagegen.ts
        lines: 27-32
      - file: apps/control-app/src/imagegen.ts
        lines: 677-720
      trust_boundary: false
  fix_iteration: 2
---

# Fix Plan — Iteration 2

## Hypothesis
The model can see the vendor name in exactly one place. On the unsupported-shape path (`unknown_aspect_ratio`), `apps/control-app/src/imagegen.ts` passes the framework image plugin's error detail ("The host reports: Backend \"openai\" does not support ...") to the model unchanged. This is a production defect, not a test defect.

## Analysis
- One failure: `test_UAT_AC2380_nothing_the_model_sees_names_the_image_vendor` (tests/reconciliation-consultant-image-generation.workers.test.ts).
- In iteration 1 (report-b117e120) the builder made no edits and filed `blocked_by: code_frozen`. Its evidence: the 21:9 tool result reads `Error: CreateImage failed (unknown_aspect_ratio). That is not a shape this generator offers. The host reports: Backend "openai" does not support "aspectRatios": 21:9 is not among 1:1, 3:2, 2:3`. The success, refusal and budget-exhausted paths are vendor-free, and so is the tool schema (it has no provider or model parameter).
- I checked this independently. The "host reports" wording is in no tracked production source at HEAD or at `reconcile-src-BUNDLE-40`. It comes from the generated, gitignored `apps/control-app/src/generated/ai-imagegen.js`, which is built from the framework imagegen plugin. `imageSurface()` (ref `imagegen.ts:677-720`) builds the plugin with `provider: IMAGE_PROVIDER`, and `meteredDraws` (ref `imagegen.ts:586-608`) wraps only `_draw`. Nothing rewrites the error text before the model sees it.
- The reference FC test `test_UAT_FC_REQ-208_the_model_never_learns_which_vendor_drew_the_image` (ref lines 270-290) checks vendor names on the refusal path only. Its shape test (ref line 505-510) checks only the "not a shape this generator offers" wording. So the reference never exercised this leak, and it has the same defect.
- REQ-208 has status `bundled`, so it is an intent in scope for this run. Its operative sentence says: "no error sentence or line of the manual names one" (a vendor). The header comment of `imagegen.ts`, property 1 (ref lines 29-32), states the same rule. AC-2380 names the unsupported-shape path explicitly.
- No isolation or contamination pattern applies: the test fails deterministically on the error text, in isolation.
- Hypothesis count: this is the first time this root cause has been planned. Iteration 1 found it, but could not act on it because of the mode rule.

## Spec Changes Made
None. AC-2380 is correct as written. Narrowing it would write a known defect into the spec.

## Weak Evidence Flags (preventative — best effort)
- tests/test_UAT_FC_REQ-208_the_assistant_can_make_pictures.workers.test.ts::test_UAT_FC_REQ-208_the_model_never_learns_which_vendor_drew_the_image — weak-observation — Covers the refusal path only, which is why it missed this leak. It should also check the vendor names against the unsupported-shape result.
- tests/test_UAT_FC_REQ-208_the_assistant_can_make_pictures.workers.test.ts (shape case, ~line 505) — weak-observation — Asserts only a substring of the shape error. It should also assert that the supported ratios are listed and that no vendor or model id appears.

## Batches
Batch 0 is the single failing test, plus its sibling story ACs and the REQ-208 FC tests as blast radius. The fix touches one production file, so there is nothing to split.

## Mode overrides (REQ-892)
- Batch 0: rule `code_frozen`, rung 1. Files: `apps/control-app/src/imagegen.ts`. Justification: REQ-208 is in scope and says no error sentence the model sees may name the vendor. AC-2380 covers the unsupported-shape path. The code leaks `openai` on that path, so the test is right and the code must change. `trust_boundary`: false. The change rewrites tool error text that the model reads; it does no escaping, marking or provenance work on untrusted output.

## Resolution ladder (REQ-938)
- Batch 0: decided at rung 1. REQ-208 (in scope, bundled) requires vendor-free error sentences, and AC-2380 lists the shape path. Rung 2 would not contradict this: the reference has the same leak, at `imagegen.ts:677-720` with no error rewrite. Its FC test never checked this path, so the reference does not settle the question the other way. The test stands and the code changes.
