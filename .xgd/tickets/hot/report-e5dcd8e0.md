---
uid: report-e5dcd8e0
id: REPORT-3381
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-23'
created_by: xgd
created_at: '2026-09-03T00:13:17.175046+00:00'
updated_at: '2026-09-03T00:13:17.175046+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-23
---

## Files resolved

- `.xgd/tickets/hot/bundle-b3b7c399.md` — **UU**, intent/bookkeeping ticket (STEP 2 rule **2e**).
  Incoming commit `a4af54d04d` (`2026-08-29 21:33:05 -0700`). Single conflict region
  (lines 8–18 of the working tree file), covering exactly four lifecycle frontmatter facts.
  All other ours-side content (`fields.commits` collapse, ~140 `orphan_commits`,
  `merged_at_commit`, `result`) merged clean — the incoming side never touched those regions.

  Per-fact resolution (2e's "take the side from the LATER-positioned intent, per fact"):

  | fact | ours (HEAD) | theirs (`a4af54d04d`) | kept |
  |---|---|---|---|
  | `updated_at` | `2026-08-31T14:23:04` | `2026-08-30T04:33:05` | ours (later) |
  | `completed_at` | `2026-08-31T14:22:24` | `null` (unchanged from base) | ours (superset) |
  | `last_field_updated` | `result` | `status` | ours (later) |
  | `status` | `free_and_reconciled` | `reconciling` | ours (later lifecycle stage) |

  Timeline evidence — both sides carry the identical subject
  _"xgd(ticket): update bundle bundle-b3b7c399"_ and the auto-enrichment reported intent
  unknown on both sides, so its prescribed fallback applies: **take the more recent commit
  by timestamp.** The ours-side blob `bb444506b8` was authored by `8e07e6015d`, dated
  `2026-08-31 07:23:04 -0700`; the incoming commit is dated `2026-08-29 21:33:05 -0700` —
  ours is ~33h later. `xgd working-timeline` was not applicable: neither side is a
  `free_coded` intent commit, so there are no intent uids to position.

  Coherence check — the four contested facts are not independent of the already-merged body.
  Lines 307–308 of the resolved file carry `merged_at_commit: eef7a8b48b` and `result: pass`,
  and `fields.commits` has collapsed to a single entry with `main_sha` set. Taking the
  incoming `status: reconciling` / `last_field_updated: status` would have produced an
  internally inconsistent ticket: a bundle advertising itself as mid-reconcile while
  simultaneously recording a passing result, a merge commit, and ~140 resolved
  `orphan_commits`.

  Mechanism: `git checkout --ours` then `git add --sparse` (the path is outside the
  sparse-checkout cone on this reconcile branch — DOC-986 §2/§4.1). The ours blob is
  byte-identical to the desired resolution, because outside the conflict region
  theirs == base. Index now holds a single stage-0 entry at `bb444506b8`.

## Incoming changes preserved

No code/implementation files were in conflict — the sole conflicted path is a bookkeeping
ticket governed by 2e, not 2c, so the "incoming is authoritative for code files" rule does
not apply and no developer-authored code was at stake.

The incoming commit's entire diff vs base is two lines (`2 insertions(+), 2 deletions(-)`):
an `updated_at` bump and `status: ready_to_reconcile` → `reconciling`. Neither literal value
survives into the resolution, and that is the intended outcome of 2e's timeline rule rather
than a discard:

- The incoming side's *intent* was to advance `bundle-b3b7c399` (BUNDLE-20) from
  `ready_to_reconcile` into `reconciling`. HEAD has already carried that same bundle
  **through** `reconciling` and out the far end to the terminal `free_and_reconciled`, with
  `result: pass`, `completed_at` set, and `merged_at_commit: eef7a8b48b` recorded. The
  incoming intent is therefore present in HEAD via a different route — it is **redundant**,
  not absent. This is exactly STEP 3's redundant-vs-discarded distinction, and it lands on
  the redundant side.
- Re-applying the incoming values would not preserve developer intent; it would *rewind* the
  bundle's recorded lifecycle to a mid-run state it has already left.

The BUG-1301 PRECEDENCE exception was not invoked, and no test function on either side was
deleted.

## Sequence context

This is the second consecutive attempt (scope `.../cherry_pick_one_attempt/84/0`, after
`83/0`) to resolve this same ticket path. The two are distinct commits from the same
39-second burst of working-timeline status bumps on 2026-08-29: `3fa48a6b72`
(`reconciling` → `ready_to_reconcile`, 21:32:26) and now `a4af54d04d`
(`ready_to_reconcile` → `reconciling`, 21:33:05). Attempt 83's merge base was `1d48ebb68c`;
this attempt's base is `4680e71db5` — i.e. attempt 83's *theirs* — confirming that pick was
finalized as an empty/skipped commit and the sequencer advanced. HEAD has not moved
(tip `d5b1d6da65`) and the ours-side blob is unchanged, so the same per-fact analysis holds
identically.

## Note for post-merge review

The auto-enrichment asked that this file be flagged for post-merge review, since intent was
unknown on both sides. Flagging accordingly. Consequence of the resolution: the staged tree
nets to **no diff vs HEAD**. Per STEP 4 this is expected and is not a failure — the
cherry-pick was left paused with `CHERRY_PICK_HEAD` (`a4af54d04d`) intact and no
`--skip`/`--continue`/`--abort` was issued; `cherry_pick_finalize_resolution` will detect the
empty staged diff and skip the commit. This matches the known post-watermark pattern where a
later sync already landed the incoming commits' effect. Expect further attempts in this
series if additional status-bump commits for this bundle remain in the pick list.
