---
uid: request-73d853f0
id: REQ-355
type: request
title: 'Delegation: the builder can search the platform reference, and looks a limit
  up before reporting it'
created_by: EPIC-20
created_at: '2026-09-30T20:03:01.774395+00:00'
updated_at: '2026-09-30T20:03:01.774395+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: high
  epic_parent: epic-0923bb64
  created_by: EPIC-20
  auto_merge_back: true
  needs_review: false
---

## What changes

The builder (the delegation worker) can search the platform's own reference knowledge base — the same **system KB** the consultant searches, holding the L1 reference and platform documents. Read-only. It still has no access to the client's own corpus, the engagement ledger, the catalogue, or any conversation.

## Why

In the first live delegation session (Gigabyte Alchemy, 2026-09-29; recorded on EPIC-20) a worker stated in its report that containers do not support per-width layout. They do — `responsiveLayout` is in the L1 reference word for word. The worker had no way to look it up, so it guessed, and wrote the wrong constraint into its `decisions`. The next session would have read it as fact. An *"it can't be done"* is the one report a caller cannot check against the change record, because it produces nothing to check.

The worker was built without a corpus deliberately (`host-core.ts`, the worker's surface set: *"no knowledge corpus, no ledger, no catalogue, no session context"*). The reason given — the ledger and catalogue are the engagement's, and a worker must not be a second author on them — is right for those and does not apply to reading the platform reference. The client's corpus stays excluded for the reason the builder's role prose states: the worker does not see the client conversation and must not form its own view of what the client wants.

## Behaviour

1. The builder is composed with the knowledge surface for the **system KB only** (`knowledgeSurfaceFor` / `knowledgeInstanceConfig([SYSTEM_KB])`), where the deployment has one. Where it does not, the builder is composed exactly as today.
2. **Search comes with its priming, or not at all.** The builder gets the landscape and mechanism entries alongside the tools, on `system-knowledge.ts`'s rule that search without priming is the same failure as no search.
3. The builder's role prose gains one rule: **before reporting that something cannot be done, look it up**; a limit stated in a report must be one the worker found, not assumed.
4. The builder cannot reach any other KB, any ledger, catalogue, or session record — unchanged from today and asserted.
5. The `host-core.ts` comment giving the reason for the old exclusion is revised to the rule above, not left contradicting the code.
6. Nothing changes for the consultant.

## Test plan

UATs (`test_UAT_FC_<ID>_*`): the builder's offered tools include knowledge search scoped to the system KB and nothing wider; its priming carries the landscape; a deployment with no system KB composes the builder as before; the builder still offers no ledger, catalogue or client-corpus operation.
