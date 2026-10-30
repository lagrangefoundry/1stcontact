---
uid: report-9bc81c7f
id: REPORT-5423
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-29T02:26:18.396041+00:00'
updated_at: '2026-09-29T02:26:18.396041+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/request-6893f6ea.md` — **UU**, intent/bookkeeping ticket (`request-*`), rule **2e** (per-fact timeline resolution). Two conflicted hunks, both frontmatter-only; no body/prose divergence.
  - Hunk 1 (`updated_at` / `status`): OURS `status: bundled`, `updated_at: 2026-09-09T21:32:50`; THEIRS `status: free_coded`, `updated_at: 2026-09-01T01:22:19`. Same fact changed on both sides → genuine conflict → later-positioned intent wins → **kept OURS**. The incoming transition `free_coding → free_coded` is a strictly earlier point on the same lifecycle path that HEAD has already advanced past (`free_coded → bundled`); replaying it would regress the stage.
  - Hunk 2 (`fields.bundled_in`): present only on OURS (`bundle-87be4669`), absent on THEIRS. Non-overlapping field → **kept OURS**. It is the companion fact to `status: bundled`; dropping it would leave the bundled stage with an orphaned bundle reference.
  - Staged with `git add --sparse` — `.xgd/tickets/` is outside this resync worktree's sparse-checkout cone (DOC-986 §2/§4.1), so the conflict existed in the index only, with no working-tree markers.

## Incoming changes preserved

- `.xgd/tickets/hot/request-6893f6ea.md` — the incoming commit `f20ff760fc` ("xgd(ticket): update request request-6893f6ea") carried three changes. Verified against `git show f20ff760fc -- .xgd/tickets/hot/request-6893f6ea.md`:
  - `fields.commits` (`working_sha: 27450010586c65b293b2ad5cc6243815133a17be`, `reconcile_sha: null`, `main_sha: null`) — **present** in the resolved file (lines 19–22). Merged cleanly outside the conflict regions; no action needed.
  - `fields.version: 0.2.27` — **present** in the resolved file (line 23). Merged cleanly.
  - The `status` / `updated_at` transition — **intentionally not taken**, per the per-fact genuine-conflict rule in 2e as detailed above. This is the one substantive incoming fact superseded, and it is superseded by a later transition on the same field, not discarded in favour of unrelated content.

No BUG-1301 precedence exception was invoked; no test file was touched; no code file was involved in this conflict.

## Note on net effect

Every part of `f20ff760fc` is now either already present in HEAD (the `commits` list and `version`) or superseded by a later HEAD-side transition (the `status` fact). The resolved tree is therefore byte-identical to HEAD and `git status --porcelain` reports clean — the patch is a no-op. Per STEP 4, no `--skip` was issued; the finalize step should detect the empty staged diff and skip the commit.
