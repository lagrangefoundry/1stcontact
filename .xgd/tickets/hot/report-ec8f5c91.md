---
uid: report-ec8f5c91
id: REPORT-11214
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-39'
created_by: xgd
created_at: '2026-11-08T01:28:24.324629+00:00'
updated_at: '2026-11-08T01:28:24.324629+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-39
---

## Files resolved

- `apps/control-app/wrangler.toml`: UU, config/code file (2c/2g). The only conflicted hunk was comment text after the PLATFORM_ADMINS doc block. HEAD (feat(sessions): auth-passwordless) contributed nothing to that region. Incoming (af80d07896, BUG-59 fix(access)) adds the SERVICE_TOKEN_IDENTITIES doc block with its `#` separators. Incoming is a superset there, so incoming was taken in full (2c.3a). HEAD's other content (sessions/MAIL_FROM blocks) is unchanged.

## Incoming changes preserved

Checked against `git show af80d07896 -- apps/control-app/wrangler.toml`:
- SERVICE_TOKEN_IDENTITIES comment block: present (lines 152-173).
- `[vars]` `SERVICE_TOKEN_IDENTITIES = ""`: present (line 221). It merged without conflict.
- `[env.production.vars]` comment + `SERVICE_TOKEN_IDENTITIES = "1stcontact-publish=martin-github@westhead.me"`: present (lines 354-359). It merged without conflict.

No conflict markers remain. The file is staged. The other files in the commit (ACCESS.md, identity.ts, index.ts, bin/access-sim, BUG-59 tests, REQ-167 test) merged without conflict and are staged. No hunks were dropped, and BUG-1301/STEP 3h did not apply.

Flag for post-merge review, per enrichment rule (intent unknown on one side): the low-risk comment-only conflict above.
