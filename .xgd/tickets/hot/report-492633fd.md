---
uid: report-492633fd
id: REPORT-4540
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-20T20:32:58.449519+00:00'
updated_at: '2026-09-20T20:32:58.449519+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/request-18a48d63.md` — **UU**, intent/bookkeeping ticket
  (`request-*`, §2e). Outside the sparse-checkout cone, so staged with
  `git add --sparse`. Resolved **per fact**, not by picking a winning file:
  - `commits[]` (the payload of incoming `6788b08404`, BUG-1265: merge orphaned
    `working_sha` `7ebc721b83ab…` into the surviving entry's
    `working_sha_history`): **identical on both sides** — base had two entries,
    ours and theirs both collapse them the same way. No conflict in substance;
    kept.
  - `status` / `updated_at` / `completed_at` / `last_field_updated`: same facts
    changed differently. Ours `free_and_reconciled` @ `2026-08-31T14:22:42`
    (with `completed_at` set) vs theirs `ready_to_reconcile` @
    `2026-08-24T01:14:03` (with `completed_at: null`). Later-positioned intent
    wins per fact → **ours**. Taking theirs would have rewound a terminal-state
    ticket back to `ready_to_reconcile`.
  - `fields.bundled_in: bundle-b3b7c399`: present on ours only, absent on
    theirs — non-overlapping addition, ours is a strict superset → kept.

## Incoming changes preserved

- `.xgd/tickets/hot/request-18a48d63.md`: `git show 6788b08404 -- <file>`
  shows the incoming commit's sole substantive change is the BUG-1265 data fix
  to `fields.commits`. That change is present verbatim in the resolved file:
  `working_sha_history` reads `b71a8641…`, **`7ebc721b83ab6202fdec600cd0493b69964bac39`**,
  `761b7fbd…`, and the orphaned second `commits` entry is gone. Nothing from
  the incoming side was discarded — the only facts where ours prevailed
  (`status`, `updated_at`, `completed_at`, `last_field_updated`) are ones the
  incoming commit did not intend to change; they are simply the older values
  that commit was authored against, and its own message states "no code change"
  beyond the data fix.

No BUG-1301 precedence exception was invoked; no hunk was dropped.

## Staging state

`git status --porcelain` is empty and `git diff --cached HEAD` is empty: the
resolution is byte-identical to HEAD because the incoming data fix had already
landed on this branch through an earlier path. `CHERRY_PICK_HEAD`
(`6788b08404d93eafcf2e329be79f1152162cd779`) is intact. Per instructions, no
`--continue`/`--skip`/`--quit`/`--abort` was issued; the finalize step will
detect the empty staged diff and skip the commit.
