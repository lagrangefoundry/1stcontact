---
uid: report-ecdb33f1
id: REPORT-1026
type: report
title: 'Resync resolve conflicts: d3d689184dbc45f44b278bad79f1c82fb57525b9'
created_by: xgd
created_at: '2026-07-29T04:28:23.990618+00:00'
updated_at: '2026-07-29T04:28:23.990618+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-510318c4
---

## Files resolved

- `package.json` — class **UU**, scalar `version` field only.
  Enrichment rule applied: "intent unknown on one or both sides — take the
  more recent commit by timestamp, flag for post-merge review."
  - Ours: `c8de6708` *xgd: sync from xgd-working d3562e3b8285 (post-watermark)* —
    author **2026-07-28 20:38:31**, version `0.0.225`.
  - Theirs: `d84551664` (incoming free-coded) —
    author **2026-07-27 16:06:40**, committer 2026-07-28 20:45:30, version `0.0.218`.
  - Resolution: **kept ours, `0.0.225`.** Author dates decide: ours is ~28h newer.
    The later *committer* date on theirs is an artifact of the resync machinery
    rewriting that commit (its sha appears in this anchor's `orphan_commits` map),
    so it reflects replay time, not developer intent.
  - Corroborating: incoming bumps `0.0.217 -> 0.0.218`, a per-commit free-coding
    gate bump. Main has since advanced to `0.0.225` via the post-watermark sync,
    which already subsumes that history. Taking `0.0.218` would walk the version
    backwards and re-conflict on every subsequent pick.
  - **Flagged for post-merge review** per the rule.

No other conflicted paths. The remaining seven files in the pick auto-merged.

## Incoming changes preserved

Verified by diffing the staged tree against `CHERRY_PICK_HEAD` (`d84551664`)
per path. All seven code/implementation files are **byte-identical to the
incoming commit**:

- `packages/framework/src/l1/render.ts` — identical
- `packages/framework/src/modules/contact-form/client.js` — identical
- `packages/site-schema/src/l1/schema.ts` — identical
- `packages/site-schema/src/l1/validate.ts` — identical
- `storage/sites/xgd/draft/pages/home.json` — identical
- `tests/req102-scaffold-l1.test.ts` — identical
- `tests/req106-l1-links.test.ts` — identical (new file, 204 lines)

`package.json` differs from incoming on the version line and nothing else
(`git diff CHERRY_PICK_HEAD -- package.json` yields exactly one -/+ pair).
Since that path carried no code in this pick, **zero developer code was
discarded**. No UAT function was deleted on either side.

Net change vs HEAD is non-empty: 7 files changed, 496 insertions, 19 deletions.
`package.json` is absent from porcelain because the resolution matches HEAD.

## Build / test state

Full `pnpm -r build` clean across all 7 workspace projects. `vitest`: 866 passed,
4 failed (122 files) — all 4 failures are the same `ENOENT` on the untracked
capture bundle `storage/references/gigabytealchemy.ai/index/multistate.json`
(0 files tracked under `storage/references`; absent in a fresh resync worktree),
in three test files the pick does not touch. The pick's own tests are green
(`req106-l1-links` + `req102-scaffold-l1`: 19/19).
