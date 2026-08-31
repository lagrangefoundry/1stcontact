---
uid: acceptance_criterion-4b9f7f0c
id: AC-1399
type: acceptance_criterion
title: With no local process running, the deployed workspace serves its document,
  lists the store's sites, and renders both draft-side channels itself
created_by: xgd
created_at: '2026-08-31T10:12:43.427609+00:00'
updated_at: '2026-08-31T10:12:43.427609+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-e674c60a
  kind: behavior
  regression_only: false
---

## Criterion

With **no local origin process running anywhere**, the deployed workspace answers
for itself: it serves the workspace document, it lists exactly the sites the
shared store actually holds, and it produces both draft-side channels — the
ordinary rendering and the editable one — from the stored definition at the
moment they are requested, reading through the shared store rather than through
anything on an operator's disk.

The two channels are the same production in its two modes and must differ from
each other: the editable one carries the addresses the editor resolves a click
against. Both include the composed presentation the page references, so a page
that arrives without it is a page whose styling was assembled somewhere the
runtime cannot reach.

An edit made through the workspace lands in the shared store, and is still there
when read back by a second, independent request — a response can be composed
without anything having been written, so the read-back is what makes the claim.

## Verification

Against the deployed runtime, with nothing else running: import a site whose
definition uses only the portable presentation layer, then request the workspace
document, the site listing, and both draft-side channels. Assert the listing
contains the imported site, that each channel answers successfully as a
document, and that the two channels differ. Request the presentation file the
rendered page references and assert it is non-empty.

Then write an edit through the workspace's own operation — a palette entry is
enough — and, in a **separate** request, read the same value back out of the
store. Assert the value read back is the value written, so the assertion cannot
pass on a response that was composed without a write.
