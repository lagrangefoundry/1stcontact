---
uid: report-78c4504e
id: REPORT-5727
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-30T10:26:45.528223+00:00'
updated_at: '2026-09-30T10:26:45.528223+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

# Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e

Picked commit `521eb9a150da4ac85bf9ce3a526d78ea8d9552f6` — "xgd(ticket): update bug
bug-93851fea", author 2026-09-15 18:48:36 -0700, +2/-2. HEAD `e70d1e699c`, anchor
`report-377b581e`, `prior_stage_failure` empty.

## Files resolved

| Path | Class | Resolution | Net change |
|---|---|---|---|
| `.xgd/tickets/hot/bug-93851fea.md` | `UU` (materialized, one region) | `--ours` | none |

Three stages: base `3c199f1a2c` / ours `f9b1247169` / theirs `2ac4f4330b`. Both sides
frontmatter-only; the 500-line body is byte-identical across all three.

Ours' blob `f9b1247169` is unchanged from `HEAD:.xgd/tickets/hot/bug-93851fea.md`, and
the base blob is the immediately preceding pick's (`cf8afea41c`) theirs blob — so the
queue is walking this ticket's commits in order and this is quartet position 4.

## Incoming changes preserved

Theirs' entire delta from base is two frontmatter lines:

- `updated_at` `2026-09-14T10:29:09.410155` → `2026-09-16T01:48:36.832553`
- `status` `free_and_reconciled` → `bundled` — a **backward** lifecycle write

Nothing else in the commit. `completed_at`, `last_field_updated`, `bundled_in`,
`fields`, `commits` and the whole body are untouched by theirs, and ours already
carries them identically.

**Both of theirs' changes are superseded by the incoming side's own later work, so
nothing incoming contributed is discarded:**

1. **The backward `status` write is reversed by incoming itself.**
   `git diff :2: xgd-working:.xgd/tickets/hot/bug-93851fea.md` is exactly one line —
   `updated_at` — with `status: free_and_reconciled` on both sides. xgd-working's own
   tip therefore holds the same terminal status ours does; this pick's `bundled` is a
   transient mid-lifecycle state that incoming subsequently undid
   (`free_and_reconciled` 09-14 → `bundled` 09-15 → `free_and_reconciled` 09-19).
   Keeping ours does not drop an incoming decision — it matches incoming's final one.

2. **`updated_at` is simply older on theirs.** Ours is
   `2026-09-19T15:15:30.393519`, five days after theirs' `2026-09-16T01:48:36.832553`,
   and is itself derived from the incoming side's own 09-19 state.

The lifecycle moving backward on xgd-working is why the enrichment's naive
"take the more recent commit by timestamp" rule is not load-bearing here; it happens
to agree with `--ours` in this case (ours' `updated_at` is the later one), but the
supersession diff above is what settles it.

Result: `git status --porcelain` and `git diff --cached --stat HEAD` are both
completely empty, `CHERRY_PICK_HEAD` intact, HEAD unmoved at `e70d1e699c`. Finalize
will skip the commit.

## Arbitration of last resort (BUG-1460)

Not applicable — STEP 3h never fired. The per-fact timeline was decisive on both
diverging facts.

## Forecast for the remaining pick on this path

One pick remains on `bug-93851fea`, and **it is the exception — it is NOT `--ours`**:

- the xgd-working tip (`16ccbbac82` as of earlier runs; identify it by content and
  author date 2026-09-19 15:15:43, not by that SHA — per-pick SHAs have been observed
  to change between runs on this branch). Ours-vs-tip is exactly one line:
  `updated_at` `2026-09-19T15:15:43.971601` vs ours' `2026-09-19T15:15:30.393519`
  (13.6 s later). Every other field is byte-identical, so incoming wins that one fact
  and the resolution should take theirs' `updated_at`.

Cheap re-verify for that pick: `git diff :2: :3:` should reduce to the single
`updated_at` line above.
