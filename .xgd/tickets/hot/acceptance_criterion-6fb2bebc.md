---
uid: acceptance_criterion-6fb2bebc
id: AC-966
type: acceptance_criterion
title: View mode displays the operator's real rendered site, byte-identical to the
  rendered artifact
created_by: xgd
created_at: '2026-08-07T01:44:18.770079+00:00'
updated_at: '2026-08-07T01:58:18.901112+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-e674c60a
  kind: behavior
  regression_only: false
---

## Criterion

With a site selected, the display panel shows that site's actual rendered
output. The bytes served for the displayed page are identical to the rendered
artifact the platform produced for that site and channel — not a placeholder, a
re-generation, or a differently-serialised copy.

## Verification

Render a site, open the workspace, and fetch the URL the pane is displaying.
Assert the response body is byte-identical to the rendered file on disk for that
site and channel, and that assets the page references (stylesheet, images)
likewise resolve over the same origin.