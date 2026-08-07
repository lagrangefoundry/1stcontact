---
uid: report-d9b5e294
id: REPORT-1615
type: report
title: 'Capability-Intent Alignment: Structured Copy Editing: One Validated, Atomic
  Write Path (level=uat)'
created_by: xgd
created_at: '2026-08-07T19:34:08.546263+00:00'
updated_at: '2026-08-07T19:34:08.546263+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-f753cecd
  level: uat
  violations: 0
  warnings: 4
  needs_review_count: 0
---

# Capability-Intent Alignment: Structured Copy Editing: One Validated, Atomic Write Path
# Level: uat

**Result**: PASS
**Violations**: 0
**Warnings**: 4
**Needs review**: 0

Level is `uat`, so AC bodies are the working reference; intent history was
consulted only to confirm which behaviours are live (no AC was found
internally suspicious).

## Cumulative Intent Considered

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUNDLE-16 (bundle-15c1f647) — REQ-117 + REQ-115 + REQ-44 | free_and_reconciled | merged at `1741ee5d` | REQ-117 built the end-to-end copy edit: address → exposed fields → one buffered diff → shared validator → apply → re-render; no WYSIWYG/raw mode; overflowing copy accepted and legible in full | YES |
| REQ-118 (request-66e4c630) | free_and_reconciled | created 2026-07-31, completed 2026-08-07, merged at `b2b9208c` | Image selection as the *second half of the same surface*: no `image set` command, no `/api/image` route; field vocabulary widened `string` → `string \| enum`; `src` enum = site images + the node's current handle; enum membership enforced on the write side before the shared validator | YES |

Both intents are `free_and_reconciled`; no retired or abandoned intent touches
this capability. The tree is one story (STORY-100, `story_kind: upgrade`,
`intent_uid: bundle-15c1f647`, `updated_by: request-66e4c630`) with 17 active
ACs.

## Evidence executed

`npx vitest run tests/reconciliation-copy-edit-write-path.test.ts
tests/reconciliation-copy-edit-image-selection.test.ts` →
**2 files passed, 22 tests passed** (1.61s). Every UAT drives a real entry
point — `run(argv)` on the `1c` CLI, and `POST/GET /api/copy` against a live
`startBuilder` origin — and reads real observables (draft JSON bytes, rendered
channel bytes, asset-file fingerprints, JSDOM over the emitted HTML). Nothing
internal is stubbed, so no evidence-validity objection arises. No `code-issue`
findings.

## Alignment Ledger

| Element | Test(s) | Intents aligned to | Outcome |
|---|---|---|---|
| AC-980 | `test_UAT_AC980_a_copy_region_exposes_one_plain_string_field_holding_the_draft_words` (write-path) | BUNDLE-16 | aligned — one plain-string field, human label, exact draft text; textarea requested for long *and* newline-broken runs, not for the short one |
| AC-981 | `..._a_region_with_nothing_editable_succeeds_with_an_empty_field_list` (write-path) + `..._a_region_that_exposes_nothing_answers_with_an_empty_field_list` (image-selection) | BUNDLE-16, REQ-118 | aligned; **duplicated** — see finding 1 |
| AC-982 | `test_UAT_AC982_saving_new_words_updates_the_draft_and_re_renders_the_page` | BUNDLE-16 | aligned — draft + render both carry the new words, `changed`/`rendered` reported, identical resubmit reports "No change" |
| AC-983 | `test_UAT_AC983_a_change_map_is_applied_whole_or_not_at_all` | BUNDLE-16 | aligned — mixed map leaves zero modified files against a published base; well-formed map moves exactly `pages/home.json` |
| AC-984 | `test_UAT_AC984_a_rejected_edit_leaves_the_draft_and_the_render_byte_identical` | BUNDLE-16 | aligned — all four refusal classes plus unknown-field, byte equality on draft and rendered channel |
| AC-985 | `test_UAT_AC985_a_refusal_carries_a_code_a_path_and_a_hint_with_a_failing_exit_status` | BUNDLE-16 | aligned — `SCHEMA_INVALID`, path containing region *and* field, actionable hint, exit 2; success side asserted too |
| AC-986 | `..._a_copy_edit_is_validated_over_the_whole_resulting_definition` (write-path) + `..._any_edit_is_validated_over_the_whole_resulting_definition` (image-selection) | BUNDLE-16, REQ-118 | aligned — asserted by consequence (unrelated `fontSizePx: 9999` refuses copy set, image set and `config set` with identical code/message/path); **write-path version is a strict subset** — see finding 2 |
| AC-987 | `test_UAT_AC987_a_malformed_address_is_refused_outright_and_never_coerced` | BUNDLE-16 | aligned — 9 malformed forms refused with the address named and no `data` returned; well-formed-but-absent → `NOT_FOUND` with the re-read hint |
| AC-988 | `..._an_unknown_field_or_a_non_text_value_is_refused_not_ignored` (write-path) + `..._an_unknown_field_a_non_text_value_or_a_choice_never_offered_is_refused` (image-selection) | BUNDLE-16, REQ-118 | aligned — all three refusal kinds covered between them, complementary rather than redundant (finding 5) |
| AC-989 | `test_UAT_AC989_copy_in_a_module_slot_reads_and_writes_through_the_same_operation` | BUNDLE-16 | aligned — both slot shapes (carousel repeated slot, contact-form single subtree) read/written/re-rendered; instance-rooted address with no slot refused |
| AC-990 | `test_UAT_AC990_copy_longer_than_its_box_reads_back_in_full` | BUNDLE-16 | aligned — whole string round-trips, textarea requested |
| AC-991 | `..._markup_saved_as_text_stays_literal_and_every_field_is_plain_text_or_a_closed_list` (write-path) + `..._every_control_is_plain_text_or_a_pick_from_a_list_the_surface_supplied` (image-selection) | BUNDLE-16, REQ-118 | aligned — payload literal in copy text *and* in `alt` (a different escape path), no new `script`/`style`/`b`; whole-page sweep sees both field shapes; **largely duplicated** — see finding 4 |
| AC-992 | `..._the_origin_is_the_same_surface_faulting_and_re_rendering_alike` (write-path) + `..._the_origin_is_the_same_surface_for_words_and_for_images_alike` (image-selection) | BUNDLE-16, REQ-118 | aligned — origin read matches CLI byte-for-byte, refusal is 4xx carrying the CLI's own code/path/hint/message, save leaves `edit` and `draft` renderings current; **write-path version is a subset** — see finding 3 |
| AC-1024 | `test_UAT_AC1024_an_image_region_exposes_a_closed_list_of_the_sites_images_and_its_alt_text` | REQ-118 | aligned — two fields; `src` enum required, sorted, deduplicated across registry+directory, excludes the seeded `.woff2` and `.css`; `alt` plain text under the same textarea rule; identical answer over the origin |
| AC-1025 | `test_UAT_AC1025_a_regions_current_image_is_always_among_the_choices_it_offers` | REQ-118 | aligned — offsite handle on no disk is offered and reported current; alt-only save leaves `src` untouched |
| AC-1026 | `test_UAT_AC1026_choosing_an_image_updates_the_draft_and_the_rerendered_page_shows_it` | REQ-118 | aligned — new handle in draft and render, old absent; identical resubmit → no change; `src`+`alt` in one call → one modified document, both reported changed; origin save leaves both channels current |
| AC-1027 | `test_UAT_AC1027_choosing_an_image_bakes_nothing_and_leaves_every_other_parameter_intact` | REQ-118 | aligned — asset fingerprints (bytes, size, mtime) and file set identical; node differs in exactly `src`, `id` and `axes.objectFit` survive |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | exclusivity | AC-981 (`acceptance_criterion-95afd919`) | uat-edit | Two AC-981 UATs of the same shape (CLI `copy get`) assert the same scenario: container + module instance → empty list, exit 0, human "no editable copy", contrast copy=1 / image=2 fields. `tests/reconciliation-copy-edit-write-path.test.ts:239` and `tests/reconciliation-copy-edit-image-selection.test.ts:330`. The write-path copy additionally asserts the image enum and values, which is AC-1024/AC-1025 territory, not AC-981's | Keep the image-selection copy (its fixture has a real asset store); delete the write-path copy, or reduce it to the container/module case only |
| 2 | warning | exclusivity | AC-986 (`acceptance_criterion-289bbf76`) | uat-edit | `test_UAT_AC986_a_copy_edit_is_validated_over_the_whole_resulting_definition` (write-path:401) is a strict subset of `test_UAT_AC986_any_edit_is_validated_over_the_whole_resulting_definition` (image-selection:500): same `fontSizePx: 9999` decoy, same `config set` comparator, same code/message/path equality — the latter simply also covers the image edit the upgrade widened the AC to include | Delete the write-path AC-986 test; the image-selection one is the AC as currently worded ("**any** edit through this surface") |
| 3 | warning | exclusivity | AC-992 (`acceptance_criterion-9561711e`) | uat-edit | `..._faulting_and_re_rendering_alike` (write-path:697) asserts the origin read/refusal/dual-render for a copy region only; `..._for_words_and_for_images_alike` (image-selection:619) asserts the identical three claims for copy **and** image, including the enum riding the read. The AC as worded requires both kinds, so the write-path test proves nothing the other does not | Delete the write-path AC-992 test, or retarget it at something the image-selection test does not cover |
| 4 | warning | exclusivity | AC-991 (`acceptance_criterion-08c7ebe8`) | uat-edit | The two AC-991 UATs (write-path:574, image-selection:542) are near-identical: same payload string, same JSDOM script/style/`b` counts, same alt-attribute check, same whole-page field-shape sweep. Non-redundant remainder is small but real — only the write-path fixture sweeps a contact-form single-subtree slot containing `control` nodes | Merge into one test on the richer fixture (asset store + contact-form slot) rather than maintaining two |
| 5 | info | exclusivity | AC-988 (`acceptance_criterion-97f5dee6`) | — | The two AC-988 UATs overlap but are genuinely complementary: write-path:475 covers the extra non-text scalars (`true`, `null`); image-selection:446 covers the third refusal kind the AC requires — a closed-list value never offered (`/assets/nowhere.png`, `/assets/body.woff2`, `javascript:alert(1)`) at `${A_IMAGE}/src`. Not a duplicate | none |
| 6 | info | consistency | AC-984 (`acceptance_criterion-4bf1f692`) | — | The test asserts byte equality of the `edit` rendering only, not the `draft` rendering. This matches the surface: the CLI write path re-renders one channel (`data.rendered`); the dual-channel obligation is AC-992's and is asserted there. No gap | none |
| 7 | info | coverage | all 17 ACs | — | Every active AC has at least one substantive UAT driving a real entry point, and all 22 executed and passed on this branch. No `uat-add` gap and no `code-issue` evidence | none |

## Notes for the Editor

**One cross-cutting pattern accounts for every warning.** REQ-118 was reconciled
by adding a second AC-named test file
(`tests/reconciliation-copy-edit-image-selection.test.ts`) beside the existing
`tests/reconciliation-copy-edit-write-path.test.ts`, rather than widening the
existing tests in place. Both files belong to the *same* story
(story-37a3921b) and both carry AC-named UATs, so five ACs (981, 986, 988, 991,
992) now have a test in each file. For 986 and 992 the newer test strictly
supersedes the older; for 981 and 991 they are near-identical; only 988 is
complementary.

This is duplication in the reconciled evidence set, not drift from intent —
hence warnings, not violations. It is worth noting that it sits close to the
reuse-first invariant ("prefer modifying existing code paths; no parallel
implementations"): the upgrade widened four ACs from "a copy edit" to "any edit
through this surface", and the natural repair is to widen the corresponding
tests, not to fork them. If an editor acts on findings 1–4, the smallest
coherent move is to fold the five shared ACs into whichever file carries the
richer fixture and leave the other file covering only the ACs unique to it.

**Not a finding:** `tests/req118-image-selection.test.ts` carries
`test_UAT_FC_REQ-118_*` free-coding UATs that overlap these ACs. Coexistence of
FC-named and AC-named evidence is the established project convention (110 test
files carry `test_UAT_FC_REQ` names alongside 47 `reconciliation-*` files), so
it is not treated as duplication here. That file also carries
`test_UAT_AC1028_*`, which belongs to the editor-gesture capability, not this
one — correctly outside this capability's tree, matching the story body's
statement that the browser gesture is not claimed as an acceptance criterion
here.
