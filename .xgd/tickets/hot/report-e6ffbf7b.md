---
uid: report-e6ffbf7b
id: REPORT-4756
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-21T15:13:42.812567+00:00'
updated_at: '2026-09-21T15:13:42.812567+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/bug-3ade1af4.md` — intent/bookkeeping ticket (STEP 2e;
  `bug-*` lives in hot per tiers.py). Two conflicted hunks, both in the YAML
  frontmatter; the Markdown body merged cleanly on its own.

  The two sides touch the *same* facts (lifecycle state), so this is a genuine
  per-fact conflict and the later-positioned intent wins on each. HEAD carries
  the ticket eighteen days further along its lifecycle; the incoming commit
  08bbde0676 is an older snapshot of the same fields.

  | Fact | HEAD (kept) | Incoming (dropped) |
  |---|---|---|
  | `updated_at` | 2026-09-19T15:15:31 | 2026-09-01T19:28:24 |
  | `completed_at` | 2026-09-14T10:29:13 | `null` |
  | `status` | `free_and_reconciled` | `free_coded` |
  | `fields.bundled_in` | `bundle-8e1807f6` | *(absent)* |

  No field is disjoint between the sides — every incoming value is a strictly
  earlier state of a field HEAD also sets — so there is nothing on the incoming
  side to combine in. Matches the auto-enrichment rule for this file ("take the
  more recent commit by timestamp"), reached per-fact rather than wholesale.

  Body text: git merged it without conflict, landing HEAD's later revision
  ("27 failures + 30 collection errors … eleven UATs superseded by later work"
  vs. the incoming "23 failures … ten UATs"), consistent with HEAD being the
  later state across the whole file.

## Incoming changes preserved

No code, test, or config files were in conflict — the single conflicted path is
a bookkeeping ticket, so STEP 3's incoming-code verification does not apply and
the BUG-1301 precedence exception was not invoked.

For the ticket itself: every incoming value is superseded by a later value of
the same field on the HEAD side, which is the documented outcome for a genuine
same-fact conflict. Nothing disjoint was discarded.

## Note for the finalize step

The staged tree is byte-identical to HEAD for this path — `git status
--porcelain` is empty and `git diff --cached HEAD` is empty. This cherry-pick
therefore carries no net change, which is the correct result: the commit was
entirely superseded ticket metadata. Per STEP 4 I did not call `--skip`;
CHERRY_PICK_HEAD (08bbde0676) is still present for the next step to act on.
