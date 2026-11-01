---
uid: report-2e8eaf29
id: REPORT-7550
type: report
title: Claude batch_fix_assessment report
created_by: xgd
created_at: '2026-11-01T10:15:42.417171+00:00'
updated_at: '2026-11-01T10:15:42.417171+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: batch_fix_assessment
  subject_uid: story-7b1025b8
  parent_report_uid: report-0faeb796
  batch_index: '0'
---

All 24 failures are fixed, and production code is untouched. The three identity test files now pass 36/36, and the full scope filter (AC1740–1760, AC2075–2079, AC2112–2116) also gives 36 passed, 0 failed. I couldn't run the lint and typecheck gates: eslint isn't installed locally (the npm registry is blocked) and the `tsc` check was denied. The workers test run strips types without checking them, so the test edits have not been type-checked.

**Root cause.** Both older test files still used the vocabulary from before migration 0006: `.accountId` and the business-keyed `account_id` columns. The code returns `businessId`, so every lookup bound `undefined`, which is where the `D1_TYPE_ERROR` came from.

**Test changes:**
- **Rename (both files):** `accountId` → `businessId` and the business-keyed `account_id` → `business_id` in every query, assertion and helper. That includes AC1746's direct grant inserts, so it now uses the per-business grant model.
- **No singular field on an admission (AC1748, both files):** the keys must be exactly `businesses`, `ok`, `user`, and `accountId`, `businessId` and `entitlement` are each rejected explicitly.
- **AC1750:** removed from both files. AC-1750 is already marked superseded, and the AC2112 test in the business-lapse file carries its both-sides expiry check.
- **AC1751 / AC1752 (both files):** these asserted that the person is refused with `no_entitlement`. The code now admits them, with the business listed, unselectable, no grant, and lapse `not_yet` or `revoked`. I renamed the invite-file slugs to match, keeping the AC prefix.
- **AC1749:** the refused visit is now caused by suspending the person, because an expired grant no longer refuses.
- **AC1758:** the byte-identical, 403, no-store/noindex refusal is now checked for a stranger, a withdrawn member and a suspended person.
- **AC1759:** the four door refusals are checked through `admit`. The fifth reason, `no_entitlement`, is now checked through the request log: it appears when an admitted person who has accepted terms, but whose grant has lapsed, requests `/api/sites`. All five structured log records are asserted with their address.
- **Older AC1760:** removed from the invite file because it predates the terms check. The terms-aware AC1760 test still passes.

**AC updates** (each with its own `xgd ticket update` commit message): AC-1751 and AC-1752 now say the person is admitted with the business unselectable, plus its lapse reason. AC-1758 changes which callers must get the identical refusal. AC-1759 says where `no_entitlement` is recorded. AC-1749's verification now suspends the person. The story body already described this behaviour, so it needed no change.

```yaml
## Assessment
blocked_by: null
status: fixed
evidence: "npx vitest run --config vitest.workers.config.mts on the three identity files → 36 passed; npx vitest run -t <scope tokens> → 3 files, 36 passed, 0 failed. Lint and typecheck not run (eslint not installed, registry blocked; tsc check denied)."
```
