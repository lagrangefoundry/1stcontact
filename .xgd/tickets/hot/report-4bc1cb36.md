---
uid: report-4bc1cb36
id: REPORT-1549
type: report
title: 'Reconciliation Plan: REQ-118 image selection through the copy edit loop'
created_by: xgd
created_at: '2026-08-07T04:26:09.619817+00:00'
updated_at: '2026-08-07T04:42:21.759117+00:00'
completed_at: null
last_field_updated: items
fields:
  report_kind: reconciliation_plan
  subject_uid: request-66e4c630
  anchor_uid: request-66e4c630
  items:
  - index: 1
    component: Site Asset Store Listing (1c asset list, GET /api/assets, listSiteAssets)
    item_type: feature
    story_points: 2
    dependencies: []
    description: 'The site''s assets are a listable surface in their own right: one
      listing, reachable from the command line and from the builder origin, that answers
      ''what can this site reference?''. It is the union of two sources that genuinely
      disagree — the site definition''s asset registry (metadata, but empty on every
      real site in storage/) and the draft/assets/ directory (bytes, no metadata)
      — reported with provenance (onDisk, registered) and a kind derived from the
      file extension (image / font / other). Every entry''s handle is normalised to
      /assets/<name>, the same vocabulary the capture fold already writes into an
      L1 image.src, never a parallel one. Reachable independently of any editing gesture:
      `1c asset list <slug>` and `GET /api/assets?slug=`, the latter answering a caller
      fault (400) when the slug is missing. Evidence: test_UAT_FC_REQ-118_the_asset_listing_is_callable_independently_of_the_modal,
      test_UAT_FC_REQ-118_the_asset_store_is_reachable_without_opening_a_modal.'
    justification: 'No story and no acceptance criterion in the matrix mentions a
      site''s assets at all — a full sweep of every AC found zero. CAP-77 (Asset Provenance
      & Licence Compliance) is the project-level licence-obligation index over governed
      files, not a per-site listing of what a page may reference; CAP-70 (Framework
      Substrate) binds an asset handle to its served substance, which is about pixels,
      not about enumerating the store. `1c asset list` existed before this commit
      but was registry-only, undocumented by the matrix, and therefore wrong on every
      real site. This is a genuinely new capability bucket — the asset store as a
      queryable surface with three consumers — so it cannot be folded into either
      copy-editing story without inventing a bucket there. User-visible capability
      documented: the operator (and DOC-28 §9.2''s asset browser mode) can ask a site
      what assets it has, and get the truth rather than the registry''s partial view.'
    story_uid: story-c46abfa6
  - index: 2
    component: Structured Copy Editing — image selection through the same write path
    item_type: upgrade
    story_points: 3
    dependencies:
    - 1
    target_story_ids:
    - story-37a3921b
    intent_delta_summary: 'STORY-100 currently claims the exposed-field vocabulary
      is ''plain words and nothing else''. REQ-118 widens it by exactly one shape:
      a field is a plain string OR a pick from a closed list the derivation itself
      supplied. The story''s scope prose and its exposure-rule sentence must be updated
      accordingly, and its field-vocabulary claim restated as ''no control this surface
      can offer is capable of carrying raw HTML or CSS'' (still true — an enum is
      narrower than a string, not a loosening). Everything else about the story is
      unchanged and must stay unchanged: an image edit travels the same `1c copy get|set`
      command and `/api/copy` transport, the same whole-or-nothing change map, the
      same whole-definition validator, the same structured refusal shape, and the
      same write-then-re-render order. There is deliberately no `image set` command
      and no `/api/image` route, and the story must say so, because ''this is the
      second half of phase 1, not a second mechanism'' is the load-bearing claim.
      Framing parameters (crop, scale, scrim, rotation) stay explicitly out of scope,
      blocked on DOC-28 §13 Q5 — the editor must eventually write the same fields
      the capture fold already folds, not a parallel vocabulary.'
    acceptance_criteria_changes:
      add:
      - 'An image region exposes which image goes here — a choice from a closed list
        of the site''s images — alongside its alt text, answered by the same ''what
        does this region expose'' operation a run of copy answers. The list is narrowed
        to images: a font file or a stylesheet in the same store is a real asset but
        nothing an image can point at, and is not offered. Evidence: test_UAT_FC_REQ-118_clicking_an_image_segment_offers_a_picker_of_the_sites_assets,
        test_UAT_FC_REQ-118_the_modal_reads_its_picker_from_the_same_copy_transport.'
      - 'A region''s current image is always among the options it offers, even when
        no file in the store mirrors it. A reproduction can hold a handle the mirror
        never got (a remote URL), and a chooser whose options omit its own value presents
        the first option instead — so without this, editing only the alt text would
        silently swap the image. Evidence: the off-disk handle assertions in test_UAT_FC_REQ-118_clicking_an_image_segment_offers_a_picker_of_the_sites_assets.'
      - 'Choosing an image updates the draft definition and the page shows the new
        image with no further step, and its alt text is editable in the same form
        and lands in the same single diff. Evidence: test_UAT_FC_REQ-118_choosing_an_asset_updates_the_node_and_the_rerendered_page,
        test_UAT_FC_REQ-118_alt_text_is_editable_alongside_the_image_and_saved_in_the_same_diff,
        test_UAT_FC_REQ-118_saving_an_image_choice_rerenders_both_channels.'
      - 'Choosing an image bakes nothing: no asset file is written, copied, resized
        or processed, and every other parameter the region carries survives the edit
        untouched — the change is exactly one structured field. This is what keeps
        the eventual home of framing parameters protected while they are out of scope.
        Evidence: test_UAT_FC_REQ-118_choosing_an_asset_bakes_nothing_and_changes_only_a_structured_field.'
      modify:
      - 'AC-988 (acceptance_criterion-97f5dee6) — ''A change map naming a field the
        region does not have, or a value that is not text, is refused rather than
        ignored''. Extend to cover a third refusal the validator structurally cannot
        make: a value that is well-formed and perfectly safe but is not one of the
        options the region offered. An absent handle is a valid URL, so the envelope
        accepts it and the page renders a broken image with no error; membership is
        therefore checked at the field, before the shared validator runs, and nothing
        is applied. Evidence: test_UAT_FC_REQ-118_an_asset_the_site_does_not_have_is_refused_and_nothing_is_applied.'
      - 'AC-986 (acceptance_criterion-289bbf76) — ''A copy edit is validated over
        the whole resulting definition by the same validator every other structured
        edit runs''. Generalise from ''a copy edit'' to any edit through this surface.
        The claim is now proved for an image by consequence: an unrelated L1 range
        violation elsewhere on the page makes an image edit fail with the identical
        code, message and path as `config set`, which it could not do if image editing
        ran a validator of its own. Evidence: test_UAT_FC_REQ-118_image_edits_run_the_same_whole_definition_validator_as_the_ai_surface.'
      - 'AC-992 (acceptance_criterion-9561711e) — ''Editing through the builder''s
        origin is the same surface''. Extend to state that an image edit is the same
        origin surface too: the picker''s options arrive over the same read call (so
        a chooser costs no extra round trip and cannot offer options the write path
        would reject), a refused choice comes back as a caller-scoped fault naming
        the field rather than a server fault, and a saved choice leaves both renderings
        current. Evidence: test_UAT_FC_REQ-118_the_modal_reads_its_picker_from_the_same_copy_transport,
        test_UAT_FC_REQ-118_a_rejected_choice_comes_back_as_a_field_scoped_400, test_UAT_FC_REQ-118_saving_an_image_choice_rerenders_both_channels.'
      remove: []
    justification: 'STORY-100 (CAP-86, Structured Copy Editing: One Validated, Atomic
      Write Path) already owns exactly this surface: the address of an editable region,
      which fields a region exposes, the application of one change map as one validated
      whole-or-nothing diff, and the structured refusal. REQ-118 adds no new bucket
      — it adds no command, no route, no second validator and no second write path;
      the entire change is in the derivation of what a region exposes plus enum membership
      on the write side. Classifying this as a feature would create a parallel story
      for the same surface and would contradict the ticket''s own central claim. The
      one capability-level statement that changes is the exposure rule''s wording
      (''plain words and nothing else'' becomes ''a plain string or a pick from a
      closed list''), which is a modification of existing intent, not a new bucket
      — and it is a narrowing of what a control can return, so AC-991 (no edit can
      produce raw HTML or CSS) survives untouched. Depends on item 1 because the closed
      list a region offers is the image-narrowed asset listing.'
    story_uid: story-37a3921b
---

# Reconciliation Plan — REQ-118 (request-66e4c630)

**Mode**: commits
**Source**: free-coded commit `6638691e3385b331b9789a1c6647093f42987591` (cherry-picked onto this branch as `58cd03439`)
**Anchor**: request-66e4c630 (REQ-118), which is itself the intent ticket

## Step 0 — Intent

The ticket states its own claim precisely: this is *the second half of phase 1, not a second
mechanism*. Copy editing (REQ-117 / T3) landed the loop; REQ-118 makes an image travel it.
The operator declared, and the diff confirms:

- **No** `image set` command and **no** `/api/image` route. An image edit uses `1c copy get|set`
  and `/api/copy`, the same whole-definition validator, the same write-then-re-render order.
- The whole change is in the **derivation** (what a region exposes) plus the **asset listing**
  that feeds it.
- Framing (crop, scale, scrim, rotation) is **deliberately deferred**, blocked on DOC-28 §13 Q5:
  the capture fold already folds those fields, and the editor must write the same ones rather
  than a parallel vocabulary. Asset **upload** and any image processing are also out.
- One REQ-117 test was **deliberately** updated: it used the image as its "segment with nothing
  to edit" example; T4 took that role, so it now uses the painted container.

## Behavior Inventory

```yaml
behavior_inventory:
  source: "free-coded commit 6638691e (REQ-118 / DOC-28 §12 T4)"
  entry_files:
    - "packages/site-schema/src/l1/edit.ts"
    - "packages/site-schema/src/l1/index.ts"
    - "tools/generate/src/cli/edit.ts"
    - "tools/generate/src/cli/builder.ts"
    - "apps/control-app/src/builder/api.js"
  features:
    - name: "L1FieldDescriptor gains a closed-list shape"
      description: >-
        `type` widened from 'string' to 'string' | 'enum', with an `enum` option list and a
        `required` flag. Narrower than a string, not a loosening: an enum control can only
        return an option the derivation itself put in front of the user, and neither shape
        can carry markup. The ticket records this as the axis the vocabulary grows along
        (a palette colour, a module config value are the same shape).
      behaviors:
        - "A descriptor may carry a closed option list; the widget renders a select over it"
        - "`required` suppresses the widget's empty option"
      entry_point: "L1FieldDescriptor (packages/site-schema/src/l1/edit.ts)"
    - name: "copyFieldsOf derives an image segment's fields"
      description: >-
        For `kind: 'image'` returns `src` (type enum, required, options = the site's image
        assets PLUS the node's current handle) and `alt` (plain string, same >80-char /
        newline textarea rule copy uses). A new `L1SegmentFieldOptions` argument carries the
        site's handles in, so the module stays pure data and never reads a directory.
      behaviors:
        - "An image region exposes src + alt; a container still exposes nothing"
        - "The option list is the site's IMAGE assets only — fonts/stylesheets excluded"
        - "The node's current handle is always an option, even when no file mirrors it"
        - "Options are de-duplicated and sorted"
      entry_point: "copyFieldsOf(node, opts)"
    - name: "applyCopyFields enforces enum membership"
      description: >-
        A value for an enum field must be one of that field's options, checked at the field
        before the shared validator runs, whole-or-nothing as before. Catches what the
        envelope structurally cannot: `/assets/ghost.png` is a perfectly SAFE URL, so
        validation accepts it and the page renders a broken image with no error. Refusal
        messages generalised from "copy field" to "field".
      behaviors:
        - "A safe-but-absent handle is refused, naming the field; nothing is applied"
        - "Unknown field / non-string value still refused (unchanged property)"
        - "src and alt each report into `changed` only when they actually differ"
      entry_point: "applyCopyFields(node, values, opts)"
    - name: "listSiteAssets — one listing, three consumers"
      description: >-
        Exported, UI-free. The UNION of the site.json asset registry (metadata; empty on
        every real site in storage/) and the draft/assets/ directory (bytes; no metadata).
        Each entry: {id, src, alt, kind, onDisk, registered}. `kind` derived from extension
        (image | font | other). Handles normalised to `/assets/<name>` — the vocabulary the
        capture fold writes — using the same leading-`./`-or-`/` strip as l1/assets.ts.
        Sorted by handle.
      behaviors:
        - "Unregistered files on disk are listed, flagged registered:false"
        - "Registered entries contribute alt/id metadata and are flagged registered:true"
        - "A registry entry with no file is listed with onDisk:false"
        - "`1c asset list` now returns the union, replacing the registry-only partial truth"
      entry_point: "listSiteAssets(slug, opts) / editAssetList(slug, opts)"
    - name: "GET /api/assets and fetchAssets"
      description: >-
        The listing as a builder-origin route, plus a client wrapper. Deliberately NOT used
        by the image modal — `editCopyGet` already embeds the options in the `src`
        descriptor, so a picker costs zero extra round trips and cannot show options that
        disagree with what the write path accepts. The route exists because the listing is
        the asset store's own surface (DOC-28 §9.2's asset browser mode).
      behaviors:
        - "GET /api/assets?slug= returns the same listing the CLI returns"
        - "A missing slug is a caller fault: 400 'slug is required'"
      entry_point: "handleBuilderRequest (tools/generate/src/cli/builder.ts), fetchAssets (api.js)"
    - name: "editCopyGet / editCopySet pass the site's handles into the derivation"
      description: >-
        `segmentOptions` fetches the image-narrowed listing for an image node and skips it
        for every other kind, so a text run never pays for a directory read.
      behaviors:
        - "Read and write derive from the identical option set, so they cannot disagree"
      entry_point: "segmentOptions(node, slug, opts)"
```

## Step 2 — Existing capability matrix (queried)

Relevant capabilities and their stories:

| Capability | Story | Owns |
|---|---|---|
| CAP-86 `capability-f753cecd` Structured Copy Editing | STORY-100 `story-37a3921b` (AC-980…AC-992) | address, **what a region exposes**, one validated atomic change map, structured refusal, origin equivalence |
| CAP-87 `capability-12fee326` In-Page Copy Editing | STORY-101 `story-3bf94bd4` (AC-993…AC-1006) | hover/click resolution, the form, post-save page, nothing-to-edit, stale render |
| CAP-88 `capability-25f7e486` Edit Render Channel | STORY-98 `story-af36c2cb` | the editable rendering and its address stamps |
| CAP-a994b8f3 Builder Workspace | STORY-99 `story-e674c60a` | chrome, origin, display panel |
| CAP-77 `capability-745b9a6c` Asset Provenance | STORY-92 | project-level **licence obligations** over governed files |

**Asset sweep result**: every acceptance criterion in the matrix was scanned for
`asset` / `image` / `picker`. **Zero matches.** The site asset store is entirely undocumented.

## Coverage Map

```yaml
coverage_map:
  - feature: "L1FieldDescriptor gains a closed-list shape"
    status: partial
    existing_stories: [story-37a3921b]
    existing_acs: [acceptance_criterion-e817ae96, acceptance_criterion-08c7ebe8]
    gaps:
      - "STORY-100's scope prose says the exposed vocabulary is 'plain words and nothing else'"
      - "AC-991 (no raw HTML/CSS) still holds — an enum is narrower than a string"
    notes:
      - "Prose delta only; the safety claim is unchanged, which is why this is an upgrade"
  - feature: "copyFieldsOf derives an image segment's fields"
    status: partial
    existing_stories: [story-37a3921b]
    existing_acs: [acceptance_criterion-e817ae96, acceptance_criterion-95afd919]
    gaps:
      - "No AC states that an image region exposes which image goes here, plus alt"
      - "No AC states the current handle is always an option (the silent-swap guard)"
  - feature: "applyCopyFields enforces enum membership"
    status: partial
    existing_stories: [story-37a3921b]
    existing_acs: [acceptance_criterion-97f5dee6, acceptance_criterion-289bbf76]
    gaps:
      - "AC-988 covers unknown-field and not-text; not safe-but-absent-option"
      - "AC-986 says 'a copy edit' where the code now validates any edit on this surface"
  - feature: "Choosing an image writes one structured field and re-renders"
    status: partial
    existing_stories: [story-37a3921b]
    existing_acs: [acceptance_criterion-99f7c64d, acceptance_criterion-9561711e]
    gaps:
      - "AC-982 is about words; nothing states the image case or the bakes-nothing property"
      - "AC-992 (origin equivalence) does not mention the image path or the field-scoped 400"
  - feature: "listSiteAssets / 1c asset list union listing"
    status: uncovered
    existing_stories: []
    existing_acs: []
    gaps:
      - "No story or AC anywhere in the matrix describes a site's asset store"
    notes:
      - "CAP-77 is licence obligations at project level, not a per-site listing — distinct bucket"
      - "`1c asset list` predates this commit but was registry-only and undocumented"
  - feature: "GET /api/assets and fetchAssets"
    status: uncovered
    existing_stories: []
    existing_acs: []
    gaps:
      - "No AC covers the asset store being reachable from the builder origin"
  - feature: "The click gesture over an image"
    status: covered
    existing_stories: [story-3bf94bd4]
    existing_acs: [acceptance_criterion-ce71a033, acceptance_criterion-e2413484]
    notes:
      - "editor.js is NOT in the diff — mountFields already supported type:'enum'"
      - "No plan item: see Observations, the kind-agnostic claim is evidenced by absence"
```

## Plan Items

| # | Component | Type | Points | Deps | Description |
|---|-----------|------|--------|------|-------------|
| 1 | Site Asset Store Listing | feature | 2 | - | The union listing (registry ∪ `draft/assets/`) with provenance and derived kind, reachable as `1c asset list` and `GET /api/assets`, independent of any editing gesture |
| 2 | Structured Copy Editing — image selection | upgrade → `story-37a3921b` | 3 | 1 | An image region exposes which image goes here (closed list) + alt, written through the same command, transport, validator, atomicity and refusal shape as copy |

**Total: 2 items, 5 points (feature: 1, upgrade: 1).**

### Why two items and not more

The eleven UATs in `tests/req118-image-selection.test.ts` divide cleanly along a real seam,
not a convenient one: seven of them are properties of the *edit surface* (what a region
exposes, what a save does, what a refusal looks like) and two are properties of the *asset
store* (what a site has, reachable without a modal). Splitting further would produce
one-behaviour-per-story; merging would put a store listing inside a write-path story that
explicitly disclaims owning it.

## FC test coverage (binding evidence)

The dispatcher's `fc_tests` list was empty because it globs Python `test_UAT_FC_*.py`; this
project's FC tests are TypeScript. They are treated as binding evidence regardless — all
eleven map to a plan item:

| FC test | Item |
|---|---|
| `..._clicking_an_image_segment_offers_a_picker_of_the_sites_assets` | 2 (add 1, add 2) |
| `..._choosing_an_asset_updates_the_node_and_the_rerendered_page` | 2 (add 3) |
| `..._image_edits_run_the_same_whole_definition_validator_as_the_ai_surface` | 2 (modify AC-986) |
| `..._alt_text_is_editable_alongside_the_image_and_saved_in_the_same_diff` | 2 (add 3) |
| `..._an_asset_the_site_does_not_have_is_refused_and_nothing_is_applied` | 2 (modify AC-988) |
| `..._choosing_an_asset_bakes_nothing_and_changes_only_a_structured_field` | 2 (add 4) |
| `..._the_asset_listing_is_callable_independently_of_the_modal` | 1 |
| `..._the_modal_reads_its_picker_from_the_same_copy_transport` | 2 (add 1, modify AC-992) |
| `..._saving_an_image_choice_rerenders_both_channels` | 2 (add 3, modify AC-992) |
| `..._a_rejected_choice_comes_back_as_a_field_scoped_400` | 2 (modify AC-992) |
| `..._the_asset_store_is_reachable_without_opening_a_modal` | 1 |

## Step 3b — Intent scope vs implementation footprint

**Case 1 (matches intent)** — `edit.ts`, `index.ts`, `cli/edit.ts`, `cli/builder.ts`, `api.js`
are exactly the footprint the ticket describes. The absence of an `image set` command and an
`/api/image` route was verified against the diff, not taken on the ticket's word.

**Case 2 (explicit supersession, example-level only)** — `tests/req117-copy-editing.test.ts`
changed its "segment with nothing to edit" example from the image to the painted container.
The property under test (AC-981 / AC-1001: a region with nothing editable answers with an
empty list rather than failing) is **unchanged**; only the specimen changed, because REQ-118
gave the image fields. **No plan item.** Note for the story cycle: that test still carries the
`test_UAT_FC_REQ-117_*` name, so it belongs to REQ-117's reconciliation and should be renamed
there, not here — do not adopt it into a REQ-118 AC.

**Case 3 (undeclared footprint)** — none. `package.json` is the free-coding version bump
(0.1.24) required by the promotion gate; no matrix impact.

## Observations

- **The gesture story needs no upgrade, and that is a finding rather than an omission.**
  `apps/control-app/src/builder/editor.js` is absent from the diff: it passes `loaded.fields`
  straight to `mountFields`, which already supported `type: 'enum'`. The ticket wants this
  recorded as evidence that T3's loop is genuinely kind-agnostic. It is deliberately **not**
  turned into an AC on CAP-87, because no UAT in this commit drives editor.js with an image —
  the claim is evidenced by the *absence* of a diff, and an AC asserting it would be documenting
  behaviour the evidence does not exercise. Recorded here instead.
- **The enum widening is a narrowing.** Worth preserving in the story prose: an enum control can
  only return an option the derivation supplied, so DOC-2's structured-only invariant and AC-991
  are strengthened, not weakened. This is also why item 2 is an upgrade rather than a feature.
- **The current-handle-always-offered rule is the one non-obvious correctness detail.** A `<select>`
  whose options omit its own value renders with the first option selected, so an operator editing
  only alt text on an off-disk handle would silently swap the image. It earns its own AC.
- **The union listing replaces a partial truth rather than adding a second one.** The registry is
  empty on every real site in `storage/`, so a registry-only picker offers nothing. The alternative
  considered and rejected by the operator — a second "pickable" listing beside `editAssetList` —
  would have been exactly the duplication the project forbids.
- **Known upstream limitation, not a gap to close here.** `webui-fields`' enum control renders each
  option's text as the value verbatim, so the picker shows `/assets/hero.png` rather than a friendly
  name or thumbnail. Per DOC-8 §9.4 a component gap is closed upstream, never wrapped locally. No AC
  should assert a label or thumbnail.

## Verification performed during planning

- `npx vitest run tests/req118-image-selection.test.ts tests/req117-copy-editing.test.ts`
  → **2 files passed, 17 passed | 4 skipped**. The 4 skips are the origin half
  (`describe.skipIf(!WEBUI_INSTALLED)`); webui is not installed in this worktree, so
  the four origin UATs exist but did not execute here.
- **The ticket's "pre-existing failure" note does not reproduce on this branch.** The body claims
  `tests/reconciliation-edit-render-channel.test.ts:316` fails on a `data-fc-edit` regex.
  `npx vitest run tests/reconciliation-edit-render-channel.test.ts` → **13 passed**, and line 316
  is now inside `resolveAddress`, not the assertion described. It was resolved upstream before this
  cherry-pick. The note is stale; no plan item, and no reconciliation debt to carry.