---
uid: report-e00dae9b
id: REPORT-3672
type: report
title: Fix Platform Build, Deploy & Live-Origin Verification (uat) — attempt 2
created_by: xgd
created_at: '2026-09-10T05:34:52.127227+00:00'
updated_at: '2026-09-10T05:34:52.127227+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-5d07b533
  level: uat
  fixes_applied: 7
  progress_made: true
  needs_more_work: false
  violations_remaining: 0
  anchor_report_uid: report-e37a6b4a
---

# Fix Summary — Platform Build, Deploy & Live-Origin Verification (uat)

**Attempt**: 2
**Fixes applied this call**: 7
**Violations remaining**: 0
**Needs more work**: false

All three findings from REPORT-31027fde were `uat-edit`. None required a ticket
body edit, and no production code was touched. **18/18 active ACs now have a
passing UAT** (was 17/18), verified by running all three files this call.

| File | Before | After |
|---|---|---|
| `tests/reconciliation-platform-build-deploy-smoke.test.ts` | 12 passed, 1 failed | **13 passed** |
| `tests/reconciliation-platform-build-order-and-private-surface.test.ts` | 3 passed | 3 passed |
| `tests/reconciliation-platform-invocation-log-retention.test.ts` | 2 passed | 2 passed |

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| 1 | uat-edit | AC-1331 / `...build-deploy-smoke.test.ts:640-691` | **Finding 1 (the violation) repaired.** Replaced the single over-asserting skip leg with two, per the assessor's option (a)+(b) combined — see below. |
| 2 | uat-edit | AC-1331 (acceptance_criterion-ae2bb537) | Set `uat_coverage: pass` — the criterion now has passing evidence. (Single AC, the one whose test I ran; not a bulk set.) |
| 3 | uat-edit | `...build-order-and-private-surface.test.ts:15-20` | **Finding 2 repaired.** Header docblock restates AC-1426 as the criterion now does: the build names the **module** it cannot type, prints no chain, nothing in the repo composes one, and the chain is the property's own instrument whose non-vacuity is asserted. |
| 4 | uat-edit | new `tests/support/type-program.ts` | **Finding 3, policy-independent half.** Hoisted the duplicated instrument — `FILESYSTEM_BOUND` (+ `filesystemBoundIn`), `withoutComments`, `resolveSpec`, `typeProgramOf`, `chainTo` — to one definition site, as `tests/support/wrangler-toml.ts` already is for the TOML reader. Nothing deleted. |
| 5 | uat-edit | `...build-order-and-private-surface.test.ts` | Now imports the instrument from `./support/type-program`; its 86 local lines removed. Its inline non-vacuity comment re-points at the support module. |
| 6 | uat-edit | `tests/test_UAT_FC_REQ-149_worker_type_program.test.ts` | Same: imports the shared instrument, its own 86-line copy (`NODE_ONLY` + walk) removed. The two lists can no longer drift apart. |
| 7 | verification | all three matrix UAT files | Ran each: 13 + 3 + 2 = **18 passed, 0 failed**. |

## Finding 1 — what the repair asserts, and why

The assessor's diagnosis is exactly right and was reproduced before changing
anything: `npm test -- tests/reconciliation-platform-build-deploy-smoke.test.ts -t "AC1331"`
failed at the old line 653, `==> Control-app assets` / `@lagrangefoundry/webui-shell
is not installed`, exit 1. `bin/build:87-90` gates only `step "Preflight"` on
`--skip-preflight`; the `Control-app assets` stage at `bin/build:98-99` is
unconditional and needs the same component the leg was hiding.

The leg now splits, because the claim has two halves and no single tree shows both:

- **Half one — the same incomplete environment.** Keeps the hidden component.
  Asserts the preflight stage header is absent, the refusal that stopped the
  previous run is gone, the exit code is **not** `EXIT_CODES.ENVIRONMENT`, and a
  later stage (`==> Control-app assets`) was entered. It deliberately does **not**
  assert exit 0, with a comment saying why: that would assert a deliberately
  incomplete tree builds clean, which AC-1331 does not claim, and would fail on
  exactly the machines where the test's first leg passes.
- **Half two — the real tree, which can satisfy the check.** `bin/build
  --skip-preflight` with no crippling: no `==> Preflight` header, exit 0, one
  `pnpm|` invocation, one `npx|` bundle per discovered app, `Build complete.` —
  which is what "the remaining stages run normally" / "the later stages proceed"
  actually means.

Both wrong repairs the assessor warned against were avoided: `bin/build` is
untouched (no intent asks `--skip-preflight` to skip `1c assets`, and AC-1427
forbids it), and nothing is skipped or deleted.

## Code Edits (if any)

None. No file under `bin/`, `tools/`, `apps/` or `packages/` was modified. The
only non-test addition is `tests/support/type-program.ts`, which is test support.

## needs_review Items Forwarded

| Element | Assessor said | Operator decision needed |
|---|---|---|
| `test_UAT_FC_REQ-149_worker_type_program.test.ts`, `test_UAT_FC_BUG-37_observability.test.ts`, `test_UAT_FC_REQ-144_deploy_scripts.test.ts`, `test_UAT_FC_REQ-145_build_artifacts.test.ts` (finding 3, remainder) | "Confirm the project's post-reconciliation policy for free-coded UATs before deleting anything." | Are `test_UAT_FC_*` files retired once the matrix takes ownership of their scenarios, or kept as a parallel set? I did the half that is safe under either answer (one definition site for the shared instrument) and deleted nothing. If retirement is the policy, `test_UAT_FC_REQ-149_worker_type_program.test.ts` remains the safe first candidate: AC-1426's UAT covers every assertion it makes and adds the compile-fixture pair. |

Findings 4 and 5 were `info` with "none" suggested — no action, and I confirmed
finding 4's repair is still in place (the last occurrence of the import-chain
misattribution is now gone: `grep -rn "naming the import chain\|names the import
chain" tests/ bin/ tools/ apps/ packages/` returns nothing).
