---
uid: report-2bffd783
id: REPORT-5251
type: report
title: 'Resync resolve conflicts: b6b7f564f0bf1ee0904f0b6aa25ee3ca053055f0'
created_by: xgd
created_at: '2026-09-28T02:01:26.492879+00:00'
updated_at: '2026-09-28T02:01:26.492879+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/request-554ac441.md` — **UU**, intent/bookkeeping ticket
  (`request-*`), rule **2e**. Resolved to the HEAD side in full (staged blob
  `85e97c81`, byte-identical to index stage 2). The path is outside the
  sparse-checkout cone, so `git checkout --ours` wrote the file but left all
  three index stages behind; cleared with `git add --sparse` (DOC-986 §2/§4.1).

  Three-way read of the two hunks:

  | fact | base (`5ac40b49`) | incoming `e611edba` (Aug 24 02:10Z) | HEAD (Aug 31 14:22Z) |
  |---|---|---|---|
  | `status` | `ready_to_reconcile` | `bundled` | `free_and_reconciled` |
  | `completed_at` | null | null | `2026-08-31T14:22:34Z` |
  | `fields.bundled_in` | absent | `bundle-b3b7c399` (added) | `bundle-b3b7c399` **already present** |
  | `fields.chat_comment` | absent | absent | `comment-98e86f10` |

  Per 2e this is not a genuine per-fact conflict: HEAD is a strict superset of
  incoming, so the superset is kept. Incoming's only two edits are
  `status: ready_to_reconcile → bundled` and the addition of
  `bundled_in: bundle-b3b7c399`. `bundled_in` is already on HEAD — it sits in
  unconflicted context at line 51, which is precisely why only the two
  surrounding hunks conflicted — and HEAD's `status` has advanced two lifecycle
  steps past `bundled` to `free_and_reconciled` with `completed_at` set.

  Taking incoming on either hunk would have regressed the lifecycle
  (`free_and_reconciled` → `bundled`), nulled `completed_at`, and dropped
  `chat_comment`, while adding nothing, since its one field addition is
  already present. The second hunk conflicted only because HEAD's
  `chat_comment` line lands immediately after the line incoming added —
  adjacency, not competing intent.

  The auto-enrichment marked intent unknown on both sides (both subjects are
  the bare `xgd(ticket): update request request-554ac441`) and prescribed the
  more-recent-by-timestamp side: that is HEAD (Aug 31 vs Aug 24), which agrees
  with the superset reading above. **Flagged for post-merge review** per that
  rule, though the per-fact table shows nothing in dispute.

## Incoming changes preserved

No code/implementation files were in conflict — the sole conflicted path is a
bookkeeping ticket, so STEP 3's `git show $CPHEAD -- <file>` verification
applies to it only, and was performed: `e611edba` touches exactly one file with
3 insertions / 2 deletions, all of it frontmatter.

Both of incoming's substantive edits are accounted for in the resolved version:

- `fields.bundled_in: bundle-b3b7c399` — **present** on HEAD already,
  unconflicted at line 51. Verified by reading the resolved file directly.
- `status: bundled` — **superseded**, not discarded. HEAD carries
  `free_and_reconciled`, which is downstream of `bundled` in the ticket
  lifecycle; the bundling step incoming records is a precondition that HEAD's
  state already implies, and `bundled_in` documents it.

No BUG-1301 precedence exception was invoked: nothing was deleted, no UAT test
functions were involved, and no hunk was dropped on the grounds of a prior
refactor.

## Note for the sequencer

`git status --porcelain` is now completely empty: the resolution is identical to
HEAD, so this cherry-pick carries no net change. Expected — HEAD already held
the commit's entire substance. Per STEP 4 this was staged and left alone rather
than skipped; finalize should detect the clean staged diff and skip the commit.
`CHERRY_PICK_HEAD` is intact at `e611edba0bae2d5fd457263717557d26e2ed4a73`.
