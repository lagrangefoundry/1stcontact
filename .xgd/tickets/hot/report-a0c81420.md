---
uid: report-a0c81420
id: REPORT-7743
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-36'
created_by: xgd
created_at: '2026-11-01T15:47:14.704478+00:00'
updated_at: '2026-11-01T15:47:14.704478+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-36
---

## Files resolved

- `apps/control-app/wrangler.toml` — UU, config/code file (2c/2g). Non-overlapping changes combined. HEAD (free-REQ-168 merge) had moved the ACCESS_TEAM_DOMAIN / ACCESS_AUD comment block above, rewritten it, and emptied the top-level ACCESS_* values (real identifiers are now only under [env.production.vars]). Incoming (REQ-185, 2103d2e63b) added the PLATFORM_ADMINS break-glass comment block plus `PLATFORM_ADMINS = ""` in both [vars] and [env.production.vars]. The conflict hunk held only HEAD's removal of the old ACCESS comment (base context, not an incoming change) next to the incoming PLATFORM_ADMINS comment. Resolution: kept HEAD's restructured ACCESS comments and empty top-level values, and added the incoming PLATFORM_ADMINS comment block before [vars]. No duplicate of the old ACCESS comment.

## Incoming changes preserved

- `apps/control-app/wrangler.toml`: all three incoming additions are present (`git diff HEAD` shows exactly these): (1) the PLATFORM_ADMINS comment block, (2) `PLATFORM_ADMINS = ""` under [vars], (3) the comment and `PLATFORM_ADMINS = ""` under [env.production.vars]. No incoming hunk dropped.
- Spot-check: vitest passed for test_UAT_FC_REQ-185_break_glass_var, REQ-144_deploy_scripts and REQ-145_build_artifacts (28 tests). REQ-147_access_gate and reconciliation-builder-private-access-gate fail to load because the build artifact `apps/control-app/src/generated/ai-workers.js` is missing in this worktree (not built). That is environmental and unrelated to the toml resolution.

## Post-merge review flag

The enrichment marked intent unknown on one side. Flagging wrangler.toml for post-merge review. The resolution keeps both sides' intent and has no scalar conflicts.
