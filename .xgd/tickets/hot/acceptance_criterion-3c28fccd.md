---
uid: acceptance_criterion-3c28fccd
id: AC-1048
type: acceptance_criterion
title: A background handle the site does not offer is refused at the field, whole-or-nothing,
  before the shared validator runs
created_by: xgd
created_at: '2026-08-10T08:23:23.774000+00:00'
updated_at: '2026-08-16T06:55:49.172097+00:00'
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

A change map naming a background handle that was not among the options the
region itself offered is **refused at the field**, before the whole-definition
validator runs, and nothing at all is written: the draft and the already
rendered page are byte-for-byte unchanged. The refusal names the field it
occurred at and what was refused.

Refusing here rather than leaving it to the shared validator is necessary
because a well-formed handle to an asset the site simply does not have is
*safe*: the validator would accept it and the page would paint nothing, with no
error anywhere. A caller holding a stale listing of the site's images is the
realistic source. The check is a property of the surface, server-side, not of
the widget that displayed the options.

The empty string is refused on the same rule — it is not among the options,
because the picker offers no empty choice.

## Verification

Address a painted panel carrying a background. Apply, in turn: a handle naming
an image the site does not hold; an asset that is not an image; the empty
string; and a handle carrying an executable scheme. Assert each is refused with
a field-scoped fault naming the background field, that no partial write
occurred, and that the draft and the rendered page are unchanged. Assert the
refusal is reported identically from the command line and through the builder
origin.