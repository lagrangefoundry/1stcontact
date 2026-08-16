---
uid: report-7de87c48
id: REPORT-2102
type: report
title: 'Capability-Intent Alignment: Builder Workspace: Chrome, Origin & Display Panel
  (level=uat)'
created_by: xgd
created_at: '2026-08-16T09:56:19.683023+00:00'
updated_at: '2026-08-16T09:56:19.683023+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-a994b8f3
  level: uat
  violations: 0
  warnings: 3
  needs_review_count: 0
---

# Capability-Intent Alignment: Builder Workspace: Chrome, Origin & Display Panel
# Level: uat

**Result**: PASS
**Violations**: 0
**Warnings**: 3
**Needs review**: 0

Anchor report: report-7ef6a9ea · Capability: capability-a994b8f3 (CAP-85) ·
Story: story-e674c60a (STORY-99, `story_kind=upgrade`) · Previous attempts: 3

The capability has exactly one story carrying **30 active ACs**, every one
`kind=behavior`, `regression_only=false`. Each has at least one
AC-traceable UAT and every one of those UATs drives real entry points. The
three findings below are all warnings; none gates.

**Supersedes REPORT-1628 (`report-ef8e7559`, 2026-08-07, PASS 0/1/0), which
checked 22 ACs.** Eight ACs have been authored since — AC-1030 (BUG-32 window,
2026-08-08) and AC-1029, AC-1031…AC-1036, AC-1110 (REQ-119 / BUG-33,
2026-08-10) — and AC-960, AC-961, AC-963, AC-970 and AC-973 were rewritten in
the same window. This is the first uat-level check over that surface.

## Cumulative Intent Considered

Level is `uat`, so **AC bodies are the working reference**. The ledger is
recorded as the drift artifact and was consulted only where an AC looked
suspicious (AC-966, below). It is carried forward from REPORT-2101
(`report-5a4cf7a4`, ac level) and independently re-confirmed against the
capability's and story's `intent_uid` / `updated_by` chains.

| Intent ID | UID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|---|
| BUNDLE-16 | `bundle-15c1f647` | free_and_reconciled | 2026-08-07 (`1741ee5d`) | REQ-115 + REQ-117 + REQ-44; the `intent_uid` of STORY-99 | YES |
| REQ-115 | `request-a6740b4a` | free_and_reconciled | 2026-07-31, merged 08-07 | Builder shell: webui consumption, `site` tab, multi-mode panel, toolbar. Origin of AC-959…AC-979 | YES |
| REQ-117 | `request-395b67e6` | free_and_reconciled | 2026-07-31, merged 08-07 | Copy editing end to end; contributes `/api/copy` and `/framework/edit-client.js` reachability here | YES |
| REQ-44 | — | free_and_reconciled | 2026-08-07 | Install preflight; builder explicitly ungated — no ask lands here | YES (no ask) |
| BUG-32 | `bug-5cabb340` | merged | 2026-08-08 | Component scope rename in lockstep, one definition site, browser-source exception, consumption evidence made unconditional. Rewrote AC-960/961/963; the window AC-1030 was authored in | YES |
| REQ-119 | `request-64864801` | free_and_reconciled | merged 2026-08-10 (`0198704b`) | **Request-time draft and edit renders**: one implementation with a writer and a reader, no artifact on disk, invalid draft surfaced, published untouched. Origin of AC-1031…AC-1036 | YES |
| BUG-33 | `bug-ede1fb8c` | free_and_reconciled | 2026-08-10 (`f1664c55`) | Toolbar re-derives on mode **and** site; a replaced control is inert. Origin of AC-1110, widened AC-970. The only `updated_by` on STORY-99 | YES |
| REQ-122 | — | free_and_reconciled | 2026-08-10 | Builder chat panel — the *content* of the secondary pane; owned elsewhere, correctly excluded by AC-973 | YES (elsewhere) |
| REQ-145 / REQ-147 | — | **draft** | 2026-08-15 | control-app becomes the builder, L1 render in workerd, proxy deleted | NO — not active |
| REQ-112 | — | **abandoned** | 2026-08-08 | — | NO |

REQ-145 being `draft` keeps the STORY-99 "the origin runs outside the edge
Worker … deliberate and temporary" clause and the proxy-conditioned carve-out
in AC-964's evidence **current, not stale**.

## Alignment Ledger

**30 active ACs ↔ 37 AC-traceable UAT functions across 8 files.** The mapping is
1:1 except where an AC has more than one clause needing a different test shape
(AC-960 ×3, AC-970 ×2, AC-1030 ×5) — those are complementary, not duplicates.

Evidence lives in:

- `tests/reconciliation-builder-workspace-chrome.test.ts` — jsdom over the real
  installed components
- `tests/reconciliation-builder-workspace-origin.test.ts` — real HTTP over
  `startBuilder`, `unstable_dev` Worker, real chromium for AC-975
- `tests/reconciliation-builder-workspace-mounted.test.ts` — jsdom chrome
  mounted over a live builder origin
- `tests/reconciliation-builder-request-time-render.test.ts` — real HTTP,
  unconditional (needs no components)
- `tests/reconciliation-builder-toolbar-lifetime.test.ts` — jsdom, BUG-33
- `tests/reconciliation-component-resolution-anchor.test.ts` — fixture checkout
  shapes, the shipped resolver run in a real `node`
- `tests/bug32-webui-scope-rebrand.test.ts` — tracked-file enumeration
- (`tests/support/webui-installed.ts` — the presence gate)

**Environment precondition checked, not assumed.** The shared artifact store is
installed for this repository: `@lagrangefoundry/webui-{shell,split,fields,chat,markdown}`
resolve from `/Users/martin/lagrangefoundry/node_modules`, anchored via the
worktree's `.git` pointer → `commondir` → main checkout
`/Users/martin/lagrangefoundry/1stcontact`. So `WEBUI_INSTALLED` is **true**
here and none of the mount-gated evidence is silently skipping — the failure
mode AC-1030 exists to rule out is confirmed absent in this working tree, by
inspection rather than by assumption.

| Element | UAT | Outcome |
|---|---|---|
| AC-959 | `test_UAT_AC959_opens_exactly_one_tab_addressed_by_a_stable_id` (chrome:108) | aligned — asserts the tab *count*, the stable id `site`, and panel containment |
| AC-960 | `…AC960_the_site_surface_name_has_exactly_one_definition_site` (chrome:193); `…AC960_component_scope_is_written_in_exactly_one_place` (bug32:176); `…AC960_browser_source_specifiers_are_declared_by_the_generated_document` (bug32:222) | aligned — the AC covers *two* names; three tests, one per clause. Scope scan enumerates tracked files (asserting the enumeration reaches beyond `tools/`+`apps/`+`packages/`), rejects superseded scopes, pins the declaration to one literal, and couples the browser-source exception to the freshly generated document |
| AC-961 | `…AC961_components_are_served_byte_identical_from_outside_this_repo` (origin:408) | aligned — per-component published *identity* (not presence), outside-repo location, byte identity over the origin, and `expect(WEBUI_INSTALLED).toBe(true)` as an **outcome** at the end, exactly as the AC's "asserted, not skipped" demands |
| AC-962 | `…AC962_absent_component_names_the_component_and_the_install_command` (origin:527) | aligned — named error type, component name, `bin/install`, negative check against a bare resolver error, and message-identity across two consumers proving the single resolution point |
| AC-963 | `…AC963_chrome_references_each_component_by_its_declared_entry_point` (origin:465) | aligned — import map off the freshly served document, every declared export fetched and byte-compared, negative sweep for undeclared `/webui/` paths, plus the scope-derivation clause BUG-32 added |
| AC-964 | `…AC964_one_host_answers_every_route_with_the_origin_response_verbatim` (origin:599) | aligned — front-vs-origin status/content-type/body over four route classes; same-origin proven via a root-relative `previewUrl` served by the same host |
| AC-965 | `…AC965_unconfigured_and_unreachable_origins_are_distinct_failures` (origin:641) | aligned — two real Workers, 503 vs 502, `1c builder` named, dead address echoed, both non-success and distinct |
| AC-966 | `…AC966_view_mode_serves_the_real_rendered_artifact_byte_identical` (origin:114) | **warning 1** — exercises the AC as written, but the AC itself is under an unrepaired ac-level violation and its evidence is a strict subset of AC-1032's in the same shape |
| AC-967 | `…AC967_the_site_selector_lists_exactly_the_store_and_switches_the_site` (mounted:299) | aligned — expected set read off the store, listing via the app's own `fetchSites` over the real origin, a site created *after* boot, and the workspace mounted over that listing (never a literal) |
| AC-968 | `…AC968_switching_modes_changes_the_source_without_rebuilding_the_pane` (chrome:238) | aligned — element identity across two switches plus `isConnected` and shell containment, so identity is not passing on detached survivors |
| AC-969 | `…AC969_a_mode_the_panel_has_never_heard_of_works_end_to_end` (chrome:268) | aligned — mode defined entirely in the test; offered, displayed, toolbar-derived, `src` fn honoured on a site change |
| AC-970 | `…AC970_the_toolbar_renders_exactly_the_active_modes_controls` (chrome:303); `…AC970_a_site_change_re_derives_the_whole_strip_against_the_current_site` (toolbar-lifetime:203) | aligned — the two tests split the AC's two triggers. Mode half: exact id equality for two modes, the no-document case, the unknown-control report. Site half: element-identity freshness, strip persistence, and the selector's shown value followed across *all three* causes the AC names (programmatic, selector, restore) plus the no-op case |
| AC-971 | `…AC971_open_in_a_new_tab_always_targets_the_displayed_document` (chrome:351) | aligned — compared directly against the displayed URL across four state changes, with a non-vacuity assertion |
| AC-972 | `…AC972_publish_creates_a_revision_for_the_displayed_site` (mounted:217) | aligned — all three clauses. Revision through the platform's own path (shape-compared against a CLI publish), published channel served, and the displayed-site clause proven by **clicking** the real control with the app's own `publishSite` aimed at the real origin |
| AC-973 | `…AC973_the_split_drags_collapses_to_a_rail_and_reopens_to_its_width` (chrome:384) | **warning 2** — both panes, the divider element, the ratio model and reopen-to-previous-width are proven; the drag *gesture* and the rail *rendering* the AC's Verification names are not exercised |
| AC-974 | `…AC974_layout_state_survives_reopening_and_is_namespaced` (chrome:415) | aligned — all four values, real destroy-and-remount against the same storage, exhaustive key-prefix enumeration |
| AC-975 | `…AC975_displayed_site_fills_the_window_and_the_page_never_scrolls` (origin:724) | aligned — real chromium, three viewport heights with delta assertions, zero page overflow, loud report where no browser launches |
| AC-976 | `…AC976_every_option_declared_for_a_tab_reaches_the_chrome` (chrome:129) | aligned — iterates the *declaration's* keys (a later option fails until stated) and carries the mutation check the AC requires |
| AC-977 | `…AC977_every_response_the_origin_returns_is_non_cacheable` (origin:247) | aligned — **structural**: the routing table is parsed out of `builder.ts` and every declared route must be answered by a probe, so a route added tomorrow fails here. Exact directive equality, success *and* rejection shapes |
| AC-978 | `…AC978_every_served_tree_never_satisfies_a_request_that_escapes_it` (origin:182) | aligned — three trees × three encodings, non-delivery of the targeted bytes, and a single-status assertion proving uniformity. Status deliberately not pinned to 403, matching the AC's non-delivery wording |
| AC-979 | `…AC979_unknown_channel_or_component_is_answered_as_not_found` (origin:153) | aligned — 404 for both classes and negative checks against being answered out of a neighbour |
| AC-1029 | `…AC1029_workspace_registers_an_editable_mode_showing_the_edit_channel` (mounted:151) | aligned — the shipped workspace's *own* modes (none registered by the test), edit ≠ view addresses, bytes fetched over the origin, and mode × site composition both ways |
| AC-1030 | five `…AC1030_*` tests (component-resolution-anchor:208, 233, 276, 306, 333) | aligned — all four checkout shapes as fixture trees running the **shipped resolver copied byte-for-byte** in a real `node`, each with a distinguishably-marked store planted at every candidate anchor, plus the real-installation equality with a decoy inside the working tree. The property is proven independent of the layout the suite runs in, which is the AC's explicit demand |
| AC-1031 | `…AC1031_draft_side_channels_answer_with_no_rendered_artifact_on_disk` (request-time-render:168) | aligned — dist removed first, both channels answered whole (document + the stylesheet *read out of the document* + a real asset), and non-materialisation re-asserted at the end |
| AC-1032 | `…AC1032_one_render_backs_both_the_written_artifact_and_the_served_bytes` (request-time-render:218) | aligned — set equality and byte equality over *every* text artifact incl. `theme.css`, both channels, plus the channel-root case, against a fixture with two pages, a behaviour module and an asset |
| AC-1033 | `…AC1033_a_definition_changed_outside_the_workspace_shows_on_the_next_request` (request-time-render:271) | aligned — change made by writing the stored definition directly, no render/restart, and the revert leg so it cannot pass on a rendering produced once and held |
| AC-1034 | `…AC1034_an_invalid_draft_is_reported_as_a_page_naming_the_field` (request-time-render:309) | aligned — ≥400 with `text/html`, doctype, the field named, explicitly **not** the last good rendering, and recovery on restore |
| AC-1035 | `…AC1035_the_published_channel_comes_from_the_publish_time_rendering` (request-time-render:356) | aligned — published equals the publish-time artifact, draft moved, both draft-side channels follow and published does not |
| AC-1036 | `…AC1036_channel_addresses_resolve_as_before_and_never_leave_the_channel` (request-time-render:395) | aligned; **warning 3** — the resolution half is unique to this AC, but its confinement probes overlap AC-978's rendered-channels tree in the same shape |
| AC-1110 | `…AC1110_a_replaced_control_stops_reacting_and_nothing_accumulates` (toolbar-lifetime:122) | aligned — every clause: the frozen survivor, subscriptions counted **at the panel** (as the AC insists) across 20 re-derivations with a non-vacuity floor, teardown releasing to zero with the panel still emitting, and remount not leaving the old strip reacting |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | exclusivity / consistency | AC-966 (`acceptance_criterion-6fb2bebc`) ↔ AC-1032 (`acceptance_criterion-46534535`), AC-1031 (`acceptance_criterion-e9a9ba3b`) | `ac-edit` first, then `uat-edit` — **do not repair at this level yet** | `test_UAT_AC966_view_mode_serves_the_real_rendered_artifact_byte_identical` (`tests/reconciliation-builder-workspace-origin.test.ts:114-141`) fetches `/preview/alpha/draft/`, compares it to `storage/dist/sites/alpha/draft/index.html`, then compares the `.css`/`.js` siblings. Every one of those assertions is a strict subset of `test_UAT_AC1032_…` (`tests/reconciliation-builder-request-time-render.test.ts:218-268`), which does the same comparison over **every** text artifact of **both** draft-side channels including `theme.css`, in the same test shape (real HTTP over `startBuilder`); the asset clause is the second half of `test_UAT_AC1031_…` (`:193-207`), which additionally reads the stylesheet href *out of the document*. The redundancy is downstream of the AC, not of the test: REPORT-2101 (`report-5a4cf7a4`, ac level, 2026-08-16, **FAIL**) finding 1 holds AC-966 itself stale against REQ-119 — its comment at `:116-117` still excludes "a re-generation", which after REQ-119 names the shipped mechanism | Repair AC-966 at the **ac** level first (REPORT-2101 finding 1 proposes narrowing it to its one surviving unique claim: with a site selected, the display panel displays that site rendered in the active mode). Re-point this UAT at whatever survives *afterwards*. Editing the test against the current, known-stale AC text would have to be undone |
| 2 | warning | consistency | AC-973 (`acceptance_criterion-e1acae35`) | `uat-edit` | AC-973's Verification calls for two things the test does not do: "**Drag** the divider to a new position and assert the widths change accordingly" and "collapse the secondary side and assert it **renders as a rail**". `tests/reconciliation-builder-workspace-chrome.test.ts:384-413` asserts a divider element exists (`:393`) and then drives the split through the model API (`app.split.setSplit(37)`, `:399`) — no pointer event is ever dispatched on the divider, so nothing proves the divider is wired to the ratio; and collapse is asserted as model state (`app.split.isCollapsed()`, `:405`) rather than as a rendered rail. The substantive half — both panes present with the display panel primary, and reopen restoring the *pre-collapse* width rather than the default — is proven. **Carried forward unchanged** from REPORT-1627 and REPORT-1628; neither the AC's Verification nor the test has moved since (AC-973's 2026-08-10 edit added the REQ-122 scoping paragraph only) | Dispatch a real pointer sequence (`pointerdown`/`pointermove`/`pointerup`) on the divider element and assert the resulting ratio, so the gesture-to-model wiring is evidenced; assert the collapsed rail by its rendered marker (the class/width the stylesheet keys on) rather than by `isCollapsed()`. jsdom does no layout, but it does dispatch events — the gesture is reachable here even though pixel measurement is not (that is AC-975's job) |
| 3 | warning | exclusivity | AC-1036 (`acceptance_criterion-46e9debf`) ↔ AC-978 (`acceptance_criterion-53c66f17`) | `ac-edit` (defer) | The confinement half of `test_UAT_AC1036_…` (`tests/reconciliation-builder-request-time-render.test.ts:429-461`) probes `/preview/alpha/draft/assets/…` traversal in plain, `%2e%2e` and `..%2f` forms and asserts non-delivery of `root:` — the same scenario, in the same shape, as the rendered-channels tree of `test_UAT_AC978_…` (`tests/reconciliation-builder-workspace-origin.test.ts:195-204`), differing only by the `assets/` path prefix. AC-978 additionally proves the *uniformity* across three trees, which AC-1036 does not and should not. The AC-1036-only content — directory address, extensionless page, and `previewUrl` returning the two unchanged channel addresses — is not duplicated anywhere. Independently reached as warning 5 of REPORT-2101 | Leave the tests alone until the ACs are settled. If AC-1036's confinement clause is narrowed to defer to AC-978 at the ac level, drop the three traversal probes from this UAT and keep the two not-found probes (a page the channel lacks, a site the store lacks), which are AC-1036's own |

## Notes for the Editor

**Nothing here is a uat-level gate.** All three findings are warnings, and two
of them (1 and 3) are *symptoms of ac-level findings, not independent defects*.
Repairing them by editing tests now would be repairing the wrong layer, and the
edits would have to be undone once the ACs move. Only finding 2 is a
self-contained uat repair.

**Cascade — read this before acting.** The ac-level cycle for this capability
ran at 2026-08-16T09:43Z and **FAILED**: REPORT-2101 (`report-5a4cf7a4`), 3
violations / 4 warnings, unrepaired at the time of writing. The story-level
cycle immediately before it also failed (REPORT-2100, `report-4d9be4ea`, 2
violations). Strictly, the level cascade means AC bodies are not a clean working
reference here. In practice the damage is bounded and localised:

- **ac violation 1** touches AC-966 only, and surfaces at this level as
  finding 1.
- **ac violations 2 and 3** are *coverage* gaps — the CAP-85 body scopes the
  editing client code served from the renderer's own source, and the
  `/api/copy` read/apply transport, and no AC asserts either. A gap with no AC
  has no UAT to be misaligned with, so neither produces a uat-level finding. If
  those ACs are authored, this level must be re-checked: the behaviours are
  already evidenced under the *editing* capability
  (`test_UAT_AC1006_…` and `test_UAT_AC999_…` in
  `tests/reconciliation-copy-edit-gesture.test.ts:843` and `:611`), so the risk
  at that point is **duplicate evidence across capabilities**, not absence of
  it. Author the new ACs' UATs against reachability and semantics-freeness over
  *this* origin, never re-asserting the content of a refusal.

**What is genuinely strong here, and worth not regressing.** Three properties
are evidenced in a shape that resists the usual false-green:

- AC-977 reads the origin's routing table out of `builder.ts` and requires a
  probe per declared route, so a new route fails the freshness criterion until
  someone states what it returns. This is the check that previously shipped a
  cacheable JSON class while reporting green.
- AC-1030 reproduces all four checkout shapes as fixtures and runs the
  *shipped* resolver, byte-compared, in a real `node` — so the anchoring is not
  provable merely by the layout the suite happens to run in. Its own docstring
  names that hazard.
- AC-961 and AC-963 assert `WEBUI_INSTALLED` as an outcome instead of gating on
  it, which is what keeps "renamed upstream and not renamed here" distinguishable
  from "never installed". The mount-behaviour suites still gate, correctly, and
  the STORY-99 body declares that split.

**Environment note.** The shared store *is* installed for this repository
(verified above), so this run's mount-gated evidence is live rather than
skipped. That is worth stating because a uat-level PASS taken on a machine
without the install would be covering ten ACs whose evidence never executed —
and the AC-1030 anchoring fix exists precisely because that silent-green
happened once already.
