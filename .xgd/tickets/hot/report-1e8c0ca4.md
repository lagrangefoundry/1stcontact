---
uid: report-1e8c0ca4
id: REPORT-2484
type: report
title: 'Fix Site Storage Port: One Async Store Behind Every Edit (uat) — attempt 5'
created_by: xgd
created_at: '2026-08-20T17:39:15.005766+00:00'
updated_at: '2026-08-20T17:39:15.005766+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-c4c7a854
  level: uat
  fixes_applied: 0
  progress_made: false
  needs_more_work: true
  violations_remaining: 5
  anchor_report_uid: report-2485c83c
---

# Fix Summary — Site Storage Port: One Async Store Behind Every Edit (uat)

**Attempt**: 5
**Fixes applied this call**: 0
**Violations remaining**: 5 violations + 3 warnings (findings 1–8, unchanged)
**Needs more work**: true
**Progress made**: false — deliberate, see "Loop declaration" below

## Loop declaration

`needs_more_work=true, progress_made=false` is set intentionally to trigger the
designed exit-to-operator in the loop-semantics table. All eight actionable findings
(1–8) are gated by needs_review finding 9, which is an operator decision this role
cannot take. This is the fifth consecutive pass to reach that conclusion and the
fourth fix loop to apply zero findings.

**No mutation was applied because none is legitimately available on this branch** —
not because the findings are disputed. Every one of findings 1–8 is correct on its
merits and should be applied wherever the repair lands.

## The blocker, re-verified from source this pass

REPORT-2483's blocking claim was **not** taken on trust. Re-derived independently:

| Check | Result |
|---|---|
| `git rev-parse HEAD` | `2332195ec` (ticket bookkeeping only) |
| `git rev-parse main` | `bda6c9939` |
| `git merge-base HEAD main` | `0f44ef1ba` |
| `ls tools/generate/src/store/` (here) | `base diff fsutil history index loadSite paths snapshot` |
| `git ls-tree main tools/generate/src/store/` | adds `assemble.ts`, `fs-store.ts`, `journal-model.ts`, `memory-store.ts`, `site-store.ts` |
| storage tests here | `req22-storage.test.ts` only |
| storage tests on `main` | `reconciliation-site-storage-port.test.ts`, `…workers.test.ts`, `test_UAT_FC_REQ-14{1,2}_*` |

All eight findings resolve to `uat-add` / `uat-edit` against
`tests/reconciliation-site-storage-port.test.ts`, which does not exist in this
worktree, and would import five modules that do not exist here either.

## New this pass — the blocker is stronger than "the file is missing"

Attempts 1–4 recorded that the tests would fail at collection. That understates it.
Verified directly:

- **this tree**, `tools/generate/src/cli/edit.ts:1` → `import { copyFileSync, writeFileSync } from 'node:fs'`
- **`main`**, same file → no filesystem import at all

So AC-1353's first bullet ("the module carrying the editing surface names no runtime
filesystem or path module") is **false in this tree**, not merely unevidenced.
`test_UAT_AC1353_*` authored here would be a **correct true-positive red** against
this branch's code — a genuine failure, not an artifact — injected into the one
branch whose sole purpose is to gate a fast-forward of `xgd-stable`. The four prior
refusals were right, and for a stronger reason than they recorded.

## Workarounds eliminated on principle — recorded so attempt 6 does not re-derive them

| Candidate | Why rejected |
|---|---|
| Author the tests behind a conditional skip / try-catch dynamic import so they no-op when the modules are absent | Violates CLAUDE.md "No Legacy Modes or Backward Compatibility" (no auto-detect, no fallback path), and manufactures fake coverage: a skipped test would let `uat_coverage: pass` be claimed while proving nothing. Strictly worse than the recorded gap. |
| Bulk-set `uat_coverage` on the 11 ACs to record five passes of adjudication | Out of scope for `fix_structural_validation`. `uat_coverage` is owned by the `check_uat_coverage` / `fix_uat_coverage` stage of `capability_validation_cycle` (`xgd_source/cli/workflows/definitions/capability_validation_cycle.yaml:108-117`). Writing it here would corrupt a downstream stage's signal. |
| Revert the ac-level edits that created findings 1–5 | The assessor deliberately categorized all five as `uat-*`, meaning the AC edits are correct and the tests must catch up. Reverting is the forbidden "fall back to a weaker lever". |

## Ready-to-apply repair specification (for option (c))

Everything below is actionable and runnable on any branch at or past `b18b859d7`.
Order is the assessor's: deletion first, then extensions, then new tests.

| Order | Finding | File | Action |
|---|---|---|---|
| 1 | 4 | `tests/reconciliation-site-storage-port.test.ts:585-590` | **Delete** the freshness assertion AC-1327 explicitly disowns (it duplicates CAP-85 / AC-1033, whose own UAT is at `tests/reconciliation-builder-request-time-render.test.ts:271`). Also drop its scaffolding: the `'Before'` argument at `:563` and `toContain('Before')` at `:571` collapse to a plain `seedWithPalette()`. |
| 2 | 3 | same, `:135-143`, `:176-184`, `:144` | Extend the `asked` array from 7 verbs to all 10: add `appendChange`, `changesSince`, `pendingChanges` over both backends, held and unheld, and add all three to the `toBeInstanceOf(Promise)` list. |
| 3 | 5 | same, `:595` | Add a scan over routed test sources asserting no behavioural assertion branches on the executing runtime, excluding the AC-1328-owned probes by name (`reconciliation-site-storage-port.workers.test.ts`, `test_UAT_FC_REQ-141_workers_runtime.workers.test.ts`, `test_UAT_FC_REQ-141_project_routing.test.ts`). |
| 4 | 1 | same, new test | `test_UAT_AC1353_the_editing_surface_and_the_port_import_no_filesystem_module` — lift the two assertions from `tests/test_UAT_FC_REQ-142_site_store_port.test.ts:105,115`, **plus the missing third bullet**: `fs-store.ts` is the only filesystem importer and sits behind its own entry point. Name the offending module on failure (the FC version already does this via `expect(source, name)`). |
| 5 | 2 | same, new test | `test_UAT_AC1354_each_entry_point_names_its_store_once_and_the_tool_adapter_edits_through_it` — assert the three construction sites are singular (`cli/index.ts:1313`, `cli/builder.ts:628`, `cli/ai/toolbox.ts:505`) and nothing beneath selects; then drive `l1Operations(slug, { store: memorySiteStore() })` (`cli/ai/toolbox.ts:176` — takes `EditOptions`, reachable without the AI runtime) for a copy edit reading back with the count advanced, `add_asset` landing bytes, and `add_asset` on a missing source asserting `NOT_FOUND` + path + hint identical to `…test.ts:528-532`. |
| 6 | 6,7,8 | same | Cheap once their host tests are open — see REPORT-2483's table. |

**Do not** target `createL1Toolbox` (`cli/ai/toolbox.ts:505`) for finding 2: it spreads
`opts` then overrides `store`, which looks like a violation but is exactly what AC-1354
requires. The injectable seam is one level down at `l1Operations`.

## Code Edits

None this call.

## needs_review Items Forwarded

| Element | Assessor said | Operator decision needed |
|---|---|---|
| `capability-c4c7a854` (finding 9) | All 8 findings are `uat-*` against a test file that landed on `main` at `b18b859d7` (2026-08-20 12:49 UTC), **11h38m after** regression `cb0dad9c` was anchored and its branch cut at `0f44ef1ba` (00:43 UTC). | Choose one: **(c) recommended** — run `check_uat_validation` + `fix_uat_validation` for this capability on a branch at or past `b18b859d7`, where all eight are actionable and runnable; **(b)** scope `capability-c4c7a854` out of regression `cb0dad9c` (relocates only the repair — this pass's check is sound and reusable); **(a)** resync `regression-cb0dad9c` past `b18b859d7`, which changes what the regression tests mid-run. |

## Convergence note

A sixth iteration against this tree will reproduce this report. The loop cannot
converge without the operator decision above. The assessment in REPORT-2483 is sound
and branch-independent — tickets are global — so it is directly reusable wherever the
repair lands; only the eight test-side edits need a branch that carries the code.
