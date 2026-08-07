---
uid: report-54b011da
id: REPORT-1639
type: report
title: 'Capability-Intent Alignment: Site Delivery: Deploy & Public Serving (level=uat)'
created_by: xgd
created_at: '2026-08-07T22:09:44.053393+00:00'
updated_at: '2026-08-07T22:09:44.053393+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-a12e557f
  level: uat
  violations: 0
  warnings: 1
  needs_review_count: 0
---

# Capability-Intent Alignment: Site Delivery: Deploy & Public Serving
# Level: uat

**Result**: PASS
**Violations**: 0
**Warnings**: 1
**Needs review**: 0

Scope: 3 stories, 36 active ACs, 36 UATs across 4 test files. All 36 UATs
execute and pass (`vitest run`, 36 passed / 36, 1.14s).

## Cumulative Intent Considered

Level is `uat`, so AC bodies are the working reference (story level passed at
REPORT-1635, ac level passed at REPORT-1638 after fix attempt REPORT-1637).
Intent was consulted only to confirm no ledger entry has been retired.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-109 | free_and_reconciled | 2026-07-30 | Document-relative asset emission (owned by STORY-83; precondition for AC-904/AC-921) | YES (dependency) |
| REQ-110 | free_and_reconciled | 2026-07-30 | R2 artifact store + `1c deploy` — the operator half → STORY-94 | YES |
| REQ-111 | free_and_reconciled | 2026-07-30 | public-site Worker serving previews + published sites → STORY-95 | YES |
| REQ-113 | free_and_reconciled | 2026-07-31 | Extensionless page URLs agree across preview and production → STORY-96 | YES |
| BUG-30 | free_and_reconciled | 2026-07-31 | `relativizeUrl` fragment defect (other capability; noted as unblocked follow-up) | YES (out of tree) |
| BUG-31 | free_and_reconciled | 2026-07-31 | Store-tree namespacing across the R2 boundary → AC-924/925/926/927 | YES |

Both carriers (BUNDLE-13 `bundle-e0143ffa`, BUNDLE-14 `bundle-0385746c`) are
`free_and_reconciled`. No intent in the ledger is abandoned, deprecated or
wont_fix, so nothing in the AC tree should be retired — and nothing is: all 36
ACs are `status=active`, `kind=behavior`, `regression_only=false`.

## Alignment Ledger

Each active AC maps 1:1 to a `test_UAT_AC<n>_*` test. No AC is uncovered; no AC
carries two tests. Every UAT drives a real entry point (`cmdDeploy`,
`worker.fetch`, `startServe` over loopback, and a raw socket where client-side
normalisation would otherwise eat the attack shape) — none is a structural or
AST-shaped check. R2 is faked only at the binding, the one boundary the project
does not own.

| Element | Test file | Intents aligned to | Outcome |
|---|---|---|---|
| AC-892 … AC-901, AC-924 … AC-926 (STORY-94) | `tests/reconciliation-deploy-snapshot.test.ts` | REQ-110, BUG-31 | aligned |
| AC-902 … AC-914 (STORY-95) | `tests/reconciliation-serve-deployed-snapshot.test.ts` | REQ-111 | aligned (AC-914: see finding 1) |
| AC-927 (STORY-95) | `tests/reconciliation-servable-root-confinement.test.ts` | BUG-31 | aligned |
| AC-915 … AC-923 (STORY-96) | `tests/reconciliation-clean-page-urls.test.ts` | REQ-113 | aligned |

**Re-checked specifically**: the four ACs edited by the ac-level fix on
2026-08-07 (AC-892, AC-896, AC-905, AC-906) were the highest drift risk, since
their tests predate the edit. All four newly-added clauses are already exercised:

- AC-892's "when the tree is servable" + tree-qualified URL → asserted at
  `reconciliation-deploy-snapshot.test.ts:160-172` (scratch deploy ships and
  indexes identically, `scratch.url` is `null`).
- AC-896's "for a site in the servable store tree … non-servable behaves as
  AC-925 states, on this channel as on the draft one" → asserted at
  `reconciliation-deploy-snapshot.test.ts:289-302`.
- AC-905's two-gate framing ("tree gate is AC-927's and is proven there; this
  governs only what happens within the servable tree") → the test stays inside
  `sites/` throughout and asserts `readKeys` is the manifest key alone
  (`reconciliation-serve-deployed-snapshot.test.ts:461-462`).
- AC-906's "the only header by which a preview-channel not-found differs from a
  published-channel one is AC-910's no-index directive" → asserted verbatim at
  `reconciliation-serve-deployed-snapshot.test.ts:532-537`, with the byte
  comparison correctly done *within* each channel.

No stale-test drift from the ac-level repair.

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | consistency | AC-914 / `test_UAT_AC914_deploy_colliding_with_the_reserved_preview_segment_is_refused` | uat-edit | AC-914's "ships nothing" half is asserted vacuously. The test proves the refusal by calling the pure gate `assertNoReservedSegment` directly (`reconciliation-serve-deployed-snapshot.test.ts:863-878`), then asserts the store is byte-unchanged at lines 880-881 — an assertion that cannot fail, because no deploy was attempted and the gate never writes. The production wiring is genuinely correct (`tools/generate/src/deploy/deploy.ts:136` runs the gate after `collectSnapshotFiles` and before the first upload), but that ordering is what makes "refused before any bytes are shipped" true, and it is not what the test pins. | Either drop the vacuous store-unchanged assertion, or pin the wiring instead — e.g. drive `cmdDeploy` with an injected colliding file list, or assert the gate runs before the first `client.put` via an instrumented client. |
| 2 | info | exclusivity | AC-902/903/904/906/907/908/909/910/911/914 | — | `tests/req111-public-site-serving.test.ts` carries 10 free-coded UATs (`test_UAT_FC_REQ-111_*`) covering the same scenarios in the same shape (Worker `fetch` over a faked R2 binding) as the matrix UATs. Not capability drift: retaining free-coded intent tests alongside reconciliation matrix UATs is the project-wide convention (120 `req*`/`bug*` files vs 51 `reconciliation-*` files). Flagged for the record only. | none |
| 3 | info | exclusivity | AC-892 vs AC-925 | — | `test_UAT_AC892` also asserts a non-servable-tree deploy returns no URL, which overlaps AC-925's subject. Not a duplicate: AC-892's own criterion states the returned URL "is qualified by the store tree the definition came from", so the assertion proves AC-892's clause. AC-925's test additionally pins the report's terminating line, the not-publicly-reachable note, and the command help — a genuinely different assertion set. | none |
| 4 | info | coverage | AC-900 | — | AC-900 asks for "file count and total size for the file-moving stages". The test pins count+size on the `render` line (`reconciliation-deploy-snapshot.test.ts:414`) but only count on the two `upload` lines (416-417). The report format is uniform across those stages, so the gap is cosmetic. | none |

## Notes for the Editor

Nothing requires repair for this level to pass; finding 1 is opportunistic.

Two observations worth carrying forward rather than acting on now:

- **AC-914 is a standing invariant that is currently untriggerable.** STORY-95's
  Technical Context states this explicitly — rendered pages are emitted flat, so
  no site definition today can produce a top-level `draft/` entry, and the gate
  "is verified at its own entry point and starts earning its keep the day
  rendered output gains nesting." Finding 1 is consistent with that decision;
  the objection is narrower, aimed only at the one assertion that reads as
  evidence but is not. Should rendered output ever gain nesting, this AC's UAT
  should be promoted to drive `cmdDeploy` end-to-end.

- **The evidence boundary is honest but worth restating.** Every serving UAT
  fakes R2 at the binding and nothing above it, which is the correct thin-mock
  line. STORY-95's Technical Context already records the carried-forward
  uncertainty that the end-to-end smoke check against a live bucket and the apex
  custom-domain provisioning were never run in session — including for root
  confinement (AC-927), which is proven against the real request entry point
  with the binding faked, not against a live bucket. The matrix and the tests
  agree on this; no drift, but it bounds what "proven" means for AC-902 … AC-927.
