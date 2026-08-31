---
uid: report-12841fa2
id: REPORT-2887
type: report
title: 'Reconciliation Plan: BUNDLE-20 free-coded commits (REQ-143/145/146/147/148/149/150/151/152/153)'
created_by: xgd
created_at: '2026-08-31T09:26:11.418440+00:00'
updated_at: '2026-08-31T11:36:11.480720+00:00'
completed_at: null
last_field_updated: items
fields:
  report_kind: reconciliation_plan
  subject_uid: bundle-b3b7c399
  anchor_uid: bundle-b3b7c399
  items:
  - index: 1
    component: Builder Access Gate
    item_type: feature
    story_points: 3
    dependencies: []
    story_uid: story-182e8cb9
    description: 'The builder origin is private, and shut by two independent controls.
      The Worker''s platform-default hostname is disabled at the top level AND restated
      under the named environment, removing the host no hostname policy can cover;
      and the Worker verifies the Access JWT itself before anything reaches the origin
      - RS256 against the team''s JWKS (cached), with the algorithm pinned from the
      JWKS rather than believed from the token header, and `aud` checked as well as
      the signature because every application in a team is signed by the same keys.
      Fail closed with no exception path and two distinct refusals: empty configuration
      answers 503 naming the missing variable (which sends the operator to the config
      file), and an absent, malformed, forged, `alg:none`, wrong-`aud`, wrong-`iss`,
      expired or unknown-`kid` token answers 401 (which sends the identity to Access).
      An unfetchable JWKS denies. The token is accepted from the header, from the
      Access cookie and from a service-token identity alike. There is no local-development
      bypass, because a security control with an off switch is not one. The granted
      identities, the two controls, the variables and how to verify them are recorded
      in the repository, since a policy that lives only in a dashboard is one nobody
      can review.'
    justification: 'No story in the matrix describes authentication or authorization
      of the builder origin at all - not under any capability. The nearest, story-e674c60a,
      assumes the opposite: its ACs pinned that *any* caller reaches the origin, and
      this work had to qualify them. Authorising who may reach the operator surface
      is a capability bucket that does not exist yet, so this is a feature rather
      than an extension of the workspace story; the qualification of those existing
      ACs is carried as item 3''s modify list, not folded in here.'
  - index: 2
    component: Cloudflare Site Store (D1 definitions, R2 bytes)
    item_type: feature
    story_points: 3
    dependencies: []
    story_uid: story-fde7370b
    description: 'A second implementation of the site storage port that runs with
      no filesystem: site definitions, pages and the change journal in D1, asset bytes
      in R2. Tenancy is the hard barrier and is bound into the handle at construction
      - no verb takes a tenant, so there is no call site at which the wrong one could
      be passed, and crossing requires a second handle that is visible in a diff;
      an unknown OR inactive tenant is refused with a typed error rather than handed
      a store that reads nothing, which would be indistinguishable from an account
      with no sites. Optimistic concurrency arrives as `SiteWrite.expect` plus `SiteStore.version()`
      on the port: the guard is a statement inside the batch, placed after the writes
      with no pre-read short-circuit, so a refused four-page write really does execute
      its inserts and really is rolled back - leaving no page, no definition change
      and no version bump - and the loser gets a conflict error carrying both versions.
      The filesystem adapter ignores `expect` rather than performing a check-then-write
      that would look like a compare-and-set while leaving the race intact. Bytes
      round-trip through R2 including non-UTF-8 sequences, with content types read
      back off the object and traversal-shaped names refused as on the filesystem;
      bytes are written before metadata, so a failure orphans an object rather than
      listing one that 404s. Import is port-to-port and crosses as one whole change,
      so a half-landed import cannot exist. One contract module is executed over three
      adapters - filesystem and memory in the host runtime, D1/R2 inside the Workers
      runtime against real bindings - so they cannot drift, with the render-dependent
      cases named as an explicit exception rather than silently absent. Underneath
      it, the framework catalog splits so an Astro-free worker entry exists and the
      edit surface can load in workerd at all, and the extension-to-content-type table
      moves out of the node-only server so R2 and the file server give one answer.
      The bindings are declared on both sides of the environment inheritance line
      and the schema ships as a deploy migration hook that is executable and lists
      rather than applies on a rehearsal.'
    justification: capability-c4c7a854 exists, but story-3f4a5f2b explicitly places
      'the Cloudflare store itself (database + object store adapter)' out of scope
      and names that separation as the reason its own correctness claim is checkable.
      Nothing in the matrix covers tenancy scoping, version compare-and-set, multi-write
      atomicity, the byte path, or the three-adapter contract. Folding this into story-3f4a5f2b
      would contradict that story's own declared boundary; it is a new story inside
      an existing capability bucket, not a parallel port.
  - index: 3
    component: Builder Workspace Origin
    item_type: upgrade
    story_points: 3
    dependencies:
    - 1
    - 2
    story_uid: story-e674c60a
    target_story_ids:
    - story-e674c60a
    intent_delta_summary: story-e674c60a records a declared deviation - 'the render
      still runs at the origin, not in the edge Worker ... what remains is the runtime
      relocation alone', waiting on the store being reachable from the edge. That
      relocation has happened. The story's ACs were deliberately written about one
      origin and what an operator observes so they would survive it; what changes
      is the deviation note, the proxy, and the qualification of the origin ACs by
      the gate in item 1.
    acceptance_criteria_changes:
      add:
      - With no local origin process running, the deployed Worker serves the workspace
        document, lists the sites the store actually holds, and produces the draft
        and edit channels itself at request time, reading the cloud store.
      - The builder's own browser code, the shared UI components and the framework
        bridges are build artifacts produced by a build command; no route type-strips,
        transpiles or resolves a package per request. The assets are served behind
        the gate rather than ahead of it, because an asset answered before the Worker
        would bypass it.
      - 'The operator''s builder command is a transport, not a second origin: it takes
        a local HTTP request, hands it to the same route table the deployed Worker
        calls, and returns the response - one route table, one set of edit functions,
        one render, two front doors. It starts the real runtime against the local
        simulated store by default, with reaching production an explicit flag.'
      - A local site's draft definition and assets can be copied into the cloud store,
        through the same bindings the Worker serves from, idempotently.
      - A capability the Worker cannot host yet answers 501 naming the ticket that
        will implement it, not 404 - a deferral must not read as a routing bug. The
        invariant is about the shape of a deferral, so a route graduating is expected
        to leave it.
      - The store is opened only after a route matches, so a build artifact is never
        made to depend on a tenant; the fall-through to assets stays last so an asset
        cannot shadow a route, and a store-construction failure is still reported
        at its own status rather than downgraded to a generic error by the router's
        own handler.
      - A builder that cannot start says so in the page. An inline guard - inline
        because serving it as a file would make the diagnostic depend on the binding
        most likely to be broken when it is needed - registered before the module
        it watches, replaces a blank page with what actually went wrong and a named
        fix for a missing asset and for a missing tenant, and re-checks that the page
        is still empty before every write so a slow-but-successful mount is never
        overwritten.
      modify:
      - The origin ACs that pinned 'one host answers every route with the origin response
        verbatim' and 'unconfigured and unreachable origins are distinct failures'
        now describe an ADMITTED caller - the property they are about is unchanged
        for one - and each additionally asserts that an unadmitted caller is refused.
      - The non-cacheable directive is the route table's, not the outer fetch handler's,
        so every host inherits it - the transport was serving the workspace document
        with no directive at all.
      - A produced channel is reused until the definition moves, keyed on the store
        object rather than on a tenant identifier - every local workspace shares one
        tenant id, so the old key let one workspace's renderer serve all the others.
      remove:
      - The proxy and its origin variable, and the duplicate route table in the local
        origin - replaced outright rather than left behind a flag.
      - 'The AC asserting that a page mounting a behavior module fails to render in
        the Worker: that boundary is removed by item 5 rather than worked around,
        and item 5 carries the positive.'
    description: 'The workspace origin moves into the edge Worker: it routes, reads
      the cloud store, and renders the draft and edit channels itself. Everything
      that was served from a place a Worker cannot reach becomes a build artifact.
      The operator''s builder command survives as a transport over the one route table
      rather than as a second implementation. A builder that cannot boot explains
      itself in the page instead of serving a blank one.'
    justification: 'The story itself declares this relocation as its one outstanding
      deviation and states its criteria were written to survive it. No new capability
      bucket: it is the same workspace, at the same address, showing the same things
      - the runtime underneath changed. Creating a parallel ''builder in the cloud''
      story would leave the matrix asserting a proxy that no longer exists.'
  - index: 4
    component: AI Site Assistant Runtime
    item_type: upgrade
    story_points: 3
    dependencies:
    - 2
    - 3
    story_uid: story-a58a0974
    target_story_ids:
    - story-a58a0974
    - story-93905de4
    intent_delta_summary: The assistant host runs in the Worker. The conversation
      contract is unchanged - one conversation per site, resumed on return, honest
      failure - but 'stored with the workspace the site belongs to' becomes store-backed,
      the audit has to survive an isolate rather than a process, and the declared
      surface is now implemented by the composition of a portable core and the host's
      own filesystem-bound operations rather than by one list.
    acceptance_criteria_changes:
      add:
      - A whole turn runs in the Worker with the model key read from a deploy secret,
        and the edits it makes land in the cloud store.
      - 'The conversation survives the relocation: the transcript is kept in the language-neutral
        session form byte for byte, so a conversation archived by the Worker still
        loads in the filesystem host and in the peer implementation. A Cloudflare-shaped
        record would have made the two runtimes stop being the same product.'
      - No filesystem-backed junction or archive can reach the Worker path - asserted
        over the shipped bundle's import graph, not by a passing turn, because the
        filesystem module RESOLVES under the compatibility flag and hands back a per-isolate
        ephemeral disk that passes a test and loses every conversation on eviction.
      - The assistant library is bundled at build time - no path resolution, no file
        URL, no runtime dynamic import on the Worker path - and the build fails loudly
        when the out-of-band component is absent rather than shipping a Worker whose
        chat route is silently missing.
      - 'No secret appears in a log, an error envelope or a client response. The scrub
        is at the response boundary rather than at each throw site, because the leak
        arrives from below: an SDK that puts its request into its error. It matches
        on the known secret values, not on a pattern - a pattern misses an unexpected
        shape and mangles prose that happens to match.'
      - Transcripts and the audit live outside the only storage prefix the site store
        composes, so no request URL can name them.
      - 'The model key ships as a deploy secret, and the deploy asks the STORE whether
        it is in place rather than the operator''s shell: a value in the environment
        is pushed (supplying one is how a rotation is expressed), an absent value
        whose name is already stored is left alone and reported, and an absent value
        with nothing stored fails before anything is uploaded. Only a positive read
        satisfies the guard - a read that fails for any reason counts as absent, because
        the failure being guarded against is a confident skip based on an answer nobody
        got - and a rehearsal reaches the same decision by the same route.'
      - (story-93905de4) Every write the assistant makes is audited durably and the
        audit survives a restart. One record per object, because the object store
        has no append and a read-modify-write would let two concurrent turns lose
        each other's records - an audit that drops entries under load is worse than
        none, because it reads as evidence. The flush is in a finally inside the stream,
        so an abandoned or failed turn still records what it managed to do.
      modify:
      - (story-a58a0974) Continuity is 'stored through the store the site belongs
        to' rather than 'stored with the workspace'; the junction in front of it is
        in-memory and drained during the turn, so an eviction costs the turn in flight
        and not the conversation.
      - (story-93905de4) The declared control surface is compared against the composition
        of the portable core's operations and the host's own filesystem-bound ones.
        Comparing against the core alone asserts that a declared operation is unimplemented,
        which is the opposite of the invariant.
      - (story-93905de4) The publish operation is not reachable from the assistant
        in the Worker - it is filesystem-bound and belongs to item 7 - and the system
        knowledge base degrades to absent there, which is the documented ordinary
        state rather than a failure.
      remove: []
    description: 'The assistant host runs in the Worker: the library is injected rather
      than resolved off disk, the transcript archive and audit sink are store-backed,
      the session junction is in-memory, and the model key is a deploy secret whose
      presence the deploy checks against the store rather than the operator''s shell.
      The tool surface and host split into a portable core and two thin runtimes,
      leaving the existing command-line entry points'' API untouched.'
    justification: Extends the existing per-site-conversation bucket in place - the
      runtime is different, the conversation contract is not - and the audit-durability
      and surface-composition changes land on the control-surface story that already
      owns 'granted narrowly, checked before it runs, written down call by call'.
      No new capability bucket and no second assistant.
  - index: 5
    component: Behavior Module Rendering
    item_type: upgrade
    story_points: 2
    dependencies: []
    story_uid: story-179b8c06
    target_story_ids:
    - story-179b8c06
    intent_delta_summary: A behavior component stops being a template that only a
      build transform can compile and becomes a plain function from props to HTML.
      The contract, the two composition directions, the zero-CSS obligation and the
      conformance dimensions are unchanged; what changes is the artifact a module
      ships and, consequently, that a site mounting one renders in a runtime with
      no transform.
    acceptance_criteria_changes:
      add:
      - A site mounting a behavior module renders in the Workers runtime, and the
        bytes it serves are the component's own output. Parity with the filesystem
        host is structural rather than compared, because both run the same function;
        parity is node-vs-worker, not parity with the previous transform's output,
        whose inter-element whitespace differs and is semantically inert.
      - The edit channel still switches the behaviour off for a module-mounting page.
      modify:
      - A behavior component is a plain typed function returning markup, so the catalog
        is portable and the render path names the module lookup directly - no container
        to create, no resolver to inject, no branch for 'this page needs the transform',
        and one render entry point for both hosts.
      - A module's invariant-element presentation is a real stylesheet beside the
        component rather than a block inside its template, precompiled into the build
        artifact by the same mechanism and still pinned against drift by re-extraction.
        It is byte-equivalent to what the template held modulo the dedent - the conversion
        adds no rule and entrenches none that is being removed elsewhere.
      - Both surviving modules convert through the one mechanism with no per-module
        machinery.
      - The negative conformance fixtures are plain components and still discriminate;
        the harness runs its full set rather than skipping most of it for want of
        a browser.
      remove: []
    description: 'Behavior modules render without a build transform: the components
      become plain functions, their CSS becomes a real stylesheet, the registry becomes
      portable, and a site mounting one renders in the Workers runtime producing the
      same bytes as the filesystem host.'
    justification: story-179b8c06 already owns the behavior contract and 'the two
      reframed survivor behavior modules and their observable behaviour'. This changes
      the shape of the artifact a module ships and where it can run - the same capability
      bucket, extended. A new story would split one contract across two.
  - index: 6
    component: 1c CLI Bootstrap
    item_type: upgrade
    story_points: 2
    dependencies:
    - 5
    story_uid: story-e15a19ef
    target_story_ids:
    - story-e15a19ef
    intent_delta_summary: The story's fourth guarantee - 'the render path is Astro-free
      unless a page needs Astro' - becomes unconditional, and its measurement changes
      from observing one render to a static scan of the render graph. The launcher
      boots a plain bundler dev server, and the build framework leaves the repository.
      The boot-hygiene guarantees are unchanged in substance and restated so they
      are about any boot chatter rather than one framework's.
    acceptance_criteria_changes:
      add:
      - Every command boots through a plain bundler SSR server configured by the launcher
        itself, with the config file pinned off so behaviour cannot depend on a config
        that exists at the root for some other purpose, and with the bundler resolved
        as a direct dependency rather than through another package's module graph.
      - The build framework is absent from every manifest in the repository, from
        the lockfile's importers and from every source file; the separately-published
        markdown package it is often confused with is a real dependency and stays.
      - The one command whose output everything else imports still bootstraps on a
        fresh checkout without loading the command barrel - the barrel reaches the
        route table, which reaches the document that imports the generated map, so
        a fresh tree could otherwise never run the command that would fix it.
      modify:
      - '''The render path is Astro-free unless a page needs Astro'' becomes ''no
        source file reachable from ANY render names a build-transform specifier''.
        The container spy cannot survive the uninstall, so the measurement becomes
        a static scan - which is strictly stronger than the spy it replaces (the spy
        proved no container for THIS render; the scan proves no container is reachable
        from any), so the guarantee survives the rewrite rather than being weakened
        by it. The render-output assertions are untouched.'
      - The quiet-bootstrap guarantee is restated about ANY boot chatter rather than
        one framework's; the stdout-to-stderr diversion is kept and re-justified as
        defence in depth for a machine-readable command's single document, since the
        new server has its own cold-boot notices.
      remove: []
    description: The command-line launcher boots a plain bundler SSR server rather
      than one configured through the site-build framework, and that framework leaves
      the repository entirely - test configs, type entries and build-approval entries
      with it. The Astro-free render guarantee is restated in its stronger, unconditional
      form.
    justification: 'story-e15a19ef already owns the CLI''s boot hygiene and, in guarantee
      4, the Astro-free render claim this supersedes. Changing what that guarantee
      says and how it is measured is an in-place modification of the existing intent,
      not a new capability. Separate from item 5 because they fail independently:
      item 5 is the module contract, this is the launcher and the dependency.'
  - index: 7
    component: Publish (operator half of delivery)
    item_type: upgrade
    story_points: 3
    dependencies:
    - 2
    - 3
    story_uid: story-5349d01f
    target_story_ids:
    - story-5349d01f
    intent_delta_summary: 'The operator half of delivery stops being a laptop command
      that ships a content-addressed snapshot and becomes publishing in the cloud:
      the port grows revision STORAGE verbs and one publish service sequences them
      above whichever adapter it was handed, so the route and the command are two
      callers of one function. The whole content-addressed deploy command, its per-tree
      index and its preview channel are removed rather than ported - shipping a revision''s
      bytes and recording it live is what publish now does with both bindings in hand.'
    acceptance_criteria_changes:
      add:
      - Publishing mints a revision, renders it and writes it to shared storage with
        no filesystem anywhere on the path, driven identically from the builder's
        route and from the command line. There is exactly one publish implementation
        and no second route handler for it - the local transport's own interception
        is gone, and it was the one route where the two front doors disagreed about
        what a route does.
      - 'Publishing an unchanged draft is a no-op that returns the live revision and
        mints nothing, because publish is a toolbar button now and buttons get pressed
        twice. Forward-only is unaffected: a draft checked out from an earlier revision
        differs from live, so it mints.'
      - An invalid draft publishes nothing, and the failure happens before any write.
      - Revision history is readable - lineage, message, author and the per-path changes
        - and a checkout of an earlier revision re-parents the draft onto that revision
        and stays forward-only.
      - 'A second tenant cannot publish over a slug another tenant has claimed: the
        claim is the primary key of a claim table rather than a check, the attempt
        fails, and the live site is untouched. The public URL grammar keeps no tenant,
        so the claim is what makes that safe.'
      modify:
      - '''The artifact is complete'' survives and is now load-bearing for a different
        reason: the mutable draft lives in the database, so the frozen definition
        shipped beside the rendered output is the ONLY copy of what the site looked
        like at that revision, which is what makes a checkout possible.'
      remove:
      - 'The whole content-addressed deploy command and everything only it expressed:
        the two-channel deploy, snapshot identity as a digest of contents, the per-store-tree
        deploy index and its concurrent-writer refusal, the ''shipped but not publicly
        reachable'' report, the dry run and the prune. Prune has no home once the
        command is gone; orphaned bytes from an interrupted publish are unreachable
        and cost only storage.'
      - Draft preview snapshots and their shareable digest-addressed links. They were
        index-backed, so they could not stay behind while revisions moved without
        leaving exactly the half-migrated split the project forbids. Sharing a draft
        returns later as a builder control.
    description: 'Publishing moves into the cloud. The storage port grows revision
      verbs - read the log, append a revision with its frozen content, read one back,
      read and set the draft''s lineage pointer - and one publish service validates,
      diffs, no-ops or mints, snapshots, renders, records and re-parents above them.
      The database is the only record: the per-site index file is deleted rather than
      demoted, and which revision is live is derived as the highest id.'
    justification: story-5349d01f IS the story this supersedes - it documents a command
      that no longer exists, and several of its UATs were deleted with it. Recording
      the replacement as a new feature story would leave the matrix asserting a deleted
      command while a second story described its successor. Same capability bucket
      (the operator half of delivery), modified in place, with the removals stated
      explicitly rather than left implied.
  - index: 8
    component: Public Serving (visitor half of delivery)
    item_type: upgrade
    story_points: 2
    dependencies:
    - 7
    story_uid: null
    target_story_ids:
    - story-d34eccd8
    intent_delta_summary: The visitor half keeps its shape - a URL names a site, one
      multi-tenant server answers, the grammar rejects before it reads, failure is
      opaque - but the authority behind it changes from a per-site index file in object
      storage to rows in the database, read behind the seam the server already had.
      The preview addressing form and the servable/non-servable store-tree distinction
      go with the writer that produced them.
    acceptance_criteria_changes:
      add:
      - 'No site''s live revision is recorded in two places: the per-site index file
        no longer exists, and live is derived as the highest revision id rather than
        stored. Storing it would reintroduce the duplication the model already refused
        once.'
      - 'The builder''s published view redirects to the public server rather than
        serving those bytes itself, so published bytes have exactly one serving path.
        The cost is accepted: a never-published site shows the public server''s not-found
        rather than a builder-shaped message.'
      modify:
      - '''The deploy index is the authority on what is servable'' becomes ''the revision
        record in the database is''. The guarantee is unchanged - no component of
        a requested URL names stored bytes unless a record vouched for it first -
        and the seam the server resolves a channel through is unchanged; only the
        implementation behind it reads the database. That the seam is the interface
        is what its own comment already promised.'
      remove:
      - The preview addressing form and its content-addressed snapshot identity, which
        went with the index that vouched for them.
      - 'The servable/non-servable store-tree distinction and every AC about a crafted
        address reaching the non-servable tree: only the Worker writes now, and it
        only ever writes its own tenant''s real sites, so the second tree has no writer
        left.'
    description: The public server answers from the revision record in the database
      rather than from an index file beside the bytes, behind the same channel-resolution
      seam it already had. Live is derived, never stored. The builder's published
      view redirects here so published bytes have one serving path.
    justification: The visitor half of the same delivery capability; the story is
      still 'what a URL serves'. Its addressing and reachability rules change substance,
      which is exactly what an upgrade is for - and leaving them as written would
      have the matrix asserting an index file that has been deleted and a preview
      URL form that no longer exists.
  - index: 9
    component: Platform Build & Live-Origin Smoke
    item_type: upgrade
    story_points: 1
    dependencies:
    - 1
    story_uid: null
    target_story_ids:
    - story-d5167ced
    intent_delta_summary: Two live-origin checks join the set the story already owns,
      and the build learns one more way to refuse before emitting a broken artifact.
      The hook contract, target selection and secret mechanism are unchanged.
    acceptance_criteria_changes:
      add:
      - 'Two live-origin checks join the set: an unauthenticated caller to the control
        origin is challenged rather than served, and the Worker''s platform-default
        hostname does not answer at all. Each is selected by its own option and skips
        by name against an origin it does not apply to, rather than failing there.'
      - The build refuses a Worker whose TYPE program reaches a filesystem-bound module,
        naming the import chain that got there. A bundle-graph guard is deliberately
        silent about this class - a type-only import is erased before a bundler sees
        it but NOT before the typechecker - so the suite stayed green while the build
        failed; the guard walks every import the typechecker does.
      - The build produces the generated assets before it typechecks, so a fresh checkout
        has the artifact the rest of the tree imports.
      modify:
      - The rule that every named environment repeats every top-level variable and
        binding gains one stated exception, rather than being weakened silently.
      remove: []
    description: The live-origin smoke gains two checks that assert the builder is
      private, targeted by their own options and skipping by name elsewhere; and the
      build gains a refusal for a Worker whose type program reaches filesystem-bound
      code, plus generation of the shared assets before the typecheck.
    justification: 'story-d5167ced already owns ''the nine live-origin checks, their
      pass, fail and skip reporting'' and ''refuses before emitting a broken artifact''
      - both extended in place. It stays the right home even though its out-of-scope
      note assigns the migration and secret HOOKS elsewhere (items 2 and 4 respectively):
      this is the check set and the build, not a hook. No new capability bucket.'
  - index: 10
    component: Site Locale Identity
    item_type: feature
    story_points: 2
    dependencies: []
    story_uid: null
    description: 'A site declares where the business is - a country code, and optionally
      a locale, a currency and a timezone - and the last three derive from the country
      through a data table of 66 countries, each individually overridable. They stay
      four fields rather than one because they correlate without determining: the
      same currency in two locales gives a different symbol placement and different
      separators. Both render paths emit the document''s language and text direction
      from ONE resolution, so they cannot drift; direction is decided by the script
      subtag when one is present and the language subtag otherwise, which is the only
      way two scripts of one language are both right. A site that declares nothing
      resolves to the region-free language - the value the hardcoded literal used
      to be, and the honest one, because a country nobody stated must not become a
      region nobody stated, and the language attribute is what a screen reader uses
      to choose pronunciation and what a search index reads. An unsupported country,
      a POSIX-spelled locale, a lowercase currency or an unknown zone is a validation
      error at a machine-readable path, never a silent fall back to one country''s
      defaults. The resolved locale reaches behavior modules as a prop, so the modules
      that need it read one answer rather than each deriving its own. The derivation
      table is held to the same validation a site''s own declaration is, so a mistyped
      row fails at build rather than when a customer signs up. Alongside it, a page
      slug that is EXACTLY a locale segment is reserved - anchored whole and matched
      case-insensitively against the whole ISO 639-1 registry, with the numeric region
      form reserved and the four-letter script subtag deliberately not, because four-letter
      tails are ordinary English words and plausible slugs. The refusal names why
      and offers two working alternatives, because a validation failure that reads
      as arbitrary gets worked around rather than obeyed.'
    justification: 'Nothing in the matrix gives a site a location, a language, a currency
      or a timezone: the site configuration carried a business name, a tagline, contact
      details and integrations, the language attribute was a literal in two renderers,
      and a page slug was an unconstrained string. This is a genuinely new capability
      bucket, not an extension of the framework substrate story (which owns typed
      presentation axes) or of the structured-edit story (which owns the write path,
      not what a site may declare). The two halves are one story because they are
      one body of platform locale knowledge in one module, and the slug reservation
      exists only to protect the URL shape the locale identity makes possible - splitting
      them would produce a story whose entire justification lives in the other.'
  - index: 11
    component: Money & Time Formatting Seam
    item_type: feature
    story_points: 2
    dependencies:
    - 10
    story_uid: null
    description: 'One formatting seam, exported from the framework, that a module
      reads instead of inventing an answer - added before the capabilities that need
      it so neither has to. Money is minor units plus a currency code, and the divisor
      comes from the currency''s own minor-unit count rather than a hardcoded hundred,
      which would undercharge a zero-decimal currency a hundredfold and overcharge
      a three-decimal one by a thousand. The decimal is built by string arithmetic
      rather than division, because division loses a cent at the top of the safe integer
      range and a shown price is a legal claim. A non-integer amount and a currency
      that is not ISO 4217-shaped both throw, so a transposed pair of string arguments
      fails loudly instead of rendering something plausible. Time is an instant plus
      a zone id: a zone-less wall-clock string is refused, because accepting it would
      silently reinterpret it as whichever zone the build host happened to be in and
      bake that into an immutable snapshot; an explicit offset IS admitted, since
      at a formatting boundary the distinction that matters is ambiguous versus unambiguous;
      and a zone id the runtime does not know is refused rather than allowed to produce
      an opaque error from inside the formatter. Instant-plus-zone is what survives
      the weeks in which two regions have left summer time on different dates, where
      a stored fixed offset is an hour wrong. And the standing conflict between ''a
      module must never read the clock at render time'' and a module whose whole job
      is time-varying content is resolved rather than left open: render output stays
      byte-deterministic, and time-varying content is client-rendered or fetched at
      request time and never derived from the render clock. The prohibition therefore
      stands untouched and showing a date is no longer mistaken for breaking it -
      the seam has no clock-reading overload, which is the rule as an API rather than
      as something to remember, and no source on the render path reads the ambient
      clock.'
    justification: 'No story covers value formatting, currency representation or time-zone
      handling. The framework substrate story owns typed presentation axes - what
      a thing looks like - not how a number or an instant becomes text; the behavior-module
      story owns the contract, not a shared library the modules call. A new capability
      bucket. Separate from item 10 because that one is what a site declares and this
      is what reads it: the identity is useful with no formatter, and the formatter
      is testable with no site.'
---

# Reconciliation Plan — BUNDLE-20

**Mode**: commits (24 free-coded commits, 10 source tickets: REQ-143, REQ-145,
REQ-146, REQ-147, REQ-148, REQ-149, REQ-150, REQ-151, REQ-152, REQ-153)
**Anchor**: bundle-b3b7c399 (BUNDLE-20)

## Step 0 — The intent, as the operator stated it

Read from the bundle body and its per-ticket implementation records (129k chars).
The bundle is one arc with two tails:

**The arc — get the whole authoring loop off the operator's machine.** REQ-143
puts the store in D1/R2; REQ-145 makes the control app the origin instead of a
proxy; REQ-146 moves the assistant host in; REQ-148 removes the last thing that
could not run there (the build transform behind behavior modules); REQ-149 takes
the last filesystem-bound verb, publish. REQ-147 sits across all of it: the
builder must not be publicly visible once it works. REQ-150 is the cleanup the
conversion made possible — the framework leaves the repository.

**Tail one — internationalisation, done before it is needed** (REQ-151, REQ-152,
REQ-153). All three are justified by the same property: a published revision is
an immutable snapshot, so a wrong language attribute, a mis-scaled price, a
mis-zoned booking or a slug that collides with a future locale prefix is
*unrecoverable* rather than merely expensive. There were zero published revisions
at implementation time, which is the whole reason the operator did it then.

**Tail two — three follow-ups found by demoing and deploying the landed work**
(the boot guard, the type-program guard, the deploy secret guard). Each is filed
against REQ-149 but belongs to whichever capability owns the surface it repairs;
they are placed accordingly below, not lumped under publish.

Scope boundaries the operator declared explicitly, and which this plan honours:

- REQ-147 AC5 deliberately does **not** require a working builder — the gate is
  provable against the Worker as it stands, and asserting an edit there would
  make Access depend on REQ-145 while REQ-145 depends on Access.
- REQ-143 wires **no production caller**: it ships the adapter, schema, import
  path and bindings, and nothing else.
- REQ-146 leaves publish refused by name; REQ-149 takes it.
- REQ-149 D7 drops draft preview snapshots deliberately rather than porting
  them, and says so.

## Behavior Inventory

```yaml
behavior_inventory:
  source: "free-coded commits: 24 commits across 10 tickets on reconcile-BUNDLE-20"
  entry_files:
    - "apps/control-app/src/index.ts"
    - "apps/control-app/src/router.ts"
    - "apps/control-app/src/access.ts"
    - "apps/control-app/src/ai.ts"
    - "apps/control-app/src/boot-guard.ts"
    - "apps/control-app/src/redact.ts"
    - "apps/control-app/src/store.ts"
    - "apps/public-site/src/site-store.ts"
    - "apps/public-site/src/routes.ts"
    - "tools/generate/src/store/site-store.ts"
    - "tools/generate/src/store/d1r2-store.ts"
    - "tools/generate/src/store/revision-model.ts"
    - "tools/generate/src/store/import-site.ts"
    - "tools/generate/src/publish/publish.ts"
    - "tools/generate/src/cli/builder.ts"
    - "tools/generate/src/cli/assets.ts"
    - "tools/generate/src/cli/push.ts"
    - "tools/generate/src/cli/ai/host-core.ts"
    - "tools/generate/src/cli/ai/toolbox-core.ts"
    - "tools/generate/src/render/render.ts"
    - "tools/generate/bin/1c.mjs"
    - "packages/framework/src/worker.ts"
    - "packages/framework/src/intl.ts"
    - "packages/framework/src/modules/catalog.ts"
    - "packages/framework/src/modules/{carousel,contact-form}/component.ts"
    - "packages/site-schema/src/locale.ts"
    - "packages/site-schema/src/schema.ts"
    - "db/migrations/0001_site_store.sql"
    - "db/migrations/0002_revisions.sql"
    - "bin/deploy.d/migrate/10-d1-site-store"
    - "bin/deploy.d/secrets/10-anthropic-api-key"
    - "bin/publish"
    - "tools/generate/bin/smoke.mjs"

  features:
    - name: "Access gate on the control origin"
      description: >-
        Two independent controls: the platform-default hostname disabled top-level
        and under the named environment, and in-Worker verification of the Access
        JWT before the origin is read.
      behaviors:
        - "RS256 verified against the team JWKS; algorithm pinned FROM the JWKS, not read from the token header"
        - "aud, iss, exp, nbf, iat all checked; aud because every app in a team shares signing keys"
        - "JWKS fetched and cached; an unfetchable JWKS denies"
        - "Empty ACCESS_TEAM_DOMAIN/ACCESS_AUD -> 503 naming the missing var; bad/absent token -> 401"
        - "Token accepted from header, from the Access cookie, and as a service-token identity"
        - "No local-development bypass; the local builder surface is the unproxied transport"
        - "Granted identities, controls, vars and verification recorded in apps/control-app/ACCESS.md"
        - "bin/smoke --control-origin / --workers-dev-origin assert both doors against a live deploy"
      entry_point: "guardAccess() in apps/control-app/src/access.ts, called first in index.ts"

    - name: "D1/R2 site store"
      description: "Second adapter for the SiteStore port; definitions and journal in D1, bytes in R2."
      behaviors:
        - "d1r2SiteStore(env).forTenant(id) — tenancy bound at construction; no verb takes a tenant"
        - "Unknown OR inactive tenant -> UnknownTenantError at construction"
        - "SiteWrite.expect + SiteStore.version() = optimistic CAS; loser gets StoreConflictError with both versions"
        - "CAS guard is a statement inside db.batch(), after the writes, no pre-read short-circuit -> a refusal really executes and really rolls back"
        - "fs adapter ignores expect rather than faking a CAS it cannot honour"
        - "R2 bytes written before metadata; keys draft/<tenant>/<slug>/assets/<name>; traversal names refused"
        - "Journal as rows, not a blob; window arithmetic restated as the DELETE it implies"
        - "importSite(from, to, slug) is port-to-port and crosses as one SiteWrite"
        - "One contract module executed over fs, memory and D1/R2 (real miniflare bindings)"
        - "@1stcontact/framework/worker — the transform-free half of the catalog, so edit.ts loads in workerd"
        - "MIME table moved out of the node-only server into store/content-type.ts"
        - "DB/SITES declared top-level AND under [env.production]; migrations_dir on the binding"
        - "bin/deploy.d/migrate/10-d1-site-store — executable, applies --remote, lists on --dry-run"
      entry_point: "tools/generate/src/store/d1r2-store.ts"

    - name: "Builder origin in workerd"
      description: "control-app stops proxying and becomes the origin: routes, store reads, render."
      behaviors:
        - "route() owns /, /api/sites, /api/import, /api/assets, /api/palette, /api/copy, /api/revisions, /api/publish, /api/ai/*, /preview/*, /builder/*, /webui/*"
        - "1c assets — builder client, webui components, framework bridges become build artifacts"
        - "Assets served behind the gate via run_worker_first"
        - "getModuleCss() moves from render time to build time (module-assets.ts), with a re-extraction drift UAT"
        - "The container and module resolver are INJECTED by the node-only writer; render.ts names neither"
        - "bin/publish / 1c push — copy a local draft into the cloud store through the Worker's bindings"
        - "1c builder drops 730 -> ~100 lines: node:http in, Request/Response out, into route(); spawns wrangler dev (--remote to reach production)"
        - "no-store is the router's, so every host inherits it"
        - "Preview-render reuse keyed on the store object (WeakMap), not the tenant id"
        - "Deferred capabilities answer 501 naming their ticket, never 404"
        - "Store opened lazily after a route matches; construction failure rethrown so it keeps its status"
        - "Inline boot guard in the chrome document: classic script before the deferred module, asks /api/sites on a deadline, names a missing asset and a missing tenant, re-checks #app is empty before every write"
      entry_point: "apps/control-app/src/router.ts route()"

    - name: "AI host in workerd"
      description: "core/runtime split; four adapters replace four disks."
      behaviors:
        - "toolbox-core.ts / host-core.ts name no filesystem; library and store are required params"
        - "toolbox.ts / host.ts stay the Node entry points with unchanged API (~30 call sites untouched)"
        - "Bundled /workers rung replaces sharedModuleUrl + pathToFileURL + dynamic import"
        - "R2TranscriptArchive replaces FileArchive; session file kept byte-for-byte (Node host and Python peer still load it)"
        - "memoryJunctions() replaces the file junction; ArchiveSyncer drains during the turn"
        - "bufferedAuditSink + per-turn flushAudit in a finally INSIDE the stream; one R2 object per record (no append)"
        - "Transcripts/audit at chat/ and audit/ — outside draft/, the only prefix the store composes"
        - "node:fs deliberately unused despite resolving under nodejs_compat; guarded by a static import-graph assertion over the shipped bundle"
        - "Secrets scrubbed at the response boundary, matching known values not a pattern"
        - "Chat host is one per isolate (SessionManager cache keyed by store identity); stated in router.ts as the local trade"
        - "ANTHROPIC_API_KEY as a wrangler secret; the hook reads `wrangler secret list` — push / leave-and-report / fail; any read failure counts as absent; --dry-run same route"
        - "Declaration-vs-implementation checks compose l1Operations + nodeOperations"
      entry_point: "apps/control-app/src/ai.ts + router.ts /api/ai/{session,prompt}"

    - name: "Behavior modules without a transform"
      description: "Components become plain (props) => string functions; Astro leaves the render path."
      behaviors:
        - "carousel/component.ts, contact-form/component.ts; modules/html.ts helpers"
        - "Invariant CSS moves to a real styles.css beside each component; extract-style.ts deleted"
        - "registry.ts portable -> framework/worker exports getModule; render.ts names it statically"
        - "renderSiteFilesNode, createContainer, needsAstro, unresolvableModule, the .astro ambients all deleted"
        - "12 negative conformance fixtures convert to .ts and still discriminate (20/20, previously 5 pass / 15 skipped)"
        - "options.ts imports EditActor from journal-model, not the store barrel, to keep node:fs out of the Worker's TYPE graph"
      entry_point: "packages/framework/src/modules/behavior.ts + registry.ts"

    - name: "Plain Vite bootstrap"
      description: "The 1c launcher boots createServer() from vite; Astro leaves the repository."
      behaviors:
        - "configFile: false — config pinned to the launcher, not to a root vite.config.*"
        - "vite becomes a direct dependency of tools/generate (was transitive through astro)"
        - "vitest.node.config.mts becomes plain defineConfig from vitest/config"
        - "astro/client types dropped from two tsconfigs; @astrojs/compiler-* build approvals removed"
        - "@astrojs/markdown-remark is a separate package and stays"
        - "Container spies replaced by a static 'no astro specifier on the render graph' scan (strictly stronger)"
        - "stdout->stderr diversion kept and re-justified as guarding a --json document from ANY boot chatter"
        - "bin/1c loads cli/assets.ts directly for the assets command (the barrel imports what assets generates)"
      entry_point: "tools/generate/bin/1c.mjs"

    - name: "Publish in the cloud"
      description: "Revision storage verbs on the port; one publish service above them; D1 is the only record."
      behaviors:
        - "Port gains revisions / writeRevision / readRevision / draftBase / setDraftBase (STORAGE verbs, not a publish() verb)"
        - "publish/publish.ts sequences validate -> diff -> no-op or mint -> snapshot -> render -> record -> re-parent"
        - "/api/publish route and 1c publish are two callers of one function; the transport's interception deleted"
        - "Migration 0002: site_revisions, published_sites, sites.base_revision"
        - "published_sites PRIMARY KEY (slug) is the cross-tenant guarantee — /site/<slug>/ carries no account"
        - "manifest.json deleted; live derived as MAX(id), never stored"
        - "Unchanged draft -> no-op returning the live revision (publish is a button)"
        - "/preview/<slug>/published 302s to public-site — one serving path"
        - "/api/sites reports the live revision instead of latest: null"
        - "1c deploy deleted (not ported); draft preview snapshots dropped with the manifest that indexed them"
        - "public-site swaps one class behind its existing seam; shared published-key builders so writer/reader/fixtures cannot drift"
        - "Asset copy is get-then-put (the R2 binding has no server-side copy) — named as the slow path"
      entry_point: "tools/generate/src/publish/publish.ts + router.ts /api/publish"

    - name: "Site locale identity"
      description: "A site declares where it is; both renderers say so."
      behaviors:
        - "siteConfigSchema gains optional country / locale / currency / timezone"
        - "COUNTRY_DEFAULTS: 66 countries; locale/currency/timezone derive from country, each individually overridable"
        - "resolveSiteLocale() is the one derivation both render paths call"
        - "Undeclared -> UNDECLARED_LOCALE 'en' (region-free); declared US -> en-US"
        - "dir decided by the script subtag when present, else the language subtag (az-Arab vs az-Latn)"
        - "Invalid country/locale/currency/timezone -> validation error at /config/<field>"
        - "Resolved locale reaches behavior modules as BehaviorProps.locale"
        - "The table itself is validated by the same rules a site's declaration is"
        - "isLocaleShapedSlug: exact locale segments reserved against the whole ISO 639-1 registry, case-insensitive, es-419 reserved, zh-Hans deliberately NOT"
        - "Refusal message names the reason and two working alternatives"
        - "No DB migration: sites.site_json is a verbatim TEXT blob"
      entry_point: "packages/site-schema/src/locale.ts"

    - name: "Money and time seam"
      description: "formatMoney / formatDateTime, and the render-determinism resolution."
      behaviors:
        - "formatMoney(amountMinor, currency, locale) — divisor from ICU's minor-unit count, never /100 (JPY 0, KWD 3)"
        - "Decimal built by string arithmetic, not division (9007199254740991/100 loses a cent)"
        - "Non-integer amount throws; non-ISO-4217 currency throws (the two string args are transposable)"
        - "formatDateTime(instant, timeZone, locale) — zone-less wall-clock refused; explicit offset admitted; unknown IANA id refused"
        - "timeZoneName passed through for cross-zone booking display"
        - "Determinism rule restated: output byte-deterministic; time-varying content is client-rendered or request-time, never from the render clock"
        - "No clock-reading overload exists — the rule as an API"
        - "Structural check: no source on the framework render path reads the ambient clock"
      entry_point: "packages/framework/src/intl.ts"
```

## Coverage Map

```yaml
coverage_map:
  - feature: "Access gate on the control origin"
    status: uncovered
    existing_stories: []
    gaps:
      - "No story under any capability describes authenticating or authorizing the builder origin"
      - "story-e674c60a's origin ACs asserted the OPPOSITE (any caller reaches the origin) and had to be qualified"
    notes:
      - "Judgment call: kept as a feature rather than folded into story-e674c60a. The gate is a
         capability of its own (who may reach the operator surface); the qualification of the
         workspace ACs is carried as item 3's modify list."

  - feature: "D1/R2 site store"
    status: uncovered
    existing_stories: ["story-3f4a5f2b"]
    existing_acs: []
    gaps:
      - "Tenancy scoping, version CAS, multi-write atomicity, R2 byte path, three-adapter contract"
      - "The worker-safe framework entry that makes the edit surface loadable in workerd at all"
      - "The bindings on both sides of the inheritance line and the migration hook"
    notes:
      - "story-3f4a5f2b names 'the Cloudflare store itself' as out of scope and says the separation
         is what makes its own claim checkable. Folding this in would contradict its declared
         boundary — feature inside the existing capability bucket, not an upgrade."

  - feature: "Builder origin in workerd"
    status: partial
    existing_stories: ["story-e674c60a"]
    gaps:
      - "The story's own Technical Context declares 'the render still runs at the origin, not in the
         edge Worker ... what remains is the runtime relocation alone'. That deviation is discharged."
      - "Build artifacts, run_worker_first, the transport, bin/publish, lazy store, boot guard, 501 shape"
    notes:
      - "Case 2 (explicit supersession) — the story anticipated this exact change and wrote its ACs
         to survive it."

  - feature: "AI host in workerd"
    status: partial
    existing_stories: ["story-a58a0974", "story-93905de4"]
    gaps:
      - "Continuity is 'stored with the workspace'; it is now store-backed"
      - "Nothing covers durable audit across an isolate restart, secret handling, or redaction"
      - "The declared-surface check compares against one operation list; it is now a composition of two"
    notes:
      - "Two target stories, deliberately: the conversation contract is a58a0974's, the audit and the
         declared surface are 93905de4's. Putting the audit-durability AC on the conversation story
         would misplace it."

  - feature: "Behavior modules without a transform"
    status: partial
    existing_stories: ["story-179b8c06"]
    gaps:
      - "The artifact a module ships (template -> plain function), module CSS as a real stylesheet"
      - "That a module-mounting site renders in the Workers runtime at all"
    notes:
      - "The contract, both composition directions, the zero-CSS obligation and the conformance
         dimensions are all unchanged — only the artifact and where it can run."

  - feature: "Plain Vite bootstrap"
    status: partial
    existing_stories: ["story-e15a19ef"]
    existing_acs: ["AC-739"]
    gaps:
      - "AC-739 ('Astro-free unless a page needs Astro') is superseded by the unconditional property"
      - "Nothing covers the launcher's own server, the dependency removal, or the assets bootstrap cycle"
    notes:
      - "The operator explicitly authorised the reconciliation-UAT rewrite; the replacement
         measurement (static scan) is strictly stronger than the spy it replaces."

  - feature: "Publish in the cloud"
    status: partial
    existing_stories: ["story-5349d01f", "story-d34eccd8"]
    gaps:
      - "story-5349d01f documents a command that no longer exists; several of its UATs were deleted"
      - "story-d34eccd8's authority (the deploy index) and preview addressing form no longer exist"
      - "Nothing covers revision minting in the cloud, the slug claim, or the no-op on an unchanged draft"
    notes:
      - "Split into two items along the story boundary the capability already draws (operator half /
         visitor half) rather than one item with two targets — each is separately story-sized and the
         two halves have different removals."

  - feature: "Live-origin smoke + build refusals"
    status: partial
    existing_stories: ["story-d5167ced"]
    gaps:
      - "Two new live-origin checks; the Worker type-program guard; assets generated before typecheck"
    notes:
      - "d5167ced's out-of-scope note assigns the migration and secret HOOKS to their own tickets
         (items 2 and 4). This item is the check set and the build, which the story does own."

  - feature: "Site locale identity"
    status: uncovered
    existing_stories: []
    gaps:
      - "Site configuration has no notion of where a business is; lang was a literal in two renderers"
      - "Page slug was an unconstrained string"

  - feature: "Money and time seam"
    status: uncovered
    existing_stories: []
    gaps:
      - "No story covers value formatting, currency representation or time-zone handling"
      - "The buildInfo determinism rule and a time-varying module were in unresolved conflict"
```

## Plan Items

| # | Component | Type | Points | Deps | Target story |
|---|-----------|------|--------|------|--------------|
| 1 | Builder Access Gate | feature | 3 | - | (new) |
| 2 | Cloudflare Site Store (D1/R2) | feature | 3 | - | (new, in capability-c4c7a854) |
| 3 | Builder Workspace Origin | upgrade | 3 | 1,2 | story-e674c60a |
| 4 | AI Site Assistant Runtime | upgrade | 3 | 2,3 | story-a58a0974, story-93905de4 |
| 5 | Behavior Module Rendering | upgrade | 2 | - | story-179b8c06 |
| 6 | 1c CLI Bootstrap | upgrade | 2 | 5 | story-e15a19ef |
| 7 | Publish (operator half) | upgrade | 3 | 2,3 | story-5349d01f |
| 8 | Public Serving (visitor half) | upgrade | 2 | 7 | story-d34eccd8 |
| 9 | Platform Build & Smoke | upgrade | 1 | 1 | story-d5167ced |
| 10 | Site Locale Identity | feature | 2 | - | (new) |
| 11 | Money & Time Formatting Seam | feature | 2 | 10 | (new) |

**Totals**: 11 items — 4 feature, 7 upgrade — 26 story points.

## FC Test Coverage

The dispatcher passed an empty `fc_tests` list, but 19 `test_UAT_FC_*` files for
this bundle's ten tickets are present on disk and `check_fc_orphans` will be run
against them. They are treated as binding evidence and every one is claimed:

| FC test file | Item |
|---|---|
| `test_UAT_FC_REQ-147_access_gate.test.ts` | 1 (its two smoke cases -> 9) |
| `test_UAT_FC_REQ-143_d1r2_store.workers.test.ts` | 2 |
| `test_UAT_FC_REQ-143_render_store_independence.test.ts` | 2 |
| `test_UAT_FC_REQ-143_store_bindings.test.ts` | 2 |
| `test_UAT_FC_REQ-145_build_artifacts.test.ts` | 3 |
| `test_UAT_FC_REQ-145_builder_in_workerd.workers.test.ts` | 3 |
| `test_UAT_FC_REQ-149_builder_boot_guard.test.ts` | 3 |
| `test_UAT_FC_REQ-146_ai_host_in_workerd.workers.test.ts` | 4 |
| `test_UAT_FC_REQ-146_worker_ai_boundary.test.ts` | 4 |
| `test_UAT_FC_REQ-149_deploy_secret_hook.test.ts` | 4 |
| `test_UAT_FC_REQ-148_behavior_in_workerd.workers.test.ts` | 5 |
| `test_UAT_FC_REQ-148_astro_free_render.test.ts` | 5 (the render-graph scan -> 6) |
| `test_UAT_FC_REQ-150_plain_vite_bootstrap.test.ts` | 6 |
| `test_UAT_FC_REQ-149_publish_in_the_cloud.workers.test.ts` | 7, 8 |
| `test_UAT_FC_REQ-149_worker_type_program.test.ts` | 9 |
| `test_UAT_FC_REQ-151_site_locale.test.ts` | 10 |
| `test_UAT_FC_REQ-153_locale_slug_reservation.test.ts` | 10 |
| `test_UAT_FC_REQ-152_intl_seam.test.ts` | 11 |

Two files split across items (REQ-147's and REQ-148's). That is expected: an FC
file is a ticket's evidence, not a story's, and the story cycle renames per test.

## Step 3b — Intent scope vs implementation footprint

**Case 1 (code matches intent)** — the bulk of all ten tickets. Each carries an
implementation record in the bundle body that matches what the diffs do, including
the deviations the operator stated at the time (REQ-146's required-rather-than-
defaulted store and one-host-per-isolate; REQ-151's undeclared-default reasoning;
REQ-152's two-functions-not-four).

**Case 2 (intent explicitly supersedes existing matrix truth)** — four places,
all deliberate and all carried as upgrade items with explicit `remove` lists:

- REQ-147 supersedes the three ACs that pinned "any caller reaches the origin"
  (`AC964`, `AC965`, and REQ-115's same-origin front). The property each is about
  survives for an *admitted* caller; each additionally asserts the 401. -> item 3.
- REQ-145 discharges story-e674c60a's own declared deviation. -> item 3.
- REQ-148 supersedes AC-739 with the stronger unconditional form, and removes
  REQ-145's boundary UAT that asserted the 500 it eliminates. -> items 5 and 6.
- REQ-149 deletes `1c deploy` and `manifest.json` outright, taking five test files
  with them (`reconciliation-deploy-snapshot`, `reconciliation-serve-deployed-
  snapshot`, `reconciliation-servable-root-confinement`, `req110-r2-deploy`,
  `bug31-sandbox-r2-namespace`). Those are story-5349d01f's and story-d34eccd8's
  UATs; leaving the stories as written would have the matrix asserting a deleted
  command. -> items 7 and 8.

**Case 3 (code touches areas the intent does not declare)** — three, none of
which is absorbed into this bundle's stories:

- `b8b01ebf` repairs component-scope guard violations in `kb.ts` and `fs-store.ts`
  that *predate* this bundle (from the knowledge-base work and REQ-143), and
  composes the guard test's regex from the scope constant so it cannot go stale.
  These are repairs to an existing story-e674c60a AC ("the scope is one name,
  written once"), not new behaviour. **No plan item**; recorded here.
- `7a1822f52` edits `storage/sites/xgd/draft/pages/home.json`. Site content data,
  not a capability.
- Six `chore: version bump` commits carry no behaviour.

No unintentional regression was found: every behavioural change in the 24 commits
traces to a stated intent in its ticket body or its implementation record.

## Observations

- **The bundle is one migration, so the dependency chain is real, not decorative.**
  Item 2 (the store) unblocks items 3, 4 and 7; item 1 (the gate) is asserted by
  items 3 and 9; item 5 (plain-function modules) is what makes item 6 (the
  dependency removal) possible at all. The chain is recorded in `dependencies` so
  the story cycle does not schedule the consumer before the producer.

- **Three tickets collapsed into two stories, one ticket split into two.**
  REQ-151 + REQ-153 are one story (one module of platform locale knowledge; the
  slug reservation's entire justification is the URL shape the locale identity
  makes possible). REQ-149 is split across items 7 and 8 because the capability
  already draws the operator/visitor line and the two halves have different
  removals. REQ-149's three follow-ups are distributed by surface — the boot guard
  to the builder (3), the secret guard to the assistant (4), the type-program
  guard to the build (9) — rather than lumped under publish, because the ticket
  they were filed against is not the capability they repair.

- **Two features inside existing capability buckets.** Items 2 and 10 are `feature`
  rather than `upgrade` for opposite reasons: item 2 because the story that owns
  the bucket explicitly excluded it and names that exclusion as load-bearing for
  its own claim, item 10 because there is no bucket at all. Both were checked
  against the full 36-story list before classifying (`xgd ticket search` is
  currently failing in this worktree — the embeddings cache is not writable from
  the reconcile worktree — so the enumeration was read in full rather than
  searched; at 36 stories that is exhaustive rather than a sample).

- **Judgment call worth flagging to review: item 9 is small (1 point).** It could
  have been folded into items 1 and 3. It is kept separate because story-d5167ced
  genuinely owns both the live-origin check set and "refuses before emitting a
  broken artifact", and moving those ACs elsewhere would put deploy behaviour in
  a capability that does not own it.

- **Uncertainty: REQ-147 AC2** ("an identity not on the policy is refused after
  authenticating") is enforced by Cloudflare before the Worker sees the request,
  so it is recorded in `ACCESS.md` and is not assertable by a UAT in this
  repository. Item 1's AC set should say so explicitly rather than let the story
  cycle write a UAT that cannot exist.

- **Uncertainty: nothing here is deployed.** The bundle's own record states the
  account has no control-app Worker, the hostname does not resolve, D1 has no
  remote tables and Access is unconfigured (`ACCESS_TEAM_DOMAIN`/`ACCESS_AUD`
  ship empty, which correctly leaves the Worker closed). The live-origin ACs in
  items 1 and 9 are therefore provable against a local deploy and the smoke
  command's own contract, not against production.