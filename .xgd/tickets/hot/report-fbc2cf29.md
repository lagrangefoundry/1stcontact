---
uid: report-fbc2cf29
id: REPORT-5569
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-29T16:08:53.382817+00:00'
updated_at: '2026-09-29T16:08:53.382817+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `apps/control-app/src/router.ts` — UU on a code file (2c, INCOMING
  authoritative). One conflict region, at the `businessesPayload` signature and
  the head of its `admission?.ok` return. The two sides were **not** competing:
  - OURS (`69210b4a97`, `feat(sessions): consume auth-passwordless`, on the
    main-rooted branch) carries the third parameter as `accountName` — a rename
    that reached this branch in `88d7a80adb` (`wip(names): user_names table,
    resolver, tab [FREE-CODED]`, REQ-193) and that the surrounding docblock
    already reads for ("THE ACCOUNT'S NAME IS PASSED IN … [[REQ-193]]").
  - THEIRS (`e6bbe46f22`, REQ-204) adds a fourth parameter `session = false`
    and reports `session` on the admitted branch. Its diff only *contains* the
    `personName` line as unchanged context (`e6bbe46f22^` already had that
    name); it does not rename anything.

  Resolution: kept BOTH — OURS' `accountName` spelling plus THEIRS' entire
  REQ-204 addition (the `session = false` parameter, the
  "REPORTED ON BOTH BRANCHES" comment, and the `session,` field). No side's
  change was dropped; the only fact either side changed about that line was
  the parameter's name, which THEIRS never touched.

## Incoming changes preserved

`git diff --cached HEAD -- apps/control-app/src/router.ts` is hunk-for-hunk
identical to `git show e6bbe46f22 -- apps/control-app/src/router.ts`, with the
`accountName` line appearing as context in both. All five incoming hunks are
present in the staged result:

- `RouterDeps.session?: boolean` with its docblock (line 421)
- `BusinessesPayload.session: boolean` with its docblock (line 681)
- `businessesPayload(… , session = false)` (line 736)
- the `session,` field on the admitted branch, with its REQ-204 comment
  (line 746) and on the no-admission branch (line 757)
- the `deps.session === true` argument at the `/api/businesses` call site in
  `routeUncached` (line 1246)

No hunk was dropped, so the BUG-1301 precedence exception was not invoked. No
UAT test function was deleted; the commit's two new UAT suites
(`tests/test_UAT_FC_REQ-204_sign_out.test.ts`,
`tests/test_UAT_FC_REQ-204_sign_out.workers.test.ts`) and its edits to
`test_UAT_FC_BUG-52_expired_session.test.ts` and
`test_UAT_FC_REQ-180_admin_adds_a_business.workers.test.ts` merged without
conflict and are staged unchanged.

`git status --porcelain` shows no conflict-class lines; the 13 files of
`e6bbe46f22` are staged (11 `M`, 2 `A`). The cherry-pick was left in progress —
no `--continue`, `--skip`, `--quit`, or `--abort` was run.
