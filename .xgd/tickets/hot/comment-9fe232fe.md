---
uid: comment-9fe232fe
id: COMMENT-2433
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-09-10T02:11:53.352793+00:00'
updated_at: '2026-09-10T02:11:53.352793+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-30f62280
  kind: note
---

**Result: PASS** — `REPORT-3634` (`report-30f62280`), 0 violations, 2 warnings, 0 needs_review. Schema verified: top-level `result: pass`, `report_kind: capability_validation`, `subject_uid: capability-dfb0a4ff`, `level: ac`, integer counts.

## What I checked

24 active ACs (AC-1476 … AC-1499) across the three `feature` stories on CAP-106 — STORY-126 (10), STORY-127 (5), STORY-128 (9). Single-intent ledger: all three stories carry `intent_uid: request-13a5e206` (REQ-162, `free_and_reconciled`, merged `4b43dd9a`) with no `updated_by` chain, so cumulative intent is REQ-162 as merged. I re-verified the five downstream intents (REQ-159/160/161/163/166) are still `draft` rather than trusting the prior report's snapshot. The story-level cycle (REPORT-3633) passed, so story bodies were my working reference.

## The two warnings

**AC-1483 — terminality is claimed but not probed.** STORY-126's body names it as a distinct structural claim ("the scoped handle is also terminal") and `tickets.ts:26-27` implements it (`forTenant` on a scoped handle throws). AC-1483 carries it only as a consequence, and its verification step — "confirm none accepts an account argument" — doesn't reach it, because the *unscoped* store's `forTenant` legitimately does take an account id. An implementation that re-exposed `forTenant` on the scoped handle would pass every verification step while breaking the barrier. This is the only finding with a real hole behind it.

**AC-1493 — one of three closed enums has no refusal criterion.** AC-1492 declares `rights`, `kind` *and* `origin` as closed sets; AC-1493 asserts out-of-set refusal for only the first two. Not a violation: REQ-162's acceptance list says "reject a bad `rights` or `kind` value" and the story body names no third enum, so the AC is faithful to intent — and the refusal *is* implemented (`tickets.ts:64-68`, same `type: 'enum'` mechanism). Matrix completeness, not drift.

Both are `ac-edit` on criteria that already own the claim, not `ac-add` — splitting either would manufacture the exclusivity problem this check exists to prevent.

## Worth flagging beyond the findings

Coverage and exclusivity were clean. I checked the four close AC pairs (1478/1480, 1479/1480, 1483/1484, 1489/1490) and each survives on a distinct failure mode; the 1489/1490 split is explicitly justified in STORY-127's Technical Context. No AC body cites a ticket anywhere, so Step 2.5's stale-vehicle case cannot arise at this level.

Two notes I put in the report for whoever runs the `uat` level, both of which would otherwise read as gaps that aren't there:

- **Test naming is REQ-keyed, not AC-keyed.** AC-1477's evidence is in `tests/reconciliation-product-ticket-store-schema.test.ts` and AC-1476/1489/1490's in `test_UAT_FC_REQ-162_ticket_store_bindings.test.ts`. A coverage check grepping `test_UAT_AC1477_*` will find nothing — this is the same anchored-regex failure that has emptied the UAT index here before.
- **AC-1477 and AC-1485 are environment-conditional.** Both specify a *named skip* when `@lagrangefoundry/ticketing` is absent or predates the `BlobStore` port. A skip there is the specified behaviour, not an unasserted criterion.

One thing I'd call out as unusual in a good way: every criterion that goes beyond REQ-162's own acceptance list is labelled a dated reconciliation decision in its story body, and all eight I spot-checked resolve to a named line in the source. The two places the matrix overstates its landed evidence (dedup-within-an-account on AC-1488, `site_slug` on AC-1498) are disclosed *by the matrix itself* rather than found by this check — that's uat-depth work, correctly carried forward.
