---
uid: story-a58a0974
id: STORY-103
type: story
title: Hold one continuing conversation about my site with an assistant that can only
  act on that site
created_by: xgd
created_at: '2026-08-10T08:34:38.465488+00:00'
updated_at: '2026-09-19T14:14:09.290616+00:00'
completed_at: null
last_field_updated: status
status: updated
fields:
  intent_uid: bundle-e59210c5
  capability_uid: capability-7e4714b7
  story_kind: upgrade
  story_points: 3
  uat_coverage: pass
  updated_by: bundle-8e1807f6
---

## Story

**As a** person who owns a site on this platform, **I want** to hold one
continuing conversation with an assistant about that one site — still there when
I come back tomorrow, able to change the site only through the operations it has
been granted, able to look up how this system works through that same granted
surface, and honest with me when it cannot run — **so that** I can ask for
changes in my own words and be certain that what changes is my site and nothing
else.

## Description

This story owns the conversation itself: the place where a site becomes a
conversation, what a turn is addressed to, what the assistant is told and what it
can look up about the system it works in, where the transcript lives, and how
each kind of failure is reported.

In scope:

- **Asking what the assistant is** — the role on offer and whether it can run
  right now, answerable without opening a conversation at all, so a caller can
  say what is missing before it starts one.
- **Opening a conversation for a site** — the one and only point at which a site
  becomes a conversation. It answers with an identifier for that conversation,
  the turns already spoken, and whether a turn can be run (and why not). Opening
  the same site again is the same conversation, not a new one.
- **Running a turn** — addressed to a conversation, never to a site. What the
  assistant said and what it did are streamed as they happen, ending in exactly
  one completion. A turn that moves the site also announces each move as it
  lands, derived from the site's own change count rather than asked of the
  assistant — so a write cannot go unannounced, cannot be announced twice, and
  cannot be announced for a change that never happened. What the surface
  displaying the site does with that announcement is that surface's business.
- **Binding** — a conversation belongs to exactly one site, fixed when it is
  opened. Nothing above the host names a site; the assistant is offered no
  operation that takes one, so acting on the wrong site is not a mistake
  available to it.
- **What the assistant is told about itself, and what it can look up** — the
  priming is generated rather than hand-written, and where a system knowledge
  base has been built it carries a *map* of what that corpus contains plus the
  means to pull the rest, not the documents themselves, so the corpus can grow
  without the primed context growing with it. The operations that search and read
  that corpus are offered from the **same** granted surface as the site
  operations, so a knowledge call is gated, provenance-marked and audited exactly
  as a change to the site is, rather than reaching the model by a second route.
  That grant is read-only, and it names the system knowledge base on both scope
  axes — what may be searched and what may be read — from one declaration, so the
  two cannot come to mean different things. This holds **wherever the
  conversation is served**: the built corpus travels with the application build
  rather than being read off the operator's own disk, so a conversation on the
  deployed runtime searches the same documents, is primed with the same map and
  is confined by the same grant as one on the operator's machine.
- **Continuity** — one conversation per site, stored **through the store the site
  belongs to** rather than beside a directory on one machine, replayed after the
  host that served it is gone, and never sacrificed to report an unrelated
  failure. On the deployed runtime that store is the account's own ticket store
  and **the conversation is itself a ticket** there: found again by the
  identifier it carries, with the whole session file held as a transcript comment
  on it and its body left for a summary something else writes. On the operator's
  machine it is a file held with the workspace. What a conversation has already
  been told about the corpus it can search is recorded on that same conversation,
  because that fact is born with it and dies with it. The tier in front of the
  archive holds only the turn in flight, so losing the host mid-turn costs that
  turn and not the conversation, and two writers folding onto one conversation
  conflict loudly rather than one silently discarding the other.
- **Where the conversation runs** — the same host serves the conversation from
  the operator's machine and from the deployed edge runtime, over one session
  model, one tool loop and one write path. Which one is answering is not
  something the conversation contract knows: what a turn is, what it may reach
  and the fact that the transcript lives in the store the site belongs to are the
  same either way, and the stored transcript is the same bytes — the carrier
  differs by host and the form does not — so a conversation begun in one can be
  read by the other. A failure is reported honestly on both — never dressed as
  the assistant having tried — in the shape that origin's own answer takes; the
  shapes themselves differ, and are stated per origin under *Reconciliation
  Decisions* below. Nor does it know *which instance* of a host is
  answering: a conversation identifier is resolved against durable, account-scoped storage
  rather than against anything the process that issued it happens to remember,
  so a turn runs on a process that never opened the session, and successive
  turns spread across processes stay one conversation.
- **Honest failure** — a refused operation the assistant corrects within the same
  turn with the site untouched; a missing prerequisite explained to the operator
  alongside their history rather than instead of it; a conversation identifier
  that names no site this account holds refused outright before anything of the
  assistant's is streamed, and never dressed as the assistant having tried; a
  failure after streaming has begun delivered inside the stream so nothing is
  left hanging. Having no knowledge base to open is not a failure at all — it is
  an ordinary state, and the conversation runs on its site operations alone.
  There are **two** ways to arrive in it: no knowledge base was ever built and
  packed into the application, and no embedding model is available to search one
  with. Both degrade to a conversation that still opens and still takes a turn,
  never to a host that will not boot. A knowledge base that *was* built and
  cannot be opened is a different situation and is reported rather than silently
  dropped. Nothing the assistant says back, on any of those paths, carries the
  credential the host holds.

Out of scope:

- **What the assistant can reach.** The declaration, grant, parameter validation,
  error taxonomy and audit of the operations it calls are a separate capability
  (the declared control surface); this story only requires that the assistant
  reaches the site *through that surface and nothing else*, and that its
  knowledge operations are offered from that same surface.
- **The write path.** Validation, atomicity and re-render are unchanged and
  belong to the structured edit capability (CAP-86 / story-37a3921b); the
  assistant is a second producer of the same kind of change, not a second path.
- **The browser pane.** The surface that renders the conversation for the
  operator is its own story, for the same reason the display panel and the origin
  behind it are separate. That includes what it does with the change
  announcement: this story claims only that a turn makes one, never that anything
  acts on it.
- **The stores the transcript and the record are written through.** Tenancy,
  atomicity and the byte path of the cloud object store belong to the site-store
  capability (capability-c4c7a854); the account binding, schema validation and
  compare-and-set of the ticket store the deployed transcript is homed in belong
  to the ticket-store capability. This story claims only that the conversation is
  written through the site's own store rather than beside it, that no request
  address can name it, and that a losing concurrent fold is refused rather than
  swallowed.
- **The summary the conversation's body is reserved for.** Making the conversation
  a ticket does not make the conversation *knowledge*: the transcript is a comment
  and the body is deliberately left alone, so a conversation enters the corpus
  carrying its identifier and nothing else until something writes that summary.
  REQ-171 owns it, together with the session prompts and turn reminders it has to
  be written into.
- **What the conversation is told about a corpus that changed while it was open.**
  The per-turn report derived from the conversation's recorded boundary, how that
  boundary advances, and a search that reaches more than one knowledge base, are
  the change-delta capability's. This story claims only that the boundary lives on
  the conversation.
- **The record of what the assistant did.** Its shape — one object per record in
  shared storage, so distinct keys make the trail append-only by construction — is
  not a trade this story revisits. What is claimed here is only that no request
  address can name it.
- **Building the knowledge base, and packing it.** The corpus export, the document
  and chunk indexes, the generated awareness map, the operator commands that
  produce them, the rule by which a document is a member of the corpus, and the
  packing of the built result into the application build so a runtime with no
  filesystem can hold it, are their own capability (STORY-117 / story-c4f329d3).
  This story claims only what a *built and packed* knowledge base does when it
  reaches a conversation, and what a conversation does without one.
- **Retrieval quality.** Ranking, chunking and clustering belong to the knowledge
  library. Nothing here claims a particular answer is the best available one —
  only that the corpus is reachable through declared operations and that priming
  is a map rather than the documents.
- **The tenant's own knowledge base.** The client's conversations, uploads and
  captures are a second corpus with its own residency, its own tenancy barrier
  and its own refresh clock. Nothing here is tenant-scoped; the corpus this story
  reaches is the shipped one, identical for every account.

## Technical Context

- The conversation host sits on the builder workspace origin (CAP-85 /
  story-e674c60a), which owns the routes' shared behaviour — confinement,
  freshness, and the route-coverage guard that requires every declared route to
  be probed. This story adds routes to that origin and inherits those properties
  rather than restating them.
- Every change the assistant makes goes through the same validated, atomic write
  path the command line and the click-to-edit modal use (CAP-86 /
  story-37a3921b). Nothing here re-implements validation, atomicity or re-render,
  and nothing here can bypass them.
- **Two surfaces, one toolbox.** The knowledge operations and the site operations
  compose into a single granted surface rather than one wrapping the other. That
  is what makes "gated, provenance-marked and audited exactly as an edit is" a
  structural consequence rather than a promise: there is one policy, one audit
  sink and one session identity for both. The knowledge operations declare
  themselves read-effect and mark their results **untrusted**, which is correct —
  a retrieved document is authored text arriving in the model's context.
- **One declaration fills both scope axes.** The searchable-knowledge-base axis
  and the readable-document axis are filled from a single named set, so a session
  cannot end up able to read documents it was never allowed to search for.
  Writing the two by hand would be a second place for them to drift apart.
- **Priming order is load-bearing, and the order is this host's**: the map of
  what exists, then what this role is for, then the projected tool manual last —
  the last thing read is the thing done first. The manual remains a projection of
  the operations actually granted, so a session's priming never mentions a
  capability it does not have, and the map is generated from the corpus rather
  than written by hand. Neither document is hand-authored prose about the tools.
  The knowledge library renders only its own two texts — the map, and how to
  reach it — as named providers resolved on every assembly, and states no role;
  where the role's purpose sits between them is declared in this host's own
  priming entry list. Resolving per assembly is also what lets a document
  published after the conversation opened reach it.
- **Degradation is not failure, and the two are distinguished.** No knowledge base
  built is the pre-knowledge assistant — tools but no documents — and is reported
  to nobody, because nothing is wrong. A knowledge base that was built and then
  fails to open (most often because the embedding credentials are absent) is
  reported to the operator on the origin's error output while the conversation
  still opens, because the two situations have very different fixes and must not
  look the same. The deployed edge runtime is *not* an instance of that ordinary
  state — the corpus travels with the application build and is reachable there —
  and the distinction the sentence draws is unchanged.
- **Intent supersession within the bundle that created this story.** REQ-122
  specified a turn carrying `{slug, text}` and a site identity held by the
  browser. REQ-127 withdrew that, and also withdrew its own earlier clause making
  the site binding a *declared scope predicate*, on the stated argument that a
  predicate would hand the model a site parameter it must get right on every call
  — re-opening an error class that does not currently exist. The binding was
  *located* in the session instead. The criteria below follow the later, amended
  intent.
- **Known divergence, recorded not absorbed.** REQ-122 stated a refused operation
  returns its code, path and hint to the assistant. Since REQ-126 the per-call
  path and hint no longer reach it — the tooling layer renders the declared
  meaning of the error class instead. The intent records this as a loss of
  specificity it did not choose and has raised upstream. AC coverage therefore
  asserts the property the intent is about (a named refusal the assistant can act
  on within the turn, site untouched) and does not claim the per-call address is
  delivered.
- Transcripts frequently contain verbatim business detail. On the host that runs
  on the operator's machine they are operator-local, stored with the workspace and
  excluded from version control; on the deployed runtime they are rows in the
  account's own store, confined by the same binding as every other row it holds.
- **The transcript is a ticket on the deployed host, and the costs of that are
  named rather than discovered.** The whole session file is re-serialised and
  rewritten on every turn, and a single stored row is bounded where an object in
  shared storage was not, so a long enough conversation meets a ceiling the
  previous arrangement did not have. Both are accepted, and the escape hatch for
  the day either hurts is a message-granular archive behind the same port rather
  than a bespoke shape here. Steady state is one read and one compare-and-set
  write per turn; a conversation's first turn on a fresh host additionally pays a
  scan for its own ticket, which is why the store is held for the life of the host
  rather than rebuilt per request.
- **Node's host is deliberately not brought along.** The command-line host keeps a
  file archive because there is no writable ticket store under the CLI to home a
  conversation in. That is why the criteria are written to the property — through
  the store the site belongs to, one language-neutral form — rather than to either
  carrier.
- **One conversation host per isolate in the edge runtime, deliberately.** Every
  other route on that origin builds its store per request so the tenant check is
  never stale; the conversation routes cannot, because the session cache is keyed
  by the store's own identity and a fresh store per request would be a fresh
  conversation per request. The same now holds for the ticket store the transcript
  is homed in, for a second and independent reason: the archive caches the
  conversation's ticket, so a store per request would be an archive per request
  and every turn would pay the lookup only a first turn should. The tenant is
  still checked once, when the host is built; what is given up is re-checking a
  mid-isolate deactivation, on the conversation routes alone. Recorded as the
  intent's own stated deviation.
- **That cache is a cache of hosts, not of conversations.** The binding from a
  conversation identifier to its site is not held there, and is not held
  anywhere in a process: the identifier names its site by construction, and is
  admitted only when that site is one the account's own store holds — a fact any
  process can establish for itself, and one a process-local record could not
  establish at all. Losing the cache costs the host, never the conversation.
  This is what lets "the same session model on either host" hold in a runtime
  where two requests are not promised the same process.
- **The system knowledge base sits above tenancy; the conversation does not.**
  REQ-123 records the design a later store ticket inherits — the corpus is a
  release artefact that takes the scope parameters and does not vary by them, so
  identical query text yields identical results for every account. Recorded here
  because it is why per-tenant knowledge bases can be added later without
  revisiting this wiring. The claim is about the *corpus* alone: the conversation
  around it is account-scoped, and its transcript and audit are tenant-partitioned
  through the account's own stores (REQ-143 / REQ-146 / REQ-160), with the
  identifier resolved against that account's storage rather than anything a
  process remembers (BUG-38).
- **The assistant library is not pinned by this repository.** It is resolved out
  of the shared component store another project's deliberate install writes, so
  nothing in this checkout's lockfile holds it still and an upstream change
  arrives here with no commit of ours. That is not hypothetical: the knowledge
  library's read group grew, provenance moved from the operation onto the
  knowledge base that vouches for a document, and its priming became two named
  providers — all without a change here. The criteria below are therefore written
  to the properties (the grant *is* the declared read group; a result comes back
  marked) rather than to a census of what the library happened to declare, so the
  next such change is checked rather than merely noticed. The session archive is
  now resolved the same way: the deployed host constructs the component's own
  ticket-backed archive rather than implementing one, so the compare-and-set and
  the comment layout are upstream's contract, asserted here as behaviour rather
  than transcribed as a shape.
- **Recorded caveat on evidence.** The session-side behaviour is proven over a
  real corpus, a real index and the real granted surface, with a stand-in
  embedding model at the single model boundary. A knowledge base built against
  the production embedding credentials was never opened by a session in the
  authoring session itself, so what is asserted is the wiring and the shape of
  priming, not retrieval quality against the real corpus.
- **The turn in the edge runtime is evidenced against a doubled model, not a live
  one.** It runs inside the real runtime against the real database and object
  store, with the model client as the single double — one that speaks the
  streaming wire protocol the backend actually consumes, because a
  finished-message double would assert against a fiction. Nothing here is
  asserted against a live model provider. The knowledge half is evidenced the
  same way and with one more stand-in: the deployed runtime proxies its embedding
  model to a live account, so the embedder is stood in for too, and the corpus is
  one the test planted rather than whichever documents happened to be exported
  that week.
- **Evidence that went stale with the carrier, recorded so it is retargeted rather
  than rediscovered.** The deployed-host verifications for continuity and for the
  stored form were written against an object key in shared storage — they list,
  read and delete `chat/<account>/<conversation>.md`, and one of them constructs
  the object-backed archive class by name. That class no longer exists and that
  key is never written, so those two verifications assert against an arrangement
  the product no longer has and must be retargeted at the conversation's ticket
  and its transcript comment. The criteria they belong to are unchanged in
  substance; only where they look is wrong.
- **The change announcement is derived, and its cost is stated rather than
  discovered.** The count is re-read only after the assistant has run an
  operation — the only thing in a turn that can write — so a turn that writes
  pays one primary-key read per operation it ran, and a turn that only speaks
  pays none. That is why the criteria are about announcements and not about
  polling: there is no clock here and nothing is being watched.
- **A declared operation was the available alternative and was rejected.** The
  intent says why: a tool is a capability the model may skip, and the turns it
  would skip it on are the long ones, which are exactly the turns where watching
  the page unfold matters most. Deriving the announcement from the count is the
  same argument the per-turn change reminder already makes for pushing rather
  than leaving the model to ask.
- **CODE ISSUE — the turn stream does not currently compile, so the announcement
  cannot run.** `streamPrompt` reads `let seen = at` where nothing named `at` is
  in scope (`tools/generate/src/cli/ai/host-core.ts:774`); `tsc --noEmit` over
  `tools/generate` reports `TS2304: Cannot find name 'at'`. The free-coded BUG-43
  commit was correct — it read the counter into `at` at the top of the turn — and
  that binding was removed when REQ-160 moved the reminder comparison out into a
  provider, leaving its one surviving use behind. The intent is unambiguous, so
  the criteria are written to it and the code is what is wrong. The same module
  fails to compile for two further REQ-160-owned reasons (`CARETAKER_PURPOSE` is
  both imported and declared locally; `session-knowledge.ts` imports
  `SHIPPED_SOURCE` from `system-knowledge.ts`, which does not export it), so all
  three have to be repaired together before any turn-stream verification in this
  bundle can run. Raised for `fix_uat_coverage`; not fixed here, because
  reconciliation does not change runtime code.

## Reconciliation Decisions

Decisions taken on **2026-08-31** while reconciling BUNDLE-20 (REQ-146, plus
REQ-149's deploy-secret follow-up). The intent named each of these outcomes;
where it named an outcome and not an observable, the observable chosen below is
this reconciliation's decision, made now.

- **"Stored with the workspace" becomes "stored through the store the site
  belongs to."** REQ-146 §1 and §4 state that the transcript "reconciles with
  REQ-143 rather than adding a store" and implements the archive port over the
  bindings the site store already built. The criterion is rewritten to the
  property that holds in both hosts — the conversation is written through the
  site's own store and replayed once the host that served it is gone — rather
  than to the directory that was only ever one host's answer.
- **The stored form is claimed as a portability property, separately from where
  it lives.** The intent's stated reason is that a runtime-shaped record "would
  have made the two runtimes stop being the same product". Where a transcript
  lives and what shape it is written in are independently observable and fail
  independently, so they are two criteria rather than one.
- **The junction's cost is stated inside the criterion rather than hidden.** The
  intent declares the tier in front of the archive in-memory and drained during
  the turn. That is a real, bounded loss — the turn in flight — and a criterion
  that omitted it would claim more than the code does.
- **Redaction is claimed as an absence at the boundary, not as a scrubbing
  routine.** The intent's AC4 is "no API key appears in logs, error envelopes, or
  client responses". The observable is the absence, on the error paths most
  likely to carry it. That the defence matches known values at the response
  boundary rather than matching a pattern at each throw site is recorded as
  context, because it is a design reason and not something a caller can see.
- **The import-graph guard is a criterion in its own right**, because the intent
  says explicitly that a passing turn is not evidence for it: the filesystem
  module *resolves* under the compatibility flag and hands back a per-isolate
  ephemeral disk, so a file-backed archive passes a test and loses every
  conversation on the next eviction. What is observable is the shipped artifact.
- **The deploy-secret guard is carried here** rather than under the publish or
  build capability. It was filed against REQ-149, but it governs the model key's
  lifecycle, and the model key is what decides whether this conversation can take
  a turn at all.
- **The capability answer is served by the operator's local transport and not by
  the deployed route table.** The criterion for asking what the assistant is
  (AC-1051) is unchanged and still holds where it is served. The asymmetry is
  recorded here rather than formalised as a criterion: the intent is silent on
  it, and the workspace-origin capability (CAP-85 / story-e674c60a) owns the
  one-route-table property that would decide whether it is a defect. Flagged
  there, neither claimed nor denied here.

Decisions taken on **2026-08-31** while reconciling BUNDLE-21 (BUG-38).

- **The authority test moves from "this process issued it" to "it names a site
  this account holds."** BUG-38 states the change directly: the per-process
  registry that bound an identifier to its site is deleted, and resolution is
  made against the account's own storage instead — because opening a
  conversation and speaking in it are two requests with no promise of the same
  process, and in the deployed runtime that made *every* turn refused. AC-1055's
  earlier verification required an identifier of the form the origin derives for
  an **existing** site to be refused; that case is now the accepted one,
  deliberately, since it is the only thing a client holds between the two
  requests. The property that criterion existed to protect is preserved and
  strengthened rather than dropped: an arbitrary client string still cannot
  become a free-form key into the session store, and the check is now made
  against storage and scoped to the account — something a process-local registry
  could not check at all.
- **The cross-process turn is claimed as its own criterion, not folded into
  AC-1055.** The story already claimed one session model across both hosts; what
  was missing was the observable that makes the claim true where it was false.
  The two fail independently: resolution could admit an identifier and still
  start a fresh conversation on each process, which is a different defect and
  would leave the operator's history behind rather than their turn.
- **The shape of a refusal is stated per origin rather than as one shape.** The
  intent is silent on it and the two origins have always differed — the one that
  answers a turn with a status code refuses as a plain not-found answer, the one
  that answers every turn as a stream delivers the refusal as its own message
  ahead of the completion. Formalised now, as this reconciliation's decision,
  because the property the intent *does* state — a refusal is never dressed as
  the assistant having tried and failed — holds in both, while the criterion was
  previously written as though only the first origin existed.

Decisions taken on **2026-09-10** while reconciling BUNDLE-26 (REQ-158). The
intent's stated acceptance is that the assistant, asked a question whose answer
lives only in a design document, answers from it and names the document — "this
is the acceptance criterion that matters; the rest are the mechanism." The
decisions below are about what the matrix should therefore assert, and what it
should stop asserting.

- **The deployed runtime stops being an instance of the no-knowledge ordinary
  state, and the Technical Context sentence saying otherwise is withdrawn.** That
  sentence was true when it was written — the corpus was reachable only through
  the operator's filesystem, so a conversation served anywhere else had nothing
  to reach. The intent's whole subject is removing that limitation, so the
  sentence is not a claim this story can keep. It is replaced rather than
  deleted, because the distinction it drew (absent is ordinary, unopenable is
  reported) is still exactly right and only its third example was wrong.
- **AC-1320 keeps its shape and loses one of its two examples.** The criterion has
  always been "the ordinary absence, stated against the exceptional failure", and
  it named two situations that were the same to the operator: a workspace that
  never built a corpus, and the deployed host as such. The second is gone, so the
  criterion now states the first alone — nothing built, or built and never packed
  — and says explicitly that the deployed host is no longer an instance of it.
  Its exceptional half (built, and then unopenable, reported on the error output)
  is untouched. Its verification also now asserts the offered knowledge
  operations are **empty** rather than that the turn merely survived, which is
  this reconciliation's sharpening: a session that failed to build its surface
  and one that correctly built an empty one are indistinguishable to a test that
  only checks the turn completed.
- **"Reaches the knowledge base in the deployed runtime" is claimed as the
  assistant's answer, not as the wiring.** The intent says the behavioural test
  is the one that matters, so the criterion is written at the conversation: a
  question whose answer lives only in a design document is answered from that
  document, the reply names it, and the document that answers outranks one that
  does not. That last clause is this reconciliation's addition — without it, a
  search that handed back the whole corpus in corpus order would satisfy the
  first two exactly as well, and the criterion would be vacuous.
- **The no-filesystem property is stated as the setting, not re-asserted as an
  import-graph walk.** The intent asks that the Worker-safe opener exist and that
  "the existing static-import-graph assertion still passes". That assertion is
  AC-1406's and it is unchanged; restating it on the knowledge path would be a
  second place for the same guard to drift. The new criterion instead runs inside
  the deployed runtime, where there is no filesystem to fall back to, so reaching
  the corpus there is itself the evidence that the path is a packed one.
- **The absent model binding is formalised as a criterion, though the intent only
  names it in passing.** The intent's acceptance says a missing corpus "degrades
  to no knowledge tools, never to a boot failure" and says nothing about the
  model binding. The code has two routes to the same state and the second is the
  one that will actually happen in a misconfigured deployment. Formalised now, as
  this reconciliation's decision, because an unstated degradation is the kind
  that gets traded for a throw by someone who did not know it was load-bearing.
  It is a criterion of its own rather than a second clause on AC-1320: the two
  routes are reached through different code and fail independently, and one of
  them is a configuration mistake in a live deployment while the other is the
  ordinary shape of a fresh checkout.
- **Priming and the grant are claimed on the deployed host specifically, rather
  than treated as covered by the existing host-neutral criteria.** AC-1319 and
  AC-1318 state the properties; they were evidenced only where the corpus could
  be reached, which was one host. The decision is to add criteria that pin them
  in the deployed runtime rather than to widen the existing two, because the two
  hosts construct the surface through different code and can fail independently —
  and the grant's read-only half is asserted as an equality over the offered
  operations, so an operation added upstream cannot enter the grant unnoticed.

**2026-09-11 — reconciling AC-1652's read-set assertion against upstream drift (BUNDLE-26 / REQ-158).**

- **The read set is not this repository's roster to pin.** AC-1652 named the read set as exactly three operations and asked for it as an equality, so that "an operation added upstream cannot enter the grant unnoticed". The shared knowledge component then widened its own read group from three operations to five — `KnowledgeOutline` and `KnowledgeChanges` — with no commit here. Both were read out of the component's declaration and both declare `effect: read`, so the criterion's substantive claim (the grant is read-only and confined to the system knowledge base on both axes) never stopped being true. What went stale was the mechanism: an identity snapshot of a three-element list standing proxy for a property.
- **The equality is kept and both of its sides are derived.** What the model is offered must equal exactly what the grant names, resolved through the surface's own declaration; and every granted operation must itself declare `effect: read`, every granted group must be a declared read group. That is strictly **stronger** than the roster equality — a write operation arriving inside an already-granted group fails it, which the roster caught only by accident of the list changing — and it is inert to a read-only addition, which is not a widening of what this session may do. Widening the literal to five names was the available alternative and was rejected: it would restate the same stale mechanism and go stale again on the next upstream read.
- **The declaration is read off the surface the session travelled with**, not imported alongside it, so there is no second copy for the assertion and the runtime to disagree about.
- **Both scope axes become every declared axis.** The grant was checked by substring against a serialised blob. It is now checked axis by axis, over the axes the declaration itself defines, so an axis added upstream cannot arrive unconstrained.
- **AC-1318's node twin is left alone, deliberately.** It fails on the identical assertion, but it is not in this bundle's active set and it sits in a suite whose other criteria (AC-1317, AC-1319) need this story rewritten against a knowledge model upstream retired. The three travel together, against the framework-migration intent, not here.

Decisions taken on **2026-09-13** while reconciling BUNDLE-27 (REQ-160's storage
half). The intent's position is stated flatly by the operator — *"I am expecting
the system to use the ticket store to back it … everything is a ticket"* — and the
ticket answers it with DOC-10 §8: the conversation homed in a `chat` ticket found
or created by its session id, the whole session file in one `chat_transcript`
comment, the body left for the summary REQ-171 owns, writes compare-and-set. The
decisions below are about what the matrix should therefore say.

- **The carrier changes and the property does not, so the criteria are restated
  rather than replaced.** AC-1057 and AC-1405 were written to properties — through
  the store the site belongs to; one language-neutral form, byte for byte — and
  both survive the object store being swapped for the ticket store intact. What
  had to change is that each named the object key as though it were the property.
  Both now state the carrier per host (a transcript comment on the conversation's
  own ticket in the deployed runtime; a file with the workspace under the CLI) and
  keep the property host-neutral. The alternative — a second pair of criteria for
  the ticket-backed host — was rejected: it would make the two runtimes stop being
  the same product in the matrix, which is exactly the outcome the original intent
  gave as its reason for the neutral form.
- **The chat ticket's shape is formalised as a criterion, because it is a
  persistent-artifact contract and not an implementation detail.** The intent names
  each part (the `session_id` field, the `chat_transcript` comment, the untouched
  body, one ticket per conversation rather than one per turn) and the last of them
  is the one a defect would actually break: an archive that minted a second ticket
  per turn would still replay a conversation, so AC-1057 would pass while the
  conversation had quietly become several. Stated as one criterion because the four
  parts are one arrangement and no consumer can see three of them without the
  fourth.
- **The compare-and-set refusal is claimed as a criterion, not recorded as a
  property of the store.** The intent chose it deliberately and gave the reason —
  "a concurrent write now fails loudly on the compare-and-set instead of silently
  losing the later fold, which is the better failure" — and a loud failure that
  someone later traded back for an unconditional overwrite would look like an
  improvement. It is verified as a refusal plus an intact stored transcript,
  because a refusal that left the transcript truncated would be the worse failure
  wearing the better one's clothes.
- **The cursor's home is claimed here; what it is for is not.** The intent puts the
  boundary on the conversation's ticket for a reason about lifetime — it lives and
  dies with the conversation, unlike an index's own bookmarks, which are a property
  of an indexing pass. That is a continuity claim and belongs to this story. The
  per-turn report derived from it, its advance, and the co-ranked search that gives
  it something to report are the change-delta capability's, and are deliberately
  not asserted here. Splitting them this way is this reconciliation's decision: the
  two fail independently, and a boundary stored on the wrong object is a continuity
  defect even if every delta it produces is correct.
- **Tenancy moves from a stated convention to a structural barrier, and AC-1409 is
  strengthened rather than weakened.** The object-backed transcript's isolation was
  that its key sat outside the site region and nothing derived a storage root from
  a request — true, and held by a comment. The conversation is now in a store whose
  handle is bound to one account when it is built, so there is no argument on that
  path that could name another account's conversation. The criterion keeps its
  original claim (no request address names a transcript or the record) and gains
  the confinement claim, and its verification gains the observation that the
  conversation is not in the addressable object storage at all.
- **What is deliberately not claimed.** Node's host keeps its file archive, because
  there is no writable ticket store under the CLI — so no criterion says the
  conversation is a ticket *wherever* it is served. The record of what the
  assistant did keeps its one-object-per-record shape, and the intent says so
  explicitly; the matrix does not restate that trade. Nothing is claimed about
  conversations written under the previous arrangement: the intent's stated
  decision is that they orphan, and a migration criterion would assert a behaviour
  nobody built.

Decisions taken on **2026-09-14** while reconciling BUNDLE-27 (BUG-43). The
operator's statement of the defect is that the assistant's writes land correctly
and invisibly, and the stated fix is "a change signal on the turn stream that the
panel can act on, emitted per write rather than once at the end of the turn".

- **The announcement is claimed as part of what a turn streams, not as a second
  channel.** AC-1054 already enumerated what a turn carries and where the change
  really is, so the announcement joins that enumeration rather than becoming a
  criterion about a new surface. A criterion of its own would have invited a
  second transport, which is the one thing the intent rules out.
- **Per-write placement is a criterion and not a note, because it is the whole
  request.** The intent gives the reason in full: a single signal at the end of a
  turn would satisfy "the page updates" and still lose what was asked for, which
  is a request answered by several edits arriving edit by edit. A property about
  *where* in a stream something appears is observable as an order, so it is
  asserted as one.
- **"Not an operation the model may skip" is formalised as a criterion of its
  own.** The intent states it as a deliberate choice and gives the argument; left
  in prose it is exactly the kind of thing traded away by the next person who
  finds a declared refresh operation tidier. Its two observable halves — a silent
  assistant's write is still announced, a talkative assistant's non-write is not —
  are what a criterion can carry where "the host produces it" cannot.
- **The workspace that performs the reload is left to the pane's story, and
  STORY-99 is deliberately not touched.** The reload is performed by the
  workspace, but AC-1033 already states that a definition changed outside the
  workspace is shown on the next request, so the workspace's obligation is
  unchanged — what is new is that the conversation now tells it when to ask. The
  criterion for acting on an announcement therefore sits with the pane that
  observes it.
- **The system preamble was left alone, and that is a decision rather than an
  omission.** The intent notes that the assistant is told "the page the user is
  looking at re-renders after every change", and names that as part of the
  defect. The fix makes the sentence true instead of rewriting it, so no
  criterion claims anything about the preamble's wording.

## Dependencies

The declared control surface the assistant acts through, and the browser pane
that renders the conversation, are related work that must not be re-derived here.
The stores the conversation and the record are written through are the site-store
capability (capability-c4c7a854) for the object half and the ticket-store
capability for the conversation's own home, and the origin that hosts the routes
is CAP-85 (story-e674c60a). The knowledge half additionally depends on the system
knowledge base having been built *and packed into the application build* (STORY-117 /
story-c4f329d3) — but only for its knowledge criteria; every other criterion
holds with no knowledge base present at all.

## Story Points

3