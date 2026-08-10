---
uid: acceptance_criterion-4d519076
id: AC-1035
type: acceptance_criterion
title: The published way of looking at a site comes from the publish-time rendering
  and never from today's draft
created_by: xgd
created_at: '2026-08-10T07:29:22.721864+00:00'
updated_at: '2026-08-10T07:29:22.721864+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-e674c60a
  kind: behavior
  regression_only: false
---

## Criterion

The published channel is the immutable rendering that publishing produced from a
locked revision. It is served exactly as it was produced — the same bytes the
public site will serve — and it is not derived from the current draft. Moving the
draft moves both draft-side channels and leaves the published one where it was.

Deriving all three channels from the draft is the obvious way to have one path
serve everything, and it would put unpublished work on the published address.

## Verification

Publish a site, then request its published channel over the origin and assert the
response equals the artifact publishing produced. Change the site's draft
definition so a distinctive value appears in it, then request all three channels:
assert both draft-side channels contain the value and the published channel does
not.