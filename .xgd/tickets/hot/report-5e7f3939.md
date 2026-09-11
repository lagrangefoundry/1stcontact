---
uid: report-5e7f3939
id: REPORT-3902
type: report
title: Claude reconciliation_uat_generation report
created_by: xgd
created_at: '2026-09-11T03:43:31.257324+00:00'
updated_at: '2026-09-11T03:43:31.257324+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_uat_generation
  subject_uid: story-5281f009
---

## Blocking finding first

**The implementation this story is about is not on this branch.** Plan item 5 covers REQ-159, whose commit is listed in `BUNDLE-26`'s `fields.commits` (`21e6d142d5`, the `free-REQ-159` merge) but is not an ancestor of `HEAD`:

| Artefact REQ-159 landed | On `xgd-working` | On `reconcile-BUNDLE-26` |
|---|---|---|
| `apps/control-app/src/knowledge.ts` (656 lines — the whole capability) | yes | **absent** |
| `project` entry in `kb/knowledge_bases.json` | yes | **absent** (only `system` declared) |
| `[ai]` / `[env.production.ai]` in `apps/control-app/wrangler.toml` | yes | **absent** |
| `bindKb` serving `system` alone | yes | **absent** (still returns the whole declaration) |
| `KNOWLEDGE_EXPORTS` in `tools/generate/src/cli/assets.ts` | yes | **absent** |

The tell is a date split, not a missing cherry-pick: the branch has the bundle's Sept-10 merges (`free-REQ-165`, which brought `tests/test_UAT_FC_REQ-165_projected_reference.test.ts` with it) but not its Aug-31 ones. The remapped REQ-159 commit (`a3455307e5`) exists only on `origin/reconcile-BUNDLE-23` — a different concurrent run. The plan's own §"FC UATs" expects `test_UAT_FC_REQ-159_project_kb.workers.test.ts` and `…_config.test.ts` to be in the tree; neither is.

This is neither "the test is wrong" nor an ordinary code-diverges-from-intent regression. There is nothing on this branch for the fix-it loop to repair, and I did not add the implementation — runtime edits are prohibited here.

## What I wrote anyway

The UATs are faithful to the ACs and grounded in the real implementation (read out of git at `a3455307e5`), so they are correct evidence the moment the commit is replayed. They fail loudly rather than vacuously — I strengthened AC-1658 after its first run passed only because both sides of the comparison were `undefined`.

```
UATs generated for story story-5281f009 (plan item 5 of 17)

Story: story-5281f009
Test file(s) created:
  - tests/reconciliation-client-knowledge-base.test.ts          (node:    AC-1654, AC-1658, AC-1659)
  - tests/reconciliation-client-knowledge-base.workers.test.ts  (workerd: AC-1655, AC-1656, AC-1657,
                                                                 AC-1660, AC-1661, AC-1662, AC-1663,
                                                                 AC-1664, AC-1665)
  - tests/support/stub-embedder.ts                              (counting model seam, no test functions)

Tests written: 12   (one per AC, 12 ACs)
Tests passed:  0
Tests failed:  12
```

⚠️ **TESTS FAILING — the cause is a missing commit, not a fixable test**

```
Failures:
  - test_UAT_AC1654_… : kb/knowledge_bases.json declares only `system`; no `project` entry
  - test_UAT_AC1658_… : ensureConfig scaffolds no client knowledge base
  - test_UAT_AC1659_… : the declaration this host reads declares one, not two
  - AC-1655, AC-1656, AC-1657, AC-1660, AC-1661, AC-1662, AC-1663, AC-1664, AC-1665:
      suite cannot collect — "Cannot find module '../apps/control-app/src/knowledge'"

test_files_created:
  - "tests/reconciliation-client-knowledge-base.test.ts"
  - "tests/reconciliation-client-knowledge-base.workers.test.ts"
  - "tests/support/stub-embedder.ts"
```

Naming is clean against `^test_UAT_AC\d+_\w+$` for all 12, and `tests/` is outside every package `tsconfig` `include`, so the unresolvable import cannot break the branch's `tsc` gate.

The operator-level fix is to replay REQ-159's commit onto `reconcile-BUNDLE-26` (or drop items 5–6 from the bundle and let BUNDLE-23 carry them); the same date split likely affects items 7–17, which cover REQ-163/161/167 and also merged on Aug 31 — I verified REQ-159 directly and did not confirm the others.
