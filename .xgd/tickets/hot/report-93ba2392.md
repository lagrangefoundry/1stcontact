---
uid: report-93ba2392
id: REPORT-3461
type: report
title: 'Reconciliation Plan: BUNDLE-23 free-coded commits (knowledge bases, material
  ingestion & Library, identity)'
created_by: xgd
created_at: '2026-09-04T02:10:44.539778+00:00'
updated_at: '2026-09-04T06:05:54.310758+00:00'
completed_at: null
last_field_updated: items
fields:
  report_kind: reconciliation_plan
  subject_uid: bundle-203b1dc2
  anchor_uid: bundle-203b1dc2
  items:
  - index: 1
    component: System Knowledge Base — corpus export correctness
    item_type: upgrade
    story_points: 3
    dependencies: []
    description: 'REQ-164 (858d63202f). Membership in the shipped corpus is now the
      ticket''s `doc_kind: system_kb` rather than a `fields.system_kb: true` boolean,
      and the retired boolean is not honoured at all. The shipped KB declares `corpus:
      {}` so a markdown file placed in the corpus directory is indexed regardless
      of its frontmatter (the old query-time predicate re-ran a build-time filter
      and silently dropped anything shaped differently). `readDocTickets` passes `--no-limit`
      and refuses a truncated envelope by name rather than taking page one of a 50-row
      page. `1c kb status` reports the corpus against the number of tickets carrying
      the marker, and reports unknown (never zero) when the store cannot be read.'
    justification: 'STORY-117 already owns the corpus build and explicitly owns the
      membership rule: AC-1295 says a document is in ''only as a genuine boolean'',
      which is now false, and AC-1293 says status reports the corpus size, which now
      also reports the marker count. This changes how an existing capability behaves;
      it introduces no new capability bucket — the same command produces the same
      three artefacts under a corrected membership rule and a corrected listing. Extending
      STORY-117 is required rather than optional: leaving AC-1295 as written would
      leave the matrix asserting a rule the code deliberately retired.'
    story_uid: story-c4f329d3
    target_story_ids:
    - story-c4f329d3
    intent_delta_summary: Membership moves from a boolean opt-in flag to the ticket's
      single-valued kind; the shipped corpus stops re-applying a selection predicate
      at query time; the ticket listing becomes exhaustive with truncation refused
      loudly; status gains the marker count so a short corpus is visible rather than
      inferred.
    acceptance_criteria_changes:
      add:
      - 'The shipped corpus is unrestricted: a markdown file in the corpus directory
        is resolved whatever its frontmatter, and the scaffold and the committed declaration
        say so identically.'
      - The document listing the export reads is exhaustive, and a listing that comes
        back truncated is refused by name rather than silently shortening the corpus.
      modify:
      - AC-1295 — a document is in the knowledge base by carrying the knowledge-base
        kind, a single-valued marker; the retired boolean is not membership.
      - AC-1293 — asking what is built also reports how many tickets carry the marker,
        flags a corpus that disagrees with them, and reports the ticket side as unknown
        rather than zero when the store cannot be read.
      remove: []
  - index: 2
    component: System Knowledge Base — projected reference
    item_type: feature
    story_points: 3
    dependencies:
    - 1
    description: 'REQ-165 (52fd6302cc). A second corpus producer beside the ticket
      export: `tools/generate/src/cli/kb-projection.ts` generates three reference
      documents from three sources of truth — `REF-behaviors` from the framework behavior
      catalogue, `REF-l1` from the L1 schemas and envelope, `REF-surface` from the
      declared control surface — run by `1c kb export` and by the assets build before
      `1c kb build`. Each projection reads exactly one source and no document: every
      sentence is either rendered from the source''s shape or lifted verbatim from
      prose the source itself carries. Membership is read from the KB declaration
      rather than hardcoded. Each producer sweeps only its own namespace (`REF-*`
      vs the exported tickets), so neither can delete the other''s output whatever
      order they run in. An unchanged projection is not rewritten, so the index does
      not re-embed the reference every build. Each projection states its source in
      the body as well as the frontmatter, cites no internal ticket, and scopes each
      element kind''s value sets to that kind.'
    justification: No existing story covers a corpus document that nobody authors.
      STORY-117's whole frame is 'our own documents, with each document deciding whether
      it is in' — a projection has no ticket and must assert its own membership, and
      its correctness condition is 'the fact matches its source of truth on the next
      build', which is not expressible as an opt-in. The user-visible capability is
      that the assistant can say what a module supports, what an L1 term means and
      what it may change, from documents that cannot go stale — a hole that only opened
      once DOC-39 §3.1 excluded the architecture documents.
    story_uid: story-0d7d3aad
  - index: 3
    component: System Knowledge Base — bundle-importable artefact
    item_type: upgrade
    story_points: 2
    dependencies:
    - 1
    description: 'REQ-158 (2745001058). The build emits the knowledge base as an importable
      module in addition to the on-disk artefacts: `kbBundle()` reads both index directories
      and the corpus text into values, carrying each document''s own `updated_at`
      rather than letting the reader stamp everything EPOCH and hand a ranker a corpus
      dated differently from the index it was built against. `1c assets` inlines it
      as `generated/kb.js` and writes it unconditionally — carrying a null KB when
      none was built — because the generated directory is gitignored and a conditionally-written
      module makes a static import fail to resolve on any checkout that never built
      one. A missing KB is nevertheless named in the asset report. `SYSTEM_KB`, `SHIPPED_SOURCE`
      and `CORPUS_TYPE` move to a shared `kb-model.ts` so the filesystem half and
      the Worker half cannot index under one type and search under another. `bin/1c.mjs`
      now awaits the assets command, which had been reporting success while writing
      nothing.'
    justification: STORY-117 owns what the knowledge-base build produces and how it
      reports it (AC-1291, AC-1292, AC-1293, AC-1299). Emitting a fourth artefact
      — the same corpus and indexes as importable values — extends that artefact set
      rather than opening a new capability bucket; the command, the ordering and the
      reporting are the story's existing subject. The 'always written, null when absent'
      rule and the loud report are new claims about that build's output and have no
      AC today.
    story_uid: story-c4f329d3
    target_story_ids:
    - story-c4f329d3
    intent_delta_summary: The build gains a fourth output — the corpus and both indexes
      as an importable module, always written and carrying each document's own timestamp
      — and the build report names a missing knowledge base instead of passing silently.
    acceptance_criteria_changes:
      add:
      - The build emits the corpus and both indexes as an importable module carrying
        each document's own last-changed time, so the bundled corpus and the index
        it was built against agree.
      - The generated module is written on every build whether or not a knowledge
        base exists, so a checkout that has never built one still resolves the import;
        a build with no knowledge base says so in its report rather than passing silently.
      - One declaration of the knowledge base's name, shipped source and corpus type
        is shared by the filesystem half and the bundle half, so a corpus cannot be
        indexed under one type and searched under another.
      modify:
      - AC-1291 — building the knowledge base runs the whole pipeline in order and
        reports what it produced, the importable module included, and the command
        that writes the generated artefacts reports what it actually wrote.
      remove: []
  - index: 4
    component: AI Site Assistant — the deployed assistant reaches the corpus
    item_type: upgrade
    story_points: 2
    dependencies:
    - 3
    description: REQ-158 (2745001058). `apps/control-app/src/system-knowledge.ts`
      is the peer of the filesystem runtime opener — the same knowledge base opened
      from three bundled values through an in-memory index source and a bundle document
      reader, reaching no filesystem. The router opens it once per isolate beside
      the store, and `ai.ts` hands the knowledge surface and the priming to the toolbox
      as a pair (a session primed with the landscape but not granted the corpus would
      be told to read documents it cannot open; the converse would never learn there
      was anything to read). Two ways to get nothing — no KB built into the bundle,
      or no embedder binding — and both are silent degradations rather than boot failures.
    justification: 'STORY-103 already owns the assistant''s knowledge surface (AC-1317),
      its grant (AC-1318), its priming (AC-1319) and the absent-corpus degradation
      (AC-1320). Those criteria were true only on the operator''s own machine: AC-1320
      states outright that on the deployed host ''the corpus is reachable only from
      the operator''s own machine and so is simply absent'', which this commit makes
      false. This is explicit supersession of existing intent by later intent, not
      a new capability — the assistant''s knowledge behaviour is unchanged; the set
      of hosts on which it holds is what changed.'
    story_uid: story-a58a0974
    target_story_ids:
    - story-a58a0974
    intent_delta_summary: 'The deployed host stops being definitionally corpus-less:
      it carries the knowledge base in its own bundle, so the offered surface, the
      grant and the priming hold there as they already did on the operator''s machine.
      Absence now means the release was built without a corpus, or the embedder binding
      is missing — both still silent.'
    acceptance_criteria_changes:
      add:
      - The deployed assistant reaches the system knowledge base from its own bundle,
        without any filesystem, and the knowledge surface and the priming arrive together
        or not at all.
      modify:
      - AC-1320 — no knowledge base to open remains an ordinary silent state, but
        on the deployed host that now means a release built without a corpus or a
        missing embedder binding, not that the corpus is unreachable by nature.
      - AC-1317 — the corpus is reachable from the same granted surface as the site
        operations on the deployed host as well as the operator's own.
      - AC-1319 — a conversation is primed with the map before the purpose before
        the manual on the deployed host as well as the operator's own.
      remove: []
  - index: 5
    component: Project Knowledge Base — the tenant's own corpus
    item_type: feature
    story_points: 3
    dependencies: []
    description: 'REQ-159 (115f0d39ec). `apps/control-app/src/knowledge.ts` opens
      a knowledge base over the tenant''s own ticket store — corpus types chat/material/reference/brief,
      no declared source, no site term (tenant-wide by design, because two sites belonging
      to one client should share accumulated knowledge). Tenancy is bound once into
      the handle: store, index prefix and blob bucket all derive from one tenant id,
      so no argument on the handle can name another account. `project` is declared
      beside `system` in `kb/knowledge_bases.json`, and each host names the knowledge
      bases it can actually resolve — the release build serves `system` alone, so
      it no longer resolves a tenant corpus against a directory of design documents
      and reports it as searchable and empty. The index lives in R2 under `kb/<tenant>/project/…`
      in the private blob bucket and never the bucket the public internet is served
      from, and outside the attachment key space so no attachment key can address
      it. Re-embedding is incremental against the component''s own manifest. The awareness-report
      type is declared in the product TypePack from the component''s own constants
      so the first map rebuild does not fail validation, and `1c assets` writes a
      third generated shim.'
    justification: Nothing in the matrix describes a knowledge base over the client's
      own material. CAP-100's STORY-117 is the shipped corpus of our design documents,
      built at release time from a read-only directory; this is per-tenant data with
      a different residency rule, a different store, a different lifetime and an isolation
      requirement the shipped corpus does not have. CAP-106's stories describe where
      the material is stored, not that it is searchable. The user-visible capability
      is that the assistant can know something about *this* business rather than about
      websites in general.
    story_uid: story-bb91191c
  - index: 6
    component: Project Knowledge Base — two triggers and the enumeration floor
    item_type: feature
    story_points: 2
    dependencies:
    - 5
    description: REQ-159 (115f0d39ec). The index is a change-feed consumer restricted
      by an `updated_at` cursor, so there is no reindex operation in normal running,
      and the two clocks are driven separately. A material write refreshes the vector
      index inline — the document is searchable the moment the call returns — and
      hands the awareness-map rebuild to an injected deferral seam, because a map
      build is clustering plus a describe call per territory and running it synchronously
      stalls the assistant exactly when the client is waiting to talk about their
      document. A transcript is indexed only past a character threshold and never
      rebuilds the map (the territory 'conversations with this client' is stable from
      the first turn), with the per-session cursor stored beside the index rather
      than on the ticket. Below a ~1KB character budget the landscape is a complete
      enumeration and says in words that it is complete, with nothing emphasised,
      since a listing validates no search access point; above it, it clusters. The
      budget is characters, not a document count. Above the floor with no describer
      supplied, the call names the missing seam and the previous map stands rather
      than being replaced by a mechanical paragraph.
    justification: This is the behaviour that distinguishes a knowledge base that
      keeps up from one that is merely present, and it has no story. It is separated
      from item 5 because the corpus/index/residency claims and the freshness/landscape
      claims are independently provable and together exceed a single story's size;
      the failure this documents (running both clocks off one trigger) is invisible
      in item 5's criteria.
    story_uid: story-0fb17a68
  - index: 7
    component: Material Ingestion — from bytes to an indexed ticket
    item_type: feature
    story_points: 3
    dependencies: []
    description: 'REQ-163 (d99c1f4385). Two entry points over one pipeline: `POST
      /api/material` (upload) and `POST /api/material/fetch` (URL). Blob first, then
      the record, so a crash leaves an orphan blob a sweep collects rather than a
      dangling pointer nothing can heal. Kind is classified from the content type;
      rights, republishability and exportability are inferred from provenance and
      never asked — an upload is republishable and not exportable, fetched background
      material inverts both. The pipeline calls its index seam exactly once per created
      material, resolved by the router to the project knowledge base''s material trigger,
      and logs loudly when no indexer is wired, because an unindexed document is invisible
      rather than stale. A blob above the 25MB ceiling is refused in words a non-technical
      client can act on, leaving no material behind. The fetch guard refuses non-HTTPS
      and private/loopback/link-local hosts and re-validates every redirect hop —
      a guard on the typed address alone is not a guard, and fetched content becomes
      corpus material the assistant reads, so this is a prompt-injection path and
      not only a network-reach one. `promoteToSiteAsset` ships with its refusal: material
      whose ticket is not republishable can never reach a site''s asset library.'
    justification: CAP-106's three stories cover where material lives — the ticket
      store (STORY-126), the blob bucket (STORY-127) and the vocabulary (STORY-128)
      — and none of them covers how a byte gets in. Before this there was no way to
      put a byte into the system at all. The two routes, the ordering guarantee, the
      provenance-derived rights, the ceiling and the fetch guard are all new observable
      behaviour with no existing criterion to extend.
    story_uid: story-70a922b9
  - index: 8
    component: Material Description — making a file findable by its contents
    item_type: feature
    story_points: 3
    dependencies:
    - 7
    description: 'REQ-163 (d99c1f4385). The step that makes material findable, since
      the knowledge base indexes bodies uniformly and never learns that images exist.
      Four paths: PDFs through `unpdf`, images through a vision call behind an injectable
      seam, fonts parsed from their own SFNT name table (the family, style and often
      a sentence from whoever drew it — a model asked to guess from the bytes would
      cost a call to produce something worse), and text decoded. Nothing is ever rejected
      for being undescribable: a scanned brand book is stored whole with an honest
      sentence about why it will not be found by its contents. `description_status`
      is one mechanism for every degraded case with six values — ok, no_describer,
      no_text, unsupported, too_large (an image above the vision API''s own per-image
      ceiling, stored whole and simply not looked at) and failed (the describer was
      reached and threw, kept distinct because the two want different retries). The
      describer never throws: an extraction failure costs findability and nothing
      else, and letting it reach the route would turn ''we could not read your PDF''
      into ''your upload failed''. WOFF and WOFF2 are recorded unsupported rather
      than half-supported, workerd having no brotli.'
    justification: No story covers what a stored file's body says or how the system
      behaves when it cannot say much. This is separated from item 7 because it is
      the ticket's own stated reason for existing ('the reason this ticket is not
      plumbing') and because the degraded-description contract — visible, honestly
      described, selectable by predicate for a later pass — is a user-visible promise
      independent of how the bytes arrived.
    story_uid: story-724e4e8c
  - index: 9
    component: Builder Library Tab — the client's material, seen
    item_type: feature
    story_points: 3
    dependencies:
    - 7
    description: 'REQ-161 (855dd57a7c). A Library tab beside the site tab, built from
      the shared split and list-detail components configured rather than rebuilt.
      The list is the whole tenant''s material — including material bound to the client''s
      other sites and material bound to none — with ''used on this site'' as a badge
      and a filter and never as a boundary, plus filters by role and by kind. The
      detail pane is two field-editor instances over the existing editing vocabulary:
      the rights block read-only (the system infers rights from provenance precisely
      so the client is never put in front of a legal question, and a republishable
      flag they could tick by hand would be that question with a checkbox on it) and
      the description editable, over the blob itself rather than just its name. Four
      origin routes back it: the tenant''s material newest first and without bodies,
      one row with its description, the bytes served inline from the private bucket
      through the tenant-bound handle, and the description correction — which re-indexes,
      refuses an empty body, and records the client as the description''s author so
      a later re-describe pass cannot overwrite their words. All four answer 404 rather
      than 403 for a uid that is not material, so they are not an oracle for which
      uids exist in the tenant.'
    justification: The builder workspace story (STORY-99) describes the chrome, the
      origin and the display panel; it has no notion of a second content surface,
      and the image picker it does know about is a field editor over one site's assets,
      not a library over the tenant's material. Nothing in the matrix says the client
      can see what they have given us or correct what the system thinks it is. The
      correction reaching retrieval, not merely the screen, is the load-bearing half.
    story_uid: story-f775289b
  - index: 10
    component: Upload Overlay & Promotion — putting a byte in from the browser
    item_type: feature
    story_points: 3
    dependencies:
    - 7
    - 9
    description: 'REQ-161 (855dd57a7c). One overlay instance watching both entry points
      — the chat and the Library — rather than one overlay per entry point. Its areas
      are roles, not file types: the content type already answers what kind of file
      this is and nothing answers what it is for, and the JPEG that is a hero photograph
      and the JPEG that is a competitor screenshot are identical bytes with opposite
      rights. Two areas (''put it on the site'' / ''just for you to read''), each
      a real button that opens the file picker so every area is reachable without
      dragging. A file dropped outside an area creates nothing: both areas are marked
      and the overlay keeps asking, because both possible defaults are silently wrong.
      The chosen role narrows the rights inferred from provenance and never widens
      them, so the programmatic callers that predate the question behave exactly as
      before, and a malformed role is refused rather than coerced. A chat-route drop
      is reported as the client''s own turn in the transcript including what went
      wrong; a Library-route drop is not, since it puts no line in a conversation
      it was not part of. A site-role upload against a selected site is promoted into
      that site''s asset library at once, through the existing republishability gate
      — which the reading role is now mechanically incapable of passing — copying
      the bytes across the bucket boundary rather than pointing at them, picking a
      free name rather than overwriting an asset already live on the site, and reporting
      a promotion failure in the envelope rather than as an upload that did not arrive.'
    justification: There is no story for putting a byte into the system from the browser,
      and none for the one question this product asks about a file. Separated from
      item 9 because the read surface and the write gesture are independently provable
      and together exceed a single story; the promotion gate's first real caller lives
      here, and 'put it on the site means the bytes are on the site' is a promise
      item 9's criteria cannot carry.
    story_uid: story-1144410d
  - index: 11
    component: Client Material Store — the vocabulary grows
    item_type: upgrade
    story_points: 1
    dependencies:
    - 8
    - 10
    description: 'REQ-163 and REQ-161 (d99c1f4385, 855dd57a7c). Four optional fields
      join the declared material/reference schema: `role` (site | reference — what
      the client says the file is for), `description_status` and `description_model`
      (so a later re-describe pass is a query rather than a migration — a predicate
      over an undeclared field is a predicate over a convention), and `filename` (the
      Library lists materials, and reading a name off the attachment record would
      cost a call per row). All optional, because a reference created by a capture
      has no description when its bundle lands.'
    justification: STORY-128 is the vocabulary of what a site is made from, and already
      owns the rule that a value outside the permitted set is refused (AC-1493) and
      that rights are stated rather than omitted (AC-1494). These fields extend that
      same declared vocabulary in place; no new capability bucket appears — the material
      record is still one record type with a declared field block, and `role` is deliberately
      declared beside the rights block it narrows rather than as a parallel mechanism.
    story_uid: story-e07c589b
    target_story_ids:
    - story-e07c589b
    intent_delta_summary: The declared material vocabulary gains what the file is
      for, whether its description is real and who wrote it, and the name it arrived
      under — all optional, all refused rather than coerced when malformed.
    acceptance_criteria_changes:
      add:
      - A material or reference may record what the client said the file is for, and
        a value outside the permitted set is refused rather than coerced or silently
        dropped.
      - A material records whether its description is a real one and what produced
        it, so material with no usable description is selectable by predicate rather
        than found by re-reading every record.
      modify:
      - AC-1497 — a material is a valid record before any text has been extracted
        from it, and says so in its own fields rather than by the body being empty.
      remove: []
  - index: 12
    component: Material Blob Storage — one record owns one blob
    item_type: upgrade
    story_points: 2
    dependencies:
    - 7
    description: 'REQ-161 (855dd57a7c). Reading a blob back addressed it by its content
      hash and found nothing, every time — invisible until now because nothing had
      ever read one back. The ticketing component gave up content-addressing deliberately:
      a shared blob cannot be moved to the trash without breaking whichever sibling
      record still names it, and moving it is what makes deletion actually revoke
      reach. The blob is keyed by the attachment record''s own uid; the content hash
      stays on the record for integrity and is no longer the address. So the same
      file uploaded twice is one blob per record, not one blob shared.'
    justification: 'STORY-127''s AC-1488 (''the same file is one stored object within
      an account'') and AC-1486 (''come back as a record naming their content address'')
      were written against the component''s previous content-addressing and are no
      longer true of it — both suites were already failing before this commit. This
      is a correction to an existing capability''s stated behaviour, not a new bucket:
      the bytes still live in the private bucket under the account''s own prefix,
      one account still cannot address another''s blob, and identical content still
      hashes identically. Only what the key is has changed.'
    story_uid: story-a7a12d81
    target_story_ids:
    - story-a7a12d81
    intent_delta_summary: Blob addressing moves from the content hash to the attachment
      record's own identifier, so deletion can revoke reach; the hash remains on the
      record as an integrity field. Dedup across records is withdrawn as a claim;
      the tenant isolation and private-bucket claims are unchanged.
    acceptance_criteria_changes:
      add:
      - Bytes attached to a piece of material are read back through the record that
        owns them, so a record's bytes are retrievable by the surface that shows them.
      modify:
      - AC-1488 — one record owns one stored object; the same file attached twice
        is two objects, and the account prefix still keeps one account's bytes out
        of another's reach.
      - AC-1486 — the record still names its content address and size, as an integrity
        field rather than as the address the bytes are stored under.
      remove: []
  - index: 13
    component: Builder Workspace & Assistant Pane — criteria restated against the
      declaration
    item_type: upgrade
    story_points: 2
    dependencies:
    - 9
    description: REQ-161 (855dd57a7c). Three criteria were written while the builder
      had exactly one tab and one dropdown of any kind, and are restated now that
      a second tab and the Library's role and kind filters exist. One panel per declared
      tab and no more — the claim AC-959 was always making, and now the only way to
      make it. The first declared tab is the one that opens, which is what AC-976's
      per-tab active assertion actually meant while there was one tab. And exactly
      one dropdown in the workspace offers site slugs, rather than exactly one dropdown
      existing — what must stay true is that nothing but the toolbar offers a site
      to pick.
    justification: Each of these criteria remains the right claim; each was expressed
      through a proxy that a second tab or a second dropdown breaks without touching
      what the criterion is about. Restating them in place is the only way to keep
      them binding — no new capability bucket appears, and the Library tab itself
      is documented by item 9 rather than absorbed into the workspace chrome or the
      assistant pane.
    story_uid: story-e674c60a
    target_story_ids:
    - story-e674c60a
    - story-7f437d57
    intent_delta_summary: 'Workspace chrome criteria move from counting elements to
      reading the declaration: one panel per declared tab, the first declared tab
      opens, and exactly one dropdown offers a site.'
    acceptance_criteria_changes:
      add: []
      modify:
      - AC-959 (story-e674c60a) — the workspace hosts exactly one panel per declared
        tab and no undeclared panel, with the display panel inside the site tab, addressed
        by a stable id.
      - AC-976 (story-e674c60a) — every option declared for a tab reaches the chrome
        intact, and the first declared tab is the one that opens.
      - AC-1064 (story-7f437d57) — changing the site changes the conversation with
        it, and exactly one dropdown in the workspace offers the store's site slugs,
        however many other dropdowns the workspace has.
      remove: []
  - index: 14
    component: Identity & Entitlement — the invite provisions, the login binds
    item_type: feature
    story_points: 3
    dependencies: []
    description: 'REQ-167 (61a0becc61). Migration `0004_identity.sql` adds users,
      memberships and entitlements beside the tenant registry, with no CHECK constraint
      on plan or status (adding a warning or trial state later must be a code change,
      not a schema migration) and no unique index on an entitlement''s account (an
      account accumulates grants over its life and effective access is the best active
      grant covering now). `provisionInvite` creates the whole set in one operation
      — the user, an account whose id is opaque and never derived from the email,
      the name, or anything a human chose (a tenant id appears in object keys and
      is therefore permanent, and a readable one becomes wrong the first time someone
      renames their company), an owner membership, an active grant, and the account''s
      starter site. Re-inviting an existing email reports the existing user rather
      than failing obscurely on a constraint. `admit` creates nothing and is pure
      lookup: user, then active membership, then the best active grant whose window
      covers now — a grant given a bounded date and never evaluated is worse than
      an open-ended one, because it was promised as bounded. Revocation refuses independently
      of dates. One refusal message covers every reason; which check failed is logged
      and never told to the caller, because that distinction is an account-existence
      oracle to anyone who can pass a one-time PIN.'
    justification: 'The matrix has no record that a person, an account, a membership
      or a grant exists. CAP-103''s STORY-120 is the gate: it proves a caller carries
      a currently-valid identity issued for this application, and stops there — the
      builder served whoever passed the hostname gate, into the single configured
      tenant. Provisioning and entitlement lifecycle are a genuinely new capability
      bucket that the gate''s story cannot absorb without changing what it is about,
      and expiry is the single most likely silent failure here: the code path that
      never runs during the alpha is the one that was promised.'
    story_uid: story-e7871ed7
  - index: 15
    component: Operator Access Gate — the gate's verdict, and admission behind it
    item_type: upgrade
    story_points: 2
    dependencies:
    - 14
    description: REQ-167 (61a0becc61). The gate now reports the verified identity
      rather than a yes-or-no, so the caller's email is not recovered by verifying
      the token a second time. Admission runs where the gate runs — before a store
      handle exists and before a path is examined — so a verified token is the gate's
      own verdict and no longer implies a served response. REQ-147's three 'valid
      token yields a served response' criteria narrow accordingly; the end-to-end
      admitted path belongs to item 14.
    justification: 'STORY-120 owns who reaches the builder, and AC-1375 currently
      states that a granted identity receives the response of the surface behind the
      gate — which a valid token for an unknown or unentitled person no longer does.
      This is explicit supersession by later intent within the same capability bucket:
      the gate''s own checks, refusal shapes and configuration rules are unchanged,
      and no parallel gate is introduced. The identity model it defers to is item
      14 rather than being folded in here.'
    story_uid: story-182e8cb9
    target_story_ids:
    - story-182e8cb9
    intent_delta_summary: A verified token is the gate's verdict and yields the caller's
      identity, not admission to the surface; a second check behind it decides whether
      that identity is served, and refuses without saying which check failed.
    acceptance_criteria_changes:
      add:
      - The gate hands on the identity it verified rather than a yes-or-no, so nothing
        behind it verifies the same token twice to learn who the caller is.
      modify:
      - AC-1375 — a caller carrying a currently-valid identity passes the gate's own
        checks; what happens after that is decided behind the gate, not by the gate.
      remove: []
---

# Reconciliation Plan — BUNDLE-23

**Mode**: commits
**Anchor**: bundle-203b1dc2 (BUNDLE-23)
**Source intents**: REQ-164, REQ-159, REQ-165, REQ-163, REQ-161, REQ-158, REQ-167
**Commits analysed**: 12 (8 substantive, 4 version/doc bookkeeping)

## Step 0 — Intent

The bundle body carries each ticket's original statement *and* its "What landed"
half. Where the two disagree, the landed half is later and was followed:

- **REQ-164** — three ways `1c kb export` silently produced a smaller corpus than
  intended. Both stated blockers (the `doc_kind` enum value, the exhaustive list
  affordance) had already shipped upstream, so nothing was deferred. The envelope
  check and the `kb status` ticket count were added *beyond* the stated scope, and
  the intent says so explicitly.
- **REQ-159** — the tenant-scoped half of DOC-38 §8. The intent's own
  "~200 characters per document" enumeration budget was **superseded** by DOC-39 §7
  (titles only, ~1KB); the intent had said DOC-39 is the specification and should
  not be re-decided, so it was not. Session wiring is explicitly REQ-160's, not this.
- **REQ-165** — fills a hole that only opens once REQ-164's filter excludes the
  architecture documents: the corpus would hold consultation material and nothing
  saying what the product does.
- **REQ-163** — five departures from the pre-implementation decisions are recorded
  in the ticket, each because the decision met something in the code it had not
  seen. Most consequential: promotion **copies** bytes across the bucket boundary
  rather than pointing at them, and `description_status` has six values, not four.
- **REQ-161** — names its own supersessions (AC-959, AC-976, AC-1064) and REQ-162's
  and REQ-163's blob-addressing criteria. Its resolved open questions (no third
  area for fonts; every area reachable without dragging; an ambiguous drop prompts
  and never defaults) are treated as binding.
- **REQ-158** — three of its own premises had gone stale: the AI binding already
  existed (REQ-159), the shim emitter had a working precedent, and the size
  argument was re-measured against a 1052 KiB baseline rather than 322 KiB.
- **REQ-167** — DOC-40's first implementation. Self-signup, trials and the warning
  period are explicitly out of scope and land on this schema without changing it.

## Behavior Inventory

```yaml
behavior_inventory:
  source: "free-coded commits on bundle-203b1dc2 (BUNDLE-23)"
  entry_files:
    - "tools/generate/src/cli/kb.ts"
    - "tools/generate/src/cli/kb-projection.ts"
    - "tools/generate/src/cli/kb-model.ts"
    - "tools/generate/src/cli/assets.ts"
    - "tools/generate/src/cli/index.ts"
    - "apps/control-app/src/knowledge.ts"
    - "apps/control-app/src/system-knowledge.ts"
    - "apps/control-app/src/material.ts"
    - "apps/control-app/src/describe.ts"
    - "apps/control-app/src/fetch-guard.ts"
    - "apps/control-app/src/identity.ts"
    - "apps/control-app/src/access.ts"
    - "apps/control-app/src/index.ts"
    - "apps/control-app/src/router.ts"
    - "apps/control-app/src/tickets.ts"
    - "apps/control-app/src/builder/{app,config,library,upload,api}.js"
    - "db/migrations/0004_identity.sql"
    - "kb/knowledge_bases.json"
  features:
    - name: "1c kb export / build — corpus membership and listing"
      description: "Membership is the ticket's doc_kind; the shipped corpus applies no
        query-time predicate; the ticket listing is exhaustive and refuses truncation."
      behaviors:
        - "A doc ticket is a corpus member iff fields.doc_kind == system_kb"
        - "The retired system_kb boolean is not honoured at all"
        - "A bare markdown file with no frontmatter in the corpus dir is resolved"
        - "readDocTickets passes --no-limit and refuses a truncated envelope by name"
        - "1c kb status prints corpus count against the marker ticket count; unknown when unreadable"
      entry_point: "cmdKb / readDocTickets / resolveCorpus (tools/generate/src/cli/kb.ts)"
    - name: "1c kb — projected reference documents"
      description: "Three REF-* documents generated from the behavior catalogue, the L1
        schemas and the declared control surface, written before every export and build."
      behaviors:
        - "projectBehaviorCatalogue / projectL1Vocabulary / projectControlSurface, one source each"
        - "Membership fields read from the KB declaration, never hardcoded"
        - "Each producer sweeps only its own namespace (REF-* vs exported tickets)"
        - "An unchanged projection is not rewritten, so the index does not re-embed"
        - "Each body states its source; no projection cites an internal ticket"
        - "L1 value sets are scoped per element kind, not pooled"
      entry_point: "writeProjections (kb.ts) / projections() (kb-projection.ts)"
    - name: "1c kb / 1c assets — the KB as a bundle module"
      description: "kbBundle() reads both index dirs and the corpus into values with each
        document's own updated_at; 1c assets writes generated/kb.js unconditionally."
      behaviors:
        - "Module carries per-document updated_at rather than an EPOCH stamp"
        - "generated/kb.js always written; KB = null when none was built"
        - "A missing KB is named in the asset report"
        - "SYSTEM_KB / SHIPPED_SOURCE / CORPUS_TYPE shared via kb-model.ts"
        - "bin/1c.mjs awaits cmdAssets; previously reported success while writing nothing"
      entry_point: "kbBundle (kb.ts) / writeKbModule (assets.ts)"
    - name: "Worker system-knowledge runtime"
      description: "The bundle-resident KB opened in workerd, reaching no filesystem, and
        handed to the toolbox with its priming."
      behaviors:
        - "memoryIndexSource + bundleDocReader; no node:fs on the import graph"
        - "Opened once per isolate beside the store"
        - "knowledgeSurface and knowledgePriming passed as a pair or not at all"
        - "Null KB and absent AI binding are both silent degradations"
      entry_point: "knowledgeSurfaceFor / knowledgePriming (system-knowledge.ts), workerHost (ai.ts)"
    - name: "Project knowledge base (per tenant)"
      description: "A KB over the tenant's own ticket store, index resident in the private
        R2 bucket, refreshed incrementally by two independent triggers."
      behaviors:
        - "Declared beside system in kb/knowledge_bases.json; each host names what it serves"
        - "bindKb narrowed so the release build serves system alone"
        - "Store, index prefix and blob bucket all derive from one TENANT_ID"
        - "Index keys kb/<tenant>/project/... in BLOBS, never SITES, outside the attachment key space"
        - "Incremental re-embedding via the component's manifest and an updated_at cursor"
        - "onMaterialWritten: index inline, map rebuild to an injected deferral seam"
        - "onTranscriptGrew: index past ~4000 chars, never rebuild the map; cursor beside the index"
        - "landscape(): enumerated and labelled complete below ~1KB, clustered above; nothing bolded"
        - "DescriberNotConfiguredError above the floor with no describer; previous map stands"
        - "awareness_report type declared in the product TypePack from the component's own constants"
      entry_point: "projectKnowledgeFor / r2IndexSource (apps/control-app/src/knowledge.ts)"
    - name: "Material ingestion routes"
      description: "POST /api/material and POST /api/material/fetch over one pipeline."
      behaviors:
        - "Blob written before the record; a crash leaves an orphan blob, never a dangling pointer"
        - "kind classified from content type; rights/republishable/exportable from provenance only"
        - "Upload: republishable, not exportable. Fetched background: the inverse"
        - "Index seam called exactly once per created material; loud log when unwired"
        - "25MB ceiling refused in a client's words, leaving no material behind"
        - "Fetch guard: HTTPS only, no private/loopback/link-local, every redirect hop re-validated"
        - "promoteToSiteAsset refuses a non-republishable source"
      entry_point: "route() (router.ts) -> ingestUpload / ingestFetch (material.ts)"
    - name: "Description pipeline"
      description: "Four describers behind one status mechanism; nothing is rejected for being
        undescribable."
      behaviors:
        - "PDF via unpdf; image via a vision call behind an injectable seam; SFNT font parsed from
           its own name table; text decoded"
        - "description_status: ok | no_describer | no_text | unsupported | too_large | failed"
        - "description_model recorded alongside"
        - "The describer never throws; a failure costs findability only"
        - "WOFF/WOFF2 recorded unsupported (no brotli in workerd)"
      entry_point: "describeMaterial / anthropicImageDescriber (describe.ts)"
    - name: "Library tab and material read surface"
      description: "A second builder tab over the tenant's material, with four origin routes."
      behaviors:
        - "webui/split + webui/list-detail; filters by role and kind; 'used on this site' badge"
        - "Tenant-wide list including other sites' and unbound material"
        - "Detail: rights block read-only, description editable, blob previewed"
        - "GET /api/material (no bodies), /api/material/item, /api/material/file (inline, private bucket)"
        - "POST /api/material/description: re-indexes, refuses empty, records client as author"
        - "A uid that is not material/reference answers 404, not 403"
      entry_point: "createLibraryTab (builder/library.js), route() (router.ts)"
    - name: "Upload overlay and promotion"
      description: "One overlay watching the chat and the Library; areas are roles."
      behaviors:
        - "One instance, two watchers; two role areas, each a real button"
        - "A drop outside an area creates nothing and marks both areas"
        - "role narrows the provenance-inferred rights, never widens; malformed role refused"
        - "Chat-route drop appears as the client's turn reporting what happened; Library-route does not"
        - "role=site with a site selected promotes through the republishability gate"
        - "Promotion copies bytes BLOBS -> SITES and picks a free name; failure reported in the envelope"
      entry_point: "createUploadOverlay (builder/upload.js), promoteToSiteAsset (material.ts)"
    - name: "Identity: provisioning and admission"
      description: "users/memberships/entitlements; the invite creates, the login looks up."
      behaviors:
        - "0004_identity.sql; no CHECK on plan/status; no unique index on entitlements.account_id"
        - "provisionInvite: user, opaque acct_<random> tenant, owner membership, active grant, starter site"
        - "Re-invite reports the existing user rather than failing on the constraint"
        - "admit: pure lookup; user -> active membership -> best active grant covering now"
        - "Past ends_at refused; future ends_at admitted; revoked refuses independently of dates"
        - "One refusal message for every reason; the distinction is logged, not returned"
        - "guardAccess reports the verified identity rather than a yes/no"
      entry_point: "provisionInvite / admit (identity.ts), fetch (index.ts), guardAccess (access.ts)"
```

## Coverage Map

```yaml
coverage_map:
  - feature: "1c kb export/build — corpus membership and listing"
    status: partial
    existing_stories: ["story-c4f329d3"]
    existing_acs: ["AC-1295", "AC-1293", "AC-1296", "AC-1305"]
    gaps:
      - "AC-1295 asserts membership is 'only as a genuine boolean' — deliberately retired"
      - "AC-1293 has no notion of the marker ticket count or an unreadable store"
      - "No AC for the unrestricted shipped corpus or for refusing a truncated listing"
    notes:
      - "AC-1296 (every non-member named individually) and AC-1305 (the declaration is what the
         build uses) remain true and need no change."
  - feature: "1c kb — projected reference documents"
    status: uncovered
    existing_stories: []
    existing_acs: []
    gaps: ["No AC describes a corpus document generated from a source of truth"]
    notes:
      - "AC-1298 (a document that leaves the KB is deleted from the corpus) stays true but is now
         per-producer; the two-namespace sweep is documented as an AC of the new story."
  - feature: "1c kb / 1c assets — the KB as a bundle module"
    status: partial
    existing_stories: ["story-c4f329d3"]
    existing_acs: ["AC-1291", "AC-1292", "AC-1293", "AC-1299"]
    gaps: ["No AC for an importable artefact, its timestamps, or the always-written null module"]
  - feature: "Worker system-knowledge runtime"
    status: partial
    existing_stories: ["story-a58a0974"]
    existing_acs: ["AC-1317", "AC-1318", "AC-1319", "AC-1320"]
    gaps:
      - "AC-1320 states that on the deployed host the corpus 'is simply absent' — now false"
      - "AC-1317/1319 were only reachable on the operator's own machine"
    notes:
      - "This is the reuse-first catch of this reconciliation: the assistant's knowledge behaviour
         is fully specified already; only the set of hosts on which it holds has changed. No new
         story is created for it."
  - feature: "Project knowledge base (per tenant)"
    status: uncovered
    existing_stories: []
    existing_acs: []
    gaps: ["Nothing in the matrix describes a KB over the client's own material"]
    notes:
      - "AC-1318 names the SYSTEM knowledge base on the assistant's grant; the project KB is
         deliberately NOT wired into the session here (REQ-160 owns that), so STORY-103 is
         untouched by REQ-159."
  - feature: "Material ingestion routes"
    status: uncovered
    existing_stories: ["story-ab1ecd62", "story-a7a12d81", "story-e07c589b"]
    existing_acs: []
    gaps: ["CAP-106 covers where material lives, never how a byte gets in"]
  - feature: "Description pipeline"
    status: uncovered
    existing_stories: ["story-e07c589b"]
    existing_acs: ["AC-1497"]
    gaps: ["AC-1497 only says a material is valid before extraction; nothing says what the body
            becomes or how a degraded description behaves"]
  - feature: "Library tab and material read surface"
    status: uncovered
    existing_stories: ["story-e674c60a"]
    existing_acs: []
    gaps: ["The workspace story knows one content surface and a per-site image picker, not a
            tenant-wide library"]
  - feature: "Upload overlay and promotion"
    status: uncovered
    existing_stories: []
    existing_acs: []
    gaps: ["No way to put a byte in from the browser existed; no AC for role, for the ambiguous
            drop, or for promotion"]
  - feature: "Material vocabulary additions (role, description_status, description_model, filename)"
    status: partial
    existing_stories: ["story-e07c589b"]
    existing_acs: ["AC-1493", "AC-1494", "AC-1497"]
    gaps: ["The declared field block has no role and no description provenance"]
  - feature: "Blob addressing"
    status: partial
    existing_stories: ["story-a7a12d81"]
    existing_acs: ["AC-1486", "AC-1488", "AC-1487", "AC-1489"]
    gaps: ["AC-1488's dedup claim and AC-1486's 'content address' are false of the current
            component; both suites were already failing before this bundle"]
    notes: ["AC-1487 and AC-1489 (private bucket, tenant prefix) are unchanged and still hold."]
  - feature: "Workspace chrome / site selector proxies"
    status: partial
    existing_stories: ["story-e674c60a", "story-7f437d57"]
    existing_acs: ["AC-959", "AC-976", "AC-1064"]
    gaps: ["All three were exact while the builder had one tab and one dropdown of any kind"]
  - feature: "Identity: provisioning and admission"
    status: uncovered
    existing_stories: ["story-182e8cb9"]
    existing_acs: ["AC-1375"]
    gaps:
      - "No record in the matrix that a user, account, membership or grant exists"
      - "AC-1375 asserts a granted identity receives the surface's response — now the gate's own
         verdict only"
  - feature: "Origin-wide no-store on the new routes"
    status: covered
    existing_stories: ["story-e674c60a"]
    existing_acs: ["AC-977"]
    gaps: []
    notes:
      - "REQ-163 says so itself: adding a route without a probe is a failure of the existing
         origin-wide criterion, not a new rule. Both new routes gained probes; no matrix change."
```

## Plan Items

| # | Component | Type | Pts | Deps | Target |
|---|-----------|------|-----|------|--------|
| 1 | System KB — corpus export correctness | upgrade | 3 | - | STORY-117 |
| 2 | System KB — projected reference | feature | 3 | 1 | - |
| 3 | System KB — bundle-importable artefact | upgrade | 2 | 1 | STORY-117 |
| 4 | AI Assistant — the deployed assistant reaches the corpus | upgrade | 2 | 3 | STORY-103 |
| 5 | Project KB — the tenant's own corpus | feature | 3 | - | - |
| 6 | Project KB — two triggers and the enumeration floor | feature | 2 | 5 | - |
| 7 | Material Ingestion — from bytes to an indexed ticket | feature | 3 | - | - |
| 8 | Material Description — findable by its contents | feature | 3 | 7 | - |
| 9 | Builder Library Tab — the client's material, seen | feature | 3 | 7 | - |
| 10 | Upload Overlay & Promotion | feature | 3 | 7, 9 | - |
| 11 | Client Material Store — the vocabulary grows | upgrade | 1 | 8, 10 | STORY-128 |
| 12 | Material Blob Storage — one record owns one blob | upgrade | 2 | 7 | STORY-127 |
| 13 | Workspace & Assistant Pane — criteria restated | upgrade | 2 | 9 | STORY-99, STORY-104 |
| 14 | Identity & Entitlement — invite provisions, login binds | feature | 3 | - | - |
| 15 | Access Gate — the gate's verdict, admission behind it | upgrade | 2 | 14 | STORY-120 |

**Totals**: 15 items — 8 feature, 7 upgrade — 37 points.

## Step 3b — Intent scope vs implementation footprint

**Case 2 (declared supersession)** — five of the seven intents name the criteria they
supersede, and each is carried as an upgrade item rather than absorbed:

- REQ-164 retires the boolean membership rule AC-1295 asserts (item 1).
- REQ-158 falsifies AC-1320's statement that the deployed host has no corpus (item 4).
- REQ-161 names AC-959, AC-976 and AC-1064 (item 13) and REQ-162/REQ-163's blob-addressing
  criteria (item 12).
- REQ-167 narrows REQ-147's three "valid token yields a served response" criteria (item 15).

**Case 3 (code outside the declared intent)** — three, none absorbed into this bundle's
stories:

- `bin/1c.mjs` awaiting `cmdAssets`: a real defect in the existing assets command
  (it reported success while writing nothing). REQ-158's own commit message declares
  it, so it is inside the declared footprint and is folded into item 3's report
  criterion rather than raised as a separate item against CAP-102's STORY-119.
- Two UATs left red by the upstream `prompt` -> `description` rename (020ec40610) were
  repaired in REQ-164's commit. Test repair only; the owning intent is silent and no
  matrix change follows.
- `apps/control-app/src/material.ts`'s module header (482a1f9846) was corrected to stop
  describing step 1 as content-addressed and deduplicating. Documentation following
  item 12's correction; no separate item.

## Observations

- **The largest reuse catch is item 4.** REQ-158 reads as a new capability ("the builder
  AI can search its own design documentation") but STORY-103 already specifies the
  knowledge surface, the grant, the priming order and the absent-corpus degradation, and
  AC-1320 goes further — it explicitly says the deployed host has no corpus by nature.
  Creating a feature story here would have duplicated four criteria and left a fifth
  asserting the opposite of the shipped code. Classified as upgrade.
- **Two items target STORY-117 (items 1 and 3).** They are kept apart because they come
  from different intents with different evidence files and different justifications;
  item 3 depends on item 1 so the mutations apply in a deterministic order.
- **Item 13 targets two stories** because the intent groups them: one sentence in REQ-161
  restates AC-959, AC-976 and AC-1064 together, and all three fail for the same reason —
  a criterion expressed as an element count while the workspace had exactly one of the
  thing being counted.
- **REQ-159 does not touch STORY-103.** The project KB is deliberately not wired into the
  session; REQ-160 owns priming and the delta channel. The behavioural acceptance ("ask a
  question answerable only from the document") is proved here as far as it can be — the
  document is indexed and search returns it.
- **Splits taken, and why.** REQ-159, REQ-163 and REQ-161 are each too large for one story
  (20, 30 and ~40 UATs respectively). Each is split once along a seam the intent itself
  draws: corpus/index vs freshness (5/6), pipeline vs description (7/8), read surface vs
  write gesture (9/10). No split is per-flag, per-route or per-error-case.
- **Four commits carry no matrix consequence**: c056002a52, deaf3f98c4, 9ae7338430 and
  c2f6c582ad are version-scalar bumps, three of them re-bumps after a concurrent
  auto-commit or a merge claimed the number first. 482a1f9846 is a module-header
  correction. None is represented as a plan item.
- **Uncertainty recorded rather than resolved**: REQ-165 leaves open whether projections
  cluster sensibly beside consultation material in the awareness map, and REQ-163 leaves
  open that DNS is not resolved before a fetch, so a hostname resolving to a private
  address defeats the literal-host check (workerd cannot resolve a name before fetching
  it). Neither is a behaviour to document; both belong in the stories' notes rather than
  as acceptance criteria, since neither describes something the code does.
- **FC evidence on disk**: the dispatcher passed an empty `fc_tests` list, but ten FC test
  files for this bundle's tickets are present in `tests/` —
  `test_UAT_FC_REQ-{158,159,161,163,164,165,167}_*`. Every one is covered by a plan item:
  164 -> 1, 165 -> 2, 158 (bundle) -> 3, 158 (workers) -> 4, 159 -> 5/6, 163 -> 7/8/12,
  161 -> 9/10/11/13, 167 -> 14/15.