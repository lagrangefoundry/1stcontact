---
uid: acceptance_criterion-742bed6d
id: AC-701
type: acceptance_criterion
title: Contact-form renders a functional form from config with L1-authored intro/submit
  presentation
created_by: xgd
created_at: '2026-07-22T19:54:45.992184+00:00'
updated_at: '2026-07-22T20:04:00.439527+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-179b8c06
  kind: behavior
  regression_only: false
---

## Criterion
A contact-form instance renders a fully functional, accessible form from its
config: one labelled control per configured field (with the field's name, type
of text / email / tel / textarea, and required flag), a real
`<form method="post">` whose action is the configured (safe) endpoint so the form
submits with no JavaScript, plus the anti-spam surface — a visually-hidden,
off-tab-order honeypot field and a Turnstile mount point. The decorative framing
is authored as L1: an optional `intro` slot renders above the fields and an
optional `submit` slot supplies the submit button's look; absent slots leave a
plain functional intro/button. Field labels remain part of the functional core
(an accessibility obligation), not a presentation slot.

## Verification
Render a contact-form with a multi-field config and assert: a labelled control
per field with the correct input type and required attribute; a post-method form
pointing at the endpoint that works without JS; a hidden honeypot field and a
Turnstile mount present. Render with and without `intro`/`submit` L1 slots and
assert the L1 content appears when supplied and a plain baseline appears when not.