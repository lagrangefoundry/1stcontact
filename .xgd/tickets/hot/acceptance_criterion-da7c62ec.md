---
uid: acceptance_criterion-da7c62ec
id: AC-719
type: acceptance_criterion
title: card/band and footer visual treatments are expressed via L1 leaf axes, not
  module dials
created_by: xgd
created_at: '2026-07-22T20:44:01.723899+00:00'
updated_at: '2026-07-23T08:26:15.924262+00:00'
completed_at: null
last_field_updated: uat_coverage
status: pending
fields:
  story_uid: story-46e3b3c7
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
The card/band veil and border treatments (formerly services-grid `cardVeil`/`cardBorder`) and the footer copyright/`textColor`/`linkColor` overrides are no longer module dials — their host modules (services-grid, footer) have been removed. Those visual treatments are authored directly as L1 leaf axes: each L1 box/text node carries its own validated colour / border / opacity value as a literal (or a named overlay role), so a translucent "frosted" card band, a hairline-less card, a verbatim footer copyright line, and footer text/link colours that depart from the surface default are all expressed in the L1 tree. The values are constrained by the L1 envelope (hex-only colours, finite numeric ranges, no freeform CSS/HTML/JS).

## Verification
Confirm no `services-grid`/`footer` module (or `cardVeil`/`cardBorder`/footer colour dial) exists in the module catalog. Author an L1 tree reproducing a frosted card band (translucent fill + no hairline) and a footer with a custom copyright line and non-default text/link colours; render and confirm the visual treatments appear, and that out-of-envelope values (non-hex colour, freeform CSS) are rejected by the L1 validator.