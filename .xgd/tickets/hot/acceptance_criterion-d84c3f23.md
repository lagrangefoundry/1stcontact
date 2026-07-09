---
uid: acceptance_criterion-d84c3f23
id: AC-495
type: acceptance_criterion
title: List-of-object content round-trips through validation
created_by: xgd
created_at: '2026-07-09T21:01:34.102748+00:00'
updated_at: '2026-07-09T21:01:34.102748+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-6fc151b1
  kind: behavior
  regression_only: false
---

## Criterion
A module content value may be a structured object — a record whose values are themselves content values — so a module whose content is a list of typed records round-trips through the validator intact. A site whose modules author list-of-object content (services-grid `items` such as `{title, body, icon, cta}`, contact-form `fields` such as `{name, label, type, required, maxLength}`, and footer `links` such as `{label, target}`) validates successfully, and the returned value reproduces the nested records with their fields intact. This is shape validation only: the schema does not check per-module field names.

## Verification
Submit a structurally valid site whose module instances carry list-of-object content (a services-grid with `items`, a contact-form with `fields`, a footer with `links`). Assert the result reports success and that the returned value's nested records preserve their field values (e.g. an item's `title`, a field's `name`).
