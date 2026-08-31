---
uid: report-bb07edee
id: REPORT-3022
type: report
title: 'Fix reconciliation review: bundle-78f4e2fe'
created_by: xgd
created_at: '2026-08-31T18:34:46.014663+00:00'
updated_at: '2026-08-31T18:34:46.014663+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_reconciliation_review
  subject_uid: bundle-78f4e2fe
  needs_more_work: false
  progress_made: true
---

## Stories created

None. Every finding in REPORT-3021 was a Step 5b evidence gap — an active
criterion whose UAT failed when executed — not an uncovered behaviour. The
review's own verdict says so: intent fidelity, behavioural coverage and plan-item
accounting all PASS, and "the stories themselves are accurate, complete and
faithful."

## Stories modified

None. No criterion was restated: in every one of the five cases the criterion was
already right and the evidence had drifted away from it.

Two places where that mattered, recorded so a re-review can see the choice:

- **AC-1336.** The review's remediation offered "supply the two origins where the
  criterion says every applicable check passes". The criterion as it now reads
  says the opposite — "A passing run is **not** required to have skipped
  nothing… What the run must do is **name** what it skipped" — and its
  Verification asks for exactly two named skips. The UAT was written to the
  criterion, which is also what the review's closing note asks for ("AC-1336's
  assertion should assert what the criterion says (skips are *named*), not that
  none occurs").
- **AC-1341.** The exception clause was implemented in the check, as the review
  directed, rather than struck from the criterion.

## Stories deleted

None.

## FC orphans renamed/deleted

None — and none were due. No `fc_orphan_check` report exists for this anchor
(`xgd ticket list --type report --filter fields.report_kind=fc_orphan_check
--filter fields.anchor_uid=bundle-78f4e2fe` returns an empty set), so this call
was triggered by the matrix review alone and category 3 does not apply.

## Code changes

### `tests/support/wrangler-toml.ts` — AC-1341's stated exception, implemented

`missingFromEnv` implemented none of the one-variable exception AC-1341 states,
so it reported the one variable the criterion exempts. Added `DEV_ONLY_VAR =
'ACCESS_DEV_OPEN'` — exported, so the UAT asserts the exception by name rather
than by re-deriving it — and excluded exactly that name from the variables half.

Deliberately a named constant rather than a predicate over the name: the
criterion says "identified by name and one variable only", so widening it has to
be an edit somebody makes on purpose. The bindings half is untouched.

Checked against the other two callers — `test_UAT_FC_REQ-144_deploy_scripts.ts`
(which had been filtering the same variable out locally, now redundant but still
correct) and `reconciliation-platform-invocation-log-retention.test.ts` (which
asks only "nothing of ours is in here"). Both still pass.

### `tests/reconciliation-platform-build-deploy-smoke.test.ts`

**AC-1341** — added the two halves the Verification names and neither UAT
asserted: with the relaxation variable at the top level and absent from the named
environment the check reports nothing missing; with a second top-level variable
also dropped, the check still names that one, and only that one. Also added the
Verification's third paragraph, which no UAT covered: `workers_dev` and the
`[observability]` retention keys are repeated under `[env.production]` and stay
invisible to the sets this check enumerates.

Also repaired a **latent** failure this fix exposed. The UAT asserted the control
app's production environment carries `BUILDER_ORIGIN`; that variable no longer
exists anywhere in the tree. It was never reached before because the
`ACCESS_DEV_OPEN` assertion above it failed first. The criterion names the class,
not the variable ("the configuration its deployed form needs"), so the assertion
now names what control-app actually needs: `TENANT_ID` — whose absence reproduces
precisely the service-unavailable-to-every-request failure the criterion is named
for — and the two Access identifiers. The synthetic `shipped` fixture still uses
`BUILDER_ORIGIN`, correctly: that is the historical configuration the check must
catch, not a claim about the current tree.

**AC-1336 / AC-1337 / AC-1338** — `NINE_CHECKS` was a single list pinning a smoke
script that now runs eleven checks. Replaced with `PUBLIC_CHECKS` (the nine
public-serving checks) and `CONTROL_CHECKS` (the two control-surface checks
AC-1425 added, on their own axis with their own options), composed into
`ALL_CHECKS`. The split is the distinction AC-1336 is about, so it is named in the
harness rather than left as an off-by-two.

- AC-1336: renamed to
  `test_UAT_AC1336_every_applicable_check_passes_and_each_skip_is_named_with_a_zero_exit`.
  The `not.toContain('skip  ')` that contradicted its own criterion is gone;
  it now asserts each control-surface check is named as skipped and not
  counted as a pass, that the number of skip lines is exactly two (so a skip
  creeping into the applicable set cannot pass by being counted rather than
  named), and the summary reads `9 passed, 2 skipped`.
- AC-1337: the full-report assertion now expects `ALL_CHECKS`, with the
  control-surface pair reporting a skip — which the criterion's "the other
  checks still report pass or skip" already allows.
- AC-1338: skip counts corrected to `2 passed, 9 skipped` and
  `4 passed, 7 skipped`, and the control-surface skips are asserted to name
  *their own* missing option rather than `--slug`, which is the criterion's
  actual claim (the reason names the input that was missing).

**AC-1342** — the UAT asserted two sentences the secret-hooks document no longer
carries. Rather than re-point the assertion at the new prose — the weakest
possible evidence for a behavioural claim, and the reason this failed at all —
the echo behaviour is now *observed*. Added `runSecretHook`, which runs the real
`bin/deploy.d/secrets/10-anthropic-api-key` (the worked example the document
points at) with `npx` (wrangler) replaced by a recorder — the external boundary,
and the only thing stubbed. Both paths the criterion names are driven:

- the real path pushes, echoes `pushed ANTHROPIC_API_KEY to prod-control-app`,
  never echoes the value, composes a command line carrying only the name and the
  environment (never the value, so nothing reaches `ps` or shell history), and
  the value arrives on standard input with **no trailing newline** — captured raw
  to a file precisely because a shell substitution would strip the thing under
  test;
- the rehearsal reports `would push …`, echoes no value, and uploads nothing.

The doc assertions that still hold (piped, newline-free, names-only listing, no
argument form) are kept.

### `tests/reconciliation-assistant-conversation-continuity.workers.test.ts`

Closed the review's **secondary** finding as well, since it turned out to be
executable here. AC-1055 requires its refusal on two origin shapes; only the
status-code origin was asserted, and `router.ts:669-676` — the workerd streaming
refusal — was covered by no AC-1055 UAT. Added
`test_UAT_AC1055_the_streaming_origin_refuses_in_channel_ahead_of_the_completion`
in workerd against real D1 and R2: for each of the four unresolvable identifier
shapes the criterion enumerates, the origin stays 200 + `text/event-stream`,
carries the origin's own message, carries nothing of the assistant's (the model
double is armed and records zero requests, so the refusal genuinely arrived ahead
of anything streamed), ends with exactly one completion frame in last position,
and adds no transcript object. Asserted as a delta against a pre-refusal listing
rather than as an empty prefix: the bucket is shared with the criterion above,
whose conversation legitimately leaves a transcript, and the claim is about what
a refusal *adds*.

## Verification actually run

Not asserted from a quality report — the review's explicit warning is that
`report-b60405b1` read `pass (0 tests, 0 failed)` with `suites: {}`, which is how
five failing UATs reached it unnoticed. The files were run:

- `npm test -- tests/reconciliation-platform-build-deploy-smoke.test.ts`
  → **12 passed, 1 failed**. All five blocking findings are green. The single
  failure is `test_UAT_AC1331_…`, failing with `@lagrangefoundry/webui-shell is
  not installed` — the worktree-location artifact the review itself excluded
  ("Failing a reconciliation on that would send the fix loop after an
  environment"). Not caused by, and not touched by, this fix.
- `npm test -- tests/reconciliation-platform-invocation-log-retention.test.ts
  tests/test_UAT_FC_REQ-144_deploy_scripts.test.ts` → **20 passed** (the other
  two `missingFromEnv` callers).
- `npm test -- tests/reconciliation-assistant-conversation-continuity.workers.test.ts`
  → **2 passed** (AC-1456 and the new AC-1055 half).
- `npm test -- tests/reconciliation-platform-build-order-and-private-surface.test.ts
  tests/test_UAT_FC_REQ-145_build_artifacts.test.ts
  tests/reconciliation-workspace-build-artifacts.test.ts` → **11 passed, 1
  failed**, the failure being the same webui-shell worktree artifact
  (`/webui/webui-shell/src/index.js` → 404), pre-existing and in a file this fix
  does not touch.

## Confidence

High for the five blocking findings: each was reproduced failing, fixed, and
re-run passing, and the criteria were read in full rather than taken from the
review's summary of them. The secondary AC-1055 finding is closed too, so nothing
the review recorded is left outstanding.

The one thing a re-review will still see failing in this worktree is AC-1331 (and
its sibling in `reconciliation-workspace-build-artifacts.test.ts`), which fail
only because `@lagrangefoundry/*` resolves from the main checkout and not from a
worktree. The previous review classified that correctly as an environment
artifact and excluded it; nothing in this fix can or should change it.
