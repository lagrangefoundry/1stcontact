---
uid: report-aca1b2fe
id: REPORT-5473
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-29T05:28:18.121843+00:00'
updated_at: '2026-09-29T05:28:18.121843+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/request-bbff35c7.md` — **UU**, intent/bookkeeping
  ticket (`request-*`), rule **2e**. Two conflict hunks, both confined to
  YAML frontmatter; the ticket body was untouched on both sides.
  Resolved per-fact, not by picking a winning file wholesale. Staged
  via `git checkout --ours --ignore-skip-worktree-bits` +
  `git add --sparse` because the path sits outside this branch's
  sparse-checkout cone (DOC-986 §2/§4.1 — the conflict existed in the
  index with no working-tree markers).

### Per-fact resolution

| fact | ours (HEAD) | theirs (580518e48a) | outcome |
|---|---|---|---|
| `status` | `free_and_reconciled` | `free_coded` | ours — later lifecycle state |
| `updated_at` | `2026-09-19T15:15:30` | `2026-09-01T19:56:43` | ours — later |
| `completed_at` | `2026-09-14T10:29:11` | `null` | ours — later |
| `last_field_updated` | `status` | `status` | identical, not a conflict |
| `fields.commits` (2 entries) | present | present | identical on both sides |
| `fields.version` | `0.2.34` | `0.2.34` | identical on both sides |
| `fields.bundled_in` | `bundle-8e1807f6` | absent | ours — disjoint HEAD-side addition, retained |

The incoming commit is a stale `draft → free_coded` status transition
dated 2026-09-01. Every fact it asserts is either **already present
verbatim in HEAD** (`commits`, `version`) or **superseded by a strictly
later HEAD-side fact on the same field** (`status`, `updated_at`,
`completed_at`). No disjoint incoming fact exists to combine, so the
per-fact composition converges on the HEAD content exactly.

## Incoming changes preserved

Verified against `git show 580518e48a -- .xgd/tickets/hot/request-bbff35c7.md`.
The commit's only substantive *additions* are the two-entry `commits:`
list (`working_sha` e9bd703b…, 751b0706…) and `version: 0.2.34` — both
present byte-for-byte in the resolved file. Its remaining changes are
status/timestamp advances that HEAD has already progressed past.

No code files (`xgd_source/**`, `tests/**`, `bin/**`) were in conflict.
No UAT test file was touched, so no test function was deleted and the
BUG-1301 precedence exception was **not** invoked or needed.

## Net effect on the tree

The resolved tree is byte-identical to HEAD, so `git status --porcelain`
is empty and the staged diff carries no net change. Per STEP 4 this was
left for Python's finalize step to detect and skip — no
`--continue`/`--skip`/`--quit`/`--abort` was issued, and
`CHERRY_PICK_HEAD` (580518e48a) remains present.
