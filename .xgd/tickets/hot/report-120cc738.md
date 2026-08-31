---
uid: report-120cc738
id: REPORT-2701
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T05:30:01.728048+00:00'
updated_at: '2026-08-31T05:30:01.728048+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/bug-3aa2d0c9.md` — **AA (both added)**, intent/bookkeeping
  ticket (bug-*), so rules **2b** (AA: keep the superset, incoming wins if it is
  the larger version) and **2e** (intent ticket: incoming only added a field the
  other side never touched → keep the superset) both point the same way.
  Resolution: took **theirs** wholesale.

  Index-only conflict — the path is outside the sparse-checkout cone
  (DOC-986 §2/§4.1), so the working tree carried the OURS content with no
  conflict markers. Resolved with `git checkout --theirs --` then
  `git add --sparse --`.

  The auto-enriched metadata reported "intent unknown on one or both sides →
  take the more recent commit by timestamp, flag for post-merge review." That
  tie-break was not needed: the two sides are not competing. A blob-level diff
  of stage 2 vs stage 3 is a **single added line** and nothing else — theirs is
  a strict superset of ours, so no fact is contested and no timeline lookup can
  change the answer. Flagging for post-merge review is therefore not warranted
  for this file.

## Incoming changes preserved

Incoming commit `fa18acac792e81d969d48b215f54574dbb27e947`
("xgd(ticket): update bug bug-3aa2d0c9", Martin Westhead, 2026-08-23).

The entire delta between the two sides is one line in the `fields:` block:

```
   version: 0.0.180
   story_points: 1
   bundled_in: bundle-cceaba25
+  chat_comment: comment-b2175fc6
 ---
```

Verified present in the resolved file at `.xgd/tickets/hot/bug-3aa2d0c9.md:25`.
Every other line — frontmatter (`uid`, `id`, `title`, `status: free_and_reconciled`,
`commits[].working_sha`, `version`, `story_points`, `bundled_in`) and the full
prose body (Resolution / Deliverable / Acceptance sections) — is byte-identical
on both sides, so taking theirs discards nothing authored on the HEAD side.

Staged result: `M .xgd/tickets/hot/bug-3aa2d0c9.md`, 1 file changed, 1 insertion.
No conflict-class entries remain in `git status --porcelain`. `CHERRY_PICK_HEAD`
left intact for `cherry_pick_finalize_resolution`.

No code/implementation files were involved, so no BUG-1301 precedence exception
was invoked and no hunk was dropped.
