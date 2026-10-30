---
uid: report-71c10e7e
id: REPORT-4895
type: report
title: 'Resync resolve conflicts: 47116ed717337769dcd15931d012acf6050e6d0a'
created_by: xgd
created_at: '2026-09-24T00:08:24.965927+00:00'
updated_at: '2026-09-24T00:08:24.965927+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `package.json` — UU on a config file, single scalar conflict on the
  `version` field. Rule 2g (config scalar → incoming wins) applied;
  resolved to the incoming `0.2.53`.

  Both sides were version bumps, not code:
  - Ours: `5c4d0f2b0d` "fix(repo): resolve package.json left conflicted by
    a raced merge" (Wed Sep 2 17:01:39 2026), which set `0.2.51`
    deliberately above both of the two racing bumps it was reconciling.
  - Theirs: `758e0c71f9` "chore(version): bump to 0.2.53 for REQ-166"
    (Wed Sep 2 17:10:48 2026), `0.2.52` → `0.2.53`.

  The incoming side is both later by commit timestamp and monotonically
  higher, so rule 2g and the "never regress the version" constraint agree:
  taking `0.2.53` neither loses ours' raced-merge repair (that repair was
  the removal of conflict markers, which is present on both sides here)
  nor regresses the published version number.

  No other hunk in the file conflicted; the rest of `package.json`
  (scripts, engines, devDependencies) merged clean and is unchanged.

## Incoming changes preserved

- `package.json`: the staged blob is `2f016be789`, byte-identical to the
  post-image blob of the incoming commit `758e0c71f9` for this path
  (confirmed against the `index 86f8493c81..2f016be789` line in
  `git show 758e0c71f9 -- package.json`). The incoming `version: 0.2.53`
  appears verbatim in the resolved file.

No hunks were dropped; the BUG-1301 precedence exception was not invoked.
No UAT test files were touched by this conflict.
