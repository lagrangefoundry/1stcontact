---
uid: report-92b9aee8
id: REPORT-1627
type: report
title: 'Capability-Intent Alignment: Builder Workspace: Chrome, Origin & Display Panel
  (level=uat)'
created_by: xgd
created_at: '2026-08-07T21:01:50.127939+00:00'
updated_at: '2026-08-07T21:01:50.127939+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-a994b8f3
  level: uat
  violations: 2
  warnings: 1
  needs_review_count: 0
---

# Capability-Intent Alignment: Builder Workspace: Chrome, Origin & Display Panel
# Level: uat

**Result**: FAIL
**Violations**: 2
**Warnings**: 1
**Needs review**: 0

Anchor report: report-17a279f7 · Capability: capability-a994b8f3 (CAP-85) ·
Story: story-e674c60a (STORY-99, `story_kind=feature`) · Previous attempts: 1

## Cumulative Intent Considered

Level is `uat`, so AC bodies are the working reference. The intent ledger is
recorded for the drift artifact and was consulted only to confirm that AC-1029
(added since the last cycle) traces to live intent.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUNDLE-16 (`bundle-15c1f647`) — REQ-117 + REQ-115 + REQ-44 | free_and_reconciled | 2026-08-07, merged at `1741ee5d1` | The sole intent behind STORY-99. REQ-115 asks for the builder shell: webui consumption, `site` tab, **multi-mode display panel** + toolbar. REQ-117 asks for the copy-editing loop, whose *reachability over this origin* (not its semantics) STORY-99 carries. REQ-44 is tooling hygiene, no matrix surface here. | YES |

No `updated_by` chain exists on the capability, the story or any AC — BUNDLE-16
is the only intent that has touched this tree. Sibling stories under the same
bundle (STORY-100 write path, STORY-101 editing gesture) own the semantics this
story deliberately excludes; no AC here trespasses on them.

AC-1029 was created at 2026-08-07T20:47Z (after the story body's last edit at
20:27Z) by the preceding `ac`-level cycle. It traces cleanly to REQ-115's
"multi-mode display panel" and to the story body's "the editable *mode* is
registered here" — it is live intent, not an orphan.

## Alignment Ledger

21 of 22 active ACs have exactly one AC-traceable UAT; the mapping is 1:1 with
no test claiming two ACs. Evidence lives in
`tests/reconciliation-builder-workspace-chrome.test.ts` (jsdom, 10 tests) and
`tests/reconciliation-builder-workspace-origin.test.ts` (real HTTP over
`startBuilder`, `unstable_dev` Worker, and a real browser for AC-975).

| Element | UAT | Outcome |
|---|---|---|
| AC-959 | `test_UAT_AC959_opens_exactly_one_tab_addressed_by_a_stable_id` | aligned — asserts the tab *count* (not mere presence), the stable id `site`, and panel containment, exactly as the AC's verification demands |
| AC-960 | `test_UAT_AC960_the_site_surface_name_has_exactly_one_definition_site` | aligned — real source-tree walk over `apps`/`tools`/`packages`; asserts the sole hit is the `SITE_TAB` declaration |
| AC-961 | `test_UAT_AC961_components_are_served_byte_identical_from_outside_this_repo` | aligned — unconditional vendoring scan + byte-identity and outside-repo assertions when installed |
| AC-962 | `test_UAT_AC962_absent_component_names_the_component_and_the_install_command` | aligned — named error type, component name, `bin/install` command, *and* the single-resolution-point claim via `webuiExports`/`chromeHtml` |
| AC-963 | `test_UAT_AC963_chrome_references_each_component_by_its_declared_entry_point` | aligned — import map parsed from the served document, every declared export fetched, and the negative sweep for undeclared `/webui/` paths |
| AC-964 | `test_UAT_AC964_one_host_answers_every_route_with_the_origin_response_verbatim` | aligned — front-vs-origin comparison over four route classes; same-origin proven via root-relative `previewUrl` served by the same host. The AC's "conditioned on a front being interposed" carve-out is honoured |
| AC-965 | `test_UAT_AC965_unconfigured_and_unreachable_origins_are_distinct_failures` | aligned — two real Workers, 503-vs-502, `1c builder` named, dead address echoed |
| AC-966 | `test_UAT_AC966_view_mode_serves_the_real_rendered_artifact_byte_identical` | aligned — body compared to the on-disk artifact, plus every referenced asset |
| AC-967 | `test_UAT_AC967_the_site_selector_lists_exactly_the_store_and_switches_the_site` | aligned — option values equal the store set; mode held constant across the site change |
| AC-968 | `test_UAT_AC968_switching_modes_changes_the_source_without_rebuilding_the_pane` | aligned — element identity across two switches, plus `isConnected` so identity is not passing on detached survivors |
| AC-969 | `test_UAT_AC969_a_mode_the_panel_has_never_heard_of_works_end_to_end` | aligned — mode defined entirely in the test; offered, displayed, toolbar-derived, and its `src` fn honoured on a site change |
| AC-970 | `test_UAT_AC970_the_toolbar_renders_exactly_the_active_modes_controls` | aligned — exact-equality on ids for two modes, the no-document case, and the unknown-control report |
| AC-971 | `test_UAT_AC971_open_in_a_new_tab_always_targets_the_displayed_document` | aligned — direct comparison against the displayed URL (not a reconstruction), across four state changes, with a non-vacuity assertion |
| AC-972 | `test_UAT_AC972_publish_creates_a_revision_for_the_displayed_site` | **gap — finding 2**: proves the revision/existing-path/served-channel halves, but never publishes *from the workspace* |
| AC-973 | `test_UAT_AC973_the_split_drags_collapses_to_a_rail_and_reopens_to_its_width` | **partial — finding 3**: collapse/reopen-to-previous-width proven at the model level; the drag gesture and the rail rendering are not exercised |
| AC-974 | `test_UAT_AC974_layout_state_survives_reopening_and_is_namespaced` | aligned — all four values, real destroy-and-remount against the same storage, exhaustive key-prefix enumeration |
| AC-975 | `test_UAT_AC975_displayed_site_fills_the_window_and_the_page_never_scrolls` | aligned — real chromium, three viewport heights with delta assertions, zero page overflow, loud report where no browser launches |
| AC-976 | `test_UAT_AC976_every_option_declared_for_a_tab_reaches_the_chrome` | aligned — iterates the *declaration's* keys so a later option fails until stated, and carries the mutation check the AC explicitly requires |
| AC-977 | `test_UAT_AC977_every_response_the_origin_returns_is_non_cacheable` | aligned — every response class incl. the served edit-client bytes, the JSON operations, and five refusals; asserted on the header alone |
| AC-978 | `test_UAT_AC978_every_served_tree_never_satisfies_a_request_that_escapes_it` | aligned — three trees × three encodings, non-delivery of the targeted bytes, and the single-status set that makes uniformity observable |
| AC-979 | `test_UAT_AC979_unknown_channel_or_component_is_answered_as_not_found` | aligned — 404 plus the negative content checks against the neighbouring valid artifact |
| AC-1029 | *(none)* | **gap — finding 1**: no `test_UAT_AC1029_*` exists anywhere (`grep` for `1029` across `tests/`, `apps/`, `packages/`, `tools/` returns 0 hits) |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | coverage | AC-1029 (`acceptance_criterion-f1115dda`, active, created 2026-08-07T20:47Z) | uat-add | The AC has **no UAT at all**. It was added by the preceding `ac`-level cycle and the `uat` level has not caught up. `test_UAT_AC968_*` (`tests/reconciliation-builder-workspace-chrome.test.ts:238`) does incidentally call `panel.setMode('edit')` and observe `/preview/alpha/edit/`, but AC-1029's own body states AC-968 and AC-969 are "deliberately mode-agnostic and a workspace shipping no editable mode of its own would still satisfy them" — so that test is explicitly disclaimed as evidence for this criterion. The behaviour does exist in production code (`apps/control-app/src/builder/app.js:64-69` registers `edit` → `previewUrl(site, 'edit')`); this is missing evidence, not a code defect. | Author `test_UAT_AC1029_workspace_registers_an_editable_mode_showing_the_edit_channel`. Per the AC's verification it must assert on the mode the **workspace itself** registers (never one supplied by the test): that `panel.getModes()` offers `edit` alongside `view`; that selecting it makes the displayed address the current site's edit channel, distinct from the view mode's address for the same site; that fetching that address over the workspace origin returns that site's edit rendering; and that mode and site **compose** — with `edit` active, `setSite('beta')` follows to beta's edit channel, and switching back to `view` returns to the ordinary channel. The origin suite already renders the `edit` channel for both sites in `makeWorkspace()` (`tests/reconciliation-builder-workspace-origin.test.ts:56-64`), so the fetch half needs no new fixture. |
| 2 | violation | consistency | AC-972 (`acceptance_criterion-285b8c08`) / `test_UAT_AC972_publish_creates_a_revision_for_the_displayed_site` (`tests/reconciliation-builder-workspace-origin.test.ts:116`) | uat-edit | The test never invokes publish **from the workspace** — it POSTs `{slug:'beta'}` directly to `/api/publish` (line 124-128). That proves the endpoint honours the slug it is handed; it does not prove the AC's load-bearing first clause, "publishes the site currently displayed — **not a default or previously selected one**". Nothing in the AC-traceable evidence touches `publishAction` (`apps/control-app/src/builder/toolbar.js:187-208`), which is the only place `panel.getSite()` supplies the slug. A regression that sent `sites[0].slug`, or a stale captured slug, would leave this test green. The test's own comment ("`beta` is deliberately NOT the site the panel opens on") asserts a workspace-selection property the test body never establishes, since no panel is mounted in that suite. **The behaviour is not unproven in the repo** — `test_UAT_FC_REQ-115_publish_button_calls_publish_for_the_shown_site` (`tests/req115-builder-composition.test.ts:239`) clicks the real control after `setSite('beta')` and asserts `publish` was called with `'beta'` — but that is a free-coded, non-AC-traceable test with a mocked `publish`, so it does not discharge the matrix's obligation. No code fix is indicated. | Extend the AC-972 evidence to cover the displayed-site half. Cheapest repair: add a chrome-suite arrangement (or a second block in the existing origin test) that mounts the workspace with a `publish` that forwards to the real `/api/publish`, calls `app.panel.setSite('beta')`, clicks `app.toolbar.get('publish')`, and then makes the *existing* revision assertions — so the slug reaching the platform's publish path is demonstrably the one the pane is displaying rather than one hand-written into the request body. |
| 3 | warning | consistency | AC-973 (`acceptance_criterion-e1acae35`) / `test_UAT_AC973_the_split_drags_collapses_to_a_rail_and_reopens_to_its_width` (`tests/reconciliation-builder-workspace-chrome.test.ts:399`) | uat-edit | Two sub-claims of the AC are asserted more weakly than its verification section states. (a) "a divider the operator can **drag** … assert the widths change accordingly": the test asserts a divider *element exists* (line 406) and then calls `app.split.setSplit(37)` — the model setter, not the gesture; no pointer/mouse event is ever dispatched (`grep` for `pointerdown|mousedown|dragTo` in the file returns only the comment on line 405). (b) "collapse the secondary side and assert it **renders as a rail**": the test asserts `isCollapsed()` is truthy (line 418), which is the state flag, not the rendering. The test documents (a) honestly — jsdom performs no layout — and the reopen-to-previous-width core, which is the criterion's real substance, is proven. Graded a warning rather than a violation because the untested residue is `webui-split`'s own gesture and paint, which the story lists as out of scope ("Any change to a shared UI component"). | Opportunistic: the origin suite already launches a real chromium for AC-975 (`tests/reconciliation-builder-workspace-origin.test.ts:566-649`). Move or mirror the drag there — `page.mouse` down/move/up on the divider, asserting the two panes' measured widths move — and assert the collapsed secondary's measured width is rail-sized. If that is judged out of scope, amend AC-973's verification to say what a layout-less environment can prove (the split model) and mark the gesture as covered by the component's upstream. |

## Notes for the Editor

**The one thing that must change to reach PASS is finding 1.** Finding 2 is a
narrowing of existing evidence rather than new evidence, and finding 3 is a
warning that does not gate.

**No `code-issue` was raised, and none is warranted.** Both violations are
evidence gaps: for AC-1029 the registration exists at
`apps/control-app/src/builder/app.js:64-69`, and for AC-972 the displayed-site
wiring exists at `apps/control-app/src/builder/toolbar.js:196` (`const slug =
panel.getSite()`). Do not send either to a code fix loop.

**Free-coded suites coexist with the reconciliation suites, by repo-wide
convention — this is not drift and needs no action.**
`tests/req115-builder-composition.test.ts`,
`tests/req115-builder-shell.test.ts` and `tests/req117-builder-viewport-fill.test.ts`
carry `test_UAT_FC_REQ-115_*`/`REQ-117` tests that overlap the AC-named
reconciliation suites almost one-for-one. This mirrors the pattern across the
whole repository (47 `reconciliation-*.test.ts` files alongside 97 `req*` files;
DOC-2 itself cites `test_UAT_FC_REQ-82_*` as canonical security evidence while
`tests/req82-l1-substrate.test.ts` is retained). It is therefore recorded as an
observation, **not** an exclusivity violation. The practical consequence for
this cycle is only the one noted in finding 2: an FC test may cover behaviour
that the AC-traceable test does not, and FC coverage does not discharge a
matrix obligation.

**Evidence on this machine is largely unexecuted, by design.** A real run of the
chrome suite here gives `1 passed | 9 skipped` — the `@gendevlabs/webui-*`
components are not installed, and `describe.skipIf(!WEBUI_INSTALLED)` skips with
a reported reason. This is the coverage gap the story's Technical Context
declares explicitly ("treat the component-mounting evidence as unverifiable
until a private registry exists"), and the suites handle it correctly: the
criteria with a machine-independent core (AC-960, AC-961, AC-977, AC-978) assert
that core unconditionally and warn loudly about the unreachable part, and
components are never mocked. **Whoever adds the AC-1029 test must follow the
same discipline** — mount the real registered mode under
`describe.skipIf(!WEBUI_INSTALLED)`, and place the origin-fetch half (which
needs no components) where it runs unconditionally, rather than substituting a
stand-in panel to get a green run.

**Intent-side check performed and clean.** Every AC in this capability traces to
BUNDLE-16, which is `free_and_reconciled`; no AC describes behaviour a later
intent retired, and no reconciled intent behaviour is missing from the AC tree.
No ambiguity was encountered, hence zero `needs_review`.
