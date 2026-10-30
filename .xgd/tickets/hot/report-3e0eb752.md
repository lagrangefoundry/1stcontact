---
uid: report-3e0eb752
id: REPORT-6887
type: report
title: Claude batch_fix_assessment report
created_by: xgd
created_at: '2026-10-30T19:14:59.544710+00:00'
updated_at: '2026-10-30T19:14:59.544710+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: batch_fix_assessment
  subject_uid: story-e15a19ef
  parent_report_uid: report-d412b1c1
  batch_index: '0'
---

I fixed `test_UAT_AC720_sandbox_reproduction_emits_a_non_empty_set_of_crop_pairs`, but I couldn't watch it pass: Chromium won't launch in this sandbox, so the test skips here.

**Cause.** The test's fixture built the reference screenshot (`screenshot-1280.png`) with `await import('sharp')`. REQ-156 took `sharp` out of the tool's dependencies, and here `require.resolve('sharp')` gives `MODULE_NOT_FOUND`. So wherever Chromium runs, the test died while building its fixture, before reaching `cmdRepro` or `cmdAlignedCrops`. The production code was not at fault.

**Fix (test only; no production code touched).** In `tests/reconciliation-1c-aligned-crops-sandbox-routing.test.ts`, the fixture now builds the same solid 1280×1200 RGB image (#e8dfd3) with the repo's own `encodePng` from `tools/generate/src/cli/png.ts` and writes it to disk. `aligned-crops.ts` reads that file with the same codec's `decodePng` (line 175), so the fixture now matches what the code expects. All assertions are unchanged: crops come from the sandbox tree, nothing appears under `sites/`, the anchor appears in `areas`, and both crop PNGs plus the index exist on disk.

**What I checked:**
- The file runs here: the AC720 routing test passes and the Chromium test skips. That shows the edited file loads and runs, but it does not exercise the fixed fixture.
- My attempt at a standalone `encodePng` → `decodePng` round-trip check was blocked by the session's permission mode, so the fixture's output is unverified.
- I couldn't lint the file: `eslint` isn't installed locally and npm's registry is blocked. My type-check pointed at a `tsconfig.json` that doesn't exist (only `tsconfig.base.json` is there), so it checked nothing.

The routing behaviour (`subRenderOptions` passed to both `cmdRender` and `startServe`) still matches the AC, so I left the AC and the story alone. I didn't commit; the reconcile run handles commits. Final confirmation needs the quality run, which has Chromium.

```yaml
## Assessment
status: fixed
failure: test_UAT_AC720_sandbox_reproduction_emits_a_non_empty_set_of_crop_pairs
root_cause: "The test fixture imported `sharp` to write the reference screenshot; sharp was removed as a dependency (REQ-156) and no longer resolves."
change: "tests/reconciliation-1c-aligned-crops-sandbox-routing.test.ts — the reference PNG is now built with the in-repo encodePng (tools/generate/src/cli/png.ts); all assertions unchanged."
production_code_modified: false
upstream_ticket_changes: none
verification_limits: "Chromium can't launch in this sandbox, so the browser test was skipped locally rather than run. A standalone encodePng/decodePng round-trip check was blocked by permission mode; eslint wasn't available (no local install, registry blocked); the tsc check found no tsconfig.json and checked nothing."
```
