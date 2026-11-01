---
uid: report-0872dab5
id: REPORT-7176
type: report
title: 'Reconciliation Plan: free-coded BUNDLE-34 (REQ-175 + REQ-178 + REQ-166 + BUG-46
  + REQ-173)'
created_by: xgd
created_at: '2026-11-01T01:06:25.354010+00:00'
updated_at: '2026-11-01T01:06:25.354010+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_plan
  subject_uid: bundle-fd009b93
  anchor_uid: bundle-fd009b93
  items:
  - index: 1
    component: Page Authoring Through The Control Surface (REQ-175)
    item_type: upgrade
    story_points: 3
    dependencies: []
    description: 'Extends existing story STORY-106. The L1 page document becomes addressable:
      get_page_style reads the document-level keys (widths, background, textColor,
      column, resources; list derived from l1DocumentSchema as L1_DOCUMENT_KEYS) verbatim
      with palette refs kept as refs; set_page_style merges at the top level, replaces
      values whole, and removes a key with null; it sits in AuthorPages beside set_l1.
      describe_page carries the document keys. Writes (set_l1, set_page_style and
      every validateOrThrow caller) refuse a write that INTRODUCES a dangling reference
      — a fontFamily stack with no mirrored face and no generic fallback, or an image/asset
      handle with no stored bytes (query/fragment stripped before comparison) — compared
      by reference value between stored and proposed page, so inherited dangling refs
      from a reproduction remain readable and writable. Every node and every document
      key of every reproduced page round-trips through the surface (document parity).'
    justification: 'STORY-106 covers map/read/replace of the element tree at a node
      address but nothing about the document keys, which had no path, and it pins
      ''exactly one way to change what is on a page'' (AC-1092) which set_page_style
      now qualifies. No new capability bucket: this is the same read/replace symmetry
      on the same control surface, extended up one level, plus a refusal rule on the
      same write path.'
    story_uid: null
    target_story_ids:
    - STORY-106
    acceptance_criteria_changes:
      add:
      - Reading the page style returns every document-level key of the page exactly
        as stored (palette references unresolved), and the key set is derived from
        the document schema so a newly added key is covered without a code change
      - Setting the page style merges at the top level, replaces each given value
        whole, removes a key given as null, validates the resulting document, and
        leaves the element tree untouched
      - describe_page carries the page's document-level keys alongside the element
        map
      - A write that introduces a font-family stack naming no stored face and no generic
        fallback is refused naming the family, and the draft is unchanged; a stack
        ending in a generic family is accepted
      - A write that introduces an image or asset reference with no stored bytes is
        refused naming the reference; query string and fragment are ignored when matching
        a reference to a stored asset
      - A write is not refused for a dangling reference the stored page already carried,
        including when an inserted element shifts that reference to a different address
      - Every node and every document key of every reproduced page in the corpus round-trips
        through the surface (read then write back leaves the page unchanged)
      modify:
      - 'AC-1092: the surface offers exactly one way to change the element tree (set_l1)
        and one way to change the page''s document-level style (set_page_style); every
        operation it offers is one it declares'
      - 'AC-1090: a refused change — including a dangling-reference refusal — tells
        the caller nothing was written, which field or reference was wrong, and what
        to do instead'
      remove: []
    intent_delta_summary: 'Story grows from ''compose the element tree'' to ''compose
      the whole page document'': document-level keys gain a read/write pair and appear
      in describe_page, and the write path additionally refuses newly-introduced dangling
      font and asset references.'
  - index: 2
    component: Accounts, Membership & Entitlement (REQ-178)
    item_type: upgrade
    story_points: 3
    dependencies: []
    description: 'Extends existing story STORY-146. Admission returns the SET of businesses
      a person operates rather than one account: each AdmittedBusiness carries its
      own effective grant and its tenant name. A lapsed/future/revoked grant marks
      that business unselectable but keeps it in the list; a revoked or expired membership
      excludes its business entirely. no_membership / no_entitlement refuse the person
      only when no business qualifies. provisionBusiness is the shared write used
      by provisionInvite: the user is written first and alone, then membership + grant
      are batched so no business exists without an operator. A person with no business
      is refused as no_membership and re-inviting provisions one.'
    justification: STORY-146 owns admission and invitation but pins the one-account-per-person
      shape (AC-1748 'bound to an account and one effective grant') and per-person
      refusal on grant/membership state. REQ-178 explicitly changes that shape. Same
      capability bucket (capability-e5939ceb); no parallel admission path is introduced.
    story_uid: null
    target_story_ids:
    - STORY-146
    acceptance_criteria_changes:
      add:
      - A person holding memberships in several businesses is admitted with all of
        them, each carrying its own effective grant and its business name
      - A business whose grant has lapsed, not started or been revoked stays in the
        person's list marked unselectable, while the person is still admitted if any
        other business is entitled
      - A business whose membership is revoked or expired is absent from the list
        entirely
      - Inviting and self-serve provisioning go through one business-provisioning
        operation; membership and grant are written together so no business exists
        that nobody may operate
      - A person whose user record exists but who holds no business is refused as
        no_membership, and re-inviting them provisions a business
      modify:
      - 'AC-1748: an invited person is admitted with the deterministic set of businesses
        they operate, each bound to its own effective grant (replaces a single account
        and grant)'
      - 'AC-1750: a grant whose end has passed makes its business unselectable; the
        person is refused (no_entitlement) only when none of their businesses holds
        an admitting grant'
      - 'AC-1751: a grant whose start is in the future makes its business unselectable
        rather than refusing the person outright'
      - 'AC-1752: a revoked grant makes its business unselectable whatever its dates
        say'
      - 'AC-1753: a membership that is not active excludes that business; the person
        is refused (no_membership) only when no active membership remains, and grants
        are untouched'
      - 'AC-1740: an invite creates the person, then the business''s owner membership
        and active grant together, all readable back'
      remove: []
    intent_delta_summary: Admission changes from 'one account, one grant, refuse the
      person on any failure' to 'a set of businesses, a grant per business, denial
      pushed down to the business unless none qualify'; provisioning is factored into
      a shared provisionBusiness with a two-step write.
  - index: 3
    component: Reference Capture → Client Material (REQ-166)
    item_type: upgrade
    story_points: 2
    dependencies: []
    description: 'Extends existing story STORY-159. When the ticket store is available,
      capture_site adopts the bundle as one `reference` material ticket whose attachments
      are the bundle''s members (each with meta.member), so it becomes searchable
      corpus material. Body is written from capture.json plus the screenshot and opens
      with a markdown link to the captured site; title is the page''s own <title>
      (now extracted and carried optionally on Capture). Rights come from provenance:
      the client''s own domain is republishable and not exportable, any other domain
      the reverse. Recapture is keyed on bundle name (not URL); unchanged members
      (matched by sha256) are not rewritten, changed members are re-attached and the
      superseded record detached. The 1c CLI (no ticket store dep) captures as before
      and reports that no reference was written; a failed adoption is reported and
      never discards the bundle.'
    justification: STORY-159 covers capture_site storing a named reference and describe/list_reference,
      but nothing makes a capture into client material the assistant can recall. This
      extends the same tool (no new route, optional FidelityDeps dep) rather than
      introducing a new capability bucket.
    story_uid: null
    target_story_ids:
    - STORY-159
    acceptance_criteria_changes:
      add:
      - A successful capture_site on the deployed host writes one reference material
        ticket whose attachments are the bundle's members, each addressable as a single
        member
      - The reference is titled with the captured page's own title, and its body is
        derived from the capture record and screenshot and opens with a link to the
        captured site
      - A capture of the client's own domain is recorded republishable and not exportable;
        a capture of any other domain is recorded not republishable and exportable
      - 'Recapturing the same bundle name updates the same ticket: unchanged members
        (by content hash) write neither blob nor record, changed members replace and
        detach their superseded records'
      - With no ticket store available (the 1c CLI) capture behaves as before and
        states that no reference material was written; a failed adoption is reported
        and the bundle is kept
      modify:
      - 'AC-2044: capture_site records a public page as a named reference and returns
        its name, address, page and asset counts, an always-present refusals list,
        and whether/which reference material was written'
      remove: []
    intent_delta_summary: 'capture_site no longer stops at the ReferenceStore: a capture
      becomes a multi-member reference material ticket with provenance-derived rights
      and idempotent recapture.'
  - index: 4
    component: Material Library Surface (REQ-166)
    item_type: upgrade
    story_points: 2
    dependencies:
    - 3
    description: 'Extends existing story STORY-144. The Library detail pane handles
      a capture (reference material with many members): it previews the capture''s
      screenshot addressed as one member, shows the member/file count in place of
      the single-file File field, the download link fetches the screenshot rather
      than an arbitrary member, and links in the description open away from the builder
      so following one cannot discard unsaved editing state.'
    justification: STORY-144 owns the Library list/detail and its readers (AC-1811,
      AC-1723) for single-file material; a multi-member capture is a new shape the
      same pane now renders. No new screen or capability bucket.
    story_uid: null
    target_story_ids:
    - STORY-144
    acceptance_criteria_changes:
      add:
      - Selecting a captured reference shows its screenshot as the preview, addressed
        as one member of the capture
      - A captured reference states how many files it holds in place of the single-file
        field, and its download link returns the screenshot
      - A link in a material's description opens outside the builder, leaving the
        workspace and any unsaved edit in place
      modify:
      - 'AC-1723: a material''s file — or for a multi-member capture, a named member
        — comes back as itself with its own bytes and content type'
      remove: []
    intent_delta_summary: 'The Library detail pane learns the multi-member capture
      shape: screenshot preview, member count, screenshot download, and description
      links that cannot navigate the builder away.'
  - index: 5
    component: 'AI Site Assistant: Per-Site Conversations (BUG-46 origin half)'
    item_type: upgrade
    story_points: 2
    dependencies: []
    description: 'Extends existing story STORY-103. Opening a session reads the transcript
      by folding the live junction (seeding from the archive where no junction exists),
      not the archive alone, so a turn in progress is not lost on reload; it works
      with no model key. The session answer carries the cursor the fold consumed and
      a `live` flag (true exactly when a turn is open, by the closedPrefix rule).
      Only the ''no conversation yet'' case returns empty; other read failures surface
      as failures. streamTurn waitUntil()s the stream so turn_end and archive sync
      complete after the client disconnects. /api/ai/reattach requires a cursor and
      tails the junction from it as the same data: frames the panel parses, with no
      gap and no duplicates.'
    justification: 'STORY-103 owns opening a session (AC-1052) and durable conversation
      storage (AC-1057), and these were wrong: a reload mid-turn lost the turn. This
      is a bug fix to the existing capability, hence an upgrade; reattach is an extension
      of the same conversation surface, not a new bucket.'
    story_uid: null
    target_story_ids:
    - STORY-103
    acceptance_criteria_changes:
      add:
      - Opening a conversation while a turn is in progress returns that turn's records
        so far, and reports the cursor consumed and that a turn is live
      - A turn whose client disconnects still runs to completion and is archived,
        because the host holds the request open for it
      - Reattaching from a cursor streams the rest of a live turn in the same frame
        format, with nothing before the cursor repeated; a reattach with no cursor
        is refused
      - A transcript read failure other than 'no conversation yet' is reported as
        a failure, not as an empty conversation
      modify:
      - 'AC-1052: opening a conversation answers with its identifier, the turns already
        spoken including any turn still in progress, the cursor reached, whether a
        turn is live, and whether a turn can be run'
      remove: []
    intent_delta_summary: Session open reads the junction instead of the lagging archive,
      reports cursor + live, turns outlive their client via waitUntil, and a reattach
      endpoint lets a client rejoin a live turn.
  - index: 6
    component: Assistant Pane (BUG-46 panel half)
    item_type: upgrade
    story_points: 2
    dependencies:
    - 5
    description: Extends existing story STORY-104. When the session reports a live
      turn, the pane does not append the open assistant turn as a finished message;
      it seeds a resumed bubble with what was already said (or nothing) and calls
      reattach (via webui-chat resume) so the remainder streams into the same bubble.
      The rejoin is not awaited (site switching stays immediate), writes during the
      resumed turn still drive site_changed preview reloads, a failed rejoin costs
      only the tail and never throws, a settled conversation never tails, and a transport
      lacking streamReattach mounts and never rejoins.
    justification: STORY-104 AC-1063 promises the pane shows the conversation after
      a reload, but a turn in progress appeared frozen/truncated. Same pane, same
      capability; upgrade.
    story_uid: null
    target_story_ids:
    - STORY-104
    acceptance_criteria_changes:
      add:
      - A pane loaded during a live turn shows what has been said so far as one assistant
        message that continues to grow until the turn ends, with no user message added
      - Writes made by a rejoined turn reload the page beside the conversation just
        as a turn started in the pane does
      - A conversation with no live turn is not rejoined; a failed rejoin leaves the
        pane usable; a transport without rejoin support still mounts
      modify:
      - 'AC-1063: the pane shows what that site''s conversation already contains on
        first open and after the workspace is reloaded, including a turn still in
        progress, which it continues to receive'
      remove: []
    intent_delta_summary: The pane rejoins a live turn after reload, rendering it
      as one continuing assistant message, guarded against over-firing.
  - index: 7
    component: Material Description & Ingestion (REQ-173)
    item_type: upgrade
    story_points: 3
    dependencies: []
    description: Extends existing stories STORY-141 and STORY-140. Every describer
      branch yields a digest as the material body; a document's full extracted text
      is returned as Description.fullText and written once as a `material_text` comment
      on the material ticket (bounded by MAX_EXTRACTED_TEXT_CHARS). The chunk index
      still chunks the full text (via a reading view where a material's body is its
      full text) and chunk hits carry the material uid, while the document index reads
      the digest. The digest is produced by a lightweight AI-host session (no tools,
      no priming, NullArchive, closed per document). With no model API key, /api/status
      reports it, the builder shows a banner and becomes inert, and ingestion routes
      refuse with 503 instead of storing an undescribed material.
    justification: STORY-141 pins a document's body as its own words (AC-1688, AC-1689)
      and the bounded-body rule (AC-1699); STORY-140 pins ingestion behaviour with
      degraded describers. REQ-173 explicitly changes what a body is and turns 'no
      key' from degraded material into a refused upload. Same capability buckets (Material
      Ingestion); no parallel ingestion path.
    story_uid: null
    target_story_ids:
    - STORY-141
    - STORY-140
    acceptance_criteria_changes:
      add:
      - A document's full extracted text is stored once as a material_text comment
        on its material, bounded and marked where truncated
      - Searching for words deep inside a document still finds that material by its
        own uid, while the material's listed description is the digest
      - Describing a document opens one tool-less, unprimed describer session that
        writes no conversation record and is closed afterwards
      - With no model key configured, the status endpoint says so, the builder shows
        a banner and accepts no input, and every ingestion route refuses with 503
        storing nothing
      modify:
      - 'AC-1688: a document that carries text yields a digest of its content as the
        material''s body and its own declared title where it has one; its words are
        kept in full on the text comment'
      - 'AC-1689: a text-shaped file becomes material whose body is a digest of its
        decoded contents, with the contents kept in full on the text comment'
      - 'AC-1699: a description body is a bounded digest and a title is a single collapsed
        line; full text is bounded separately on the text comment'
      remove:
      - AC-1692
    intent_delta_summary: Material body changes from transcription to digest with
      full text moved to a comment (retrieval depth preserved); describing runs as
      a lightweight host session; a missing model key now blocks the builder and refuses
      ingestion instead of storing degraded material (superseding AC-1692).
---

# Reconciliation Plan

**Mode**: commits
**Source**: free-coded commits on BUNDLE-34 (REQ-175, REQ-178, REQ-166, BUG-46, REQ-173)

## Behavior Inventory

```yaml
behavior_inventory:
  source: "commits 18102f73, b1cafc80, f1a2b408, 6be7ac96, 0504c113, 0fadd0f7 (+ version/merge-only commits)"
  features:
    - name: page document authoring (REQ-175)
      entry_files: [packages/site-schema/src/l1/schema.ts, packages/site-schema/src/l1/validate.ts, tools/generate/src/cli/edit.ts, tools/generate/src/cli/ai/l1-surface.json, tools/generate/src/cli/ai/toolbox-core.ts]
      behaviors:
        - L1_DOCUMENT_KEYS derived from l1DocumentSchema
        - get_page_style reads document keys verbatim; set_page_style merges top-level, whole-value replace, null removes
        - describe_page includes document keys
        - danglingFontFamilies / danglingAssetReferences; write refuses only newly-introduced dangling refs, keyed by value
        - font rule applies to the stack (generic fallback = valid); asset match strips query/fragment
        - document parity round-trip over storage/sites corpus
    - name: multi-business admission (REQ-178)
      entry_files: [apps/control-app/src/identity.ts]
      behaviors:
        - admit returns set of AdmittedBusiness {grant, tenant name}
        - lapsed grant -> business unselectable; revoked/expired membership -> business excluded
        - no_membership/no_entitlement only when none qualify
        - provisionBusiness shared with provisionInvite; user write then membership+grant batch
    - name: capture becomes reference material (REQ-166)
      entry_files: [apps/control-app/src/capture-material.ts, tools/generate/src/cli/ai/fidelity-core.ts, tools/generate/src/cli/capture/extract.ts, apps/control-app/src/builder/library.js]
      behaviors:
        - one reference ticket, N member attachments with meta.member
        - title from page <title>; body from capture.json + screenshot with link
        - rights from provenance (own domain vs other)
        - recapture keyed by bundle name; sha256 dedupe; superseded records detached
        - optional dep: 1c CLI unaffected; adoption failure reported, bundle kept
        - Library pane: screenshot preview, member count, screenshot download, links open outside builder
    - name: reload during a turn (BUG-46)
      entry_files: [apps/control-app/src/router.ts, apps/control-app/src/index.ts, tools/generate/src/cli/ai/host-core.ts, apps/control-app/src/builder/chat.js, apps/control-app/src/builder/api.js]
      behaviors:
        - storedTranscript folds junction, returns cursor + live
        - narrowed empty-conversation catch
        - streamTurn waitUntil via ExecutionContext
        - /api/ai/reattach (cursor required) tails watch()
        - panel seeds resumed bubble and rejoins; non-awaited; site_changed honoured; guarded absences
    - name: material digest + full text comment + no-key block (REQ-173)
      entry_files: [apps/control-app/src/describe.ts, apps/control-app/src/material.ts, apps/control-app/src/knowledge.ts, apps/control-app/src/ai.ts, apps/control-app/src/router.ts, apps/control-app/src/builder/app.js]
      behaviors:
        - every branch -> digest body; fullText -> material_text comment
        - chunk index reads full text via reading view; doc index reads digest
        - describer = lightweight host session (no tools, NullArchive)
        - no key: /api/status, banner + inert shell, ingestion 503
```

## Coverage Map

```yaml
coverage_map:
  - feature: page document authoring
    status: partial
    existing_stories: [STORY-106]
    existing_acs: [AC-1083, AC-1085, AC-1090, AC-1092]
    gaps: [document keys read/write, describe_page doc keys, dangling-ref refusal, parity]
  - feature: multi-business admission
    status: partial (contradicted)
    existing_stories: [STORY-146]
    existing_acs: [AC-1740, AC-1748, AC-1750, AC-1751, AC-1752, AC-1753]
    gaps: [set of businesses, per-business denial, provisionBusiness]
  - feature: capture becomes reference material
    status: partial
    existing_stories: [STORY-159]
    existing_acs: [AC-2044]
    gaps: [ticket adoption, members, rights, recapture idempotence, CLI unaffected]
  - feature: Library shows a capture
    status: partial
    existing_stories: [STORY-144]
    existing_acs: [AC-1723, AC-1811]
    gaps: [multi-member preview/count/download, links open away]
  - feature: reload during a turn (origin)
    status: partial (bug)
    existing_stories: [STORY-103]
    existing_acs: [AC-1052, AC-1057]
    gaps: [junction fold, cursor/live, waitUntil, reattach]
  - feature: reload during a turn (panel)
    status: partial (bug)
    existing_stories: [STORY-104]
    existing_acs: [AC-1063]
    gaps: [rejoin live turn as one bubble, guards]
  - feature: material digest / no-key block
    status: partial (contradicted)
    existing_stories: [STORY-141, STORY-140]
    existing_acs: [AC-1688, AC-1689, AC-1692, AC-1699]
    gaps: [digest body, text comment, deep retrieval preserved, describer session, no-key 503 + banner]
```

## Plan Items

| # | Component | Type | Points | Deps | Description |
|---|-----------|------|--------|------|-------------|
| 1 | Page authoring (REQ-175) | upgrade STORY-106 | 3 | - | get/set_page_style, describe_page doc keys, dangling font/asset refusal, parity |
| 2 | Accounts & entitlement (REQ-178) | upgrade STORY-146 | 3 | - | admit returns businesses; per-business denial; provisionBusiness |
| 3 | Capture → material (REQ-166) | upgrade STORY-159 | 2 | - | capture_site adopts bundle as reference ticket with members |
| 4 | Library (REQ-166) | upgrade STORY-144 | 2 | 3 | detail pane renders a capture |
| 5 | Conversations (BUG-46) | upgrade STORY-103 | 2 | - | junction fold, cursor/live, waitUntil, reattach |
| 6 | Assistant pane (BUG-46) | upgrade STORY-104 | 2 | 5 | panel rejoins live turn |
| 7 | Material description (REQ-173) | upgrade STORY-141, STORY-140 | 3 | - | digest body, full-text comment, describer session, no-key block |

## Observations

- Commits 6cddcbb1, 68db3937, 77250a1a, 758e0c71, 0740bf63, af50fe67, 32db3756 are version bumps / merge commits / a conflict-marker fix to package.json; they carry no product behaviour and need no plan item.
- All items are upgrades: every behaviour extends a story already in the matrix. No new capability bucket was found.
- Case 2 supersessions: REQ-178 explicitly retracts the singular accountId/entitlement shape (AC-1748, AC-1750..1753 modified rather than removed since each still has a per-business form). REQ-173 explicitly retracts 'store a degraded material when no key' — AC-1692 is listed for removal (superseded); AC-1688/1689/1699 are modified because a body is now a digest.
- REQ-175's dangling-reference finders live in packages/site-schema (STORY-83 territory) but are enforced only on the write path, outside validateL1 on purpose; they are documented on the authoring story (STORY-106) rather than altering STORY-83's validator ACs.
- BUG-46 commit 6be7ac96 notes the junction is still isolate-memory-scoped (eviction mid-turn still loses that turn); not documented as a capability.
- REQ-173 notes the chunk-index reading view is temporary pending a lagrange-framework change; the AC is phrased on the observable (deep text still retrievable) so it survives that change.
- `xgd ticket search` could not run in this sandbox (embedding cache write denied); reuse was established by walking the full story list (both pages) and reading candidate stories' ACs directly.
- No FC test files were reported for these tickets in the prompt's provisional-evidence block, though the commits add test_UAT_FC_REQ-175/178/166/173 and BUG-46 TS tests; the story cycle should map those to the new ACs above.
