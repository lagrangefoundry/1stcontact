---
uid: report-0c95371a
id: REPORT-5428
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-29T02:53:23.879600+00:00'
updated_at: '2026-09-29T02:53:23.879600+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `package.json` — **UU**, config file (§2g) with per-file conflict-intent
  enrichment. One conflicting hunk: the `version` scalar.
  - Ours (HEAD, `80c9342ac1`, *Merge branch 'free-BUG-43' into xgd-working*,
    2026-09-01 15:35:56 -0700): `0.2.40`
  - Incoming (`deaf3f98c4`, *chore: bump version to 0.2.29 [FREE-CODED]*,
    2026-08-31 18:31:07 -0700): `0.2.29`
  - Rule applied: the enrichment block for this file states intent is
    unknown on one or both sides, and directs "take the more recent commit
    by timestamp and flag this file for post-merge review." Ours is ~21h
    more recent, so `0.2.40` was kept. This per-file directive is more
    specific than §2g's generic "scalar conflicts: incoming wins" default,
    and §2g applied literally would regress the package version.
  - **Flagged for post-merge review** as the enrichment rule requires.

Staged via `git add -- package.json`. `git status --porcelain` is now empty:
the resolution is byte-identical to HEAD, so there is no net staged diff.
Per STEP 4 this is expected and left as-is — no `--continue`/`--skip`/
`--quit`/`--abort` was run, and `CHERRY_PICK_HEAD` (`deaf3f98c4`) is intact
for the finalize step, which will detect the clean staged diff and skip the
commit.

## Incoming changes preserved

The incoming commit `deaf3f98c4` touches exactly one file with exactly one
hunk: `package.json` `"version": "0.2.27"` → `"0.2.29"`. That hunk is **not**
present in the resolved version, and that absence is correct rather than
discarded developer code:

- The incoming hunk's base is `0.2.27`. HEAD is no longer at `0.2.27`; it has
  advanced past `0.2.29` through a documented chain of later, independently
  authored version bumps already integrated into HEAD:
  `2fbb0f5f02` (0.2.31, 2026-09-01) → `e86aecc7cb` (0.2.39, 2026-09-01) →
  HEAD (0.2.40).
- The incoming scalar is therefore **superseded, not dropped**: re-applying it
  would move the package version backwards by eleven patch releases and
  silently undo three later bumps. There is no developer intent in
  `deaf3f98c4` beyond "advance the version," and HEAD already satisfies that
  intent more completely.
- No code, test, or behavioural change from the incoming commit was lost —
  the commit contains none. No UAT test function was deleted; no test files
  were involved in this conflict.
