---
uid: report-3b449b1d
id: REPORT-872
type: report
title: 'Resync resolve conflicts: f72504735d5405af1376d8b1ddd218c0bc1ba4ea'
created_by: xgd
created_at: '2026-07-24T06:10:06.296100+00:00'
updated_at: '2026-07-24T06:10:06.296100+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-510318c4
---

## Files resolved

- `package.json` — class **UU** (both modified). Rule 2g (config scalar) + timeline. Ours = `sync_working_to_main` (post-watermark, newer); theirs = `fix(l1): region-aware promoteToFlow …` [FREE-CODED] with stale `0.0.181` bump. Kept ours `version: 0.0.191`; the incoming version bump was superseded by the later main-side sync. No other keys conflicted.

## Incoming changes preserved

- `tools/generate/src/l1/probes.ts` — incoming region-aware `promoteToFlow` (union-find over perturbed-overlap graph, per-region flow stacks) is present in the resolved tree; marker parity 6/6 vs `aaf91dae`. +195/-79 as authored.
- `tests/bug9-region-aware-promote.test.ts` — incoming test added intact (141 lines).
- Only `package.json` conflicted; probes.ts and the test applied cleanly. Incoming developer code is fully present.

## State note

The `package.json` conflict was resolved and staged in this resync's stage-resolution step; the cherry-pick of `aaf91dae` has already landed as HEAD `504744e4` (payload: probes.ts + test; version line held at 0.0.191). Working tree is clean with no remaining conflict markers and no CHERRY_PICK_HEAD present.
