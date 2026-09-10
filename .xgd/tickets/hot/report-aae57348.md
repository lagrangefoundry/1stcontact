---
uid: report-aae57348
id: REPORT-3666
type: report
title: 'Capability-Intent Alignment: Platform Build, Deploy & Live-Origin Verification
  (level=ac)'
created_by: xgd
created_at: '2026-09-10T05:00:35.057128+00:00'
updated_at: '2026-09-10T05:00:35.057128+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-5d07b533
  level: ac
  violations: 1
  warnings: 0
  needs_review_count: 0
---

# Capability-Intent Alignment: Platform Build, Deploy & Live-Origin Verification
# Level: ac

**Result**: FAIL
**Violations**: 1
**Warnings**: 0
**Needs review**: 0

The capability holds exactly one story — STORY-119 (`story-d5167ced`, `story_kind: upgrade`) —
carrying 18 active acceptance criteria. Coverage of the story's behavioural surface is complete
and exclusivity is clean. One AC has drifted: **AC-1455 freezes an enumerated binding set that
two later reconciled intents have since grown**, and the UAT written from that text fails today.

## Cumulative Intent Considered

The story's `intent_uid` is BUNDLE-19 (`bundle-77b28def`) and its `updated_by` is BUNDLE-21
(`bundle-78f4e2fe`); the story body additionally records a reconciliation against BUNDLE-20
(REQ-147 + REQ-149). Unrolled to source intents, chronologically:

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-144 | free_and_reconciled | 2026-08-15 | `bin/build` / `bin/deploy` / `bin/smoke`; the `[vars]` non-inheritance rule behind the first-deploy failure | YES |
| REQ-145 | free_and_reconciled | 2026-08-15 | control-app becomes the builder: generated client artifacts, `[assets]` binding, `ACCESS_DEV_OPEN` as a top-level-only local relaxation | YES |
| REQ-147 | free_and_reconciled | 2026-08-15 | Access on `app.1stcontact.io`; `workers_dev = false` as a security control; the two control-surface smoke checks | YES |
| REQ-149 | free_and_reconciled | 2026-08-17 | cloud publish; the type-program filesystem refusal; the piped, newline-free secret push | YES |
| REQ-154 | bundled | 2026-08-20 | Browser Rendering driver — adds `[browser] binding = "BROWSER"` at the top level **and** under `[env.production]` | imminent — YES |
| BUG-36 | free_and_reconciled | 2026-08-23 | fresh-deploy 503 / tenant seeding; supersedes the story's "never deployed" premise (cited as Technical Context, no AC claims a live deploy) | YES |
| BUG-37 | free_and_reconciled | 2026-08-24 | Error 1102; adds the unsampled `[observability]` retention block and its placement rule | YES |
| BUG-38 | free_and_reconciled | 2026-08-24 | builder chat conversation lifetime — no ask touching this capability | YES (no ask here) |
| REQ-162 | free_and_reconciled | 2026-08-31 | product ticket store — adds `[[r2_buckets]] binding = "BLOBS"` at the top level **and** under `[env.production]` | YES |

No intent in the ledger is `abandoned`, `deprecated` or `wont_fix`, so Step 2.5's
stale-vehicle-citation case does not arise anywhere in this tree.

**The two entries that matter for the finding below** are REQ-154 and REQ-162. Neither is about
build/deploy/smoke; each simply *adds a binding* to `apps/control-app/wrangler.toml`. Both correctly
repeat that binding under `[env.production]`, so AC-1341's rule is satisfied — but both invalidate
AC-1455's enumeration of the binding set as three entries.

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| AC-1330 preflight reports/refuses, exit code, remedy | REQ-144 | aligned |
| AC-1331 discover + bundle every Worker against production, after preflight | REQ-144 | aligned |
| AC-1332 rehearsal is the same path | REQ-144 | aligned |
| AC-1333 hook discovery by executability, sorted, context, before upload | REQ-144, REQ-149 | aligned |
| AC-1334 failing hook aborts before upload | REQ-144 | aligned |
| AC-1335 deploy target selection, unknown app refused | REQ-144 | aligned |
| AC-1336 every applicable check passes; skips named not forbidden | REQ-144, REQ-147 (widened by Reconciliation Decision 2) | aligned — verified 11 checks exist in `tools/generate/bin/smoke.mjs` (9 public + 2 control), matching the AC's enumeration exactly |
| AC-1337 each silent breakage fails non-zero naming the check | REQ-144 | aligned |
| AC-1338 nothing-to-test-against reports skip with missing input | REQ-144 | aligned |
| AC-1339 same-origin assets resolve, one level into stylesheets | REQ-144 | aligned |
| AC-1340 unpublished indistinguishable from unknown | REQ-144 | aligned |
| AC-1341 every named environment repeats every top-level var and binding | REQ-144, REQ-145 (the one stated exception) | aligned — the rule itself is satisfied by the current tree: REQ-154's `BROWSER` and REQ-162's `BLOBS` are both repeated under `[env.production]` |
| AC-1342 no secret value committed; documented push pipes and echoes only names | REQ-149 | aligned |
| AC-1425 control origin challenges; default hostname does not answer; each on its own option | REQ-147 (Reconciliation Decision 1) | aligned |
| AC-1426 build refuses a type program reaching a filesystem-bound module | REQ-149 (Reconciliation Decision 4) | aligned |
| AC-1427 derived artifacts generated before the typecheck | REQ-145 | aligned |
| AC-1454 unsampled retention for both environments, placed after the bare keys | BUG-37 (Reconciliation Decision 5) | aligned |
| AC-1455 retention is not a binding, so the counted set is unchanged | BUG-37 (Reconciliation Decision 6) | **drifted** — the criterion's rule is right; its verification freezes a three-binding set that REQ-154 and REQ-162 have since grown to five |

Two cross-capability pins were checked rather than assumed, because STORY-119's body claims them:

- *"Each is pinned by its own criterion"* (§ the two inheritable repeats). Invocation-log retention →
  AC-1454, in this capability. The platform-default-hostname control → **AC-1382**, in the access-gate
  capability (`tests/reconciliation-builder-private-access-gate.test.ts:442`,
  `test_UAT_AC1382_the_deployment_answers_on_no_address_the_gate_does_not_front`, which asserts
  `workers_dev = false` twice — top level and production). The claim holds; the story's
  "the access gate itself is a capability of its own" out-of-scope line is why the second pin is not
  an AC here. **No coverage gap.**
- *"asserting that absence elsewhere"* (Reconciliation Decision 3, the `ACCESS_DEV_OPEN` exception).
  AC-1341 names the exception and exempts it from repetition; the positive requirement that it be
  *absent* from `[env.production.vars]` is asserted by REQ-145's own criterion, exactly as the
  decision records. AC-1341's weaker "not required to be repeated" is therefore correct here, not a
  softening. **No finding.**

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | consistency | AC-1455 (`acceptance_criterion-9287f523`) | ac-edit | AC-1455's Verification states *"The production environment's binding set still holds **exactly** the declarations it held before — its structured-data store, its object bucket, and its asset binding."* That enumeration is three entries. `apps/control-app/wrangler.toml` now declares **five** bindings at both levels: `assets:ASSETS`, `d1_databases:DB`, `r2_buckets:SITES`, plus `r2_buckets:BLOBS` (REQ-162, free_and_reconciled 2026-08-31, `wrangler.toml:164` / `:230`) and `browser:BROWSER` (REQ-154, bundled 2026-08-20, `wrangler.toml:183` / `:235`). STORY-119's body never enumerates the set — it only requires that non-binding declarations *"may [not] join the variable or binding sets the repetition check enumerates"* — so the AC over-specifies beyond its own story, and the over-specification has now gone stale against two reconciled intents. Confirmed failing: `tests/reconciliation-platform-invocation-log-retention.test.ts:189` (`test_UAT_AC1455_…`) asserts `EXPECTED = ['assets:ASSETS', 'd1_databases:DB', 'r2_buckets:SITES']` and fails with the two extra bindings received. | Restate AC-1455's Verification as the property the criterion actually needs, not a snapshot: *"neither binding set contains any entry derived from the retention declaration, and the named production environment's binding set is identical to the top level's"* — a form that survives every future binding REQ-154/REQ-162-style intents add. Do **not** simply extend the list to five; that reproduces the same failure on the next binding. (Consequential `uat-edit` at the uat level: replace the frozen `EXPECTED` array at `tests/reconciliation-platform-invocation-log-retention.test.ts:188` with the same set-equality-plus-exclusion form. The retention exclusion assertions above it, lines 175–182, are already written in the durable shape and should be kept.) |
| 2 | info | coverage | AC-1331 (`acceptance_criterion-ae2bb537`) | — | AC-1331 states a preflight-skip option (*"The check can be explicitly skipped for an environment that cannot satisfy it"*) and a no-deployment-configuration refusal that STORY-119's *In scope* list does not itemise. Neither contradicts the story: the skip follows directly from its *Out of scope* line about CI being unable to run the preflight, and the refusal follows from discovery-not-a-list. Recorded so a later reader does not re-derive it as drift. | none |
| 3 | info | consistency | AC-1339 (`acceptance_criterion-2e6c1d2d`) | — | AC-1339's bounded/configurable asset cap and its "stopping at the bound is a failure, never a silent pass" clause are refinements below the story body's granularity, not additions contradicting it. | none |

## Notes for the Editor

**The finding is one AC, and the fix is a shape change rather than a value change.** AC-1455 is
correct in what it *requires* (retention must stay invisible to a structurally-identified binding
set) and wrong only in *how it verifies* it (by naming today's bindings). The failure mode it warns
about — *"the criteria that assert an exact set of bindings … would begin failing on a declaration
that binds nothing"* — has occurred, but from the opposite direction: not a non-binding block
miscounted, but two genuine bindings correctly counted against a list written before they existed.
An editor that only widens the list to five leaves the same trap armed for the next binding.

**AC-1341 is not affected and must not be edited alongside it.** The environment-repetition rule
passes on the current tree: `BLOBS` and `BROWSER` are each declared at the top level *and* repeated
under `[env.production]`, which is the rule working exactly as written. The two ACs read as a pair
and it would be easy to "fix" both; only AC-1455 has drifted.

**One test in this story's evidence set fails for an environment reason, not a matrix reason.**
`test_UAT_AC1331_build_bundles_every_discovered_worker_against_production_after_preflight`
(`tests/reconciliation-platform-build-deploy-smoke.test.ts:653`) fails in this worktree with
`@lagrangefoundry/webui-shell is not installed` — the shared component store is populated out of
band and is absent here. That is precisely the condition AC-1330's preflight exists to name, and it
is not drift between the matrix and intent. The other 15 tests across
`reconciliation-platform-build-deploy-smoke.test.ts` and
`reconciliation-platform-build-order-and-private-surface.test.ts` pass.

**Verified rather than assumed, for the next check's benefit:** the smoke command really does carry
eleven checks — `apex_resolves`, `unknown_slug_not_found`, `unpublished_slug_indistinguishable`,
`published_root_redirects`, `draft_root_redirects`, `draft_index_serves_html`,
`draft_cache_and_robots_policy`, `draft_miss_is_noindex_404`, `draft_assets_resolve`, plus
`control_app_challenges_unauthenticated` and `control_app_workers_dev_closed`
(`tools/generate/bin/smoke.mjs:175–392`). AC-1336's "nine public-serving + exactly two
control-surface" enumeration matches the implementation one-for-one, so Reconciliation Decision 2's
widening is faithfully expressed and needs no further attention.
