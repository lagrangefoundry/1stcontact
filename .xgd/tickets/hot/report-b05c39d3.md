---
uid: report-b05c39d3
id: REPORT-2724
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T05:54:32.370942+00:00'
updated_at: '2026-08-31T05:54:32.370942+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/request-150b5ebf.md` — class **AA** (both added), intent/bookkeeping ticket (§2e). Sparse-cone path, so the conflict existed only in the index (no working-tree markers); resolved with `git checkout --theirs` + `git add --sparse`.
  - Rule applied: **strict superset → keep the superset**. Diff of index stage 2 (ours, `7816f6b1`) vs stage 3 (theirs/incoming, `0c15d5fd`) is a single added line in the `fields:` block: `chat_comment: comment-57c30ff9`. Ours contains nothing that theirs lacks — every other byte of the 56-line ticket (frontmatter, scope, acceptance criteria, consolidated scope, "what was implemented") is byte-identical on both sides. Taking incoming loses nothing from HEAD, so no per-fact timeline lookup was needed (no fact is changed differently on the two sides).
  - This also agrees with the enrichment rule for this file (ours = `sync_working_to_main` from xgd-working b8606f0d68b7; theirs = the free-coded `xgd(ticket): update request request-150b5ebf`, 42d3ca20, 2026-08-23): incoming is authoritative and is also the later, richer version.

## Incoming changes preserved

- `.xgd/tickets/hot/request-150b5ebf.md`: `git show 42d3ca20dad7c130432797977867d4d64f85fe42 -- <file>` adds the file with 57 lines. Its only content not already present on the HEAD side is `fields.chat_comment: comment-57c30ff9`, which is present in the resolved file at line 22. The staged diff vs HEAD is exactly that one added line — i.e. the incoming commit's full net effect against this branch is preserved, nothing discarded.

No code/implementation files were in conflict. No hunks were dropped; the BUG-1301 precedence exception was not invoked. No test functions were touched. Cherry-pick sequencer state (CHERRY_PICK_HEAD) left intact for `cherry_pick_finalize_resolution`.
