---
uid: report-82e7f441
id: REPORT-4778
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-21T19:04:37.345734+00:00'
updated_at: '2026-09-21T19:04:37.345734+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/request-bbff35c7.md` (REQ-160) — **UU**, intent/bookkeeping
  ticket (STEP 2e). Conflict region was the frontmatter lifecycle block only;
  every body hunk from the incoming commit merged cleanly (in fact was already
  present in HEAD — see below).

  Per-fact resolution of the four conflicting scalars:

  | field | HEAD | incoming `9081f1b091` | taken |
  |---|---|---|---|
  | `updated_at` | `2026-09-19T15:15:30` | `2026-09-01T19:54:48` | HEAD |
  | `completed_at` | `2026-09-14T10:29:11` | `null` | HEAD |
  | `last_field_updated` | `status` | `body` | HEAD |
  | `status` | `free_and_reconciled` | `draft` | HEAD |

  All four are the *same* facts changed differently on both sides — a genuine
  intent conflict, so the later-positioned intent wins per 2e. HEAD's side
  postdates the incoming commit by ~18 days. Taking the incoming side would
  have regressed the ticket from `free_and_reconciled` back to `draft` and
  nulled a `completed_at` that postdates the incoming commit by two weeks.

  This matches the auto-enrichment rule supplied for this file ("take the more
  recent commit by timestamp") — both sides carry the generic
  `xgd(ticket): update request request-bbff35c7` subject, so intent is not
  distinguishable from the commit messages.

  **Flagged for post-merge review** per the enrichment rule, since intent was
  unknown on both sides.

## Incoming changes preserved

Not a code file, but the incoming body content was verified explicitly rather
than assumed. `9081f1b091` introduced five body additions to REQ-160:

1. "The cursor must not re-report the document it stopped on" bullet
2. "A corrupt cursor costs a sweep and never a turn" bullet
3. "A conversation is never reported to itself" bullet
4. The co-ranked fan-out paragraphs replacing "Until they land, seeding and the
   delta channel are deliverable and search remains single-index."
5. The co-ranked-search acceptance bullet, and the "A single oversized title is
   clipped, not dropped" decision

All five are present verbatim in the resolved file. Confirmed by
`git diff 9081f1b091 -- .xgd/tickets/hot/request-bbff35c7.md`, whose entire
remaining delta is the frontmatter block above plus the `commits` /
`version: 0.2.34` / `bundled_in: bundle-8e1807f6` fields that HEAD owns — zero
body lines. No incoming content was discarded.

**Note — this pick is empty.** The staged tree is byte-identical to HEAD
(`git status --porcelain` returns nothing). HEAD already carried every body
change `9081f1b091` introduced, having reached this branch by another path, so
the only thing the pick could still contribute was the older frontmatter, which
was correctly rejected. Staged and exiting normally per STEP 4; the finalize
step will detect the clean staged diff and skip the commit.

No BUG-1301 precedence exception was invoked. No test functions were touched.
