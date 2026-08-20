---
uid: report-69163dad
id: REPORT-2293
type: report
title: 'Reconciliation Plan: BUNDLE-19 free-coded commits (REQ-133, BUG-35, REQ-131,
  REQ-140, REQ-139, REQ-123, REQ-141, REQ-144, REQ-142)'
created_by: xgd
created_at: '2026-08-20T01:12:52.279101+00:00'
updated_at: '2026-08-20T03:00:28.811485+00:00'
completed_at: null
last_field_updated: items
fields:
  report_kind: reconciliation_plan
  subject_uid: bundle-77b28def
  anchor_uid: bundle-77b28def
  items:
  - index: 1
    component: 'Palette Management: 1c palette & /api/palette'
    item_type: feature
    story_points: 3
    dependencies: []
    description: 'The site palette becomes editable through its own command group
      and its own origin route. `1c palette get|set|add|rm|rename` with `GET/POST
      /api/palette` beside it: a read returns the palette plus per-entry usage counts
      across the site document and every page; `set` writes a free hex on an entry
      (one write, and every reference follows at every shade); `add` takes a kebab-case
      name plus a hex and refuses a duplicate, a malformed name or an alpha-carrying
      hex; `rm` succeeds only on an entry with zero references and is refused naming
      the count otherwise, with NO force flag; `rename` is an atomic total rewrite
      of the key and every reference to it, refused on collision and on a malformed
      name, moving the key in place so a palette an operator has arranged keeps its
      order, and moving only `ref` so `shade` and `alpha` survive at the position
      they had. The delete and rename guards are enforced SERVER-SIDE against a stale
      client, the popup''s disabled button being an explanation rather than the rule;
      every write answers with the operation''s result and the whole re-taken census.
      `collectL1PaletteRefs`, `resolveL1Palette` and `renameL1PaletteRef` now sit
      on one structural walk, `mapL1PaletteRefs` (packages/site-schema/src/l1/palette.ts:187),
      so the count the surface shows and the references a rename rewrites cannot disagree.
      All five operations are declared on the AI toolbox surface — `get_palette` in
      `ReadSite`, the four writes in a new `ManagePalette` group — which is as much
      a narrowing as a widening, since the assistant previously reached the palette
      blind through `WriteConfig`''s merge with no way to ask what a change would
      move and no way to remove or rename at all. Reads and writes go through the
      single write path (tools/generate/src/cli/edit.ts), and a palette write needs
      no re-render because both draft-side channels render at request time.'
    justification: No existing story covers editing a palette. STORY-97 (colour census
      and retrofit) declares 'Any colour-picker or palette-editor UI' explicitly out
      of scope, and STORY-80 (the L1 palette value model) owns only what a colour
      value MAY BE and how a reference resolves — not how an entry is added, renamed
      or removed. STORY-100 owns segment fields, not a site-level command group with
      its own census and its own server-side guards. Genuinely new capability bucket.
    story_uid: story-ee073693
  - index: 2
    component: Builder Palette Popup
    item_type: feature
    story_points: 3
    dependencies:
    - 1
    description: 'One popup surface (apps/control-app/src/builder/palette-popup.js),
      opened from two kinds of place and identical in both: the toolbar''s Colors
      action (manage — nobody is waiting for a value) and a colour field that needs
      one (pick — the popup resolves to a selection). Picking and editing live together
      deliberately, so ''this colour is nearly right'' is a one-gesture fix. It displays
      one swatch per entry labelled with its name and its usage count, which is the
      fact both the delete rule and the rename confirmation are stated in; an empty
      palette is a legitimate state and reads as ''no colours yet, add one'' rather
      than as broken. Selecting an entry reveals a CONTINUOUS shade slider previewing
      the colour at the current position — previewing and writing nothing in manage
      mode, since a shade lives on a use — and the preview is produced by the renderer''s
      own arithmetic rather than a copy of it: the Oklab shade maths moves to a zero-import
      packages/site-schema/src/l1/shade.ts, served type-stripped at /framework/site-schema-shade.js
      so a drag resolves per frame in the browser without a round trip. Picking resolves
      to a palette reference — `{ref}` or `{ref, shade}`, never a hex — with a zero
      shade OMITTED so a literal converts byte-for-byte; cancelling resolves to nothing
      and changes no state. The hex control is native (`<input type=color>` paired
      with a mirroring text field) because the picker cannot express every hex form
      the schema accepts and the text field cannot be dragged. Reached as `mountBuilder(...).openPalette(slug,
      {mode, value})` on the builder handle, so host, transport and shade arithmetic
      are bound once. The segment modal''s hand-rolled backdrop/Escape/close shell
      is extracted into modal.js and both dialogs wear it, with `mount()` kept separate
      from construction because REQ-117''s `openLoneControl` depends on the dialog
      being detached at build. A write reloads the preview frame, which is not optional:
      a colour change repaints the page and a stale frame would read as a write that
      did nothing.'
    justification: No existing story covers this browser surface. STORY-99 owns the
      workspace chrome, the mode registry and the rule that the toolbar re-derives
      from what is displayed — it owns no individual action's behaviour, and Colors
      is one more action spec rather than a branch. STORY-101 owns the segment dialog
      alone. The popup is the reusable component two other items consume, so it is
      documented once rather than absorbed into either caller.
    story_uid: story-4300366a
  - index: 3
    component: Draft Change Journal
    item_type: feature
    story_points: 3
    dependencies: []
    description: 'The draft answers ''what changed since I last looked'' at a cost
      proportional to the change rather than to the page. Every mutating operation
      in edit.ts — the single write path for the CLI, the AI and the editor — appends
      one journal record and RETURNS the resulting per-site counter, so a caller''s
      baseline advances as it writes and any gap is by construction somebody else''s
      work; nothing has to filter by actor, the arithmetic does it. A refused write
      appends nothing (records are written at the return of a mutating command, never
      before the write, so ''a refusal appends nothing'' holds without a transaction)
      and a no-op — a copy save that changes no field, a dry-run gap fix — returns
      the current count without appending. Records are self-describing because L1
      addresses are render-scoped and not durable: each carries the counter it produced,
      the actor (`ai` | `client` | `cli`, from `GlobalOptions.actor`, defaulting to
      `cli`), a timestamp, the operation, its target, a human-readable label derived
      by the same `pageSegments` walk the editor uses for its outlines (moved to cli/segments.ts
      so there is one derivation), and for copy the before and after text clipped
      at 300 characters. The window is 500 records; an over-old baseline returns `truncated:
      true` alongside whatever remains and the caller falls back to a full read. The
      journal lives at `storage/sites/<slug>/.journal.json` — gitignored, beside the
      site and never inside `draft/`, so it can neither be captured by a publish snapshot
      nor perturb byte-identity — and a missing or malformed file reads as empty,
      because a corrupt journal must degrade to ''I cannot tell you what changed''
      and never to ''your edit failed''. It is read as `list_changes` in the already-granted
      `ReadSite` group, marked `returns.provenance: untrusted` because it carries
      the operator''s own prose back into the model''s context, and as `1c changes
      <slug> [--since n]` so the operator and the assistant ask the same question
      of one implementation. EVERY write shape hands the count back including `add_asset`
      and `write_image`, which answer with the asset rather than with a change — otherwise
      a session whose last write was an upload would be told its own upload was somebody
      else''s work. The host records the counter at the end of each turn (in a `finally`,
      so the assistant''s own writes are absorbed and an abandoned turn leaves no
      stale baseline) and compares at the start of the next, putting the signal in
      `role.reminder`, which is re-applied every turn and never enters the transcript
      — so the common case costs no tool call at all.'
    justification: Nothing in the matrix records that the draft has a change history.
      STORY-100 records the validated atomic write but not that a write returns a
      counter or leaves a record; STORY-103 records the conversation but nothing about
      a between-turn change signal; `status` answers a different question (draft against
      the last PUBLISHED revision, file-level, no ordering, no actor, no before/after).
      The journal, the counter, the tool, the CLI verb and the reminder signal are
      one mechanism and are documented as one story rather than scattered across three.
    story_uid: story-6cd17452
  - index: 4
    component: Structured Copy Editing — colour fields and the faithfulness lock
    item_type: upgrade
    story_points: 3
    dependencies:
    - 1
    target_story_ids:
    - story-37a3921b
    intent_delta_summary: The write path's declared colour deferral is lifted — a
      text run offers `color` and a painted panel offers `surfaceFill`, both as palette
      references validated against THIS site's palette — and the story's single italic
      lock generalises into the stated faithfulness rule, with a plain-English reason
      on every lock and a `lockError` that refuses a change but never the status quo.
    description: 'Extends existing story story-37a3921b (STORY-100). `L1FieldDescriptor.type`
      gains `''color''` and `L1FieldValue` is extended with `L1Color` (packages/site-schema/src/l1/edit.ts:187),
      with `L1SegmentFieldOptions.palette` beside it — the first field whose value
      is not a scalar. A text segment offers its `color` axis and a painted box/container
      offers `surfaceFill`, written as palette REFERENCES and never as a hex, so from
      a segment an operator can only pick a colour the site already has and editing
      a palette entry moves every use with it. The write side is the authority: `applyCopyFields`
      checks the value is a reference into this site''s palette, with `shade`/`alpha`
      bounded and unknown keys REFUSED rather than dropped, so a stale client cannot
      post an entry the palette no longer holds; a colour that did not move is not
      a diff, which is what keeps editing the words of a run with a literal colour
      working on every folded site. Whether a box paints is asked of the renderer''s
      own `l1PaintsSurface` rather than restated, so the modal and the outline cannot
      disagree — which is what makes every stamped box or container re-colourable
      and moves the ''nothing to edit here'' specimen off the painted panel. Separately,
      the lock generalises: a control is offered only when it is FAITHFUL — the value
      it shows is the whole truth about what the element holds and setting it produces
      exactly the change expected — and where it is not it is shown unavailable WITH
      THE REASON, never hidden and never quietly lossy. `L1FieldDescriptor.reason`
      is derived as a PAIR with `locked`, so one cannot be produced without the other;
      `GLYPH_GRADIENT_LOCK` locks a text run''s colour row when the run carries `gradientFill`,
      because the renderer compiles a glyph gradient to `color: transparent` and the
      picker would write a value that never appears; `NO_ITALIC_FACE_LOCK` is the
      existing italic lock, now with its reason. The test is ''is the write observable
      and complete?'', NOT ''is another axis present'' — a `surfaceGradient` over
      a fill and a scrim over a photograph both keep their controls, because a translucent
      layer shows what is under it. `lockError` joins `typeError`/`rangeError`/`colorError`
      in the refusal chain and refuses with the descriptor''s OWN reason, so the sentence
      a greyed control shows and the sentence a refused write returns are one string
      with one definition site — and it refuses a CHANGE, never the status quo, because
      the modal posts every staged field and refusing a re-post would freeze the whole
      segment over one locked row. `1c copy get`''s listing appends `(locked: <reason>)`.'
    acceptance_criteria_changes:
      add:
      - A text segment offers a colour field; choosing a palette entry writes `{ref,
        shade}` into the `color` axis and the re-render paints it.
      - A painted box or container segment offers a background-colour field writing
        `surfaceFill` the same way; a seam that paints nothing is still not a segment
        and offers nothing.
      - A colour value naming an entry the site's palette does not hold is refused
        by `applyCopyFields` with the field named, server-side, so a stale client
        cannot write it; unknown keys on the value are refused rather than dropped.
      - A `shade` outside [-1, +1] is refused; a colour equal to the one the region
        reported is not a diff.
      - Every locked descriptor carries a reason, and no `locked` is produced without
        one — asserted as a structural sweep over every segment of every stored site.
      - A text run whose glyphs are painted by `gradientFill` has its colour row locked
        with a reason naming the gradient and the escape hatch, is still offered and
        still in position, and the identical control on an ordinary run is untouched.
      - A band carrying an image, an overlay and a fill keeps both controls open and
        the write lands — a sibling axis is not occlusion.
      - A change to a locked control is refused with a message identical to the descriptor's
        reason and leaves the draft byte-unchanged; re-posting the unchanged locked
        value alongside a genuine edit saves the rest of the segment.
      - '`1c copy get`''s field listing marks a locked field with its reason.'
      modify:
      - 'The out-of-scope clause deferring ''Choosing a colour — a run''s own colour,
        a panel''s background colour'' on the stated ground that ''neither the palette
        control nor the colour-valued field shape exists yet (REQ-133)'': both now
        exist, so a run''s colour and a painted panel''s fill move IN scope. The rest
        of a panel''s paint (pattern, overlay, gradient) and free hex entry stay out
        — free hex lives only in the palette editor.'
      - 'The technical note ''the colour-from-the-palette control the next phase needs
        is the same move again'' becomes a statement of what shipped: the vocabulary
        grew a third time, along the same narrowing axis, and the first non-scalar
        field value is a typed object rather than a magic string.'
      - The existing italic-lock note ('Why italic locks only on positive evidence
        of absence') is re-framed as ONE INSTANCE of the general faithfulness rule
        (inert / lossy / unsupported), not the whole of it.
      - The worked example of 'a region with nothing to edit' moves from a painted
        panel — now re-colourable and therefore a region — to a seam, which still
        holds no copy, no asset and no paint.
      remove: []
    justification: 'Extends the existing write-path bucket rather than adding one:
      no new command, no new endpoint, no new write path — one more field type and
      one more branch of the same validated, all-or-nothing write, which is precisely
      the growth axis STORY-100 already declares. The story itself names this work
      as the thing it was deferring, so this is explicit supersession (Case 2), not
      a new capability. REQ-140 and REQ-139 both land on this one story, so they are
      one item rather than two.'
    story_uid: story-37a3921b
  - index: 5
    component: In-Page Copy Editing — the colour row, the lock's face, and the box
      that mirrors the words
    item_type: upgrade
    story_points: 3
    dependencies:
    - 2
    - 4
    target_story_ids:
    - story-3bf94bd4
    intent_delta_summary: The gesture's declared colour deferral is lifted (a colour
      row that opens the palette popup in pick mode, plus the escalation row to the
      panel behind the words), a lock is finally given a face, and the recorded 'capitalisation
      is written and does not arrive' divergence is closed together with the never-asserted
      letter-spacing half of the same defect.
    description: 'Extends existing story story-3bf94bd4 (STORY-101). No picker is
      built: REQ-133''s popup already implements pick mode and already resolves to
      `{ref, shade}`, and this supplies the missing caller — so a colour field gets
      manage-editing inside the picker for free, which is what makes an empty palette
      a workable starting state rather than a dead end. The colour row is a field
      THE DIALOG OWNS (apps/control-app/src/builder/color-field.js), exactly as image-picker.js
      owns `format: ''image''` fields — split by DESCRIPTOR and not by segment kind,
      so the day a third surface exposes a colour it is answered there too. The text
      modal gains the escalation row: a read-only swatch of the panel behind the words,
      labelled from the panel behind this text, with a link to that panel''s own modal
      — because background colour belongs to the panel (a folded run''s box is glyph-tight)
      and innermost-wins means clicking the words never reaches it; a dirty modal
      saves before it navigates. `mountColorField` honours `locked`: the button is
      `disabled` rather than merely dimmed (a class closes neither the keyboard nor
      the screen reader), the row carries `is-locked` and the same `data-field` attribute
      `mountFields` stamps, and the swatch still reports what the element paints;
      `annotateLocks` in editor.js draws the reason under the row it explains, once
      per sheet, for BOTH control families, because `mountFields` marks its own locked
      rows but has no vocabulary for a reason. `builder.css` styles `.is-locked` and
      `.builder-lock` — nothing styled either before, so REQ-135''s italic lock was
      enforced and invisible. Finally the editing box''s mirroring is completed and
      PROVEN: `fields.css` carries the page''s typography in with `font: inherit`,
      which expands to family, size, weight and style but not to `text-transform`
      or `letter-spacing`, both of which the UA stylesheet resets on form controls
      — so `builder.css` re-declares the inheritance on `.builder-modal__box .fields-control`
      and both now reach the glyphs. Capitalisation had a control and read as dead;
      tracking had none, so its failure read only as a headline set tight quietly
      mis-mirroring, and nothing asserted it arrives — removing `letter-spacing: inherit`
      left every suite green. The evidence is browser-driven, because jsdom ships
      no UA stylesheet and resolves no inherited properties, so it can represent neither
      the reset nor the re-declaration; and it is measured on the WORDS, not the wrapper,
      with the parameter sheet''s own controls asserted to stay dressed as chrome
      so a widened selector fails in a test rather than in the operator''s eyes.'
    acceptance_criteria_changes:
      add:
      - A text segment's dialog offers a colour row that opens the palette popup in
        pick mode and commits the returned reference; a painted panel's dialog offers
        the same for its background colour.
      - The text modal shows the fill of the panel behind the words read-only and
        can navigate to that panel's own modal; a modal with unsaved changes saves
        before it navigates.
      - A site with an empty palette opens the picker in its 'no colours yet, add
        one' state rather than an empty or broken control.
      - A locked control is drawn unavailable rather than dimmed — the swatch is `disabled`,
        the row carries `is-locked`, clicking it reaches no picker — and its reason
        is rendered under the row, for both the dialog-owned controls and the shared
        form component's.
      - An ordinary run carries no lock note, because there is nothing to explain.
      - A run set with tracking previews in the editing box at the page's own letter-spacing,
        and an untracked run is given none; the parameter sheet's own controls keep
        the chrome's tracking.
      modify:
      - The out-of-scope clause "a run's **colour** and its **family**, and the **panel
        background** behind it — the palette control those need is a later phase"
        loses colour and panel background and keeps family, line height, letter spacing,
        alignment and the rest of the paint axes.
      - 'The recorded divergence ''Capitalisation is written and does not arrive,
        and the mechanism is the font shorthand'' is CLOSED: the covering criterion
        claims four parameters rather than three. The paragraph''s standing prediction
        — ''the day the words are drawn in something that carries it the evidence
        fails and says so'' — is superseded by the fix, and the mirroring claim now
        covers letter-spacing too, which had never been asserted at all.'
      - 'The technical note ''A run''s **colour** is the live example: no colour descriptor
        exists yet, so live colour is a row this table gains when the palette control
        lands'' is realised — the descriptor exists and the row is present.'
      - The scope note that the dialog 'decides per field which control draws it'
        gains the colour row as a third dialog-owned control beside the thumbnail
        grid, still chosen by descriptor and never by region kind.
      remove: []
    justification: 'Extends the existing gesture bucket: the same dialog, the same
      one-Save-one-change rule, the same descriptor-routed choice of control, the
      same shared form component. No parallel editor, no second modal, no new endpoint.
      The story''s own out-of-scope clause and its own recorded divergence name exactly
      this work as what it was waiting for, so this is explicit supersession rather
      than a new capability bucket. BUG-35, REQ-139''s client half and REQ-140''s
      client half all land on this one story, so they are one item rather than three.'
    story_uid: null
  - index: 6
    component: 'System Knowledge Base: Corpus, Index & Generated Map'
    item_type: feature
    story_points: 3
    dependencies: []
    description: 'The builder AI''s domain knowledge is built as a release artefact.
      `1c kb build` runs the whole pipeline in order — corpus export, document index,
      chunk index, awareness map; `1c kb export` does the corpus alone (no model,
      no credentials) and scaffolds the declaration so either command leaves a coherent
      tree; `1c kb status` reports what is built. Membership is OPT-IN, per document,
      on the document: a `doc` ticket is in the system KB when it carries `fields.system_kb:
      true` STRICTLY as the boolean — a field arriving as the string ''true'' is frontmatter
      that did not parse the way its author assumed, and admitting it would hide exactly
      the failure worth seeing. The export skips every ticket that does not carry
      it and NAMES what it skipped, never a bare count. Inclusion rather than exclusion,
      deliberately: it answers ''what does the assistant know'', which a reviewer
      can settle by reading one document''s frontmatter, and it fails safe — a document
      written tomorrow is outside the KB until somebody says so, rather than reaching
      a client-facing agent the moment it is saved. The rule lives on the ticket rather
      than in a list, because it is a fact about the document and has to move with
      it. `kb/knowledge_bases.json` repeats the same predicate deliberately: the export
      decides which files exist, the predicate decides which files BELONG, so a stray
      copy or a half-finished hand edit is not silently absorbed on the next index
      build. The declaration is now PARSED rather than paraphrased — `bindKb` goes
      through the library''s own `parseKbConfig`, so prompt, predicate, landscape
      and weight all come from the declaration rather than being hand-constructed
      beside a file that said something else. The awareness map is GENERATED at build
      time (cluster → describe → validate) and there is no hand-authored map, because
      a map over 33 documents spanning product, framework and process is exactly the
      artefact that goes stale unseen and routes the agent confidently to the wrong
      place; the KB nevertheless declares `landscape: authored` at runtime, which
      is the shipped-KB contract (''a fixed artefact that ships, never refreshed on
      a cadence'') and not a claim a human wrote it — the build flips to `derived`
      for its own duration. Only the export step is this repo''s: index, chunking,
      ranking, clustering and access-point validation compose `@lagrangefoundry/knowledge`''s
      exported functions in the same order its `build-shipped-kb` CLI calls them,
      because that CLI is not in the packed artifact (the package declares `files:
      ["src"]` and no `bin`). Filenames derive from the doc''s human id rather than
      its title, since `DocDirStore`''s uid IS the path; and the export writes a file
      only when its bytes change, because the index''s incremental manifest keys on
      `updated_at` while `DocDirStore` takes both stamps from the file entry — otherwise
      every build re-embeds the whole corpus and tells the ranker every document just
      changed. Build-time and query-time vectors come from one model (Workers AI `@cf/baai/bge-small-en-v1.5`,
      over REST from Node with the credentials the repo already deploys with) so vector-space
      parity holds by construction; the describe seam needs none and falls through
      to the authenticated Claude Code CLI.'
    justification: No existing story covers a knowledge base at all. STORY-103 explicitly
      declares 'Knowledge-base retrieval' out of scope with the note that 'no retrieval
      is claimed here'; STORY-105 owns the declaration and grant of the SITE control
      surface, not a corpus; nothing owns a corpus export, an index build or an awareness
      map. Genuinely new capability bucket. Split from item 7 because this half is
      an operator-facing build pipeline that runs with no session and no model — `1c
      kb export` needs no credentials at all — while item 7 is what a conversation
      knows.
    story_uid: null
  - index: 7
    component: AI Site Assistant — the session's knowledge surface
    item_type: upgrade
    story_points: 2
    dependencies:
    - 6
    target_story_ids:
    - story-a58a0974
    intent_delta_summary: 'The conversation''s declared ''no retrieval yet'' boundary
      is lifted: the session keeps every L1 control and gains a read-only system-KB
      surface in the same Toolbox, and is primed with a generated map rather than
      with documents — degrading to the pre-KB assistant when nothing is built.'
    description: 'Extends existing story story-a58a0974 (STORY-103). TWO SURFACES
      IN ONE TOOLBOX: the session keeps every L1 control and gains `KnowledgeToolbox`
      over the system KB, so a knowledge call is subject to the same gating, provenance
      marking and audit as an edit rather than reaching the model by a second route.
      The grant is read-only and scoped to the system KB on BOTH axes by upstream''s
      own `instanceConfig`, so `kb` (what may be searched) and `document` (what may
      be read) cannot drift apart. PRIMED WITH A MAP, NOT THE DOCUMENTS: `KnowledgeDocs`
      assembles landscape, then purpose, then the projected tool manual as its `mechanism`
      — the last thing read is the thing done first — which is what lets the corpus
      grow without the context growing with it. DEGRADATION, NOT FAILURE: with no
      KB built, `openKnowledgeRuntime` returns null and the session is exactly the
      pre-REQ-123 assistant — tools but no documents — while a KB that WAS built and
      then fails to open says so on stderr rather than silently dropping the whole
      knowledge surface, because the two are very different situations with very different
      fixes.'
    acceptance_criteria_changes:
      add:
      - A session opened for a site with a built KB offers the knowledge operations
        alongside every L1 control from one Toolbox, and a knowledge call is audited
        and provenance-marked exactly as an edit is.
      - The knowledge grant is read-only and scoped to the system KB on both the searchable-KB
        and readable-document axes, from one declaration, so the two cannot name different
        things.
      - The session's priming carries the landscape and the projected tool manual
        rather than document bodies, so adding documents to the corpus does not grow
        the primed context.
      - A session opened with no KB built runs with the L1 controls alone and reports
        nothing missing to the operator; a KB that was built and fails to open reports
        it rather than dropping the knowledge surface silently.
      modify:
      - The out-of-scope clause 'Knowledge-base retrieval. The intent states priming
        is the role preamble plus the generated manual until a corpus exists; no retrieval
        is claimed here' — a corpus now exists and retrieval IS claimed, so the clause
        is replaced by the criteria above. The story's own condition ('until a corpus
        exists') is what has been met.
      - The in-scope item 'what the assistant is told about itself' extends from the
        role preamble plus the manual to landscape-first priming over the corpus.
      remove: []
    justification: 'Extends the existing per-site-conversation bucket rather than
      adding one: the same session, the same host, the same Toolbox, the same audit
      and provenance discipline, no second conversation surface and no bypass of the
      control surface. The story''s own out-of-scope clause names this as the thing
      it was waiting for and states the condition under which it would land, so this
      is explicit supersession. No new capability bucket is introduced — the corpus
      and its build, which ARE new, are item 6.'
    story_uid: null
  - index: 8
    component: Site Store Port & Workers Test Runtime
    item_type: feature
    story_points: 3
    dependencies: []
    description: 'Storage moves behind one async port, so the store can stop being
      a filesystem. DOC-12 §7 said the Worker reaches storage through a single `SiteStore`
      accessor; that was true on the read path (preview.ts had a `DraftStore`) and
      false on the write path, where edit.ts called `writeJson`, `removePath` and
      `copyFileSync` directly. `tools/generate/src/store/site-store.ts` now declares
      `hasDraft`, `readSiteJson`, `readPages`, `write`, `listAssets`, `readAsset`,
      `counter`, `appendChange`, `changesSince`, `pendingChanges` and `loadDraft`
      — small, total, async, and NO VERB RETURNS A PATH, because an `asset()` handing
      back an absolute filename is the filesystem leaking through rather than a convenience.
      Writes are ONE verb taking a whole change (site.json + N pages + page removals
      + asset bytes + asset removals), so a palette rename crosses as a single call
      and a D1 adapter can make it atomic later without revisiting a caller. Two adapters,
      both live and current and neither a legacy mode: `fsSiteStore` for the operator''s
      git-tracked storage/sites/ and an in-memory one, INJECTED at construction and
      named exactly once each — by the CLI, by the builder, by the AI host — with
      no mode detection anywhere. edit.ts''s 31 exports are async and it imports no
      `node:fs`, `node:path` or `../store`; the node-free splits that make that possible
      are store/assemble.ts (merge + validate, shared, with `loadSite` delegating
      to it) and store/journal-model.ts (the counter arithmetic and window rule, previously
      welded to `.journal.json`). `editAssetAdd` takes BYTES — its old `file` argument
      named a path on the operator''s own machine, meaningless in a Worker — with
      the source read moved out to the CLI and the toolbox adapter, and the CLI surface
      and the NOT_FOUND envelope unchanged. `PreviewRenderer` takes a `SiteStore`
      and `PreviewFile` carries bytes rather than a filename. A stored site is selected
      as a directory that HOLDS A DEFINITION, so a directory git left standing over
      an untracked `.DS_Store` is not read as a site and no `site.json` that was never
      there is read. And the port is provable in the runtime it will ship to: Vitest
      is split into projects — vitest.node.config.mts is the previous single config
      verbatim (same Astro `getViteConfig`, same webui aliases, same timeouts) and
      vitest.workers.config.mts boots workerd with a D1 `DB` and an R2 `SITES` binding
      and the apps'' own compatibility date and flags, so the test runtime is the
      production runtime — routed by one convention stated once in the orchestrating
      root config: `*.workers.test.ts` runs in workerd, everything else in node. tests/support/site-factory.ts
      yields the SAME handle over both adapters (`makeFsSite` / `makeMemorySite`),
      which is what makes ''no caller depends on the filesystem'' a property a test
      asserts rather than a reading of the diff.'
    justification: No existing story records how the platform reaches storage. STORY-100
      owns what a validated, atomic edit MEANS, not where the bytes live; STORY-94/95
      own the deployed snapshot's shared storage, which is a different store on the
      far side of a deploy; STORY-99's origin owns confinement and freshness, not
      a store interface. The port, its two adapters, the site factory that proves
      adapter-equivalence and the workerd runtime the store UATs need are ONE capability
      — REQ-141's own stated purpose is that it 'blocks the store port and every store
      UAT after it' — so they are one item, which is also what keeps the test-runtime
      work from becoming a test-only story.
    story_uid: null
  - index: 9
    component: Platform Build, Deploy & Smoke Scripts
    item_type: feature
    story_points: 3
    dependencies: []
    description: 'Three scripts, one path for operator and automation alike — a deploy
      done differently by hand than by script is a deploy whose failures nobody can
      reproduce. `bin/build` runs `1c preflight`, then `pnpm -r build`, then a per-app
      `wrangler deploy --env production --dry-run --outdir dist`; `--env production`
      deliberately, because a config error that exists only under `[env.production]`
      is the whole subject here and building the default environment would miss every
      one. `1c preflight` is new: it reports every SHARED-STORE component and every
      declared package and exits 6 naming what is absent, because those components
      are installed out of band so pnpm cannot supply them and the lockfile cannot
      notice them gone — and a missing browser component yields an import map that
      loads, renders chrome, and then dies at the first import, in the operator''s
      browser. `bin/deploy` DISCOVERS `apps/*/wrangler.toml` rather than reading a
      hand-kept list (whose failure mode is an app that silently never gets built),
      treats `--dry-run` as a TARGET rather than a second script so the same hooks
      run and the same command line is composed with one flag appended, and knows
      nothing about D1 and no secret''s name: `bin/deploy.d/migrate/` and `bin/deploy.d/secrets/`
      are the seams later work lands in without editing the file. Any EXECUTABLE file
      in those directories runs in sorted order before the upload receiving `DEPLOY_APP`,
      `DEPLOY_APP_DIR`, `DEPLOY_ENV`, `DEPLOY_WORKER_NAME`, `DEPLOY_DRY_RUN` and `DEPLOY_REPO_ROOT`,
      and a hook exiting non-zero aborts that app BEFORE anything uploads — a migration
      that fails must stop the code that assumes it ran; non-executable files are
      ignored so each directory''s README lives beside its hooks. `bin/smoke` makes
      HTTP assertions against a live origin and exits non-zero naming the assertion
      that failed, over nine checks: the apex resolves, an unknown slug is not found,
      an unpublished slug is INDISTINGUISHABLE from an unknown one (identical status
      and body, because a 404 that says which would answer questions about sites the
      asker has no business knowing exist), the trailing-slash 301 holds on both channels,
      the draft index serves HTML, cache-control and x-robots-tag are right on the
      draft channel, a draft miss is a noindex 404, and every asset a rendered snapshot
      references resolves — following attribute references and ONE LEVEL INTO CSS,
      where `@font-face` lives, because a missing font is invisible in a screenshot
      and obvious to a reader. A check with nothing to test against reports SKIP,
      never quiet success. It is plain JavaScript with no transform and no dependency,
      because it runs straight after a deploy on whatever Node is there, and it is
      exported so its failure path is driven against a fake origin rather than by
      breaking a real deploy. Behind all of it, the configuration bug: a named wrangler
      environment inherits neither vars nor bindings, so control-app declared `BUILDER_ORIGIN`
      only at the top level and a deployed Worker would have seen no configuration
      at all and answered its own 503 to every request — wrangler warns, and a warning
      is not an error. `[env.production.vars]` now repeats it, and because public-site
      already records the same rule for its R2 binding, this is the second time inheritance
      has bitten the repo: a UAT now asserts for EVERY Worker in the tree that `[env.production]`
      repeats every top-level var and binding, with bindings found STRUCTURALLY (any
      table declaring `binding`) rather than from a list that would silently stop
      covering the first kind nobody remembered to add. The secret mechanism is documented
      and never committed: piped via `printf ''%s'' | wrangler secret put NAME --env
      production` — piped rather than passed as an argument, which is visible in `ps`
      and in shell history, and `printf` rather than `echo`, whose newline would become
      part of the secret.'
    justification: No existing story covers building or deploying the platform's own
      Workers. STORY-94 is `1c deploy` shipping a SITE's rendered snapshot to shared
      storage and STORY-95 is serving that snapshot to a visitor; neither touches
      wrangler configuration, the Worker upload, deploy hooks, or a post-deploy check
      against a live origin. STORY-95 in fact carries this as an open uncertainty
      — 'the end-to-end smoke check against a live bucket and the apex custom-domain
      provisioning were never run in session' — which `bin/smoke` is the answer to,
      but the answer is a new operator capability rather than a change to what the
      server does, so it is a feature beside those stories and not an upgrade to them.
    story_uid: null
---

# Reconciliation Plan — BUNDLE-19

**Mode**: commits
**Anchor**: bundle-77b28def (BUNDLE-19)
**Source**: 14 free-coded commits on `reconcile-BUNDLE-19`, carrying nine intents — REQ-133, BUG-35, REQ-131, REQ-140, REQ-139, REQ-123, REQ-141, REQ-144, REQ-142. Three of the fourteen are version bumps with no behaviour (af9b8ab, c60cbf7, 8581a92 — the last also carries REQ-123's opt-in filter); one (e70668d) is a fixture correction inside REQ-140.

---

## Behavior Inventory

```yaml
behavior_inventory:
  source: "free-coded commits: 8e66fef, 90b762c, ceed377, b269998, e70668d, 6b94ba9, 2dbf7e7, aea40e5, cd6f00c, b179902, da7d31b"
  entry_files:
    - apps/control-app/src/builder/palette-popup.js
    - apps/control-app/src/builder/modal.js
    - apps/control-app/src/builder/color-field.js
    - apps/control-app/src/builder/editor.js
    - apps/control-app/src/builder/toolbar.js
    - apps/control-app/src/builder/builder.css
    - apps/control-app/wrangler.toml
    - packages/site-schema/src/l1/palette.ts
    - packages/site-schema/src/l1/shade.ts
    - packages/site-schema/src/l1/edit.ts
    - packages/framework/src/l1/render.ts
    - tools/generate/src/cli/index.ts
    - tools/generate/src/cli/edit.ts
    - tools/generate/src/cli/builder.ts
    - tools/generate/src/cli/segments.ts
    - tools/generate/src/cli/kb.ts
    - tools/generate/src/cli/preflight.ts
    - tools/generate/src/cli/shared-store.ts
    - tools/generate/src/cli/ai/host.ts
    - tools/generate/src/cli/ai/roles.ts
    - tools/generate/src/cli/ai/toolbox.ts
    - tools/generate/src/cli/ai/l1-surface.json
    - tools/generate/src/store/site-store.ts
    - tools/generate/src/store/fs-store.ts
    - tools/generate/src/store/memory-store.ts
    - tools/generate/src/store/assemble.ts
    - tools/generate/src/store/journal.ts
    - tools/generate/src/store/journal-model.ts
    - tools/generate/src/store/paths.ts
    - tools/generate/bin/smoke.mjs
    - bin/build
    - bin/deploy
    - bin/smoke
    - kb/knowledge_bases.json
    - vitest.config.mts
    - vitest.node.config.mts
    - vitest.workers.config.mts
  features:
    - name: "1c palette get|set|add|rm|rename + GET/POST /api/palette"
      description: "Site-level palette command group with the reference census beside it; delete and rename guards enforced server-side; every write answers with the re-taken census."
      behaviors:
        - "get: palette plus per-entry usage counts across the site document and every page"
        - "set: free hex on an entry; every reference follows at every shade"
        - "add: kebab-case name + hex; duplicate / malformed / alpha-carrying hex refused"
        - "rm: allowed at zero references only; refused naming the count otherwise; no --force"
        - "rename: atomic total rewrite of key + every reference; refused on collision or malformed name; key moves in place; only `ref` moves, shade and alpha survive"
        - "POST /api/palette refuses a verb it does not declare"
        - "all five declared on the AI surface: get_palette in ReadSite, four writes in a new ManagePalette group"
      entry_point: "cli/index.ts case 'palette' (:1269, :1406); cli/builder.ts '/api/palette' (:389)"
    - name: "mapL1PaletteRefs — one structural walk"
      description: "collectL1PaletteRefs / resolveL1Palette / renameL1PaletteRef expressed on one traversal so the count shown and the references rewritten cannot disagree."
      behaviors:
        - "structural rather than a hand-listed tour of the colour axes"
        - "walks the site document and every page"
      entry_point: "packages/site-schema/src/l1/palette.ts:187"
    - name: "Palette popup (manage + pick)"
      description: "One surface opened from the toolbar's Colors action and from a colour field needing a value."
      behaviors:
        - "swatch per entry labelled with name and usage count"
        - "empty palette reads as 'no colours yet, add one'"
        - "continuous shade slider; previews and writes nothing in manage mode"
        - "preview uses the renderer's own Oklab arithmetic, served type-stripped at /framework/site-schema-shade.js from a zero-import shade.ts"
        - "pick resolves to {ref} or {ref, shade}, never a hex; a zero shade is omitted"
        - "cancel resolves to nothing and changes no state"
        - "a write reloads the preview frame; no re-render (both draft channels render at request time)"
        - "modal shell extracted to modal.js; mount() separate from construction"
      entry_point: "mountBuilder(...).openPalette(slug, {mode, value})"
    - name: "Draft change journal"
      description: "Per-site monotone counter plus a windowed, self-describing record of every mutating write."
      behaviors:
        - "every mutating edit appends one record and returns the resulting counter"
        - "a refused write and a no-op append nothing and do not advance"
        - "records carry counter, actor (ai|client|cli), timestamp, operation, target, human label from pageSegments, and before/after copy clipped at 300 chars"
        - "window 500 records; an over-old baseline answers truncated: true"
        - "stored at storage/sites/<slug>/.journal.json — gitignored, outside draft/, missing or malformed reads as empty"
        - "list_changes in ReadSite, returns.provenance untrusted"
        - "1c changes <slug> [--since n]"
        - "every write shape hands the count back, including add_asset and write_image"
        - "host compares the counter across turn boundaries and puts the signal in role.reminder; baseline recorded after the turn in a finally"
      entry_point: "store/journal.ts, store/journal-model.ts, cli/index.ts case 'changes' (:1273), ai/host.ts (:508-527)"
    - name: "Colour as an editable segment field"
      description: "A text run offers `color`, a painted box/container offers `surfaceFill`, both as palette references."
      behaviors:
        - "L1FieldDescriptor.type gains 'color'; L1FieldValue gains L1Color; L1SegmentFieldOptions.palette"
        - "applyCopyFields validates membership in THIS site's palette; shade/alpha bounded; unknown keys refused not dropped"
        - "a colour that did not move is not a diff"
        - "whether a box paints is asked of the renderer's own l1PaintsSurface"
      entry_point: "packages/site-schema/src/l1/edit.ts:187, :620, :643, colorError :1167"
    - name: "Locked controls that say why"
      description: "A control is offered only when faithful; otherwise shown unavailable with the reason."
      behaviors:
        - "L1FieldDescriptor.reason derived as a pair with locked"
        - "GLYPH_GRADIENT_LOCK: a text run carrying gradientFill locks its colour row (renderer compiles color: transparent)"
        - "NO_ITALIC_FACE_LOCK carries its reason"
        - "surfaceGradient does NOT lock a panel's fill; a scrim over a photograph is not occlusion"
        - "lockError refuses a CHANGE, never the status quo, with the descriptor's own string"
        - "1c copy get appends (locked: <reason>)"
        - "client: disabled not dimmed, is-locked + data-field, annotateLocks draws the reason for both control families, builder.css styles it"
      entry_point: "packages/site-schema/src/l1/edit.ts:406-444, :968-972, lockError :1130"
    - name: "The editing box mirrors capitalisation and tracking"
      description: "font: inherit does not expand to text-transform or letter-spacing, and the UA stylesheet resets both on form controls."
      behaviors:
        - "builder.css re-declares both on .builder-modal__box .fields-control"
        - "a tracked run previews at the page's own tracking; an untracked run is given none"
        - "the parameter sheet's own controls stay dressed as chrome"
        - "browser-driven, measured on the words rather than the wrapper (jsdom can represent neither the reset nor the re-declaration)"
      entry_point: "apps/control-app/src/builder/builder.css"
    - name: "1c kb build | export | status"
      description: "System knowledge base: corpus export, document index, chunk index, generated awareness map."
      behaviors:
        - "build runs the whole release build in order; export does the corpus alone with no model and no credentials; status reports what is built"
        - "membership opt-in per document via fields.system_kb strictly true; skipped tickets are NAMED"
        - "kb/knowledge_bases.json repeats the predicate so a stray file is not absorbed"
        - "the declaration is parsed via parseKbConfig rather than paraphrased"
        - "the map is generated (cluster -> describe -> validate); landscape: authored at runtime, derived for the build's duration"
        - "export writes a file only when its bytes change (DocDirStore takes both stamps from the file entry)"
        - "filenames derive from the doc's human id, not its title"
        - "index composes @lagrangefoundry/knowledge's exports in the CLI's own order (no bin in the packed artifact)"
      entry_point: "cli/index.ts case 'kb' (:642); cli/kb.ts INCLUDE_FIELD (:186)"
    - name: "Session knowledge surface"
      description: "Two surfaces in one Toolbox; landscape-first priming; degradation not failure."
      behaviors:
        - "KnowledgeToolbox beside every L1 control, read-only, scoped to the system KB on both axes by one instanceConfig"
        - "KnowledgeDocs primes landscape, then purpose, then the projected tool manual as mechanism"
        - "no KB built -> openKnowledgeRuntime returns null and the session is the pre-KB assistant"
        - "a KB that was built and fails to open says so rather than dropping the surface silently"
      entry_point: "cli/ai/host.ts, cli/ai/toolbox.ts"
    - name: "SiteStore port and its two adapters"
      description: "One async storage port; the filesystem and an in-memory store behind it, injected at construction."
      behaviors:
        - "hasDraft / readSiteJson / readPages / write / listAssets / readAsset / counter / appendChange / changesSince / pendingChanges / loadDraft"
        - "no verb returns a path"
        - "write is ONE verb taking a whole change (site.json + N pages + removals + asset bytes + asset removals)"
        - "edit.ts's 31 exports async; no node:fs / node:path / ../store import remains"
        - "editAssetAdd takes bytes; the source read moves to the CLI and the toolbox adapter; CLI surface and NOT_FOUND envelope unchanged"
        - "PreviewRenderer takes a SiteStore; PreviewFile carries bytes"
        - "store/assemble.ts and store/journal-model.ts are the node-free splits; loadSite delegates to assemble"
        - "a stored site is a directory that holds a definition (a leftover .DS_Store directory is not a site)"
        - "tests/support/site-factory.ts yields the same handle over both adapters"
      entry_point: "tools/generate/src/store/site-store.ts:113-149"
    - name: "Vitest node/workerd project split"
      description: "The store is provable in the runtime it will ship to."
      behaviors:
        - "vitest.config.mts is an orchestrator; vitest.node.config.mts is the previous config verbatim plus one exclude"
        - "vitest.workers.config.mts boots workerd with D1 DB and R2 SITES and the apps' own compatibility date/flags"
        - "routing convention stated once: *.workers.test.ts in workerd, everything else in node"
        - "the Astro .astro transform survives the split"
      entry_point: "vitest.config.mts"
    - name: "bin/build, bin/deploy, bin/smoke and 1c preflight"
      description: "One path to build, deploy and prove a deploy, for operator and automation alike."
      behaviors:
        - "bin/build: 1c preflight, pnpm -r build, per-app wrangler bundle against --env production"
        - "1c preflight reports shared-store components and packages, exits 6 naming what is absent"
        - "bin/deploy discovers apps/*/wrangler.toml; --dry-run is a target, not a second script"
        - "executable hooks in bin/deploy.d/{migrate,secrets}/ run in sorted order with DEPLOY_* in the environment; a non-zero hook aborts before anything uploads"
        - "bin/smoke: nine checks — apex, unknown-slug 404, unpublished indistinguishable from unknown, trailing-slash 301 on both channels, draft index HTML, draft cache-control + x-robots-tag, draft miss is a noindex 404, every referenced asset resolves following one level into CSS"
        - "a check with nothing to test against reports skip, never quiet success"
        - "[env.production.vars] repeats BUILDER_ORIGIN; a UAT asserts every Worker repeats every top-level var and binding, bindings found structurally"
        - "the secret mechanism is documented and never committed (printf piped into wrangler secret put)"
      entry_point: "bin/build, bin/deploy, bin/smoke, tools/generate/bin/smoke.mjs, cli/index.ts 'preflight'"
```

---

## Coverage Map

```yaml
coverage_map:
  - feature: "1c palette command group + /api/palette + census + guards"
    status: uncovered
    existing_stories: []
    existing_acs: []
    gaps:
      - "STORY-97 declares 'any colour-picker or palette-editor UI' explicitly out of scope"
      - "STORY-80 owns the palette VALUE MODEL only — what a colour may be, how a reference resolves — not how an entry is added, renamed or removed"
      - "no story records a per-entry usage census, a delete guard, or an atomic rename"
    notes:
      - "STORY-80's technical note already anticipates the count ('usage is tallied per entry ... what makes the count a palette editor shows the whole truth'), which is the hook this story hangs on rather than duplicates"
  - feature: "Palette popup component (manage + pick, shade slider, modal shell)"
    status: uncovered
    existing_stories: []
    existing_acs: []
    gaps:
      - "STORY-99 owns the toolbar CONTRACT (re-derived from what is displayed) but no action's own behaviour"
      - "STORY-101 owns the segment dialog alone; the popup is a second dialog with two callers"
    notes:
      - "the extracted modal shell is now shared by both dialogs, which is why it is documented with the popup rather than with the segment dialog"
  - feature: "Draft change journal (counter, records, list_changes, 1c changes, reminder signal)"
    status: uncovered
    existing_stories: []
    existing_acs: []
    gaps:
      - "STORY-100 records the validated atomic write but not that a write returns a counter or leaves a record"
      - "STORY-103 records the conversation but nothing about a between-turn change signal"
      - "`status` answers a different question and no story implies otherwise"
  - feature: "Colour fields on a segment (color / surfaceFill), write-side validation"
    status: partial
    existing_stories: ["story-37a3921b"]
    existing_acs: []
    gaps:
      - "STORY-100's out-of-scope clause defers colour explicitly on the stated ground that the palette control and the colour-valued field shape do not exist yet — both now exist"
      - "no AC covers a typed non-scalar field value, palette membership validation, or shade bounds"
  - feature: "Locked controls generalised, with a reason, refusing a change never the status quo"
    status: partial
    existing_stories: ["story-37a3921b"]
    existing_acs: []
    gaps:
      - "STORY-100 carries the single italic lock and its argument; it has no rule, no reason field, and no lockError in the refusal chain"
  - feature: "The colour row and escalation row in the segment dialog; the lock's visible face"
    status: partial
    existing_stories: ["story-3bf94bd4"]
    existing_acs: []
    gaps:
      - "STORY-101 defers a run's colour and the panel background behind it, naming the palette control as the blocker"
      - "STORY-101's preview mapping records 'a run's colour is a row this table gains when the palette control lands'"
      - "no AC covers lock presentation at all — REQ-135's italic lock shipped enforced and invisible"
  - feature: "The editing box mirrors capitalisation and tracking"
    status: partial
    existing_stories: ["story-3bf94bd4"]
    existing_acs: []
    gaps:
      - "STORY-101 records the OPPOSITE as shipped behaviour: 'Capitalisation is written and does not arrive', with a covering criterion deliberately claiming three parameters rather than four"
      - "letter-spacing — the same defect, and the half that predates it — is not asserted anywhere; removing the fix left every suite green"
  - feature: "1c kb build/export/status; opt-in corpus membership; generated awareness map"
    status: uncovered
    existing_stories: []
    existing_acs: []
    gaps:
      - "no story covers a corpus, an index or a map"
  - feature: "The session's knowledge surface and landscape-first priming"
    status: partial
    existing_stories: ["story-a58a0974"]
    existing_acs: []
    gaps:
      - "STORY-103 declares 'Knowledge-base retrieval ... no retrieval is claimed here', with the condition 'until a corpus exists' now met"
  - feature: "SiteStore port, two adapters, site factory, workerd test project"
    status: uncovered
    existing_stories: []
    existing_acs: []
    gaps:
      - "STORY-100 owns what a validated edit means, not where the bytes live"
      - "STORY-94/95 own the DEPLOYED snapshot's shared storage, a different store on the far side of a deploy"
      - "STORY-99's origin owns confinement and freshness, not a store interface"
  - feature: "bin/build, bin/deploy, bin/smoke, 1c preflight, [env.production] inheritance guard"
    status: uncovered
    existing_stories: []
    existing_acs: []
    gaps:
      - "STORY-94 is `1c deploy` for a SITE snapshot; STORY-95 is serving it; neither touches wrangler config, the Worker upload, deploy hooks, or a live-origin check"
    notes:
      - "STORY-95 carries this as an open uncertainty ('the end-to-end smoke check against a live bucket ... [was] never run in session'), which bin/smoke answers — but as a new operator capability, not as a change to what the server does"
  - feature: "Version bumps (af9b8ab, c60cbf7) and the version half of 8581a92"
    status: covered
    existing_stories: []
    existing_acs: []
    gaps: []
    notes:
      - "No behaviour. No plan item."
```

---

## Plan Items

| # | Component | Type | Points | Deps | Target | Description |
|---|-----------|------|--------|------|--------|-------------|
| 1 | Palette Management: `1c palette` & `/api/palette` | feature | 3 | – | – | Read with per-entry census; set/add/rm/rename with server-side delete and rename guards; one structural walk; five operations on the AI surface |
| 2 | Builder Palette Popup | feature | 3 | 1 | – | One surface, two callers (manage + pick); usage-labelled swatches; continuous shade slider on the renderer's own arithmetic; shared modal shell |
| 3 | Draft Change Journal | feature | 3 | – | – | Counter + windowed self-describing records; `list_changes` (untrusted) and `1c changes`; the per-turn reminder signal |
| 4 | Structured Copy Editing — colour fields and the faithfulness lock | upgrade | 3 | 1 | STORY-100 (story-37a3921b) | `'color'` field type validated against this site's palette; the italic lock generalised to a stated rule with a reason and a `lockError` |
| 5 | In-Page Copy Editing — colour row, lock's face, mirroring box | upgrade | 3 | 2, 4 | STORY-101 (story-3bf94bd4) | Colour row opening the popup in pick mode; escalation row to the panel behind the words; locks drawn with their reason; capitalisation and tracking reach the glyphs |
| 6 | System Knowledge Base: Corpus, Index & Generated Map | feature | 3 | – | – | `1c kb build\|export\|status`; opt-in `fields.system_kb`; generated map; parsed declaration |
| 7 | AI Site Assistant — the session's knowledge surface | upgrade | 2 | 6 | STORY-103 (story-a58a0974) | Two surfaces in one Toolbox, read-only and doubly scoped; landscape-first priming; degradation not failure |
| 8 | Site Store Port & Workers Test Runtime | feature | 3 | – | – | Async `SiteStore` with no path-returning verb and one write verb; two injected adapters; the workerd project the store UATs need |
| 9 | Platform Build, Deploy & Smoke Scripts | feature | 3 | – | – | `bin/build` / `bin/deploy` / `bin/smoke`, `1c preflight`, hook seams, and the `[vars]` inheritance guard behind the 503 |

**Totals**: 9 items — 6 feature, 3 upgrade — 26 story points.

---

## FC Test Coverage

The dispatcher passed an empty `fc_tests` list, so the on-disk set was enumerated directly. Every FC test belonging to this anchor's tickets is owned by a plan item:

| FC test file | Item |
|---|---|
| `test_UAT_FC_REQ-133_palette_popup.test.ts` | 1, 2 |
| `test_UAT_FC_BUG-35_tracking_reaches_the_words.test.ts` | 5 |
| `test_UAT_FC_REQ-131_change_journal.test.ts` | 3 |
| `test_UAT_FC_REQ-140_segment_colour.test.ts` | 4, 5 (and item 8 for its stored-site predicate) |
| `test_UAT_FC_REQ-139_locked_controls.test.ts` | 4, 5 |
| `test_UAT_FC_REQ-123_system_kb.test.ts` | 6 |
| `test_UAT_FC_REQ-123_session_knowledge.test.ts` | 7 |
| `test_UAT_FC_REQ-141_project_routing.test.ts` | 8 |
| `test_UAT_FC_REQ-141_workers_runtime.workers.test.ts` | 8 |
| `test_UAT_FC_REQ-142_site_store_port.test.ts` | 8 |
| `test_UAT_FC_REQ-144_deploy_scripts.test.ts` | 9 |

Fourteen further `test_UAT_FC_*` files on disk (BUG-34, REQ-122 ×3, REQ-126, REQ-127 ×2, REQ-129, REQ-130, REQ-135, REQ-136, REQ-137, REQ-138) belong to earlier bundles, not to this anchor, and are deliberately not claimed here. `test_UAT_FC_REQ-137_palette_shade.test.ts` was *edited* by commit e70668d (its store walk now selects a directory that holds a definition) but its ownership stays with REQ-137's own reconciliation.

---

## Step 3b — Intent Scope vs Implementation Footprint

**Case 1 (implementation matches intent).** Items 1, 2, 3, 6, 8 and 9. Each commit's footprint is within its ticket's declared deliverables, including the two things a reader might mistake for creep: REQ-133's `mapL1PaletteRefs` consolidation (declared in its §6, "one structural walk, not three") and REQ-142's site factory (declared in its §8, with an AC-7 added for it).

**Case 2 (intent explicitly supersedes existing behaviour).** Items 4, 5 and 7, and all three are the *cleanest possible* form of it — the superseded stories each state the deferral, name the blocker, and name the condition under which it lifts:

- STORY-100: "Deferred for one reason: a colour on this surface must be a pick from the site's palette rather than a hex a user can invent, and neither the palette control nor the colour-valued field shape exists yet (REQ-133)."
- STORY-101: "a run's **colour** and its **family**, and the **panel background** behind it — the palette control those need is a later phase"; and, separately, "Capitalisation is written and does not arrive ... recorded rather than absorbed ... the day the words are drawn in something that carries it the evidence fails and says so." The fix took the other route — the words are drawn in the same control, which now inherits the two properties — so the prediction's *mechanism* differed while its *outcome* (the recorded hole closes and the evidence must change) is exactly what happened.
- STORY-103: "Knowledge-base retrieval. The intent states priming is the role preamble plus the generated manual **until a corpus exists**; no retrieval is claimed here."

**Case 3 (code touching areas the intent does not declare).** Two, both small, both recorded rather than absorbed:

1. **The two dead example sites.** REQ-140 §7 declares the deletion of `storage/sites/1stcontact` and `storage/sites/harbor-cafe` (operator-confirmed), but two stories owned by *other* intents carry standing statements about them: STORY-80 ("the other two carry pre-L1 module-based pages with no L1 colour axes to convert; they remain valid with no palette at all, which is the 'palette is optional' guarantee in action") and STORY-97 ("two of the four sites are vacuously retrofitted ... `1stcontact` and `harbor-cafe` census at zero colour literals"). Those sentences are now factually stale. **No plan item absorbs them**: the property each was illustrating survives — both suites were re-pointed at a *synthesised bare site*, which is the better fixture anyway — so what is stale is the worked example, not the claim. Flagged here for the owning intents rather than folded into this bundle's stories. What *is* claimed here is the behavioural half: "a stored site is a directory that holds a definition", which is a store-walk predicate and lands in item 8.
2. **REQ-142's repair of two pre-existing failing suites.** `reconciliation-beyond-l1-authoring` and `test_UAT_FC_REQ-130_beyond_l1` had un-awaited `Toolbox.run` calls that only passed because `edit.ts` was synchronous; making the write genuinely async lost that race, so their `Box.run` types were corrected and their call sites awaited. That is a test correction inside those suites, not a behaviour change, and the other nine suites in the same condition were deliberately left alone. No plan item.

---

## Observations

- **Nine intents, nine items, and the mapping is not one-to-one — deliberately.** REQ-140 and REQ-139 both land on the same two stories (the write path and the gesture), so they are two items split by *side of the seam* rather than four split by ticket; BUG-35 joins the gesture item because it closes a divergence that story already records. REQ-141 and REQ-142 are one item because REQ-141's own stated purpose is that it "blocks the store port and every store UAT after it" — and because a test-project split documented alone would be precisely the test-only story the planning rules forbid, while its FC tests still need an owner. REQ-133 and REQ-123 each split into two, along the same seam the matrix already uses everywhere else: the surface a caller reaches (CLI/API, build pipeline) versus the thing an operator or a session actually touches (popup, primed conversation).
- **Every upgrade item targets a story that names its own successor.** This bundle is unusually clean in that respect: three separate stories carry a deferral clause that states the blocker by ticket number, and this bundle lands all three blockers. That is why the upgrade/feature split here needed little judgement — the matrix said where the work goes.
- **The `color` field is the first non-scalar `L1FieldValue`, and STORY-100 predicted it.** Its technical context already argued that the vocabulary grows along a *narrowing* axis and that "the colour-from-the-palette control the next phase needs is the same move again". What shipped chose a typed object over a magic string, keeping the enforcement server-side — so the prediction holds and the AC changes are an extension of an existing argument rather than a new one.
- **Two guards in this bundle exist because the same class of bug bit twice.** REQ-144's `[env.production]` inheritance check (public-site already recorded the rule in a comment; control-app did not follow it) and REQ-140 §9's "a directory entry is not a site" (the same mistake made in opposite directions, in an assertion and in a store walk). Both are worth carrying into ACs as *recurrence* guards rather than as one-off fixes — REQ-144's finds bindings structurally for exactly this reason.
- **REQ-141's recorded correction is a live matrix hazard.** The ticket's original diagnosis of the workerd postinstall failure (a supply-chain minimum-release-age gate) was **retracted after promotion** — four controlled experiments identified pnpm 11.9.0's incremental resolution instead — and the ticket notes that "the rationale comment in `vitest.workers.config.mts` states the wrong cause and should be corrected or removed", left in the tree pending a decision. Item 8's ACs must be written about the *routing convention and the bindings*, which are the deliverable, and must **not** encode the exact pin or its stated rationale as a criterion. Flagged so a later reader does not re-derive the retracted theory from a stale comment.
- **Three of REQ-144's own findings are deliberately unfixed and must not become ACs.** `app.1stcontact.io` is NXDOMAIN (a zone route with no DNS record), `1stcontact-control-app` has never been deployed, and the secret mechanism is documented and dry-run-tested but never proved end-to-end against the live account. All three are sequenced behind REQ-147's Cloudflare Access gate on purpose, because creating the record and deploying would make the builder publicly reachable. Item 9 documents the scripts and the config guard; it claims no live control-app deploy.
- **Suite state is not clean, and none of it is attributable to this bundle.** Every ticket independently verified its failure set against its own baseline: REQ-141 re-ran the same 13 files against the *old* single config out of HEAD and got a byte-identical 13 files / 75 tests; REQ-142 reports 56 failures in 11 files, "exactly the pre-existing set on `xgd-working` — same files, same counts", with no assertion changed. The cause is upstream: `@lagrangefoundry/ai`'s toolbox now returns objects where refusals used to be strings, and `Toolbox.run` became async. Closing those belongs to whichever ticket owns the toolbox upgrade, not to this reconciliation.
- **A survey hazard worth restating.** `tools/generate/src/cli/builder.ts` and `fidelity.ts` contain deliberate NUL bytes as cache-key separators, so a plain `grep -r` classifies them as binary and skips them silently. `builder.ts` is a heavy consumer of `edit.ts` and of the palette API; every grep behind this plan passed `-a`.
- **Uncertainty, stated.** Item 5 folds three tickets' client-side work into one upgrade. If the downstream story cycle finds the AC set unwieldy, the natural split is *colour + escalation row* against *lock presentation + box mirroring* — but they share one dialog, one save, and one descriptor-routing rule, so splitting them first would have been inflation.