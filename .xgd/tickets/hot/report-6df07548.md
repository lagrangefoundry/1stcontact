---
uid: report-6df07548
id: REPORT-4840
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-23T18:19:25.057637+00:00'
updated_at: '2026-09-23T18:19:25.057637+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/bug-034bf955.md` — **UU**, intent/bookkeeping ticket (STEP 2e).
  Resolved by taking HEAD wholesale, then `git add --sparse` (path is
  outside the sparse-checkout cone on this resync branch, DOC-986 §2/§4.1).

  Rationale: HEAD is a strict superset of the incoming side, not a
  competing edit.
  - **Body**: byte-for-byte identical on both sides (Symptom / Root cause /
    Fix / Test plan). The incoming commit `24b0c044bc` is the one that
    filled the ticket in from its `(new ticket)` draft stub; HEAD already
    contains that exact body. Only difference: HEAD lacks a trailing
    newline. Kept HEAD's form — it is what the most recent xgd write
    produced on disk.
  - **Frontmatter**: no field is changed differently on the two sides;
    HEAD is uniformly further along the same lifecycle.
    - `status`: incoming `free_coding` → HEAD `free_and_reconciled`
    - `updated_at`: incoming `2026-09-01T21:10:09Z` → HEAD `2026-09-19T15:15:29Z`
    - `completed_at`: incoming `null` → HEAD `2026-09-14T10:29:07Z`
    - HEAD additionally carries `commits[]`, `version: 0.2.36`,
      `story_points: 3`, `bundled_in: bundle-8e1807f6` — fields absent
      from the incoming side entirely, so no per-fact contest.

    The auto-enrichment marked intent unknown on both sides (identical
    subjects, `xgd(ticket): update bug bug-034bf955`) and prescribed
    "take the more recent commit by timestamp." That rule and the 2e
    superset rule agree here: HEAD is both later and strictly larger.

## Incoming changes preserved

No code/implementation files were in conflict — the sole conflicted path
is a bookkeeping ticket, so STEP 3's `git show $CPHEAD -- <file>`
verification applies only to it.

Every substantive change the incoming commit introduces is present in the
resolved file:
- the full ticket body (Symptom, Root cause, Fix, Test plan) — identical text
- `title`, `severity: medium`, `last_field_updated: status`
- the `status` transition off `draft`, superseded further by HEAD's
  `free_and_reconciled`

Nothing from the incoming side was discarded. The BUG-1301 precedence
exception was not invoked; no hunk was dropped.

## Note for post-merge review

Per the enrichment's "flag this file for post-merge review" instruction:
the staged tree for this path is identical to HEAD, so this cherry-pick
will produce an empty commit. That is expected — patch `24b0c044bc` is
fully superseded. `--continue`/`--skip` were NOT invoked; the finalize
step owns that decision.
