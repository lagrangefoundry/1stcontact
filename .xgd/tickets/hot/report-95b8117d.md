---
uid: report-95b8117d
id: REPORT-4636
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-21T04:55:54.295210+00:00'
updated_at: '2026-09-21T04:55:54.295210+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/request-26dafd83.md` — **UU**, intent/bookkeeping
  ticket (`request-*`), rule **2e**. The conflict is confined to four
  frontmatter lines (`updated_at`, `completed_at`, `last_field_updated`,
  `status`); the body and all other `fields:` are identical on both
  sides. Both sides changed the same facts (`status`, `updated_at`)
  differently, so this is a genuine intent conflict and 2e's
  later-positioned-intent rule applies per fact:
  - HEAD (resync branch): `status: bundled`, `updated_at:
    2026-09-09T21:32:49Z`
  - Incoming (`048fba1a9d`, `xgd(ticket): update request
    request-26dafd83`): `status: free_coding`, `updated_at:
    2026-08-31T21:57:01Z`

  **Took HEAD** for all four conflicted lines. HEAD's intent is ~9 days
  later and further along the ticket lifecycle; the incoming commit is
  a replay of an earlier transition (`draft` → `free_coding`) that HEAD
  has already advanced past. Corroborated by the *unconflicted* portion
  of the same frontmatter, which HEAD and incoming agree on: it carries
  `bundled_in: bundle-87be4669` and three recorded `commits` entries.
  Replaying `free_coding` would have left the file self-contradictory —
  a ticket claiming to be mid-free-coding while simultaneously naming
  the bundle it was folded into.

  No non-overlapping additions existed on the incoming side to combine;
  the incoming commit touches nothing outside those four lines
  (`git show 048fba1a9d` → 3 insertions, 3 deletions, one file).

## Incoming changes preserved

No code/implementation files were in conflict — the single conflicted
path is a bookkeeping ticket, resolved under 2e rather than 2c, so the
"incoming is authoritative" rule does not apply and no developer code
was at stake.

The incoming frontmatter values (`status: free_coding`, `updated_at:
2026-08-31T21:57:01Z`, `last_field_updated: status`) are deliberately
**not** present in the resolved file. This is the intended outcome of
2e's per-fact later-intent rule on a genuine conflict, not a dropped
hunk: the incoming values are strictly superseded by HEAD's later
lifecycle state. The BUG-1301 PRECEDENCE exception was not invoked and
was not needed.

The resolution makes the cherry-pick a no-op against HEAD
(`git diff --cached HEAD` is empty). Per STEP 4 this is staged and left
as-is; `--skip`/`--continue` were not called and CHERRY_PICK_HEAD
remains present at `048fba1a9d3976056403292c99e72b390b356a37`.
