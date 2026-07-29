---
uid: report-0db1acb6
id: REPORT-989
type: report
title: 'Resync resolve conflicts: 006568bd9e49cc7323728e278446fbe1f1e9b96b'
created_by: xgd
created_at: '2026-07-27T21:00:49.626868+00:00'
updated_at: '2026-07-27T21:00:49.626868+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-510318c4
---

## Files resolved

- `package.json` — class **UU**, config file (§2g) with enrichment override.
  Sole conflicted path; the conflict was confined to the `"version"` scalar.
  - ours (HEAD, `sync_working_to_main` @ 02896c2ce7, ts 1785184362 / Jul 27): `0.0.212`
  - theirs (incoming `b542fd587` FREE-CODED, ts 1785008000 / Jul 25): `0.0.201`
  - merge base: `0.0.200`
  - Rule applied: enrichment metadata declared intent unknown on one side →
    "take the more recent commit by timestamp". Ours is newer by ~2 days, so
    ours (`0.0.212`) wins. This also preserves version monotonicity (taking
    theirs would regress main's counter by 11 patch versions) and matches the
    resolution used by every prior cherry-pick in this resync run, all of
    which landed at `0.0.212`.
  - **Flagged for post-merge review** per the enrichment rule. Consequence:
    the incoming commit's own 0.0.200 → 0.0.201 bump is absorbed/dropped, so
    this commit carries no version bump of its own. It already cleared the
    free-coding version gate on `xgd-working` before replay.

The other 5 paths in the incoming commit applied cleanly (no conflict class)
and are staged unmodified.

## Incoming changes preserved

Verified by blob-identity — each staged path's index blob SHA equals the same
path's blob in `CHERRY_PICK_HEAD` (`b542fd587`):

- `tests/req88-viewport-relative-and-nowrap.test.ts` — IDENTICAL (+80)
- `tools/generate/src/cli/capture/index.ts` — IDENTICAL (+2)
- `tools/generate/src/cli/capture/values-diff.ts` — IDENTICAL (+45/-1)
- `tools/generate/src/l1/fold.ts` — IDENTICAL (+21/-3)
- `tools/generate/src/l1/probes.ts` — IDENTICAL (+13)

Staged diff (HEAD → index) is 5 files, 148 insertions, 13 deletions. The
incoming commit's own stat is 6 files, 149 insertions, 14 deletions. The
delta is exactly the one-line `package.json` version bump resolved to ours.
No developer code was discarded; `partitionProbes` and the `accentBox` fold
fix are present in full.

Net change from HEAD is non-empty (5 files), so this is not a no-op patch.
No conflict markers remain in any staged blob (grep count 0).
