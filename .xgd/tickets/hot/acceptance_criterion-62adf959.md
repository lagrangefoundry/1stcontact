---
uid: acceptance_criterion-62adf959
id: AC-685
type: acceptance_criterion
title: Injection payloads in content values are inert in the rendered output
created_by: xgd
created_at: '2026-07-22T19:32:11.016150+00:00'
updated_at: '2026-07-22T19:32:11.016150+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-d0a8cfad
  kind: behavior
  regression_only: false
---

## Criterion
No value carried by an L1 leaf can produce executable code or break out of its
sink in the rendered page. Specifically, in the emitted HTML/CSS: text
containing markup (e.g. `<script>…</script>`) appears only as escaped text and
never as a live element; an attribute-breakout payload in alt/text (e.g.
`"><img onerror=…>`) is escaped and cannot close its attribute; an image source
with a disallowed scheme (`javascript:`, `data:`, `vbscript:`, `file:`) renders
as no source rather than a live URL; and a font-family value carrying CSS syntax
(`;`, `{}`, `@import`, comments) is reduced to inert font-name tokens that cannot
break out of the declaration. This holds even for a value that bypassed
validation — the emitter is the last line of defence.

## Verification
Render a document whose text, image src, alt, and font-family fields each carry
an injection payload, and assert the emitted page contains no live `<script>`,
no un-escaped attribute breakout, no `javascript:`/other off-allowlist URL, and
no font-family-borne CSS declaration (`@import`, `body{…}`) — only escaped,
sanitised, inert values.
