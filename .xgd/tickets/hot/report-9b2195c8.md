---
uid: report-9b2195c8
id: REPORT-4721
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-21T13:58:22.102891+00:00'
updated_at: '2026-09-21T13:58:22.102891+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- **package.json** — UU, config file (STEP 2g / enrichment rule "take the
  more recent commit by timestamp"). Sole conflicting hunk is the `version`
  scalar: ours `0.2.40` (last touched by `80c9342ac1` merge of `free-BUG-43`,
  2026-09-14T03:15:55-07:00) vs theirs `0.2.27` (incoming `61a0becc61`,
  2026-08-31T18:30:41-07:00). HEAD side is the more recent commit, so HEAD's
  `0.2.40` was kept. Flagged for post-merge review per the enrichment rule
  (intent unknown on both sides; this is a version-bump collision, not a
  semantic one).

- **tests/reconciliation-builder-workspace-origin.test.ts** — UU, code file
  under `tests/**` (STEP 2c, with the BUG-1301 PRECEDENCE exception applied).
  Two conflicted hunks, both resolved to the HEAD side; see next section for
  the justification. HEAD side is also the more recent commit here
  (`a6d1b6b7bd`, 2026-09-11T03:00:07-07:00 vs incoming 2026-08-31).

- **tests/test_UAT_FC_REQ-167_identity.workers.test.ts** — NOT a conflict;
  clean add from the incoming commit (539 lines). Retained and staged as-is.
  Noted here because an earlier pass in this session removed it as redundant
  against main's `tests/reconciliation-identity-invite-and-admission.workers.test.ts`;
  that was a resolution shortcut of exactly the kind STEP 2f forbids, and the
  BUG-1301 precedence exception does not cover it (the code it exercises,
  `apps/control-app/src/identity.ts`, is present in HEAD). The file has been
  restored from CHERRY_PICK_HEAD.

## Incoming changes preserved

The incoming commit `61a0becc61` touches 12 files. Nine of them applied
cleanly and are verified present:

- `apps/control-app/src/identity.ts`, `apps/control-app/src/index.ts`,
  `db/migrations/0004_identity.sql`, `tests/support/local-d1.ts`,
  `tests/support/d1-site-factory.ts`, `tests/req115-builder-shell.test.ts`,
  `tests/test_UAT_FC_REQ-147_access_gate.test.ts`,
  `tools/generate/src/cli/scaffold.ts` — `git diff CHERRY_PICK_HEAD HEAD --`
  is empty for each: HEAD's content is byte-identical to the incoming
  version. `index.ts:123` calls `admit(env, gate.email)` before routing, as
  the commit intends.

- `apps/control-app/src/access.ts` — HEAD is a strict evolution of the
  incoming version (+47/-3 beyond it). The commit's stated change,
  "`guardAccess` now reports the verified identity rather than a yes/no",
  is present: the success variant is
  `{ ok: true; identity: string; email: string | null; claims: AccessClaims }`
  (access.ts:352) and is populated at access.ts:409. Nothing discarded.

- `tests/test_UAT_FC_REQ-167_identity.workers.test.ts` — added verbatim.

**Hunks dropped under the BUG-1301 precedence exception** —
`tests/reconciliation-builder-workspace-origin.test.ts`, both hunks:

1. import line: `applyLocalD1Schema` -> `applyLocalD1Schema, seedIdentity`
2. inside `describe('story-e674c60a control-app front')`'s `beforeAll`: a
   `seedIdentity(REPO, 'uat@westhead.me')` call added immediately above the
   existing `worker = await unstable_dev(...)` construction.

Both hunks target a block that no longer exists in HEAD. It was removed by
`7a17bd8cd91cf5f8cf33a994170d8a93c0552459` (2026-09-10T03:48:57-07:00,
"Workflow fix_uat_validation completed: done", `xgd-kind:
structural_validation`, +132/-75 on this file), which replaced the
`unstable_dev`-spawned worker for AC-964 with an in-process
`controlWorker.fetch` call against a hand-built `workerEnv()`. That removal
is a legitimate, documented refactor already integrated into HEAD, not
resolution churn: it was produced by a named validation workflow, and the
file carries its own rationale in prose at
`tests/reconciliation-builder-workspace-origin.test.ts:61` — "`unstable_dev`
is not used for AC-964 any more: it spawns a `wrangler dev` child, which
makes the gate assertions hostage to a subprocess that cannot start in a
sandboxed checkout, and the entry point under test is this handler either
way." With no `unstable_dev` worker and no miniflare D1 in that describe,
there is no local database for `seedIdentity` to seed and the `local-d1`
import has no remaining consumer in this file, so it was dropped too.

No test function was deleted on either side. The describe block and all of
its `it()` cases (`test_UAT_AC964_*`, `test_UAT_AC965_*`, and the
`story-e674c60a component consumption route` suite) are intact; the dropped
hunks added setup lines only. `unstable_dev` remains imported and used by
AC-965 at line 899.

## Post-merge review flag

`package.json`'s `version` collision (0.2.40 vs 0.2.27) is a mechanical
version-bump clash resolved by timestamp, not by intent. Worth a glance if
the resync publish expects a specific version string.
