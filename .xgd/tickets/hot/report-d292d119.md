---
uid: report-d292d119
id: REPORT-2757
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T06:33:02.962657+00:00'
updated_at: '2026-08-31T06:33:02.962657+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/request-8ccd3a3e.md` — AA (both added), intent/bookkeeping
  ticket (`request-*`). Rules 2b + 2e applied: incoming is a **strict superset**
  of HEAD. Resolved with `git checkout --theirs` + `git add --sparse`
  (index-only conflict; `.xgd/tickets/` is outside the sparse-checkout cone on
  reconcile branches, DOC-986 §2/§4.1, so the working tree carried no conflict
  markers and held the OURS version).

  Sides compared blob-to-blob (stage 2 `41524040`, stage 3 `281bdde2`). The
  entire delta is one added line in `fields`:

      +  chat_comment: comment-8f9135e0

  No field, section, or paragraph is changed differently on the two sides — the
  frontmatter scalars (`status: free_and_reconciled`, `version: 0.0.33`,
  `bundled_in: bundle-adc60ee8`, `commits`, all timestamps) and the whole
  markdown body (Behavior / Acceptance / Coverage) are byte-identical. There is
  no competing fact, so no `xgd working-timeline` tie-break was needed. Nothing
  from the HEAD side was dropped; no content was invented.

## Incoming changes preserved

- `.xgd/tickets/hot/request-8ccd3a3e.md` — CONFIRMED. The incoming commit
  `4595ff0ffb86a1173ac32cc26793a868c42e39db` ("xgd(ticket): update request
  request-8ccd3a3e") adds this file whole (57 insertions).
  `git diff --cached 4595ff0f -- <path>` returns **empty**: the staged blob is
  byte-identical to the incoming commit's version, so every incoming change,
  including the `chat_comment: comment-8f9135e0` field, is present in the
  resolution.

No hunks were dropped, so the BUG-1301 precedence exception does not apply here.
No code, test, or UAT files were involved in this conflict.

Note (informational, not a resolution issue): the referenced
`comment-8f9135e0` ticket is not materialized in this worktree's
`.xgd/tickets/hot/` — consistent with the sparse-checkout cone excluding
`.xgd/tickets/`. The reference was authored by the developer on the incoming
side and is carried through verbatim.

Cherry-pick sequencer state left untouched: `CHERRY_PICK_HEAD` is still present
for `cherry_pick_finalize_resolution`. No `--continue` / `--skip` / `--quit` /
`--abort` / `reset` was run. `git ls-files -u` is empty; the file stages as `M`.
