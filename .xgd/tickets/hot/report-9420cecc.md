---
uid: report-9420cecc
id: REPORT-3136
type: report
title: 'Reconcile resolve conflicts: reconcile-REQ-162'
created_by: xgd
created_at: '2026-09-01T00:11:33.489300+00:00'
updated_at: '2026-09-01T00:11:33.489300+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-REQ-162
---

## Context

The incoming commit `a28d2f522f` ("feat(framework): behavior modules render in
workerd — Astro leaves the render path (REQ-148) [FREE-CODED]", 2026-08-19) is
the SAME change as `36afb0a80d`, already an ancestor of HEAD — identical subject,
identical date, and identical file set except one line
(`packages/framework/package.json`'s `"./registry"` export), which HEAD has
already removed by another route. HEAD then carries five later FREE-CODED
commits built on top of it:

- `2d10299709` (08-20) refactor(1c): boot a plain Vite SSR server and drop Astro — REQ-150
- `2594b164aa` (08-21) refactor(tests): convert the last Astro site off the container
- `bbce12ddd4` (08-21) feat(schema): a site knows where it is, and both renderers say so — REQ-151
- `94983a2b61` (08-22) fix(render): import a type from where it is declared — REQ-149
- `f84d4a46c7` (08-23) fix(control-app): register the configured tenant so a fresh builder boots — BUG-36
- `1213d247dd` (08-28) feat(capture): Browser Rendering driver behind the BrowserDriver seam — REQ-154

Both sides are `free_coded`, so the working-timeline exception applies: HEAD's
side is later in every case. Every conflict is either HEAD-as-superset of the
incoming hunk, or an incoming hunk whose entire target a later documented
refactor already integrated into HEAD had removed.

Before resolving, `git diff HEAD` was taken on all six files: each differed from
HEAD ONLY inside the conflict markers. No incoming hunk had auto-merged outside a
marker, so resolving to the HEAD side discards nothing that the cherry-pick had
already applied.

## Files resolved

- `apps/control-app/src/router.ts` — UU, code (2c). Took HEAD.
  - `previewRenderer`: both sides carry the incoming's single-arg signature
    (the `render` param dropped); HEAD adds REQ-154's `export` + doc. Superset.
  - `RouterDeps.importStore`: the incoming carries this line as CONTEXT, not as a
    change — its diff never touches it. HEAD removed it in `f84d4a46c7` (BUG-36,
    whose message states "`storeForImport` is deleted, along with the router's
    `deps.importStore` seam"). Legitimate refactor already in HEAD → hunk dropped.
  - `servePreview(...)`: both sides dropped the `deps.render` argument (the
    incoming's actual change); HEAD additionally opens the store lazily via
    `await openStore()`. Superset.
- `packages/framework/src/modules/behavior.ts` — UU, code (2c). Took HEAD.
  Both hunks are pure HEAD additions from REQ-151 (`bbce12ddd4`): the
  `ResolvedLocale` import (HEAD's import is a strict superset of the incoming's
  `l1ControlNames, l1NodeSchema, type L1Node`) and the `locale?: ResolvedLocale`
  prop. The incoming contributes no content in either region.
- `tests/reconciliation-1c-astro-free-render.test.ts` — UU, test (2c/2f). Took HEAD.
- `tests/req89-astro-lazy.test.ts` — UU, test (2c/2f). Took HEAD.
- `tools/generate/src/cli/builder.ts` — UU, code (2c). Took HEAD (`return { store }`).
  The incoming's change here is the removal of the `render: { createContainer:
  astroContainer, resolveModule: getModule }` key — already absent from HEAD.
  HEAD additionally dropped `importStore` per BUG-36 above.
- `tools/generate/src/render/render.ts` — UU, code (2c). Took HEAD, all four hunks.
  The incoming's REQ-148 content (static `getModule` from
  `@1stcontact/framework/worker`, no container, no injected seam) is already
  present in HEAD as unconflicted context. The conflicting regions are REQ-149's
  type-import fix (`LoadedSite` from `../store/assemble` rather than
  `../store/loadSite`, with its comment explaining the `node:fs` type leak) and
  REQ-151's `locale` threading — both strictly later, both HEAD-superset.

## Incoming changes preserved

Confirmed present in HEAD for every code file: the whole of `a28d2f522f` landed
as `36afb0a80d`. Spot-checked — `modules/html.ts`, `carousel/component.ts`,
`contact-form/component.ts`, `tests/support/behavior-site.ts` and both REQ-148
UATs exist in HEAD; `astro-env.d.ts`, `astro-shims.d.ts`, `extract-style.ts`,
both `index.astro` files and the superseded REQ-145 boundary UAT are gone from
HEAD. Consequently the staged diff against HEAD is EMPTY. This is the
BUG-1109/BUG-1122 redundant-commit case, not a discard: STEP 3's test
distinguishes them, and the incoming commit's key changes are present in HEAD
rather than absent. Per STEP 4 no `--skip` was issued; the finalize step will
detect the clean staged diff.

### Hunks dropped under the BUG-1301 precedence exception

- `tests/reconciliation-1c-astro-free-render.test.ts` and
  `tests/req89-astro-lazy.test.ts`: the incoming's
  `expect(createSpy).not.toHaveBeenCalled()` was dropped in favour of HEAD's
  `expectNoAstroContainerToConstruct()`. The HEAD-side commit that removed the
  target is `2d10299709` ("refactor(1c): boot a plain Vite SSR server and drop
  Astro", REQ-150), which removed the `astro` dependency and with it the
  container factory `createSpy` spied on. `createSpy` does not exist anywhere in
  either file on the HEAD side — taking the incoming line would have produced a
  test referencing an undefined binding. The removal is a legitimate refactor,
  not a resolution shortcut: it is a standalone dated FREE-CODED commit whose
  message documents the decision, it is already integrated into HEAD, and the
  replacement helper asserts the STRONGER property (no container can be
  constructed at all, versus none was observed to be). The same applies to the
  two file-header doc hunks, which are HEAD's REQ-150 narration of that change.
- NO test function was deleted. All five `it(...)` blocks across the two files
  survive intact: `test_UAT_FC_REQ-148_l1_site_renders_without_astro_container`,
  `test_UAT_FC_REQ-148_module_site_renders_without_astro_container`,
  `test_UAT_FC_REQ-89_cli_boots_no_missing_pages_warning`,
  `test_UAT_AC738_commands_boot_without_missing_pages_warning`,
  `test_UAT_AC739_astro_container_never_created_for_any_page`. Every conflict in
  these files was a doc comment or a single assertion line INSIDE a surviving
  function; no `it(...)` boundary fell within a conflict region. 2f is satisfied
  on its own terms, without needing the precedence exception.
