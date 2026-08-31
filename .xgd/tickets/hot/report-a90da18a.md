---
uid: report-a90da18a
id: REPORT-2711
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T05:39:38.491332+00:00'
updated_at: '2026-08-31T05:39:38.491332+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/request-5946d045.md` — class **AA** (both added), intent/bookkeeping ticket → rules **2b** + **2e** (strict superset). Resolved by taking the incoming (free_coded) side via `git checkout --theirs` + `git add --sparse` (path is outside the sparse-checkout cone, DOC-986 §2/§4.1).

  The two sides are byte-identical except for one added key in `fields`:

  ```
  +  chat_comment: comment-bff7e360
  ```

  Incoming is therefore a strict superset of HEAD — no field is changed
  differently on the two sides, so no per-fact timeline arbitration was
  needed. No content was invented; no `intent_uid`/`story_uid`/
  `capability_uid` field was touched.

## Incoming changes preserved

- `.xgd/tickets/hot/request-5946d045.md` — the staged blob is
  `55264af972a28ecd21b396765391836ba13581ff`, which is the incoming
  (stage 3) blob verbatim. `git diff --cached` against HEAD shows exactly
  the incoming commit's one-line addition (`chat_comment: comment-bff7e360`)
  and nothing else. Everything on the HEAD side is retained because HEAD's
  content is a subset of it.

No code/implementation files were in conflict, so STEP 3's discard check
had no code hunks to audit. No hunks were dropped, and the BUG-1301
precedence exception was not invoked.

Staging verified clean: `git status --porcelain` shows no UU/AA/DU/UD
lines — only `M  .xgd/tickets/hot/request-5946d045.md` (staged) plus
pre-existing untracked ticket files. The in-progress cherry-pick state
(CHERRY_PICK_HEAD = 4e7286d5fc9840b34fe8790961f65a45e751efce) was left untouched for
`cherry_pick_finalize_resolution`.
