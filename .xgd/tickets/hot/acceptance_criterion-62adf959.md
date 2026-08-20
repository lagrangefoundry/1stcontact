---
uid: acceptance_criterion-62adf959
id: AC-685
type: acceptance_criterion
title: Injection payloads in content values are inert in the rendered output
created_by: xgd
created_at: '2026-07-22T19:32:11.016150+00:00'
updated_at: '2026-08-20T08:41:42.840817+00:00'
completed_at: null
last_field_updated: body
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
break out of the declaration.

For **these value families — text, colour, font-family, length, and image
source** — the guarantee holds even for a value that bypassed validation: the
emitter is the last line of defence for them, which is the Layer-2 guarantee
DOC-2 §2 enumerates. **Closed-enum axes are a Layer-1 guarantee, not a Layer-2
one**: the schema admits only the enumerated members, so an enum breakout is
*rejected* by `validateL1` (which is in the production path for every rendered,
published, edited and imported site) rather than neutralised again at emit time.
This criterion therefore makes no bypass claim about enum-valued axes.

The same guarantee extends to every **structured** axis family and to the
document-level resource table, none of which is ever emitted as a passthrough
CSS string: a payload placed in a gradient stop colour, a border colour, a
box background-image URL, a shadow, a mask or transform field, or a font-face
family or source produces **no** `</style>`, `@import`, `javascript:`, or
`expression(` anywhere in the emitted document. A structured axis reaches CSS
only as CSS re-derived from its numeric and hex fields — its enum-valued fields
being closed by the schema at Layer 1 — so a non-hex colour is dropped rather
than emitted, an off-allowlist background-image or font source is omitted rather
than linked, and a font-face family is reduced to inert font-name characters
before it is quoted into the rule.

## Verification
Render a document whose text, image src, alt, and font-family fields each carry
an injection payload, and assert the emitted page contains no live `<script>`,
no un-escaped attribute breakout, no `javascript:`/other off-allowlist URL, and
no font-family-borne CSS declaration (`@import`, `body{…}`) — only escaped,
sanitised, inert values. Repeat with payloads placed in a gradient stop, a
border colour, a background-image URL, a mask/transform field, and a font-face
family and source, and assert the emitted document contains no `</style>`,
`@import`, `javascript:`, or `expression(` — and that the unsafe URL and non-hex
colour are absent from the output entirely rather than emitted. No enum payload
is exercised at the emitter: the closed-enum guarantee is Layer 1's, and is
verified by the envelope-rejection criteria (AC-686) instead.
