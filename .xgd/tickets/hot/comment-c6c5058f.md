---
uid: comment-c6c5058f
id: COMMENT-2691
type: comment
title: Claude response for reconciliation_uat_generation report
created_by: xgd
created_at: '2026-09-11T02:30:17.868690+00:00'
updated_at: '2026-09-11T02:30:17.868690+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-900a9b04
  kind: note
---

## Completion Report

```
UATs generated for story story-c4f329d3 (plan item 1 of 17)

Story: story-c4f329d3
Test file(s) written:
  - tests/reconciliation-system-knowledge-base.test.ts

Tests written: 18   (1:1 with the story's 18 ACs)
Tests passed:  1
Tests failed:  17
```

**On the file choice** — I rewrote the story's own existing UAT file rather than adding a second one. Plan item 1 *modifies* AC-1295/1296/1300/1293 (membership moves from a boolean to a kind). A new file would have left `test_UAT_AC1295_only_a_genuine_boolean_true_opts_a_document_in` on disk asserting the superseded rule, giving AC-1295 two contradictory tests. No other test file was touched; no runtime code was changed.

## ⚠️ TESTS FAILING — and the cause is not the tests

Every one of the 17 failures traces to **the branch not containing the code the ACs describe**. Two independent gaps:

**1. REQ-164's commit is in the bundle but never landed on this branch.**
`bundle-87be4669` lists `858d63202f` ("corpus export selects by doc_kind, unrestricted, exhaustive") as its first commit with `reconcile_sha: null`. `git merge-base --is-ancestor 858d63202f HEAD` → not an ancestor. `tools/generate/src/cli/kb.ts` still exports `optedIn`/`INCLUDE_FIELD` and matches `fields.system_kb === true`; `kb/knowledge_bases.json` still declares the `fields.system_kb: true` predicate; `readDocTickets` passes no `--no-limit` and checks no envelope; `kbStatus` has no `tickets` field. Only `free-REQ-165` and `free-BUG-39` are present out of the bundle's seven tickets. The doc-ticket edits that set `doc_kind: system_kb` on DOC-33/35/31/17 are also absent — the live store has 38 `doc` tickets and **zero** carrying either marker.

**2. The shared `@lagrangefoundry/knowledge` package has drifted past this branch.** `search()`/`buildAwareness()` now resolve an index via `indexFor(kb, indexes)`; `kb.ts` here still passes `source:`, so `buildKb` throws `KnowledgeConfigError: knowledge base 'system' reads from source 'shipped', which this host has no index for`. This was visible on the *pre-existing* file too (it failed 5/16 before I touched it). `xgd-working` already passes `indexes:` — in a commit outside this bundle. This blocker is currently hidden behind blocker 1, and will surface for AC-1291/1301/1302/1303/1304/1306 once the membership code lands.

Failures by AC, all of the same shape:

| ACs | Failure |
|---|---|
| 1295, 1296, 1300, 1632, 1633 | REQ-164 behaviour absent (kind vs boolean, `corpus: {}`, `--no-limit`, truncation refusal, skip-line wording) |
| 1292, 1298, 1299, 1305 | fixtures carry `doc_kind: system_kb`, so the old boolean filter exports nothing |
| 1293 | `kbStatus()` returns no `tickets` field; the CLI prints no ticket-count clause |
| 1291, 1301, 1302, 1303, 1304, 1306 | `buildKb` refuses (membership) — and behind that, the upstream `indexes` drift |
| 1297 | real store has no member tickets, so the corpus reads back empty |

AC-1294 (unrecognised form refused with usage) passes.

I wrote the assertions against the intended implementation as it exists in `858d63202f` (exact message strings: `doc_kind: system_kb`, `kind, not a flag`, `N carry another kind`, `of N ticket(s) carrying …`, `⚠ … the corpus is stale; run \`1c kb export\``, `ticket store unreadable`, `--no-limit`), so they should go green the moment that commit and its ticket edits are present. I did not weaken any assertion to match current behaviour.

**This is not something the test fix-it loop can close** — no change to these tests can make them pass on a tree without the code. The repair is at the orchestration level: re-run the cherry-pick for the six missing bundle commits (starting with `858d63202f`), and pull in whatever commit adapted `kb.ts` to the library's `indexes` parameter.
