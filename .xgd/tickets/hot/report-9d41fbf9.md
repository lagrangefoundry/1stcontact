---
uid: report-9d41fbf9
id: REPORT-3565
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-26'
created_by: xgd
created_at: '2026-09-09T23:04:14.995063+00:00'
updated_at: '2026-09-09T23:04:14.995063+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-26
---

## Files resolved

- `.xgd/tickets/hot/request-7ae3c2cc.md` — **UU**, intent/bookkeeping ticket (rule **2e**).
  Resolved by taking the HEAD side, which is a strict superset of the incoming side.

  Per-fact analysis (base `1070c734e2` → each side):
  - `fields.commits` — the incoming commit's entire substantive payload (BUG-1265 data
    fix: fold orphaned `working_sha 055378794f49f1dc39b20fdcf54aa7fa0b1190e3` into the
    surviving entry's `working_sha_history` and drop the orphan `commits` entry). Both
    sides made the **identical** edit — byte-for-byte the same three-line result. Not a
    competing fact; no choice required.
  - `status` / `completed_at` / `updated_at` — same fields changed differently, so the
    timeline rule applies per-fact. Incoming (`7c91ff7863`, 2026-08-23 18:14 -0700) sits
    at `ready_to_reconcile` / `completed_at: null`. HEAD (`decf67f54a`, 2026-08-31 07:22
    -0700) has advanced to `free_and_reconciled` with `completed_at` set. HEAD is the
    later-positioned intent, and it is a workflow status advancement — taking incoming
    here would silently revert an operator-owned status backwards.
  - `fields.bundled_in: bundle-b3b7c399` — present only on HEAD, untouched by incoming.
    Non-overlapping addition; kept.
  - `last_field_updated` — a derived marker of each side's own last write; follows the
    kept side (`status`, HEAD's).
  - Ticket body (everything below the frontmatter) — identical on both sides.

  Nothing was invented; every retained line is present on at least one side.

## Incoming changes preserved

- `.xgd/tickets/hot/request-7ae3c2cc.md` — **preserved**. Verified against
  `git show 7c91ff7863 -- <path>`: the commit's only substantive hunk is the
  `working_sha_history` merge, and `git show HEAD:<path>` confirms
  `055378794f49f1dc39b20fdcf54aa7fa0b1190e3` is present in the surviving entry's
  `working_sha_history` with the orphaned `commits` entry removed. The dispatcher's
  purple/stale-commit flag that this commit set out to clear is therefore already
  cleared in the resolved tree.

  The commit's remaining lines (`updated_at`, `last_field_updated`) are bookkeeping
  metadata about the commit's own write, not developer content, and are superseded by
  HEAD's later write to the same fields.

No hunks were dropped under the BUG-1301 precedence exception; no code or test files
were involved in this conflict.

## Note for the finalize step

This resolution nets to **no diff vs HEAD** — HEAD already carried the incoming commit's
effect through the later `decf67f54a` write. Per STEP 4 this is the redundant-commit
case, not the discarded-commit case (STEP 3's check passes: the incoming key change is
present in HEAD, not absent). Staged and left for
`cherry_pick_finalize_resolution` to skip; `CHERRY_PICK_HEAD` is untouched.

## Post-merge review flag

The auto-enrichment reported intent unknown on one or both sides, and its fallback rule
(take the more recent commit by timestamp) points at the same answer reached above —
HEAD, 2026-08-31, is the more recent. Flagged for post-merge review per that rule, though
the two sides' only genuine disagreement was the status advancement.
