---
uid: report-3a9ec455
id: REPORT-4443
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-19T13:20:40.856142+00:00'
updated_at: '2026-09-19T13:20:40.856142+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/request-51514090.md` — **UU** (index-only; the path is outside the
  sparse-checkout cone, so there are no working-tree markers — stages read via
  `git cat-file blob`). Rule **2e** (intent/bookkeeping ticket), superset branch.
  Resolved to **OURS**, staged with `git checkout --ours` + `git add --sparse`.

  Incoming commit: `881fa998` *xgd(ticket): update request request-51514090*,
  2026-09-01 15:15:38 -0700. Its entire diff against the merge base is two frontmatter
  lines: `status: free_coded` → `ready_to_reconcile`, plus the accompanying
  `updated_at` bump. Body untouched.

  Per-fact analysis (body is byte-identical on both sides):

  | fact | ours (HEAD, `seed_local_overlay`, 2026-09-17) | theirs (incoming, 2026-09-01) | kept |
  |---|---|---|---|
  | `status` | `bundled` | `ready_to_reconcile` | ours |
  | `bundled_in` | `bundle-8e1807f6` | *absent* | ours |
  | `completed_at` | `2026-09-14T10:29:03` | `null` | ours |
  | `updated_at` | `2026-09-16T01:48:38` | `2026-09-01T22:15:38` | ours |
  | `commits` (3 × working_sha), `version: 0.2.39`, `last_field_updated`, body | — | — | identical |

  HEAD sits one lifecycle step *past* the incoming value on the same path
  (`free_coded` → `ready_to_reconcile` → `bundled`), and additionally carries
  `bundled_in: bundle-8e1807f6` — this very reconcile bundle — and a non-null
  `completed_at`. Incoming-wins would have regressed the status backwards and dropped
  both of those facts.

  Timeline agrees, which is the enrichment's stated rule for this file ("take the more
  recent commit by timestamp"):
  - ours: `3f2311b0` *seed_local_overlay*, 2026-09-17 13:23:47 -0700
  - theirs: `881fa998` *update*, 2026-09-01 15:15:38 -0700

  No field invented, nothing introduced from outside the two sides, no
  `intent_uid` / `story_uid` / `capability_uid` touched.

## Incoming changes preserved

No code/implementation files were in conflict — the single conflicted path is a
bookkeeping ticket.

The incoming commit's only substantive change is advancing `status` forward off
`free_coded`. That intent is **present in HEAD**, carried further along the same
lifecycle (`bundled`) rather than absent — the developer's forward move was not
discarded, it was superseded by a later move in the same direction.

This is the BUG-1109/BUG-1122 "redundant, not discarded" case described in STEP 4:
`git diff --cached HEAD` is empty because HEAD already carries this commit's effect via
the later `seed_local_overlay` overlay. STEP 3's guard is satisfied. I did not call
`--skip`; the staged tree is left for `cherry_pick_finalize_resolution`, and
`CHERRY_PICK_HEAD` is intact.

No BUG-1301 precedence exception was used; no hunk was dropped; no test function was
deleted.

## Post-merge review flag

Flagged per the enrichment: `.xgd/tickets/hot/request-51514090.md` — ours-side
`status: bundled` / `bundled_in: bundle-8e1807f6` kept over the incoming
`ready_to_reconcile`. This is the second consecutive commit in the incoming sequence
for this ticket to resolve the same way (the prior attempt, `56087d83`, set
`free_coded`); both are pre-bundle status steps that the local overlay has already
walked past. Worth a confirming glance after the run that `bundled_in` still names the
right bundle.
