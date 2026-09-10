---
uid: report-c845e7f5
id: REPORT-3680
type: report
title: 'Capability-Intent Alignment: Site Storage Port: One Async Store Behind Every
  Edit (level=ac)'
created_by: xgd
created_at: '2026-09-10T06:25:40.916464+00:00'
updated_at: '2026-09-10T06:25:40.916464+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-c4c7a854
  level: ac
  violations: 0
  warnings: 1
  needs_review_count: 0
---

# Capability-Intent Alignment: Site Storage Port: One Async Store Behind Every Edit
# Level: ac

**Result**: PASS
**Violations**: 0
**Warnings**: 1
**Needs review**: 0

Anchor report: report-e37a6b4a. Previous attempts: 1 (check report-cd91df2c → fix
report-fa26a3c0). Both of that cycle's violations were re-verified as closed against the
current tree, not taken on the fix report's word.

## Cumulative Intent Considered

Intents reach CAP-101 through the two stories' `intent_uid` / `updated_by` chains:
BUNDLE-19 (`bundle-77b28def`), BUNDLE-20 (`bundle-b3b7c399`), BUNDLE-21
(`bundle-78f4e2fe`) and one standalone request. Bundle members resolved individually and
each ticket's status read from its own frontmatter this call:

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-141 (`request-b18d2056`, BUNDLE-19) | free_and_reconciled | 2026-08-15 | Two test runtimes routed by filename, real D1/R2 bindings, production compatibility settings | YES |
| REQ-142 (`request-0dd62a5d`, BUNDLE-19) | free_and_reconciled | 2026-08-15 | The async `SiteStore` port; filesystem-free second adapter; one-whole-change write; no location crosses the seam; three injection sites (`index.ts`, `builder.ts`, `ai/toolbox.ts`) | YES |
| REQ-143 (`request-18a48d63`, BUNDLE-20) | free_and_reconciled | 2026-08-15 | The cloud store: definitions in D1, bytes in R2, account-scoped handle, conditional write, copy path, schema + bindings | YES |
| REQ-145 (`request-b474390f`, BUNDLE-20) | free_and_reconciled | 2026-08-15 | Proxy deleted; the origin opens the cloud store per route — makes the per-request behaviour observable | YES |
| REQ-146 (`request-0cdfdc5b`, BUNDLE-20) | free_and_reconciled | 2026-08-15 | The AI host moves into workerd; consumer of the injected store | YES |
| REQ-149 (`request-554ac441`, BUNDLE-20) | free_and_reconciled | 2026-08-17 | Five revision storage verbs added to the same declared port, answered by every adapter; sequencing left above the port (CAP-82) | YES |
| BUG-36 (`bug-db356ff8`, BUNDLE-21) | free_and_reconciled | 2026-08-23 | Unknown/inactive account refused at handle-open, reason as a branchable discriminant | YES |
| BUG-37 (`bug-6612c4b7`, BUNDLE-21) | free_and_reconciled | 2026-08-24 | Retained assembled draft: one validation per site version, currency by live version read, bounded and account-scoped | YES |
| BUG-38 (`bug-a98fb3b0`, BUNDLE-21) | free_and_reconciled | 2026-08-24 | Builder chat conversation lifetime; touches CAP-101 only by sharing a bundle | YES (no ask here) |
| REQ-162 (`request-13a5e206`) | free_and_reconciled | 2026-08-31 | Second object-store binding; forced AC-1398 from a counted claim to a per-binding pairing | YES |

No intent in the ledger is `abandoned`, `deprecated` or `wont_fix`, and none is merely
imminent — all ten are fully reconciled. **No Step 2.5 case arises**: no story or AC in
this capability names an abandoned/deprecated/wont_fix ticket as a delivery vehicle. The
only forward citations are to CAP-82's STORY-94 (an active sibling capability), which is a
scope boundary rather than a vehicle.

Level is `ac`, so the two story bodies are the working reference. Intent was consulted only
to confirm the ledger and to date the two ACs the previous cycle added.

## Alignment Ledger

### STORY-118 (`story-3f4a5f2b`, feature, intent BUNDLE-19, updated_by BUNDLE-20) — 11 ACs

| Element | Intents aligned to | Outcome |
|---|---|---|
| AC-1321 totality + asynchrony of the declared question set | REQ-142 | aligned — enumeration stops short of the two journal verbs (warning 1) |
| AC-1322 assets as bytes, pages as keys, nothing as a location | REQ-142 | aligned |
| AC-1323 one multi-file command → exactly one whole change | REQ-142 | aligned |
| AC-1324 whole editing surface completes against the filesystem-free store | REQ-142 | aligned |
| AC-1325 same starting site answers identically over both stores | REQ-142 | aligned |
| AC-1326 arguments, output and refusal envelopes unchanged | REQ-142 | aligned |
| AC-1327 draft preview (pages and assets) served from whichever store rendered it | REQ-142, REQ-145 | aligned |
| AC-1328 two runtimes routed by filename, real bindings, production compat settings | REQ-141 | aligned — encodes the routing convention and the bindings, and correctly encodes neither the test-pool pin nor its retracted rationale, as the story's "Known divergence" paragraph instructs |
| AC-1329 the split cost nothing and changed no assertion | REQ-141 | aligned |
| AC-1619 revision verbs are the same declared set, answered by every adapter (**added by attempt 1**) | REQ-149 | aligned — closes report-cd91df2c finding 1 |
| AC-1620 the assistant's tool adapter edits through the store it was given (**added by attempt 1**) | REQ-142, REQ-146 | aligned — closes report-cd91df2c finding 2 |

### STORY-121 (`story-fde7370b`, upgrade, intent BUNDLE-20, updated_by BUNDLE-21 + REQ-162) — 16 ACs

| Element | Intents aligned to | Outcome |
|---|---|---|
| AC-1385 identical answers over all three stores, render cases a named exception | REQ-143 | aligned |
| AC-1386 one account per handle; no operation takes an account; admin verbs scoped | REQ-143 (+ reconciliation decision 2026-08-31) | aligned |
| AC-1387 unknown/inactive account refused at handle-open, reason as a value | BUG-36 | aligned |
| AC-1388 readable write version, advances on every write, distinct from the change count | REQ-143 | aligned |
| AC-1389 stale expectation refused with both versions; exactly one racer survives | REQ-143 | aligned |
| AC-1390 refused multi-part write leaves nothing behind | REQ-143 | aligned |
| AC-1391 filesystem store applies an expectation-carrying write unconditionally | REQ-143 | aligned |
| AC-1392 asset bytes round-trip, typed, listable, removable | REQ-143 | aligned |
| AC-1393 unsafe asset name: absent on read, dropped on write, rest of change lands | REQ-143 (+ reconciliation decision 2026-08-31) | aligned |
| AC-1394 whole draft copies store-to-store as one change; unknown destination refused | REQ-143 | aligned |
| AC-1395 a real site copied into the cloud store assembles and renders identically | REQ-143 | aligned |
| AC-1396 structured editing surface completes inside the Workers runtime | REQ-143 | aligned |
| AC-1397 one extension → one content type on every serving path | REQ-143 | aligned |
| AC-1398 every declared binding pairs across both halves; schema applied before upload | REQ-143, REQ-162 | aligned — re-read this call and confirmed to be wholly in the post-REQ-162 per-binding-pairing form; the retired counted form ("there are two bucket names and they are identical") survives only as the explicitly-rejected alternative inside the criterion, which is correct |
| AC-1447 unchanged draft assembles once, currency proved by a live version read | BUG-37 | aligned |
| AC-1448 retained draft never outlives, is misattributed to, or crosses accounts | BUG-37 | aligned |
| The story's out-of-scope sentence "this store … answers the port's revision verbs … exactly as the other adapters do" | REQ-149 | aligned — covered by AC-1619, which was deliberately authored as a port-level claim naming the cloud store explicitly, per report-cd91df2c's note that a filesystem-only wording would leave this sentence uncovered |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | coverage | AC-1321 (`acceptance_criterion-d4cc3712`) | ac-edit | AC-1321 is the capability's *totality* criterion — "Storage answers every question it is asked, for every site — including one it holds nothing for". STORY-118's body enumerates the declared set as "does this site have a draft; read its definition; read its pages; apply one whole change; list its assets; read one asset's bytes; read its change count; **record a change; read the changes since a given count**; assemble and validate the current draft", and its Out-of-scope bullet reserves exactly the claim that those journal questions "are asked of the store like every other". AC-1321's enumeration covers seven of them and stops before `record a change` and `the changes since a given count`; neither appears in its empty-slug half either. The verbs are covered elsewhere for *other* properties — AC-1385 (STORY-121) lists both when asserting the three stores answer identically, and AC-1324 asserts the counter advances on an accepted write and stands still on a refusal against the filesystem-free store — but no AC asserts their **totality for a slug the store holds nothing for**, which is the one thing AC-1321 exists to state. AC-1619 sets the precedent by asserting exactly that for the revision verbs ("For a site that has never published, the same questions answer emptily rather than raising"); the journal verbs are now the only family in the declared set without it. Not a violation: the behaviour is landed and the story body is right, so nothing here is drift — the criterion is narrower than the set it claims to be total over | Extend AC-1321's two enumerations to include recording a change and reading the changes since a given count: for a site the store holds, a recorded change is durable and the changes-since answer is a list; for a slug it holds nothing for, both answer emptily rather than raising. Do not restate what a record *contains* or what the counter *means* — that is CAP-99's, and STORY-118's out-of-scope bullet says so |
| 2 | info | coverage | STORY-118 (`story-3f4a5f2b`) | — | report-cd91df2c's two violations are **confirmed closed against the tree**, not merely against the fix report. AC-1619 (`acceptance_criterion-e045b3e3`) and AC-1620 (`acceptance_criterion-ce202d6a`) exist under STORY-118 with substantive criterion and verification sections; the port declares all five verbs (`tools/generate/src/store/site-store.ts:206,218,221,231,234`); the shared assertion body now carries them (`tests/support/site-store-contract.ts:343-419`, two `AC-1619` cases registered inside the shared block so all three adapters run them); and `tests/reconciliation-site-storage-port.test.ts:423` carries `test_UAT_AC1620_the_toolbox_edits_through_the_store_it_was_given`. The store-as-parameter shape AC-1620 asserts is the landed one (`tools/generate/src/cli/ai/toolbox.ts:186`, `const siteStore = store ?? fsSiteStore(ctxOf(opts))`) | none |
| 3 | info | exclusivity | AC-1620 (`acceptance_criterion-ce202d6a`) | — | Re-ran the repo-wide sweep for a competing toolbox criterion. Only AC-1239 (`acceptance_criterion-902e13a5`, STORY-ee073693, a different capability) also mentions the toolbox, and it is about palette grant grouping and refusal rendering — it says nothing about which store the adapter was given. No duplication | none |
| 4 | info | exclusivity | AC-1386 (`acceptance_criterion-84f710e2`) + AC-1448 (`acceptance_criterion-89fefdc5`) | — | Both assert that two accounts holding a site of the same name never see each other's. Deliberate layering rather than duplication: AC-1386 is the handle-scoping claim (the barrier exists), AC-1448 is the retention claim (the barrier is not quietly undone by reuse between reads, because what is retained is keyed by account *and* slug) — a distinct failure mode, and one STORY-121's body states in its own sentence. AC-1448 additionally asserts non-identity of the two assembled values, which AC-1386 does not | none |
| 5 | info | exclusivity | AC-1619 (`acceptance_criterion-e045b3e3`) | — | AC-1619 overlaps CAP-82's publish/checkout criteria by subject matter, and pre-empts the collision in its own text: "CAP-82's publish and checkout tests do not satisfy this criterion. They prove the *sequencing* above the port and drive two of the three adapters; this criterion is the port-level claim that each adapter answers the verbs at all." That is the correct boundary and matches both story bodies' scope statements. Cross-capability, hence not an ac-level exclusivity finding | none |
| 6 | info | consistency | AC-1385 (`acceptance_criterion-0d6bc58c`) | — | Carried forward from report-cd91df2c finding 3, re-checked and unchanged: AC-1385 declares a named exception (the two draft-*render* questions are answered by the filesystem-hosted stores only) that STORY-121's body does not restate. The AC is the more precise of the two and matches `tests/support/site-store-contract.ts`. No edit wanted at ac level | none |
| 7 | info | — | AC-1619, AC-1620 | — | Both carry `status: pending` while every other AC in this capability is `active`. Repo-wide there are 20 pending ACs, most created by this session's fix wave but three dating to 2026-07-22 / 2026-08-31, so `pending` does sometimes persist. Recorded, not raised: activation is not this check's property, and treating it as an alignment defect would misfile a workflow-state question as matrix drift | none |

## Notes for the Editor

**Nothing blocks this level.** Coverage, consistency and exclusivity all hold across both
stories at 27 ACs. The single warning is a narrowing inside one otherwise-correct criterion
and can be taken opportunistically; leaving it produces no drift away from intent, only a
totality claim that is one verb-family short of the set it names.

**Do not re-open the two closed violations.** Attempt 1's repair was two `ac-add`s and two
test files, with no story body and no production code touched — which is what report-cd91df2c
prescribed. Both ACs were verified this call against the port declaration, the shared
assertion body and the toolbox call site rather than against the fix report's claims. A
future check that re-derives finding 1 or finding 2 from the story bodies alone should look
for AC-1619 / AC-1620 first: they are `pending`, so a query filtered to `status: active` will
miss them and manufacture the same two violations again.

**The one cross-story coverage shape used here is deliberate and should be preserved.**
AC-1619 lives under STORY-118 but discharges STORY-121's out-of-scope sentence about the
cloud adapter answering the revision verbs, because STORY-118's body claims ownership of
"the revision storage verbs are declared on the same port and answered by every adapter".
Splitting it into a per-story pair would restate one claim twice and create the exclusivity
problem the single port-level AC avoids. The same reasoning applies in reverse to warning 1:
AC-1385 (STORY-121) already carries the journal verbs for the three-store identity property,
so the edit wanted at AC-1321 is the *totality* half only, not a second identity claim.
