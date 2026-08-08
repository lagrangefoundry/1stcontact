---
uid: acceptance_criterion-ff8376c1
id: AC-929
type: acceptance_criterion
title: A palette reference that does not resolve fails validation, and resolution
  never substitutes a default
created_by: xgd
created_at: '2026-08-06T20:37:41.772779+00:00'
updated_at: '2026-08-08T00:43:55.513804+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-c490f1cf
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

A colour reference naming an entry the palette does not declare — or naming a step
the entry does not declare, or made in a site that declares no palette at all — is a
**validation failure**. The site definition is rejected with an error identifying the
offending reference and the names actually available, before anything is rendered.

There is no render-time fallback and no silent default: a consumer that skips
validation and resolves a dangling reference anyway gets a loud failure rather than a
substituted colour. Painting the wrong colour is treated as worse than failing.

References are checked wherever they are reachable in a page, including inside the
content a behavior module holds in its slots.

## Verification

Validate a site whose page references (a) an entry name the palette does not declare,
(b) a step name the entry does not declare, and (c) any entry when the site declares
no palette; confirm each is a validation failure naming the offending reference.
Then resolve a dangling reference directly, bypassing validation, and confirm it
fails loudly rather than returning a colour.