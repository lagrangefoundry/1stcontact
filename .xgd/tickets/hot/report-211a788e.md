---
uid: report-211a788e
id: REPORT-7621
type: report
title: 'Code Review: bundle-94dbe947'
created_by: xgd
created_at: '2026-11-01T13:58:20.137673+00:00'
updated_at: '2026-11-01T13:58:20.137673+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: code_review
  subject_uid: bundle-94dbe947
  anchor_uid: bundle-94dbe947
  overrides_audited: 1
  trust_boundary_overrides: 0
---

# Code Review

**Result**: PASS

## Summary
The reconcile fix batch (ae92b98e90 + cc8f6762cb) replaces throwing D1 stand-ins with a real local D1 (via a new `localD1()` helper over `getPlatformProxy`, sharing the migrated/seeded database), re-points AC-1400's no-account probe at a configured TENANT_ID with no tenants row, makes AC-975 fail loudly when no browser launches, drops the withdrawn AC-967 failing-listing assertion, and rewords one JSDoc under a granted code_frozen override. The only runtime-tree change is that comment. Fixture changes match the fix plan and keep R2 unreachable so 'site store stayed shut' remains a falsifiable claim.

1 overrides audited, 0 touched a trust boundary.

## Quality Gates
- Scoped quality report-42e66a09 (commit 1c0aa9f3ff): lint 0/0, build success, 283 passed / 0 failed / 0 skipped. Includes test_UAT_AC960_*, AC964_* (x3), AC967_* (x2), AC975_displayed_site_fills_the_window..., AC1400_client_components_and_bridges... . `git diff 1c0aa9f3ff HEAD -- tests tools apps packages` is empty, so that run is against the exact code under review.
- The later standalone runs report-8d7d6636 / report-fe02f9bb show `javascript-vitest` executed 0 tests (exit 1, flagged INFRASTRUCTURE BUG) — a harness/run failure, not a test failure; no code changed between the passing run and HEAD. Recorded as a warning.
- Coverage: not reported by the JS suite (null); no threshold violation recorded.

## External Interface Accessibility
No new product entry points. `localD1` (tests/support/local-d1.ts:119) is exported and consumed by both reconciliation-builder-workspace-origin.test.ts and reconciliation-workspace-build-artifacts.test.ts. Nothing dead.

## Code Quality
| File | Finding | Severity |
|------|---------|----------|
| tests/support/local-d1.ts:128 | `mkdtempSync` registry dir for WRANGLER_REGISTRY_PATH is never removed after `dispose()`; leaks one empty temp dir per suite run | Minor |
| tests/support/local-d1.ts:119-143 | Reuses the existing migrated/seeded DB (same wrangler.toml + `.wrangler/state/v3` persist path) rather than a second schema or stub — consistent with the helper's stated principle; `remoteBindings: false` keeps tests off Cloudflare | Good |
| tests/reconciliation-workspace-build-artifacts.test.ts:234-244 | AC-1400 no-account probe now asserts precondition (no `tenants` row for NO_ACCOUNT_TENANT) and postcondition (still none) — stronger than the old empty-TENANT_ID probe; matches identity.ts:850 semantics (TENANT_ID is the platform tenant, tenants rows are keyed by business id) | Good |
| tests/reconciliation-builder-workspace-origin.test.ts:986-1001, 1076-1096 | Warn-and-return replaced with throw carrying per-attempt launch errors; `waitUntil: 'load'` + waitForSelector on the measured frame instead of networkidle — removes a sandbox-dependent hang without weakening the measurement | Good |
| tests/reconciliation-builder-business-scope.test.ts:693-694 | Withdrawn assertion removed cleanly (no orphaned `failNext`); comment cites the fix plan; remaining AC-967 assertions intact | OK |

No debug code, commented-out blocks or TODO stubs introduced. Per-suite unique emails avoid cross-suite tenant collisions in the shared persisted DB.

## Checklist Compliance
No architecture/security/design checklist reports were consulted as applicable to this test-only batch beyond the security policy invariant: no site-definition/render code changed.

## Mode Override Audit
report-012b2e49 (code_frozen, rung 2, story-e674c60a):
1. Scope: runtime change confined to the named file tools/generate/src/cli/ai/ledger-core.ts, lines 17-18 — matches tip_evidence exactly. PASS
2. Nature: comment-only JSDoc reword; no code token changed; reworded to the reference wording given in the ruling. PASS
3. Justification: AC-960 forbids the scope literal outside its declaration; `grep @lagrangefoundry/ai-ticketing ledger-core.ts` now returns nothing and test_UAT_AC960_component_scope_is_written_in_exactly_one_place passed. PASS
4. Denied request honoured: apps/control-app/src/builder/app.js is untouched by any reconcile commit (only runtime-tree commit since 6e10a8578b is ae92b98e90, which touches only ledger-core.ts). AC-967 rewritten in place with a fix_plan note; story-e674c60a carries the clause (c) correction. PASS
5. Trust boundary: none touched (trust_boundary_touched=false; a JSDoc in the AI ledger surface is not a boundary). PASS

## Smoke Test
N/A — no user-facing entry point added or modified (test fixtures + one comment).

## Issues Found
**Critical (must fix)**:
- None

**Warnings (should fix)**:
- The two most recent standalone quality runs (report-8d7d6636, report-fe02f9bb) executed 0 tests — an infrastructure failure of the run, not of this code. The scoped 283/283 pass at byte-identical code is the evidence relied on.
- tests/support/local-d1.ts: remove the WRANGLER_REGISTRY_PATH temp dir in `dispose()`.
