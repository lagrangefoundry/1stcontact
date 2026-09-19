---
uid: report-c42cb144
id: REPORT-4438
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-19T13:06:46.455721+00:00'
updated_at: '2026-09-19T13:06:46.455721+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/bug-360c5a44.md` — **UU**, index-only (path is outside the
  sparse-checkout cone, so there were no working-tree conflict markers).
  Class: **2e — intent/bookkeeping ticket** (`bug-*`, not a matrix-defining spec
  ticket). Rule applied: **one side is a strict superset — keep the superset
  (ours)**. Resolved with `git checkout --ours` + `git add --sparse`; staged blob
  `c0b18a118a`.

  Why ours, per-fact rather than whole-file-by-timeline:

  - **Incoming (stage 3, `ad63102c9a`, 2026-09-01 14:54 -0700,
    `xgd(ticket): update bug bug-360c5a44`)** is the ticket in its newborn state —
    `title: Untitled`, `status: draft`, `last_field_updated: created_at`, body
    `(new ticket)`. Its entire diff against the merge base is a single added
    field: `chat_comment: comment-ab9333e3`.
  - **Ours (stage 2, last touched by `9dc0122762`, 2026-09-17 13:23 -0700,
    `xgd(ticket): seed_local_overlay bug bug-360c5a44`)** is BUG-43 fully
    developed: title *"Builder preview: the frame is never reloaded after an
    assistant turn"*, `status: bundled`, `completed_at` set, plus
    `chat_comment: comment-ab9333e3`, `severity: high`, `version: 0.2.40`,
    `bundled_in: bundle-8e1807f6`, a `commits` entry
    (`working_sha: 84cc117aa1`), and the full symptom / root-cause / fix /
    test-plan body.

  There is no fact the two sides set differently: ours already carries the
  incoming side's one contributed field verbatim and changes nothing else the
  incoming side asserted. Taking incoming would have regressed `bundled` →
  `draft`, reverted the title to `Untitled`, and dropped `bundled_in`,
  `severity`, `version`, `commits` and the whole body — a demotion, not a merge.
  The enrichment's fallback rule (more recent commit by timestamp) independently
  selects the same side: ours is 16 days newer.

  Flagged for post-merge review as the enrichment directed, though the two rules
  agree here and nothing from either side was dropped.

## Incoming changes preserved

- `.xgd/tickets/hot/bug-360c5a44.md` — the incoming commit's complete diff is
  `+  chat_comment: comment-ab9333e3`. Verified present in the staged resolution
  at frontmatter line 16. No incoming hunk was dropped; the BUG-1301 precedence
  exception was not invoked.

## Note for finalize

`git diff --cached HEAD` is empty: HEAD already contained the incoming commit's
effect, so this pick is redundant rather than discarded (STEP 3's distinction —
the incoming change is present in HEAD, not absent from it). Per STEP 4 I did not
call `--skip`; the cherry-pick sequencer is untouched and `CHERRY_PICK_HEAD`
(`ad63102c9a`) is still in place for `cherry_pick_finalize_resolution`.
