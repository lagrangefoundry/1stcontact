---
uid: report-dca0f9f3
id: REPORT-5250
type: report
title: 'Resync resolve conflicts: b6b7f564f0bf1ee0904f0b6aa25ee3ca053055f0'
created_by: xgd
created_at: '2026-09-28T01:57:42.926115+00:00'
updated_at: '2026-09-28T01:57:42.926115+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/request-7ae3c2cc.md` — UU, intent/bookkeeping ticket
  (`request-*`), rule **2e**. Sparse-checkout path (DOC-986 §2/§4.1):
  resolved with `git checkout --ours` + `git add --sparse`.
  - Single conflict hunk, confined to the frontmatter lifecycle block:
    `updated_at` / `completed_at` / `last_field_updated` / `status`.
  - Incoming (09bb2a55cc, 2026-08-23 19:10 -0700): `status: bundled`,
    `completed_at: null`, plus `bundled_in: bundle-b3b7c399`.
  - Ours (decf67f54a, 2026-08-31 07:22 -0700, on top of a
    `seed_local_overlay` commit ce11ecb0c4 at 2026-08-30 22:06):
    `status: free_and_reconciled`, `completed_at` set, and the same
    `bundled_in: bundle-b3b7c399`.
  - Both sides add `bundled_in: bundle-b3b7c399` identically, so that
    hunk merged cleanly and was never in conflict. The only competing
    fact is the lifecycle status. Per 2e ("same field changed
    differently on both: take the LATER-positioned intent, per fact"),
    ours wins: it is 8 days later by commit date and `updated_at`, and
    `free_and_reconciled` is strictly downstream of `bundled` in the
    ticket lifecycle. Incoming-wins here would regress the status and
    null out `completed_at`.
  - Verified: `git diff <stage3> <stage2>` shows the ONLY delta between
    incoming and ours is those four lifecycle lines — ours is a strict
    superset of incoming's content. No other field, section, or body
    text differs.

## Incoming changes preserved

- `.xgd/tickets/hot/request-7ae3c2cc.md`: incoming's substantive
  contribution is `bundled_in: bundle-b3b7c399`, and it is present in
  the resolved file (line 34). Incoming's `status: bundled` /
  `completed_at: null` are intentionally not carried forward — not
  discarded developer content, but a superseded lifecycle state that
  HEAD has already advanced past to `free_and_reconciled`. This is the
  2e per-fact later-intent rule, not a dropped change.

No code files (`xgd_source/**`, `tests/**`, `bin/**`) were in conflict,
so no BUG-1301 precedence exception was invoked and no test function was
deleted.

## Note for the next step

The staged tree is identical to HEAD (`git diff --cached HEAD` is
empty): this cherry-pick is a no-op because HEAD already carries a
later state of the same ticket. Per the resolver contract, no
`--skip`/`--continue` was issued; CHERRY_PICK_HEAD
(09bb2a55cc8cb60e116bece4baa86e01d0dcfc11) is left intact for the
finalize step to detect the clean staged diff and skip the commit.
