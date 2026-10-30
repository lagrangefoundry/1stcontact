---
uid: report-ea93426b
id: REPORT-5599
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-29T18:59:06.182660+00:00'
updated_at: '2026-09-29T18:59:06.182660+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

# Resync conflict resolution: `request-26dafd83` (REQ-165) — quartet position 2

- **Cherry-picked commit**: `d7105ebe3d` — `xgd(ticket): update request request-26dafd83` (2026-09-09 10:03:16 -0700, xgd-working) — the **unbundle**, 1 second after position 1
- **Conflicting file**: `.xgd/tickets/hot/request-26dafd83.md` (single file, whole diff of the pick)
- **Resolution**: `--ours` (keep HEAD's blob verbatim) → **zero net change from HEAD**; finalize will skip the empty commit.
- **Retry count for this SHA**: 1 (first attempt)
- **HEAD**: `956b96b079`, unmoved — position 1 (`f40537aa6b`) also resolved to zero net change in the immediately preceding invocation (scope `1798`), so its commit was skipped.
- **Apply target / candidate publish tip**: `9ac98712a708888db67f8aff21f22b16bd98094e`

## Files resolved

- `.xgd/tickets/hot/request-26dafd83.md` — class **2e** (intent/bookkeeping ticket, `request-*`; outside the sparse cone, so the conflict lived only in the index with no working-tree markers → `git checkout --ours` + `git add --sparse`). Adjudicated **per fact**, not whole-file.

## Three-way divergence

| fact | `:1:` base | `:2:` ours (HEAD) | `:3:` theirs (incoming) |
|---|---|---|---|
| `updated_at` | `2026-09-09T17:03:15` | `2026-09-09T21:32:49` | `2026-09-09T17:03:16` |
| `last_field_updated` | `status` | `status` | `bundled_in` |
| `status` | `ready_to_reconcile` | `bundled` | `ready_to_reconcile` |
| `bundled_in` | `bundle-203b1dc2` | `bundle-87be4669` | *(removed)* |

Base is now position 1's result (`f40537aa6b`'s blob) — the queue advanced exactly as
forecast in the position-1 report. Ours is unmoved.

Theirs touches three facts relative to base: `updated_at`, `last_field_updated`
(`status` → `bundled_in`), and it **removes** `bundled_in` outright.

## Why the removal is subsumed rather than discarded

xgd-working's ledger for this path is the stable four-commit quartet:

| pos | sha | when | what |
|---|---|---|---|
| 1 | `f40537aa6b` | 09-09 10:03:15 | status flip `bundled`→`ready_to_reconcile` under `bundle-203b1dc2` (resolved `--ours`, prior invocation) |
| 2 | `d7105ebe3d` | 09-09 10:03:16 | **this pick** — unbundle: removes `bundled_in`, `last_field_updated: bundled_in` |
| 3 | `0fcce92f07` | 09-09 14:32:49 | re-bundle into `bundle-87be4669`, `status` back to `bundled`, `last_field_updated: status` |
| 4 | `c365180050` | 09-11 03:28:26 | genuine new intent — `status: free_and_reconciled`, `completed_at` set |

Decisive test (the sharpest form: confirm the superseding commit restores **every**
fact the removal touched):

- `git show 0fcce92f07:<path>` is **byte-identical to `:2:` (ours)** — whole file,
  verified by `diff`, no trailing-newline delta on this ticket.
- That same commit carries `updated_at: 2026-09-09T21:32:49`,
  `last_field_updated: status`, `status: bundled`, `bundled_in: bundle-87be4669` —
  i.e. all three facts theirs changed are restored, 4h29m later, by xgd-working itself.

So the unbundle is a **transient waypoint that xgd-working superseded on its own side**,
and HEAD already carries the superseding state. `--ours` therefore preserves the
developer's later decision rather than discarding developer intent. Ours reached HEAD via
main's `seed_local_overlay` `2cf37792fd` (author date 09-09 14:35:22), 2.5 minutes after
the re-bundle — a catch-up snapshot of xgd-working's decision, not a competing one.
Main's ledger for this path is two commits (`bfb1b65947` create, `2cf37792fd` overlay)
against incoming's thirteen.

This is the BUG-1301 precedence shape with the strongest available provenance — the
already-integrated superseding decision is **xgd-working's own**, so there is no
"was main's deletion legitimate?" judgement call. No hunk was dropped as a resolution
shortcut; nothing was lost.

Bundle pair (the second known replay pair, not `4efd33fe`/`8e1807f6`): ours
`bundle-87be4669` (BUNDLE-26, `free_and_reconciled`, live in `hot/`) vs theirs
`bundle-203b1dc2` (BUNDLE-23, `ready_to_reconcile`, all nulls, archived on both sides).
Identical title and identical seven-member list: REQ-164, REQ-159, REQ-165, REQ-163,
REQ-161, REQ-158, REQ-167.

## Incoming changes preserved

No code/implementation files were involved — this is a ticket-metadata-only resolution,
so there is no source hunk to verify and no test suite to run (workerd/wrangler suites
are unrunnable in this role regardless).

For the one file resolved, the incoming commit's three field changes are **not present
verbatim** in the resolved version, and that absence is correct and expected: each is
restored by xgd-working's own later commit `0fcce92f07`, whose blob HEAD already matches
byte-for-byte (shown above). Nothing incoming was discarded — it was superseded upstream
before this resync reached it.

## Forecast for the remaining picks on this path

- **`0fcce92f07` (pos 3, the re-bundle)** — expect it next. Its blob equals ours
  **exactly**, so git should auto-merge it; it may not conflict at all.
- **`c365180050` (pos 4, 09-11)** — **do NOT blanket-`--ours`.** It advances `status`
  to `free_and_reconciled` and sets `completed_at: 2026-09-11T10:28:26`, neither of
  which HEAD has. Incoming wins those two facts. Do not let this run of successful
  `--ours` resolutions become a reflex.

## Verification

`git status --porcelain` is empty (no `UU`/`AA`/`DU`/`UD` remain) and
`git diff --cached HEAD --stat` is empty: the staged resolution is byte-identical to HEAD.
Only the conflicting commit's own path was staged. `CHERRY_PICK_HEAD` is still present at
`d7105ebe3ded6455bad636ee955cde24f23fe688` — no `--continue`/`--skip`/`--quit`/`--abort`
was issued.
