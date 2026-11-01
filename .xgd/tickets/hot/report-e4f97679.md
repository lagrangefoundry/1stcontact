---
uid: report-e4f97679
id: REPORT-7613
type: report
title: 'Fix reconciliation review: bundle-94dbe947'
created_by: xgd
created_at: '2026-11-01T13:27:17.807134+00:00'
updated_at: '2026-11-01T13:27:17.807134+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_reconciliation_review
  subject_uid: bundle-94dbe947
  needs_more_work: false
  progress_made: true
---

## Stories created
None

## Stories modified
None (AC-level edits only; see below)

## Stories deleted
None

## ACs superseded
- AC-1481 (acceptance_criterion-dab8d017), story-ab1ecd62, superseded_by_uid bundle-94dbe947 (REQ-168: ticket store no longer reads TENANT_ID; empty scope refused with UnscopedError — evidenced by AC-2125). [G1]

## AC titles corrected (G3)
Ticket titles set to their already-correct fields.title (no body/test change):
- AC-1715 (acceptance_criterion-946ff3b5)
- AC-1716 (acceptance_criterion-17ec5ed0)
- AC-2018 (acceptance_criterion-dc45179f)
- AC-2020 (acceptance_criterion-c72effd0)

## FC orphans renamed/deleted
None (no fc_orphan_check report exists for this anchor)

## Code changes
- tests/reconciliation-product-ticket-store.workers.test.ts (G2, test-only):
  - removed TENANT_ID from the ticketEnv helper (no longer on TicketStoreEnv);
  - added scopeOf(businessId): Scope and passed it as the required second argument to every ticketStoreFor call (AC-1478/1479/1480/1482/1483/1484 cases);
  - AC-1482 now calls ticketStoreFor(ticketEnv({ BLOBS: undefined, DB: untouchableDb() }), scopeOf(ACCOUNT_A));
  - retired the AC-1481 case, replacing it with a pointer comment to AC-2125 — same precedent as AC-1750's retirement in this bundle, and as the review's G2 fix instructs.
- No production code touched.

## Confidence
High that G1 and G3 are closed (verified on the tickets). G2 is a mechanical signature fix matching tickets.ts:463 (Scope = { businessId }); not run here per instructions (workerd suites can't bind ports in this sandbox) — the workflow's full suite run will confirm AC-1478/1479/1480/1482/1483/1484.
