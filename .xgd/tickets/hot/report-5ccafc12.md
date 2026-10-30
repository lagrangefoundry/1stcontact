---
uid: report-5ccafc12
id: REPORT-4594
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-21T00:35:34.592757+00:00'
updated_at: '2026-09-21T00:35:34.592757+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/bug-23d1ec27.md` — **UU**, intent/bookkeeping ticket
  (`bug-*`, §2e; not §2d — §2d covers story/acceptance_criterion/capability).
  Resolved **per fact** to the ours side, then staged with
  `git add --sparse` (path is outside the sparse-checkout cone, DOC-986 §2/§4.1 —
  plain `git add` refused it with "paths ... outside of your sparse-checkout
  definition").

Incoming commit: `bffb6b34faf48d7c750ccafbec0005964840184a`
("xgd(ticket): update bug bug-23d1ec27", 2026-08-26), 1 file, 3 insertions /
3 deletions — frontmatter only.

Per-fact analysis against the merge base (stage 1 = `free_coded`,
`updated_at` 2026-08-25T23:28:10Z, `last_field_updated: story_points`):

| fact | ours (stage 2) | incoming (stage 3) | disposition |
|---|---|---|---|
| `status` | `bundled` | `ready_to_reconcile` | contested → ours (later-positioned) |
| `updated_at` | 2026-08-31T05:05:09Z | 2026-08-26T18:31:09Z | contested → ours (later-positioned) |
| `last_field_updated` | `status` | `status` | identical on both sides — not contested |
| `fields.bundled_in` | `bundle-8eef3846` | absent | ours-only addition → kept |
| body (`## Symptom` onward) | reflowed/unwrapped | byte-identical to base | ours-only change → kept |

Later-positioned determination used `xgd working-timeline` (SHA-stable) rather
than raw `updated_at`, per §2e / BUG-1030:

- incoming `bffb6b34faf48d7c750ccafbec0005964840184a` → 2026-08-26T18:31:10+00:00
- HEAD-side `09291354553b3cc38e451bf37d9b827567ee7546`
  (`xgd(ticket): seed_local_overlay bug bug-23d1ec27`) → 2026-08-31T19:21:41+00:00

Both contested facts therefore resolve to ours. The two non-contested,
ours-only changes (`bundled_in`, body reflow) were preserved rather than
discarded — incoming never touched them, so §2e's "non-overlapping:
apply BOTH" governs there. Net effect: the resolved file equals the ours side
in full, but reached per fact, not by picking a winning file wholesale.

## Incoming changes preserved

No code/implementation files were in this conflict, so STEP 3's
`git show $CPHEAD -- <file>` verification had no code targets. No UAT test
file was involved and no test function was deleted. No hunk was dropped
under the BUG-1301 precedence exception — that exception is not invoked here.

Every fact the incoming commit carried was evaluated on its merits and lost
to a strictly later-positioned intent already integrated into HEAD; nothing
was discarded for convenience. Applying incoming would have regressed BUG-39
from `bundled` back to `ready_to_reconcile` and orphaned its
`bundled_in: bundle-8eef3846` membership.

## Post-state

- `git status --porcelain` → empty; no UU/AA/DU/UD lines remain.
- The staged tree is identical to HEAD (no `M` line), i.e. this resolution
  leaves no net change. Per STEP 4 this was left alone for Python's finalize
  step to detect and skip — `--skip` was **not** called here.
- `CHERRY_PICK_HEAD` verified still present after staging
  (`git rev-parse CHERRY_PICK_HEAD` → `bffb6b34faf48d7c750ccafbec0005964840184a`).
- Resolved file has 0 conflict markers; frontmatter reads
  `status: bundled`, `updated_at: 2026-08-31T05:05:09Z`,
  `last_field_updated: status`, `fields.bundled_in: bundle-8eef3846`.

## Note on the earlier attempt in this session

This same commit `bffb6b34fa` was previously disposed of via
`xgd cherry-pick-skip report-7b4182de` earlier in this session (before the
no-`--skip` constraint was delivered), and has now been re-queued by the loop —
consistent with that skip's anchor annotation never landing.
`cmd_cherry_pick_skip.py:70` calls `append_skipped_commits(ticket_uid, [sha])`
without `repo_path`, so it targets this sparse resync worktree's store instead
of xgd-working's, where anchor `report-7b4182de` actually lives; the failure is
silent because `append_skipped_commits` swallows its own exceptions
(`anchor.py:165`). Same class as the BUG-789 / REQ-621 fix recorded at
`anchor.py:184`, not yet applied to this call site. This attempt used the
staging path instead, so the gate no longer depends on that annotation for
this commit.
