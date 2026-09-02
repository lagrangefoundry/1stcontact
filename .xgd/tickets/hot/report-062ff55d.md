---
uid: report-062ff55d
id: REPORT-3276
type: report
title: Claude reconciliation_uat_generation report
created_by: xgd
created_at: '2026-09-02T00:13:02.739042+00:00'
updated_at: '2026-09-02T00:13:02.739042+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_uat_generation
  subject_uid: story-ab1ecd62
---

No runtime code, existing tests, or tickets were modified.

**AC → test mapping** (10 ACs, 10 UATs, 1:1):

| AC | Test | File |
|---|---|---|
| AC-1476 | `test_UAT_AC1476_the_step_is_declared_in_the_migration_sequence_and_applies_after_the_site_stores` | schema (node) |
| AC-1477 | `test_UAT_AC1477_every_published_statement_is_present_and_a_missing_one_is_named` | schema (node) |
| AC-1485 | `test_UAT_AC1485_the_build_emits_an_absolute_re_export_reports_it_and_names_a_stale_install` | schema (node) |
| AC-1478 | `test_UAT_AC1478_one_registry_serves_both_stores_and_carries_the_ticket_store_field` | workers |
| AC-1479 | `test_UAT_AC1479_a_ticket_created_through_the_wiring_reads_back_through_a_second_handle` | workers |
| AC-1480 | `test_UAT_AC1480_the_configured_account_is_registered_on_demand_and_a_recorded_one_keeps_its_status` | workers |
| AC-1481 | `test_UAT_AC1481_a_deployment_that_names_no_account_is_refused_when_the_store_is_built` | workers |
| AC-1482 | `test_UAT_AC1482_a_deployment_with_nowhere_to_put_attachment_bytes_is_refused_when_the_store_is_built` | workers |
| AC-1483 | `test_UAT_AC1483_a_handle_sees_only_its_own_accounts_tickets_on_reads_and_listings` | workers |
| AC-1484 | `test_UAT_AC1484_a_write_aimed_at_another_accounts_ticket_is_refused_and_the_target_is_unchanged` | workers |

Two files because the projects are split by runtime: `vitest.workers.config.mts` (real D1/R2 in workerd) vs `vitest.node.config.mts` (filesystem, subprocesses). Runtime ACs run in workerd through `ticketStoreFor`; schema/build ACs run in node against the real `wrangler d1 migrations apply` runner and a real `1c assets` build in a mirror root.

Notable evidence choices: construction-time refusals (AC-1481/1482) pass a D1 handle that throws on any access, so "before any operation" is observed rather than assumed; AC-1476 applies and re-applies the sequence with the real migration runner against a fresh temp database; AC-1485 exercises the shipped `webui.ts` / `ticketing-installed.ts` byte-for-byte in child-process fixtures reproducing working / stale / absent installs.

**Pre-existing failure, out of scope for this story:** `tests/test_UAT_FC_REQ-162_ticket_store.workers.test.ts` has 2 failing assertions (`the bytes land in BLOBS…`, `one tenant cannot address another tenant blob`). They hardcode the attachment blob key as `t/<tenant>/blob/<sha256>`, and the installed component no longer uses the sha256 as the address (`store.js`: "`sha256` stays on the record — for integrity, no longer as the address"). These failed before I created any file, and blob storage is explicitly a separate story on this capability.

```
UATs generated for story story-ab1ecd62 (plan item 1 of 4)

Story: story-ab1ecd62
Test file(s) created:
  - tests/reconciliation-product-ticket-store.workers.test.ts
  - tests/reconciliation-product-ticket-store-schema.test.ts

Tests written: 10
Tests passed: 10
Tests failed: 0

test_files_created:
  - "tests/reconciliation-product-ticket-store.workers.test.ts"
  - "tests/reconciliation-product-ticket-store-schema.test.ts"
```
