---
uid: report-a653b6bb
id: REPORT-5354
type: report
title: 'Resync resolve conflicts: 6ba006de764d843fa7f4357df2b341e72f20e2f6'
created_by: xgd
created_at: '2026-09-28T19:36:39.290799+00:00'
updated_at: '2026-09-28T19:36:39.290799+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/request-909e42f8.md` (REQ-164) — **UU, intent/bookkeeping ticket (STEP 2e)**. Incoming commit `7e2eac8d00` ("xgd(ticket): update request request-909e42f8", 2026-08-31 15:09:14 -0700) touched a single frontmatter hunk, 2 insertions / 2 deletions, no body change. All three conflicting facts are the same-field-changed-on-both-sides case, so the 2e genuine-conflict rule applies per fact; HEAD wins each:
  - `status`: HEAD `bundled` over incoming `free_coded`. `bundled` is downstream of `free_coded` in the lifecycle — replaying incoming would roll the ticket backwards and orphan it from `fields.bundled_in: bundle-87be4669` (a HEAD-only fact, uncontested in this conflict, retained).
  - `updated_at`: HEAD `2026-09-09T21:32:49` over incoming `2026-08-31T22:09:14`. HEAD is later by nine days on the ticket's own clock, and by commit timestamp (HEAD-side `3bb3a8c547` @ 2026-09-11 02:58 vs incoming @ 2026-08-31 15:09). This matches the enrichment metadata's unknown-intent rule: take the more recent commit by timestamp.
  - `last_field_updated`: HEAD `status` over incoming `story_points`. This field is a derived breadcrumb naming whichever edit landed last; since HEAD's `status` → `bundled` edit is the surviving later one, `status` is the internally consistent value. Carrying incoming's `story_points` alongside HEAD's `status: bundled` would leave the breadcrumb pointing at an edit that is not the most recent.
  - Path is outside the sparse-checkout cone (DOC-986 §2/§4.1); staged with `git add --sparse`.

This ticket is not the resync anchor (anchor is `report-377b581e`), so it is incidental lifecycle drift rather than the subject of the run.

## Incoming changes preserved

No code files were in conflict — the sole conflicted path is a ticket, so STEP 3's code-file verification does not apply.

Incoming commit `7e2eac8d00` carried **no disjoint content fact** to preserve. Its diff is exactly the three fields above, every one of which HEAD also changed, later. Notably `last_field_updated: story_points` advertises a `story_points` edit, but `fields.story_points: 3` appears as *uncontested context* on both sides of the hunk — the value is identical, so nothing substantive from incoming is being dropped, only a stale breadcrumb and an older timestamp that HEAD has already superseded.

No BUG-1301 precedence exception was invoked; no test function on either side was deleted.

## Verification

- `grep` for `<<<<<<<` / `=======` / `>>>>>>>` in the resolved file — no matches.
- `git status --porcelain` — empty; the UU line is gone.
- Index copy (`git show :0:`) re-read: valid YAML frontmatter, `status: bundled`, `bundled_in` intact, no markers.
- `CHERRY_PICK_HEAD` re-read after staging, still `7e2eac8d0081e117656d4b6ebf2f591c98b472df`. No `--continue` / `--skip` / `--quit` / `--abort` was run.

Net staged diff against HEAD is empty, since every surviving fact already matched HEAD. Per STEP 4 I staged and stopped rather than skipping — the finalize step's clean-diff detection should handle the commit.
