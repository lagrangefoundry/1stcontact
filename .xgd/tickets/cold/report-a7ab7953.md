---
uid: report-a7ab7953
id: REPORT-977
type: report
title: 'Resync resolve conflicts: 006568bd9e49cc7323728e278446fbe1f1e9b96b'
created_by: xgd
created_at: '2026-07-27T20:41:35.787716+00:00'
updated_at: '2026-07-27T20:41:35.787716+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-510318c4
---

## Files resolved

- `package.json` — **UU**, config file (2g), scalar `version` conflict.
  Ours `0.0.212` (HEAD, `xgd: sync from xgd-working 5cd728086215`, committed
  2026-07-27T13:38:28-07:00) vs theirs `0.0.195` (incoming `5d8832f75`,
  committed 2026-07-24T18:32:14-07:00).
  Rule applied: the enrichment's stated rule — *"Intent unknown on one or both
  sides. Take the more recent commit by timestamp"* — resolves to **ours**
  (`0.0.212`), which is 3 days newer.
  This agrees with the branch precedent: every prior cherry-pick in this resync
  run (`dceffcf86`, `d52e63151`, `038fe8e55`, …) kept `0.0.212`. Taking the
  incoming scalar would have *regressed* the version counter on a main-rooted
  branch, since `0.0.195` belongs to xgd-working's independent numbering.
  Resolved via `git checkout --ours -- package.json`; result parses as valid JSON
  and retains no conflict markers.

No other conflicted paths. `tools/generate/src/l1/fold.ts` and
`tests/bug21-control-surface-outset.test.ts` auto-merged cleanly and required no
manual resolution.

## Incoming changes preserved

- `tests/bug21-control-surface-outset.test.ts` (new file, staged `A`) — blob
  `3b307c3ac6f0aa5159f688229267aec583c28047`, **byte-identical** to the incoming
  commit's version. No test function was dropped.
- `tools/generate/src/l1/fold.ts` (staged `M`) — verified mechanically: all
  **85/85** non-blank added lines from the incoming delta
  (`git diff 5d8832f75^ 5d8832f75 -- fold.ts`) are present verbatim in the
  resolved file, 0 missing.
  Byte-identity with the incoming blob is *not* expected here and was not used as
  the criterion: this file already carries an earlier cherry-pick from this same
  resync run (`dceffcf86 fix(capture,l1)`), so the resolved content is correctly
  HEAD's version plus the incoming delta.
  Both fixes described in the commit message are structurally intact:
  - `isSelfPaintingRun` now delegates to the new `isPaddedControlRun`
    padded-control family, with the documented gradient / `borderLeft` guards.
  - `buildCards` computes a per-edge outset via `cardOutset(r, pad)` and applies
    `out.left/top/right/bottom` independently, replacing the single vertical
    estimate that was applied to all four sides.

`package.json` carries no semantic content from the incoming commit — the only
hunk was the version scalar — so no incoming change was discarded by taking ours.

## Staging state

`git status --porcelain` shows no conflict-class entries:

    A  tests/bug21-control-surface-outset.test.ts
    M  tools/generate/src/l1/fold.ts

Net change vs HEAD is non-empty (2 files, +326 / -12), so the cherry-pick will
not become empty on continuation. `CHERRY_PICK_HEAD` (`5d8832f75`) is left
intact; no `--continue` / `--skip` / `--quit` / `--abort` was invoked.

## Caveat — tests not executed (environmental, not a merge defect)

The incoming test could not be run in this worktree: it fails at import with
`Failed to resolve entry for package "@1stcontact/site-schema"`. This worktree is
unbuilt — `packages/site-schema/dist` is absent and `node_modules/@1stcontact/`
has no workspace links. A **control run of the pre-existing
`tests/bug17-fold-padding.test.ts` fails identically**, confirming the cause is
the unbuilt worktree and not this resolution. `pnpm install` was deliberately not
run, as it can rewrite `pnpm-lock.yaml` and dirty the tree while the cherry-pick
is paused. Behavioural validation is left to the later pipeline stage that builds
the workspace.
