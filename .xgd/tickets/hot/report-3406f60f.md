---
uid: report-3406f60f
id: REPORT-1736
type: report
title: 'UAT Coverage: Site Delivery: Deploy & Public Serving'
created_by: xgd
created_at: '2026-08-09T13:51:20.712834+00:00'
updated_at: '2026-08-09T13:51:20.712834+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: uat_coverage_check
  subject_uid: capability-a12e557f
  violations: 0
  warnings: 1
  needs_review_count: 0
---

# UAT Coverage Assessment: Site Delivery: Deploy & Public Serving

**Result**: PASS
**AC verdicts**: 36 pass, 0 fail, 0 deprecated, 0 needs_review
**Story verdicts**: 3 pass, 0 fail, 0 stale, 0 needs_review
**Capability verdict**: pass

## Cumulative Intent Considered

The capability's three stories all carry `intent_uid: bundle-e0143ffa`
(BUNDLE-13) and two carry `updated_by: bundle-0385746c` (BUNDLE-14). Both
bundles are `free_and_reconciled` and merged to main, so everything they contain
counts toward cumulative intent. The delivery-relevant intents inside them:

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-110 | free_and_reconciled (BUNDLE-13, merged `1ee6aaf`) | 2026-08-06 | R2 artifact store + `1c deploy`: content-addressed snapshot, two channels, render-first, dry-run, prune, staged report, manifest concurrency | YES |
| REQ-111 | free_and_reconciled (BUNDLE-13, merged `1ee6aaf`) | 2026-08-06 | public-site Worker: route grammar, deploy-index authority, trailing-slash 301, cache policy, noindex on preview, opaque 404, content types, reserved `draft` segment | YES |
| REQ-113 | free_and_reconciled (BUNDLE-13, merged `1ee6aaf`) | 2026-08-06 | Clean/extensionless page URLs in `1c serve`; **scope-extended 2026-07-30** to the Worker too, after the original "Cloudflare Pages auto-serves .html" premise was found false | YES (as extended) |
| BUG-31 | free_and_reconciled (BUNDLE-14, merged `cd8f98c`) | 2026-08-06 | `--sandbox` wrote into a real site's R2 keyspace; resolved by **namespacing** each store tree (not refusal) — adds AC-924/925/926 (deploy side) and AC-927 (serving side) | YES |
| REQ-109 | free_and_reconciled (BUNDLE-13) | 2026-08-06 | Relocatable document-relative output — a precondition this capability rests on; its ACs live under the L1 emitter story, not here | YES (upstream) |

No intent in the ledger retires any behavior this capability's matrix
describes. Nothing here is `abandoned` / `deprecated` / `wont_fix`, and nothing
is still `draft` / `ready_to_implement`.

## Alignment Ledger

| Story | Intents aligned to | Outcome | Notes |
|---|---|---|---|
| STORY-94 (story-5349d01f) — ship a site off the laptop | REQ-110, BUG-31 | aligned | Body's scope matches REQ-110 clause-for-clause; the BUG-31 store-tree scoping is described and correctly attributed as a correction. Divergences from intent are *recorded in the body* rather than silently absorbed (see notes). |
| STORY-95 (story-d34eccd8) — serve a deployed snapshot | REQ-111, BUG-31 | aligned | Body matches REQ-111's route grammar, index-authority, slash, cache, noindex, opaque-404, read-only, typing and reserved-segment clauses; AC-927 correctly carried here as BUG-31's serving-side half. |
| STORY-96 (story-66115f6b) — clean page URLs | REQ-113 (incl. 2026-07-30 scope extension) | aligned | Body records the *corrected* intent explicitly: REQ-113's original premise was false, and the goal was reached only when the production half changed too. That is exactly what the extended intent asks for. |

## Findings — Categorized by Editor Action

No violations and no needs_review items. One informational warning:

| # | Severity | Level | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | uat | `.xgd/uat_index.json` | index-refresh | The UAT index is stale (written 2026-08-06 22:34, before these tests landed on 08-07). It reports `status: "missing"` with `last_run: null` for all 36 ACs (AC-892…AC-927), while all 36 tests exist and pass. Judged from the test bodies, per this prompt's instruction. | Regenerate the UAT index so a later automated gate reading it does not conclude this capability is uncovered |

## Evidence Reviewed

All 36 ACs were judged by reading the test bodies, then confirmed by execution:

```
npx vitest run tests/reconciliation-deploy-snapshot.test.ts \
  tests/reconciliation-serve-deployed-snapshot.test.ts \
  tests/reconciliation-clean-page-urls.test.ts \
  tests/reconciliation-servable-root-confinement.test.ts

Test Files  4 passed (4)
     Tests  36 passed (36)
  Duration  1.04s
```

| Test file | ACs | Entry point driven |
|---|---|---|
| `tests/reconciliation-deploy-snapshot.test.ts` | AC-892…901, 924, 925, 926 (13) | real `cmdDeploy` / `cmdPublish` / `cmdNew` / `run(['help'])`; real render |
| `tests/reconciliation-serve-deployed-snapshot.test.ts` | AC-902…914 (13) | real `worker.fetch(Request, Env, ExecutionContext)` over bytes a real `1c deploy` wrote |
| `tests/reconciliation-servable-root-confinement.test.ts` | AC-927 (1) | real `worker.fetch`, two real store trees each seeded by a real deploy |
| `tests/reconciliation-clean-page-urls.test.ts` | AC-915…923 (9) | real `startServe` preview server over loopback (and a raw socket where traversal must survive client normalisation) + real `worker.fetch` |

Mocking is confined to the one boundary the project does not own: R2, faked at
the client seam (`MemoryR2Client`) on the deploy side and at the binding
(`FakeBucket`) on the serving side. The route grammar, deploy index, store seam,
header policy, content-type tables and edge-cache behaviour above it are all
real. This satisfies the thin-mock rule in TEST-STRATEGY.md — no internal
component is mocked.

The evidence is also unusually resistant to passing for the wrong reason, which
is what "substantive" is supposed to mean:

- **Negative controls are paired with positives.** AC-907 and AC-923 assert
  `bucket.readKeys === []` for rejected URLs *and* include a well-formed control
  request in the same test that demonstrably does read.
- **Confinement is proved as confinement, not as malformed-input rejection.**
  AC-927 first proves out-of-band that the sandbox bytes are well-formed, really
  deployed, really indexed and readable at their key, so the subsequent 404s can
  only be attributed to the tree.
- **Fixtures are derived, not hand-built.** AC-914 feeds the reserved-segment
  gate a real snapshot file list from a real deploy; pages are built from the
  real scaffold with a marker swapped in.
- **Assets are authored root-absolute on purpose** (AC-902), so the test would
  fail if REQ-109 relativization regressed rather than passing for the wrong
  reason.
- **Cross-boundary tables are pinned to each other.** AC-908 asserts the
  server's and the deploy pipeline's content-type tables agree, and that stored
  metadata is deliberately *not* consulted.

## Notes for the Editor

Nothing to edit in the matrix. Three observations worth carrying forward:

1. **The stale `uat_index.json` is the only actionable item** and it is
   infrastructure, not matrix drift. It currently understates this capability's
   coverage to zero. Anything downstream that trusts the index rather than the
   test files will disagree with this assessment.

2. **Three divergences are recorded in story bodies rather than hidden**, and
   each is correctly *not* a matrix defect — the ACs pin the property that was
   actually achieved:
   - STORY-94: REQ-110 specified a compare-and-swap on the deploy index; the
     upload mechanism exposes no conditional write, so the implementation
     re-reads and compares. The body labels this "Known divergence from intent
     (flag for regression)". AC-901 pins the property intent cared about (a lost
     update fails loudly, unclobbered) rather than the mechanism.
   - STORY-95: published addresses are not revision-scoped, so a short cache
     window can pair new markup with an old stylesheet. The body flags it as an
     accepted wart; AC-909 pins the short lifetime, not the absence of the
     window.
   - STORY-95/96: neither the live-bucket smoke check nor apex DNS provisioning
     was ever run. The bodies say so plainly. The serving rules are proven
     against the real entry point with the binding faked; the wiring to a real
     bucket is not proven and is not claimed to be.

3. **Two invariants are asserted at their own entry point because no site
   definition can currently reach them end-to-end** — the reserved-segment gate
   (AC-914) and the preview/deployed directory asymmetry (STORY-96). Both story
   bodies say why, and AC-914's test additionally pins the reason with a live
   assertion that fails the day rendered output gains nesting. That is the
   correct handling of an unreachable invariant, not a coverage gap.
