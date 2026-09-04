---
uid: acceptance_criterion-96191116
id: AC-1560
type: acceptance_criterion
title: The list narrows by what the material is for, by its kind, by whether it is
  used on the open site, and by name — and every narrowing is reversible
created_by: xgd
created_at: '2026-09-04T04:26:40.839093+00:00'
updated_at: '2026-09-04T04:26:40.839093+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-f775289b
  kind: behavior
  regression_only: false
---

## Criterion

Four narrowings are offered over the list and they combine — a row is shown only if it survives all
of them:

1. **What the material is for.** Choosing one of the roles shows only material the client marked
   with it; the neutral choice shows every row including material with no role recorded.
2. **What kind of thing it is.** Choosing a kind shows only material of that kind; the neutral
   choice shows every row.
3. **Used on the open site.** Turning this on shows only material bound to the site currently open;
   turning it off restores material bound to the client's other sites and to none.
4. **By name.** Typing narrows to material whose name matches what was typed, case-insensitively;
   clearing the text restores the rest.

Returning every narrowing to its neutral state restores the full account-wide list exactly as it was
before any narrowing was applied.

## Verification

With a populated Library, exercise each narrowing alone and assert the surviving rows are exactly
those matching it. Apply two together (a role and a kind that intersect in one row) and assert only
that row survives. Turn the used-here narrowing on and off and assert the other-site and unbound
material disappears and returns. Type a fragment of one name and assert only that row survives, in a
different letter case from the stored name. Reset all four and assert the original row set.
