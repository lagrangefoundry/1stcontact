---
uid: story-a58a0974
id: STORY-103
type: story
title: Hold one continuing conversation about my site with an assistant that can only
  act on that site
created_by: xgd
created_at: '2026-08-10T08:34:38.465488+00:00'
updated_at: '2026-09-04T03:03:01.532254+00:00'
completed_at: null
last_field_updated: story_kind
status: updated
fields:
  intent_uid: bundle-e59210c5
  capability_uid: capability-7e4714b7
  story_kind: upgrade
  story_points: 3
  uat_coverage: pass
  updated_by: bundle-78f4e2fe
---

## Story

**As a** person who owns a site on this platform, **I want** to hold one
continuing conversation with an assistant about that one site — still there when
I come back tomorrow, able to change the site only through the operations it has
been granted, able to look up how this system works through that same granted
surface wherever the conversation is being served, and honest with me when it
cannot run — **so that** I can ask for changes in my own words and be certain
that what changes is my site and nothing else.

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
  one completion.
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
  two cannot come to mean different things. The surface and the priming are wired
  as a pair: a session is never primed with the map of a corpus it was not
  granted, nor granted one it was never told about.
- **The corpus travels with the host, on either host** — the shipped corpus is a
  release artefact, so the deployed host carries it in the artifact it was
  released with and searches it without reaching a filesystem at all, exactly as
  the operator's own host searches the one on its disk. Which host is answering
  does not decide whether the assistant can look something up; only whether a
  corpus was built into what is running does.
- **Continuity** — one conversation per site, stored **through the store the site
  belongs to** rather than beside a directory on one machine, replayed after the
  host that served it is gone, and never sacrificed to report an unrelated
  failure. The tier in front of the archive holds only the turn in flight, so
  losing the host mid-turn costs that turn and not the conversation.
- **Where the conversation runs** — the same host serves the conversation from
  the operator's machine and from the deployed edge runtime, over one session
  model, one tool loop and one write path. Which one is answering is not
  something the conversation contract knows: what a turn is, what it may reach,
  where the transcript lives and how a failure is reported are the same either
  way, and the stored transcript is the same bytes, so a conversation begun in
  one can be read by the other. Nor does it know *which instance* of a host is
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
  left hanging. A knowledge base that was never built is not a failure at all — it is
  an ordinary state, and the conversation runs on its site operations alone —
  while one that *was* built and cannot be opened is reported rather than
  silently dropped. Nothing the assistant says back, on any of those paths,
  carries the credential the host holds.

Out of scope:

- **What the assistant can reach.** The declaration, grant, parameter validation,
  error taxonomy and audit of the operations it calls are a separate capability
  (the declared control surface); this story only requires that the assistant
  reaches the site *through that surface and nothing else*, and that its
  knowledge operations are offered from that same surface.
- **The write path.** Validation, atomicity and re-render are unchanged and
  belong to the structured edit capability (CAP-87 / story-37a3921b); the
  assistant is a second producer of the same kind of change, not a second path.
- **The browser pane.** The surface that renders the conversation for the
  operator is its own story, for the same reason the display panel and the origin
  behind it are separate.
- **The store the transcript is written through.** Tenancy, atomicity and the
  byte path of the cloud store belong to the site-store capability
  (capability-c4c7a854); this story claims only that the conversation is written
  through the site's own store rather than beside it, and that no request address
  can name it.
- **Building the knowledge base.** The corpus export, the document and chunk
  indexes, the generated awareness map, the operator commands that produce them,
  the emission of that corpus and its indexes as an importable artefact carried
  in the deployed bundle, and the rule by which a document is a member of the
  corpus are their own capability (STORY-117 / story-c4f329d3). This story claims
  only what a *built* knowledge base does when it reaches a conversation, on
  whichever host is serving it, and what a conversation does without one.
- **The client's own corpus.** A knowledge base over a tenant's uploads,
  captures and transcripts is a different corpus with a different residency rule
  and a different lifetime, and is deliberately not wired into this session. This
  story's knowledge claims are about the shipped corpus alone.
- **Retrieval quality.** Ranking, chunking and clustering belong to the knowledge
  library. Nothing here claims a particular answer is the best available one —
  only that the corpus is reachable through declared operations and that priming
  is a map rather than the documents.

## Technical Context

- The conversation host sits on the builder workspace origin (CAP-85 /
  story-e674c60a), which owns the routes' shared behaviour — confinement,
  freshness, and the route-coverage guard that requires every declared route to
  be probed. This story adds routes to that origin and inherits those properties
  rather than restating them.
- Every change the assistant makes goes through the same validated, atomic write
  path the command line and the click-to-edit modal use (CAP-87 /
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
- **Priming order is load-bearing**: the map of what exists, then what this role
  is for, then the projected tool manual last — the last thing read is the thing
  done first. The manual remains a projection of the operations actually granted,
  so a session's priming never mentions a capability it does not have, and the
  map is generated from the corpus rather than written by hand. Neither document
  is hand-authored prose about the tools.
- **The two hosts open the same knowledge base from different places, through the
  same seams.** The operator's host opens it from two directories on a disk; the
  deployed host opens it from values carried in the released artifact. Neither the
  corpus resolution, the ranking nor the tool surface above them can tell which it
  got, which is why the query path can be held to reaching no filesystem on the
  deployed side without the two becoming different products. The same embedding
  model is used to build the index and to run a query against it — vectors from
  two models are not comparable, and the failure mode is plausible-looking
  nonsense rather than an error.
- **Degradation is not failure, and the two are distinguished.** No knowledge base
  built is the pre-knowledge assistant — tools but no documents — and is reported
  to nobody, because nothing is wrong. A knowledge base that was built and then
  fails to open (most often because the embedding credentials are absent) is
  reported to the operator on the origin's error output while the conversation
  still opens, because the two situations have very different fixes and must not
  look the same. On the deployed host the *ordinary* state has two causes rather
  than one: a release built without a corpus, or a deployment with no embedding
  binding for the query side. Both are silent, and neither is a boot failure —
  which is what makes it safe for the generated corpus module to be written
  unconditionally, carrying nothing when nothing was built.
- **The corpus is opened once per serving host, not once per turn.** Decoding a
  bundled index into vectors is the expensive part of opening it, and the artefact
  cannot change while the host lives, so it is opened beside the store that host
  holds. This is a cost property rather than a promise to a caller, and it is
  recorded here rather than claimed as a criterion.
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
- Transcripts are operator-local in the filesystem host and frequently contain
  verbatim business detail; there they are stored with the workspace and excluded
  from version control.
- **One conversation host per isolate in the edge runtime, deliberately.** Every
  other route on that origin builds its store per request so the tenant check is
  never stale; the conversation routes cannot, because the session cache is keyed
  by the store's own identity and a fresh store per request would be a fresh
  conversation per request. The tenant is still checked once, when the host is
  built; what is given up is re-checking a mid-isolate deactivation, on the
  conversation routes alone. Recorded as the intent's own stated deviation.
- **That cache is a cache of hosts, not of conversations.** The binding from a
  conversation identifier to its site is not held there, and is not held
  anywhere in a process: the identifier names its site by construction, and is
  admitted only when that site is one the account's own store holds — a fact any
  process can establish for itself, and one a process-local record could not
  establish at all. Losing the cache costs the host, never the conversation.
  This is what lets "the same session model on either host" hold in a runtime
  where two requests are not promised the same process.
- **The system knowledge base sits above the tenancy barrier.** REQ-123 records
  the design a later store ticket inherits — the corpus is a release artefact that
  takes the scope parameters and does not vary by them, so identical query text
  yields identical results for everyone, and nothing on the path from a
  conversation to a corpus hit names an account. Recorded here because it is why a
  per-tenant knowledge base can be added later without revisiting this wiring;
  nothing tenant-scoped is claimed, opened or searched by this story.
- **Recorded caveat on evidence.** The session-side behaviour is proven over a
  real corpus, a real index and the real granted surface, with a stand-in
  embedding model at the single model boundary. A knowledge base built against
  the production embedding credentials was never opened by a session in the
  authoring session itself, so what is asserted is the wiring and the shape of
  priming, not retrieval quality against the real corpus. The same stand-in is
  used on the deployed side, because the runtime's test harness proxies the
  embedding binding to the live account and has no local equivalent.
- **The turn in the edge runtime is evidenced against a doubled model, not a live
  one.** It runs inside the real runtime against the real database and object
  store, with the model client as the single double — one that speaks the
  streaming wire protocol the backend actually consumes, because a
  finished-message double would assert against a fiction. Nothing here is
  asserted against a live model provider.

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

Decisions taken on **2026-09-03** while reconciling BUNDLE-23 (REQ-158).

- **The deployed host stops being definitionally corpus-less, and AC-1320 is
  corrected rather than reinterpreted.** REQ-158's declared goal is that "the
  builder AI can search its own design documentation" on the deployed host, which
  AC-1320 had stated was impossible by nature — "the corpus is reachable only from
  the operator's own machine and so is simply absent". That sentence is now false
  of the shipped code and is replaced. What the criterion was protecting — that an
  absent corpus is an ordinary silent state and never a boot failure — is kept and
  is now the *only* thing it claims about the deployed host.
- **The absent case keeps its two causes, and both are formalised as silent.** The
  intent, written earlier, argued the opposite for one of them: an absent `[ai]`
  binding "is not degradation — every search throws on `undefined`", which was the
  argument for declaring the binding twice. The binding now exists and is pinned
  by its own regression, so the sentence describes a hazard the intent removed
  rather than a behaviour it chose; the intent is silent on what should happen if
  it were removed again. This reconciliation decides, now, that both an unbuilt
  corpus and an absent embedding binding are ordinary silent states, because the
  intent's own governing rule for this path — "a missing corpus degrades to no
  knowledge tools, never to a boot failure" — applies to both, and the two are
  indistinguishable to the person holding the conversation.
- **"Reaches no filesystem" is a criterion about the shipped artifact, not about a
  passing turn**, for the reason already established for the archive: the
  filesystem module resolves in that runtime and hands back per-instance scratch
  space, so a file-backed corpus would pass a turn and be empty in production. The
  intent names this ("must not reach `node:fs` transitively"), and it is carried as
  an observable over the artifact rather than folded into the search criteria.
- **The pairing of the surface and the priming is claimed here, on the session
  side.** The intent states it as a mechanism ("search the AI never learns to reach
  for is the same failure as no search at all"). The observable — the two arrive
  together or neither does — belongs to what a conversation is offered, which this
  story owns, whereas producing the artefact they are built from belongs to
  STORY-117.
- **AC-1318 is untouched.** The grant is filled from the same single declaration on
  both hosts and still names the shipped corpus alone. REQ-159 declared a second,
  tenant-scoped knowledge base in the same file, but it is deliberately not wired
  into this session, so nothing about this story's grant has changed.
- **Not claimed here: what the release build emits.** That the corpus and its
  indexes are emitted as an importable module, that the module is written on every
  build carrying nothing when no corpus exists, and that a build with no corpus
  says so in its report, are claims about the build and belong to STORY-117. This
  story consumes that artefact and claims only what a conversation does with it.

## Dependencies

The declared control surface the assistant acts through, and the browser pane
that renders the conversation, are related work that must not be re-derived here.
The store the transcript and audit are written through is the site-store
capability (capability-c4c7a854), and the origin that hosts the routes is CAP-85
(story-e674c60a). The knowledge half additionally depends on the system knowledge
base having been built *and*, for the deployed host, on that build having emitted
it as an artefact the release can carry (STORY-117 / story-c4f329d3) — but only
for its knowledge criteria; every other criterion holds with no knowledge base
present at all.

## Story Points

3
