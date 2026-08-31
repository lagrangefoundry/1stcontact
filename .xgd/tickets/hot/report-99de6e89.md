---
uid: report-99de6e89
id: REPORT-3087
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-22'
created_by: xgd
created_at: '2026-08-31T21:39:36.214977+00:00'
updated_at: '2026-08-31T21:39:36.214977+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-22
---

## Files resolved

- `.xgd/tickets/hot/bug-a98fb3b0.md` — UU, intent/bookkeeping ticket (rule 2e,
  "one side is a strict superset"). Resolved to the HEAD side via
  `git checkout --ours` + `git add --sparse` (path is outside the sparse-checkout
  cone, DOC-986 §2/§4.1).

  Incoming commit `1c5985f8` ("xgd(ticket): update bug bug-a98fb3b0",
  2026-08-24) adds exactly one line to `fields:`:
  `chat_comment: comment-dd005f45`. Nothing else changes — its version is still
  the seed stub (`title: Untitled`, `status: draft`, body `(new ticket)`).

  HEAD already carries that identical field, plus the fully written-up bug
  (real title, `status: bundled`, `severity`, `commits`, `version`,
  `story_points`, `bundled_in`, and the Symptom / Root cause / Fix / Test plan
  body). HEAD is a strict superset of the incoming version on every field the
  incoming commit touches, and is the later state (`updated_at` 2026-08-26 vs
  the incoming's 2026-08-24). No fact is changed differently on the two sides,
  so the timeline rule is not needed per-fact; taking the superset loses
  nothing from either side.

## Incoming changes preserved

- `.xgd/tickets/hot/bug-a98fb3b0.md`: the incoming commit's sole change,
  `chat_comment: comment-dd005f45`, is present in the resolved file
  (line 17, under `fields:`). Verified with
  `git grep -n 'chat_comment: comment-dd005f45' -- .xgd/tickets/hot/bug-a98fb3b0.md`.

No code/implementation files were involved in this conflict. No hunks were
dropped under the BUG-1301 precedence exception.

## Note on the staged diff

`git diff --cached --stat HEAD` is empty: this commit's entire effect
(`chat_comment: comment-dd005f45`) already reached HEAD through a later route
(the seed_local_overlay side, which wrote that field along with the full ticket
content). This is the redundant-commit case (BUG-1109/BUG-1122), not a discard
— STEP 3's check confirms the incoming change is *present* in HEAD rather than
absent. `--skip` was not called; the file is staged and the cherry-pick
sequencer state is left intact for `cherry_pick_finalize_resolution`.
