---
uid: report-6c10c354
id: REPORT-5760
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-30T18:22:03.523044+00:00'
updated_at: '2026-09-30T18:22:03.523044+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

# Resync conflict resolution — `package.json` on pick `c3c747fa1d`

- **Branch**: `resync-377b581e`
- **Anchor**: `report-377b581e`
- **Apply target**: `9ac98712a708888db67f8aff21f22b16bd98094e`
- **Picked commit (theirs)**: `c3c747fa1dbcd074ca643b5d8b3b790f2b578c8b`
  — `fix(capture/fold): five residuals a passing gate could not see [FREE-CODED]`, 2026-09-17 17:11:30 -0700
- **HEAD (ours)**: `f6bd4bba8f` region; `HEAD:package.json` = `40c50fd884` (unmoved by this resolution)
- **Conflicted paths**: `package.json` only (1 of 12 files in the pick)
- **Prior stage failure**: none (empty)
- **Outcome**: `--ours` on `package.json`; every other file in the pick auto-merged and is staged intact.

## The conflict is one line: the version counter

Three-way blobs (`git ls-files -u -- package.json`):

| side | blob | `version` |
|---|---|---|
| `:1:` base (pick's parent) | `2022826a8e` | `0.2.243` |
| `:2:` ours (HEAD) | `40c50fd884` | `0.2.245` |
| `:3:` theirs (incoming) | `7c2b3aa5ac` | `0.2.244` |

`git diff :1: :2:` and `git diff :1: :3:` are each **exactly one line** — the
`"version"` field. Nothing else in `package.json` diverges on either side, so
there is no dependency, script, or engines delta to adjudicate.

## Why ours wins, despite §2g and despite the enrichment rule

The auto-enrichment for this file said:

> **Resolution rule**: Intent unknown on one or both sides. Take the more recent
> commit by timestamp and flag this file for post-merge review.

Applied naively that hands the line to incoming (theirs 17:11:30 vs ours' bump
commit at 17:06:54). That is wrong here, and this pick carries the sharpest
available proof of why.

Ours' value was written by `2e0707a106`
(`chore: bump version for REQ-260 [FREE-CODED]`, 2026-09-17 17:06:54 -0700),
whose patch is:

```
-  "version": "0.2.244",
+  "version": "0.2.245",
```

**HEAD's own history already passed through, and retired, incoming's exact
value.** `0.2.244` is not a competing decision the resync branch has yet to
consider — it is the value this branch consumed one commit ago and bumped off.
Taking incoming would reintroduce a retired counter value, regress the branch,
and leave every remaining pick in the queue colliding on the same line.

`version` is a monotone counter, not a scalar config setting, so
`resync_stage_resolution.yaml` §2g ("config files: scalar conflicts, incoming
wins") does not apply to it. Wall-clock ordering is also not meaningful here:
the resync queue replays free-coded commits in pick order, not author-date
order, which is exactly how a 17:11 commit can carry a *lower* counter than a
17:06 one that has already landed.

## No data loss

This resolution keeps **none** of main's work and discards **none** of the
developer's:

- All five bump commits on this path are `[FREE-CODED]` xgd-working commits
  already integrated into `resync-377b581e` (`2e0707a106` REQ-260,
  `8492dfb6bd` BUG-99, `f3ba81e72c` REQ-267, `d12c4bcc37` BUG-105, …).
  `0.2.245` came from xgd-working, not from main.
- The substance of pick `c3c747fa1d` — the REQ-269 capture/fold residuals work
  — auto-merged cleanly and is fully staged: `packages/framework/src/l1/render.ts`,
  `packages/site-schema/src/l1/{schema,validate}.ts`,
  `tools/generate/src/cli/capture/{extract,sections,types,values-diff}.ts`,
  `tools/generate/src/l1/fold.ts`, plus the new
  `tests/test_UAT_FC_REQ-269_capture_and_fold_residuals.test.ts` and its two
  `tests/fixtures/capture/req269-*.html` fixtures.

No post-merge review is needed for this file; the flag the enrichment asked for
is discharged by the two one-line diffs above.

## Post-resolution state

- `git status --porcelain`: no `UU` lines; `package.json` absent from the list
  entirely, i.e. **zero net change** for the conflicted file (index == `HEAD`).
  The 11 files of the pick's actual content remain staged.
- `git show :package.json | grep version` → `"version": "0.2.245",`
- `CHERRY_PICK_HEAD` intact at `c3c747fa1dbcd074ca643b5d8b3b790f2b578c8b`.
- `HEAD:package.json` unmoved at `40c50fd884`.

## Forecast for the remaining queue

`package.json` will keep conflicting on the `version` line for every remaining
free-coded pick whose recorded version is `≤ 0.2.245`, and each of those is
`--ours` with zero net change. The check is three commands and needs no ledger
walk:

```
git show :1:package.json | grep version                                  # base
git show $(git rev-parse CHERRY_PICK_HEAD):package.json | grep version   # theirs
git show HEAD:package.json | grep version                                # ours
```

If ours > theirs → `--ours`. The decisive confirmation, when you want it, is to
`git show -- package.json` the commit that set ours' value and check that its
`-` line is theirs' value; that proves retirement rather than merely arguing
from magnitude. Incoming only wins this line once a pick carries a version
*above* HEAD's, at which point it is a genuine forward bump.
