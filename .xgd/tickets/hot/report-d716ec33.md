---
uid: report-d716ec33
id: REPORT-4127
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-12T20:22:32.906986+00:00'
updated_at: '2026-09-12T20:22:32.906986+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/bug-23d1ec27.md` — UU, intent/bookkeeping ticket (rule 2e).
  Sole conflicted hunk was the frontmatter status fact:
  - ours: `status: bundled`, `updated_at: 2026-08-31T05:05:09Z` (from
    `09291354` `xgd(ticket): seed_local_overlay bug bug-23d1ec27`, 2026-08-31)
  - theirs: `status: ready_to_reconcile`, `updated_at: 2026-08-26T18:31:09Z`
    (incoming `bffb6b34`, 2026-08-26)
  Same fact changed on both sides -> per-fact timeline rule: kept the
  later-positioned side (ours, 2026-08-31 > 2026-08-26). The ours side is also
  the downstream lifecycle state: `ready_to_reconcile` -> `bundled`, and the
  non-conflicted `fields.bundled_in: bundle-8eef3846` in the same file is
  consistent only with `status: bundled`. Reverting to `ready_to_reconcile`
  would have left the ticket internally inconsistent.
  Resolution is byte-identical to the ours stage (verified with
  `git diff --no-index` against `git show :2:`); no markers remain and no
  ours-side content was dropped. Staged with `git add --sparse` (path is
  outside the sparse-checkout cone).

The large prose-body differences between the two stages did not conflict and
were not touched: the incoming commit `bffb6b34` changes only the 4 frontmatter
lines above (`3 insertions(+), 3 deletions(-)`), so the body merged cleanly to
the HEAD-side rendering.

## Incoming changes preserved

No code/implementation files in this conflict — the single file is a bug
bookkeeping ticket, not matrix state or source.

The incoming commit's only change is a bookkeeping status advance
(`free_coded` -> `ready_to_reconcile`). That is not absent from HEAD, it is
superseded: HEAD has already carried the same ticket further along the same
lifecycle to `status: bundled` with `bundled_in: bundle-8eef3846` recorded.
This is STEP 3's "present via a different route" case, not a discard of
developer content. No BUG-1301 precedence drops were needed.

The staged diff vs HEAD is therefore empty — the incoming commit's effect is
already in HEAD by a later route (BUG-1109/BUG-1122). Per STEP 4 this was
staged and left for the finalize step to skip; `--skip` was not called and
CHERRY_PICK_HEAD is intact.

## Post-merge review flag

Per the conflict-intent enrichment ("intent unknown on one or both sides"),
flagging this file for post-merge review: the ticket's `status` now reflects
the reconcile bundle's own seeded overlay rather than the developer's
`ready_to_reconcile` marker.
