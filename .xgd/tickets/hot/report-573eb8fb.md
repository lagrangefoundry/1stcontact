---
uid: report-573eb8fb
id: REPORT-1595
type: report
title: 'Capability-Intent Alignment: In-Page Copy Editing (level=uat)'
created_by: xgd
created_at: '2026-08-07T17:43:04.816093+00:00'
updated_at: '2026-08-07T17:43:04.816093+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-12fee326
  level: uat
  violations: 1
  warnings: 1
  needs_review_count: 0
---

# Capability-Intent Alignment: In-Page Copy Editing
# Level: uat

**Result**: FAIL
**Violations**: 1
**Warnings**: 1
**Needs review**: 0

Story level (REPORT-1591) and AC level (REPORT-1594) both PASS, so per the level
cascade the AC bodies are the working reference here and intent history was
consulted only for the ledger and for the one finding where a test's own
self-description had to be checked against what the criterion asks for.

All 28 active ACs across the capability's two stories carry at least one
`test_UAT_AC<n>_*` test. Every such test was executed in this worktree
(`npx vitest run` over the four owning files): **33 passed, 5 skipped, 0 failed**.
A launchable Chromium was present, so the real-browser halves of AC-993 and
AC-1006 genuinely ran.

## Cumulative Intent Considered

Chronological by `merged_at_commit` in this branch's history (all three are
`free_and_reconciled`, so all count).

| Intent ID | Status | Merged | Asked / changed | Counts? |
|---|---|---|---|---|
| BUNDLE-14 `bundle-0385746c` (BUG-31 + REQ-114 + REQ-116) | free_and_reconciled | cd8f98c8 2026-08-06 15:43 | Created STORY-98 — the edit render channel, segmentation, addressing, inertness, settled state | YES |
| BUNDLE-16 `bundle-15c1f647` (REQ-117 + REQ-115 + REQ-44) | free_and_reconciled | 1741ee5d 2026-08-06 21:16 | Created STORY-101 — the click-to-edit gesture; updated STORY-98 with the page stamp, hover treatment, vocabulary-to-schema move, contact-form seam marker | YES |
| REQ-118 `request-66e4c630` | free_and_reconciled | b2b9208c 2026-08-06 22:32 | Updated STORY-101 — image selection: an image region exposes which image goes here plus alt text, through the same gesture and the same copy transport (AC-1028) | YES |

No intent in the ledger is abandoned, deprecated, draft, or imminent-only. The
ACs themselves carry no `intent_uid`/`updated_by`; lineage is held at the story
level, which is where it was read from.

## Alignment Ledger

STORY-98 (`story-af36c2cb`, upgrade) — the edit render channel.

| Element | Test | Intents aligned to | Outcome |
|---|---|---|---|
| AC-948 | `test_UAT_AC948_edit_render_carries_the_same_content_and_deliberately_does_not_work` | BUNDLE-14 | aligned — asserts same copy/image/instances in both channels, preview keeps href + action + method + bundle, edit has none, no `capabilities.js` on disk in the edit outDir, link element survives around the same copy |
| AC-949 | `test_UAT_AC949_scroll_revealed_copy_renders_settled_visible_and_editable` | BUNDLE-14 | aligned — asserts the preview pre-state (`opacity: 0`) and reveal marker, their absence in edit, and that the copy is stamped `data-l1-segment="copy"` |
| AC-950 | `test_UAT_AC950_carousel_slides_are_all_visible_because_the_module_declares_settled_state` | BUNDLE-14 | aligned — asserts marker absent/present per channel, the module's own `[data-fc-edit] .carousel__track` rule, and that the identical rule is inert in preview |
| AC-951 | `test_UAT_AC951_segmentation_is_derived_and_regions_with_nothing_to_edit_are_not_stamped` | BUNDLE-14 | aligned — asserts no annotation in the stored definition, per-kind counts (5 copy / 1 image / 1 container / 2 module), and that the unpainted container, empty seam and control leaves carry no stamp |
| AC-952 | `test_UAT_AC952_every_segment_is_outlined_by_the_render_without_reserving_layout_space` | BUNDLE-14, BUNDLE-16 | aligned — asserts exactly two treatments, their selectors, a per-declaration whitelist of `outline`/`outline-offset`/`transition`, and neither in preview |
| AC-953 | `test_UAT_AC953_every_stamped_address_resolves_to_exactly_one_node_and_is_unique` | BUNDLE-14 | aligned — resolves every document-namespace address against the stored definition, checks kind agreement and distinctness |
| AC-954 | `test_UAT_AC954_seam_content_is_addressable_rooted_at_the_behavior_instance` | BUNDLE-14, BUNDLE-16 | aligned in substance, **warning on enforcement scope** — see finding 2 |
| AC-955 | `test_UAT_AC955_reordering_siblings_yields_addresses_that_still_resolve` | BUNDLE-14 | aligned — records both addresses, swaps siblings in the stored definition, re-renders, asserts the swap and re-resolves against the changed definition |
| AC-956 | `test_UAT_AC956_preview_and_published_renders_carry_no_edit_artefacts_and_still_work` | BUNDLE-14, BUNDLE-16 | aligned — baseline preview bytes, two edit renders, file-list and byte equality, then both shipped channels checked for absence of all five artefacts and presence of link/form/bundle |
| AC-957 | `test_UAT_AC957_author_identifier_is_unchanged_and_the_address_is_stamped_alongside_it` | BUNDLE-14 | aligned — asserts identical emission in both channels, id-without-stamp on the unpainted root, id-plus-address on the painted band, and set equality of emitted ids |
| AC-958 | `test_UAT_AC958_edit_channel_has_its_own_output_location_renders_draft_and_creates_no_revision` | BUNDLE-14 | aligned — `--source latest --edit` settles on the draft, outDir distinct from preview and published and ends `acme/edit`, revision history unchanged after three edit renders |
| AC-1007 | `test_UAT_AC1007_edit_render_stamps_the_definition_id_of_the_page_it_came_from` | BUNDLE-16 | aligned — id `landing` differs from slug `home` and from both `index.html` and `home.html`; stamp checked on the same element as the marker across three files; the coordinate is resolved end-to-end through `editCopyGet`; shipped channels carry no stamp |
| AC-1008 | `test_UAT_AC1008_the_stamp_vocabulary_is_one_published_contract_the_render_and_a_client_share` | BUNDLE-16 | aligned — imports the vocabulary from the schema package and the renderer package under aliases and asserts identity, not equality of appearance; asserts every edit-only `data-*` attribute is a published value; composes the hot selector from published parts |

STORY-101 (`story-3bf94bd4`, feature) — the click-to-edit gesture.

| Element | Test | Intents aligned to | Outcome |
|---|---|---|---|
| AC-993 | `test_UAT_AC993_hovering_marks_only_the_hovered_region_and_never_moves_the_page` | BUNDLE-16 | aligned — real bridge over the rendered bytes for the marking rules, plus a real Chromium measuring every region's box before and during hover. Ran fully here (1387 ms, no unverified report) |
| AC-994 | `test_UAT_AC994_clicking_a_copy_region_opens_one_form_over_that_regions_fields` | BUNDLE-16 | aligned; shared-component half reported UNVERIFIED here under the story's ratified caveat |
| AC-995 | `test_UAT_AC995_a_click_resolves_to_the_innermost_region_containing_it` | BUNDLE-16 | aligned — proves the fixture genuinely nests before asserting, and shows innermost-wins narrows rather than hides the parent |
| AC-996 | `test_UAT_AC996_a_click_inside_a_module_seam_names_that_instance_and_seam` | BUNDLE-16 | aligned — asserts the page's own same-named seam is an ancestor and still does not qualify, then saves over the real origin and checks the words landed inside the instance with page regions untouched |
| AC-997 | `test_UAT_AC997_one_confirmed_form_is_one_change_however_many_fields_it_held` | BUNDLE-16 | aligned; the "editing a field writes nothing until Save" half needs the form component and is reported UNVERIFIED here |
| AC-998 | `test_UAT_AC998_after_a_save_the_page_shows_the_new_words_and_is_still_editable` | BUNDLE-16 | aligned — the replacement page is refetched from the origin, remounted, and hover + click are re-proved on it; chrome round-trip reported UNVERIFIED here |
| AC-999 | `test_UAT_AC999_a_refused_edit_shows_its_own_reason_and_leaves_page_and_draft_unchanged` | BUNDLE-16 | aligned — a real `SCHEMA_INVALID` from the shared validator, draft and rendered bytes byte-identical, corrected re-confirm succeeds; the "form stays open holding the typed text" half reported UNVERIFIED here |
| AC-1000 | `test_UAT_AC1000_closing_a_form_in_which_nothing_changed_writes_nothing` | BUNDLE-16 | aligned; the confirm-and-cancel half needs the form component and is reported UNVERIFIED here |
| AC-1001 | `test_UAT_AC1001_a_region_with_nothing_editable_says_so_and_names_its_kind` | BUNDLE-16 | aligned — the derivation returning `kind: container, fields: []` runs here; the message dialog is reported UNVERIFIED |
| AC-1002 | `test_UAT_AC1002_the_nothing_to_edit_message_is_dismissible_by_button_escape_and_backdrop` | BUNDLE-16 | aligned in shape; **entirely skipped here** under the ratified caveat — see finding 3 (info) |
| AC-1003 | `test_UAT_AC1003_a_rendering_without_the_page_coordinate_is_refused_before_anything_is_sent` | BUNDLE-16 | aligned — the stale-artifact fixture and the real attribute-name regression guard run here; the refusal message and `net.calls == []` reported UNVERIFIED |
| AC-1004 | `test_UAT_AC1004_copy_longer_than_its_box_still_reads_back_in_full` | BUNDLE-16 | aligned, fully verified here — the whole string round-trips through `/api/copy` character for character and the descriptor asks for a `textarea` |
| AC-1005 | `test_UAT_AC1005_a_page_being_viewed_is_not_marked_intercepted_or_editable` | BUNDLE-16 | aligned, fully verified here — includes the positive control on the same site's edit render, so the negative assertions measure the marker and not a dead bridge |
| AC-1006 | `test_UAT_AC1006_the_browser_runs_one_address_resolution_served_from_the_renderers_own_source` | BUNDLE-16 | aligned, fully verified here — fetches the served module, checks the contract import resolves to a served address, loads it as a real module script in Chromium, and walks `apps/control-app/src` for a second implementation or a second reader of the stamp |
| AC-1028 | `test_UAT_AC1028_clicking_an_image_segment_offers_a_picker_of_the_sites_assets` (runs) + `test_UAT_AC1028_the_modal_reads_its_picker_from_the_same_copy_transport` (**skipped**) | REQ-118 | **violation** — the transport clause is skipped for a reason that does not apply; see finding 1 |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | consistency | AC-1028 / `tests/req118-image-selection.test.ts:367` | uat-edit | AC-1028's Verification requires "Assert the modal obtains these choices over the same copy transport a copy edit uses, not an image-specific one." Its only test, `test_UAT_AC1028_the_modal_reads_its_picker_from_the_same_copy_transport` (line 393), sits inside `describe.skipIf(!WEBUI_INSTALLED)` and was skipped in this run. But that test mounts no component — it only does `fetch('/api/copy?...')` against `startBuilder`. That exact call passes without the components elsewhere in the same run (`reconciliation-copy-edit-gesture-modal.test.ts:223` and `reconciliation-copy-edit-gesture.test.ts:391`); only `chromeHtml()` (`tools/generate/src/cli/builder.ts:63-74`, reached solely by `GET /`) needs them. STORY-101's ratified caveat is scoped to "criteria whose remaining evidence is a real browser driving that chrome" — this test drives no chrome, so the gate is not covered by it and the clause has zero evidence for a false reason | Narrow the gate: drop `skipIf(!WEBUI_INSTALLED)` from the `REQ-118 image selection over the builder origin` describe (all four of its tests are plain origin fetches — `/api/copy`, `/preview/...`, `/api/assets`), or move `test_UAT_AC1028_the_modal_reads_its_picker_from_the_same_copy_transport` into an ungated describe |
| 2 | warning | consistency | AC-954 / `tests/reconciliation-edit-render-channel.test.ts:194` | uat-edit | AC-954 states the obligation is on the catalog — "every module in the catalog that exposes one makes it… and for any module added after them" — and its Verification says "For each module in the catalog that exposes a presentation seam". The test iterates `SEAM_CASES`, a hand-maintained literal of two entries. Its own comment claims "a module added later without a marker fails the criterion rather than quietly shipping copy nobody can address", which is not what the code does: a third module with no `SEAM_CASES` entry is simply never exercised. The criterion IS proven for the current catalog — `packages/framework/src/modules/registry.ts:16` holds exactly `carouselMeta` and `contactFormMeta` — so this is a future-enforcement gap, not a present coverage hole | Derive the cases from the catalog: iterate `registry` / `MODULES`, and either drive each seam-exposing module from its `meta`, or assert that the set of seam-exposing modules in the registry equals the set covered by `SEAM_CASES` so a new module forces an entry |
| 3 | info | coverage | AC-1002 | — | `test_UAT_AC1002_the_nothing_to_edit_message_is_dismissible_by_button_escape_and_backdrop` is `it.skipIf(!WEBUI_INSTALLED)` and skipped here, so AC-1002 is the one AC with no executed evidence in this worktree. Unlike finding 1 this gate is correct: the criterion is entirely about dismissing the dialog `mountEditor` builds from `@gendevlabs/webui-fields`, which cannot be exercised without the component and which the story forbids mocking. STORY-101's Technical Context records exactly this ("the browser evidence for this story skips with a stated, reported reason rather than failing… the gesture is genuinely unverified there until a private registry exists"), and story level passed on that body. Matrix and intent agree; there is no drift | none — environmental, resolved by running `bin/install --lang js --component all` in lagrange-framework, not by a matrix or test edit |
| 4 | info | exclusivity | AC-1028 | — | The two AC-1028 tests are different shapes against different entry points (the `1c copy get` CLI envelope vs. the `/api/copy` HTTP route on the builder origin), which the constraints explicitly allow. Not duplicates | none |

## Notes for the Editor

**The two skips are not the same kind of thing, and only one is a finding.**
Five tests skipped in this run. Four of them (AC-1002, plus three REQ-118
free-coded tests) and the six `unverified(...)` reports inside otherwise-passing
tests are the story's ratified coverage caveat doing exactly what it was written
to do — loudly. The fifth, AC-1028's transport test, is collateral damage from a
describe-level gate that is broader than the dependency it guards. Fixing
finding 1 does not touch the caveat; it just stops the caveat from swallowing
evidence this machine can produce.

**Environment note for whoever reruns this.** `@gendevlabs/webui-*` resolve from
`/Users/martin/lagrangefoundry/node_modules/@gendevlabs/`, which is not an
ancestor of this worktree (`/Users/martin/.xgd/worktrees/…/regression-5096fbee`),
so Node's upward resolution finds nothing and `WEBUI_INSTALLED` is false here
even though the components exist on this machine. This is the implicit-dependency
cost `tests/support/webui-installed.ts` documents, surfacing as a worktree
artefact rather than a missing install. Worth knowing before anyone concludes the
components were never installed.

**No AC-level or story-level escalation was needed.** Every AC body was legible
against its story body without consulting intent, and no test contradicted its
AC's stated intent. The one substantive disagreement (finding 1) is between a
test's gate and the test's own dependencies, not between the matrix and intent.

**Positive observation worth carrying forward.** The tests in this capability are
unusually well-shaped as evidence: they drive real CLI entry points and a real
HTTP origin, read the bytes actually written to disk, prove their fixtures
discriminate before asserting on them (AC-995's nesting check, AC-1005's positive
control, AC-1003's `undefined=` regression guard), and pin the identity of shared
constants rather than their equality (AC-1008). Nothing here is an AST-shaped
stand-in for behaviour. If a future check tightens the UAT bar, this capability
is the reference, not the target.
