---
uid: acceptance_criterion-afb19a07
id: AC-2203
type: acceptance_criterion
title: A contact is a Member if and only if they have accepted the terms, whatever
  else is true of them
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T20:05:08.390369+00:00'
updated_at: '2026-11-01T20:12:53.160720+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-0ea74f39
  kind: behavior
  regression_only: false
---

## Criterion
For every contact in the current business, the people list and person detail responses carry the terms-acceptance timestamp. In the Contacts tab, a contact reads as **Member** exactly when that timestamp is set, and as **Not a member** when it is null. This holds regardless of whether the contact was invited, whether they have reached the sign-in/terms interstitial (first seen), or what their pipeline stage is. A contact who reached the interstitial but did not accept the terms is **Not a member**.

## Verification
Seed contacts in one business: (a) terms accepted; (b) first seen but terms not accepted; (c) invited but never seen; (d) none of these. Read the people list and render the Contacts tab. Assert that (a) carries a terms-accepted timestamp and renders with a Member badge. Assert that (b), (c) and (d) have a null terms-accepted value, render with no Member badge, and are classified as Not a member by the access facet.