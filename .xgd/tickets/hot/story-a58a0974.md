---
uid: story-a58a0974
id: STORY-103
type: story
title: Hold one continuing conversation about my site with an assistant that can only
  act on that site
created_by: xgd
created_at: '2026-08-10T08:34:38.465488+00:00'
updated_at: '2026-08-31T10:41:13.164177+00:00'
completed_at: null
last_field_updated: updated_by
status: updated
fields:
  intent_uid: bundle-e59210c5
  capability_uid: capability-7e4714b7
  story_kind: upgrade
  story_points: 3
  uat_coverage: pass
  updated_by:
  - bundle-77b28def
  - bundle-b3b7c399
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
  two cannot come to mean different things.
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
  one can be read by the other.
- **Honest failure** — a refused operation the assistant corrects within the same
  turn with the site untouched; a missing prerequisite explained to the operator
  alongside their history rather than instead of it; a conversation identifier
  the host never issued refused outright before anything is streamed; a failure
  after streaming has begun delivered inside the stream so nothing is left
  hanging. A knowledge base that was never built is not a failure at all — it is
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
  and the rule by which a document is a member of the corpus are their own
  capability (STORY-117 / story-c4f329d3). This story claims only what a *built*
  knowledge base does when it reaches a conversation, and what a conversation
  does without one.
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
- **Degradation is not failure, and the two are distinguished.** No knowledge base
  built is the pre-knowledge assistant — tools but no documents — and is reported
  to nobody, because nothing is wrong. A knowledge base that was built and then
  fails to open (most often because the embedding credentials are absent) is
  reported to the operator on the origin's error output while the conversation
  still opens, because the two situations have very different fixes and must not
  look the same. The deployed edge runtime is a third instance of the *ordinary*
  state: the corpus bridge is bound to the operator's filesystem, so a
  conversation there runs on its site operations alone, silently, exactly as one
  on a workspace that never built a corpus does.
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
- **The system knowledge base sits above tenancy, and this repo has no tenancy
  yet.** REQ-123 records the design a later store ticket inherits — the corpus is
  a release artefact that takes the scope parameters and does not vary by them,
  so identical query text yields identical results for everyone. Recorded here
  because it is why per-tenant knowledge bases can be added later without
  revisiting this wiring; nothing tenant-scoped is claimed or built by this story.
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

## Dependencies

The declared control surface the assistant acts through, and the browser pane
that renders the conversation, are related work that must not be re-derived here.
The store the transcript and audit are written through is the site-store
capability (capability-c4c7a854), and the origin that hosts the routes is CAP-85
(story-e674c60a). The knowledge half additionally depends on the system knowledge
base having been built (STORY-117 / story-c4f329d3) — but only for its knowledge
criteria; every other criterion holds with no knowledge base present at all.

## Story Points

3