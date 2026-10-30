---
uid: report-c02be7b3
id: REPORT-5235
type: report
title: 'Resync resolve conflicts: b6b7f564f0bf1ee0904f0b6aa25ee3ca053055f0'
created_by: xgd
created_at: '2026-09-28T00:57:58.790035+00:00'
updated_at: '2026-09-28T00:57:58.790035+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/request-51514090.md` — **AA** (both added; bookkeeping/intent
  ticket, `request-*`, so STEP 2b + STEP 2e). Resolved **ours wholesale**
  (`git checkout --ours` + `git add --sparse`) because the incoming side is a
  strict, already-integrated subset — see below. 8 conflict hunks; the file did
  materialize on disk with real markers despite `.xgd/tickets/` being outside the
  sparse cone.

## Incoming changes preserved

Yes — in full, and not by textual merge but because the incoming commit's content
is already on HEAD.

**Blob-level proof.** The incoming stage-3 blob is
`892df63295de8936c3e0cbd5c16d6881916a2ce4`. That is *byte-identical* to the blob
produced by `e704298e921c6adf702cb026dbb9202a8d23adef`, which is already in HEAD's
history for this file. Both commits carry the same subject
(`xgd(ticket): update request request-51514090`) and the same author date
(Sun Aug 23 16:40:38 2026 -0700): the incoming `a342dac6d0` and the HEAD-side
`e704298e92` are the same logical commit, the former seen through remapped
post-resync history (which is why it presents as a 95-line add rather than
`e704298e92`'s 2-insertion/1-deletion edit — its parent lineage on the incoming
side lacks the file at that path).

**Its substantive intent is present in ours.** `e704298e92`'s only real change was
adding `chat_comment: comment-233e1afe` to the frontmatter; that field is on line
19 of the resolved file. The other line in its diff was a trailing-newline change.

**HEAD has advanced four commits past it**, and a full `diff theirs ours` is
strictly one-directional — there is not one line unique to the incoming side:

- Frontmatter: ours carries `status: bundled`, `completed_at: 2026-09-14`,
  `updated_at: 2026-09-16`, the three-entry `commits` list, `version: 0.2.39` and
  `bundled_in: bundle-8e1807f6`. Incoming is the pristine creation state
  (`status: draft`, `completed_at: null`, `updated_at == created_at` at
  2026-08-20). Taking incoming would have regressed `bundled` → `draft` and
  dropped `bundled_in`/`commits`/`version` outright.
- Body: ours contains all of incoming's prose, with three passages *superseded* by
  their own successors rather than dropped — "Candidates to weigh rather than
  assume…" became the `## The decision: hand-rolled, dependency-free` section (the
  decision has since been made, so retaining the older wording would contradict
  it); the fixture-corpus "within a stated bound" sentence became the exact-pixel-
  equality wording that ours' AC2 also reflects; AC2 and AC4 were tightened. Ours
  then appends the implementation record (`## What the codec must do, precisely`,
  `## Sequencing, revisited`, `## A finding AC4 turned up`, the
  `## One honest caveat…` section, and the deferred row-lockstep note).

Per STEP 2e, ours is later-positioned on every contested fact, so no per-fact
tie-break favours the incoming side anywhere.

**Net staged diff is empty** (`git status --porcelain` returns nothing; the index
holds ours' blob `efd42480e9` at stage 0, no unmerged entries). This is the
expected "already landed through another path" case — `--skip` was NOT called;
CHERRY_PICK_HEAD remains at `a342dac6d0a90d9376c4ddc41003a01c0031115f` for the
finalize step.
