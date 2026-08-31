---
uid: report-7f4c8695
id: REPORT-2832
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T08:06:40.545640+00:00'
updated_at: '2026-08-31T08:06:40.545640+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/request-c0435b4c.md` — class **AA** (both added), intent/bookkeeping ticket (2e) resolved under **2b superset rule**. Both sides independently added the file; the two blobs are identical except that the incoming side (stage 3, `05fd5f36`) carries one additional frontmatter field the HEAD side (stage 2, `eed002ca`) lacks:

      + chat_comment: comment-f4d684d3

  No removals, no competing edits to any shared field — incoming is a strict superset, so incoming was taken whole via `git checkout --theirs` + `git add --sparse` (path is outside the sparse-checkout cone, DOC-986 §2/§4.1; the conflict existed only in the index, with no working-tree markers).

  The conflict-intent enrichment reported "intent unknown on one or both sides / take the more recent commit and flag for review." That fallback was not needed: the two sides are not competing on any fact, so the superset rule resolves it without a timeline lookup and without discarding anything from either side. No post-merge review flag is warranted.

## Incoming changes preserved

- `.xgd/tickets/hot/request-c0435b4c.md` — verified. The incoming commit `9ba78e23ecf11c2296497688acad79a13d9ac1a4` ("xgd(ticket): update request request-c0435b4c", 2026-08-23) adds this file with 197 lines. `git diff --cached 9ba78e23 -- <path>` returns **empty**: the staged resolution is byte-identical to the incoming commit's version of the file. The `chat_comment: comment-f4d684d3` field is present at line 23 of the staged file.

No hunks were dropped. The BUG-1301 precedence exception was not invoked. No test files were touched, so 2f did not come into play.

Cherry-pick sequencer state left intact: `CHERRY_PICK_HEAD` still present. No `--continue`/`--skip`/`--quit`/`--abort`/`reset` was run; the only git writes were `checkout --theirs` and `add --sparse` on the single conflicted path.
