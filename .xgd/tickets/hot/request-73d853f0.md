---
uid: request-73d853f0
id: REQ-355
type: request
title: 'Delegation: the builder can search the platform reference, and looks a limit
  up before reporting it'
created_by: EPIC-20
created_at: '2026-09-30T20:03:01.774395+00:00'
updated_at: '2026-09-30T21:11:49.138260+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  priority: high
  epic_parent: epic-0923bb64
  created_by: EPIC-20
  auto_merge_back: true
  needs_review: false
  commits:
  - working_sha: ee7ebbde847667518208c239e67c4baabbb50df7
    reconcile_sha: null
    main_sha: null
  version: 0.2.420
  story_points: 3
  chat_comment: comment-fca55984
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

## How it is built

- **A second declared builder order.** `priming.json` keeps `builder_priming` exactly as it was — the order a deployment with no system KB composes — and adds `builder_priming_with_corpus`: the same role text, then the system KB's map, then a `builder-reference` entry stating the look-it-up rule, then the mechanism (which carries the worker's own manual, so there is no separate `manual` entry). This mirrors the consultant's `priming` / `priming_without_corpus` pair.
- **The builder's own provider names** — `builder.km.landscape` / `builder.km.mechanism` — registered through upstream `registerKmProviders`' `landscapeName`/`mechanismName` parameters. The consultant's `km.landscape` is bound to its composite corpus, which on the Worker includes the client's project KB, so reusing it would have shown the worker a map of the client's material.
- **One helper, both hosts.** `roles.ts` `builderKnowledge(bridge, runtime, kb)` returns the surface factory (a fresh `KnowledgeToolbox` per call, granted `knowledgeInstanceConfig([kb])`) and the priming binding. `HostDeps.workerKnowledge` carries it; `host-core.ts` composes it into the worker's surface set only when delegation composes a worker, binds the priming to the worker's own box, and loads the with-corpus order only when it is present.
- **Worker:** `session-knowledge.ts` `sessionWorkerKnowledge(knowledge)` takes the SYSTEM runtime out of `perKb` (never the composite). **Node (`1c`):** `host.ts` builds it from the system KB it already opens.
- The `host-core.ts` comment on the worker's surface set is rewritten to state the new rule (platform reference in; client corpus, ledger, catalogue, session context out, with reasons).

## Design decisions

- **Separate provider names rather than sharing the consultant's.** The consultant and builder share one priming registry in one manager; a shared name would give one role the other's map/manual.
- **Two declared orders rather than null-rendering providers in one list**, matching the consultant, and so the no-KB builder prompt is byte-for-byte what it was. The role text is spelled in both lists; a UAT holds the two copies equal.
- **Out-of-scope search is refused by the grant**, not merely absent from the map: a worker that names `kb: ["project"]` gets the knowledge surface's scope refusal ("limited to: system").

## Test plan

UATs (`test_UAT_FC_REQ-355_*`):

- `tests/test_UAT_FC_REQ-355_builder_reads_the_platform_reference.workers.test.ts` (real route in workerd, delegation on, planted system KB, scripted model):
  - the builder is offered knowledge search beside its construction tools, and every tool it gains over the no-KB builder is a knowledge read;
  - a worker's search reaches the planted reference fact (`responsiveLayout`, DOC-L1), and a search scoped to the client's `project` KB is refused by the `kb` scope;
  - the worker's system prompt carries the role text, the map, the mechanism and the look-it-up rule, and not the corpus body;
  - with no system KB the builder has no knowledge tools, no map and no rule, and keeps its construction tools;
  - the builder still offers no ledger, catalogue or `Delegate` operation.
- `tests/test_UAT_FC_REQ-355_builder_priming_config.test.ts`: the role text is identical in both builder orders; the with-corpus order names the builder's own providers and the rule sits between map and mechanism; that order loads only with its providers bound; neither consultant order changes.

Regression scope run: REQ-295 / REQ-343 / REQ-353 / REQ-158 / BUG-145 / BUG-159 workers suites, all workers suites touching knowledge or delegation, and every Node suite reading `priming.json` / `roles.ts`. Two REQ-295 cases (check verdicts now carry `by`) and one REQ-296 case (worker vs caller ceiling equal) fail identically on the unchanged base — pre-existing, not caused by this change.