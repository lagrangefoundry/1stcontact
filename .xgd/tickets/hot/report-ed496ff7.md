---
uid: report-ed496ff7
id: REPORT-3528
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-26'
created_by: xgd
created_at: '2026-09-09T21:51:51.815343+00:00'
updated_at: '2026-09-09T21:51:51.815343+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-26
---

## Files resolved

Incoming commit: `a28d2f52` — *feat(framework): behavior modules render in workerd —
Astro leaves the render path (REQ-148) [FREE-CODED]*, authored **2026-08-19**.

Both sides are `free_coded`, so the 2c/2d exception applies: take the later
working-timeline position, per hunk. Every HEAD-side commit touching these six
files is **later** than the incoming commit (2026-08-20 … 2026-08-31), and the
later work already carries REQ-148's substance — chiefly `2d102997`
*refactor(1c): boot a plain Vite SSR server and drop Astro* (REQ-150, 08-20),
which the incoming commit's own header names as deliberately-deferred follow-on.

- `packages/framework/src/modules/behavior.ts` — UU / code. 2 hunks. 2c.3a: HEAD
  is a strict superset. Incoming introduced `BehaviorProps` + `BehaviorComponent`
  and dropped the `AstroComponentFactory` import; HEAD has all of that and adds
  REQ-151's `ResolvedLocale` import and `locale?:` field. Kept HEAD.
- `tools/generate/src/render/render.ts` — UU / code. 4 hunks. 2c.3a. HEAD already
  carries incoming's REQ-148 conversion (sync `renderModuleInstances`/`renderPage`,
  direct `Component({…})` call, no container, static `getModule` default) and
  threads REQ-151 `locale` on top; hunk 1 is REQ-149's `LoadedSite` import moved
  to `../store/assemble`, which incoming never touched (context-only). Kept HEAD.
- `apps/control-app/src/router.ts` — UU / code. 3 hunks. Kept HEAD on all three.
  Hunks 1 and 3 already contain incoming's render-seam removal, plus REQ-154's
  `export` of `previewRenderer` and REQ-162's `await openStore()`. Hunk 2 is the
  `deps.importStore` field — see the ambient-hunk note below.
- `tools/generate/src/cli/builder.ts` — UU / code. 1 hunk. Incoming's actual change
  (dropping `astroContainer` / `getModule` imports and the `render:` dep) merged
  cleanly and is verified absent from the file. The conflicting text is only
  `importStore: store` — same ambient-hunk case as router.ts hunk 2. Kept HEAD's
  `return { store }`.
- `tests/req89-astro-lazy.test.ts` — UU / test. 3 hunks. Kept HEAD. HEAD applied
  incoming's renames (`describe('REQ-148 — Astro is absent from the render path')`,
  `test_UAT_FC_REQ-148_l1_site_renders_without_astro_container`,
  `test_UAT_FC_REQ-148_module_site_renders_without_astro_container`) and then
  REQ-150 replaced the `vi.spyOn` container spy with
  `expectNoAstroContainerToConstruct()`, because REQ-150 removed the `astro`
  dependency the spy targeted.
- `tests/reconciliation-1c-astro-free-render.test.ts` — UU / test. 2 hunks. Kept
  HEAD, same REQ-150 supersession as above.

No test function present on either side was deleted. In both test files the
incoming hunks were *assertion-mechanism* changes inside functions that survive
under their REQ-148 names; taking incoming's `expect(createSpy).not.toHaveBeenCalled()`
would have referenced an identifier that no longer exists on HEAD (`createSpy` is
undefined there — REQ-150 deleted it along with the `astro` dependency), i.e. it
would not compile.

### Ambient hunks (not incoming intent)

`RouterDeps.importStore` appears on the incoming side of two hunks but is
**unchanged context** in the incoming diff — the incoming commit neither added nor
modified it. It was deleted by HEAD's later `f84d4a46` (2026-08-23, BUG-36,
*fix(control-app): register the configured tenant so a fresh builder boots*),
whose message states the removal explicitly: "`storeForImport` is deleted, along
with the router's `deps.importStore` seam." That is a documented, legitimate
refactor already integrated into HEAD and later than the incoming commit, so the
field stays deleted. Restoring it would have re-broken BUG-36 and left
`RouterDeps.importStore` with no producer.

## Incoming changes preserved

All of the incoming commit's key changes are present in the resolved tree.
Verified individually against HEAD after staging:

- `render.ts`: `const resolveModule = opts.resolveModule ?? getModule` present;
  `getModule` in the static `@1stcontact/framework/worker` import; no
  `astro/container`, `AstroContainerType`, `unresolvableModule`, `createContainer`
  or `needsAstro` remain.
- `behavior.ts`: `export type BehaviorComponent = (props: BehaviorProps) => string`
  and `Component: BehaviorComponent` present; no `AstroComponentFactory`.
- `router.ts`: no `RenderSiteOptions` import, no `render?:` dep, no `deps.render`
  argument — the render seam is fully removed as incoming intended.
- `builder.ts`: no `astroContainer`, `getModule`, `@1stcontact/framework/registry`
  or `../render/write` references remain.
- Framework module set: `modules/html.ts`, `modules/carousel/component.ts` and
  `modules/contact-form/component.ts` exist in HEAD; `modules/*/index.astro` and
  `modules/extract-style.ts` are gone.
- Both test files assert the REQ-148 answer (no container for a module page) under
  the REQ-148 test names.

No hunk was dropped under the BUG-1301 precedence exception; the two test files
kept every function from both sides.

### Net-zero staged diff (BUG-1109 / BUG-1122, not a discard)

After staging, `git diff --cached HEAD` is empty: this commit's effect had already
landed on the bundle branch through a later route (REQ-149/REQ-150/REQ-151/REQ-154/
REQ-162 and BUG-36). Per STEP 3's test this is the *redundant* case, not the
*discarded* case — the incoming commit's key changes were checked and found
**present in HEAD**, item by item above, rather than absent. Per STEP 4 no
`--skip` was issued; the tree is staged and `CHERRY_PICK_HEAD` (`a28d2f52`) is
left intact for `cherry_pick_finalize_resolution` to act on.

### Spot-check

`npx tsc --noEmit -p tools/generate` reports **zero errors in all six resolved
files**. The only 4 errors are pre-existing worktree artifacts unrelated to this
resolution — `apps/control-app/src/generated/` (ai-workers, importmap.json,
ticketing) is untracked build output produced by `./bin/1c assets` and is absent
from this worktree. The full suite was not run: it belongs to the regression
workflow, not conflict resolution.
