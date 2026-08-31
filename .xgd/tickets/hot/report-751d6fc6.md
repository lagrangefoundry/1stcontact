---
uid: report-751d6fc6
id: REPORT-3098
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-22'
created_by: xgd
created_at: '2026-08-31T22:03:38.185769+00:00'
updated_at: '2026-08-31T22:03:38.185769+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-22
---

## Files resolved

- `.xgd/tickets/hot/bug-a98fb3b0.md` — UU, intent/bookkeeping ticket (rule 2e).
  Sole conflicted hunk is the frontmatter status block; body and `fields:` were
  identical on both sides and merged cleanly.
  - Ours (HEAD, `cbdfed2e2d` "seed_local_overlay bug bug-a98fb3b0", committed
    2026-08-31): `status: bundled`, `last_field_updated: status`,
    `updated_at: 2026-08-26T17:36:27Z`.
  - Theirs (incoming free_coded `0431fed4c6` "update bug bug-a98fb3b0",
    committed 2026-08-25): `status: ready_to_reconcile`,
    `last_field_updated: status`, `updated_at: 2026-08-25T22:52:44Z`.
  - Both sides changed the SAME fact (`status` + its two derived stamps), so the
    per-fact timeline rule applies. HEAD is later on both axes: ticket
    `updated_at` 2026-08-26 > 2026-08-25, and commit date 2026-08-31 > 2026-08-25.
    This also matches the auto-enrichment rule for this file ("take the more
    recent commit by timestamp").
  - Resolution: kept the HEAD side via `git checkout --ours`, staged with
    `git add --sparse` (path is outside the sparse-checkout cone, DOC-986 §2/§4.1).
  - No fields were invented; no `intent_uid`/`story_uid`/`capability_uid` touched.

## Incoming changes preserved

The incoming commit's only change is the lifecycle transition
`free_coded -> ready_to_reconcile` (plus the `updated_at` /
`last_field_updated` stamps that ride along with it). That transition is
already present in HEAD via a later route, not discarded:

- `xgd_source/core/dispatcher/dispatch_plan.py:665-668` (and again at 731-734)
  is the only producer of `status: bundled`: it consumes `ready_to_reconcile`
  members and writes `{"status": "bundled", "fields": {"bundled_in": <anchor>}}`.
  HEAD's file carries exactly that post-state — `status: bundled` with
  `fields.bundled_in: bundle-78f4e2fe`.
- So the ticket passed *through* `ready_to_reconcile` and was then bundled.
  Restoring the incoming value would regress the ticket's lifecycle and leave
  `status: ready_to_reconcile` contradicting the unconflicted
  `bundled_in: bundle-78f4e2fe` already in the same frontmatter.

This is the STEP 4 / BUG-1109-BUG-1122 case: the resolution nets to no staged
diff vs HEAD because the incoming effect landed through a different route, not
because developer intent was dropped. STEP 3's guard is satisfied — the incoming
commit's key change is present in HEAD, not merely absent.

No code, config, or UAT test files were in conflict; no hunks were dropped under
the BUG-1301 precedence exception.

Post-merge review flag (per the enrichment rule for unknown-intent files): the
ticket's status fact was decided by timestamp rather than by a declared intent
narrative — worth a glance if BUG-38's bundling in `bundle-78f4e2fe` is later
found inconsistent with this reconcile bundle (`bundle-8eef3846`).
