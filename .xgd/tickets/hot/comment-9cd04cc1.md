---
uid: comment-9cd04cc1
id: COMMENT-2471
type: comment
title: Claude response for fix_structural_validation report
created_by: xgd
created_at: '2026-09-10T05:35:13.225655+00:00'
updated_at: '2026-09-10T05:35:13.225655+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-e00dae9b
  kind: note
---

Done. All three findings from REPORT-31027fde addressed; the capability's UAT level is now 18/18 passing.

**Finding 1 (the violation) — AC-1331's failing UAT.** Reproduced first (exit 1 at `==> Control-app assets`, `@lagrangefoundry/webui-shell is not installed`), then repaired the leg rather than the script. The single over-asserting "skip" leg became two:

- *Incomplete environment* (keeps the hidden component): asserts the preflight header is absent, the preflight refusal is gone, the exit code is **not** `EXIT_CODES.ENVIRONMENT`, and a later stage was entered. No exit-0 assertion, with a comment explaining that asserting it would claim a deliberately incomplete tree builds clean — which AC-1331 does not claim.
- *Real tree*: `bin/build --skip-preflight` with no crippling — no preflight header, exit 0, one `pnpm|`, one `npx|` bundle per discovered app, `Build complete.` That is the criterion's "remaining stages run normally."

`bin/build` is untouched, and nothing was skipped or deleted — both repairs the assessor warned off.

**Finding 2.** The stale header docblock in `tests/reconciliation-platform-build-order-and-private-surface.test.ts:15-20` now restates AC-1426 as the criterion does (names the *module*, prints no chain, chain is the property's own instrument). `grep` for the misattribution across `tests/ bin/ tools/ apps/ packages/` returns nothing.

**Finding 3.** Did the half that's safe under either retirement policy: hoisted the duplicated instrument (module list + `withoutComments`/`resolveSpec`/`typeProgramOf`/`chainTo`) into `tests/support/type-program.ts`, and pointed both the AC-1426 UAT and the free-coded REQ-149 file at it — 86 duplicated lines removed from each. One definition site, nothing deleted. The deletion-policy question is forwarded as needs_review.

Verification (run, not inferred):

| File | Result |
|---|---|
| `reconciliation-platform-build-deploy-smoke.test.ts` | 13 passed (was 12 passed / 1 failed) |
| `reconciliation-platform-build-order-and-private-surface.test.ts` | 3 passed |
| `reconciliation-platform-invocation-log-retention.test.ts` | 2 passed |

AC-1331's `uat_coverage` set to `pass` (that one AC only — the one whose test I ran). Completion report: **REPORT-3672** (`report-e00dae9b`), `fixes_applied: 7, progress_made: true, needs_more_work: false, violations_remaining: 0`.
