---
uid: acceptance_criterion-99e96d6c
id: AC-1469
type: acceptance_criterion
title: A capture of the operator's own draft returns the authored page, not a sign-in
  challenge
created_by: xgd
created_at: '2026-08-31T23:20:52.960284+00:00'
updated_at: '2026-08-31T23:20:52.960284+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-7fa314f5
  kind: behavior
  regression_only: false
---

## Criterion

Capturing one of the deployment's own draft-side channels for a site the account
holds returns image bytes of **the authored page**.

- The browser is pointed at the real absolute address of that page on the
  deployment's own host — not at a document with no origin — so the page's
  relative asset references resolve against that host exactly as they do for a
  person browsing the deployed builder.
- The document the browser is given for that navigation is byte-identical to
  what the preview surface serves for the same site, channel and path, is
  answered as a success, and is HTML.
- It is not a sign-in challenge: the document contains no redirect to the
  sign-in provider.

## Verification

Capture the draft channel of an authored site through the deployment's own
capture path, then assert on both the returned image and the document the
browser was given for the navigation:

1. the returned bytes are a PNG;
2. the navigated address is the real absolute draft URL on the deployment's own
   host;
3. the navigation was answered successfully, as HTML, and its body equals what
   the preview surface returns for that same site, channel and path;
4. the body carries no reference to the sign-in provider's challenge host, and
   is an HTML document.

Point 4 is asserted separately from point 3 on purpose: byte-equality alone
proves the pages match but does not *name* the property that matters, and "not a
challenge" is the property this story exists to guarantee.
