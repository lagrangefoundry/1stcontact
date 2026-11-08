---
uid: report-8ee9771c
id: REPORT-11425
type: report
title: 'Code Review: bundle-c0301347'
created_by: xgd
created_at: '2026-11-08T12:10:06.248371+00:00'
updated_at: '2026-11-08T12:10:06.248371+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: code_review
  subject_uid: bundle-c0301347
  overrides_audited: 2
  trust_boundary_overrides: 0
  failure_class: infrastructure_quality_gate
  anchor_uid: bundle-c0301347
---

# Code Review

**Result**: FAIL

## Summary
The free-coded implementation (mail text part and sender, Worker looking surface, priming as configuration, image describer session, image generation, drawing measurement) is wired in, clean, and consistent with the stories. Both code_frozen overrides pass the audit. The review fails only on the quality gate: the latest quality report (report-cf6999fa, 2026-11-08T11:59:14Z) is overall=failure because the javascript-vitest suite executed 0 tests. The cause is the environment, not the code: the filtered UATs (AC2412, AC1493, AC1494, AC1495, AC1736) run in the Workers pool, which must bind 127.0.0.1, and the sandbox denies that (reproduced: `listen EPERM: operation not permitted 127.0.0.1`). AC-2412's UAT has therefore never executed.

## Quality Gates
- Lint: reported success, but duration was ~0.0001s, so it effectively did not run.
- Build: reported success, but 'No tsconfig.json — type-check skipped'. Manual type-check: apps/control-app and packages/site-schema are clean. tools/generate has TS7016/TS7006 errors in identity.ts, names.ts, people.ts and router.ts:67; the router import is unchanged from main and the other files are not touched by this branch.
- Tests: **FAIL**: 0 tests executed (infrastructure_bug, Quality Config suite). The prior scoped run report-8469451e (commit c3d9fd34, after both overrides) was 244 passed, 0 failed, 0 skipped, but it did not include test_UAT_AC2412_*. Spot run here: 4 bundle UAT files (REQ-207, REQ-182, image-generation-deploy, REQ-209 measure) ran 45 tests, all passed.
- Coverage: not reported.

## External Interface Accessibility
New entry points wired in: yes.
- imageSurface is used by router.ts:38/251.
- measure_drawing/relate/solve are registered in toolbox-core.ts:482 and l1-surface.json:776.
- anchors is exported from packages/site-schema/src/index.ts:35.
- generatedMaterialStore is used within imagegen.ts.
- The removed @anthropic-ai/sdk dependency (9b2511cc93) has no remaining importers.

## Code Quality
| File | Finding | Severity |
|------|---------|----------|
| apps/control-app/src/imagegen.ts:266-323 | vendorless()/replaceIgnoringCase are small, documented, and composed at the one place the plugin is built | OK |
| apps/control-app/src/ai.ts:189-195 | Backend registered with declared capabilities, with an explanatory comment | OK |
| changed src (all) | No console.log/debugger/TODO/FIXME added | OK |
| .xgd/quality.yaml | Deleted on branch by sync_main (96abb3eb26). It is a main-only path the tool restores at merge_back; confirm it is present on main at the merge gate | Warning |
| tools/generate tsconfig | Type errors outside this bundle | Warning (existing debt) |

## Checklist Compliance
No architecture, security or design checklist reports exist, so this section is skipped.

## Smoke Test
Entry points tested: bundle UATs exercising create_image, the describer session, priming configuration, measure_drawing and the deploy hook (45 tests passed). Workers-pool entry points could not be run here: EPERM on local port binding.

## Mode Override Audit
2 overrides audited, 0 touched a trust boundary.

- **report-483291fe** (code_frozen, imagegen.ts, rung 1): items 1-6 pass.
  - Only imagegen.ts changed.
  - The scoped run is green.
  - The scrub satisfies REQ-208/AC-2380 and keeps the declared sentence and the ratio list.
  - It stays within the planner's scope (composed in imageSurface).
  - It touches no trust boundary.
  - It adds no behaviour beyond what the AC demands.
- **report-7519d965** (code_frozen, ai.ts, rung 2): items 1-6 pass.
  - unnamed_files_touched is empty and the production diff is ai.ts:195 only.
  - The in-loop conformance finding is resolved. The REQ-146 UAT edit was reverted in 6fcf97c2dc, and git diff main..HEAD on that file is empty.
  - The remaining test-support helper systemText is not governed by code_frozen. It is imported by the in-scope FC UATs for REQ-206, REQ-207 and REQ-208 and by reconciliation-consultant-image-generation, so it is needed for them to compile.
  - Passing capabilities is exactly what AC-2097/AC-2378 require.
  - It touches no trust boundary.

## Issues Found
**Critical (must fix)**:
- The quality gate failed: the scoped suite executed 0 tests (report-cf6999fa). test_UAT_AC2412_material_and_reference_carry_the_same_six_part_rights_and_provenance_statement (tests/reconciliation-material-types.workers.test.ts:273) and the AC1493/1494/1495/1736 UATs have no executed evidence. This is an environment failure, not a code defect.

**Warnings (should fix)**:
- Lint and build report success without doing work (lint ~0.0001s; tsc skipped for lack of a root tsconfig). Gate evidence is hollow.
- tools/generate has type errors in files outside this bundle.
- Confirm .xgd/quality.yaml is present on main at the merge gate.

## Fix-It Prompt
Do NOT change production code or tests; the review found no code defect. The only failure is the quality gate: the Workers-pool UATs could not start because the sandbox denies binding to 127.0.0.1 (EPERM). Re-run the scoped quality check (`xgd quality run`) in an environment that allows local port binding (for example sandbox.network.allowLocalBinding: true), with the filter test_UAT_AC2412_, test_UAT_AC1493_, test_UAT_AC1494_, test_UAT_AC1495_, test_UAT_AC1736_. Done means the suite executes more than 0 tests and all pass. If test_UAT_AC2412_* then fails, the expected fix is in tests/reconciliation-material-types.workers.test.ts (the retarget in 97ab3d1192), since tickets.ts:89 already accepts origin 'generated' for both kinds. If the environment cannot allow port binding, escalate to the operator; the builder cannot resolve it.
