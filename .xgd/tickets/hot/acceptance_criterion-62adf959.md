---
uid: acceptance_criterion-62adf959
id: AC-685
type: acceptance_criterion
title: Injection payloads in content values are inert in the rendered output
created_by: xgd
created_at: '2026-07-22T19:32:11.016150+00:00'
updated_at: '2026-09-10T12:39:04.471122+00:00'
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
break out of the declaration. **For these value families — text, colour,
font-family, length and image source — the guarantee holds even for a value that
bypassed validation: they are re-checked and neutralised at emit time, and the
emitter is the last line of defence** (DOC-2 §2). A **closed-enum** axis is
bounded by the schema instead: it is admitted only as one of its declared
members, so the envelope validator — not the emitter — is what stands between a
free-typed enum value and the stylesheet.

The same guarantee extends to every **structured** axis family and to the
document-level resource table, none of which is ever emitted as a passthrough
CSS string: a payload placed in a gradient stop colour, a border colour, a
box background-image URL, a shadow, a mask or transform field, or a font-face
family or source produces **no** `</style>`, `@import`, `javascript:`, or
`expression(` anywhere in the emitted document. A structured axis reaches CSS
only as CSS re-derived from its own typed fields — its numeric and hex fields are
re-checked as they are emitted (a non-hex colour is dropped rather than emitted,
an off-allowlist background-image or font source is omitted rather than linked,
and a font-face family is reduced to inert font-name characters before it is
quoted into the rule), and its closed-enum fields are constrained to their
declared members by the envelope before the emitter ever reads them.

## Verification
Render a document whose text, image src, alt, and font-family fields each carry
an injection payload, and assert the emitted page contains no live `<script>`,
no un-escaped attribute breakout, no `javascript:`/other off-allowlist URL, and
no font-family-borne CSS declaration (`@import`, `body{…}`) — only escaped,
sanitised, inert values; drive the emitter directly, bypassing validation, so the
assertion lands on the emitter's own neutralisation rather than on the envelope's
rejection. Repeat with payloads placed in a gradient stop, a
border colour, a background-image URL, a mask/transform field, and a font-face
family and source, and assert the emitted document contains no `</style>`,
`@import`, `javascript:`, or `expression(` — and that the unsafe URL and non-hex
colour are absent from the output entirely rather than emitted. Enum payloads are
not part of this criterion's verification: an out-of-vocabulary enum is a
validator rejection, pinned by the envelope-rejection criteria (AC-686 and the
structured-axis rejection criterion), not an emit-time neutralisation.
