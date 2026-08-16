---
uid: report-0ec59b50
id: REPORT-2087
type: report
title: 'UAT Coverage: Site Delivery: Deploy & Public Serving'
created_by: xgd
created_at: '2026-08-16T07:25:24.254522+00:00'
updated_at: '2026-08-16T07:25:24.254522+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: uat_coverage_check
  subject_uid: capability-a12e557f
  violations: 0
  warnings: 0
  needs_review_count: 0
---

# UAT Coverage Assessment: Site Delivery: Deploy & Public Serving

**Result**: PASS
**AC verdicts**: 36 pass, 0 fail, 0 deprecated, 0 needs_review
**Story verdicts**: 3 pass, 0 fail, 0 stale, 0 needs_review
**Capability verdict**: pass

## Cumulative Intent Considered

The capability tree hangs off two reconciled bundles, but the ledger below also
walks every intent raised **after** them, because four (REQ-141 … REQ-144) touch
delivery and none was considered by the prior alignment reports.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-109 (BUNDLE-13) | free_and_reconciled | 2026-07-30 (`1ee6aaf2d2`) | Document-relative asset emission. Owned by STORY-83 elsewhere; a **precondition** AC-904/AC-921 rest on | YES (as dependency) |
| REQ-110 (BUNDLE-13) | free_and_reconciled | 2026-07-30 (`1ee6aaf2d2`) | R2 artifact store + `1c deploy` — content-addressed layout and deploy index; originates STORY-94 | YES |
| REQ-111 (BUNDLE-13) | free_and_reconciled | 2026-07-30 (`1ee6aaf2d2`) | public-site Worker — the visitor half; originates STORY-95 | YES |
| REQ-113 (BUNDLE-13) | free_and_reconciled | 2026-07-31 (`1ee6aaf2d2`) | `1c serve` / Worker extensionless→`.html` agreement; originates STORY-96 | YES |
| BUG-30 (BUNDLE-13) | free_and_reconciled | 2026-07-31 (`1ee6aaf2d2`) | `relativizeUrl` fragment case — STORY-83's surface | YES (not in scope here) |
| REQ-108 (BUNDLE-13) | free_and_reconciled | 2026-07-29 (`1ee6aaf2d2`) | L1 pointer-reactive texture; does not touch delivery | YES (not in scope here) |
| BUG-31 (BUNDLE-14) | free_and_reconciled | 2026-07-31 (`cd8f98c89e`) | Store-tree (root) scoping of every R2 key + `SERVABLE_ROOT` fixed in the server. **Added AC-924/925/926 to STORY-94 and AC-927 to STORY-95**; resolution chosen was *namespace*, not refuse | YES |
| REQ-114, REQ-116 (BUNDLE-14) | free_and_reconciled | 2026-07-31 (`cd8f98c89e`) | L1 palette; edit render channel — different capabilities | YES (not in scope here) |
| REQ-141 | ready_to_reconcile | 2026-08-15 | Workers-runtime test project (vitest `projects` split, workerd pool, D1+R2 bindings) | imminent — **adds no product behavior here** |
| REQ-142 | free_coded | 2026-08-15 | Async `SiteStore` port, filesystem behind it — states "no behaviour change at all" | not yet reconciled; **retires nothing** |
| REQ-143 | draft | 2026-08-15 | The Cloudflare SiteStore (definitions in D1, bytes in R2) | NO (draft) |
| REQ-144 | free_coded | 2026-08-15 | `bin/build` / `bin/deploy` / `bin/smoke` + the control-app `[vars]` inheritance bug | not yet reconciled; **additive** to this capability |
| REQ-145 … REQ-148 | draft | 2026-08-15 | Builder into workerd, AI host, Access, modules in workerd | NO (draft) |
| REQ-112 | abandoned | 2026-07-31 | — | NO |

**Net effect: no intent retires any behavior in this capability, and every one of
the 36 ACs traces to REQ-110, REQ-111, REQ-113 or BUG-31.** No AC is unsupported;
none is orphaned from the ledger.

### On the four post-bundle intents

They were checked individually rather than waved past, because three of them name
this capability's own surfaces:

- **REQ-141** (imminent) is Test Infrastructure — per the story-type rules it
  creates no durable intent and no capability entry. Its AC-1 is explicitly
  *"every test green before this ticket is green after it"* and its routing
  convention (`*.workers.test.ts` → workerd, everything else → node) leaves all
  four of this capability's test files in the node project, unchanged. It does
  not invalidate the current evidence.
- **REQ-142** is a refactor by its own correctness claim ("the full existing suite
  passes with no assertion changed"). Nothing to add or retire in the matrix.
- **REQ-144** is additive and would eventually *close* a gap STORY-95's body
  currently records honestly (see Notes). Its `bin/smoke` deliverable restates
  several of this capability's ACs against a live origin.
- **REQ-143** and **REQ-145 … REQ-148** are `draft` and do not count.

REQ-141/142/144 all carry `main_sha: null`, and their artifacts are absent from
this branch (no `bin/build`, `bin/deploy`, `bin/smoke`; no
`vitest.workers.config.mts`). The matrix correctly does not yet describe them —
that update is reconciliation's job, not a coverage gap.

## Alignment Ledger

| Story | Intents aligned to | Outcome | Notes |
|---|---|---|---|
| STORY-94 (13 ACs) | REQ-110, BUG-31 | aligned | Every in-scope bullet of the body maps to an AC with a substantive UAT |
| STORY-95 (14 ACs) | REQ-111, BUG-31 (+REQ-109 as precondition) | aligned | Same; the apex holding response is carried by AC-913 even though the body states it under "out of scope" |
| STORY-96 (9 ACs) | REQ-113 (+REQ-109 as precondition) | aligned | Body's self-reported "corrected intent" and the stale in-code comment were both re-verified against the code |

Story judgments were made independently of the AC roll-up: each body's in-scope
bullets were enumerated and matched to an AC before the AC verdicts were consulted.
No body carries a behavioral claim that no AC addresses.

## Coverage Assessment

All 36 ACs are covered substantively. Evidence lives in four files:

| File | ACs | Real entry point driven |
|---|---|---|
| `tests/reconciliation-deploy-snapshot.test.ts` | AC-892…901, 924, 925, 926 | `cmdDeploy` / `cmdPublish` / `cmdNew` / `formatDeployReport`, real render, real local store |
| `tests/reconciliation-serve-deployed-snapshot.test.ts` | AC-902…914 | `worker.fetch(Request, Env, ExecutionContext)` over bytes a real `1c deploy` wrote |
| `tests/reconciliation-servable-root-confinement.test.ts` | AC-927 | Same Worker entry point, sandbox-only deployment |
| `tests/reconciliation-clean-page-urls.test.ts` | AC-915…923 | Both halves: `startServe` over its real loopback address (and a raw socket where traversal must survive client normalisation) **and** `worker.fetch` |

**Evidence validity holds.** The only fakes are `MemoryR2Client` (the upload
boundary) and `FakeBucket` (the R2 binding) — both genuine external-system
boundaries under the thin-mock rule. Every layer above them is real: the route
grammar, the deploy index, the content-type tables, the header policy, the edge
cache, the CLI commands and the preview server. No internal component is mocked
in any of the four files, and no test is structural (none reads source text to
assert a name appears).

Observations that would distinguish a correct implementation from an incorrect
one, rather than merely re-stating it, are present throughout. A representative
sample re-checked against the AC bodies clause by clause:

- **AC-893** — run two returns the same id *and* leaves `client.list('')` length
  unchanged; run three's bytes land beside, and the run-one page still carries
  the old string.
- **AC-901** — the index is mutated out of band *through a wrapping `R2Client`
  during the first object upload*, so the race is real rather than simulated;
  all four required message elements and the unclobbered stored index are asserted.
- **AC-905** — asserts `bucket.readKeys` equals exactly `[manifestKey(...)]` for
  an orphan, proving the URL's identifier was only ever looked up, never composed
  into a read.
- **AC-906** — byte-compares whole responses *within* each channel and pins the
  only cross-channel header difference to `x-robots-tag`, which is a faithful
  reading of a subtle criterion.
- **AC-917** — seeds the genuine `guides.html` + `guides/index.html` collision and
  asserts the directory index wins; on the deployed half it additionally asserts
  `snapshotReads` is the single exact key, proving the mapping is a last resort.
- **AC-927** — confirms out-of-band that the sandbox bytes really are present and
  readable at their key before asserting 404 on 13 route forms, so the not-found
  is attributable to confinement and not to a broken fixture.

Two tests assert partly at a non-HTTP entry point, and in both cases the AC body
prescribes it rather than the test evading the boundary: **AC-914** (the reserved
-segment gate, unreachable through `cmdDeploy` today because REQ-109 renders flat
— the test pins that reason with a real deploy of a nested slug that is refused
and writes nothing) and **AC-907/AC-923** (direct `parseRoute` assertions for
dot-shaped and empty components, which WHATWG URL parsing collapses before they
can reach the server over the wire). Both also carry HTTP-boundary assertions.

## Findings — Categorized by Editor Action

None. Zero violations, zero warnings, zero needs_review.

## Notes for the Editor

**1. One clause to revisit when REQ-144 reconciles — not an edit today.**
STORY-95's Technical Context records a carried-forward uncertainty: *"the
end-to-end smoke check against a live bucket and the apex custom-domain
provisioning were never run in session — the evidence drives the real request
entry point against a faked storage binding, so the serving rules are proven but
the wiring to a real bucket and a real DNS record is not."* That statement is
**accurate as of this branch**. REQ-144 (`free_coded`, not on main) delivers
`bin/smoke`, whose acceptance criteria assert exactly this capability's surfaces
against the live origin — apex resolves, the trailing-slash 301 holds, a
snapshot's referenced assets return 200 with correct types, `cache-control` and
`x-robots-tag` are right on the draft channel, an unknown slug 404s without
leaking a distinction. When REQ-144 is reconciled, the smoke half of that clause
should be trimmed and the new assertions given a home; the custom-domain half
stays until REQ-147. Flagging now so the reconcile does not leave a stale
"never run" claim behind.

**2. Same for REQ-141's evidence-location note.** STORY-95 and STORY-94 both
describe R2 as faked at the binding/upload boundary. REQ-141 (`ready_to_reconcile`)
makes real R2 bindings reachable in tests via a workerd project. That does not
invalidate the current UATs — REQ-141 explicitly preserves them — but a future
reconciliation may want to add a workerd-resident UAT rather than move these.

**3. `.xgd/uat_index.json` is empty and could not be used.** It carries
`updated_at: 2026-08-16T00:03:30Z` but `acs: {}` (0 entries), so the prescribed
index lookup returned "MISSING" for all 36 ACs. The AC→test mapping in this
report was rebuilt by grepping the `test_UAT_AC<n>_*` convention across the tree.
Every AC resolved to exactly one test, so nothing was lost — but the index is
stale/empty for the whole project, not just this capability, and any workflow
that trusts it will silently see zero coverage everywhere.

**4. Test execution was not possible in this session.** The session's permission
mode denied `npx vitest` / `pnpm vitest`, so these verdicts rest on reading the
AC bodies and the test bodies, not on observing a green run. That is the correct
scope for a coverage check — whether a test *substantively covers* its AC is a
property of what it asserts — but it is worth stating plainly that this
assessment did not re-confirm the suite passes. The regression workflow's own
test stage owns that.
