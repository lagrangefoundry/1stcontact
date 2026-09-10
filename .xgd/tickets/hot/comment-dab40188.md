---
uid: comment-dab40188
id: COMMENT-2461
type: comment
title: Claude response for uat_coverage_check report
created_by: xgd
created_at: '2026-09-10T04:35:41.305933+00:00'
updated_at: '2026-09-10T04:35:41.305933+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-b85e7407
  kind: note
---

Report shape verified against the workflow's exit conditions: `result: pass`, `report_kind: uat_coverage_check`, `subject_uid: capability-3606e35b`, integer counts.

## UAT Coverage: CAP-103 Operator Access Gate — **PASS**

**REPORT-3662** (`report-b85e7407`) — 0 violations, 0 blocking needs_review, 1 warning.

**Verdicts written**: 14 ACs `pass`, STORY-120 `pass`, CAP-103 `pass`.

### Intent ledger
One story, two reconciled bundles, neither retiring anything:
- **BUNDLE-20** (2026-08-24) — REQ-147 established the gate, named `workers_dev = true` as the hole a hostname policy can't cover, required in-Worker JWT verification and the repository policy record. REQ-145, later in the same bundle, added the loopback opening.
- **BUNDLE-21** (2026-08-26) — BUG-36 added the caller's side: `pushSite` was sending the gateway's own forwarded assertion header inbound, so every call bounced to sign-in and surfaced as a doctype parse error.

REQ-147 AC2 is the one intent clause with no criterion — correctly so, since the gateway enforces it before the application sees the request. AC-1384 carries it into the policy record and asserts the record says so.

### Evidence
Both files drive real entry points. The gate file (**10/10 passing**) drives the control app's exported `fetch` handler with **minted** JWTs and a genuinely separate attacker keypair, stubs only `globalThis.fetch` for the key publication, and uses `DB`/`SITES`/`ASSETS` as **tripwires rather than collaborator stubs** — then shows those tripwires firing for an admitted caller, so an empty record can't mean an unarmed tripwire. AC-1380 asserts the rotation was honoured *by re-reading* the publication, which is what separates it from a gate that simply never cached.

The automation file (**3/4**) drives `pushSite`, the real `1c` entry point, and the operator scripts as spawned processes, with `fetch` as a recorder so the negative claims are observations of the request.

### The one warning
`test_UAT_AC1453` times out here on `listen EPERM: operation not permitted 127.0.0.1`. I probed it directly — a bare `socket.bind(('127.0.0.1', 0)); listen(1)` also returns EPERM, so this sandbox forbids listening sockets outright. The test's pre-stub assertions passed before the hang. The design is right: `bin/access-token` is a separate process, so a real loopback server is the only honest seam, and the criterion's own reconciliation note explains why source-pattern-matching was abandoned for it. **My recommendation in the report is explicitly not to rewrite it** to monkey-patch `fetch` — that trades a real process boundary for a weaker one. It needs confirming green in a permissive environment during UAT validation.

I could not verify AC-1453 executes green anywhere from this session; I judged its coverage on the test's substance and flagged the gap in verification honestly rather than counting it as a violation.
