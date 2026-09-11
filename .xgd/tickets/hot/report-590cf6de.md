---
uid: report-590cf6de
id: REPORT-3859
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-26'
created_by: xgd
created_at: '2026-09-11T01:45:01.756663+00:00'
updated_at: '2026-09-11T01:45:01.756663+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-26
---

## Files resolved

- `.xgd/tickets/hot/comment-c74424ff.md` — class **UU**, bookkeeping/chat-transcript comment ticket (rule **2e**, strict-superset branch; `updated_at` scalar under **2g**). Resolved by taking the incoming (free_coded) side in full via `git checkout --theirs` + `git add --sparse` (path is outside the sparse-checkout cone, DOC-986 §2/§4.1).

  **Why the superset branch applies rather than the timeline branch.** The three index stages compare as follows:

  | stage | `updated_at` | lines | content |
  |---|---|---|---|
  | 1 (base = parent of the picked commit, `0fd8da65a4`) | 2026-09-01T01:14:37Z | 836 | transcript through the "parked assistant" turns |
  | 2 (ours, bundle branch HEAD) | 2026-08-15T01:48:32Z | 226 | transcript through the CHAT-13 α/β/γ turn |
  | 3 (theirs, incoming `bed856f473`) | 2026-09-01T18:22:57Z | 843 | base + one appended user turn `9d626d00` |

  The ours side is a **byte-for-byte prefix** of the theirs side — a line-by-line comparison of the first 225 lines of each blob differs only on the `updated_at` frontmatter scalar (line 8); every other line is identical, including the trailing `<!-- xgd-chat-end -->` sentinel which both sides carry. The apparent 600-line "deletion" on the ours side is not a HEAD-side edit at all: HEAD's most recent commit touching this file is `bde8759f9b` (2026-08-14 18:48:33 -0700), so the bundle branch simply has not yet received the 2026-08-31 / 2026-09-01 turns that the cherry-pick base already contains. Cherry-pick's 3-way base is the picked commit's parent, not a branch common ancestor, which is why those turns show as present in stage 1 and absent in stage 2.

  There is therefore no genuine per-fact intent conflict to arbitrate: no field, paragraph, or chat turn exists on the ours side that is not also present, unchanged, on the incoming side. Taking theirs discards nothing authored on the ours side. The single overlapping fact — the `updated_at` scalar — goes to the incoming side under 2g (incoming is authoritative for scalars) and under the auto-enrichment's "more recent commit by timestamp" rule, which point the same way (incoming 2026-09-01 11:22:57 -0700 vs ours 2026-08-14 18:48:33 -0700).

  This is also the append-only-correct outcome for a `chat_transcript` comment: the resolved file preserves the complete conversation, whereas taking ours would have truncated it to a 2026-08-14 snapshot and dropped both the intervening turns and the incoming commit's new turn.

## Incoming changes preserved

The incoming commit `bed856f473` touches this file with exactly two hunks. Both are verified present in the staged resolution:

- **Hunk 1 (frontmatter):** `updated_at: '2026-09-01T18:22:57.740802+00:00'` — present at line 8 of the resolved file.
- **Hunk 2 (body append):** the new user turn `<!-- xgd-turn id="9d626d00-a73a-4a80-bd6d-e58109797ae0-user" -->` ("lets not change anything for this super-chat role… describe what we have built at this point?") — present at line 836, immediately before the `<!-- xgd-chat-end -->` sentinel.

No incoming hunk was dropped, so the BUG-1301 precedence exception was not invoked and does not apply here. No conflict markers remain in the file (`grep -c '^<<<<<<<'` → 0), and `git status --porcelain` reports the path as `M ` (staged, resolved) with no remaining conflict-class entries anywhere in the tree.

No code, test, or UAT files were involved in this conflict — the sole conflicted path is a ticket comment. No `git cherry-pick --continue/--skip/--quit/--abort`, `reset`, or `checkout <branch>` was run; `CHERRY_PICK_HEAD` remains present for `cherry_pick_finalize_resolution`.
