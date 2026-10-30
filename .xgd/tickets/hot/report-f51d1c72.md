---
uid: report-f51d1c72
id: REPORT-5125
type: report
title: 'Resync resolve conflicts: d7587990b588ef6c03b752fe16afa93745aa9da3'
created_by: xgd
created_at: '2026-09-26T21:04:08.511713+00:00'
updated_at: '2026-09-26T21:04:08.511713+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Verdict

The picked commit is **already integrated into HEAD**. Incoming
`a28d2f522f` — "feat(framework): behavior modules render in workerd — Astro
leaves the render path (REQ-148)" — exists on the resync branch as
`36afb0a80d` with the identical subject and author date (Wed Aug 19
17:44:20 2026). Every one of the six conflicts is therefore a collision
between the duplicate and the three *later* commits that evolved the same
lines on top of it. All six resolve to HEAD, and the resulting staged tree
is byte-identical to HEAD (empty `git diff --cached HEAD`).

The three later commits, all reachable from HEAD:

- `f84d4a46c7` (2026-08-23) — "fix(control-app): register the configured
  tenant so a fresh builder boots". Body: "`storeFor` registers the
  configured tenant on the cold path and `storeForImport` is deleted, along
  with the router's `deps.importStore` seam."
- `2d10299709` (2026-08-20) — "refactor(1c): boot a plain Vite SSR server
  and drop Astro" (REQ-150). Removes the `astro` dependency outright, so
  the container factory the REQ-148 tests spied on no longer exists;
  `tests/support/astro-absent.ts` replaces the spy.
- REQ-149 / REQ-151 work landing the `../store/assemble` type-import fix
  and the `ResolvedLocale` render prop.

## Files resolved

- `apps/control-app/src/router.ts` — UU, code (§2c). Three hunks, HEAD
  taken. (1) `previewRenderer` — both sides already single-arg per
  REQ-148; HEAD additionally `export`s it with a REQ-154 rationale, a
  strict superset. (2) `RouterDeps` — both sides already dropped
  `render?`; HEAD carries `tickets`/`knowledge`/`index`/`describeImage`/
  `fetch` and no `importStore`. (3) `servePreview(...)` — both sides
  already dropped the `render` argument; HEAD threads `await openStore()`
  (REQ-149 deferred store construction).
- `packages/framework/src/modules/behavior.ts` — UU, code (§2c). Two
  hunks, HEAD taken; both are pure REQ-151 additions (`ResolvedLocale`
  import, `BehaviorProps.locale?`) over content otherwise identical to
  incoming.
- `tools/generate/src/render/render.ts` — UU, code (§2c). Four hunks, HEAD
  taken. Imports: HEAD is incoming's set plus `resolveSiteLocale` /
  `ResolvedLocale`, and takes `LoadedSite` from `../store/assemble` rather
  than `../store/loadSite` — a deliberate REQ-149 fix documented in a
  10-line in-file comment (the `loadSite` re-export drags `node:fs`/
  `node:path` into the Worker's *type* program). Remaining three hunks are
  the REQ-151 `locale` parameter/prop threading, a superset of incoming.
- `tests/req89-astro-lazy.test.ts` — UU, test (§2c). Three hunks, HEAD
  taken. Both REQ-148 test functions and the REQ-89 one are retained
  verbatim; nothing deleted. The only behavioural hunk swaps incoming's
  `expect(createSpy).not.toHaveBeenCalled()` for
  `expectNoAstroContainerToConstruct()`.
- `tests/reconciliation-1c-astro-free-render.test.ts` — UU, reconciliation
  test (§2c). Three hunks, HEAD taken. Both `test_UAT_*` bodies retained;
  HEAD additionally carries AC-739's static-scan clause (a) asserting no
  `.astro` file and no `from 'astro/...'` anywhere on the render graph,
  and the same spy→helper swap as above.
- `tools/generate/src/cli/builder.ts` — UU, code (§2c). One hunk, HEAD
  taken: `return { store }` vs incoming's `return { store, importStore:
  store }`.

## Incoming changes preserved

Every substantive REQ-148 effect from `a28d2f522f` is present in the
resolved tree, inherited from `36afb0a80d`:

- `router.ts`: no `RenderSiteOptions` import; `previewRenderer(store)` is
  single-arg; `RouterDeps` has no `render?`; `servePreview` takes no
  `render`; the REQ-148 paragraph in the `RouterDeps` docblock is present
  (it merged as unconflicted context, i.e. both sides carry it).
- `behavior.ts`: `export type BehaviorComponent = (props: BehaviorProps) =>
  string` and its "PLAIN TYPESCRIPT, DELIBERATELY" rationale — the core of
  the ticket — are present unconflicted.
- `render.ts`: `getModule` statically imported from
  `@1stcontact/framework/worker`; `resolveModule = opts.resolveModule ??
  getModule`; no `createContainer`, no `renderSiteFilesNode`; the REQ-148
  "there is no longer a branch here" comment present. Grep for
  `createContainer|renderSiteFilesNode|astro` in HEAD's blob matches only
  three historical comments.
- `builder.ts`: the `getModule` and `astroContainer` imports and the
  `render: { createContainer, resolveModule }` dep are gone.
- Both test files: the REQ-148 assertion flip (a module page constructs no
  container) is present in the stronger form.

### Hunks dropped under the BUG-1301 precedence exception

Two, both the same `importStore` seam, both removed by `f84d4a46c7`
(2026-08-23 — four days *after* the incoming commit), which is reachable
from HEAD:

- `apps/control-app/src/router.ts` — incoming's `importStore?: (env) =>
  Promise<TenantSiteStore>` member of `RouterDeps`.
- `tools/generate/src/cli/builder.ts` — incoming's `importStore: store` in
  `depsFor`.

This is a legitimate refactor, not a resolution shortcut: `f84d4a46c7` is a
free-coded fix with a full rationale (a freshly deployed builder 503'd
because `bin/deploy` seeds no `tenants` row, and two store openers
disagreed about whether the tenant existed), it deletes `storeForImport`
and the seam together, and it ships two new UATs
(`test_UAT_FC_BUG-36_publish_credential`,
`test_UAT_FC_BUG-36_tenant_bootstrap.workers`). `grep -rn importStore` over
`apps packages tools tests` in the resolved tree returns nothing — there is
no consumer left, so re-adding the member would be dead code and re-adding
`importStore: store` in `builder.ts` would not type-check against HEAD's
`RouterDeps`.

### Why the test-file hunks are not a coverage loss

No test function on either side of any of these conflicts was deleted. The
only test-side changes are to *how* the same claim is measured:
`expect(createSpy).not.toHaveBeenCalled()` → `expectNoAstroContainerToConstruct()`.
`createSpy` spied on `astro/container`'s factory; `2d10299709` (REQ-150)
removed the `astro` dependency from the repository, so no `astro` entry
exists in any `package.json` and the incoming expression has no binding —
taking it would not compile. `tests/support/astro-absent.ts` exists in the
resolved tree and establishes the stronger property (no container *can* be
constructed, for every render, rather than was not constructed for the one
observed).

## Staging

`git ls-files -u` empty, `git status --porcelain` empty, `git diff --cached
HEAD` empty. `CHERRY_PICK_HEAD` left in place for the finalize step, which
should detect the empty staged diff and skip the commit — correct here,
since the pick is a duplicate of `36afb0a80d`.
