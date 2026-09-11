---
uid: report-7f32ce4e
id: REPORT-3834
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-26'
created_by: xgd
created_at: '2026-09-11T01:06:52.861434+00:00'
updated_at: '2026-09-11T01:06:52.861434+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-26
---

## Files resolved

- `.xgd/tickets/hot/request-13a5e206.md` — **AA** (both added), intent/bookkeeping
  ticket (§2e). Rule applied: **keep the superset** (HEAD side), which is also the
  later side by timeline, matching the enrichment's "take the more recent commit by
  timestamp" fallback.
  - Incoming (`c2c4b393c8`, 2026-08-31 13:32 -0700): `xgd(ticket): create request
    request-13a5e206` — the original 105-line create (`status: draft`,
    `last_field_updated: created_at`, four fields).
  - HEAD (`d866371 21affb`, 2026-09-01 18:34 -0700): `xgd(ticket): update request
    request-13a5e206` — the same ticket 835 lines later in its life
    (`status: free_and_reconciled`, `completed_at` set, `version: 0.2.20`,
    `chat_comment`, `commits`, `orphan_commits`, plus the free-coded "What landed"
    record).
  - Not a per-fact split: there is no fact the incoming side asserts that the HEAD
    side does not already carry in a later form. Every frontmatter field on the
    incoming side (`priority: high`, `story_points: 13`, `auto_merge_back: true`,
    `needs_review: false`) is present on the HEAD side with identical values; the
    HEAD side only adds fields the incoming side never had.
  - Resolved with `git checkout --ours`, staged with `git add --sparse`
    (`.xgd/tickets/` is outside the sparse cone, DOC-986 §2/§4.1).

## Incoming changes preserved

No code/implementation files were conflicted — the single conflict is a request
ticket, and the incoming commit's entire content is the ticket's create state.

Containment was checked line by line: 67 non-blank body lines on the incoming
side, 56 present verbatim in the resolved file. The 11 that are not verbatim were
each read in context and are **superseded rewordings by the same author on the
same ticket**, not discards:

- "**1. The schema.** … as a migration beside the existing two" → HEAD names the
  file (`0003_ticket_store.sql`) and adds the `tenants`/`ALTER TABLE … config`
  paragraph.
- "**3. The TypePack**, carrying:" → renumbered to "**4. The TypePack**" because
  HEAD inserts a new deliverable 3 (the blob store / `1stcontact-material`). The
  section's own body (the §9 field block, the `republishable`/`exportable`
  rationale) is present unchanged.
- "- A ticket created through the Worker is readable back through it." → HEAD
  extends the same acceptance line with how it is asserted (`.workers.test.ts`
  against real D1/R2, no HTTP routes).
- "## Open questions" and its two bullets (`reference` as its own type; `brief` as
  a type vs. a well-known ticket) → HEAD answers them under "## Both open
  questions are now settled", resolving both in the direction the incoming side
  proposed.

STEP 3 outcome: the incoming commit's key change (this ticket, with its content)
is **present in HEAD via a later route**, not absent — the redundant case of
BUG-1109/BUG-1122, not the discarded case.

## Staging state

The staged tree is byte-identical to HEAD (`git diff --cached --stat` empty),
because the incoming create is wholly contained in the HEAD-side update. Per
STEP 4, `--skip` was NOT called; `CHERRY_PICK_HEAD` is intact and
`cherry_pick_finalize_resolution` will detect the clean staged diff. No
conflict-class entries remain in `git status --porcelain`.

## Flagged for post-merge review

Per the enrichment rule for unknown-intent sides: `request-13a5e206` (REQ-162)
resolved to the HEAD side wholesale. Low risk — the two sides are the same ticket
at two points in its own lifecycle, not competing edits.
