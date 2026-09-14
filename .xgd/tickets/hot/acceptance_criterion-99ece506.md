---
uid: acceptance_criterion-99ece506
id: AC-1765
type: acceptance_criterion
title: A bundle captured in the cloud and one captured locally for the same URL are
  equivalent member-for-member and schema-for-schema
created_by: martin-github@westhead.me
created_at: '2026-09-14T04:48:33.396025+00:00'
updated_at: '2026-09-14T05:00:56.480327+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-0cb7f25b
  kind: behavior
  regression_only: false
---

## Criterion
The same capture of the same URL, written once to a cloud-backed store and once
to a locally-backed one, produces equivalent bundles:

- the same bundle name
- the same member set, including the per-width ladder members
- equal derived artifacts: the folded document, the form model, the structural
  hints and the multi-viewport ladder compare equal outright, because each is a
  pure function of the recorded observation
- equal capture records **except** `capturedAt`, which is asserted as present and
  well-formed rather than equal

Screenshots are **not** compared byte-wise. What a bundle promises is a PNG at
each ladder width and a full-page PNG — the encoders differ between the two
browsers, as do font-load and layout settle timing and what the live site served
at each moment. Geometry equivalence is carried by the recorded ladder, within
the existing gate's tolerance, not by pixels.

## Verification
Drive one capture against each backing with the same fake browser, then compare:
member lists equal; each derived artifact equal; capture records equal with
`capturedAt` excluded and separately asserted present. Assert a screenshot member
begins with the PNG signature rather than asserting byte equality.