---
uid: comment-36485e09
id: COMMENT-2287
type: comment
title: Comment on bug BUG-55
created_by: xgd
created_at: '2026-09-06T00:28:18.898479+00:00'
updated_at: '2026-09-06T00:32:59.193542+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-b6268a25
  kind: chat_transcript
---

<!-- xgd-turn id="6dafd849-d7f1-4efd-a56f-d95b9bab8598-user" -->

<!-- xgd-chat role="user" ts="2026-09-06T00:27:54.653943+00:00" -->
#### You
Please investigate the root cause or the implementation of this ticket. Report your findings here so that we can discuss them. Do not make any code changes until we are aligned.

<!-- xgd-turn id="6dafd849-d7f1-4efd-a56f-d95b9bab8598-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-06T00:32:59.158468+00:00" -->
#### Claude
I'll start by reading the ticket.

Now let me look at the upstream component to confirm the expected signature.

Now let me check the other three signatures upstream — `buildIndex`, `buildChunkIndex`, and `KnowledgeRuntime.open`.

Now let me survey the whole repo for call sites into these upstream seams.

Let me verify the failure is live and check the toolbox's own read path.

Let me run the tests that exercise this path to see the real current state.

I've verified the ticket against the code and the installed component, and reproduced the failure. The diagnosis is right; three details in the ticket are wrong, and the blast radius is considerably larger than "four call sites in one file".

## Confirmed

`indexFor` (`knowledge/src/index_store.js:113`) refuses because `indexes` is absent, exactly as the ticket says. Upstream REQ-112 is `bcf59fcadf` in `lagrange-framework`, landed **2026-09-01**.

## Correction 1 — only the *read* seam changed

`buildIndex` and `buildChunkIndex` still take a **positional** `source` upstream (`doc_index.js:125`, `chunk_index.js:95`). REQ-112 did not touch them. So two of the four rows in the ticket's "Where" table — `kb.ts:1033` and `kb.ts:1039` — are correct as written and need no change. Same for `apps/control-app/src/knowledge.ts:368/371`.

What changed is `search`, `searchChunks` and `KnowledgeRuntime.open`.

## Correction 2 — seven call sites across four files, not four in one

`1c kb build` is where it was *noticed*, not where it lives. Every read path in the repo is on the pre-REQ-112 shape:

| File | Line | Call | Key needed |
|---|---|---|---|
| `tools/generate/src/cli/kb.ts` | 928 | `lib.search` (buildMap) | `indexes: {shipped: …}` |
| `tools/generate/src/cli/kb.ts` | 1073–74 | `KnowledgeRuntime.open` | `indexes` / `chunkIndexes` |
| `apps/control-app/src/system-knowledge.ts` | 147–48 | `KnowledgeRuntime.open` | `indexes` / `chunkIndexes` |
| `apps/control-app/src/session-knowledge.ts` | 315–16 | `KnowledgeRuntime.open` (project) | `indexes` / `chunkIndexes` |
| `apps/control-app/src/session-knowledge.ts` | 198 | `kmSearch` (CoRanked override) | `indexes: runtime.indexes` |
| `apps/control-app/src/session-knowledge.ts` | 227 | `kmSearchChunks` (override) | `indexes: runtime.chunkIndexes` |
| `apps/control-app/src/knowledge.ts` | 339 | `ProjectKnowledge.search` | `indexes: {project: …}` |

Plus `session-knowledge.ts:128`, `new KnowledgeRuntime({… source: null …})` — benign (the constructor ignores it and `indexes` already defaults to null) but stale vocabulary, and its doc comment above it explains `source: null` as a deliberate choice that no longer refers to anything.

The `KnowledgeRuntime.open` sites are the nastier ones: `open({indexes = null, ...rest})` swallows `source`/`chunkSource` into `rest` and stores them nowhere. The runtime is `Object.freeze`d with fields `indexes`/`chunkIndexes`, so `runtime.source` at line 198 is `undefined` — no error, just an empty map downstream.

**So the assistant's own knowledge search is broken in the running app, not just the build.** `CoRankedKnowledge` overrides upstream's toolbox methods with the old shape, so both hosts (Worker and Node CLI) are affected.

## New finding — a second, silent failure rides along

`KnowledgeRuntime.open` seeds the `documents` snapshot *from* `indexes` (`toolbox.js:191, 229`). With `indexes = null` the snapshot is empty, so the `document` scope axis places no uid and `KnowledgeDocs.get` refuses **every** read as `not_in_corpus` — "the corpus does not contain this", not an error. Fixing `search` alone would leave document reads politely empty. They have to move together.

This is also the likeliest mechanism behind DOC-17 §G (2026-09-02: the assistant reported shipped capabilities as missing).

One asymmetry to get right in the fix: `storeFor` falls back to the base store when a KB names no source; `indexFor` deliberately has **no** default ("an unnamed index is not 'the project's index', it is an artifact nobody built"). The project KB declares no `source` in `kb/knowledge_bases.json`, so it resolves to `DEFAULT_SOURCE = 'project'` and must be keyed under that name explicitly.

## Correction 3 — four days, not months

Upstream landed 2026-09-01; the repo's call sites date 2026-08-31 → 2026-09-02. CHAT-23's index skew (2026-09-05) and the DOC-17 lesson (2026-09-02) both sit inside that window. The ticket uses "months-long" to argue severity — the severity holds on blast radius instead, so this is worth correcting rather than quietly dropping.

## The last acceptance bullet needs rewording

> *"something fails when the repository and the shared store disagree about this seam — today nothing does"*

Something does. The coverage already exists and **is red right now**:

```
tests/test_UAT_FC_REQ-158_system_kb.workers.test.ts      3 failed
tests/test_UAT_FC_REQ-160_two_kb_session.workers.test.ts (in 12 failures)
tests/test_UAT_FC_REQ-123_*.test.ts
→ 11 failed across 3 files, all bottoming out in:
  KnowledgeConfigError: knowledge base 'system' reads from source 'shipped',
  which this host has no index for (available: none)
```

These run under plain `npm test`. So the gap isn't a missing test — it's that nothing runs the suite when `bin/install` rewrites the shared store, and the store's contents are invisible to the lockfile. That reframes the ask from "add a test" to "add a trigger" (a `bin/install` post-step, or a preflight assertion that the installed component's signature is the one this repo calls).

I could not run `1c kb build` end-to-end — it needs `CLOUDFLARE_API_TOKEN` — so the "all four stages complete" criterion will need your credentials to verify.

Want me to fold these corrections into the ticket body and then scope the fix?

<!-- xgd-chat-end -->