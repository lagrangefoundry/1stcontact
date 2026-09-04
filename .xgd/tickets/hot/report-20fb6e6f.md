---
uid: report-20fb6e6f
id: REPORT-3405
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-23'
created_by: xgd
created_at: '2026-09-03T23:35:11.936455+00:00'
updated_at: '2026-09-03T23:35:11.936455+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-23
---

## Files resolved

- `.xgd/tickets/hot/request-119dd4af.md` (REQ-159) — class **UU**, index-only
  (path is outside the sparse-checkout cone, so there were no working-tree
  markers; resolved via `git checkout --ours` + `git add --sparse`).
  Rule applied: **2e — intent/bookkeeping ticket, strict-superset**. Kept HEAD.

  The incoming commit `7e204dc27e` ("xgd(ticket): update request
  request-119dd4af", 2026-08-31 14:50 -0700) has exactly one authored change:
  it adds `chat_comment: comment-733e844c` to `fields:`. Its only other diff
  line is a no-newline-at-EOF artifact on an otherwise unchanged final line.

  HEAD side `1856968a43` ("xgd(ticket): seed_local_overlay request
  request-119dd4af", 2026-09-02 10:50 -0700) already carries
  `chat_comment: comment-733e844c` verbatim, and additionally advances
  `status: draft` → `bundled`, adds `fields.commits`
  (working_sha `115f0d39ec5f8787751f144cda8b5d3c6279fbf9`),
  `fields.version: 0.2.23`, `fields.bundled_in: bundle-203b1dc2`, and appends
  the "What landed" implementation record to the body.

  So HEAD is a strict superset of incoming on every fact incoming touched —
  there is no field the two sides set differently. Both the 2e superset rule
  and the enrichment metadata's timestamp rule (HEAD is the later commit,
  2026-09-02 vs 2026-08-31) select the same side, so no
  `xgd working-timeline` per-fact tiebreak was needed. No fields were
  invented; `fields.intent_uid` / `story_uid` / `capability_uid` were not
  touched.

## Incoming changes preserved

- `.xgd/tickets/hot/request-119dd4af.md` — **preserved**. The incoming
  commit's sole change, `chat_comment: comment-733e844c`, is present in the
  resolved file (frontmatter `fields:`). Verified by inspecting
  `git show 7e204dc27e -- <path>` against `git show :2:<path>`.

No hunks were dropped; the BUG-1301 precedence exception was not invoked.
No code, config, or UAT test files were involved in this conflict.

## Note on the staged result

`git diff --cached HEAD` is empty: HEAD already contained the incoming
commit's effect, so this cherry-pick is genuinely redundant rather than
discarded (STEP 3's distinction — the incoming change is present in HEAD,
not absent). Per STEP 4, `--skip` was NOT called; the tree is staged and
`CHERRY_PICK_HEAD` is left intact for `cherry_pick_finalize_resolution`.
