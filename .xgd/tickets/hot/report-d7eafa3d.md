---
uid: report-d7eafa3d
id: REPORT-3064
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-22'
created_by: xgd
created_at: '2026-08-31T20:43:32.946295+00:00'
updated_at: '2026-08-31T20:43:32.946295+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-22
---

## Files resolved

- `.xgd/tickets/hot/request-18a48d63.md` — **UU**, intent/bookkeeping ticket (rule 2e).
  Only the frontmatter status block conflicted (`updated_at`, `last_field_updated`,
  `status`); the `fields.commits` payload auto-merged clean.
  Per-fact resolution against the later-positioned intent:
  - `updated_at`: HEAD `2026-08-24T02:10:41` (later) over incoming `2026-08-24T01:14:03`.
  - `last_field_updated`: HEAD `status` over incoming `commits`.
  - `status`: HEAD `bundled` over incoming `ready_to_reconcile` — `bundled` is the
    downstream state, recorded after the incoming commit's `commits` edit.
  - `completed_at`: `null` on both sides.
  - `fields.bundled_in: bundle-b3b7c399` — HEAD-only, superset, kept.
  No fields invented; no `intent_uid`/`story_uid`/`capability_uid` touched.

## Incoming changes preserved

Incoming commit `6788b084` ("Data fix (BUG-1265): merge orphaned working_sha 7ebc721b
into the surviving entry's working_sha_history") makes exactly one substantive change:
add `7ebc721b83ab6202fdec600cd0493b69964bac39` to the `working_sha_history` of the
`96118c32` commits entry, and delete the standalone orphan `working_sha: 7ebc721b`
entry.

That change is present in the resolved file, verified against HEAD:

```
  commits:
  - working_sha: 96118c32cfc8495b6f7f2eff7046b518e267d84c
    working_sha_history:
    - b71a8641182d62dd46b5fa6d0cf78a582cff4eb7
    - 7ebc721b83ab6202fdec600cd0493b69964bac39   <-- incoming's addition
    - 761b7fbd0efa55515fdea9a8ddc5f9a38be91c4d
```

with no standalone `7ebc721b` entry remaining. The same data fix had already reached
this branch through HEAD-side commit `209bea11`
("xgd(ticket): seed_local_overlay request request-18a48d63", 2026-08-30), so the
cherry-pick's effect is already landed by a different route.

Consequence: the staged tree has **no net diff vs HEAD** (`git diff --cached HEAD` is
empty). This is the BUG-1109/BUG-1122 redundant-commit case, not a discard — STEP 3's
distinguishing check confirms the incoming commit's key change IS present in HEAD
rather than absent. Per STEP 4, no `--skip` was issued; the finalize step will detect
the clean staged diff. `CHERRY_PICK_HEAD` left intact.

No code/implementation files, spec tickets, UAT test files, or config files were in
this conflict set. No BUG-1301 precedence drops were needed.
