---
uid: report-70c8f022
id: REPORT-2746
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T06:18:03.194024+00:00'
updated_at: '2026-08-31T06:18:03.194024+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/request-8467b1a3.md` — class **AA** (both added), intent/bookkeeping ticket. Rules **2b** (AA: one side strictly a superset → keep the superset) and **2e** (bookkeeping ticket: incoming added a field the other side never touched → keep the superset) agree. Resolved with `git checkout --theirs` + `git add --sparse` (path is outside the sparse-checkout cone, DOC-986 §2/§4.1).

  The two sides were identical except for a single added frontmatter field on the incoming side:

  ```
  @@ fields:
     bundled_in: bundle-77b28def
  +  chat_comment: comment-b9821b09
  ```

  The auto-enrichment listed both subjects as `xgd(ticket): update request request-8467b1a3` with intent unknown on one or both sides, and prescribed "take the more recent commit by timestamp and flag for post-merge review." No timeline arbitration was needed: the sides are not competing on any shared fact — incoming is a byte-exact superset of ours, so the superset rule resolves it without discarding anything from either side. Flagged here for post-merge review per that rule all the same.

## Incoming changes preserved

- `.xgd/tickets/hot/request-8467b1a3.md` — the incoming commit `75c027876cd27553a320dcd8ba3ca0bfa1ff0652` (`xgd(ticket): update request request-8467b1a3`, Sun Aug 23 12:50:05 2026 -0700) adds `chat_comment: comment-b9821b09`. That line is present in the resolved file at line 27. The resolved working-tree file hashes to `f634499fffb794e845149b511319256092d8c185`, identical to the incoming (stage 3) blob — every incoming change is preserved bit-for-bit, and nothing from the HEAD side was lost, since HEAD's blob was a strict subset.

No hunks were dropped; the BUG-1301 precedence exception was not invoked. No code, test, or config files were involved in this conflict.

Staging verified clean: `git status --porcelain` shows only `M  .xgd/tickets/hot/request-8467b1a3.md`, with no remaining UU/AA/DU/UD entries. The in-progress cherry-pick was left untouched — CHERRY_PICK_HEAD is still present for `cherry_pick_finalize_resolution`.
