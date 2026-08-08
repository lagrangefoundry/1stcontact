---
uid: acceptance_criterion-1e25e1b8
id: AC-878
type: acceptance_criterion
title: A fetchable endpoint is enhanced exactly as before, with no config field governing
  the choice
created_by: xgd
created_at: '2026-08-06T03:51:45.095044+00:00'
updated_at: '2026-08-08T00:43:40.707134+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-179b8c06
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
A contact form whose configured endpoint is `http(s)`, site-relative, or empty
(post to self) is enhanced exactly as it was before the enhancement gate existed:
the submit is intercepted, the form's named controls — including the honeypot —
are sent as a flat JSON body, a 2xx response swaps the configured success message
in place without navigating away, and a non-2xx response shows the server's
inline error message (falling back to a status-derived message when the body
carries none) while leaving the visitor's input on the page. An endpoint the page
cannot reach at all still reports its inline connection error.

No configuration governs which forms are enhanced: the behavioural config carries
no enhance/no-enhance field, because the endpoint's scheme already determines the
answer and a dial for something the data determines is outside what config may
express.

## Verification
Render a contact-form with an `https:` endpoint, a site-relative endpoint, and an
empty endpoint, and for each assert the submit is intercepted (no navigation), a
JSON body carrying every named control is sent to that endpoint, a 2xx swaps in
the success content, and a non-2xx surfaces the server's message inline. Assert
the published behavioural config surface exposes no field controlling
enhancement.