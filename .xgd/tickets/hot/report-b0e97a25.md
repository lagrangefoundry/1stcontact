---
uid: report-b0e97a25
id: REPORT-5833
type: report
title: 'Resync resolve conflicts: ec118d67626fd31cfce67ca88dc9908ecdde70ed'
created_by: xgd
created_at: '2026-10-02T22:57:56.482784+00:00'
updated_at: '2026-10-02T22:57:56.482784+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

# Resync conflict resolution — BUG-164 `52827e75e2`

**Picked commit:** `52827e75e2ee5335a28072c3a94aea2b0a9d43c1` — fix(gate): a declared stack no longer hides words painted beneath it [FREE-CODED] (2026-09-30 14:40:27 -0700)
**HEAD at resolution:** `eaef8a038d`
**Apply target:** `ec118d67626fd31cfce67ca88dc9908ecdde70ed`
**prior_stage_failure:** empty (first attempt, no-progress count 1)

## Conflict

One `UU` path, one region: `package.json`
(base `98f85315bf` / ours `b04a3034ba` / theirs `5c38fe097d`). The pick's other
three paths applied cleanly.

## Cause

Monotone `version` counter collision. Base `0.2.421`, ours `0.2.422` (HEAD's
`4e0930f8d5`, "a silent delegation says whether it wrote…", itself an
xgd-working FREE-CODED pick already integrated on this branch), theirs
`0.2.423`. Both `git diff :1: :2:` and `git diff :1: :3:` are exactly that one
line, so nothing else in the file needed adjudicating.

## Resolution

`git checkout --theirs -- package.json` → `0.2.423`. Incoming is ours + 1: the
pick's bump is the next value in the sequence, and keeping `.422` would drop
the pick's own bump and leave the next pick conflicting on the same line. This
agrees with §2g (scalar config conflict, incoming wins) and with the
enrichment's timestamp rule (incoming 14:40:27 vs ours 14:23:08), though the
counter order — not wall-clock order — is what decides it.

Net change to `package.json` vs HEAD: `-0.2.422` / `+0.2.423`.

## Checks

- Staged paths == the pick's four paths (`package.json`,
  `tests/test_UAT_FC_BUG-164_stacked_overlap_paint_order.test.ts`,
  `tools/generate/src/cli/gate-core.ts`, `tools/generate/src/l1/probes.ts`);
  nothing outside the pick's diff is staged.
- No conflict markers remain; `CHERRY_PICK_HEAD` intact, HEAD unmoved.
- `tests/test_UAT_FC_BUG-164_stacked_overlap_paint_order.test.ts`: NOT VERIFIED —
  0 tests ran. The suite fails at import with `Cannot find package 'miniflare'`
  (`tools/generate/src/fonts/seed.ts:66`, reached via `cli/font-mirror.ts`).
  `miniflare` is declared in `tools/generate/package.json` but not installed in
  the resync worktree; this is a pre-existing worktree condition that hits any
  test importing `font-mirror.ts`, not something this pick introduced.

## Flag for post-merge review

- `package.json` — nothing to review beyond the one-line version; this
  discharges the enrichment's review flag.
- Run the BUG-164 vitest file in a checkout with `miniflare` installed; the
  auto-merged `gate-core.ts` / `probes.ts` changes are unverified here.
