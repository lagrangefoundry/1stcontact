---
uid: report-84738adf
id: REPORT-11068
type: report
title: 'Report: fix_plan for story-179b8c06'
created_by: xgd
created_at: '2026-11-05T21:53:45.019824+00:00'
updated_at: '2026-11-05T22:25:26.089658+00:00'
completed_at: null
last_field_updated: batches_pending
result: pass
fields:
  report_kind: fix_plan
  subject_uid: story-179b8c06
  fix_iteration: 2
  items:
  - index: 0
    tests:
    - story-179b8c06 — account-chrome is gated by a site declaration test_UAT_AC2329_declared_site_publishes_every_state_and_undeclared_publishes_none
    dependency_tests:
    - test_UAT_AC2330_
    - test_UAT_AC2331_
    - test_UAT_AC2332_
    - test_UAT_FC_REQ-200_
    hypothesis: packages/site-schema/src/schema.ts siteCapabilitiesSchema is a non-strict
      z.object, so zod strips an unknown capability key (acounts) instead of rejecting
      it, contradicting REQ-200's closed record.
    instructions: 'AC-2329 is correct. REQ-200 (in scope) requires the capabilities
      record to be closed so a typo is a validation error, and the story already records
      the open record as a code issue. Make siteCapabilitiesSchema in packages/site-schema/src/schema.ts
      reject unknown keys, so validateSite on capabilities {acounts: true} returns
      ok=false with an issue naming the key, while an absent record and {accounts:
      true|false} still validate. Check that no committed site definition (e.g. storage/sites/1stcontact)
      carries any other capability key. Keep the account-chrome gating tests (AC-2330..2332)
      and the REQ-200 apex/session suite green.'
    test_scope: test_UAT_AC2329_declared_site_publishes_every_state_and_undeclared_publishes_none
      or test_UAT_AC2330_ or test_UAT_AC2331_ or test_UAT_AC2332_ or test_UAT_FC_REQ-200_
    ladder:
      rung1: REQ-200 (bundled in BUNDLE-38) states the capabilities record is closed
        so a typo is a validation error; this decides for the test.
      rung2: Reference schema.ts:1097-1107 is a non-strict z.object, i.e. the in-scope
        intent was never implemented, not a contrary intent.
      rung3: Not reached; the test stands and the code changes.
    override:
      rule: code_frozen
      rung: 1
      justification: REQ-200, an intent in scope, requires a closed capabilities record
        ('so a typo is a validation error'); story-179b8c06 records the open record
        as a code issue; AC-2329 encodes exactly that and is right, the non-strict
        schema is wrong.
      files:
      - packages/site-schema/src/schema.ts
      tip_evidence:
      - file: packages/site-schema/src/schema.ts
        lines: 1097-1107
      trust_boundary: false
  - index: 1
    tests:
    - REQ-93 — an L1 page hosts behavior modules in its slots test_UAT_AC1624_mounted_run_flags_a_container_overflow_on_the_responsive_dimension
    dependency_tests:
    - test_UAT_AC1622_
    - test_UAT_AC1623_
    - test_UAT_AC1400_
    - test_UAT_FC_REQ-145_
    - test_UAT_FC_REQ-93_
    hypothesis: tools/generate/src/cli/module-assets.ts composeModuleAssets splices
      every client.js into one module scope, so the duplicate top-level const ERROR_SELECTOR
      (contact-form, account-portal, account-chrome) makes capabilities.js a SyntaxError
      and every page raises a page error at every desktop width.
    instructions: 'AC-1624''s desktop arm is correct. The 4 violations are the page
      error from an unparseable capabilities.js, one per width (768/1024/1280/1440).
      Fix the composer, not the module constants: the reference state gives each behavior''s
      client.js its own block scope in the bundle and drops the statement-leading
      `export` that a block cannot contain (BUG-75). Renaming ERROR_SELECTOR is explicitly
      rejected there, because it only waits for the next collision. Then regenerate
      packages/framework/src/modules/module-assets.ts with `1c assets` so the committed
      MODULE_CLIENT_JS parses (verify with node --check on the extracted bundle).
      Do not add any page-error exception to the test. Keep the REQ-145 build-artifact
      suite (generated file matches its inputs) and the other REQ-93 slot tests green.
      If Chromium still reports violations after the bundle parses, print their text
      and fix what they name.'
    test_scope: test_UAT_AC1624_mounted_run_flags_a_container_overflow_on_the_responsive_dimension
      or test_UAT_AC1622_ or test_UAT_AC1623_ or test_UAT_AC1400_ or test_UAT_FC_REQ-145_
      or test_UAT_FC_REQ-93_
    ladder:
      rung1: No intent in scope speaks to how behavior client.js files are composed;
        not decided here.
      rung2: Reference tools/generate/src/cli/module-assets.ts:42-75 defines scopeBehaviorJs
        (block-wraps each behavior, strips export, citing the ERROR_SELECTOR collision)
        and uses it at line 122; this decides for the test.
      rung3: Not reached; the test stands and the code changes.
    override:
      rule: code_frozen
      rung: 2
      justification: The reference state composes each behavior's client.js in its
        own block scope (BUG-75), so the bundle parses; HEAD's plain join yields a
        duplicate-const SyntaxError that kills all client behavior on every page.
        AC-1624's clean desktop run is right and the composer is wrong.
      files:
      - tools/generate/src/cli/module-assets.ts
      - packages/framework/src/modules/module-assets.ts
      tip_evidence:
      - file: tools/generate/src/cli/module-assets.ts
        lines: 42-75
      - file: tools/generate/src/cli/module-assets.ts
        lines: 120-124
      - file: packages/framework/src/modules/module-assets.ts
        lines: 13-13
      trust_boundary: false
  batches_pending: false
---

# Fix Plan — Iteration 2

## Hypothesis
Both failures are frozen production defects: `siteCapabilitiesSchema` is not `.strict()` (AC-2329, REQ-200 requires a closed record), and `composeModuleAssets` concatenates every module's `client.js` into one scope, so the three top-level `const ERROR_SELECTOR` declarations make `capabilities.js` a parse error on every page (AC-1624). The reference state already scopes each behavior in its own block (BUG-75).

## Analysis
Iteration 1 was the mechanical plan with empty instructions. The builder (report-7b078d41, batch 0) made no edits and reported `blocked_by: code_frozen` for both tests, with concrete diagnoses. I checked both against the reference state `reconcile-src-BUNDLE-38`:

1. **AC-2329**: `packages/site-schema/src/schema.ts:1097-1107` at the reference is `z.object({ accounts: z.boolean().optional() })` with no `.strict()`, so the reference has the bug too. But REQ-200 is in scope (bundled in BUNDLE-38), and its "What was built" section says the record is "Closed rather than an open bag, so a typo is a validation error". Story-179b8c06 already records "Code issue: the capability record is not closed (contradicts REQ-200)". The Security Policy (§2, every object `.strict()`) agrees. **Rung 1 decides: the code changes.**
2. **AC-1624**: HEAD's `tools/generate/src/cli/module-assets.ts` pushes `/* behavior: id */\n${js}` straight into one module scope. At the reference (`tools/generate/src/cli/module-assets.ts:42-75`, used at line 122), `scopeBehaviorJs` wraps each behavior in `{ … }` and strips the leading `export`, and the doc comment names exactly this `ERROR_SELECTOR` collision (BUG-75). The generated `packages/framework/src/modules/module-assets.ts:13` at the reference starts `/* behavior: contact-form */\n{\n`. **Rung 2 decides: the code changes to scope each behavior.** Renaming the constants, which the builder proposed, is not what the reference does: the reference explicitly rejects renaming as a fix that just waits for the next collision.

No isolation or contamination pattern: both are deterministic code defects. The two fixes don't share files (site-schema vs the generate tool plus the generated asset file), and each needs a different rung on its override, so they go in two batches.

## Spec Changes Made
none

## Weak Evidence Flags (preventative — best effort)
- tests/test_UAT_FC_REQ-145_build_artifacts.test.ts — weak-observation — per the reference's BUG-75 note, it compares the generated file to its inputs but never parses the composed bundle; add a syntax parse of MODULE_CLIENT_JS so a collision fails here, not just in a browser UAT.
- tests/req93-l1-slot-mounted-behaviors.test.ts::test_UAT_AC1624_* — weak-observation (diagnosability) — on a ConformanceError, the desktop arm should print the violation texts so a sandbox without Chromium output can still diagnose.

## Batches
- **Batch 0 (AC-2329)**: make the site capabilities record closed so an unknown key such as `acounts` fails `validateSite`. Override code_frozen, rung 1 (REQ-200).
- **Batch 1 (AC-1624)**: give each behavior's client.js its own lexical scope in the composed bundle, then regenerate module-assets.ts. Override code_frozen, rung 2 (reference `scopeBehaviorJs`).

## Mode overrides (REQ-892)
- Batch 0: code_frozen; files: packages/site-schema/src/schema.ts. REQ-200 (in scope) requires a closed capabilities record, the story records the open record as a code issue, and AC-2329 is right.
- Batch 1: code_frozen; files: tools/generate/src/cli/module-assets.ts, packages/framework/src/modules/module-assets.ts. The reference composes behaviors block-scoped (BUG-75, lines 42-75 and 122). HEAD's plain join makes the bundle unparseable, so AC-1624's clean desktop run is right.

## Resolution ladder (REQ-938)
- Batch 0: rung 1 decided. REQ-200 "What was built": "so a typo is a validation error". The reference (schema.ts:1097-1107) does not settle it the other way: it simply hasn't implemented the in-scope intent yet.
- Batch 1: rung 2 decided. Reference tools/generate/src/cli/module-assets.ts:42-75,122 and packages/framework/src/modules/module-assets.ts:13 show per-behavior block scoping.