---
uid: report-2f2ccef4
id: REPORT-4718
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-21T11:19:09.694472+00:00'
updated_at: '2026-09-21T11:19:09.694472+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/request-6893f6ea.md` (REQ-158) — **UU**, intent/bookkeeping ticket
  (`request-*`), STEP 2e rule. Incoming commit `e8e84a34e6`
  (`xgd(ticket): update request request-6893f6ea`, 2026-08-31 18:22:23 -0700). One
  conflict hunk, confined to frontmatter; the body was identical on both sides.

  The incoming commit's full diff is four lines: `updated_at` advanced by ~3.8 seconds
  (`2026-09-01T01:22:19.097788` → `01:22:22.929048`) and `last_field_updated` flipped
  `status` → `story_points`. Notably `story_points: 8` itself is *unchanged* — it is
  identical on both sides and sits outside the conflict region — so the incoming commit
  carries no substantive content at all, only two bookkeeping breadcrumbs.

  Resolved per-fact, as 2e requires:

  - **`updated_at` / `status`.** Genuine same-fact conflict. HEAD: `status: bundled` @
    `2026-09-09T21:32:50`. Incoming: `status: free_coded` @ `2026-09-01T01:22:22`. HEAD
    is eight days later *and* strictly downstream in the lifecycle (`free_coded` → … →
    `bundled`), so the incoming side replays a transition HEAD has already passed
    through. **Took HEAD.** This also matches the auto-enrichment rule quoted for this
    file ("take the more recent commit by timestamp").

  - **`last_field_updated`.** HEAD `status`, incoming `story_points`. This field is a
    derived breadcrumb naming whichever edit was applied last, so it is not independently
    resolvable — it must agree with whichever edit actually survives. Since the surviving
    latest edit is HEAD's status transition to `bundled`, `status` is the only
    self-consistent value. Writing `story_points` would have made the file describe an
    edit that is not present in it (`story_points` is 8 on both sides and was never
    changed). **Took HEAD.**

  - **`fields.bundled_in: bundle-87be4669`.** Present on HEAD, untouched by the incoming
    commit, so git auto-merged it — it never entered the conflict region. Retained.

## Incoming changes preserved

- `.xgd/tickets/hot/request-6893f6ea.md` — confirmed against
  `git show e8e84a34e6 -- .xgd/tickets/hot/request-6893f6ea.md`. That commit made exactly
  two changes, both bookkeeping metadata, and both are superseded rather than discarded:

  - `updated_at` / `last_field_updated: story_points` — describe an edit
    (`story_points`) whose value is byte-identical on both sides and is fully present in
    the resolved file (`story_points: 8`). The *substance* the incoming commit records is
    therefore preserved; only the two stale breadcrumbs pointing at a newer edit that no
    longer exists were dropped.
  - `status: free_coded` — superseded by `bundled`. Recording `free_coded` here would
    roll REQ-158's lifecycle backwards.

  No substantive incoming content was lost. No BUG-1301 precedence exception was needed —
  nothing was dropped on the grounds of a prior refactor. No code files, spec tickets, or
  UAT tests were involved, so 2c/2d/2f did not come into play.

## Staging state

`git status --porcelain` is empty and the file contains zero conflict markers. The
resolved file is byte-identical to HEAD, since the incoming commit's only substantive
field (`story_points: 8`) already matched and its two breadcrumbs resolved to HEAD's
values. `git add --sparse` was used (the path is outside the sparse-checkout cone per
DOC-986 §2/§4.1) and left an empty staged diff.

`CHERRY_PICK_HEAD` (`e8e84a34e6`) is still present and untouched; no
`--continue`/`--skip`/`--quit`/`--abort` was run. The finalize step should see a clean
staged diff and skip the commit.
