---
uid: report-7d7dc356
id: REPORT-2082
type: report
title: 'Capability-Intent Alignment: Structured Copy Editing: One Validated, Atomic
  Write Path (level=uat)'
created_by: xgd
created_at: '2026-08-16T06:48:13.377859+00:00'
updated_at: '2026-08-16T06:48:13.377859+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-f753cecd
  level: uat
  violations: 0
  warnings: 8
  needs_review_count: 0
---

# Capability-Intent Alignment: Structured Copy Editing: One Validated, Atomic Write Path
# Level: uat

**Result**: PASS
**Violations**: 0
**Warnings**: 8
**Needs review**: 0

Scope: CAP-86 (`capability-f753cecd`) → STORY-100 (`story-37a3921b`,
`story_kind: upgrade`) → **33 active acceptance criteria** → **43 UAT functions**
across six files:

| File | UATs | ACs discharged |
|---|---|---|
| `tests/reconciliation-copy-edit-write-path.test.ts` | 13 | 980–992 |
| `tests/reconciliation-copy-edit-image-selection.test.ts` | 9 | 1024–1027 (+981, 986, 988, 991, 992) |
| `tests/reconciliation-copy-edit-background-selection.test.ts` | 5 | 1045–1049 |
| `tests/reconciliation-copy-edit-typography.test.ts` | 9 | 1117–1122 (+980, 988, 991) |
| `tests/reconciliation-copy-edit-image-framing.test.ts` | 6 | 1129–1132 (+1121, 1122) |
| `tests/reconciliation-copy-edit-field-format.test.ts` | 1 | 1111 |

**Every one of the 33 ACs has at least one substantive UAT.** Every UAT drives a
real entry point — `run(argv)` through the real `1c` CLI, a live builder origin
over HTTP through `startBuilder`, and the bytes of the draft document and the
rendered page read off disk or off the wire. Nothing internal is stubbed in any
of the six files; the only fixtures are a throwaway store per test and a seeded
page. No AC is discharged by a structural or AST-shaped check.

**Execution caveat — read this before treating the ledger as a pass certificate.**
Unlike the previous cycle (REPORT-1744, which executed all 22 UATs then in
scope), **the 43 UATs were not executed during this check**. Every available
invocation of the test runner was refused by the session's permission mode:
`npx vitest run …`, `pnpm vitest run …`, `./node_modules/.bin/vitest run …`,
`node node_modules/vitest/vitest.mjs run …` and `xgd quality run --help` were
each denied. `.xgd/quality_history/` is empty and `.xgd/uat_index.json` was reset
to `{"acs": {}}` at 2026-08-16T00:03Z, so there is no recorded run to fall back
on either. **Every finding below is therefore grounded in reading the test
bodies against the AC bodies and, where a rule was in question, against the
production code** (`packages/site-schema/src/l1/edit.ts`) — not in observed
green. A green suite is still required from the regression run itself; this level
does not certify it.

## Cumulative Intent Considered

At `uat` level the AC bodies are the working reference. The ledger below is the
one REPORT-2080 rebuilt this cycle, carried forward; **every status in it was
re-queried directly during this check** rather than inherited, and none has
moved.

| Intent ID | UID | Status | Asked / changed *on this surface* | Counts? |
|---|---|---|---|---|
| REQ-117 | `request-395b67e6` | free_and_reconciled (2026-07-31) | Created the surface: strict address + one resolution rule, `copyFieldsOf`/`applyCopyFields`, one-map-one-diff, shared whole-definition validator, empty field list, module-slot scoping, no-raw-code | YES |
| REQ-118 | `request-66e4c630` | free_and_reconciled (2026-07-31) | Image selection as the same surface: `src` + `alt`, closed list, current handle always an option, membership refused at the field, nothing baked | YES |
| REQ-119 | `request-64864801` | free_and_reconciled (2026-07-31) | Request-time draft/edit renders — moved the origin-facing observables from stored artifacts to the origin | YES |
| REQ-126 | `request-d9407f80` | free_and_reconciled | L1 control-surface API + error taxonomy — the refusal envelope this surface reuses | YES (silent) |
| REQ-128 | `request-de67e1a1` | free_and_reconciled (2026-08-08) | A painted panel's `backgroundImageUrl` through the same picker: selection only, no empty option, change-never-add | YES |
| REQ-132 | `request-5946d045` | free_and_reconciled (2026-08-12) | `format: 'image'` on both picker fields — a hint, never a constraint | YES |
| REQ-135 | `request-a8ccd0dd` | free_and_reconciled (2026-08-12) | Phase A typography: size as a proportional track write, weight from declared faces ∪ current, italic locked on positive evidence of absence, "a bound binds a change, never the status quo". Phase B (colour) deferred | YES |
| REQ-136 | `request-8a132869` | free_and_reconciled (2026-08-12) | Thirteen framing/shape/colour-adjustment controls, identity removes the axis, no empty bags, shape list ∪ current, nothing touches a file | YES |
| REQ-138 | `request-1ff09fab` | free_and_reconciled | Live parameter preview in the modal — client only; nothing about the write path changes | YES (silent) |
| REQ-133 | `request-8467b1a3` | ready_to_reconcile | Palette popup — the blocker STORY-100 names for colour | imminent |
| REQ-137 | `request-d2980a95` | bundled | L1 palette `shade` on the reference | imminent (silent) |
| REQ-139 | `request-3f57cd0c` | ready_to_reconcile (2026-08-12) | Generalises `locked` to `{locked, reason}`; restates the shipped rule "a lock refuses a CHANGE, never the status quo" | imminent |
| REQ-140 | `request-3c0fec69` | ready_to_reconcile (2026-08-15) | Colour on this surface: a `'color'` descriptor type, `L1Color` values, palette options, palette-membership refusal | imminent |
| REQ-134 | `request-ba3e3fba` | abandoned | An image-generation component | NO |

No UAT anywhere in the six files exercises a REQ-139 or REQ-140 behaviour ahead
of reconciliation: the descriptor union asserted by the tests is still
`string | enum | integer | boolean` (`CONTROL_SHAPES`), no test reads a `reason`
field, and no colour-of-text or panel-fill control is read or written.

## Alignment Ledger

| AC → UAT | Intents | Outcome |
|---|---|---|
| AC-980 → `…AC980_a_copy_region_exposes_one_plain_string_field…` (write-path:215) + `…AC980_the_words_come_first…` (typography:299) | REQ-117, REQ-135 | aligned — both assert the exact first descriptor, the value character-equal to the draft read independently out of `home.json`, and `widget:'textarea'` requested for a long/newline run and absent for a short one. Two largely overlapping UATs — see W5 |
| AC-981 → `…AC981_a_region_with_nothing_editable…` (write-path:250) + `…AC981_a_region_that_exposes_nothing…` (image-selection:367) | REQ-117, REQ-118, REQ-128 | aligned — success + exit 0 + `fields: []` + human "no editable copy" on a painted container and a module instance, with the copy/image contrasts. The write-path member remains the superset — see W1 |
| AC-982 → `…AC982_saving_new_words_updates_the_draft_and_re_renders_the_page` (write-path:302) | REQ-117 | aligned — draft holds the new words, the rendered page contains them and not the old, `changed`/`rendered` reported, identical re-submit → `changed: []` + human "No change" |
| AC-983 → `…AC983_a_change_map_is_applied_whole_or_not_at_all` (write-path:326) | REQ-117 | aligned — publishes a base so `status` can count; a mixed map leaves zero modified/added/removed and the old value in place; a well-formed map moves exactly `pages/home.json` |
| AC-984 → `…AC984_a_rejected_edit_leaves_the_draft_and_the_render_byte_identical` (write-path:353) | REQ-117 | aligned — all four refusal classes plus the whole-definition-invalid case, each byte-asserted against a pre-render snapshot |
| AC-985 → `…AC985_a_refusal_carries_a_code_a_path_and_a_hint…` (write-path:394) | REQ-117, REQ-126 | aligned — `SCHEMA_INVALID`, a path naming region **and** field, a hint naming the next action, exit 2, plus the success side |
| AC-986 → `…AC986_any_edit_is_validated…` (image-selection:584) + `…AC986_a_copy_edit_is_validated…` (write-path:417) | REQ-117, REQ-118 | aligned — the image-selection member covers the AC in full (copy + image + `config set`, identical code/message/path); the write-path member omits the image arm the AC requires — see W2 |
| AC-987 → `…AC987_a_malformed_address_is_refused_outright…` (write-path:448) | REQ-117 | aligned — nine malformed forms refused on read and write with `data` undefined (proving no coercion), the empty address refused, three well-formed-but-absent addresses `NOT_FOUND` with the re-read hint |
| AC-988 → three UATs (write-path:491, image-selection:527, typography:635) | REQ-117, REQ-118, REQ-135, REQ-136 | aligned, complementary rather than duplicated — write-path adds the `true`/`null` scalars, image-selection the closed-list/wrong-kind/hostile-scheme refusals, typography the per-field shape matrix and the read-only arm. **Gap: only the refusing half of the read-only rule is evidenced** — see W6 |
| AC-989 → `…AC989_copy_in_a_module_slot_reads_and_writes…` (write-path:523) | REQ-117 | aligned — both slot shapes (carousel repeated `slide`, contact-form single `form`), read + write + rendered output, and the instance-rooted-without-slot refusal |
| AC-990 → `…AC990_copy_longer_than_its_box_reads_back_in_full` (write-path:572) | REQ-117 | aligned — the entire string returned (value **and** length asserted) with the textarea control requested |
| AC-991 → three UATs (write-path:593, image-selection:626, typography:721) | REQ-117, REQ-118, REQ-135 | aligned — typography's member is now the only one asserting all four shapes *and* that every `integer` field carries `min`/`max`, as the AC requires; write-path's is the only one sweeping both module-slot shapes. The image-selection member adds nothing either does not — see W3 |
| AC-992 → `…AC992_the_origin_is_the_same_surface_for_words_and_for_images_alike` (image-selection:705) + `…AC992_…_faulting_and_re_rendering_alike` (write-path:718) | REQ-117, REQ-118, REQ-119 | aligned on substance; the image-selection member covers both region kinds, the write-path member is copy-only — see W4. Both observe "both views current" at the origin, not on disk as the AC's verification still says — see W7 |
| AC-1024 → `…AC1024_an_image_region_exposes_a_closed_list…` (image-selection:265) | REQ-118, REQ-136 | aligned — `['src','alt']` first and in order, `src` enum + required, options exactly the site's images (no `.woff2`, no `.css`), deduplicated, sorted, stable across reads; every following field a bounded integer or a non-empty closed pick, both shapes present |
| AC-1025 → `…AC1025_a_regions_current_image_is_always_among_the_choices…` (image-selection:344) | REQ-118 | aligned — a remote handle asserted absent from the assets directory still appears among the options and is the reported value; an alt-only save leaves `src` where it was |
| AC-1026 → `…AC1026_choosing_an_image_updates_the_draft…` (image-selection:403) | REQ-118, REQ-119 | aligned — new handle in draft and render, old absent; identical re-submit → `changed: []`; `src`+`alt` in one call → both changed, exactly one modified document; origin save leaves both channels current (at the origin, not on disk — W7) |
| AC-1027 → `…AC1027_choosing_an_image_bakes_nothing…` (image-selection:457) | REQ-118, REQ-136 | aligned — full asset fingerprint (contents, size, mtime) unchanged for both a handle change and a framing/shape/colour change; node deep-equal apart from the named fields; `axes`/`mask` asserted exactly |
| AC-1045 → `…AC1045_a_painted_panel_exposes_one_closed_picker…` (background:284) | REQ-128, REQ-132 | aligned — exactly one field; same option list as an image region's picker; no other paint axis offered though the panel demonstrably carries six; the picker absent from an image and a copy region that each carry a background of their own; origin parity |
| AC-1046 → `…AC1046_choosing_a_background_repaints_the_panel…` (background:457) | REQ-128 | aligned — one parameter changed, the draft carries it, the render paints it, every other axis byte-identical, no asset byte moved, and the shared-validator arm asserted by consequence against `config set` |
| AC-1047 → `…AC1047_a_panels_current_background_handle…` (background:421) | REQ-128 | aligned — a handle no file mirrors appears exactly once alongside the site's own, stable order; the in-store case appears once not twice; re-saving the selected value is a no-op, not a swap |
| AC-1048 → `…AC1048_a_background_handle_the_site_never_offered…` (background:528) | REQ-128 | aligned — four off-list values (absent handle, wrong-kind asset, empty string, `javascript:`) each refused with a field-scoped path, draft **and** rendered page byte-identical, and the identical refusal over the origin |
| AC-1049 → `…AC1049_a_painted_panel_with_no_background…` (background:365) | REQ-128 | aligned — both the no-background and empty-handle panels answer `fields: []`/`values: {}` with the human line; the picker carries no empty option and is `required`; a write that would *add* a background is refused, panel untouched |
| AC-1111 → `…AC1111_an_image_fields_options_are_declared_as_images…` (field-format:218) | REQ-132 | aligned — `format:'image'` on both picker fields and demonstrably absent (`Object.hasOwn` false) from the alt text beside one and from a run's words; option lists byte-identical to the undeclared case; membership still refused; origin parity |
| AC-1117 → `…AC1117_a_copy_region_reports_how_the_run_is_set…` (typography:328) | REQ-135 | aligned — the five fields in order, size `integer` with inclusive `min`/`max`, weight/capitalisation closed, italic boolean, representative (widest) size reported, no colour/family/geometry offered though the run carries them, the withheld-size and single-weight cases, and the module-slot case reading the page's own faces |
| AC-1118 → `…AC1118_resizing_a_run_scales_every_keyframe…` (typography:506) | REQ-135 | aligned — 72→96 scales all three keyframes ×4/3, widths unmoved, both cheaper alternatives explicitly refuted, and a flat run acquires no rule |
| AC-1119 → `…AC1119_the_weights_offered_are_the_declared_faces…` (typography:421) | REQ-135 | aligned — first-family match asserted against a four-name stack (the guaranteed-miss case), run's own undeclared weight (600) present and reported, a second family's own faces, an off-list weight refused naming the value, an offered one applied |
| AC-1120 → `…AC1120_italic_is_read_only_only_on_positive_evidence_of_absence` (typography:465) | REQ-135, REQ-139 (imminent) | aligned to the AC as written and to the shipped code — locked only where faces exist without an italic one, live for a no-faces family and for one declaring italic, offered rather than dropped, a *differing* posted value refused, and turning it off removes `fontStyle`. **Only the refusing half is evidenced** — see W6 |
| AC-1121 → `…AC1121_the_size_bound_binds_a_change…` (typography:546) + `…AC1121_a_pictures_bounds_bind_a_change…` (framing:453) | REQ-135, REQ-136 | aligned, and the pair is required rather than redundant: the AC's verification asks for both halves. Typography proves the 160px run re-saves and 200/4 are refused unclamped; framing proves the 9999px corner rounding re-saves and three control families refuse unclamped |
| AC-1122 → `…AC1122_a_typography_edit_writes_into_the_runs_parameters…` (typography:577) + `…AC1122_a_framing_edit_writes_among_the_parameters…` (framing:499) | REQ-135, REQ-136 | aligned, both halves as the AC asks — named parameter moves alone, identity removes rather than writes, the emptied group goes with it, whole-form no-op reports `changed: []` and leaves the draft byte-identical, including from the fractional folded-capture starting state |
| AC-1129 → `…AC1129_panning_writes_a_typed_percentage_pair…` (framing:400) | REQ-136 | aligned — centre reported for an undeclared position, both-or-neither write seeded from the reported value, render carries `object-position: 50% 15%`, centre removes the pair and the emptied `axes`, and the half-named case on an already-panned picture |
| AC-1130 → `…AC1130_colour_is_adjusted_in_percentages…` (framing:344) | REQ-136 | aligned — bounded integer percentages, three adjustments in one map → one modified document, stored as browser fractions, render carries the filter, untouched controls never written, per-control identity removes, last removal takes the group |
| AC-1131 → `…AC1131_the_shape_list_carries_the_shape_the_picture_already_holds` (framing:302) | REQ-136 | aligned — geometric set with the carried `featherBottom` appended, re-save with own shape reports only the alt text and preserves `featherPx`, a chosen shape writes the shape alone, `rectangle` removes the mask outright |
| AC-1132 → `…AC1132_a_picture_declaring_no_framing_answers_with_what_a_browser_paints` (framing:251) | REQ-136 | aligned — every framing/shape/colour field present with a browser-painted whole-number value, none blank or null, and the whole reported form saved back reports `changed: []` leaving `axes`/`mask`/`transform` undefined and the draft byte-identical |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| W1 | warning | exclusivity | AC-981 — `test_UAT_AC981_a_region_that_exposes_nothing_answers_with_an_empty_field_list` (`tests/reconciliation-copy-edit-image-selection.test.ts:367`) | uat-edit | Same scenario in the same shape as `test_UAT_AC981_a_region_with_nothing_editable_succeeds_with_an_empty_field_list` (`tests/reconciliation-copy-edit-write-path.test.ts:250`): both drive `copy get` over a container and a module instance, assert success + exit 0 + `fields: []` + the human "no editable copy" line, then contrast a copy region and an image region. The write-path member is still the superset — it additionally asserts the image field *types* (`['enum','string']`), that the enum contains the current handle, and the exact `values`. Only the seed fixture differs, which is incidental to the AC. **Carried unrepaired from REPORT-1744 W1** | Delete the image-selection copy, or reduce it to the one assertion its fixture uniquely motivates and take AC-981 out of its name |
| W2 | warning | exclusivity | AC-986 — `test_UAT_AC986_a_copy_edit_is_validated_over_the_whole_resulting_definition` (`tests/reconciliation-copy-edit-write-path.test.ts:417`) | uat-edit | Strict subset of `test_UAT_AC986_any_edit_is_validated_over_the_whole_resulting_definition` (`tests/reconciliation-copy-edit-image-selection.test.ts:584`). Both plant the same `fontSizePx: 9999` violation at `[0.0.1]` and compare a `copy set` refusal against `config set`; the image-selection member does that **and** the image-edit arm AC-986's verification explicitly requires ("Attempt a copy edit, an image edit, and an unrelated structured-edit operation"). Named as if it discharges AC-986 while omitting an arm the AC names. **Carried unrepaired from REPORT-1744 W2** | Delete the write-path copy; the image-selection member is the complete evidence |
| W3 | warning | exclusivity | AC-991 — `test_UAT_AC991_every_control_is_plain_text_or_a_pick_from_a_list_the_surface_supplied` (`tests/reconciliation-copy-edit-image-selection.test.ts:626`) | uat-edit | AC-991 now carries **three** UATs of the same shape, all saving the identical `<script>/<style>/<b>` payload into a copy region and an image `alt`, asserting it inert in the rendered DOM, then sweeping every stamped region. Two of the three earn their place: write-path (`:593`) is the only one sweeping **both** module-slot shapes, and typography (`:721`) is the only one asserting all four control shapes were seen and that every `integer` field carries `min`/`max` — the clause AC-991's verification names and the other two omit. The image-selection member adds nothing either does not. **Carried unrepaired from REPORT-1744 W3, and the set has grown from two members to three** | Delete the image-selection copy. Do not delete either of the other two: neither is a superset of the other |
| W4 | warning | exclusivity | AC-992 — `test_UAT_AC992_the_origin_is_the_same_surface_faulting_and_re_rendering_alike` (`tests/reconciliation-copy-edit-write-path.test.ts:718`) | uat-edit | Strict subset of `test_UAT_AC992_the_origin_is_the_same_surface_for_words_and_for_images_alike` (`tests/reconciliation-copy-edit-image-selection.test.ts:705`). Both assert an origin read matching the CLI, a 4xx client fault carrying identical code/path/hint/message, and both channels current after a save; the image-selection member does all of it for a change of words **and** a change of image, which is what AC-992's "the same single endpoint for a change of words and a change of image" requires. Same "reads as sufficient evidence when scanned by name" hazard as W2. **Carried unrepaired from REPORT-1744 W4** | Delete the write-path copy; the image-selection member is the complete evidence |
| W5 | warning | exclusivity | AC-980 — `test_UAT_AC980_a_copy_region_exposes_one_plain_string_field_holding_the_draft_words` (`tests/reconciliation-copy-edit-write-path.test.ts:215`) + `test_UAT_AC980_the_words_come_first_now_that_a_run_also_reports_how_it_is_set` (`tests/reconciliation-copy-edit-typography.test.ts:299`) | uat-edit | New instance of the W1–W4 pattern, created by REQ-135's reconcile adding a file rather than editing one. Both assert `fields[0]` equals `{name:'text',label:'Text',type:'string'}`, that the value is character-equal to the draft read independently off disk, and that `widget:'textarea'` appears for a long run and not for a short one. Neither is a strict subset: write-path uniquely covers the newline-broken run, typography uniquely covers first-ness across six differently-parameterised runs and `fields.length > 1` — which is the half REQ-135 actually made load-bearing | Merge into one: keep typography's member (it holds the post-REQ-135 claim), fold in write-path's newline case, and drop the write-path copy |
| W6 | warning | coverage | AC-988 (`acceptance_criterion-97f5dee6`) + AC-1120 (`acceptance_criterion-3235871e`) → typography:635, typography:465 | uat-add | The shipped read-only rule is **refuse on change, never on presence** (`packages/site-schema/src/l1/edit.ts:1159`, `field.locked && value !== derived.values[name]`, reasoned at `:1134-1142`). Both UATs evidence only the refusing half: each posts `{italic: true}` on `A_HEADLINE`, whose derived value is `false`, so the value genuinely differs. **No UAT anywhere posts a locked field's own reported value and asserts it passes.** The one whole-form no-op save that would have caught it (`…AC1122…` typography:626) is deliberately run on `A_FULL` — "nothing on this run is read-only, so nothing is held back". Consequence: a regression to presence-based refusal — the exact failure `:1138-1140` records ("on a run whose family declares faces but no italic one, nothing could be saved at all") — would leave all 43 UATs green. Not a violation today, because AC-988 and AC-1120 as currently written state the rule on presence; that wording is REPORT-2081's findings 1 and 2, pending repair | In the same pass that repairs AC-988/AC-1120: add to the typography AC-1120 UAT a whole-form save of `A_HEADLINE` echoing the reported `italic: false`, asserting it succeeds and reports only the intended field as changed. One save, three assertions |
| W7 | warning | consistency | AC-992 (`acceptance_criterion-9561711e`) + AC-1026 | ac-edit | Both ACs' verification sections still say the origin-facing claim is observed **on disk** — AC-992: "assert both the editable and plain rendered outputs on disk reflect it"; AC-1026: "Repeat the save through the builder origin and assert both rendered channels on disk reflect it". AC-992's criterion also says a save "re-renders both … **before reporting success**". Since REQ-119 (`request-64864801`, free_and_reconciled) the draft-side channels are rendered **on request**, so there is no artifact to inspect and no pre-render on save. Both UATs therefore fetch `/preview/acme/{edit,draft}/` from the running origin instead (write-path:758, image-selection:771, with the reasoning recorded at image-selection:216-224 and write-path:748-752). The substance the ACs claim — both views current after one save — is fully proven; the observation point named in the AC text is stale, so a reader checking the UAT against the AC finds a mismatch that is not the UAT's fault | Restate both verification clauses (and AC-992's "before reporting success") in terms of the origin serving each channel from the definition at request time. The UATs need no change |
| W8 | warning | exclusivity | AC-1024, AC-1045, AC-1046, AC-1048, AC-1111 UATs vs the AC-992 UAT | uat-edit | The AC-layer origin-parity duplication REPORT-2081 raises as its finding 4 has propagated into the tests, as it must: five UATs now re-assert origin parity that AC-992's UAT owns — image-selection:335-341 (AC-1024), background:355-362 (AC-1045), image-selection:441-454 (AC-1046), background:563-593 (AC-1048), field-format:284-295 (AC-1111). Each is correct against its AC as written, so this is strictly downstream of the AC-level finding and must not be repaired before it | When REPORT-2081 finding 4 drops the origin clauses from those five ACs, drop the corresponding assertion blocks from their UATs in the same commit. Leave the AC-992 UAT sole owner |
| I1 | info | exclusivity | AC-988 — three UATs | — | Still complementary, not duplicated, and now three-way: write-path adds the `true`/`null` JSON scalars, image-selection the closed-list refusal plus a wrong-kind asset and a hostile scheme, typography the full per-field shape matrix (fractional-for-integer, string-for-integer, non-boolean-for-boolean, non-string-for-enum) and the read-only arm. AC-988's verification asks for all of it. Confirms REPORT-1744 I1 and extends it | none |
| I2 | info | exclusivity | AC-1121, AC-1122 — two UATs each | — | Deliberate and required, not duplication: both ACs' verification sections explicitly ask for the run half **and** the picture half ("Repeat both halves on an image"), and REQ-136 is what made "every bounded control" and "every parameter edit" mean more than typography. The framing file's own comment at `:446-451` records exactly this. Recorded so a later cycle reading two UATs under one AC does not mistake them for W1–W5 | none |
| I3 | info | coverage | `.xgd/uat_index.json` | — | The index is `{"updated_at": "2026-08-16T00:03:30Z", "acs": {}}` — empty. REPORT-1744 I3 recorded it as stale-but-populated (every entry `status: "missing"`); it has since been reset. It carries no claim about this capability either way, so it neither evidences nor contradicts coverage. The mapping in this report was built from the `test_UAT_AC<n>_` naming convention by grepping the whole `tests/` tree, which found the 43 functions in six files and no member of this AC set covered anywhere else | none |

## Notes for the Editor

**Nothing here blocks the `uat` level.** All 33 ACs have substantive,
real-entry-point evidence, no UAT tests something other than its AC, and no UAT
reaches ahead of REQ-139/REQ-140. Eight warnings, zero violations, zero
escalations.

**Read the execution caveat above before acting on this as a green light.** The
43 UATs were *inspected*, not *run* — every test-runner invocation available to
this session was denied by its permission mode, and there is no recorded run in
`.xgd/quality_history/` or `.xgd/uat_index.json` to substitute. If this level's
downstream consumer needs "all UATs pass" rather than "all ACs are properly
evidenced", that evidence has to come from the regression run's own quality gate,
not from here. This is the one substantive difference between this report and
REPORT-1744, which executed all 22 UATs then in scope.

**W1–W4 are the same four warnings REPORT-1744 raised, unrepaired, and the
pattern is still spreading.** Its cause is mechanical and now well documented:
each reconcile that widens an AC (REQ-118, then REQ-135, then REQ-136) adds a new
test file rather than editing the existing one, so the widened AC ends up with
two or three UATs of the same shape. Since the last cycle it has produced W5
(AC-980) and a third member for AC-991 (W3). The repair is five deletions/merges
and it gets more expensive each cycle, not less — the same trajectory REPORT-2081
flags for its finding 4 at the AC layer, and W8 is that finding reaching the
tests.

**W6 is the one finding here with teeth.** It is not tidiness: it is a rule that
is implemented, commented, and named by an imminent intent (REQ-139), whose
positive half no test pins. It should be repaired in the same pass as
REPORT-2081's findings 1 and 2 — those repair the AC prose, this repairs the
evidence, and doing one without the other leaves the AC and its UAT stating
different rules again. Three lines in an existing test.

**Sequencing.** W7 is an AC-text repair with no test change. W8 must wait for
REPORT-2081 finding 4. W6 must land with REPORT-2081 findings 1–2. W1–W5 are
independent of all of it and can be done at any time.

**Checked and confirmed aligned, not findings.** The four "current value is always
among its own options" UATs (AC-1025 image handle, AC-1047 panel background,
AC-1119 weight, AC-1131 shape) each assert the same correctness rule on a
different field with a different fixture and a different consequence-of-omission
— specialisation, not duplication. The three no-op/byte-identical claims
(AC-1122 typography, AC-1122 framing, AC-1132) each take their baseline *after* a
real save rather than from the seed, and each records why in a comment: the
shared write helper re-escapes the whole document, a known cosmetic defect
recorded on the story. That is honest fixture handling, not a weakened assertion.
The AC-1122 framing UAT's folded-capture arm (`A_FOLDED`, framing:556-592) is the
strongest single piece of evidence in the capability — the only test that starts
from the fractional values a real capture produces rather than from values an
integer control can hold exactly, and what stops a plain echo from reading as a
change.
