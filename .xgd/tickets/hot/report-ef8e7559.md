---
uid: report-ef8e7559
id: REPORT-1629
type: report
title: 'Capability-Intent Alignment: Builder Workspace: Chrome, Origin & Display Panel
  (level=uat)'
created_by: xgd
created_at: '2026-08-07T21:13:10.801981+00:00'
updated_at: '2026-08-07T21:13:10.801981+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-a994b8f3
  level: uat
  violations: 0
  warnings: 1
  needs_review_count: 0
---

# Capability-Intent Alignment: Builder Workspace: Chrome, Origin & Display Panel
# Level: uat

**Result**: PASS
**Violations**: 0
**Warnings**: 1
**Needs review**: 0

Anchor report: report-17a279f7 · Capability: capability-a994b8f3 (CAP-85) ·
Story: story-e674c60a (STORY-99, `story_kind=feature`) · Previous attempts: 1

Supersedes REPORT-1627 (`report-92b9aee8`), which failed this level with 2
violations. **Both were repaired by commit `787c0f491` and independently
re-verified here by execution, not by reading the diff.** The one warning is
carried forward unchanged; warnings do not gate.

## Cumulative Intent Considered

Level is `uat`, so AC bodies are the working reference. The intent ledger was
re-read to confirm nothing shifted under the fix commit.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUNDLE-16 (`bundle-15c1f647`) — REQ-117 + REQ-115 + REQ-44 | free_and_reconciled | 2026-08-07, merged at `1741ee5d1` | The sole intent behind STORY-99. REQ-115 asks for the builder shell: webui consumption, `site` tab, **multi-mode display panel** + toolbar. REQ-117 asks for the copy-editing loop, whose *reachability over this origin* (not its semantics) STORY-99 carries. REQ-44 is tooling hygiene, no matrix surface here. | YES |

No `updated_by` chain exists on the capability, the story or any AC — BUNDLE-16
remains the only intent that has touched this tree. Sibling stories under the
same bundle (STORY-100 write path, STORY-101 editing gesture) own the semantics
this story excludes; no AC trespasses on them. AC-1029 traces to REQ-115's
"multi-mode display panel" and to the story body's "the editable *mode* is
registered here". No AC describes behaviour a later intent retired, and no
reconciled intent behaviour is missing from the AC tree — hence zero
`needs_review`.

## Alignment Ledger

**22 active ACs ↔ 22 AC-traceable UATs, exactly 1:1**, verified by
`grep -o test_UAT_AC[0-9]* | sort | uniq -c` over the three suites: 22 distinct
names, none appearing twice. Evidence lives in:

- `tests/reconciliation-builder-workspace-chrome.test.ts` — jsdom, 10 tests
- `tests/reconciliation-builder-workspace-origin.test.ts` — real HTTP over `startBuilder`, `unstable_dev` Worker, real chromium for AC-975; 10 tests
- `tests/reconciliation-builder-workspace-mounted.test.ts` — **new in `787c0f491`**; jsdom chrome mounted *over a live builder origin*, 2 tests

| Element | UAT | Outcome |
|---|---|---|
| AC-959 | `test_UAT_AC959_opens_exactly_one_tab_addressed_by_a_stable_id` | aligned — asserts the tab *count*, the stable id `site`, and panel containment |
| AC-960 | `test_UAT_AC960_the_site_surface_name_has_exactly_one_definition_site` | aligned — real source-tree walk; sole hit is the `SITE_TAB` declaration |
| AC-961 | `test_UAT_AC961_components_are_served_byte_identical_from_outside_this_repo` | aligned — unconditional vendoring scan + byte-identity/outside-repo when installed |
| AC-962 | `test_UAT_AC962_absent_component_names_the_component_and_the_install_command` | aligned — named error type, component name, `bin/install`, and the single-resolution-point claim |
| AC-963 | `test_UAT_AC963_chrome_references_each_component_by_its_declared_entry_point` | aligned — import map parsed from the served document + negative sweep for undeclared `/webui/` paths |
| AC-964 | `test_UAT_AC964_one_host_answers_every_route_with_the_origin_response_verbatim` | aligned — front-vs-origin comparison over four route classes; the AC's "conditioned on a front being interposed" carve-out honoured |
| AC-965 | `test_UAT_AC965_unconfigured_and_unreachable_origins_are_distinct_failures` | aligned — two real Workers, 503-vs-502, `1c builder` named, dead address echoed |
| AC-966 | `test_UAT_AC966_view_mode_serves_the_real_rendered_artifact_byte_identical` | aligned — body compared to the on-disk artifact, plus every referenced asset |
| AC-967 | `test_UAT_AC967_the_site_selector_lists_exactly_the_store_and_switches_the_site` | aligned — option values equal the store set; mode held constant across the site change |
| AC-968 | `test_UAT_AC968_switching_modes_changes_the_source_without_rebuilding_the_pane` | aligned — element identity across two switches plus `isConnected` |
| AC-969 | `test_UAT_AC969_a_mode_the_panel_has_never_heard_of_works_end_to_end` | aligned — mode defined entirely in the test; offered, displayed, toolbar-derived, `src` fn honoured on a site change |
| AC-970 | `test_UAT_AC970_the_toolbar_renders_exactly_the_active_modes_controls` | aligned — exact-equality on ids for two modes, the no-document case, the unknown-control report |
| AC-971 | `test_UAT_AC971_open_in_a_new_tab_always_targets_the_displayed_document` | aligned — direct comparison against the displayed URL across four state changes, with a non-vacuity assertion |
| **AC-972** | `test_UAT_AC972_publish_creates_a_revision_for_the_displayed_site` (**moved** to `…-mounted.test.ts:212`) | **REPAIRED — see "What changed" below.** Now aligned on all three clauses |
| AC-973 | `test_UAT_AC973_the_split_drags_collapses_to_a_rail_and_reopens_to_its_width` | **partial — warning 1 (carried forward)**: collapse/reopen-to-previous-width proven at the model level; the drag gesture and the rail rendering are still not exercised |
| AC-974 | `test_UAT_AC974_layout_state_survives_reopening_and_is_namespaced` | aligned — all four values, real destroy-and-remount against the same storage, exhaustive key-prefix enumeration |
| AC-975 | `test_UAT_AC975_displayed_site_fills_the_window_and_the_page_never_scrolls` | aligned — real chromium, three viewport heights with delta assertions, zero page overflow, loud report where no browser launches |
| AC-976 | `test_UAT_AC976_every_option_declared_for_a_tab_reaches_the_chrome` | aligned — iterates the *declaration's* keys, and carries the mutation check the AC requires |
| AC-977 | `test_UAT_AC977_every_response_the_origin_returns_is_non_cacheable` | aligned — every response class incl. served edit-client bytes, JSON operations and five refusals; header-only assertion |
| AC-978 | `test_UAT_AC978_every_served_tree_never_satisfies_a_request_that_escapes_it` | aligned — three trees × three encodings, non-delivery of targeted bytes, single-status set proving uniformity |
| AC-979 | `test_UAT_AC979_unknown_channel_or_component_is_answered_as_not_found` | aligned — 404 plus negative content checks against the neighbouring valid artifact |
| **AC-1029** | `test_UAT_AC1029_workspace_registers_an_editable_mode_showing_the_edit_channel` (**new**, `…-mounted.test.ts:146`) | **REPAIRED — see "What changed" below.** Now aligned |

## What changed since REPORT-1627 — and how it was verified

Commit `787c0f491` (`test(builder-workspace): AC-1029 evidence, AC-972
displayed-site half`) added `tests/reconciliation-builder-workspace-mounted.test.ts`
(+289) and trimmed `…-origin.test.ts` (−51). Its premise is sound and matches
the diagnosis in REPORT-1627: both criteria need a mounted workspace **and** a
live origin simultaneously, which neither sibling suite can host (chrome is
jsdom with no origin; origin is node with no DOM). The new suite starts the real
builder origin under jsdom.

**Former violation 1 — AC-1029 had no UAT. Resolved.**
`…-mounted.test.ts:146` asserts, against a workspace produced by the shipped
`mountBuilder` with **no mode registered by the test**: `getModes()` offers both
`view` and `edit`; selecting `edit` puts the current site's edit channel in
`getSrc()` *and* in the live `frame` src, distinct from the view address;
fetching *the address the pane is displaying* over the origin returns that
site's real edit rendering byte-for-byte; and mode/site **compose** —
`setSite('beta')` follows to beta's edit channel and `setMode('view')` returns
to the ordinary channel. That is AC-1029's verification section clause for
clause, including its explicit demand that "the editable mode used throughout
must be the one the workspace registers, not one supplied by the test".

**Former violation 2 — AC-972 never published from the workspace. Resolved.**
`…-mounted.test.ts:212` keeps every assertion the old origin-suite test made
(revision appended to the right site, snapshot shape identical to a CLI publish,
published channel rendered and served) and adds the missing load-bearing clause:
the workspace is mounted with the app's own `publishSite` aimed at the real
origin, opens on `alpha`, is switched to `beta`, and the **real toolbar control
is clicked** (`app.toolbar.get('publish').click()`) — nothing about the request
is hand-written. It then waits for `beta` to reach 2 revisions and asserts
`alpha` stayed at 1, so a regression sending `sites[0].slug` or a stale captured
slug would fail. This closes the gap exactly where REPORT-1627 located it
(`apps/control-app/src/builder/toolbar.js:196`).

**Executed, not just read.** I ran all three suites:

- `…-mounted.test.ts` → `2 passed`. Verbose run confirms both tests reach their
  unconditional halves against the live origin and then emit the two
  `NOT VERIFIED here` warnings for the component-dependent halves.
- `…-chrome.test.ts` + `…-origin.test.ts` → `11 passed | 9 skipped (20)`.
  The origin suite is now 10 tests (AC-972 moved out, not duplicated).

The assertions cannot pass vacuously: they compare response bodies against files
that exist only if `cmdRender` ran, and pin statuses and revision counts exactly.

**No stale residue from the move.** `cmdRevisions` is no longer imported by the
origin suite (0 occurrences), so the trim left no unused import; `…-origin.test.ts:115-123`
carries a pointer comment in place of the moved test, not a dangling stub.

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | consistency | AC-973 (`acceptance_criterion-e1acae35`) / `test_UAT_AC973_…` (`tests/reconciliation-builder-workspace-chrome.test.ts:399`) | uat-edit | Carried forward from REPORT-1627, unaddressed by `787c0f491` (which touched only two other files). Two sub-claims are asserted more weakly than the AC's verification states. (a) "a divider the operator can **drag** … assert the widths change accordingly": the test asserts a divider *element exists* (line 406) then calls `app.split.setSplit(37)` — the model setter, not the gesture; no pointer event is dispatched anywhere in the file. (b) "collapse the secondary side and assert it **renders as a rail**": the test asserts `isCollapsed()` is truthy (line 418), the state flag rather than the rendering. The test documents (a) honestly — jsdom performs no layout — and the reopen-to-previous-width core, which is the criterion's substance, is proven. Graded a warning because the untested residue is `webui-split`'s own gesture and paint, which the story lists as out of scope ("Any change to a shared UI component"). | Opportunistic only. The origin suite already launches a real chromium for AC-975 (`…-origin.test.ts:566-649`); mirror the drag there via `page.mouse` down/move/up on the divider, asserting the two panes' *measured* widths move, and assert the collapsed secondary's measured width is rail-sized. If judged out of scope, amend AC-973's verification to state what a layout-less environment can prove and mark the gesture as covered upstream. |
| 2 | info | coverage | all mounted-chrome evidence | — | Evidence on this machine is largely unexecuted **by design**. The chrome suite gives `1 passed | 9 skipped`; AC-963, AC-964 and AC-975 early-return in 0ms; both mounted tests report their chrome half unverified. The `@gendevlabs/webui-*` components arrive from an out-of-band install, so `describe.skipIf(!WEBUI_INSTALLED)` and the `unverified()` reporter fire. This is the gap STORY-99's Technical Context declares explicitly ("treat the component-mounting evidence as unverifiable until a private registry exists"), and the suites handle it correctly — component-independent cores assert unconditionally, components are never mocked. | none |
| 3 | info | exclusivity | AC-968 / AC-1029; AC-961 / AC-963 | — | Checked for redundancy introduced by the new suite and found none. AC-968's test touches `setMode('edit')` but its scenario is *element identity across a switch*; AC-1029's is *registration, channel identity and site composition against a live origin* — different scenarios and different shapes. AC-961 and AC-963 both byte-compare served components, but AC-961's subject is byte-identity/outside-repo and AC-963's is entry-point derivation; each comparison is demanded by its own AC. | none |
| 4 | info | exclusivity | free-coded `req115-*` / `req117-*` suites | — | `tests/req115-builder-composition.test.ts`, `tests/req115-builder-shell.test.ts` and `tests/req117-builder-viewport-fill.test.ts` carry `test_UAT_FC_REQ-*` tests overlapping the AC-named suites almost one-for-one. This mirrors repo-wide convention (47 `reconciliation-*.test.ts` alongside 97 `req*`; DOC-2 cites `test_UAT_FC_REQ-82_*` as canonical security evidence while `tests/req82-l1-substrate.test.ts` is retained). Recorded as an observation, **not** a violation. | none |

## Notes for the Editor

**Nothing is required to pass this level.** The single open item is warning 1
(AC-973's drag gesture and rail rendering), which is opportunistic.

**Do not re-open the two repaired criteria.** Both were verified by execution in
this cycle, and both repairs were made in the test layer where they belonged —
no production code changed, correctly, since REPORT-1627 established that the
behaviour already existed at `apps/control-app/src/builder/app.js:64-69`
(edit-mode registration) and `apps/control-app/src/builder/toolbar.js:196`
(`panel.getSite()` supplying the publish slug). No `code-issue` was raised at
either cycle and none is warranted.

**The new suite is the right home for future seam criteria.** Any later AC whose
subject is the join between mounted chrome and a live origin should go in
`reconciliation-builder-workspace-mounted.test.ts` rather than being forced into
the jsdom-only or node-only sibling. It already follows the story's stated
discipline: unconditional half first, loud `unverified()` report for the half
requiring the out-of-band component install, and never a stand-in panel.

**One durable caveat for whoever runs this matrix on CI.** A green run on a
machine without the webui components proves materially less than it appears to —
9 chrome tests and both mounted-chrome halves are skipped or short-circuited.
The story names a private registry as the fix. Until then, treat "uat level
passes" as "passes to the limit this machine can reach", which the suites report
honestly in stderr on every run.
