---
uid: report-9b91adf6
id: REPORT-3371
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-23'
created_by: xgd
created_at: '2026-09-02T21:37:08.665775+00:00'
updated_at: '2026-09-02T21:37:08.665775+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-23
---

## Files resolved

- `.xgd/tickets/hot/bundle-78f4e2fe.md` — class **AA** (both added), intent/bookkeeping
  ticket (rule 2e, per-fact timeline). Resolved to the **HEAD** side via
  `git checkout --ours` + `git add --sparse`.

  Incoming commit: `efdc5802dbeffa2254dcc3fc00ec12a873e64560`
  "xgd(ticket): create bundle bundle-78f4e2fe" (2026-08-26 10:36:26 -0700).
  HEAD-side tip for this file: `4b197af0ebe8f4f362816b9796c71212a19daa66`
  "xgd(ticket): update bundle bundle-78f4e2fe" (2026-08-31 12:19:50 -0700).

  The two blobs differ in exactly two places:

  1. **Frontmatter lifecycle state.** Incoming is the ticket's creation state
     (`status: ready_to_reconcile`, `completed_at: null`,
     `last_field_updated: created_at`, `updated_at` == `created_at`, and five
     unreconciled `fields.commits` rows starting `ea48502d0d90bb...`). HEAD is the
     same ticket advanced through its lifecycle (`status: free_and_reconciled`,
     `result: pass`, `completed_at` set, `merged_at_commit:
     96a76934e010d272feb2d2bfc2b5d9645db10fe8`, 21 `orphan_commits` old→new
     mappings, and the collapsed single `commits` row).

     These are the same facts written differently on each side, so the 2e
     per-fact timeline rule applies — and it resolves unambiguously to HEAD,
     because the incoming side is a **strict ancestor** of the HEAD side rather
     than a competing edit. `xgd ticket history bundle-78f4e2fe` shows commit
     `fda503e7857e4257ec156c47fb6b71a8d46a78a9` (2026-08-31 12:19:32) taking this
     file *from* exactly the incoming side's frontmatter (`status: reconciling`
     with the same five `working_sha` rows headed by `ea48502d0d90bb...`) *to*
     `free_and_reconciled` with the collapsed `commits` row. `4b197af0eb` then
     appended `result: pass`.

     Taking the incoming side would have reverted an operator-owned status
     transition — rewinding an already-merged bundle from `free_and_reconciled`
     back to `ready_to_reconcile` and re-introducing five superseded
     unreconciled commit rows. No field present only on the incoming side was
     dropped: every one of them exists in HEAD's ancestry and was overwritten by
     HEAD's own later, legitimate lifecycle operations.

  2. **Trailing newline at EOF.** The ~620-line markdown body is byte-identical
     on both sides; the incoming blob ends with a newline and the HEAD blob does
     not. Whitespace only, no content difference.

  No `fields.intent_uid` / `story_uid` / `capability_uid` were touched, and no
  content absent from both sides was invented.

## Incoming changes preserved

No code/implementation files were in conflict — the sole conflicted path is a
bundle bookkeeping ticket.

For that ticket, the incoming commit's content is fully present in HEAD by a
different route rather than discarded:

- **Body**: identical on both sides (modulo the EOF newline), so the incoming
  text is present verbatim in the resolved file.
- **Frontmatter**: the incoming creation state is present in HEAD's recorded
  history (`fda503e785`'s pre-image is the incoming state) and was superseded
  there by later in-repo lifecycle updates.

This is the BUG-1109/BUG-1122 redundant-commit shape, not the STEP 3 discard
shape: the incoming commit's key changes are present in HEAD, so the staged tree
correctly nets to no diff vs HEAD (`git diff --cached HEAD` is empty,
`git ls-files -u` is empty). Per STEP 4 the cherry-pick was left untouched —
no `--skip`/`--continue`/`--abort` was issued and `CHERRY_PICK_HEAD` is still
present for `cherry_pick_finalize_resolution` to act on.

No hunks were dropped under the BUG-1301 precedence exception; no test files
were involved.
