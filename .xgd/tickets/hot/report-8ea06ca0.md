---
uid: report-8ea06ca0
id: REPORT-1671
type: report
title: 'Report: review for story-e674c60a'
created_by: xgd
created_at: '2026-08-08T00:20:49.475631+00:00'
updated_at: '2026-08-08T00:20:49.475631+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: review
  subject_uid: story-e674c60a
---

# Sprint 1 Story STORY-99 Review

**Status**: FAIL

## Summary

The BUG-32 rename is done correctly and thoroughly: the scope has exactly one
definition site (`tools/generate/src/cli/webui.ts:104`), every generated
reference composes from it, the bounded browser-source exception is held in step
by a real cross-surface UAT, and the identity/wiring evidence is unconditional so
a half-completed rename fails loudly instead of skipping green. 23/23 AC UATs
pass, lint and build are clean, and the browser measurement for AC-975 genuinely
launches a real Chrome (verified: system Chrome 151.0.7922.77 launches; the test
ran in 1635ms, not an early return).

The review fails on one criterion: **AC-977 is INSUFFICIENT and the
implementation violates it.** Every JSON response the origin returns
(`/api/sites`, `/api/publish`, `/api/assets`, `/api/copy`) carries **no**
cache directive, because `json()` in `tools/generate/src/cli/builder.ts:131-139`
writes only `content-type` and `content-length`. The AC says in terms "There is
no exempt response." The covering UAT probes only the document, the browser
source, components and rendered channel pages, so the current broken
implementation passes it. Confirmed by driving the real origin (below).

Two additional findings are recorded as warnings, not fail causes.

## Evidence Sufficiency

All 21 active ACs have covering UATs; all 23 covering tests pass in the quality
report (`report-4327030c`) and were re-run and re-confirmed in this worktree
(`3 files passed, 23 tests passed`). Validity spot-checked on every test: all
enter through real entry points (the `1c` CLI barrel, the builder origin over
HTTP, `unstable_dev` for the Worker, real component mounts in jsdom); none mocks
repository-owned code; the only stand-ins are jsdom's missing `ResizeObserver`
and `matchMedia`, which are platform, not repository, surfaces.

| AC | Claims | Test(s) | Assertion per claim | Broken-impl that would pass | Sufficient? |
|----|--------|---------|---------------------|-----------------------------|-------------|
| AC-959 | one tab; stable id `site`; panel inside tab content | chrome:`test_UAT_AC959_opens_exactly_one_tab_addressed_by_a_stable_id` | count -> `TABS`/`.shell-panel` toHaveLength(1); id -> `SITE_TAB.id==='site'` + `getActiveTab()`; containment -> `panelHost.contains(app.panel.element)` | none | SUFFICIENT |
| AC-960 | label one definition site; label drives tab + selector aria; scope one definition; superseded scope nowhere in tracked tree; scope only in declaration + browser exception; exactly one literal in declaration; browser specifiers subset of generated import map | chrome:`test_UAT_AC960_the_site_surface_name_has_exactly_one_definition_site`; bug32:`test_UAT_AC960_component_scope_is_written_in_exactly_one_place`, `test_UAT_AC960_browser_source_specifiers_are_declared_by_the_generated_document` | tree scan -> `hits.toHaveLength(1)`; rendered -> `textContent` + `aria-label`; `trackedHits(superseded).toEqual([])`; `writers.filter(not permitted).toEqual([])`; `quoted.toEqual(['@...'])`; specifiers -> `imports` keys | none — the scan enumerates `git ls-files` (not three hardcoded roots), is non-vacuous (`files.length>0`, non-source-root files >0, `specs.length>0`), and the guard is split-and-joined so it is not its own violation | SUFFICIENT |
| AC-961 | consumed from outside repo; byte-identical; no component source in repo; resolved package's own identity under scope in use; per-component failure naming; asserted not skipped | origin:`test_UAT_AC961_components_are_served_byte_identical_from_outside_this_repo` | source scan -> `offenders.toEqual([])`; identity -> `declared === WEBUI_SCOPE + '/' + name` per component; outside -> `dir.startsWith(REPO)` false; bytes -> `res.text() === readFileSync(dir/entry)`; unconditional -> `expect(WEBUI_INSTALLED).toBe(true)` as the last assertion | none — the identity assertion is what rejects a same-named leftover under the old scope; both scopes are in fact present in the store, so this is a live discriminator, not a theoretical one | SUFFICIENT |
| AC-962 | names the component; names the install command; not a bare resolver error; raised at the single resolution point | origin:`test_UAT_AC962_absent_component_names_the_component_and_the_install_command` | `message` contains name + `bin/install` + `--component <name>`; `not.toMatch(/Cannot find module\|ERR_MODULE_NOT_FOUND/)`; single point -> `webuiExports` message `toBe` the `webuiPackageDir` message | none | SUFFICIENT |
| AC-963 | refs derived from package `exports`; each resolves 200 with the component's bytes; no undeclared path in the document; every key under scope in use; every consumed component present; non-empty; no superseded scope; asserted on the freshly generated document | origin:`test_UAT_AC963_chrome_references_each_component_by_its_declared_entry_point` | per-export `map.imports[...] === url` + `served.status===200` + byte compare; `html.match(/\/webui\/.../)` subset of `declared`; `keys.length>0`; `key.startsWith(scope)`; `keys.toContain(scope/name)`; not superseded — all against `await get('/')`, never a committed copy | none | SUFFICIENT |
| AC-964 | one host; status, content-type and body forwarded unchanged; frame same-origin | origin:`test_UAT_AC964_one_host_answers_every_route_with_the_origin_response_verbatim` | 4 route classes compared field-by-field vs the direct origin; `previewUrl` root-relative + `not.toMatch(/^https?:/)` + served 200 through the Worker | none | SUFFICIENT |
| AC-965 | unconfigured -> explanatory, names start command, non-success; unreachable -> names address, non-success; the two are distinct | origin:`test_UAT_AC965_unconfigured_and_unreachable_origins_are_distinct_failures` | 503 + body contains `BUILDER_ORIGIN` + `1c builder`; 502 + body contains the dead address + `/unreachable/i`; `unreachableStatus).not.toBe(unconfiguredStatus)` | none | SUFFICIENT |
| AC-966 | real rendered artifact; byte-identical; referenced assets resolve on the same origin | origin:`test_UAT_AC966_view_mode_serves_the_real_rendered_artifact_byte_identical` | `res.text() === readFileSync(dist/.../index.html)`; per-asset 200 + byte compare, with `assets.length>0` guarding vacuity | none | SUFFICIENT |
| AC-967 | options are exactly the store's sites; identified by slug; choosing changes the displayed site; mode unchanged | chrome:`test_UAT_AC967_the_site_selector_lists_exactly_the_store_and_switches_the_site` | `options.map(value)).toEqual(SITES.map(slug))`; real `change` event; `getSite()==='beta'`; `getMode()===modeBefore`; `frame src === '/preview/beta/draft/'` | none | SUFFICIENT |
| AC-968 | source changes; pane and surface are the same elements before/after/back; still attached | chrome:`test_UAT_AC968_switching_modes_changes_the_source_without_rebuilding_the_pane` | identity -> `panel.element).toBe(pane)`, `panel.frame).toBe(surface)`; non-vacuity -> `second).not.toBe(first)`; `isConnected).toBe(true)` | none | SUFFICIENT |
| AC-969 | an unknown mode appears among modes, displays its own source, and gets its declared controls; no panel branch | chrome:`test_UAT_AC969_a_mode_the_panel_has_never_heard_of_works_end_to_end` | mode defined wholly in the test; `getModes()).toContain('contributed')`; `frame src` === its declared src; `toolbar.ids()).toEqual([...])`; its `src()` re-honoured on `setSite` | none | SUFFICIENT |
| AC-970 | exactly the declared ids; replaced on mode change; a non-document mode gets no open-in-new-tab; unknown control reported | chrome:`test_UAT_AC970_the_toolbar_renders_exactly_the_active_modes_controls` | `ids()).toEqual(...)` for both modes; `get('open-new-tab')).toBeNull()` + DOM query null; `expect(() => setMode('bad')).toThrow(/unknown action/)` | none | SUFFICIENT |
| AC-971 | target === displayed URL at every moment, across mode and site changes; compared directly | chrome:`test_UAT_AC971_open_in_a_new_tab_always_targets_the_displayed_document` | `target()).toBe(displayed())` after mount, setMode, setSite, setMode; non-vacuity -> `displayed()).toBe('/preview/beta/draft/')` | none for the live control (see Warning 3 for the red REQ-115 suite, verified to be a stale-handle artifact) | SUFFICIENT |
| AC-972 | publishes the *displayed* site; new revision in that site's history; same form as CLI publish; published channel rendered and served; other site untouched | origin:`test_UAT_AC972_publish_creates_a_revision_for_the_displayed_site` | pre-state both empty; POST `/api/publish` for `beta` (deliberately not the default `alpha`); `cmdRevisions('beta')` length 1 + message; `cmdRevisions('alpha')` still 0; snapshot dir listing and revision key set compared against a real `cmdPublish`; published `index.html` exists and `/preview/beta/published/` returns its bytes | none | SUFFICIENT |
| AC-973 | both panes present, display panel primary; real divider; drag changes widths; collapses to a rail; reopens to the *previous* width | chrome:`test_UAT_AC973_the_split_drags_collapses_to_a_rail_and_reopens_to_its_width` | containment of panel + `.builder-chat-placeholder`; divider element present; `setSplit(37)` then `getSplit()` close to 37 and *not* close to `initial`; `collapse`/`isCollapsed`/`expand` then `getSplit()` back to 37, not the default | a divider that renders but is not draggable — jsdom does no layout, so the ratio model is exercised rather than a pointer drag. The AC's own verification concedes this by delegating pixel truth to AC-975, and the restore-to-previous-not-default assertion is the load-bearing half. Marginal but adequate | SUFFICIENT |
| AC-974 | divider position, collapsed side, site and mode all restored; every written key namespaced | chrome:`test_UAT_AC974_layout_state_survives_reopening_and_is_namespaced` | all four mutated, app destroyed, fresh mount against the same storage, all four re-asserted; `keys.length>0` then every key `startsWith(APP_ID + ':')`, plus both known sub-namespaces present | none — keys are enumerated from a real `Storage`-shaped map rather than sampled | SUFFICIENT |
| AC-975 | fills available space at any height; follows a live resize; page never scrolls; reports loudly where no browser exists | origin:`test_UAT_AC975_displayed_site_fills_the_window_and_the_page_never_scrolls` | real Chromium via Playwright; `height>700` at 900px viewport; `toBeCloseTo(tall-400)` at 500px and `toBeCloseTo(tall+200)` at 1100px (ties it to the viewport, not to a large constant); `scrollHeight - clientHeight === 0` | none — verified this machine really launches a browser (system Chrome 151), so the measurement executed rather than warning-and-returning | SUFFICIENT |
| AC-976 | every declared tab option delivered; iteration over the declaration, not a fixed list; no option silently discarded; `fill` load-bearing | chrome:`test_UAT_AC976_every_option_declared_for_a_tab_reaches_the_chrome` | loop over `Object.keys(tab)` with `expect(delivered[key]).toBeTypeOf('function')` — a newly added option fails until someone states its consequence; mutation check mounts a shell *without* `fill` and asserts `.shell-panel.is-fill` is null | none — the mutation check is the strongest evidence in the suite | SUFFICIENT |
| **AC-977** | **every** response non-cacheable; **no exempt response**; explicitly including the hand-written document | origin:`test_UAT_AC977_every_response_the_origin_returns_is_non_cacheable` | `/builder/main.js`, `/builder/builder.css`, `/preview/alpha/{draft,edit,published}/`, `/`, and each component module -> `cache-control` matches `/no-store/` | **the shipped implementation.** Every `json()` response is exempt. Verified against the running origin: `GET /api/sites` -> `200`, `content-type: application/json`, **no `cache-control` header**; same for `GET /api/assets?slug=...`. The test probes no API route, so it passes | **INSUFFICIENT** |
| AC-978 | every tree refuses; not a success; none of the target's bytes; identical outcome on all three trees | origin:`test_UAT_AC978_every_served_tree_never_satisfies_a_request_that_escapes_it` | 3 trees x 3 probe forms (raw, `%2e%2e`, `..%2f`); per probe `res.ok` false, `status>=400`, body `not.toContain(secret)`; uniformity -> `[...statuses]).toHaveLength(1)` | none. Independently confirmed against the live origin: `/preview/smokesite/draft/../../../../../../etc/passwd` -> `404`, 9 bytes, no `root:` content | SUFFICIENT |
| AC-979 | unknown channel -> not found; unknown component -> not found; never satisfied from a neighbour; no unrelated success content | origin:`test_UAT_AC979_unknown_channel_or_component_is_answered_as_not_found` | both 404; channel body `not.toContain('<html')` and not the neighbouring `draft` page's first 40 bytes; component body `<64` bytes and not the shell's first 40 bytes | none | SUFFICIENT |

**Overall: 20 of 21 ACs sufficient. AC-977 is INSUFFICIENT.**

## Quality Results

From `report-4327030c` (result: pass), re-verified locally:

| Gate | Result |
|------|--------|
| Lint | success — 0 errors, 0 warnings |
| Build | success — exit 0 |
| Preflight | pass — 0 violations |
| Tests | `javascript-vitest` 23/23 passed, 0 failed, 0 skipped (1276 deselected by the AC filter) |
| Coverage | not collected (`coverage: null`) for this scoped run |

Independently re-run in this worktree: `tests/reconciliation-builder-workspace-chrome.test.ts`,
`tests/reconciliation-builder-workspace-origin.test.ts`,
`tests/bug32-webui-scope-rebrand.test.ts` -> **3 files passed, 23 tests passed**.

`skipped: 0` matters here and is the point of the ticket: it proves
`WEBUI_INSTALLED` was true and the mount suites genuinely executed rather than
reporting a green skip.

## External Interface Accessibility / Smoke Test

Drove the real entry point end to end (`node tools/generate/bin/1c.mjs builder
--sandbox --port 8791` over a freshly created and rendered sandbox site):

```
1c --help                       -> usage printed, `1c builder` documented
GET /                           -> 200 text/html, cache-control: no-store, must-revalidate
  importmap                     -> {"@lagrangefoundry/webui-shell":"/webui/webui-shell/src/index.js",
                                    "@lagrangefoundry/webui-split":"/webui/webui-split/src/index.js",
                                    "@lagrangefoundry/webui-fields":"/webui/webui-fields/src/index.js"}
GET /webui/webui-shell/src/index.js -> 200 text/javascript, no-store
GET /preview/smokesite/draft/   -> 200 text/html, no-store
GET /preview/.../capabilities.js -> 200 text/javascript, no-store
GET /api/sites                  -> 200 [{"slug":"smokesite","latest":null}]  (NO cache-control)
GET /api/assets?slug=smokesite  -> 200 application/json                      (NO cache-control)
GET /preview/smokesite/draft/../../../../../../etc/passwd -> 404, 9 bytes, no `root:` content
```

The rename is live and correct on the wire. The two unheadered JSON responses are
finding 1.

## Checklist Compliance

No architecture, security or design checklist reports exist for this project
(`xgd ticket list --type report --filter fields.report_kind=...` returns 0 for all
three). Sections skipped.

### TAS Compliance — **FAIL (finding 2)**

TAS: `report-62f5dd5e` (Test Architecture Summary), mirrored in
`doc-c49667b3` (Test Asset Catalogue).

| Dimension | Status | Evidence |
|-----------|--------|----------|
| Infrastructure usage | PASS | `WEBUI_INSTALLED`/`WEBUI_SKIP_REASON` (`tests/support/webui-installed.ts`) is the registry's one entry and is used exactly as the TAS prescribes — as a gate for mount-behaviour suites (`describe.skipIf` in the chrome file) and as an *outcome* assertion, never a gate, in AC-961 (`tests/reconciliation-builder-workspace-origin.test.ts:357`). Its docstring was updated to state that rule. |
| Entry points | PASS | UATs drive `startBuilder` over HTTP, `unstable_dev` for the Worker, and the `tools/generate/src/cli` barrel. No internal handler is called directly. |
| Three evidence levels | PASS | Resolution (`webuiPackageDir` + `package.json.name` identity), generated-artifact (`chromeHtml()`, never a committed snapshot), tree guard (`git ls-files` with a declared exclusion list, split-and-join self-exclusion) are all present as specified. |
| Cross-surface coupling | PASS | `test_UAT_AC960_browser_source_specifiers_are_declared_by_the_generated_document` is exactly the UAT the TAS calls for. |
| **Mock/alias boundary** | **FAIL** | The TAS states: *"The webui store ... is never stubbed, **aliased**, or vendored — faking it would fork the upstream consumption route (DOC-8 section 9.5). ... For XGD branch worktrees the store must be installed at the **worktree parent** so every worktree resolves it."* `doc-c49667b3` repeats it verbatim, and the story's own Technical Context says *"Components are never mocked, aliased or vendored in either kind of evidence."* `vitest.config.mts:47` now ships `resolve: { alias: webuiAliases() }`, and `tools/generate/src/cli/webui.ts:70-101` re-anchors production resolution at the git main checkout. Neither artifact was updated. |

## Intent/Design Compliance

No "Existing Capability Overlap" table exists in `doc-c49667b3` (it is a Test
Asset Catalogue, not a component design), so there are no DELEGATE/EXTEND rows to
grep. Reuse was checked directly against the design's stated mechanisms instead.

### Reuse Targets

| Target | Status | Evidence |
|--------|--------|----------|
| `webui.ts::WEBUI_SCOPE` as the single definition | REUSED | `tools/generate/src/cli/builder.ts:70,73` compose the scope instead of the two former hardcoded literals; `vitest.config.mts` composes from the same import. |
| `webui.ts::webuiPackageDir` as the single resolution point | REUSED | `webuiExports` (`webui.ts:153`), `chromeHtml`, the origin's `/webui/*` route, and `webuiAliases()` in `vitest.config.mts` all route through it. No second resolver was written. |
| `webui.ts::webuiExports` (package-declared entry points) | REUSED | `chromeHtml()` derives every import-map value and stylesheet link from it; verified live — the served document's map contains no hardcoded `src/index.js`. |
| `cmdPublish` for the workspace publish path | REUSED | `builder.ts:191` calls it directly; AC-972 proves the resulting revision is shape-identical to a CLI publish. |
| `serve.ts::sendFile` for the no-store directive | REUSED for files, **BYPASSED for JSON** | `sendFile` sets `no-store` for every file tree, but `json()` (`builder.ts:131`) writes its own headers and omits it. This is finding 1. |

### Other Decisions

| Decision | Implementation | Verdict |
|----------|----------------|---------|
| Scope moves in lockstep, old name deleted outright, no fallback and no dual-scope detection | `WEBUI_SCOPE = '@lagrangefoundry'` is the only scope literal; no `LEGACY_SCOPE`, no try-old-then-new; enforced by the `bug32` assertion requiring exactly one quoted scope literal in the declaring file | MATCH |
| Bounded browser-source exception, held in step rather than trusted | `apps/control-app/src/builder/{app,editor}.js` name components directly; the coupling UAT cross-checks them against `chromeHtml()` | MATCH |
| Identity evidence unconditional, mount evidence may skip | AC-960/961/963 have no `skipIf`; chrome mount suites use `describe.skipIf(!WEBUI_INSTALLED)` | MATCH |
| Superseded scope removed from *every* tracked surface including committed generated artifacts | root `index.html` deleted rather than edited | MATCH (see Warning 4 — the bug body records this inaccurately) |
| Divergence flagged, not absorbed | The local-preview-server caching divergence is recorded in the story's Technical Context; the vitest-alias divergence is **not** | DIVERGES — finding 2 |
| Story type = upgrade; no parallel/v2 implementation | Confirmed: `git diff main...HEAD` touches `app.js`/`editor.js` (2 import lines), `builder.ts` (2 composed keys), `webui.ts` (the constant + resolution anchor), and tests. No second scope constant, no `webui2`, no fallback resolver, no duplicated chrome generator | MATCH |

## AC-to-Intent Fidelity

Every active AC maps to an explicit clause of the story body — the one-name-once
rule and its bounded browser-source exception (AC-960), the byte-identical
outside-the-repo consumption and the identity-not-presence requirement (AC-961),
the named-component install diagnostic (AC-962), entry-point-derived references
(AC-963), the single origin (AC-964/965), the modes and mode-declared toolbar
(AC-966/968/969/970/971), the split and its persistence (AC-973/974), the
height chain (AC-975/976), freshness (AC-977) and confinement (AC-978/979). No
invented AC. No behaviour the intent explicitly names lacks a covering AC.

## Dependency Infrastructure Usage

The story declares no in-bundle dependencies. The consumed platform capabilities
(CAP-82 rendering/channels, the store listing, the publish path) are invoked
through their real functions (`cmdRender`, `cmdList`, `cmdPublish`) rather than
reimplemented; no purpose-built infrastructure is bypassed.

## Exception Evaluation

No `exceptions.yaml` exists under `.xgd/artifacts/`. No exceptions to evaluate.

## Issues Found

### CRITICAL 1 — AC-977: JSON API responses are served cacheable, and the UAT cannot see it

`tools/generate/src/cli/builder.ts:131-139`

```js
function json(res, status, body) {
  const payload = JSON.stringify(body)
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(payload),
  }).end(payload)          // <- no cache-control
}
```

Observed against a live origin (`1c builder --sandbox --port 8791`):

```
GET /api/sites                  -> 200, content-type: application/json, (no cache-control)
GET /api/assets?slug=smokesite  -> 200, content-type: application/json, (no cache-control)
GET /                           -> 200, cache-control: no-store, must-revalidate
GET /builder/main.js            -> 200, cache-control: no-store, must-revalidate
GET /preview/.../draft/         -> 200, cache-control: no-store, must-revalidate
GET /preview/.../capabilities.js -> 200, cache-control: no-store, must-revalidate
```

Four routes are affected: `/api/sites`, `/api/publish`, `/api/assets`,
`/api/copy`. `/api/sites` is the one an operator feels — it populates the site
selector, so a cached listing hides a newly created site behind a workspace that
looks like it is working, which is the exact symptom AC-977 exists to prevent.

The in-code comment at `builder.ts:169-173` asserts the opposite and is wrong:
*"The shell was the last cacheable response on this origin — every other route
goes through `sendFile`, which is `no-store`."* `json()` does not go through
`sendFile`.

AC-977 is categorical — *"Every response from the workspace origin"*, *"There is
no exempt response"* — so this is a criterion violation, not a scope question.
The AC's Verification paragraph enumerates only four response classes and omits
the API class, which is why the UAT passes over a violating implementation.

### WARNING 2 — TAS, design doc and story text all say "never aliased"; the code aliases

`vitest.config.mts:47` (`resolve: { alias: webuiAliases() }`, lines 3-51) and
`tools/generate/src/cli/webui.ts:70-101` (`mainCheckout()` re-anchoring
`createRequire` at the git main checkout) were introduced by `d3609ac54` to make
the components resolvable from an XGD branch worktree. The commit message
justifies it clearly and the reasoning is sound — before it, nine criteria lost
their evidence in any worktree while reporting green.

I could not construct a silent-green scenario from it, and checked both
directions: scope updated but `app.js` not -> no alias matches, vite transform
fails loudly; `app.js` updated but `WEBUI_SCOPE` not -> `webuiPackageDir` throws,
`WEBUI_INSTALLED` goes false, and the *unconditional* AC-960/961 assertions fail.
The aliases are derived from `webuiPackageDir` and point at the real store
outside the repository, so they align the transform-time route with the
production route rather than forking it.

The defect is that three currently-active artifacts still assert the opposite and
prescribe a remedy that was not taken:

- `report-62f5dd5e` (TAS) section 1: *"never stubbed, aliased, or vendored"*; *"For
  XGD branch worktrees the store must be installed at the worktree parent
  (`~/.xgd/worktrees/<repo>.git/node_modules`)"*
- `doc-c49667b3` (Test Asset Catalogue) section 1: same text
- `story-e674c60a` Technical Context: *"Components are never mocked, aliased or
  vendored in either kind of evidence"*; *"a failure to resolve should be read as
  [an environment precondition]"*

The story already models the right response to this situation in its
"Divergence flagged, not absorbed" paragraph, and that treatment was simply not
applied here. Either update the three artifacts to record the alias, its
derivation from the single resolution point, and why it does not fork the
consumption route; or drop the alias and install the store at the worktree
parent as the TAS prescribes. Leaving the artifacts contradicting the code is
the one option that is not acceptable, because the next reader will trust the
artifact.

### WARNING 3 — six red tests in adjacent suites, one of which asserts AC-971's behaviour

Confirmed by running them: `tests/req115-builder-composition.test.ts` (1 failure)
and `tests/reconciliation-copy-edit-gesture-modal.test.ts` (5 failures) — the six
the bug body predicts.

**They are pre-existing, not caused by this branch.** Verified: this branch
changes no behavioural code in the builder chrome (`git diff main...HEAD --stat
-- apps/control-app/src/builder/` is `app.js | 4 ++--` and `editor.js | 2 +-`,
both import specifiers only; `toolbar.js` and `panel.js` are untouched), and the
diffs to both failing test files are docstring-only. On `main`,
`webui.ts` resolves the old scope via `createRequire(import.meta.url)`, and that
scope is still populated in the shared store
(`/Users/martin/lagrangefoundry/node_modules/@gendevlabs/`), so from the main
checkout `WEBUI_INSTALLED` was already true and these suites already ran and
already failed there.

`test_UAT_FC_REQ-115_open_in_new_tab_matches_the_iframe_exactly` asserts the same
behaviour as AC-971, so I traced why AC-971 passes while it fails rather than
taking either result on trust. The REQ-115 test captures the anchor **once**
(`const link = app.toolbar.get('open-new-tab')`) and re-reads that handle after
`setSite`. `toolbar.js:101` subscribes `render` to both `mode` and `site`, and
`render()` calls `disposeActions()` -> `element.replaceChildren()` and builds a
**new** anchor. `panel.js:113-119` (`setSite`) calls `refresh()` — which updates
`currentSrc` and emits `src` — *before* emitting `site`, so the replacement
anchor is created with the correct href already in hand. The captured handle is
a detached survivor whose subscription was disposed; the live control in the DOM
is correct. AC-971's test re-looks-up the control each time, which is what an
operator actually clicks, so AC-971 genuinely holds and the REQ-115 failure is a
stale-DOM-handle defect in the older suite.

This is not a fail cause for STORY-99 — the failures are outside its evidence set
and belong to REQ-115 and `story-3bf94bd4` — but a permanently red suite is the
normalised-red counterpart of the silent green this whole bug is about, and it
should not be left to sit. File a follow-up ticket covering the stale-handle
assertion in `req115-builder-composition` and the five
`reconciliation-copy-edit-gesture-modal` failures.

### WARNING 4 — the bug body misrecords what happened to `index.html`

`bug-5cabb340` states: *"`index.html` (a tracked chrome artifact at the repo
root) — scope updated so it does not sit stale against the generator that
produces it."* The implementation **deletes** it (`git diff main...HEAD --
index.html` is a pure deletion of 17 lines). Deletion is the better outcome and
the one AC-960 actually requires — a committed copy of the generator's output is
itself a second definition site, and the `bug32` test comment at lines 178-182
says exactly that. Nothing read the file (no reference to a root `index.html`
exists outside `tools/generate`'s own unrelated per-page `index.html` logic), and
the origin serves `chromeHtml()` at `/`. Correct the ticket body so the record
matches the change.

## Fix-It Prompt

**One change is required to pass.** Warnings 2-4 are bookkeeping and follow-up
and do not block, but 2 should be resolved in the same pass since it is a
short artifact edit.

### Required: close the AC-977 hole, then close the evidence hole

1. **Fix the implementation.** In `tools/generate/src/cli/builder.ts`, add the
   directive to `json()` so it holds for every JSON route at once, rather than
   patching the four call sites:

   ```js
   function json(res, status, body) {
     const payload = JSON.stringify(body)
     res.writeHead(status, {
       'content-type': 'application/json; charset=utf-8',
       'content-length': Buffer.byteLength(payload),
       'cache-control': 'no-store, must-revalidate',
     }).end(payload)
   }
   ```

   Use the identical directive string `sendFile` uses, so AC-978's
   "identical across every tree" spirit — one behaviour, not three
   near-misses — holds for freshness too.

2. **Correct the comment** at `builder.ts:169-173`. It currently claims the shell
   was "the last cacheable response on this origin ... every other route goes
   through `sendFile`". Once `json()` is fixed the accurate statement is that
   two paths emit the directive — `sendFile` for every served tree and `json()`
   for every API response — and the hand-written shell is the third.

3. **Strengthen `test_UAT_AC977_every_response_the_origin_returns_is_non_cacheable`**
   in `tests/reconciliation-builder-workspace-origin.test.ts`. Add the API class,
   which is the class the current probe list omits:

   ```js
   await noStore('/api/sites')
   await noStore('/api/assets?slug=alpha')
   ```

   `noStore` currently asserts `status === 200`, which suits both. For
   `/api/publish` (POST) either extend the helper to take an init or assert the
   header on the publish response already made in the AC-972 test.

   Better still, make the check structural rather than a list, so the next route
   added to the origin is covered without anyone remembering to extend the
   probe set — the criterion's own words are "there is no exempt response", and
   a hand-maintained list of representatives is what let this one through. One
   route per class is the minimum; enumerating the origin's routing table and
   asserting the directive on each is what actually matches the claim.

4. Re-run the story's suites and confirm 23/23 still pass with the added
   assertions.

### Recommended in the same pass: reconcile the alias divergence (Warning 2)

Update `report-62f5dd5e` section 1 and `doc-c49667b3` section 1, and the story's
Technical Context, to record that Vitest resolves the components through aliases
**derived from `webuiPackageDir`** — the same single resolution point production
uses, pointing at the same out-of-repo store — and why that does not fork the
consumption route: the alias keys are composed from `WEBUI_SCOPE`, so a
one-sided rename still fails loudly in both directions. State plainly that the
alternative the TAS currently prescribes (install the store at the worktree
parent) was not taken and why. Alternatively, remove the alias and adopt the
worktree-parent install. Do not leave the artifacts asserting "never aliased"
while `vitest.config.mts:47` aliases.

### Recommended: file the follow-ups (Warnings 3-4)

- A ticket for the six pre-existing red tests, naming the stale-handle root
  cause traced above for the REQ-115 one so the next person does not re-derive it.
- A one-line correction to `bug-5cabb340`'s "What changed" list: `index.html` was
  deleted, not updated.
