---
uid: report-3284fb61
id: REPORT-5580
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-29T17:47:12.807878+00:00'
updated_at: '2026-09-29T17:47:12.807878+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/bug-3ade1af4.md` (BUG-40) — **intent/bookkeeping ticket** (`type: bug`), STEP 2e. Resolved **ours (HEAD)** on every conflicting fact; incoming contributed nothing else. `git checkout --ours -- <path>` + `git add --sparse -- <path>` (path is under `.xgd/tickets/`, DOC-986 §2/§4.1).
  - **Enrichment rule as given:** *"Intent unknown on one or both sides. Take the more recent commit by timestamp and flag this file for post-merge review."* Applied per-fact per 2e, after reconstructing the ledger on both sides rather than trusting raw timestamps.
  - **Three sides** (`:1` = parent of the cherry-picked commit on xgd-working):
    - base `:1` — `status: ready_to_reconcile`, `updated_at 2026-09-01T19:34`, `completed_at: null`, no `bundled_in`.
    - incoming `:3` (`0e5ed3bec2`, 2026-09-08 17:17) — base **+** `status → bundled`, `updated_at → 2026-09-09T00:17`, `bundled_in: bundle-4efd33fe`. Nothing else.
    - ours `:2` — base **+** `status → free_and_reconciled`, `completed_at: 2026-09-14T10:29:13`, `updated_at → 2026-09-19T15:15:31`, `bundled_in: bundle-8e1807f6`.
  - **Bodies are byte-identical** between `:2` and `:3` — `diff` of the two index stages shows only the four frontmatter lines. The whole conflict is four facts.

## Per-fact resolution

| fact | base | incoming | ours | winner | why |
|---|---|---|---|---|---|
| `status` | `ready_to_reconcile` | `bundled` | `free_and_reconciled` | **ours** | same monotone lifecycle track; `bundled` precedes `free_and_reconciled`. Taking incoming regresses the ticket. |
| `completed_at` | `null` | `null` (unchanged) | `2026-09-14T10:29:13` | **ours** | not touched by incoming — no conflict of intent. |
| `updated_at` | 09-01 | 09-09 | 09-19 | **ours** | bookkeeping; follows the winning facts. |
| `bundled_in` | absent | `bundle-4efd33fe` | `bundle-8e1807f6` | **ours** | see below — the genuine conflict. |

### The `bundled_in` fact — main's newer commit is a replay, and still wins

The standing caution is that main often re-does, days later, a batch xgd-working already committed, so main's newer timestamp can be a stale-state catch-up rather than a later decision. That is what happened here — and it still resolves to ours, for a reason that had to be checked rather than assumed. This is the same bundle pair already adjudicated this run on the sibling ticket `request-01ea4eec` (REQ-155) in `resolve-377b581e-ec3aa36173.md`; the finding is re-verified below, not carried over.

- `bundle-4efd33fe` (**BUNDLE-24**, created on xgd-working 2026-09-08 17:17, the same minute as the incoming commit) and `bundle-8e1807f6` (**BUNDLE-27**, created on main 2026-09-11 via `seed_local_overlay`) carry the **identical title** (`REQ-155 + BUG-40 + REQ-160 + BUG-41 + BUG-42 + 3 more`) and the **identical `working_sha` list** (`835230e1bd`, `8b484d5832`, `6d345f3303`, `d019bab772`, `32366f9e2d`, `eb6655c337`, `a34527e3c7`, `f5807330c6`, …). BUNDLE-27 is a re-creation of BUNDLE-24 — main never received it.
- The tie-break is what each bundle then *did*. `bundle-4efd33fe` was **archived on xgd-working on 2026-09-09** (`2ba6f5bf20`, `hot/ → archived/`) with every `reconcile_sha` still `null` — xgd-working itself abandoned it. `bundle-8e1807f6` went on to reconcile: `reconcile_sha 2cd4e5865d` on the `32366f9e2d` entry, `completed_at 2026-09-14T10:28:58`, `status: free_and_reconciled`.
- `0e5ed3bec2` is the **last** commit on the incoming side touching this path, so there is no subsequent incoming intent to prefer. Incoming's final word (`bundled`) is an upstream waypoint that ours passed through and then completed.
- Pointing BUG-40 at `bundle-4efd33fe` would name a bundle that is archived and never reconciled, while erasing the reconciliation record that actually landed.

### Ledger (both sides, `%ad` / `%cd`)

Ours (HEAD):

```
959fade37c  ad 2026-09-19 08:15  cd 2026-09-19 08:15  update bug          <- status: free_and_reconciled
29bdc256d7  ad 2026-09-17 13:23  cd 2026-09-19 08:04  seed_local_overlay  <- completed_at
7d4b20a363  ad 2026-09-11 14:08  cd 2026-09-14 03:15  seed_local_overlay  <- file seeded already at bundled + bundle-8e1807f6
```

Incoming (`CHERRY_PICK_HEAD`):

```
0e5ed3bec2  2026-09-08 17:17  update bug  <- bundled + bundle-4efd33fe  (THIS PICK)
d22ba37c40  2026-09-01 12:34  update bug  <- base (:1)
cb4ece9296  2026-09-01 12:30  update bug
d975830c32  2026-09-01 12:28  update bug
...  (create bug 3fc6491817, 2026-09-01 12:01)
```

Main's `7d4b20a363` introduced the path as a **new file** already carrying `bundled` / `bundle-8e1807f6` — a bulk overlay catch-up from far behind, not a response to the incoming commit. It is a replay in origin, but it is the copy that carried the work to reconciliation.

## Incoming changes preserved

No code or implementation file was in this conflict; the sole path is a bookkeeping ticket, so STEP 3's code-preservation check does not apply. Nothing of substance from incoming is lost:

- **Body:** identical on both sides, carried verbatim.
- **`status`/`bundled_in`:** incoming's `bundled` state is represented by ours as a completed later stage of the same lifecycle, under the bundle that actually reconciled. No BUG-1301 precedence exception invoked; no test touched.

Staged result is byte-identical to HEAD (ours was already HEAD's content), so the staged diff for this pick is empty. Per STEP 4 no `--skip` was called — Python's finalize step owns that.
