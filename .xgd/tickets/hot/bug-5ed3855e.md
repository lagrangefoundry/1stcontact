---
uid: bug-5ed3855e
id: BUG-185
type: bug
title: KnowledgeGet refuses a material uid that KnowledgeSearch just returned (not_in_corpus)
created_by: xgd
created_at: '2026-10-03T19:16:59.056170+00:00'
updated_at: '2026-10-03T22:50:30.255905+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-ecf4d163
  severity: high
  commits:
  - working_sha: 59e8aabb24b8cc14670b3773ae72ceee57b44843
    reconcile_sha: null
    main_sha: null
  - working_sha: 49c3eabd047eda3c100246c27d5d2dcf39a38246
    reconcile_sha: null
    main_sha: null
  version: 0.2.458
  story_points: 3
---

## What happened
`KnowledgeSearch` (kb `project`) returned hits of `type: material` with uids such as `material-2537c2d0` and `material-c271caf3`, both client-uploaded markdown documents. Calling `KnowledgeGet` with those exact uids failed with `not_in_corpus` ("No document with that uid is in this session's knowledge corpus. Uids come from search hits…"), even though they did come from a search hit in the same turn.

`get_library_item` on the same items worked, but it returns only the generated description, not the document text. So the full text of a client's uploaded document cannot be read at all.

## Expected
Any uid that search returns should be readable by `KnowledgeGet`. If not, search should not return it, or the hit should say which tool reads it.

## Reproduce
Upload a markdown document, call `KnowledgeSearch` for its content, then call `KnowledgeGet` with the returned `material-…` uid.

## Root cause
Two defects, and the second one hid behind the first.

**1. Search and read disagreed about which uids exist.** The chat host opens the session's knowledge once per isolate (`router.ts` → `sessionKnowledgeFor`). `KnowledgeGet` admits a uid only if it is in the runtime's `documents` snapshot, which is seeded from the indexes when the session opens. Upstream (`ai-knowledge` REQ-112) keeps that snapshot in step with search by **disclosure**: every uid a search returns is added to the snapshot (`KnowledgeToolbox._disclose`). `CoRankedKnowledge` (`apps/control-app/src/session-knowledge.ts`) overrides `search` and `chunk_search` to search the project and system KBs separately and merge the results, and that override never took on the disclosure step. So every document uploaded while the isolate was warm could be found by search and was then refused by `KnowledgeGet` as `not_in_corpus`. The override had also drifted from upstream in three other per-hit steps:
- corpus claims (`_claimedHits`): hits came back with no `provenance`, so client material reached the model without its `<<<untrusted>>>` fence;
- turn addresses on transcript chunks (`_withTurns`);
- `KnowledgeChunkSearch`'s declared `doc` parameter, which was silently ignored.

**2. Once admitted, the read returned the digest, not the document.** Since REQ-173, a material's ticket body holds an AI digest and the full extracted text lives in a `material_text` comment. The chunk index is built over `materialTextView`, in which a material's body is its full text, so a chunk hit's `start`/`end` are offsets into that text. `KnowledgeGet` and `KnowledgeOutline`, however, read `store.get(uid).body`, which is the digest. Whole-document reads returned only the description (the same thing `get_library_item` shows), and span reads using the hit's own offsets failed with `bad_range`.

## What changed
- **`CoRankedKnowledge`** keeps only what is its own: searching each KB and merging by score. The merged hits then go through the base class's post-processing in upstream's order:
  - `search`: `_claimedHits(_disclose(coRank(...)))`
  - `chunk_search`: `_claimedHits(await _withTurns(_disclose(coRank(...))))`, and it passes `doc` through to each KB's `searchChunks`.

  Disclosure writes into the composite runtime's `documents` map, which is the snapshot `KnowledgeGet` resolves against. A uid returned on any turn is therefore readable on that turn and every later one. This does not widen the `document` scope axis: only uids that the `kb`-gated search actually returned are admitted.
- **`materialTextView`** (`apps/control-app/src/knowledge.ts`) is now a live, drop-in `TicketStore` view built with a `Proxy`. It substitutes a material's own text on `get` (a single predicate query for that ticket's `material_text` comment) as well as on `query` (one batched comment query, skipped when the result is empty). Every other member is the store's own, bound to it. It is no longer a snapshot taken at construction, because the session's runtime outlives any one upload. `refreshIndex` uses it as before.
- **The session's project runtime** (`sessionKnowledgeFor`) reads through `materialTextView(project.store)`. As a result, `KnowledgeGet`, `KnowledgeOutline` and chunk-hit offsets all address the same text the chunk index was built from.

## Design decisions
- Reuse the base class's post-processing rather than re-implementing any per-hit step. The override duplicating upstream logic is what let it drift in the first place.
- Substitute the text at the store view rather than overriding `get`/`outline` on the surface. One view now serves both the chunk indexer and the session, so they cannot address different strings. It stays marked as temporary, until `lagrange-framework`'s chunk builder learns the designated comment kind.
- In `get`, look up the text comment with a predicate rather than `store.comments(uid)`. For a `chat` ticket, `comments(uid)` would load the whole transcript.

## Test plan
`tests/test_UAT_FC_BUG-185_search_hit_is_readable.workers.test.ts` runs in workerd against real D1/R2, the real knowledge component and the real `/api/material` ingest path. It doubles only the model client, Workers AI and the digest describer. In every case the session takes a turn **before** the upload, so the snapshot is warm, which is the condition the bug needs.
- `..._a_document_uploaded_mid_session_is_readable_from_its_search_hit`: `KnowledgeSearch` (kb `project`) returns the uploaded uid, and the result is fenced `<<<untrusted>>>`. `KnowledgeGet` on the uid read out of that result returns the full extracted text, i.e. a sentence that exists only in the `material_text` comment and not in the digest.
- `..._a_chunk_hits_offsets_read_back_the_section_it_matched`: `KnowledgeChunkSearch` with `doc` set to the upload is fenced, and `KnowledgeGet` with the hit's own `start`/`end` returns the matched section, with no `not_in_corpus` or `bad_range`.
- Assertions are made on the `KnowledgeGet` tool result itself, never on the whole transcript, because the model's own query names the fact.
- Checked red: on unfixed code both tests fail (`not_in_corpus`, and the missing fence). With the disclosure fix only and no text view, they fail on the digest-only read and on `bad_range`.
- Regression scope run green (81 tests): REQ-158, REQ-159, REQ-160 (two-KB session and delta channel), REQ-161, REQ-163, REQ-173, REQ-123, BUG-55, BUG-117, reconciliation-assistant-conversation-knowledge. `tsc --noEmit` on control-app is clean.