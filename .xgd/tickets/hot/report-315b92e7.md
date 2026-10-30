---
uid: report-315b92e7
id: REPORT-5608
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-29T19:45:45.995328+00:00'
updated_at: '2026-09-29T19:45:45.995328+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

# Resync resolve conflicts — bug-3ade1af4 (BUG-40)

- Resync branch: `resync-377b581e`
- Anchor: `report-377b581e`
- Apply target (candidate publish tip): `9ac98712a708888db67f8aff21f22b16bd98094e`
- HEAD at resolution: `37f1ec69c5a03de4ae85e9fbd128ea67ac2e43c7`
- Cherry-picked (incoming) commit: `c375e56e53` (2026-09-09 14:31:18 -0700)
- Conflicting path: `.xgd/tickets/hot/bug-3ade1af4.md` (materialized with markers)
- Retry count for this conflict sha: 1
- Outcome: **`--ours`**, zero net change from HEAD (finalize will skip the empty commit)

Note: this is the SECOND pick on this ticket on this branch — `0e5ed3bec2` was
resolved earlier. A ticket reappearing is normal; the resync queue walks
xgd-working's history one commit at a time.

## Shape

"Third shape" (no bundle-pair adjudication needed). Incoming `c375e56e53` is a
combined status-flip + unbundle out of `bundle-4efd33fe`:

- `updated_at` 2026-09-09T00:17:23 → 2026-09-09T21:31:18
- `status` `bundled` → `ready_to_reconcile`
- `bundled_in: bundle-4efd33fe` removed

## Decisive evidence

**1. Incoming branch's own final state agrees with ours.**
`git show xgd-working:.xgd/tickets/hot/bug-3ade1af4.md` vs `:2:` (ours) differs
in `updated_at` ONLY (2026-09-19T15:15:31.624433 ours vs
2026-09-19T15:15:46.300383 tip — 14.7 s). Both sides carry
`status: free_and_reconciled`, `completed_at: 2026-09-14T10:29:13`,
`bundled_in: bundle-8e1807f6`. Since the two sides never disagree about which
bundle owns the ticket, the `bundle-4efd33fe` vs `bundle-8e1807f6` pair analysis
is moot.

**2. The removal is subsumed, not lost.** xgd-working itself superseded
`c375e56e53` two days later with `f07da33a26` (2026-09-11 11:53:54), which
restores every fact the unbundle touched:

- `updated_at` → 2026-09-11T18:53:54
- `status` `ready_to_reconcile` → `bundled`
- `bundled_in: bundle-8e1807f6` re-added — main's bundle, the one ours carries

So `--ours` preserves the developer's own later decision rather than discarding
incoming intent.

**3. Base-vs-ours** confirms ours is strictly ahead on the same lifecycle:
`updated_at` 09-09 → 09-19, `completed_at` null → 09-14T10:29:13,
`status` `bundled` → `free_and_reconciled`,
`bundled_in` `bundle-4efd33fe` → `bundle-8e1807f6`.

The auto-enrichment's naive "intent unknown → take the more recent commit by
timestamp" rule happens to agree with `--ours` here (ours' `updated_at` is
09-19 vs theirs' 09-09), but that agreement is incidental — the superseding-blob
test is what settles it.

## Forecast for the remaining picks on this ticket

xgd-working ledger after `c375e56e53` (author == commit date throughout):

| # | sha | date | `updated_at` | `status` | `bundled_in` | verdict |
|---|-----|------|--------------|----------|--------------|---------|
| 1 | `f07da33a26` | 09-11 11:53:54 | 09-11T18:53:54 | `bundled` | `bundle-8e1807f6` | `--ours` |
| 2 | `d2414ced51` | 09-14 03:29:13 | 09-14T10:29:13 | `free_and_reconciled` | `bundle-8e1807f6` | `--ours` |
| 3 | `d137bd257e` | 09-15 18:48:35 | 09-16T01:48:35 | `bundled` | `bundle-8e1807f6` | `--ours` |
| 4 | `79bbb8e08f` | 09-19 08:15:46 | 09-19T15:15:46 | `free_and_reconciled` | `bundle-8e1807f6` | **NOT blanket `--ours`** |

Ours already holds the terminal state (`free_and_reconciled` + `completed_at` +
`bundle-8e1807f6`), so picks 1–3 are all `--ours` with zero net change.

**The tip `79bbb8e08f` IS the exception**: its `updated_at` is 14.7 s later than
ours and nothing else differs, so incoming wins that one fact. Per the
ours-vs-tip-diff rule, a non-empty diff at the tip ⇒ exception.

**Backward-lifecycle trap** (same as request-51514090 / request-8b33a146 /
bug-034bf955 / bug-93851fea): `status` moves
`free_and_reconciled` (09-14) → `bundled` (09-15) → `free_and_reconciled` (09-19).
Do not assume a monotone lifecycle when adjudicating pick 3.

## Verification

`git status` after staging: "all conflicts fixed", working tree clean, nothing to
commit — i.e. the resolution is byte-identical to HEAD, as forecast.
Test suites were not run: the workerd/wrangler projects are unrunnable in a
headless role (`listen EPERM`), and this change is ticket metadata only, with
zero net tree change.
