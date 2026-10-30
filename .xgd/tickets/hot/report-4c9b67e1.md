---
uid: report-4c9b67e1
id: REPORT-5560
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-29T15:08:31.360453+00:00'
updated_at: '2026-09-29T15:08:31.360453+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `apps/control-app/src/index.ts` — UU, code file (§2c). Both sides edited
  ADJACENT lines inside one hunk, from the same base `208ae22204`, with no
  overlap in intent, so 2c's "non-overlapping changes: keep BOTH" applies
  literally and nothing had to be chosen against:
    - incoming `fc5c78dbe5` (17:09) changed `admit(env, gate.email)` →
      `admit(env, email)`, because it introduced the session-cookie producer
      above it (`sessionIdentityFor`, REQ-202) and `gate` is now block-scoped
      inside the `else`.
    - HEAD `5fe4b28c49` (16:49, BUG-62) changed `denied(admission)` →
      `denied()` and dropped that function's parameter, moving the denial log
      line into `admit`.
  Resolved to `admission = await admit(env, email)` /
  `if (!admission.ok) return denied()` — incoming's argument, HEAD's call
  shape. This is also the only version that compiles: `gate` is out of scope
  at that line and `denied` takes no parameters in the merged file.

The other 19 paths in this commit's diff were auto-merged by git with no
conflict class and were not touched by this session.

## Incoming changes preserved

`git diff --cached fc5c78dbe5` restricted to this commit's own 20 paths shows
`apps/control-app/src/index.ts` differing from incoming by EXACTLY the two
hunks of HEAD's BUG-62 commit (the `denied` docblock/signature and the one
call site) and by nothing else — incoming's `admission = await admit(env,
email)` appears as unchanged context in that diff, i.e. the developer's line
is present verbatim in the resolution. No incoming hunk was dropped and the
BUG-1301 precedence exception was not needed.

Ten of the twenty paths (`invites.ts`, `sessions.ts`, `sign-in.ts`,
`tests/support/passwordless-installed.ts`, the three REQ-202 suites, REQ-188,
REQ-199, `shared-store.ts`) are byte-identical to `CHERRY_PICK_HEAD`. The
remaining nine differ only where HEAD carried its own independent, already-
integrated edits to the same files — integration, not data loss.

Verification stopped at the staged-vs-CHERRY_PICK_HEAD comparison above. The
workers suites were NOT executed: they are unrunnable in this session role
(workerd cannot bind a socket), and this commit additionally documents that
`@lagrangefoundry/auth-passwordless` is not yet installed into the shared
store, so a typecheck would fail on that unresolved import for reasons that
pre-date this resolution.
