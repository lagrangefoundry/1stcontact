---
uid: report-865b2ed5
id: REPORT-1948
type: report
title: 'Reconciliation Plan: REQ-138 — copy modal parameter changes preview live in
  the editing box'
created_by: xgd
created_at: '2026-08-13T01:05:58.103393+00:00'
updated_at: '2026-08-13T01:06:13.458458+00:00'
completed_at: null
last_field_updated: kind
fields:
  report_kind: reconciliation_plan
  subject_uid: request-1ff09fab
  anchor_uid: request-1ff09fab
  items:
  - index: 1
    component: Copy edit modal — the editing box follows the parameter sheet
    item_type: upgrade
    story_points: 2
    dependencies: []
    target_story_ids:
    - story-3bf94bd4
    description: 'Extends STORY-101 (the click-to-edit gesture) to document that the
      dressed editing box now restyles live as the operator changes a typography parameter
      in the sheet beneath it. Three behaviours, all inside the existing dialog: (a)
      each confirmed parameter change writes the corresponding `--preview-*` custom
      property on the box — `fontSizePx` → `--preview-font-size`, `fontWeight` → `--preview-font-weight`,
      `italic` → `--preview-font-style` (italic/normal), `textTransform` → `--preview-text-transform`
      (none clears) — so an ''off'' value clears the property rather than leaving
      the previous one standing, and buffered commit is untouched so Save remains
      the only write; (b) size is SCALED by the ratio the dialog dressed the run at
      (previewed px ÷ authored px at open, floor 14px, no ceiling) rather than re-clamped,
      so a headline already sitting on the 32px preview ceiling still visibly responds;
      (c) only a parameter the operator actually changed overrides the box — the opening
      dressing (REQ-121, AC-1040/AC-1042) is written once from the render and untouched
      axes keep their opening values.'
    justification: 'This extends an existing capability bucket — the dressed editing
      box and its parameter sheet already exist in STORY-101 (AC-1040 dressing, AC-1042
      clamped preview size, AC-1123 box-plus-sheet split). Nothing new is introduced:
      no new region kind, no new control, no new write path, no new dialog. The change
      is that an already-documented surface acquires a response it did not have, so
      no new capability bucket is created and the prior intent (the opening dressing,
      one-Save-one-change) is preserved verbatim. The matrix currently asserts only
      what the box looks like at open; the code now also determines what it looks
      like as the sheet is driven, and six FC UATs on disk (tests/test_UAT_FC_REQ-138_live_preview.test.ts)
      prove behaviour that has no AC.'
    acceptance_criteria_changes:
      add:
      - 'Changing a typography parameter in the sheet immediately restyles the words
        in the editing box, writing nothing: Size, Weight, Italic and Capitalisation
        each reach the box as the operator confirms them (three distinct gestures
        — type-and-blur, select, toggle), and a parameter turned back off clears the
        property it set rather than leaving the previous value standing. Buffered
        commit is unchanged, so nothing here posts, re-renders or reaches the origin
        — Save is still the only write and one dialog is still one diff. (FC: weight_italic_and_capitalisation_restyle_the_box,
        turning_a_parameter_off_clears_it)'
      - 'A changed size previews at the scale the dialog dressed the run at, not re-clamped:
        the box keeps previewed-px-per-authored-px measured at open, which folds in
        both the editing clamp and any responsive-track difference between the authored
        base size and the size rendered at the current width. So body copy inside
        the range previews 1:1 while a run set above the ceiling previews proportionally
        reduced but still moves for every change — the case a re-clamp would strand
        at the ceiling and answer with no visible difference. The legibility floor
        is retained; there is no upper bound, because the box scrolls. (FC: a_clamped_headline_still_responds,
        the_box_keeps_the_scale_it_opened_at)'
      - 'Only a parameter the operator actually changed overrides the box: one property
        is written per change and no other axis moves, so a run''s colour, family
        and any untouched parameter keep exactly the value the opening dressing gave
        them. Opening the dialog and touching nothing leaves the box dressed precisely
        as the render dressed it — in particular a weight inherited from around the
        run keeps its rendered value rather than snapping to what the node itself
        declared. (FC: an_untouched_parameter_keeps_its_opening_value, opening_the_modal_is_unchanged)'
      modify:
      - 'AC-1042 (acceptance_criterion-6a9ace26) — ''The previewed size is clamped
        to an editing range while every other presentation axis is exact'': scope
        its wording to the size the box OPENS at, and record that a size the operator
        subsequently changes is previewed by the opening scale rather than re-entering
        the clamp. The criterion''s behaviour is unchanged and its verification still
        holds; without the scoping sentence the matrix reads as though every previewed
        size passes through the clamp, which the live path deliberately does not.'
      remove: []
    intent_delta_summary: 'STORY-101 currently describes an editing box dressed once,
      at open, from the rendering. It gains the live half of that loop: as the operator
      drives the parameter sheet, each confirmed field restyles the box, so the choice
      between Save and Cancel is made looking at the result rather than blind. Size
      responds by the opening scale rather than the opening clamp; untouched axes
      are never rewritten, which keeps every opening-dressing criterion (AC-1040,
      AC-1042, AC-1123) true by construction. Out of scope and stated as such: a run''s
      colour (no descriptor exists — deferred to REQ-133''s palette control) and image
      framing (REQ-136 changes the picture, not the words).'
    story_uid: null
  kind: reconciliation_plan
---

# Reconciliation Plan — REQ-138

**Mode**: commits
**Anchor**: request-1ff09fab (REQ-138, a request ticket — it IS the intent)
**Commit**: ebd789faa132a3973063e846f51081172a7269b8 — `feat(builder): preview typography changes live in the editing box [FREE-CODED]`

## Intent (Step 0)

The ticket body and commit message agree, and neither leaves room for interpretation:

- **What the operator sees**: changing Size, Weight, Italic or Capitalisation in the copy modal's parameter sheet immediately restyles the words in the editing box above it, so the change can be judged before choosing between Save and Cancel.
- **The gap being closed**: `applyPreview` dressed the box once, at open, from `readPageStyle`. Nothing re-read or re-wrote the `--preview-*` properties, so a parameter change was invisible until Save → POST → iframe reload.
- **Two design decisions stated explicitly, both load-bearing**: (1) size is *scaled*, not re-clamped — a headline already sitting on the 32px preview ceiling would answer 72 → 120 with no visible change; (2) only a parameter the operator actually changed overrides the box — the opening vars come from `getComputedStyle` on the rendered run (the *cascaded* result) while descriptor values are only what the node itself overrode, so re-deriving the whole dressing from `getValues()` would restyle the box the moment it appeared.
- **Declared scope boundary**: colour is out (no descriptor exists; `edit.ts` defers it to REQ-133's palette control) and image framing is out (REQ-136 — it changes the picture, not the words).

No chat comments on the anchor refine or supersede the body.

## Behavior Inventory

```yaml
behavior_inventory:
  source: "free-coded commit ebd789faa132a3973063e846f51081172a7269b8"
  entry_files:
    - "apps/control-app/src/builder/editor.js"
    - "apps/control-app/src/builder/page-style.js"
    - "tests/test_UAT_FC_REQ-138_live_preview.test.ts"
  features:
    - name: "The editing box follows the parameter sheet"
      description: >-
        `defaultModal` hoists the editing box to function scope and, after
        mounting the parameter-sheet form instance, subscribes to its `change`
        event. Each event is mapped through `previewVarFor(name, value, scale)`
        and, when that answers a declaration, written straight onto the box as a
        custom property. Commit stays `buffered`, so nothing posts, re-renders
        or reaches the origin — Save is still the only write.
      behaviors:
        - "`fontSizePx` writes `--preview-font-size` (scaled — see below)"
        - "`fontWeight` writes `--preview-font-weight` when the value is finite"
        - "`italic` writes `--preview-font-style` as `italic` or `normal`"
        - "`textTransform` writes `--preview-text-transform`, falling back to `none`"
        - "a field with no entry in the table writes nothing (`null`) rather than a default — colour is the live example of an absent row"
        - "every mapped value can say 'off' (`none` / `normal`), so a parameter turned back off clears the property it set"
      entry_point: "defaultModal → properties.on('change') in editor.js"
    - name: "Preview size is scaled, not re-clamped"
      description: >-
        `previewScale(previewVars, authoredPx)` divides the opening previewed
        size by the opening authored size, folding two independent reductions
        into one ratio: the 14–32px editing clamp, and any responsive-track
        difference between the authored base and the size rendered at the
        current width. It falls back to 1 whenever either end is missing.
        `previewSizePx(authoredPx, scale)` then answers
        `max(PREVIEW_MIN_PX, round(authored * scale))` — floor retained, no
        ceiling, `null` for a non-finite or non-positive size.
      behaviors:
        - "body copy inside the range previews 1:1"
        - "a clamped headline previews proportionally reduced but still moves for every change"
        - "shrinking far below the run's own size saturates at the 14px legibility floor"
        - "growing has no upper bound; the box scrolls"
        - "missing computed styles or an undeclared size degrade to scale 1 rather than to nothing"
      entry_point: "previewScale / previewSizePx / previewVarFor in page-style.js"
    - name: "Only what was changed overrides the opening dressing"
      description: >-
        The subscription writes one property per `change` event and never asks an
        untouched field for its value, so the opening dressing written by
        REQ-121's `applyPreview` survives for every axis the operator did not
        touch — including colour and family, which are not controls at all.
      behaviors:
        - "an untouched parameter keeps its opening (rendered, cascaded) value"
        - "opening the dialog and touching nothing leaves REQ-121's dressing exactly as written"
      entry_point: "defaultModal → properties.on('change') in editor.js"
```

### FC test evidence (on disk, must be covered)

`tests/test_UAT_FC_REQ-138_live_preview.test.ts` — six UATs driving the real
`defaultModal` over a real `1c render --edit` page, with the controls exercised
by user gestures rather than by calling into the component. (The prompt's
`fc_tests` list arrived empty; the file is present in the commit and on disk, so
it is treated as binding evidence.)

| FC UAT | claim | covered by |
|---|---|---|
| `a_clamped_headline_still_responds` | a run above the preview ceiling still moves | item 1, added AC 2 |
| `the_box_keeps_the_scale_it_opened_at` | scale preserved for a clamped and an unclamped run | item 1, added AC 2 |
| `weight_italic_and_capitalisation_restyle_the_box` | three parameters, three gestures | item 1, added AC 1 |
| `turning_a_parameter_off_clears_it` | 'off' clears rather than leaving the last value | item 1, added AC 1 |
| `an_untouched_parameter_keeps_its_opening_value` | one property per change | item 1, added AC 3 |
| `opening_the_modal_is_unchanged` | REQ-121's opening dressing regression | item 1, added AC 3 |

## Coverage Map

```yaml
coverage_map:
  - feature: "The editing box follows the parameter sheet"
    status: uncovered
    existing_stories: ["story-3bf94bd4 (STORY-101)"]
    existing_acs:
      - "AC-1123 (acceptance_criterion-35907074) — box + sheet split, staged into one save"
      - "AC-997 — one confirmed form is one change"
    gaps:
      - "No AC says the box responds to the sheet at all; the matrix describes the split and the single save, not the live link between them."
    notes:
      - "AC-1123 and AC-997 remain true unchanged — buffered commit is untouched."
  - feature: "Preview size is scaled, not re-clamped"
    status: partial
    existing_stories: ["story-3bf94bd4 (STORY-101)"]
    existing_acs:
      - "AC-1042 (acceptance_criterion-6a9ace26) — previewed size clamped to an editing range"
    gaps:
      - "AC-1042 describes the size the box OPENS at. It reads as though every previewed size passes through the clamp, which a changed size deliberately does not."
      - "No AC describes the opening-scale rule, its retained floor, or its absent ceiling."
    notes:
      - "Scoping edit only — AC-1042's behaviour and verification are unchanged."
  - feature: "Only what was changed overrides the opening dressing"
    status: partial
    existing_stories: ["story-3bf94bd4 (STORY-101)"]
    existing_acs:
      - "AC-1040 (acceptance_criterion-15ea0e87) — the box reproduces the rendered presentation and the paint under it"
    gaps:
      - "AC-1040 is an opening-time criterion. Nothing in the matrix says it survives the operator driving the sheet, which is precisely the invariant the implementation chose its shape to protect."
    notes:
      - "Stated as its own AC rather than folded into AC-1040, because it is a claim about the ABSENCE of writes and would otherwise be unverifiable from AC-1040's wording."
```

## Step 3b — Intent Scope vs Implementation Footprint

**Case 1 — implementation matches intent scope.** The commit touches
`editor.js` (+30/-3), `page-style.js` (+80), `package.json` (routine version
bump to 0.1.39) and one new test file. Every source change sits inside the copy
edit modal owned by STORY-101 / CAP-87. Nothing in the write path
(STORY-100 / CAP-86), the edit render channel (STORY-98 / CAP-84) or the
workspace (STORY-99 / CAP-85) is modified — consistent with the ticket's
stated 'nothing about the write path, the validator or the diff changes'.

No code outside the declared intent scope, so no regression note and no
supersession of a prior intent is required. The two axes the intent declares
out of scope — colour (REQ-133's palette control) and image framing (REQ-136) —
are genuinely absent from the diff: `PREVIEW_PARAMETERS` is a table with no
colour row, and the image picker is untouched.

## Plan Items

| # | Component | Type | Points | Deps | Target | Description |
|---|-----------|------|--------|------|--------|-------------|
| 1 | Copy edit modal — the editing box follows the parameter sheet | upgrade | 2 | - | story-3bf94bd4 (STORY-101) | Live restyling of the dressed box as the sheet is driven; size scaled by the opening ratio rather than re-clamped; only changed parameters override the opening dressing |

**Justification test** — *what user-visible capability does this document?* That
the operator, having clicked words on their own page, can see what a typography
change will look like before committing to it, instead of choosing blind and
reloading the page to find out what they chose.

## Observations

- **One item, not three.** Live restyling, the scaling rule and the
  only-what-changed rule are three facets of a single operator-visible
  capability: the box follows the sheet. Splitting them would produce
  'a story for the size axis' — a granularity the guidance names as an
  anti-pattern. They land as three ACs on one upgrade.
- **Upgrade, unambiguously.** The dressed box, the parameter sheet and the
  buffered single-Save invariant are all already STORY-101's. Nothing here
  introduces a capability bucket; it gives an existing surface a response.
- **The scaling rule is the ticket, and the matrix should say so.** The naive
  reuse — put the authored value back through `clampPreviewSize` — fails only
  for clamped runs, and fails silently: the control answers every change with
  no visible difference. The AC is written to be falsified by that substitution
  (the ticket reports it fails AC-1 and nothing else), which is why it names
  the clamped case rather than saying 'size previews'.
- **The third AC asserts an absence.** 'No other axis moves' passes on the
  pre-change code by construction, so it earns nothing as a bug-catcher today —
  it is a guard against the obvious future refactor (re-derive the dressing from
  `getValues()` on every change) that would break the opening dressing the moment
  someone tidied the subscription. Worth stating for exactly that reason; the
  reasoning is on the record in both the ticket and the code comment.
- **AC-1042's edit is a scoping clarification, not a behaviour change.** Its
  verification steps all describe opening the form and are unaffected. Left
  unedited, the matrix would carry a real contradiction between 'size is clamped
  in both directions' and a preview that grows past 32px.
- **Colour is a row this table gains, not a branch it has.** When REQ-133's
  palette control lands a colour descriptor, live preview extends by one entry
  in `PREVIEW_PARAMETERS` — worth noting so a later reconciliation reads that as
  the planned shape rather than as an omission.
- **Verification claims in the ticket were not re-run here** (planning produces
  no code and runs no suites). The ticket records 4-of-6 FC failures with the
  subscription removed, 91 passing editor/modal regression tests, and 13
  pre-existing full-suite failures that also fail on pristine `xgd-working`
  (they need an API key). The story cycle's own quality gate is what will
  confirm this.