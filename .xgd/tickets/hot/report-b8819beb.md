---
uid: report-b8819beb
id: REPORT-4132
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-12T20:38:05.523588+00:00'
updated_at: '2026-09-12T20:38:05.523588+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/request-b88b79fe.md` (REQ-154) — class **UU**, rule **2e** (intent/bookkeeping ticket: `request-*.md`). Two conflict regions, both in YAML frontmatter; the body was identical on both sides.
  - Region 1 (`updated_at` / `status`): HEAD `2026-08-31T05:05:09` / `bundled` vs incoming `2026-08-28T16:38:43` / `free_coded` — same fact changed differently on each side, so the per-fact timeline rule applies. Kept **HEAD**.
  - Region 2 (`bundled_in: bundle-8eef3846`): present HEAD-side, absent incoming. Kept **HEAD** (superset).

Both regions resolve the same way under two independent rules:
- 2e "one side is a strict superset": HEAD contains every field the incoming
  side adds, plus `bundled_in` and the full `# What was built` body section.
- The auto-enriched rule for this file ("intent unknown on one or both sides —
  take the more recent commit by timestamp"): HEAD-side commit `bc62f2857d`
  is dated 2026-09-11, incoming `04d4a9841d` is dated 2026-08-28.
  **This file is hereby flagged for post-merge review**, as that rule directs.

`status: bundled` is also forward of `free_coded` in the lifecycle, so keeping
HEAD advances the ticket rather than regressing it.

Resolution was performed by editing out only the marker regions (not
`git checkout --ours`), so any incoming hunk that had auto-merged outside the
conflicted regions would have survived. The result was then confirmed
byte-identical to the stage-2 blob `36e51a0c74` via `git diff --no-index`.
Staged with `git add --sparse` — the path is outside the sparse-checkout cone
(DOC-986 §2/§4.1).

## Incoming changes preserved

Verified with `git show 04d4a9841d -- .xgd/tickets/hot/request-b88b79fe.md`.
The incoming commit's complete diff over the merge base `08535fb908` is:

1. `commits:` block (`working_sha: 29c0e86dd321b509e06f0dd9e531392ee9190b0e`,
   `reconcile_sha: null`, `main_sha: null`) — **PRESENT** in the resolved file
   (lines 21-24), verbatim.
2. `version: 0.2.16` — **PRESENT** in the resolved file (line 25), verbatim.
3. `status: free_coding` -> `free_coded` — superseded in HEAD by `bundled`.
4. `updated_at` bump to 2026-08-28 — superseded by HEAD's 2026-08-31.

Items 1 and 2 are the incoming commit's only substantive content, and both
already reached HEAD through the working->reconcile seed. Items 3 and 4 are
the same ticket's own status fact, carried further forward on the HEAD side by
a later commit.

This stages to no net diff vs HEAD. Per STEP 4 that is the redundant-commit
case (BUG-1109/BUG-1122), NOT a discard: STEP 3's discriminator is whether the
incoming commit's key changes are present in HEAD via another route (redundant)
or simply absent (discarded) — here they are demonstrably present, quoted above
with line numbers. No BUG-1301 precedence exception was invoked; no hunk was
dropped as obsolete. No code or test files were involved in this conflict.

The cherry-pick sequencer was left untouched: `CHERRY_PICK_HEAD` is still
present for `cherry_pick_finalize_resolution`. Only `git add --sparse` was
issued as a write.
