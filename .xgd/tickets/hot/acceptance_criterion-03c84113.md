---
uid: acceptance_criterion-03c84113
id: AC-727
type: acceptance_criterion
title: A document font resource table binds a family handle to its served face
created_by: xgd
created_at: '2026-07-29T03:50:22.270897+00:00'
updated_at: '2026-08-09T05:40:38.934957+00:00'
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
An L1 document may declare a **document-level resource table** that binds a font
*handle* — the family name a text leaf carries as its font-family axis — to its
pixel-determining *substance*, a served font asset, with an optional weight and
style. When it does, the published page carries one `@font-face` rule per entry,
emitted through the same single safe sink as every other value: the family is
reduced to inert font-name characters and quoted, the source clears the URL
scheme allowlist and is escaped so a stray quote cannot break out of `url("…")`,
the `format()` hint is derived from the asset's own extension (woff2 / woff /
truetype / opentype, omitted when unrecognised), a declared weight and style are
emitted as rounded numeric / enum values, and `font-display: swap` keeps text
visible while the face loads. The rules are emitted **before** the rules that
reference the family, so no rule resolves against a fallback first.

The observable consequence: a text leaf naming a bound family paints in that
face at that face's own glyph metrics, rather than falling back to a generic
serif. An entry whose family sanitises to nothing, or whose source is off the
allowlist, produces **no** rule at all rather than a broken or unsafe one — a
document without a resource table emits no `@font-face` rules.

## Verification
Render a document declaring a resource table and observe one well-formed
`@font-face` rule per entry — quoted sanitised family, allowlisted escaped URL,
derived format hint, weight/style where declared, and `font-display: swap` —
positioned ahead of the rules that use the family. Render an entry with an
off-allowlist source and observe no rule is emitted for it. End-to-end in a real
browser: serve the rendered page together with the font asset and assert the
bound face reports as loaded and that the text paints at a measurably different
glyph run width than the same document rendered without the table (the fallback).
Skips cleanly where no engine or font asset is available.