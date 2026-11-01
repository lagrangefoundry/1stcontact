---
uid: report-9bd63cfc
id: REPORT-7685
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-36'
created_by: xgd
created_at: '2026-11-01T15:10:07.883834+00:00'
updated_at: '2026-11-01T15:10:07.883834+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-36
---

## Files resolved

- `apps/control-app/src/index.ts` — code file (2c). Conflict hunk was the `./scope` import line only. Kept HEAD's `import { NoBusinessError, resolveScope, ScopeRefusedError, splitBusinessPrefix }`. The incoming side's version of that line is unchanged base context (the incoming commit did not touch it); HEAD added `NoBusinessError` later (REQ-178/DOC-42 §10.1) and uses it at the `catch` (`err instanceof NoBusinessError`), so dropping it would break compilation. Non-overlapping combine.
- `package.json` — config scalar (2g). Incoming bumped 0.2.61 -> 0.2.62; HEAD is already at 0.2.69 (later bumps). Kept 0.2.69, since taking incoming would move the version backwards. Flag for post-merge review per enrichment rule.
- `tests/support/local-d1.ts` — code/test support (2c). Conflict hunk was the memberships/entitlements INSERTs. The incoming commit did not modify those lines (they are base context using `account_id`/`${accountId}`); HEAD renamed them to `business_id`/`${businessId}` (REQ-184) and `accountId` no longer exists in the function. Kept HEAD's lines. Non-overlapping combine.

## Incoming changes preserved

Verified against `git show d98ba71d82 --first-parent`:
- index.ts: `import { guardTerms } from './terms'` present; REQ-169 "AND A FOURTH" doc block present; `guardTerms(request, env, admission)` call inside the gated block present.
- local-d1.ts: `import { TERMS_VERSION } ...` present; REQ-169 doc comment additions present; `UPDATE users SET tos_version = '${TERMS_VERSION}' ...` statement present.
- package.json: incoming version bump is superseded by HEAD's later 0.2.69; no other incoming change.

All of REQ-169's substantive changes were already integrated into HEAD, so the staged result has no diff vs HEAD for these files (redundant commit, not discarded content; see STEP 4).
