---
uid: report-cd1abc26
id: REPORT-4679
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-21T09:42:42.042068+00:00'
updated_at: '2026-09-21T09:42:42.042068+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/request-439cd0c8.md` — **UU**, intent/bookkeeping ticket
  (`request-*`), STEP 2e. Resolved to **ours** (stage 2, blob `a8c14c1e9b0a`) by
  per-fact composition, not by picking a side wholesale.

  Incoming commit is `aed29a320ec09ba9c1b77c55950bca412805a9f1`
  (`xgd(ticket): update request request-439cd0c8`, authored 2026-08-31T23:39:06Z).
  Note this is a *different* commit from the `33e3d1d4aa` seen on attempt 174 —
  the queue advanced. Stage 1 (base) is now `8e91918c2288`, which was attempt
  174's incoming blob.

  ### Per-fact table (base `8e91918c2288` → each side)

  | fact | base | ours (`a8c14c1e9b`) | theirs (`08837b9e54`) | who changed it |
  |---|---|---|---|---|
  | `status` | `free_coded` | **`bundled`** | `free_coded` (untouched) | ours only |
  | `fields.bundled_in` | *(absent)* | **`bundle-87be4669`** | *(absent, untouched)* | ours only |
  | body §"Resolved after implementation" | absent | **~40 lines added** | absent (untouched) | ours only |
  | trailing newline | missing | **restored** | missing (untouched) | ours only |
  | `fields.story_points` | `13` | `13` | `13` | neither — identical |
  | `last_field_updated` | `status` | `status` (untouched) | **`story_points`** | theirs only |
  | `updated_at` | `2026-08-31T23:39:02Z` | **`2026-09-09T21:32:49Z`** | **`2026-08-31T23:39:06Z`** | both |

  ### Reasoning

  The incoming commit's *entire* substantive contribution is nil: it records a
  `story_points` write that set the field to `13`, the value it already held.
  Its only non-identical output is the coupled bookkeeping pair
  (`updated_at`, `last_field_updated`) describing that no-op event.

  Four facts were changed by ours alone and are untouched by theirs — `status`,
  `bundled_in`, the "Resolved after implementation" section, and the trailing
  newline. Under 2e these are non-overlapping and are kept. Taking theirs
  wholesale would discard roughly forty lines of substantive body content plus
  the bundling state — precisely the "silently discards legitimate, disjoint
  edits on the other side" failure that 2e/BUG-1030 exists to prevent.

  That leaves the coupled pair as the only genuine contested fact.
  `updated_at` and `last_field_updated` are derived markers describing a single
  edit event; they are not independent facts and must not be split. Since the
  merged file necessarily contains ours' 2026-09-09 bundling edit (theirs never
  touched those fields), the pair has to describe *that* event. Adopting theirs'
  pair would produce an incoherent record — `last_field_updated: story_points`
  with an `updated_at` of 2026-08-31 sitting atop a file that demonstrably
  contains a 2026-09-09 status transition to `bundled` — and would roll
  `updated_at` backwards past content it cannot describe. Ours is therefore the
  later-positioned intent for the pair.

  ### Tension with the auto-enrichment rule — flagged for post-merge review

  Both sides carry the same generated commit subject and neither has a free-text
  `--commit-message` body, so the enrichment classed intent as "unknown on one or
  both sides" and prescribed *"take the more recent commit by timestamp and flag
  this file for post-merge review."* By raw commit author date that fallback
  points the **other** way, and I did not follow it. Recording that explicitly:

  - `xgd working-timeline dc3a031572 aed29a320ec0` returns HEAD-side
    `dc3a0315724b` at `2026-08-31T21:50:19Z` and incoming `aed29a320ec0` at
    `2026-08-31T23:39:06Z` — i.e. incoming is later by commit timestamp.
  - But `dc3a0315724b`'s *author date* is a replay artifact and is not a faithful
    position marker for the content it carries: that commit's tree is blob
    `a8c14c1e9b0a`, whose own `updated_at` is `2026-09-09T21:32:49Z`. A commit
    dated Aug 31 carrying Sep 9 content is the signature of the resync replay
    (working commits replayed onto a main that had already advanced to
    `bundled`/`bundle-87be4669`).

  Following the timestamp fallback here would have destroyed forty lines of body
  content to adopt a no-op `story_points` write. 2e is the governing rule for
  this file class and it is per-fact, so per-fact composition wins. **Flagging
  this file for post-merge review as the enrichment directs**, so a human can
  confirm the `updated_at` / `last_field_updated` pair reads correctly on the
  published ticket.

  ### Mechanics

  Because every contested fact resolved to ours, the staged blob equals HEAD's
  and this cherry-pick will have an empty diff. Per STEP 4 that is left alone:
  `--skip` was **not** called, the resolution is staged, and Python's finalize
  step is left to detect the clean staged diff. `CHERRY_PICK_HEAD` remains at
  `aed29a320ec09ba9c1b77c55950bca412805a9f1`.

  The path is outside the sparse-checkout cone (this worktree has 11% of tracked
  files present; `.xgd/tickets/**` excluded per DOC-986 §2/§4.1), so the conflict
  existed only in the index with no working-tree markers. All three stages were
  read via `git show :1:` / `:2:` / `:3:`; staging used `git checkout --ours`
  then `git add --sparse`, each issued as the sole content of its own call per
  BUG-1294.

## Incoming changes preserved

No code/implementation files were in conflict — the single conflicted path is a
`request-*` intent ticket, not a spec ticket, source file, or UAT test. STEP 3's
`git show $CPHEAD -- <file>` verification therefore had no code targets. No UAT
test function on either side was deleted, and the BUG-1301 precedence exception
was not invoked; no hunk was dropped under it.

The incoming commit `aed29a320ec0` carries no substantive fact to preserve:

- `fields.story_points = 13` — its nominal target, present in the resolved tree
  and byte-identical to what it already was on both sides. Nothing lost.
- `last_field_updated = story_points` and `updated_at = 2026-08-31T23:39:06Z` —
  coupled derived markers for that no-op write. Not carried forward, by the
  per-fact reasoning above; ours' pair describes the strictly later and
  substantively real 2026-09-09 bundling edit that the merged file contains.

No developer code and no user-authored prose from the incoming side was
discarded.

## Final state

`git ls-files -u` reports no unmerged entries; the path is staged at stage 0 as
blob `a8c14c1e9b0a`. `git status --porcelain` is empty (staged content equals
HEAD — expected, see above). `CHERRY_PICK_HEAD` remains present at
`aed29a320ec09ba9c1b77c55950bca412805a9f1`. `--continue`, `--skip`, `--quit`,
and `--abort` were not called.
