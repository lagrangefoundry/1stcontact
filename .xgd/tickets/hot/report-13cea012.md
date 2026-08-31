---
uid: report-13cea012
id: REPORT-2692
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T05:21:35.303874+00:00'
updated_at: '2026-08-31T05:21:35.303874+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/chat-231d2cb0.md` — class **AA** (both added), bookkeeping ticket
  (`.xgd/tickets/hot/`, chat kind — not a spec/matrix ticket).
  Rule applied: **2b — one side is strictly a superset, incoming wins**
  (reinforced by 2e's "strict superset / added a field the other side never
  touched: keep the superset").
  Resolution: `git checkout --theirs` + `git add --sparse` (path is outside the
  sparse-checkout cone per DOC-986 §2/§4.1, so the conflict lived in the index).

  Both sides were byte-identical apart from one fact:
  - Ours (HEAD, `xgd(ticket): update chat chat-231d2cb0`): `fields: {}`
  - Theirs (incoming `1f4705152f43b081d5b5168f429705583ac7b28b`, free_coded,
    same subject): `fields:` → `chat_comment: comment-299f1881`

  No field was changed differently on the two sides — HEAD simply had the empty
  mapping, so no per-fact timeline arbitration (2e) was needed and no
  `working-timeline` lookup was required. The conflict-intent enrichment's
  fallback rule ("intent unknown on one or both sides, take the more recent
  commit and flag for post-merge review") did not have to be exercised: the
  superset relation is unambiguous and subsumes it. Nothing was invented that is
  not present on the incoming side.

## Incoming changes preserved

- `.xgd/tickets/hot/chat-231d2cb0.md`: the incoming commit's entire diff is the
  16-line new-file body. The resolved working-tree file is byte-for-byte that
  blob (`6c334c46d99d643313ba462fff811c4196938a28`), including the missing
  trailing newline. The key change — `fields.chat_comment: comment-299f1881` —
  is present. Verified with
  `git show 1f4705152f43b081d5b5168f429705583ac7b28b -- <file>` before staging.

- No hunks were dropped, so the BUG-1301 precedence exception was not invoked.
- No code/implementation files, UAT tests, spec tickets, or config files were in
  conflict; only the single chat ticket above.

## Tree state

`git status --porcelain` shows `M  .xgd/tickets/hot/chat-231d2cb0.md` and no
remaining conflict-class (UU/AA/DU/UD/AU/UA) lines. The 14 untracked
`comment-*.md` / `report-*.md` files under `.xgd/tickets/hot/` were already
untracked before this step and were left alone. CHERRY_PICK_HEAD is intact — no
`--continue`/`--skip`/`--quit`/`--abort`/`reset` was run; git state transitions
are left to `cherry_pick_finalize_resolution`.
