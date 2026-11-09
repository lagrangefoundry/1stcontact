---
uid: report-65b200f9
id: REPORT-12028
type: report
title: 'Reconciliation Plan: free-coded (BUNDLE-44: BUG-80, REQ-217, BUG-83, BUG-76,
  REQ-228, BUG-84, REQ-229)'
created_by: xgd
created_at: '2026-11-09T21:52:17.681797+00:00'
updated_at: '2026-11-09T21:57:03.508834+00:00'
completed_at: null
last_field_updated: items
fields:
  report_kind: reconciliation_plan
  subject_uid: bundle-374f88d6
  anchor_uid: bundle-374f88d6
  items:
  - index: 1
    component: 'Assistant looking surface: stored-picture screenshot (BUG-80)'
    item_type: upgrade
    story_points: 2
    dependencies: []
    target_story_ids:
    - story-58b2cec4
    description: 'Extends existing story STORY-157 (story-58b2cec4). A stored picture
      of any ordinary size (e.g. a 12MB camera JPEG) can be screenshotted: the browser
      is navigated to a fixed-length shell and the picture''s base64 is delivered
      over the evaluation channel in bounded chunks, so there is no URL-length ceiling
      (~1.1MB before). Every browser interaction on the rasterise path is wrapped:
      a failure surfaces as ImageNotRenderableError carrying the driver''s diagnosis
      with data: URLs and long base64 runs stripped, under a hard character cap, so
      no failure on this path can put an unbounded tool result into the model''s context.
      A sanity size ceiling refuses before a browser is leased, and the stored media
      type is sanitised before interpolation into the img src.'
    justification: STORY-157 covers the `image` picture kind and its rasterisation
      via capture/screenshot.ts but describes a data:-wrapper navigation and has no
      AC bounding the size/content of a failed render's error text. BUG-80's commit
      8559fcd0 changes the delivery mechanism and adds the bound. Same capability
      bucket (capability-00e77e55, SeeSite surface); no new bucket.
    intent_delta_summary: Replace the data:-wrapper description in STORY-157's stored-picture
      technical context with script-delivered chunks over a constant shell; add the
      guarantee that a stored-picture render failure returns a bounded, URL-free error
      and that large ordinary photographs render.
    acceptance_criteria_changes:
      add:
      - 'A stored picture whose bytes far exceed the old data: URL limit (multi-MB
        camera JPEG) is screenshotted successfully; the navigated URL is a constant-length
        shell independent of picture size.'
      - 'Any browser failure while rasterising a stored picture is reported as ImageNotRenderableError
        whose text contains no data: URL and no long base64 run and is under a fixed
        character cap, so the tool result reaching the model is bounded.'
      - A picture above the sanity byte ceiling is refused, naming the size, before
        any browser is leased (budget not spent); a stored media type carrying characters
        outside a MIME token is sanitised before it reaches the img src.
      modify: []
      remove: []
    story_uid: story-58b2cec4
  - index: 2
    component: 'Image tools: a picture made in a turn appears in that turn (REQ-217)'
    item_type: upgrade
    story_points: 2
    dependencies: []
    target_story_ids:
    - story-39c992d3
    - story-b3de4571
    description: 'Extends existing stories STORY-172 (create_image) and STORY-107
      (write_image). Each tool''s result now includes the exact markdown image line
      to paste, composed by one composer (displayLine) from a host-supplied URL factory:
      HostDeps.assetUrl for a site asset, ImageSurfaceOptions.materialUrl for a generated
      material, both supplied by router.ts from scope.businessId via the new businessPath()
      helper. The l1 surface prose (surface_version 8 -> 9) tells the model to include
      the line verbatim so the picture appears in the assistant''s own turn and survives
      reload. Where no factory is supplied (the 1c CLI) no line is offered. builder.css
      bounds the picture in the chat pane.'
    justification: STORY-172 says a generated picture lands in the Library and STORY-107
      covers write_image, but neither says the picture is shown in the conversation
      that made it. The behaviour extends the existing image tools' results; no new
      capability bucket and no parallel tool.
    intent_delta_summary: Image-producing tools return a ready-to-paste markdown display
      line addressed under the business's own path; the assistant is instructed to
      include it; the chat pane shows it bounded; hosts without a display surface
      get no line.
    acceptance_criteria_changes:
      add:
      - create_image's result carries one markdown image line whose URL is the generated
        material's display URL under the current business's path; write_image's result
        carries one for the written site asset.
      - The served l1 surface declaration (version 9) instructs the model to include
        the returned line verbatim in its reply; a reloaded conversation still shows
        the picture because it is part of the assistant's turn text.
      - On a host that supplies no URL factory (1c CLI) neither tool offers a display
        line and both still succeed.
      - In the builder's chat pane an image in an assistant message is constrained
        to the pane's width.
      modify: []
      remove: []
    story_uid: null
  - index: 3
    component: 'Behavior modules: account-chrome v2, strict config/slots, slot error
      localisation (BUG-76)'
    item_type: upgrade
    story_points: 3
    dependencies: []
    target_story_ids:
    - story-179b8c06
    description: 'Extends existing story STORY-85 (story-179b8c06). account-chrome
      moves to contract version 2: labelMode ''visible''|''placeholder'' (contact-form
      semantics); declared label element is `label` (joins L1ControlTag); BehaviorControlSpec.invariantPresentation
      states the pinned presentation once and every reference surface (meta, KB projection)
      projects it, including that invariant controls cannot be bound from L1; `sent`
      and `error` become required slots replacing config.sentMessage and the hardcoded
      error string; the overlay holds form/sent/error and shows one, so a completed
      submit hides the form and shows the author''s sent card (any status, response
      never read), and a thrown fetch shows the error slot and leaves the form usable.
      validateBehaviorConfig/validateBehaviorSlots refuse undeclared keys at the write
      boundary, naming the key and the declared set, while an already-stored instance
      with a stray key still renders. chooseBranch localises shape-discriminated unions
      so an error in a behavior slot reports the same path/key as the identical node
      in the page tree; an unknown kind names the valid kinds; validateOrThrow reports
      every error. meta names POST /sign-in as a 1c-hosted site''s endpoint. 1stcontact
      draft migrated to v2.'
    justification: STORY-85 owns behavior modules and account-chrome (AC-2331, AC-2330
      pin account-chrome@1 with optional sent-message wording, four slots, and a 'message
      shown, field and submit disabled' completion state). BUG-76 explicitly changes
      that contract; it is a Case 2 supersession inside the same bucket (capability-ae9d65d6).
      No new bucket.
    intent_delta_summary: account-chrome contract v2 (labelMode, label element, required
      sent/error slots, one-of-three overlay); behaviour config/slots strict at the
      write boundary; behaviour-slot validation errors localised like page-tree errors
      and reported in full.
    acceptance_criteria_changes:
      add:
      - account-chrome v2 declares labelMode; 'placeholder' puts the prompt in the
        field, 'visible' leaves it to an L1 text run; a panel authored purely from
        config has a visible prompt; the invariant label is a `label` element and
        every reference surface states its pinned presentation and that it cannot
        be bound from L1.
      - Writing a behavior instance whose config or slots carry a key the contract
        does not declare is refused, naming the key and the declared set; an instance
        already stored with such a key still renders (isolation).
      - A validation error inside a behavior slot reports the same path and key as
        the identical node in the page's own l1 tree; an unknown node kind lists the
        valid kinds; validation reports every error, not only the first.
      modify:
      - 'acceptance_criterion-2996decb (AC-2331): account-chrome is catalogued as
        account-chrome@2; config carries no sent-message wording; required slots are
        signedOut, signedIn, businesses, dialog, sent and error; the L2 preset returns
        a valid subtree for each.'
      - 'acceptance_criterion-42cb53a1 (AC-2330): on a completed request (any HTTP
        status, response never read) the form is hidden and the author''s `sent` slot
        shown in its place; a network failure shows the `error` slot and leaves the
        form standing for retry; the no-script POST form behaviour is unchanged.'
      remove: []
    story_uid: null
  - index: 4
    component: 'Assistant library surface: one picture catalogue and place-on-site
      (REQ-228 halves B and C)'
    item_type: feature
    story_points: 3
    dependencies: []
    description: 'The consultant gets a `library` surface: list_library and get_library_item
      over the same listMaterial the client''s Library tab draws, filterable by kind,
      role, placement on this site and text, bounded by a default page that reports
      its total and whether it held rows back; it lists documents and fonts as well
      as pictures. place_on_site (separate PlaceOnSite group, separate grant from
      ReadLibrary) promotes a Library item through promoteToSiteAsset, returning the
      /assets/... handle to write into a picture element and the record''s description
      for alt text; a non-republishable item is refused with the declaration''s code.
      storedImageOf is the single projection naming a record for both the catalogue
      and the merged picture library, and resolveStoredImage remains the only name
      resolver. The grant travels with the surface; the surface is absent where there
      is no ticket store, so the 1c CLI is unchanged.'
    justification: No existing story gives the assistant a read view of the client's
      material catalogue or a placement verb. STORY-144 is the client's Library UI
      and STORY-143 the promotion gate itself; both are reused (the gate is not re-implemented)
      but neither describes an assistant tool surface. New capability on the assistant's
      toolbox, so feature.
    story_uid: null
  - index: 5
    component: 'Assistant conversation: read access to the business''s tickets (REQ-228
      half A)'
    item_type: upgrade
    story_points: 2
    dependencies: []
    target_story_ids:
    - story-a58a0974
    description: 'Extends existing story STORY-103 (story-a58a0974). sessionTicketSurface
      composes @lagrangefoundry/ai-ticketing''s TicketToolbox into the consultant''s
      toolbox through the extraSurfaces shape, granting ReadTickets only. The assistant
      can read the business''s ticket store including past chat tickets and their
      transcripts (operator decision 2026-09-11: reach into past conversations is
      intended). WriteTickets is withheld. The surface is absent where there is no
      ticket store (1c CLI).'
    justification: STORY-103 owns the per-site conversation and what the assistant
      may act on, and already describes the account's ticket store homing the transcript;
      it does not grant the assistant read access to that store. Extending what one
      conversation can read is an upgrade within capability-7e4714b7, not a new bucket.
    intent_delta_summary: The assistant may read (never write) the current business's
      tickets, including earlier conversations, on the Worker host only.
    acceptance_criteria_changes:
      add:
      - 'In a Worker session the consultant''s toolbox carries the tickets surface
        with ReadTickets granted: it can list and read the business''s tickets, including
        a prior chat ticket''s transcript; a write verb is refused/not offered because
        WriteTickets is withheld; tickets of another business are not reachable.'
      - Where no ticket store exists (1c CLI) no tickets surface is offered and the
        session opens normally.
      modify: []
      remove: []
    story_uid: null
  - index: 6
    component: Site-asset rights gate on the seed/push door (BUG-84)
    item_type: upgrade
    story_points: 2
    dependencies: []
    target_story_ids:
    - story-aacb7060
    description: 'Extends existing story STORY-143 (story-aacb7060). Bytes the system
      mirrored from a captured page may not enter a site''s assets by the seed/push
      door either. Identity is sha256 over every subresource under a capture bundle''s
      assets/ prefix (not only pictures), with no override. Enforced by one predicate
      over the ReferenceStore port with two adapters: `1c push` checks against the
      operator''s storage/references tree and refuses naming each matching asset;
      POST /api/import checks against the tenant''s R2 bundles and answers 403 (distinct
      from BUG-51''s 409) before createDraft, so a refused import leaves no draft
      behind.'
    justification: STORY-143 is the gate that keeps non-republishable material off
      a public site, but it reads the material record and covers only promoteToSiteAsset;
      mirrored capture bytes on the push/import path had no gate. Same capability
      bucket (capability-20802191) and same rule, extended to a second door; no new
      bucket.
    intent_delta_summary: The republish gate also covers capture-mirrored bytes arriving
      via 1c push and POST /api/import, identified by content hash, refused with no
      override.
    acceptance_criteria_changes:
      add:
      - '`1c push` of a draft whose assets include a file byte-identical (sha256)
        to any subresource mirrored into a reference bundle is refused before upload,
        naming each offending asset, even if renamed; drafts with no matching bytes
        push as before.'
      - POST /api/import whose bundle holds a capture-mirrored asset answers 403 with
        the offending names and creates no draft; a conflicting import still answers
        409 and is answerable by --force.
      modify: []
      remove: []
    story_uid: null
  - index: 7
    component: 'Image editing: the recipe reaches the published site (REQ-229)'
    item_type: upgrade
    story_points: 3
    dependencies:
    - 4
    - 6
    target_story_ids:
    - story-ed976856
    - story-aacb7060
    description: Extends existing stories STORY-178 and STORY-143. Promotion applies
      the material's own recipe on the way across the bucket boundary and records
      the asset name it wrote (fields.placed_as, which may differ from the requested
      name after freeAssetName). A recipe change (client modal or the assistant's
      edit_image, through one shared propagation function) re-promotes to the recorded
      name, replacing the bytes in place in one operation (editAssetReplace), so pages
      keep their reference and there is no broken window. A second promotion of an
      already-placed item overwrites at the recorded name rather than minting a new
      name. A recorded name the site no longer holds is reported per placement and
      never re-added.
    justification: STORY-178 explicitly lists 'Carrying the recipe into a published
      site (REQ-229)' as out of scope and its technical context records the gap as
      a known open contradiction; STORY-143 describes promotion as a byte copy of
      the original with no recorded name. REQ-229 is the declared resolution, so this
      is a Case 2 upgrade of both stories within existing buckets; no new bucket.
    intent_delta_summary: Remove REQ-229 from STORY-178's out-of-scope list and its
      open-contradiction note; promotion applies the recipe and records placed_as;
      recipe changes propagate in place; STORY-143's 'copy of the original' wording
      becomes 'copy of the current render'.
    acceptance_criteria_changes:
      add:
      - Promoting a Library picture with a recipe places the rendered (edited) bytes,
        not the original, and records the asset name actually written on the material.
      - Changing the recipe of a placed picture (from the Library modal or via edit_image)
        replaces the site asset's bytes at the recorded name in one operation; the
        page's reference is unchanged and the published site serves the edited picture
        after publish.
      - Promoting an already-placed picture again overwrites at its recorded name
        and does not mint a suffixed duplicate.
      - If the recorded asset name is no longer on the site, the recipe change reports
        that placement as missing and does not re-add it.
      modify: []
      remove: []
    story_uid: null
  - index: 8
    component: Turn reminder channel and marked-points hover (BUG-83 product residue)
    item_type: upgrade
    story_points: 1
    dependencies: []
    target_story_ids:
    - story-3cf3d57b
    - story-44d0a572
    description: Extends existing stories STORY-149 and STORY-174 with the two product-visible
      behaviours inside BUG-83's suite repair. (a) The per-turn site-change reminder
      reaches the model appended to the tail of the last user message, not folded
      into the system field, so no cache marker lands on a block guaranteed to change
      next turn. (b) The marked-points overlay dims the hovered segment without restating
      the renderer's region stamp in its own stylesheet (no !important), and hovering
      still selects a stamped segment.
    justification: AC-2364 (STORY-149) asserts what the model is sent but not on which
      channel the reminder rides; STORY-174 owns the overlay. Both are in-place refinements
      of existing stories. The rest of BUG-83 (shared model-double channel readers,
      the shared rulesOf helper, freshness probes, narrowed REQ-223 guard, KB scope
      prose) is test infrastructure and is not a story.
    intent_delta_summary: AC-2364 states the reminder is carried at the tail of the
      last user message; STORY-174 gains the hover-dimming criterion.
    acceptance_criteria_changes:
      add:
      - In marked-points mode, hovering a stamped segment dims it and clicking still
        selects it; the overlay stylesheet carries no copy of the renderer's region-stamp
        rule.
      modify:
      - 'acceptance_criterion-078e755f (AC-2364): the turn''s site-change reminder
        is present in what the model is sent, carried at the tail of the last user
        message (both wire shapes: string content and content blocks) rather than
        in the system field.'
      remove: []
    story_uid: null
---

# Reconciliation Plan

**Mode**: commits
**Source**: free-coded commits of BUNDLE-44 (bundle-374f88d6): 8559fcd0, 95115741, 486810a8, 0d792658, c02613b4, 3ef2b6ed, a914d06a, 67eb331c, 3b00fd6a, 47a30201, bcdf2789

## Behavior Inventory

```yaml
behavior_inventory:
  source: commits
  features:
    - name: stored-picture screenshot (BUG-80, 8559fcd0)
      entry_files: [tools/generate/src/cli/capture/screenshot.ts]
      behaviors:
        - constant-length shell URL; picture base64 delivered by evaluate in bounded chunks
        - all browser calls wrapped -> ImageNotRenderableError, data: URLs and base64 runs stripped, hard char cap
        - sanity byte ceiling before lease; media type sanitised before src interpolation
    - name: picture in the conversation (REQ-217, 95115741)
      entry_files: [apps/control-app/src/imagegen.ts, router.ts, scope.ts, builder.css, tools/generate/src/cli/ai/toolbox-core.ts, host-core.ts, l1-surface.json]
      behaviors:
        - write_image/create_image return a markdown display line via displayLine()
        - URL factories HostDeps.assetUrl / ImageSurfaceOptions.materialUrl from scope.businessId (businessPath())
        - surface prose v9 tells the model to paste it; absent factory -> no line (1c CLI)
        - chat pane bounds images
    - name: suite repair (BUG-83, 486810a8)
      behaviors:
        - reminder rides tail of last user message (test double reads it there)
        - marked-points overlay hover without restating region stamp
        - otherwise test infrastructure only
    - name: account-chrome v2 + strict behavior validation (BUG-76, c02613b4)
      entry_files: [packages/framework/src/modules/account-chrome/*, modules/behavior.ts, site-schema/src/issues.ts, cli/edit.ts, cli/kb-projection.ts]
      behaviors:
        - labelMode, label element, invariantPresentation projected
        - required sent/error slots; overlay shows one of form/sent/error
        - undeclared config/slot keys refused at write; stored stray keys still render
        - slot error localisation, unknown-kind listing, all errors reported
    - name: assistant library + tickets surfaces (REQ-228, a914d06a)
      entry_files: [apps/control-app/src/ai.ts, library.ts, material.ts, tools/generate/src/cli/ai/library-core.ts, library-surface.json, assets.ts]
      behaviors:
        - list_library/get_library_item over listMaterial, filters, bounded page with total
        - place_on_site over promoteToSiteAsset, separate grant
        - tickets surface with ReadTickets only; absent without ticket store
    - name: mirrored-asset gate (BUG-84, 3b00fd6a)
      entry_files: [tools/generate/src/store/asset-rights.ts, cli/push.ts, apps/control-app/src/router.ts]
      behaviors:
        - sha256 match against capture bundles' assets/ -> refuse; no override
        - 1c push refuses; POST /api/import 403 before createDraft
    - name: recipe reaches the site (REQ-229, 47a30201)
      entry_files: [apps/control-app/src/material.ts, image-edit.ts, library.ts, router.ts, tickets.ts, cli/edit.ts]
      behaviors:
        - promotion applies recipe and records placed_as
        - recipe change re-promotes in place (editAssetReplace); edit_image shares propagation
        - repeat promotion overwrites; missing placement reported, not re-added
    - name: version bumps (0d792658, 3ef2b6ed, 67eb331c, bcdf2789)
      behaviors: [package.json version only - no capability]
```

## Coverage Map

```yaml
coverage_map:
  - feature: stored-picture screenshot
    status: partial
    existing_stories: [STORY-157 story-58b2cec4]
    gaps: [bounded failure text, large-picture delivery, pre-lease ceiling]
  - feature: picture in the conversation
    status: partial
    existing_stories: [STORY-172 story-39c992d3, STORY-107 story-b3de4571]
    gaps: [display line in tool result, surface prose, chat-pane bounding]
  - feature: account-chrome v2 + strict validation
    status: partial (Case 2 supersession)
    existing_stories: [STORY-85 story-179b8c06]
    existing_acs: [AC-2331 acceptance_criterion-2996decb, AC-2330 acceptance_criterion-42cb53a1]
    gaps: [labelMode/label, sent/error slots, strict keys, slot error localisation]
  - feature: assistant library catalogue + place_on_site
    status: uncovered
    notes: [reuses STORY-143 gate and STORY-144 listMaterial; no assistant-surface story exists]
  - feature: assistant reads tickets
    status: partial
    existing_stories: [STORY-103 story-a58a0974]
  - feature: mirrored-asset gate
    status: partial
    existing_stories: [STORY-143 story-aacb7060]
  - feature: recipe reaches the site
    status: partial (STORY-178 explicitly deferred it to REQ-229)
    existing_stories: [STORY-178 story-ed976856, STORY-143 story-aacb7060]
  - feature: BUG-83 product residue
    status: partial
    existing_stories: [STORY-149 story-3cf3d57b, STORY-174 story-44d0a572]
    existing_acs: [AC-2364 acceptance_criterion-078e755f]
```

## Plan Items

| # | Component | Type | Points | Deps | Description |
|---|-----------|------|--------|------|-------------|
| 1 | Stored-picture screenshot (BUG-80) | upgrade STORY-157 | 2 | - | script-delivered bytes, bounded error text |
| 2 | Picture in the turn (REQ-217) | upgrade STORY-172, STORY-107 | 2 | - | display line from image tools |
| 3 | account-chrome v2 + strict behavior validation (BUG-76) | upgrade STORY-85 | 3 | - | modifies AC-2331, AC-2330 |
| 4 | Assistant library catalogue + place_on_site (REQ-228 B/C) | feature | 3 | - | new assistant surface |
| 5 | Assistant reads tickets (REQ-228 A) | upgrade STORY-103 | 2 | - | ReadTickets only |
| 6 | Mirrored-asset gate on push/import (BUG-84) | upgrade STORY-143 | 2 | - | sha256 gate, 403 |
| 7 | Recipe reaches the site (REQ-229) | upgrade STORY-178, STORY-143 | 3 | 4, 6 | placed_as, in-place replace |
| 8 | Reminder channel + marked-points hover (BUG-83) | upgrade STORY-149, STORY-174 | 1 | - | modifies AC-2364 |

Total: 8 items (1 feature, 7 upgrade), 18 points.

## FC test mapping

- test_UAT_FC_BUG-80_stored_picture_delivery -> item 1 (and REQ-218 suite edits)
- test_UAT_FC_REQ-217_a_picture_in_the_conversation{,.workers} -> item 2
- test_UAT_FC_BUG-76_{account_chrome_contract,undeclared_keys,slot_error_localisation,sign_in_confirmation} -> item 3
- test_UAT_FC_REQ-228_catalogue_surface, test_UAT_FC_REQ-228_one_catalogue.workers -> item 4; test_UAT_FC_REQ-228_assistant_can_read_the_tickets.workers -> item 5
- test_UAT_FC_BUG-84_mirrored_assets, test_UAT_FC_BUG-84_import_rights_gate.workers -> item 6
- test_UAT_FC_REQ-229_recipe_reaches_the_site.workers -> item 7
- test_UAT_FC_BUG-83_suite_is_evidence_again -> item 8 for the hover and reminder-channel cases; its selector-layout/rulesOf and channel-reader-absence cases test test-support helpers and should be renamed as non-UAT support tests (or folded into the item 8 UATs) rather than given ACs.

## Observations

- Version-bump commits (0d792658, 3ef2b6ed, 67eb331c, bcdf2789) carry no behaviour.
- BUG-83 is overwhelmingly test infrastructure (shared model double, css-rules helper, freshness probes for /api/material/{changes,name,recipe}, narrowed REQ-223 routing guard, KB scope prose). Only the reminder channel and overlay hover are product-visible, captured in item 8. ledger-core.ts change is a 4-line tweak with no separate behaviour identified; flagged for the item 8 story writer to confirm.
- Case 2 supersessions: BUG-76 rewrites AC-2331/AC-2330 (modified, not removed - most of each still holds). REQ-229 lifts STORY-178's explicit out-of-scope entry and open-contradiction note.
- REQ-228's operator decision (2026-09-11, in the commit message) that reading past conversations is intended and WriteTickets is withheld is recorded as intent for item 5; not re-litigated.
- Item 7 depends on 4 (place_on_site promotes through the same function that now applies the recipe) and 6 (both edit STORY-143).
- Ticket semantic search failed in this sandbox (embeddings cache not writable); coverage was established by reading the main ticket store's story and AC files directly.