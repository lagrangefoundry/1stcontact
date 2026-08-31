---
uid: report-7eb7ab5d
id: REPORT-2749
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T06:22:26.855873+00:00'
updated_at: '2026-08-31T06:22:26.855873+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/request-3c0fec69.md` — class **AA** (both added), intent/bookkeeping ticket
  (rule **2b** "one side is strictly a superset → keep the superset", consistent with **2e**
  for request-* tickets). Resolved via `git checkout --theirs` + `git add --sparse`
  (path is outside the sparse-checkout cone, DOC-986 §2/§4.1).

  The two sides are identical except for a single added frontmatter field on the incoming
  side. Full diff ours→theirs:

  ```
  @@ -31,6 +31,7 @@
       - e70668dd1ce02f09ab7f914cbaa5ac672454535a
     version: 0.1.46
     bundled_in: bundle-77b28def
  +  chat_comment: comment-cd188be0
   ---
  ```

  No competing edits: no field is set differently on the two sides, so no per-fact timeline
  arbitration was needed. Incoming is a strict superset (173 → 174 lines); taking it loses
  nothing from the HEAD side.

## Incoming changes preserved

- Incoming commit `2957195336e5fbeeb45dd50a0935941a8d7356ed`
  (_xgd(ticket): update request request-3c0fec69_) touches only this one file, adding it
  whole (175 insertions, 1 file changed).
- The staged blob is `744051ecc429e0334fec027b303b5d338d42ebc2` — byte-identical to the
  incoming (stage 3) blob. Every line of the incoming version, including the new
  `chat_comment: comment-cd188be0` field, is present in the resolution.
- No hunks were dropped; the BUG-1301 precedence exception was not invoked.
- No code/implementation files were in conflict, so no spot-check tests were applicable.

Tree state after resolution: no UU/AA/DU/UD lines remain; the file is staged as `M`.
The in-progress cherry-pick (CHERRY_PICK_HEAD) was left untouched for
`cherry_pick_finalize_resolution`.
