---
uid: report-babd93da
id: REPORT-11432
type: report
title: 'Reconciliation Plan: free-coded (BUNDLE-41: REQ-210, REQ-211, REQ-212, REQ-213,
  BUG-67, BUG-69, BUG-70, BUG-71, BUG-72)'
created_by: xgd
created_at: '2026-11-08T12:42:54.689461+00:00'
updated_at: '2026-11-08T13:56:43.862044+00:00'
completed_at: null
last_field_updated: items
fields:
  report_kind: reconciliation_plan
  subject_uid: bundle-0d00566a
  anchor_uid: bundle-0d00566a
  items:
  - index: 1
    component: 'Builder Edit Preview: Marked Points'
    item_type: feature
    story_points: 3
    dependencies: []
    description: 'REQ-210 + BUG-72. In edit mode only, a Mark Points toggle reassigns
      the click on the preview: a left click places a high-contrast X with a lettered
      label (Point A, B, ...; letters reused after deletion) and puts a pill in the
      composer. The label fades when the pointer leaves an asymmetric reach (200px
      to the right, 56px elsewhere; resting on the mark''s own chrome never counts
      as leaving) or when the next point lands, never on a timer, and comes back on
      hover. The label carries x (delete) and + (insert). The cross is two bars centred
      geometrically, not a font glyph, with a 22px hit area. On send, chat.js expandPrompt
      expands each pill into SVG user space, node-relative, and document coordinates
      with the viewport width, the named anchor lines it is near (nearestAnchors from
      site-schema anchors.ts, with distances, never snapped), and the render it was
      taken against. The bubble keeps the pill and the turn carries the expansion.
      Points clear on send and marks grey out until the next render. The overlay is
      capture-phase and injected into the preview: the edit bridge is not modified
      and published renders are unaffected. marked-points.ts, anchors.ts and measure-svg.ts
      are served as framework bridges.'
    justification: 'No story covers a pointing gesture on the preview or a pointing
      channel into the assistant turn. STORY-101 (click-to-edit copy) and STORY-173
      (measure_drawing) are adjacent, but neither describes placing points or expanding
      them into a message. Evidence: tests/test_UAT_FC_REQ-210_marked_points.test.ts,
      tests/test_UAT_FC_BUG-72_marked_point_chrome.test.ts.'
    story_uid: story-44d0a572
  - index: 2
    component: 'Framework Substrate: L1 Modals (dialog role + action verb)'
    item_type: feature
    story_points: 3
    dependencies: []
    description: 'REQ-212. Two new L1 node roles. `dialog` on box/container presents
      the subtree as an overlay and carries only scrim, placement, and two dismissals
      (Escape and scrim click), both on by default. `action` on box/container/text
      is a closed two-verb set (`opens`/`closes`) naming a panel id. There are four
      validator rules: a panel declares an id; an action names exactly one verb; the
      target exists and carries `dialog`; and link and action are mutually exclusive.
      The renderer retags action nodes to <button type=button> and wraps a panel in
      a covering shell. One vetted script, carrying no instance data and emitted only
      when the document has a modal, owns focus in and back, the Tab trap, Escape,
      the scrim click and scroll lock. Every overlay rule is gated on a marker that
      only this script sets, so with no script the panel lays out in flow and open.
      The edit render ships no script. A panel''s `reveal` is not emitted. REF-l1
      projects the new roles and rules (BUG-48 reference-covers-source test extended).'
    justification: 'Before this commit, L1 could not express a modal at all; the only
      route was a per-flow behaviour module. STORY-91 (link role) and STORY-90 (interaction/entrance)
      set the precedent but cover navigation and states, not an overlay or disclosure
      verb. This is a new capability bucket inside the L1 substrate. Evidence: tests/test_UAT_FC_REQ-212_l1_modals.test.ts,
      BUG-48 test additions.'
    story_uid: story-e214a00d
  - index: 3
    component: 'Framework Substrate: Multi-Variate Text Runs'
    item_type: feature
    story_points: 3
    dependencies: []
    description: 'REQ-211. An L1 text node''s `text` is a plain string or an ordered
      list of {text, axes?} runs. Run axes are a narrow relative subset: color, sizeScale,
      fontWeight, fontStyle, baselineShiftEm. A one-element run array is refused,
      and the envelope bounds runSizeScale and runBaselineShiftEm. The renderer emits
      one span per varying run and none for a run that varies in nothing. Capture
      records inline-flow membership (a <br> or blockified child ends a flow). The
      fold rejoins only flows that vary, in the flow root''s rect, and inline-runs.ts
      is the single shared decision, so the fidelity oracle and round-trip rejoin
      the same flows. The editor exposes text1..textN as plain strings while per-run
      axes stay AI-only.'
    justification: 'No story covers styled runs within one string. The behaviour spans
      schema (STORY-83), fold (STORY-84), values-diff (STORY-75) and edit exposure
      (STORY-100), and no single one of those owns it. It is a new expressive capability,
      not a tweak to any of them. Evidence: tests/test_UAT_FC_REQ-211_multi_variate_text.test.ts,
      tests/test_UAT_FC_REQ-211_runs_survive_a_capture.test.ts.'
    story_uid: story-1e340c9a
  - index: 4
    component: Material Library Surface
    item_type: upgrade
    story_points: 2
    dependencies: []
    description: 'Extends existing story STORY-144. REQ-213: the client can correct
      an UPLOADED material''s role (Site asset / Background information) through POST
      /api/material/role. Fetched and captured material is refused 403 and the surface
      offers no control for it. `republishable` is derived server-side from the role
      by classify''s rule and never taken from the caller. Widening to a site asset
      places the bytes through the shared placeOnSite, which now takes the three facts
      it reads. Narrowing is refused 409 once the bytes are placed. The site slug
      is resolved from the tenant store, and zero or several sites means do not place.
      Every other rights row stays read-only.'
    justification: 'STORY-144 owns the Library detail and its rights record. AC-1717
      and AC-1718 currently assert that nothing but the description is editable, and
      REQ-213 deliberately narrows that claim. This changes an existing surface, so
      no new capability bucket is introduced. Evidence: tests/test_UAT_FC_REQ-213_library_role_field.test.ts,
      tests/test_UAT_FC_REQ-213_material_role.workers.test.ts, REQ-161 library test
      change, route-table probe gains /api/material/role.'
    story_uid: STORY-144
    target_story_ids:
    - STORY-144
    acceptance_criteria_changes:
      add:
      - An uploaded material's role can be corrected between site asset and background
        information, and republishable is derived from the role server-side, never
        taken from the request
      - A role correction on fetched or captured material is refused 403 and the surface
        offers no role control for it
      - Widening to a site asset places the bytes on the business's site through the
        same placement path the upload uses; zero or several sites means not placed,
        not a failure
      - Narrowing a placed material's role is refused 409 and changes nothing
      modify:
      - 'AC-1717: the rights record is read-only except the role of uploaded material;
        no control lets a client assert rights'
      - 'AC-1718: the description and, for uploads only, the role are the editable
        fields'
      remove: []
    intent_delta_summary: Role becomes the second editable field in the Library, for
      uploads only and gated on origin. Placement follows when the role is widened,
      and narrowing is refused once the bytes are placed.
  - index: 5
    component: Assistant Pane
    item_type: upgrade
    story_points: 1
    dependencies: []
    description: 'Extends existing story STORY-104. BUG-69: the chat pane is keyed
      on the business-scoped conversation (app.js scopes the session id by the selected
      business, as api.js scopes URLs), not on the bare `site-<slug>` id. Switching
      between two businesses whose sites share a slug therefore shows the new business''s
      transcript. The wire id is unchanged, and the composer''s unsent draft stays
      with the business it was typed under.'
    justification: 'STORY-104 already covers the pane following the site (AC-1064,
      AC-1067, AC-1070). This fixes the case where the pane failed to follow a business
      switch, so it is the same capability with no new bucket. Evidence: tests/test_UAT_FC_BUG-69_chat_follows_the_business.test.ts.'
    story_uid: null
    target_story_ids:
    - STORY-104
    acceptance_criteria_changes:
      add:
      - Switching business shows the newly selected business's conversation even when
        both businesses' sites share a slug, and an unsent draft stays with the business
        it was typed under
      modify: []
      remove: []
    intent_delta_summary: The pane's identity is the business plus the session, not
      the session id alone.
  - index: 6
    component: 'Builder Workspace: Chrome & Served Artifacts'
    item_type: upgrade
    story_points: 2
    dependencies: []
    description: 'Extends existing story STORY-99. BUG-70: every text-bearing builder
      control resolves to the chrome font-size token. This covers controls declaring
      only `font: inherit` and toolbar buttons and links that had no font rule. The
      empty detail pane of the Library and Contacts renders inside a styled .builder-empty
      box. Controls that paint no text, and the Marked Points overlay, are deliberately
      exempt. BUG-71: `1c assets` emits the transitive import closure of each framework
      bridge entry, with specifiers rewritten to served URLs and resolved through
      the compiler scanner. Before swapping the staged tree in, it walks from /builder/main.js
      and refuses a tree with any dangling import or stylesheet, naming each edge
      and its importer and leaving the previous dist-assets in place.'
    justification: 'STORY-99 owns the workspace chrome (AC-2232 control font token)
      and its served build artifacts (AC-1400 framework bridges as build artifacts).
      Both fixes tighten existing ACs and introduce no new bucket. Evidence: tests/test_UAT_FC_BUG-70_builder_text_is_styled.test.ts,
      tests/test_UAT_FC_BUG-71_framework_import_graph.test.ts.'
    story_uid: null
    target_story_ids:
    - STORY-99
    acceptance_criteria_changes:
      add:
      - The builder's empty detail state is one styled box shared by the Library and
        Contacts
      - The asset build emits each framework bridge's full import graph and refuses
        to ship a tree with an unresolvable import or stylesheet, naming every dangling
        edge and keeping the previous served tree
      modify:
      - 'AC-2232: every text-bearing control in the builder (buttons, filters, selectors,
        toolbar links) resolves to the control font-size token, checked through the
        real mounted ancestry'
      remove: []
    intent_delta_summary: The typography rule widens from named controls to every
      text-bearing control. The served-bridge guarantee gains a verified import graph.
  - index: 7
    component: Reference Capture
    item_type: upgrade
    story_points: 2
    dependencies: []
    description: 'Extends existing story STORY-159. BUG-67 Defect B: a host-resolution
      failure (isHostResolutionFailure) costs one navigation, not the retry budget.
      After one, a single alternate host (www. added or stripped; none for IP literals,
      localhost or single-label names) is tried, but only after it passes classifyUrl.
      A timeout never earns an alternate. The corrected host carries through all four
      navigation passes. The failure message tells the caller what to do instead of
      passing through the raw Chromium code.'
    justification: 'STORY-159 owns capture_site and its egress guard (AC-2047, AC-2048).
      This refines retry and host behaviour within that capability and introduces
      no new bucket. Evidence: tests/test_UAT_FC_BUG-67_capture_host_candidates.test.ts.'
    story_uid: null
    target_story_ids:
    - STORY-159
    acceptance_criteria_changes:
      add:
      - A host that does not resolve is not retried. Exactly one www-alternate is
        tried, guard-checked first and never invented for IP literals, localhost or
        single-label names; a timeout earns no alternate
      - A capture that succeeds on the alternate host uses it for every subsequent
        pass, and an unresolvable host is reported in words that say what the caller
        can do
      modify: []
      remove: []
    intent_delta_summary: Capture tells an unresolvable host apart from an unreachable
      one, and corrects the hostname instead of reporting the site as dead.
  - index: 8
    component: 'AI Site Assistant: Backend Settings'
    item_type: upgrade
    story_points: 1
    dependencies: []
    description: 'Extends existing story STORY-103. BUG-67: the model and reply ceiling
      come from the project''s ai/backends.json (currently Opus 5, max_tokens 64000).
      host-core.ts installs it through the framework''s configureBackends before registerBackend,
      by static import, so the CLI and workerd hosts send the same settings. The request
      the backend builds carries exactly the model and max_tokens the document declares.'
    justification: 'STORY-103 owns the conversation host and already pins configuration-file-driven
      priming (AC-2374). Model selection and the ceiling are the same host''s configuration,
      so no new bucket is introduced. Evidence: tests/test_UAT_FC_BUG-67_backend_settings.test.ts.'
    story_uid: null
    target_story_ids:
    - STORY-103
    acceptance_criteria_changes:
      add:
      - Every model request the assistant host sends carries the model and max_tokens
        declared in the project's backend configuration document, identically on the
        CLI and deployed hosts, and editing that document alone changes the request
      modify: []
      remove: []
    intent_delta_summary: The model and reply ceiling are the project's configured
      decision, not framework defaults.
---

# Reconciliation Plan

**Mode**: commits
**Source**: free-coded commits on BUNDLE-41 (REQ-210, REQ-211, REQ-212, REQ-213, BUG-67, BUG-69, BUG-70, BUG-71, BUG-72)

## Behavior Inventory

```yaml
features:
  - name: Marked Points (REQ-210, BUG-72)
    entry_files: [apps/control-app/src/builder/points.js, packages/framework/src/l1/marked-points.ts, packages/site-schema/src/anchors.ts, apps/control-app/src/builder/chat.js]
    behaviors: [edit-mode toggle, lettered marks with label reuse, pointer-reach fade (asymmetric), x/+ controls, geometric cross, composer pill, send-time expansion to SVG/node/document frames + near anchors + render id, clear on send and grey until rerender]
  - name: L1 modals (REQ-212)
    entry_files: [packages/site-schema/src/l1/schema.ts, validate.ts, packages/framework/src/l1/render.ts]
    behaviors: [dialog role, action opens/closes, 4 structural rules, button retag, shell wrap, vetted script (focus/trap/escape/scrim/scroll-lock), script-gated overlay CSS, no script in edit render, reveal suppressed in panel, REF-l1 projection]
  - name: Text runs (REQ-211)
    entry_files: [packages/site-schema/src/l1/schema.ts, text.ts, edit.ts, packages/framework/src/l1/render.ts, tools/generate/src/l1/fold.ts, inline-runs.ts, capture/extract.ts]
    behaviors: [string|runs union, narrow relative run axes, single-run refused, envelope caps, span-per-varying-run, inline-flow capture, fold rejoin, shared oracle decision, text1..N editor exposure]
  - name: Library role correction (REQ-213)
    entry_files: [apps/control-app/src/material.ts, router.ts, builder/library.js]
    behaviors: [POST /api/material/role, uploaded-only (403 otherwise), server-derived republishable, widen places bytes, narrow-after-placed 409, slug from tenant store]
  - name: Chat keyed on business (BUG-69)
    entry_files: [apps/control-app/src/builder/app.js, chat.js]
  - name: Builder typography (BUG-70)
    entry_files: [apps/control-app/src/builder/builder.css, library.js, people.js]
  - name: Framework import graph (BUG-71)
    entry_files: [tools/generate/src/cli/assets.ts]
  - name: Capture host correction (BUG-67 B)
    entry_files: [tools/generate/src/cli/capture/pipeline.ts, capture.ts]
  - name: Backend settings (BUG-67)
    entry_files: [tools/generate/src/cli/ai/backends.json, backends.ts, host-core.ts]
```

## Coverage Map

```yaml
- feature: Marked Points
  status: uncovered
  notes: [STORY-101 / STORY-173 adjacent only]
- feature: L1 modals
  status: uncovered
  notes: [STORY-91 link role is precedent; action is mutually exclusive with link]
- feature: Text runs
  status: uncovered
  notes: [cross-cuts STORY-75/83/84/100; none owns it]
- feature: Library role correction
  status: partial
  existing_stories: [STORY-144]
  existing_acs: [AC-1717, AC-1718]
- feature: Chat keyed on business
  status: partial
  existing_stories: [STORY-104]
  existing_acs: [AC-1064, AC-1067, AC-1070]
- feature: Builder typography + import graph
  status: partial
  existing_stories: [STORY-99]
  existing_acs: [AC-2232, AC-1400]
- feature: Capture host correction
  status: partial
  existing_stories: [STORY-159]
- feature: Backend settings
  status: partial
  existing_stories: [STORY-103]
  existing_acs: [AC-2374]
```

## Plan Items

| # | Component | Type | Points | Deps | Description |
|---|-----------|------|--------|------|-------------|
| 1 | Marked Points | feature | 3 | - | REQ-210 + BUG-72 pointing channel |
| 2 | L1 Modals | feature | 3 | - | REQ-212 dialog role + action verb |
| 3 | L1 Text Runs | feature | 3 | - | REQ-211 multi-variate text |
| 4 | Library | upgrade STORY-144 | 2 | - | REQ-213 role correction |
| 5 | Assistant Pane | upgrade STORY-104 | 1 | - | BUG-69 key on business |
| 6 | Builder Workspace | upgrade STORY-99 | 2 | - | BUG-70 typography, BUG-71 import graph |
| 7 | Reference Capture | upgrade STORY-159 | 2 | - | BUG-67 host correction |
| 8 | AI Site Assistant | upgrade STORY-103 | 1 | - | BUG-67 backend settings |

## Observations

- The 18 commits include 9 version-bump-only commits (package.json). They carry no behaviour and have no item.
- 37c1489a (move to Opus 5) changes configuration only. The item 8 AC reads its expected model from backends.json, so it covers the switch without naming a model.
- BUG-72 names a third defect (the composer pill is not an atomic chip) as upstream in @lagrangefoundry/webui-chat and not fixed. Item 1 must not assert pill atomicity.
- REQ-213 explicitly narrows REQ-161's claim that every rights row is read-only. This is Case 2, so AC-1717 and AC-1718 are modified rather than removed, because the rest of each claim still holds.
- Modals and text runs were classified as features rather than upgrades to STORY-83/91. Each adds expressiveness the substrate lacked, and no single existing story owns the surface it touches.
- Story search (`xgd ticket search`) failed in the sandbox: its embedding model fetch to huggingface.co was blocked. Coverage was instead mapped from the full story title list and the AC children of the candidate stories.
- FC tests are .test.ts files (`tests/test_UAT_FC_*`). Every one in this bundle maps to an item: REQ-210 and BUG-72 to 1, REQ-212 and the BUG-48 additions to 2, REQ-211 (x2) to 3, REQ-213 (x2) to 4, BUG-69 to 5, BUG-70 and BUG-71 to 6, BUG-67 capture to 7, and BUG-67 backend to 8.