---
uid: report-e6d8a8cb
id: REPORT-2803
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T07:30:34.124604+00:00'
updated_at: '2026-08-31T07:30:34.124604+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/bug-8431c17b.md` — class **AA** (both added), intent/bookkeeping
  ticket (`bug-*`) → rule **2e**, strict-superset branch. Resolved to the INCOMING
  side in full.

  Both sides were byte-identical except for a single added frontmatter field on the
  incoming side:

  ```
   fields:
     ...
     bundled_in: bundle-cceaba25
  +  chat_comment: comment-6977d8df
  ```

  Every other byte matched — including `updated_at`, `completed_at`,
  `last_field_updated`, `status: free_and_reconciled`, `fields.commits`,
  `version: 0.0.183`, and the entire markdown body. Incoming is therefore a strict
  superset of ours, so no per-fact timeline arbitration was required: taking the
  superset preserves 100% of the HEAD side as well. No field was invented, and no
  `intent_uid` / `story_uid` / `capability_uid` was touched.

  Note on the auto-enrichment: the metadata block flagged "intent unknown on one or
  both sides — take the more recent commit by timestamp and flag for post-merge
  review." That arbitration was moot here because the superset relation is exact,
  and both the timestamp rule and the superset rule select the same content. No
  post-merge review is needed on content grounds.

  Path is under `.xgd/tickets/` with `core.sparseCheckout=true`, so the conflict
  existed in the index only — the working-tree copy carried no conflict markers
  (DOC-986 §2/§4.1). Resolved with a standalone `git checkout --theirs`, staged with
  a standalone `git add --sparse`.

## Incoming changes preserved

Verified by blob comparison, not by inspection:

- Staged blob (`git show :.xgd/tickets/hot/bug-8431c17b.md`) is **byte-identical** to
  incoming stage 3 (`0e934341fe441c0f18908c51bb9aba3f84142f48`) — `diff` returns
  empty.
- Diff of the staged blob against HEAD stage 2 (`f5f5eeb9...`) is exactly the one
  `+  chat_comment: comment-6977d8df` line — i.e. the incoming commit's sole change
  is present in the result.

No hunks were dropped, so the BUG-1301 precedence exception was not invoked. No code
or test files were involved in this conflict, so no UAT function was at risk.

### Dangling reference (informational, not a resolution defect)

The `chat_comment: comment-6977d8df` field points at a ticket that does not exist in
this worktree's ticket store (`find .xgd/tickets -name '*6977d8df*'` → no match) and
is not created by the incoming commit `0727375` either (that commit touches only
`bug-8431c17b.md`, 80 insertions, one file). The referenced comment ticket presumably
lands in a different commit of the bundle. Carrying the field forward is correct
regardless — rule 2e makes the incoming side authoritative for its own bookkeeping,
and dropping the field to make the reference resolve would be inventing a resolution
neither side authored. Flagging it only so the reference is checked once the bundle
finishes replaying.

## Cherry-pick state

`CHERRY_PICK_HEAD` (`072737515470a4ebea7a7f31c9a7d58638fa03a4`) left intact. No
`--continue` / `--skip` / `--quit` / `--abort` / `reset` was issued; git writes were
limited to `checkout --theirs` and `add --sparse` on the single conflicted path.

`git status --porcelain` shows no remaining conflict-class entries; the file stages
as `M `.
