---
uid: report-bf21852a
id: REPORT-4647
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-21T05:24:41.224942+00:00'
updated_at: '2026-09-21T05:24:41.224942+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `package.json` — **UU**, config file (STEP 2g / per-file enrichment rule).
  Conflict was the `version` scalar only:
  - OURS (HEAD): `0.2.40` — last touched by `80c9342ac1` (2026-09-14 03:15:55 -0700),
    "Merge branch 'free-BUG-43' into xgd-working"
  - THEIRS (CHERRY_PICK_HEAD `c056002a52`, 2026-08-31 15:08:35 -0700):
    `0.2.22` — "chore: version bump — 0.2.21 was claimed at the working tip by a
    concurrent ticket auto-commit [FREE-CODED]"

  The enrichment metadata for this file states intent is unknown on one or both
  sides and prescribes: *take the more recent commit by timestamp and flag for
  post-merge review*. OURS is newer by ~14 days, so `0.2.40` was kept. This
  file-specific rule governs over the generic 2g "incoming wins on scalars"
  default. Resolved value verified via `git show :package.json` → `0.2.40`.
  JSON validated (`node -e "require('./package.json').version"` → `0.2.40`).

  **Flagged for post-merge review** per the enrichment rule.

## Incoming changes preserved

- `package.json`: the incoming value `0.2.22` is intentionally **not** present in
  the resolved file. This is not a dropped developer change in the STEP 3 sense —
  the incoming commit is a pure one-line version-scalar bump (`0.2.21` → `0.2.22`)
  with no other content, and the applicable per-file resolution rule is the
  timestamp rule, which selects OURS. Taking `0.2.22` would roll the package
  version backwards past 18 subsequent bumps already integrated into HEAD.
  No code, test, or spec content was discarded.

## Staging state

`git status --porcelain` is empty: no UU/AA/DU/UD lines remain and the resolved
content is identical to HEAD, so the staged diff for this cherry-pick is empty.
Per STEP 4, `--skip` was NOT invoked — the finalize step owns that decision.
CHERRY_PICK_HEAD (`c056002a52`) is still present.
