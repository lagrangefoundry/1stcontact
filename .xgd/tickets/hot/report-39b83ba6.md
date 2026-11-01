---
uid: report-39b83ba6
id: REPORT-7439
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-35'
created_by: xgd
created_at: '2026-11-01T07:06:00.919232+00:00'
updated_at: '2026-11-01T07:06:00.919232+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-35
---

## Files resolved

- apps/control-app/src/router.ts — UU, code file (2c rule 3b: both sides made independent useful changes, merged by hand). HEAD (reconcile bundle-fd009b93) added `sessionFidelity` (looking surface) and an `origin` parameter on `chatHost`. Incoming (free-REQ-168) made the chat host per business (`CHATS` map keyed by `scope.businessId`) and passed `scope` through store/tickets/knowledge/indexer. Result: `chatHost(env, scope, deps, origin)`, cached per business, still builds the fidelity deps. `sessionFidelity` now takes `scope` instead of `tenantId`: it uses `forTenant(scope.businessId)` and `deps.index(env, scope)` / `defaultIndexer(env, scope)`. All three /api/ai/* call sites pass `(env, scope, deps, url.origin)`. FLAG FOR POST-MERGE REVIEW: HEAD builds preview URLs from `url.origin`, but REQ-168 routes requests under a per-business path prefix. The looking surface may need that prefix in the URLs it fetches. Not resolved here, because fixing it would mean writing new code.
- tests/test_UAT_FC_REQ-158_system_kb.workers.test.ts — DU (2a/2f): restored the incoming version.
- tests/test_UAT_FC_REQ-159_project_kb.workers.test.ts — DU (2a/2f): restored the incoming version.
- tests/test_UAT_FC_REQ-167_identity.workers.test.ts — DU (2a/2f): restored the incoming version.
  HEAD never deleted these files on purpose; they never landed on it. The REQ-167 feature commit cherry-picked to HEAD (5f65959253) left its UAT file out with no stated reason. The REQ-158 and REQ-159 add commits (2745001058, 115f0d39ec) are not on HEAD at all, yet the code those tests cover (system-knowledge.ts, knowledge.ts, identity.ts) is. No documented refactor removed them, so the default applies: not a legitimate deletion, and 2f says keep the tests. FLAG FOR POST-MERGE REVIEW: these suites come from REQs outside this bundle and may need fixes to pass on this branch.

## Incoming changes preserved

- router.ts: confirmed against `git show CHERRY_PICK_HEAD`. Present: the scope import and `splitBusinessPrefix` path stripping, the `CHATS` map with eviction when a host fails to build, `CHATS.clear()` in `resetChatHost`, `scope` in the `route`/`routeUncached` signatures, the `RouterDeps` seams typed with scope, and every `storeFor`/`ticketStoreFor`/`projectKnowledgeFor`/`sessionKnowledgeFor`/indexer call taking `scope`.
- The three UAT tests match the incoming commit byte for byte (no diff against CHERRY_PICK_HEAD).
- Type-check: `tsc --noEmit` on apps/control-app reports no errors in router.ts. The errors it does report are missing `./generated/*` modules (not in the sparse checkout) and two `_declared` errors in session-knowledge.ts, which I did not touch.
