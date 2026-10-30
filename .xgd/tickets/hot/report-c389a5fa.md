---
uid: report-c389a5fa
id: REPORT-4582
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-20T23:50:02.219232+00:00'
updated_at: '2026-09-20T23:50:02.219232+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/bug-23d1ec27.md` — **UU**, intent/bookkeeping ticket (`bug-*`), rule **2e**, genuine-conflict arm (same fact changed differently on both sides → later-positioned intent wins, per fact).

  Incoming commit: `93b031a37e` ("xgd(ticket): update bug bug-23d1ec27", authored 2026-08-25 16:21:06 -0700). Its entire content is one frontmatter hunk — a lifecycle transition:

  | Fact | HEAD (kept) | Incoming | Verdict |
  |---|---|---|---|
  | `status` | `bundled` | `free_coding` | HEAD — `bundled` is **downstream** of `free_coding`; the ticket already advanced past this transition |
  | `updated_at` | `2026-08-31T05:05:09.315020+00:00` | `2026-08-25T23:21:06.793799+00:00` | HEAD — six days later |
  | `last_field_updated` | `status` | `status` | identical, not in conflict |
  | `completed_at` | `null` | `null` | identical, not in conflict |

  Only two facts actually compete, and HEAD is later-positioned on both measures: by ticket `updated_at` (Aug 31 vs Aug 25) and by commit date of the side that set it (HEAD-side `b0d981f729`, 2026-08-26 16:21:08 -0700, vs incoming 2026-08-25 16:21:06 -0700). Applying the incoming side would regress BUG-39 from `bundled` back to `free_coding` and roll `updated_at` backwards — replaying an older lifecycle transition over a newer one. Resolved to HEAD.

  No structural/content split was available to compose here: both sides touch the same two scalar fields in the same block, so 2e's "apply BOTH" and "keep the superset" arms do not apply.

## Incoming changes preserved

- `.xgd/tickets/hot/bug-23d1ec27.md` — **none of the incoming hunk is carried forward, and that is the correct outcome.** This is not a dropped-by-oversight case and not a BUG-1301 precedence case; it is rule 2e's explicit genuine-conflict resolution: the incoming commit's only change is a `draft → free_coding` transition that HEAD has already superseded with `→ bundled`. Superseded lifecycle state is not developer code being discarded.

- No code, test, spec-matrix, or config files were involved in this conflict. No test function was deleted. STEP 3's code-file verification is not applicable — there are no code files in this cherry-pick.

## Staging state

Staged with `git add --sparse`. `git status --porcelain` is empty afterwards: the resolved content is byte-identical to HEAD, so the staged diff is clean. Per instructions `--skip` was **not** called — finalize will detect the empty staged diff and skip the commit. `CHERRY_PICK_HEAD` (`93b031a37e`) is left intact.
