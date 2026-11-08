---
uid: report-d903aa54
id: REPORT-11612
type: report
title: 'Report: fix_plan for story-58b2cec4'
created_by: xgd
created_at: '2026-11-08T23:17:49.329539+00:00'
updated_at: '2026-11-08T23:17:49.329539+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: fix_plan
  subject_uid: story-58b2cec4
  fix_iteration: 11
  items:
  - index: 0
    tests:
    - original is labelled, and each host says which pictures it holds test_UAT_AC2487_original_is_labelled_the_cli_answers_site_assets_and_says_it_holds_no_library_and_no_store_is_environment
    dependency_tests:
    - test_UAT_AC2024_
    - test_UAT_AC2025_
    - test_UAT_AC2026_
    - test_UAT_AC2027_
    - test_UAT_AC2028_
    - test_UAT_AC2029_
    - test_UAT_AC2031_
    - test_UAT_AC2033_
    - test_UAT_AC2034_
    - test_UAT_AC2067_
    - test_UAT_AC2481_
    - test_UAT_AC2483_
    - test_UAT_AC2484_
    - test_UAT_AC2485_
    - test_UAT_AC2486_
    - test_UAT_AC2488_
    hypothesis: PictureEnvironmentError in tools/generate/src/cli/picture.ts is never
      translated to the declared ENVIRONMENT code, and storedImage not-found refusal
      uses one Library-pointing sentence on every host, so the 1c CLI (mergeImageLibraries
      with only the site namespace, ai/host.ts:252) never says it holds no Library.
    instructions: 'AC-2487 states REQ-218 intent and its UAT (tests/reconciliation-assistant-sees-a-stored-picture.test.ts:593)
      is correct; do not edit it. Two production gaps make it fail. (1) A deployment
      with no image store refuses with the NO_IMAGE_STORE sentence but no code: find
      the mapping that already turns PictureSourceError into PICTURE_INVALID and PictureNotFoundError
      into NOT_FOUND on the fidelity surface, and add PictureEnvironmentError -> ENVIRONMENT
      there, so the refusal renders as `Error: screenshot failed (ENVIRONMENT).` followed
      by the existing sentence. Do not build a second error path. (2) The not-found
      refusal in storedImage must know whether the deployment holds a Library namespace:
      when it holds only site assets (the 1c host), it says this host holds no Library
      pictures, only the site own assets, points at list_assets, and does NOT say
      the name it appears under in the Library; the Worker, which holds both namespaces
      (router.ts:339), keeps the current wording exactly, which AC2484 pins. The natural
      seam is mergeImageLibraries in image-library.ts, which already knows which parts
      it was given; expose that fact on the ImageLibrary port rather than sniffing
      host identity. Keep every dependency test green, in particular AC2484 (Worker
      not-found wording), AC2028/AC2033 (PICTURE_INVALID), AC2024/AC2025 (no-browser
      and Worker paths).'
    test_scope: test_UAT_AC2487_ or test_UAT_AC2024_ or test_UAT_AC2025_ or test_UAT_AC2026_
      or test_UAT_AC2027_ or test_UAT_AC2028_ or test_UAT_AC2029_ or test_UAT_AC2031_
      or test_UAT_AC2033_ or test_UAT_AC2034_ or test_UAT_AC2067_ or test_UAT_AC2481_
      or test_UAT_AC2483_ or test_UAT_AC2484_ or test_UAT_AC2485_ or test_UAT_AC2486_
      or test_UAT_AC2488_
    ladder:
      rung1: 'Decided: REQ-218 (in scope, EPIC-1 accepted) says the local builder
        answers for the site own assets and says it holds no Library, and that a deployment
        without an image store says so the same way a no-browser deployment does,
        i.e. ENVIRONMENT.'
      rung2: 'Agrees and does not decide otherwise: at reconcile-src-BUNDLE-42 fidelity-surface.json:126
        declares ENVIRONMENT for no image store and picture.ts:214-221 says the class
        means ENVIRONMENT, but picture.ts:222-233/502 throw it uncoded and picture.ts:472-478
        has one Library-pointing not-found sentence for every host.'
      rung3: Not reached; the AC-2487 test stands unchanged and the code changes.
    override:
      rule: code_frozen
      rung: 1
      justification: REQ-218, the latest intent in scope on this surface, requires
        the 1c host to say it holds no Library and the no-image-store deployment to
        refuse as ENVIRONMENT; the reference leaves both unwired and does not settle
        the question the other way, so the settled AC-2487 test is right and the code
        is wrong.
      files:
      - tools/generate/src/cli/picture.ts
      - tools/generate/src/cli/image-library.ts
      - tools/generate/src/cli/ai/fidelity-core.ts
      tip_evidence:
      - file: tools/generate/src/cli/picture.ts
        lines: 214-233
      - file: tools/generate/src/cli/picture.ts
        lines: 472-478
      - file: tools/generate/src/cli/ai/fidelity-surface.json
        lines: 126-128
      trust_boundary: false
---

# Fix Plan — Iteration 11

## Hypothesis
AC-2487 fails on two production gaps in the stored-picture path. First, `PictureEnvironmentError` (tools/generate/src/cli/picture.ts) is never translated to the surface's declared `ENVIRONMENT` code, so a deployment with no image store renders `Error: screenshot failed. this deployment…` with no code. Second, `storedImage`'s not-found refusal is the same on every host: on the `1c` CLI, which holds only the site namespace (`mergeImageLibraries({ site })` in tools/generate/src/cli/ai/host.ts:252), it still points the model at "the name it appears under in the Library" instead of saying the host holds no Library.

## Analysis
- **The one failure is new.** AC-2487 was created on 2026-11-08 by reconciliation plan item 4 (REQ-218, REPORT-11609). Its UAT, `tests/reconciliation-assistant-sees-a-stored-picture.test.ts:593`, was written by COMMENT-8044, which predicted this failure and named both causes. No earlier fix_plan (REPORT-6785…REPORT-11599) or batch_fix_assessment touched AC-2487, so no hypothesis has been repeated. The iteration-9 AC-2479 fix (REPORT-11604, interact.ts) is green: AC2477–AC2482 all pass in REPORT-11611.
- **What fails** (REPORT-11611, 41 of 42 pass):
  1. Line 617 (soft): `env` does not match `/^Error: screenshot failed \(ENVIRONMENT\)/`. The sentence "there is no image store wired to it … carry on with what you can do" is present, and only the code is missing.
  2. Lines 636–638 (soft): the CLI's Library-name refusal lacks "no Library" and "only the site's own assets", and still contains "the name it appears under in the Library".
  - The rest of the test passes: the `original: true` label, Worker Library resolution, and CLI site-asset resolution.
- **Reference state** (`reconcile-src-BUNDLE-42`):
  - picture.ts:222-233 defines `PictureEnvironmentError` and `NO_IMAGE_STORE` without a code. Its own doc comment (picture.ts:214-221) says it is "exactly what the surface's `ENVIRONMENT` refusal already means for a deployment with no browser".
  - fidelity-surface.json:126 declares `ENVIRONMENT` as "no browser configured … or no image store to hold the pictures".
  - The no-store path at picture.ts:502 throws the uncoded error.
  - picture.ts:472-478 has one not-found sentence for all hosts.
  - Nothing at the reference contradicts the AC. The reference is unfinished, not deciding the other way.
- **Intent (rung 1).** REQ-218 (request-1f64eecf) is in this bundle's scope:
  - "The local builder answers for the site's own assets and says it holds no Library." EPIC-1 accepted this: "Answering for site assets and saying plainly that it holds no Library is the honest shape."
  - On the no-store case: "Each says which, the same way a deployment with no browser says it cannot take pictures." That is the `ENVIRONMENT` refusal.
  - So the AC states the latest intent in scope, and the code must change. Reconcile mode freezes code, so this batch carries a rung-1 `code_frozen` override.
- **Where the code is assigned.** Picture errors reach the model as coded refusals: `PictureSourceError` becomes `PICTURE_INVALID` and `PictureNotFoundError` becomes `NOT_FOUND`, as AC2028, AC2033 and AC2484 show passing. The builder must find the mapping that assigns those codes and add `PictureEnvironmentError` → `ENVIRONMENT` there. It must not invent a parallel path.
  - For the Library wording, the refusal has to know whether this deployment holds a `library` namespace. The natural seam is `mergeImageLibraries` (image-library.ts:142), which already knows its parts. The Worker (router.ts:339 passes `site` and `library`) must keep today's wording, which AC2484 pins.
- **No isolation or contamination signal.** The test fails deterministically on assertion text, and there is no history of it passing in isolation.

## Spec Changes Made
none

## Weak Evidence Flags (preventative — best effort)
- tests/reconciliation-assistant-sees-a-stored-picture.test.ts::test_UAT_AC2487_… — weak-observation — the `original: true` half asserts identical bytes and a label only. That cannot tell a resolver that ignores `original` from one that honours it. Acceptable until REQ-219, but the comment should say so.
- tests/reconciliation-assistant-sees-a-stored-picture.test.ts (AC2026/AC2027/AC2028 duplicates) — duplicate coverage — COMMENT-8044 notes these three ACs now have two UATs each, across this file and reconciliation-assistant-looking-surface.test.ts. Consolidate them when either file is next edited.

## Batches
One batch, one failing test. It covers both production gaps, which share picture.ts and the stored-picture refusal path. The batch also keeps the neighbouring stored-picture, picture-vocabulary and Worker looking-surface ACs green, because they assert on the same refusal strings and codes:
- AC2484 pins the Worker's not-found wording.
- AC2028 and AC2033 pin PICTURE_INVALID.
- AC2024 and AC2025 pin the no-browser and Worker paths.

## Mode overrides (REQ-892)
- Batch 0, `code_frozen`, rung 1.
  - Files: tools/generate/src/cli/picture.ts, tools/generate/src/cli/image-library.ts, tools/generate/src/cli/ai/fidelity-core.ts.
  - Justification: REQ-218, in scope and EPIC-1-accepted, requires the CLI host to say it holds no Library, and requires the no-image-store deployment to refuse the way the no-browser one does (ENVIRONMENT). The reference leaves both unimplemented and does not decide the other way.
  - Dependency tests: every AC whose tests exercise the picture resolver and its refusals.

## Resolution ladder (REQ-938)
- **Batch 0 is decided at rung 1.**
  - REQ-218's sentences "The local builder answers for the site's own assets and says it holds no Library" and "Each says which, the same way a deployment with no browser says it cannot take pictures" require both behaviours.
  - Rung 2 agrees: fidelity-surface.json:126 already declares ENVIRONMENT for "no image store", and picture.ts:214-221 says the class means ENVIRONMENT. Only the wiring is missing (picture.ts:222-233, 472-478, 502).
  - Rung 3 is not needed. The test stands unchanged.
