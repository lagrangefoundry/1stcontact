---
uid: report-589fef3b
id: REPORT-3297
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-23'
created_by: xgd
created_at: '2026-09-02T18:02:56.752004+00:00'
updated_at: '2026-09-02T18:02:56.752004+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-23
---

## Files resolved

Incoming: `a28d2f522f` *feat(framework): behavior modules render in workerd — Astro leaves the render path (REQ-148) [FREE-CODED]* (2026-08-19).
All six conflicts are UU on code/test files → rule 2c. In every case HEAD already
carries the incoming commit's REQ-148 change (it reached main through the
post-watermark sync) and adds a later, documented refinement on top. Each
resolution is therefore "combine, keeping both intents", which here means HEAD's
text — it is a strict superset of incoming's for every conflicting region.

- `apps/control-app/src/router.ts` — UU, 2c/3a. Three hunks.
  1. `previewRenderer` — HEAD exports it with a REQ-154 docblock; both sides are
     already single-arity (the `render` seam gone). Kept HEAD (superset).
  2. `RouterDeps.importStore` — incoming carries this line as *context*, not as a
     change; its diff never touches it. HEAD deleted it in `f84d4a46c7`
     *fix(control-app): register the configured tenant so a fresh builder boots*
     (2026-08-23, BUG-36: `storeFor` registers the configured tenant itself, so
     the second opener and its seam were removed). Kept HEAD (dropped).
  3. `servePreview(...)` call — same argument list on both sides once incoming's
     `deps.render` argument is gone; HEAD passes `await openStore()`, REQ-149's
     deferred store construction. Kept HEAD.
- `packages/framework/src/modules/behavior.ts` — UU, 2c/2 (non-overlapping).
  1. Import — incoming drops `AstroComponentFactory` (already absent from both);
     HEAD adds `type ResolvedLocale` (REQ-151). Kept HEAD.
  2. `BehaviorProps` — incoming's whole interface merged cleanly; the conflict is
     HEAD's added `locale?: ResolvedLocale` field against nothing on the incoming
     side. Kept HEAD: both intents present.
- `tests/reconciliation-1c-astro-free-render.test.ts` — UU, 2c/2f. Two hunks, no
  test function added, renamed or removed on either side beyond what HEAD already
  has.
  1. Header doc — HEAD appends a REQ-150 paragraph after incoming's REQ-148
     paragraph (which is present verbatim). Kept HEAD (superset).
  2. Part (c)'s assertion — see "Incoming changes preserved" below.
- `tests/req89-astro-lazy.test.ts` — UU, 2c/2f. Three hunks, all documentation
  plus one assertion; every UAT function on both sides survives.
  1./2. Header doc — HEAD states REQ-148 *and* REQ-150; incoming's version claims
     "the Vite bootstrap is still Astro's", which REQ-150 has since falsified.
     Kept HEAD, the later and correct statement of the same subject.
  3. The module-render assertion — see below.
- `tools/generate/src/cli/builder.ts` — UU, 2c/3a. One hunk. Incoming's change is
  the removal of `render: { createContainer: astroContainer, resolveModule:
  getModule }` — already absent from HEAD, along with both imports. HEAD's
  `return { store }` additionally drops `importStore` per `f84d4a46c7` above (the
  same BUG-36 deletion as router.ts; incoming carries the line as context). Kept
  HEAD.
- `tools/generate/src/render/render.ts` — UU, 2c/2 + 2c/3b. Three hunks.
  1. Imports — incoming's side is unchanged context; HEAD carries `resolveSiteLocale`
     / `ResolvedLocale` (REQ-151, `bbce12ddd4`) and imports `LoadedSite` from
     `../store/assemble` rather than `../store/loadSite` (REQ-149, `94983a2b61`
     *fix(render): import a type from where it is declared* — importing through
     `loadSite` put `node:fs`/`node:path` in the Worker's *type* program). Kept HEAD.
  2. `renderModuleInstances` signature — incoming makes it sync (already so in
     HEAD); the conflict is HEAD's added `locale: ResolvedLocale` parameter. Kept
     HEAD.
  3. `renderPage` body — incoming's `renderModuleInstances(page, resolveModule,
     edit)` vs HEAD's `resolveSiteLocale(site.config)` + the same call with
     `locale`. Kept HEAD: incoming's call shape is preserved and extended, and
     `locale` is required by `renderPage`'s own `<html lang=… dir=…>` line.

Staged with `git add`; `git status --porcelain` is empty and `CHERRY_PICK_HEAD`
is untouched. The resolution nets to no diff vs HEAD — the commit's effect is
already integrated — which per STEP 4 is left for the finalize step to detect;
no `--skip`, `--continue` or reset was issued.

## Incoming changes preserved

Verified against `git show a28d2f522f -- <file>` for each file. Present in the
resolved (= HEAD) version:

- `router.ts` — `import type { RenderSiteOptions }` gone; `previewRenderer(store)`
  and `new PreviewRenderer(store)` single-arity; the `render?: Pick<RenderSiteOptions,
  'createContainer' | 'resolveModule'>` member gone; incoming's replacement
  RouterDeps docblock ("REQ-148 — the render is no longer one of these …") present
  verbatim; `servePreview` lost its `render` parameter at both definition and call.
- `builder.ts` — `getModule` and `astroContainer` imports gone; no `render:` key
  in `depsFor`.
- `behavior.ts` — `AstroComponentFactory` import gone; `BehaviorProps` and
  `BehaviorComponent` present as incoming authored them; `Component:
  BehaviorComponent` on `BehaviorDefinition`.
- `render.ts` — incoming's "ASTRO IS GONE FROM THIS FILE (REQ-148)" header;
  `getModule` in the `@1stcontact/framework/worker` import; `unresolvableModule`,
  the `Container` type and `RenderSiteOptions.createContainer` all gone;
  `renderModuleInstances`/`renderPage` synchronous; the direct `Component({…})`
  call; the "IT AWAITS NOTHING NOW (REQ-148)" note on `renderSiteFiles`; the
  `needsAstro` branch replaced by `opts.resolveModule ?? getModule`.
- Both test files — incoming's `describe`/`it` renames (`REQ-148 — Astro is absent
  from the render path`, `test_UAT_FC_REQ-148_l1_site_renders_without_astro_container`,
  `test_UAT_FC_REQ-148_module_site_renders_without_astro_container`,
  `test_UAT_AC739_astro_container_never_created_for_any_page`) and its superseding
  doc paragraphs are all in place, as are its explanatory comments on the flipped
  assertions. `test_UAT_AC738_commands_boot_without_missing_pages_warning` and
  `test_UAT_FC_REQ-89_cli_boots_no_missing_pages_warning` are untouched. No test
  function present on either side of these conflicts was deleted.

### Hunks dropped under the BUG-1301 precedence

Three, all with their target already removed from HEAD by an earlier, documented,
legitimate refactor:

1. `expect(createSpy).not.toHaveBeenCalled()` →
   `expectNoAstroContainerToConstruct()` — in BOTH test files, and in both cases
   incoming's *intent* (assert no Astro container is constructed for a
   behavior-module render — the assertion whose flip IS REQ-148) is preserved; only
   its measurement instrument changed. HEAD-side commit: `2d10299709`
   *refactor(1c): boot a plain Vite SSR server and drop Astro* (2026-08-20), which
   removed the `astro` dependency and therefore `experimental_AstroContainer`, the
   spy's own subject. `tests/support/astro-absent.ts` documents the succession and
   makes the strictly stronger claim ("no container can be constructed by ANY
   render, because the package is not on disk"). Keeping incoming's literal line
   would reference a `createSpy` that no longer exists — the file would not compile,
   let alone assert.
2. `RouterDeps.importStore` / `depsFor`'s `importStore: store` — router.ts and
   builder.ts. HEAD-side commit: `f84d4a46c7` (2026-08-23), whose message and
   BUG-36's own record state the deletion explicitly ("`storeForImport` and the
   router's `deps.importStore` seam are deleted"); `git grep importStore HEAD`
   returns zero code hits, only ticket prose. Not strictly a discarded incoming
   change: the incoming diff carries these lines as context and never modifies them.
3. `import type { LoadedSite } from '../store/loadSite'` — render.ts. Also incoming
   context rather than an incoming change; HEAD-side commit `94983a2b61`
   (2026-08-22) deliberately repointed it at `../store/assemble` to keep `node:fs`
   out of the Worker's type program.
