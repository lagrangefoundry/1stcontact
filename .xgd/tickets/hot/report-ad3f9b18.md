---
uid: report-ad3f9b18
id: REPORT-3089
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-22'
created_by: xgd
created_at: '2026-08-31T21:42:05.855594+00:00'
updated_at: '2026-08-31T21:42:05.855594+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-22
---

## Files resolved

- `.xgd/tickets/hot/bug-a98fb3b0.md` — UU, intent/bookkeeping ticket (rule 2e).
  Resolved to the HEAD side via `git checkout --ours` + `git add --sparse`
  (path is outside the sparse-checkout cone, DOC-986 §2/§4.1).

  Incoming commit `04957574` ("xgd(ticket): update bug bug-a98fb3b0",
  2026-08-24 22:19 UTC) is the third step in this ticket's free-coding chain
  (after `1c5985f8` and `82518d60`, resolved in the two preceding iterations).
  It advances `status` `free_coding` -> `free_coded` and adds
  `commits[0].working_sha: 63df97c93542321a3d57d21e2e31a763ed3e4411`
  (with `reconcile_sha: null`, `main_sha: null`) and `version: 0.2.14`.

  Per-fact comparison against HEAD (`git diff <theirs-blob> <ours-blob>`):
  - `commits` block — byte-identical on both sides, same `working_sha`, same
    null `reconcile_sha`/`main_sha`. No conflict.
  - `version: 0.2.14` — identical on both sides. No conflict.
  - `title`, `severity: high`, and the whole body — unchanged by this commit
    and identical on both sides. No conflict.
  - `status` — the only fact that genuinely differs: incoming `free_coded`
    (updated_at 2026-08-24T22:19:50), HEAD `bundled`
    (updated_at 2026-08-26T17:36:27). Same field changed differently, so the
    timeline rule applies to this fact: HEAD is the later position and
    `bundled` is the downstream lifecycle successor of the incoming
    `free_coded` for this same ticket. Kept HEAD's `bundled`, consistent with
    the auto-enrichment guidance for this file ("take the more recent commit
    by timestamp"). Taking the incoming value would regress the status and
    contradict the `bundled_in` field below.
  - `story_points: 2` / `bundled_in: bundle-78f4e2fe` — present only on HEAD,
    written by the bundling workflow after the incoming commit. Kept.

  HEAD is a strict superset of every fact the incoming commit writes; taking
  it loses nothing from either side. No content was invented.

## Incoming changes preserved

- `.xgd/tickets/hot/bug-a98fb3b0.md`: both substantive additions from the
  incoming diff are present in the resolved file —
  `working_sha: 63df97c93542321a3d57d21e2e31a763ed3e4411` (line 20) and
  `version: 0.2.14` (line 23). The only incoming value not carried over is
  `status: free_coded`, deliberately superseded by HEAD's later `bundled`
  (line 12) per the per-fact timeline rule above — not a discard of developer
  content.

No code/implementation files were involved in this conflict. No hunks were
dropped under the BUG-1301 precedence exception.

## Note on the staged diff

`git diff --cached --stat HEAD` is empty: this commit's effect already reached
HEAD through a later route (the seed_local_overlay / bundling side, which
carries the identical `commits` block and `version` plus the advanced status).
This is the redundant-commit case (BUG-1109/BUG-1122), not a discard — STEP 3's
check confirms the incoming changes are *present* in HEAD rather than absent.
`--skip` was not called; the file is staged and the cherry-pick sequencer state
(CHERRY_PICK_HEAD = 04957574) is left intact for
`cherry_pick_finalize_resolution`.
