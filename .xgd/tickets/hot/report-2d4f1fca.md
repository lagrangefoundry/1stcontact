---
uid: report-2d4f1fca
id: REPORT-3088
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-22'
created_by: xgd
created_at: '2026-08-31T21:40:52.533592+00:00'
updated_at: '2026-08-31T21:40:52.533592+00:00'
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

  Incoming commit `82518d60` ("xgd(ticket): update bug bug-a98fb3b0",
  2026-08-24 22:16 UTC) fills the ticket out from the seed stub: sets `title`,
  adds `severity: high`, moves `status` `draft` -> `free_coding`, and writes the
  whole body (Symptom / Root cause / Fix / Test plan).

  Per-fact comparison against HEAD (`git diff <theirs-blob> <ours-blob>`):
  - `title` — byte-identical on both sides. No conflict.
  - `severity: high` — identical on both sides. No conflict.
  - Body (Symptom / Root cause / Fix / Test plan) — byte-identical on both
    sides, modulo a trailing newline. No conflict.
  - `status` — the only fact that genuinely differs: incoming `free_coding`
    (updated_at 2026-08-24T22:16:14), HEAD `bundled`
    (updated_at 2026-08-26T17:36:27). Same field changed differently, so the
    timeline rule applies to this fact: HEAD is the later position and is the
    downstream lifecycle successor of the incoming value for this same ticket
    (free_coding -> bundled). Kept HEAD's `bundled`. This also matches the
    auto-enrichment guidance for this file ("take the more recent commit by
    timestamp"). Taking the incoming value would regress the ticket's status
    and orphan the bundling fields below.
  - `commits` / `version: 0.2.14` / `story_points: 2` /
    `bundled_in: bundle-78f4e2fe` — present only on HEAD, written by the
    bundling workflow after the incoming commit. Kept.

  HEAD is therefore a strict superset of every fact the incoming commit
  writes; taking it loses nothing from either side. No content was invented.

## Incoming changes preserved

- `.xgd/tickets/hot/bug-a98fb3b0.md`: every change in the incoming diff is
  present in the resolved file — `title` (line 5), `severity: high` (line 18),
  and the full body: `## Symptom` (28), `## Root cause` (37), `## Fix` (67),
  `## Test plan` (79). The only incoming value not carried over is
  `status: free_coding`, deliberately superseded by HEAD's later `bundled` per
  the per-fact timeline rule above — not a discard of developer content.

No code/implementation files were involved in this conflict. No hunks were
dropped under the BUG-1301 precedence exception.

## Note on the staged diff

`git diff --cached --stat HEAD` is empty: this commit's content already reached
HEAD through a later route (the seed_local_overlay / bundling side, which
carries the identical title, severity and body plus the advanced status). This
is the redundant-commit case (BUG-1109/BUG-1122), not a discard — STEP 3's
check confirms the incoming changes are *present* in HEAD rather than absent.
`--skip` was not called; the file is staged and the cherry-pick sequencer state
(CHERRY_PICK_HEAD = 82518d60) is left intact for
`cherry_pick_finalize_resolution`.
