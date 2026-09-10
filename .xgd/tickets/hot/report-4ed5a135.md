---
uid: report-4ed5a135
id: REPORT-3688
type: report
title: 'UAT Coverage: Site Storage Port: One Async Store Behind Every Edit'
created_by: xgd
created_at: '2026-09-10T07:17:28.849130+00:00'
updated_at: '2026-09-10T07:17:28.849130+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: uat_coverage_check
  subject_uid: capability-c4c7a854
  violations: 0
  warnings: 2
  needs_review_count: 0
---

# UAT Coverage Assessment: Site Storage Port: One Async Store Behind Every Edit

**Result**: PASS
**AC verdicts**: 27 pass, 0 fail, 0 deprecated, 0 needs_review
**Story verdicts**: 2 pass, 0 fail, 0 stale, 0 needs_review
**Capability verdict**: pass

Anchor report: report-e37a6b4a. Previous attempts: 0.

**Method note.** The intent ledger was rebuilt from the tickets themselves
(`bundle-77b28def`, `bundle-b3b7c399`, `bundle-78f4e2fe`, `request-13a5e206`),
including the per-source-ticket bodies inside each bundle, and walked
chronologically for retirements. All 27 ACs were read in full. `.xgd/uat_index.json`
is **empty** (`acs: {}`), so tests were located by a text-forced recursive grep for
`test_UAT_AC<n>_` across the tree rather than through the index — the NUL-byte
hazard recorded in STORY-118's Technical Context makes a plain grep unreliable here,
so `grep -a` was used. Every one of the 27 ACs resolved to at least one named test,
and every test body was read.

Tests were **not** re-executed for this assessment. The immediately preceding
capability-intent alignment at level `uat` (report-14a0d4e3, PASS, 07:09) did run the
three node-runtime suites — 53/54 passing, the single failure being
`test_UAT_AC1397_…` dying at `tools/generate/src/cli/serve.ts:41` with
`listen EPERM`, i.e. this session's sandbox refusing to bind a socket, not a defect.
The two workerd suites cannot be executed here at all: the
`@cloudflare/vitest-pool-workers` pool dies at start-up on the same `listen EPERM`.
This prompt's question is whether the tests substantively cover the ACs, which is
answered from their bodies; no verdict below rests on having run them.

## Cumulative Intent Considered

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-141 (BUNDLE-19) | free_and_reconciled | 2026-08-18 | Workers-runtime test project: UATs inside workerd against real D1/R2 bindings | YES |
| REQ-142 (BUNDLE-19) | free_and_reconciled | 2026-08-18 | An async `SiteStore` port with the filesystem behind it; two live adapters injected at construction; one whole change as one call; no location-shaped return; the AI toolbox adapter named as a call site of the injected store (§7, §10) | YES |
| REQ-131 (BUNDLE-19) | free_and_reconciled | 2026-08-18 | Draft change journal (CAP-99; this capability owns only that the questions answer over the port) | YES |
| REQ-143 (BUNDLE-20) | free_and_reconciled | 2026-08-24 | The Cloudflare SiteStore: definitions in D1, bytes in R2; tenant bound into the handle; `expect`/`version`/`StoreConflictError`; the filesystem store's stated non-guarantee | YES |
| REQ-145 (BUNDLE-20) | free_and_reconciled | 2026-08-24 | control-app becomes the builder; the origin opens this store on every route | YES |
| REQ-148 / REQ-150 (BUNDLE-20) | free_and_reconciled | 2026-08-24 | Behavior modules become plain TS functions; Astro's build config replaced with plain Vitest — the two runtimes are separated by the filesystem, not a transform | YES (modifies AC-1329's mechanism, not its claim) |
| REQ-149 (BUNDLE-20) | free_and_reconciled | 2026-08-24 | Publish in the cloud: the five revision storage verbs join the same declared set, answered by every adapter | YES (adds AC-1619) |
| BUG-36 (BUNDLE-21) | free_and_reconciled | 2026-08-26 | Fresh deployment 503s — the refusal discriminant a bootstrap branches on | YES |
| BUG-37 (BUNDLE-21) | free_and_reconciled | 2026-08-26 | Edit mode dies with CF 1102 — the retained assembled draft and its invalidation rule | YES |
| REQ-162 (request-13a5e206) | free_and_reconciled | 2026-08-31 | A second object-store binding, correctly repeated in both halves — AC-1398 restated per binding rather than counted | YES (modifies AC-1398) |

**No intent in the ledger retires a behaviour any AC still claims.** All ten entries
are `free_and_reconciled`. The two modifications (REQ-148/150 on AC-1329's mechanism,
REQ-162 on AC-1398's form) are both already reflected in the AC bodies and in the
tests. Nothing is `abandoned`, `deprecated` or `wont_fix`; nothing is `draft` or
`ready_to_implement`. Therefore no AC is deprecated and no story is stale.

## Alignment Ledger

| Story | Intents aligned to | Outcome | Notes |
|---|---|---|---|
| STORY-118 (`story-3f4a5f2b`) | REQ-142, REQ-141, REQ-149, REQ-148, REQ-150, REQ-131 | aligned | Every body claim maps to an AC: declared set / totality / asynchrony → AC-1321; no location → AC-1322; one whole change → AC-1323; filesystem-free store not a mock → AC-1324; both stores identical → AC-1325; unchanged CLI + envelopes → AC-1326; preview from the given store → AC-1327; two runtimes with real bindings → AC-1328/AC-1329; revision verbs on the same set → AC-1619; the assistant's tool adapter → AC-1620. The three recorded non-behaviours (fs non-atomicity, buffered preview, the retracted test-pool pin rationale) are deliberately *not* criteria and correctly generate no coverage gap. |
| STORY-121 (`story-fde7370b`) | REQ-143, BUG-36, BUG-37, REQ-162, REQ-149, REQ-145 | aligned (incl. reconciliation-decided) | Body claims → AC-1385…AC-1398, AC-1447, AC-1448. Five `## Reconciliation Decisions` entries were treated as decided, not re-opened: the store's own site-admin surface (formalized inside AC-1386's scoping and AC-1394's destination refusal), the unsafe-name write dropped-not-raised (AC-1393's write half), the retained draft filed against this adapter (AC-1447/1448), BUG-37's billing root cause generating no criterion, and AC-1398's per-binding restatement. Each is genuinely carried by a test. |

## Findings — Categorized by Editor Action

| # | Severity | Level | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | uat | AC-1385 | uat-edit (optional) | The test named for this AC compares only two of the three stores directly (`askStorageQuestions(fs)` vs `askStorageQuestions(memory)`); the third leg is asserted at `tests/reconciliation-cloudflare-site-store.test.ts:258-263` by reading the sibling suite's **source text** for the string `askStorageQuestions`. The genuine three-way comparison does exist and does run against real D1/R2 — but it lives in `test_UAT_AC1395_…` (`tests/reconciliation-cloudflare-site-store.workers.test.ts:730-732`), under a different AC's name. An index- or name-driven view of AC-1385's evidence therefore sees a structural assertion where the behavioural one is. Coverage is real; the *attribution* is fragile. | Optional: add an `AC-1385`-named alias or a one-line cross-reference comment at `:730` so an edit to AC-1395's test cannot silently remove AC-1385's third leg. No behaviour change, no new assertion needed. |
| 2 | warning | uat | AC-1391 | uat-edit (optional) | The closing assertion `expect(readRepo(WORKERS_SUITE)).toContain('StoreConflictError')` (`tests/reconciliation-cloudflare-site-store.test.ts:336`) is a source-text check standing in for "the transactional store refuses the same sequence". The real contrast is asserted behaviourally in `test_UAT_AC1389_…`. The clause is harmless garnish on an otherwise fully behavioural test. | Optional: drop the line, or replace the comment with a direct pointer to `test_UAT_AC1389_…`. |

**No violations. No needs_review of either kind** — every AC's behaviour traces to a
reconciled intent or to a recorded `## Reconciliation Decisions` entry, so the
BUG-1306 impact screen was not reached for any element.

## Notes for the Editor

Nothing here blocks. Both findings are warnings and neither affects pass/fail.

Three observations worth carrying forward rather than acting on:

1. **`.xgd/uat_index.json` is empty** (`{"updated_at": …, "acs": {}}`). Every AC in
   this capability *does* have a correctly named `test_UAT_AC<n>_*` function, so the
   empty index is an indexer fault, not a coverage fault — most likely the anchored
   `^test_UAT_` regex failing against vitest's suite-prefixed test names. Any
   downstream stage that trusts the index for this capability will read zero
   coverage where there is full coverage. This is an XGD-tool issue, not a project
   defect, and it is worth fixing before another capability is assessed through it.

2. **The evidence quality here is unusually high and is worth preserving as a
   pattern.** Three properties recur and are the reason 27/27 pass: (a) one shared
   assertion body (`tests/support/site-store-contract.ts`,
   `tests/support/storage-questions.ts`) registered against all three adapters, so
   "the stores agree" is one function applied three times rather than three suites
   that happen to agree today; (b) non-vacuity guards asserted explicitly
   (`expect(bySlug.size).toBeGreaterThan(0)` before AC-1395's real-site loop,
   `expect(fromFs.appendChange).toEqual([1,2])` after AC-1385's comparison,
   `expect(() => new TextDecoder('utf-8', {fatal:true}).decode(png)).toThrow()` in
   AC-1392); (c) identity rather than equality where the claim is "this did not run
   again" (AC-1447, AC-1448), which is the only observation at the store boundary
   that distinguishes reuse from re-validation.

3. **The only mocking anywhere in this evidence set is at genuine external
   boundaries**, and each instance is justified in the test itself: `npx` is stubbed
   in AC-1398 so the migrate hook can be executed for real without reaching
   Cloudflare; `recordingStore` in AC-1323 and `recording()` in AC-1394 are
   pass-through decorators over the real store, which is the only way to observe the
   *shape of the ask* that those criteria are about; the `inconsistent` /
   `vanishing` stores in AC-1394 are deliberately-broken sources whose brokenness is
   the input under test. No test mocks the component it is asserting about. No
   internal-mocking violation was found.
