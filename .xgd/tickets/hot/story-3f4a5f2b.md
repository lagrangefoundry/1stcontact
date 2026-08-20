---
uid: story-3f4a5f2b
id: STORY-118
type: story
title: 'Site Storage Port: One Async Store Behind Every Edit, Provable In The Workers
  Runtime'
created_by: xgd
created_at: '2026-08-20T05:08:58.535662+00:00'
updated_at: '2026-08-20T15:43:20.982587+00:00'
completed_at: null
last_field_updated: body
status: completed
fields:
  intent_uid: bundle-77b28def
  capability_uid: capability-c4c7a854
  story_kind: feature
  story_points: 3
---

## Story

**As a** platform operator building toward a Cloudflare-hosted builder,
**I want** every site-editing command to reach storage through one small, asynchronous set of
operations that never names a location and takes a whole change as one call, with the actual
store chosen at start-up, and to be able to run tests inside the Workers runtime against real
database and object-store bindings,
**so that** site definitions and asset bytes can move off my machine's filesystem without any
command, any error message, or any test changing with them.

## Description

Today the operator's sites live in a git-tracked tree on their own machine. Tomorrow they live
in Cloudflare's database and object store. This story is the thing that makes that a swap
rather than a rewrite: **storage becomes something the editing surface asks, not somewhere it
is.**

**What storage is asked.** One declared set of operations covers everything the editing surface
needs: does this site have a draft; read its definition; read its pages; apply one whole change;
list its assets; read one asset's bytes; read its change count; record a change; read the
changes since a given count; report what the draft has pending against the revision it descends
from; assemble and validate the current draft. Every one answers asynchronously — including the
ones a filesystem could answer immediately — because a store with a fast half and a slow half is
a store callers learn the shape of, and the whole point is that they cannot tell which one they
got.

**No operation hands back a location.** An asset that came back as an absolute filename would not
be a convenience, it would be the filesystem leaking through the seam, and a caller that took one
is a caller a Cloudflare store could not serve. Assets cross as bytes in both directions. The one
string that resembles a path — a page's name, `home.json` — is a *key*: what the page is called in
the store, never carrying a directory component.

**One change is one call.** Several commands genuinely change more than one thing at once —
renaming a palette entry rewrites the site definition and every page referencing that entry;
removing a page rewrites the navigation and deletes the page. Each of those reaches storage as a
single whole change (definition + pages written + pages removed + asset bytes + assets removed).
That shape is what lets a transactional store make them atomic later without a single caller
being revisited.

**The seam is asserted over the imports, not only over a run that behaved.** The editing
surface's own module, and the port's supporting modules with it, name no filesystem module at
all — neither the runtime's file and path modules nor the tree's own filesystem helpers. That is
a separate claim from anything a passing command can demonstrate: under the Node compatibility
flag the Workers runtime *resolves* a filesystem import and hands back a per-isolate filesystem
that evaporates with the isolate, so a command that quietly reached for a file would satisfy every
behavioural assertion here and still lose the operator's work in production. Only a check over
what these modules import can carry it.

**Two stores, both current, neither detected.** The operator's filesystem tree and a store with no
filesystem at all are both live. Neither is a preserved old path and nothing chooses between them
at runtime — the store is named once at start-up, by the command line, by the builder origin and
by the assistant's tool adapter, and every command downstream simply takes what it was given. The
filesystem-free store is not a mock: it holds real definitions, applies real writes, keeps a real
change count through the same arithmetic, and validates through the same assembly path, so a test
that passes against it passes because the surface works and not because a double was told to
agree.

**Everything an operator sees is unchanged.** `1c copy set`, the palette commands, the asset
commands and the builder's editing routes accept the same arguments, produce the same output and
refuse with the same envelope — a code, the path the refusal concerns, and a hint, reaching the
browser as a 400 carrying those three. `1c asset add <file> --as <name>` still takes a path on the
operator's own machine and still refuses a missing source with the same not-found envelope; what
moved is which layer opens the file, because a path on the operator's disk is a *source*, outside
the site, and means nothing in a Worker.

**And the claim is checked where it will run.** Tests execute in two runtimes routed by filename
alone: a file marked with the workers suffix runs inside the Workers runtime with a real database
binding and a real object-store binding, under the same compatibility settings the deployed
Workers declare; every other test runs in the runtime that has a filesystem and keeps the Astro
container-render path the previous single configuration existed for.

### In scope

- The declared storage operations, their asynchrony, their totality, and the absence of any
  location-shaped return value.
- The editing surface and the port's own modules reaching no filesystem *in their imports*, not
  merely in their behaviour — the seam asserted over the import graph rather than inferred from a
  suite that passed.
- One whole change as one storage call, for every command that changes more than one thing.
- Two live stores — filesystem-backed and filesystem-free — chosen at start-up, with identical
  observable behaviour for the same starting site.
- The editing surface, the builder's preview of a draft, and the assistant's tool adapter all
  driven through the store they were given.
- Unchanged command-line surface, output and refusal envelopes.
- Two test runtimes, routed by filename, with real database and object-store bindings in the
  Workers one and production compatibility settings.

### Out of scope

- **The Cloudflare store itself** (database + object store adapter) — deliberately separate, and
  the reason this story's correctness claim is checkable at all: if the seam is right, the whole
  existing suite passes unchanged.
- **Multi-file atomicity.** The filesystem store applies a whole change as a sequence of writes
  and is not atomic; it carries today's characteristics forward and improves them nowhere. The
  one-call shape is what lets a later store be atomic without touching a caller.
- **What a change record contains, what the counter means, and how a caller reads changes back**
  — the change journal is its own capability; this story owns only that those questions are asked
  of the store like every other, and therefore answer over a store with no filesystem.
- **Publish, checkout, render and history**, which stay on the filesystem directly; scope was held
  to the editing surface.
- Deploying anything, or serving a published site — a different store, on the far side of a
  deploy.

## Technical Context

**Relationship to existing capabilities.** This is the seam DOC-12 §7 always described ("the
Worker reaches storage through a single accessor; phase 2 swaps only its implementation") and
which was, until now, true of the read path and false of the write path. It sits *underneath*
CAP-86 (Structured Copy Editing — what a validated, atomic edit *means*) rather than beside it,
and underneath CAP-99 (Draft Change Journal — what a change record *says*). CAP-85's builder
origin owns request confinement and freshness, not the store's shape; CAP-82 (deploy and public
serving) owns a different store entirely, on the far side of a deploy.

**Deliberate non-behaviours, recorded rather than absorbed:**

- **The filesystem store is not atomic.** A whole change lands as a sequence of writes and a
  crash between two of them leaves the draft half-written — exactly as before this work. Do not
  write an acceptance criterion asserting atomicity of the filesystem store; the atomicity claim
  belongs to the later transactional store.
- **The filesystem-free store is not a revision store.** It reports every file as pending against
  no base revision, which is precisely what a site that has never published reports. Publishing
  and checkout remain filesystem-only.
- **Preview trades streaming for buffering.** A draft asset is now read into memory rather than
  streamed, because bytes are what a location-free store can hand over. It is the one behaviour
  this seam costs, and it lands on an operator serving their own draft assets to their own
  browser.
- **Asset-name confinement is carried, not introduced.** The filesystem store refuses to resolve
  an asset name that would escape the site's assets; the origin-level confinement rule is CAP-85's
  and is not restated here.

**Known divergence between the tree and its own explanation.** The workers test configuration
carries a rationale comment stating that the test-pool version is pinned exactly because a
caret would pick a release whose platform binary is withheld by a supply-chain policy. **That
diagnosis was retracted after promotion.** Four controlled experiments identified the actual
cause as the package manager's incremental resolution dropping a package's optional dependencies
when adding a second version of it, so the binary was never linked; the same crash later
reproduced through a dependency the pin does not govern at all. The pin is harmless and did hold,
but it is not load-bearing for the stated reason, and the comment is stale in the tree pending a
decision. **Acceptance criteria here are deliberately written about the routing convention and
the bindings — which are the deliverable — and encode neither the pin nor its rationale.** A
later reader should not re-derive the retracted theory from the comment.

**Suite state at the time of reconciliation, and its attribution.** The full suite has failures
that are *not* attributable to this work: the failing set was verified byte-identical against the
pre-split configuration, and again against the pre-port branch — same files, same counts, no
assertion changed. The cause is upstream: the shared AI toolbox now returns an object where
refusals used to be a string, and its run entry point became asynchronous. Two suites were
repaired here only because making writes genuinely asynchronous caused them to regress (they had
un-awaited calls that previously won a race against a synchronous write); the remaining suites in
the same condition were deliberately left alone, and closing them belongs to whichever intent owns
the toolbox upgrade.

**Survey hazard.** Two of the heaviest consumers of the editing surface contain deliberate NUL
bytes as cache-key separators, so a plain recursive grep classifies them as binary and skips them
silently. Any survey of who calls what here must force text mode, or it will report a consumer
that does not exist.

## Dependencies

None. (This story is what the Cloudflare store adapter builds on, and what every store-level test
after it runs in.)

## Story Points

3