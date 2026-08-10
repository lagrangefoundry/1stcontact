---
uid: report-25f0505a
id: REPORT-1739
type: report
title: 'Reconciliation Plan: BUNDLE-17 — request-time render, copy-edit modal, container
  backgrounds, and the assistant''s declared control surface'
created_by: xgd
created_at: '2026-08-10T07:22:18.397856+00:00'
updated_at: '2026-08-10T07:31:20.148120+00:00'
completed_at: null
last_field_updated: items
fields:
  report_kind: reconciliation_plan
  subject_uid: bundle-e59210c5
  anchor_uid: bundle-e59210c5
  items:
  - index: 1
    component: Builder origin — request-time channel rendering
    item_type: upgrade
    story_points: 3
    dependencies: []
    description: 'The builder origin renders the editable and plain draft channels
      on demand from the definition instead of serving them off a build artifact.
      One render implementation (`renderSiteFiles`) decides every byte; the build-time
      writer and the request-time reader are a writer and a reader over it. Renders
      are memoised per channel and invalidated by a stamp over the definition, so
      a change made outside the builder appears on the next request. An invalid draft
      is reported at the origin rather than hidden behind the last good render. The
      save path''s two render-to-disk calls are gone. `published` still comes from
      the publish-time render. Also folds two selector supersessions that land on
      the same story: the split''s secondary pane is now the live assistant pane rather
      than a placeholder.'
    justification: 'Extends the existing workspace-origin capability bucket (CAP-85
      / story-e674c60a already owns ''the workspace and everything it displays are
      reachable from one origin'', confinement, freshness, and the display panel''s
      modes). No new capability bucket: the operator sees the same two channels at
      the same two URLs from the same origin — only where the bytes are decided changed.
      The two acceptance criteria on story-37a3921b that pinned ''a save re-renders
      both ways before it reports success'' are superseded by name in REQ-119''s own
      body; their claim survives and is now observed at the origin, so they are modified
      in place rather than removed. FC evidence on disk: `tests/req119-request-time-render.test.ts`
      (8 UATs named `test_UAT_FC_REQ-119_*`).'
    story_uid: story-e674c60a
    target_story_ids:
    - story-e674c60a
    - story-37a3921b
    intent_delta_summary: story-e674c60a gains the request-time serving contract for
      the draft and edit channels (one render implementation, no disk artifact, staleness
      closed, invalid drafts surfaced, published untouched, iframe source contract
      unchanged) and has AC-973 re-pointed from the chat placeholder to the live assistant
      pane. story-37a3921b keeps AC-992 and AC-1026's claim — an edit changes the
      page, not one rendering of it — but the observable moves from `storage/dist`
      to the origin, and 'before it reports success' is dropped because there is no
      artifact left for a save to keep in step. AC-977's route-coverage probe set
      is extended to the three new AI routes; the criterion text itself is unchanged,
      so it is not listed as a mutation.
    acceptance_criteria_changes:
      add:
      - 'story-e674c60a: Both the editable and the plain draft channel answer from
        the origin with no rendered artifact on disk, and serving one writes nothing
        back'
      - 'story-e674c60a: One render implementation backs the build-time writer and
        the request-time reader — the same file set and the same bytes, for both channels'
      - 'story-e674c60a: A definition changed outside the builder is shown on the
        next request, with no render step and no restart, and unwinds the same way'
      - 'story-e674c60a: A draft that no longer validates is reported at the origin
        naming the offending field, instead of the last good render going on being
        served'
      - 'story-e674c60a: The published channel still comes from the publish-time render
        and never from today''s draft'
      - 'story-e674c60a: The two URLs the display panel builds are unchanged, and
        a preview URL cannot reach outside its own channel'
      modify:
      - 'AC-992 (story-37a3921b): a save writes the draft and replies; both renderings
        show the edit when next requested, observed at the origin rather than on `storage/dist`,
        and ''before it reports success'' is dropped'
      - 'AC-1026 (story-37a3921b): ''the re-rendered page shows it'' is observed at
        the origin, for the same reason'
      - 'AC-973 (story-e674c60a): the display panel''s companion pane is the live
        assistant pane, not a chat placeholder; the divider, rail-collapse and reopen
        behaviour it asserts are unchanged'
      remove: []
  - index: 2
    component: Click-to-edit modal — themed chrome and a page-faithful editing box
    item_type: upgrade
    story_points: 3
    dependencies: []
    description: The form the click-to-edit gesture opens is mounted inside the shell
      root, so it takes the theme's palette and the application typeface and follows
      a theme switch. The fields modal drops its heading and label column (keeping
      both accessible names); the error and message modals keep the heading, where
      it is the content. The editing control mirrors the page's own typography and
      paint stack for the region being edited — family, weight, style, letter-spacing,
      colour read from the live element, the site's @font-face rules copied across,
      and the background resolved by what is under the pixel (paint order) rather
      than by an ancestor walk, each layer sized to its own source element so crops
      and gradient stops resolve as they do on the page. Rendered size is clamped
      to an editing range. The panel is sized for copy with a tall resizable area
      that never pushes Save out of reach, and a lone field opens in its control.
    justification: 'Extends story-3bf94bd4''s existing ''A form over that region''s
      fields'' behaviour — the same gesture, the same fields, the same one-save-is-one-change
      rule. Nothing about which regions are editable, what they expose, or how a change
      is written moves; only what the operator sees when the form opens. No new capability
      bucket, and no parallel modal. FC evidence on disk: `tests/req121-copy-modal-elegance.test.ts`
      (9 UATs named `test_UAT_FC_REQ-121_*`).'
    story_uid: null
    target_story_ids:
    - story-3bf94bd4
    intent_delta_summary: 'story-3bf94bd4 gains the modal''s presentation contract:
      it is inside the theme, carries one application typeface set through the shell''s
      own font token, sheds chrome that named a box you can obviously type in, and
      previews the region''s real appearance rather than approximating it. AC-994''s
      assertion moved from reading the dialog''s text to reading the control''s value
      because those words are a form value now — the criterion itself is unchanged
      and is not mutated.'
    acceptance_criteria_changes:
      add:
      - The edit form mounts inside the workspace's themed subtree, resolves the theme's
        own tokens, and re-colours when the theme changes — no fallback literal is
        load-bearing
      - One application typeface, set once through the shell's own font token and
        served from the workspace origin, applies to the form and its controls; colour
        stays a theme token and the family does not
      - The fields form carries no heading and no label column while keeping the dialog's
        accessible name and the control's; the error and message forms keep their
        heading
      - The editing control reproduces the region's typography and paint stack as
        the page renders it — resolved by what is painted under the region rather
        than by walking ancestors, so a layer that is a sibling rather than a parent
        is still previewed correctly
      - 'The control''s rendered size is clamped to an editing range: the box previews
        style, not layout'
      - The form is sized for real copy with a tall, resizable editing area, and Save
        stays reachable at every window size
      - A form with exactly one field opens in its control, ready to type
      modify: []
      remove: []
  - index: 3
    component: Structured edit — a painted container's background image
    item_type: upgrade
    story_points: 2
    dependencies: []
    description: 'A painted box or container that carries a background image exposes
      a picker of the site''s images, exactly as an image region exposes its source.
      The whole change is in field derivation: the region answers with one required
      closed-list field over the same asset listing the image picker draws from, and
      applying it assigns into the node''s existing axes so every other axis survives
      the swap. Selection only and change-never-add: there is no empty option, and
      a container carrying paint but no background still answers with an empty field
      list. One asset listing serves both pickers.'
    justification: 'story-37a3921b already frames image selection as ''the second
      half of the same surface, not a second mechanism'' and owns field derivation,
      the closed-list rule, whole-or-nothing application, the shared validator and
      the refusal shape. This adds one more region kind to that same derivation —
      no new command, no new route, no second write path, no client change. story-3bf94bd4
      is extended because the gesture is kind-agnostic by design and this is the second
      time a region kind gained fields and reached the operator through the existing
      loop unchanged. No new capability bucket. FC evidence on disk: `tests/req128-background-image-selection.test.ts`
      (10 UATs named `test_UAT_FC_REQ-128_*`).'
    story_uid: null
    target_story_ids:
    - story-37a3921b
    - story-3bf94bd4
    intent_delta_summary: story-37a3921b's 'asking what a region exposes' widens from
      copy and image regions to painted container regions carrying a background handle,
      with the same closed-list, current-handle-always-present, refused-at-the-field
      and nothing-else-moves rules it already states for images. story-3bf94bd4 records
      that the gesture reached this new field with nothing in the client to change,
      and that a rejected choice comes back as a field-scoped refusal over the same
      transport.
    acceptance_criteria_changes:
      add:
      - 'story-37a3921b: Asking a painted container region what it exposes returns
        one closed picker of the site''s images for the background it carries, and
        nothing else of the paint it carries'
      - 'story-37a3921b: Choosing a background updates the node''s background axis
        and the re-rendered page''s background, leaving every other axis on the node
        and every byte in the site''s assets untouched'
      - 'story-37a3921b: A container region''s current background handle is always
        among its options, even when the site''s asset store holds no file for it'
      - 'story-37a3921b: A background handle the site does not offer is refused at
        the field, whole-or-nothing, before the shared validator runs'
      - 'story-37a3921b: A container region carrying paint but no background still
        answers with an empty field list — a background can be changed, never added'
      - 'story-3bf94bd4: Clicking a painted container opens the background picker
        over the same transport as a copy or image edit, and a rejected choice comes
        back as a field-scoped refusal with the page and draft unchanged'
      modify: []
      remove: []
  - index: 4
    component: Assistant session host — the origin that runs a conversation about
      a site
    item_type: feature
    story_points: 3
    dependencies: []
    description: 'The builder origin hosts an assistant conversation per site. Three
      routes: the role and whether the assistant can run; opening a session for a
      slug, which returns that site''s stored transcript, whether it is ready, and
      why not; and a turn, carrying a session id and text, streamed back as assistant
      text, tool activity and completion. Exactly one route turns a site into a session;
      nothing above the host names a site. A turn''s session id is resolved against
      ids the host issued — an id it never minted is refused before any header is
      written, rather than apologised for mid-stream. Transcripts are persisted beside
      the site''s store and replayed after a restart, with both session tiers held
      under the same workspace-scoped directory. The assistant reaches the site only
      through the declared control surface: no filesystem tool, no site parameter,
      and tools that cannot name another site. A refused tool call comes back correctable
      within the turn with the draft byte-identical; a missing API key is explained
      without losing the conversation; a failure after the headers are gone is delivered
      inside the stream.'
    justification: 'No existing story or capability covers an assistant conversation
      over a site. story-e674c60a''s AC-973 describes the split''s second pane only
      as ''a placeholder for the assistant that arrives later''; nothing in the matrix
      describes the session, its transport, its persistence or its binding. This documents
      a genuinely new capability bucket at the origin, kept separate from the browser
      pane for the same reason story-99 and story-100 are separate: one is the surface
      the operator sees, the other is the contract behind it. FC evidence on disk:
      `tests/test_UAT_FC_REQ-122_chat_host.test.ts` (8 UATs) and `tests/test_UAT_FC_REQ-127_session_binding.test.ts`
      (8 UATs).'
    story_uid: null
  - index: 5
    component: Assistant panel in the builder split
    item_type: feature
    story_points: 3
    dependencies:
    - 4
    description: 'The workspace''s secondary pane is a live assistant panel rather
      than placeholder text. It streams assistant turns, renders them, and shows tool
      activity, while the existing rail-collapse and drag-to-resize behaviour is unchanged.
      The pane follows the display panel''s site and has no selector of its own to
      disagree with the toolbar''s: a site change opens that site''s session and hands
      the panel an already-open session, so the swap is synchronous and there is no
      late answer to guard against. Switching remounts on the session, which replays
      that site''s stored transcript and keys the composer''s half-typed draft per
      session, so an unsent message survives a trip to another site and back. An assistant
      that cannot run and an origin that cannot be reached are each explained in the
      panel rather than failing silently.'
    justification: 'No existing story covers a conversational surface in the workspace.
      story-e674c60a owns the split, the divider and the panes'' geometry; it does
      not own what fills the second pane, and its criterion naming the placeholder
      is superseded under item 1. The panel is a distinct user-visible capability
      from the session host it talks to — the operator''s experience of ''my conversation
      follows the site I am looking at, and is still there tomorrow'' is observable
      entirely in the browser. FC evidence on disk: `tests/test_UAT_FC_REQ-122_chat_panel.test.ts`
      (6 UATs) and `tests/test_UAT_FC_REQ-127_session_panel.test.ts` (6 UATs).'
    story_uid: null
  - index: 6
    component: The site's control surface, declared as a governed API
    item_type: feature
    story_points: 3
    dependencies: []
    description: 'The operations that describe or change a site are declared once
      as data: an envelope carrying the surface''s own version and its addressing
      rule, twenty-one operations covering everything the write path can do, parameter
      types, return shapes, six error codes with caller-facing meanings, effect-homogeneous
      capability groups, worked sequences, and declared absences. A separate instance
      configuration says which groups a given consumer is granted, so the whole surface
      can be documented and validated while a narrower slice is what the builder''s
      assistant can reach — asset management and publish are declared but not granted.
      Parameters are validated before any value reaches the write path. Every read
      is marked untrusted, because site copy is other people''s prose re-entering
      the model''s context. Every call is audited: which operation, against which
      site, with which arguments, allowed or refused and by which predicate. The write
      path itself is unchanged and remains single — the CLI, the click-to-edit modal
      and this surface are three callers of it, and none gains a way past validation,
      atomicity or re-render.'
    justification: 'No existing story covers the control surface as an API. story-37a3921b
      documents the write path itself and states that the AI is a second producer
      of the same kind of change, but nothing in the matrix describes the declaration,
      the grant, the error taxonomy, the read/write classification, the provenance
      marking or the audit trail — none of which existed before these commits, and
      three of which (grant narrowing, untrusted reads, per-call audit) are recorded
      in the intent as newly gained. This is a new capability bucket. FC evidence
      on disk: `tests/test_UAT_FC_REQ-126_l1_surface.test.ts` (14 UATs) and `tests/test_UAT_FC_REQ-122_tool_surface.test.ts`
      (the behavioural workflows that survived the surface''s rewrite).'
    story_uid: null
  - index: 7
    component: Authoring the element tree through the control surface
    item_type: feature
    story_points: 3
    dependencies:
    - 6
    description: 'The control surface gains read and write symmetry around one address.
      The page map widens from ''what can I edit'' to ''where is everything'': every
      node, with its path, kind and a short recognisable label, plus the instance
      and slot when it is module-scoped, and no styling axes at all — so the map''s
      size tracks node count rather than how richly the page is styled. Reading an
      address returns the subtree verbatim: axes, palette references, responsive tracks
      and link roles exactly as stored, because a resolved view cannot be written
      back. Writing replaces the subtree at that address; adding and removing are
      expressed as replacing a group with a group holding one child more or fewer,
      and the surface''s sequences say so. The copy-field read/write pair retires
      from this surface, subsumed rather than duplicated. The guarantee that the assistant
      cannot write markup, stylesheets or scripts moves from ''no operation accepts
      them'' to ''the element vocabulary is closed'', and is measured rather than
      asserted. The operator''s click-to-edit modal is untouched, demonstrated over
      the real transport on subtrees the assistant authored.'
    justification: 'No existing story covers composing a page through the control
      surface. story-37a3921b''s write path deliberately reaches the element tree
      only through copy fields — that is the right surface for a person clicking a
      heading and the wrong one for composing a page, and the intent measures the
      gap (54% of nodes visible, none of the 86 carrying axes reachable). This is
      a new capability bucket, distinct from item 6''s API discipline: item 6 is how
      the surface is declared and governed, this is what it can now reach. Classified
      as feature rather than upgrade because the story it would extend does not exist
      yet — it is created by item 6 in this same run. FC evidence on disk: `tests/test_UAT_FC_REQ-129_l1_authoring.test.ts`
      (13 UATs).'
    story_uid: null
  - index: 8
    component: Authoring everything outside the element tree — settings, components,
      page metadata, generated images
    item_type: feature
    story_points: 3
    dependencies:
    - 6
    - 7
    description: 'Four things a real site carries that are not its element tree become
      reachable. Settings are written as a typed object naming the group to write
      in, and merged at every depth — a list or a scalar replaces, two objects merge
      — so naming one setting cannot silently delete its siblings; this is what makes
      an object-valued write safe rather than dangerous, and it is what lets a palette
      family or a navigation list be written at all. Components are instantiated from
      the closed catalog of vetted behaviours: list what exists, add an instance,
      reconfigure it, remove it, and see the instances already on a page with their
      configuration. An instance''s configuration is validated against that behaviour''s
      own contract before the site validator runs, and its presentation is optional
      because a default look is supplied by behaviour id — the result is ordinary
      elements, refined afterwards through item 7. Pages carry search metadata on
      creation and update, merged so improving one field does not clear another, and
      it reaches the rendered document. An assistant-composed drawing can be written
      as an image under its own capability group, so it can be withheld: it is accepted
      or refused whole by a validator closed by construction — every byte accounted
      for by a token the grammar names, element and attribute allowlists, local references
      only, no stylesheet, no document type declaration or entities beyond the five
      XML ones, byte and element caps, and a generated filename with no path to traverse.
      The same operations are reachable from the command line.'
    justification: 'No existing story covers writing structured settings, instantiating
      a behaviour on a page, page search metadata, or generated image content. story-179b8c06
      documents behaviour modules as a framework contract (vetted core, typed config,
      presentation slots) but not instantiating one onto a page from a caller; nothing
      in the matrix touches settings groups, page metadata or asset content validation.
      The generated-image validator in particular is a new security boundary — the
      platform''s structured-only invariant previously held because an asset was a
      file a human vouched for. New capability bucket. Classified as feature rather
      than upgrade because the surface story it extends is created by item 6 in this
      same run. FC evidence on disk: `tests/test_UAT_FC_REQ-130_beyond_l1.test.ts`
      (17 UATs).'
    story_uid: null
---

# Reconciliation Plan — BUNDLE-17

**Mode**: commits
**Anchor**: `bundle-e59210c5` (BUNDLE-17)
**Source**: 9 free-coded commits spanning REQ-119, REQ-122, REQ-121, REQ-126, REQ-128, REQ-127, REQ-129, REQ-130

---

## Step 0 — Intent, as the operator recorded it

The bundle body (72k chars) is eight requirement sections. Read in full; the material points:

- **REQ-119** declares its own **deviation from its AC-1**: the render was not relocated into the Worker, because doing so requires the store to be reachable from workerd, which the ticket's own non-goals forbid. What landed is request-time rendering at the builder origin with one render implementation. The intent ticket amends itself, so the matrix follows the amended intent — it must **not** claim the control-app Worker renders at request time.
- **REQ-119** declares supersession of **AC-992** and **AC-1026** by name: the claim survives, the observable moves.
- **REQ-122** declares it implicitly supersedes the criteria that incidentally named `.builder-chat-placeholder` (**AC-973** and REQ-115's AC-4).
- **REQ-127** **withdraws a clause of its own scope** (the site binding as a declared scope predicate) with a stated argument, and replaces it with relocating the binding into the session. It also declares that it deliberately carries an upstream transcript-archive migration, on the operator's call.
- **REQ-128** argues it is a re-phasing rather than a gap in REQ-118: background *colour* is genuinely phase 2; background *image* is the control REQ-118 already built.
- **REQ-129** declares the security guarantee **moves** — from "no operation accepts markup" to "the element vocabulary is closed" — and that any hole in that closure is a security finding against it.
- **REQ-130** declares the generated-SVG validator ships or the capability is dropped.

---

## Behavior Inventory

```yaml
behavior_inventory:
  source: "free-coded commits e627932..e6ff11a on reconcile-BUNDLE-17"
  entry_files:
    - tools/generate/src/render/render.ts
    - tools/generate/src/cli/preview.ts
    - tools/generate/src/cli/builder.ts
    - tools/generate/src/cli/index.ts
    - tools/generate/src/cli/edit.ts
    - tools/generate/src/cli/ai/host.ts
    - tools/generate/src/cli/ai/roles.ts
    - tools/generate/src/cli/ai/toolbox.ts
    - tools/generate/src/cli/ai/l1-surface.json
    - tools/generate/src/cli/ai/instances.json
    - packages/site-schema/src/l1/edit.ts
    - packages/site-schema/src/svg.ts
    - packages/framework/src/l2/presets.ts
    - apps/control-app/src/builder/{app,chat,api,editor,config,page-style}.js
  features:
    - name: "Request-time channel rendering (REQ-119)"
      description: "renderSiteFiles returns a channel's artifacts in memory; renderSite is a thin writer over it; PreviewRenderer is a reader, resolving one preview URL to one artifact behind a DraftStore seam."
      behaviors:
        - "Draft and edit channels answer from the origin with no artifact on disk, and serving writes nothing back"
        - "Build-time bytes and request-time bytes are decided in one function — same file set, same bytes"
        - "Renders memoised per (slug, channel), invalidated by a stamp over the definition's files"
        - "An out-of-band definition change appears on the next request; an invalid draft is reported, not papered over"
        - "Path resolution mirrors the static server it replaces (directory to index, extensionless to sibling); assets confined to the definition's own assets/"
        - "POST /api/copy no longer calls the renderer twice before replying"
        - "published/ still served from the publish-time artifact"
      entry_point: "renderSiteFiles / PreviewRenderer"
    - name: "Copy-edit modal presentation (REQ-121)"
      description: "The modal mounts inside the shell root and previews the region as the page paints it."
      behaviors:
        - "Mounts inside the themed subtree; resolves theme tokens; follows a theme switch"
        - "One self-hosted application typeface applied through the shell's font token (2 weights, ~59KB, served by the existing /builder/ route; MIME map gained woff2/woff/ttf)"
        - "Fields modal drops heading and label column, keeping accessible names; error/message modals keep the heading"
        - "Control mirrors computed typography plus the site's @font-face rules, copied across same-origin"
        - "Background resolved by elementsFromPoint in paint order, each layer sized to its own source element; ancestor walk survives only as fallback"
        - "Rendered size clamped to an editing range; panel sized for copy; lone field opens in its control"
      entry_point: "defaultModal / page-style.js"
    - name: "Container background image selection (REQ-128)"
      description: "copyFieldsOf gains a box/container branch; applyCopyFields assigns into the existing axes object; segmentOptions supplies the listing for the picker kinds."
      behaviors:
        - "A painted container carrying a background handle exposes one required enum field over the site's images"
        - "The current handle is always among the options (unioned by imageChoices)"
        - "Applying assigns into the existing axes object — every other axis survives"
        - "An off-list handle is refused by the pre-existing enum-membership check, before the shared validator"
        - "A painted container with no background exposes nothing; there is no empty option"
        - "No new command, no new route, no client change, no renderer change"
      entry_point: "copyFieldsOf / applyCopyFields / segmentOptions"
    - name: "Assistant session host (REQ-122 + REQ-127)"
      description: "SessionManager per site over the declared tool surface, with the site binding living in the session."
      behaviors:
        - "GET /api/ai/roles — the role and whether the assistant can run"
        - "POST /api/ai/session {slug} — the only route that names a site; returns the stored transcript, ready, and why not"
        - "POST /api/ai/prompt {sessionId, text} — SSE of text / tool_activity / done"
        - "A prompt's session id is resolved against ids the host issued; an unminted id is a 404 before headers are written"
        - "Backend registered under a slug-suffixed name so its tool set cannot name another site"
        - "Transcripts persisted beside the store, replayed on mount and after restart; both session tiers under the workspace-scoped directory"
        - "Priming is the role preamble plus the generated manual through the ContextSource seam, and a per-turn reminder never written to the transcript"
        - "A refused tool call is correctable within the turn, draft byte-identical; missing API key explained without losing the conversation; mid-turn failure delivered in the stream"
      entry_point: "openSession / streamPrompt / aiStatus"
    - name: "Assistant panel (REQ-122 + REQ-127)"
      description: "webui-chat in the split's secondary pane, handed an already-open session."
      behaviors:
        - "The secondary pane is a live panel; rail-collapse and drag-to-resize unchanged"
        - "The pane follows the display panel's site and has no selector of its own"
        - "createChatPanel takes a session and knows nothing else — no slug, no setSite, no openSession, no generation token"
        - "A site switch remounts on the new session, replaying that site's transcript; composer draft keyed per session"
        - "An unavailable assistant and an unreachable origin are each explained in the panel"
      entry_point: "chat.js / app.js"
    - name: "Declared control surface (REQ-126)"
      description: "ai/l1-surface.json declares the surface as data; ai/toolbox.ts binds it to edit.ts; ai/instances.json states the grant."
      behaviors:
        - "21 operations, 8 capability groups, 7 param types, 12 return shapes, 6 error codes with caller-facing meanings, 6 sequences, 6 declared absences, surface_version carried as data"
        - "The whole surface is declared while the caretaker grant is narrower: ManageAssets and Publish declared, not granted"
        - "Every read declares untrusted provenance"
        - "Every call is audited — operation, site, arguments, allowed or refused, and by which predicate"
        - "Parameters validated before any value reaches edit.ts; the addressing contract stated once"
        - "edit.ts remains the single write path; declare.ts and tools.ts deleted outright"
      entry_point: "createL1Toolbox / l1Operations"
    - name: "Element-tree authoring (REQ-129)"
      description: "Read/write symmetry around one address."
      behaviors:
        - "describe_page emits every node as {path, kind, label} (+ module/slot when scoped), carrying no axes"
        - "get_l1 returns the subtree verbatim — axes, palette refs, responsive tracks, link roles"
        - "set_l1 replaces the subtree at that address; add/remove are group replacement; no insert or delete operation"
        - "replaceL1Node lands beside resolveL1Node so one addressing rule is stated once; writeSegmentRoots pairs segmentRoots"
        - "get_copy/set_copy retire from the surface; WriteCopy becomes AuthorPages; two absences deleted, one added"
        - "The no-markup guarantee now rests on the closed element schema, measured against markup, style, javascript: URLs in both sinks, an undeclared kind and a mistyped axis"
        - "editCopyGet / editCopySet / copyFieldsOf unchanged; both modal invariants exercised over the real /api/copy transport on AI-authored subtrees"
      entry_point: "editL1Get / editL1Set"
    - name: "Beyond-the-tree authoring (REQ-130)"
      description: "Structured settings, component instantiation, page metadata, generated images — plus their CLI verbs."
      behaviors:
        - "set_config takes a typed object and an optional group key; objects merge at every depth, lists and scalars replace"
        - "add/configure/remove_component plus list_behaviors; describe_page lists a page's instances with their config"
        - "presentation optional — presetSlots(behaviorId, config) supplies L2's default look; result is ordinary L1, refined by set_l1"
        - "Instance config validated against the behaviour's own contract before the site validator"
        - "add_page/update_page take seo, merged, reaching the rendered <title> and description"
        - "write_image under its own DrawImages group; validateSvg is closed by construction — every byte accounted for, element/attribute allowlists, url(#local) only, no style, no DOCTYPE/ENTITY, five XML entities only, 64KiB and 2000-element caps, generated filename, accepted or refused whole"
        - "CLI: 1c behavior list; 1c module add|set|rm; 1c asset write --content; 1c page add|update --seo; 1c config set with JSON values (parseConfigValue moved out of edit.ts)"
      entry_point: "editConfigSet / editModule* / editAssetWrite / validateSvg"
```

---

## Coverage Map

```yaml
coverage_map:
  - feature: "Request-time channel rendering (REQ-119)"
    status: partial
    existing_stories: [story-e674c60a, story-37a3921b]
    existing_acs: [AC-964, AC-966, AC-977, AC-978, AC-979, AC-992, AC-1026]
    gaps:
      - "No AC states the channels are rendered on request rather than served off an artifact"
      - "No AC states one render implementation backs both paths"
      - "The staleness class (an out-of-band change; an invalid draft) is unrepresented"
      - "AC-992 / AC-1026 pin an observable that no longer exists (storage/dist, before-reply re-render)"
    notes:
      - "AC-966 (byte-identical to the rendered artifact) still holds and is strengthened; it is not mutated"
  - feature: "Copy-edit modal presentation (REQ-121)"
    status: partial
    existing_stories: [story-3bf94bd4]
    existing_acs: [AC-994, AC-999, AC-1001, AC-1002, AC-1004]
    gaps:
      - "Nothing describes the form's chrome, typeface, theming, or fidelity to the page"
    notes:
      - "AC-994's evidence changed (control value, not dialog text); the criterion is unchanged"
  - feature: "Container background image selection (REQ-128)"
    status: partial
    existing_stories: [story-37a3921b, story-3bf94bd4]
    existing_acs: [AC-981, AC-1024, AC-1025, AC-1027, AC-1028]
    gaps:
      - "Field derivation is documented for copy and image regions only; the container branch is unrepresented"
      - "The change-never-add rule and the absence of an empty option are undocumented design constraints"
  - feature: "Assistant session host (REQ-122 + REQ-127)"
    status: uncovered
    existing_stories: []
    existing_acs: []
    gaps: ["The entire capability — routes, session lifecycle, persistence, binding, failure delivery"]
  - feature: "Assistant panel (REQ-122 + REQ-127)"
    status: uncovered
    existing_stories: [story-e674c60a]
    existing_acs: [AC-973]
    gaps: ["AC-973 names the pane a placeholder; nothing describes a conversational surface"]
  - feature: "Declared control surface (REQ-126)"
    status: uncovered
    existing_stories: [story-37a3921b]
    existing_acs: [AC-986, AC-991]
    gaps:
      - "story-37a3921b documents the write path, not the declaration, the grant, the taxonomy, provenance or audit"
      - "Grant narrowing, untrusted reads and per-call audit are recorded in the intent as newly gained — nothing existed to extend"
  - feature: "Element-tree authoring (REQ-129)"
    status: uncovered
    existing_stories: []
    existing_acs: []
    gaps: ["Composing a page through the surface; the verbatim read; replacement-as-addressing; the relocated security guarantee"]
  - feature: "Beyond-the-tree authoring (REQ-130)"
    status: uncovered
    existing_stories: [story-179b8c06]
    existing_acs: []
    gaps:
      - "story-179b8c06 documents the behaviour-module contract, not instantiating one onto a page from a caller"
      - "Structured settings, page metadata and generated-asset content validation are unrepresented anywhere"
```

---

## Step 3b — Intent scope vs implementation footprint

**Case 1 (matches intent):** REQ-121, REQ-126, REQ-128, REQ-129, REQ-130 land inside their declared scopes.

**Case 2 (explicit supersession — handled as upgrades):**

| Superseded | Owner | Handled by |
|---|---|---|
| AC-992, AC-1026 ("re-renders before reporting success", read off `storage/dist`) | story-37a3921b | item 1, `modify` |
| AC-973 ("a placeholder for the assistant") and REQ-115's AC-4 selector | story-e674c60a | item 1, `modify` |
| REQ-127's own "declared scope predicate" clause | REQ-127 body | withdrawn in the intent itself; the matrix follows the replacement |
| REQ-119's AC-1 ("served by control-app at request time") | REQ-119 body | deviation declared in the intent; ACs describe the builder origin, **not** the Worker |

**Case 3 (touched but not declared):** none silent. Three items to note rather than absorb:

1. `packages/framework/src/l2/presets.ts` (+43) adds `presetSlots`/`hasSlotPreset` — framework L2, whose owning matrix entry is story-179b8c06 (CAP-70). REQ-130 declares it explicitly, and the observable behaviour ("a component arrives with a working default look in one call") is REQ-130's, so the AC lands on item 8. If a later reconciliation of CAP-70 wants an L2-side criterion, that is its call, not this one's.
2. REQ-127's transcript-archive migration (`FileStore`→`FileArchive`, `attach` via `getSession`, explicit `logDir`) is a dependency migration the intent declares it deliberately carried. It is a precondition for item 4's evidence, not a capability of its own — no plan item.
3. REQ-121's incidental repairs (`reconciliation-copy-edit-gesture-modal.test.ts` settle/leak fix, `serve.ts` MIME map) are declared. The MIME entries are covered by item 2's typeface AC; the test repair changes no criterion.

---

## Plan Items

| # | Component | Type | Points | Deps | Targets | Description |
|---|-----------|------|--------|------|---------|-------------|
| 1 | Builder origin — request-time channel rendering | upgrade | 3 | — | story-e674c60a, story-37a3921b | Channels rendered on demand from one implementation; no disk artifact; staleness and invalid drafts surfaced; two superseded ACs re-pointed to the origin |
| 2 | Click-to-edit modal — themed chrome, page-faithful box | upgrade | 3 | — | story-3bf94bd4 | The form is inside the theme, carries the app typeface, sheds redundant chrome, and previews the region as the page paints it |
| 3 | Structured edit — a container's background image | upgrade | 2 | — | story-37a3921b, story-3bf94bd4 | One more region kind in the same derivation: a closed picker over the site's images, change-never-add |
| 4 | Assistant session host | feature | 3 | — | — | Three routes, one session per site, persisted and replayed, the binding living in the session, failures delivered honestly |
| 5 | Assistant panel in the builder split | feature | 3 | 4 | — | A live pane that follows the shown site, replays its transcript, and keys its draft per session |
| 6 | The control surface, declared as a governed API | feature | 3 | — | — | Declaration as data, narrower grant, error taxonomy, untrusted reads, audited calls, one write path |
| 7 | Authoring the element tree | feature | 3 | 6 | — | Full page map, verbatim read, replace-at-address write, security guarantee relocated to the closed schema |
| 8 | Authoring beyond the element tree | feature | 3 | 6, 7 | — | Merging structured settings, component instantiation with contract validation, page metadata, generated SVG behind a closed-by-construction validator |

**Totals:** 8 items — 3 upgrade, 5 feature — 23 points.

---

## FC Evidence — provisional, all owned

The dispatcher's `fc_tests` list arrived empty; the on-disk sweep finds FC evidence in **11 files** (the convention here is TypeScript, and FC UATs appear both as FC-named files and as `test_UAT_FC_REQ-*` function names inside conventionally-named files). Every one is owned by a plan item, so `check_fc_orphans` has nothing left to find:

| FC evidence | UATs | Item |
|---|---|---|
| `tests/req119-request-time-render.test.ts` (`test_UAT_FC_REQ-119_*`) | 8 | 1 |
| `tests/req121-copy-modal-elegance.test.ts` (`test_UAT_FC_REQ-121_*`) | 9 | 2 |
| `tests/req128-background-image-selection.test.ts` (`test_UAT_FC_REQ-128_*`) | 10 | 3 |
| `tests/test_UAT_FC_REQ-122_chat_host.test.ts` | 8 | 4 |
| `tests/test_UAT_FC_REQ-127_session_binding.test.ts` | 8 | 4 |
| `tests/test_UAT_FC_REQ-122_chat_panel.test.ts` | 6 | 5 |
| `tests/test_UAT_FC_REQ-127_session_panel.test.ts` | 6 | 5 |
| `tests/test_UAT_FC_REQ-126_l1_surface.test.ts` | 14 | 6 |
| `tests/test_UAT_FC_REQ-122_tool_surface.test.ts` | 5 workflows | 6 |
| `tests/test_UAT_FC_REQ-129_l1_authoring.test.ts` | 13 | 7 |
| `tests/test_UAT_FC_REQ-130_beyond_l1.test.ts` | 17 | 8 |

---

## Observations

- **Two upgrade items deliberately name two stories.** Items 1 and 3 each span the write path (CAP-86) and the surface an operator touches (CAP-85 / CAP-87), because the commits changed one behaviour observable from both. Splitting them would have produced four items describing two changes.
- **Items 6-8 are three features, not one, and not upgrades.** They are one evolving surface across three commits, but they settle into three distinct buckets: how the surface is declared and governed; what it can reach in the element tree; what it can reach outside it. They are `feature` rather than `upgrade` because the story each would extend does not exist yet — it is created by item 6 in this same run. Downstream sequencing is carried in `dependencies`.
- **The matrix must not overstate REQ-119.** Its AC-1 ("served by `control-app` at request time") was not attempted and the ticket says so plainly: a Worker has no filesystem and no Vite transform, and reaching the store from workerd is DOC-12 §7 phase 2, which this ticket's own non-goals forbid. Item 1's criteria describe the **builder origin**. What remains of the runtime relocation is recorded in `apps/control-app/src/index.ts` and `wrangler.toml`, not claimed here.
- **A security boundary moved and a new one opened.** Item 7 records that "the assistant cannot write markup, stylesheets or scripts" now rests on the closed element vocabulary rather than on no operation accepting them — DOC-2's invariant, relocated. Item 8 opens a genuinely new surface: an assistant-composed SVG is a document the browser executes, served same-origin, where the renderer's URL-scheme allowlist neither applies nor helps. Both belong in the matrix as security criteria with measured evidence, not as prose.
- **`surface_version` reads 3 in the tree** (REQ-129 took it 1→2; REQ-130 took it to 3). Item 6 should state that the surface carries its own version and that a new write cannot appear unnoticed — REQ-130's own note that REQ-126's write-set enumeration fired is that guardrail working, and it is worth an AC.
- **Known gaps the intents record and the matrix should not claim closed:** the enum control renders each option as its literal value (upstream `webui-fields`), a single field lays out at half the box width (upstream REQ-70), and a Toolbox refusal renders the declared class meaning and drops the host's JSON pointer (upstream `@lagrangefoundry/ai`). Each is filed upstream; none should be written as a criterion here.
- **Uncertainty flagged:** `presetSlots` in `packages/framework/src/l2/presets.ts` is L2 framework code reached from item 8's capability. It is assigned to item 8 because that is where the behaviour is observable, but a future CAP-70 reconciliation may want an L2-side criterion for "a behaviour declares a default presentation retrievable by id".