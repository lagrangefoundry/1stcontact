---
uid: report-f2f0c87a
id: REPORT-5663
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-30T05:51:59.698601+00:00'
updated_at: '2026-09-30T05:51:59.698601+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

# Resync resolve conflicts — `comment-d2ec1dc0`

Picked commit `9a1c7b84c8f6ef95451860003bc74ff58896ea08` ("xgd(ticket): update
comment comment-d2ec1dc0", author 2026-09-13 18:08:29 -0700). HEAD
`fb988dd59dd2434c100bbc5bc1aa91259014333e`. Candidate publish tip
`9ac98712a708888db67f8aff21f22b16bd98094e`. Anchor `report-377b581e`.
`prior_stage_failure` empty.

## Files resolved

`.xgd/tickets/hot/comment-d2ec1dc0.md` — class `UU`, **not materialized** in the
working tree (sparse path, no conflict markers to read). Resolved **`--theirs`**.

This is the FIRST `--theirs` outcome on this resync branch after a long run of
`--ours` picks, and it stages a **real net change of +60/-1** rather than the
usual zero. The reason is specific and checkable, not a change of policy.

Three index stages:

| stage | blob | state |
|---|---|---|
| `:1:` base | `756a8db86d` | parent of the pick = merge `b6a695ae50` |
| `:2:` ours | `f5bda61e6e` | == `HEAD:<path>` |
| `:3:` theirs | `8af4a4f96a` | the pick, and **xgd-working's TIP for this path** |

### Why incoming wins here

Governing rule is **§2e (intent/bookkeeping tickets)** — a `comment-*` ticket is
user-authored content, and the kind list is open-ended. §2e: *"One side a strict
superset: keep the superset."*

**Theirs is a strict superset of ours.** `git diff f5bda61e6e 8af4a4f96a` is
`+60/-1`, and the single `-` line is `updated_at` moving **forward**
(`2026-09-13T23:36:32.329935+00:00` → `2026-09-14T01:08:29.398185+00:00`). No
body line of ours is absent from theirs. So the superset leg and the per-fact
timeline leg point the same way, with nothing left to arbitrate.

**Ours is BEHIND base, not ahead of it.** `git diff 756a8db86d f5bda61e6e` is
`+1/-24`: ours *lacks* two chat turns that base already has — an assistant turn
`9dbfdfc6-…` (ts 2026-09-14T00:07:10) and a user turn `20bb8bb2-…-user`
(ts 2026-09-14T00:55:50). Those turns arrived on xgd-working in the merge
`b6a695ae50` ("Merge branch 'free-REQ-236' into xgd-working [FREE-CODED]"),
which **has not been replayed onto this branch** — `git log HEAD
--grep='free-REQ-236'` returns nothing. Taking `--ours` would therefore have
deleted three appended chat turns outright (those two plus the pick's own), and
this ticket is `kind: chat_transcript` / **append-only**, so a deletion is pure
data loss with no compensating later state.

**The usual resync fast exits do not apply, and I checked rather than assumed:**

- The ours-vs-incoming-tip test does *not* hand this to ours. xgd-working's tip
  for the path IS the picked commit `9a1c7b84c8`, so ours cannot be "the
  incoming side's final state" — it is two commits short of it.
- There is no bundle pair and no main-side content to adjudicate. Ours' entire
  ledger for this path is five resync replays of xgd-working's own commits
  (author dates `15:14:19`, `15:44:43`, `15:45:10`, `16:15:31`, `16:36:32` match
  `085a3114c7`, `7e640ef6c6`, `94a3886d03`, `8dee69a07b`, `5b48f2428c`
  one-for-one; commit dates are all 2026-09-29, this resync run). This path has
  no independent main-side history at all.
- The enrichment's fallback rule ("intent unknown → take the more recent commit
  by timestamp") happens to agree with `--theirs` here, but it is not what the
  decision rests on — the superset relation is.

## Incoming changes preserved

All of them. The staged blob is byte-identical to `:3:`:

    git diff :.xgd/tickets/hot/comment-d2ec1dc0.md 8af4a4f96a   # empty

Concretely preserved: the pick's new assistant turn
`20bb8bb2-1a7b-4323-9ec1-d24f1e27f03e-assistant` (37 lines, ts
2026-09-14T01:08:27) recording the REQ-236 merge-integration work — the
`0004`→`0005` migration renumber, the REQ-243 publish-gate suite adaptation, the
`0.2.189 → 0.2.190` bump, and the test-results narrative — plus the two turns
the merge contributed and the forward `updated_at`.

Verification: `git status --porcelain` shows one line, `M
.xgd/tickets/hot/comment-d2ec1dc0.md`, with no `UU` and no other path;
`git diff --cached --stat HEAD` shows `+60/-1` on that path alone;
`CHERRY_PICK_HEAD` is intact at `9a1c7b84c8`.

## Arbitration of last resort (BUG-1460)

Not applicable — STEP 3h never fired. The superset relation settled the file.

## Forecast for remaining picks on this path

The pick is xgd-working's **tip** for `.xgd/tickets/hot/comment-d2ec1dc0.md`, so
no further conflict on this path is expected. The one incoming commit touching
it that has not been replayed is the merge `b6a695ae50`; its whole effect on
this path (the two chat turns above) is now contained in HEAD, so should the
queue present it, it is `--ours` with zero net change. Every other commit in the
incoming ledger (`085a3114c7`, `7e640ef6c6`, `94a3886d03`, `8dee69a07b`,
`5b48f2428c`) is already replayed on this branch.

**Generalizable lesson:** on this branch, run `git diff <:1:> <:2:>` before
reaching for the `--ours` reflex. When that diff *removes* content, ours is
behind the pick's own parent — an incoming commit (typically a merge) was never
replayed — and `--ours` becomes a deletion. On an append-only
`kind: chat_transcript` comment the check is cheap: `git diff <:2:> <:3:> |
grep '^-'` returning only `updated_at` proves the superset in one call.
