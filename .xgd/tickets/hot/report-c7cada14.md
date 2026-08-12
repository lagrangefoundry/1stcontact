---
uid: report-c7cada14
id: REPORT-1826
type: report
title: 'Reconciliation Plan: free-coded — REQ-132 image picker shows thumbnails with
  file names'
created_by: xgd
created_at: '2026-08-12T16:00:53.901473+00:00'
updated_at: '2026-08-12T16:05:44.723181+00:00'
completed_at: null
last_field_updated: items
fields:
  report_kind: reconciliation_plan
  subject_uid: request-5946d045
  anchor_uid: request-5946d045
  items:
  - index: 1
    component: Structured Copy Editing — field derivation
    item_type: upgrade
    story_points: 1
    dependencies: []
    description: 'The edit-schema derivation now says what an image field''s options
      ARE, not merely that they are a closed list: `copyFieldsOf` sets `format: ''image''`
      on an image segment''s `src` and on a painted surface''s `backgroundImageUrl`
      (packages/site-schema/src/l1/edit.ts). It is a presentation hint and never a
      constraint — the closed list is still `enum`, and `applyCopyFields` enforces
      membership against that and nothing else. STORY-100 already states that the
      whole of what image selection adds is ''what a region answers when asked which
      fields it exposes''; this extends that answer by one descriptor axis.'
    justification: 'STORY-100 (story-37a3921b, capability-f753cecd) owns the derivation
      and already covers the closed list itself (AC-1024, AC-1045) and membership
      enforcement (AC-988, AC-1048). What it does not say is that the descriptor now
      declares the KIND of its options, which is the fact FC UAT `test_UAT_FC_REQ-132_an_image_field_declares_that_its_options_are_images`
      binds. No new capability bucket: this is one optional field on an existing descriptor
      in an existing derivation, reaching an existing consumer over the existing transport.
      No new command, endpoint, or value vocabulary.'
    story_uid: story-37a3921b
    target_story_ids:
    - story-37a3921b
    intent_delta_summary: Extend STORY-100 so the derived field descriptor for an
      image handle declares that its options are images, as a hint that changes how
      the same options are shown and nothing about which of them may be chosen. Both
      image-bearing fields — an image segment's `src` and a painted surface's `backgroundImageUrl`
      — carry it, which is the evidence it is a property of the field kind and not
      of one segment kind.
    acceptance_criteria_changes:
      add:
      - Asking a region what it exposes returns, for a field whose options are the
        site's images, a descriptor that declares them as images — on an image segment's
        own image and on a painted panel's background alike — while the closed list
        and the membership check it is enforced by are unchanged, so a value outside
        the list is still refused.
      modify: []
      remove: []
  - index: 2
    component: In-Page Copy Editing — the image picker control
    item_type: upgrade
    story_points: 3
    dependencies:
    - 1
    description: Clicking an image segment, or a painted panel's background, opened
      a native `<select>` of `/assets/…` handles. It is now a grid of thumbnails (apps/control-app/src/builder/image-picker.js),
      each labelled with its file name and nothing else, the current handle pre-selected.
      The dialog splits its schema by descriptor — picker fields drawn here, the rest
      handed to `mountFields` unchanged — and both halves flush through a single Save,
      so one modal is still one diff. Thumbnails resolve through the existing preview
      channel (`assetUrl`, apps/control-app/src/builder/api.js), reproducing the page's
      own document-relative resolution; no new endpoint, no bytes copied. A tile whose
      bytes will not load keeps its name and stays selectable. The options are radios
      in one named group, so the browser supplies arrow-key navigation and the single-selection
      invariant, and the grid takes focus once the dialog is in the document. A background-only
      dialog builds no text-editing box at all and keeps the full panel width.
    justification: 'STORY-101 (story-3bf94bd4, capability-12fee326) owns the click-to-edit
      gesture and everything the modal presents, including the three criteria whose
      suites this commit rewrote (AC-1043, AC-1044, AC-1050) and the picker itself
      (AC-1028). The behaviour is a change of CONTROL on an existing surface, not
      a new capability: same gesture, same derivation, same `/api/copy`, same one-modal-one-diff
      rule — so extending STORY-101 is correct and a parallel story would duplicate
      the surface it already owns. No new capability bucket is introduced; nothing
      here adds a transport, a command, or a value vocabulary. Binds 11 of the 12
      REQ-132 FC UATs.'
    story_uid: null
    target_story_ids:
    - story-3bf94bd4
    intent_delta_summary: Extend STORY-101 so the closed list of a site's images is
      chosen by looking at the pictures rather than by reading paths, and so the dialog
      is understood to compose two controls that flush as one change. The prior intent
      — a picker over the region's closed list, one form one diff, the current handle
      always offered — is preserved exactly; what changes is which control carries
      it and how the dialog is assembled around it.
    acceptance_criteria_changes:
      add:
      - The closed list of images a region offers is drawn as a grid of thumbnails,
        one tile per offered image and nothing else in the grid, with the dropdown
        of paths it replaces gone rather than offered alongside it.
      - A tile is labelled with the image's file name alone and never any part of
        its address; the full handle survives only as the tile's tooltip, so two images
        sharing a name stay tellable apart without putting a path on screen for every
        tile that never needed one.
      - A tile shows the bytes the origin actually serves for that handle, resolved
        the same way the page resolves its own image sources, with no new endpoint
        and no copy of any asset; a handle that already names its own origin is used
        as it stands.
      - A handle whose bytes will not load keeps its name and stays selectable behind
        a placeholder frame, so a region can always keep the image it already has
        even when this origin cannot serve it.
      - The grid is reachable, navigable and announced as one single-selection group
        without a mouse, and holds the keyboard from the moment the dialog opens.
      modify:
      - AC-1028 — the image region's picker is the thumbnail grid, and the region's
        current handle is not merely among the options but the one selected when the
        dialog opens.
      - 'AC-997 — one confirmed form is still one change when the dialog draws some
        of its fields itself and delegates the rest: the staged pick and the buffered
        form values merge into a single change map, and a field the operator did not
        touch is not in it.'
      - AC-1000 — a dialog closed with nothing changed still writes and re-renders
        nothing when the untouched control is the picker; the dirty check spans both
        controls rather than only the form.
      - AC-1043 — the panel's narrowing rule keys on the absence of either editing
        surface, so a dialog that is all thumbnails and no text keeps the full width
        and Save stays reachable.
      - AC-1044 — opening the lone control applies only to a form that is the whole
        dialog; when a picker is present no form control is auto-opened, so clicking
        a picture does not put the cursor in its alt text.
      - AC-1050 — a painted panel's background is chosen from the same thumbnail grid
        over the same transport, and because it exposes no text the dialog builds
        no editing box at all rather than framing a void.
      remove: []
---

# Reconciliation Plan

**Mode**: commits
**Anchor**: request-5946d045 (REQ-132 — Page editor: image picker shows thumbnails with file names)
**Commit under reconciliation**: f93cb80d7d8bf192178d976d6f4752efc3f62a4d

## Step 0 — Intent

The operator's declared change: the control for picking an image becomes a grid of
thumbnails labelled by file name, replacing a native `<select>` of `/assets/…`
handles. Declared scope boundary, stated in the ticket body and repeated in the
commit message: **a change of control, not of vocabulary.** The value a pick
commits is the full handle, unchanged; the derivation, the `/api/copy` transport
and the one-modal-one-diff rule are all unchanged. The single new piece of
vocabulary is one optional descriptor hint (`format: 'image'`), explicitly a hint
and never a constraint.

The ticket also declares, as consequences rather than additions: thumbnails resolve
through the existing preview route (no new endpoint); an unloadable tile stays named
and selectable; duplicate file names are tolerated and resolved by tooltip, not
disambiguated; and a background-only dialog has no editing box, with the panel's
narrowing rule re-keyed accordingly.

## Behavior Inventory

```yaml
behavior_inventory:
  source: "free-coded commit f93cb80d (REQ-132 / request-5946d045)"
  entry_files:
    - "packages/site-schema/src/l1/edit.ts"
    - "apps/control-app/src/builder/image-picker.js"
    - "apps/control-app/src/builder/editor.js"
    - "apps/control-app/src/builder/api.js"
    - "apps/control-app/src/builder/builder.css"
  features:
    - name: "Image-field descriptor declares its option kind"
      description: >-
        `L1FieldDescriptor` gains `format?: 'image'`; `copyFieldsOf` sets it on an
        image segment's `src` and on a painted surface's `backgroundImageUrl`.
        Documented in-source as a hint, never a constraint: the closed list is
        still `enum` and `applyCopyFields` validates membership against that.
        Mirrors `mountFields`' own `enum` + `format: 'color'` pairing, so an
        unrecognised `format` is inert in that component today.
      behaviors:
        - "image.src carries format: 'image' alongside its enum"
        - "a surface's backgroundImageUrl carries format: 'image' alongside its enum"
        - "membership enforcement is unchanged — the hint constrains nothing"
      entry_point: "copyFieldsOf (packages/site-schema/src/l1/edit.ts)"

    - name: "Thumbnail grid control"
      description: >-
        `mountImagePicker` builds a radiogroup of tiles, one per enum option. Each
        tile is a <label> holding a radio (value = full handle), a thumbnail frame
        and a name span. Selection is staged only — `getValue`/`isDirty` report it;
        the modal's Save is the sole flush point.
      behaviors:
        - "one tile per offered handle; the node's current handle is pre-checked"
        - "label text is the basename with query/fragment stripped; a handle ending in a slash falls back to the handle itself"
        - "the full handle is the tile's title attribute — the only place a path appears"
        - "role=radiogroup with the field label as its accessible name; radios share a per-instance group name so one picker cannot un-check another"
        - "thumbnail img carries empty alt (the name span is the option's accessible name) and loads lazily"
        - "an img error swaps the frame to a missing state and removes the img; the tile keeps its name and stays selectable"
        - "focus() puts the keyboard on the checked tile, else the first"
        - "isImagePicker(field) === (field.format === 'image' && Array.isArray(field.enum))"
      entry_point: "mountImagePicker / isImagePicker (apps/control-app/src/builder/image-picker.js)"

    - name: "Thumbnail byte resolution"
      description: >-
        `assetUrl(slug, handle)` appends a site-local handle to the draft preview
        channel URL, reproducing the page's own document-relative resolution
        (relativizeUrl, REQ-109) rather than inventing a second convention. A
        complete reference (scheme or protocol-relative) is returned verbatim.
        Empty/whitespace handles yield ''.
      behaviors:
        - "site-local handle -> /preview/<slug>/draft/<handle>, leading ./ and / stripped"
        - "absolute or protocol-relative URL -> returned untouched"
        - "no new route; PreviewRenderer.file already serves anything under assets/"
      entry_point: "assetUrl (apps/control-app/src/builder/api.js)"

    - name: "Modal composition across two controls"
      description: >-
        `defaultModal` partitions `spec.schema` by `isImagePicker`. Picker fields
        are mounted by this dialog; the remainder go to `mountFields` — and only
        the remainder: `values` is filtered to the form's own keys, because handed
        the whole map the component reports every key back at its opened value,
        which read as an explicit 'put the old image back' and silently undid every
        pick. Staged values merge with the pickers spread last; dirty is the OR of
        both.
      behaviors:
        - "schema split per-field by descriptor, not per segment kind"
        - "mountFields receives only the fields it renders, and only their values"
        - "one change map on Save carries picked handle and typed text together"
        - "nothing staged in either control closes without POSTing"
        - "no text-editing box is built when there are no form fields"
        - "openLoneControl fires only when the form is the whole dialog (no pickers)"
        - "the first picker takes focus AFTER the dialog is appended — focus does not move to a detached element"
        - "panel narrowing keys on the absence of EITHER editing surface, so an all-thumbnails dialog keeps full width"
      entry_point: "defaultModal (apps/control-app/src/builder/editor.js)"
```

## Coverage Map

```yaml
coverage_map:
  - feature: "Image-field descriptor declares its option kind"
    status: partial
    existing_stories: ["story-37a3921b (STORY-100)"]
    existing_acs: ["AC-1024", "AC-1045", "AC-988", "AC-1048"]
    gaps:
      - "No AC states that the descriptor declares WHAT its options are, only that they are a closed list"
      - "No AC records that the declaration is a hint whose presence changes nothing about membership enforcement"
    notes:
      - "AC-1024 and AC-1045 remain accurate as written — the closed list is unchanged — so this adds an AC rather than modifying them"

  - feature: "Thumbnail grid control"
    status: partial
    existing_stories: ["story-3bf94bd4 (STORY-101)"]
    existing_acs: ["AC-1028"]
    gaps:
      - "AC-1028 says 'a picker of the site's images' without saying what the picker is, and says the current handle is among the options without saying it is the selected one"
      - "Nothing covers file-name labelling, path suppression, or the tooltip that resolves duplicate names"
      - "Nothing covers a tile whose bytes will not load"
      - "Nothing covers keyboard reachability or single-selection announcement"

  - feature: "Thumbnail byte resolution"
    status: uncovered
    existing_stories: ["story-3bf94bd4 (STORY-101)"]
    existing_acs: []
    gaps:
      - "No AC says the chrome shows the actual served bytes for a handle, nor that it costs no new endpoint and copies nothing"
    notes:
      - "Folded into the STORY-101 upgrade rather than made its own item: `assetUrl` is an internal helper, and the user-visible fact is 'the tile shows the picture', not 'a URL is built'. A separate story here would be the story-per-file anti-pattern."

  - feature: "Modal composition across two controls"
    status: partial
    existing_stories: ["story-3bf94bd4 (STORY-101)"]
    existing_acs: ["AC-997", "AC-1000", "AC-1043", "AC-1044", "AC-1050"]
    gaps:
      - "AC-997/AC-1000 assume one control holds every staged value; the dialog now holds two and merges them"
      - "AC-1043's panel-width rule and AC-1044's lone-control rule both changed shape"
      - "AC-1050's control changed from a dropdown to the grid, and its dialog now builds no editing box"
```

## Plan Items

| # | Component | Type | Points | Deps | Description |
|---|-----------|------|--------|------|-------------|
| 1 | Structured Copy Editing — field derivation | upgrade | 1 | - | The derived descriptor declares that an image field's options are images — a hint that changes how they are shown and nothing about which may be chosen. Upgrades STORY-100 (story-37a3921b). |
| 2 | In-Page Copy Editing — the image picker control | upgrade | 3 | 1 | The closed list is drawn as a thumbnail grid labelled by file name, resolved through the existing preview channel, tolerant of unservable bytes, keyboard-reachable, and merged with the form into one Save. Upgrades STORY-101 (story-3bf94bd4). |

**Total**: 2 items (feature: 0, upgrade: 2), 4 points.

## FC Test Evidence

The prompt's `fc_tests` list arrived **empty**, but this anchor does carry FC tests:
`tests/req132-image-picker-thumbnails.test.ts`, 12 UATs named
`test_UAT_FC_REQ-132_*`. The scan appears to match only Python FC files; this is a
TypeScript repo. Treated as binding evidence regardless. All 12 pass on this branch
(verified: `vitest run tests/req132-image-picker-thumbnails.test.ts` — 12 passed).

Mapping — every FC UAT is claimed by an item, so `check_fc_orphans` has nothing left over:

| FC UAT | Item |
|---|---|
| `an_image_field_declares_that_its_options_are_images` | 1 |
| `an_image_segment_offers_one_thumbnail_tile_per_image` | 2 (add) |
| `a_tile_is_labelled_with_the_file_name_and_never_its_path` | 2 (add) |
| `the_dropdown_of_paths_is_gone_rather_than_offered_alongside` | 2 (add) |
| `the_thumbnail_loads_the_bytes_the_origin_actually_serves` | 2 (add) |
| `a_handle_the_origin_cannot_serve_still_offers_a_named_selectable_tile` | 2 (add) |
| `the_grid_is_reachable_and_announced_without_a_mouse` | 2 (add) |
| `the_image_the_segment_holds_is_the_selected_tile` | 2 (modify AC-1028) |
| `picking_a_tile_and_saving_writes_that_handle_and_nothing_else` | 2 (modify AC-997) |
| `a_new_image_and_new_alt_text_travel_in_one_save` | 2 (modify AC-997) |
| `opening_the_picker_and_saving_untouched_sends_nothing` | 2 (modify AC-1000) |
| `a_painted_container_picks_its_background_from_the_same_thumbnails` | 2 (modify AC-1050) |

Two pre-existing suites were rewritten by the same commit to assert their criteria
against the new control rather than the `<select>`:
`reconciliation-copy-edit-form-presentation` (AC-1043, AC-1044) and
`reconciliation-copy-edit-gesture-modal` (AC-1050). Those three ACs are covered by
item 2's `modify` list, so the matrix text catches up with the tests that already moved.

## Step 3b — Intent Scope vs Implementation Footprint

**Case 1 (matches intent)** for the substance: the descriptor hint, the grid, the
preview-route resolution and the unservable-tile tolerance are each declared in the
ticket body and confirmed by the diff.

**Case 2 (explicit supersession)** for AC-1043, AC-1044 and AC-1050. The operator
knowingly changed behaviour a prior intent established — the commit message names
the three ACs — so these are upgrades within item 2 rather than drift. AC-1044 is
the sharpest of the three: its stated rule ('a form with exactly one field opens in
its control') is now *qualified* rather than extended, because an image segment's
form is a lone `alt` field that deliberately no longer opens. The ticket body does
not spell this out in its numbered list; the commit's own source comment does, and
it sits inside the declared scope (which control draws which field). Recorded as a
modification with that qualification stated explicitly.

**Case 3 (undeclared footprint)**: none found. Every file the commit touches is
owned by STORY-100 or STORY-101. The `mountFields` `values` filtering is not scope
creep but a defect the split created and closed in the same commit — handed the
whole map the component reported the picker's key back at its opened value, which
merged into the change map as an explicit revert and undid every pick. It is
behaviour-preserving with respect to AC-997 and is covered by that AC's modification
rather than by an item of its own.

## Observations

- **Two items, not one, because the change straddles two capability buckets.** The
  descriptor lives in `capability-f753cecd` (the derivation and write path) and the
  control lives in `capability-12fee326` (the gesture and what the modal presents).
  An upgrade item cannot target stories across buckets, so the split is structural
  rather than a granularity choice. Within each bucket the work is deliberately
  coarse: item 2 carries 11 FC UATs as one story, because 'choose an image by
  looking at it' is one user-visible capability on one surface.
- **Nothing here is a feature.** The commit adds no capability bucket: same gesture,
  same derivation, same endpoint, same closed list, same atomicity rule. Every fact
  it establishes extends a story that already owns the surface, which is why both
  items are upgrades and neither has an empty `target_story_ids`.
- **The value/label distinction is the load-bearing invariant** and should survive
  into the AC text. A tile commits the full handle; only the label is the file name.
  An AC phrased as 'the picker shows file names' without that pairing would read as
  a change to the value vocabulary, which is precisely what the operator declared
  this is not.
- **Duplicate file names are tolerated, not disambiguated** — a deliberate choice
  recorded in the ticket, not an oversight. The added AC states the tooltip as the
  resolution so a later reader does not 'fix' it by putting paths back on screen.
- **`assetUrl`'s `draft` channel is not a freshness choice.** Asset bytes are copied
  through rather than rendered, so every channel serves the identical file. Worth
  keeping out of AC text, which should say 'the bytes the origin serves' rather than
  naming a channel.
- **Uncertainty, minor**: AC-1028 could arguably be left untouched — its wording
  ('a picker of the site's images, with its current handle always among them') is
  control-agnostic and its suite was not rewritten. It is listed under `modify`
  anyway, because pre-selection (FC UAT `the_image_the_segment_holds_is_the_selected_tile`)
  is a genuinely new assertion and AC-1028 is its natural home; adding a separate AC
  for 'and it is selected' would fragment one fact across two criteria.