---
uid: report-dafdf43a
id: REPORT-5358
type: report
title: 'Resync resolve conflicts: 6ba006de764d843fa7f4357df2b341e72f20e2f6'
created_by: xgd
created_at: '2026-09-28T19:53:25.412773+00:00'
updated_at: '2026-09-28T19:53:25.412773+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

Cherry-pick `115f0d39ec` — "feat(kb): the project knowledge base — tenant corpus, R2 index, two triggers [FREE-CODED]" (REQ-159, authored 2026-08-31).

Five conflicted paths, all class UU/AA, all inside the sparse cone. Resolved hunk-by-hunk in the working tree (not via wholesale `checkout --ours`) except `assets.ts`, where the working tree was first verified to differ from the HEAD blob *only* by conflict markers and incoming-only lines, making `--ours` exactly equivalent to a per-hunk resolution with nothing cleanly-merged lost.

## Files resolved

- **`tools/generate/src/cli/assets.ts`** — UU, code (2c). Six hunks. Five had an *empty* incoming side; the sixth's incoming side was a strict subset (`loadIndex`, `publishAwarenessReport`, `resolveCorpus`, `search`) of HEAD's `KNOWLEDGE_EXPORTS`. Every REQ-159 addition already sits in HEAD, which additionally carries REQ-158 (`aiKnowledgeEntry`, `writeKbModule`, `writeAiKnowledgeShim`) and REQ-160 (`searchChunks`, `DEFAULT_TOP_K`, `DEFAULT_CHUNKS_PER_HIT`). Kept HEAD as the strict superset.
- **`tools/generate/src/cli/kb.ts`** — UU, code (2c). One hunk. Incoming re-declared `PROJECT_KB` (already declared 13 lines above on the HEAD side) plus a local `export const CORPUS_TYPE = 'doc'`. Dropped the duplicated block; see PRECEDENCE below for `CORPUS_TYPE`. The commit's other kb.ts hunks — the `[PROJECT_KB]` scaffold block in `ensureConfig` and the one-KB `bindKb` return — merged cleanly and are present.
- **`apps/control-app/src/knowledge.ts`** — AA, code (2c). Two hunks. (1) `DescriberNotConfiguredError` message wording; kept HEAD's phrasing (no test asserts on this string — grepped `apps/ tests/ tools/ kb/`). (2) the `kmSearch` call shape; see PRECEDENCE below. Export surfaces of the two sides are otherwise byte-identical (21 exports each).
- **`tests/support/stub-embedder.ts`** — AA, test support. Two hunks, both inside the file's header doc-comment; the executable body is identical on both sides. Kept HEAD's reconciled wording ("client-KB"/"account", per story-5281f009) plus its extra `COUNTED` paragraph documenting `calls`. No test function on either side was touched, let alone deleted.
- **`package.json`** — UU, config. Version scalar only: HEAD `0.2.40` vs incoming `0.2.23`. **Deviation from rule 2g noted deliberately:** 2g says scalars take the incoming value, but the per-file enrichment for this path says "take the more recent commit by timestamp," and a package version is a monotonic counter, not a setting — applying 2g literally would regress the branch 17 patch releases. Kept `0.2.40`. Flagging rather than silently choosing.

## Incoming changes preserved

Verified against `git show $CPHEAD -- <file>` for each code file:

- **`assets.ts`** — all five REQ-159 wiring points present in the resolution: `knowledgeEntry` on `AssetBuildReport` (:89), `function writeKnowledgeShim` (:308), its call site (:588), the return-object field (:612), and the `formatAssetReport` line (:631). All 15 incoming `KNOWLEDGE_EXPORTS` names present.
- **`kb.ts`** — `PROJECT_KB` (:89), `PROJECT_CORPUS_TYPES` (:92), the `[PROJECT_KB]` scaffold block with `landscape: 'derived'` (:602-609), and the `new Map([[SYSTEM_KB, kb]])` return from `bindKb` (:695).
- **`knowledge.ts`** — the entire 656-line REQ-159 component lands; the two sides' export lists match name-for-name and line-for-line.
- **Non-conflicted payload** — `tickets.ts`, `wrangler.toml`, `kb/knowledge_bases.json` applied without conflict (identical on both sides), and both REQ-159 UAT files staged as new adds.

### Hunks dropped under BUG-1301 PRECEDENCE

Two, both where the incoming hunk's sole target had already been relocated/replaced by a legitimate refactor already integrated into HEAD:

1. **`kb.ts` — `export const CORPUS_TYPE = 'doc'`.** Removed from this file by `eb4ee1610d` (merge of `free-REQ-158`), which extracted `SYSTEM_KB`/`SHIPPED_SOURCE`/`CORPUS_TYPE` into `tools/generate/src/cli/kb-model.ts` (`CORPUS_TYPE` at kb-model.ts:37). Legitimate rather than churn: the refactor is documented in-file with a stated reason — the Worker needs the same three constants and cannot import `kb.ts`, because everything else in it reaches a filesystem, which must not appear on the query path — and it is non-breaking by construction, since kb.ts:77 re-exports all three so every importer of `../kb` still resolves them. Re-adding the incoming line would be a duplicate-identifier compile error, and the incoming *intent* (a `CORPUS_TYPE` reachable from `../kb`) is satisfied by the re-export.
2. **`knowledge.ts` — `kmSearch(query, { source: this.index, ... })`.** The `source` parameter was superseded by the `indexes` map in `2a51b34e2a`, the REQ-160 co-ranked fan-out that lets one session search two knowledge bases and merge on the component's own scores. Legitimate rather than churn: it is an upstream component signature change, adopted consistently across eight other call sites already in HEAD (`session-knowledge.ts:199,231,324`, `system-knowledge.ts:152`, `reconciliation-system-knowledge-base.test.ts:461,484`, `reconciliation-projected-reference.test.ts:932`, and this line). Taking the incoming form would leave the component with no index registered for this source, which it refuses by name at runtime — i.e. it would break the very search REQ-159 exists to provide.

No UAT function on either side of any conflict was deleted.

## Post-resolution check

`tests/test_UAT_FC_REQ-159_project_kb_config.test.ts` — 8/8 pass against the resolved tree (`vitest.node.config.mts`). `tests/test_UAT_FC_REQ-159_project_kb.workers.test.ts` could not be executed here (vitest-pool-workers/miniflare needs to bind a socket; EPERM under this sandbox), so it was verified statically instead: every name it imports is exported by the resolved `knowledge.ts`, every method it calls (`onTranscriptGrew`, `onMaterialWritten`, `publishedMap`, `transcriptCursors`, `landscape`, `rebuildMap`, `refreshIndex`, `search`, `corpus`) exists, and its `projectKnowledgeFor` options object matches the resolved signature exactly.

## Flagged for post-merge review

- `package.json` — version-scalar deviation from 2g, per the reasoning above.
- Both REQ-159 UAT files duplicate coverage already carried by HEAD as `tests/reconciliation-client-knowledge-base.workers.test.ts` and `tests/reconciliation-client-knowledge-clocks.workers.test.ts` (the reconciled successors, renamed, which is why they applied without a path conflict). Left in place — staging is this step's scope, and dropping payload files is not a conflict resolution. Worth a look by whoever owns the queue: the source half of this commit is entirely already-applied, so the net commit is these two test files alone.
