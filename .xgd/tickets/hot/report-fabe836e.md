---
uid: report-fabe836e
id: REPORT-1001
type: report
title: 'Resync resolve conflicts: 006568bd9e49cc7323728e278446fbe1f1e9b96b'
created_by: xgd
created_at: '2026-07-27T21:29:24.214245+00:00'
updated_at: '2026-07-27T21:29:24.214245+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-510318c4
---

Cherry-pick resolved: `bb7bf22beacb1af071bb9d9e18ac2fc4b90499f0`
("feat(gate): reconcile l1-gate, values-diff and perceptual diff [FREE-CODED]")
driving toward apply_target `006568bd9e49cc7323728e278446fbe1f1e9b96b`.

## Files resolved

- **`package.json`** — class **UU**, config/manifest scalar.
  Sole conflict in the pick. OURS (HEAD, `sync_working_to_main` /
  "xgd: sync from xgd-working 5cd728086215") had `0.0.212`; THEIRS
  (incoming free-coded commit) had `0.0.207`. **Resolved to `0.0.213`.**

  Rule applied — 2g (config scalar) adapted for a *monotonic counter*.
  The enrichment's fallback rule ("take the more recent commit by
  timestamp") and the plain "incoming wins" scalar rule both resolve to
  `0.0.207` here, which would **regress** the project version from main's
  `0.0.212`. The reverse (keep HEAD) would discard the incoming side's
  only change to this file, i.e. main-wins data loss. This field is not
  an independent scalar: it is a monotonic counter maintained by
  `bin/project/xgd_version_bump` under the XGD bump convention, where the
  incoming side's semantic content is *"this free-coded commit carries a
  patch bump"*. Replaying that intent onto the resync base of `0.0.212`
  yields `0.0.213` — the bump is preserved AND monotonicity holds.

  Checks: result is valid JSON (parsed); root version is not mirrored in
  `pnpm-lock.yaml` or any workspace manifest (`xgd_version_bump
  --list-paths` reports `package.json` only), so no companion file needed
  updating.

  **Flagged for post-merge review** per the enrichment rule, since intent
  was unknown on one side. The reviewable decision is the `0.0.213`
  choice; the three code files below need no review.

Applied cleanly, no markers, no resolution required:
- `tools/generate/src/cli/gate.ts` (A, +454)
- `tools/generate/src/cli/index.ts` (M, +78)
- `tests/req94-cross-gate-reconciliation.test.ts` (A, +359)

## Incoming changes preserved

Per STEP 3, diffed the staged tree against CHERRY_PICK_HEAD file by file:

- `git diff --stat $CPHEAD -- <file>` is **EMPTY** for `gate.ts`,
  `index.ts`, and `req94-cross-gate-reconciliation.test.ts` — the staged
  content is byte-identical to the developer's authored version. No
  integration was attempted and none was needed.
- `package.json` — the incoming change (a version bump attached to this
  commit) is present, rebased onto the new base rather than dropped.

Net change vs HEAD: **892 insertions, 1 deletion across 4 files** —
identical to the original commit's own stat, so the resolution is neither
empty nor lossy.

No UAT/test function was deleted from either side. No new code, tests, or
matrix content was authored; only content already inside the conflict
markers was resolved.

## Staging state

    M  package.json
    A  tests/req94-cross-gate-reconciliation.test.ts
    A  tools/generate/src/cli/gate.ts
    M  tools/generate/src/cli/index.ts

No conflict-class (UU/AA/DU/UD/AU/UA) lines remain; zero conflict markers
in the staged diff. `CHERRY_PICK_HEAD` (`bb7bf22be…`) left intact for
`resync_cherry_pick_finalize_resolution`. No `--continue` / `--skip` /
`--quit` / `--abort` / `reset` / `checkout` was run by this session.

Note: an earlier duplicate of this report was filed as `report-24bbdcce`
with subject `resync-anchor` instead of the anchor UID `report-510318c4`.
Same content and same verdict; this report supersedes it.
