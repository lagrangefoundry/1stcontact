---
uid: report-3a8ba5b6
id: REPORT-3021
type: report
title: 'Reconciliation Review: commits (BUNDLE-21)'
created_by: xgd
created_at: '2026-08-31T18:25:43.680595+00:00'
updated_at: '2026-08-31T18:25:43.680595+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: reconciliation_review
  subject_uid: bundle-78f4e2fe
  anchor_uid: bundle-78f4e2fe
---

# Reconciliation Review: Story Coverage

**Result**: FAIL
**Mode**: commits
**Surface**: (n/a — commits mode)
**Anchor**: bundle-78f4e2fe (BUNDLE-21 = BUG-36 + BUG-37 + BUG-38)
**Stories Reviewed**: 5

Intent fidelity, behavioural coverage and plan-item accounting all PASS, and the
two blocking evidence gaps the previous review (REPORT-3018) raised are genuinely
closed — I read both rewritten UATs and they now assert the restated criteria
rather than their inverse. The failure is a **new** Step 5b finding the previous
review did not reach: **five active acceptance criteria on `story-d5167ced` have
UATs that fail when actually executed**, including `AC-1341`, which this bundle's
plan item 4 modified.

These failures were invisible to every quality gate this bundle passed.
`report-d029d7ac` and `report-b60405b1` both read `Scoped quality: pass (0 tests,
0 failed)` with `suites: {}`; no test executed in either run, so a UAT asserting
something the code stopped doing could not have been caught. I ran them.

## Behavior Inventory

7 behaviours identified across the five free-coded commits (`ea48502d`,
`2058a164`, `0fe586d1`, `999579b3`, `63df97c9`), read independently from
`apps/control-app/src/store.ts`, `apps/control-app/src/router.ts`,
`apps/control-app/wrangler.toml`, `tools/generate/src/store/d1r2-store.ts`,
`tools/generate/src/cli/push.ts`, `.../cli/index.ts`, `.../cli/ai/host-core.ts`,
`bin/publish`, `bin/access-token`.

All seven are confirmed present in the tree as the tickets describe:
`storeFor` registers on `err.reason !== 'unknown'` and retries once
(`store.ts:87-95`); `storeForImport` / `deps.importStore` return no grep hits
anywhere; `UnknownTenantError.reason` is a typed `'unknown' | 'inactive'`
(`d1r2-store.ts:104`); the `ASSEMBLED` memo is keyed `(tenantId, slug)`, replaced
on version change, dropped in `forget` and on a missing row
(`d1r2-store.ts:185, 405, 803-825`); `[observability]` is declared twice with
`head_sampling_rate = 1`, the production table placed after `routes`
(`wrangler.toml:35, 148`); `pushSite` sends the client-id/secret pair with
`redirect: 'manual'` and the assertion header is gone (`push.ts:139-152`);
`slugForSession` resolves via `deps.store.hasDraft` with no `minted` map
(`host-core.ts:292-297`).

## Coverage Map

| # | Behavior | Coverage | Story | Notes |
|---|----------|----------|-------|-------|
| 1 | `storeFor` registers the configured account on the cold path; the second opener is deleted | Covered | story-e674c60a | AC-1449, AC-1402 |
| 2 | `UnknownTenantError` carries `reason: 'unknown' \| 'inactive'` | Covered | story-fde7370b | AC-1387. Evidence gap #2 from REPORT-3018 is **closed** — the UAT now asserts both `reason` values as typed values and drives a caller branching on them |
| 3 | Assembled-draft memo, live-version invalidation, bounded and never misattributed | Covered | story-fde7370b | AC-1447, AC-1448 |
| 4 | Unsampled invocation-log retention, both environments, placed after `routes` | Covered | story-d5167ced | AC-1454, AC-1455 — **executed, 2 passed** |
| 5 | Push presents the service-token pair; partial credential and sign-in bounce read as refusals; provisioning persists no secret | Covered | story-182e8cb9 | AC-1450–AC-1453, AC-1376. Evidence gap #4 is **closed** — AC-1453 now drives `bin/access-token` against a local stub and asserts the requests made, not regexes over its source |
| 6 | Session id resolves against account-scoped storage; a turn runs on a process that never opened it | Covered | story-a58a0974 | AC-1055, AC-1456. Evidence gap #1 is **closed** — the UAT no longer asserts the pre-BUG-38 404 |
| 7 | `package.json` 0.2.12 → 0.2.13 | Covered (no behaviour) | — | Correctly generated no story |

## Ungrounded Stories

None. Every story claim traces to a ticket body or to code I read.

## Intent Fidelity

PASS. Both deliberate reversals are **flagged, not absorbed**:

- `AC-965`'s own body says so in as many words — *"A third case used to be
  asserted here and is deliberately no longer... refusing it was the outage
  rather than the diagnosis of one."*
- `AC-1055` is restated to require the derivable identifier to resolve, with the
  reason stated (*"it is the only thing a client carries between opening a
  conversation and speaking in it"*).

Both deliberate non-changes the operator declared are recorded rather than
reconciled: the dead `PREVIEWS` WeakMap and BUG-37's confirmed CPU-ceiling root
cause under `story-fde7370b` → `## Reconciliation Decisions`; `NODE_USE_ENV_PROXY`
and the live-edge admission under `story-182e8cb9` → same section. Intent-silent
formalizations are recorded there as decisions, not left as unattributed claims.

## Evidence Gaps (Step 5b) — these are the failure

All five are in `tests/reconciliation-platform-build-deploy-smoke.test.ts` on
`story-d5167ced`, and all five are real assertion failures, not environment
artifacts — none touches the network, a socket, or a built artifact. Run:
`npm test -- tests/reconciliation-platform-build-deploy-smoke.test.ts`
→ `Tests  6 failed | 7 passed (13)`.

### 1. AC-1341 — the criterion states an exception the check does not implement (BLOCKING; in-bundle)

`test_UAT_AC1341_named_environments_repeat_top_level_vars_and_bindings_found_structurally`
(line 1158) fails:

```
AssertionError: apps/control-app/wrangler.toml: [env.production] does not repeat
ACCESS_DEV_OPEN — a named environment inherits nothing, so the deployed Worker
would see none of them: expected [ 'ACCESS_DEV_OPEN' ] to deeply equal []
```

AC-1341's Criterion carries an explicit carve-out: *"The rule carries exactly one
stated exception... A variable whose purpose is to relax a security control for
local development is not required to be repeated: its absence from the named
environment is precisely what keeps the relaxation out of a deployed Worker."*
Its Verification requires that exception be demonstrated (*"Confirm the exception
is exactly one variable wide"*).

`missingFromEnv` in `tests/support/wrangler-toml.ts` implements no such
exception — `grep -rn ACCESS_DEV_OPEN tests/ bin/ tools/` returns nothing outside
`wrangler.toml` itself. So the check reports the one variable the criterion
exempts, and the criterion's exception clause has no covering assertion at all.

This is in scope: plan item 4 modified AC-1341 (the inheritable-keys paragraph,
`15a8f926d6`). The exception clause predates it (`7773267b57`, 05:11 today), so
the mismatch was inherited rather than introduced here — but it is an active
criterion on a story this bundle rewrote, and the bundle's own restatement made
the rule broader without reconciling it against the deliberate omission that
`wrangler.toml:156` documents as a security control.

**Remediation**: implement the one-variable exception in `missingFromEnv` (it is
the check AC-1341 describes), and extend the UAT to assert both halves the
Verification names — the exempt variable reports nothing missing, and any other
top-level variable removed from the named environment is still reported by name.

### 2. AC-1336 / AC-1337 / AC-1338 — three UATs pinned to a nine-check smoke script that now has eleven (BLOCKING)

The smoke script grew `control_app_challenges_unauthenticated` and
`control_app_workers_dev_closed` (AC-1425, added 12:12 today). None of the three
UATs that enumerate its checks was brought with it:

- `test_UAT_AC1336_all_nine_checks_pass_with_nothing_skipped_and_the_command_exits_zero`
  (line 864) — `expected ... not to contain 'skip  '`; the run ends
  `9 passed, 2 skipped` because the harness passes neither `--control-origin`
  nor `--workers-dev-origin`.
- `test_UAT_AC1337_each_breakage_fails_naming_the_check_and_what_it_expected` —
  `expected [ 'apex_resolves', …(10) ] to deeply equal [ 'apex_resolves', …(8) ]`.
- `test_UAT_AC1338_missing_inputs_are_reported_skipped_with_the_reason_and_counted` —
  `expected ... to contain '2 passed, 7 skipped.'`.

AC-1336's own subject is *"every applicable smoke check passes, and any skip is
named rather than forbidden"*, which the UAT's `not.toContain('skip  ')`
contradicts outright. As it stands, none of these three criteria has passing
evidence, and AC-1425's two new checks are unasserted by the criteria that
enumerate the check set.

**Remediation**: update the three UATs to the current check set — supply the two
origins where the criterion says every applicable check passes, and correct the
expected names and skip counts. AC-1336's assertion should assert what the
criterion says (skips are *named*), not that none occurs.

### 3. AC-1342 — the UAT expects wording the secret-hooks document no longer carries (BLOCKING)

`test_UAT_AC1342_no_credential_shape_is_committed_and_the_documented_push_echoes_only_the_name`
fails: `expected '# Secret hooks\n\n`bin/deploy` runs e…' to contain 'would push
ANTHROPIC_API_KEY to $DEPL…'`.

The criterion's claim (no credential shape is committed; the documented push
echoes only the name) may well still hold — but nothing currently proves it, and
a documentation-string assertion is the weakest part of it regardless.

**Remediation**: re-point the assertion at the document as it now reads, or
assert the echo behaviour by running the documented push with a stub `wrangler`
and observing what is echoed, which is what the criterion is actually about.

### Secondary — not blocking, recorded for the fixer

**AC-1055's streaming-origin refusal shape has no assertion.** The criterion and
its Verification both require the refusal on *two* origin shapes — *"as a plain
structured not-found answer... on the origin that answers turns with a status
code, **and as the origin's own message ahead of the completion on the origin
that always streams**"*. `test_UAT_AC1055_...` covers only the first;
`router.ts:669-676` (the workerd streaming refusal) is asserted by no AC-1055
UAT, and `test_UAT_AC1456` asserts only that origin's *positive* path.

Judged non-blocking: the resolution decision — the entire subject of BUG-38 and
of AC-1055's restatement — is proven end-to-end against a real origin and real
storage across six refusal shapes, the account-scoped case and the positive case;
the unasserted slice is how the *same* refusal is rendered on a second transport
this bundle did not touch. Worth closing when AC-1055 is next visited.

### Excluded as an environment artifact, not a defect

`test_UAT_AC1331_build_bundles_every_discovered_worker_against_production_after_preflight`
also fails, with `@lagrangefoundry/webui-shell is not installed`. That is the
known worktree-location artifact (`@lagrangefoundry/*` resolves only from the
main checkout), not a code or evidence problem. **Not** counted as a gap.

## What I could and could not execute

Stated plainly, because it bounds this verdict. This sandbox denies socket
binding (`listen EPERM`) and the wrangler log path, so **no `.workers.test.ts`
file and no test that starts an HTTP origin could be run here**. That covers the
UATs for AC-1387, AC-1447, AC-1448, AC-1449, AC-965, AC-1402, AC-1055, AC-1456,
AC-1450–AC-1453. For those I verified sufficiency by reading each UAT against the
criterion and against the landed code paths, and each holds:

- **AC-1055** — the rewritten UAT asserts 404 + `application/json` (never
  `event-stream`) for six refusal shapes, the account-scoped refusal via a second
  `startBuilder` workspace, `client.seen` empty, no `sessionsDir`, both headlines
  unchanged; then 200 + `text/event-stream` for `site-${SLUG}` submitted without
  opening, with `open(base, SLUG).sessionId` pinned to the same string. Matches
  `builder.ts:268-269` (`UnknownSessionError` → 404 JSON, only while `!started`).
  The only mock is the model client — an external boundary.
- **AC-1387** — asserts `reason === 'unknown'` / `'inactive'` as typed values,
  *and* drives a local bootstrap written the way `store.ts` writes it, so
  deleting the field breaks the test instead of leaving it green. Gap #2 closed.
- **AC-965** — the new workers UAT asserts both bodies name their own subject and
  neither carries the other's, both non-blank, both non-`ok`, the account still
  `suspended` afterwards, and the identical failure from `/preview/<slug>/draft/`
  (matched last in the table). Every clause of the criterion has an assertion.
- **AC-1453** — now six runs of the real `bin/access-token` against a local stub
  management API, asserting the requests made (account disambiguation, match by
  domain against a decoy carrying the recognisable display name, the Service Auth
  policy shape, the operator's own rule left alone, refusal inside a
  `200 {success:false}` envelope), with "persists no secret" a filesystem
  observation. The regexes the previous review objected to are gone. Gap #4 closed.

Executed and passing: `reconciliation-platform-invocation-log-retention.test.ts`
(2/2 — AC-1454, AC-1455) and `reconciliation-builder-private-access-gate.test.ts`
(10/10 — includes AC-1376).

## Plan Item Accounting

| Plan Item | Expected Story | Status |
|-----------|---------------|--------|
| 1. Cloud Site Store (D1 + R2 adapter) | story-fde7370b | ✓ AC-1447, AC-1448 added; AC-1387 modified |
| 2. Builder Workspace Origin — deployment bootstrap | story-e674c60a | ✓ AC-1449 added; AC-965, AC-1402 modified |
| 3. Operator Access Gate — automation credential | story-182e8cb9 | ✓ AC-1450, AC-1451, AC-1452, AC-1453 added; AC-1376 modified |
| 4. Platform Deploy Configuration — invocation logs | story-d5167ced | ✓ AC-1454, AC-1455 added; AC-1341 modified |
| 5. AI Site Assistant — session resolution | story-a58a0974 | ✓ AC-1456 added; AC-1055 modified |

No plan item was dropped.

## Judgment Calls

- **AC-1331 excluded.** Its failure is `@lagrangefoundry/webui-shell is not
  installed` — a property of running in a worktree rather than the main checkout.
  Failing a reconciliation on that would send the fix loop after an environment.
- **AC-1336/1337/1338/1342 included despite predating this bundle.** Step 5b is
  scoped to *every active criterion on every story reviewed*, and `story-d5167ced`
  is under review. They are also the same class of defect as AC-1341 and sit in
  the same file, so one fix pass closes all five. Marked as inherited drift so the
  fixer does not hunt for a BUNDLE-21 commit that caused them.
- **`bin/access-token` gaining a `CLOUDFLARE_API_BASE` seam is accepted.**
  Reconciliation forbids runtime code change, and this is a one-line production
  edit — but it is a test seam that is inert unset, it was the stronger of the two
  remedies the previous review offered, and it is recorded as a Reconciliation
  Decision on `story-182e8cb9` rather than left implicit. Disclosed, not silent.
- **AC-1447/AC-1448 asserting object identity rather than timing is right.**
  `assembleSite` builds a fresh object per call, so identity is the only
  observation at the store boundary that distinguishes reuse from re-validation;
  a timing assertion would be flaky by construction.
- **The version bump generating no story is correct.** A story there would
  document bookkeeping.
- **The five `test_UAT_FC_BUG-3x_*` files still on disk are not this review's
  gate.** They pass and duplicate the reconciled `reconciliation-*` coverage;
  `check_fc_orphans` owns them.

## Verdict

FAIL — Step 5b only.

The stories themselves are accurate, complete and faithful. A developer reading
them would have a correct picture of what the operator intended to build,
including both deliberate reversals, both deliberate non-changes, and the
intent-silent properties recorded as decisions. Intent fidelity, behavioural
coverage and plan-item accounting all pass, and the two blocking evidence gaps
from REPORT-3018 are closed on inspection.

Five active criteria on `story-d5167ced` do not have passing evidence:

1. **AC-1341** — `missingFromEnv` (`tests/support/wrangler-toml.ts`) implements
   none of the one-variable exception the criterion states, so the UAT reports
   `ACCESS_DEV_OPEN` missing and fails; the exception clause itself is unasserted.
   In scope: plan item 4 modified this criterion.
2. **AC-1336**, 3. **AC-1337**, 4. **AC-1338** — all three enumerate a nine-check
   smoke script that now has eleven checks (AC-1425 added two), and fail on skip
   counts and check names. AC-1336's `not.toContain('skip  ')` contradicts its own
   criterion, which requires skips to be *named*, not absent.
5. **AC-1342** — asserts wording the secret-hooks document no longer carries.

All five are in `tests/reconciliation-platform-build-deploy-smoke.test.ts` and are
real assertion failures, reproduced here with
`npm test -- tests/reconciliation-platform-build-deploy-smoke.test.ts`.

A warning for the fix loop: **do not treat a green quality report from this
worktree as evidence these are resolved.** `report-b60405b1` reads
`pass (0 tests, 0 failed)` with `suites: {}` — no test executed, which is exactly
how five failing UATs reached this point unnoticed. Run the file.
