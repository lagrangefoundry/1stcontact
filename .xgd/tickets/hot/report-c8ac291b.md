---
uid: report-c8ac291b
id: REPORT-5586
type: report
title: Resolve bug-360c5a44 conflict during resync cherry-pick fe02979305
created_by: xgd
created_at: '2026-09-29T18:05:41.018039+00:00'
updated_at: '2026-09-29T18:05:41.018039+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Conflict

Cherry-picking `fe02979305` (`xgd(ticket): update bug bug-360c5a44`) onto
`resync-377b581e` conflicted on `.xgd/tickets/hot/bug-360c5a44.md`.
Retry count for this SHA: 1.

Enrichment reported "intent unknown on both sides — take the more recent commit
by timestamp". That rule was not applied blindly; the ledger and bundle replay
test were reconstructed first.

## Three-way facts

Four frontmatter facts differ. Bodies are byte-identical.

| fact | base (`:1:`) | ours (`:2:`) | theirs (`:3:`) |
|---|---|---|---|
| `updated_at` | 2026-09-02T00:39:00 | 2026-09-19T15:15:28 | 2026-09-09T00:17:24 |
| `completed_at` | null | 2026-09-14T10:29:01 | null |
| `status` | `ready_to_reconcile` | `free_and_reconciled` | `bundled` |
| `bundled_in` | (absent) | `bundle-8e1807f6` | `bundle-4efd33fe` |

## Adjudication

The conflicting fact is `bundled_in`, so the replay test runs on the two BUNDLE
tickets rather than the bug ticket:

- `bundle-8e1807f6` (ours) and `bundle-4efd33fe` (theirs) carry the identical
  title `REQ-155 + BUG-40 + REQ-160 + BUG-41 + BUG-42 + 3 more`. Main re-created
  xgd-working's bundle under a new uid; identity alone decides nothing.
- Tie-break on what each bundle then did: ours is `free_and_reconciled` with
  `completed_at: 2026-09-14T10:28:58` and a real `reconcile_sha`
  (`2cd4e5865d...`); theirs is `ready_to_reconcile` with `completed_at: null`
  and every `reconcile_sha` null. Ours is the bundle that actually reconciled.
- `fe02979305` is the tip of the incoming side for this path, so there is no
  later incoming intent to prefer. Its `status: bundled` is an earlier waypoint
  on the monotone `bundled` -> `ready_to_reconcile` -> `free_and_reconciled`
  lifecycle that ours already represents — superseded, not discarded.

## Resolution

`--ours` on all four facts: `git checkout --ours` then `git add --sparse` on
`.xgd/tickets/hot/bug-360c5a44.md` (the only path in the commit's diff). The
resolution leaves zero net change from HEAD, so finalize will skip the commit.

This is the eighth ticket in this bundle pair to hit `resync-377b581e` one
commit at a time; the per-fact outcome matches the prior seven
(request-01ea4eec, bug-3ade1af4, bug-93851fea, bug-034bf955, request-8b33a146,
request-51514090, +1) and was re-verified against both bundle tickets here.
