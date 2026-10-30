---
uid: report-6fe44fef
id: REPORT-4585
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-20T23:57:45.687756+00:00'
updated_at: '2026-09-20T23:57:45.687756+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/bug-23d1ec27.md` — **UU**, intent/bookkeeping ticket (`bug-*`), rule **2e**. Two conflict hunks, both resolved to the HEAD side.

  Incoming commit: `7f1350e9a5` ("xgd(ticket): update bug bug-23d1ec27", authored 2026-08-25 16:28:10 -0700). Its substantive change is a single field addition — `story_points: 3` — with the accompanying `last_field_updated` / `updated_at` bookkeeping.

  | # | Hunk | HEAD (kept) | Incoming | Arm of 2e applied |
  |---|---|---|---|---|
  | 1 | frontmatter lifecycle | `status: bundled`, `updated_at: 2026-08-31T05:05:09`, `last_field_updated: status` | `status: free_coded`, `updated_at: 2026-08-25T23:28:10`, `last_field_updated: story_points` | genuine conflict → later-positioned intent wins |
  | 2 | `fields:` tail | `bundled_in: bundle-8eef3846` | *(absent — the field does not exist yet at Aug 25)* | HEAD is a strict superset → keep the superset |

  **Hunk 1** is the only genuine intent conflict. `completed_at` (`null`) is identical on both sides; `status`, `updated_at` and `last_field_updated` compete. HEAD is later-positioned on every measure — ticket `updated_at` Aug 31 vs Aug 25, and commit date of the side that set it (HEAD-side `b0d981f729`, 2026-08-26, vs incoming 2026-08-25) — and `bundled` is downstream of `free_coded` in the lifecycle. `last_field_updated` is a derived marker of whichever field moved most recently; on HEAD that was `status`, consistent with HEAD's own `updated_at`, so it follows the same side rather than being arbitrated separately. Taking the incoming side would regress BUG-39 from `bundled` back to `free_coded` and roll `updated_at` backwards.

  **Hunk 2** needs no arbitration: HEAD carries everything the incoming side has in `fields:` plus `bundled_in`, which postdates this commit. Keeping the superset.

## Incoming changes preserved

- `.xgd/tickets/hot/bug-23d1ec27.md` — **the incoming commit's substantive change is present in the resolved file.** `story_points: 3` sits at line 24. It merged cleanly with no conflict hunk, because HEAD already carries it byte-for-byte from an earlier commit in this queue; the surrounding `fields:` entries it was added next to (`commits:`/`working_sha` line 20, `version: 0.2.15` line 23) are likewise intact.

- Not carried forward, each for a stated reason rather than oversight: the `free_coded` status, the Aug 25 `updated_at`, and `last_field_updated: story_points` — all superseded by HEAD's later `→ bundled` transition on Aug 31 (2e genuine-conflict arm). Superseded lifecycle bookkeeping is not developer work being discarded.

- No BUG-1301 precedence exception was invoked. No code, test, spec-matrix, or config files were involved. No test function was deleted. STEP 3's code-file verification is not applicable — this cherry-pick touches one ticket file only.

## Staging state

Staged with `git add --sparse`. The resolved file is byte-identical to HEAD (`diff` against `git show HEAD:…` is empty), so `git status --porcelain` is empty and the staged diff is clean. Per instructions `--skip` was **not** called — finalize will detect the empty staged diff and skip the commit. `CHERRY_PICK_HEAD` (`7f1350e9a5`) is left intact.
