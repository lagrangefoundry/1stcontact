---
uid: acceptance_criterion-99e50800
id: AC-552
type: acceptance_criterion
title: Security dimension fails an injection-live or off-allowlist render using schema-derived
  payloads
created_by: xgd
created_at: '2026-07-10T00:15:31.492646+00:00'
updated_at: '2026-07-10T00:15:31.492646+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-a6962b23
  kind: behavior
  regression_only: false
---

## Criterion
When invoked in the security dimension, the check fills each of the module's schema-declared content fields with hostile values (inline-handler / script HTML, unsafe-scheme URLs, markdown-embedded HTML) and throws a conformance failure if the rendered module: emits an unsafe URL scheme on a link/resource attribute (anything outside http/https/mailto/tel, and data: except image assets); carries an inline event handler or executes an injected payload; produces a value that breaks out of an inline style context; or issues a network request to an origin outside the same-origin-assets + declared-allowlist set. Each violation identifies its security category. Payloads are derived generically from the schema, not hand-listed per module.

## Verification
Mount deliberately-unsafe fixtures (unsafe-scheme URL, live inline handler, CSS-context breakout, off-allowlist fetch) and assert each is flagged with its matching security category identifier; confirm the payloads are populated from the module's declared content fields.
