---
uid: report-7e2b4de1
id: REPORT-5279
type: report
title: 'Resync resolve conflicts: b6b7f564f0bf1ee0904f0b6aa25ee3ca053055f0'
created_by: xgd
created_at: '2026-09-28T03:36:51.733297+00:00'
updated_at: '2026-09-28T03:36:51.733297+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/bug-23d1ec27.md` — **UU**, intent/bookkeeping ticket (BUG-39), sparse-excluded (`.xgd/tickets/**` is outside the resync cone, DOC-986 §2/§4.1). Rule applied: §2e — "one side a strict superset: keep the superset", which coincides with the enrichment's "take the more recent commit by timestamp" (ours `updated_at` 2026-08-31T05:05:09Z vs incoming 2026-08-24T22:25:21Z). Resolved to ours via `git checkout --ours` + `git add --sparse`.

  Two conflict hunks, both decided by the same fact-level comparison:

  | | status / `updated_at` | `fields` | body |
  |---|---|---|---|
  | base (stage 1) | `draft` / Aug 24 | no `chat_comment` | original |
  | incoming (stage 3) | `draft` / Aug 24 | + `chat_comment: comment-72dd436d` | **byte-identical to base** |
  | ours (stage 2) | `bundled` / Aug 31 | `chat_comment` **already present**, plus `commits`, `version: 0.2.15`, `story_points: 3`, `bundled_in: bundle-8eef3846` | rewritten: "Fix — as landed", ✅-marked ACs, "Out of scope" section, the `./bin/1c assets` note |

  - Hunk 1 (frontmatter `fields`): no competing facts. The incoming side's sole contribution, `chat_comment: comment-72dd436d`, is already on ours — git matched it identically on both sides and left it *outside* the markers (line 18). Ours additionally carries later lifecycle fields. Incoming-wins here would have regressed `bundled` → `draft` and dropped `commits`/`version`/`bundled_in`.
  - Hunk 2 (body tail, `## Reproduce`): incoming's body is byte-identical to base — the incoming commit touched only frontmatter; its `\ No newline at end of file` is a truncation artefact, not developer intent. Ours is a strict superset (adds the `Cannot find module './generated/ai-workers.js'` build-artefact note). Nothing to integrate from incoming.

## Incoming changes preserved

- `.xgd/tickets/hot/bug-23d1ec27.md` — **fully preserved, no hunk dropped.** `git show e2ef5e9851 -- .xgd/tickets/hot/bug-23d1ec27.md` shows the commit's entire content delta is one added line, `chat_comment: comment-72dd436d`; that line is present verbatim in the resolved file. Verified against all three index stages (`git show :1:`/`:2:`/`:3:`) rather than inferred from the working tree. The BUG-1301 precedence exception was **not** invoked and was not needed.

No code, test, or spec-ticket files were in conflict, so no `tests/**` or `xgd_source/**` verification was applicable.

## Note for the finalize step

The staged tree is byte-identical to HEAD (`git status --porcelain` is empty with no unmerged paths), i.e. this pick is empty — the post-watermark sync already carries `chat_comment` plus a refined body. Per STEP 4 this was **not** skipped here; `CHERRY_PICK_HEAD` is intact at `e2ef5e985174247cfce7b942aba381b904ff7f85` for the finalize step to detect the clean staged diff and skip the commit itself.
