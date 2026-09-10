---
uid: report-dde93f42
id: REPORT-3790
type: report
title: 'Capability-Intent Alignment: Site Materials & Starting Point: Scaffold, Assets,
  Provenance & Palette (level=uat)'
created_by: xgd
created_at: '2026-09-10T20:17:33.191779+00:00'
updated_at: '2026-09-10T20:17:33.191779+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-b4ac88fc
  level: uat
  violations: 3
  warnings: 2
  needs_review_count: 0
---

# Capability-Intent Alignment: Site Materials & Starting Point: Scaffold, Assets, Provenance & Palette
# Level: uat

**Result**: FAIL
**Violations**: 3
**Warnings**: 2
**Needs review**: 0

> **Position in the cascade.** The story level passed at 19:49Z (`report-d9b5dd9e`)
> and the ac level at 20:09Z (`report-6c22789e`, 0 violations / 1 warning). Per the
> level-priority rule, the 38 AC bodies are this check's working reference and were
> not re-litigated; the intent ledger was re-read from the ticket store only where a
> finding turns on a supersession (REQ-137, REQ-114, REQ-142).
>
> **All three violations are a consequence of the *previous* ac-level fix round.**
> Attempt 5 (commit `1a027575a4`, 13:02 local) narrowed AC-932 and retitled AC-945,
> and moved two claims off AC-932 onto AC-941 and AC-944. It updated **one** of the
> three test files that assert those claims. The other two still hold the pre-repair
> text — and both are green, so they read as evidence for guarantees this capability
> no longer makes.
>
> Coverage is complete: **every one of the 38 active ACs has at least one substantive
> UAT** driving a real entry point. Nothing escalates to `needs_review`.

## Cumulative Intent Considered

Statuses re-read this run from `.xgd/tickets/`. Only the intents a finding depends
on are re-derived here; the full ledger is in `report-6c22789e` (ac level, 20:09Z)
and is unchanged.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-101 (`request-b63bbed5`) | free_and_reconciled | 2026-07-26 | Font provenance index, three-state redistribution, `distribution` marker, on-disk scan | YES |
| REQ-102 (`request-56cb1897`) | free_and_reconciled | 2026-07-26 | `1c new` seeds a complete L1 document; renders/shots unedited; `1c repro` overwrites wholesale | YES |
| REQ-114 (`request-3cd338cd`) | free_and_reconciled | 2026-07-31 | Census + retrofit; retired the theme colour token group. **AC3 guaranteed byte-identity** | YES (AC3 superseded) |
| REQ-118 (`request-66e4c630`) | free_and_reconciled | 2026-07-31 | `listSiteAssets` — registry ∪ store merged by handle, provenance flags, one handle vocabulary, CLI + `/api/assets` | YES |
| REQ-137 (`request-d2980a95`) | free_and_reconciled | 2026-08-12 | **Deletes entry `steps`, adds continuous `shade`; supersedes REQ-114 AC3's byte-identity with a bounded, measured ≤8/255 guarantee** | YES — drives findings 1 & 2 |
| REQ-142 (`request-0dd62a5d`) | free_and_reconciled | 2026-08-15 | Async `SiteStore` port, filesystem moved behind it | YES — drives warning 5 |
| REQ-143 (`request-18a48d63`) | free_and_reconciled | 2026-08-15 | D1/R2 adapter for the same port; both adapters live | YES |
| REQ-145 (`request-b474390f`) | free_and_reconciled | 2026-08-15 | control-app becomes the builder origin | YES |
| REQ-132 (`request-5946d045`) | free_and_reconciled | 2026-08-12 | Image picker becomes a thumbnail grid; adds no source to the listing | YES (no UAT delta) |

**Step 2.5 checked, does not apply.** No AC in this capability names a ticket as its
delivery vehicle (re-verified at ac level this cycle), and no test in the three files
below cites an `abandoned` / `deprecated` / `wont_fix` ticket. The
stale-citation false-positive case cannot arise, so nothing escalates.

**Test discovery.** `vitest.node.config.mts:71-72` includes `tests/**/*.test.ts` and
excludes only `*.workers.test.ts`. All three colour files below are live and run.

## Alignment Ledger

Every active AC → the test(s) that claim it. Line numbers are current HEAD
(`53d75833d8`).

### STORY-92 (`story-8685be2d`) — font provenance & licence — 12 ACs — **aligned**

One file, `tests/reconciliation-font-provenance.test.ts`, driving the real CLI entry
point (`run(['fonts','check'])`), the command function, the report renderer and the
exported schema validators against on-disk trees in throwaway workspaces.

| AC | Test | Outcome |
|---|---|---|
| AC-857 (`db2202bc`) | `:205 test_UAT_AC857_record_entries_state_origin_licence_and_files_or_are_rejected` | aligned |
| AC-858 (`bf0a6404`) | `:299 test_UAT_AC858_unregistered_family_fails_and_exits_non_zero` | aligned |
| AC-859 (`3cdc059e`) | `:325 test_UAT_AC859_recorded_family_with_unlisted_file_fails_naming_that_file` | aligned |
| AC-860 (`4d12bd29`) | `:354 test_UAT_AC860_unreferenced_font_file_fails_and_derived_trees_are_not_scanned` | aligned |
| AC-861 (`2b2e4518`) | `:396 test_UAT_AC861_product_distribution_requires_settled_yes_redistribution` | aligned |
| AC-862 (`0e249010`) | `:444 test_UAT_AC862_site_definition_declares_internal_or_product_or_nothing` | aligned |
| AC-863 (`3d85c7cc`) | `:476 test_UAT_AC863_outstanding_actions_warn_with_family_actions_and_sites` | aligned |
| AC-864 (`875c0a08`) | `:509 test_UAT_AC864_broken_record_stops_the_run_rather_than_passing_vacuously` | aligned |
| AC-865 (`11047c96`) | `:560 test_UAT_AC865_scans_tracked_and_scratch_trees_and_attributes_violations` | aligned |
| AC-866 (`15da3b28`) | `:596 test_UAT_AC866_reference_forms_reduce_to_the_recorded_file_key` | aligned |
| AC-867 (`d5fe6862`) | `:625 test_UAT_AC867_report_states_families_references_and_files_scanned` | aligned |
| AC-868 (`fee5470e`) | `:662 test_UAT_AC868_json_mode_emits_one_document_whose_flag_matches_the_exit_status` | aligned |

No AC in this story has been edited since 2026-08-10; nothing has drifted under it.

### STORY-93 (`story-86c7c21b`) — the authoring start point — 8 ACs — **aligned**

One file, `tests/reconciliation-scaffold-starter-l1.test.ts`, driving `cmdNew`,
`cmdRender`, `cmdShot`, `cmdRepro` and the shipped `1c` launcher against real
temp trees.

| AC | Test | Outcome |
|---|---|---|
| AC-869 (`2b109b66`) | `:110 …created_page_carries_a_complete_valid_l1_document` | aligned — reads the artifact back off disk, then `validateSite` on the whole definition |
| AC-870 (`34b88d22`) | `:145 …fresh_site_renders_placeholder_centred_on_theme_background` | aligned — asserts on `<body>`, and reads `doc.background` off disk rather than restating it |
| AC-871 (`b17420aa`) | `:178 …fresh_site_shoots_without_hand_editing` | aligned (browser-gated — see info 6) |
| AC-872 (`b211815a`) | `:199 …starter_widths_are_the_capture_viewport_ladder` | aligned — asserts derivation from `RESPONSIVE_VIEWPORTS`, not a restated ladder |
| AC-873 (`56334082`) | `:219 …document_and_placeholder_colours_are_literals_in_the_page_document` | aligned — covers all three clauses incl. `site.palette`/`theme.palette` absent |
| AC-874 (`e48441de`) | `:266 …scaffolded_root_declares_no_per_width_geometry_track` | aligned — asserts the document *and* the emitted layout |
| AC-875 (`ba6fe401`) | `:304 …every_created_slug_yields_one_starter_shape_with_no_flag` | aligned — reads `1c help` from the shipped launcher |
| AC-876 (`d64f190a`) | `:338 …repro_over_a_created_slug_matches_repro_over_a_virgin_slug` | aligned — asserts the result, as the AC directs |

### STORY-97 (`story-5e7eb0c5`) — colour census & palette retrofit — 12 ACs — **3 violations**

Two files claim the same ACs. `tests/reconciliation-colour-retrofit-shade-model.test.ts`
is the REQ-137 rewrite and is correct throughout;
`tests/reconciliation-colour-census-and-retrofit.test.ts` is the superseded
pre-REQ-137 original that was never removed.

| AC | Correct test (shade-model) | Also claimed by | Outcome |
|---|---|---|---|
| AC-932 (`9f1e7baf`) | `:988 …a_colourless_site_retrofits_to_an_empty_palette_and_still_validates` | `palette-overlay:497` | **violation 3** — the overlay test asserts the two claims AC-932 no longer makes |
| AC-939 (`681fa4dd`) | `:310 …census_reports_literals_counts_alpha_families_and_writes_nothing` | `census:231` — **identical function name, identical body** | **violation 1** |
| AC-940 (`63d8463e`) | `:383 …census_json_is_one_parseable_document_agreeing_with_the_human_form` | `census:296` — **identical function name, identical body** | **violation 1** |
| AC-941 (`48360aec`) | `:449 …assign_writes_palette_rewrites_pages_and_reports_entries_drift_and_files` | `census:362` (`…reports_counts_and_files`) | **violation 1** |
| AC-942 (`62c0b208`) | `:527 …one_rgb_at_three_opacities_becomes_one_entry_carrying_opacity_on_each_reference` | `census:435` | **violation 1** |
| AC-943 (`3f7e1894`) | `:588 …families_collapse_onto_the_most_reaching_member_and_refused_fits_stand_alone` | `census:483` | **violation 1** — census's version omits the REQ-137 mis-classifying-fit refusal entirely |
| AC-944 (`3127e56f`) | `:679 …unshaded_references_are_exact_shaded_stay_within_the_bound_and_drift_is_reported` | `census:548` | **violation 2** — census asserts the *superseded* guarantee |
| AC-945 (`66e919f9`) | `:762 …unprovable_retrofit_exits_nonzero_diagnoses_and_writes_nothing` | `census:602` — **identical function name** | **violation 1** |
| AC-946 (`c9cc59fc`) | `:819 …derived_names_describe_colours_and_rename_to_role_vocabulary` | `census:662` — **identical function name** | **violation 1** |
| AC-947 (`e7d18852`) | `:938 …reproduced_sites_carry_literals_and_re_assignment_is_a_byte_identical_fixpoint` | `census:757` | **violation 1** |
| AC-1146 (`3dc77086`) | `:1028 …a_more_saturated_member_earns_its_own_byte_exact_entry_rather_than_a_shade` | — | aligned |
| AC-1147 (`b80e8a70`) | `:1081 …reported_drift_is_reproduced_exactly_by_the_palette_models_own_resolution` | — | aligned |

**Coverage check on the survivor.** The shade-model file is a strict superset of the
census file, AC for AC and clause for clause — verified by reading both AC-943 tests
side by side (shade-model adds the (b) mis-classifying-fit refusal and asserts
reference-level determinism, which census does not) and both AC-944 tests (shade-model
covers all three live clauses; census covers none of them). Removing the census file
loses no coverage.

### STORY-102 (`story-c46abfa6`) — the site asset store — 6 ACs — **aligned**

One file, `tests/reconciliation-site-asset-listing.test.ts`, driving both real entry
points — `run(argv)` for the command line and `startBuilder` over HTTP for the builder
origin, plus the control-app's own `fetchAssets` client. Nothing between them stubbed.

| AC | Test | Outcome |
|---|---|---|
| AC-1018 (`4cd04340`) | `:218 …a_file_present_in_the_site_assets_is_listed_even_when_undeclared` | aligned (wording — warning 5) |
| AC-1019 (`c15ea16c`) | `:246 …a_declared_asset_contributes_its_identity_and_is_listed_with_no_file` | aligned — asserts the ghost entry's `onDisk:false` disagreement is visible |
| AC-1020 (`cd61874f`) | `:274 …every_listed_asset_is_named_in_the_site_local_handle_a_page_holds` | aligned — bare + qualified merge to one entry, handle order, and the off-site boundary |
| AC-1021 (`feaa4db0`) | `:314 …each_asset_reports_what_it_can_be_used_for` | aligned — kind per file, unfiltered list, caller narrows |
| AC-1022 (`bc7cc7f1`) | `:340 …the_store_answers_from_the_command_line_with_no_editing_gesture` | aligned — full entry shape, and empty-is-an-answer |
| AC-1023 (`07e381ca`) | `:376 …the_store_answers_from_the_builder_origin_and_refuses_a_missing_site` | aligned — same list on the wire, 400 on a missing slug, asserted through the real client too |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | exclusivity | `tests/reconciliation-colour-census-and-retrofit.test.ts` (whole file) vs `tests/reconciliation-colour-retrofit-shade-model.test.ts` | uat-edit (delete the superseded file) | Nine ACs (AC-939…AC-947) are claimed twice in the **same test shape** — both are vitest node suites driving `cmdColorsAssign` and the shipped `1c` launcher against sandbox/temp trees. Four pairs carry **byte-identical test function names** (`test_UAT_AC939_census_reports_literals_counts_alpha_families_and_writes_nothing`, `…AC940_census_json_is_one_parseable_document_agreeing_with_the_human_form`, `…AC945_unprovable_retrofit_exits_nonzero_diagnoses_and_writes_nothing`, `…AC946_derived_names_describe_colours_and_rename_to_role_vocabulary`), so an AC→test index cannot attribute them. The AC-939 and AC-940 bodies are line-for-line the same test, differing only in the slug prefix (`ac939-` vs `shade939-`). Both files are included by `vitest.node.config.mts:71` and both run. This is the "reconciliation UAT generation wrote a new file instead of rewriting the story's own" failure mode, plus the Coding-Standards §1 duplicate-file rule | Delete `tests/reconciliation-colour-census-and-retrofit.test.ts`. `tests/reconciliation-colour-retrofit-shade-model.test.ts` is a strict superset (12 ACs vs 9, and wider clause coverage on AC-943 and AC-944) and is STORY-97's single UAT file |
| 2 | violation | consistency | `tests/reconciliation-colour-census-and-retrofit.test.ts:548` `test_UAT_AC944_render_is_byte_identical_before_and_after_the_retrofit` | uat-edit | The test asserts the **pixel-identity guarantee AC-944's own body says it supersedes** — "This supersedes the earlier pixel-identity guarantee, deliberately" — retired by REQ-137 (`request-d2980a95`, free_and_reconciled, 2026-08-12), which replaced stored named steps with a computed shade. Line 585 asserts every rendered byte is unchanged and line 594 asserts `resolveL1Palette(converted, palette)` **exactly equals** the original, with the comment "Pixel-identity is a property, not a tolerance". It exercises **none** of AC-944's three live clauses: unshaded references byte-exact, shaded references within 8/255, and the accepted drift reported worst-first. Verified green (`npm test -- --project node tests/reconciliation-colour-census-and-retrofit.test.ts -t AC944` → 1 passed, 31ms), so it currently reads as passing evidence for a retired guarantee. The same file's docblock (lines 3, 19, 24, 25) states three further retired AC texts — "a lightness ramp is one entry with **steps**" (REQ-137 deleted entry steps), "moves no pixel — the render is byte-identical", "cannot be proved **lossless**" — and STORY-97's retired title "…without moving a pixel" | Resolved by finding 1's deletion. `…shade-model.test.ts:679 test_UAT_AC944_unshaded_references_are_exact_shaded_stay_within_the_bound_and_drift_is_reported` already covers all three clauses (verified green, 1032ms) and is the correct owner |
| 3 | violation | consistency | `tests/reconciliation-colour-palette-overlay.test.ts:497` `test_UAT_AC932_retrofit_shrinks_the_palette_materially_and_paints_the_same_colours` | uat-edit | The test covers **none of AC-932's three current bullets**. AC-932 (`9f1e7baf`) was narrowed today (2026-09-10T19:59:01Z) to the retrofit's zero-colour floor case: an empty palette is *written*, no page carries a reference, the definition still validates. What the test actually asserts is the two claims attempt 5 **moved off** AC-932 — "materially smaller palette" (lines 517-528: `entries` 7 vs `distinctRgb` 16 for `xgd`, 15 vs 30 for `gigabytealchemy`, then `expect(entries).toBeLessThan(census.distinctRgb)`), which AC-941 (`48360aec`) now solely owns; and "no colour lost" (line 533, painted-colour multiset equality), which AC-944 (`3127e56f`) now solely owns. Its colourless tail (lines 543-574) stops at `cmdColors(...).colors` being `[]` — it never runs the retrofit, so it reaches none of AC-932's three assertions. Note the file belongs to `story-c490f1cf` (framework substrate), not to STORY-97; its docblock line 43 still states the pre-repair AC-932 text | Either delete the `AC932` test from `…palette-overlay.test.ts` and its docblock entry (lines 43-44) — `…shade-model.test.ts:988 test_UAT_AC932_a_colourless_site_retrofits_to_an_empty_palette_and_still_validates` already covers all three bullets and was correctly updated in `1a027575a4` — or, if the shrink/losslessness assertions on the two stored sites are worth keeping as evidence, rename it to the AC that now owns each claim (AC-941 / AC-944) and move it into `…shade-model.test.ts` |
| 4 | warning | consistency | `tests/reconciliation-colour-retrofit-shade-model.test.ts:2-4` and `:32` | uat-edit | The surviving file's own docblock still states STORY-97's retired title, "migrate it onto a palette **without moving a pixel**" (the story now reads "within a proven per-channel bound"), and summarises AC-945 as "cannot be proved **lossless**" where AC-945 (`66e919f9`) was retitled today to "cannot be proved **within the bound**". Documentation only — every assertion in the file is correct against the current ACs, and the AC-945 test body already matches on `/exceeds the shade bound/i` | Update lines 2-4 to the current story title and line 32 to "cannot be proved within the bound writes nothing" |
| 5 | warning | consistency | `tests/reconciliation-site-asset-listing.test.ts:8-9` and `:220` | uat-edit | The docblock ("the draft asset **directory**") and AC-1018's inline comment ("a full asset **directory**") still use the filesystem noun. AC-1018 / AC-1020 / AC-1021 were reworded to "asset **store**" today (19:59Z) because REQ-142 (`request-0dd62a5d`, free_and_reconciled) moved the filesystem behind an async `SiteStore` port and REQ-143 added a second adapter. Wording only — the tests drive `run(argv)` and `startBuilder`, which are above the port and therefore adapter-agnostic, so the assertions are already correct | Replace "asset directory" with "asset store" at lines 9, 12 and 220 |
| 6 | info | coverage | AC-871 (`b17420aa`) / `…scaffold-starter-l1.test.ts:178` | — | The UAT is gated `it.runIf(await chromiumAvailable())` (line 48) and does not execute in this sandbox, where Chromium is blocked by the Mach bootstrap policy rather than being absent. The test itself is substantive — it drives `cmdShot` end to end and asserts the PNG magic bytes, not merely that a file exists — and authoring the gated leg is the established pattern here. Environment property, not drift | none |
| 7 | info | exclusivity | `tests/req101-font-registry.test.ts`, `tests/req102-scaffold-l1.test.ts`, `tests/req114-palette-model.test.ts` | — | These carry `test_UAT_FC_REQ-*` tests over the same subject matter as STORY-92/93/97. They are free-coded UATs traceable to the REQ rather than to an AC, a separate lineage from the AC-numbered reconciliation UATs, and were not treated as exclusivity duplicates | none |

## Notes for the Editor

**One root cause, three symptoms.** Findings 1, 2 and 3 are all the same thing: a
claim moved between ACs, and only one of the three test files that assert it was
brought along. Fixing finding 1 (delete
`tests/reconciliation-colour-census-and-retrofit.test.ts`) discharges finding 2
automatically, because the offending AC-944 test lives inside the deleted file.
Finding 3 is in a *different* file — `…palette-overlay.test.ts`, owned by
`story-c490f1cf` in another capability — and must be fixed separately. Do not assume
the STORY-97 sweep reached it.

**Order of work.** (1) delete the census file; (2) fix the AC-932 test in
`…palette-overlay.test.ts`; (3) the two docblock warnings. Steps 1 and 2 are
independent of each other.

**Before deleting, nothing needs porting.** This was checked rather than assumed:
`…shade-model.test.ts` covers all nine shared ACs plus AC-932, AC-1146 and AC-1147,
and on the two ACs where the two files diverge it is the wider one — its AC-943 adds
the REQ-137 mis-classifying-fit refusal (census has no equivalent) and asserts
reference-level determinism, and its AC-944 covers all three live clauses where
census covers none.

**A green test is not evidence of alignment.** Both stale tests pass today. The
AC-944 duplicate was executed this run and reported `1 passed` in 31ms; the
survivor's AC-944 was executed too and reported `1 passed` in 1032ms. A future check
at this level should read what a test asserts against the AC body rather than
trusting `uat_coverage: pass` on the AC frontmatter — all ten of the double-covered
ACs currently carry `uat_coverage: pass`.

**Coverage is not the problem.** Every one of the 38 active ACs has a substantive
UAT driving a real entry point — CLI `run(argv)` / the shipped `1c` launcher as a
subprocess, `startBuilder` over HTTP, `cmdNew` / `cmdRender` / `cmdShot` / `cmdRepro`,
`validateSite` and `loadSite`. No AC needs a `uat-add`, and no test is a
structural/AST stand-in. All three violations are consistency and exclusivity
defects in tests that already exist.
