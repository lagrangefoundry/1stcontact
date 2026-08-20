---
uid: report-9f5abb58
id: REPORT-2309
type: report
title: 'Capability-Intent Alignment: Builder Workspace: Chrome, Origin & Display Panel
  (level=uat)'
created_by: xgd
created_at: '2026-08-20T02:13:01.471751+00:00'
updated_at: '2026-08-20T02:13:01.471751+00:00'
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

Anchor report: report-2485c83c · Capability: capability-a994b8f3 (CAP-85) ·
Story: story-e674c60a (STORY-99, `story_kind=upgrade`) · Level `uat` ·
Previous attempts: 4

The capability has one story carrying **31 acceptance criteria** (AC-959…AC-979,
AC-1029…AC-1036, AC-1110, AC-1240). Thirty are `status=active`; AC-1240 is
`pending`, which is the schema default for a newly created criterion and does
**not** remove it from the matrix (see info 4).

**Level discipline.** The `ac` level passed at attempt 4 (report-46c342b8,
0 violations / 1 warning / 0 needs_review, 2026-08-20T02:06Z). AC bodies are
therefore the working reference here; intent was consulted only to re-verify the
ledger's statuses, which was done directly against the ticket store in this run.

**Delta since the last uat-level check, established rather than assumed.**
REPORT-2102 (`report-7de87c48`, 2026-08-16T09:56Z) passed this level 0/3/0 over
30 ACs. Exactly three criteria have moved since — `updated_at` read off the
store: **AC-966** (2026-08-20T01:54:28Z, edited), **AC-1240**
(2026-08-20T01:54:44Z, created), **AC-1036** (2026-08-20T01:54:59Z, edited).
The other twenty-eight carry `updated_at` of 2026-08-16T10:02–10:03Z, which is
the `uat_coverage` field write made by REPORT-2103's coverage pass, not a body
edit. Their alignment is carried forward from REPORT-2102 and is re-recorded in
the ledger below.

**The test surface moved too, and was diffed rather than trusted.** One CAP-85
evidence file has changed since 2026-08-16:
`tests/reconciliation-builder-workspace-origin.test.ts`, in commit `2a663c06d`
(*Workflow fix_ac_validation completed*). The diff is **nine lines of comment in
`test_UAT_AC966_…` and no assertion at all** — which is the origin of violation 2
below. No other test file under this capability has changed
(`git log --since=2026-08-16 --name-only -- tests/`).

**Environment precondition checked, not assumed.** The shared artifact store is
installed for this repository — `@lagrangefoundry/webui-{shell,split,fields,chat,markdown}`
are all present under `/Users/martin/lagrangefoundry/node_modules/@lagrangefoundry/`.
So the mount-gated evidence for AC-961/963/967/972/1029/1030 is live in this
working tree rather than silently skipping, which is the false-green AC-1030
exists to rule out.

**Not executed.** This is an alignment check, and no test run was performed;
execution and pass/fail of the evidence is the `uat_coverage_check`'s subject.
Every claim below about what a test *does* was read out of its source at the
line cited.

## Cumulative Intent Considered

Statuses re-read directly from the ticket store in this run, ordered by
`merged_at_commit` where present, else `created_at`.

| Intent ID | UID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|---|
| BUG-32 | `bug-5cabb340` | merged | created 2026-08-05, merged `125f1dcc` | Component scope rename `@gendevlabs` → `@lagrangefoundry` in lockstep; one definition site; declared browser-source exception; consumption evidence made unconditional. Rewrote AC-960/961/963; the window AC-1030 was authored in | YES |
| REQ-115 + REQ-117 + REQ-44 | `bundle-15c1f647` (BUNDLE-16) | free_and_reconciled | created 2026-08-07, merged `1741ee5d` | REQ-115: the whole chrome — component consumption, `site` tab, multi-mode panel, mode-declared toolbar, split + persistence, confinement, the Node origin behind a verbatim front. REQ-117: two workspace-side asks — (a) the `/api/copy` edit seam as a thin transport, (b) the gesture's client bytes derived from the renderer's own source — plus the viewport-fill follow-up. REQ-44: preflight, expressed elsewhere | YES — **ask (b) is the source of violation 1** |
| BUG-33 | `bug-ede1fb8c` | free_and_reconciled | created 2026-08-08, merged `f1664c55` | Toolbar re-derives on mode **and** site; a replaced control is inert by design. Origin of AC-1110, widened AC-970 | YES |
| REQ-119 + REQ-122 + 6 more | `bundle-e59210c5` (BUNDLE-17) | free_and_reconciled | created 2026-08-10, merged `0198704b` | REQ-119: request-time draft-side renders, one implementation behind a writer and a reader, no artifact on disk, out-of-band changes visible next request, invalid draft surfaced, `published` untouched. Origin of AC-1031…AC-1036. REQ-122: the chat panel that now fills the secondary pane | YES |

No intent in the ledger is `abandoned`, `deprecated`, `wont_fix`, `draft` or
`ready_to_implement`; none is merely imminent. Nothing is retired — the
cumulative picture is purely additive, so every AC below is expected to be
live and evidenced.

## Alignment Ledger

**30 active ACs ↔ 37 AC-traceable UAT functions across 8 files; AC-1240 ↔ zero.**
UAT names were enumerated directly out of `tests/` rather than read from
`.xgd/uat_index.json`. The mapping is 1:1 except AC-960 (×3), AC-970 (×2) and
AC-1030 (×5), where one criterion has clauses needing different test shapes —
complementary, not duplicates.

Evidence files: `tests/reconciliation-builder-workspace-chrome.test.ts`,
`-origin.test.ts`, `-mounted.test.ts`,
`tests/reconciliation-builder-request-time-render.test.ts`,
`tests/reconciliation-builder-toolbar-lifetime.test.ts`,
`tests/reconciliation-component-resolution-anchor.test.ts`,
`tests/bug32-webui-scope-rebrand.test.ts`, and the presence gate
`tests/support/webui-installed.ts`.

| Element | UAT | Outcome |
|---|---|---|
| AC-959 | `…AC959_opens_exactly_one_tab_addressed_by_a_stable_id` (chrome) | aligned — carried forward, AC unmoved since 2026-08-16 |
| AC-960 | `…AC960_the_site_surface_name_has_exactly_one_definition_site` (chrome); `…AC960_component_scope_is_written_in_exactly_one_place` (bug32); `…AC960_browser_source_specifiers_are_declared_by_the_generated_document` (bug32) | aligned — three tests, one per clause; the AC covers two distinct names |
| AC-961 | `…AC961_components_are_served_byte_identical_from_outside_this_repo` (origin) | aligned — asserts `WEBUI_INSTALLED` as an *outcome*, which is what keeps "renamed upstream" distinguishable from "never installed" |
| AC-962 | `…AC962_absent_component_names_the_component_and_the_install_command` (origin) | aligned |
| AC-963 | `…AC963_chrome_references_each_component_by_its_declared_entry_point` (origin) | aligned — asserts on the *freshly produced* document, which AC-960's tracked-file sweep cannot reach |
| AC-964 | `…AC964_one_host_answers_every_route_with_the_origin_response_verbatim` (origin) | aligned |
| AC-965 | `…AC965_unconfigured_and_unreachable_origins_are_distinct_failures` (origin) | aligned |
| AC-966 | `test_UAT_AC966_view_mode_serves_the_real_rendered_artifact_byte_identical` (origin:114-147) | **violation 2** — the criterion moved on 2026-08-20; the test did not. See finding 2 |
| AC-967 | `…AC967_the_site_selector_lists_exactly_the_store_and_switches_the_site` (mounted) | aligned |
| AC-968 | `…AC968_switching_modes_changes_the_source_without_rebuilding_the_pane` (chrome) | aligned |
| AC-969 | `…AC969_a_mode_the_panel_has_never_heard_of_works_end_to_end` (chrome) | aligned |
| AC-970 | `…AC970_the_toolbar_renders_exactly_the_active_modes_controls` (chrome); `…AC970_a_site_change_re_derives_the_whole_strip_against_the_current_site` (toolbar-lifetime) | aligned — the two tests split the AC's two triggers (mode, site) |
| AC-971 | `…AC971_open_in_a_new_tab_always_targets_the_displayed_document` (chrome) | aligned |
| AC-972 | `…AC972_publish_creates_a_revision_for_the_displayed_site` (mounted) | aligned — publish is *clicked* on the real control |
| AC-973 | `test_UAT_AC973_the_split_drags_collapses_to_a_rail_and_reopens_to_its_width` (chrome:384-413) | **warning 1** — carried forward unchanged from REPORT-1627/1628/2102; neither AC nor test has moved. See finding 3 |
| AC-974 | `…AC974_layout_state_survives_reopening_and_is_namespaced` (chrome) | aligned |
| AC-975 | `…AC975_displayed_site_fills_the_window_and_the_page_never_scrolls` (origin) | aligned — real chromium, three viewport heights |
| AC-976 | `…AC976_every_option_declared_for_a_tab_reaches_the_chrome` (chrome) | aligned — iterates the *declaration's* keys, so a later option fails until stated |
| AC-977 | `…AC977_every_response_the_origin_returns_is_non_cacheable` (origin:247) | aligned — parses the routing table out of `builder.ts` and requires a probe per declared route, `/framework/edit-client.js` among them (origin:355). That probe is about *cacheability*, not derivation, so it is not AC-1240's evidence |
| AC-978 | `…AC978_every_served_tree_never_satisfies_a_request_that_escapes_it` (origin:182) | aligned — three trees × three encodings, plus the uniformity assertion |
| AC-979 | `…AC979_unknown_channel_or_component_is_answered_as_not_found` (origin:153) | aligned |
| AC-1029 | `…AC1029_workspace_registers_an_editable_mode_showing_the_edit_channel` (mounted) | aligned — the shipped workspace's own modes, none registered by the test |
| AC-1030 | five `…AC1030_*` tests (component-resolution-anchor) | aligned — all four checkout shapes as fixture trees running the shipped resolver in a real `node`; live in this tree (see environment note) |
| AC-1031 | `…AC1031_draft_side_channels_answer_with_no_rendered_artifact_on_disk` (request-time-render:168) | aligned — `dist` removed first; the stylesheet is read *out of the document* |
| AC-1032 | `…AC1032_one_render_backs_both_the_written_artifact_and_the_served_bytes` (request-time-render:218) | aligned — sole owner of the equality claim after the AC-966 cession |
| AC-1033 | `…AC1033_a_definition_changed_outside_the_workspace_shows_on_the_next_request` (request-time-render:271) | aligned |
| AC-1034 | `…AC1034_an_invalid_draft_is_reported_as_a_page_naming_the_field` (request-time-render:309) | aligned |
| AC-1035 | `…AC1035_the_published_channel_comes_from_the_publish_time_rendering` (request-time-render:356) | aligned |
| AC-1036 | `test_UAT_AC1036_channel_addresses_resolve_as_before_and_never_leave_the_channel` (request-time-render:395-461) | **aligned — re-checked against the 2026-08-20 edit.** The edit relabelled the confinement paragraph a regression rider naming AC-978/AC-979 as owners; the test's shape was already exactly that. Directory address (`:403-407`), extensionless page (`:411-415`), both `previewUrl` channel addresses (`:420-426`), then five rider probes (`:429-461`) matching the Verification's list. **REPORT-2102's warning 3 is closed by the AC edit, not by a test change** |
| AC-1110 | `…AC1110_*` (toolbar-lifetime) | aligned — subscriptions counted at the panel across repeated re-derivations |
| **AC-1240** | **none** | **violation 1** — no `test_UAT_AC1240_*` exists anywhere in `tests/`. See finding 1 |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | coverage | AC-1240 (`acceptance_criterion-bd9ce1d6`) | `uat-add` | The criterion was authored at 2026-08-20T01:54:44Z by the ac-level fix (closing REPORT-97e0a1d8's violation 2, REQ-117 ask (b)) and **carries no evidence at all**. Enumerating every `test_UAT_AC<n>_` identifier in `tests/` yields nothing in the 12xx range — the sequence stops at `test_UAT_AC1147`. The criterion's own `fields.uat_coverage` is already `fail`, which concurs. The behaviour it describes *does* ship — `tools/generate/src/cli/builder.ts:462-468` matches `/framework/(edit-client\|site-schema-edit).js` and serves it derived from `packages/framework/src/l1/edit-client.ts` — so this is absent evidence, not a code defect. The route is *touched* by `test_UAT_AC977_…` (origin:355) but only as one row in the cacheability probe table; nothing asserts the derivation, the script content type, or the absence of a hand-written second copy under this capability | Author `test_UAT_AC1240_…` in `tests/reconciliation-builder-workspace-origin.test.ts` (the file that already runs real HTTP over `startBuilder`). Follow the AC's own Verification: fetch `/framework/edit-client.js` over the running origin; assert 200 and a JavaScript content type; locate `packages/framework/src/l1/edit-client.ts`, derive it the same way the origin does and assert the served body matches, so a separately authored file would fail; assert the served text is browser-executable (no `import type`, no `interface …{`) rather than the TypeScript passed through; and assert no second copy of that client code exists under `apps/control-app/src`. **Read finding 4 before writing it** — an almost identical test already exists under another capability, and the new one must not simply be its clone |
| 2 | violation | consistency | AC-966 (`acceptance_criterion-6fb2bebc`) | `uat-edit` | The ac-level fix rewrote AC-966 on 2026-08-20T01:54:28Z, and commit `2a663c06d` touched its test — **but changed only the nine-line comment at `tests/reconciliation-builder-workspace-origin.test.ts:115-123`, leaving every assertion as it was** (verified by `git show`). The three now diverge: (a) the criterion states the equality to what the render writes "is asserted by AC-1032, which owns it; this criterion does not restate it in weaker form", yet the test's operative assertion is exactly that restatement — `expect(await res.text()).toBe(onDisk)` at `:132`, reading `storage/dist/sites/alpha/draft/index.html`; (b) the Verification says to "fetch the stylesheet and image references **that page carries**", but `:136-138` globs `.css`/`.js` off the output *directory* and never parses the document, and no image is fetched; (c) the Verification's guard — "run the fetch against a site the platform has **never rendered to disk**, so the panel's content cannot be coming off a shelf" — is not merely absent but structurally excluded, since the test reads its expectation out of `dist`. The new comment concedes this ("this fixture has already rendered, so it is the cheapest way to say 'real content'"). REPORT-2102's finding 1 deferred this to the ac level and instructed "re-point this UAT at whatever survives afterwards"; the AC survived and the re-pointing did not happen | Rewrite the test against the current criterion. Drive the fetch from the URL the pane displays (`previewUrl`) rather than a literal path; assert real content by a marker from the site's own definition instead of byte-equality with `dist`; read the stylesheet and image references **out of the returned document** and assert each resolves 200 over the same origin; and run the whole probe against a site created but never rendered to disk, which is the guard the AC turns on. Note the ac-level report's standing instruction: do **not** drop that guard — it is what stops AC-966 passing off a shelf copy |
| 3 | warning | consistency | AC-973 (`acceptance_criterion-e1acae35`) | `uat-edit` | Carried forward unchanged from REPORT-1627, REPORT-1628 and REPORT-2102; re-verified against source in this run, and neither the AC nor the test has moved. AC-973's Verification calls for two things `tests/reconciliation-builder-workspace-chrome.test.ts:384-413` does not do: "**drag** the divider to a new position and assert the widths change accordingly" — the test asserts a divider element exists (`:393`) then drives the model directly via `app.split.setSplit(37)` (`:399`), so no pointer event ever reaches the divider and nothing proves the gesture is wired to the ratio; and "collapse the secondary side and assert it **renders as a rail**" — asserted as model state `app.split.isCollapsed()` (`:405`) rather than as a rendered rail. The substantive half (both panes with the display panel primary, reopen restoring the pre-collapse width rather than the default) is properly proven at `:390-412` | Dispatch a real `pointerdown`/`pointermove`/`pointerup` sequence on the divider element and assert the resulting ratio, evidencing the gesture-to-model wiring; assert the collapsed rail by its rendered marker (the class or width the stylesheet keys on) rather than by `isCollapsed()`. jsdom does no layout but does dispatch events, so the gesture is reachable here — pixel measurement is AC-975's job, not this one's |
| 4 | info | exclusivity | AC-1240 (`acceptance_criterion-bd9ce1d6`) ↔ AC-1006 (`acceptance_criterion-a5d4eb9c`, `story_uid=story-3bf94bd4`) | — | Recorded as a constraint on finding 1's fix, not as a defect in the present matrix. `test_UAT_AC1006_the_browser_runs_one_address_resolution_served_from_the_renderers_own_source` (`tests/reconciliation-copy-edit-gesture.test.ts:842-946`) already asserts nearly every clause AC-1240's Verification names — the 200 and JavaScript content type (`:858-859`), the same `export function` set as `edit-client.ts` (`:846-863`), no build-time-only syntax surviving (`:865-866`), a real browser importing it as a module (`:878-899`), and no second copy under `apps/control-app/src` (`:913-943`). AC-1006 belongs to a **different story under a different capability**, so this is not a duplicate inside CAP-85 and nothing here is presently redundant. REPORT-2102 predicted exactly this juncture: "the risk at that point is duplicate evidence across capabilities, not absence of it" | None at this level. The constraint lands on finding 1: author AC-1240's UAT about *what this origin answers with* — reachability of the route over `startBuilder` and the derivation of the served bytes — and leave AC-1006 to own the browser-runtime and single-resolution-implementation claims. Two tests of the same scenario in the same shape across two capabilities is the outcome to avoid |
| 5 | info | — | AC-1240 (`acceptance_criterion-bd9ce1d6`) | — | `status=pending` while its thirty siblings are `active`. Checked rather than assumed at the ac level and re-confirmed here: `pending` is the schema default for `acceptance_criterion`, the capability tree applies no status filter to criteria, and AC-1240 already carries a `uat_coverage` verdict — so it is in the matrix and is evaluated, which is why finding 1 is a violation rather than a deferral | None. The `pending` status is not itself drift |

## Notes for the Editor

**Both violations are the same shape, and it is the shape this level exists to
catch.** The ac-level cycle repaired the criterion layer at 01:54Z on 2026-08-20
— one criterion rewritten, one authored, one relabelled — and the evidence layer
did not follow. AC-1036 escaped only because the rewrite was a relabelling that
described what its test already did. AC-966 got a comment rewritten to
rationalise assertions the new criterion disclaims, which is the opposite of
re-pointing it. AC-1240 got nothing. **Whoever fixes this should treat "an AC
moved" as implying "its UAT must be re-read", and the AC-966 comment edit in
`2a663c06d` as the anti-pattern**: narrating why an old assertion is still
acceptable is not evidence that the new criterion is met.

**Do not fix finding 2 by deleting the disk comparison and stopping there.** The
criterion's surviving unique subject is that *the pane an operator is looking at
is showing that rendering, whole* — the document plus the references it carries,
resolving over the same origin. Removing the `dist` comparison without adding
the document-derived asset walk and the never-rendered guard would leave AC-966
asserting less than it did before, and the ac level has already twice produced
findings from AC-966 edits that restated a neighbouring criterion. AC-1031
(`request-time-render:168`) owns "no artifact on disk, and serving writes nothing
back" and reads the stylesheet out of the document — reuse its *technique* for
AC-966's own probe, do not re-assert its guarantee.

**Deliberate non-findings, recorded so a later pass does not re-derive them:**

- **REPORT-2102's warning 3 (AC-1036 ↔ AC-978 traversal duplication) is closed
  and needs no test change.** The 2026-08-20 AC edit labelled that paragraph a
  regression rider and named AC-978/AC-979 as the owners of the general
  properties, which sanctions the five probes at `request-time-render:429-461`
  as a mechanism-change regression rather than an independent claim. The test was
  already written that way.
- **AC-977 and AC-960 read repository source, and neither is structural in the
  disqualifying sense.** AC-960's subject *is* what the repository says; AC-977
  parses the routing table only to *enumerate* routes that are then probed over
  real HTTP, which is what makes a newly added route fail the freshness criterion
  until someone states what it returns.
- **The mount-evidence skip gate is test policy, not product behaviour**, and
  correctly has no criterion. The consumption evidence that must never skip does
  have one — AC-961, which asserts `WEBUI_INSTALLED` as an outcome.
- **REQ-119's declared deviation (render inside the edge Worker) is correctly
  unevidenced**, because no AC claims it. AC-964's test is written about one
  origin and what an operator observes, so it survives the eventual runtime
  relocation unaltered.
- **AC-1030's five tests are not duplicates of one another** — four checkout
  shapes plus the real-installation equality, each a distinct branch of the
  anchoring rule the AC states.
