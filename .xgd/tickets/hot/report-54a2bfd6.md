---
uid: report-54a2bfd6
id: REPORT-4051
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-11T21:56:40.204719+00:00'
updated_at: '2026-09-11T21:56:40.204719+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/request-7ae3c2cc.md` — class **AA** (both added, no merge
  base), intent/bookkeeping ticket → rule **2e**, resolved per-fact in favour
  of HEAD. Out of the sparse-checkout cone, so resolved via
  `git checkout --ours` + `git add --sparse` (DOC-986 §2/§4.1).

  The entire diff between the two sides is frontmatter; the ticket body is
  byte-identical. Per-fact comparison:

  | Fact | Ours (HEAD, commit `decf67f5`, 2026-08-31) | Theirs (incoming `773e1698`, 2026-08-23, `updated_at` 2026-08-20) |
  |---|---|---|
  | `status` | `free_and_reconciled` | `ready_to_reconcile` |
  | `completed_at` | `2026-08-31T14:22:36Z` | `null` |
  | `bundled_in` | `bundle-b3b7c399` | absent |
  | `version` | `0.1.60` | `0.1.60` (identical) |
  | commits `055378794f49…` | in `working_sha_history` of the single entry | separate `commits` entry |

  HEAD is later on every differing fact and is a strict superset: it advances
  the lifecycle (`ready_to_reconcile` → `free_and_reconciled`, `completed_at`
  set) and adds `bundled_in`, which the incoming side never had. Taking the
  incoming side would have regressed operator-owned lifecycle state by 11 days.
  No sha is lost: `055378794f49…` appears on both sides — the incoming side
  records it as its own `commits` entry, HEAD records it consolidated into the
  first entry's `working_sha_history`, which is the later reconcile-side
  bookkeeping of the same fact.

## Incoming changes preserved

The incoming commit `773e1698` is a whole-file add (303 insertions) of this
one ticket. Its substance is present in HEAD:

- Ticket body — identical on both sides, already in HEAD.
- Working sha `055378794f49f1dc39b20fdcf54aa7fa0b1190e3` — present in HEAD's
  `commits[0].working_sha_history`.
- `version: 0.1.60`, `chat_comment: comment-a4605dbc` — identical on both sides.

No hunk was dropped under the BUG-1301 precedence exception; no code or test
file was touched by this commit.

The staged tree therefore nets to no diff vs HEAD. Per STEP 4 this is the
redundant-commit case (BUG-1109/BUG-1122), not a discard: STEP 3's
distinguishing test passes, because the incoming commit's key changes are
*present* in HEAD via the later reconcile bookkeeping rather than absent.
`git cherry-pick --skip` was NOT called; `CHERRY_PICK_HEAD` is intact for
`cherry_pick_finalize_resolution` to detect the clean staged diff and skip the
commit itself.
