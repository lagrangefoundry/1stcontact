---
uid: report-e113c79d
id: REPORT-4098
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-11T23:39:16.361692+00:00'
updated_at: '2026-09-11T23:39:16.361692+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/bug-6612c4b7.md` (BUG-37) — class **UU**, rule **2e**
  (intent/bookkeeping ticket: a `bug-*` ticket, user-authored content, not
  matrix state). Resolved per-fact. Staged with `git add --sparse` (path is
  outside the sparse-checkout cone on this reconcile branch, DOC-986
  §2/§4.1).

  Incoming commit: `b0af50e157` "xgd(ticket): update bug bug-6612c4b7"
  (2026-08-24 14:06:24). Conflict-intent enrichment reported the xgd-kind as
  unknown on both sides, directing the timeline rule + post-merge review.

  **Context — this is the second half of a retitle pair.** The preceding
  attempt in this bundle cherry-picked `fe97d3bc34` (14:06:15), which
  recorded the retitle as a `fields.title` bookkeeping entry. `b0af50e157`
  (14:06:24, nine seconds later) is the commit that actually applies it to
  the canonical top-level `title:`. Same commit subject on both; the diff,
  not the message, distinguishes them.

  Exactly one conflict hunk, on one fact:

  1. **Frontmatter lifecycle scalars** (`updated_at`, `completed_at`,
     `last_field_updated`, `status`). Same fact changed differently on both
     sides → later-positioned side wins. HEAD carries
     `updated_at: 2026-08-31T19:19:36`, a non-null `completed_at`, and
     `status: free_and_reconciled`; incoming carries
     `2026-08-24T21:06:24`, `completed_at: null`, `status: draft`. HEAD is
     the later position by a week and reflects work that has since been
     coded, reconciled and bundled (`commits`, `version: 0.2.13`,
     `bundled_in: bundle-78f4e2fe` are all present and unconflicted).
     **Kept HEAD.** Taking the incoming side would have demoted a
     `free_and_reconciled` ticket back to `draft` — an operator-owned
     status revert.

  The incoming commit's other hunk — the `title:` retitle
  `Edit mode 503s with Cloudflare 1102` → `Edit mode dies with Cloudflare
  1102` — **merged cleanly and did not conflict**, because HEAD's title
  already carries the target wording. No `fields:` or body hunks were in
  this commit, so those sections were untouched by this resolution.

## Incoming changes preserved

Verified against `git show b0af50e157 -- .xgd/tickets/hot/bug-6612c4b7.md`.
The commit contains exactly two hunks:

- **`title:` retitle — PRESENT.** The resolved file reads
  `title: 'control-app: Edit mode dies with Cloudflare 1102 — the preview
  render cache never hits in the Worker'` at line 5. This is the commit's
  substantive intent and it survives intact.
- **`updated_at` bump to `2026-08-24T21:06:24`** — deliberately superseded
  by HEAD's `2026-08-31T19:19:36`, per the per-fact timeline rule above.
  This is a mechanical mtime scalar, not developer content.

The resolved file is byte-identical to `HEAD:.xgd/tickets/hot/bug-6612c4b7.md`
(confirmed with `git diff --no-index` against the HEAD blob — empty output),
so the staged diff is empty. This is BUG-1109/BUG-1122's **redundant** case,
not a discard: STEP 3's distinguishing check passes because the commit's key
change is *present in HEAD*, having reached it by a different route (HEAD's
own later lineage already carries the retitled `title:`), rather than simply
absent. Per STEP 4 I did **not** call `--skip`; the staged tree is left for
`cherry_pick_finalize_resolution` to detect and skip.

No hunks were dropped under the BUG-1301 precedence exception in this
resolution. No test files were involved, so 2f did not apply.

## Post-merge review flag

Per the enrichment's "flag this file for post-merge review" directive: both
sides' commit subjects are the generic `xgd(ticket): update bug
bug-6612c4b7`, so xgd-kind could not be inferred from either side — and in
this bundle that generic subject is reused across at least two distinct
commits (`fe97d3bc34`, `b0af50e157`) making the same logical edit in two
steps. The resolution above therefore rests on in-file evidence (timestamps,
status lifecycle, the actual diff contents) rather than on commit-kind or
commit-subject metadata.
