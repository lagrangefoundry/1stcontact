---
uid: acceptance_criterion-f4542e2e
id: AC-565
type: acceptance_criterion
title: contact-form submitForeground dial paints the submit label a palette-role foreground
created_by: xgd
created_at: '2026-07-10T01:12:16.149897+00:00'
updated_at: '2026-07-10T01:12:16.149897+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-903e3e3a
  kind: behavior
  regression_only: false
---

## Criterion
contact-form accepts a `submitForeground` dial. `auto` (default) leaves the submit label the colour its `submitTreatment` derives from the button surface; any palette role (including `bg`) instead paints the label a framework-computed `var(--color-<role>)`, so the button can carry a legible on-primary label (e.g. `bg` for a white "Send message") rather than inheriting a surface tint. The role set is closed — no instance-supplied raw colour reaches the page.

## Verification
Render a contact-form with `submitForeground: bg` and observe the submit button's label colour resolves to `var(--color-bg)`; render with the dial omitted (`auto`) and observe no label-colour override is applied.
