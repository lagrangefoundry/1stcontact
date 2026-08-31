---
uid: report-c9987fe2
id: REPORT-2802
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T07:28:24.282884+00:00'
updated_at: '2026-08-31T07:28:24.282884+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/bug-75547389.md` — class **AA** (both added), intent/bookkeeping
  ticket (STEP 2 rule **2b** "one side is strictly a superset" / **2e** "keep the
  superset"). Resolved by `git checkout --theirs` + `git add --sparse` (path is
  outside the sparse-checkout cone on this reconcile branch, DOC-986 §2/§4.1).

  Both sides are byte-identical across the entire frontmatter and all six body
  sections (Symptom, Root cause, Mechanism 1, Mechanism 2, Reconcile is exonerated,
  Recovery). The single difference: the incoming (free_coded) side adds
  `fields.chat_comment: comment-d5a54d7b`. Incoming is therefore a strict superset
  of HEAD — no competing fact, so no `xgd working-timeline` per-fact adjudication
  was needed, and the enrichment note's "unknown intent → take more recent by
  timestamp" fallback is moot (superset resolution subsumes it). No content was
  invented; no `intent_uid`/`story_uid`/`capability_uid` field was touched.

## Incoming changes preserved

- `.xgd/tickets/hot/bug-75547389.md` — the incoming commit
  `a482175a824b00b20c0b072ba5035966c7948938` ("xgd(ticket): update bug
  bug-75547389") adds this file with 84 insertions. The staged blob is
  `3fc7a4f3009fa958c576324b5dcf5003549e8c8f`, byte-identical to the incoming
  stage-3 blob. `git show :<path> | grep chat_comment` confirms the added field is
  present at line 17. Staged diff vs HEAD is `+ chat_comment: comment-d5a54d7b`
  plus a trailing-newline removal that is itself part of the incoming authored
  blob. Nothing from either side was discarded.

- No hunks were dropped; the BUG-1301 PRECEDENCE exception did not apply to this
  conflict. No code, test, or UAT files were involved.

## Verification

- `git status --porcelain` shows no remaining UU/AA/DU/UD/AU/UA lines.
- The file stages as `M ` (modified, staged) as expected.
- CHERRY_PICK_HEAD left intact for `cherry_pick_finalize_resolution`; no
  `--continue`/`--skip`/`--quit`/`--abort`/`reset` was run.
