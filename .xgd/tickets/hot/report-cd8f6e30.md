---
uid: report-cd8f6e30
id: REPORT-5598
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-29T18:55:18.513641+00:00'
updated_at: '2026-09-29T18:55:18.513641+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

# Resync conflict resolution: `request-26dafd83` (REQ-165)

- **Cherry-picked commit**: `f40537aa6b` — `xgd(ticket): update request request-26dafd83` (2026-09-09 10:03:15 -0700, xgd-working)
- **Conflicting file**: `.xgd/tickets/hot/request-26dafd83.md` (single file, whole diff of the pick)
- **Resolution**: `--ours` (keep HEAD's blob verbatim) → **zero net change from HEAD**; finalize will skip the empty commit.
- **Retry count for this SHA**: 1 (first attempt)
- **Apply target / candidate publish tip**: `9ac98712a708888db67f8aff21f22b16bd98094e`

## Three-way divergence

| fact | `:1:` base | `:2:` ours (HEAD) | `:3:` theirs (incoming) |
|---|---|---|---|
| `updated_at` | `2026-09-02T17:48:27` | `2026-09-09T21:32:49` | `2026-09-09T17:03:15` |
| `status` | `bundled` | `bundled` | `ready_to_reconcile` |
| `bundled_in` | `bundle-203b1dc2` | `bundle-87be4669` | `bundle-203b1dc2` |

Only `updated_at` is a true three-way divergence; `status` moved on theirs alone and
`bundled_in` on ours alone. A naive 3-way merge therefore pairs theirs'
`ready_to_reconcile` with ours' `bundle-87be4669` — a ticket "ready to reconcile"
under a bundle that is already `free_and_reconciled`. These three facts are one
decision ("which bundle owns REQ-165"), not three independent ones.

## Evidence: incoming superseded itself, and ours already carries that later state

xgd-working's ledger for this path is the stable four-commit quartet:

| pos | sha | when | what |
|---|---|---|---|
| 1 | `f40537aa6b` | 09-09 10:03:15 | **this pick** — `status` `bundled`→`ready_to_reconcile` under `bundle-203b1dc2` |
| 2 | `d7105ebe3d` | 09-09 10:03:16 | unbundle — removes `bundled_in: bundle-203b1dc2`, `last_field_updated: bundled_in` |
| 3 | `0fcce92f07` | 09-09 14:32:49 | re-bundle into `bundle-87be4669`, `status` back to `bundled`, `last_field_updated: status` |
| 4 | `c365180050` | 09-11 03:28:26 | genuine new intent — `status: free_and_reconciled`, `completed_at` set |

Decisive blob test: `git show 0fcce92f07:<path>` is **byte-identical to `:2:` (ours)** —
whole file, not just the frontmatter (no trailing-newline delta on this ticket).
Ours arrived via main's `seed_local_overlay` `2cf37792fd` (author date 09-09 14:35:22),
2.5 minutes after xgd-working's own re-bundle. Main's side of this path is only two
commits (`bfb1b65947` create, `2cf37792fd` overlay) versus incoming's thirteen, so
main's commit is a catch-up snapshot of xgd-working's decision, not a response to it.

Subsumption is complete, not lossy: positions 1+2 touched `updated_at`, `status`,
`last_field_updated` and `bundled_in`, and position 3 restored every one of them
(`status: bundled`, `bundled_in: bundle-87be4669`, `last_field_updated: status`) —
which is exactly the state HEAD already holds.

So `--ours` preserves **xgd-working's own later decision**, not main's preference.
The enrichment's fallback rule ("intent unknown → take the more recent commit by
timestamp") also lands on ours here (09-09 21:32:49 > 09-09 17:03:15).

## Bundle pair

This is the **second** known replay pair, not the `4efd33fe`/`8e1807f6` one:

- ours `bundle-87be4669` (BUNDLE-26, `free_and_reconciled`, `completed_at 2026-09-11T10:28:16`, live in `hot/`)
- theirs `bundle-203b1dc2` (BUNDLE-23, `ready_to_reconcile`, all nulls, archived on **both** sides — `git show xgd-working:.xgd/tickets/hot/bundle-203b1dc2.md` → does not exist)

Identical title and identical seven-member list: REQ-164, REQ-159, REQ-165, REQ-163,
REQ-161, REQ-158, REQ-167 → main re-created xgd-working's bundle under a new uid. REQ-165
is the third-listed member.

## Forecast for the next picks on this path

- **`d7105ebe3d` (quartet pos 2, the unbundle)** — expect it next, base advanced to
  `f40537aa6b`'s blob, ours unmoved. Resolve `--ours`, zero net change: the
  `bundled_in` removal is subsumed by pos 3, which HEAD already carries.
- **`0fcce92f07` (pos 3, the re-bundle)** — may not conflict at all; its blob equals ours
  exactly, so git can auto-merge.
- **`c365180050` (pos 4, 09-11)** — **do NOT blanket-`--ours`.** It advances `status` to
  `free_and_reconciled` and sets `completed_at: 2026-09-11T10:28:26`, neither of which
  HEAD has. Incoming wins those facts.

## Verification

`git status --short` is clean and `git diff --cached HEAD --stat` is empty: the staged
resolution is byte-identical to HEAD. Only the conflicting commit's own path was staged
(`git add --sparse -- .xgd/tickets/hot/request-26dafd83.md`). No test suite was run —
this is a ticket-metadata-only resolution with no code change.
