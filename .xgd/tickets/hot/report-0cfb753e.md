---
uid: report-0cfb753e
id: REPORT-4479
type: report
title: 'Resync resolve conflicts: 18ffaec45665d29545db8bfd323ee4bf6d1f8678'
created_by: xgd
created_at: '2026-09-20T18:44:56.087965+00:00'
updated_at: '2026-09-20T18:44:56.087965+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Summary

The picked commit `a28d2f522f` ("behavior modules render in workerd — Astro
leaves the render path (REQ-148)") **is already on HEAD** as `36afb0a80d` —
same subject, same author date (2026-08-19 17:44:20 -0700), under a different
sha. `git diff a28d2f522f 36afb0a80d` over the six conflicted paths is **empty**:
the two commits are byte-identical for every file in this conflict set.

HEAD then carries four later, documented commits built on top of it. Every
conflict is therefore "incoming REQ-148 content" vs "the same REQ-148 content
plus a subsequent legitimate refactor already integrated into HEAD" — the
inversion of the usual resync assumption that incoming is newer. All six
resolve to HEAD (`--ours`), and the staged tree is identical to HEAD, so the
cherry-pick carries no net change and finalize should skip the commit.

The later HEAD-side commits that supersede incoming's remaining fragments:

- `f84d4a46c7` (2026-08-23) — "register the configured tenant so a fresh builder
  boots": explicitly states "`storeForImport` is deleted, along with the router's
  `deps.importStore` seam". A documented bug fix (a fresh deploy was dead on
  arrival, two openers disagreeing about tenant registration), not churn.
- `2d10299709` / REQ-150 (2026-08-20) — "boot a plain Vite SSR server and drop
  Astro": removes the `astro` dependency, so `astro/container` and the
  `createSpy` built from it cannot exist. Replaced by
  `expectNoAstroContainerToConstruct()`, documented in-file as strictly stronger
  (it proves no container *can* be constructed, not merely that one was not).
- `94983a2b61` / REQ-149 — `LoadedSite` imported from `../store/assemble` rather
  than `../store/loadSite`, to keep `node:fs`/`node:path` out of the Worker's
  *type* program; also defers store construction to `await openStore()`.
- `bbce12ddd4` / REQ-151 — the site's resolved locale reaches modules as a prop
  and drives `lang`/`dir`.
- REQ-154 — `previewRenderer` exported so a screenshot is fulfilled from the
  same memoised renderer the route uses.

## Files resolved

- `tools/generate/src/render/render.ts` — UU, code (2c + BUG-1301 precedence).
  4 hunks. HEAD is a strict superset: `git diff a28d2f522f:… HEAD:…` shows only
  additions (REQ-149 import provenance, REQ-151 locale plumbing). Resolved to HEAD.
- `packages/framework/src/modules/behavior.ts` — UU, code (2c). 2 hunks. HEAD is
  a strict superset: incoming + REQ-151's optional `locale?: ResolvedLocale`
  prop and its `ResolvedLocale` import. Resolved to HEAD.
- `apps/control-app/src/router.ts` — UU, code (2c + BUG-1301 precedence). 3 hunks:
  (1) `previewRenderer` exported per REQ-154; (2) `RouterDeps` — incoming's
  `importStore` deleted by `f84d4a46c7`, HEAD's `tickets`/`knowledge`/`index`/
  `describeImage`/`fetch` added since; (3) `await openStore()` per REQ-149.
  Resolved to HEAD.
- `tools/generate/src/cli/builder.ts` — UU, code (2c + BUG-1301 precedence).
  1 hunk: `importStore: store`, deleted by `f84d4a46c7`. Resolved to HEAD.
- `tests/req89-astro-lazy.test.ts` — UU, UAT test (2f + BUG-1301 precedence).
  3 hunks: two doc-comment paragraphs and one assertion
  (`expect(createSpy).not.toHaveBeenCalled()` → `expectNoAstroContainerToConstruct()`).
  Resolved to HEAD.
- `tests/reconciliation-1c-astro-free-render.test.ts` — UU, reconcile UAT test
  (2f + BUG-1301 precedence). 3 hunks: a REQ-150 doc paragraph (HEAD-only
  addition), a new static-scan clause (a) with the existing clause renumbered
  (a)→(b) (HEAD-only addition), and the same `createSpy` → helper swap.
  Resolved to HEAD.

## No UAT function was deleted (2f)

Checked pairwise, by name, on both sides of each conflict:

- `tests/req89-astro-lazy.test.ts` — incoming and HEAD both carry all three:
  `test_UAT_FC_REQ-148_l1_site_renders_without_astro_container`,
  `test_UAT_FC_REQ-148_module_site_renders_without_astro_container`,
  `test_UAT_FC_REQ-89_cli_boots_no_missing_pages_warning`. Only the measurement
  helper inside two of them changed.
- `tests/reconciliation-1c-astro-free-render.test.ts` —
  `test_UAT_AC739_astro_container_never_created_for_any_page` is present and
  identically named on both sides. The AC-738 UAT is **renamed, not removed**:
  incoming `test_UAT_AC738_commands_boot_without_missing_pages_warning` →
  HEAD `test_UAT_AC738_every_command_boots_with_clean_streams_and_empty_stderr`,
  because REQ-150 sharpened the criterion from "one named warning is on neither
  stream" to "stderr is entirely empty". That rename merged **cleanly** (it is
  outside every conflict hunk) and is already in the working tree, so this
  resolution neither performed nor undid it. Both files still expose two UATs.

## Incoming changes preserved

Verified per code file that REQ-148's own edits are present in the resolved
(HEAD) version:

- `render.ts` — Astro-free header comment, static `getModule` import from
  `@1stcontact/framework/worker`, `renderSiteFilesNode` gone with `renderSiteFiles`
  the single entry, "IT AWAITS NOTHING NOW (REQ-148)", the no-branch resolver
  `opts.resolveModule ?? getModule`. All present at HEAD.
- `router.ts` — grep for every symbol REQ-148 removed (`RenderSiteOptions`,
  `createContainer`, `deps.render`, two-arg `previewRenderer(store, render)`)
  returns **no hits** on HEAD, and REQ-148's replacement doc comment ("the render
  is no longer one of these…") is present at line 245. `servePreview` carries the
  four-parameter signature with `previewRenderer(store)`.
- `builder.ts` — grep for `astroContainer`, `createContainer`,
  `framework/registry`, `render: {` returns **no hits** on HEAD; `depsFor`
  returns `{ store }`.
- `behavior.ts` — incoming content present verbatim; HEAD adds only the REQ-151 prop.
- Both test files — the REQ-148 describe block, the superseding doc text, and the
  no-container assertions are all present; only the spy mechanism differs.

### Hunks dropped under the BUG-1301 precedence exception

Each of the following incoming fragments is absent from the resolved version
because a later commit **already integrated into HEAD** deliberately removed its
target. None is a resolution shortcut on my part.

- `deps.importStore` (`router.ts`) and `importStore: store` (`builder.ts`) —
  removed by `f84d4a46c7`, whose message names the deletion explicitly and gives
  the defect it cures (an unregistered tenant made every read route answer 503 on
  a fresh deploy; two store openers disagreed about whether the tenant existed).
  Legitimate refactor, dated after the picked commit.
- `import { experimental_AstroContainer } from 'astro/container'` and the
  `vi.spyOn(experimental_AstroContainer, 'create')` / `expect(createSpy)…`
  assertions in both test files — removed by REQ-150 (`2d10299709`), which drops
  the `astro` dependency outright. The spy's target no longer exists, so the
  incoming form is not merely stale but unbuildable. The guarantee it measured is
  retained, and strengthened, by `expectNoAstroContainerToConstruct()` from
  `tests/support/astro-absent`. The enclosing test functions are untouched.
