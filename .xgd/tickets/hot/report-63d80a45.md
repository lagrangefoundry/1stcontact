---
uid: report-63d80a45
id: REPORT-3350
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-23'
created_by: xgd
created_at: '2026-09-02T20:25:40.313382+00:00'
updated_at: '2026-09-02T20:25:40.313382+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-23
---

## Files resolved

- `apps/control-app/wrangler.toml` — UU, config file (2g). Resolved to HEAD's
  content. The incoming commit's substance (`[observability]` at top level and
  `[env.production.observability]` placed after `routes`, both with
  `enabled = true` / `head_sampling_rate = 1`) is ALREADY PRESENT in HEAD at
  lines 35-37 and 197-199 — it landed earlier on this branch as
  `a82ced76190411b80d05849fa7997b470efd0f57`, an identical commit (same
  subject, same author date 2026-08-24 14:55:11 -0700, same 3-file stat) that a
  post-watermark sync already carried in. The only conflicting hunk was a
  4-line comment block ("THE DEPLOYED GATE'S CONFIGURATION...") that exists on
  the HEAD side only; it postdates the incoming commit's merge base, so its
  absence on the incoming side is timeline drift, not developer intent. No
  incoming line was dropped.
- `package.json` — UU, config file (2g), scalar `version` field. HEAD `0.2.20`
  vs incoming `0.2.12`. Kept HEAD's `0.2.20`. The incoming bump 0.2.11 -> 0.2.12
  is the version bookkeeping of the same already-landed commit and has since
  been superseded eight times on this branch; restoring 0.2.12 would move the
  version backwards.

## Incoming changes preserved

- `apps/control-app/wrangler.toml`: `git diff HEAD 0fe586d1 -- apps/control-app/wrangler.toml`
  reports 18 insertions / 94 deletions in the HEAD->incoming direction, i.e.
  HEAD is a strict superset of the incoming file in this region — every
  observability line the incoming commit authored is present in the resolved
  file, plus later additions. Verified by direct grep: `[observability]`,
  `[env.production.observability]`, `enabled = true`,
  `head_sampling_rate = 1`, and the production table's position after `routes`
  all hold.
- `tests/test_UAT_FC_BUG-37_observability.test.ts`: not conflicted; byte-identical
  between HEAD and the incoming commit (absent from the HEAD..incoming diff
  stat). No UAT function was deleted or altered.
- `package.json`: the incoming change is a version bump only, with no code
  content; its intent (a release bump accompanying the observability change)
  is already reflected in the branch's version history.

No hunk was dropped under the BUG-1301 precedence exception.

## Note for the finalize step

The staged tree has no net diff vs HEAD (`git status --porcelain` shows no
conflict and no staged modification), because this commit's effect is already
in HEAD via `a82ced7619`. This is the BUG-1109/BUG-1122 redundant-commit case,
not a discard: STEP 3's check confirms the incoming commit's key changes are
PRESENT in HEAD rather than absent. `--skip` was not called; the cherry-pick
sequencer state is left intact for `cherry_pick_finalize_resolution`.
