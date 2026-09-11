---
uid: comment-c10d9803
id: COMMENT-2704
type: comment
title: Claude response for reconciliation_uat_generation report
created_by: xgd
created_at: '2026-09-11T05:59:57.220020+00:00'
updated_at: '2026-09-11T05:59:57.220020+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-46f5f585
  kind: note
---

UATs written and run. They fail — and the cause is not the tests.

## What I did

Extended the story's own UAT file (`tests/reconciliation-material-types.workers.test.ts`) rather than creating a second one: plan item 13 **restates** AC-1492 to carry the role, so that existing test had to be updated in place, and splitting the story's twelve criteria across two files would fragment it.

- **`test_UAT_AC1736_…`** — identical bytes ingested twice under the two roles; the differing field set is *computed* (expects exactly `['republishable','role']`), absence leaves the provenance reading untouched, six malformed answers (including `'Site'`) are refused with the permitted answers named and leave no record and no blob, and fetched material lands as `reference` whatever the caller supplied.
- **`test_UAT_AC1737_…`** — `description_status` is a closed enum of the six outcomes and `description_model` free text, both optional on both kinds; a described file and an undescribed one both carry the pair on the single listing row; selecting on the outcome returns exactly the shortfall.
- **`test_UAT_AC1738_…`** — `filename` declared and optional on both kinds; ingested files read back under the name they arrived with; one listing carries every name; a record with a filename but **no attachment at all** still lists under it (which is what proves the name is read off the record, not an attachment lookup), and a nameless record falls back to its title.
- **AC-1492** gained the restated clause: the role is accepted on both kinds with the same two values, and absent means absent.

## Test run: 12 tests, 12 failed — two distinct causes, neither in the tests

**1. The bundle's production code is not on this branch.** `git ls-tree 548c053deb apps/control-app/src/` has `material.ts`, `describe.ts`, `fetch-guard.ts`, `knowledge.ts` and a `tickets.ts` carrying all four fields. `git ls-tree HEAD` has none of them. So `MATERIAL_FIELDS` here is the seven-field REQ-162 version, and `POST /api/material` doesn't exist — the request falls through to the SPA asset fallback and answers `200 text/plain "asset"`. AC-1736/1737/1738 fail on exactly that. This is the same per-intent gap already recorded for plan items 5 and 7–10 on this branch.

**2. Upstream schema drift breaks every ticket write, branch-wide.** `@lagrangefoundry/ticketing` now writes a change journal on create, but `db/migrations/0003_ticket_store.sql` transcribes only the older `SCHEMA_STATEMENTS` — so all nine pre-existing tests (AC-1491…1499, which passed when written) now die with `D1_ERROR: no such table: ticket_changes`. This is present at the bundle tip too, so it post-dates these commits; it is not a regression this story introduced.

I did not weaken any assertion to accommodate either, and changed no runtime code. One judgment call worth flagging: AC-1736's "reads back carrying none" is true at the store boundary (the vocabulary this story owns) but not at the ingestion boundary, where `classify` records an absent answer as `role: 'site'` — §10.1's unchanged provenance answer. I asserted the absence through the store and the *invariance* ("callers that predate the question behave exactly as they did") through ingestion, which covers every clause at the boundary where it is meaningful. If the intended reading is that the pipeline must leave the field unset, that is a code fix, not a test fix.

```
UATs generated for story story-e07c589b (plan item 13 of 17)

Test file(s) created:
  - tests/reconciliation-material-types.workers.test.ts  (extended in place)

Tests written: 3 new (AC-1736, AC-1737, AC-1738) + AC-1492 extended
Tests in file: 12
Tests passed: 0
Tests failed: 12

⚠️ TESTS FAILING — downstream fix-it loop required

  - test_UAT_AC1736/1737/1738: REQ-163/REQ-161 code absent from this branch
      (no material.ts, no /api/material routes, MATERIAL_FIELDS lacks role,
       description_status, description_model, filename)
  - test_UAT_AC1491…1499: pre-existing — D1_ERROR: no such table: ticket_changes
      (db/migrations/0003_ticket_store.sql is behind upstream SCHEMA_STATEMENTS)

test_files_created:
  - "tests/reconciliation-material-types.workers.test.ts"
```

Neither failure is fixable from inside this prompt's constraints — one needs the bundle's commits replayed onto `reconcile-BUNDLE-26`, the other needs a migration edit.
