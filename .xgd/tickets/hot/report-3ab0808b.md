---
uid: report-3ab0808b
id: REPORT-2789
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T07:12:41.024219+00:00'
updated_at: '2026-08-31T07:12:41.024219+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/doc-5ecc3343.md` — **AA (both added)**, doc ticket (bookkeeping, rule 2b + 2e).
  Both sides added the same 193/194-line architecture research doc. The only
  difference between stage 2 (ours) and stage 3 (theirs) is a single added
  frontmatter field on the incoming side:

      fields:
        doc_kind: architecture
        system_kb: true
      +  chat_comment: comment-32293ac9

  Incoming is a strict superset of HEAD — no field, section, or prose line
  present on the ours side is absent from theirs. Resolved by taking the
  superset (`git checkout --theirs`), which is both the 2b superset rule and
  the 2e strict-superset rule, and also matches the hard rule that the
  incoming `free_coded` side is authoritative. No timeline lookup was needed:
  there is no competing fact, only an addition.

  Note on the auto-enriched metadata: it flagged "intent unknown on one or
  both sides, take the more recent commit and flag for post-merge review."
  That tiebreaker never engages here because the two sides do not disagree
  about any fact — the resolution is a pure union, so both the timeline rule
  and the superset rule select the same content. Flagging for post-merge
  review is therefore not warranted.

## Incoming changes preserved

- `.xgd/tickets/hot/doc-5ecc3343.md` — confirmed. The incoming commit
  `e9418de5e0826e5533382e471174eda4fdccc1e5` adds the file with 195 lines;
  its distinguishing content versus HEAD is `chat_comment: comment-32293ac9`.
  Verified two ways after resolution:
  - working tree is byte-identical to stage 3 (`diff -u` clean);
  - the staged blob (`git show :<path>`) contains `chat_comment: comment-32293ac9`
    at line 16.

No hunks were dropped. The BUG-1301 precedence exception was not invoked, and
no test functions were touched — the only conflicted path is a documentation
ticket. No code or UAT files were in conflict for this commit.

Staging state after resolution: `M  .xgd/tickets/hot/doc-5ecc3343.md`, no
remaining UU/AA/DU/UD entries. CHERRY_PICK_HEAD left in place for
cherry_pick_finalize_resolution.
