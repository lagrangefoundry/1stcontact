---
uid: report-3ee9d2a9
id: REPORT-4408
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-19T11:49:32.558023+00:00'
updated_at: '2026-09-19T11:49:32.558023+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/request-bbff35c7.md` — **UU**, index-only (path is outside
  the sparse-checkout cone: `!/.xgd/tickets/**`, so there were no working-tree
  markers). Class **2e — intent/bookkeeping ticket** (`request-*`). Rule applied:
  *one side is a strict superset* → kept HEAD (ours), staged with
  `git checkout --ours` + `git add --sparse`.

  Sides:
  - base `e26fd6afb7`
  - ours `c1046591bd` — `xgd(ticket): seed_local_overlay request request-bbff35c7`
    (HEAD blob, unchanged by this resolution)
  - theirs `0dd8738e54` — `xgd(ticket): update request request-bbff35c7`
    (incoming commit `20be4747de`, 2026-09-01)

  Per-fact adjudication of every line that differs ours→theirs (there are only
  six, all theirs-side):
  - `updated_at` / `completed_at` / `last_field_updated` / `status` — same
    fields changed differently. Ours is the later-positioned state
    (`updated_at 2026-09-16T01:48:40Z`, `status: bundled`,
    `completed_at 2026-09-14T10:29:11Z`) vs incoming's
    `2026-09-01T19:34:20Z` / `status: draft` / `completed_at: null`. Taking
    incoming would demote the ticket back to `draft` and drop
    `fields.commits`, `fields.version: 0.2.34` and
    `fields.bundled_in: bundle-8e1807f6` — bundle bookkeeping written after
    the incoming commit. Ours kept.
  - The paragraph *"Until they land, seeding and the delta channel are
    deliverable and search remains single-index."* — this is the OLD text on
    the incoming side; HEAD replaced it with the longer two-index
    co-ranking paragraph in a later edit. The incoming commit's own diff
    (`git show 20be4747de -- <path>`) does not touch this paragraph at all —
    it appears in the ours/theirs diff only as superseded context, not as
    incoming intent. Ours kept.

  Nothing was invented; no `intent_uid` / `story_uid` / `capability_uid` field
  was touched.

## Incoming changes preserved

The incoming commit `20be4747de` made exactly two changes to this file:

1. `updated_at` bump to `2026-09-01T19:34:20.868825+00:00` — pure bookkeeping,
   superseded by HEAD's later `2026-09-16T01:48:40.522165+00:00` (see above).
2. A two-line addition to the **Out of scope** section:

   ```
   [[REQ-171]] owns it, together with the session prompts and turn reminders it
   has to be written into.
   ```

The substantive change (2) is **already present verbatim in HEAD** — verified
at line 216 of the resolved blob `c1046591bd`:

```
216:  [[REQ-171]] owns it, together with the session prompts and turn reminders it
```

It arrived on the bundle branch through the `seed_local_overlay` commit, which
carried this sentence together with the rest of the ticket's later body work.
So the incoming developer content is preserved, not discarded — this is the
BUG-1109 / BUG-1122 "already landed by another route" case, not a STEP 3
discard. No hunk was dropped under the BUG-1301 precedence exception; no test
file was involved.

Consequence: the staged tree is byte-identical to HEAD for this path
(`:<path>` and `HEAD:<path>` both resolve to `c1046591bd`), so this cherry-pick
nets to no diff. Per STEP 4 this is staged and exited `@done` without calling
`--skip`; `cherry_pick_finalize_resolution` will detect the empty staged diff
and skip the commit. `CHERRY_PICK_HEAD` (`20be4747de`) is left intact.
