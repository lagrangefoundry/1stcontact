---
uid: report-c7e44f81
id: REPORT-4599
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-21T00:47:58.748411+00:00'
updated_at: '2026-09-21T00:47:58.748411+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/bundle-b3b7c399.md` — **UU**, intent/bookkeeping ticket (STEP 2e; `bundle-*` lives in `hot` but is a bookkeeping ticket, not a matrix-defining spec ticket). Single conflict hunk, confined to the YAML frontmatter; **took OURS (HEAD)**. Staged with `git add --sparse` (path is outside the resync branch's sparse-checkout cone, DOC-986 §2/§4.1).
  - OURS: `updated_at: 2026-08-31T14:23:04`, `completed_at: 2026-08-31T14:22:24`, `last_field_updated: result`, `status: free_and_reconciled`
  - THEIRS: `updated_at: 2026-08-28T03:59:15`, `completed_at: null`, `last_field_updated: status`, `status: reconciling`
  - Both sides changed the *same facts* (status / completed_at / updated_at) differently → genuine intent conflict, so the later-positioned intent wins per 2e. Confirmed by commit timestamp, matching the auto-enrichment rule for this file ("take the more recent commit by timestamp"): HEAD-side `8e07e6015` (2026-08-31 07:23:04 -0700) is **4 days later** than incoming `d13c42a57` (2026-08-27 20:59:15 -0700).
  - Lifecycle direction corroborates it: incoming moves `ready_to_reconcile` → `reconciling`, an *earlier* state than HEAD's `free_and_reconciled`, which `ticket_types.yaml:539` documents as "reconcile completed, ff_push'd to main". `xgd ticket history bundle-b3b7c399` shows HEAD reached that terminal state later via `a0b52c93a` (set `free_and_reconciled` + `completed_at`) then `8e07e6015` (recorded `result: pass`).
  - Taking THEIRS would have regressed a completed bundle back into mid-reconciliation *and* left the frontmatter self-contradictory: `status: reconciling` alongside the unconflicted `fields.main_sha: eef7a8b48`, `fields.merged_at_commit`, and `result: pass`, which exist only because reconciliation finished.
  - Nothing outside the single frontmatter hunk was touched: the body, `fields.commits`, and all orphan-commit entries are byte-identical to HEAD.
  - **Flagged for post-merge review** per the enrichment rule (intent unknown on one or both sides).

## Incoming changes preserved

No code/implementation files were in conflict, so STEP 3's "incoming is authoritative" verification does not apply to any file in this resolution.

`git show d13c42a57 -- .xgd/tickets/hot/bundle-b3b7c399.md` shows the incoming hunk's sole effect is the status transition `ready_to_reconcile` → `reconciling` (+ its `updated_at` bump). That transition is **deliberately not present** in the resolved version — not dropped under the BUG-1301 precedence exception, but because 2e's timeline rule adjudicates it: it is an older, superseded bookkeeping state for the same fact, and HEAD already carries the downstream terminal state reached 4 days later. No developer code, spec content, or test function was discarded.

This is the second consecutive commit in the resync queue to conflict on this file with the same shape (the prior attempt resolved `d13c42a57`'s predecessor `726b77db2`, `reconciling` → `ready_to_reconcile`, identically). Both are replays of the same superseded status-churn sequence against a HEAD that already holds the terminal state.

## Staging state

`git ls-files -u` is empty and `git status --porcelain` is clean — no `UU`/`AA`/`DU`/`UD` entries remain. `CHERRY_PICK_HEAD` is intact at `d13c42a577203577b1efec91119c31c8bd8ef69b`; no `--continue`/`--skip`/`--quit`/`--abort` was issued.

`git diff --cached HEAD` is **empty**: the resolution is byte-identical to HEAD, so this cherry-pick is a no-op. That is the expected resync path (`cherry_pick.py:2631`, BUG-1110/BUG-1122) — a resync queue can legitimately replay effects already landed via another route. The finalize step will detect the clean staged diff and record the commit as *skipped*, not discarded.
