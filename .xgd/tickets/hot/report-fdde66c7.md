---
uid: report-fdde66c7
id: REPORT-11573
type: report
title: 'Reconciliation Plan: free-coded (BUNDLE-42: BUG-73, BUG-75, REQ-216, REQ-215,
  REQ-223, REQ-218)'
created_by: xgd
created_at: '2026-11-08T21:02:09.509063+00:00'
updated_at: '2026-11-08T21:02:09.509063+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_plan
  subject_uid: bundle-7ba3af93
  anchor_uid: bundle-7ba3af93
  items:
  - index: 1
    component: Project Knowledge Base — embedder transport (BUG-73)
    item_type: upgrade
    story_points: 2
    dependencies: []
    description: 'Extends existing story STORY-138 (story-5281f009). embedder.ts is
      the single resolver for how a deployment reaches the embedding model: with CLOUDFLARE_ACCOUNT_ID
      + CLOUDFLARE_API_TOKEN both set it embeds over REST and never touches env.AI;
      with neither it uses the AI binding exactly as production does; half the pair
      is a named error with no fallback. The four call sites (knowledge.ts, router.ts,
      session-knowledge.ts, system-knowledge.ts) ask that resolver. Failures surface
      as EmbeddingFailedError naming transport and KB, preserving the underlying message,
      with operator advice on the binding path; the decorator forwards name and dimension.'
    justification: STORY-138 owns 'every environment has the same model available'
      (AC-1664) but only covers the binding-absent refusal; the REST transport, the
      half-configured error, the single-resolver rule and the legible failure are
      uncovered. Extends the existing KB capability (capability-6cc3e339); no new
      capability bucket is introduced.
    target_story_ids:
    - story-5281f009
    acceptance_criteria_changes:
      add:
      - With both CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN set, embedding goes
        over REST and never touches env.AI; an empty string counts as absent
      - With neither credential set, the AI binding is used exactly as before (production
        unchanged)
      - Only one of the pair set raises a named error naming the missing variable;
        no fallback to the binding
      - embedder.ts is the only module that constructs a WorkersAiEmbedder; nothing
        outside it decides from env.AI
      - An embedding failure raises EmbeddingFailedError carrying transport and knowledge
        base as fields and text, keeping the original message; on the binding transport
        it carries the expired-preview/reload/REST advice; an already-named failure
        is not re-wrapped
      - The decorator forwards model name and vector dimension and returns inner vectors
        untouched on success
      - 'When nothing can embed: project KB still raises AiNotConfiguredError, system
        KB still answers null, a session still opens'
      - Neither credential variable appears in wrangler.toml in any environment
      modify:
      - 'AC-1664: the no-model refusal names both remedies — declare the binding ([ai]
        and [env.production.ai]) or set both REST credentials'
      remove: []
    intent_delta_summary: The model-availability rule gains a second, credential-selected
      REST transport resolved in one place, and embedding failures become named, attributable
      errors.
    story_uid: null
  - index: 2
    component: Behavior Modules — capabilities.js composition (BUG-75)
    item_type: upgrade
    story_points: 1
    dependencies: []
    description: 'Extends existing story STORY-85 (story-179b8c06). The generated
      capabilities.js composes each behavior''s client.js into its own block with
      export stripped and its /* behavior: <id> */ marker kept, so top-level names
      are scoped per behavior and the bundle parses as an ES module even when two
      behaviors declare the same name.'
    justification: AC-702 says behavior client code ships as one page-referenced asset
      but verifies only content and references, which passed on an unparseable bundle.
      This tightens the existing AC within capability-ae9d65d6; no new capability
      bucket.
    target_story_ids:
    - story-179b8c06
    acceptance_criteria_changes:
      add:
      - Two behaviors may declare the same top-level name and the composed bundle
        still parses and every behavior runs
      modify:
      - 'AC-702: the composed capabilities.js parses as an ES module (verified by
        importing it, not by pattern-matching); each behavior sits in its own block,
        export statements are stripped, and each keeps its behavior marker'
      remove: []
    intent_delta_summary: The single-asset AC is strengthened from 'contains the inputs'
      to 'is a valid module whose behaviors are scoped from each other'.
    story_uid: null
  - index: 3
    component: Assistant Looking Surface — drive the draft before the shot (REQ-216)
    item_type: upgrade
    story_points: 3
    dependencies: []
    description: 'Extends existing story STORY-157 (story-58b2cec4). A draft picture
      may carry `after`: ordered phrases in exactly two forms (click "X", fill "X"
      with "Y") executed before the shutter via capture/interact.ts, matching controls
      by accessible name with no selector reachable. Each failure (no match, ambiguous,
      not visible, click changed nothing, field did not take the value, page never
      settled) is an INTERACTION_FAILED refusal naming what failed and returns no
      picture. Non-draft kinds refuse `after` before a browser is leased. An edit
      picture carries a ''behaviour is off'' caption on the text block and compare
      carries the same caveat.'
    justification: STORY-157's 17 ACs define the picture vocabulary but none covers
      `after`, interaction refusals or the edit-channel caption. Extends the same
      picture vocabulary in capability-00e77e55; no new operation or capability bucket.
    target_story_ids:
    - story-58b2cec4
    acceptance_criteria_changes:
      add:
      - A draft picture may carry `after` in exactly two forms (click "X"; fill "X"
        with "Y"); quotes optional; anything else is refused before a browser is leased,
        naming both forms
      - Steps run in order, the first failure stops the run, and the shutter opens
        only on the state the steps produced; a driven page is laid out at its own
        viewport width and check_fidelity's value gates read the same driven state
      - Controls are matched by accessible name (label, aria-label, visible text,
        placeholder; menus by option label before value); no selector can be named
      - Each step failure — no match (listing what is there), ambiguous (count and
        names), not visible, click changed nothing, field did not take the value,
        page never settled — is refused with INTERACTION_FAILED naming what failed,
        and no picture is returned
      - edit, reference, revision and url pictures carrying `after` are refused before
        a browser is leased, each with its stated reason
      - An edit picture carries a 'behaviour is off' caption on the block the model
        reads, compare reports the caveat when either side is from the edit channel,
        and a draft picture carries no caption
      modify:
      - 'AC-2026: the picture shape''s key list includes `after` (draft only)'
      remove: []
    intent_delta_summary: The draft picture becomes drivable by named interactions
      before capture, with every failure a named refusal; the edit channel's inertness
      is stated on its pictures.
    story_uid: null
  - index: 4
    component: Assistant Looking Surface — stored image as a sixth picture kind (REQ-218)
    item_type: upgrade
    story_points: 3
    dependencies:
    - 3
    description: 'Extends existing stories STORY-157 (story-58b2cec4) and STORY-158
      (story-47fb84e6). A sixth picture kind `image` resolves one name across site
      assets (filename, /assets/ handle, bare stem) and Library material (record id,
      title) via image-library.ts; ambiguity is refused listing candidates; no match
      points to list_assets. A stored PNG passes through; anything else is rasterised
      to PNG in the browser with bytes inlined, then reduced like a page shot. SVG
      drawings carry a default-font caption pointing to measure_drawing; `original:
      true` is honoured; compare accepts an image on either side while check_fidelity''s
      value gates refuse it. .gif and .avif gain content types.'
    justification: AC-2026/AC-2027/AC-2028 pin five page kinds; REQ-218 explicitly
      extends the vocabulary to six with no new operation. Extends the existing picture
      vocabulary (capability-00e77e55); no new capability bucket.
    target_story_ids:
    - story-58b2cec4
    - story-47fb84e6
    acceptance_criteria_changes:
      add:
      - An `image` picture is matched by site filename, /assets/ handle, bare stem,
        Library record id or Library title through one rule; fonts excluded
      - A name matching several pictures is refused listing each candidate's exact
        name; a name matching nothing is refused pointing to list_assets and the handle
        returned when the picture was made
      - 'A stored picture is returned as an image: PNG untouched; other formats rasterised
        to PNG by the browser with bytes inlined (no fetch); then reduced like a page
        shot'
      - An SVG drawing carries a caption that it is shown in the browser's default
        font, pointing to measure_drawing; `after` on an image is refused
      - '`original: true` is accepted and labelled ''as originally stored''; the CLI
        host answers only for site assets and a deployment with no image store refuses
        with ENVIRONMENT'
      - check_fidelity's value gates refuse an `image` picture saying to use compare
      - .gif and .avif resolve to proper image content types
      - 'STORY-158: compare accepts an `image` picture on either side (e.g. a stored
        picture against a captured reference)'
      modify:
      - 'AC-2026: `kind` admits six values including `image`, with `image` and `original`
        keys; viewport does not apply to `image`'
      - 'AC-2027: all six picture kinds resolve (five page kinds plus stored image)'
      - 'AC-2028: an `image` picture missing its `image` field is refused naming the
        field'
      remove: []
    intent_delta_summary: The one picture vocabulary grows from five kinds of page
      to six by adding a stored image, normalised to PNG so every downstream verb
      accepts it untold.
    story_uid: null
  - index: 5
    component: L1 Modals — edit render carries the dialog apparatus; page state read/apply
      (REQ-215 framework half)
    item_type: upgrade
    story_points: 2
    dependencies: []
    description: 'Extends existing story STORY-175 (story-e214a00d). The edit render
      now emits the full L1 dialog apparatus — shell, role, id, overlay stylesheet
      — minus the script and the acting attribute, laying out in flow until a marker
      is set. framework page-state.ts reads a loaded page''s state (open panel ids
      plus scroll) and applies it: an edit document is told (markers set), a draft
      document is driven (openers/Close activated so focus, scroll lock and aria-expanded
      follow). Scope is the L1 dialog role; a behaviour module''s own panel keeps
      its declared settled state.'
    justification: REQ-215 explicitly supersedes REQ-212 §5.7 / acceptance 12 ('no
      shell, no role' becomes 'the shell and the role, always'), which AC-2436 pins.
      Page-state read/apply has no AC. Extends capability-ae9d65d6; no new bucket.
    target_story_ids:
    - story-e214a00d
    acceptance_criteria_changes:
      add:
      - A loaded page's state reads as the ids of its open L1 panels plus its scroll
        offset; an untouched page reads as no panel open
      - Applying a state to an edit document sets the markers, opening exactly the
        named panels as overlays and closing the rest
      - Applying a state to a draft document activates the page's own openers/Close
        controls, so focus, scroll lock and aria-expanded are true afterwards
      - A state read in one channel reproduces in the other
      - A behaviour module's own panel is untouched by state application and keeps
        its declared settled state
      modify:
      - 'AC-2436: the edit render emits the dialog shell, role, id and overlay stylesheet
        with no script and no acting attribute; told nothing, the panel lays out in
        flow and settled (replaces ''same element, no shell'')'
      remove: []
    intent_delta_summary: The edit render keeps the modal apparatus inert rather than
      dropping it, and pages gain a readable/applicable panel state the builder can
      carry.
    story_uid: null
  - index: 6
    component: Builder Workspace — carry the page across a channel switch; Edit panel
      selector (REQ-215 builder half)
    item_type: upgrade
    story_points: 2
    dependencies:
    - 5
    description: Extends existing story STORY-99 (story-e674c60a). Switching View/Edit
      keeps the page path, scroll offset and any open L1 panel (carry.js over the
      same-origin edit bridge); the post-save reload re-applies the carried state;
      switching site or following a link out drops it. Edit alone offers a toolbar
      panel selector that reads panels off the rendered document, names them by text,
      shows nothing on a page without panels, and applies a pick without reloading.
    justification: STORY-99 owns the channel toggle and display panel (AC-1029, AC-1036)
      but the toggle previously recomputed the channel root and discarded state; nothing
      covers carry or the selector. Extends capability-a994b8f3; no parallel toggle
      or new bucket.
    target_story_ids:
    - story-e674c60a
    acceptance_criteria_changes:
      add:
      - Switching channel keeps the page path and the scroll offset the operator was
        at
      - A panel opened in View is showing in Edit, and editing copy inside it (with
        its post-save reload) does not close it
      - Switching site or following a link out of a panel drops the carried state
      - Edit alone offers a panel selector naming the page's panels by their text;
        a page with no panel shows no control; a pick applies to the loaded document
        without reloading
      modify:
      - 'AC-1029 / AC-1036: the channel toggle preserves the current page rather than
        returning to the channel root'
      remove: []
    intent_delta_summary: 'View and Edit behave as one page with a toggle: location,
      scroll and open panel survive the switch, and Edit can choose which panel it
      shows.'
    story_uid: null
  - index: 7
    component: Public Lead Capture — public forms accept a submission (REQ-223)
    item_type: feature
    story_points: 3
    dependencies: []
    description: 'New story in capability-e5939ceb. POST /api/lead on the page''s
      own origin (public-site) resolves the tenant from the URL via route grammar
      (never the body), hands the write over a service binding to a named control-app
      WorkerEntrypoint (no URL reaches it), and captures through addContact (idempotent
      on tenant+email) with an append-only contact event recording site, page, form
      instance, submit label, other answers and consent wording. Controls in order:
      body/field limits, rate limit on site+source IP, honeypot, Turnstile; missing
      config fails closed. Every identity-dependent outcome answers one frozen acknowledgement
      byte for byte; a no-JS form POST gets an HTML confirmation. An asset-bearing
      form delivers at most once per address ever via the existing mail port; bounced/complained
      addresses are never sent to. contact-form gains a checkbox field type, per-mount
      instance id, serve-time Turnstile sitekey and widget; the edit render still
      cannot post.'
    justification: 'No story covers an anonymous visitor writing into a tenant: every
      existing add path (STORY-146/165) is owner-only behind Access (AC-2172). This
      is a genuinely new capability (DOC-5 rules 22-23). It reuses addContact (AC-1743/1744/2336),
      contact events (AC-2258/2263/2264) and route grammar (AC-2244/2333) unchanged.
      Checkbox/Turnstile are folded in as the consent/anti-spam half of the same capability
      per REQ-223 §7.'
    story_uid: null
  - index: 8
    component: Outgoing message record & public serving — consequences of lead capture
      (REQ-223)
    item_type: upgrade
    story_points: 1
    dependencies:
    - 7
    description: Extends existing stories STORY-169 (story-219b4217) and STORY-95
      (story-d34eccd8). Messages gain a `complained` status distinct from `bounced`;
      the email webhook maps a verified email.complained onto it; the ticket schema's
      status enum reads MESSAGE_STATUSES rather than repeating it. The published-site
      server remains read-only except the single POST /api/lead; every other method
      and path still answers 405.
    justification: REQ-223 explicitly adds the complained status (needed for its suppression
      rule) and a write endpoint on public-site, contradicting AC-2293/AC-2299/AC-2287
      wording and STORY-95 AC-912 ('any writing method is refused'). Extends capabilities
      dfeb586b and a12e557f in place; no new bucket.
    target_story_ids:
    - story-219b4217
    - story-d34eccd8
    acceptance_criteria_changes:
      add: []
      modify:
      - 'AC-2293: a verified email.complained maps to status `complained`, distinct
        from `bounced`'
      - 'AC-2299: complained is among the handled events; other events remain acknowledged
        and ignored'
      - 'AC-2287: the message status vocabulary includes `complained`, and the ticket
        schema''s enum is derived from MESSAGE_STATUSES'
      - 'AC-912 (STORY-95): the published-site server is read-only except POST /api/lead;
        every other writing method or path is refused with 405'
      remove: []
    intent_delta_summary: Complaints become a recordable message status, and the public
      server's read-only rule gains its one declared exception.
    story_uid: null
---

# Reconciliation Plan

**Mode**: commits
**Source**: free-coded tickets: BUG-73, BUG-75, REQ-216, REQ-215, REQ-223, REQ-218 (BUNDLE-42, 11 commits; 5 are version bumps with no behaviour)

## Behavior Inventory

```yaml
behavior_inventory:
  source: "free-coded tickets: BUG-73, BUG-75, REQ-216, REQ-215, REQ-223, REQ-218"
  features:
    - name: Embedder transport resolver (BUG-73, 69ed3fd6)
      entry_point: apps/control-app/src/embedder.ts
      behaviors: [REST when both CF creds set, binding when neither, named error on half, single resolver for 4 call sites, EmbeddingFailedError naming transport+KB with advice, decorator forwards name/dimension]
    - name: capabilities.js composition (BUG-75, 577dd246)
      entry_point: tools/generate/src/cli/module-assets.ts
      behaviors: [each behavior in own block, export stripped, markers kept, bundle parses as ES module, shared top-level names allowed]
    - name: Drive the draft before the shot (REQ-216, 6758319f)
      entry_point: tools/generate/src/cli/capture/interact.ts, picture.ts
      behaviors: [after phrases click/fill, accessible-name matching, ordered steps stop at first failure, INTERACTION_FAILED refusals, draft-only, edit-channel caption on picture and compare]
    - name: Channel carry + edit dialog apparatus + panel selector (REQ-215, 6b8ae21b)
      entry_point: packages/framework/src/l1/page-state.ts, render.ts; apps/control-app/src/builder/carry.js, toolbar.js
      behaviors: [edit render emits shell/role/id/stylesheet without script, read/apply page state, edit told / view driven, carry path+scroll+panel across toggle, drop on site switch or link-out, Edit-only panel selector without reload, module panels untouched]
    - name: Public lead endpoint (REQ-223, d28af32f)
      entry_point: apps/public-site/src/lead.ts, apps/control-app/src/lead.ts, worker.ts
      behaviors: [POST /api/lead same-origin, tenant from URL, service-binding WorkerEntrypoint, addContact idempotent, provenance contact event, limits->rate limit->honeypot->Turnstile fail-closed, frozen acknowledgement, no-JS HTML, asset at most once per address, complained status + webhook, checkbox field, instance id + sitekey stamping, 405 elsewhere]
    - name: Stored image picture kind (REQ-218, 82309854)
      entry_point: tools/generate/src/cli/image-library.ts, picture.ts, capture/screenshot.ts
      behaviors: [sixth kind image, one name across site assets and Library, ambiguity refused with candidates, rasterise to PNG inline, SVG caption, original:true, compare accepts it, check_fidelity refuses it, gif/avif content types]
```

## Coverage Map

```yaml
coverage_map:
  - feature: Embedder transport resolver
    status: partial
    existing_stories: [STORY-138]
    existing_acs: [AC-1664, AC-1665]
    gaps: [REST transport, half-pair error, single resolver, EmbeddingFailedError]
  - feature: capabilities.js composition
    status: partial
    existing_stories: [STORY-85]
    existing_acs: [AC-702]
    gaps: [bundle must parse; per-behavior scoping]
  - feature: Drive the draft (REQ-216)
    status: uncovered (within STORY-157)
    existing_stories: [STORY-157]
    existing_acs: [AC-2026]
    gaps: [after, interaction refusals, edit caption]
  - feature: Stored image kind (REQ-218)
    status: partial (vocabulary ACs pin five kinds)
    existing_stories: [STORY-157, STORY-158]
    existing_acs: [AC-2026, AC-2027, AC-2028, AC-2038]
    gaps: [image kind resolution, normalisation, refusals]
  - feature: Edit dialog apparatus + page state (REQ-215)
    status: partial, AC-2436 stale
    existing_stories: [STORY-175]
    existing_acs: [AC-2432, AC-2435, AC-2436, AC-2438]
  - feature: Channel carry + panel selector (REQ-215)
    status: uncovered (within STORY-99)
    existing_stories: [STORY-99]
    existing_acs: [AC-1029, AC-1036]
  - feature: Public lead endpoint (REQ-223)
    status: uncovered
    existing_stories: []
    notes: [reuses AC-1743, AC-1744, AC-2336, AC-2258, AC-2263, AC-2264, AC-2244, AC-2333 unchanged]
  - feature: complained status / public-site write exception (REQ-223)
    status: partial, wording contradicted
    existing_stories: [STORY-169, STORY-95]
    existing_acs: [AC-2287, AC-2293, AC-2299, AC-912]
```

## Plan Items

| # | Component | Type | Points | Deps | Description |
|---|-----------|------|--------|------|-------------|
| 1 | KB embedder transport (BUG-73) | upgrade STORY-138 | 2 | - | REST/binding resolver, named failures; modify AC-1664 |
| 2 | capabilities.js (BUG-75) | upgrade STORY-85 | 1 | - | Bundle parses, behaviors block-scoped; modify AC-702 |
| 3 | Drive the draft (REQ-216) | upgrade STORY-157 | 3 | - | `after` interactions, refusals, edit caption |
| 4 | Stored image kind (REQ-218) | upgrade STORY-157, STORY-158 | 3 | 3 | Sixth picture kind; modify AC-2026/2027/2028 |
| 5 | L1 modal state (REQ-215) | upgrade STORY-175 | 2 | - | Edit render keeps apparatus; page state read/apply; modify AC-2436 |
| 6 | Builder carry (REQ-215) | upgrade STORY-99 | 2 | 5 | Carry path/scroll/panel; Edit panel selector |
| 7 | Public lead capture (REQ-223) | feature | 3 | - | POST /api/lead, controls, provenance, asset delivery, checkbox/Turnstile |
| 8 | Message status + serving exception (REQ-223) | upgrade STORY-169, STORY-95 | 1 | 7 | `complained` status; AC-912 exception |

Total: 8 items (feature 1, upgrade 7), 17 points.

## Reconciliation Decisions

- **REQ-215 supersession (Case 2, settled at ladder level 1).** The commit and ticket state it 'Supersedes REQ-212 §5.7 and its acceptance 12 ... "no shell, no role" in the edit render becomes "the shell and the role, always"'. AC-2436 is modified rather than removed because its 'no script, no acting attribute' half still holds; its UAT (tests/test_reconciliation_l1_modals.test.ts ~L360-364, asserting no [data-l1-dialog] and no l1-dlg CSS) now contradicts code and must be rewritten during item 5.
- **REQ-216/REQ-218 kept as two items on STORY-157** rather than one: together they are ~15 ACs (>3 points). Item 4 depends on item 3 because REQ-218 adds its own `after` refusal and surface_version moves 3->4 on top of REQ-216.
- **REQ-223 contact-form checkbox/Turnstile folded into the feature** (item 7) per REQ-223 §7 (the checkbox is the consent record), not a separate STORY-85 upgrade. Open assumption: if framework module work is preferred in capability-ae9d65d6, that AC can move to STORY-85 without other change.
- **REQ-223 capability placement:** capability-e5939ceb (Accounts/Membership — contact rows and events) over capability-a12e557f (Site Delivery), because the substance is the identity write. Open assumption.
- **STORY-95 AC-912** included in item 8 because REQ-223 deliberately adds a write path to public-site; the existing test still passes (only checks /site/<slug>/) so the contradiction would otherwise go unnoticed.
- **No complained marker in the Contacts list** (AC-2304) — the commit does not add one, so AC-2304 is unchanged.

## Observations

- Version-bump commits (1ba6d909, 98c03ed6, bf0bce3c, 7d60b5b2, 7c55bf0b) carry no behaviour.
- FC tests to rename during story cycles: tests/test_UAT_FC_BUG-73_embedder_transport.test.ts (21), _BUG-75_capabilities_bundle (4), _REQ-216_drive_the_page (~30), _REQ-218_stored_picture (9; uses REQ_218 underscore separator), _REQ-215_carry/_page_state/_panel_control (7/11/4), _REQ-223_asset_delivery/_internal_seam/_lead_endpoint/_public_form_surface (4/3/13/6). Also test_UAT_FC_REQ_157_the_picture_type_declares_all_five_kinds now asserts six and should be re-tied to AC-2026 under item 4; test_UAT_FC_REQ-212_* modified in REQ-215 belongs to item 5.
- BUG-73's leading hypothesis (preview session expiry) is not proven; the plan documents the transport behaviour, not the diagnosis.
- `xgd ticket search` was unavailable (sandbox blocked the embedding index and model download); candidate stories were found from the full story listing and read in full.
