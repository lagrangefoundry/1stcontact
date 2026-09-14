---
uid: report-62d40a72
id: REPORT-4209
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-14T03:23:45.333376+00:00'
updated_at: '2026-09-14T03:23:45.333376+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/request-8b33a146.md` (REQ-172) — **UU**, sparse-excluded
  (index-only conflict, no working-tree markers). Rule **2e** (intent/bookkeeping
  ticket, `request-*`): "one side is a strict superset" → keep ours.

  - **Ours (HEAD)** is a single `seed_local_overlay` commit (`07434265b8`)
    carrying the ticket's current xgd-working state: `updated_at`
    `2026-09-11T18:53:54`, `status: bundled`, plus `fields.commits`,
    `fields.version: 0.2.37` and `fields.bundled_in: bundle-8e1807f6` — this
    very reconcile bundle. Its body has also been substantially expanded
    (JSON/XML in the render table, the `resolveContentType` filename fallback,
    the BUG-42 cold-load repaint, the SVG/HTML carve-outs, reader teardown,
    the `markdown.js` re-export seam, and an enlarged test plan).
  - **Theirs (incoming `e558098f12`)** is the `2026-09-01T21:20:09` step,
    `status: free_coding`.

  Ours is a strict superset at the `fields` level (all four of theirs' fields
  present, plus three more) and later on every scalar the incoming commit
  touched. No disjoint content exists on the incoming side to merge back in,
  so this is not a per-fact timeline split — no `working-timeline` call was
  needed.

## Incoming changes preserved

The incoming commit's complete diff is four frontmatter lines plus a
no-newline-at-EOF change — **it contains no body hunks at all**, so the large
body divergence between the two sides is entirely HEAD-side evolution, not
incoming content at risk of being dropped. Each incoming change:

- `last_field_updated: title` -> `status` — **present verbatim** in the
  resolution.
- `status: draft` -> `free_coding` — **present via a later route.** HEAD holds
  `bundled`, a strictly downstream state in the same request lifecycle,
  corroborated by `fields.bundled_in: bundle-8e1807f6`. The incoming
  transition already happened and has since been advanced past.
- `updated_at: 21:16:28` -> `21:20:09` — superseded by HEAD's
  `2026-09-11T18:53:54`, ten days later on the same timeline.
- trailing-newline removal — cosmetic; the overlay's canonical serialization
  governs.

This is the redundant-commit case of STEP 4 (and the seeded-overlay pattern
generally): the staged diff against HEAD is empty because the overlay already
carries this commit's effect and more, **not** because developer intent was
discarded. STEP 3's discard test passes — the incoming commit's key changes
are present in HEAD, not merely absent. `--skip` was not called; left to
`cherry_pick_finalize_resolution`.

No BUG-1301 precedence exception was invoked; no test file was involved.
