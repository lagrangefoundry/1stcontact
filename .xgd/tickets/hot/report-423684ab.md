---
uid: report-423684ab
id: REPORT-4175
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-13T23:38:36.061263+00:00'
updated_at: '2026-09-13T23:38:36.061263+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/request-01ea4eec.md` (REQ-155) — **UU**, intent/bookkeeping
  ticket (`request-*.md`), rule **2e**. Resolved to **ours** (HEAD /
  `seed_local_overlay`), because ours is a strict superset of incoming per 2e's
  superset clause. This also agrees with the enrichment block's
  "more recent commit by timestamp" rule: ours `updated_at`
  2026-09-11T18:53:53Z vs incoming 2026-09-01T18:57:55Z.

  The prose body is byte-identical on all three stages (verified by
  `git diff :1: :3:` and `git diff :3: :2:`); the conflict is entirely in the
  YAML frontmatter:

  | field | base | incoming (theirs) | ours (kept) |
  |---|---|---|---|
  | `status` | `free_coding` | `free_coded` | `bundled` |
  | `fields.commits` | absent | added, `working_sha: ab467d6c…` | same, byte-identical |
  | `fields.version` | absent | `0.2.32` | `0.2.32`, identical |
  | `fields.bundled_in` | absent | absent | `bundle-8e1807f6` |

  Path is outside the sparse-checkout cone (DOC-986 §2/§4.1) — the conflict
  existed only in the index, with no working-tree markers. Resolved by pointing
  the index entry at the stage-2 blob (`341427c5…`) rather than materializing the
  file, then restoring the `skip-worktree` bit so the sparse state is unchanged
  (`git ls-files -v` → `S`). `git ls-files -s` now shows a single stage-0 entry.

## Incoming changes preserved

Incoming commit `e0795d93` touches this one file only. Each of its substantive
changes is present in the resolved version:

- `fields.commits` (`working_sha: ab467d6ce36618c333604d6b1587cfb6d19557ff`,
  `reconcile_sha: null`, `main_sha: null`) — **present**, byte-identical.
- `fields.version: 0.2.32` — **present**, identical.
- `status: free_coding` → `free_coded` — **present via a different route.** HEAD
  advanced the same field further along the same lifecycle, to `bundled`, and
  added `bundled_in: bundle-8e1807f6`. `bundled` is downstream of `free_coded`;
  taking incoming would have rolled the ticket backwards. This is the
  BUG-1109/BUG-1122 redundant-commit case, not a discard: the incoming commit's
  effect already landed in HEAD by another route.

The only incoming difference NOT carried over is cosmetic — incoming strips the
file's trailing newline (`\ No newline at end of file`); ours keeps it. No
content is lost.

No code/implementation files were in this conflict, so STEP 3's code-preservation
check and the BUG-1301 precedence exception do not apply; no hunk was dropped
under that exception.

The resolution nets to **no staged diff vs HEAD** (`git diff --cached HEAD` is
empty), which STEP 4 states is expected for a redundant commit and is not a fail
condition. Per STEP 4 I did NOT call `--skip`/`--continue`; CHERRY_PICK_HEAD is
intact at `e0795d9332b24701db6217dab55e2976424b613e` for
cherry_pick_finalize_resolution.

Flagged for post-merge review, as the enrichment block's unknown-intent rule
requests — though the two sides are not in genuine conflict on any fact.
