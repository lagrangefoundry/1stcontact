---
uid: report-c366be69
id: REPORT-4618
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-21T04:18:32.172270+00:00'
updated_at: '2026-09-21T04:18:32.172270+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/doc-14f256a7.md` (DOC-8, "Builder UI Architecture Principles") — **AA (both added)**, doc ticket outside the sparse-checkout cone. Rule applied: §2b / §2e *"one side is a strict superset — keep the superset"*. Resolved to **ours** via `git checkout --ours` + `git add --sparse`.

  **Why ours is the superset.** The incoming commit is `6c7e26a` — *"field: retire system_kb boolean; membership moves to doc_kind (DOC-39 3.3)"*, which in the incoming lineage appears as a whole-file add (300 insertions). Replaying `xgd ticket history` on both sides shows HEAD already contains that exact operation as `48103a6` (identical subject, identical author timestamp `Mon Aug 31 12:43:36 2026 -0700`), plus one strictly later commit on top:

  - `48103a6` — retire `system_kb` boolean (the incoming commit, already integrated)
  - `b55ee13` — *"content edit: answer open item 4 — the Library tab and the two upload routes (REQ-161)"*

  The only two textual deltas between the sides are both consequences of `b55ee13`: the frontmatter (`updated_at` `19:43:36` → `21:47:36`, `last_field_updated` `system_kb` → `body`) and §10 open question 4 (unanswered → answered, citing REQ-161 / DOC-38 §4.2). There is no fact the incoming side changed that ours changed differently — ours simply carries a later edit to a different aspect of the ticket. Taking theirs would have reverted the REQ-161 answer.

## Incoming changes preserved

- `.xgd/tickets/hot/doc-14f256a7.md` — **preserved in full.** The incoming commit's substantive effect is the removal of `system_kb: true` from `fields:`, leaving `doc_kind: architecture` as the sole field. Verified present in the staged index content: frontmatter `fields:` contains only `doc_kind: architecture`, with no `system_kb` key. No incoming hunk was dropped; the BUG-1301 precedence exception was not needed and was not invoked.

## Note on the staged result

The resolution is byte-identical to HEAD, so `git diff --cached` is empty — this commit's effect had already landed on the resync branch through `48103a6`. Per STEP 4, this was staged and reported normally rather than skipped here; the finalize step will detect the empty staged diff and skip the commit. `CHERRY_PICK_HEAD` was left in place and no `cherry-pick --continue/--skip/--quit/--abort` was issued.
