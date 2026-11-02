---
uid: report-a832745b
id: REPORT-8128
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-37'
created_by: xgd
created_at: '2026-11-02T01:14:22.894975+00:00'
updated_at: '2026-11-02T01:14:22.894975+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-37
---

## Files resolved

- `db/migrations/0003_ticket_store.sql` — UD (incoming REQ-190 deletes all migrations in favour of `0001_baseline.sql`; HEAD 2a51b34e2a added the `ticket_changes` change log + `ticket_change_floor`). Rule 2a: accepted the deletion (`git rm`). To avoid losing HEAD's schema, HEAD's additions (ticket_changes table, idx_ticket_changes_tenant_seq, unique idx_ticket_changes_write, ticket_change_floor) were moved verbatim into `db/migrations/0001_baseline.sql` right after `counters`. FLAG FOR POST-MERGE REVIEW.
- `tests/support/local-d1.ts` — UU, code file (2c). Non-overlapping: only the `node:fs` import line conflicted. Combined to `import { mkdirSync, mkdtempSync, readFileSync, rmSync, statSync } from 'node:fs'` + `import os`. Kept HEAD's runLocalD1/withLock/localD1 and incoming platformBusinessId.
- `tools/generate/src/store/d1r2-store.ts` — UU, code file (2c). Both sides made independent changes to the same loop: HEAD loops over `accepted` (refused unsafe names reported); incoming keys R2 by `assetKey(siteId, name)`. Combined both: `for (const { name, bytes } of accepted) { await SITES.put(assetKey(siteId, name), ...` .
- `tests/test_UAT_FC_REQ-190_baseline.test.ts` (incoming-added, not conflicted) — added `'tenant_id'` to the single-column TEXT PRIMARY KEY expected list, with a comment, needed because `ticket_change_floor` (folded into the baseline above) declares `tenant_id TEXT PRIMARY KEY`. Suite passes 6/6.

## Incoming changes preserved

- d1r2-store.ts: incoming `siteId`-keyed asset storage is present in both asset loops; tsc reports no errors in store/.
- local-d1.ts: incoming `readFileSync` import + `platformBusinessId()` present.
- 0003 deletion and 0001_baseline.sql from incoming applied; the only change to the baseline is the addition of HEAD's ticket change-log tables.

## Follow-up (not caused by this resolution)

`tests/reconciliation-product-ticket-store-schema.test.ts` and `tests/test_reconciliation_contact_axes_migration.workers.test.ts` still reference the old per-feature migrations (0001_site_store … 0009_pipeline_stage) that REQ-190 deletes. They will fail and need rewriting against the baseline or retiring.
