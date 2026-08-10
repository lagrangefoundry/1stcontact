---
uid: acceptance_criterion-3cf8a118
id: AC-1046
type: acceptance_criterion
title: Choosing a background updates the panel's background and the re-rendered page
  shows it, leaving every other parameter and every asset byte untouched
created_by: xgd
created_at: '2026-08-10T08:23:13.812435+00:00'
updated_at: '2026-08-10T08:31:10.639704+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-37a3921b
  kind: behavior
  regression_only: false
---

## Criterion

Applying a chosen handle to a painted panel's background field updates the
background the panel carries in the draft, and the re-rendered page paints that
image behind that panel.

The edit is one structured change and nothing more:

- every other parameter the panel carries — its fill, corner radius, opacity,
  overlay and anything else — is **byte-identical** across the edit, because the
  named parameter is written into the set the panel already holds rather than
  the set being replaced;
- **no byte of the site's assets changes**: no file is written, copied, resized
  or processed. Choosing a background points the panel at a handle it already
  could have named.

The edit travels the same operations, the same whole-definition validator and
the same atomicity rule as a copy edit and an image edit. There is no background
command, no background endpoint and no second write path.

## Verification

Seed a page with a painted panel carrying a background alongside a fill, a
corner radius, an opacity and an overlay. Apply a different handle from the
panel's own options. Assert the operation succeeds and reports the one
parameter changed; that the draft now carries the new handle; that the
re-rendered page paints it behind that panel; that every other parameter on the
panel is unchanged; and that the asset store's contents are byte-for-byte
identical before and after. Assert an unrelated pre-existing violation elsewhere
in the page refuses the edit for the same reason it refuses the platform's
other structured-edit commands.