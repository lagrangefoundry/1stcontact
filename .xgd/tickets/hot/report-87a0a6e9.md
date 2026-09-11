---
uid: report-87a0a6e9
id: REPORT-3910
type: report
title: Claude reconciliation_uat_generation report
created_by: xgd
created_at: '2026-09-11T04:17:48.570948+00:00'
updated_at: '2026-09-11T04:17:48.570948+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_uat_generation
  subject_uid: story-6ccaedd5
---

I wrote the UATs and ran them. They fail — but not for a reason any test rewrite can fix, so I'm reporting rather than weakening them.

## What I found before writing

The story's implementation is **not on this reconcile branch**. Verified three ways:

- `git ls-tree -r HEAD -- apps/control-app/src` lists 11 files. `material.ts`, `describe.ts`, `fetch-guard.ts` and `knowledge.ts` are absent — they have never existed on this branch (`git log HEAD -- apps/control-app/src/material.ts` is empty).
- `git diff --stat main HEAD -- apps/control-app/src` is **empty**: the control-app source here is byte-identical to `main`. None of the bundle's source commits were applied.
- `apps/control-app/src/router.ts` on HEAD has no `/api/material` or `/api/material/fetch` route, and no `index`/`describeImage` deps.

The bundle's REQ-163 commit `548c053deb` (which the plan at `report-2746490a` names as this story's evidence) is reachable from `reconcile-src-BUNDLE-26` but is **not an ancestor of HEAD**.

This is not specific to plan item 7. The immediately preceding item (commit `b8726f2243`) generated `tests/reconciliation-client-knowledge-clocks.workers.test.ts`, which imports the same absent `apps/control-app/src/knowledge`. I ran an earlier generated sibling to confirm the pattern is real, not theoretical:

```
tests/reconciliation-client-knowledge-base.test.ts — Test Files 1 failed, Tests 3 failed (3)
  "the premise: the declaration this host reads declares both:
   expected [ 'system' ] to deeply equal [ 'project', 'system' ]"
```

A second, independent blocker sits underneath it: `tests/reconciliation-product-ticket-store.workers.test.ts` fails 6/7 with `no such table: ticket_changes` — this branch's `db/migrations/0003_ticket_store.sql` is behind the unpinned `@lagrangefoundry/ticketing` component, so `store.create` cannot succeed here even once the ingestion source lands.

## What I wrote

I grounded the tests in the real implementation as it landed at `548c053deb` (read via `git show`): `route(request, env, deps)` with `TENANT_ID` on the env, the `materialEnvelope` field set, `tooBig`'s megabyte wording, `warnUnindexed`'s `[ai]` text, and `kindOf`'s content-type-then-extension rules. They follow the existing workerd harness (`applySchema`, `stubEmbedder`, `keysUnder`) rather than inventing infrastructure.

Two places where I asserted the AC rather than the code as landed, deliberately:

- **AC-1679** enumerates both buckets around the ingestion and compares, instead of asserting a `t/<tenant>/blob/<sha256>` key. The AC says residency "is not about naming", and the addressing did later change from sha to attachment-uid — a key-shaped assertion would have been stale on arrival.
- **AC-1684** matches the message shape (`/That file is \d+(\.\d)?MB, and the limit is \d+(\.\d)?MB\./`) rather than the literal `25MB`, so it reads the ceiling from `MAX_MATERIAL_BYTES` instead of restating it.

```
UATs generated for story story-6ccaedd5 (plan item 7 of 17)

Story: story-6ccaedd5
Test file(s) created:
  - tests/reconciliation-material-ingestion.workers.test.ts

Tests written: 10   (AC-1678 … AC-1687, one per AC)
Tests passed: 0
Tests failed: 10 (suite did not import)
```

```
⚠️ TESTS FAILING — NOT a test defect; the source is absent from this branch

Error: Cannot find module '../apps/control-app/src/knowledge'
       imported from tests/reconciliation-material-ingestion.workers.test.ts
 Test Files  1 failed (1)
      Tests  no tests
```

Every one of the 10 fails at module resolution. `../apps/control-app/src/material` is missing for the same reason, and `router.ts` lacks the two ingestion routes the ACs are written against.

I did not self-correct further. The only edits that would turn this green are weakening ones — stubbing the pipeline, or skipping when the module is absent — and both would make the file assert nothing about ingestion. The fix belongs upstream of me: land the bundle's source commits on `reconcile-BUNDLE-26` (cherry-pick or replay `548c053deb` and its siblings from `reconcile-src-BUNDLE-26`), and bring `db/migrations/0003_ticket_store.sql` up to the ticketing component's current schema. Once both are in place these UATs should run as written.

No runtime code was modified and no existing test was touched — `git status` shows only the one new file.
