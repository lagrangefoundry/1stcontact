---
uid: report-4ac04d1b
id: REPORT-3684
type: report
title: 'Fix Site Storage Port: One Async Store Behind Every Edit (uat) — attempt 2'
created_by: xgd
created_at: '2026-09-10T06:48:21.714974+00:00'
updated_at: '2026-09-10T06:48:21.714974+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-c4c7a854
  level: uat
  fixes_applied: 9
  progress_made: true
  needs_more_work: false
  violations_remaining: 0
  anchor_report_uid: report-e37a6b4a
---

# Fix Summary — Site Storage Port: One Async Store Behind Every Edit (uat)

**Attempt**: 2
**Fixes applied this call**: 9
**Violations remaining**: 0
**Needs more work**: false

All four findings (1 violation, 3 warnings) are resolved, and the resolution is the one
report-14ca0c44 asked for: the retired fact was removed rather than re-explained. Finding 4's
opportunistic move was attempted, ran green over the cloud adapter in workerd, and is kept — so
AC-1385 no longer declares an exception at all.

## What was actually checked before writing any replacement text

The previous attempt's failure mode was authoring the replacement from the AC's own paragraph.
This pass read the tree first:

- `tools/generate/src/cli/preview.ts:88-95` — `PreviewRenderer` takes a `SiteStore` and nothing
  else; the constructor comment records REQ-148 removing the Astro container and module resolver.
- `tools/generate/src/cli/preview.ts:107-129` — `file()` reads `store.loadDraft`, `store.readAsset`
  and `MIME`. No filesystem, no transform.
- `tools/generate/src/store/site-store.ts:164-250` — the `SiteStore` interface has no render verb.
  This is the *true* reason the two render questions sit outside `askStorageQuestions`' compared
  vector, and it is a property of the port, not of a runtime.
- `tests/reconciliation-cloudflare-site-store.workers.test.ts` (AC-1395) and
  `tests/reconciliation-cloudflare-store-draft-reuse.workers.test.ts:178-192` (AC-1447) — the
  render already runs inside workerd over D1/R2.

Then the claim was tested rather than argued: the two preview cases were moved into the shared
contract body and the workers project was run.

**Result — the cloud adapter answers both render questions:**

```
✓ |workers| tests/test_UAT_FC_REQ-143_d1r2_store.workers.test.ts >
    REQ-143 — the D1/R2 SiteStore > over the D1/R2 store >
    test_UAT_AC1385_the_draft_renders_from_whatever_store_served_it 12ms
✓ |workers| … > test_UAT_AC1385_a_preview_asset_comes_back_as_bytes 11ms
```

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| 1 | ac-edit | AC-1385 (acceptance_criterion-0d6bc58c) | Rewrote the "Named exception" paragraph. It no longer claims a build transform or a Workers-runtime restriction. It now states the true shape: the render questions are named apart from the compared answer vector because rendering is not a verb the port has (the renderer is a consumer of the store, and its answer is an artifact, not a comparable value), and they are asked of **all three** adapters. Verification section extended to describe how. No assertion in `test_UAT_AC1385_…` was changed. |
| 2 | ac-edit | AC-1385 | Title updated: "…with the render cases a named exception" → "…the render included". The old title contradicted the repaired body. |
| 3 | uat-add | AC-1385 → `tests/support/site-store-contract.ts:345-370` | Moved the two preview cases into `describeSiteStoreContract` under mandated names (`test_UAT_AC1385_the_draft_renders_from_whatever_store_served_it`, `test_UAT_AC1385_a_preview_asset_comes_back_as_bytes`). They now run once per adapter — filesystem, memory **and D1/R2 inside workerd** — which is the CAP-101 property ("one body of storage assertions run against all three"). Assertions unchanged from their node-suite originals apart from one comment word ("either adapter" → "any adapter"). |
| 4 | uat-edit | `tests/test_UAT_FC_REQ-142_site_store_port.test.ts:96-100` | Removed the relocated `describe.each` block and its stale rationale; replaced with a pointer recording that both former reasons (Astro's container API, then the filesystem) were false. Dropped the now-unused `PreviewRenderer` / `editAssetWrite` imports and the `fixture` helper they were the only users of. |
| 5 | uat-edit | `tests/support/storage-questions.ts:49-64` | Rewrote the `RENDER_QUESTIONS` doc comment — the carrier report-14ca0c44 finding 2 named as the one an editor reads first. States the port-shape reason, names AC-1395/AC-1447 as the evidence that every runtime renders, and points at where all three adapters are held to it. Astro kept as a parenthetical history. |
| 6 | uat-edit | `tests/support/site-store-contract.ts:49-59` | Replaced the "WHAT IS NOT HERE, AND WHY" block (finding 3's first carrier: "rendering reaches the filesystem, which workerd does not have", plus the "REQ-145's scope" deferral to work that has already landed) with "THE RENDER IS HERE TOO, NOW", describing what the module actually contains after fix #3. |
| 7 | uat-edit | `tests/reconciliation-cloudflare-site-store.test.ts:269-273` | Comment only, inside `test_UAT_AC1385_…`. "THE DECLARED EXCEPTION … answered here by both filesystem-hosted stores" → the render questions are named apart for the port-shape reason and are asked of all three adapters. No assertion touched, per the finding's instruction. |
| 8 | uat-edit | `tests/test_UAT_FC_REQ-143_d1r2_store.workers.test.ts:305-309` | Same retired fact, fifth carrier, found by sweeping for `build transform` / `container API` / `REQ-145's scope`: "the render needs Astro's container API and workerd has no transform for it". Reworded to state that equal `LoadedSite` means equal render in whichever runtime, citing AC-1395. |
| 9 | uat-edit | `tests/test_UAT_FC_REQ-143_render_store_independence.test.ts:11-22` | Sixth carrier: the file header justified its two-place split by "the render runs through Astro's container API, which workerd has no transform for" and deferred to REQ-145. Reworded — the split survives because `storage/sites/` is a host directory and D1 lives in workerd, which is true; the render is explicitly no longer the obstacle. Assertions untouched. |

Out-of-scope carriers left alone, as report-14ca0c44 directs: `tests/framework-content-modules.test.ts:14`,
`tests/generate.test.ts:21`, `tests/req33-verbatim-fidelity.test.ts:26`, `tests/req85-carousel.test.ts:9`
(other capabilities), and `tests/reconciliation-behavior-edge-runtime.workers.test.ts:18` (states the
Astro transform in the past tense, as history).

## Verification

Both Vitest projects, all suites this capability owns:

```
npm test -- tests/test_UAT_FC_REQ-142_site_store_port.test.ts \
  tests/test_UAT_FC_REQ-143_d1r2_store.workers.test.ts \
  tests/test_UAT_FC_REQ-143_render_store_independence.test.ts \
  tests/reconciliation-cloudflare-site-store.test.ts \
  tests/reconciliation-cloudflare-site-store.workers.test.ts \
  tests/reconciliation-site-storage-port.test.ts \
  tests/reconciliation-site-storage-port.workers.test.ts \
  tests/reconciliation-cloudflare-store-draft-reuse.workers.test.ts

Test Files  8 passed (8)
     Tests  99 passed (99)
```

Nothing regressed, and the two relocated cases pass over each of the three adapters.

## Code Edits (if any)

None. Every mutation is a ticket body/title or a test-side change (two relocated test cases and
five comment rewrites). No production file was modified.

## needs_review Items Forwarded

None.

## Note for the assessor

Findings 5–8 of report-14ca0c44 were `info` and asked for no change; none was made. In particular
`test_UAT_AC1447_…`/`test_UAT_AC1448_…` still assert object identity rather than equality (info #8),
and the `vitest.workers.config.mts` pool-version pin comment is untouched (the "deliberately not a
finding" item).

One consequence worth recording for the next alignment pass: AC-1385 is now proved by three tests,
not one — `test_UAT_AC1385_every_storage_question_answers_identically_over_all_three_stores` in the
node suite plus the two relocated contract cases, which run once per adapter in both projects. The
`uat_coverage` field was deliberately not touched; it belongs to the coverage check.
