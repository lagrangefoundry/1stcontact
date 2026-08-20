---
uid: acceptance_criterion-046a5b98
id: AC-1251
type: acceptance_criterion
title: A refused edit leaves the surface open and unchanged and shows the store's
  own refusal message and hint, not a paraphrase
created_by: xgd
created_at: '2026-08-20T01:59:44.503067+00:00'
updated_at: '2026-08-20T01:59:44.503067+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-4300366a
  kind: behavior
  regression_only: false
---

## Criterion

A refused edit leaves the surface open and its listing unchanged, and shows the refusal in the
store's **own** words together with its hint — the message that says which rule refused, and the
hint that says what to do instead — rather than a paraphrase the surface invented. A subsequent
successful edit clears the refusal and replaces it with the confirmation.

## Verification

From the surface, attempt an edit the store refuses (for example adding an entry under a name the
palette already holds, or under a malformed name). Observe the surface still open, the swatch list
identical to before the attempt, the stored definition unchanged, and the displayed text containing
the store's own refusal message and hint verbatim. Then perform an edit the store accepts and
observe the refusal replaced by the confirmation.
