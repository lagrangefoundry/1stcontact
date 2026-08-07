---
uid: report-d97b46d5
id: REPORT-1632
type: report
title: 'UAT Coverage: Builder Workspace: Chrome, Origin & Display Panel'
created_by: xgd
created_at: '2026-08-07T21:29:56.164694+00:00'
updated_at: '2026-08-07T21:29:56.164694+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: uat_coverage_check
  subject_uid: capability-a994b8f3
  violations: 0
  warnings: 2
  needs_review_count: 0
---

# UAT Coverage Assessment: Builder Workspace: Chrome, Origin & Display Panel

**Result**: PASS
**AC verdicts**: 22 pass, 0 fail, 0 deprecated, 0 needs_review
**Story verdicts**: 1 pass, 0 fail, 0 stale, 0 needs_review
**Capability verdict**: pass

Anchor report: report-17a279f7 · Capability: capability-a994b8f3 (CAP-85) ·
Story: story-e674c60a (STORY-99, `story_kind=feature`) · Previous attempts: 1

Supersedes REPORT-1630 (`report-35663d15`), which failed this level with one
violation (AC-967). **That violation was repaired by commit `15a5b61d` and
re-verified here by execution, not by reading the fix report.** The two warnings
are carried forward unchanged; warnings do not gate.

## Cumulative Intent Considered

Re-read this round; nothing shifted under the fix commit, which touched two test
files and no ticket body.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUNDLE-16 (`bundle-15c1f647`) — REQ-117 + REQ-115 + REQ-44 | free_and_reconciled | 2026-08-07, merged at `1741ee5d1` | The sole intent behind STORY-99. REQ-115 asks for the builder shell: webui consumption via the shared artifact store, the `site` tab, the multi-mode display panel + mode-declared toolbar, the split and its persistence, and the Node origin behind a verbatim `control-app` front. REQ-117 asks for the copy-editing loop, of which STORY-99 carries only *reachability over this origin*. REQ-44 is tooling hygiene with no matrix surface here. | YES |
| REQ-118 — image selection | free_and_reconciled | 2026-07-31 | Added `/api/assets` to the origin. STORY-99 carries it only as another response class in AC-977's no-store sweep; its semantics belong to the asset-listing story (AC-1018…AC-1023). | YES (peripheral) |
| BUG-32 — `WEBUI_SCOPE` rebrand `@gendevlabs` → `@lagrangefoundry` | free_coded | 2026-08-05 | Renames the component scope and updates the three AC-bearing suites to assert through `WEBUI_SCOPE`. **Not yet reconciled**, and not present on this branch. STORY-99's body names no scope, so nothing here is stale against it. | Not yet (landed on working, unreconciled) |
| REQ-119 — request-time draft/edit renders inside `control-app` | draft | 2026-07-31 | Would delete the proxy the story's Technical Context calls "deliberate and temporary". Still `draft`, so the story body's framing stands, and AC-964's "conditioned on a front being interposed" carve-out is still the operative branch. | NO (not yet active) |

No intent retires any behaviour this capability's ACs describe, and no reconciled
intent behaviour is absent from the AC tree — hence zero `needs_review` and zero
`deprecated`. AC-1029 traces to REQ-115's "multi-mode display panel" and to the
story body's "the editable *mode* is registered here".

## Alignment Ledger

| Story | Intents aligned to | Outcome | Notes |
|---|---|---|---|
| STORY-99 | BUNDLE-16 (REQ-115, REQ-117), REQ-118 (peripheral) | aligned, covered | Body unchanged since last round (commit `b0828246` touched only the `uat_coverage` field). Every behaviour it describes traces to reconciled intent; nothing a reconciled intent asked for is missing. 2b now passes: the last unproven promise — "the site selector lists the sites the store actually holds" — is proven by the rewritten AC-967 UAT. |

Behaviour the body references whose ACs live on sibling stories under the same
bundle — permitted, and confirmed evidenced:

- write-path read/apply operations reachable over this origin, refusal in the
  write path's own terms → **AC-992** (STORY-100, `uat_coverage: pass`).
- the editing gesture's client code served from the same source the renderer is
  built from → **AC-1006** (STORY-101, `uat_coverage: pass`).

**22 active ACs ↔ 22 AC-traceable UATs, 1:1** — re-verified this round by
`grep -oE 'test_UAT_AC[0-9]+' | sort | uniq -c`: 22 distinct names, each
appearing exactly once, and `test_UAT_AC967_*` exists in one file only (the move
did not leave a duplicate).

- `tests/reconciliation-builder-workspace-chrome.test.ts` — jsdom over the real components (9, was 10)
- `tests/reconciliation-builder-workspace-origin.test.ts` — real HTTP over `startBuilder`, `unstable_dev` Worker, real chromium for AC-975 (10)
- `tests/reconciliation-builder-workspace-mounted.test.ts` — jsdom chrome over a live origin (3, was 2)

| AC | UAT | Verdict |
|---|---|---|
| AC-959 | `…AC959_opens_exactly_one_tab_addressed_by_a_stable_id` | pass — asserts the tab *count*, the stable id `site`, panel containment |
| AC-960 | `…AC960_the_site_surface_name_has_exactly_one_definition_site` | pass — real source-tree walk; sole hit is the `SITE_TAB` declaration; rendered label + `aria-label` when mounted |
| AC-961 | `…AC961_components_are_served_byte_identical_from_outside_this_repo` | pass — unconditional vendoring scan + byte-identity/outside-repo when installed |
| AC-962 | `…AC962_absent_component_names_the_component_and_the_install_command` | pass — named error type, component name, `bin/install`, and the single-resolution-point claim via `webuiExports`/`chromeHtml` |
| AC-963 | `…AC963_chrome_references_each_component_by_its_declared_entry_point` | pass — import map parsed from the served document, every declared export fetched, negative sweep for undeclared `/webui/` paths |
| AC-964 | `…AC964_one_host_answers_every_route_with_the_origin_response_verbatim` | pass — front-vs-origin over four route classes; the "conditioned on a front" carve-out honoured; same-origin via root-relative `previewUrl` |
| AC-965 | `…AC965_unconfigured_and_unreachable_origins_are_distinct_failures` | pass — two real Workers, 503 vs 502, `1c builder` named, dead address echoed. Fully unconditional |
| AC-966 | `…AC966_view_mode_serves_the_real_rendered_artifact_byte_identical` | pass — body compared to the on-disk artifact, plus every referenced asset. Fully unconditional |
| **AC-967** | `…AC967_the_site_selector_lists_exactly_the_store_and_switches_the_site` (**moved** to `…-mounted.test.ts:299`) | **pass — REPAIRED, see below** |
| AC-968 | `…AC968_switching_modes_changes_the_source_without_rebuilding_the_pane` | pass — element identity across two switches plus `isConnected`, with a non-vacuity assertion on the src |
| AC-969 | `…AC969_a_mode_the_panel_has_never_heard_of_works_end_to_end` | pass — mode defined entirely in the test; offered, displayed, toolbar-derived, `src` fn honoured on a site change |
| AC-970 | `…AC970_the_toolbar_renders_exactly_the_active_modes_controls` | pass — exact id equality for two modes, the no-document case, the unknown-control report |
| AC-971 | `…AC971_open_in_a_new_tab_always_targets_the_displayed_document` | pass — direct comparison against the displayed URL across four state changes |
| AC-972 | `…AC972_publish_creates_a_revision_for_the_displayed_site` | pass — origin publish, revision on the right site, same locked form as a CLI publish, channel rendered and served; displayed-site half via a real toolbar click |
| AC-973 | `…AC973_the_split_drags_collapses_to_a_rail_and_reopens_to_its_width` | pass — **finding 1 (warning)**: collapse/reopen-to-prior-width proven; the drag gesture itself is not exercised |
| AC-974 | `…AC974_layout_state_survives_reopening_and_is_namespaced` | pass — all four values restored across a fresh mount; every written key enumerated and prefix-checked |
| AC-975 | `…AC975_displayed_site_fills_the_window_and_the_page_never_scrolls` | pass — real chromium, three viewport heights, page-scroll assertion; reports loudly when no browser can be launched, as the AC demands |
| AC-976 | `…AC976_every_option_declared_for_a_tab_reaches_the_chrome` | pass — iterates the *declaration's* keys, so a later option fails until stated; includes the load-bearing mutation check on `fill` |
| AC-977 | `…AC977_every_response_the_origin_returns_is_non_cacheable` | pass — header-only assertions across browser source, all three channels, the two `/framework/*` bridge routes, three operations, and five refusals |
| AC-978 | `…AC978_every_served_tree_never_satisfies_a_request_that_escapes_it` | pass — three traversal forms per tree including percent-encoded, non-delivery asserted on content, one status across every tree |
| AC-979 | `…AC979_unknown_channel_or_component_is_answered_as_not_found` | pass — 404 on both, neither body carries a neighbour's content |
| AC-1029 | `…AC1029_workspace_registers_an_editable_mode_showing_the_edit_channel` | pass — the mode comes out of `mountBuilder` with no `registerMode` in the test; address distinct from the view channel, fetched over the origin, mode×site composition both ways |

### AC-967 — what changed, and how it was re-verified here

The previous violation was that the UAT handed `mountBuilder` a hardcoded
`SITES` literal and asserted the selector's options equalled that same literal,
while nothing anywhere asserted what `/api/sites` returns. The rewrite makes
every link in the chain load-bearing, and none is written by hand:

1. the expected set is read off the store (`readdirSync(storage/sites/)`), not a literal;
2. the listing comes from the app's own `fetchSites` aimed at the real origin over real HTTP;
3. **a third site (`gamma`) is created after the origin started** and must appear in the next call — which defeats a hardcoded list, a boot-time snapshot, and the revision-filter subset the previous finding named (`gamma` never gains a revision);
4. that listing, never a literal, is what the workspace is mounted over before the options are compared;
5. the switch clause is preserved and strengthened — choosing `gamma` moves the pane with the mode held constant, and fetching the pane's own address over the origin returns `gamma`'s real rendered draft byte-for-byte.

Steps 1–3 sit **outside** the `WEBUI_INSTALLED` guard. Verified by execution,
not inspection: the suite now reports **14 passed / 8 skipped** (was 13 / 9),
and AC-967's test runs for 5 ms and emits its `unverified(...)` warning for the
selector half — which is only reachable after every store→origin assertion above
has executed and passed against real data.

## Findings — Categorized by Editor Action

| # | Severity | Level | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | uat | AC-973 | uat-edit | The criterion asks to "drag the divider to a new position and assert the widths change accordingly". The test asserts the divider element exists, then drives `split.setSplit(37)` — the ratio model, not the gesture. jsdom's `getBoundingClientRect()` is zero, so `webui-split`'s drag handler cannot be exercised there. Carried unchanged from REPORT-1627/1629/1630; the load-bearing clause (reopen to *prior* width, not the default) is genuinely proven | Either mirror the drag into the real-browser path alongside AC-975's measurement, or amend the criterion's verification to name the ratio model as what a layout-less environment can observe. Both have costs, the test cannot be executed in this worktree to validate either, and it does not gate — an operator decision |
| 2 | warning | uat | STORY-99 (11 ACs) | none — environment | Executed here: **14 passed, 8 skipped**. Fully skipped: AC-959, 968, 969, 970, 971, 973, 974, 976. Among the passes, AC-963, AC-964 and AC-975 return before their first assertion (0 ms each), so **11 of 22 criteria have no executed assertion on this branch**; AC-960, 961, 967, 972, 977, 978 and 1029 run only their component-independent half. `@gendevlabs/webui-*` resolves from neither scope in this worktree. This is the gap REQ-115 declared ("Known cost, accepted and made visible") and the story's Technical Context restates, so it is **not** a coverage violation — the tests are correctly authored, drive real entry points and mock nothing | No test edit. The suites already `console.warn` by name rather than passing silently, which is the behaviour intent asked for. Resolution is `bin/install --lang js --component all` in `lagrange-framework`, or the private registry upstream names as the eventual fix |

## Notes for the Editor

**Nothing to fix at this level.** Both remaining items are warnings that were
already forwarded deliberately by the last fix cycle, and neither is repairable
by a test edit in this worktree.

**The AC-967 repair is the pattern worth reusing.** It shrank the environment
gap by one criterion (12 → 11) not by weakening an assertion but by relocating
the criterion to the suite where a real origin already exists, and splitting it
so the machine-independent half executes unconditionally. Three of the eleven
dark criteria — AC-968, AC-969, AC-971 — are pure chrome and cannot follow that
route. The other eight would each need the components.

**Finding 2 remains the dominant fact about this capability's evidence.** Eleven
of twenty-two criteria produce no executed assertion here, and three of them
report green while asserting nothing. A regression run on this worktree cannot
distinguish a working workspace chrome from an absent one. Provisioning the
shared artifact store in the regression environment stays the single
highest-value change available: it converts eleven conditional criteria into
executed ones at zero test cost.

**BUG-32 is still unreconciled and touches all three suites.** This branch still
writes `@gendevlabs` literally at `…-origin.test.ts:335` and `webui.ts:33`; when
BUG-32 reconciles, those move to `WEBUI_SCOPE`. The AC-967 test added this round
introduces no new scope literal, so it does not enlarge that conflict. No matrix
element is stale against it — neither the story body nor any AC names a scope.
