---
uid: report-79a6c3ef
id: REPORT-11384
type: report
title: 'Reconciliation Review: commits'
created_by: xgd
created_at: '2026-11-08T09:32:03.066405+00:00'
updated_at: '2026-11-08T09:32:03.066405+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: reconciliation_review
  subject_uid: bundle-c0301347
  anchor_uid: bundle-c0301347
  overrides_audited: 2
  trust_boundary_overrides: 0
  override_misjudged:
  - report_uid: report-7519d965
    rule: code_frozen
    batch_index: '0'
    reason: 'Items 4 and 6, the same as report-ccc38228, report-71747060 and report-ab4c1f17.
      The planner stated ''No test or AC changes'', and `files` names only apps/control-app/src/ai.ts.
      The recorded diff also edits tests/test_UAT_FC_REQ-146_worker_ai_boundary.test.ts
      (since reverted: it no longer differs from main) and tests/support/scripted-model-client.ts
      (systemText(), still at HEAD and imported by 11 test files). The input has not
      changed since report-ab4c1f17: the commits since then touch only workflow tickets,
      and no waiver is recorded. Only an operator waiver of report-7519d965 clears
      this; no builder or matrix fix can.'
  gaps: []
  needs_operator_waiver: report-7519d965
---

# Reconciliation Review: Story Coverage

**Result**: FAIL (override audit only)
**Mode**: commits
**Surface**: 
**Anchor**: bundle-c0301347
**Stories Reviewed**: 6 (story-7d255580 STORY-168, story-58b2cec4 STORY-157, story-a58a0974 STORY-103, story-4cabde9a STORY-141, story-39c992d3 STORY-172, story-d2bee21c STORY-173), plus story-3cf3d57b (STORY-149) and story-7b1025b8 (owner of AC-2409), which the plan touches.

2 overrides audited, 0 touched a trust boundary.

This is the fourth review of this bundle. The only commits since report-ab4c1f17 (09:01Z) are workflow tickets: fix_plan, batch_quality_check and comment reports, and session-field updates on the bundle. There is no change to stories, ACs, tests or production code, and no waiver of report-7519d965. Assessment must be deterministic, so the verdict matches report-ab4c1f17. I re-checked the evidence independently where I could, as listed below.

## Behavior Inventory

There are 34 behaviours across the 11 bundled commits, as listed in the plan's behaviour inventory: mail 6, looking surface 4, priming 7, describer 4, image generation 7, drawing measurement 7. I checked the intent sections directly: REQ-205 Acceptance and As-built, REQ-182 Implementation scope and As built, and BUG-65 Required behaviour, What changed and Test plan.

## Coverage Map

| # | Behavior | Coverage | Story | Notes |
|---|----------|----------|-------|-------|
| 1 | Derived text part; every href survives; anchor whose words are its URL renders once; style/script/head/title dropped | Covered | story-7d255580 | AC-2369, AC-2281 |
| 2 | A body from which no text can be derived is refused by both adapters before any network call | Covered | story-7d255580 | AC-2370 |
| 3 | Per-template sender with MAIL_FROM fallback, resolved once per send so message and record agree; modal is display-only; route ignores a POSTed `from` | Covered | story-7d255580 | AC-2371, AC-2282; blank `from` recorded as a Reconciliation Decision |
| 4 | MAIL_FROM display name; invite seed names invite@ | Covered | story-7d255580 | AC-2279, AC-2286 |
| 5 | REQ-199's invite-sender pin retracted | Covered | story-7b1025b8 | AC-2337 superseded (superseded_by bundle-c0301347); AC-2409 active |
| 6 | Looking surface mounted per business on the Worker; absent browser or bucket is an ordinary state | Covered | story-58b2cec4 | AC-2372, AC-2024 |
| 7 | 40 browser looks per session, counted at the lease | Covered | story-58b2cec4 | AC-2373 |
| 8 | Screenshots reach the model as image content blocks through the Toolbox on both hosts | Covered | story-58b2cec4 | AC-2031 |
| 9 | Priming as configuration (line lists, templates, two declared orders, start-up validation) | Covered | story-a58a0974 | AC-2374 |
| 10 | One trailing cache boundary; landscape read once per session | Covered | story-3cf3d57b | AC-2376 |
| 11 | Null provider drops its entry and separator; 60k budget; overflow names the entry | Covered | story-a58a0974 | AC-2375, AC-2109 |
| 12 | Empty product tier; no transcript-pointer claim | Covered | story-a58a0974 | AC-2107 |
| 13 | No document id or title in priming; added or demoted documents follow the build | Covered | story-3cf3d57b | AC-2377 |
| 14 | Image describer runs as a tool-less session per item; distinct registration | Covered | story-4cabde9a | AC-2097, AC-2378; AC-1692 superseded |
| 15 | create_image, optional credential, material fields at create and attach, origin=generated, scoped store, cap of 10, vendor-free errors | Covered | story-39c992d3 | AC-2379 to AC-2392 |
| 16 | Anchor set, measure_drawing, relate, solve, assert, browserless refusal, authoring rules | Covered | story-d2bee21c | AC-2393 to AC-2408 |

## Ungrounded Stories

None found.

## Supersession (Step 4c)

REQ-205 explicitly supersedes REQ-199's invite-sender pin. AC-2337 is `superseded` with superseded_by_uid bundle-c0301347. The single-From AC (AC-2279) and the HTML-only AC (AC-2281) were rewritten in place, and the story records why under Reconciliation Decisions. BUG-65's retired REQ-171 document-naming claim is retired, and AC-2107 and AC-2109 are rewritten. No AC that pins retracted behaviour is still active.

## Evidence (Step 5b)

- Every in-scope active AC has a test_UAT_AC{N}_ UAT; I counted them per AC in tests/. AC-2364 (STORY-149) is `pending`, not active, and was not added by this plan.
- The latest scoped quality report, report-1606db71, passed 224 tests with 0 failures.
- I grepped the in-scope UAT files. The only doubles are console.log capture, a globalThis.fetch spy (the external provider boundary) and scripted model clients. No repository code is mocked.
- Known weak-evidence flags, advisory only: the REQ-209 browser UATs skip themselves when Chromium is absent, and the gate filter's underscore prefix misses hyphen-named FC suites.

## Plan Item Accounting

| Plan Item | Expected Story | Status |
|-----------|---------------|--------|
| 1. Outgoing Mail | story-7d255580 | ✓ |
| 2. Looking surface | story-58b2cec4 | ✓ |
| 3. Session priming | story-a58a0974, story-3cf3d57b | ✓ |
| 4. Material description | story-4cabde9a | ✓ |
| 5. Generated pictures | story-39c992d3 (STORY-172) | ✓ |
| 6. Drawing geometry | story-d2bee21c (STORY-173) | ✓ |

## Mode Override Audit

**report-483291fe** (story-39c992d3, code_frozen, imagegen.ts): **PASS**.
- Item 1: unnamed_files_touched is empty, and files_touched is the named file only.
- Item 2: the batch gates passed, and report-1606db71 passed 224 tests with 0 failures.
- Item 3: REQ-208 requires that the model never learns the vendor, which is what AC-2380 asserts.
- Item 4: the change is confined to imageSurface() and the vendorless() wrapper. It does not touch the framework plugin, ai-imagegen.js or the AC-2380 test.
- Item 5: trust_boundary_touched is false.
- Item 6: rung 1. Only the named file is edited, and the declared sentence and the ratio list are kept.

**report-7519d965** (story-4cabde9a, code_frozen, ai.ts): **MISJUDGED**, on items 4 and 6.
- The planner's scope said 'No test or AC changes', and `files` is ['apps/control-app/src/ai.ts'].
- The recorded diff also edits tests/test_UAT_FC_REQ-146_worker_ai_boundary.test.ts and tests/support/scripted-model-client.ts. The in-loop conformance verdict was also `fail`.
- At HEAD, the production change is in place and correct: ai.ts:195 registers the backend with ClaudeAPIBackend.capabilities, as AC-2097 and AC-2378 require.
- The REQ-146 edit is reverted (0 diff lines against main). systemText() is still present and is used by 11 test files.
- The override report is a historical record, and no builder or matrix edit can change it.

## Judgment Calls

- The audit checklist is mechanical and its input is unchanged, so this verdict deliberately repeats report-ab4c1f17. Passing now without a recorded waiver would make the assessment non-deterministic.
- Fix pass report-805ca13f recorded progress_made=false, and fix plan report-5c5e9f1b says the same. Another fix cycle cannot make progress.
- **Operator action required:** waive report-7519d965. With that waiver this review would PASS. Coverage, fidelity, supersession, evidence and plan accounting are all clean.

## Verdict

FAIL. The stories accurately and completely document the bundle's intent and behaviour, and the UAT evidence is sufficient. The only failing item is the misjudged code_frozen override report-7519d965 (items 4 and 6). That needs an operator waiver, not another fix pass.
