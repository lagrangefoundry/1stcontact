---
uid: report-4640fada
id: REPORT-3539
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-26'
created_by: xgd
created_at: '2026-09-09T22:16:18.612853+00:00'
updated_at: '2026-09-09T22:16:18.612853+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-26
---

## Files resolved

- `.xgd/tickets/hot/request-7ae3c2cc.md` (REQ-148) — **AA (both added)**, index-only
  conflict (`.xgd/tickets/` is outside the sparse-checkout cone, DOC-986 §2/§4.1).
  Class 2e (intent/bookkeeping ticket) with the enrichment's timeline rule.
  Resolved to **ours (HEAD)** via `git checkout --ours` + `git add --sparse`.

  The incoming commit `773e1698` (2026-08-23) is a ticket-only update — 1 file,
  303 insertions, no code. Diffing the two blobs, the **markdown body is
  byte-identical on both sides**; every difference is lifecycle frontmatter, and
  every differing fact is the *same* fact recorded at two different points of this
  ticket's own lifecycle:

  | Fact | Ours (HEAD, commit `decf67f5`, 2026-09-01) | Theirs (`773e1698`, 2026-08-23) |
  |---|---|---|
  | `status` | `free_and_reconciled` | `ready_to_reconcile` |
  | `completed_at` | `2026-08-31T14:22:36` | `null` |
  | `updated_at` | `2026-08-31T14:22:36` | `2026-08-20T00:47:43` |
  | `fields.commits` | one entry; `055378794` folded into `working_sha_history` | two entries; `055378794` standalone |
  | `fields.bundled_in` | `bundle-b3b7c399` | absent |

  HEAD is the later-positioned side on every one of these facts (commit
  2026-09-01 vs 2026-08-23; `updated_at` 08-31 vs 08-20), so the per-fact timeline
  rule selects HEAD uniformly — there is no fact where the earlier side wins, and
  therefore no composition to perform. Taking the incoming side would have
  reverted an operator-only status transition (`free_and_reconciled` →
  `ready_to_reconcile`), cleared `completed_at`, and dropped the `bundled_in`
  back-reference to this very reconcile bundle.

  No field was invented: `bundled_in` is present on the HEAD side, not authored here.
  `fields.intent_uid` / `story_uid` / `capability_uid` were not touched.

## Incoming changes preserved

No code/implementation files were in conflict, so STEP 3's discard check applies
only to the one ticket file — and it passes on the "present via a different
route" branch, not the "absent" branch:

- **Body**: byte-identical between the two sides; nothing incoming to lose.
- **`fields.commits`**: the incoming side's only unique datum is the working sha
  `055378794f49f1dc39b20fdcf54aa7fa0b1190e3`. It **is present in HEAD**, folded
  into the `working_sha_history` of the `a28d2f52…` entry by the reconcile-side
  consolidation. HEAD's `working_sha_history` is a strict superset of the
  incoming side's (`ade64575`, `055378794`, `a6e92ca2` vs `ade64575`, `a6e92ca2`).
- **`version` (0.1.60), `chat_comment`, `depends_on`, `priority`, `story_points`,
  `auto_merge_back`, `needs_review`**: identical on both sides.

The resolution therefore nets to **no diff vs HEAD** (staged blob
`51cb2b203b` == HEAD's blob). Per STEP 4 this is the redundant case, not the
discarded case: the incoming commit's content is present in HEAD, reached by the
later lifecycle update rather than by this cherry-pick. `--skip` was not called;
the finalize step will detect the clean staged diff.

No hunks were dropped under the BUG-1301 precedence exception. No UAT or test
functions were involved. `CHERRY_PICK_HEAD` is intact — only `checkout --ours`
and `add --sparse` were issued.
