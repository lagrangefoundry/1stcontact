---
uid: report-72fa65e2
id: REPORT-6761
type: report
title: 'Reconciliation Plan: free-coded (BUNDLE-32: BUG-45, BUG-44, BUG-47, REQ-157,
  REQ-176, REQ-174, BUG-49, REQ-177)'
created_by: xgd
created_at: '2026-10-26T01:03:30.388344+00:00'
updated_at: '2026-10-26T01:12:44.794825+00:00'
completed_at: null
last_field_updated: items
fields:
  report_kind: reconciliation_plan
  subject_uid: bundle-5607a08d
  anchor_uid: bundle-5607a08d
  items:
  - index: 1
    component: Site Asset Store (registry removed)
    item_type: upgrade
    story_points: 3
    dependencies: []
    target_story_ids:
    - story-c46abfa6
    - story-b3de4571
    description: 'Extends existing story story-c46abfa6 (STORY-102, Ask my site what
      assets it has) and story-b3de4571 (STORY-107, generated images). BUG-44 overruling
      BUG-45 (commits 9805ee506e merge + d46756fefa): the site definition carries
      no `assets` registry (siteSchema drops the key; a stored definition still carrying
      it loads unchanged and the key is ignored; tracked storage/sites stripped).
      A site''s assets are exactly the bytes its store holds: listSiteAssets / list_assets
      / `1c asset list` report the draft''s assets/ directory alone, with no `registered`/declared
      field and no `(unregistered)` marker. get_asset answers for anything list_assets
      shows, by id or by its `/assets/<name>` handle, in the listing''s own shape,
      and still refuses (NOT_FOUND) a name the store does not hold. add_asset, write_image
      and remove_asset write bytes and never site.json: add/write refuse a name the
      store already holds unless replace is explicit; remove refuses a name referenced
      by a module field unless forced; each records a draft-journal entry. Alt text
      belongs to the L1 image node: add_asset and write_image take no `alt`, get_asset
      reports none. assetRefSchema remains accepted inside backgroundSchema and layerChildSchema.
      The L1 surface (surface_version bumped) no longer describes registration anywhere,
      its absence note reads ''Fetching a picture, or any file, yourself'' and tells
      the assistant to ask for the file to be dropped on the site-asset area, it tells
      the assistant that a dropped file''s description lives on its material ticket
      to be read and written onto the node, and write_image states a drawing is never
      a stand-in for a file the client supplied.'
    justification: 'STORY-102''s AC-1018/1019/1020/1022 explicitly pin the declared-registry
      + store union (declared-in-definition flag, declared asset listed with no file,
      alt from the definition) which BUG-44 deletes by operator decision; STORY-107''s
      AC-1104/AC-1105 pin ''registered as an image, with the alt text given'' and
      ''no registry change''. The behaviour stays inside the existing Site Asset Store
      capability (capability-b4ac88fc / 105cfacf) and the generated-images story;
      no new capability bucket is introduced — the listing, read, write and remove
      operations already exist and are narrowed in place. FC evidence: tests/test_UAT_FC_BUG-44_promoted_asset_is_usable.workers.test.ts,
      tests/test_UAT_FC_BUG-44_surface_tells_the_truth.test.ts, plus edited reconciliation-site-asset-listing
      / beyond-l1-authoring / req118 suites.'
    intent_delta_summary: The asset store stops being a union of a declared registry
      and stored bytes and becomes the bytes alone; every asset operation (list/get/add/write/remove)
      acts on the store and never on site.json; alt text moves to the picture element;
      the assistant's manual stops talking about registration, tells it where a dropped
      file's description lives, and forbids substituting a drawing for a supplied
      file.
    acceptance_criteria_changes:
      add:
      - A site definition validates with a legacy `assets` key present and with it
        absent; the key is ignored, never refused, and nothing reads it (STORY-102)
      - get_asset resolves any asset list_assets reports, by its id and by its `/assets/<name>`
        handle, returning the listing's own entry shape, and refuses one the store
        does not hold (STORY-102)
      - add_asset, write_image and remove_asset change the stored bytes while leaving
        site.json byte-identical, and each records one draft-journal entry; add/write
        refuse an already-held name unless replacement is explicit, remove refuses
        a module-referenced asset unless forced (STORY-102)
      - The control surface offers no `alt` parameter on add_asset or write_image,
        get_asset reports no alt, and no operation description or absence claims registration
        is a precondition for use; the absence note directs the client to drop the
        file on the site-asset area and tells the assistant a dropped file's description
        is on its material, to be written onto the image node (STORY-102)
      - write_image's declared description states a drawing is never a stand-in for
        a file the client supplied — if that file cannot be found or used the assistant
        says so and asks for it (STORY-107; asserted on the declaration, not on model
        obedience)
      - backgroundSchema and layerChildSchema still accept an asset reference object
        (STORY-102)
      modify:
      - 'AC-1018 (acceptance_criterion-4cd04340): every file present in the site''s
        asset store is listed; entries carry handle, identity (filename), usage kind
        and present-on-disk — no declared-in-definition / registered flag'
      - 'AC-1020 (acceptance_criterion-cd61874f): every listed asset is named in the
        site-local handle form a page holds, in handle order; drop the bare-filename-declaration-merges-with-qualified-file
        case (and the off-site declared byte case) since nothing declares an asset'
      - 'AC-1022 (acceptance_criterion-bc7cc7f1): CLI listing entry shape drops descriptive
        text and declared-in-definition, and prints no `(unregistered)` marker'
      - 'AC-1104 (acceptance_criterion-651ded8e): a composed drawing is written as
        an ordinary site image (bytes only, no registration, no alt on the asset),
        still referenceable via the returned handle and shipped unaltered'
      - 'AC-1105 (acceptance_criterion-ca166956): a refused drawing writes no byte
        and leaves the stored site definition byte-identical (replace ''no registry
        change'')'
      remove:
      - 'AC-1019 (acceptance_criterion-c15ea16c): ''A declared asset contributes its
        identity and description, and is listed even with no file present'' — withdrawn
        by BUG-44 (registry deleted, operator decision; commit d46756fefa names AC-1019
        explicitly)'
    story_uid: story-c46abfa6
  - index: 2
    component: Site-Asset Promotion & Library placement (placed_on)
    item_type: upgrade
    story_points: 3
    dependencies:
    - 1
    target_story_ids:
    - story-aacb7060
    - story-1500b111
    description: 'Extends existing story story-aacb7060 (STORY-143, Site-Asset Promotion)
      and story-1500b111 (STORY-144, The Library). BUG-47 (merge 8d93d32d8b) plus
      BUG-45''s surviving promotion behaviour: `site_slug` is retired from material/reference
      and replaced by `placed_on`, a list of site slugs written only by promoteToSiteAsset
      after editAssetAdd returns (union, so re-promoting to the same site records
      it once). ingest/ingestUpload/ingestFetch no longer accept or write any site
      field; /api/material/fetch forwards no slug. A reference file dropped while
      a site is open carries no placement; a promotion that failed softly keeps the
      material and records no placement; a material placed on two sites records both.
      Promotion runs through editAssetAdd, so it renames on collision (renamed name
      reported) and records a draft-journal entry that tells the assistant a file
      arrived. In the Library, the ''On this site'' pill, the ''Used on'' rights row
      (comma-joined list) and the ''Used on this site'' filter all read placed_on,
      so they agree; switching site re-decides badge and filter without re-reading
      the list. No backfill of legacy site_slug.'
    justification: 'STORY-144''s AC-1715 and AC-1716 describe the badge and the used-on-this-site
      filter as keyed on the material being ''bound to'' a site — which the code implemented
      as upload context (site_slug), the defect BUG-47 corrects; STORY-143 covers
      promotion but not that a placement is recorded on success only, nor the journal
      entry. Both are existing stories in the Material Ingestion / Material Library
      capabilities; this changes what the existing badge/filter/field read and what
      promotion records — no new capability bucket. FC evidence: tests/test_UAT_FC_BUG-47_placement.workers.test.ts,
      tests/test_UAT_FC_BUG-47_library_agrees.test.ts, and the promotion/journal assertions
      in test_UAT_FC_BUG-44_promoted_asset_is_usable.workers.test.ts.'
    intent_delta_summary: Placement becomes a recorded fact (a list of sites, written
      when a promotion actually lands) instead of the site that was open at upload;
      promotion journals its write; every Library surface that says 'on this site'
      reads that one fact.
    acceptance_criteria_changes:
      add:
      - A promotion that lands appends exactly the site it landed on to the material's
        placement list; re-promoting to a site already listed records it once; a material
        promoted to two of the client's sites lists both (STORY-143)
      - A file handed over as reference while a site is open, and a site-role promotion
        that failed softly, record no placement — the material is kept either way
        (STORY-143)
      - A promotion records one draft-journal entry, so the next conversational turn
        is told a picture arrived (STORY-143)
      - The 'On this site' pill, the 'Used on' rights row (listing every placed site)
        and the used-on-this-site filter read the same placement list and agree on
        every row, including across a site switch without re-reading the list (STORY-144)
      modify:
      - 'AC-1715 (acceptance_criterion-946ff3b5): the badge marks material whose recorded
        placement includes the open site, not material uploaded while it was open;
        the whole-account list is unchanged'
      - 'AC-1716 (acceptance_criterion-17ec5ed0): the used-on-this-site axis narrows
        to material whose placement list includes the open site'
      - 'AC-1711 (acceptance_criterion-98f8f69e): the renamed-on-collision name is
        the one recorded and reported, with promotion going through the same add path
        as every other asset'
      remove: []
    story_uid: null
  - index: 3
    component: Library row & upload overlay wording
    item_type: upgrade
    story_points: 2
    dependencies:
    - 2
    target_story_ids:
    - story-1500b111
    - story-325da65f
    description: 'Extends existing story story-1500b111 (STORY-144, The Library) and
      story-325da65f (STORY-145, Handing A File To The Platform). REQ-176 (merge b96ff95e1d):
      each Library row opens with exactly one type icon (document/image/font named;
      capture and any unknown kind fall back to one shared icon; never iconless) carrying
      role=img and aria-label of the kind; the kind pill is gone, role and placement
      pills remain; the row is one line (icon, 13px title that shrinks and ellipses,
      then non-wrapping flex:none pills), webui-list-detail unchanged. The overlay
      prompt reads ''Purpose'' and its two areas read ''Site asset'' and ''Background
      information''; ids stay `site`/`reference`, hints unchanged; the Library role
      pill/filter derive from the same UPLOAD_AREAS constant; the assistant''s L1-surface
      absence note quotes the area''s label as the constant defines it. The fourth
      requested string (''Live on the site'') was deliberately NOT implemented and
      must not be documented.'
    justification: 'AC-1725 pins the old labels (''put it on the site'', ''just for
      you to read'', a prompt about what the file is for); STORY-144 has no AC on
      row presentation and its kind axis is still valid. Same two existing stories
      in the Material Library capability; presentation and wording of existing surfaces
      only — no new capability bucket. FC evidence: tests/test_UAT_FC_REQ-176_library_row_and_wording.test.ts
      (nine UATs).'
    intent_delta_summary: Library rows show the material type as a labelled icon on
      one line instead of a kind pill on two, and the hand-over overlay and role pill
      use the plainer labels 'Purpose' / 'Site asset' / 'Background information' from
      one constant that the assistant's manual also quotes.
    acceptance_criteria_changes:
      add:
      - Every Library row opens with exactly one non-empty type icon — distinct for
        document, image and font, one shared fallback for capture and unknown kinds
        — announced to assistive technology as the kind; no row carries a kind pill
        (STORY-144)
      - 'A Library row lays out on one line: the title takes the remaining space at
        13px and truncates with an ellipsis, the pills keep intrinsic width and never
        wrap or shrink (STORY-144)'
      - The overlay's area labels, the Library's role pills and the assistant manual's
        reference to the drop area all read from one constant (STORY-145)
      modify:
      - 'AC-1725 (acceptance_criterion-d45bf6ea): the prompt reads ''Purpose''; the
        two areas read ''Site asset'' then ''Background information'', ids still `site`/`reference`,
        the background area''s hint still states the material will not appear on the
        site'
      remove: []
    story_uid: null
  - index: 4
    component: 'Fidelity surface: the assistant can see'
    item_type: feature
    story_points: 3
    dependencies: []
    description: 'REQ-157 (commit 11ca5fea9a): a second declared toolbox surface (fidelity-surface.json,
      group SeeSite, every operation effect: read) composed alongside the L1 surface
      via createL1Toolbox''s extraSurfaces list (knowledge surface becomes its first
      entry), granted to the consultant in instances.json, with the grant narrowed
      to the surfaces actually composed so a deployment without a browser still starts
      an editing assistant. One `picture` param_type with a declared keys set names
      five sources — captured reference (bundle + viewport), draft, edit channel,
      published revision (new PreviewRenderer `rev-<id>` channel rendering the frozen
      snapshot with its own assets) and any URL — validated by the declaration, projected
      into the tool JSON schema with additionalProperties:false, and resolved by one
      resolvePicture that names a missing kind-required field. The surface is bound
      to one site at construction (no slug anywhere). `screenshot` returns a text
      block plus an image content block that reaches the model backend inside the
      same tool loop; images are box-filter downsampled to a 1024px longest edge and
      refused over a byte ceiling; streamPrompt strips image bytes from SSE tool events
      while keeping the text. No operation moves the site''s change counter. Wired
      on the Worker (shot.ts, leased Browser Rendering per driver) and Node (GlobalOptions.origin
      from Host header; no origin, no surface).'
    justification: 'No existing story covers an assistant operation that returns an
      image or a read-only second surface: STORY-124/125 give the deployment a screenshot
      primitive and STORY-105 declares the L1 control surface, but nothing composes
      a fidelity surface, a picture-source vocabulary, a revision render channel,
      or delivers an image to the model. Genuinely new capability for the assistant.
      FC evidence: tests/test_UAT_FC_REQ-157_fidelity_surface.test.ts (surface/picture/screenshot/read-only/grant
      UATs).'
    story_uid: null
  - index: 5
    component: 'Fidelity surface: compare and judge'
    item_type: feature
    story_points: 2
    dependencies:
    - 4
    description: 'REQ-157: `compare(a, b)` over any two picture sources returns the
      same perceptual verdict `1c diff` returns for the equivalent CLI invocation
      — both sides anchored top-left and cropped to their common rectangle with the
      compared size reported, the reference side read at the actual side''s viewport,
      and a missing ladder member falling back to the full-page shot with the picture
      labelled as a fallback. `check_fidelity(actual, reference)` reproduces `1c gate`''s
      reconciliation through the shared gate-core.ts (gate.ts is now a caller of it),
      naming one of its five verdicts (pass, structural-failure, capture-incomplete,
      reproduction-wrong, unexplained-disagreement), each carrying its own distinct
      next step.'
    justification: 'STORY-77 and STORY-86 cover the `1c diff` / `1c gate` CLI verbs;
      nothing lets the assistant run them over arbitrary picture sources or guarantees
      the assistant''s verdict equals the CLI''s. New assistant capability built on
      (not replacing) those stories; the gate-core extraction is structural and leaves
      STORY-86''s ACs unchanged. FC evidence: compare/check_fidelity UATs in tests/test_UAT_FC_REQ-157_fidelity_surface.test.ts.'
    story_uid: null
  - index: 6
    component: 'Fidelity surface: capture a reference behind an egress guard'
    item_type: feature
    story_points: 2
    dependencies:
    - 4
    description: 'REQ-157: `capture_site(url)` captures a reference bundle and returns
      its id; `list_references` / `describe_reference(id)` report what has been captured
      and what is in it. egress-guard.ts classifies every URL (scheme, embedded credentials,
      private/loopback/link-local space including IPv4-mapped IPv6) and carries redirect
      and byte budgets, installed at both the Playwright and Cloudflare drivers''
      request seams so every redirect hop and subresource is checked; capture_site
      also pre-flights so an obviously bad address costs no metered browser. Refusals
      reach the model under the declared REFUSED code and the audit record carries
      the URL. capture/pipeline.ts is inject-or-fail (Node defaults live in capture/index.ts).
      DNS rebinding is explicitly not defended.'
    justification: 'STORY-142''s guarded retrieval protects material fetch, and STORY-124/147
      cover capture mechanics and bundle storage, but no story lets the assistant
      initiate a capture of an arbitrary URL or pins SSRF enforcement at the browser
      drivers'' request seams. New capability; safety ACs belong with the operation
      they guard rather than as a separate story. FC evidence: capture/egress UATs
      in tests/test_UAT_FC_REQ-157_fidelity_surface.test.ts.'
    story_uid: null
  - index: 7
    component: 'Assistant role: consultant'
    item_type: upgrade
    story_points: 2
    dependencies: []
    target_story_ids:
    - story-a58a0974
    description: 'Extends existing story story-a58a0974 (STORY-103, Hold one continuing
      conversation). REQ-174 (merge 2470b440e3): the one role on offer is `consultant`
      (CONSULTANT_ROLE; instances.json grant key moved). The system preamble the model
      receives names a consultant, never the old word, tells it to form and state
      a view, to say when a request would make the site worse, and never to build
      past an open question — while keeping the closed-vocabulary constraint; ''user''
      becomes ''client''; the per-turn reminder and the corpus purpose (no longer
      ''looks after'') change with it. New sessions are recorded and reported by api/ai/roles
      under the new name alone. A session stored under the legacy name reopens with
      turns intact and can take a further editing turn via a read-only LEGACY_ROLE_NAMES
      alias onto the same role object (no migration; nothing written under the legacy
      name). A guard asserts no working-tree file carries the old word except the
      alias declaration (kb/ and generated/ excluded).'
    justification: 'STORY-103 already owns ''asking what the assistant is'', the role
      on offer, the preamble/priming and session storage (AC-1051, AC-1052, AC-1319);
      the rename and posture change modify that existing story in place. No new capability
      bucket. FC evidence: tests/test_UAT_FC_REQ-174_consultant_role.test.ts (five
      UATs).'
    intent_delta_summary: The assistant's role is renamed caretaker→consultant with
      an advisory preamble (form a view, push back, settle open questions), and conversations
      stored under the old name keep working through a read-only alias.
    acceptance_criteria_changes:
      add:
      - The preamble the model receives names a consultant and never the old role
        word, asks it to form and state a view, to say when a request would make the
        site worse and to settle an open question rather than build past it, and still
        carries the closed-vocabulary constraint
      - A new session is recorded in its archive header and reported by the roles
        endpoint under the consultant name alone; the grant and the corpus purpose
        are the consultant's
      - A session whose stored role is the legacy name reopens with its turns intact
        and takes a further turn that reaches the tools and changes the site, with
        nothing written under the legacy name
      - No file in the working tree carries the legacy role word except the alias
        declaration (system knowledge base exports excluded)
      modify:
      - 'AC-1051 (acceptance_criterion-fe61861f): the one role on offer is named `consultant`'
      remove: []
    story_uid: null
  - index: 8
    component: 'System knowledge base build: account discovery'
    item_type: upgrade
    story_points: 1
    dependencies: []
    target_story_ids:
    - story-c4f329d3
    description: 'Extends existing story story-c4f329d3 (STORY-117, System knowledge
      base). BUG-49 (merge fde87e69df): resolveEmbedder in tools/generate/src/cli/kb.ts
      discovers the Cloudflare account from CLOUDFLARE_API_TOKEN via GET /accounts.
      Token alone with exactly one visible account → embedder bound to it. CLOUDFLARE_ACCOUNT_ID
      set → used verbatim, no discovery call. Several accounts → error listing each
      name and id, asking for CLOUDFLARE_ACCOUNT_ID. Zero accounts → error naming
      token scope. 403, success:false under 200, or an unreachable discovery request
      → error naming the narrow-scope case with Cloudflare''s reason and telling the
      operator to set CLOUDFLARE_ACCOUNT_ID (never read as an empty list). No token
      → error naming the token as required and the account id as optional override;
      usage text updated. LAGRANGE_KM_EMBEDDER still takes precedence before any credential
      is read.'
    justification: 'AC-1306 pins ''refused without embedding credentials, naming both''
      — BUG-49 changes it so only the token is required. Same build command, same
      capability (System Knowledge Base); credential resolution is extended in place.
      FC evidence: tests/test_UAT_FC_BUG-49_account_discovery.test.ts.'
    intent_delta_summary: 'The embedding account id becomes optional: it is discovered
      from the API token, with explicit and distinct diagnoses for several, zero,
      or undiscoverable accounts.'
    acceptance_criteria_changes:
      add:
      - With only the API token set and a token that sees exactly one account, indexing
        resolves an embedder bound to that account; an explicit account id is used
        verbatim with no discovery request
      - A token seeing several accounts is refused listing each account's name and
        id; one seeing none is told its scope is the problem; a refused (403 or success:false
        under 200) or failed discovery is diagnosed as a narrowly scoped token with
        Cloudflare's reason and the instruction to set the account id
      modify:
      - 'AC-1306 (acceptance_criterion-c3bc84cf): indexing without the API token is
        refused naming the token as required and the account id as an optional override;
        the usage text says the same'
      remove: []
    story_uid: null
  - index: 9
    component: '1c CLI: raw-server hosting path discontinued'
    item_type: upgrade
    story_points: 1
    dependencies: []
    target_story_ids:
    - story-e15a19ef
    description: 'Extends existing story story-e15a19ef (STORY-79, 1c CLI). REQ-177
      (merge 9632cd6ae0): `1c serve` is removed — `run([''serve'', …])` reports `Unknown
      command: serve` with usage on stderr and exit code 1, binding no port. The help
      text advertises no raw server and offers `1c builder` (wrangler dev) instead.
      startServe stays exported as the static-preview capture fixture and still binds
      an ephemeral loopback origin serving a rendered site''s bytes over real HTTP;
      serve.ts/builder.ts headers state they are test/capture infrastructure, never
      a hosting path.'
    justification: 'AC-1017 enumerates `serve` among the never-gated offline verbs;
      STORY-79 owns the 1c command set, help text and usage. Removing one verb and
      stating what the fixture is modifies that story in place — no new capability
      bucket. FC evidence: tests/req177-discontinue-raw-server.test.ts (three test_UAT_FC_REQ-177_*
      UATs).'
    intent_delta_summary: '`1c serve` is no longer a command and the help offers only
      Worker-based serving, while the startServe capture fixture keeps working for
      screenshots and conformance.'
    acceptance_criteria_changes:
      add:
      - '`1c serve` is not a command: it is refused as unknown with the usage text
        and a failing exit, and binds no port; the help text carries no raw-server
        line and offers the Worker-based builder'
      - The static-preview capture fixture remains exported and serves a rendered
        site's bytes over a real loopback origin
      modify:
      - 'AC-1017 (acceptance_criterion-a465080d): `serve` is dropped from the enumerated
        offline verbs'
      remove: []
    story_uid: null
---

# Reconciliation Plan

**Mode**: commits
**Source**: free-coded commits on bundle-5607a08d (BUNDLE-32). Of the 9 SHAs, 2 are direct commits (d46756fefa BUG-44 registry removal; 11ca5fea9a REQ-157 fidelity surface; ecbed061a8 is a version bump only) and 6 are merges of free-coded branches whose content was read via first-parent diffs: 9805ee506e (BUG-45), 8d93d32d8b (BUG-47), b96ff95e1d (REQ-176), 2470b440e3 (REQ-174), fde87e69df (BUG-49), 9632cd6ae0 (REQ-177).

## Behavior Inventory

```yaml
behavior_inventory:
  source: "free-coded commits: BUG-45, BUG-44, BUG-47, REQ-157, REQ-176, REQ-174, BUG-49, REQ-177"
  entry_files:
    - packages/site-schema/src/schema.ts
    - tools/generate/src/cli/edit.ts
    - tools/generate/src/cli/ai/l1-surface.json
    - apps/control-app/src/material.ts
    - apps/control-app/src/router.ts
    - apps/control-app/src/tickets.ts
    - apps/control-app/src/builder/library.js
    - apps/control-app/src/builder/config.js
    - apps/control-app/src/builder/builder.css
    - tools/generate/src/cli/ai/fidelity-surface.json
    - tools/generate/src/cli/ai/fidelity-core.ts
    - tools/generate/src/cli/picture.ts
    - tools/generate/src/cli/preview.ts
    - tools/generate/src/cli/gate-core.ts
    - tools/generate/src/cli/capture/egress-guard.ts
    - apps/control-app/src/shot.ts
    - tools/generate/src/cli/ai/roles.ts
    - tools/generate/src/cli/ai/instances.json
    - tools/generate/src/cli/kb.ts
    - tools/generate/src/cli/index.ts
    - tools/generate/src/cli/serve.ts
  features:
    - name: site asset store without a registry (BUG-44, overruling BUG-45 1/2/5)
      behaviors:
        - siteSchema has no assets key; legacy key ignored, not refused
        - list_assets / 1c asset list = store bytes only, no registered flag or marker
        - get_asset by id or /assets/<name> handle, listing shape; NOT_FOUND for absent
        - add_asset / write_image / remove_asset never touch site.json, each journals; no alt param
        - surface: no registration language; 'Fetching a picture, or any file, yourself'; description lives on the material; write_image no stand-in
        - assetRefSchema still valid in background / layer child
    - name: promotion placement (BUG-47 + BUG-45 kept parts)
      behaviors:
        - placed_on list written after editAssetAdd succeeds, union semantics
        - ingest writes no site field; fetch forwards no slug
        - failed promotion / reference drop -> no placement
        - promotion journals and renames on collision
        - Library pill, Used on row and filter read placed_on and agree
    - name: Library row + overlay wording (REQ-176)
      behaviors:
        - labelled kind icon with fallback, kind pill removed
        - one-line row, 13px title ellipsis, non-wrapping pills
        - Purpose / Site asset / Background information from one constant; ids unchanged
        - L1 surface absence note quotes the label
    - name: fidelity surface (REQ-157)
      behaviors:
        - second surface composed via extraSurfaces; grant narrowed to composed surfaces
        - picture param_type, five sources, rev-<id> channel with snapshot assets, bound to one site
        - screenshot -> text + image block reaching backend; 1024px box-filter downsample; byte ceiling; SSE strip
        - compare == 1c diff; common-rect crop; viewport follows actual; labelled fallback
        - check_fidelity == 1c gate via gate-core; five verdicts with next steps
        - capture_site / list_references / describe_reference; egress guard at both driver seams; preflight; REFUSED + audit URL
        - read-only: no change-counter movement
    - name: consultant role (REQ-174)
      behaviors:
        - role / grant key / preamble / reminder / purpose renamed and rewritten
        - legacy alias accepted on read only
        - no-straggler guard
    - name: kb build account discovery (BUG-49)
      behaviors:
        - token-only discovery, explicit override, several/zero/refused diagnoses, missing-token message
    - name: 1c serve removed (REQ-177)
      behaviors:
        - unknown command, exit 1; help offers builder; startServe fixture still binds
```

## Coverage Map

```yaml
coverage_map:
  - feature: site asset store without a registry
    status: partial (contradicted)
    existing_stories: [story-c46abfa6 STORY-102, story-b3de4571 STORY-107]
    existing_acs: [AC-1018, AC-1019, AC-1020, AC-1022, AC-1104, AC-1105]
    gaps: [get_asset by id/handle, bytes-only writes + journal, no alt param, surface text, legacy key ignored]
    notes: [AC-1019 superseded by BUG-44 (explicitly named in d46756fefa)]
  - feature: promotion placement
    status: partial (misaligned)
    existing_stories: [story-aacb7060 STORY-143, story-1500b111 STORY-144]
    existing_acs: [AC-1709, AC-1711, AC-1712, AC-1715, AC-1716]
    gaps: [placement recorded only on success, multi-site, journal entry, three readers agree]
  - feature: Library row + overlay wording
    status: partial
    existing_stories: [story-1500b111 STORY-144, story-325da65f STORY-145]
    existing_acs: [AC-1725, AC-1716]
    gaps: [icon, one-line row, new labels, single constant incl. manual]
  - feature: fidelity surface
    status: uncovered
    existing_stories: []
    notes: [STORY-124/125/77/86/147/142 are foundations, not coverage]
  - feature: consultant role
    status: partial
    existing_stories: [story-a58a0974 STORY-103]
    existing_acs: [AC-1051, AC-1052, AC-1319]
  - feature: kb build account discovery
    status: partial (contradicted)
    existing_stories: [story-c4f329d3 STORY-117]
    existing_acs: [AC-1306]
  - feature: 1c serve removed
    status: partial (contradicted)
    existing_stories: [story-e15a19ef STORY-79]
    existing_acs: [AC-1017]
```

## Plan Items

| # | Component | Type | Points | Deps | Description |
|---|-----------|------|--------|------|-------------|
| 1 | Site Asset Store (registry removed) | upgrade STORY-102, STORY-107 | 3 | - | BUG-44/45: assets = stored bytes; get_asset by id/handle; bytes-only writes; alt on node; surface truth; remove AC-1019 |
| 2 | Promotion & Library placement | upgrade STORY-143, STORY-144 | 3 | 1 | BUG-47: placed_on recorded on success; journal; pill/filter/Used on agree |
| 3 | Library row & overlay wording | upgrade STORY-144, STORY-145 | 2 | 2 | REQ-176: icon, one-line row, Purpose / Site asset / Background information |
| 4 | Fidelity surface: see | feature | 3 | - | REQ-157: second surface, picture vocabulary, screenshot image to model, read-only, grant |
| 5 | Fidelity surface: compare & judge | feature | 2 | 4 | REQ-157: compare == 1c diff, check_fidelity == 1c gate |
| 6 | Fidelity surface: capture with egress guard | feature | 2 | 4 | REQ-157: capture_site, references, SSRF at driver seams |
| 7 | Consultant role | upgrade STORY-103 | 2 | - | REQ-174 rename + advisory preamble + legacy alias |
| 8 | KB build account discovery | upgrade STORY-117 | 1 | - | BUG-49 |
| 9 | 1c serve removed | upgrade STORY-79 | 1 | - | REQ-177 |

Total: 19 points; 3 feature, 6 upgrade.

## Observations

- **Case 2 supersession (BUG-44 over BUG-45).** BUG-45's behaviours 1 (promotion registers), 2 (description becomes registry alt) and the 'registered remains reportable' part of 5 were withdrawn by operator decision and are NOT documented. Only BUG-45's surviving behaviours (get_asset answers from the listing, promotion via editAssetAdd with republishable gate / rename / journal, surface absence text, write_image no-substitution) are carried, under items 1 and 2. AC-1019 is listed for supersession; AC-1018/1020/1022/1104/1105 are rewritten rather than removed because their non-registry substance still holds.
- **REQ-176 fourth string not implemented.** 'Used on this site' -> 'Live on the site' was deliberately left out pending operator confirmation; the matrix must not claim it. Current strings (pill 'On this site', field 'Used on', filter 'Used on this site') are what item 2/3 document.
- **Case 3, REQ-157 structural splits.** gate-core.ts, responsive-table.ts and the inject-or-fail capture/pipeline.ts are refactors along the existing perceptual-core seam; `1c gate`, `1c responsive-diff` and `1c capture` behave as before, so STORY-86/78/147 are untouched. Three other suites (REQ-126, AC1071 author-time validation, AC1058 offered tool set) now observe the union of two declarations; their ACs remain true as worded (derived from the declarations), so no item targets STORY-105.
- **REQ-157 split into three features** (see / compare-judge / capture) because a single story would exceed 3 points (27 UATs); safety ACs live with capture_site rather than as a separate story. Known non-goal: capped base64 remains in the durable transcript (upstream tool-record redaction follow-up); DNS rebinding is not defended.
- **REQ-174 rename across stories.** Several story bodies (STORY-140/142/143) say 'caretaker' in prose; the rename's guard covers the working tree, not tickets, and kb/ is rebuilt from the store. Updating that prose is cosmetic and not planned as separate items; the story cycle for item 7 may touch it.
- **REQ-177 and STORY-96.** AC-915/AC-922 talk about 'local preview'; that behaviour still holds via the startServe capture fixture, so STORY-96 is not targeted. The narrative 'local preview command' wording is now stale — worth a note during item 9.
- **Out of scope noted in tickets, not documented:** n-gram quarantine gate, role/republishable on search hits, why the BUG-45 file was classified reference, attaching ingestion descriptions to assets (REQ-157 field evidence 2/3), placement verification against live assets (BUG-47).
- **Tooling note:** `xgd ticket search` failed in this sandbox (embeddings cache not writable / model download blocked), so reuse was established by keyword scans over the full story (59) and AC (864) export instead; every target story was read with its AC list.