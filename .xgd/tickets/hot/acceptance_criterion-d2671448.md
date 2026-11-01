---
uid: acceptance_criterion-d2671448
id: AC-2072
type: acceptance_criterion
title: A write that introduces an image or background-image reference to an asset
  the site does not hold is refused naming the reference; query and fragment are ignored
  when matching
created_by: xgd
created_at: '2026-11-01T01:10:53.886338+00:00'
updated_at: '2026-11-01T01:10:53.886338+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-189fc1ac
  kind: behavior
  regression_only: false
---

## Criterion

A change that introduces an image element's source, or an element's background image,
naming a site asset the site does not hold is refused: the refusal names the reference,
says it would render as a broken image, lists the assets the site does hold (or says it
holds none), and says to reference something the site holds or add it first. On refusal
the draft is left unchanged.

When matching a site-relative reference to a held asset, a query string and fragment are
ignored, and the reference may be written with or without the assets prefix — so a
reference carrying a cache-busting suffix to an asset the site holds is accepted. Absolute
web references (any reference carrying a scheme, or protocol-relative) and bare fragments
are not checked against the site's assets; they remain subject only to the URL-scheme
allowlist.

## Verification

Replace an element with an image whose source names an asset the site does not hold:
assert a schema-invalid refusal naming the reference and listing held assets, and the
draft unchanged. Repeat with a box whose background image names a missing asset: assert
refused. Reference a held asset with a `?v=3` suffix and with a `#frag` suffix: assert
accepted. Reference an absolute `https://` image: assert accepted without an asset
check.