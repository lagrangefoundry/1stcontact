---
uid: report-f63bdaae
id: REPORT-4578
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-20T23:37:42.562369+00:00'
updated_at: '2026-09-20T23:37:42.562369+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/bug-db356ff8.md` — **UU**, intent/bookkeeping ticket
  (`type: bug`), STEP 2 rule **2e**. Path is outside the sparse-checkout
  cone (DOC-986 §2/§4.1), so the conflict existed only in the index with
  no working-tree markers; resolved via the index and staged there.
  **Resolution: took OURS (HEAD) wholesale**, because on a per-fact basis
  ours wins every fact and discards none of theirs:

  | fact | base | ours (HEAD) | theirs (486ef694) | outcome |
  |---|---|---|---|---|
  | `status` | `free_coded` | `free_and_reconciled` | `ready_to_reconcile` | ours — later intent |
  | `updated_at` | 2026-08-24T01:50:12Z | 2026-08-31T19:19:38Z | 2026-08-25T22:52:42Z | ours — later intent |
  | `completed_at` | `null` | 2026-08-31T19:19:38Z | `null` (unchanged) | ours — HEAD-only addition |
  | `fields.bundled_in` | absent | `bundle-78f4e2fe` | absent (unchanged) | ours — HEAD-only addition |
  | trailing newline | absent | present | absent | ours |
  | body (370 lines) | — | identical | identical | no conflict |

  `status`/`updated_at` are the only genuinely conflicting facts (same
  field, changed differently on both sides). Per 2e these go to the
  later-positioned intent, which is ours (2026-08-31 vs 2026-08-25).
  `completed_at` and `bundled_in` are non-overlapping HEAD-side
  additions with no incoming counterpart, so ours is also a strict
  superset. Body prose is byte-identical apart from the trailing
  newline.

## Incoming changes preserved

No code, test, or config files were in conflict — `486ef694e0` touches
exactly one file (`.xgd/tickets/hot/bug-db356ff8.md`, 2 insertions /
2 deletions), all inside the YAML frontmatter. STEP 3's
`git show $CPHEAD -- <file>` verification therefore has no
implementation hunks to check, and the BUG-1301 precedence exception
was not invoked.

The incoming intent is not discarded — it is **subsumed**, which I
verified by replaying both intent ledgers rather than comparing raw
`updated_at` alone (BUG-1030):

- `xgd ticket history bug-db356ff8 --rev 486ef694e0` (incoming side)
  terminates at `free_coded → ready_to_reconcile` @ 2026-08-25T22:52:42Z
  (commit `486ef694e0`).
- `xgd ticket history bug-db356ff8` (HEAD side) continues past that
  point along the same single lifecycle track:
  `7a8d0abd29` (2026-08-31 07:24) `draft → bundled`, adding
  `fields.bundled_in: bundle-78f4e2fe`; then
  `56ced613a4` (2026-08-31 12:19) `bundled → free_and_reconciled`,
  setting `completed_at`; then
  `6c094224fb` — whose entire diff is the trailing newline.

`ready_to_reconcile` is an intermediate state that HEAD has already
transited on its way to the terminal `free_and_reconciled`
(`free_coded → ready_to_reconcile → bundled → free_and_reconciled`).
Applying theirs would rewind the ticket two lifecycle steps and drop
both `completed_at` and the `bundle-78f4e2fe` link. No incoming fact
is overwritten with a competing value; every incoming fact is either
identical to ours or an earlier position on the axis ours already
advanced.

## Staging state

- `git ls-files -u` → empty (no UU/AA/DU/UD remaining).
- `git status --porcelain` → empty.
- `git diff --cached HEAD` → empty: the resolution equals HEAD, so this
  cherry-pick carries no net change. Per STEP 4 this was **not** skipped
  here — staging left as-is for the finalize step to detect and handle.
- `CHERRY_PICK_HEAD` still present at `486ef694e0ce9d8ffab58fe8a8b55493f38b4861`.
  No `--continue` / `--skip` / `--quit` / `--abort` was issued.
