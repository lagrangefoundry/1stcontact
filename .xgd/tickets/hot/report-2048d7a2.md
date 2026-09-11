---
uid: report-2048d7a2
id: REPORT-3918
type: report
title: Claude reconciliation_uat_generation report
created_by: xgd
created_at: '2026-09-11T04:57:58.481133+00:00'
updated_at: '2026-09-11T04:57:58.481133+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_uat_generation
  subject_uid: story-77f8fc9e
---

## Summary

I wrote the 9 UATs, but **they cannot be run on this branch** — the code this story describes is not present in `reconcile-BUNDLE-26`.

### The blocker

`reconcile-BUNDLE-26` does not carry the bundle's code commits. Missing from `apps/control-app/src/`: `fetch-guard.ts`, `material.ts`, `describe.ts`, `knowledge.ts`, `system-knowledge.ts` — plus `tools/generate/src/cli/kb-model.ts` and the `unpdf` / `@anthropic-ai/sdk` dependencies the bundle's `package.json` adds. `git log --all -- apps/control-app/src/fetch-guard.ts` shows the file has never existed in this branch's history; `router.ts` here has zero `/api/material` routes.

This is not specific to my work: the previous plan item's file, `tests/reconciliation-material-ingestion.workers.test.ts` (committed at `aac35583a1`), fails identically with `Cannot find module '../apps/control-app/src/knowledge'`. Restoring the code would mean redoing the cherry-pick *and* a `pnpm install`, which is both outside this task's scope and a runtime-code change this task forbids.

### What I grounded the tests on

The bundle's actual tip, `c2f6c582ad` (verified as a descendant of all 12 SHAs on `bundle-87be4669`) — **not** `reconcile-src-BUNDLE-26`, whose `route()` takes a 4th `scope` argument and whose `material.ts` has diverged. At the bundle tip `route(request, env, deps)` is 3-arg, matching the branch and the prior item's test file. All assertions are read off that revision's source: the guard's exact refusal wording, `MAX_REDIRECTS`, `MAX_MATERIAL_BYTES`, the 400/403/413 mapping, and the `{error, url}` vs `{error, uid}` envelope shapes.

### One likely code/AC divergence

AC-1701 requires an IPv4-mapped loopback to be refused. It won't be: WHATWG `URL` normalises `https://[::ffff:127.0.0.1]/` to hostname `[::ffff:7f00:1]` (confirmed in Node), and `isPrivateHost` then recurses on `7f00:1`, which matches no rule and returns `false`. The code comment says it intends to catch this ("would otherwise smuggle 127.0.0.1 past the check above"); the normalisation defeats it. Per the AC-is-arbiter rule I asserted the refusal rather than the bug — that case is expected to fail once the code is present.

Lower-confidence assertion I could not verify: AC-1704 case 1 assumes workerd preserves an explicit `content-length` header on a `Response` built over a `ReadableStream`. If it strips it, the refusal falls through to the byte counter and that sub-case fails.

```
UATs generated for story story-77f8fc9e (plan item 9 of 17)

Story: story-77f8fc9e
Test file(s) created:
  - tests/reconciliation-guarded-fetch.workers.test.ts

Tests written: 9
Tests passed: 0
Tests failed: 9 (suite failed to import — source module absent from this branch)
```

⚠️ **TESTS NOT VERIFIED — branch is missing the code under test**

```
Failures:
  - all 9: Cannot find module '../apps/control-app/src/material' —
    fetch-guard.ts / material.ts / describe.ts are absent from reconcile-BUNDLE-26
    (same failure as the pre-existing tests/reconciliation-material-ingestion.workers.test.ts)
  - test_UAT_AC1701_...: expected to fail on content once the code lands —
    IPv4-mapped loopback is not refused (URL normalisation defeats isPrivateHost)

test_files_created:
  - "tests/reconciliation-guarded-fetch.workers.test.ts"
```

No runtime code was changed and no existing test file was modified; `git status` shows only the new file.
