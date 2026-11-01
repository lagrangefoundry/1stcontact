---
uid: report-90bf460c
id: REPORT-7507
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-35'
created_by: xgd
created_at: '2026-11-01T07:46:19.433979+00:00'
updated_at: '2026-11-01T07:46:19.433979+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-35
---

## Files resolved

- apps/control-app/src/router.ts — UU, code file (2c). Rule 3b: both sides made independent useful changes to the same lines. Three hunks, in the /api/ai/session, /api/ai/prompt and /api/ai/reattach routes. HEAD (free-REQ-180) added a `url.origin` argument to `chatHost`; incoming (free-REQ-178) replaced `scope` with `requireScope()`. I kept both: `chatHost(env, requireScope(), deps, url.origin)`.

## Incoming changes preserved

Checked against `git show a9f1021dd8 -- apps/control-app/src/router.ts`. All of the incoming changes are in the resolved file:
- the `NoBusinessError` import
- `Scope | null` on `businessesPayload`, `route` and `routeUncached`
- `businessesPayload` returning an empty list when scope is null
- the `requireScope()` helper
- `requireScope()` in the draft store, openStore, openTickets, ingestDeps and all three chatHost calls
- the `NoBusinessError` rethrow in the draft-create catch and in the table-level catch

HEAD's `url.origin` argument is kept too. `tsc --noEmit` on apps/control-app shows no errors in router.ts, index.ts or scope.ts. The only errors are in modules that import `./generated/*` files, which this sparse checkout doesn't have.
