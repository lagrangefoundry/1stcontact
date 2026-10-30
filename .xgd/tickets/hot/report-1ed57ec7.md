---
uid: report-1ed57ec7
id: REPORT-4584
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-20T23:56:20.671669+00:00'
updated_at: '2026-09-20T23:56:20.671669+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/bug-23d1ec27.md` — **UU**, intent/bookkeeping ticket (`bug-*`), rule **2e**. Three conflict hunks, all resolved to the HEAD side, via two different arms of the rule.

  Incoming commit: `0941885b7b` ("xgd(ticket): update bug bug-23d1ec27", authored 2026-08-25 16:28:09 -0700). It does three things: advances the lifecycle `free_coding → free_coded`, adds a `commits:` block and `version:` to `fields:`, and strips the trailing newline.

  | # | Hunk | HEAD (kept) | Incoming | Arm of 2e applied |
  |---|---|---|---|---|
  | 1 | frontmatter lifecycle | `status: bundled`, `updated_at: 2026-08-31T05:05:09` | `status: free_coded`, `updated_at: 2026-08-25T23:28:09` | genuine conflict → later-positioned intent wins |
  | 2 | `fields:` tail | `story_points: 3`, `bundled_in: bundle-8eef3846` | *(absent — these fields don't exist yet at Aug 25)* | HEAD is a strict superset → keep the superset |
  | 3 | Reproduce note | reflowed single line | same sentence hard-wrapped over 3 lines | content identical; HEAD wrapping kept |

  **Hunk 1** is the only genuine intent conflict. `last_field_updated` (`status`) and `completed_at` (`null`) are identical on both sides and not in contention; only `status` and `updated_at` compete. HEAD is later-positioned on both measures — ticket `updated_at` Aug 31 vs Aug 25, and commit date of the side that set it (HEAD-side `b0d981f729`, 2026-08-26, vs incoming 2026-08-25) — and `bundled` is downstream of `free_coded` in the lifecycle. Taking the incoming side would regress BUG-39 from `bundled` back to `free_coded` and roll `updated_at` backwards.

  **Hunk 2** needs no arbitration: HEAD carries everything the incoming side has in `fields:` plus two later fields. Keeping the superset.

  **Hunk 3** is formatting only — xgd's store reflowed the paragraph when this content landed on HEAD earlier in the queue; the incoming commit carries it hard-wrapped at ~80 columns. Same sentence either way; kept HEAD's form for consistency with the rest of the file, which 2e's later-intent rule also points to.

## Incoming changes preserved

- `.xgd/tickets/hot/bug-23d1ec27.md` — **the incoming commit's substantive additions are all present in the resolved file**, and they merged cleanly (no conflict hunk) because HEAD already carries them byte-for-byte from an earlier commit in this queue:

  - `commits:` block — `working_sha: 759cd87405a4b50f81995b2c9b510bf23be54fbd`, `reconcile_sha: null`, `main_sha: null` — present at lines 20–22
  - `version: 0.2.15` — present at line 23

- Not carried forward, each for a stated reason rather than oversight:
  - The `→ free_coded` lifecycle transition and its `updated_at`, superseded by HEAD's later `→ bundled` (2e genuine-conflict arm). Superseded lifecycle state is not developer work being discarded.
  - The trailing-newline strip — a whitespace artifact, not a developer change.
  - The hard-wrapped rewrapping of the Reproduce note — cosmetic; the sentence itself is present.

- No BUG-1301 precedence exception was invoked. No code, test, spec-matrix, or config files were involved. No test function was deleted. STEP 3's code-file verification is not applicable — this cherry-pick touches one ticket file only.

## Staging state

Staged with `git add --sparse`. The resolved file is byte-identical to HEAD (`diff` against `git show HEAD:…` is empty), so `git status --porcelain` is empty and the staged diff is clean. Per instructions `--skip` was **not** called — finalize will detect the empty staged diff and skip the commit. `CHERRY_PICK_HEAD` (`0941885b7b`) is left intact.
