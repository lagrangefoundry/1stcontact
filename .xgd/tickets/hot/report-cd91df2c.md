---
uid: report-cd91df2c
id: REPORT-3678
type: report
title: 'Capability-Intent Alignment: Site Storage Port: One Async Store Behind Every
  Edit (level=ac)'
created_by: xgd
created_at: '2026-09-10T06:12:53.145662+00:00'
updated_at: '2026-09-10T06:12:53.145662+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-c4c7a854
  level: ac
  violations: 2
  warnings: 0
  needs_review_count: 0
---

# Capability-Intent Alignment: Site Storage Port: One Async Store Behind Every Edit
# Level: ac

**Result**: FAIL
**Violations**: 2
**Warnings**: 0
**Needs review**: 0

Anchor report: report-bd2fed08's cycle (report-e37a6b4a). Previous attempts: 0.

## Cumulative Intent Considered

Intents reaching CAP-101 come in via two bundles on the stories' `intent_uid` /
`updated_by` chains (BUNDLE-19 `bundle-77b28def`, BUNDLE-20 `bundle-b3b7c399`,
BUNDLE-21 `bundle-78f4e2fe`) plus one standalone request. Bundle members
resolved individually:

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-141 (`request-b18d2056`, BUNDLE-19) | free_and_reconciled | 2026-08-15 | Workers-runtime test project: two runtimes routed by filename, real D1/R2 bindings, production compatibility settings | YES |
| REQ-142 (`request-0dd62a5d`, BUNDLE-19) | free_and_reconciled | 2026-08-15 | The async `SiteStore` port with the filesystem behind it; second filesystem-free adapter; one-whole-change write; no location crosses the seam; three injection sites named — `index.ts`, `builder.ts`, `ai/toolbox.ts` | YES |
| REQ-143 (`request-18a48d63`, BUNDLE-20) | free_and_reconciled | 2026-08-15 | The Cloudflare store: definitions in D1, bytes in R2, account-scoped handle, conditional write, copy path, schema + bindings | YES |
| REQ-145 (`request-b474390f`, BUNDLE-20) | free_and_reconciled | 2026-08-15 | control-app becomes the builder; proxy deleted; origin opens the cloud store per route (makes CAP-101's per-request behaviour observable) | YES |
| REQ-146 (`request-0cdfdc5b`, BUNDLE-20) | free_and_reconciled | 2026-08-15 | The AI host moves into workerd (consumer of the injected store) | YES |
| REQ-149 (`request-554ac441`, BUNDLE-20) | free_and_reconciled | 2026-08-17 | Added five revision storage verbs to the same declared port — `revisions`, `writeRevision`, `readRevision`, `draftBase`, `setDraftBase` — answered by every adapter; sequencing left to `publish.ts` above the port (CAP-82) | YES |
| BUG-36 (`bug-db356ff8`, BUNDLE-21) | free_and_reconciled | 2026-08-23 | Unknown/inactive account refused at handle-open time, with the reason as a branchable discriminant | YES |
| BUG-37 (`bug-6612c4b7`, BUNDLE-21) | free_and_reconciled | 2026-08-24 | Retained assembled draft: one validation per site version, currency proved by a live version read, bounded and account-scoped | YES |
| BUG-38 (`bug-a98fb3b0`, BUNDLE-21) | free_and_reconciled | 2026-08-24 | Builder chat conversation lifetime — touches CAP-101 only through the same bundle; no CAP-101 behaviour | YES (no ask here) |
| REQ-162 (`request-13a5e206`) | free_and_reconciled | 2026-08-31 | Second object-store binding; forced AC-1398's binding claim from a count to a per-binding pairing | YES |

No intent in the ledger is `abandoned` / `deprecated` / `wont_fix`, and none is
merely imminent — every intent touching this capability is fully reconciled. No
Step 2.5 stale-vehicle case arises (no story or AC names an abandoned ticket as
its delivery vehicle).

Level is `ac`, so the two story bodies are the working reference; intent was
consulted only to ground the two findings below and to confirm the ledger.

## Alignment Ledger

### STORY-118 (`story-3f4a5f2b`, feature, intent BUNDLE-19, updated_by BUNDLE-20) — 9 ACs

| Element | Intents aligned to | Outcome |
|---|---|---|
| AC-1321 totality + asynchrony of the declared question set | REQ-142 | aligned — but enumerates the *editing* questions only (see finding 1) |
| AC-1322 assets as bytes, pages as keys, nothing as a location | REQ-142 | aligned |
| AC-1323 one multi-file command → exactly one whole change | REQ-142 | aligned |
| AC-1324 whole editing surface completes against the filesystem-free store | REQ-142 | aligned |
| AC-1325 same starting site answers identically over both stores | REQ-142 | aligned |
| AC-1326 arguments, output and refusal envelopes unchanged | REQ-142 | aligned |
| AC-1327 draft preview (pages and assets) served from whichever store rendered it | REQ-142, REQ-145 | aligned |
| AC-1328 two runtimes routed by filename, real bindings, production compat settings | REQ-141 | aligned |
| AC-1329 the split cost nothing and changed no assertion | REQ-141 | aligned |
| *(no AC)* revision storage verbs declared on the port and answered by every adapter | REQ-149 | **gap — finding 1** |
| *(no AC)* the assistant's tool adapter driven through the store it was given | REQ-142, REQ-146 | **gap — finding 2** |

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
| AC-1398 every declared binding pairs across both halves; schema applied before upload | REQ-143, REQ-162 (recorded as a reconciliation decision 2026-09-01) | aligned — the per-binding form is the post-REQ-162 one, correctly |
| AC-1447 unchanged draft assembles once, currency proved by a live version read | BUG-37 | aligned |
| AC-1448 retained draft never outlives, is misattributed to, or crosses accounts | BUG-37 | aligned |
| *(no AC)* the cloud adapter answers the port's revision verbs as the others do | REQ-149 | echo of finding 1 (see Notes) |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | coverage | STORY-118 (`story-3f4a5f2b`) | ac-add | STORY-118's body claims the revision half of the port explicitly — "the port carries the revision storage verbs … REQ-149 added five more questions to the same declared set — list a site's revisions, freeze one, read one back, read the revision the draft descends from, and re-parent it — answered by every adapter exactly as the editing questions are", and its Out-of-scope bullet states "this story owns that the revision storage verbs are declared on the same port and answered by every adapter, not what a publish run does with them". No AC under STORY-118 covers it: AC-1321's enumeration of the total question set stops at the editing verbs, and AC-1325's shared body lists only editing assertions. The behaviour is real and landed — `tools/generate/src/store/site-store.ts:206-233` declares `revisions` / `writeRevision` / `readRevision` / `draftBase` / `setDraftBase`, and `fs-store.ts`, `memory-store.ts` (`memory-store.ts:188-230`) and `d1r2-store.ts` all implement them — but the shared conformance body `tests/support/site-store-contract.ts` contains no revision assertion at all, so the memory adapter's revision verbs are asserted by nothing. CAP-82's AC-1418/AC-1421 cover the publish/checkout *sequencing* over these verbs (filesystem and cloud only), not the port-level cross-adapter claim STORY-118 reserves for itself. Intent: REQ-149 (`request-554ac441`, free_and_reconciled, 2026-08-17) | Author an AC under STORY-118 stating that the five revision verbs are part of the same declared, total, asynchronous set and are answered by every adapter — including the filesystem-free one — for a site that has published and one that has not; verified through the same shared assertion body as the editing questions rather than only through CAP-82's publish tests |
| 2 | violation | coverage | STORY-118 (`story-3f4a5f2b`) | ac-add | STORY-118's In-scope list names three consumers — "The editing surface, the builder's preview of a draft, and the assistant's tool adapter all driven through the store they were given" — and the body's "Two stores, both current, neither detected" paragraph names the same three as the places the store is chosen at start-up ("by the command line, by the builder origin and by the assistant's tool adapter"). AC-1324 covers the editing surface and AC-1327 covers the builder's preview; no AC in the capability covers the assistant's tool adapter. The behaviour is landed — `tools/generate/src/cli/ai/toolbox-core.ts:519` takes `store: SiteStore` and `tools/generate/src/cli/ai/toolbox.ts:186` reads `const siteStore = store ?? fsSiteStore(ctxOf(opts))` — and REQ-142's implementation record names `ai/toolbox.ts` as one of the three updated call sites alongside `index.ts` and `builder.ts`. A repo-wide scan of acceptance criteria found only AC-1239 (a different capability) mentioning the toolbox, and it is about grant grouping, not the store it was given. Intents: REQ-142 (`request-0dd62a5d`, free_and_reconciled, 2026-08-15), REQ-146 (`request-0cdfdc5b`, free_and_reconciled, 2026-08-15) | Author an AC under STORY-118 that the assistant's tool adapter is driven through the store it was constructed with — its site-editing tools completing against the filesystem-free store with no filesystem tree present — or extend AC-1324 to drive its assertions through the toolbox as a third named consumer |
| 3 | info | consistency | AC-1385 (`acceptance_criterion-0d6bc58c`) | — | AC-1385 declares a named exception (the two draft-*render* questions are answered by the filesystem-hosted stores only, the Workers runtime lacking the build transform), while STORY-121's body states the shared body runs "against the filesystem store, the filesystem-free in-memory store, and the cloud store" without noting the exclusion. The AC is the more precise of the two and matches the tree (`tests/support/site-store-contract.ts:45-49` records the same exclusion for the same reason). No edit wanted at ac level — recorded so a later reader does not read the AC as narrowing the story | none |
| 4 | info | exclusivity | AC-1325 (`acceptance_criterion-6a7b61e4`) + AC-1385 (`acceptance_criterion-0d6bc58c`) | — | The two-store identity claim (AC-1325, STORY-118) and the three-store one (AC-1385, STORY-121) overlap by construction: AC-1385 is AC-1325's set plus the cloud store. Not a within-story duplicate, and each carries content the other does not — AC-1325 additionally asserts that the same command sequence yields equal assembled definitions, AC-1385 additionally asserts single-suite sharing and the render exception. Left as recorded overlap, not a finding | none |
| 5 | info | exclusivity | AC-1327 (`acceptance_criterion-16093733`) | — | AC-1327's fourth bullet ("a change made to the draft outside the builder is picked up on the next request, without the server being restarted") states, at the preview layer, something close to AC-1033 (`acceptance_criterion-ae33f0ab`, a different capability's workspace freshness criterion). STORY-121's Technical Context already names AC-1033 as the property this work must not break and states the store-layer counterpart is AC-1447's, so the three are deliberately layered rather than duplicated. Cross-capability, hence not an ac-level exclusivity finding | none |

## Notes for the Editor

**The two violations share one shape and one cause.** Both are behaviour the
STORY-118 body claims in as many words and no AC states. Neither is drift *away*
from intent — the implementation does the right thing in both cases and the story
bodies describe it correctly — so neither is a `story-body-edit` and neither is a
`code-issue`. The repair is two new ACs under STORY-118 and nothing else; no
existing AC is wrong.

**Finding 1 will echo into STORY-121 if it is repaired narrowly.** STORY-121's
body makes the same claim for its own adapter ("This store is a revision store,
not a draft-only one … it answers the port's revision verbs — including reading
and re-parenting the revision the draft descends from — exactly as the other
adapters do"), and its In-scope list does not name it either. Filing the AC at
STORY-118 covers both if the AC is written as a port-level claim over *every*
adapter, which is how STORY-118's body words its ownership. Writing it as a
filesystem-only claim would leave STORY-121's sentence uncovered and require a
second AC.

**Where the coverage hole actually bites.** The reason finding 1 is a violation
rather than an observation: `tests/support/site-store-contract.ts` — the "one body
of storage assertions run against all three stores" that AC-1385 exists to
protect — contains no revision assertion, so the *only* revision coverage in the
tree is CAP-82's publish tests, which drive the filesystem store
(`tests/reconciliation-publish-revision.test.ts`) and the cloud store
(`tests/test_UAT_FC_REQ-149_publish_in_the_cloud.workers.test.ts`). The memory
adapter's five revision verbs are implemented and asserted nowhere. That is
precisely the drift the shared-body criterion was written to prevent, and it is
invisible today because no AC asks for it.

**AC-1398 was checked against REQ-162 specifically** and is in its post-REQ-162
per-binding-pairing form, matching STORY-121's Reconciliation Decision of
2026-09-01. The counted form the decision retired does not survive anywhere in
the AC text.
