---
uid: bug-5ed3855e
id: BUG-185
type: bug
title: KnowledgeGet refuses a material uid that KnowledgeSearch just returned (not_in_corpus)
created_by: xgd
created_at: '2026-10-03T19:16:59.056170+00:00'
updated_at: '2026-10-03T22:45:05.568929+00:00'
completed_at: null
last_field_updated: status
status: free_coded
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
---

## What happened
`KnowledgeSearch` (kb `project`) returned hits of `type: material` with uids such as `material-2537c2d0` and `material-c271caf3`, both client-uploaded markdown documents. Calling `KnowledgeGet` with those exact uids failed with `not_in_corpus` ("No document with that uid is in this session's knowledge corpus. Uids come from search hits…"), even though they did come from a search hit in the same turn.

`get_library_item` on the same items worked, but it returns only the generated description, not the document text. So the full text of a client's uploaded document cannot be read at all.

## Expected
Any uid that search returns should be readable by `KnowledgeGet`. If not, search should not return it, or the hit should say which tool reads it.

## Reproduce
Upload a markdown document, call `KnowledgeSearch` for its content, then call `KnowledgeGet` with the returned `material-…` uid.

## Root cause
The chat host opens the session's knowledge once per isolate (`router.ts` → `sessionKnowledgeFor`), and `KnowledgeGet` admits a uid only if it is in the runtime's `documents` snapshot, which is seeded from the indexes at open time. Upstream (`ai-knowledge` REQ-112) keeps the snapshot in step with search by **disclosure**: every uid a search hands back is folded into the snapshot (`KnowledgeToolbox._disclose`), so "a uid a search hit gave you" is always readable.

`CoRankedKnowledge` (`apps/control-app/src/session-knowledge.ts`) overrides `search` and `chunk_search` to fan out across the project and system KBs and co-rank, and the override never adopted that step. So any document indexed after the session opened — i.e. every upload made while the isolate is warm — is findable but refused by `KnowledgeGet` as `not_in_corpus`. The same override also drifted from upstream in three other per-hit steps the base class applies: corpus claims (`_claimedHits` — `authority`/`origin` fields per hit), turn addresses on transcript chunks (`_withTurns`), and `KnowledgeChunkSearch`'s declared `doc` parameter, which was silently ignored.

## Fix
`CoRankedKnowledge` keeps only what is genuinely its own — the per-KB fan-out and the co-rank merge — and passes the merged hits through the base class's own post-processing, in upstream's order:
- `search`: `_claimedHits(_disclose(coRank(...)))`
- `chunk_search`: `_claimedHits(await _withTurns(_disclose(coRank(...))))`, and forwards `doc` to each per-KB `searchChunks`.

Disclosure writes into the composite runtime's `documents` map, which is the snapshot `KnowledgeGet` resolves against, so a hit returned on any turn is readable on that turn and every later one. This is not a widening of the `document` scope axis: only uids the `kb`-gated search actually returned are admitted.

## Test plan
`tests/test_UAT_FC_BUG-185_search_hit_is_readable.workers.test.ts` (workerd, real D1/R2, real knowledge component; model and Workers AI doubled at the boundary, as in REQ-160):
- A session is opened and takes a turn; THEN a material is uploaded and indexed. On the next turn the model calls `KnowledgeSearch` (kb `project`), and then `KnowledgeGet` with the uid read out of that search result. The get returns the material's full text, not `not_in_corpus`.
- The same, via `KnowledgeChunkSearch`: a uid from a chunk hit is readable by `KnowledgeGet`.
- Search hits carry the corpus claims (`authority`/`origin`) the base surface declares.
Regression scope: REQ-158, REQ-160 (two-KB session + delta channel), REQ-123, BUG-55 suites.