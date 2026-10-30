---
uid: report-b86d6d22
id: REPORT-5583
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-29T17:57:03.659018+00:00'
updated_at: '2026-09-29T17:57:03.659018+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/bug-034bf955.md` — intent/bookkeeping ticket (bug), UU,
  index-only (outside sparse cone, no working-tree markers). Rule 2e
  (per-fact later-positioned intent) → **ours** on all four conflicting
  facts; `git checkout --ours` + `git add --sparse`.

## Per-fact adjudication

Conflicting facts (base = `b42fd97aab`, incoming commit `44558546d3`, 2026-09-08 17:17):

| fact | ours (HEAD) | theirs (incoming) | winner |
|---|---|---|---|
| `updated_at` | 2026-09-19T15:15:29 | 2026-09-09T00:17:23 | ours |
| `completed_at` | 2026-09-14T10:29:07 | null | ours |
| `status` | `free_and_reconciled` | `bundled` | ours |
| `bundled_in` | `bundle-8e1807f6` | `bundle-4efd33fe` | ours |

Ledger (both sides, `%ad` + `%cd`):

- Theirs: `44558546d3` (09-08) is the **last** commit on the incoming side
  for this path — there is no subsequent genuine intent on that side.
- Ours: `21006caccb` (09-19, BUNDLE-27 reconcile bookkeeping) is main's
  latest genuine commit. (`730c848cb8` sits at the tip by commit date
  2026-09-28 but carries author date 2026-09-01 14:10:09 — it is this
  resync branch's own already-landed replay of xgd-working's
  `24b0c044bc`, not a main-side decision.)

Bundle replay test (memory's decisive check for a `bundled_in` conflict,
re-verified on this pick):

- `bundle-4efd33fe` (BUNDLE-24, created 09-09) and `bundle-8e1807f6`
  (BUNDLE-27, created 09-11) carry the **same title**
  ("REQ-155 + BUG-40 + REQ-160 + BUG-41 + BUG-42 + 3 more") and the
  **same `working_sha` list** → main re-created xgd-working's bundle
  under a new uid.
- Tie-break on what each bundle then did: BUNDLE-24 is
  `ready_to_reconcile`, `completed_at: null`, every `reconcile_sha`
  null, and now lives in `tickets/cold/` (archived by xgd-working
  itself). BUNDLE-27 is `free_and_reconciled` with `completed_at` set
  and a real `reconcile_sha` (`2cd4e5865d`) recorded.
- Incoming's `status: bundled` is an upstream waypoint on the same
  monotone lifecycle (`bundled` → `free_and_reconciled`) that ours
  already represents; nothing is discarded by taking ours.

Bodies are byte-identical apart from ours adding the missing trailing
newline, so ours is also the body-side superset. This is the same bundle
pair adjudicated identically on the four prior picks in this resync run
(request-01ea4eec / ec3aa36173, bug-3ade1af4 / 0e5ed3bec2,
bug-93851fea / 12ff4d89ca, +1) — outcome unchanged.

## Incoming changes preserved

No code or implementation files in this conflict — the commit touches a
single bookkeeping ticket. No incoming *code* was discarded. The three
incoming frontmatter facts are intentionally not carried forward: each is
an earlier position on the same fact that HEAD already advances past, per
rule 2e's per-fact timeline test, and `bundled_in: bundle-4efd33fe`
points at a bundle xgd-working itself archived without reconciling.

Resolution leaves no net change from HEAD for this path (`git status
--porcelain` is empty, conflict class cleared). Per STEP 4 this is staged
and exited @done as normal — `--skip` is left to the finalize step.
Retry count for `44558546d3` was 1 (first attempt); `CHERRY_PICK_HEAD`
verified still present at `44558546d375d1fc8b1d9c7bb20ef4fd9cb5a5d0`.
