---
uid: report-c77bc71a
id: REPORT-5604
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-29T19:32:18.939957+00:00'
updated_at: '2026-09-29T19:32:18.939957+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

# Resync conflict resolution — request-8b33a146 (REQ-172)

**Cherry-picked commit:** `12f100a092` (`xgd(ticket): update request request-8b33a146`, 2026-09-09 14:31:17 -0700, xgd-working)
**Apply target:** `9ac98712a708888db67f8aff21f22b16bd98094e`
**Anchor:** `report-377b581e` · retry count 1 · `prior_stage_failure` empty
**Resolution:** `--ours` — zero net change from HEAD.

> Note: this run arrived with an empty mission body (known recurring prompt-render
> bug). Arguments were recovered from the newest `resync_stage_resolution` context
> event in `.xgd/logs/session-r5299035e.jsonl`; policy from
> `xgd_source/prompts/validation/resync_stage_resolution.yaml`.

## STEP 1 — Inventory

One conflict: `UU .xgd/tickets/hot/request-8b33a146.md`. The path is outside the
sparse cone, so there was no working-tree file and no conflict markers; all three
sides were read from the index.

## STEP 2 — Three-way sides

| stage | blob | `updated_at` | `completed_at` | `status` | `bundled_in` |
|---|---|---|---|---|---|
| `:1:` base | `d7fcabb9f2` | 09-09T00:17 | null | `bundled` | `bundle-4efd33fe` |
| `:2:` ours | `284e1e08f9` | 09-19T15:15:29 | 09-14T10:29:05 | `free_and_reconciled` | `bundle-8e1807f6` |
| `:3:` theirs | `5545984cba` | 09-09T21:31 | null | `ready_to_reconcile` | *(removed)* |

Theirs is the **third shape**: a combined status-flip + unbundle out of
`bundle-4efd33fe` in a single commit. Body untouched on theirs — the pick is
frontmatter-only.

## STEP 3 — Decision and evidence

The decisive read was `git show xgd-working:<path>` (incoming branch's own final
state), run before any bundle-pair adjudication:

- xgd-working's tip blob `930d6a355a` carries `status: free_and_reconciled`,
  `completed_at: 2026-09-14T10:29:05`, **`bundled_in: bundle-8e1807f6`** — i.e.
  *main's* bundle. It differs from `:2:` (ours) only in `updated_at`
  (09-19T15:15:37 vs 09-19T15:15:29, 8 seconds). Both sides already agree who
  owns the ticket, so **no `bundle-4efd33fe` vs `bundle-8e1807f6` comparison was
  needed**.
- xgd-working itself superseded the picked commit two days later in
  `e5c7208176` (09-11 11:53:54), which restores **every** fact the pick touched:
  `status` → `bundled`, `bundled_in: bundle-8e1807f6`, and `updated_at`. The
  removal is subsumed, not lost.
- The enrichment's naive "intent unknown → take the more recent commit by
  timestamp" rule agrees with `--ours` here (ours' `updated_at` is later by ten
  days), but only incidentally; the superseding-commit evidence is what settles
  it.

**Incoming ledger** (`xgd-working`, this path):
`d1d63bebd3` (create, 09-01) … `d413df84f4` (09-08, already resolved on this
branch) → **`12f100a092` (this pick)** → `e5c7208176` (09-11, re-bundle into
`bundle-8e1807f6`) → `1c9f59d330` (09-14, `free_and_reconciled` + `completed_at`)
→ `798a8a5ee0` (09-15, reverts to `bundled`) → `d1453db0b6` (09-19, tip,
`free_and_reconciled` again).

**Ours ledger** (HEAD): `4e1f573fd5` / `4f7e3ca510` (`seed_local_overlay`),
`679bec6ef0` (09-19 08:15:29 — main's own equivalent of the tip, 8 s earlier),
`35a579abb2` (resync replay of the create; author date 09-01, commit date 09-28).

## STEP 4 — Verification

- `git status --porcelain` — empty.
- `git ls-files -u` — no unmerged entries.
- `git diff --cached HEAD` — empty (**zero net change**; finalize will skip the
  commit).
- `CHERRY_PICK_HEAD` still `12f100a092` — no `--continue` / `--skip` / `--quit` /
  `--abort` was run.
- Only the conflicting commit's own path was staged. Each git write was issued as
  the sole content of its own call.

## Forecast for the remaining picks on this path

Ours already carries the **terminal** state of this ticket, so every remaining
xgd-working commit on this path is a waypoint that ours already represents:

| pick | date | what it does | expected |
|---|---|---|---|
| `e5c7208176` | 09-11 | re-bundle into `bundle-8e1807f6`, `status` → `bundled` | `--ours`, zero net change |
| `1c9f59d330` | 09-14 | `free_and_reconciled` + `completed_at` | `--ours`, zero net change |
| `798a8a5ee0` | 09-15 | **reverts** `status` to `bundled` | `--ours`, zero net change |
| `d1453db0b6` | 09-19 | tip: `free_and_reconciled`, `updated_at` +8 s | `--ours`; only an 8-second `updated_at` delta, no new fact |

**Trap, same as request-51514090:** the lifecycle status moves *backward* here
(`free_and_reconciled` at 09-14 → `bundled` at 09-15 → `free_and_reconciled` at
09-19), so "monotone lifecycle" is not a safe assumption. Unlike bug-360c5a44 and
request-51514090, the tip here is **not** an exception — ours already holds
`free_and_reconciled` + `completed_at` + `bundle-8e1807f6`, and the tip adds only
an 8-second `updated_at` bump.
