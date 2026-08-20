---
uid: acceptance_criterion-286a20f5
id: AC-1243
type: acceptance_criterion
title: A site with no colours opens on an invitation to add the first one, not on
  an error or a blank surface
created_by: xgd
created_at: '2026-08-20T01:58:52.618739+00:00'
updated_at: '2026-08-20T02:21:00.523740+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-4300366a
  kind: behavior
  regression_only: false
---

## Criterion

Opened on a site whose palette holds nothing, the surface presents an empty palette as a legitimate
starting state: it names the site, says it has no colours yet, invites a first one, and offers the
add control — the same add control a populated palette offers. No error, no failure message, and no
blank surface.

## Verification

Create a site with no palette at all and open the surface on it. Observe no swatches, a message
stating the site has no colours yet and inviting one to be added, and the name and colour inputs of
the add control present and usable. Observe no error region shown. Adding a first colour from that
state produces a swatch, which is what makes the invitation an offer rather than advice.