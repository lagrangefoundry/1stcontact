---
uid: report-d6be7aa5
id: REPORT-5462
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-29T05:00:31.137874+00:00'
updated_at: '2026-09-29T05:00:31.137874+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/bug-3ade1af4.md` — UU, intent/bookkeeping ticket (STEP 2e).
  Conflict was confined to two frontmatter regions; the body merged cleanly.
  Resolved per-fact, not by picking a whole-file winner:
  - `status`: HEAD `free_and_reconciled` vs incoming `free_coded`. Same fact,
    both sides moved it off the base value `free_coding`. HEAD's value is the
    strictly later lifecycle position (and `updated_at` 2026-09-19T15:15:31Z vs
    incoming 2026-09-01T19:28:24Z, 18 days apart) → HEAD's fact taken.
  - `updated_at`, `last_field_updated`, `completed_at`: same fact, same
    later-intent rule → HEAD's values taken (`completed_at`
    2026-09-14T10:29:13Z, which the incoming side left `null`).
  - `bundled_in: bundle-8e1807f6`: HEAD-only addition, no incoming counterpart
    → kept.
  - `fields.commits[]` (`working_sha e5d76233…`) and `fields.version: 0.2.33`:
    added identically by BOTH sides → merged, present once.
  - `title`: base == incoming, HEAD edited it ("23 failures … ten UATs" →
    "27 failures + 30 collection errors … eleven UATs") → HEAD's edit applied
    cleanly by git, no conflict, no incoming intent discarded.

## Incoming changes preserved

Incoming commit `08bbde0676486bcaa09339999a9d1f3d0119407d`
("xgd(ticket): update bug bug-3ade1af4") touched exactly one file. Its full
diff against the merge base consists of four changes; every one is accounted
for in the resolved file:

1. `status: free_coding → free_coded` — superseded by HEAD's later
   `free_and_reconciled` on the same fact (genuine intent conflict, 2e rule).
   Not discarded silently: `free_and_reconciled` is downstream of `free_coded`
   in the lifecycle, so the incoming transition is subsumed, not lost.
2. `last_field_updated: body → status` — present (HEAD carries the same
   value `status`).
3. `fields.commits[]` + `fields.version: 0.2.33` — present verbatim.
4. Removal of the file's trailing newline — present (resolved file ends
   `…(node + workers projects).` with no final `\n`).

No code/implementation files were in conflict, so no BUG-1301 precedence
exception was invoked and no UAT function was touched.

## Staging state

`git add --sparse` applied; `git status --porcelain` is empty, i.e. the staged
result is byte-identical to HEAD — the incoming commit's effect is already
fully subsumed by HEAD's later state of this ticket. Per STEP 4, `--skip` was
NOT invoked; CHERRY_PICK_HEAD is left in place for the finalize step, which
will detect the empty staged diff and skip the commit.
