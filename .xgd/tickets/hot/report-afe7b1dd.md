---
uid: report-afe7b1dd
id: REPORT-6236
type: report
title: 'Resync resolve conflicts: 397daf02997f5670ac4ce7c26f12ed9050b0f66d'
created_by: xgd
created_at: '2026-10-05T03:02:42.134189+00:00'
updated_at: '2026-10-05T03:02:42.134189+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-10bbd54c
---

# Resync resolve conflicts — pick 61a0becc61 (REQ-167 identity)

Pick: `61a0becc61` feat(identity): the invite provisions the account, login binds it [FREE-CODED] (08-31 18:30:41)
HEAD: `53a52c95f3`; apply target `397daf02997f5670ac4ce7c26f12ed9050b0f66d`; retry count 1; prior_stage_failure empty.

## Context
The pick's code was already replayed on HEAD as `5f65959253` (same subject, same author date): access.ts,
identity.ts, index.ts, 0004_identity.sql, req115 test, d1-site-factory, local-d1 (`seedIdentity`), REQ-147 UAT,
scaffold.ts all auto-merged to HEAD's blobs. That replay left out three paths: package.json, the workspace-origin
test, and the new UAT file.

## Resolutions
- `package.json`: **ours**. Base .26, theirs .27, ours .40. The value is a counter, and incoming's own later bumps
  (`deaf3f98c4` → .29, `9ae7338430`, …) moved past .27. HEAD's .40 came from xgd-working commits already
  integrated into this branch, not from main. The enrichment's "most recent by timestamp" rule does not apply,
  because the queue replays picks in pick order, not timestamp order.
- `tests/reconciliation-builder-workspace-origin.test.ts`: **ours** in both regions. HEAD's `control-app front`
  describe uses main's in-process harness (`controlWorker.fetch` + `workerEnv()`), which xgd-working never had.
  Theirs' region is the `unstable_dev` beforeAll body (applyLocalD1Schema + `seedIdentity` + `worker = unstable_dev`).
  It references `worker`/`builder`, which HEAD does not declare, so it would not compile. The import hunk
  (`applyLocalD1Schema, seedIdentity`) is used only by that body, so it also goes to ours (HEAD imports neither).
- `tests/test_UAT_FC_REQ-167_identity.workers.test.ts`: lands as incoming (new file, 539 lines). This is the only
  net change.

## Flag for post-merge review
HEAD's `workerEnv()` passes `DB` as a Proxy that throws on any access. HEAD's index.ts (replayed REQ-167) now
calls `admit(env, gate.email)` for every admitted request, and that reads D1. So the admitted legs of AC-964 in
this suite may now fail with "D1 was touched". Incoming handled this by seeding a real identity under
`unstable_dev`, and that remedy does not carry over to the in-process harness. The problem was already on HEAD
before this pick. The fix is to give the harness a D1 stub that admits `uat@westhead.me`, which needs a decision
on main's harness. Not run: the suite needs a loopback Access team (port binding), which this role cannot use.

## Verification
`git diff --cached --stat HEAD` = only the new UAT file (+539). No conflicts remain; CHERRY_PICK_HEAD intact.
