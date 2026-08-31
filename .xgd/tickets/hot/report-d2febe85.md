---
uid: report-d2febe85
id: REPORT-2729
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T06:00:15.608759+00:00'
updated_at: '2026-08-31T06:00:15.608759+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/request-d05379d0.md` — class **AA** (both added), intent/bookkeeping
  ticket (rule **2e**), outside the sparse-checkout cone (staged with `--sparse`).
  The two sides are byte-identical except for a single added frontmatter field on the
  incoming side, so the incoming version is a **strict superset**. Applied the 2e
  superset rule: `git checkout --theirs` + `git add --sparse`. No timeline lookup was
  needed — there is no per-fact disagreement to arbitrate.

  Full diff between the two stages (ours `dc325fad` → theirs `5ec4e3ac`):

  ```
  @@ -92,6 +92,7 @@ fields:
     - working_sha: 763e819bcd5d78797147c996c25189d645c86036
       reconcile_sha: null
       main_sha: 763e819bcd5d78797147c996c25189d645c86036
  +  chat_comment: comment-c8948b29
   ---
  ```

  Enrichment context: ours = `sync_working_to_main` ("xgd: sync from xgd-working
  d3562e3b8285 (post-watermark)"), theirs = free_coded ticket update
  ("xgd(ticket): update request request-d05379d0", commit `7d6c6e5b`). The enrichment's
  fallback "take the more recent commit and flag for review" did not need to be
  exercised: the sides do not disagree on any fact, so composing them and taking the
  superset are the same result. No post-merge review flag warranted.

## Incoming changes preserved

- `.xgd/tickets/hot/request-d05379d0.md` — **fully preserved**. The staged blob is
  `5ec4e3ac2cd7f248153683f06716fe34729959a3`, byte-identical to the incoming (stage 3)
  blob; `git ls-files -s` confirms it at stage 0. The incoming commit `7d6c6e5b` touched
  only this file (381 insertions, whole-file add), and its sole delta versus ours —
  `chat_comment: comment-c8948b29` — is present in the resolved file (verified by grep).
  Nothing from the ours side was lost: every ours-side line is contained in the incoming
  version.

No hunks were dropped; the BUG-1301 precedence exception was not invoked. No code,
test, or UAT files were involved in this conflict.
