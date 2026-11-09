---
uid: report-a00b3f19
id: REPORT-11673
type: report
title: 'Reconciliation Plan: free-coded BUG-79 (View/Edit flips in place)'
created_by: xgd
created_at: '2026-11-09T03:08:27.020857+00:00'
updated_at: '2026-11-09T03:08:27.020857+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_plan
  subject_uid: bug-00de1faf
  anchor_uid: bug-00de1faf
  items:
  - index: 1
    component: Builder Workspace — Display Panel (apps/control-app/src/builder/panel.js,
      app.js)
    item_type: upgrade
    story_points: 3
    dependencies: []
    description: 'Extends existing story story-e674c60a (STORY-99, Builder Workspace).
      The display panel now holds one iframe per document mode, created at mode registration
      and kept for the panel''s lifetime; a View/Edit switch only changes which frame
      is visible (the idle frame is hidden by visibility via the .builder-panel__pane
      / .builder-panel__frame classes, never display:none/hidden), so neither channel
      navigates and each keeps its document and scroll offset. Once the visible frame
      has loaded, the idle channel is primed (navigated) if it points at a different
      URL, so the first flip is in place too; a merely stale frame is not primed.
      A frame navigates only when it was never pointed anywhere, the site changed
      (setSite invalidates every frame), an explicit refresh() (business switch; invalidates
      every frame), or a write: panel.reloadDocument() reloads the shown document
      in place (its own location.reload, so a followed link is kept) and marks every
      other frame stale, so the next reveal of one fetches rather than serving the
      pre-write page. The panel emits its `document` event both on load of the shown
      frame and when an already-current frame is revealed, and the builder binds the
      edit bridge, Marked Points and the REQ-215 carry to the panel''s event rather
      than one frame''s. panel.frame is a getter for the frame on screen.'
    justification: 'STORY-99 already owns the display panel, mode switching (AC-968)
      and the REQ-215 View/Edit carry (AC-2496, AC-2497), so this extends an existing
      capability bucket (CAP-85 Builder Workspace) rather than introducing one. The
      existing ACs pin the superseded single-frame model: AC-968 says the switch is
      ''a change of source'' on one display surface and its verification asserts the
      same display surface element across switches; AC-2496 describes the pane ''replacing
      its document'' and the arriving document being re-scrolled. BUG-79''s body explicitly
      says ''The fix is not a better restore. It is not to navigate.'' The FC test
      tests/test_UAT_FC_BUG-79_flip_in_place.test.ts (6 UATs) has no AC yet and must
      be mapped to ACs here.'
    story_uid: null
    target_story_ids:
    - story-e674c60a
    acceptance_criteria_changes:
      add:
      - 'A View/Edit switch navigates neither channel: each document mode has its
        own frame, and after switching away and back the same frame holds the same
        document object and the same src (FC: a_mode_switch_does_not_navigate_either_channel)'
      - 'The frame left behind stays connected and laid out, hidden by class/visibility
        and never by the hidden attribute or display:none, so it keeps its scroll
        offset; only the shown frame carries .builder-panel__frame (FC: the_channel_left_behind_stays_laid_out)'
      - 'Once the visible channel has loaded, the channel the operator has not opened
        is primed behind it, so the first flip shows rather than fetches; a frame
        that is only stale (same URL, newer content) is not primed (FC: the_idle_channel_is_primed_so_the_first_flip_is_in_place_too)'
      - 'Revealing a frame that already holds a current document announces it through
        the panel''s `document` event (no load fires), and the edit bridge, Marked
        Points and the carried page state bind on the panel''s event, not on one frame''s
        (FC: the_revealed_document_is_announced)'
      - 'A write (palette, assistant, segment save) reloads the displayed document
        in place via panel.reloadDocument() and marks every other frame out of date,
        so the next flip to one of them fetches instead of serving the pre-write render,
        and no hidden frame is re-rendered at write time (FC: a_write_reloads_the_shown_page_and_stales_the_others)'
      - 'A change of site, or an explicit refresh() such as a business switch, invalidates
        every channel: the shown frame re-renders at once and each idle frame re-renders
        when next shown (FC: a_change_of_site_invalidates_every_channel)'
      modify:
      - 'AC-968: restate as ''Switching modes changes what is displayed without rebuilding
        the pane'' under the frame-per-mode model — the pane element and each channel''s
        frame are the same live, attached elements before and after switching and
        back; the displayed source (getSrc) still changes with each switch; a mount
        mode hides every frame by class rather than by `hidden`'
      - 'AC-2496: keep the outcome (same page, same scroll offset across View/Edit)
        but drop the ''pane replaces its document then re-scrolls it'' mechanism;
        the offset is held because neither document is navigated, and the carried
        state is applied to an already laid-out document'
      remove: []
    intent_delta_summary: STORY-99's display-panel description moves from 'one frame,
      a mode is a src on it' to 'one frame per document mode, kept alive; a switch
      swaps visibility'. Add ACs for no-navigation-on-switch, idle frame stays laid
      out, priming of the idle channel, document announcement on reveal, write-reloads-shown-and-stales-others,
      and site/refresh invalidating every channel; rewrite AC-968 and AC-2496 so they
      no longer describe a navigation on mode switch.
---

# Reconciliation Plan

**Mode**: commits
**Source**: free-coded commits 582c5e2739 (builder: flip View/Edit in place), a160f170f7 (version bump)
**Anchor / subject**: bug-00de1faf (BUG-79)

## Intent (Step 0)

Ladder level 1 settled it: the BUG-79 body, the commit message and the code agree on every point. No conflicts, so transcripts were not read. The operator's framing: "The fix is not a better restore. It is not to navigate." The scope is the builder display panel and its call sites in app.js; tests are adjusted only where they asserted the single-frame model.

## Behavior Inventory

```yaml
behavior_inventory:
  source: "commits: 582c5e2739990aaabe224763d9fb945a8dd67fc7, a160f170f7fa51f2d96d17f3826671b5567422c1"
  entry_files:
    - apps/control-app/src/builder/panel.js
    - apps/control-app/src/builder/app.js
    - apps/control-app/src/builder/builder.css
  features:
    - name: "Display panel: frame per document mode"
      entry_point: "createDisplayPanel / registerMode / setMode / show"
      behaviors:
        - "registerMode creates an iframe per src-mode at registration and keeps it"
        - "setMode swaps the .builder-panel__frame class to the target frame; invalidates nothing; navigates only if the frame is stale or its src differs"
        - "idle frames keep .builder-panel__pane, stay connected, are hidden by visibility (CSS), never display/hidden"
        - "mount modes hide every frame via display(null)"
        - "panel.frame is a getter for the shown frame (null before any show)"
    - name: "Priming the idle channel"
      entry_point: "prime() on each frame load"
      behaviors:
        - "after the shown frame loads, every other src-mode frame whose src differs from what its mode resolves to is navigated"
        - "a frame that is only stale is not primed"
    - name: "Document announcement"
      entry_point: "emit('document') in the load handler and in show()"
      behaviors:
        - "document fires on load of the shown frame and when an already-current frame is revealed"
        - "app.js binds rebind (edit bridge, Marked Points, REQ-215 carry) to panel.on('document') instead of one frame's load"
    - name: "Invalidation and reload"
      entry_point: "setSite / refresh / reloadDocument"
      behaviors:
        - "setSite and refresh() invalidate every frame and re-show"
        - "reloadDocument() marks the other frames stale, reloads the shown one via its own location.reload (falls back to re-pointing src)"
        - "palette onChanged, assistant onSiteChanged and editor onSaved all call panel.reloadDocument()"
    - name: "Version bump"
      behaviors: ["package.json version bump; no behaviour"]
```

## Coverage Map

```yaml
coverage_map:
  - feature: "Display panel: frame per document mode"
    status: partial
    existing_stories: [story-e674c60a]
    existing_acs: [AC-968, AC-2496]
    gaps:
      - "AC-968 describes the switch as a change of source on one display surface; it must become per-channel frame identity"
      - "AC-2496 describes a navigate-then-restore mechanism; the offset is now held because nothing navigates"
      - "no AC says that a switch does not navigate, or that the idle frame stays laid out"
  - feature: "Priming the idle channel"
    status: uncovered (within STORY-99)
    existing_stories: [story-e674c60a]
    gaps: ["new AC"]
  - feature: "Document announcement"
    status: partial
    existing_stories: [story-e674c60a]
    existing_acs: [AC-2497]
    gaps: ["announcement on reveal, and binding on the panel's event, are not stated"]
  - feature: "Invalidation and reload"
    status: partial
    existing_stories: [story-e674c60a]
    existing_acs: [AC-2497, AC-2145]
    gaps: ["a write staling the idle frames, and a site change invalidating every channel, are not stated"]
  - feature: "Version bump"
    status: covered (no behaviour)
```

## Plan Items

| # | Component | Type | Points | Deps | Description |
|---|-----------|------|--------|------|-------------|
| 1 | Builder Workspace: Display Panel | upgrade (STORY-99) | 3 | - | Frame per document mode with an in-place flip: priming, announcement on reveal, reloadDocument staling the idle frames, and site/refresh invalidation; rewrite AC-968 and AC-2496 |

## Reconciliation Decisions

- One upgrade item, not a feature: every behaviour here refines the display panel and the View/Edit carry that STORY-99 already owns. The 6 FC UATs are one coherent property (the flip does not navigate) with its consequences, so they become ACs on one story.
- No AC is removed. AC-968 and AC-2496 keep the outcomes they exist for (the pane is never rebuilt; the page and scroll survive the switch). Only their stated mechanism is superseded, so both are modified rather than superseded.
- AC-2497 (panel stays open through the post-save reload) still holds as written: the save still reloads the displayed document, now via reloadDocument. No change.
- AC-2145 (a business switch moves the displayed frame) still holds; refresh() now also invalidates the idle frames, which the new invalidation AC covers.
- AC-971 (open in a new tab targets the displayed document) and AC-975 (viewport fill, measured on .builder-panel__frame) are unaffected because .builder-panel__frame still names the shown frame.

## Observations

- FC test evidence: tests/test_UAT_FC_BUG-79_flip_in_place.test.ts (TypeScript, so the .py-only FC scan returned empty) holds 6 FC UATs. Each maps to one added AC above, which check_fc_orphans needs.
- Adjusted tests: req115-builder-composition, reconciliation-builder-workspace-chrome (AC-968), reconciliation-palette-popup-surface (AC-1249) and test_UAT_FC_REQ-215_panel_control. These changes only re-address the shown frame by selector. AC-1249 (palette popup, another story) needs no matrix change.
- Case 3 check: the code touches nothing outside the builder panel and its three reload call sites in app.js, and all of that is within BUG-79's declared scope.
- Semantic ticket search could not run in this sandbox (embedding cache write denied), so reuse was established by reading CAP-85's story list and STORY-99's ACs directly.
