---
uid: report-f04dae6d
id: REPORT-2939
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-21'
created_by: xgd
created_at: '2026-08-31T14:27:52.178114+00:00'
updated_at: '2026-08-31T14:27:52.178114+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-21
---

## Files resolved

Incoming commit: `a28d2f522f` — *feat(framework): behavior modules render in workerd — Astro leaves the render path (REQ-148) [FREE-CODED]*, authored 2026-08-20 05:49:55 -0700.

All five conflicts are class **UU on implementation/test code** (STEP 2c / 2f). All five HEAD-side commits are ALSO `free_coded`, so the "both sides free_coded → take the later working-timeline position" exception governs. Every HEAD-side commit is dated 2026-08-30, ten days AFTER the incoming commit, and each one names REQ-148 in its own body as already-landed work it builds on. Resolution is HEAD (`--ours`) for all five.

- `apps/control-app/src/router.ts` — UU, 2c/3a. HEAD `d01e1e1891` *fix(builder): a builder that cannot start says so in the page* (2026-08-30 22:09:46). HEAD already carries every REQ-148 change (`previewRenderer(store)` with the render seam dropped, `RouterDeps.render` and the `RenderSiteOptions` import removed, the REQ-148 doc block that explains why nothing is left to inject) and adds REQ-149's lazy `openStore()` on top. The single conflicting line is `servePreview(await openStore(), …)` (HEAD) vs `servePreview(store, …)` (incoming) — same argument list, HEAD's store is the deferred one. HEAD is a strict superset.
- `packages/framework/src/modules/behavior.ts` — UU, 2c/3a. HEAD `bbce12ddd4` *feat(schema): a site knows where it is, and both renderers say so* (2026-08-30 22:09:52). HEAD holds incoming's `BehaviorProps` verbatim plus REQ-151's `locale?: ResolvedLocale` prop and the `ResolvedLocale` import.
- `tools/generate/src/render/render.ts` — UU, 2c/3a. HEAD `94983a2b61` *fix(render): import a type from where it is declared* (2026-08-30 22:11:38). HEAD holds incoming's Astro-free render (`getModule` named locally, `renderSiteFiles` as the single entry, no container) plus REQ-151 locale threading into `renderModuleInstances` / `lang`+`dir` on `<html>`, and REQ-149's `LoadedSite` import moved from `loadSite` to `assemble`.
- `tests/reconciliation-1c-astro-free-render.test.ts` — UU, 2c/2f. HEAD `2d10299709` *refactor(1c): boot a plain Vite SSR server and drop Astro* (2026-08-30 22:09:44).
- `tests/req89-astro-lazy.test.ts` — UU, 2c/2f. HEAD `2d10299709`, same commit.

## Incoming changes preserved

Verified present in HEAD for every file, by diffing the incoming blob against the HEAD blob per path (`git diff a28d2f522f:<path> HEAD:<path>`). In all five cases the diff is additive only — refinements layered on top of REQ-148 — with no incoming line reverted or missing. Nothing was discarded; this is BUG-1109/BUG-1122's redundant-commit case, not STEP 3's discard case.

Whole-commit corroboration: after staging the resolutions, `git diff HEAD` across the entire index is EMPTY. The cherry-pick applied every non-conflicted hunk of `a28d2f522f` — including all twelve `.astro` → `.ts` conformance fixture renames, the `astro-env.d.ts` / `astro-shims.d.ts` / `extract-style.ts` deletions, the `modules/html.ts` and `carousel/component.ts` / `contact-form/component.ts` additions, and the new REQ-148 UAT files — and the result is byte-identical to HEAD. Every one of those hunks was therefore already integrated. (This also rules out sparse-checkout-hidden deletions: the index covers out-of-cone paths regardless of the 15% cone.)

No UAT function was deleted by this resolution. `test_UAT_FC_REQ-145_builder_in_workerd.workers.test.ts` — the boundary UAT the incoming commit removes as superseded — is already absent from HEAD, removed by the same integrated REQ-148 work; its removal is not a choice made here. The BUG-1301 precedence exception was not needed: no incoming hunk was dropped.

Cherry-pick sequencer state left intact — `CHERRY_PICK_HEAD` still present, no `--continue`/`--skip`/`--quit`/`--abort` issued. The staged tree nets to no diff vs HEAD; per STEP 4, finalize will detect that and skip the commit.
