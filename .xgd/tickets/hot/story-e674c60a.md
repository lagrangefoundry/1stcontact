---
uid: story-e674c60a
id: STORY-99
type: story
title: 'The builder workspace: one browser surface showing my real rendered site,
  with the controls that act on it, served from a single origin'
created_by: xgd
created_at: '2026-08-07T01:42:20.886527+00:00'
updated_at: '2026-11-01T21:29:08.460204+00:00'
completed_at: null
last_field_updated: status
status: updated
fields:
  intent_uid: bundle-15c1f647
  capability_uid: capability-a994b8f3
  story_kind: upgrade
  story_points: 3
  updated_by: bundle-39edf66d
  sprint_uid: sprint-a864c33e
  uat_coverage: pass
---

## Story

**As a** person who owns a site on this platform, **I want** to open one page in
my browser and see my actual site rendered there, filling the window, with the
controls that act on it — which business, which way of looking at it, open it
properly, publish it — arranged around it, **so that** working on my site is
something I look at and point at, rather than a sequence of commands I have to
know the names of.

## Description

Everything the platform builds is, until now, reachable only by typing: a site
is rendered, listed, previewed and published from a command line. This story is
the surface where an operator *sees* the site instead.

**In scope**

- **A single workspace, at one address — and that address is the deployed
  edge runtime itself.** The workspace document, the UI components it is built
  from, its own browser code, and every rendering of every site in the store are
  all reachable from one origin. That is not a convenience: it is why the frame
  showing the site is not a foreign document, and why "open this properly in a
  new tab" lands on the identical URL the frame is already displaying rather
  than a lookalike. The origin routes, reads the shared store, and produces the
  draft and edit channels itself at request time. There is no separate origin
  process behind it and nothing in front of it reinterpreting what it says: with
  no local process running anywhere, the deployed workspace serves its document,
  lists the sites the store actually holds, and renders. That holds from the very
  first request. A deployment whose store has been migrated and never written to
  — schema present, no account registered — serves: the first read that needs the
  store registers the one account the deployment's own configuration names, and
  the listing answers successfully and empty. It is not dead until somebody
  copies a site up from a laptop.
- **Only an admitted caller reaches any of it.** The workspace is not public. A
  caller the builder's access gate has not verified is refused before a path is
  examined, before a store handle exists, and before a build artifact is
  delivered — so everything else described here is what an *admitted* caller
  observes. How an identity is verified, and the shape of the two refusals, is
  the gate's own capability and not this story's; what this story owns is that
  no route, no rendering and no asset is reachable ahead of it.
- **Chrome built from shared components, consumed not copied — and assembled
  once, before any request.** The workspace is assembled from the shared UI
  components the wider system already ships. They are consumed from an installed
  copy that lives outside this repository, published under a single package
  scope, and the workspace references each one through the entry point that
  component itself declares — so an upstream file move is reported here rather
  than becoming a broken reference in the browser. No component source is copied
  in, and none is patched or wrapped: a gap in a component is closed where the
  component lives. Because the install is deliberate and out-of-band, a machine
  that has not run it gets a message naming the missing component and the
  command that installs it, not a blank page.

  What changed is *when*. The components, the workspace's own browser code and
  the framework bridges are **build artifacts** now: a build command copies each
  component verbatim, transpiles the bridges once, and derives the map of
  declared entry points ahead of time. No route type-strips, transpiles or
  resolves a package while answering a request. The artifacts are reached by
  falling through the route table **last**, so they are delivered behind the
  gate rather than ahead of it — an asset answered before the origin is an asset
  answered to anyone — and an asset can never shadow a route.
- **The scope those components are published under is one name, written once.**
  The scope is part of every reference the workspace makes to a component, so it
  is subject to the same one-definition rule as every other name here: it is
  declared in a single place, everything that generates a reference composes it
  from that declaration, and it appears as a literal nowhere else in the
  repository — not in a generated artifact checked in beside the generator, not
  in a comment. One surface cannot compose it: the workspace's own browser
  source is served to the browser verbatim and can read no build-time value, so
  it names components directly. That is a declared, bounded exception, and it is
  held in step by the requirement that every component the browser source names
  is one the generated workspace document also declares — otherwise the mismatch
  would appear only in a browser and nowhere a test can see it. When the wider
  system renames the scope, this repository moves with it in one step and the
  previous name is removed outright: there is no second scope to fall back to and
  nothing detects which one is present.
- **Tabs are declared, and the chrome renders exactly what is declared.** The
  workspace mounts one panel per declared tab and no panel nothing declared, each
  addressed by a stable identifier that survives its visible name changing, and
  it opens on the **first** declared tab — which is the one hosting the display
  panel. Declaring a tab is adding an entry to one list; every option that entry
  carries, identity and label and the viewport-filling behaviour alike, reaches
  the chrome intact, and no declared option is silently discarded. *What* a
  second tab contains is its own capability's business; this story owns only that
  the declaration is what the chrome obeys.

  The displayed site tracks the browser window's height and follows a live
  resize, and the workspace page itself never scrolls — a frame that collapses to
  a few lines tall is the failure this exists to prevent, and a page-level
  scrollbar is the visible sign that the height chain has leaked again. Every
  name the workspace shows has exactly one definition site, so renaming it is a
  one-line change and no second copy can drift.
- **A display panel with modes, not a preview.** The pane is not "the preview";
  it is a pane that can show any of several registered ways of looking at the
  current site, of which the normal view is one and the editable render is
  another. Registering a mode is adding an entry — there is no branch anywhere
  that a new mode must be threaded through — and switching modes changes what is
  displayed without rebuilding the pane around it.
- **A toolbar the active mode declares, re-derived from what is displayed.** The
  strip renders exactly the controls the active mode names, so a mode showing
  something other than a document simply does not offer "open in a new tab" and
  the strip never assumes a document beneath it. The strip is derived state, not
  something anyone keeps in step by hand: *every* change to what the pane is
  showing — the mode or the site — re-derives the whole strip, and each control
  is built against the mode and site current at that moment. So a control whose
  content depends on the site — the open-in-a-new-tab target — follows the site
  on screen whatever changed it: a business switch, the workspace restoring what
  it remembered, or a change made programmatically. The strip itself stays
  where it is through this; only its contents are replaced, so it never drops out
  of the layout. A control the strip replaces is released with it and stops
  reacting, so a workspace held open does not accumulate updaters writing to
  controls that have left the document. The controls act on real things: publish
  goes through the platform's existing publish behaviour and adds no semantics of
  its own. No mode's strip offers a site selector — which site is shown is the
  shell's decision, below.
- **The business is chosen once, in the shell's chrome, and every tab follows
  it.** The business is what everything belongs to, so its control lives in the
  header every tab sits inside, not in any one tab's toolbar: a business switcher
  at the header's leading edge and the account behind an avatar at its trailing
  edge. The account is not a tab — it is the one surface that is not
  business-scoped, and a tab for it would be the only place the switcher is
  present and does not apply — so the tab strip is uniformly business-scoped. The
  switcher lists the account's businesses by name from one call that answers both
  the account and its businesses; a business whose grant has lapsed is listed,
  suffixed, and cannot be chosen. With one business it shows the name and no
  control; with none, nothing.

  Choosing a business is one act that moves everything at once: every request the
  builder makes afterwards carries that business in its address, the selection is
  remembered, the pane shows that business's site and its frame reloads, the
  assistant opens a session for that site, and the Library is cleared and re-read
  as that business's material. Nothing outside the display panel asks the pane
  what is in scope. In v1 a business has exactly one site, so the switcher yields
  both; a per-site selector, when several sites per business arrive, belongs
  inside the site tab, subordinate to this one. A remembered business the account
  can no longer operate falls back silently to the first one it can.

  An account whose every business has lapsed is still a signed-in session with
  nothing it may open. The switcher renders, disabled, listing every business
  marked and naming the first; the tab strip and panels are made inert while the
  header — switcher, avatar, the shell's own controls — stays live; a banner in
  the content area names the state and points at the account; and no site list is
  asked for. The account surface behind the avatar states who is signed in, which
  businesses that identity reaches, and — beside each lapsed one — why, in words.
  It is bounded to those facts about the session: plan, billing and invoices are
  the customer portal's, not the builder's.
- **The word on screen is Business.** No string a person can read in the builder
  or the public site says "tenant"; SQL and deployment vocabulary naming
  `TENANT_ID` or `wrangler.toml` are exempt by rule, and the schema keeps
  `tenant_id`.
- **The draft-side channels are produced on request, not fetched off a shelf.**
  The two ways of looking at a site that track today's draft — the ordinary
  rendering and the editable one — are produced from the site's definition when
  they are asked for, by the origin, out of the shared store. There is no
  rendered artifact for the workspace to serve, nothing anyone has to remember to
  refresh, and no step between changing a site and seeing it changed: a
  definition edited anywhere at all shows on the next request. The bytes are the
  same bytes the platform's own render writes when it is asked to write them —
  one production of a page, with a writer and a reader over it, so the two cannot
  drift. A draft that no longer describes a valid site says so where the operator
  is looking, instead of the last good rendering quietly going on being shown.
  The **published** way of looking at a site is deliberately not like this: it
  stays the immutable rendering that publishing produced, because deriving it
  from today's draft would put unpublished work on the published address.
- **Two front doors, one implementation.** The operator's builder command is a
  **transport**, never a second origin. It starts the real runtime — the same
  route table, the same edit functions, the same render, against the same store
  port — pointed at a locally simulated store by default, with reaching the
  deployed store an explicit flag, because a development loop that writes to
  production by default is one keystroke from losing a site. A second front door
  survives for the suite that drives the workspace over ordinary HTTP: it takes a
  local request, hands it to that same route table, and returns the response
  unchanged. Nothing behind either front door decides what a route does, and no
  route is answered by one of them and not the other.
- **A local site can be copied up.** A site's draft — its definition, its pages
  and its asset bytes — can be copied from a local store into the shared one, and
  it crosses through the same store the origin serves from rather than through a
  second writer: an import lands by exactly the path an edit lands by, opening
  the store through the one opener every route shares rather than through a
  private one of its own. It is idempotent while the local copy is the only place
  the site is edited, so re-running it after a *local* edit is the ordinary way
  to use it, and it lands whole or not at all. It carries no privilege the other
  routes lack: bringing the deployment's account into existence is something
  opening the store does, not something only a copy can do.
- **A copy never silently replaces work done in the builder (BUG-51).** Before
  writing, the import reads the target's builder-recorded change count. Zero — a
  site that does not exist, or one only ever filled by imports — and it proceeds
  as before. Non-zero, and it is refused 409 with nothing written, naming the slug
  and how many changes are at risk. An explicit `force` in the payload overrides
  it: `1c push --force`, and `bin/publish --force`, which applies to every slug in
  the run. An ordinary push omits `force` rather than sending `false`. The count,
  not the write version, is the test, because every import raises the version and
  only a builder, assistant or structured-edit change moves the count — so the
  ordinary publish loop is never refused. Consequence accepted: re-publishing a
  site with even one builder edit needs `--force`.
- **One deliberate way back to an empty local store (BUG-51).** `1c reset`
  previews by default — the state directories it would remove with their file
  count and size, the `storage/` directories it will never touch — deletes
  nothing and exits 0. With `--yes` it removes `apps/control-app/.wrangler/state`
  (and `apps/public-site/.wrangler/state` with `--include-public`), never
  `storage/`, and points at `bin/publish` to re-seed. It refuses while something
  listens on the dev port (`--port`, default 8788), because deleting under a live
  local runtime corrupts the store rather than emptying it; it reports an absent
  store as already empty rather than failing; and it resolves every path from the
  repository root, not the working directory.
- **A split, and it remembers.** The display panel sits beside a secondary pane
  (the assistant panel) with a draggable divider that collapses to a rail and
  reopens to its previous width. The divider
  position, the collapsed side, and which business, site and mode were being shown all
  survive closing and reopening the workspace, and every stored value is
  namespaced to this workspace.
- **Freshness over caching.** The origin rewrites the bytes it serves underneath
  the browser — a rendered channel is re-produced while the frame is displaying
  it — so every response it returns, the workspace document included, is served
  as non-cacheable. One exempt response is enough to leave an operator looking at
  a stale page that appears to be working. The directive is the **route table's**
  own, stamped on the way out of the one place every front door shares, so a host
  cannot serve the workspace document without it and a route added tomorrow
  inherits it rather than having to remember it.
- **Confinement.** Everything a channel address can still reach — a site's own
  assets, the built artifacts, the workspace's own browser source — is confined,
  and a request that tries to escape is never satisfied: none of the targeted
  file's contents come back, and every tree behaves identically, so the
  confinement cannot be present on one and missing on another. It works by
  clamping an escaping path back inside, so such a request is answered as *not
  found* rather than singled out as forbidden.
- **A workspace that cannot start says so, in the page.** The document arrives
  successfully even when everything it then loads fails, so "loaded and did
  nothing" was previously indistinguishable from three unrelated faults — a
  missing build artifact, a store with no account configured, a client that threw
  while mounting — with the reason reachable only in a developer console. A guard
  carried inline in the document itself, registered before the client it watches,
  replaces the blank page with what actually went wrong and a named fix for the
  two causes an operator can act on. It never overwrites a workspace that
  succeeded slowly.
- **An ended session reads as an ended session, never as an empty account
  (BUG-52).** Every request the builder makes goes through one transport, so a
  401, or a fetch that rejects with no status (what a lapsed identity-provider
  cookie looks like to a background request), is noticed whichever call meets it
  first. The three opening calls refuse rather than returning an empty account, a
  healthy assistant or an empty list. At load, the reason is drawn where the
  builder would have been, and nothing is mounted. Mid-session, a strip appears
  once above a shell that stays live: it is not made inert or dimmed, and unsaved
  work stays editable. A refused site listing leaves the pane, the Library and
  the Contacts tab as they were. A 401 says *"Your session has ended"*; a
  rejected fetch hedges, because it may also be an origin that is down. Recovery
  is a *Sign in again* button that reloads the page. Nothing navigates on its
  own. Every other failure, a 500 included, is handled exactly as before.
- **One type size for the chrome's controls (BUG-53).** The top bar's Theme and
  About, the Contacts filter row and Invite, Provision a business, and the
  buttons in the dialogs those open all take their size from one control
  font-size token. That token is declared immediately after each control's own
  font reset, so it wins regardless of stylesheet order. The filter row's
  controls share one padding. Dialog buttons use the canonical dialog-button
  class, with the primary modifier on the affirmative action.

**Out of scope**

- Editing of any kind: clicking a segment, the field modal, and the write path
  behind it are separate stories. The editable *mode* is registered here and
  shows the editable rendering; the gesture that changes anything is not.
- **The gate itself.** That an unadmitted caller is refused is asserted here,
  because it qualifies every criterion below it; how an identity is verified,
  which identities are granted, and the shape of the gate's own refusals belong
  to the access capability.
- What the assistant pane *does*. This story owns the split's geometry and what
  it remembers; the conversation the secondary pane hosts, and everything behind
  it, belongs to its own capability.
- **What any tab beyond the first contains.** That a declared tab is rendered a
  panel, and that it is not the one that opens unless it is declared first, is
  asserted here. What is inside it — and any control it carries, including a
  dropdown that narrows a list — is owned by whichever capability declared it.
- Deciding what a rendering contains. The workspace produces the draft-side
  channels on request, but it decides no byte of them: the page a channel
  contains is the platform's own render, and this story adds nothing to it. The
  published rendering it does not produce at all.
- **What publishing does, and how published bytes are served.** The workspace
  offers the control and reports the result; minting a revision and serving it to
  a visitor are the two halves of the delivery capability and are owned there.
- The shared store's own guarantees — tenancy scoping, atomicity, concurrency,
  the byte path. This story is a consumer of that port, not its author.
- **Which businesses an account may operate, and why one has lapsed.** Admission,
  membership, grants and the derivation of a lapse reason belong to the access
  and entitlement capabilities; this story owns that the endpoint reports them
  and the chrome shows them. The customer portal the avatar will link out to
  (plan, invoices, details) is its own capability, as is the operator-only route
  that adds a business.
- Any change to a shared UI component. Consuming the components under a renamed
  scope is not such a change: the components themselves stay untouched, and the
  name they are published under is owned upstream, not decided here.

## Technical Context

- **The relocation landed: the origin *is* the edge runtime.** This story
  previously carried a declared deviation — the draft-side channels were produced
  at request time, but by a local process, with the edge Worker a single verbatim
  front over it, because the canonical store was not reachable from the edge and
  the render resolved behaviour modules through a build transform. Both blockers
  are gone: the store is reachable, and behaviour components are plain functions.
  So the render's runtime moved and the front was deleted. The criteria here were
  deliberately written about *one origin and what an operator observes* rather
  than about a proxy, which is why they survived the move; what changed is this
  note, the arrangement it described, and the qualification of the origin
  criteria by the gate.
- **The proxy is deleted, not disabled.** The forwarding handler and the variable
  naming the origin it forwarded to are removed outright rather than left behind
  a flag, and so is the route table the local process kept: keeping a local
  route table would be the second implementation that makes an operator's loop
  exercise something the deployed workspace is not. The surviving local front
  door owns exactly one thing the origin does not have and nothing else.
- **One production of a page, called two ways.** The workspace no longer serves
  the draft-side channels off something CAP-82 (Site Delivery) and CAP-84 (Edit
  Render Channel) had already written; it asks for them when a request arrives.
  What it asks is the *same* production those capabilities own — the build-time
  command that writes a channel and this origin are a writer and a reader over
  one implementation, so a new typed axis or a new head tag reaches both at once.
  Two productions would reintroduce exactly the drift server-side-only rendering
  exists to prevent. The workspace still decides no byte, adds no publish
  semantics, and produces the published channel not at all.
- **The staleness rule went with the artifact, and the reuse key moved.** Serving
  a stored rendering meant a save had to re-materialise both channels before it
  could reply, or whichever it skipped would go on showing the page as it used to
  be; and a change made anywhere but the workspace's own save path was invisible
  until someone re-rendered. Both are closed by producing the page from the
  definition that exists when the request arrives. Producing a whole channel per
  file a page pulls would be wasteful, so a production is reused until the
  definition moves — reuse keyed on the definition itself, never on elapsed time.
  The reuse is now held against the **store handle** rather than against the
  account identifier, and that key was chosen for *isolation*, not for cost: the
  local front door opens a store per workspace and every local workspace shares
  one notional account, so an identifier-keyed cache handed the first
  workspace's renderer to every workspace opened after it.

  **Where that reuse actually happens follows from who holds the handle, and it
  is not both front doors.** The local front door holds one store for a
  workspace's life, so a workspace does reuse its renderings across requests.
  The deployed origin builds a fresh handle on every request — deliberately,
  because a handle held across requests carries an account check made before the
  request, and refusing a deactivated account is worth more than the saving — so
  the handle-keyed reuse is never hit there and no rendering is reused at the
  deployed origin at all (BUG-37, measured). The cost reuse was meant to avoid is
  avoided there a layer lower instead: the store adapter memoises the *assembled*
  definition against the site's write version, which is ~95% of a request's work,
  and that is a criterion of the store port (AC-1447, AC-1448) rather than of
  this workspace.
- **Build artifacts, and the ordering that keeps them private.** Three things the
  workspace serves were previously read from places the edge runtime cannot reach
  — the browser source off a checkout, the components out of an out-of-repo
  package store, and the framework bridges type-stripped *per request*, which was
  a build step wearing a route. All three are produced once by a build command
  into a directory the runtime serves as static assets. They are reached by
  falling through the route table rather than by letting the asset layer answer
  first, and that ordering is a security control rather than a routing
  preference: the gate runs inside the request handler, so bytes served before it
  are bytes served to anyone.
- **The store is opened only after a route matches.** It used to be constructed
  unconditionally, before any route matched, so every request built an
  account-scoped handle — including the ones that fall through to the build
  artifacts. Refusing an unknown account is correct, so on a store with no
  account row every artifact request was refused, while the document itself was
  answered before the store and arrived successfully: a page that loaded
  perfectly and did nothing. Deferring the construction removes the dependency;
  the fall-through deliberately stays last, because moving it earlier would let
  an asset shadow a route. A store that cannot be constructed is a configuration
  failure and keeps its own status — the router rethrows it rather than letting
  its own catch-all downgrade "this deployment is misconfigured" to "the server
  broke on your request".

  **What counts as unopenable narrowed, and that was the second half of the same
  bug.** Deferring the store stopped an artifact request depending on an account;
  it did not stop a *read* depending on one that nothing had ever created. The
  schema is applied by the deploy and seeds no rows, so every fresh deployment
  named an account the store did not hold, and the refusal — correct at the
  library boundary — took the whole workspace down, because the chrome awaits the
  site listing at the top level. There were two openers, and only the one the
  copy-up route used registered the account, so a deployment could not be read
  until someone had written to it from a laptop. There is one opener now and the
  registration is the read path's too. This is not a widening of what the origin
  may create: the name comes from the deployment's own configuration, so it can
  reach exactly the account that configuration already names and no other. The
  cold path only — an ordinary request finds the row on the first lookup and
  writes nothing. And it resolves *not yet*, never *no*: a deactivated account is
  a decision somebody made, and is refused explicitly rather than being left to
  fail again by accident of how the registration insert happens to behave.
- **The boot guard is inline, and that is the point.** Serving it as a file would
  make the diagnostic depend on the asset layer, which is the thing most likely
  to be broken when it is needed. It is carried in the document as a classic
  script registered before the deferred client module, so its listeners exist
  before the module can fail; it asks the site listing for its status only once
  the page is already known to be broken, so a healthy load costs nothing; and it
  re-checks that the mount point is still empty immediately before every write,
  so a slow-but-successful mount is never replaced by an error panel it raced.
- **The local front door's admission rule.** Access sits in front of the deployed
  origin only — the intent says so explicitly — so the loopback development
  server is admitted by a variable that applies *only* when the gate is
  unconfigured and that is declared where a named environment cannot inherit it.
  Two independent mistakes would be needed to open a deployment. The rule itself
  belongs to the gate's capability; it is recorded here because it is why the
  local front door can serve at all.
- **The editable mode is registered, not implemented, here.** Registering it is
  what proves the mode contract with two real modes; the editable render belongs
  to CAP-84 and the editing gesture to its own story.
- **The scope moves in lockstep with upstream, and only forward.** The scope the
  shared components are published under belongs to the wider system, not to this
  repository. When it changes there, it changes here in a single step: the store
  is repopulated under the new name first, then every reference here moves at
  once, and the old name is deleted rather than deprecated. No fallback
  resolution and no dual-scope detection — a half-completed rename is meant to be
  loud, and the evidence below is what makes it so.
- **The component dependency is implicit — an accepted gap, but no longer a
  silent one.** Nothing in this repository's manifest records the shared UI
  components; they arrive from a deliberate out-of-band install into a shared
  artifact store, so a fresh clone has none of them. Two kinds of evidence sit on
  top of that, and they behave differently on purpose. Evidence about
  *consumption* — that each component resolves, that the copy resolved declares
  itself under the scope this repository uses, and that the generated document
  and the served browser source agree with that scope — is unconditional: on a
  machine without the install it fails and says which component it could not
  account for. Evidence about *mounting* real components in a browser-like
  environment still skips with a stated, reported reason, and stays unverifiable
  on such a machine until a private registry exists; its subject is mount
  behaviour, not which copy was consumed. The split matters because a presence
  check used as a skip gate reports "renamed upstream and not renamed here" and
  "never installed" identically — the two must be distinguishable, or a rename
  that has broken the browser reads as a clean green run. Components are never
  mocked, faked or vendored in either kind of evidence: a stand-in would prove
  nothing about the consumption route, which is most of this story's risk. It
  follows that the artifact store must be resolvable from wherever the evidence
  runs — including a detached working tree of this repository, which does not
  inherit the main checkout's neighbours. The resolution now happens at build
  time rather than per request, which moves *when* an upstream move is reported
  but not *whether*: it is still a loud failure at the origin rather than a 404
  in the operator's browser.
- **Resolving the store from a detached working tree is a route correction, and
  it is made at the one resolution point.** The precondition above was not
  self-satisfying: a linked working tree is the same repository parked outside
  the directory the store sits beside, so the ordinary upward walk reached
  nothing and every component looked absent — which is indistinguishable from
  "the out-of-band install was never run", and that is a skip by design. Nine of
  this story's criteria therefore lost their evidence in every working tree
  *while reporting green*. So resolution is anchored at the main checkout, and
  the test runner is pointed at the identical packages by aliases **derived from
  that same single resolution point** rather than from a second guess at where
  the store lives. This is not the substitution the paragraph above forbids and
  cannot decay into one: every alias target comes from the resolver production
  uses, every alias key is composed from the one scope declaration — so a
  one-sided rename still fails loudly in both directions — and with no install
  there is nothing to alias and the mount evidence skips exactly as before. The
  alternative, an undocumented install into a directory outside every checkout,
  was rejected because its failure mode is the silent green rather than a loud
  one. Beyond that correction, a failure to resolve remains an environment
  precondition to be read as such, not a code defect.

  What "anchored at the main checkout" means is now stated as a criterion of its
  own rather than left as an implementation note. Resolution walks up from where
  it is asked until it meets the repository's own data, and the shape it finds
  decides the anchor: a main checkout owning that data anchors to itself; a
  linked working tree, whose data is a pointer to a shared repository directory,
  anchors to the main checkout that shared directory belongs to and never to the
  working tree; a pointer naming no shared directory anchors to the directory
  holding it; and a location under no checkout at all — an extracted archive —
  anchors to where the walk began rather than failing or climbing to the
  filesystem root. The equality those four cases exist to guarantee is the
  criterion's real subject: a component's directory is the same directory whether
  it is resolved from a working tree or from the main checkout, so the two can
  never be reading different installed copies. The anchor is settled once, when
  resolution is first needed in a run, so nothing a run does afterwards moves it.

  This was the gap: nine of this story's criteria depend on that anchoring for
  their evidence to exist at all, and it carried none of its own — its four
  branches were provable only by whichever checkout the suite happened to run in,
  which is one branch out of four. Establishing it against fixture trees is what
  makes it evidence rather than a coincidence of layout.
- **Divergence flagged, not absorbed: the local preview server's freshness
  changed too.** The non-cacheable directive was added to the shared file-sending
  path, which the standalone local preview server (STORY-95 / STORY-96) also
  uses. That server's own intent says nothing about caching, and no criterion
  here claims it. The effect is benign for a development server over
  live-rebuilt artifacts, but the behaviour now exists outside this story's
  declared scope and the matrix for those stories follows their own intent.
- **Superseded:** the control app's placeholder response at its root is removed —
  the workspace occupies that route now. No story owned the placeholder, so this
  carries no matrix debt.
- **Confinement clamps rather than detects, and that is why the refusal reads
  as "not found".** Every path the origin serves arrives root-relative, and
  normalising a root-relative path drops its leading traversal segments — so an
  escaping request resolves to a path that does not exist *inside* the tree and
  is answered as not found. The shared resolver's explicit forbidden branch is
  consequently unreachable for URL-derived paths. Security is intact: the
  targeted file is never served. Only the shape of the refusal differs from the
  more obvious detect-and-reject, and the criterion is written about
  non-delivery rather than about a status code so that it documents what ships.
  Making the escape detected explicitly would be a new ticket against this story,
  not a reconciliation change.
- **Same-origin is load-bearing for what comes next.** The editing gesture reads
  and binds inside the frame's document; that is only possible because the frame
  is same-origin, which this story establishes.
- **The strip is derived state, and a control's lifetime is its element's
  lifetime.** The toolbar re-derives on every change to what is displayed, not
  only on a mode change, because a control can depend on the site as much as on
  the mode — and re-deriving the *whole* strip is what keeps "built against
  current state" true of every control rather than of whichever one happened to
  be wired for it. The consequence that is easy to miss, and that cost four
  assertions in the suites before it was written down (BUG-33): a control the
  strip has already replaced is a detached survivor. It is inert by design — what
  kept it current died with it — so anything still holding it is reading a copy
  frozen at the moment of replacement, not the control an operator can touch. The
  behaviour under test is always the control presently in the strip. The
  criterion for this was absent from the matrix while the property was
  load-bearing in the code, which is why the divergence surfaced as red tests
  rather than as a documented gap.
- **The scope control moved from a tab's toolbar to the shell (REQ-179).** The
  toolbar's site selector is deleted rather than kept beside the switcher: two
  controls that could disagree are what the rule "one place a scope is chosen"
  forbids, and the rule survived with only its place changed. The pane keeps its
  own site state, driven by the shell; everything else reads the shell's scope.
  The shared shell component offers a trailing action slot and no leading one, so
  the switcher is prepended into the shell's header bar — the one place this app
  touches shell-internal markup, recorded so it becomes a one-line change when
  upstream grows a leading slot. The businesses endpoint is answered from the
  request's already-computed admission rather than from the store, and above the
  store, because it is asked before any business is chosen. The business prefix
  is applied in one place by the browser client to every URL it builds except
  the account-level status and businesses calls.
- **Two blocks, and the wider one wins.** The unconfigured-deployment block makes
  the whole shell inert; the nothing-selectable block makes only the tab strip and
  panels inert, because the avatar is the whole remedy that state has. When both
  apply, the unconfigured block wins and no second banner is shown.
- **Divergence noted, in commentary only.** The inline comment at the point where
  the strip subscribes still reads "on every mode change" while the code
  subscribes to both mode and site; the narrative docstring above it is correct
  and says "on every mode and site change". No behaviour differs, and
  reconciliation changes no runtime code — recorded so the stale comment is on
  the record rather than mistaken for a second opinion about the trigger.
- **Divergence noted, in commentary only.** The comment above the render cache in
  the route table still reads "The Worker has one store per tenant per isolate,
  so the two are equivalent there", while the store opener documents the decision
  the code actually makes — constructed per request rather than memoised per
  isolate, so the tenant check cannot predate the request. The opener is what
  runs; the consequence is that the cache is never hit at the deployed origin.
  No behaviour differs from what the criteria assert, and reconciliation changes
  no runtime code — recorded so the stale comment is on the record rather than
  read as a second opinion about how long a store handle lives.

## Reconciliation Decisions

*Recorded 2026-08-31, reconciling BUNDLE-20 (bundle-b3b7c399).*

- **The 501-shaped deferral is recorded as a design rule, not as an acceptance
  criterion.** The intent for this relocation asked that a route whose capability
  was deferred answer 501 naming the ticket that would implement it, rather than
  404 — so that a deferral could not be mistaken for a routing bug. Two routes
  were deferred that way. Both have since graduated within this same bundle: the
  assistant routes when the library gained a runtime the edge could load, and
  publishing when the store port gained revision verbs. **No deferred capability
  remains**, and the helper that produced the refusal was deleted with the last
  of them. An acceptance criterion asserting the shape of a deferral would
  therefore assert behaviour that does not exist and cannot be observed, which is
  what the matrix must not contain. The rule stands and is stated here: when a
  route is added ahead of the capability behind it, it answers 501 naming that
  capability's ticket. It becomes a criterion again when there is a deferral to
  observe.
  *Rationale:* the criterion's own note anticipated routes graduating and leaving
  it; every one has. Documenting an invariant with no live instance as a design
  rule keeps the intent on the record without putting an unverifiable assertion
  in the matrix.
- **The origin-failure criterion is re-pointed rather than deleted.** Its former
  subject — an unconfigured or unreachable *forwarding target* — went with the
  proxy. The property it exists to protect (a workspace that cannot serve says
  which piece of configuration is missing, at a status distinguishable from a
  served page, and never returns a blank success) is still implemented and is now
  about the store the origin reads through. Deleting the criterion would drop a
  property the code still has; leaving it as written would assert a variable that
  no longer exists.
  *Rationale:* the criterion's subject was the arrangement, not the guarantee.
- **Two planned removals turned out to have no matrix subject, and nothing was
  archived for them.** The proxy and the variable naming its forwarding target
  are gone from the code, but no criterion asserted them: the two that came
  closest were written about *one host and what an operator observes* precisely
  so they would survive the arrangement changing, and they were re-pointed rather
  than removed. Separately, the assertion that a page mounting a behaviour module
  fails to render in the edge runtime existed only as a free-coded test, never as
  a criterion here; that boundary is removed rather than worked around, and the
  positive belongs to the behaviour-module capability.
  *Rationale:* archiving a criterion that was never written would be a fiction in
  the history; recording the absence here is the honest form.
- **The build-time relocation of component resolution is folded into the existing
  component criteria rather than duplicated.** Components are still consumed from
  the out-of-band install, still referenced through their own declared entry
  points, and a missing one is still named along with the command that installs
  it. Only the moment moved, from per request to per build. Adding parallel
  build-time criteria beside the request-time ones would state one guarantee
  twice.

*Recorded 2026-08-31, reconciling BUNDLE-21 (bundle-78f4e2fe), item 1 (BUG-36).*

- **A criterion of this story asserted the behaviour the fix deliberately
  reversed, and it is narrowed rather than left standing.** The
  configuration-failure criterion covered three cases: no account named, an
  account named that the store does not hold, and an account named that is
  deactivated. The middle case now succeeds — it is the state every new
  deployment and every new database is in, and reporting it was the outage the
  operator opened the ticket for. Left as written, the criterion would hold the
  matrix against the fix and regression would pin the bug. The two cases that are
  still distinct failures stay, and both load-bearing properties the criterion
  exists for — the failure keeps its own status, and is never confused with a
  refused caller — are unchanged and are asserted on those two.
  *Rationale:* the criterion's subject is *a workspace that cannot serve says
  which piece of configuration is missing*. A deployment that can register the
  account its own configuration names can serve, so it was never a member of that
  set; it was only treated as one because nothing created the row.
- **The cold start is stated as a criterion of its own rather than folded into
  the narrowed one.** They are opposite outcomes with different evidence — one
  asserts a successful empty listing and a registered account, the other asserts
  two refusals — and combining them would make a single criterion whose two
  halves cannot both be read as its subject.
- **The single opener is stated on the copy-up criterion rather than left as an
  accident.** That criterion already said the copy crosses through *the same
  store the workspace serves from*. That was true by coincidence of two openers
  that happened to reach the same account once one of them had registered it; it
  is now true by construction. The consequence worth asserting is the one the
  outage was: the copy holds no privilege the other routes lack, so a deployment
  nobody has copied to still serves.
  *Rationale:* recording the property only in prose would leave the matrix unable
  to tell a restored guarantee from a surviving coincidence.
- **The intent's scope boundary is honoured: no criterion asserts a deploy-time
  seed.** The operator was offered a `bin/deploy.d/` hook that seeds the account
  row as an alternative or complement (COMMENT-1435) and did not take it; the
  bootstrap is in the origin's own request path and nowhere else. Nothing here
  claims the deploy creates anything.
- **The interim production `INSERT` is not matrix subject matter.** A row was
  written by hand into the live database to unblock the operator before the fix
  existed. It is a one-off patch of production state, is no longer load-bearing,
  and asserting it would document an operator action rather than a behaviour of
  the system.

*Recorded 2026-09-10, reconciling BUNDLE-21 (bundle-78f4e2fe), item 2 (BUG-37).*

- **The render cache being dead at the deployed origin is recorded as an accepted
  trade, and the claim that contradicted it is withdrawn.** This story said the
  handle key and the account key "are equivalent there" because the deployed
  origin has one store per account. BUG-37 measured the opposite: five
  consecutive draft requests at ~77 ms with no amortisation, because the cache is
  keyed on the store object and the origin builds a fresh store per request. It
  declined to re-key it, and that refusal is the guarantee, not an omission — a
  renderer held across requests holds the handle it was built with, so its reads
  would run under an account check made before the request, which is exactly what
  the opener refuses to do. Trading a deactivation guarantee for the ~1–4 ms the
  render costs is not a trade worth making. So the equivalence claim is removed
  and the reuse is described where it is real: across requests behind the local
  front door, and not at all at the deployed origin.
  *Rationale:* the matrix must not carry a performance property the deployed
  product does not have. An accepted trade is recorded as a trade; asserting the
  behaviour it declined would pin a fiction.
- **The cost BUG-37 did close is not restated as a criterion here.** The memo of
  the *assembled* definition — keyed by account and site, replaced whenever the
  site's write version moves, with currency still proven by a live version read
  on every read — lives in the store adapter, not in this origin, and is asserted
  where it lives (AC-1447, AC-1448). It is what makes a deployed request cheap
  after the render cache stopped being the answer; stating it again as a
  workspace criterion would state one guarantee twice, in a capability that does
  not own it.

*Recorded 2026-11-01, reconciling BUNDLE-35 (bundle-94dbe947), item 7 (REQ-179,
REQ-180 §1/§3).*

- **The site-selector criteria are restated, not retired.** REQ-179 removes the
  toolbar's site selector but keeps the rule it carried — one place a scope is
  chosen — and keeps "the displayed site is one the store actually holds". So the
  criterion that the selector lists the store's sites (AC-967) is restated
  against the business's site list, and the toolbar criterion (AC-970) keeps its
  re-derivation guarantee with the open-in-a-new-tab target as its site-dependent
  example and a business switch as one of the routes a site change arrives by.
  *Rationale:* the guarantees outlived the control; retiring them would drop
  properties the code still has.
- **Behaviour the intent is silent on is formalised as the code does it.**
  (a) With zero businesses — a host with no identity behind it — the switcher
  renders nothing; an empty control would imply a choice that does not exist.
  (b) A remembered site survives a business switch when the new business holds
  the same slug, since slugs are unique per business and the scoped address
  already tells the two apart. (c) A site listing that fails leaves the pane as
  it was rather than empty. (d) The avatar shows the initial of the person's name,
  or their email when no name is set. (e) In the nothing-selectable state the
  stored selection is rewritten to empty, since nothing was opened.
  *Rationale:* each is the less surprising answer for the operator and none
  conflicts with REQ-179 or REQ-180; formalising them keeps regression from
  letting them drift silently.
- **Correction (reconcile BUNDLE-35, fix_plan batch 0/1): clause (c) above is
  withdrawn.** It misdescribed the code. Both the workspace client and the
  reference map a listing failure that is not a refused session to an empty
  list; only a refused session keeps the pane, and that is BUG-52's subject, not
  this story's. The claim has been removed from AC-967 together with its
  verification step, and nothing in its place asserts that a failure empties the
  pane — that behaviour is left unasserted.
- **The vocabulary rule is asserted here although it also reaches the public
  site.** It is one rule over the two surfaces a person reads and is enforced by
  one guard; splitting it by surface would state one guarantee twice.
  REQ-180's further guards — on the `platform_admin` flag's readers and on any
  "platform's own tenant" predicate — are about the model, not about what this
  workspace shows, and are not claimed here.
- **BUG-51 (reconcile BUNDLE-36, 2026-11-01): import guard and `1c reset` are
  claimed here; the starter-scaffold guard is not.** AC-1402's idempotence is
  narrowed rather than retired: the intent says re-running after a *local* edit
  stays ordinary, and that the import refuses only over builder-recorded changes,
  so the criterion now states that boundary and the refusal's exact shape lives in
  its own criterion. `1c reset` sits here because it is part of the operator's
  local builder loop beside the builder command (AC-1401); the provisioning-time
  guard and the creation report it depends on belong to the store story
  (story-fde7370b). Where the intent is silent the code's behaviour is formalised:
  (a) the 409 body carries `slug`, `changes` and a separate `force` hint as fields,
  so a program can tell "refused, and how to mean it" from "refused" without
  parsing prose; (b) only `force: true` overrides — any other value does not;
  (c) the preview does not probe the port, since it changes nothing a live server
  could be hurt by; (d) the preview also names the `storage/` directories it will
  never touch, so the promise is readable rather than taken on trust; (e) a
  `--port` that is not a positive number is refused as a usage error.
  *Rationale:* each is the less surprising reading of the intent, none
  contradicts it, and formalising them keeps regression from letting them drift.
  No contradiction between the code and BUG-51 was found.
- **BUG-52 and BUG-53 (reconcile BUNDLE-36, item 8, 2026-11-01): session
  expiry and control sizing are claimed here, as workspace chrome.** Three
  criteria are added: AC-2230 (an ended session is reported, not drawn empty),
  AC-2231 (non-401 failures are unchanged) and AC-2232 (one control type size).
  - *The valid-session guard is folded into AC-2231, not stated alone.* BUG-52
    requires that a working session survives a reload and that no auth-failure
    path fires on it. That is the "everything else is unchanged" half of the
    same rule, so splitting it out would state one boundary twice.
  - *Mid-session refusal is claimed beyond what the intent's "reload" scope
    names.* BUG-52 scopes itself to a reload, but its own "What was built"
    section specifies the mid-session strip, the once-only latch and the
    no-`inert` decision. So they are intent, not code-only behaviour. How a
    session renews, and avoiding mid-session denial in the first place, remain
    REQ-187's and are not claimed.
  - *The harness token lifetime is not matrix subject matter.* The seven-day
    default for locally minted test tokens has no production counterpart, as
    BUG-52 itself says. It is test infrastructure and is not a criterion of this
    story.
  - *BUG-53 says "Users tab"; the criterion says "Contacts tab".* The tab was
    renamed by later work in this bundle, and its filter row's single state
    select became the access and pipeline selects (REQ-188). The criterion
    covers the filter row's controls as they now exist, and the code applies the
    token to all of them.
  - *Formalised where the intent is silent:* (a) the strip sits outside the
    shell, as its sibling, so its text stays selectable; (b) both notice shapes
    carry an alert role; (c) a load failure that is not a refused session is
    rethrown rather than reported as "sign in again".
  *Rationale:* each follows directly from the BUG-52 and BUG-53 bodies and chat.
  No contradiction between the code and either intent was found. AC-1403 is
  unchanged: the session notice stands its guard down by the documented means
  (filling the mount point), so the guard's own criterion still holds.

## Dependencies

The shared store (definitions, pages and asset bytes, with account scoping and
atomicity) must be reachable from the edge runtime, and the access gate must
admit a caller before any of this is observable. Behaviour-module pages render
here only because a module ships a plain component rather than an artifact a
build transform must compile. Consumes existing platform capabilities: site
rendering and channels, the site store listing, and the publish path.

## Story Points

3