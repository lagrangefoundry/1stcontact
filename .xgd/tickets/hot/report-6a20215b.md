---
uid: report-6a20215b
id: REPORT-5571
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-29T16:19:53.749242+00:00'
updated_at: '2026-09-29T16:19:53.749242+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `apps/control-app/src/router.ts` — UU on a code file (2c). One conflict
  region, in `businessesPayload`'s signature and its `admission?.ok` return.
  INCOMING's change in that region is the removal of the `session` parameter
  and the `session` payload field (plus its REQ-204 comment) — the commit
  message states this explicitly: the boolean "added to `/api/businesses` last
  commit is removed along with its wiring, since a field nothing reads is
  drift." OURS' change in the same region is the rename of the third parameter
  `personName` → `accountName` (REQ-193, "a name is a row now and not a
  column"), which appears as unmodified CONTEXT in incoming's diff.

  The two sides therefore do not compete: applied BOTH. Took incoming's
  deletion of `session` in full, kept HEAD's rename. No hunk dropped, no
  fallback to the enrichment's "more recent by timestamp" rule — that rule is
  for genuinely opposed intents, and these are disjoint.

## Incoming changes preserved

`git diff --cached d34bbba54d -- <paths in d34bbba's own diff>` reports a
delta for only three of the fifteen files; the other twelve
(`builder/api.js`, `builder/app.js`, `builder/business.js`, `builder/main.js`,
`sign-in.ts`, `bin/access-sim`, `package.json`, and all five test files
including the new `test_UAT_FC_REQ-204_access_sim_logout.test.ts`) are
byte-identical to incoming. Each of the three deltas is attributable to a
HEAD-side edit incoming never touched:

- `router.ts` (2+/2−) — exactly the `personName` → `accountName` rename on the
  two lines that name it. Incoming's removals are confirmed gone: no
  `session` parameter, no `session` field in `BusinessesPayload`, no
  `session?: boolean` in `RouterDeps`, no `session,` in the null-admission
  return, and no `deps.session === true` at the `/api/businesses` call site.
- `index.ts` (10+/20−) — the BUG-59 `actingEmail` comment only, reworded
  shorter on the HEAD side. Verified this is a HEAD-side edit and not lost
  incoming content: the longer wording is present in `d34bbba54d^`, so it is
  context from incoming's perspective and git kept HEAD's rewrite. All three
  of incoming's real hunks landed — `sessionAdmitted` has no remaining
  occurrence in the file, and the router call passes `{ admission }`.
- `access.ts` (47+/3−) — the AC-1380 `JWKS_REFRESH_FLOOR_MS` rate limit on
  cache-bypassing JWKS refreshes, added on the HEAD side. Incoming's own
  addition to this file survives: `accessLogoutUrl` is present.

No hunks were dropped under the BUG-1301 precedence exception; none applied.

## Verification not performed

Per this session's role, the workers/wrangler suites (`sign_out.workers`,
`admin_adds_a_business.workers`) were NOT executed — workerd cannot bind a
socket here (`listen EPERM`). The index-vs-`CHERRY_PICK_HEAD` comparison above
is the verification that was available and it is stronger than a read.
