---
uid: report-f18c3f9a
id: REPORT-5620
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-29T23:28:57.072384+00:00'
updated_at: '2026-09-29T23:28:57.072384+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

# Resync resolve conflicts — `e1a5e0f8a1` on `.xgd/tickets/hot/bug-034bf955.md`

- Anchor: `report-377b581e` (branch `resync-377b581e`)
- Apply target: `9ac98712a708888db67f8aff21f22b16bd98094e`
- HEAD at start: `f38bc7ef24791e08a21b5d21c083115cede380c7`
- `CHERRY_PICK_HEAD`: `e1a5e0f8a1863b0b67738aecfd6366e8a65ddb6e`
  (xgd-working, 2026-09-11 11:53:54 — the re-bundle into `bundle-8e1807f6`)
- `prior_stage_failure`: empty

## STEP 1 — Inventory

One conflict: `UU .xgd/tickets/hot/bug-034bf955.md` (BUG-42, "Builder: markdown
shows as source on first load, and never renders in the Library"). Materialized
in the working tree. Stage blobs:

| stage | blob |
| --- | --- |
| `:1:` base | `6763965aab` |
| `:2:` ours | `64c6c0f135` (== the `HEAD` blob for the path) |
| `:3:` theirs | `91ed8faee2` |

This is the **third pick** on this ticket on this branch (`44558546d3` and
`10870912ac` were resolved earlier), which is normal for the resync queue — it
walks xgd-working's history one commit at a time.

## STEP 2 — Resolution

Classification: §2e, an intent/bookkeeping ticket file. Resolved **`--ours`**,
adjudicated per fact. Both sides' deltas are frontmatter-only; neither touches
the body (ours adds a trailing newline, which the base lacked).

| fact | base | theirs | ours |
| --- | --- | --- | --- |
| `updated_at` | 09-09T21:31:17.84 | 09-11T18:53:54.42 | **09-19T15:15:29.76** |
| `completed_at` | null | null | **09-14T10:29:07.36** |
| `status` | `ready_to_reconcile` | `bundled` | **`free_and_reconciled`** |
| `bundled_in` | absent | `bundle-8e1807f6` | `bundle-8e1807f6` — identical |

`bundled_in` being **byte-identical on both sides is the fast exit**: the two
sides agree which bundle owns the ticket, so there is nothing to adjudicate and
no `bundle-4efd33fe`-vs-`bundle-8e1807f6` pair analysis is needed. The only
divergences are `updated_at`, `completed_at` and `status`, and ours is strictly
later on all three.

The enrichment's fallback rule ("intent unknown → take the more recent commit
by timestamp") happens to agree with `--ours` here (ours' `updated_at` is
09-19 vs theirs' 09-11), but that agreement is incidental — the subsumption
argument below is what settles it.

## STEP 3 — Incoming intent preserved

Not a code file, and no hunk was dropped. Theirs' `status: bundled` and its
09-11 `updated_at` are transient waypoints that **xgd-working's own later
history advanced past**, to exactly the state ours holds: `db928873d0` (09-14
03:29:07) writes `completed_at: 2026-09-14T10:29:07.362661+00:00` and
`status: free_and_reconciled` — byte-identical to ours' values. So honouring
ours discards no incoming decision; it preserves the later one. No BUG-1301
exception needed.

**Backward-lifecycle trap** (recorded again for this ticket): the lifecycle is
not monotone on xgd-working — `free_and_reconciled` (09-14) → `bundled` (09-15)
→ `free_and_reconciled` (09-19). A `status` that looks like regression on a
later commit is real history, so don't infer ordering from the lifecycle value.

## STEP 4 — Staged and clean

`git checkout --ours -- <path>` then `git add --sparse -- <path>`, each issued
as the sole content of its own call and verified separately. Ours' blob
`64c6c0f135` IS the `HEAD` blob, so the resolution leaves **zero net change
from HEAD** — `git status --porcelain` is completely empty. Per the
instructions, `--skip` was NOT called; finalize will detect the clean staged
diff and skip the commit. `CHERRY_PICK_HEAD` is still present at
`e1a5e0f8a1`.

## STEP 5 — Forecast for the remaining picks on this path

xgd-working's ledger for `.xgd/tickets/hot/bug-034bf955.md` has 12 commits;
four are now resolved (`44558546d3`, `10870912ac`, `e1a5e0f8a1`, plus the
pre-bundling history that auto-merged). Three remain, all re-verified live
against their blobs:

| pick | date | what it does | outcome |
| --- | --- | --- | --- |
| `db928873d0` | 09-14 03:29 | writes the exact `completed_at` + `status: free_and_reconciled` ours already has | `--ours` |
| `d0bab67c2b` | 09-15 18:48 | backward move to `status: bundled`, `updated_at` 09-16 < ours' 09-19 | `--ours` |
| `e269a1b69f` | 09-19 08:15 | tip — **exception**, see below | `--ours` except `updated_at` |

**Correction to the earlier forecast for this ticket.** A prior report on
`10870912ac` predicted all four remaining picks would be blanket `--ours` with
no tip exception. The live ours-vs-tip diff says otherwise: `git diff
64c6c0f135 e269a1b69f:<path>` is NOT empty — the tip's `updated_at` is
`2026-09-19T15:15:48.590661+00:00` against ours' `2026-09-19T15:15:29.760393`,
**18.8 s later**, with `completed_at`, `status` and `bundled_in` identical and
the body differing only by ours' trailing newline. So incoming wins
`updated_at` alone on the tip; everything else stays ours. This is the
ours-vs-xgd-working-tip-diff rule doing its job: whether the tip is an
exception turns on that diff being empty or not, not on whether ours holds the
terminal lifecycle state.

## Verification scope

Read-level only. The caretaker rule forbids `test_fix`, and this repo's
workerd/wrangler suites are unrunnable in a headless role (`listen EPERM`), so
nothing here implies tests were run or passed. The resolution is a
frontmatter-only ticket-metadata decision with zero net change to the tree,
which is verifiable entirely from the index and blobs — and was.
