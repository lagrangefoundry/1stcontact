---
uid: bundle-203b1dc2
id: BUNDLE-23
type: bundle
title: REQ-164 + REQ-159 + REQ-165 + REQ-163 + REQ-161 + 2 more
created_by: xgd
created_at: '2026-09-02T17:48:26.715962+00:00'
updated_at: '2026-09-02T17:48:26.715962+00:00'
completed_at: null
last_field_updated: created_at
status: ready_to_reconcile
fields:
  commits:
  - working_sha: 858d63202fae2badbaf3e8495363244f8bd3a9fd
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: c056002a525bf126e635f32118b64e2c76ad3ab0
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: 115f0d39ec5f8787751f144cda8b5d3c6279fbf9
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: 52fd6302cc92deaebf47a2c8230a225c4c65b616
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: d99c1f438572f2da868db0bc384c798858681cac
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: 855dd57a7c765c187b5b0acb10842562bb340796
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: 482a1f984651e81351e1c96b578064e19de9aa7a
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: 27450010586c65b293b2ad5cc6243815133a17be
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: 61a0becc6122ee61948352cac03237307b292b31
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: deaf3f98c482ba39a2bf1107ecc1d1c1602a77f9
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: 9ae7338430d66054b42173f57f20ef83a22ac670
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: c2f6c582ad88ff1bf872907a8297bfe2c4a4b91e
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  auto_merge_back: true
  priority: medium
---

# Bundle

This ticket bundles the following source tickets:


---

## REQ-164: Corpus export correctness: doc_kind filter, unrestricted shipped corpus, exhaustive listing

# Corpus export correctness: the `doc_kind` filter, an unrestricted shipped corpus, and exhaustive listing

## Why these are one ticket

Three small changes to `1c kb export` / `1c kb build` that share a single failure mode: **each one silently produces a smaller corpus than intended.** No error, no warning — just an index that builds, works, and is missing documents. The symptom surfaces much later as _"the assistant doesn't seem to know about that"_, several artifacts downstream of the cause.

They also cannot land separately without leaving a window where the export is wrong. [[REQ-158]] cannot produce a corpus anyone should trust until all three are done.

## 1. The export filter reads `doc_kind`, not `system_kb`

[[DOC-39]] §3.3 settles membership as `doc_kind: system_kb` — a kind rather than a boolean, because a flag invites _"this architecture document is _**_also_**_ a system document"_, which is the category error [[DOC-39]] §3.1 exists to prevent.

State of play: the `system_kb: true` boolean has already been cleared from all 38 doc tickets, and four documents have been chosen for reclassification — DOC-33 (Consultation Playbook), DOC-35 (Personas, Modes & Registers), DOC-31 (Differentiation Audit) and DOC-17 (Design Lessons Log). They are a _starting_ corpus flagged for rewriting, not the finished set: all four were written for us rather than for the AI ([[DOC-39]] §3.5).

**Blocked on xgd REQ-827**, which adds `system_kb` to the `doc_kind` enum — the enum is closed and defined in xgd source, so the value cannot be set until it ships.

## 2. The shipped KB's corpus becomes unrestricted

Today the KB config re-applies `type=doc AND fields.system_kb=true` **at query time**, against a directory where everything already matched by construction. It is a build-time filter being re-run as if it were a membership rule, and it is most of why this looked like more mechanism than it is ([[DOC-39]] §3.3).

At runtime the distribution _is_ the corpus: a directory of markdown served through the ticket interface by a read-only store. So `corpus: {}`.

Leaving the predicate in place has a real cost beyond redundancy — a file placed in the corpus directory without the expected frontmatter is silently invisible.

## 3. `readDocTickets` must list exhaustively

```
const raw = execFileSync('xgd', ['ticket','list','--type','doc','--view','--json'], …)
return (JSON.parse(raw).items) ?? []      // takes page one, ignores next_cursor

```

`xgd ticket list` pages at 50. There are 38 doc tickets. At 50 the export begins dropping documents with no error and no warning — the JSON envelope carries `next_cursor`, and this consumer never looks at it.

xgd REQ-825 has landed and added an exhaustive affordance; use it rather than hand-rolling a cursor loop.

## Why the count is close enough to matter

38 of 50. Two more documents than we have and the corpus starts shrinking silently — and this line of work adds documents.

## Acceptance

- The export selects exactly the doc tickets carrying `doc_kind: system_kb`, and the four named documents carry it.

- The shipped KB declares an empty corpus; a markdown file placed in the corpus directory is indexed regardless of its frontmatter.

- `readDocTickets` returns every matching ticket, asserted against a fixture larger than one page.

- `1c kb status` reports a document count that matches the number of tickets carrying the marker — so a truncated export is visible rather than inferred.

## Depends on

xgd **REQ-827** (the `doc_kind` enum value) for part 1. Parts 2 and 3 are independent of it and of each other, but shipping them apart leaves the export wrong in a different way each time.

---

# What landed

Both blockers had already shipped in the installed `xgd` (0.15.419) when this was implemented: `system_kb` is in the `doc_kind` enum, and `ticket list --no-limit` exists. Nothing was deferred.

## 1. Membership is the kind

`tools/generate/src/cli/kb.ts` — `INCLUDE_FIELD`/`optedIn()` are **replaced**, not extended, by `DOC_KIND_FIELD` + `MEMBER_KIND` and `inSystemKb()`. The retired boolean is no longer honoured at all: a document still carrying `system_kb: true` from before the change is not a member, because honouring it would put a document in front of a client-facing assistant on a marker nobody maintains any more.

`fields.doc_kind` was chosen over a field of our own for the three reasons in [[DOC-39]] §3.3 — it is single-valued (so §3.1's exclusivity is enforced by the shape rather than by discipline), it already means exactly this, and it stays clear of `fields.kind`, which the knowledge component owns for awareness reports.

The four named documents now carry it (DOC-33, DOC-35, DOC-31, DOC-17); `1c kb export` reports 4 documents and names all 34 non-members individually.

## 2. The corpus is unrestricted

`kb/knowledge_bases.json` and the `ensureConfig` scaffold both declare `corpus: {}`. Verified behaviourally, not just structurally: a bare markdown file with no frontmatter at all, dropped into the corpus directory, is now resolved by `resolveCorpus` — the case the old predicate dropped silently.

Both are asserted, because `ensureConfig` never overwrites an existing declaration, so the shipped file and the scaffold can drift apart with no error.

## 3. The listing is exhaustive, and truncation is refused

`readDocTickets` passes `--no-limit` **and checks the envelope it gets back**. `--no-limit` is upstream's promise; the check is the assertion that it was kept. If a truncated page arrives anyway — an older `xgd` on `PATH`, a flag that stops meaning what it means — that is a loud failure naming the flag, because a quietly shorter corpus is the exact thing this ticket exists to prevent. `maxBuffer` went 64MB → 256MB, since the call now returns the whole store rather than a page.

## 4. A short corpus is visible, not inferred

`KbStatus` gains `tickets: number | null` — how many doc tickets carry the marker — and `1c kb status` prints it on the corpus line:

```
corpus: 4 document(s) (of 4 ticket(s) carrying doc_kind: system_kb)
corpus: 2 document(s) ⚠ 3 ticket(s) carry doc_kind: system_kb — the corpus is stale; run `1c kb export`
corpus: 4 document(s) (ticket store unreadable — cannot check)

```

`null` rather than `0` when the store cannot be read: zero is a real and alarming answer, and manufacturing it from an unrelated failure would send an operator to rebuild a corpus that was never broken. This is the one place `readDocTickets`' failure is swallowed — export and build both still want it.

## Design decisions made during implementation

- `kb status`** shells out to the ticket store.** The acceptance criterion asks for a count that _matches the tickets carrying the marker_ — which a files-on-disk count cannot show on its own, since 37 documents looks exactly as healthy as 38 unless something says what the number should be. So status asks both sides and prints them together. Cost: `status` is no longer pure-filesystem.

- **The envelope check was added beyond the stated scope.** Passing `--no-limit` alone would leave the same class of failure reachable from a stale `xgd`, and the failure is silent by nature.

- **No back-compat for the boolean.** Per the simplicity mandate: replaced, not extended, so there is one membership rule rather than two.

## Test plan

`tests/test_UAT_FC_REQ-164_corpus_export.test.ts` — 12 UATs, in four groups matching the acceptance criteria. Only the ticket store is stood in for (an `xgd` shim on `PATH` that is handed the real argv, so whether the export actually asks for every page is observable); the export's own JSON parsing, envelope check, membership filter, rendering and sweep run for real, as do the real `DocDirStore` and the real corpus resolution.

- membership: a mixed store of 7 tickets across 5 field shapes, including the retired boolean; the CLI skip line names the field and the value

- unrestricted: the scaffolded declaration, the shipped declaration, and the behavioural proof over three files (full frontmatter / no `fields` block / no frontmatter at all)

- exhaustive: a 60-ticket fixture — larger than one page on purpose, since a smaller one passes vacuously, which is how the bug survived; plus a store that truncates regardless (refused) and one that fits in a page (accepted)

- status: agreement, discrepancy, and an unreadable store

The two ACs that assert what the _command_ prints move the repository's real corpus aside and restore it, since `1c kb export` takes no root argument.

**Superseded tests.** `tests/reconciliation-system-knowledge-base.test.ts` and `tests/test_UAT_FC_REQ-123_system_kb.test.ts` pinned the boolean-flag rule and are updated to the kind — implicit supersession, this intent being the later one. Both now assert that the retired boolean is _not_ membership.

**Also repaired**: two UATs left red by the upstream `prompt` → `description` rename (020ec40610), which had been failing since. Out of scope strictly, but a red suite is not evidence, and these are the suites this change is evidenced by.

## Verification

- KB scope: 6 suites, 55 tests, all passing (`test_UAT_FC_REQ-164_corpus_export`, `reconciliation-system-knowledge-base`, `test_UAT_FC_REQ-123_system_kb`, `test_UAT_FC_REQ-123_session_knowledge`, `reconciliation-assistant-conversation-knowledge`, `naming`)

- Full sweep: 2059 tests, 15 failing across 7 suites — **all pre-existing**. 9 reproduce identically on the untouched baseline; the other 6 are the known full-run `dist-assets` interference and pass in isolation. None touch the KB.

- `npx tsc --noEmit -p tools/generate/tsconfig.json` clean

- End to end against the real store: `1c kb export` → 4 documents, 34 named skips; `1c kb status` → `corpus: 4 document(s) (of 4 ticket(s) carrying doc_kind: system_kb)`

## Commits

- `858d63202f` — the three fixes, the status count, and the UATs (version 0.2.21)

- `c056002a52` — version re-bump to 0.2.22; 0.2.21 was claimed at the working tip by a concurrent session's ticket auto-commit before `move-to-free-coded` ran


---

## REQ-159: The project knowledge base: tenant-scoped corpus, incremental index, and the map's two triggers

# The project knowledge base: tenant-scoped corpus, incremental index, and the map's two triggers

## Why

[[DOC-38]] §8 declares two knowledge bases. `1c kb` ships the static one.
This is the other half — the client's own knowledge, which is the half that makes
the builder AI know anything about *this* business rather than about websites in
general.

[[DOC-39]] is the specification; this ticket implements §3, §4 and §7 of it. It
should not re-decide anything that document settles.

## The corpus

Types `chat`, `material`, `reference` and `brief` in the **tenant's own ticket
store** — so the KB declares no `source` and reads the project store, unlike
`system` which is `shipped`.

**Tenancy is bound once, into the handle**, never passed per call
([[DOC-10]] §4.1, §4.3). The KB scope and the store scope are the same shape at
different strengths: the tenant is a hard barrier, the site is a predicate — and
that difference is deliberate, because two sites belonging to one client *should*
share accumulated knowledge.

## Index residency: not the bundle

The system index lives in the Worker bundle. **That decision does not
transfer and must not be copied here.** This corpus is tenant data, differs per
tenant, and is written continuously, so it goes behind the R2 or store-backed
`IndexSource` path. Same seam, different implementation.

## Two clocks, two triggers

Per [[DOC-39]] §4, and the failure this ticket exists to avoid is running both
off one trigger.

**The index is a change-feed consumer.** `corpusPredicates(spec, {since})`
restricts to `updated_at >= cursor` and re-embedding is idempotent, so there is
no "reindex the project KB" operation in normal running.

| Corpus member | Index | Map |
|---|---|---|
| Transcripts | every ~N thousand characters | **never** |
| `material` / `reference` / `brief` | on write | **rebuild** |

**Transcripts never trigger a map rebuild.** The territory "conversations with
this client" is stable from the first turn and its description never usefully
changes — the AI already knows it is in a conversation. They still need index
freshness, because search over transcripts answers what the live context cannot:
earlier turns, and *other sessions on the same site*.

**Material does trigger one, because an upload is a request for attention.** The
client is not being thorough; they want to discuss it now.

**The rebuild is asynchronous.** A map build is cluster + an LLM describe per
territory + a validating search per candidate access point. Run synchronously on
upload it stalls the AI exactly when the client is waiting to talk about their
document. Async is safe because search needs only the index — see [[REQ-160]],
which makes the arrival visible without waiting for the map.

## The floor: enumerate, then cluster

A new tenant has three documents, and clustering three documents into territories
invents topology. Below the floor the landscape section is a **complete listing**
and is **labelled as complete**, so a short list reads as *"you know everything
there is"* rather than *"knowledge here is thin"*.

The threshold is a **character budget**, not a document count: the map exists only
because a corpus does not fit, so full enumeration is the better case, not the
degraded one.

## Out of scope

- **Seeding, the delta channel and the change-feed operation** — [[REQ-160]].
- **The site source adapter** ([[DOC-38]] §8.3) — a later corpus member; nothing
  here should assume it is absent or present.
- **Attachments** — `material` tickets carry their text shadow in the body, which
  is all the corpus reads, so this does not wait on bytes.

---

# What landed

Commit `115f0d39ec`, version `0.2.23`.

## `kb/knowledge_bases.json` — one declaration file, two knowledge bases

`project` is declared beside `system`: corpus `[chat, material, reference,
brief]`, `landscape: derived`, **no `source` key at all** (so it reads the
project store), and **no site term** (tenant-wide by design).

**Each host names the knowledge bases it serves**, rather than a filter guessing
from a field. The release build has the shipped corpus and serves `system`; the
Worker has the tenant's D1 store and serves `project`. So `bindKb` was narrowed
to return `system` alone — without that, adding `project` to the shared file
would have made the release build resolve a tenant corpus against a read-only
directory of design documents and report it as searchable and empty, plus emit a
priming section apologising for a map that host will never build.

`ensureConfig` scaffolds both halves, so a fresh checkout gets a complete file;
a UAT pins the scaffold against the committed file so the two cannot drift.

## `apps/control-app/src/knowledge.ts` — the capability

- `projectKnowledgeFor(env, opts)` opens the KB for one tenant. Store, index
  prefix and blob bucket all derive from the one `TENANT_ID`, so there is no
  argument anywhere on `ProjectKnowledge` that could name another account.
- `r2IndexSource(bucket, prefix)` — the component's four-method `IndexSource`
  over R2. Keys are `kb/<tenant>/project/{index,chunks}/…` in **BLOBS**, never
  SITES: the index is a derivative of the client's private material and must live
  where nothing can serve it. Outside `t/<tenant>/blob/`, so no attachment key
  can address it.
- `refreshIndex()` — `buildIndex` + `buildChunkIndex` against the persistent
  source. Incremental by the component's own manifest.
- `onMaterialWritten({describe})` — awaits the index refresh (searchable at
  once), then hands `rebuildMap()` to an injected `Deferral` seam. `waitUntil` in
  a Worker, a list in a test. It ships a driven operation, not a scheduler,
  because where the rebuild runs is still open.
- `onTranscriptGrew(uid, chars)` — indexes only past `TRANSCRIPT_INDEX_CHARS`
  (4000), and never touches the map. The per-session cursor lives beside the
  index as `transcripts.json`, not in `fields`: it is derived data, and a
  bookkeeping counter does not belong on a ticket type the AI component owns.
- `landscape()` / `enumeratedLandscape()` — the floor. Nothing is bolded in the
  enumerated body, because the component reads a bolded term as a *validated*
  search access point and a listing validated nothing.
- `DescriberNotConfiguredError` when the corpus is above the floor and no
  describer was supplied — see the gap below.

## Decisions taken, and one supersession

- **The enumerate budget follows [[DOC-39]] §7, not this ticket's own body.**
  The body proposed "title plus ~200 characters per document" inside a 2–4KB
  budget; §7 settles it as **titles only, ~1KB**, because an excerpt conveys
  content and §6.1 says that is not the listing's job. The excerpt survives as a
  per-entry fallback for an uninformative title (a bare filename, or none), which
  is the narrow exception §7 allows. The ticket said DOC-39 is the specification
  and should not be re-decided, so it was not.
- **Wired into the session? No — that is [[REQ-160]].** REQ-160 owns priming,
  the delta and the change-feed operation and names this ticket as its dependency
  ("there is a corpus that changes"). What lands here is the corpus, the index,
  the triggers and the landscape; REQ-160 assembles the landscape into priming
  and REQ-161/REQ-163 call the material trigger from an actual upload path.
  So the acceptance's behavioural test ("ask a question answerable only from the
  document") is proved here as far as it can be — the document is indexed and
  `search()` returns it — and completed by REQ-160.
- **`system`/`awareness_report` declared in the product TypePack.** The store
  refuses an undeclared type, so the first map rebuild would have failed
  validation. Spelled from the component's own `AWARENESS_REPORT_TYPE` /
  `AWARENESS_REPORT_KIND` / `KB_FIELD` — the same `(type, kind, kb)` triple its
  lookup queries on and its corpus recursion guard excludes.
- **A third generated shim.** `1c assets` now writes
  `src/generated/knowledge.js` beside the AI and ticketing ones — same
  out-of-repo store, same bare-specifier hazard from a linked worktree, same
  single resolution point. The package **root**, which the component guarantees
  is the Worker-safe half.
- **`[ai]` binding added to `wrangler.toml`, both halves.** The embedder is
  Workers AI's `bge-small-en-v1.5` reached in-datacentre — the same model
  `1c kb build` indexes the system KB with over REST, so build-time and
  query-time vectors agree by construction and this side carries no credential.

## Known gap

**The clustered path needs a describer the Worker does not have.** The bridge's
own (`@lagrangefoundry/ai-knowledge/describe`) is Node-only because it needs the
provider backends. So `describe` is a required injected seam above the floor and
`DescriberNotConfiguredError` names it when absent — the previous map stands
rather than being replaced by a mechanical paragraph. Below the floor, which is
the near-term reality for every new tenant, no model call is needed at all.
Building a Worker-side describer on the AI component's Claude backend is a
follow-up.

## Test plan

`tests/test_UAT_FC_REQ-159_project_kb.workers.test.ts` — 12 UATs inside workerd
against real D1 and real R2, through the real `@lagrangefoundry/knowledge`
component. The only double is the embedder, which is the component's declared
model seam; `tests/support/stub-embedder.ts` gives the argument, and miniflare
has no local Workers AI to reach in any case.

- tenant isolation: two accounts, same query, and B cannot see A's document —
  rows *and* vectors, since isolating one while sharing the other would leak a
  body snippet;
- index residency: the four index files are asserted present in BLOBS under this
  tenant's prefix, and absent from SITES;
- incremental: three documents cost 3 then 1 then 0 embeddings, measured by the
  embedder's own call counter rather than inferred from a returned tally;
- transcripts: below the threshold nothing happens; above it the transcript is
  searchable **and `publishedMap()` is still null**; the cursor advances;
- material: with a describer blocked on a barrier, `onMaterialWritten` has
  already returned, the document is searchable, the map is unpublished and the
  rebuild is in the deferral list — then released, and the map appears;
- the floor: enumerated below, `clustered` above, "complete listing" said in
  words, no `**` anywhere, an excerpt only for an uninformative title, and a
  four-document listing that still exceeds the budget (a count-based floor would
  get that wrong).

`tests/test_UAT_FC_REQ-159_project_kb_config.test.ts` — 8 UATs pinning the
declaration's shape, the AI binding on both wrangler halves, the scaffold against
the committed file, and every name in the generated shim against the component
(the `.d.ts` types them all as `any`, so an upstream rename surfaces here or not
at all).

Regression scope: the whole workerd project (13 files, 110 tests, all passing)
and the whole node project. Nine node files fail in this worktree; each fails
identically at the branch point with these changes stashed, and they are the
known linked-worktree artifact (builder/webui assets 404) plus two KB suites
already broken by the upstream `prompt` → `description` rename.


---

## REQ-165: Projected reference: the products own facts, generated rather than authored

# Projected reference: the product's own facts, generated rather than authored

## The hole this fills

[[DOC-39]] §3.1 excludes architecture documents from the system knowledge base,
and that is right — they are written to justify engineering decisions to
ourselves, not to advise a client. But it leaves a gap that only appears once the
exclusion takes effect.

After [[REQ-164]] flips the export filter, the AI's system corpus is a handful of
consultation documents and **nothing that says what the product does**. No module
catalogue, no L1 vocabulary, no control-surface reference. It will discuss design
well and be unable to say what a module is.

## The answer is not to write it down

Two obvious repairs are both wrong:

- **Tag the architecture documents into the KB** — breaks [[DOC-39]] §3.1's
  exclusivity, and feeds the AI rationale about rejected alternatives.
- **Write system-KB counterparts** — two sources of truth for one fact, drifting
  apart silently. Exactly the failure [[DOC-10]] §6 records.

[[DOC-39]] §3.2 takes the third option, and it is already precedented twice here:
the tool manual is **projected from the declared surface** so instructions and
tools cannot drift ([[DOC-10]] §5.1), and capture mapping runs against the **live
module registry** rather than a written catalogue ([[DOC-13]] §8).

So: **machine-readable facts are generated from their source of truth, never
authored.** A projected reference is not a document anyone maintains and cannot
go stale.

## What to project

| Source of truth | Projection |
|---|---|
| the live module registry | what modules exist, their dials and ranges |
| the L1 schema ([[DOC-23]], [[DOC-27]]) | the layout vocabulary and what each term means |
| the declared control surface ([[DOC-30]]) | what the AI can change, and how |

## Where it goes

Into the shipped corpus at build time, beside the authored `system_kb` documents
— same directory, same index, same awareness map. The AI should not have to know
which of its knowledge was written and which was generated; it asks a question
and gets an answer.

That means the generator runs in the release build, before `1c kb build`, and its
output is a corpus member like any other.

## Out of scope

- **Authoring system-KB documents** — [[DOC-39]] §3.5, deliberately deferred.
- **Changing any of the three sources.** This reads them.

## Acceptance

- A build step emits projected documents from the three sources into the corpus.
- Changing a module's dials changes the projection on the next build, with no
  document edited by hand.
- The AI, asked what a module supports, answers from the projection.
- No projected fact is also stated in an authored `system_kb` document — asserted
  by review, since the whole point is one source per fact.

---

## What landed

A projector (`tools/generate/src/cli/kb-projection.ts`) and a second corpus
producer beside the ticket export (`writeProjections` in
`tools/generate/src/cli/kb.ts`), run by `1c kb export` and by the assets build
before `1c kb build`.

**Three projections, one source each.** `REF-behaviors` from the framework
behavior catalogue (`CATALOG`), `REF-l1` from the L1 schemas and envelope,
`REF-surface` from the declared control surface (`ai/l1-surface.json`). Each
reads exactly one source and reads no document: every sentence is either
rendered from the shape of the source or lifted verbatim from prose the source
itself carries (a declaration's `description`, a schema's doc comment). A
projection that copied a sentence out of an authored document would recreate the
two-sources failure this ticket exists to avoid; one that invented a sentence
would be a fact with no source at all.

**One catalogue per source, not one document per module.** The granularity
question above is answered by chunk retrieval: a chunk is only useful if it is
coherent alone, and with two behaviors in the catalogue a per-module split
produces documents too small to cluster and a map territory per module. It stays
one document per source until a single module no longer fits a chunk.

**A projection is not `renderManual`.** The shared AI library already projects
the same `l1-surface.json` into a tool manual, and this deliberately does not
call it. A manual is projected *through a grant* — the operations one role was
given, in the second person, as instructions. A reference describes the whole
declared surface to a reader asking what the product can do. One source, two
renderings; §3.2's rule is one source per fact, not one rendering.

### Consequences that had to be decided

- **Two producers, two namespaces, one sweep each.** Projections are named
  `REF-*` and the ticket export's sweep spares that namespace, while the
  projector sweeps only `REF-*`. So a withdrawn document is deleted and a
  withdrawn projection is deleted, and neither producer can delete the other's
  output whatever order they run in. Without the split, a build could lose a
  projection to ordering, and a KB test fixture that supplies its own stubbed
  ticket store would silently get three documents it never asked for — which for
  a suite tuning a corpus to make a clustering assertion is destructive, not
  merely surprising.
- **An unchanged projection is not rewritten.** The index keys its incremental
  manifest on the file stamp, so rewriting an identical file every build would
  re-embed the entire reference every build.
- **Membership is read from the KB declaration, never hardcoded.** An exported
  ticket satisfies the corpus predicate by carrying its own fields; a projection
  has no ticket and must assert membership itself. Hardcoding today's predicate
  would drop the projections out of the KB the day it changed — the one failure a
  generated document is supposed to be incapable of, and a day that has already
  come once (the predicate was `fields.system_kb: true` until [[REQ-164]] made it
  a `doc_kind`).
- **A projection says where its facts came from, in the body as well as the
  frontmatter.** Retrieval returns passages and a passage carries no
  frontmatter, so an assistant reading a chunk mid-conversation can still say
  where the fact came from and where to go to change it. The same banner marks
  the document as rebuilt on every build, so a hand edit is known to be lost.
- **No projection cites an internal ticket.** The sources are read for what they
  declare, not for the `[[DOC-N]]`/`[[REQ-N]]` cross-references our own
  documents carry — sending a client-facing assistant to an internal ticket is a
  dead end for its reader.
- **A definition does not leak out of the shape it was written for.** The L1
  projection scopes each element kind's value sets to that kind, rather than
  pooling them into one vocabulary that would claim every shape accepts every
  value.
- **Frontmatter is the export's own dialect.** `DocDirStore` reads it, so a
  projection formatting its own would be a second dialect in one directory.

## Open questions

- **Whether projections carry into the awareness map's territories** or are
  described separately. They are a different kind of knowledge from consultation
  material and may cluster oddly beside it.


---

## REQ-163: Ingestion: from a dropped file to an indexed material ticket

# Ingestion: from a dropped file to an indexed `material` ticket

## Why

[[DOC-38]] §10 specifies the path from bytes to knowledge, and nothing implements
it. [[REQ-162]] gives the tickets somewhere to live; this creates them.

It is also the first user-visible capability in this whole line of work. Until it
exists there is no way to put a byte into the system at all.

## The pipeline

Five steps, per [[DOC-38]] §10:

1. **Store the blob.** Blob-first, then the record — a crash leaves an orphan
   blob a sweep collects, never a dangling pointer nothing can heal. Content
   addressed within the tenant prefix (`t/<tenant>/blob/<sha256>`), so the same
   file uploaded twice is one blob.
2. **Classify.** `kind` from the content type. **`rights` inferred from
   provenance, never asked** — see [[DOC-38]] §10.1, which is a decision, not a
   default: a per-file *"do you own this?"* is a legal question put to a café
   owner, is clicked through unread, and most importantly asks for information
   the client frequently does not have.
3. **Describe.** The step that makes the material findable, and the reason this
   ticket is not plumbing. Four sub-pipelines with four failure modes:

   | Input | Description |
   |---|---|
   | PDF / document | extracted text (and a decision on scanned pages — OCR or refuse) |
   | Image | a written description, from a VLM |
   | Font | family, weights, and what it is for |
   | Capture bundle | what the site is and how it looks |

   Per [[DOC-38]] §7.4 this is ours, not the ticketing component's. The component
   stores bytes and metadata.
4. **Create the ticket** with that description as its body, plus §9's fields.
5. **Index incrementally** — the `since` cursor picks it up ([[DOC-39]] §4.1).
   No rebuild. This is what makes the material searchable *immediately*, which is
   what lets the map rebuild run asynchronously behind it ([[DOC-39]] §5.2).

## Entry points in scope

- **Upload** — a file from the client (4a site assets, 4b background material).
- **Fetch** — material we pull on their behalf: an industry report, an article
  (3c).

Both converge after step 1.

## Why the body matters more than it looks

The description is what the knowledge base indexes. [[DOC-38]] §6's whole
simplification rests on it: because a photo carries a written description, the KB
indexes bodies uniformly and never learns that images exist, and there is no
second retrieval path for media. A weak description is not a cosmetic problem — it is
material that cannot be found.

## Constraints

- **25MB per blob** ([[DOC-38]] §14), enforced with a clear rejection rather than
  discovered as an out-of-memory. Measured, not guessed: the largest member
  across three real capture bundles is 7.4MB; the binding case is image-heavy
  brand-guideline PDFs at 20–50MB.
- **A capture-sourced asset may never be promoted into a site's asset library
  unless its bundle is `republishable`** ([[DOC-38]] §5). This is the most
  damaging single action available in the system — it publishes third-party
  copyright under the client's own domain — and it is one plausible tool call
  away without the gate.

## Out of scope

- **Capture → ticket.** Bundles land in the ReferenceStore and become tickets by
  the same path, but as N attachment records per member ([[DOC-38]] §9). Its own
  ticket.
- **The Library UI** — [[REQ-161]]. This ticket owns the pipeline; that one owns
  the surfaces. Either can be built first, but neither is demonstrable alone.
- **The quarantine write gate** ([[DOC-38]] §11) — the n-gram check on
  control-surface text. v1 is the prompt-level constraint plus the asset gate
  above.

## Acceptance

- A file arriving through the Worker becomes a blob, then a `material` ticket
  whose body is a usable description, and is searchable without a full reindex.
- Rights are set from provenance and never from a question.
- The same file uploaded twice yields one blob and two records.
- A blob above the ceiling is rejected with a message a non-technical client can
  act on.
- A crash between blob and record leaves no dangling pointer.
- An image's description is good enough to retrieve it by what it depicts —
  *"the kitchen at dusk"* — not merely by filename.
- The pipeline calls the index seam exactly once per created material, and the
  Worker logs when no indexer is wired.
- A degraded description (no key, scanned, unsupported) still yields a material that
  is visible, honestly described, and selectable by `description_status`.
- A fetch of a private, loopback, link-local or non-HTTPS address is refused, and
  each redirect hop is re-validated.
- Promotion of a non-`republishable` source is refused.
- Every route the origin declares carries the no-store directive — the two new
  ones included. Adding a route without a probe is a failure of the existing
  origin-wide criterion, not a new rule.

## Decisions from implementation review

**Routes.** This ticket owns exactly two — `POST /api/material` (upload) and
`POST /api/material/fetch` (URL). They are pipeline entry points, not Library
surfaces; `/api/tickets/*` and the drop overlay belong to [[REQ-161]], whose
overlay will POST to these. Treat the contract as public from the start.

**The index step is a seam.** [[REQ-159]] does not exist yet, so step 5 declares
`deps.index?(uid)` and a UAT proves the pipeline calls it exactly once per
created material. Building an index here would be building half of [[REQ-159]].

But an unwired optional hook is a silent failure of the worst kind: [[DOC-39]]
§4 is explicit that an unindexed document is **invisible**, not merely stale. So
the Worker **logs loudly when no indexer is wired**, and [[REQ-159]] promotes it
to a construction-time requirement in the manner of `ticketStoreFor(env)`.

**The image description takes a second LLM path, deliberately.** The AI component's
backend surface is text-only (`promptStream(ref, text)`) with no image content
block anywhere, so `describeImage` calls the SDK directly behind an injectable
seam. This is duplication and is accepted as temporary — **the consolidation
point is named now** ([[REQ-157]], or an image block on the AI component's
surface) so it does not become permanent by default.

**`description_status` is one mechanism for three degraded cases**, not three special
cases: no API key, a scanned PDF with no extractable text, and an unsupported
content type. In each the material is still created, is visible in the Library
with an honest description of what is missing, and is findable **by predicate**
for a later re-describe pass. `description_model` is recorded alongside it.

- **Scanned PDFs are never rejected.** Store the blob, write *"Scanned document,
  14 pages, no extractable text"*, set the status. Refusing a client's scanned
  brand book is the worse failure. No OCR in v1.
- **Regeneration is out of scope but enabled** — no automatic re-describe, and the
  two fields make a later pass a query rather than a migration.

**PDF text extraction takes a dependency** — `unpdf` (pdf.js packaged for
workerd, no native code). The fallback of filename-plus-size guts step 3, and
class 4b *is* PDFs. Two conditions: check the licence, and **measure its
contribution to the Worker bundle** — [[REQ-158]] independently plans to bundle
the KB vector index, neither ticket can see the other's footprint, and the
Cloudflare bundle ceiling is hard. Whoever lands second would otherwise discover
it. Report the measured number to [[REQ-158]].

**Fetch is a plain `fetch`, with a guard this repo does not yet have.** A
*rendered* fetch is capture ([[REQ-166]]). The guard: HTTPS only, no
private/loopback/link-local/metadata addresses, a redirect cap with
re-validation at each hop, and a size cap at the 25MB ceiling.

The guard matters more than the SSRF framing suggests. **Fetched content becomes
corpus material the AI reads**, so this is a prompt-injection path into the
assistant's context, not only a network-reach problem. Two consequences: keep the
guard, *and* mark fetched material untrusted in the manner [[DOC-10]] §5.2
already requires for retrieved content — a fetch of attacker-chosen content is a
risk even when the address is entirely legitimate.

**The asset-promotion gate ships here, unrouted.** There is no material →
site-asset promotion path today, so there is nothing to gate — which is exactly
how [[DOC-38]] §5's "most damaging single action available in the system" reaches
production ungated. Implement the function *with* its refusal now, so [[REQ-161]]
wires a surface to something already safe. It writes a `site_assets` row pointing
at the existing blob; that table exists today and this does not wait on the
`site_assets` migration.

## What was built, and where it departs from the decisions above

Five departures, each because the decision met something in the code it had not
seen. The decisions above are left as written; these are the corrections.

**1. [[REQ-159]] had landed, so step 5 is wired to a real indexer.** The seam
survives exactly as decided — `deps.index?(uid)`, proved by a UAT that counts
calls without needing an embedder — but the router's default resolves it to the
project KB's `onMaterialWritten()`, which refreshes the vector index inline and
defers the awareness-map rebuild behind it ([[DOC-39]] §5.2). The loud log is
therefore reached only when the `AI` binding is absent, which is what it should
have meant all along. A UAT now proves searchability by *actually searching*: it
uploads into a KB that already holds a document, retrieves the new one, and
asserts the old one's vector was not recomputed — which is what "without a full
reindex" means mechanically.

**2. Promotion copies the bytes; it cannot point at them.** The decision above
says the `site_assets` row points at the existing blob. It cannot: `readAsset`
resolves `site_assets.r2_key` against `SITES`, and the material blob is in
`BLOBS` — a second bucket precisely because `SITES` is bound by the Worker that
serves the public internet ([[REQ-162]]). A row pointing into `BLOBS` would 404,
and making it resolve would mean handing the public Worker a binding on the
private bucket, which is the disclosure the bucket boundary exists to prevent.
So promotion copies across that boundary, through the site store's ordinary
`write`. That is also what promotion *means*: taking something private and making
it publishable is a real act, and the byte copy is that act made honest. Nothing
waits on a migration either way.

**3. `description_status` has six values, not four.** The three degraded cases
named above are all present (`no_describer`, `no_text`, `unsupported`), plus `ok`
and two the implementation found:

- `too_large` — an image above the Messages API's own per-image ceiling, which is
  far below [[DOC-38]] §14's 25MB blob ceiling. The file is stored **whole** and
  simply not looked at: the client's photograph is not at fault, and losing it in
  order to describe it would be the wrong trade.
- `failed` — the describer was reached and threw. Kept distinct from
  `no_describer` because the two want different retries: one waits for a key,
  the other for the next attempt.

The describer never throws. An extraction failure costs findability and nothing
else — letting it reach the route would turn *"we could not read your PDF"* into
*"your upload failed"*, which is untrue and unrecoverable.

**4. Fonts are parsed, not described by a model, and WOFF/WOFF2 degrade.** A font
already carries the answer in its own `name` table — family, style, designer, and
often a sentence about what it is for, written by whoever drew it — so asking a
model to guess from the bytes would cost a call to produce something worse. SFNT
(`.ttf`/`.otf`/`.ttc`) is read directly. WOFF compresses each table with zlib and
WOFF2 with brotli, and workerd's `DecompressionStream` has no brotli at all, so
both are recorded `unsupported` rather than half-supported. The font registry
([[REQ-101]]) remains where a family's provenance lives; this only makes the
*file* retrievable.

**5. Two fields were added to the `material`/`reference` schema, plus one more.**
`description_status` and `description_model` are declared rather than left
undeclared — the engine tolerates undeclared fields, but the whole value of the
status is that a later re-describe pass is a *query* rather than a migration, and
a predicate over an undeclared field is a predicate over a convention.
`filename` joins them: the Library lists materials, and reading a name off the
attachment record would cost an `attachments` call per row. All three are
optional, because a `reference` created by a capture has no description when its
bundle lands.

### The bundle measurement, for [[REQ-158]]

Measured with `wrangler deploy --env production --dry-run`, gzip, four builds:

| build | gzip | delta |
|---|---|---|
| baseline (before this ticket) | 322 KiB | — |
| `@anthropic-ai/sdk` only | 460 KiB | **+138 KiB** |
| `unpdf` only | 939 KiB | **+617 KiB** |
| both (what ships) | **1032 KiB** | **+710 KiB** |

Both licences are MIT. The Cloudflare ceiling is 10 MiB gzip on the paid plan
(3 MiB free), so the Worker sits at roughly **10% of the paid limit** — but it
has tripled, and `unpdf` is four fifths of the increase. [[REQ-158]] plans to
bundle the KB vector index into the same Worker and should budget against 1032
KiB, not against 322.

The SDK's 138 KiB is smaller than it looks because the AI component already
brings `@anthropic-ai/sdk` in transitively; that number is the second copy
esbuild resolves from `apps/control-app/node_modules`. Consolidating the vision
call onto the AI component's own surface (departure 3's named point, [[REQ-157]])
would recover most of it.

### Evidence

Two UAT files, split by the repository's own runtime convention:

- `tests/test_UAT_FC_REQ-163_material_pipeline.test.ts` (node, 17 tests) — the
  steps that are pure functions of bytes: classification, every describer against
  a real PDF and a real SFNT font, and the fetch guard driven by a stub `fetch`.
  The guard's load-bearing test is not *"a loopback address is refused"* but *"a
  **public** address that redirects to a loopback address is refused, and the
  redirect target was never fetched"*.
- `tests/test_UAT_FC_REQ-163_ingestion.workers.test.ts` (workerd, 13 tests) — the
  whole pipeline through `route()` against real D1 and two real R2 buckets:
  blob residency in `BLOBS` and not `SITES`, dedup counted in R2, the ceiling
  refusal in a client's words with no material left behind, the crash-ordering
  property, the index seam called exactly once, the loud log, the tenant barrier
  over both rows and vectors, and both sides of the promotion gate.

Two doubles, both at model boundaries — the vision describer and the embedder —
for the reason `tests/support/stub-embedder.ts` already argues: no claim here is
about the quality of a description or an embedding, and miniflare has no local
Workers AI to reach.

One existing UAT was extended rather than worked around:
`reconciliation-builder-workspace-origin`'s AC-977 requires every route the
origin declares to carry the no-store directive, and it failed on the two new
routes exactly as designed. Both now have probes, in their rejection shape.

## Resolved after implementation (2026-08-31)

Two of the questions left open at hand-off have since been answered. Recorded
here rather than by deleting them, so what made them questions stays legible.

**Vision moves into the AI component, and the consolidation point is
lagrange-framework REQ-111 — not [[REQ-157]].** *"Image content on the backend
surface: the AI component grows eyes"* widens `promptStream`/`prompt` to accept
content blocks (`{type:'image', mediaType, data}`) behind a declared `vision`
capability, and it names this ticket as its first consumer with the direct-SDK
path here as the thing it deletes. So "who owns vision" resolves to the
component, on exactly the grounds this ticket used to justify the temporary
duplication: credentials, retry, rate limiting, the audit trail and the current
model id all live on one path or get copied onto a second.

What changes here when it lands: `anthropicImageDescriber` goes, and the
`@anthropic-ai/sdk` dependency with it — which also reclaims the +138 KiB the
measurement above attributes to the SDK. The `DescribeImage` seam itself stays
exactly as it is; it exists so the UATs do not reach the network, which remains
true either way. Only the implementation behind it changes.

One follow-up this leaves: the doc comment on `VISION_MODEL`
(`apps/control-app/src/describe.ts`) still names [[REQ-157]] as the consolidation
point, and REQ-111 should correct it as part of deleting the function.

**Re-describe splits by field: automatic where there is no description,
operator-triggered where there is one that could be better.** The two fields
answer different questions, so a single policy over both would be wrong in one
direction or the other:

- `description_status` of `no_describer` or `failed` means the material has **no
  real description** — it is not findable by its contents at all. That is a
  defect, and repairing it should not wait for someone to notice: a pass over
  those two predicates re-describes automatically once a key is configured or a
  transient failure has passed. `no_text`, `unsupported` and `too_large` are not
  defects — they are honest accounts of what the material is, and re-running them
  changes nothing.
- `description_model` naming an older describer means the description is **fine
  and could be better**. Re-describing a corpus against a new model costs a call
  per material and rewrites bodies that are not wrong, so it is an operator's
  decision rather than a background sweep.

Both remain out of scope here, as decided, and both remain a query rather than a
migration — which was the point of declaring the fields.

## Open questions

- **DNS is not resolved before a fetch**, so a hostname that resolves to a
  private address defeats the literal-host check. workerd cannot resolve a name
  before fetching it, so the guard cannot be made complete from inside a Worker.
  Recorded rather than implied — closing it needs a resolver the platform does
  not offer.


---

## REQ-161: The Library tab: list-detail over the clients material, and the drop-to-upload overlay

# The Library tab: list-detail over the client's material, and the drop-to-upload overlay

## Why

Everything the client gives us — photos, fonts, brand guidelines, positioning
papers, captures — becomes a ticket with an AI-written body ([[DOC-38]] §6). The
builder currently has no way to see any of it, and **no way to put a byte into
the system at all**. The image picker (REQ-132) lists what is already in a site's
assets and is reached by clicking an image segment; it is a field editor, not a
library.

[[DOC-8]] open item #4 asked the shape of this — *"drag-into-chat, dedicated
asset panel, AI-prompted upload step?"* — and left it open. This answers it:
**both**, because they serve different moments.

## The tab

Standard `webui/split` pane, standard `webui/list-detail`:

- **Left — the list.** `mountListDetail`'s list pane, with a **filter at the
  top**. Rows are the client's material tickets.
- **Right — the detail.** Selecting a row opens it in a detail pane that
  **reuses the editors we already have** (`mountFields`, `image-picker`,
  `color-field`, `modal`), rather than growing a second editing vocabulary.

**Scope: the Library is tenant-wide, the bindings are per-site.** [[DOC-38]] §7.7
allows one blob to back two sites, and [[DOC-10]] §4.1 makes shared knowledge
across a client's sites deliberate — their second site should not start as cold
as their first. So the list shows the tenant's material with **"used on this
site" as a badge and a filter**, never as a boundary.

**What the detail pane shows.** The blob preview, the AI-written body (the text
description — what the system understands this to be), and the fields from [[DOC-38]]
§9: `kind`, `origin`, `rights`. The description is editable: it is a ticket body, the
client may know better than the description we generated, and a correction there
improves retrieval directly.

**The rights record is shown read-only.** [[DOC-38]] §10.1 infers `rights`,
`republishable` and `exportable` from provenance precisely so the client is never
put in front of a legal question; a `republishable` they could tick by hand would
be that question with a checkbox on it. The one thing a client may change about a
piece of material is what it **says**.

## The upload overlay

Two entry points, one interaction:

1. **Drag onto the chat** in the Site tab — the conversational path. The AI asks
   *"do you have a logo?"* and the answer is to drop it into the conversation.
2. **Drag onto the Library** — the deliberate path, for material that is not part
   of the current conversation.

Both raise the same thing: a **full-screen translucent overlay**, split into
labelled areas with icons, with a single top-level instruction and one drop
target per area. **One overlay instance, two watchers** — not one overlay per
entry point.

### The areas are roles, not file types

**Proposed change to the original sketch, and the reason matters.**

Sorting by *file type* asks the client for something the system already knows —
a `.pdf` is a document, a `.woff2` is a font — while leaving unasked the one
thing that cannot be inferred: **what the file is for.**

The case that proves it: a JPEG may be a hero photograph destined for the site
(`republishable`, appears in the image picker) or a screenshot of something the
client likes, which the AI should look at and must **never** publish. Identical
bytes, identical MIME type, opposite rights. Type-based zones would be actively
wrong for it, while role-based zones capture exactly the distinction [[DOC-38]]
§4 is built on.

So: **the client chooses the role; the system infers `kind` from the content
type.** Two areas:

| Area | Becomes | `republishable` |
|---|---|---|
| **Put it on the site** | images, logos, fonts — 4a | yes; enters the asset library |
| **Just for you to read** | guidelines, papers, reports — 4b | no; project KB only |

### The role is a new field, and it narrows the rights [[DOC-38]] §10.1 infers

`role` (`site` | `reference`) joins the [[DOC-38]] §9 block on `material` and
`reference` tickets. Three properties, and each is load-bearing:

- **It is the only thing this product asks about a file.** *"Is this for the
  site, or for you to read?"* is a question about the client's own intention,
  which they answer instantly and correctly — unlike *"do you own this?"*, which
  [[DOC-38]] §10.1 refuses to ask because the client frequently does not know.
  So this **narrows** §10.1's accepted residual risk without reintroducing the
  dialog it rejected.
- **It narrows, never widens.** An absent role lands on §10.1's provenance answer
  unchanged, so the programmatic entry points that predate the question
  ([[REQ-163]]'s own path, and `ingestFetch`) behave exactly as they did. A
  malformed role is refused rather than coerced: both silent fallbacks are wrong
  in a way nobody would notice.
- **It is not derivable from `republishable`.** A capture of the client's own
  previous site ([[DOC-38]] 3a) is republishable *and* plainly reference
  material, so the two come apart the moment captures land.

### Copy

Draft, in [[DOC-35]]'s register — plain, reassuring, no jargon:

> **What's this for?**
>
> **Put it on the site** — Photos, logos, fonts. Things your visitors will see.
>
> **Just for you to read** — Brand guidelines, notes, reports. I'll use these to
> understand your business; they won't appear on your site.

The second sub-line is load-bearing, not decoration: a client uploading their
positioning document wants to know it stays private, and that is the moment to
say so.

## What happens after the drop

Both routes converge on the ingestion pipeline ([[DOC-38]] §10) — store the blob,
classify, write the description, create the ticket, index. This ticket owns the
**surfaces**; ingestion owns the pipeline.

Two visible consequences worth building deliberately:

- **A chat-route drop appears in the conversation**, so the AI has it in context
  immediately and the client can see what they sent. It is the client's own turn,
  because it is — and it reports what actually happened, including the parts that
  went wrong (a failed upload, a placement that did not land, an upload nothing
  can search yet).
- **Either route fires the delta** on the next turn ([[DOC-39]] §6.4), which is
  what tells the AI the material arrived. A Library-route upload during a live
  conversation reaches the AI by exactly the same path as a chat-route one — what
  it does *not* do is put a line in a conversation it was not part of.

### "Put it on the site" means the bytes are on the site

The first area promises the file will be something visitors see, and a ticket in
a store is not that. So a `role=site` upload made while a site is selected is
**promoted into that site's asset library immediately**, which is also what makes
a dropped logo pickable in the same second rather than after some later step
nobody has specified.

- **Through [[DOC-38]] §5's gate, never around it.** `promoteToSiteAsset` refuses
  anything whose ticket is not `republishable`, and the role writes that bit — so
  the second area is *mechanically incapable* of reaching a published site rather
  than merely not routed there. This is that refusal's first real caller.
- **It never overwrites an asset already there.** A store write puts bytes at a
  name and says nothing about what was there, so a second `logo.png` would
  silently replace a picture that is live on the client's site. Promotion picks a
  free name (`logo-2.png`, suffix before the extension) and reports the one it
  used.
- **A failure here does not lose the upload.** The material is stored, described
  and indexed by the time promotion runs; a store that refuses the write is
  reported in the envelope rather than turned into a 500 that tells the client
  their file did not arrive.

## The origin contract this tab reads

[[REQ-163]] shipped the two ingestion entry points. This adds the read surface
the Library is written against:

- `GET /api/material` — the tenant's material, newest first, **without bodies**
  (a material's body is its extracted text; a list carrying them would ship the
  whole corpus to draw a column of filenames). `site_slug` travels on the row for
  the browser to badge and filter on.
- `GET /api/material/item?uid=` — one row plus its description.
- `GET /api/material/file?uid=` — the bytes, `inline`, from the private bucket
  through the tenant-bound blob handle. The public Worker has no binding on the
  material bucket, deliberately ([[DOC-38]] §7.1).
- `POST /api/material/description` — the correction. It sets
  `description_status=ok` and `description_model=client`, so [[REQ-163]]'s
  re-describe backlog query cannot later overwrite the client's own words, and it
  **re-indexes** — which is the half that makes the correction reach retrieval
  rather than just the screen. An empty description is refused: the body is the
  only thing that makes a blob findable.
- `POST /api/material` gains the optional `role` field described above.

All four read/write routes refuse a uid that is not `material` or `reference`
with a **404 rather than a 403**, so they are not an oracle for which uids exist
in the tenant.

## Fixed on the way: blob reads addressed by the wrong key

`promoteToSiteAsset` read its bytes with `blobs.get(sha256)` and found nothing,
every time. The ticketing component's `attach` used to content-address and dedup
and gave that up deliberately — a shared blob cannot be moved to the trash
without breaking whichever sibling record still names it, and moving it is what
makes deletion actually revoke reach. The blob is keyed by the **attachment
record's own uid**; `sha256` stays on the record for integrity and is no longer
the address.

It was invisible because nothing had ever read a blob back: [[REQ-163]] shipped
promotion with its refusal proved and its success path unexercised. This is the
first ticket with a surface that shows a client their own file, which is why it
is the one that found it.

## Existing acceptance criteria this supersedes

Recorded explicitly rather than silently rewritten:

- **AC-959 / AC-976** pinned *exactly one tab* and asserted every declared tab is
  the active one. Both were exact while the builder had one tab. Restated against
  the declaration: one panel per declared tab and no more, and the **first**
  declared tab is the one that opens.
- **AC-1064** ("only the toolbar chooses a site") asserted `querySelectorAll('select').length === 1`
  — a proxy that held while the workspace had one dropdown of any kind, and which
  the Library's role and kind filters break without touching the criterion.
  Restated by what the control *offers*: exactly one dropdown in the workspace
  lists site slugs.
- **[[REQ-163]]'s and [[REQ-162]]'s blob-addressing criteria** asserted
  `t/<tenant>/blob/<sha>` and "the same file twice is ONE blob". Both were true
  of the component's previous content-addressing and are not true of the current
  one (see above), so both suites were already failing before this ticket.
  Restated: one record owns one blob, the tenant prefix still isolates one
  account's bytes from another's, and identical content still hashes identically
  — `sha256` is an integrity field now rather than the address. The claims that
  actually mattered (bytes in the private bucket and never the public one; one
  tenant cannot address another's blob) are unchanged and still asserted.

## Depends on

- **The material types** — `material`, `reference`, `brief`. Landed in
  [[REQ-162]].
- **The ingestion pipeline** — [[DOC-38]] §10. Landed in [[REQ-163]]. This tab is
  a read view over what ingestion creates, and is cheap after it and impossible
  before it.
- **`webui-list-detail`** — added to the browser import map, along with
  `webui-scroll`, which it composes for the detail pane's sticky scroll. A
  browser import map is not a package manager: it resolves what it is told about
  and nothing transitively, so a dependency of a listed component has to be
  listed too or the first mount fails.

## Out of scope

- Fetching material on the client's behalf (3c) and capture (3a/3b) — both create
  the same tickets and appear in this list, but neither is uploaded here.
- The asset **picker** (REQ-118/128/132) stays as it is; this tab does not
  replace it. The picker chooses a value for a field; the Library manages the
  material. Promotion puts bytes in the site's asset library; registering them in
  the site's asset *registry* remains the picker's own business.

## Acceptance

- A Library tab beside `site`, built on `webui/split` + `webui/list-detail`.
- The list filters by role and by `kind`, and shows "used on this site".
- The list is the whole tenant's material — including material bound to the
  client's other sites, and material bound to none.
- Selecting a row opens a detail pane built from the existing field editors — no
  new editing components — showing the blob itself, not just its name.
- The rights record is read-only; the description is the one editable thing.
- Dragging a file onto either the chat or the Library raises the overlay; dropping
  it into an area creates a ticket with the role's rights already set.
- A file dropped on the overlay but not into an area creates nothing, and the
  overlay says what is missing.
- Every area is reachable without dragging.
- A `role=site` upload made against a selected site lands in that site's asset
  library, without overwriting one already there; a `role=reference` upload
  cannot reach a site at all.
- A chat-route drop is visible in the transcript, reporting what actually
  happened; a Library-route drop is not.
- The client can correct the AI-written description, and the correction is
  reflected in retrieval.

## Open questions — resolved

- **A third area for fonts?** **No.** They fold into "Put it on the site": they
  are published, visitors see their effect, and a third area would ask the client
  to make a distinction that changes nothing about what we do with the file.
- **Non-drag upload.** **Built.** Every area is a real `<button>` that opens the
  file picker — the same overlay and the same role, a different trigger. Drag is
  a gesture some people cannot perform and some devices do not offer.
- **What happens on an ambiguous drop.** **Prompt, never default.** The overlay
  stays up, both areas are marked, and nothing is created. There is no safe
  default: falling back to "on the site" publishes what the client marked
  private, and falling back to "just to read" withholds the photograph they meant
  to publish. Both are silent and both are wrong, so the only correct answer is
  to keep asking.


---

## REQ-158: The system KB in the Worker: bundle-resident index, AI binding, knowledge surface on the builder toolbox

# The system KB in the Worker: bundle-resident index, AI binding, knowledge surface on the builder toolbox

## The gap

`1c kb build` produces a corpus, a vector index, a chunk index and an awareness map as a release artefact. **Nothing in the deployed Worker reads any of it.**

The builder AI therefore cannot search its own design documentation. Asked "what dial values does the hero-split module support?" or "what are the rules about third-party reference material?", it has no path to the answer that [[DOC-10]] §5.1 and [[DOC-38]] §8 both assume it has.

This is a wiring ticket, not a design one. The seam already exists and is deliberately shaped for exactly this.

## What already exists

- `createL1ToolboxCore` **accepts** a `knowledgeSurface` — `{surface, granted}`.

- The node-side `createL1Toolbox` **builds** one, loading the `ai-knowledge` bridge and constructing `new bridge.KnowledgeToolbox(knowledge)` with `bridge.knowledgeInstanceConfig([SYSTEM_KB])`.

- `openKnowledgeRuntime()` (`tools/generate/src/cli/kb.ts`) opens a runtime from disk.

- `apps/control-app/src/ai.ts` builds the Worker's `HostDeps` and passes **no knowledge at all**, so the surface defaults to `null` — _"what a host with no knowledge corpus supplies."_

The CLI path works. The Worker path was never connected.

## What is missing

1. **The corpus has never actually been built.** `kb/system/` contains 33 exported markdown documents and nothing else — no `index/`, no `chunks/`, no awareness-map document. Only `1c kb export` has ever run, so the embedder, describer and awareness passes are unexercised against the current corpus (which has since gained [[DOC-38]]). Running `1c kb build` is a prerequisite of this ticket, not part of it, but the ticket is not done until it has been run and its output committed to the release path.

2. **No **`[ai]`** binding** in `apps/control-app/wrangler.toml`. Query-time embedding needs `WorkersAiEmbedder({binding: env.AI})`, and the index and the query must come from the same model or the vector space does not agree.

It must be declared **twice** — top level and under `[env.production]`. A named environment inherits neither vars nor bindings, and that file's own stated rule is that nothing depends on remembering which keys inherit. Every other binding there is pinned by a UAT asserting both declarations exist; this one gets the same treatment. Absent in production, the failure is not degradation — every search throws on `undefined`.

1. **No bundle-resident artefacts.** `openKnowledgeRuntime` builds on `nodeIndexSource(...)`, which is filesystem access and does not exist in workerd. The Worker needs the index and the documents as generated modules it can import.

2. **No Worker-side runtime opener** — the peer of `openKnowledgeRuntime`, built from `memoryIndexSource(INDEX)`, `DocDirStore(bundleDocReader(DOCS))` and the AI binding. It belongs on the Worker-safe side of the package boundary and must not reach `node:fs` transitively.

3. **The surface is never passed.** `ai.ts` must construct the runtime and hand `knowledgeSurface` to `createL1ToolboxCore`.

4. **Priming.** `primeSession` injects the awareness map into the session so the AI starts with _the map, not the pile_ ([[DOC-10]] §5.1). Search without priming is a tool the AI does not know it should reach for.

## Decision: the index is bundle-resident for v1

33 documents is roughly 50KB of document vectors and well under 1MB with chunks — nowhere near a bundle limit. R2 costs a cold-start fetch and buys nothing at this size.

`IndexSource` is a seam, so moving to R2 later is a swap rather than a rewrite.

**One caveat, recorded so it is not generalised wrongly:** the _project_ KB ([[DOC-38]] §8) can never be bundle-resident — it is tenant data, written continuously, and differs per tenant. It will need the R2 or store-backed path through the same seam. Bundle-for-system is not a decision that has to hold twice, and nothing in this ticket should be built as though it does.

## Out of scope

- **The project KB.** Tenant-scoped corpus, incremental indexing, and the awareness-map refresh cadence are a separate ticket. This one ships the static half.

- **Attachments** (`lagrange-framework` REQ-104) — no dependency in either direction.

- **The site source adapter** ([[DOC-38]] §8.3).

- **Awareness-map rebuild triggers.** The system map is built at release time and changes only when the documents do.

## Acceptance

- `[ai]` binding declared top-level **and** under `[env.production]`, with a UAT asserting both, matching the existing pinned pairs.

- `1c kb build` emits bundle-importable modules for the index and the documents.

- A Worker-safe runtime opener exists, and the existing static-import-graph assertion still passes — the query path must not reach `node:fs`.

- `ai.ts` passes a non-null `knowledgeSurface` when the artefacts are present, and continues to work when they are absent (a missing corpus degrades to no knowledge tools, never to a boot failure).

- Priming injects the awareness map into the session.

- **The behavioural test:** the builder AI, asked a question whose answer lives only in a design document, answers from it and names the document. This is the acceptance criterion that matters; the rest are the mechanism.

## What has changed under this ticket since it was written

Three of the premises above are now stale — [[REQ-159]] and [[REQ-163]] both landed after this was drafted, and between them they did some of this work and moved one of its numbers.

**1. The **`[ai]`** binding already exists.** "What is missing" item 2 and the first acceptance criterion are already satisfied: `apps/control-app/wrangler.toml` declares `[ai]` top-level and `[env.production.ai]` under the environment, and `test_UAT_FC_REQ-159_project_kb_config.test.ts` asserts both. [[REQ-159]] needed the same binding for query-time embedding and followed the same repeated-pair rule this ticket describes. Nothing to do; the criterion stands only as a regression check.

**2. The emitter has a working precedent, not a blank page.** [[REQ-159]] added `writeKnowledgeShim` to `tools/generate/src/cli/assets.ts`, which writes `apps/control-app/src/generated/knowledge.js` as an absolute-path `export *` re-export — precisely the static shape `test_UAT_FC_REQ-146_worker_ai_boundary` requires, since `sharedModuleUrl`'s dynamic specifier is refused on the Worker path. The KB module is a sibling of that file written by the same pass, not a new mechanism.

Two further pieces of item 4 exist already: `r2IndexSource` and `WorkersAiEmbedder({binding: env.AI})` are both in `apps/control-app/src/knowledge.ts`, and `projectKnowledgeFor` shows the whole opener shape end to end. This is more of a wiring ticket than it was.

**3. The size argument needs restating against a new baseline — and it is now measured, not projected.** "Roughly 50KB of document vectors and well under 1MB with chunks" was measured against a 322 KiB Worker. [[REQ-163]] shipped `unpdf` and `@anthropic-ai/sdk`, and a dry-run deploy now puts the bundle at **1052 KiB gzip with **`KB = null` — that is the Worker before any KB exists at all.

Building the corpus and measuring `apps/control-app/src/generated/kb.js` directly:

bytes

Source markdown, 4 documents

107,305 (105 KiB)

`kb.js`, raw

520,730 (509 KiB)

`kb.js`, **gzip**

294,767 (**288 KiB**)

A dry run of the full bundle with that corpus measures **1341 KiB gzip**, which matches the 288 KiB module delta.

**The compressed module is 2.75× the markdown it was built from, and that is the load-bearing fact.** The vectors account for 228,864 bytes of float32 — exactly `145 chunks × 384 × 4` plus `4 docs × 384 × 4`. Base64-encoded that is 305 KB of near-random text, and gzip can undo base64's 4/3 expansion and nothing more, so it floors at 223 KiB. The 105 KiB of markdown and 94 KiB of chunk metadata compress ~3× into the remaining ~65 KiB. So **78% of the compressed payload is vectors, and vectors do not compress.** Bundle size tracks _chunk count_, not text volume; the inlined documents are nearly free.

Extrapolating on chunk count: all 39 `doc` tickets total 642,230 bytes, 6× the present corpus, which puts ~1.7 MiB of KB on top of the 1052 KiB baseline — **2.7 MiB gzip against the 10 MiB paid ceiling**, or 3.6× headroom. That is a pessimistic ceiling rather than a forecast: **29 of the 39 are **`doc_kind: architecture`, which [[DOC-39]] §3.1 excludes from the KB, so all 39 migrating is the case that will not happen.

The decision does not change — bundle-resident is still right at this scale, and R2 would buy a cold-start fetch for nothing. What changes is the margin. An earlier revision of this section projected **1.9 MiB**; that was optimistic by about 40%, and the real headroom is 3.6× rather than the ~5× it implied. It is 27% of the ceiling rather than a rounding error, and **chunks are four fifths of the payload**. If it ever tightens, chunks are what moves to R2 through the `IndexSource` seam, and `r2IndexSource` already exists to receive them.

**And the corpus is scoped, not merely grown.** There are **39 **`doc`** tickets, 642,230 bytes** in total (the ticket says 33), but only **4 carry **`doc_kind: system_kb`, so `kb/system/` holds those 4 and `1c kb build` has now run against them — `index/`, `chunks/` and `awareness.md` all exist. Item 1 is therefore satisfied for the marked subset; the remaining 35 depend on [[DOC-39]] §10's pending marker migration, which is not this ticket's work.

## Answers to the open questions (2026-08-31)

**Q1 — who runs **`1c kb build`**, and with what credentials.** Option (a): the credentials are supplied and the build runs here. It needs `CLOUDFLARE_ACCOUNT_ID` and a `CLOUDFLARE_API_TOKEN` carrying **Account → Workers AI → Read**, which is the permission that authorises `/accounts/{id}/ai/run/@cf/baai/bge-small-en-v1.5`. No second credential: the map's paragraphs go through the Claude Code CLI when `ANTHROPIC_API_KEY` is unset, as `KB_USAGE` records.

The token is a _build_ credential, not a session one — it produces an artefact that then travels in the bundle, so it does not belong in the implementing environment permanently.

One blocker in the way of running it: the CLI does not currently boot in this checkout. `1c kb status` dies on `Cannot find module 'unpdf'` — [[REQ-163]] added the dependency and this working tree has not installed it. `pnpm install --frozen-lockfile` refuses non-interactively (`ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY`) because it wants to purge `node_modules` first, so it needs `CI=true` and an operator who accepts the purge.

**A second blocker, and a misleading one: Node's **`fetch`** ignores **`HTTPS_PROXY`**.**`1c kb build` dies with a bare `TypeError: fetch failed` while `curl` against the same `/accounts/{id}/ai/run/@cf/baai/bge-small-en-v1.5` endpoint succeeds with the same token — so the credential looks fine and the corpus looks unbuildable.

The cause is proxy handling, not Cloudflare. Where the only network egress is a proxy advertised through `HTTPS_PROXY`, `curl` reads that variable and Node's global `fetch` does not: undici ignores proxy environment variables entirely and dials the target host directly, the sandbox refuses the connect with `EPERM`, and undici surfaces every transport failure as the same opaque `fetch failed` with the real errno only on `err.cause`. Setting `NODE_USE_ENV_PROXY=1` (Node 24+) makes the global fetch honour the proxy, and the build proceeds.

This is an environment artefact: an unsandboxed operator machine needs no flag, and nothing in the build is wrong. It does expose a diagnosability defect in the embedder's error path — a bare `fetch failed` is indistinguishable from a bad API token, which is the wrong thing to hand someone who is debugging. Unwrapping `err.cause` there is worth doing, but it is **not in scope for this ticket** and no code under REQ-158 addresses it.

**Q2 — generated, not committed.** The catch that made this a real question dissolves on inspection: **GitHub Actions is not a live deploy path.**`.github/workflows/deploy.yml` has run exactly once, on 2026-08-02, and failed after seven seconds; nothing has used it since, and it has never successfully deployed anything. `bin/deploy` is the real path, and `bin/build` runs `1c assets` before the typecheck precisely because the generated files are not committed.

Committing would also fight two rules this repo states outright: both `/apps/control-app/src/generated/` and `/kb/system/` are gitignored, and `bin/build`'s own comment gives the reason — _"a checked-in copy of a generator's output is a second definition site, which BUG-32's scan fails on."_

So: `1c assets` writes `apps/control-app/src/generated/kb.js`, **always**, carrying `export const KB = null` when no index has been built. The static import can then never break the build, and the absent case degrades to no knowledge tools rather than to a boot failure — which is what the acceptance criterion already asks for.

Two consequences to handle rather than discover:

- **A missing KB must be loud at deploy time.** Silence means shipping an assistant with no knowledge tools and nobody noticing until it answers badly. This takes the shape [[REQ-163]] already set for an unwired indexer: a check that says so in the operator's face, not a log line in a stream nobody reads.

- `deploy.yml`** should be fixed to run **`bin/build`**, or deleted.** A workflow that has never succeeded and would deploy a Worker missing its generated imports is a trap for whoever pushes to `xgd-stable` next. Out of scope here, but it should not stay as it is.

**Q3 — the behavioural test is a fixture corpus in workerd, with a written manual check beside it.** The proposal is right and it already has precedent: `tests/support/stub-embedder.ts` exists for exactly this reason, and both `test_UAT_FC_REQ-159_project_kb.workers.test.ts` and [[REQ-163]]'s ingestion UATs run the whole search path inside workerd against a stub embedder because miniflare proxies `AI` to the live account and there is no local stand-in.

Do **not** gate a real-corpus variant behind an env var. A test that never runs in CI is not a test; the manual check is more honest as prose an operator follows than as a skipped `it()`.

Two things the fixture UAT must assert, because the acceptance sentence has two halves and the mechanism has a third: the answer comes **from the planted document**, the response **names it**, and **priming put the awareness map into the session** — search the AI never learns to reach for is the same failure as no search at all.

**Q4 — no new config surface, and no bare literal either.** [[REQ-159]] already introduced `kb/knowledge_bases.json`, and it already declares `system` (`source: shipped`, `landscape: authored`) beside `project`. So the answer is neither "hard-code it" nor "invent configuration": mirror `projectKb()` with a `systemKb()` that parses the same file, keyed by `SYSTEM_KB = 'system'` exactly as `PROJECT_KB` keys the other.

The reason is the one that function already records — _parsed, not paraphrased_: an earlier version read one field and hand-constructed the rest, which meant editing the declared corpus changed nothing. A declaration that is not the thing actually used is worse than no declaration.

## Open questions

- Whether the generated modules are committed or built in CI. **Answered above:** generated, always written, `null` when absent.

- Whether `SYSTEM_KB` scoping stays hard-coded in the toolbox construction or becomes configuration once a second KB exists.

- 

-


---

## REQ-167: Identity: the invite provisions the account, login binds it

# Identity: the invite provisions the account, login binds it

## The gap

`access.ts` verifies a Cloudflare Access JWT on every request and produces a
verified email address. Nothing is done with it. There is no record that a
person exists, no account they own, and no rule about who may enter — the
builder serves whoever passes the hostname gate, into the single tenant named by
`TENANT_ID`.

Onboarding external people needs all three: a user record, an account, and an
entitlement that decides admission. [[DOC-40]] is the model; this ticket is its
first implementation.

## Migration `0004_identity.sql`

Three tables, in the control-plane database beside `tenants`.

```sql
CREATE TABLE IF NOT EXISTS users (
  id             TEXT PRIMARY KEY,
  tenant_id      TEXT NOT NULL,
  email          TEXT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'active',
  display_name   TEXT,
  platform_admin INTEGER NOT NULL DEFAULT 0,
  tos_version    TEXT,
  tos_accepted_at TEXT,
  invited_at     TEXT,
  first_seen_at  TEXT,
  last_seen_at   TEXT,
  created_at     TEXT NOT NULL,
  updated_at     TEXT NOT NULL,
  fields         TEXT NOT NULL DEFAULT '{}'
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_tenant_email ON users (tenant_id, email);

CREATE TABLE IF NOT EXISTS memberships (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL,
  account_id TEXT NOT NULL,
  role       TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'active',
  granted_by TEXT,
  granted_at TEXT NOT NULL,
  expires_at TEXT,
  revoked_at TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_memberships_user_account ON memberships (user_id, account_id);
CREATE INDEX IF NOT EXISTS idx_memberships_account ON memberships (account_id);

CREATE TABLE IF NOT EXISTS entitlements (
  id           TEXT PRIMARY KEY,
  account_id   TEXT,
  email        TEXT,
  plan         TEXT NOT NULL,
  source       TEXT NOT NULL,
  status       TEXT NOT NULL,
  starts_at    TEXT NOT NULL,
  ends_at      TEXT,
  subscription_ref TEXT,
  granted_by   TEXT,
  note         TEXT,
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_entitlements_account ON entitlements (account_id, status);
CREATE INDEX IF NOT EXISTS idx_entitlements_email ON entitlements (email);
```

`IF NOT EXISTS` throughout, per this repository's migration convention (0003).

**`plan` and `status` carry no CHECK constraint, deliberately.** Adding
`'warning'` when billing lands, or `'trial'` when self-signup lands, must be a
code change and not a schema migration — see [[DOC-40]] §5. A UAT asserts the DDL
contains no CHECK on either column, because the constraint is the kind of thing
a later hand adds for tidiness without seeing what it costs.

**Entitlement carries both `account_id` and `email`.** `email` is the claim key
for a grant made before an account exists; today's admin flow always fills
`account_id` as well, and both are kept because the email is also the audit
record of who the grant was made to.

**There is no unique index on `entitlements.account_id`.** An account
accumulates grants over its life and effective access is the best active grant
covering now. A unique index would encode the single-row assumption this model
exists to avoid.

## Provisioning happens at invite

One function creates the whole set, transactionally where D1 allows:

- `users` row in the platform tenant, `invited_at` stamped, `first_seen_at` null
- `tenants` row — the account — with an **opaque** id of the form `acct_<random>`
- `memberships` row, role `owner`
- `entitlements` row, `plan='pro'`, `source='admin_grant'`, `status='active'`,
  `starts_at` and `ends_at` supplied by the caller
- the account's starter site (see [[REQ-D]] for its content)

**The account id is never derived from the email, the name, or anything a human
chose.** A tenant id appears in R2 keys and is therefore permanent; a readable
one becomes wrong the first time someone renames their company. The human label
goes in `tenants.name`. A UAT asserts the generated id is not a function of the
invite's inputs.

**Re-inviting an existing email is not a second account.** The unique index on
`(tenant_id, email)` refuses it; the operation reports the existing user rather
than failing obscurely on a constraint.

## Login binds, and does not provision

The request path, after `access.ts` has produced a verified email:

1. Look up the user by `(platform tenant, email)`. **No row → deny.** Nothing is
   created. Self-signup is [[DOC-40]] §5's later branch and is explicitly not
   built here.
2. Stamp `first_seen_at` if null, and `last_seen_at` always.
3. Resolve the account from `memberships`. No active membership → deny.
4. Resolve the entitlement: the best grant for that account with
   `status='active'`, `starts_at <= now`, and `ends_at` either null or `> now`.
   None → deny.
5. Serve.

### Denial says which thing failed, to the operator and not to the caller

The deny page tells the visitor their access has ended and to get in touch. It
does not distinguish "no such user" from "expired grant" — that difference is an
account-existence oracle to anyone who can pass OTP, which is anyone. The
distinction is logged.

### Expiry must actually expire

A grant given a bounded date whose expiry is never evaluated is worse than an
open-ended one, because it was promised as bounded. **A UAT sets `ends_at` in
the past and asserts the login is refused**; another sets it in the future and
asserts admission. This is the single most likely silent failure in the ticket:
the code path that never runs during the alpha is the one that was promised.

`revoked_at` and `status='revoked'` refuse independently of dates.

## Not in scope

Self-signup, trials, subscriptions, discounts, the warning period, read-only
access on expiry, and time-boxed support memberships. All are [[DOC-40]] §5 and
§6, and all land on this schema without changing it.

-
