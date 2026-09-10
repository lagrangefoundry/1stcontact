---
uid: report-6bad1888
id: REPORT-3668
type: report
title: 'Capability-Intent Alignment: Platform Build, Deploy & Live-Origin Verification
  (level=ac)'
created_by: xgd
created_at: '2026-09-10T05:10:15.275086+00:00'
updated_at: '2026-09-10T05:10:15.275086+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-5d07b533
  level: ac
  violations: 0
  warnings: 1
  needs_review_count: 0
---

# Capability-Intent Alignment: Platform Build, Deploy & Live-Origin Verification
# Level: ac

**Result**: PASS
**Violations**: 0
**Warnings**: 1
**Needs review**: 0

The capability holds one story — STORY-119 (`story-d5167ced`, `story_kind: upgrade`) — carrying 18
active acceptance criteria. Attempt 1's single violation (AC-1455 freezing an enumerated binding
set) is **resolved**: the AC's Verification is now a set relation rather than a snapshot, and its
UAT passes. Coverage of the story's behavioural surface is complete and no AC describes behaviour
the story does not support. One warning remains, and it is a consequence of that repair rather
than of the original drift: AC-1455's new Verification asserts a property the same AC's prose
assigns to AC-1341.

## Cumulative Intent Considered

STORY-119's `intent_uid` is BUNDLE-19 (`bundle-77b28def`), its `updated_by` is BUNDLE-21
(`bundle-78f4e2fe`), and its body records a reconciliation against BUNDLE-20 (`bundle-b3b7c399`).
Unrolled to source intents, chronologically:

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-144 | free_and_reconciled | 2026-08-15 | `bin/build` / `bin/deploy` / `bin/smoke`; the named-environment non-inheritance rule behind the first-deploy failure | YES |
| REQ-145 | free_and_reconciled | 2026-08-15 | control-app becomes the builder: generated client artifacts before the typecheck; `ACCESS_DEV_OPEN` as a top-level-only local relaxation | YES |
| REQ-147 | free_and_reconciled | 2026-08-15 | Access on `app.1stcontact.io`; `workers_dev = false` as a security control; the two control-surface smoke checks | YES |
| REQ-149 | free_and_reconciled | 2026-08-17 | cloud publish; the type-program filesystem refusal; the piped, newline-free secret push | YES |
| REQ-154 | bundled (BUNDLE-22) | 2026-08-20 | Browser Rendering driver — adds `[browser] binding = "BROWSER"` at the top level **and** under `[env.production]` | imminent — YES |
| BUG-36 | free_and_reconciled | 2026-08-23 | fresh-deploy 503 / tenant seeding; supersedes the story's "never deployed" premise (Technical Context only; no AC claims a live deploy) | YES |
| BUG-37 | free_and_reconciled | 2026-08-24 | Error 1102; adds the unsampled `[observability]` retention block and its placement rule | YES |
| BUG-38 | free_and_reconciled | 2026-08-24 | builder chat conversation lifetime — no ask touching this capability | YES (no ask here) |
| REQ-162 | free_and_reconciled | 2026-08-31 | product ticket store — adds `[[r2_buckets]] binding = "BLOBS"` at the top level **and** under `[env.production]` | YES |

Re-checked this pass rather than inherited: no intent in the ledger is `abandoned`, `deprecated`
or `wont_fix`, so Step 2.5's stale-vehicle-citation case does not arise. Nothing reconciled has
landed against this capability since REQ-162 — REQ-155 through REQ-166 (other than REQ-162) are
`draft`, and BUG-39 (`bundled`) is the Node chat-host UATs, which touch nothing here. The ledger is
therefore unchanged from attempt 1's.

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| AC-1330 preflight reports/refuses, exit code, remedy | REQ-144 | aligned |
| AC-1331 discover + bundle every Worker against production, after preflight | REQ-144 | aligned |
| AC-1332 rehearsal is the same path | REQ-144 | aligned |
| AC-1333 hook discovery by executability, sorted, six-item context, before upload | REQ-144, REQ-149 | aligned — the six context items match the story body one-for-one |
| AC-1334 failing hook aborts before upload | REQ-144 | aligned |
| AC-1335 deploy target selection, unknown app refused | REQ-144 | aligned |
| AC-1336 every applicable check passes; skips named not forbidden | REQ-144, REQ-147 (widened by Reconciliation Decision 2) | aligned — re-verified: `tools/generate/bin/smoke.mjs:175–392` carries exactly eleven checks, nine public + two control, matching the AC's enumeration |
| AC-1337 each silent breakage fails non-zero naming the check | REQ-144 | aligned |
| AC-1338 nothing-to-test-against reports skip with missing input | REQ-144 | aligned |
| AC-1339 same-origin assets resolve, one level into stylesheets | REQ-144 | aligned |
| AC-1340 unpublished indistinguishable from unknown | REQ-144 | aligned |
| AC-1341 every named environment repeats every top-level var and binding | REQ-144, REQ-145 (the one stated exception) | aligned — `BROWSER` (`apps/control-app/wrangler.toml:183` / `:235`) and `BLOBS` (`:164` / `:230`) are each declared at both levels, so the rule holds on the current tree |
| AC-1342 no secret value committed; documented push pipes and echoes only names | REQ-149 | aligned |
| AC-1425 control origin challenges; default hostname does not answer; each on its own option | REQ-147 (Reconciliation Decision 1) | aligned |
| AC-1426 build refuses a type program reaching a filesystem-bound module | REQ-149 (Reconciliation Decision 4) | aligned |
| AC-1427 derived artifacts generated before the typecheck | REQ-145 | aligned |
| AC-1454 unsampled retention for both environments, placed after the bare keys | BUG-37 (Reconciliation Decision 5) | aligned — re-verified against the file: `[observability]` at `:35` and `[env.production.observability]` at `:197`, the latter after the `routes` list at `:189–191`, both `head_sampling_rate = 1` |
| AC-1455 retention is not a binding, so the counted set is unchanged | BUG-37 (Reconciliation Decision 6) | **repaired, with one residue** — the frozen three-binding enumeration is gone and the UAT passes; the replacement Verification now asserts cross-level binding identity, which the same AC's prose assigns to AC-1341 (warning 1) |

Two cross-capability pins re-checked rather than inherited, because STORY-119's body claims them:

- *"Each is pinned by its own criterion"* (the two inheritable repeats). Invocation-log retention →
  AC-1454, here. The platform-default-hostname control → **AC-1382**
  (`acceptance_criterion-0beaf780`, story `story-182e8cb9`, `uat_coverage: pass`), which requires
  the setting disabled at the top level *and* restated for the production environment, and requires
  the operator-facing route still declared. Confirmed present and active this pass. The story's
  out-of-scope line — the access gate is a capability of its own — is why the second pin is not an
  AC here. **No coverage gap.**
- *"the single stated exception"* (Reconciliation Decision 3, `ACCESS_DEV_OPEN`). AC-1341 names it
  and exempts it from repetition; the positive requirement that it be *absent* from
  `[env.production.vars]` belongs to REQ-145's own criterion, as the decision records.
  **No finding.**

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | consistency | AC-1455 (`acceptance_criterion-9287f523`) | ac-edit | AC-1455's Verification now says *"The named production environment's binding set is **identical to the top level's**"* — and two paragraphs later says *"that each is repeated under the named environment, belong[s] to AC-1341; restating them here would make this criterion fail for that criterion's reason rather than for its own."* Set identity **is** "each top-level binding is repeated", so the AC states a principle and then breaks it in the same section. Concrete failure: if a future intent adds a top-level binding to `apps/control-app/wrangler.toml` and forgets the `[env.production]` repeat, AC-1341's UAT fails (correctly) **and** AC-1455's fails for AC-1341's reason — the coupling this AC exists to refuse. The identity clause is also not load-bearing for AC-1455's own property: retention miscounted as a binding would appear at *both* levels and pass an identity check; what actually catches it is the exclusion assertion above it. Same shape in the UAT at `tests/reconciliation-platform-invocation-log-retention.test.ts:196` (`expect(productionBindings).toEqual(topLevelBindings)`) and `:205–209` (`missing.bindings` asserted empty outright rather than filtered to retention-derived entries — the variables half two lines below is already written in the filtered form the AC prose asks for). | Replace the identity clause with the non-vacuity guard it was standing in for: *"both binding sets are non-empty, so the assertion is not vacuously satisfied by a reader that returns nothing"* — asserting non-emptiness of each level separately rather than equality between them. Keep the retention-exclusion assertions, the variables clause and the negative control, which are the criterion's own property. Consequential `uat-edit`: at `:193–196` assert `topLevelBindings.length > 0` and `productionBindings.length > 0` instead of `toEqual`, and at `:206–209` filter `missing.bindings` to retention-derived entries (`b.includes('observability')`) to match the `missing.vars` assertion directly beneath it. |
| 2 | info | consistency | AC-1341 (`acceptance_criterion-7820683f`) | — | AC-1341's Verification also asserts that the two inheritable repeats *"neither ... appears among the variables or the bindings this check enumerates"* — the same property AC-1455 owns, seen from the other side. Unlike finding 1 this is deliberate: Reconciliation Decision 7 explicitly requires AC-1341 to state that what the mechanical check enumerates is variables and bindings, with inheritable declarations pinned elsewhere. Recorded so the pair is not later "de-duplicated" in the wrong direction. | none |
| 3 | info | coverage | AC-1330, AC-1331, AC-1339, AC-1335 | — | Four ACs carry refinements below the story body's granularity: the preflight's browser-vs-server component distinction (AC-1330), the preflight-skip option and the no-deployment-configuration refusal (AC-1331), the bounded/configurable asset cap whose exhaustion is a failure (AC-1339), and the environment-option-with-no-value refusal (AC-1335). None contradicts STORY-119; each follows from a rationale the body does state (the browser import map; CI being unable to run the preflight; discovery-not-a-list). Re-recorded from attempt 1 so a later reader does not derive them as drift. | none |
| 4 | info | — | AC-1455 | — | Attempt 1's violation is closed. `npm test -- tests/reconciliation-platform-invocation-log-retention.test.ts` → **2 passed**, run this pass rather than taken from the fix report. The AC text carries no enumerated binding list. | none |

## Notes for the Editor

**PASS, and finding 1 is optional.** Zero violations and zero needs_review. The warning is a
narrowing of an assertion that is currently too broad, not drift between the matrix and intent; the
level passes whether or not it is applied. If it is applied, it is one AC paragraph and four lines
of one UAT, and AC-1341 must not be touched alongside it — the environment-repetition rule is
correct as written and satisfied by the current tree.

**Why the warning exists at all.** Attempt 1 correctly refused to widen a frozen three-entry list
to five, and reached for a set relation instead. The relation it chose happens to be AC-1341's
rule. The property AC-1455 actually needed from that line was only *non-vacuity* — "the reader did
not return nothing" — which needs no cross-level comparison.

**One evidence-set test still fails for an environment reason, not a matrix reason.** Confirmed by
running it this pass, not inherited:
`test_UAT_AC1331_build_bundles_every_discovered_worker_against_production_after_preflight`
(`tests/reconciliation-platform-build-deploy-smoke.test.ts`) fails with
`@lagrangefoundry/webui-shell is not installed`; the other 15 tests across
`reconciliation-platform-build-deploy-smoke.test.ts` and
`reconciliation-platform-build-order-and-private-surface.test.ts` pass. The shared component store
is populated out of band and is absent in this worktree — which is precisely the condition AC-1330's
preflight exists to name. No matrix action.

**Every AC in the story has exactly one UAT** (`test_UAT_AC1330`–`AC1342`, `AC1425`–`AC1427`,
`AC1454`, `AC1455`), so the uat level has no missing-test coverage gap to inherit from here; whether
each is substantive is that level's question.
