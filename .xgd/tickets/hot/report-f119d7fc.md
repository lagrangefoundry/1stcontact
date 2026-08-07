---
uid: report-f119d7fc
id: REPORT-1603
type: report
title: 'Capability-Intent Alignment: site-materials-and-start-point (level=uat)'
created_by: xgd
created_at: '2026-08-07T18:32:33.626290+00:00'
updated_at: '2026-08-07T18:32:33.626290+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-b4ac88fc
  level: uat
  violations: 1
  warnings: 0
  needs_review_count: 0
---

# Capability-Intent Alignment: site-materials-and-start-point
# Level: uat

**Result**: FAIL
**Violations**: 1
**Warnings**: 0
**Needs review**: 0

Anchor report: report-17a279f7. Previous attempts: 1 (both prior fix/check
cycles ran at `ac` level — REPORT-1599/1600/1601; this is the first `uat`-level
check for this capability).

## Cumulative Intent Considered

Level is `uat`, so AC bodies are the working reference and intent history is
background. Ledger compiled from `fields.intent_uid` / `fields.updated_by` on
the four stories, ordered by `merged_at_commit` date.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUNDLE-11 (bundle-ee56a66e) — BUG-27 + REQ-94/96/97/98 +10 | free_and_reconciled | 2026-08-05 (f9a415a8) | Created STORY-93 (scaffold starter L1) and STORY-92 (font provenance) | YES |
| BUNDLE-14 (bundle-0385746c) — BUG-31 + REQ-114 + REQ-116 | free_and_reconciled | 2026-08-06 (cd8f98c8) | Created STORY-97 (colour census + palette retrofit); REQ-114 retired the theme colour palette, which updated STORY-93/AC-873 | YES |
| REQ-118 (request-66e4c630) — image selection / asset picker | free_and_reconciled | 2026-08-06 (b2b9208c) | Created STORY-102 (site asset store as its own surface) | YES |

No retired, abandoned or draft intent touches this capability's tree. All four
stories are `story_kind: feature` and `status: completed`, so all 35 ACs are in
scope for UAT coverage.

## Alignment Ledger

Every active AC resolves to exactly one UAT via the `test_UAT_AC<n>_*`
convention. All 35 are substantive: they drive real entry points (the shipped
`1c` launcher as a subprocess, `run(argv)`, the command handlers, the exported
schema validators, and a live builder origin over HTTP) against real on-disk
site trees in throwaway workspaces. No AC is covered by a structural/AST-only
check, and no two UATs verify the same scenario in the same shape.

### STORY-92 — font provenance (`tests/reconciliation-font-provenance.test.ts`)

| Element | Intents aligned to | Outcome |
|---|---|---|
| AC-857 → `test_UAT_AC857_record_entries_state_origin_licence_and_files_or_are_rejected` | BUNDLE-11 | aligned — validates the shipped `fonts/registry.yaml`, all four damaged shapes with error paths, and bare/quoted/Date normalisation |
| AC-858 → `..._unregistered_family_fails_and_exits_non_zero` | BUNDLE-11 | aligned — kind, family, site, remediation, and non-zero CLI exit |
| AC-859 → `..._recorded_family_with_unlisted_file_fails_naming_that_file` | BUNDLE-11 | aligned — asserts the unlisted weight is named and the listed one is not |
| AC-860 → `..._unreferenced_font_file_fails_and_derived_trees_are_not_scanned` | BUNDLE-11 | aligned — pass case, unreferenced file, and `storage/dist` + `node_modules` exclusion keeping the count at one |
| AC-861 → `..._product_distribution_requires_settled_yes_redistribution` | BUNDLE-11 | aligned — all four cells of the two-input matrix, with distinct messages for unresolved vs settled-no |
| AC-862 → `..._site_definition_declares_internal_or_product_or_nothing` | BUNDLE-11 | aligned — includes the absent-means-internal case asserted through the gate, not just the validator |
| AC-863 → `..._outstanding_actions_warn_with_family_actions_and_sites` | BUNDLE-11 | aligned — advisory present with `usedBy`, and absent once the action is removed |
| AC-864 → `..._broken_record_stops_the_run_rather_than_passing_vacuously` | BUNDLE-11 | aligned — all four integrity failures, each also asserted non-zero and not-`PASS` through the CLI |
| AC-865 → `..._scans_tracked_and_scratch_trees_and_attributes_violations` | BUNDLE-11 | aligned — attribution to `sandbox/repro`, and both trees shown scanned |
| AC-866 → `..._reference_forms_reduce_to_the_recorded_file_key` | BUNDLE-11 | aligned — all five reference forms plus an end-to-end query-bearing pass |
| AC-867 → `..._report_states_families_references_and_files_scanned` | BUNDLE-11 | aligned — runs against `REPO_ROOT` with all three counts non-zero, so the pass cannot come from an empty scan |
| AC-868 → `..._json_mode_emits_one_document_whose_flag_matches_the_exit_status` | BUNDLE-11 | aligned — single-document parse, empty stderr, flag/exit agreement on both verdicts |

### STORY-93 — scaffold starter (`tests/reconciliation-scaffold-starter-l1.test.ts`)

| Element | Intents aligned to | Outcome |
|---|---|---|
| AC-869 → `..._created_page_carries_a_complete_valid_l1_document` | BUNDLE-11 | aligned — reads the artifact off disk, validates the document alone and the assembled definition |
| AC-870 → `..._fresh_site_renders_placeholder_centred_on_theme_background` | BUNDLE-11, BUNDLE-14 (REQ-114) | aligned — asserts on `<body>` not the whole document, and reads the background back off disk rather than restating it |
| AC-871 → `..._fresh_site_shoots_without_hand_editing` | BUNDLE-11 | aligned — PNG signature, not mere file existence; browser-gated exactly as the AC sanctions |
| AC-872 → `..._starter_widths_are_the_capture_viewport_ladder` | BUNDLE-11 | aligned — element-wise against `RESPONSIVE_VIEWPORTS` and against the exported `STARTER_WIDTHS` |
| AC-873 → `..._document_and_placeholder_colours_are_literals_in_the_page_document` | BUNDLE-14 (REQ-114 retired the theme palette) | aligned — both literals, run inherits `textColor`, no palette at either level, theme is exactly the six non-colour groups, and no third colour enters |
| AC-874 → `..._scaffolded_root_declares_no_per_width_geometry_track` | BUNDLE-11 | aligned — no `geometry` on any node, and the rendered CSS carries no `position: absolute` |
| AC-875 → `..._every_created_slug_yields_one_starter_shape_with_no_flag` | BUNDLE-11 | aligned — three slugs, plus documented usage read from the shipped launcher's own `help` output |
| AC-876 → `..._repro_over_a_created_slug_matches_repro_over_a_virgin_slug` | BUNDLE-11 | aligned — byte-identity after slug normalisation; the `placeholder` id it asserts absent is the real scaffold node id (`scaffold.ts:73`), so the check is not vacuous |

### STORY-97 — colour census & retrofit (`tests/reconciliation-colour-census-and-retrofit.test.ts`)

| Element | Intents aligned to | Outcome |
|---|---|---|
| AC-939 → `..._census_reports_literals_counts_alpha_families_and_writes_nothing` | BUNDLE-14 (REQ-116) | aligned — counts, most-used-first ordering, opacity annotation, alpha-families section present/absent, and before/after tree hashes |
| AC-940 → `..._census_json_is_one_parseable_document_agreeing_with_the_human_form` | BUNDLE-14 | aligned — single-value parse, per-field types, and cross-check against the human header |
| AC-941 → `..._assign_writes_palette_rewrites_pages_and_reports_counts_and_files` | BUNDLE-14 | **gap — see finding 1**: the "list of files it wrote" clause is not exercised |
| AC-942 → `..._one_rgb_at_three_opacities_becomes_one_entry` | BUNDLE-14 | aligned — one carrier entry, every stored value opaque, all three translucent literals recovered by resolution |
| AC-943 → `..._ramps_group_vivid_and_neutral_split_isolates_stand_alone` | BUNDLE-14 | aligned — all four grouping clauses plus determinism on an independent run |
| AC-944 → `..._render_is_byte_identical_before_and_after_the_retrofit` | BUNDLE-14 | aligned — full render/render byte comparison plus independent `resolveL1Palette` round-trip against the pre-conversion definition |
| AC-945 → `..._unprovable_retrofit_exits_nonzero_diagnoses_and_writes_nothing` | BUNDLE-14 | aligned — all three causes, each with a cause-identifying diagnostic and whole-tree hash equality |
| AC-946 → `..._derived_names_describe_colours_and_rename_to_role_vocabulary` | BUNDLE-14 | aligned — descriptive vocabulary, kebab-case, uniqueness incl. a disambiguated suffix, rename equivalence, and the unknown-family no-op |
| AC-947 → `..._repro_carries_literals_and_re_assignment_reproduces_the_palette` | BUNDLE-14 | aligned — all three clauses, incl. census-before == census-after across the retrofit |

### STORY-102 — site asset store (`tests/reconciliation-site-asset-listing.test.ts`)

| Element | Intents aligned to | Outcome |
|---|---|---|
| AC-1018 → `..._a_file_present_in_the_site_assets_is_listed_even_when_undeclared` | REQ-118 | aligned — every file listed, filename as identity, on-disk/undeclared flags |
| AC-1019 → `..._a_declared_asset_contributes_its_identity_and_is_listed_with_no_file` | REQ-118 | aligned — merged exactly once, and the declared-but-absent `ghost` entry |
| AC-1020 → `..._every_listed_asset_is_named_in_the_site_local_handle_a_page_holds` | REQ-118 | aligned — bare and qualified forms merge to one handle, handle matched against a real page node, order stable across calls |
| AC-1021 → `..._each_asset_reports_what_it_can_be_used_for` | REQ-118 | aligned — image/font/other from real files, and the unfiltered listing shown to narrow nothing |
| AC-1022 → `..._the_store_answers_from_the_command_line_with_no_editing_gesture` | REQ-118 | aligned — full entry shape for every asset, plus the empty-site success case |
| AC-1023 → `..._the_store_answers_from_the_builder_origin_and_refuses_a_missing_site` | REQ-118 | aligned — HTTP 200 over a live builder, equality with the CLI answer, 400 on the missing slug, and the same list through the builder's own client |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | consistency | AC-941 / `test_UAT_AC941_assign_writes_palette_rewrites_pages_and_reports_counts_and_files` (`tests/reconciliation-colour-census-and-retrofit.test.ts:331`) | uat-edit | AC-941 requires the retrofit to report "**the list of files it wrote** (every rewritten page plus the site definition)", and its Verification directs asserting that "every file **named in the report** differs from its pre-retrofit content". The UAT asserts only the count string `wrote N file(s)` (line 370) and then derives the changed-file list from the filesystem via `pageFiles(siteDir)` (line 369), so it never reads a filename out of the report. The clause is unverified in either output surface: `formatAssign` emits a bare count (`tools/generate/src/cli/colors.ts:518`), and the `--json` form emits the palette alone (asserted at line 390). | Assert the report names each written file — e.g. that `run.stdout` contains every entry of `result.written` (`pages/*.json` and `site.json`). NOTE: this assertion fails against current code; see "Notes for the Editor" for the two admissible repairs. |

## Notes for the Editor

**Finding 1 — pick one of two repairs, do not do both.** The data already
exists: `cmdColorsAssign` returns `written: [...pages.map(p => p.rel), 'site.json']`
(`tools/generate/src/cli/colors.ts:503`). Only the renderer drops it.

- *Repair A (code)* — change `formatAssign` (`colors.ts:512-519`) to list
  `result.written` under the count, then add the UAT assertion. This makes the
  AC true as written and is the reading the AC's own Verification section
  assumes.
- *Repair B (matrix)* — narrow AC-941's third bullet and its Verification from
  "the list of files it wrote" to "the count of files it wrote", matching what
  the command actually reports. This is an `ac-edit` and would need the
  `ac`-level ledger noted, since AC-941 passed the `ac`-level check on 2026-08-07
  with the stronger wording.

Repair A is preferred: STORY-97's body sells the retrofit as reproducible from
a single command line, and an operator who has just had six pages rewritten
under them benefits from seeing which. Nothing in the story body contradicts
either repair — the story is silent on the file list, so the claim originates
with AC-941 alone.

**Cross-cutting observations (no action required).**

- *Fixture realism is load-bearing and currently sound.* The census UATs assert
  against the real stored `xgd` site, which already carries a palette; the
  alpha family they pin (`#2e86a3` at α 1.00 / 0.65 / 0.33) exists as three
  `primary` references carrying `alpha` 255/166/85, not as 8-digit literals.
  This is what makes AC-947's "references are measured as the colours they
  resolve to" a live claim rather than a restatement. `harbor-cafe` genuinely
  carries zero colour literals, so AC-939's zero-census branch is real. These
  assertions will fail loudly if the stored sites drift — that is the intent,
  but any future edit to `storage/sites/xgd` or `storage/sites/harbor-cafe`
  should expect to touch these UATs.
- *AC-871's browser gate is sanctioned.* `it.runIf(browserOk)`
  (`reconciliation-scaffold-starter-l1.test.ts:48`) is the only conditional
  execution anywhere in the capability's four test files; the AC body explicitly
  admits it, and Playwright's chromium is installed in this environment, so the
  test does run here. Worth remembering that in an environment without a
  browser this AC would have no executing evidence.
- *AC-870 and AC-874 share two incidental assertions* (`display: flex`,
  `align-items: center`, both document-wide `toContain` on the rendered HTML).
  Not an exclusivity violation: AC-870's core is the placeholder painting on the
  seeded background read back off disk, AC-874's is the absence of any
  `geometry` track and of `position: absolute`. Different scenarios, different
  cores.
- *AC-1018 asserts only `typeof entry.kind === 'string'`.* Deliberate and
  correct: kind derivation is AC-1021's subject, and duplicating it here would
  be the redundancy this check screens for.

