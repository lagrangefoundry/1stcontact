---
uid: report-1f7c7a12
id: REPORT-4716
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-21T11:16:02.640119+00:00'
updated_at: '2026-09-21T11:16:02.640119+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

All eight conflicts are UU on code files (2c). Incoming is
`2745001058 feat(kb): the system knowledge base reaches the Worker
[FREE-CODED]` (Aug 31 18:22:02).

- `package.json` — UU, 2g scalar. Version `0.2.40` (HEAD) vs `0.2.27`
  (incoming). Incoming is a backwards bump from an older commit;
  kept HEAD.
- `tools/generate/src/cli/kb.ts` — UU, 2c. HEAD adds
  `import { isProjected, projections, type ProjectedDoc } from
  './kb-projection'`; incoming has no such line. Kept HEAD's import
  (used at 9 sites: 395, 441, 452, 525, 1138). The incoming side's
  actual REQ-158 payload — `SYSTEM_KB`/`SHIPPED_SOURCE`/`CORPUS_TYPE`
  moving to `kb-model.ts` — was unconflicted and is present (kb.ts:77).
- `tools/generate/src/cli/ai/host-core.ts` — UU, 2c. HEAD re-exports
  `CARETAKER_PURPOSE` from `./roles`; incoming declares it inline.
  Kept HEAD's re-export — same constant, single declaration site.
- `tools/generate/src/cli/ai/host.ts` — UU, 2c. HEAD adds the
  `knowledgeRoot` / `setKnowledgeRoot` test seam; incoming side of the
  hunk is empty. Kept HEAD (strict superset; `knowledgeRoot` is
  referenced at line 126 in the unconflicted region below).
- `tools/generate/src/cli/assets.ts` — UU ×3, 2c. HEAD is a strict
  superset each time: (1) `'mechanismText'` in `AI_WORKER_EXPORTS`,
  (2) `LANDSCAPE_PROVIDER`/`MECHANISM_PROVIDER`/`registerKmProviders`
  added beside `knowledgeInstanceConfig` in `AI_KNOWLEDGE_EXPORTS`,
  (3) the stage→out directory swap after `writeKbModule`. Kept HEAD.
- `apps/control-app/src/router.ts` — UU ×3, 2c. HEAD is REQ-160's
  two-KB session: `sessionKnowledgeFor` import, the per-isolate ticket
  store, and `workerHost(env, store, tenantId, tickets, knowledge)`
  composing `systemKnowledge` through `sessionKnowledgeFor`. Incoming
  is the earlier one-KB form. Kept HEAD.
- `apps/control-app/src/ai.ts` — UU ×3, 2c. HEAD's `workerHost` takes
  `tickets` + `SessionKnowledge` and wires
  `sessionKnowledgeSurface`/`sessionPriming`/`turnDelta`. Kept HEAD.
  Additionally removed line 61, `import { CARETAKER_PURPOSE } from
  '.../host-core'` — an incoming-only line git merged cleanly into an
  empty HEAD region. HEAD's `ai.ts` never references it (confirmed:
  `git show HEAD:apps/control-app/src/ai.ts | grep CARETAKER_PURPOSE`
  is empty), because `host-core.ts` now owns the role-purpose position
  in the entry list. Leaving it would be a dangling unused import.
- `apps/control-app/src/system-knowledge.ts` — AA-shaped UU ×5, 2c.
  HEAD is the evolved peer: `indexes`/`chunkIndexes` keyed by
  `SHIPPED_SOURCE` (vs incoming's `source`/`chunkSource`), the
  `SHIPPED_SOURCE` re-export, and `knowledgePriming` as a named
  provider pair via `registerKmProviders` (vs incoming's
  `KnowledgeDocs.open(runtime, {rolePurpose, mechanism})`). The file's
  own comment records that `KnowledgeDocs.open()` is gone upstream.
  Kept HEAD.

Net: all eight source files resolve byte-identical to HEAD
(`git diff HEAD -- <the eight>` is empty). The cherry-pick's remaining
contribution is its two new UAT files, staged unchanged:
`tests/test_UAT_FC_REQ-158_system_kb.workers.test.ts` and
`tests/test_UAT_FC_REQ-158_system_kb_bundle.test.ts`. HEAD carries no
REQ-158 tests of its own, so nothing was dropped there.

No UAT function on either side of any conflict was deleted.

## Incoming changes preserved

The incoming source changes are already in HEAD — they were integrated
before this resync queue reached them, then evolved. This is the
BUG-1301 precedence case, and it is verifiable rather than asserted:

- `eb4ee1610d Merge branch 'free-REQ-158' into xgd-working`
  (Aug 31 18:22:09, cherry-picked from `d4d50859a2`) is an ancestor of
  HEAD (`git merge-base --is-ancestor eb4ee1610d HEAD` → true). It is
  the merge of the very branch `2745001058` was free-coded on, seven
  seconds after it, and touches the same file set.
- `git diff 2745001058 eb4ee1610d --stat` over the eight source files
  plus `bin/1c.mjs` reports only `host-core.ts` and `kb.ts` as
  differing — `system-knowledge.ts`, `kb-model.ts`, `ai.ts`,
  `router.ts`, `assets.ts` and `1c.mjs` are byte-identical between the
  incoming commit and the already-integrated merge. The two that
  differ do so because `eb4ee1610d`'s branch point carried unrelated
  work, not because REQ-158 content is missing.

Spot-checked in the resolved worktree, every REQ-158 payload is live:

- `kb-model.ts:24,34,37` — `SYSTEM_KB`, `SHIPPED_SOURCE`,
  `CORPUS_TYPE`, the shared declarations the Worker needs because
  `kb.ts` names `node:fs`.
- `kb.ts:77` re-export; `kb.ts:1039` `export async function kbBundle`.
- `assets.ts:484` `writeKbModule`, `:649` `kbLine` (the loud
  NOT-BUILT line), `:414` `writeAiKnowledgeShim`, `:589` its call.
- `bin/1c.mjs:85` `const report = await assets.cmdAssets(...)`, with
  the REQ-158 comment at `:80` explaining the await.
- `apps/control-app/src/system-knowledge.ts` exists as the
  `openKnowledgeRuntime` peer, opening the KB from bundle values
  through `memoryIndexSource` + `bundleDocReader` with no filesystem.

Hunks not textually applied, and the HEAD-side commit that already
superseded each:

- `system-knowledge.ts` `source:`/`chunkSource:` → `eb4ee1610d`
  landed this file, and subsequent reconcile commits
  (`2a51b34e2a`, `1b269f32c6`, `6f83befde4`,
  `Workflow fix_reconciliation_review completed: done`) moved it to the
  source-name-keyed `indexes`/`chunkIndexes` to match the KB's declared
  `source`. Same seam, renamed and generalised — a component API
  change, not a dropped capability.
- `system-knowledge.ts` `knowledgePriming(runtime, rolePurpose)` →
  `KnowledgeDocs.open` → superseded by the same reconcile chain after
  `KnowledgeDocs.open()` was removed upstream: it served a synchronous
  `ContextSource` from a once-assembled snapshot, which by construction
  cannot reflect a document published after the session opened. The
  replacement is the `LANDSCAPE_PROVIDER`/`MECHANISM_PROVIDER` pair
  registered via `registerKmProviders`, whose bodies re-read the
  runtime per assembly. A correctness fix, not a shortcut.
- `host-core.ts` inline `CARETAKER_PURPOSE` → moved to `./roles`
  (`6ee97c4ce3 Merge branch 'free-REQ-160'`; `roles.ts` predates it)
  and re-exported from `host-core.ts`, preserving both hosts' import
  paths. Identical string, one declaration site.
- `router.ts`/`ai.ts` one-KB `workerHost(env, store, tenantId,
  knowledge)` → REQ-160's two-KB session
  (`6ee97c4ce3 Merge branch 'free-REQ-160' into xgd-working`). The
  system KB still flows through `deps.knowledge ?? systemKnowledge`;
  REQ-160 composes the tenant's project KB beside it rather than
  replacing it. Strict extension of the incoming wiring.
- `ai.ts` `import { CARETAKER_PURPOSE }` → removed as a consequence of
  the `./roles` move above; HEAD's `ai.ts` has no reference to it.

Each of these is a documented, already-integrated refactor on the HEAD
side, not a resolution shortcut taken here. No incoming capability was
discarded.
