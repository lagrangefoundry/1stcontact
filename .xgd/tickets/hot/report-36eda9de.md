---
uid: report-36eda9de
id: REPORT-5601
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-29T19:05:08.351885+00:00'
updated_at: '2026-09-29T19:05:08.351885+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

# Resync conflict resolution: `request-3bc4b835` (REQ-167) — quartet position 2

- **Cherry-picked commit**: `0aa5ebd384` — `xgd(ticket): update request request-3bc4b835` (2026-09-09 10:03:18 -0700, xgd-working) — the **unbundle**, 1 second after position 1
- **Conflicting file**: `.xgd/tickets/hot/request-3bc4b835.md` (single file, the whole diff of the pick)
- **Resolution**: `--ours` (keep HEAD's blob verbatim) → **zero net change from HEAD**; finalize will skip the empty commit.
- **Retry count for this SHA**: 1 (first attempt)
- **HEAD**: `956b96b079`, unmoved — position 1 (`aeb6afce74`) also resolved to zero net change in the immediately preceding invocation (scope `1800`), so its commit was skipped.
- **Apply target / candidate publish tip**: `9ac98712a708888db67f8aff21f22b16bd98094e`
- **Anchor**: `report-377b581e`

## Files resolved

- `.xgd/tickets/hot/request-3bc4b835.md` — class **2e** (intent/bookkeeping ticket, `request-*`). Adjudicated **per fact**, not whole-file.

## Three-way divergence

| fact | `:1:` base | `:2:` ours (HEAD) | `:3:` theirs (incoming) |
|---|---|---|---|
| `updated_at` | `2026-09-09T17:03:17.116544` | `2026-09-09T21:32:50.386750` | `2026-09-09T17:03:17.953363` |
| `last_field_updated` | `status` | `status` | `bundled_in` |
| `status` | `ready_to_reconcile` | `bundled` | `ready_to_reconcile` |
| `bundled_in` | `bundle-203b1dc2` | `bundle-87be4669` | *(removed)* |
| trailing newline | absent | **present** | absent |

Base is now position 1's result (`aeb6afce74`'s blob) — the queue advanced exactly as
forecast in the position-1 report (scope `1800`). Ours is unmoved.

Theirs touches three facts relative to base: `updated_at`, `last_field_updated`
(`status` → `bundled_in`), and it **removes** `bundled_in` outright.

## Why the removal is subsumed rather than discarded

xgd-working's ledger for this path is the stable four-commit quartet:

| pos | sha | when | what |
|---|---|---|---|
| 1 | `aeb6afce74` | 09-09 10:03:17 | status flip `bundled`→`ready_to_reconcile` under `bundle-203b1dc2` (resolved `--ours`, prior invocation) |
| 2 | `0aa5ebd384` | 09-09 10:03:18 | **this pick** — unbundle: removes `bundled_in`, `last_field_updated: bundled_in` |
| 3 | `57398a6649` | 09-09 14:32:50 | re-bundle into `bundle-87be4669`, `status` back to `bundled`, `last_field_updated: status` |
| 4 | `392ef4fc5f` | 09-11 03:28:20 | genuine new intent — `status: free_and_reconciled`, `completed_at` set |

Decisive test (the sharpest form: confirm the superseding commit restores **every**
fact the removal touched). `git show 57398a6649:<path>` carries:

- `updated_at: 2026-09-09T21:32:50.386750` — later than theirs' `17:03:17.953363`
- `last_field_updated: status` — overwriting theirs' `bundled_in`
- `bundled_in: bundle-87be4669` — the removed field, restored under the live bundle

All three facts theirs changed are restored 4h29m later by xgd-working itself, and
`:2:` (ours) is **byte-identical to that blob** apart from ours' trailing newline
(verified by `diff`). So the unbundle is a **transient waypoint that xgd-working
superseded on its own side**, and HEAD already carries the superseding state.
`--ours` therefore preserves the developer's later decision rather than discarding
developer intent.

This is the BUG-1301 precedence shape with the strongest available provenance — the
already-integrated superseding decision is **xgd-working's own**, so there is no
"was main's deletion legitimate?" judgement call. No hunk was dropped as a
resolution shortcut; nothing was lost.

Ours reached HEAD via main's `seed_local_overlay` `741376297f` (author date
09-09 14:35:22), 2.5 minutes after the re-bundle — a catch-up snapshot of
xgd-working's decision, not a competing one. The trailing-newline delta is
accounted for: an earlier pick on **this** resync branch, `92f7763583` (replaying
`e302557b19`), added it; it touches no frontmatter fact.

## Bundle pair

The second known replay pair: ours `bundle-87be4669` (BUNDLE-26,
`free_and_reconciled`, live in `hot/`) vs theirs `bundle-203b1dc2` (BUNDLE-23,
`ready_to_reconcile`, all nulls, archived on both sides). Identical title and
identical seven-member list: REQ-164, REQ-159, REQ-165, REQ-163, REQ-161, REQ-158,
**REQ-167**. This ticket is REQ-167 — the seventh and last member.

## Incoming changes preserved

No code/implementation files were involved — ticket-metadata only, so there is no
source hunk to verify and no test suite to run (workerd/wrangler suites are
unrunnable in this role regardless).

For the one file resolved, the incoming commit's three field changes are **not
present verbatim**, and that absence is correct and expected: each is restored by
xgd-working's own later commit `57398a6649`, whose blob HEAD already matches
byte-for-byte (shown above). Nothing incoming was discarded — it was superseded
upstream before this resync reached it.

## Forecast for the remaining picks on this path

- **`57398a6649` (pos 3, the re-bundle)** — expect it next. Its blob equals ours
  **exactly** apart from the trailing newline, so git should auto-merge it; it may
  not conflict at all. If it does, `--ours`.
- **`392ef4fc5f` (pos 4, 09-11)** — **do NOT blanket-`--ours`.** It advances `status`
  to `free_and_reconciled` and sets `completed_at: 2026-09-11T10:28:20.162317`,
  neither of which HEAD has. Incoming wins those two facts. This is the last member
  of this bundle pair; do not let the run of successful `--ours` resolutions become
  a reflex.

## Verification

`git status --porcelain` is empty (no `UU`/`AA`/`DU`/`UD` remain) and
`git diff --cached HEAD --stat` is empty: the staged resolution is byte-identical to
HEAD. Only the conflicting commit's own path was staged. `CHERRY_PICK_HEAD` is still
present at `0aa5ebd38470482abe7ab78c609ce52aad9c8823` — no
`--continue`/`--skip`/`--quit`/`--abort` was issued.
