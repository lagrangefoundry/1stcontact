---
uid: report-8a85dc64
id: REPORT-2785
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T07:07:30.701686+00:00'
updated_at: '2026-08-31T07:07:30.701686+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/request-b63bbed5.md` — class **AA** (both added), intent/bookkeeping ticket (2e).
  Rule applied: **strict superset → keep the superset.** The two sides are
  byte-identical except that the incoming (free_coded, `bc2f9f95`) side adds one
  frontmatter field the HEAD side never had:

  ```
  +  chat_comment: comment-ed5f74bb
  ```

  No field or section is changed differently on the two sides, so no per-fact
  timeline arbitration was needed. Resolved with `git checkout --theirs` +
  `git add --sparse` (path is outside the sparse-checkout cone, DOC-986 §2/§4.1).

## Incoming changes preserved

- `.xgd/tickets/hot/request-b63bbed5.md` — confirmed. The staged blob is
  `32efcc19d9908139b5ab90ede440610d75fbac1a`, byte-identical to the incoming
  (stage 3) blob. `git show bc2f9f95 -- <path>` adds the file wholesale (218
  insertions); every line of it is present in the resolution, and the only
  delta vs. the HEAD side (`1d6856d0`) is the added `chat_comment` field, which
  is present in the staged result.

Nothing was dropped from either side. No hunks were dropped under the BUG-1301
precedence exception — it did not apply here. No code, test, or UAT files were
touched by this conflict.

Staging verified clean: `git status --porcelain` shows no UU/AA/DU/UD/AU/UA
lines; the file appears as `M ` (staged modification). The in-progress
cherry-pick sequencer state (CHERRY_PICK_HEAD) was left intact for
`cherry_pick_finalize_resolution`.
