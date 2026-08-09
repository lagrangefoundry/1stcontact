---
uid: acceptance_criterion-62adf959
id: AC-685
type: acceptance_criterion
title: Injection payloads in content values are inert in the rendered output
created_by: xgd
created_at: '2026-07-22T19:32:11.016150+00:00'
updated_at: '2026-08-09T05:40:20.637982+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-d0a8cfad
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
No value carried by an L1 document can produce executable code or break out of
its sink in the rendered page. Specifically, in the emitted HTML/CSS: text
containing markup (e.g. `<script>…</script>`) appears only as escaped text and
never as a live element; an attribute-breakout payload in alt/text (e.g.
`"><img onerror=…>`) is escaped and cannot close its attribute; an image source
with a disallowed scheme (`javascript:`, `data:`, `vbscript:`, `file:`) renders
as no source rather than a live URL; and a font-family value carrying CSS syntax
(`;`, `{}`, `@import`, comments) is reduced to inert font-name tokens that cannot
break out of the declaration. This holds even for a value that bypassed
validation — the emitter is the last line of defence.

The same guarantee extends to every **structured** axis family and to the
document-level resource table, none of which is ever emitted as a passthrough
CSS string: a payload placed in a gradient stop colour, a border colour, a
box background-image URL, a shadow, a mask or transform field, or a font-face
family or source produces **no** `</style>`, `@import`, `javascript:`, or
`expression(` anywhere in the emitted document. A structured axis reaches CSS
only as CSS re-derived from its numeric, closed-enum, and hex fields — a
non-hex colour is dropped rather than emitted, an off-allowlist background-image
or font source is omitted rather than linked, and a font-face family is reduced
to inert font-name characters before it is quoted into the rule.

## Verification
Render a document whose text, image src, alt, and font-family fields each carry
an injection payload, and assert the emitted page contains no live `<script>`,
no un-escaped attribute breakout, no `javascript:`/other off-allowlist URL, and
no font-family-borne CSS declaration (`@import`, `body{…}`) — only escaped,
sanitised, inert values. Repeat with payloads placed in a gradient stop, a
border colour, a background-image URL, a mask/transform field, and a font-face
family and source, and assert the emitted document contains no `</style>`,
`@import`, `javascript:`, or `expression(` — and that the unsafe URL and non-hex
colour are absent from the output entirely rather than emitted.