---
uid: report-9cbc8635
id: REPORT-3030
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-22'
created_by: xgd
created_at: '2026-08-31T19:26:37.829954+00:00'
updated_at: '2026-08-31T19:26:37.829954+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-22
---

## Context

The incoming commit `a28d2f52` (REQ-148, "behavior modules render in workerd —
Astro leaves the render path") is a duplicate of `36afb0a80d`, which is ALREADY
an ancestor of HEAD (`git merge-base --is-ancestor 36afb0a80d HEAD` → true).
The two patches are identical except for one hunk (dropping the
`"./registry"` export from `packages/framework/package.json`), and that export
is already absent from the working tree.

Every conflict below is therefore "HEAD carries REQ-148 plus later work on top";
the incoming side is the older rendition of the same change. Resolution is
HEAD's content in each case, and in each case the incoming commit's own changes
are verified present in that content.

## Files resolved

- `apps/control-app/src/router.ts` — UU, code (2c). Two hunks.
  - `RouterDeps.importStore`: incoming still declares it; HEAD's
    `f84d4a46c7` ("register the configured tenant so a fresh builder boots")
    deleted it deliberately, collapsing `storeForImport` into `storeFor`.
    Took HEAD (drop). The incoming commit does not touch `importStore` — it
    only removes `render`, which HEAD already lacks.
  - `servePreview(...)` call site: HEAD passes `await openStore()` (REQ-149
    deferred store construction); incoming passes `store`. Both sides already
    omit the `deps.render` argument that this commit removes. Took HEAD.
- `packages/framework/src/modules/behavior.ts` — UU, code (2c). Two hunks.
  - Import block: HEAD widened it to `type ResolvedLocale` (REQ-151); incoming's
    only change to this region is dropping `AstroComponentFactory`, already gone
    on HEAD. Took HEAD (superset).
  - `BehaviorProps.locale`: HEAD-only field (REQ-151), incoming side empty.
    Kept it. `BehaviorProps` / `BehaviorComponent` / `Component:
    BehaviorComponent` — the substance of the incoming hunk — merged clean and
    are present.
- `tools/generate/src/cli/builder.ts` — UU, code (2c). One hunk, same
  `importStore` removal as router.ts. Took HEAD (`return { store }`). The
  incoming hunk's own content (drop the `render:` dep, drop the `getModule` /
  `astroContainer` imports) is already in HEAD.
- `tools/generate/src/render/render.ts` — UU, code (2c). Four hunks, all
  HEAD-newer:
  - `LoadedSite` imported from `../store/assemble` not `../store/loadSite`
    (HEAD's "import a type from where it is declared", REQ-149), plus
    `resolveSiteLocale` / `ResolvedLocale` (REQ-151).
  - `renderModuleInstances` gains the `locale` parameter, the `Component({…,
    locale})` prop, and `const locale = resolveSiteLocale(site.config)`.
    Incoming has the pre-REQ-151 three-arg form. Took HEAD in each.
  - The incoming commit's own content here — the "ASTRO IS GONE FROM THIS FILE"
    header, the static `getModule` import from `@1stcontact/framework/worker`,
    `ModuleResolver` defaulting to the framework catalog — is unconflicted and
    present.
- `tests/reconciliation-1c-astro-free-render.test.ts` — UU, test (2c/2f). Two
  hunks. Incoming asserts `expect(createSpy).not.toHaveBeenCalled()`; HEAD's
  REQ-150 ("boot a plain Vite SSR server and drop Astro") removed the `astro`
  dependency and with it the container factory that spy wrapped, replacing the
  assertion with `expectNoAstroContainerToConstruct()` — the strictly stronger
  claim. Took HEAD. No test function deleted; the same test bodies survive with
  the newer assertion.
- `tests/req89-astro-lazy.test.ts` — UU, test (2c/2f). Three hunks (two
  docblock, one assertion), same REQ-150 story. Took HEAD. All three tests —
  `test_UAT_FC_REQ-148_module_site_renders_without_astro_container`,
  the L1-page render assertion, and
  `test_UAT_FC_REQ-89_cli_boots_no_missing_pages_warning` — are present and
  unmodified apart from the assertion HEAD already strengthened.

## Incoming changes preserved

Verified per file against `git show a28d2f52 -- <file>`:

- router.ts — `RenderSiteOptions` import gone; `previewRenderer(store)` is
  single-arg; `RouterDeps.render` absent; the REQ-148 paragraph in the
  `RouterDeps` docblock ("the render is no longer one of these …") is present
  verbatim; `servePreview` takes no `render` parameter. ✓
- behavior.ts — `AstroComponentFactory` import gone; `BehaviorProps` and
  `BehaviorComponent` present with the incoming commit's docblocks verbatim;
  `BehaviorDefinition.Component: BehaviorComponent`. ✓
- builder.ts — `getModule` and `astroContainer` imports gone; no `render:` in
  `depsFor`. ✓
- render.ts — Astro removed from the file, `getModule` statically imported from
  the worker entry, no `createContainer` seam. ✓
- Both test files — the REQ-148 assertion flip (a module page constructs no
  container) is present; HEAD expresses it via
  `expectNoAstroContainerToConstruct()` rather than the now-impossible spy. ✓

No hunk was dropped under the BUG-1301 precedence exception — every incoming
hunk's target is present, just in HEAD's later form.

## Net result

The staged tree is byte-identical to HEAD: `git status --porcelain` is empty
after staging. This is the redundant-commit case of STEP 4 (BUG-1109/BUG-1122),
not a discard — the incoming commit's effect reached this branch earlier via
`36afb0a80d`. Per instruction, `--skip` was NOT called; `CHERRY_PICK_HEAD` is
intact at `a28d2f522f0e5f06629ca9084ac14349b988ed85` for
`cherry_pick_finalize_resolution`.

## Post-merge review flag

Per the enrichment's "flag this file for post-merge review" rule, all six files
resolved toward HEAD. The one judgement call worth a reviewer's eye is
`RouterDeps.importStore` (router.ts + builder.ts): HEAD's removal is documented
and intentional (`f84d4a46c7`), and the incoming side merely predates it.
