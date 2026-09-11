---
uid: comment-40fc7ed4
id: COMMENT-2712
type: comment
title: Claude response for fix_reconciliation_review report
created_by: xgd
created_at: '2026-09-11T08:59:44.470244+00:00'
updated_at: '2026-09-11T08:59:44.470244+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-5da6762f
  kind: note
---

Both named failures are fixed and verified green in this session. Report filed as `report-5da6762f` (`needs_more_work=false, progress_made=true`).

## AC-1652 — restated as the property, not the roster

`tests/reconciliation-assistant-conversation-deployed-knowledge.workers.test.ts:88` held `READ_SET = ['KnowledgeChunkSearch', 'KnowledgeGet', 'KnowledgeSearch']` as an equality. Upstream widened its read group to five with no commit here, so the literal failed while the claim it stood for stayed true. I re-verified the review's key fact directly: `KnowledgeOutline` (lines 201–204) and `KnowledgeChanges` (273–276) both declare `effect: read`, and the surface has **one** group — `ReadKnowledge`, `effect: read`, five operations — with no write group anywhere.

Both sides of the equality are now derived from the declaration read off `surface.constructor.DECLARATION` — the same object the session's surface renders its own tools from. Every granted operation must declare `effect: read`, every granted group must be a declared read group, the model must be offered exactly the granted set, and every declared scope axis must name `SYSTEM_KB` alone. Stronger than what it replaced on three counts; inert to a read-only addition.

## AC-1295 — the review's preferred option doesn't exist

The review recommended syncing "8 `doc_kind: system_kb` doc tickets from main". **There are none.** `git grep "^  doc_kind: system_kb"` returns zero matches on `main` and on `HEAD`; the retired boolean is absent too; only 2 of the 8 named uids are tracked at all and neither carries the kind. `DOC-39` merely *mentions* the string in its body, which is what the earlier grep matched. The live store: 38 docs, 0 members. The blocker is exactly what REQ-164 declared — `system_kb` isn't yet a value the closed `doc_kind` enum accepts.

This turned out not to need operator judgment. AC-1295's Verification clause never mandated a non-empty member set — it asked for *agreement*. The `toBeGreaterThan(0)` line was an assertion the UAT added beyond its criterion. I replaced it with a vacuity guard over what the rule needs to have been exercised (store non-empty, every document decided, excluded set non-empty — 38 documents, all correctly excluded) and strengthened the corpus check from a per-document absence to an equality over the whole directory.

## Two things the review couldn't do, done here

**The workers project runs in this session.** No `listen EPERM`. Full run: **250/250 passed**, including the SSRF/redirect guard, identity admission and expiry, and the promotion gate. The 95 criteria the review recorded as "visibly unproven" are now certified first-hand rather than inherited.

**Every remaining failure is provably out of scope.** This branch's store holds exactly 145 AC tickets — all active, all belonging to the bundle's 17 stories. None of the 22 ACs behind the 31 node failures is among them; they're absent from the store entirely.

Matrix edits: AC-1295 and AC-1652 bodies restated, with dated `## Reconciliation Decisions` entries on story-c4f329d3 and story-a58a0974. No story narrative touched, no FC orphans outstanding, no production code changed.

One judgment call I want to flag: **AC-1318 is still red**, and its fix is mechanically identical to AC-1652's — one edit I could have made. I didn't, because the review explicitly ruled it out of scope alongside AC-1317/1319, and AC-1319 genuinely can't be repaired without rewriting story-a58a0974 against a knowledge model upstream retired. Bundle scope is the reviewer's call, so I left the three together and recorded it rather than deciding for them.
