---
uid: request-6893f6ea
id: REQ-158
type: request
title: 'The system KB in the Worker: bundle-resident index, AI binding, knowledge
  surface on the builder toolbox'
created_by: xgd
created_at: '2026-08-28T21:12:01.399464+00:00'
updated_at: '2026-09-01T19:34:09.077635+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  priority: high
  story_points: 8
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-48c75d2e
  commits:
  - working_sha: 27450010586c65b293b2ad5cc6243815133a17be
    reconcile_sha: null
    main_sha: null
  version: 0.2.27
---

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

3. **No bundle-resident artefacts.** `openKnowledgeRuntime` builds on `nodeIndexSource(...)`, which is filesystem access and does not exist in workerd. The Worker needs the index and the documents as generated modules it can import.

4. **No Worker-side runtime opener** — the peer of `openKnowledgeRuntime`, built from `memoryIndexSource(INDEX)`, `DocDirStore(bundleDocReader(DOCS))` and the AI binding. It belongs on the Worker-safe side of the package boundary and must not reach `node:fs` transitively.

5. **The surface is never passed.** `ai.ts` must construct the runtime and hand `knowledgeSurface` to `createL1ToolboxCore`.

6. **Priming.** `primeSession` injects the awareness map into the session so the AI starts with _the map, not the pile_ ([[DOC-10]] §5.1). Search without priming is a tool the AI does not know it should reach for.

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

Three of the premises above are now stale — [[REQ-159]] and [[REQ-163]] both
landed after this was drafted, and between them they did some of this work and
moved one of its numbers.

**1. The `[ai]` binding already exists.** "What is missing" item 2 and the first
acceptance criterion are already satisfied: `apps/control-app/wrangler.toml`
declares `[ai]` top-level and `[env.production.ai]` under the environment, and
`test_UAT_FC_REQ-159_project_kb_config.test.ts` asserts both. [[REQ-159]] needed
the same binding for query-time embedding and followed the same repeated-pair
rule this ticket describes. Nothing to do; the criterion stands only as a
regression check.

**2. The emitter has a working precedent, not a blank page.** [[REQ-159]] added
`writeKnowledgeShim` to `tools/generate/src/cli/assets.ts`, which writes
`apps/control-app/src/generated/knowledge.js` as an absolute-path `export *`
re-export — precisely the static shape
`test_UAT_FC_REQ-146_worker_ai_boundary` requires, since `sharedModuleUrl`'s
dynamic specifier is refused on the Worker path. The KB module is a sibling of
that file written by the same pass, not a new mechanism.

Two further pieces of item 4 exist already: `r2IndexSource` and
`WorkersAiEmbedder({binding: env.AI})` are both in
`apps/control-app/src/knowledge.ts`, and `projectKnowledgeFor` shows the whole
opener shape end to end. This is more of a wiring ticket than it was.

**3. The size argument needs restating against a new baseline — and it is now
measured, not projected.** "Roughly 50KB of document vectors and well under 1MB
with chunks" was measured against a 322 KiB Worker. [[REQ-163]] shipped `unpdf`
and `@anthropic-ai/sdk`, and a dry-run deploy now puts the bundle at **1052 KiB
gzip with `KB = null`** — that is the Worker before any KB exists at all.

Building the corpus and measuring `apps/control-app/src/generated/kb.js`
directly:

| | bytes |
|---|---|
| Source markdown, 4 documents | 107,305 (105 KiB) |
| `kb.js`, raw | 520,730 (509 KiB) |
| `kb.js`, **gzip** | 294,767 (**288 KiB**) |

A dry run of the full bundle with that corpus measures **1341 KiB gzip**, which
matches the 288 KiB module delta.

**The compressed module is 2.75× the markdown it was built from, and that is the
load-bearing fact.** The vectors account for 228,864 bytes of float32 — exactly
`145 chunks × 384 × 4` plus `4 docs × 384 × 4`. Base64-encoded that is 305 KB of
near-random text, and gzip can undo base64's 4/3 expansion and nothing more, so
it floors at ~223 KiB. The 105 KiB of markdown and 94 KiB of chunk metadata
compress ~3× into the remaining ~65 KiB. So **~78% of the compressed payload is
vectors, and vectors do not compress.** Bundle size tracks *chunk count*, not
text volume; the inlined documents are nearly free.

Extrapolating on chunk count: all 39 `doc` tickets total 642,230 bytes, ~6× the
present corpus, which puts ~1.7 MiB of KB on top of the 1052 KiB baseline —
**~2.7 MiB gzip against the 10 MiB paid ceiling**, or 3.6× headroom. That is a
pessimistic ceiling rather than a forecast: **29 of the 39 are
`doc_kind: architecture`**, which [[DOC-39]] §3.1 excludes from the KB, so all
39 migrating is the case that will not happen.

The decision does not change — bundle-resident is still right at this scale, and
R2 would buy a cold-start fetch for nothing. What changes is the margin. An
earlier revision of this section projected **1.9 MiB**; that was optimistic by
about 40%, and the real headroom is 3.6× rather than the ~5× it implied. It is
27% of the ceiling rather than a rounding error, and **chunks are four fifths of
the payload**. If it ever tightens, chunks are what moves to R2 through the
`IndexSource` seam, and `r2IndexSource` already exists to receive them.

**And the corpus is scoped, not merely grown.** There are **39 `doc` tickets,
642,230 bytes** in total (the ticket says 33), but only **4 carry
`doc_kind: system_kb`**, so `kb/system/` holds those 4 and `1c kb build` has now
run against them — `index/`, `chunks/` and `awareness.md` all exist. Item 1 is
therefore satisfied for the marked subset; the remaining 35 depend on
[[DOC-39]] §10's pending marker migration, which is not this ticket's work.

## Answers to the open questions (2026-08-31)

**Q1 — who runs `1c kb build`, and with what credentials.** Option (a): the
credentials are supplied and the build runs here. It needs
`CLOUDFLARE_ACCOUNT_ID` and a `CLOUDFLARE_API_TOKEN` carrying **Account →
Workers AI → Read**, which is the permission that authorises
`/accounts/{id}/ai/run/@cf/baai/bge-small-en-v1.5`. No second credential: the
map's paragraphs go through the Claude Code CLI when `ANTHROPIC_API_KEY` is
unset, as `KB_USAGE` records.

The token is a *build* credential, not a session one — it produces an artefact
that then travels in the bundle, so it does not belong in the implementing
environment permanently.

One blocker in the way of running it: the CLI does not currently boot in this
checkout. `1c kb status` dies on `Cannot find module 'unpdf'` — [[REQ-163]]
added the dependency and this working tree has not installed it. `pnpm install
--frozen-lockfile` refuses non-interactively
(`ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY`) because it wants to purge
`node_modules` first, so it needs `CI=true` and an operator who accepts the
purge.

**A second blocker, and a misleading one: Node's `fetch` ignores `HTTPS_PROXY`.**
`1c kb build` dies with a bare `TypeError: fetch failed` while `curl` against the
same `/accounts/{id}/ai/run/@cf/baai/bge-small-en-v1.5` endpoint succeeds with
the same token — so the credential looks fine and the corpus looks unbuildable.

The cause is proxy handling, not Cloudflare. Where the only network egress is a
proxy advertised through `HTTPS_PROXY`, `curl` reads that variable and Node's
global `fetch` does not: undici ignores proxy environment variables entirely and
dials the target host directly, the sandbox refuses the connect with `EPERM`, and
undici surfaces every transport failure as the same opaque `fetch failed` with
the real errno only on `err.cause`. Setting **`NODE_USE_ENV_PROXY=1`** (Node 24+)
makes the global fetch honour the proxy, and the build proceeds.

This is an environment artefact: an unsandboxed operator machine needs no flag,
and nothing in the build is wrong. It does expose a diagnosability defect in the
embedder's error path — a bare `fetch failed` is indistinguishable from a bad API
token, which is the wrong thing to hand someone who is debugging. Unwrapping
`err.cause` there is worth doing, but it is **not in scope for this ticket** and
no code under REQ-158 addresses it.

**Q2 — generated, not committed.** The catch that made this a real question
dissolves on inspection: **GitHub Actions is not a live deploy path.**
`.github/workflows/deploy.yml` has run exactly once, on 2026-08-02, and failed
after seven seconds; nothing has used it since, and it has never successfully
deployed anything. `bin/deploy` is the real path, and `bin/build` runs
`1c assets` before the typecheck precisely because the generated files are not
committed.

Committing would also fight two rules this repo states outright: both
`/apps/control-app/src/generated/` and `/kb/system/` are gitignored, and
`bin/build`'s own comment gives the reason — *"a checked-in copy of a
generator's output is a second definition site, which BUG-32's scan fails on."*

So: `1c assets` writes `apps/control-app/src/generated/kb.js`, **always**,
carrying `export const KB = null` when no index has been built. The static import
can then never break the build, and the absent case degrades to no knowledge
tools rather than to a boot failure — which is what the acceptance criterion
already asks for.

Two consequences to handle rather than discover:

- **A missing KB must be loud at deploy time.** Silence means shipping an
  assistant with no knowledge tools and nobody noticing until it answers badly.
  This takes the shape [[REQ-163]] already set for an unwired indexer: a check
  that says so in the operator's face, not a log line in a stream nobody reads.
- **`deploy.yml` should be fixed to run `bin/build`, or deleted.** A workflow
  that has never succeeded and would deploy a Worker missing its generated
  imports is a trap for whoever pushes to `xgd-stable` next. Out of scope here,
  but it should not stay as it is.

**Q3 — the behavioural test is a fixture corpus in workerd, with a written
manual check beside it.** The proposal is right and it already has precedent:
`tests/support/stub-embedder.ts` exists for exactly this reason, and both
`test_UAT_FC_REQ-159_project_kb.workers.test.ts` and [[REQ-163]]'s ingestion
UATs run the whole search path inside workerd against a stub embedder because
miniflare proxies `AI` to the live account and there is no local stand-in.

Do **not** gate a real-corpus variant behind an env var. A test that never runs
in CI is not a test; the manual check is more honest as prose an operator
follows than as a skipped `it()`.

Two things the fixture UAT must assert, because the acceptance sentence has two
halves and the mechanism has a third: the answer comes **from the planted
document**, the response **names it**, and **priming put the awareness map into
the session** — search the AI never learns to reach for is the same failure as
no search at all.

**Q4 — no new config surface, and no bare literal either.** [[REQ-159]] already
introduced `kb/knowledge_bases.json`, and it already declares `system`
(`source: shipped`, `landscape: authored`) beside `project`. So the answer is
neither "hard-code it" nor "invent configuration": mirror `projectKb()` with a
`systemKb()` that parses the same file, keyed by `SYSTEM_KB = 'system'` exactly
as `PROJECT_KB` keys the other.

The reason is the one that function already records — *parsed, not paraphrased*:
an earlier version read one field and hand-constructed the rest, which meant
editing the declared corpus changed nothing. A declaration that is not the thing
actually used is worse than no declaration.

## Open questions

- ~~Whether the generated modules are committed or built in CI.~~ **Answered
  above:** generated, always written, `null` when absent.

- Whether `SYSTEM_KB` scoping stays hard-coded in the toolbox construction or becomes configuration once a second KB exists.

-

-