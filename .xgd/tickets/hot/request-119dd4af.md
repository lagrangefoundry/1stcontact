---
uid: request-119dd4af
id: REQ-159
type: request
title: 'The project knowledge base: tenant-scoped corpus, incremental index, and the
  map''s two triggers'
created_by: xgd
created_at: '2026-08-30T23:18:38.731734+00:00'
updated_at: '2026-09-02T17:48:26.958141+00:00'
completed_at: null
last_field_updated: status
status: bundled
fields:
  priority: high
  story_points: 13
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-733e844c
  commits:
  - working_sha: 115f0d39ec5f8787751f144cda8b5d3c6279fbf9
    reconcile_sha: null
    main_sha: null
  version: 0.2.23
  bundled_in: bundle-203b1dc2
---

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