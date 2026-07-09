---
uid: acceptance_criterion-3361bd78
id: AC-512
type: acceptance_criterion
title: contact-form submit button carries a treatment dial and inherits the site font
created_by: xgd
created_at: '2026-07-09T22:11:18.262423+00:00'
updated_at: '2026-07-09T22:11:18.262423+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-903e3e3a
  kind: behavior
  regression_only: false
---

## Criterion
contact-form exposes a `submitTreatment` dial (`primary` default, `neutral`) that sets the submit button's colour: `primary` renders a brand-primary button, `neutral` a dark button using the text/surface pair. The submit button inherits the site font family and size (`font: inherit`) rather than the user-agent button font, so its label matches the rest of the site.

## Verification
Render a contact-form with `submitTreatment: neutral` and assert the submit button carries the neutral colour treatment; render with the default and assert the primary treatment. Assert the submit button declares `font: inherit`.
