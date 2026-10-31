---
uid: report-6c9f0648
id: REPORT-6941
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-34'
created_by: xgd
created_at: '2026-10-31T21:15:07.800334+00:00'
updated_at: '2026-10-31T21:15:07.800334+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-34
---

## Files resolved

- `.xgd/tickets/hot/bug-360c5a44.md` — intent/bookkeeping ticket (2e), UU. Rule: per-fact; take the superset where one exists, otherwise the later-dated side.
  - Front matter (updated_at / completed_at / last_field_updated / status): kept HEAD (e8f9e7c85b, 2026-09-19, status free_and_reconciled). Incoming fd72594eb0 (2026-09-01) would have set status back to draft and completed_at to null. HEAD is later.
  - Fix section, "throwing callback is swallowed" paragraph: HEAD-only addition, kept.
  - Test plan panel/app bullets: HEAD's text is a strict superset of incoming's (adds the counter payload, the throwing-callback case, and the app bullet). Kept HEAD.

## Incoming changes preserved

Every body edit in fd72594eb0 is in the resolved file: the Symptom sentence about the manual refresh, the "when the assistant writes" Root cause headline, the new "What is wanted" section, the per-write rewrite of Fix step 1, the reworded "Only a counter that actually moved" paragraph, and the per-write workerd test bullet. The only incoming lines not kept are the stale front-matter values and the old panel-bullet wording, which HEAD's later edit replaced. No BUG-1301 drops.
