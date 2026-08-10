---
uid: report-fcc6c760
id: REPORT-1776
type: report
title: Claude reconciliation_uat_generation report
created_by: xgd
created_at: '2026-08-10T09:14:50.084691+00:00'
updated_at: '2026-08-10T09:14:50.084691+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_uat_generation
  subject_uid: story-93905de4
---

All 12 UATs pass, verified to bite via mutation testing. Working tree shows one new file and nothing else touched.

## Two observations for the record

Both are places where an AC's prose is slightly wider than its own Verification block, and I followed the Verification (which is what the AC specifies as its test). Neither is a code defect — flagging so review can decide whether to tighten the AC wording:

**AC-1081** — the criterion says "No individual operation restates it." I asserted the *parameter*-level form (every address param is typed `l1_address` and carries no description of its own). I did not assert that operation descriptions never restate the rule, because `set_l1`'s own description does restate it as a workflow warning ("every address on the page is regenerated… read the map again" — `l1-surface.json`). The AC's Verification block asks only for the param-type + overview checks, which is what the test does.

**AC-1074** — "nor does the title of a group it was not granted." I asserted absence of the rendered heading form (`### Managing images and fonts`, `### Publishing`). The bare word "Publishing" does appear in the manual's overview, deliberately: `toolbox.ts` records that a caretaker which did not understand draft-versus-published would be worse, not safer. The heading-level assertion is the honest form of the claim.

## Completion Report

```
UATs generated for story story-93905de4 (plan item 6 of 8)

Story: story-93905de4
Test file(s) created:
  - tests/reconciliation-assistant-control-surface.test.ts

Tests written: 12
Tests passed: 12
Tests failed: 0

test_files_created:
  - "tests/reconciliation-assistant-control-surface.test.ts"
```

One UAT per AC, 1:1: AC1071 author-time validation of declaration+grant · AC1072 surface version distinct from format version · AC1073 declared set == callable set, write set closed and grouped · AC1074 declared-but-withheld operations · AC1075 read-only grant cannot reach a write · AC1076 schema validation before invocation · AC1077 refusal names code + published meaning · AC1078 provenance marking · AC1079 per-call audit · AC1080 manual as projection · AC1081 addressing rule stated once · AC1082 change lands via the one write path.

Verification notes:
- **Boundary**: every test drives the real `Toolbox` from `createL1Toolbox` (real declaration, real grant, real `edit.ts` writes, real audit sink to disk). Nothing mocks `edit.ts` or stubs the Toolbox; the shared artifact store is treated as a precondition, matching the existing FC suites.
- **AC1082** proves "no additional write route" by rewinding the draft and replaying the identical change through `editL1Set` directly, then asserting the draft is byte-for-byte what the surface produced.
- **Mutation check**: five deliberate mutations (wrong write-set, inverted read-only grant, capability-vs-schema rule, refuse-vs-allow outcome, divergent direct write) each failed the corresponding test, confirming regression protection rather than vacuous passes.
- **Regression scope**: `reconciliation-assistant-control-surface` + `REQ-126_l1_surface` + `REQ-122_tool_surface` + `reconciliation-assistant-conversation` → 42 tests, all passing.
- **Typecheck**: `tsc -p tsconfig.base.json` reports `Cannot find module '@1stcontact/site-schema'` for this file — pre-existing across 22 test files that import the same type (an artifact of running the base config directly rather than the per-package builds), not introduced here. Root `eslint` has no flat config, so no file-level lint run was available.

No runtime code was modified and no existing test file was touched.
