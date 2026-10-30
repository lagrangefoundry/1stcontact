---
uid: report-ffe60d31
id: REPORT-4889
type: report
title: 'Resync resolve conflicts: 47116ed717337769dcd15931d012acf6050e6d0a'
created_by: xgd
created_at: '2026-09-23T23:54:16.253556+00:00'
updated_at: '2026-09-23T23:54:16.253556+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `package.json` — UU, config file, scalar conflict (2g). Sole conflicting
  hunk was the version field: HEAD `0.2.49` vs incoming `0.2.48`. Resolved
  toward HEAD (`git checkout --ours`). The incoming side's *entire*
  package.json change is the free-coded bookkeeping bump `0.2.47 → 0.2.48`;
  the resync branch has already advanced past it to `0.2.49` via a later
  bump. Taking incoming here would regress the version and re-claim a
  number already consumed, so 2g's "incoming wins" does not apply to a
  monotonic version scalar whose incoming value is strictly lower and
  carries no code. No other field in the file conflicted.

No other paths carried a conflict class. `apps/control-app/src/identity.ts`,
`tests/test_UAT_FC_REQ-167_identity.workers.test.ts`, and
`tests/test_UAT_FC_REQ-178_businesses.workers.test.ts` merged cleanly and
were already staged (M / M / A).

## Incoming changes preserved

Verified by diffing the resolved tree against CHERRY_PICK_HEAD
(`b1cafc80b7338b7671b80bd8c2aae2efc2062618`) per file:

    git diff --stat b1cafc80b7 -- apps/control-app/src/identity.ts \
        tests/test_UAT_FC_REQ-167_identity.workers.test.ts \
        tests/test_UAT_FC_REQ-178_businesses.workers.test.ts

returned empty — all three files are byte-identical to the incoming
commit. Specifically:

- `apps/control-app/src/identity.ts` (+290/−55 vs HEAD) — the REQ-178
  rework is present in full: `admit` returning the set of
  `AdmittedBusiness`, per-business grant and `tenants.name`, removal of
  the singular `accountId`/`entitlement`, lapsed-grant demotion to
  unselectable, and the extracted `provisionBusiness` called by
  `provisionInvite`.
- `tests/test_UAT_FC_REQ-167_identity.workers.test.ts` (+10/−... vs HEAD) —
  the two REQ-167 UATs updated for the new admission shape are present.
- `tests/test_UAT_FC_REQ-178_businesses.workers.test.ts` (new, 313 lines) —
  all 10 new UATs added intact.

No UAT function was deleted from either side. No hunk was dropped under
the BUG-1301 precedence exception; that exception was not invoked.

The only incoming content not carried forward is the `package.json`
version bump described above, which is bookkeeping rather than code and
is superseded by the higher version already on the resync branch. As a
result `package.json` shows no staged delta against HEAD.
