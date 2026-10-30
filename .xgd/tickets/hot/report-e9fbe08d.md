---
uid: report-e9fbe08d
id: REPORT-5122
type: report
title: 'Resync resolve conflicts: c71e29ca3607bf5567c3fd717fdc7adf18c6a65d'
created_by: xgd
created_at: '2026-09-26T20:38:11.608272+00:00'
updated_at: '2026-09-26T20:38:11.608272+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-ab5ed0bd
---

## Files resolved

All six conflicts were `UU` on code/test files (rule 2c / 2f). The incoming
commit is `a28d2f522f` — "behavior modules render in workerd — Astro leaves the
render path (REQ-148)". In every case HEAD **already carries REQ-148's change**,
having received it through a different path, and layers later free-coded work
(REQ-149/150/151/154/163) on top. Each hunk therefore resolved to the HEAD side,
which is a strict superset of the incoming side's intent.

- `apps/control-app/src/router.ts` — UU, 3 hunks, 2c.
  (1) `previewRenderer` — both sides single-arg (incoming's change); HEAD adds
  the REQ-154 `export` + doc. Superset kept.
  (2) `RouterDeps` — incoming's change here was *removing* the `render` seam;
  HEAD has no `render` field. `importStore` on the incoming side is unchanged
  context that HEAD removed separately (the "register the configured tenant"
  commit). HEAD kept.
  (3) `servePreview(...)` — incoming dropped the `deps.render` argument; HEAD's
  call already has no render arg and uses REQ-149's lazy `await openStore()`.
  HEAD kept.
- `packages/framework/src/modules/behavior.ts` — UU, 2 hunks, 2c.
  Non-overlapping addition on the HEAD side only: REQ-151's `ResolvedLocale`
  import and the `BehaviorProps.locale` field. Incoming's REQ-148 content
  (`BehaviorProps`, `BehaviorComponent`, `Component: BehaviorComponent`, no
  `AstroComponentFactory` import) is already present outside the conflict
  regions. HEAD kept for both.
- `tools/generate/src/render/render.ts` — UU, 4 hunks, 2c.
  HEAD adds REQ-151 locale threading (`resolveSiteLocale`, the `locale`
  parameter and prop) and REQ-149's "import a type from where it is declared"
  fix (`LoadedSite` from `../store/assemble`, not `../store/loadSite`, which
  drags `node:fs`/`node:path` into the Worker's type program). Incoming's
  REQ-148 content is already present. HEAD kept for all four.
- `tools/generate/src/cli/builder.ts` — UU, 1 hunk, 2c.
  Incoming's only change to this file was deleting the `render: { createContainer,
  resolveModule }` injection plus its two imports — already absent from HEAD.
  `importStore: store` is context that HEAD removed together with the
  `RouterDeps.importStore` field; keeping it would not type-check. HEAD kept.
- `tests/req89-astro-lazy.test.ts` — UU, 3 hunks, 2f.
  Two doc-comment hunks and one assertion. All three `it(...)` UATs are present
  on both sides and all three survive; incoming's renames to the
  `test_UAT_FC_REQ-148_*` names are already in HEAD. No test function deleted.
- `tests/reconciliation-1c-astro-free-render.test.ts` — UU, 3 hunks, 2f.
  Doc comment, the clause-(a) static scan, and one assertion. Both UATs
  (`test_UAT_AC738_*`, `test_UAT_AC739_*`) are present on both sides and both
  survive. HEAD's version adds a whole extra verification clause. No test
  function deleted.

## Incoming changes preserved

Verified per file against `git show a28d2f522f -- <file>`:

- `router.ts` — incoming's three effects are all present: `previewRenderer` takes
  only `store`; `RouterDeps` has no `render` field and the file no longer imports
  `RenderSiteOptions`; `servePreview` is called without a render argument and
  declares no render parameter. Confirmed by grep: no `RenderSiteOptions`, no
  `render?:`.
- `behavior.ts` — `BehaviorProps`, `BehaviorComponent = (props) => string` and
  `Component: BehaviorComponent` all present; `AstroComponentFactory` import
  absent.
- `render.ts` — the "ASTRO IS GONE FROM THIS FILE (REQ-148)" header, the static
  `getModule` import from `@1stcontact/framework/worker`, and the "imported
  statically since REQ-148" doc are all present. Confirmed by grep that
  `createContainer`, `unresolvableModule`, `AstroContainer` and
  `renderSiteFilesNode` are all gone.
- `builder.ts` — confirmed by grep that `astroContainer`, `@1stcontact/framework/registry`
  and the `render:` injection are all absent.
- Both test files — the REQ-148 UAT names and their positive assertions are
  present; `data-fc-type="carousel"` module-render assertions intact.

### Hunks dropped under the BUG-1301 precedence exception

Two assertion hunks (`tests/req89-astro-lazy.test.ts` line ~146 and
`tests/reconciliation-1c-astro-free-render.test.ts` line ~246) used
`expect(createSpy).not.toHaveBeenCalled()`. `createSpy` does not exist anywhere
in HEAD's version of either file — it was a `vi.spyOn` over Astro's container
factory, and **REQ-150 removed the `astro` dependency itself**, taking the spy
with it. HEAD replaces it with `expectNoAstroContainerToConstruct()` from
`tests/support/astro-absent`, which both files' own header comments document as
*strictly stronger*: it establishes that no container can be constructed for any
render, rather than that none was constructed during the render observed.

This is a legitimate refactor already integrated into HEAD, not a resolution
shortcut: the target of the incoming hunk (the spy, and the dependency it spied
on) is gone, the assertion's *claim* is preserved in a stronger form, and **no
test function was deleted on either side** — 2f's protected object is intact.
Carrying the incoming hunk verbatim would reference an undefined identifier.

Similarly, `router.ts`'s third hunk kept `await openStore()` over incoming's
bare `store`: REQ-149 deferred store construction into the request `try` block,
so no `store` binding exists at that point in HEAD's scope. The incoming
semantic change in that hunk (dropping `deps.render`) is preserved.

## Net result

The staged tree is byte-identical to HEAD (`git diff --cached HEAD` is empty):
every effect of `a28d2f522f` had already reached this resync branch through the
free-coded commits HEAD carries. Staged as instructed; `--skip` deliberately not
called — the finalize step owns that decision.
