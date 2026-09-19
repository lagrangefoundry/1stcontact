---
uid: report-7d810b43
id: REPORT-4472
type: report
title: 'Fix implementation drift: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-19T15:15:01.784515+00:00'
updated_at: '2026-09-19T15:15:01.784515+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: fix_implementation_drift
  subject_uid: reconcile-BUNDLE-27
---

## Failing UATs addressed

- **`test_UAT_AC720_sandbox_reproduction_emits_a_non_empty_set_of_crop_pairs`**
  (Part B of `tests/reconciliation-1c-aligned-crops-sandbox-routing.test.ts`)
  - Owning intent: **`bundle-ab9e0cb6`** (via `acceptance_criterion` AC-720 →
    `story-e15a19ef` → `fields.intent_uid`).
  - Case: **2b** — the owning intent is EARLIER than the merging branch's
    anchor intent `bundle-8e1807f6` on the working timeline.
  - Implementation files edited: **NONE.** No implementation edit can make this
    UAT pass. Rationale below.

The suite's other 182 tests pass, including Part A of the same file
(`test_UAT_AC720_sandbox_store_routing_forwarded_to_render_and_serve`), so the
`subRenderOptions` routing seam that AC-720 pins is intact. Only the
browser-gated end-to-end leg fails.

## Timeline comparisons

`xgd working-timeline bundle-8e1807f6 bundle-ab9e0cb6`:

| | anchor (merging branch) | owner (failing UAT) |
|---|---|---|
| intent uid | `bundle-8e1807f6` | `bundle-ab9e0cb6` |
| timestamp | `1788302156` | `1784436798` |
| iso | `2026-09-01T22:35:56+00:00` | `2026-07-19T04:53:18+00:00` |
| n_commits | 11 | 1 |
| anchor_sha | `5c7cc72acc4de8678e746ed7dda56c49b8872e25` | `7a42e182267154217e2ab5494877d30eb24e7b79` |

`owner_ts (1784436798) < anchor_ts (1788302156)` → **case 2b**.

## Root cause — why this is not fixable at the implementation layer

The failure is **not** semantic drift between the merging branch's behaviour and
AC-720's criterion. It is a **stale-API call shape baked into the UAT itself**,
introduced by this branch's own `reconciliation_uat_generation_prompt`
(commit `087e145261`, later touched by `fix_uat_validation` `d532ccae9d`) and
then invalidated by the `sync_main` merge that brought REQ-155's
`ReferenceBundle` port onto the branch.

REQ-155 (merge `60a0561aa8`, `free-REQ-155`) converted the capture-bundle seam
from directory-and-synchronous to port-and-asynchronous:

| symbol | pre-REQ-155 (what the UAT was written against) | current tree (post-merge) |
|---|---|---|
| `writeL1` | `writeL1(bundleDir: string, doc): string` | `async writeL1(bundle: ReferenceBundle, doc): Promise<void>` |
| `readL1`  | `readL1(bundleDir: string): L1Document \| null` | `readL1(bundle: ReferenceBundle): Promise<L1Document \| null>` |
| `cmdRepro`| synchronous, returns `ReproResult` | `async cmdRepro(...): Promise<ReproResult>` |

The UAT carries two pre-REQ-155 call shapes:

1. **line 172** — `writeL1(dir, refDoc())` passes a `string` where a
   `ReferenceBundle` is required, and does not `await`. The reference bundle
   therefore never receives an `l1.json`.
2. **line 212** — `const repro = cmdRepro('tastingmenu', {...})` does not
   `await`, so `repro` is a `Promise`. Line 213 then reads `repro.draftDir`,
   which is `undefined`, and
   `expect(undefined).toContain(path.join('storage','sandbox'))` throws. This
   is the reported assertion failure.

Verified empirically in this worktree with a browser-free probe driving the
UAT's exact setup through `vite.ssrLoadModule`:

```
typeof returned value : [object Promise]
UAT reads .draftDir   : undefined
=> expect(undefined).toContain("storage/sandbox") FAILS at line 213
...then, on await:  Error: No l1.json in bundle '<tmp>/ref'.
                    The bundle predates the L1 fold
```

The second line confirms defect (1) independently: even with the missing
`await` supplied, the bundle is empty because `writeL1` was handed a directory
string.

Every other `cmdRepro` call site in the repo already awaits correctly
(`tests/req88-l1-repro-pipeline.test.ts`, `tests/bug23-repro-local-assets.test.ts`,
`tests/req93-l1-slot-mounted-behaviors.test.ts`,
`tests/reconciliation-l1-bundle-materialization.test.ts`,
`tools/generate/src/cli/index.ts:877`, …). The production code is internally
consistent and correct; this one UAT is the sole stale caller.

Making the UAT pass would require one of:

- adding an `await` at lines 172 and 212 and passing a `ReferenceBundle` to
  `writeL1` — **editing the failing UAT, which is prohibited**; or
- reverting REQ-155's async `ReferenceBundle` port so `writeL1`/`readL1`/
  `cmdRepro` become directory-taking and synchronous again — this is main's
  newer, deliberate architecture, it is load-bearing for the R2-backed bundle
  store, and reverting it would break REQ-155's own ACs and many passing UATs;
  or
- attaching a `draftDir` property to the `Promise` that `cmdRepro` returns —
  a corruption of a production API purely to satisfy a test typo.

None of these is an allowed implementation fix.

## Local verification

- `npm test -- tests/reconciliation-1c-aligned-crops-sandbox-routing.test.ts`
  → `1 passed | 1 skipped`. Part A passes. Part B reports **SKIPPED** in this
  session because `chromiumAvailable()` is `false` here: the OS sandbox blocks
  the Chromium launch (`browserType.launch: Target page, context or browser has
  been closed`) even though the browser binary is installed at
  `~/Library/Caches/ms-playwright/chromium_headless_shell-1228`. The upstream
  quality runner is not sandboxed this way, which is why it executed the leg and
  reported the failure.
- Because Part B cannot execute here, the defect was proven browser-free with a
  `vite.ssrLoadModule` probe replicating the UAT's setup verbatim (output
  quoted above). The probe was removed; the working tree carries no source
  changes from this session (`git status` clean apart from `.xgd/_changes`
  bookkeeping).

## Required corrective action (higher layer)

This needs a corrective intent that updates the UAT's call shapes to the
post-REQ-155 bundle port — a UAT-layer edit, outside this prompt's authority.
It is a three-line mechanical repair (two `await`s plus wrapping the ref
directory with `fsReferenceBundle`), not an AC invalidation: AC-720's criterion
is still the behaviour the implementation delivers.
