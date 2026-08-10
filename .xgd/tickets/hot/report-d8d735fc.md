---
uid: report-d8d735fc
id: REPORT-1744
type: report
title: 'Capability-Intent Alignment: Structured Copy Editing: One Validated, Atomic
  Write Path (level=uat)'
created_by: xgd
created_at: '2026-08-10T07:33:24.052115+00:00'
updated_at: '2026-08-10T07:33:24.052115+00:00'
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

Scope: CAP-86 (`capability-f753cecd`) → STORY-100 (`story-37a3921b`,
`story_kind: upgrade`) → **17 active acceptance criteria** (AC-980…AC-992,
AC-1024…AC-1027) → **22 UAT functions** across two files:

- `tests/reconciliation-copy-edit-write-path.test.ts` (16 UATs)
- `tests/reconciliation-copy-edit-image-selection.test.ts` (6 UATs… 9 including
  the three that re-cover widened copy ACs)

Every one of the 17 ACs has at least one substantive UAT. **All 22 were executed
during this check and all 22 pass** (`vitest run`, 1.65s, 2 files / 22 tests
passed). No violations, no ambiguity requiring escalation.

## Cumulative Intent Considered

At `uat` level the AC bodies are the working reference; the ledger below is
carried forward from the `story` and `ac` cycles and **re-verified fresh** — all
six intent statuses were re-read at this check and none has moved.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-44 (`request-3b78151f`) | free_and_reconciled | 2026-07-03 | `1c` CLI dependency preflight. Not a CAP-86 behaviour. | YES (out of this capability) |
| REQ-115 (`request-a6740b4a`) | free_and_reconciled | 2026-07-31 | Builder shell / origin (CAP-85). Reaches CAP-86 only as the thin transport fronting this surface. | YES (out of this capability) |
| REQ-117 (`request-395b67e6`) | free_and_reconciled | 2026-07-31, merged `1741ee5d` | **Founding ask.** Edit-address contract; `copyFieldsOf`/`applyCopyFields`; `1c copy get\|set`; one change map = one diff; shared whole-definition validator; refusal carrying code/path/hint + envelope + exit status; empty field list as a legitimate answer; no raw HTML/CSS; long copy legible in full. → AC-980…AC-992. | YES |
| REQ-118 (`request-66e4c630`) | free_and_reconciled | 2026-07-31, merged `b2b9208c` | Image selection as the **second half of the same surface** — no image command, no image route. Descriptor `type` widened `'string'` → `'string' \| 'enum'`; closed list always including the current handle; membership enforced server-side *before* the shared validator; a save re-renders **both** channels. → AC-1024…AC-1027, plus the widening of AC-981 / AC-986 / AC-988 / AC-991 / AC-992 from "a copy edit" to "any edit". | YES |
| BUNDLE-16 (`bundle-15c1f647`) | free_and_reconciled | 2026-08-07 | Carrier only (REQ-117 + REQ-115 + REQ-44). | — (carrier) |
| REQ-128 (`request-de67e1a1`) | **bundled** | 2026-08-08 | Container segment's `backgroundImageUrl` in the phase-1 picker. | imminent (NOT yet enforced — no AC, so no UAT expected) |
| REQ-126 (`request-d9407f80`) | **bundled** | 2026-08-08 | L1 control surface API: declared schemas, error taxonomy, addressing contract, version. | imminent (no UAT impact today) |
| REQ-129 (`request-b1300473`) | **bundled** | 2026-08-09 | Verbatim `get_l1`/`set_l1`; click-to-edit modal explicitly unchanged. | imminent (no UAT impact today) |

No reconciled intent retires behaviour a UAT still asserts. REQ-118 is purely
additive plus one clarification (an image region is *not* a "nothing to edit"
region), and the AC-981 UATs carry that clarification explicitly as a contrast
assertion.

## Evidence Validity

All 22 UATs are substantive by the evidence rules — none is a structural/AST or
naming check:

- **Real entry points only.** Every test drives the real `1c` command line
  through `run(argv)` (argv in, `{ok,data}`/`{ok,error}` envelope and a process
  exit code out) and/or the real builder origin over HTTP through
  `startBuilder` + `fetch`.
- **No internal mocking.** The only fixtures are a throwaway `mkdtempSync` store
  per test and a seeded page/site written to disk. No component of the surface
  under test is stubbed.
- **Real observables.** Every claim about what an edit did or did not change is
  read as bytes off disk — the draft page document, both rendered channels, and
  (for AC-1027) a contents+size+mtime fingerprint of every asset file.
- **The "same surface" claims are asserted on the wire**, not by shared import:
  AC-992 and AC-1024 compare the origin's JSON response against the command
  line's envelope for the same region.

## Alignment Ledger

| Element (AC → UAT) | Intents aligned to | Outcome |
|---|---|---|
| AC-980 → `test_UAT_AC980_a_copy_region_exposes_one_plain_string_field_holding_the_draft_words` | REQ-117 | aligned — asserts the single `{name,label,type:'string'}` descriptor, the value character-equal to the draft (read independently out of `home.json`), and the multi-line control requested for long/newline runs and **not** for the short one |
| AC-981 → `…AC981_a_region_with_nothing_editable_succeeds_with_an_empty_field_list` (write-path) | REQ-117, REQ-118 | aligned — success + exit 0 + `fields: []` + human "no editable copy", with both contrasts (copy → 1 field, image → 2 fields incl. the enum) |
| AC-981 → `…AC981_a_region_that_exposes_nothing_answers_with_an_empty_field_list` (image-selection) | REQ-117, REQ-118 | aligned, but a strict subset of the above — see W1 |
| AC-982 → `…AC982_saving_new_words_updates_the_draft_and_re_renders_the_page` | REQ-117 | aligned — draft holds the new words, the rendered page contains them and no longer the old, `changed`/`rendered` both reported, and the identical re-submit reports `changed: []` + human "No change" |
| AC-983 → `…AC983_a_change_map_is_applied_whole_or_not_at_all` | REQ-117 | aligned — publishes a base so `status` can count; a mixed map leaves zero modified/added/removed and the old value in place; a well-formed map moves exactly `pages/home.json` |
| AC-984 → `…AC984_a_rejected_edit_leaves_the_draft_and_the_render_byte_identical` | REQ-117 | aligned — all four refusal classes (unaddressable, malformed, non-text value, unknown field) plus the whole-definition-invalid case, each asserted byte-for-byte against a pre-render snapshot |
| AC-985 → `…AC985_a_refusal_carries_a_code_a_path_and_a_hint_with_a_failing_exit_status` | REQ-117 | aligned — `SCHEMA_INVALID`, a path naming region **and** field, a hint naming the next action (`copy get`), exit 2; plus the success side (exit 0, success envelope, no error) |
| AC-986 → `…AC986_any_edit_is_validated_over_the_whole_resulting_definition` (image-selection) | REQ-117, REQ-118 | aligned, and the only UAT that covers the AC **in full** — plants a `fontSizePx: 9999` violation at `[0.0.1]`, then asserts a copy edit, an image edit and `config set` all fail with **identical code, message and path** |
| AC-986 → `…AC986_a_copy_edit_is_validated_over_the_whole_resulting_definition` (write-path) | REQ-117 | aligned, but omits the image-edit arm the AC requires; strict subset of the above — see W2 |
| AC-987 → `…AC987_a_malformed_address_is_refused_outright_and_never_coerced` | REQ-117 | aligned — nine malformed forms refused on both read and write with `data` undefined (proving no coercion to a neighbouring region), the empty address refused, and three well-formed-but-absent addresses refused `NOT_FOUND` with the re-read hint |
| AC-988 → `…AC988_an_unknown_field_a_non_text_value_or_a_choice_never_offered_is_refused` (image-selection) | REQ-117, REQ-118 | aligned — all three refusal kinds, incl. the closed-list one (`/assets/nowhere.png` — safe and well-formed, so the shared validator structurally cannot catch it), plus a wrong-kind asset and `javascript:` refused at the field |
| AC-988 → `…AC988_an_unknown_field_or_a_non_text_value_is_refused_not_ignored` (write-path) | REQ-117 | aligned — overlaps the above on kinds (1) and (2) but adds the `true`/`null` scalars; **not** a duplicate (see I1) |
| AC-989 → `…AC989_copy_in_a_module_slot_reads_and_writes_through_the_same_operation` | REQ-117 | aligned — both slot shapes (carousel repeated `slide`, contact-form single `form`), read + write + rendered output, and the instance-rooted-without-slot refusal |
| AC-990 → `…AC990_copy_longer_than_its_box_reads_back_in_full` | REQ-117 | aligned — the entire string returned (value **and** length asserted), with the textarea control requested |
| AC-991 → `…AC991_markup_saved_as_text_stays_literal_and_every_field_is_plain_text_or_a_closed_list` (write-path) | REQ-117, REQ-118 | aligned — script/style/`<b>` payload saved into copy **and** into an image's `alt` (a different escape path, earning its own evidence), asserted inert in the rendered DOM; then sweeps every stamped page-rooted region plus **both** module slots, asserting every field is `string` or `enum` and every `enum` carries a non-empty all-string option list |
| AC-991 → `…AC991_every_control_is_plain_text_or_a_pick_from_a_list_the_surface_supplied` (image-selection) | REQ-117, REQ-118 | aligned, but the same scenario in the same shape with a narrower sweep — see W3 |
| AC-992 → `…AC992_the_origin_is_the_same_surface_for_words_and_for_images_alike` (image-selection) | REQ-117, REQ-118 | aligned, and the only UAT covering the AC **in full** — origin read matches the CLI for copy *and* image (incl. the option list riding the read), 4xx client faults of both kinds carrying identical code/path/hint/message, and both `edit` and `draft` channels current after a save of each kind |
| AC-992 → `…AC992_the_origin_is_the_same_surface_faulting_and_re_rendering_alike` (write-path) | REQ-117 | aligned, but copy-only; strict subset of the above — see W4 |
| AC-1024 → `…AC1024_an_image_region_exposes_a_closed_list_of_the_sites_images_and_its_alt_text` | REQ-118 | aligned — exactly two fields; `src` is `enum` + `required` whose options are the site's image handles only (font `.woff2` and `.css` excluded), deduplicated across the registry/directory double-naming of `beta`, sorted and stable across reads; `alt` plain-text under the same multi-line rule; current values equal the draft; and the origin returns the identical answer |
| AC-1025 → `…AC1025_a_regions_current_image_is_always_among_the_choices_it_offers` | REQ-118 | aligned — a remote handle no file mirrors (asserted absent from the assets dir) still appears among the options and is the reported current value, and an alt-only save leaves `src` exactly where it was |
| AC-1026 → `…AC1026_choosing_an_image_updates_the_draft_and_the_rerendered_page_shows_it` | REQ-118 | aligned — new handle in draft and render, old absent, `changed`/`rendered` reported; identical re-submit → `changed: []` + "No change"; `src`+`alt` in one call → both reported changed and exactly one modified document; through the origin, both channels current |
| AC-1027 → `…AC1027_choosing_an_image_bakes_nothing_and_leaves_every_other_parameter_intact` | REQ-118 | aligned — full asset-store fingerprint (contents, size, mtime) unchanged, no file added/removed, only `pages/home.json` modified, and the node deep-equal to its former self apart from `src`, with `id` and `axes.objectFit` explicitly asserted as the protected home of future framing parameters |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| W1 | warning | exclusivity | AC-981 — `test_UAT_AC981_a_region_that_exposes_nothing_answers_with_an_empty_field_list` (`tests/reconciliation-copy-edit-image-selection.test.ts:330`) | uat-edit | Same scenario in the same shape as `test_UAT_AC981_a_region_with_nothing_editable_succeeds_with_an_empty_field_list` (`tests/reconciliation-copy-edit-write-path.test.ts:239`): both drive `copy get` over a container and a module instance, assert success + exit 0 + `fields: []` + the human "no editable copy" line, then contrast a copy region (1 field) and an image region (2 fields). The write-path version is a strict superset — it also asserts the image field **types** (`['enum','string']`), that the enum contains the current handle, and the exact `values`. Only the seed fixture differs, which is incidental to the AC. | Delete the image-selection copy of AC-981 (or reduce it to the one assertion it uniquely motivates — that an image region is not a "nothing to edit" region — and keep it out of the AC-981 name) |
| W2 | warning | exclusivity | AC-986 — `test_UAT_AC986_a_copy_edit_is_validated_over_the_whole_resulting_definition` (`tests/reconciliation-copy-edit-write-path.test.ts:401`) | uat-edit | Strict subset of `test_UAT_AC986_any_edit_is_validated_over_the_whole_resulting_definition` (`tests/reconciliation-copy-edit-image-selection.test.ts:500`). Both plant the same `fontSizePx: 9999` violation at `[0.0.1]` and compare a `copy set` refusal against `config set`; the image-selection version does that **and** the image-edit arm the AC body actually requires ("Attempt a copy edit, an image edit, and an unrelated structured-edit operation"). The write-path version alone would not satisfy AC-986. | Delete the write-path copy of AC-986; the image-selection version is the complete evidence |
| W3 | warning | exclusivity | AC-991 — `test_UAT_AC991_every_control_is_plain_text_or_a_pick_from_a_list_the_surface_supplied` (`tests/reconciliation-copy-edit-image-selection.test.ts:542`) | uat-edit | Same scenario in the same shape as `test_UAT_AC991_markup_saved_as_text_stays_literal_and_every_field_is_plain_text_or_a_closed_list` (`tests/reconciliation-copy-edit-write-path.test.ts:574`): identical script/style/`<b>` payload, saved into a copy region and an image `alt`, asserted inert in the rendered DOM, followed by the same "sweep every stamped region, every field is `string` or `enum`" pass. The write-path version sweeps **both** module slot shapes (carousel + contact form) where this one sweeps only the carousel, so it is the broader of the two. | Delete the image-selection copy of AC-991, or narrow it to the assertions the image fixture uniquely enables |
| W4 | warning | exclusivity | AC-992 — `test_UAT_AC992_the_origin_is_the_same_surface_faulting_and_re_rendering_alike` (`tests/reconciliation-copy-edit-write-path.test.ts:697`) | uat-edit | Strict subset of `test_UAT_AC992_the_origin_is_the_same_surface_for_words_and_for_images_alike` (`tests/reconciliation-copy-edit-image-selection.test.ts:619`). Both assert an origin read matching the CLI, a 4xx client fault carrying identical code/path/hint/message, and both rendered channels current after a save; the image-selection version does all of that for **both** a change of words and a change of image, which is what AC-992's "it is the same single endpoint for a change of words and a change of image" requires. | Delete the write-path copy of AC-992; the image-selection version is the complete evidence |
| I1 | info | exclusivity | AC-988 — both UATs | — | The two AC-988 UATs overlap on the unknown-field and non-text refusals but neither is a subset: the write-path one adds the `true`/`null` JSON scalars, the image-selection one adds the closed-list refusal (`/assets/nowhere.png`), a wrong-kind asset (`.woff2`) and a hostile scheme (`javascript:`). This is legitimate complementary coverage, **not** a duplicate. | none |
| I2 | info | coverage | REQ-128, REQ-126, REQ-129 | — | All three remain `bundled` (imminent, not enforced) as of this check — re-verified, not inherited. None has an AC under STORY-100, so no UAT is expected for them yet. REQ-128 in particular will narrow AC-981 (a painted container gains an editable `backgroundImageUrl`), which will invalidate the `A_CONTAINER` arm of **both** AC-981 UATs when it reconciles. | none now; flag for the REQ-128 reconcile |
| I3 | info | consistency | `.xgd/uat_index.json` | — | The index lists all 17 ACs and all 22 test names correctly but records `status: "missing"` for every one. This is a stale index, **not** a coverage gap: all 22 functions exist at the names the index carries and all 22 pass when executed. Reading the index alone would misreport this capability as unevidenced. | none (index refreshes on the next run) |

## Notes for the Editor

**Nothing here blocks the `uat` level.** All four warnings are one cross-cutting
pattern with a single cause, and none of them is a coverage or consistency gap.

**The pattern.** REQ-118 widened five copy-era ACs (981, 986, 988, 991, 992)
from "a copy edit" to "any edit through this surface". The reconcile added a
second test file rather than editing the first, so those five ACs now each carry
two UATs — and for four of them one member of the pair is strictly contained in
the other. Which member is the redundant one **alternates**, so neither file can
simply be deleted:

- the *write-path* file holds the superset for **AC-981** and **AC-991**;
- the *image-selection* file holds the superset for **AC-986** and **AC-992**.

The mechanical fix is four deletions, two from each file, leaving each of those
ACs with the single UAT that covers it in full. AC-988 must keep both (I1).

**Two of these matter slightly more than cosmetics.** The write-path UATs for
AC-986 and AC-992 are named as if they discharge their ACs but each omits the
image arm the AC body requires. They are harmless while their image-selection
counterparts exist, but they would read as sufficient evidence to anyone
scanning by test name — the exact failure mode this ledger exists to prevent.

**Outstanding at a higher level, not repairable here.** The `story`-level cycle
recorded one violation: CAP-86's own body and title (`Structured Copy Editing`,
"plain words and nothing else") are still the pre-REQ-118 text and never mention
images, while the ACs and UATs beneath them fully carry the image half. That is
a capability-body edit and is out of scope at `uat` level; it does not affect any
finding above.

**Execution evidence.** `npx vitest run tests/reconciliation-copy-edit-write-path.test.ts tests/reconciliation-copy-edit-image-selection.test.ts` — 2 files passed, 22 tests passed, 1.65s, zero skipped.
