---
uid: report-f94be2af
id: REPORT-1676
type: report
title: 'Report: review for story-e674c60a'
created_by: xgd
created_at: '2026-08-08T00:40:22.431005+00:00'
updated_at: '2026-08-08T00:40:22.431005+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: review
  subject_uid: story-e674c60a
---

# Sprint 1 Story STORY-99 Review (re-review after fixes)

**Status**: PASS

## Summary

The single fail cause from the prior review (`report-8ea06ca0`) — AC-977's
cacheable JSON responses, and a probe list that could not see them — is fixed
correctly and at the right altitude: the directive is now set **once, before
routing**, so every response the handler can produce inherits it, and the UAT
now derives its probe set from the origin's own routing table instead of a
hand-maintained list of representatives. Verified on the wire and by test, not
taken on the diff's word. All three warnings were also addressed: the TAS, the
Test Asset Catalogue and the story's Technical Context now record the Vitest
alias divergence honestly, and BUG-33 carries the six pre-existing red tests
with the root cause already traced.

21 of 21 active ACs are now SUFFICIENT. Lint 0/0, build success, story UATs
23/23, full suite 1226 passed with only the six known pre-existing failures.

## What changed since `report-8ea06ca0`

`5508f91a9` (`Workflow fix_review completed: done`) — 4 files, +186/-35:

| File | Change |
|------|--------|
| `tools/generate/src/cli/serve.ts` | new exported `NO_STORE = 'no-store, must-revalidate'`; `sendFile` composes from it |
| `tools/generate/src/cli/builder.ts` | `res.setHeader('cache-control', NO_STORE)` before any routing; the three per-route restatements (`/`, `/framework/*`, and the near-miss bare `no-store`) removed |
| `tests/reconciliation-builder-workspace-origin.test.ts` | AC-977 rewritten structurally; docstring records the alias as a route correction |
| `tests/bug32-webui-scope-rebrand.test.ts` | docstring records the same |

Ticket-side: `report-62f5dd5e` (TAS) and `doc-c49667b3` reconciled, `story-e674c60a`
Technical Context gained a paragraph on the route correction, `bug-5cabb340`'s
`index.html` line corrected to "**deleted**, not updated", and `bug-ede1fb8c`
(BUG-33) filed for the six red tests.

## Evidence Sufficiency

All 21 active ACs have covering UATs. All 23 covering tests re-run in this
worktree after the fix: **3 files passed, 23 tests passed**. Validity re-checked:
every test enters through a real entry point (the `1c` CLI barrel, the builder
origin over HTTP, `unstable_dev` for the Worker, real component mounts in jsdom);
none mocks repository-owned code; the only stand-ins are jsdom's absent
`ResizeObserver` and `matchMedia`, which are platform rather than repository
surfaces.

| AC | Claims | Test(s) | Assertion per claim | Broken-impl that would pass | Sufficient? |
|----|--------|---------|---------------------|-----------------------------|-------------|
| AC-959 | one tab; stable id `site`; panel inside tab content | chrome:`test_UAT_AC959_opens_exactly_one_tab_addressed_by_a_stable_id` | `TABS`/`.shell-panel` toHaveLength(1); `SITE_TAB.id==='site'` + `getActiveTab()`; `panelHost.contains(app.panel.element)` | none | SUFFICIENT |
| AC-960 | label one definition site; label drives tab + selector aria; scope one definition; superseded scope nowhere in tracked tree; scope only in declaration + browser exception; exactly one literal in declaration; browser specifiers subset of generated import map | chrome:`test_UAT_AC960_the_site_surface_name_has_exactly_one_definition_site`; bug32:`test_UAT_AC960_component_scope_is_written_in_exactly_one_place`, `test_UAT_AC960_browser_source_specifiers_are_declared_by_the_generated_document` | `hits.toHaveLength(1)`; rendered `textContent` + `aria-label`; `trackedHits(superseded).toEqual([])`; `writers.filter(not permitted).toEqual([])`; `quoted.toEqual([one literal])`; specifiers vs live `imports` keys | none — enumerates `git ls-files` not three hardcoded roots, is non-vacuous on three counts, and is split-and-joined so the guard is not its own violation | SUFFICIENT |
| AC-961 | consumed from outside repo; byte-identical; no component source in repo; resolved package's own identity under scope in use; per-component naming; asserted not skipped | origin:`test_UAT_AC961_components_are_served_byte_identical_from_outside_this_repo` | `offenders.toEqual([])`; `declared === WEBUI_SCOPE + '/' + name` per component; `dir.startsWith(REPO)` false; byte compare; `expect(WEBUI_INSTALLED).toBe(true)` as outcome | none — both scopes are in fact populated in the store, so the identity assertion is a live discriminator | SUFFICIENT |
| AC-962 | names the component; names the install command; not a bare resolver error; raised at the single resolution point | origin:`test_UAT_AC962_absent_component_names_the_component_and_the_install_command` | message contains name + `bin/install` + `--component <name>`; `not.toMatch(/Cannot find module\|ERR_MODULE_NOT_FOUND/)`; `webuiExports` message `toBe` the `webuiPackageDir` message | none | SUFFICIENT |
| AC-963 | refs derived from package `exports`; each resolves 200 with the component's bytes; no undeclared path; every key under scope in use; every consumed component present; non-empty; no superseded scope; on the freshly generated document | origin:`test_UAT_AC963_chrome_references_each_component_by_its_declared_entry_point` | per-export map value + 200 + byte compare; document's `/webui/...` refs subset of declared; `keys.length>0`; scope prefix; `toContain(scope/name)` — all against `await get('/')` | none | SUFFICIENT |
| AC-964 | one host; status, content-type and body forwarded unchanged; frame same-origin | origin:`test_UAT_AC964_one_host_answers_every_route_with_the_origin_response_verbatim` | 4 route classes compared field-by-field vs the direct origin; `previewUrl` root-relative + not absolute + served 200 through the Worker | none | SUFFICIENT |
| AC-965 | unconfigured explanatory + names start command + non-success; unreachable names address + non-success; the two distinct | origin:`test_UAT_AC965_unconfigured_and_unreachable_origins_are_distinct_failures` | 503 + `BUILDER_ORIGIN` + `1c builder`; 502 + dead address + `/unreachable/i`; `not.toBe(unconfiguredStatus)` | none | SUFFICIENT |
| AC-966 | real rendered artifact; byte-identical; referenced assets resolve same-origin | origin:`test_UAT_AC966_view_mode_serves_the_real_rendered_artifact_byte_identical` | body === on-disk `index.html`; per-asset 200 + byte compare with `assets.length>0` guarding vacuity | none | SUFFICIENT |
| AC-967 | options are exactly the store's sites; by slug; choosing changes site; mode unchanged | chrome:`test_UAT_AC967_the_site_selector_lists_exactly_the_store_and_switches_the_site` | `options.map(value)).toEqual(SITES.map(slug))`; real `change` event; `getSite()`; `getMode()===modeBefore`; frame src | none | SUFFICIENT |
| AC-968 | source changes; pane and surface same elements before/after/back; still attached | chrome:`test_UAT_AC968_switching_modes_changes_the_source_without_rebuilding_the_pane` | `toBe(pane)`/`toBe(surface)` across two switches; `second).not.toBe(first)`; `isConnected` | none | SUFFICIENT |
| AC-969 | unknown mode offered, displays its own source, gets its declared controls; no panel branch | chrome:`test_UAT_AC969_a_mode_the_panel_has_never_heard_of_works_end_to_end` | mode defined wholly in the test; `getModes()).toContain`; frame src === its declared src; `toolbar.ids()).toEqual`; its `src()` re-honoured on `setSite` | none | SUFFICIENT |
| AC-970 | exactly the declared ids; replaced on mode change; non-document mode gets no open-in-new-tab; unknown control reported | chrome:`test_UAT_AC970_the_toolbar_renders_exactly_the_active_modes_controls` | `ids()).toEqual(...)` for both modes; `get('open-new-tab')).toBeNull()` + DOM query null; `toThrow(/unknown action/)` | none | SUFFICIENT |
| AC-971 | target === displayed URL at every moment, across mode and site changes; compared directly | chrome:`test_UAT_AC971_open_in_a_new_tab_always_targets_the_displayed_document` | `target()).toBe(displayed())` at four points; non-vacuity via `displayed()).toBe('/preview/beta/draft/')` | none for the live control — the red REQ-115 assertion was traced to a stale DOM handle, now BUG-33 | SUFFICIENT |
| AC-972 | publishes the displayed site; new revision in that site's history; same form as CLI publish; published channel rendered and served; other site untouched | origin:`test_UAT_AC972_publish_creates_a_revision_for_the_displayed_site` | pre-state both empty; POST for `beta` (deliberately not the default `alpha`); revision count + message; `alpha` still 0; snapshot dir listing and key set compared to a real `cmdPublish`; published bytes served | none | SUFFICIENT |
| AC-973 | both panes, display panel primary; real divider; drag changes widths; collapses to a rail; reopens to previous width | chrome:`test_UAT_AC973_the_split_drags_collapses_to_a_rail_and_reopens_to_its_width` | containment + placeholder + divider element; `setSplit(37)` then close-to-37 and *not* close to `initial`; collapse/expand then back to 37, not the default | a divider that renders but is not draggable — jsdom does no layout, so the ratio model is exercised rather than a pointer drag; the AC delegates pixel truth to AC-975 and the restore-to-previous-not-default assertion is the load-bearing half | SUFFICIENT |
| AC-974 | divider position, collapsed side, site and mode restored; every written key namespaced | chrome:`test_UAT_AC974_layout_state_survives_reopening_and_is_namespaced` | all four mutated, app destroyed, fresh mount against the same storage, all four re-asserted; `keys.length>0` then every key `startsWith(APP_ID + ':')` plus both sub-namespaces | none — keys enumerated from a real `Storage`-shaped map, not sampled | SUFFICIENT |
| AC-975 | fills available space at any height; follows live resize; page never scrolls; reports loudly where no browser exists | origin:`test_UAT_AC975_displayed_site_fills_the_window_and_the_page_never_scrolls` | real browser; `>700` at 900px; `toBeCloseTo(tall-400)` at 500px and `toBeCloseTo(tall+200)` at 1100px; `scrollHeight - clientHeight === 0` | none — re-confirmed the measurement executes here (1531ms, real Chrome 151), not an early return | SUFFICIENT |
| AC-976 | every declared tab option delivered; iteration over the declaration; nothing silently discarded; `fill` load-bearing | chrome:`test_UAT_AC976_every_option_declared_for_a_tab_reaches_the_chrome` | loop over `Object.keys(tab)` with `expect(delivered[key]).toBeTypeOf('function')`; mutation check mounts a shell without `fill` and asserts `.shell-panel.is-fill` is null | none — the mutation check is the strongest assertion in the suite | SUFFICIENT |
| **AC-977** | **every** response non-cacheable; **no exempt response**; explicitly including the hand-written document | origin:`test_UAT_AC977_every_response_the_origin_returns_is_non_cacheable` (**rewritten**) | routing table read from `builder.ts` source; **bidirectional coverage** — `declared \ probed === []` and `probed \ declared === []`; then ~25 live probes each asserting `cache-control` `.toBe('no-store, must-revalidate')` **exactly**, plus a status expectation per probe; covers success *and* rejection shapes of every JSON route, all three channels, both preview failure modes, the edit bridge, the browser-source tree and a miss inside it, an unknown component, each installed component's real entry, and the unrouted fallthrough 404 | see analysis below — none that is a single mistake | **SUFFICIENT** |
| AC-978 | every tree refuses; not a success; none of the target's bytes; identical outcome on all three trees | origin:`test_UAT_AC978_every_served_tree_never_satisfies_a_request_that_escapes_it` | 3 trees x 3 probe forms; per probe `res.ok` false, `status>=400`, body `not.toContain(secret)`; uniformity via `[...statuses]).toHaveLength(1)` | none — re-confirmed live: traversal returns 404, 9 bytes, no `root:` | SUFFICIENT |
| AC-979 | unknown channel not found; unknown component not found; never from a neighbour; no unrelated success content | origin:`test_UAT_AC979_unknown_channel_or_component_is_answered_as_not_found` | both 404; channel body `not.toContain('<html')` and not the neighbouring page's first 40 bytes; component body `<64` bytes and not the shell's first 40 bytes | none | SUFFICIENT |

**Overall: 21 of 21 ACs sufficient.**

### AC-977 in detail — why it is now sufficient

**The implementation fix is structural, not a patch of the four call sites.**
`builder.ts` sets the directive once before routing:

```js
res.setHeader('cache-control', NO_STORE)   // before any route match
```

Node merges `setHeader` values into `writeHead`, with `writeHead` taking
precedence — and no `writeHead` in the handler names `cache-control` any more.
So the served trees, the hand-written document, every JSON envelope and every
400/403/404/500 inherit it, and a route added tomorrow inherits it without
anyone remembering. The two former near-misses were also removed: the shell's
own restatement, and the edit bridge's bare `'no-store'` (which differed from
`'no-store, must-revalidate'` used everywhere else). `serve.ts` now exports the
one `NO_STORE` constant both senders compose from, so the two paths cannot drift.

**Verified on the wire**, driving `1c builder --sandbox` — including the exact
routes that were bare before:

```
/                                 200  cache-control: no-store, must-revalidate
/api/sites                        200  cache-control: no-store, must-revalidate   <- was absent
/api/assets?slug=smoke2           200  cache-control: no-store, must-revalidate   <- was absent
/api/copy                         400  cache-control: no-store, must-revalidate
/preview/smoke2/draft/            200  cache-control: no-store, must-revalidate
/builder/main.js                  200  cache-control: no-store, must-revalidate
/framework/edit-client.js         200  cache-control: no-store, must-revalidate
/webui/webui-shell/src/index.js   200  cache-control: no-store, must-revalidate
/preview/smoke2/nosuch/           404  cache-control: no-store, must-revalidate
/no-such-route                    404  cache-control: no-store, must-revalidate
```

**The evidence fix is structural too**, which is what makes this sufficient
rather than merely patched. The old test was a hand-maintained list of
representatives and that is exactly how the JSON class shipped cacheable under a
green criterion. The new one extracts the routing table from `builder.ts`'s own
source and asserts coverage **in both directions**. I checked the extraction
against the source: `builder.ts` declares ten route literals (`/`,
`/index.html`, `/api/sites`, `/api/publish`, `/api/assets`, `/api/copy`,
`/preview/`, `/framework/`, `/webui/`, `/builder/`) and the probe set covers all
ten — which the passing bidirectional assertion independently confirms.

The reverse check is the load-bearing half and is easy to overlook: without it,
an extraction that silently stopped matching would leave `declared` empty and
`declared \ probed === []` would pass over nothing. `probed \ declared === []`
fails in that case, so the coverage check cannot go vacuous.

Two further details worth noting as correct rather than sloppy:

- The expected value is restated as a literal in the test (`const DIRECTIVE =
  'no-store, must-revalidate'`) rather than imported from `NO_STORE`. Against
  this story's written-once ethos that looks like a smell; it is the right call.
  Importing the constant would make the assertion tautological — changing
  `NO_STORE` to `public, max-age=60` would still pass. Restating it independently
  is what gives the assertion teeth.
- `.toBe(DIRECTIVE)` rather than the old `.toMatch(/no-store/)`, so the near-miss
  the edit bridge used to ship is now a failure rather than a pass.

**Residual risk, stated plainly:** a route added with a syntax none of the three
extraction regexes match (double-quoted literal, a `switch`) would not enter
`declared`, and the coverage check would not demand a probe for it. That is a
real gap but it takes *two* independent mistakes to become a defect, because
`setHeader`-before-routing means such a route still inherits the directive unless
it also explicitly overrides `cache-control` in its own `writeHead`. Against the
prior state — one omission, one silent hole — this is a different class of
exposure and does not make the criterion insufficient.

**Discriminating power is proven, not assumed.** No mutation of the tree was
needed: the pre-fix origin returned no `cache-control` on `/api/sites`
(recorded in `report-8ea06ca0` from a live run), and the new test probes
`/api/sites` with `.toBe(DIRECTIVE)`. The rewritten test fails on the code the
prior review examined.

## Quality Results

| Gate | Result | Source |
|------|--------|--------|
| Lint | success — 0 errors, 0 warnings | `report-220ff206` (post-fix, 2026-08-08T00:27:46Z) |
| Build | success — 0 errors | `report-220ff206` (post-fix) |
| Story UATs | 23/23 passed, 0 failed, 0 skipped | re-run in this worktree after the fix |
| Full suite | **1226 passed, 6 failed, 67 skipped** (183 files) | `npx vitest run`, this worktree, 53s |
| Coverage | not collected for these scoped runs | — |

The subject-scoped quality report is still the pre-fix `report-4327030c`; the
post-fix runs (`report-ab9190fd` lint, `report-220ff206` lint+build) carry no
suites. I therefore ran the tests myself rather than accepting a stale gate.

The 6 full-suite failures are the pre-existing set, unchanged in count and
identity, now tracked as **BUG-33** (`bug-ede1fb8c`). Nothing regressed: in
particular `req117-edit-loop` (which asserts `no-store` on the edit bridge —
still satisfied, `'no-store, must-revalidate'` contains it),
`req111-public-site-serving` (which asserts *cacheable* directives on the public
Worker, untouched), `reconciliation-serve-deployed-snapshot` and
`req113-serve-extensionless` all pass. `serve.ts` is shared with the standalone
`1c serve` server; the constant refactor preserves its directive byte-for-byte.

## Checklist Compliance

No architecture, security or design checklist reports exist for this project.
Sections skipped.

### TAS Compliance — **PASS** (was FAIL)

| Dimension | Status | Evidence |
|-----------|--------|----------|
| Infrastructure usage | PASS | `WEBUI_INSTALLED`/`WEBUI_SKIP_REASON` used as the TAS prescribes — a gate for mount-behaviour suites, an *outcome* assertion (never a gate) in AC-961. `webuiAliases()` is now a registered Section 2 entry rather than an undocumented mechanism. |
| Entry points | PASS | UATs drive `startBuilder` over HTTP, `unstable_dev` for the Worker, and the `tools/generate/src/cli` barrel. No internal handler called directly. AC-977's source read is a *coverage* input; every behavioural assertion is a live HTTP response. |
| Three evidence levels | PASS | Resolution, generated-artifact and tree-guard all present as specified. |
| Cross-surface coupling | PASS | The browser-specifier ↔ import-map UAT is exactly what the TAS calls for. |
| Mock/alias boundary | **PASS** | The contradiction is resolved, and resolved the right way round — by recording what ships rather than by softening the rule. `report-62f5dd5e` now carries a dedicated section explaining the alias as a *route correction*, its three containment properties (targets from `webuiPackageDir`, keys from `WEBUI_SCOPE`, nothing to alias when uninstalled), and states outright that the previously prescribed worktree-parent install **was not taken** and why — *"because code and this document disagreeing is worse than either choice: the next reader trusts the document."* `doc-c49667b3` and the story's Technical Context match. |

## Intent/Design Compliance

No "Existing Capability Overlap" table exists (`doc-c49667b3` is a Test Asset
Catalogue), so reuse was checked against the design's stated mechanisms.

### Reuse Targets

| Target | Status | Evidence |
|--------|--------|----------|
| `webui.ts::WEBUI_SCOPE` as the single definition | REUSED | `builder.ts:70,73` compose it; `vitest.config.mts` composes from the same import; the `bug32` guard proves no second literal exists |
| `webui.ts::webuiPackageDir` as the single resolution point | REUSED | `webuiExports`, `chromeHtml`, the `/webui/*` route and `webuiAliases()` all route through it; no second resolver |
| `webui.ts::webuiExports` | REUSED | every import-map value and stylesheet link derives from it; confirmed live |
| `cmdPublish` | REUSED | `builder.ts:191` calls it; AC-972 proves shape-identity with a CLI publish |
| `serve.ts::sendFile` / `NO_STORE` for freshness | REUSED, and the bypass is closed | `json()` no longer writes its own headers past the handler-level directive; both senders compose the one constant |

### Other Decisions

| Decision | Implementation | Verdict |
|----------|----------------|---------|
| Scope moves in lockstep, old name deleted outright, no fallback or dual-scope detection | one scope literal, no `LEGACY_SCOPE`, no try-old-then-new; enforced by the exactly-one-literal assertion | MATCH |
| Bounded browser-source exception, held in step not trusted | `app.js`/`editor.js` name components directly; cross-checked against `chromeHtml()` | MATCH |
| Identity evidence unconditional, mount evidence may skip | AC-960/961/963 have no `skipIf`; mount suites use `describe.skipIf` | MATCH |
| Superseded scope removed from every tracked surface incl. committed generated artifacts | root `index.html` deleted; the ticket body now records this accurately | MATCH |
| Divergence flagged, not absorbed | both divergences now recorded — the local preview server's freshness, and the Vitest route correction | MATCH (was DIVERGES) |
| Freshness: no exempt response | set once before routing; every route class verified live incl. error statuses | MATCH |
| Story type = upgrade; no parallel/v2 implementation | `git diff main...HEAD` on source: 2 import lines, 2 composed import-map keys, the scope constant + resolution anchor, one `setHeader` line, one exported constant. No second scope constant, no fallback resolver, no duplicated generator, no parallel freshness path | MATCH |

## AC-to-Intent Fidelity

Every active AC maps to an explicit clause of the story body. No invented AC; no
intent-named behaviour without a covering AC. The story's Technical Context grew
one paragraph during the fix (the route correction) — it records an
implementation decision, and introduces no criterion, so no AC is orphaned or
retro-fitted by it.

## Dependency Infrastructure Usage

No in-bundle dependencies. Consumed platform capabilities (CAP-82 channels, the
store listing, the publish path) are invoked through `cmdRender`, `cmdList` and
`cmdPublish` rather than reimplemented.

## Exception Evaluation

No `exceptions.yaml` exists under `.xgd/artifacts/`. No exceptions to evaluate.

## Issues Found

### Critical (must fix)

None.

### Warnings (should fix)

None blocking. Two observations, both already owned elsewhere:

1. **BUG-33 (`bug-ede1fb8c`) is `draft`.** The six red tests are correctly
   ticketed and the REQ-115 root cause is traced in the body so the next person
   does not re-derive it. Worth promoting out of draft so it is scheduled rather
   than merely recorded — a permanently red suite is the normalised-red
   counterpart of the silent green this bundle exists to close.
2. **AC-977's route extraction is regex-over-source.** Noted above as a residual
   gap requiring two independent mistakes to bite, given the handler-level
   `setHeader`. If the origin's routing table grows much beyond ten entries, a
   declared route table the handler iterates would remove the gap entirely and
   make the test's coverage check exact rather than inferred. Not required now.

### Resolved since the prior review

| Prior finding | Status |
|---------------|--------|
| CRITICAL 1 — JSON responses cacheable, UAT blind to it | **FIXED** — verified live and by the rewritten structural UAT |
| WARNING 2 — TAS / doc / story say "never aliased" while the code aliases | **FIXED** — all three reconciled; the TAS records that the prescribed alternative was rejected and why |
| WARNING 3 — six red tests, one asserting AC-971's behaviour | **FIXED** — BUG-33 filed with the traced stale-DOM-handle root cause and the correct fix direction (re-read the control; do not change `toolbar.js`) |
| WARNING 4 — bug body misrecords `index.html` as updated | **FIXED** — now reads "**deleted**, not updated", with the reason |
