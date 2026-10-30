---
uid: report-ae9250ef
id: REPORT-5582
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-29T17:54:31.152949+00:00'
updated_at: '2026-09-29T17:54:31.152949+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/bug-93851fea.md` (**BUG-41**, *"Library: an uploaded .md is stored undescribed because the browser sends no content type"*) — **intent/bookkeeping ticket** (`type: bug`), STEP 2e. Resolved **ours (HEAD)** on every conflicting fact. Path is outside the sparse cone (DOC-986 §2/§4.1), so `git checkout --ours -- <path>` then `git add --sparse -- <path>`, each as the sole content of its own call.
  - **Enrichment rule as given:** *"Intent unknown on one or both sides. Take the more recent commit by timestamp and flag this file for post-merge review."* Applied per-fact per 2e, after reconstructing the ledger on both sides rather than trusting raw timestamps.
  - **Three sides** (`:1` = parent of the cherry-picked commit on xgd-working):
    - base `:1` — `status: ready_to_reconcile`, `updated_at 2026-09-01T23:10:29`, `completed_at: null`, no `bundled_in`.
    - incoming `:3` (`12ff4d89ca`, 2026-09-08 17:17) — base **+** `status -> bundled`, `updated_at -> 2026-09-09T00:17:23`, `bundled_in: bundle-4efd33fe`. Nothing else.
    - ours `:2` — base **+** `status -> free_and_reconciled`, `completed_at: 2026-09-14T10:29:09`, `updated_at -> 2026-09-19T15:15:30`, `bundled_in: bundle-8e1807f6`.
  - **Bodies are byte-identical** between `:2` and `:3` — `diff` of the two index stages shows only the four frontmatter lines. The whole conflict is four facts.

## Per-fact resolution

| fact | base | incoming | ours | winner | why |
|---|---|---|---|---|---|
| `status` | `ready_to_reconcile` | `bundled` | `free_and_reconciled` | **ours** | same monotone lifecycle track; `bundled` precedes `free_and_reconciled`. Taking incoming regresses the ticket. |
| `completed_at` | `null` | `null` (unchanged) | `2026-09-14T10:29:09` | **ours** | not touched by incoming — no conflict of intent. |
| `updated_at` | 09-01 | 09-09 | 09-19 | **ours** | bookkeeping; follows the winning facts. |
| `bundled_in` | absent | `bundle-4efd33fe` | `bundle-8e1807f6` | **ours** | see below — the genuine conflict. |

### The `bundled_in` fact — main's newer commit is a replay, and still wins

BUG-41 is the fourth ticket of the same eight-ticket bundle to surface in this resync, so this is the **same bundle pair already adjudicated** in `resolve-377b581e-ec3aa36173.md` (REQ-155) and `resolve-377b581e-0e5ed3bec2.md` (BUG-40). Re-verified here rather than carried over:

- `bundle-4efd33fe` (**BUNDLE-24**, created on xgd-working 2026-09-08 17:17 — the same minute as the incoming commit) was **archived by xgd-working itself on 2026-09-09** (`2ba6f5bf20`, `hot/ -> archived/`) with every `reconcile_sha` still `null`. xgd-working abandoned it.
- `bundle-8e1807f6` (**BUNDLE-27**, main's re-creation of the same batch under a new uid — identical title and `working_sha` list) is the copy that stayed alive and carried the work forward, with activity through 2026-09-25 (`ea3c75397a`) and the reconciliation record that actually landed.
- `12ff4d89ca` is the **last** commit on the incoming side touching this path (its predecessors are all 2026-09-01), so there is no subsequent incoming intent to prefer. Incoming's final word (`bundled`) is an upstream waypoint that ours passed through and then completed.
- Pointing BUG-41 at `bundle-4efd33fe` would name an archived, never-reconciled bundle while erasing the completion record.

### Ledger (both sides, %ad / %cd)

Ours (HEAD):

```
94511b25a5  ad 2026-09-19 08:15  cd 2026-09-19 08:15  update bug          <- status: free_and_reconciled
593bc29a6c  ad 2026-09-17 13:23  cd 2026-09-19 08:04  seed_local_overlay  <- completed_at
4916adc343  ad 2026-09-11 14:08  cd 2026-09-14 03:15  seed_local_overlay  <- file seeded already at bundled + bundle-8e1807f6
```

Incoming (CHERRY_PICK_HEAD):

```
12ff4d89ca  2026-09-08 17:17  update bug  <- bundled + bundle-4efd33fe  (THIS PICK, last on its side)
3cebec8702  2026-09-01 16:10  update bug  <- base (:1)
04385bcaa1  2026-09-01 13:50  update bug
370ff62593  2026-09-01 13:49  update bug
dadea5a9b4  2026-09-01 13:46  update bug
daaaeaeabc  2026-09-01 13:43  update bug
d8ab3ec1b2  2026-09-01 13:41  create bug
```

Main's `4916adc343` introduced the path as a **new file** already carrying `bundled` / `bundle-8e1807f6` — a bulk overlay catch-up from far behind, not a response to the incoming commit. A replay in origin, but the copy that carried the ticket to reconciliation.

## Incoming changes preserved

No code or implementation file was in this conflict; the sole path is a bookkeeping ticket, so STEP 3's code-preservation check does not apply and no BUG-1301 precedence exception was invoked.

- **Body:** identical on both sides, carried verbatim.
- **`status`/`bundled_in`:** incoming's `bundled` state is represented by ours as a completed later stage of the same lifecycle, under the bundle that actually reconciled. No test touched.

Staged result is byte-identical to HEAD (ours was already HEAD's content), so the staged diff for this pick is empty (`git status --porcelain` produces no output) and no conflict-class lines remain. Per STEP 4 no `--continue`/`--skip`/`--quit`/`--abort` was called; `CHERRY_PICK_HEAD` is still present for Python's finalize step, which will detect the empty staged diff and skip the commit.

Retry count for this conflict SHA was 1 (first attempt); `prior_stage_failure` was empty. Full working notes: `.xgd/tmp/resolve-377b581e-12ff4d89ca.md`.
