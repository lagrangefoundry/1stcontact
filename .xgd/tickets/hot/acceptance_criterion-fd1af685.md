---
uid: acceptance_criterion-fd1af685
id: AC-909
type: acceptance_criterion
title: Published responses carry a short lifetime and are never immutable except content-addressed
  renditions, and never ask a crawler to stay away
created_by: xgd
created_at: '2026-08-06T18:49:31.162888+00:00'
updated_at: '2026-11-09T06:20:11.447172+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-d34eccd8
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

Every successful response states a freshness policy, and it is the one the
address deserves. A published address is not revision-scoped — its meaning
changes when a new revision goes live — so its responses declare themselves
publicly cacheable for a short lifetime only, and are never declared immutable.
This holds for the entry page and for every asset served beneath it alike, the
original pictures included.

There are two exceptions, and only two. A page carrying the account chrome, whose
content depends on the visitor's session, is declared private and not storable
instead (pinned in the session cache-policy criterion), and is likewise never
immutable. A delivery rendition under the site's derived-assets path, whose name
is its content, is declared immutable (pinned in the rendition cache criterion,
REQ-222). Nothing else is.

No response asks a crawler to stay away. A published site is meant to be
indexed; the ask-not-to-index directive belonged to the draft-preview channel,
and a stray directive surviving that channel would silently deindex every
published site.

## Verification

Publish a site whose pages carry no account chrome, request its entry page and one
of its assets outside the derived-assets path, and assert both carry the short
publicly-cacheable lifetime and that neither declares itself immutable. Assert no
crawler-directive header is present on either, nor on a chrome-bearing page.
