---
uid: report-1adf18b8
id: REPORT-3486
type: report
title: Claude reconciliation_uat_generation report
created_by: xgd
created_at: '2026-09-04T04:08:05.707064+00:00'
updated_at: '2026-09-04T04:08:05.707064+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_uat_generation
  subject_uid: story-70a922b9
---

12 UATs written, one per AC, all driven through the Worker's own route table against real D1 and R2. 8 pass; 4 fail, and in each case the failure is in the code rather than the test — verified by neutralising only the divergent assertion and confirming every other assertion in those four tests passes.

```
UATs generated for story story-70a922b9 (plan item 7 of 15)

Story: story-70a922b9
Test file(s) created:
  - tests/reconciliation-material-ingestion.workers.test.ts

Tests written: 12
Tests passed: 8
Tests failed: 4

test_files_created:
  - "tests/reconciliation-material-ingestion.workers.test.ts"
```

**Passing (8):** AC-1536, AC-1538, AC-1539, AC-1541, AC-1542, AC-1543, AC-1546, AC-1547.

⚠️ **TESTS FAILING — downstream fix-it loop required.** All four are code/AC divergences, not test defects:

- `test_UAT_AC1544_…` — **a real address-guard hole.** `https://[::ffff:127.0.0.1]/secrets` is **fetched, not refused** (200, material created). WHATWG `URL` normalises the embedded IPv4 to `::ffff:7f00:1`, and `isPrivateHost`'s `::ffff:` branch (`fetch-guard.ts:126`) only recurses on the dotted form, so the hex form falls through to `return false`. The existing node UAT misses it because it calls `isPrivateHost('::ffff:127.0.0.1')` with the un-normalised string. Every other address in the AC's list (17 of 18) is refused correctly with no request made.

- `test_UAT_AC1545_…` — a refused **redirect hop** reports the hop's address, not the caller's. `guardedFetch` re-enters `assertFetchable(newUrl)` (`fetch-guard.ts:178`), which constructs `FetchRefusedError(msg, raw)` with the *hop* as `raw`. This contradicts both the AC and the field's own doc comment ("the ORIGINAL where a hop was refused", `fetch-guard.ts:58`). The load-bearing half — the loopback address was never requested — passes.

- `test_UAT_AC1537_…` — an **empty retrieved document** is refused without naming the address. `ingestFetch` throws `MaterialRejectedError` (`material.ts:305`), whose message carries no URL and which the router renders without the `url` field, so nothing in the refusal identifies what was asked for. The unsuccessful-answer case does name it. Everything else in the test (final-hop provenance, redirect case, no material created) passes.

- `test_UAT_AC1540_…` — a **pre-existing shared-component regression**, not specific to this story: `ProjectKnowledge.search` (`knowledge.ts:336`) passes `source:` to the knowledge component, which now wants a keyed source map — `KnowledgeConfigError: … has no index for (available: none)`. This already breaks `reconciliation-project-knowledge-base.workers.test.ts` (4 failures) and `test_UAT_FC_REQ-163_ingestion.workers.test.ts` (2 failures) on this branch. I could not diagnose the correct call shape because `@lagrangefoundry/knowledge`'s sources are outside the sandbox's read allowlist. The "offered exactly once, never zero, never twice" half and the incremental-index half both pass; only the immediate-search half is blocked.
