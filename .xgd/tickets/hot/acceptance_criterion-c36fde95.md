---
uid: acceptance_criterion-c36fde95
id: AC-510
type: acceptance_criterion
title: services-grid ✓ checklist mark is a real leading text run keyed to the card
  status colour
created_by: xgd
created_at: '2026-07-09T22:11:10.148771+00:00'
updated_at: '2026-07-09T22:11:10.148771+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-903e3e3a
  kind: behavior
  regression_only: false
---

## Criterion
Each services-grid checklist item renders its ✓ mark as a real leading text run (an element containing the ✓ glyph), present in the rendered DOM and accessibility tree and in rendered-text extraction — not a `::before` pseudo-element. The mark's colour follows the card's badge/status variant (e.g. a card badged `accent` gets accent-coloured ticks, `secondary` gets secondary, `neutral`/no badge gets muted), and it renders at regular weight so the emphasis is carried by colour, not a bold glyph.

## Verification
Render a services-grid card with a checklist and a badge variant; assert the ✓ glyph is present as an element/text node in the DOM (not only as a CSS pseudo-element) and that its colour resolves to the card's status role. Render checklist items on cards with different badge variants and assert the tick colour changes with the variant.
