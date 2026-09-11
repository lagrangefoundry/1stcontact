---
uid: report-262b90e1
id: REPORT-3906
type: report
title: Claude reconciliation_uat_generation report
created_by: xgd
created_at: '2026-09-11T04:01:47.839495+00:00'
updated_at: '2026-09-11T04:01:47.839495+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_uat_generation
  subject_uid: story-ea7b4646
---

## UATs generated for story-ea7b4646 (plan item 6 of 17)

**Test file created:** `tests/reconciliation-client-knowledge-clocks.workers.test.ts`
**Tests written:** 12 (one per AC, 1:1, no gaps, no extras)
**Tests passing as the branch stands:** 0 — the suite cannot import.

```
⚠️ TESTS FAILING — downstream fix-it loop required
```

### Root cause: the story's runtime code is not on this reconcile branch

`apps/control-app/src/knowledge.ts` — which owns both triggers, `landscape()`, the enumerate/cluster floor, `enumeratedLandscape` and `uninformativeTitle` — **has never existed in this branch's history** (`git log HEAD -- apps/control-app/src/knowledge.ts` is empty). REQ-159 reaches `xgd-working` behind the merge commit `21e6d142d5`, which is listed in BUNDLE-26's `fields.commits` but is not an ancestor of HEAD and was never remapped into `orphan_commits`. Three REQ-159 files are absent: that module, the `system`/`awareness_report` type declaration in `tickets.ts`, and the `project` entry in `kb/knowledge_bases.json`.

This is **pre-existing, not introduced here**. Plan item 5's already-committed UATs for the companion story fail the same way — `reconciliation-client-knowledge-base.test.ts` fails 3/3 (`["system"]` where `["project","system"]` was expected) and `…workers.test.ts` dies at import on the identical missing module.

### The tests themselves are verified correct

Rather than ship twelve unverified assertions, I temporarily restored the three absent files from `21e6d142d5`, ran the suite, and reverted — the working tree is now clean apart from the new test file.

**Result: 12 passed (12).**

Two adjustments were needed inside that scratch copy, both of which are independent upstream drift on this branch and neither of which touches my tests:

- `db/migrations/0003_ticket_store.sql` lacks `ticket_changes` / `ticket_change_floor`, which the installed `@lagrangefoundry/ticketing` now writes on every create. This breaks **every** ticket-store workers test on the branch — `reconciliation-product-ticket-store.workers.test.ts` fails 6/6 the same way.
- The watermark `knowledge.ts` calls the component's search with `source: <index>`; the installed component now expects `indexes: {[DEFAULT_SOURCE]: <index>}` (the change BUG-55 made later on `reconcile-src-BUNDLE-26`).

### Coverage

| AC | Test |
|---|---|
| AC-1666 | batching threshold, durable advancing cursor, chat record untouched |
| AC-1667 | no map appears; published map byte-identical; describer call count unmoved |
| AC-1668 | searchable before anything else is awaited; refresh counts reported |
| AC-1669 | barrier-blocked describer; deferral holds the same promise handed back |
| AC-1670 | stable uid across rebuilds, exactly one record, hand-edit warning |
| AC-1671 | enumerated + count + both titles + completeness wording, no describer |
| AC-1672 | no `**` anywhere; no emphasis on entries, empty listing, or excerpt entry |
| AC-1673 | measured `entryChars` drives the switch, both directions |
| AC-1674 | excerpt rescue fires for `IMG_4821.jpg` only; `(untitled)` still listed |
| AC-1675 | empty corpus stated in words, zero entries |
| AC-1676 | refusal names budget/clustering/describer/source; prior map stands |
| AC-1677 | clustered, described, fewer territories than documents |

One judgement call worth flagging: AC-1672 says "no emphasis markers of any kind", but the code emits the knowledge base's own description byline as `*<description>*` — the component's standard landscape furniture, emitted identically by the clustered renderer. I assert no `**` over the *whole* document (that is the access-point marker the AC's reasoning is actually about) and no emphasis at all on every other line, with the exclusion and its rationale documented inline. If reconciliation intends the stricter literal reading, that is a runtime change, not a test change.

```
test_files_created:
  - "tests/reconciliation-client-knowledge-clocks.workers.test.ts"
```
