---
uid: report-7310de99
id: REPORT-4541
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-20T20:36:10.298552+00:00'
updated_at: '2026-09-20T20:36:10.298552+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/request-7ae3c2cc.md` (REQ-148) — **UU**, class **2e**
  (intent/bookkeeping ticket, `request-*`). Index-only conflict: the path
  is outside this branch's sparse-checkout cone (DOC-986 §2/§4.1), so
  there were no working-tree markers; resolved via `git checkout --ours`
  + `git add --sparse`.

  Resolved **per fact**, not by picking a winning side wholesale:

  | Fact | Ours (HEAD) | Theirs (`7c91ff7863`) | Rule applied |
  |---|---|---|---|
  | `fields.commits` | 055378794 merged into surviving `working_sha_history`; orphan entry dropped | *identical* | No conflict — both sides agree; kept |
  | `status` | `free_and_reconciled` | `ready_to_reconcile` | Same fact, both changed → later-positioned intent wins → **ours** |
  | `completed_at` | `2026-08-31T14:22:36` | `null` | same-fact → **ours** |
  | `updated_at` | `2026-08-31T14:22:36` | `2026-08-24T01:14:11` | same-fact → **ours** (later) |
  | `last_field_updated` | `status` | `commits` | same-fact → **ours** |
  | `fields.bundled_in` | `bundle-b3b7c399` | *absent* | Ours-only addition (strict superset) → kept |

## Incoming changes preserved

Yes. The incoming commit `7c91ff7863`'s entire substantive payload is the
BUG-1265 data fix described in its own message — "merge orphaned
working_sha 055378794 (the free-REQ-148 merge commit, flattened away by a
later resync rebase, never reachable from xgd-working) into the surviving
entry's working_sha_history."

That hunk is present **verbatim** in the staged blob:

```
  commits:
  - working_sha: a28d2f522f0e5f06629ca9084ac14349b988ed85
    working_sha_history:
    - ade64575a4706348dc54df0ed2d2b3f384fe3eb2
    - 055378794f49f1dc39b20fdcf54aa7fa0b1190e3   <-- incoming BUG-1265 fix
    - a6e92ca2603cba91fb5b905c826566ac208737ac
```

and the orphaned second `commits` entry that the base carried is gone, as
incoming intended. Verified against `git show 7c91ff7863 -- <file>`.

**No hunk was dropped**, so the BUG-1301 precedence exception was not
invoked and no `@fail` condition applies. The only incoming content *not*
reflected is the older `status`/timestamp block, which is a same-fact loss
to the later-positioned intent under rule 2e — not a discarded change.

## Note for the finalize step

HEAD already carries the identical BUG-1265 hunk via `ce11ecb0c4`
("seed_local_overlay", 2026-08-30), which arrived by a different path
earlier in this branch's history. Consequently `git diff --cached HEAD`
is **empty** — this cherry-pick is a no-op against the resolved tree.
Per instructions I did **not** call `--skip`/`--continue`; the staged
tree is left clean and `CHERRY_PICK_HEAD` (`7c91ff7863`) is intact for
Python's finalize step, which should detect the empty staged diff and
skip the commit.
