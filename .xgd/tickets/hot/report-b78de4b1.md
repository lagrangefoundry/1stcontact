---
uid: report-b78de4b1
id: REPORT-1033
type: report
title: 'Resync resolve conflicts: d3d689184dbc45f44b278bad79f1c82fb57525b9'
created_by: xgd
created_at: '2026-07-29T04:38:27.578585+00:00'
updated_at: '2026-07-29T04:38:27.578585+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-510318c4
---

## Files resolved

- `package.json` — class **UU**, config scalar (`version`). Resolved to **`0.0.225`** (ours/HEAD). ⚠️ **Flagged for post-merge review** per the enrichment rule.

  Rule application: the enrichment rule for this file was "take the more recent commit by timestamp and flag for post-merge review". The two timestamps disagree — by *author* time ours (2026-07-28T20:38) is newer than theirs (2026-07-27T16:41); by *committer* time theirs (2026-07-28T20:52) is newer. Theirs' committer stamp is a sync/rebase artifact of replaying onto `xgd-working`, so author time reflects real content recency → ours.

  This is decisive independently of that tiebreak: `main` and `HEAD` are both at `0.0.225`; the incoming side proposes `0.0.220`, which would move the version **backwards below main's**. The generic 2g rule ("config scalar: incoming wins") is overridden here because it produces an incoherent version regression. A version bump is lineage bookkeeping, not developer code — resync picks carry code only, and every prior pick on this branch left `0.0.225` intact. No developer code was discarded by this choice.

## Incoming changes preserved

Verified by blob-hash equality against `CHERRY_PICK_HEAD` (`50f40e2c1`), not by inspection:

- `packages/site-schema/src/validate.ts` — incoming `0ea579dbb…` == worktree `0ea579dbb…` — **byte-identical ✓**
- `tests/req107-authored-l1-envelope.test.ts` — incoming `ef19db97a…` == worktree `ef19db97a…` — **byte-identical ✓** (new file, added whole; no test function deleted)

Both incoming code files carry the full REQ-107 change (`validateSite` now runs the L1 envelope over every page carrying `l1`, with envelope paths prefixed to `/pages/<i>/l1/…`). Net staged change vs HEAD: 2 files, +279/-7. `package.json` correctly shows no net change.

## Verification

Staged tree `dc45b001340e7e2d8ce21c376bf32ce398c89a81`:

- `pnpm -r build` — clean across all packages (no type drift; built before testing so stale `dist` could not mask it).
- `npx vitest run` — 871/875 pass. The new `req107` test passes 5/5.
- 4 failures are **pre-existing and environmental**, not caused by this pick: all are `ENOENT` on `storage/references/gigabytealchemy.ai/index/multistate.json`, a gitignored capture directory absent from this worktree. Confirmed empirically by reverting only `validate.ts` to HEAD's version and re-running the three affected files — the same 4 failed identically without the pick applied.

This pick makes `validateSite` strictly stronger, so the suite re-validates the commit message's triage claim ("no document needed fixing") against current `main`: no `storage/sites/**` document or fixture tripped the envelope.
