---
uid: acceptance_criterion-145e768e
id: AC-1047
type: acceptance_criterion
title: A painted panel's current background handle is always among its options, even
  when the site's asset store holds no file for it
created_by: xgd
created_at: '2026-08-10T08:23:18.608971+00:00'
updated_at: '2026-08-16T06:55:47.956671+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-37a3921b
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

The handle a panel paints **now** is always one of the options its background
picker offers, even when the site's asset store holds no file matching it —
for example a remote address a reproduction could not mirror locally.

This is the same correctness rule the image picker answers to, for the same
reason: a chooser whose options omit its own value presents the *first* option
as selected, so an operator who opened the form and saved would have silently
swapped the panel's backdrop for an unrelated image without ever choosing one.
The options are free of duplicates and in a stable order whether or not the
current handle was already among the site's.

## Verification

Seed a painted panel whose background handle names something absent from the
site's asset store, alongside several images that are present. Request the
panel's fields and assert the current handle appears among the options exactly
once, alongside the site's own handles, in a stable order. Assert the same holds
for a panel whose handle *is* in the store — it appears once, not twice.