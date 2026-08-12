---
uid: report-725c552f
id: REPORT-1844
type: report
title: 'Reconciliation Review: commits — REQ-132 image picker thumbnails'
created_by: xgd
created_at: '2026-08-12T16:59:49.263591+00:00'
updated_at: '2026-08-12T16:59:49.263591+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: reconciliation_review
  subject_uid: request-5946d045
  anchor_uid: request-5946d045
---

# Reconciliation Review: Story Coverage

**Result**: PASS
**Mode**: commits
**Anchor**: request-5946d045 (REQ-132)
**Commit reconciled**: 43ce1f128 (working 7ca82800)
**Stories Reviewed**: 2 — story-37a3921b (STORY-100), story-3bf94bd4 (STORY-101)

## Behavior Inventory

Four features read independently from the diff (`packages/site-schema/src/l1/edit.ts`,
`apps/control-app/src/builder/{image-picker,editor,api}.js`, `builder.css`), 22 behaviour
statements. Confirmed against source, not inferred from the plan.

## Coverage Map

| # | Behavior | Coverage | Story | Notes |
|---|----------|----------|-------|-------|
| 1 | `L1FieldDescriptor.format?: 'image'`, set by `copyFieldsOf` on `image.src` and `backgroundImageUrl` | Covered | story-37a3921b | AC-1111; hint-not-constraint half asserted in both directions |
| 2 | Membership still enforced against `enum` alone; hint narrows nothing | Covered | story-37a3921b | AC-1111; off-list handle still refused at the field |
| 3 | Grid of tiles replaces the `<select>`; one tile per option, non-images absent | Covered | story-3bf94bd4 | AC-1112; exact in both directions vs the derivation's own answer |
| 4 | Label is the basename, query/fragment stripped; separator handle falls back to itself | Covered | story-3bf94bd4 | AC-1113 |
| 5 | Full handle is the committed value and the tooltip only; duplicates tolerated | Covered | story-3bf94bd4 | AC-1113; value/label split asserted as such |
| 6 | `assetUrl` resolves site-local handles through `/preview/<slug>/draft/`; complete URL verbatim; empty → `''` | Covered | story-3bf94bd4 | AC-1114; bytes fetched and compared, no `/api/assets` call |
| 7 | `img` error swaps to `is-missing`, tile stays named, selected and selectable | Covered | story-3bf94bd4 | AC-1115; save-holding-that-handle asserted |
| 8 | `role=radiogroup` + per-instance radio group name; empty `alt` on thumbnails | Covered | story-3bf94bd4 | AC-1116 |
| 9 | Grid takes focus after append, on the checked tile | Covered | story-3bf94bd4 | AC-1116 asserts `document.activeElement`; AC-1044 states the rule |
| 10 | Schema split by descriptor, never by region kind | Covered | story-3bf94bd4 | Technical Context "kind-agnosticism proved"; AC-1028 |
| 11 | `mountFields` handed only its own fields **and only their values** | Covered | story-3bf94bd4 | AC-997 names the failure explicitly; Technical Context records the defect |
| 12 | Staged maps merged with pickers spread last; one POST for both halves | Covered | story-3bf94bd4 | AC-997 |
| 13 | `isDirty` is the OR of both controls; untouched dialog writes nothing | Covered | story-3bf94bd4 | AC-1000, both the all-grid and grid+form cases |
| 14 | No `builder-modal__box` built when there are no form fields | Covered | story-3bf94bd4 | AC-1050, AC-1043 |
| 15 | `openLoneControl` suppressed when a picker is present | Covered | story-3bf94bd4 | AC-1044, qualified explicitly rather than extended |
| 16 | Panel narrowing keyed on absence of *either* editing surface | Covered | story-3bf94bd4 | AC-1043 |
| 17 | Grid bounded (`max-height: min(52vh,460px)`) and scrolls internally | Partial | story-3bf94bd4 | AC-1043; proven by stylesheet text — see Judgment Calls |

No uncovered behaviours. No ungrounded story claims: every statement in both story
bodies was checked against the diff and holds.

## Intent Fidelity

All seven numbered "As implemented" items in the REQ-132 body are represented, as are
both judgment calls the operator recorded in chat rather than the body (the unloadable
tile staying selectable; duplicate basenames tolerated with the handle on the tooltip).
The chat's Decision 1 (picker leaves `mountFields`, upstream is its honest long-term
home) and Decision 2 (stored value untouched) are both carried into STORY-101's
Technical Context.

**Divergences flagged rather than absorbed** — this is the part that most often fails
and does not here:

- **AC-1044 is qualified, not extended.** Its prior rule ("a form with exactly one
  field opens in its control") now deliberately does *not* fire for an image region,
  whose form is a lone `alt`. The ticket body does not spell this out; the source
  comment does, the plan's Step 3b named it as the sharpest of the three supersessions,
  and the AC text states the qualification and its reason outright.
- **Two stale story claims were removed rather than left to rot.** STORY-100 and
  STORY-101 both carried a "known limitation" asserting the picker shows the handle
  rather than a name or thumbnail — the one statement the commit directly contradicts.
  Both were deleted and replaced by an entry recording where the limitation went, split
  correctly across the two capabilities.
- **The `mountFields` values-filtering defect is recorded, not hidden.** It was created
  and closed inside the same commit; STORY-101 carries it as "The two controls are
  composed, not chained" and AC-997 names the exact failure ("must not report the
  region's opened image back as a fresh choice").
- **AC-1043/1044/1050 supersession** is explicit in both the plan (Case 2) and the
  story-generation report, and all three ACs were genuinely rewritten (`updated_at`
  2026-08-12T16:22Z), not left describing the `<select>`.

## Plan Item Accounting

| Plan Item | Expected Story | Status |
|-----------|---------------|--------|
| 1. Structured Copy Editing — field derivation (upgrade) | story-37a3921b | ✓ story modified; AC-1111 added |
| 2. In-Page Copy Editing — the image picker control (upgrade) | story-3bf94bd4 | ✓ story modified; AC-1112–AC-1116 added; AC-1028/997/1000/1043/1044/1050 modified |

Both items produced output. The plan declared 5 additions and 6 modifications for item 2
and 1 addition for item 1; all 12 AC mutations are present and none was silently dropped.

## Evidence Sufficiency (Step 5b)

**Executed rather than taken on trust.** The scoped quality reports attached to this run
(report-41cb242c, report-aeaaf649, report-cc06f1a4) each record `"suites": {}` — zero
tests — while reporting `pass`, so they are not usable evidence. I ran the suites myself:

```
9 suites for story-3bf94bd4 + story-37a3921b — 72 passed (72), 0 skipped
```

Every AC touched by this reconcile has a covering UAT, and each executes rather than
skipping (`WEBUI_INSTALLED` is true on this machine, so the story's documented skip
caveat is not in play here):

| AC | UAT | Real entry point? |
|----|-----|-------------------|
| AC-1111 | `..._an_image_fields_options_are_declared_as_images_without_narrowing_them` | `run(argv)` CLI + `startBuilder` over HTTP; origin `fields` asserted `toEqual` CLI's |
| AC-1112 | `..._the_closed_list_is_a_grid_of_thumbnails_and_the_dropdown_is_gone` | real `1c render --edit` bytes, real `defaultModal`, real `mountFields` |
| AC-1113 | `..._a_tile_is_labelled_with_the_file_name_and_commits_the_full_handle` | as above; asserts written draft via `copy get` |
| AC-1114 | `..._a_tile_shows_the_bytes_the_origin_serves_over_the_pages_own_channel` | fetches the tile URL from the real origin, compares bytes; asserts no off-allowlist route |
| AC-1115 | `..._a_handle_the_origin_cannot_serve_keeps_a_named_selectable_tile` | dispatches the real `error` event; saves and reads the handle back |
| AC-1116 | `..._the_grid_is_one_keyboard_reachable_single_selection_group` | asserts `document.activeElement` on the real mounted dialog |
| AC-1028 | `..._the_handle_the_region_holds_is_the_tile_already_selected` | pre-selection asserted incl. the off-site handle a "first option wins" picker would rewrite |
| AC-997 | `..._a_picked_image_and_new_alt_text_travel_in_one_change` | asserts exactly one POST and that `axes`/`id` are byte-unchanged |
| AC-1000 | `..._a_dialog_closed_with_neither_control_touched_writes_nothing` | asserts zero POSTs and draft node deep-equal, both all-grid and grid+form |
| AC-1050 | `..._a_painted_panel_opens_its_background_picker_over_the_same_transport` | real validator refusal driven by breaking the page under the open form |
| AC-1044 | `..._a_lone_field_opens_in_its_control_and_two_fields_open_none` | real dialog; counts moved from `.fields-row` to the dialog |
| AC-1043 | `..._the_thumbnail_grid_is_bounded_and_scrolls_within_its_own_bounds` | mixed — see Judgment Calls |

No UAT mocks repository-owned code; the suites state and honour "an injected modal
double would be a test of the double". No UAT is vacuous — the UAT-generation report
records that AC-1111's was mutation-checked by removing `format: 'image'` and confirming
the failure, then restoring the file.

## Judgment Calls

- **AC-1043's grid bound is proven by stylesheet text, not observed layout** — the UAT
  regex-matches `max-height: min(52vh, 460px)` and `overflow-y: auto` out of
  `builder.css`. Flagged rather than passed over in silence, but **not** treated as a
  Step 5b source-inspection failure, for three reasons: the rule's stated rationale is
  about dispatch identity ("a renamed or aliased function passes"), and there is no such
  indirection here — for a layout bound the stylesheet declaration *is* the behaviour;
  jsdom performs no layout, so no runtime observable exists in this harness, and the
  suite names that limitation openly rather than hiding it; and the methodology is
  pre-existing for AC-1043 across the whole form-presentation suite, extended
  consistently by this run rather than introduced by it. The same UAT does carry real
  behavioural assertions against the live dialog (picker present, box absent, Save
  present on a background-only region).
- **AC-1044's own UAT proves the first half of its verification, not the second.** It
  asserts the alt-text control is not opened, but not "the keyboard is in the grid
  instead". That claim is proven by AC-1116's UAT over the same scenario, so the
  behaviour is evidenced; only the 1:1 AC↔test locality is imperfect. Immaterial.
- **Thumbnail *appearance* at real widths is genuinely unproven** and correctly so — the
  operator was told as much in chat. jsdom fetches no images and lays nothing out. The
  suites assert the one thing that could actually be wrong (the shape of the URL) by
  fetching it from the real origin.
- **Story-100 correctly asserts no criterion about labels or thumbnails.** Splitting the
  hint (write path) from the control that draws it (gesture) is the right capability
  boundary, and STORY-100 says so explicitly rather than reaching across it.

## Findings for the operator (non-blocking; outside this review's verdict)

1. **Stale `uat_coverage: fail` flags.** story-3bf94bd4 carries `uat_coverage: fail`, as
   do AC-994, AC-1000, AC-1001, AC-1002 and AC-1003 — every one of them in the
   WEBUI-gated `reconciliation-copy-edit-gesture-modal` suite. All five pass here. The
   flags were written 2026-08-10, two days before this reconcile, on a run where the
   out-of-band webui install was absent and the suite skipped. They are stale metadata,
   not a live evidence failure, but STORY-101 will keep reading `fail` until something
   restamps them.
2. **The scoped quality gates ran zero tests.** report-41cb242c, report-aeaaf649 and
   report-cc06f1a4 all report `pass` with `"suites": {}`, `0 tests, 0 failed`. A gate
   that executes nothing and returns `pass` is indistinguishable from a gate that works.
   This is an XGD tooling issue, not a defect in this reconcile's output.
3. **The 11 ACs added or modified by this run carry no `uat_coverage` stamp at all**
   (`None`), so nothing has recorded that their new UATs pass.

## Verdict

**PASS.** Stories accurately and completely document the behaviour surface, and — the
harder test — they document what the operator *intended*, including the two calls made
in chat rather than in the ticket body. The three superseded criteria are recorded as
supersessions with their reasons, the one intent/code subtlety the body omits (AC-1044's
qualification) is stated outright in the AC rather than absorbed, and two story claims
the commit falsified were deleted rather than left standing. Both plan items produced
output. Every active AC in scope has a covering UAT that enters through a real user
interface, mocks no repository-owned code, and would fail if the criterion were violated;
all 72 execute and pass. A developer reading these stories would have a correct mental
model of what this code does and why the control changed.
