---
uid: acceptance_criterion-139cc347
id: AC-506
type: acceptance_criterion
title: A structured gradient text treatment clips a multi-stop, any-direction gradient
  to a wordmark or heading
created_by: xgd
created_at: '2026-07-09T21:57:55.438959+00:00'
updated_at: '2026-07-09T21:57:55.438959+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-a224111f
  kind: behavior
  regression_only: false
---

## Criterion
When the header wordmark (`logoTreatment: gradient`) or hero heading (`headingTreatment: gradient`) selects the gradient treatment, the framework computes a `linear-gradient` clipped to the text glyphs (`background-clip: text`, transparent fill) from a structured, palette-role-backed treatment field: a `direction` drawn from the eight principal directions (`to-top`, `to-bottom`, `to-left`, `to-right`, `to-tr`, `to-tl`, `to-br`, `to-bl`) and two or more `stops`, each a palette-role name resolving to `var(--color-<role>)` with an optional 0–100 position (evenly distributed when omitted). No raw colour or raw CSS is ever expressed on the instance. A treatment with fewer than two stops (or absent) yields no gradient, so the text falls back to its inherited colour. The prior fixed metallic-`gold` treatment is preserved as its own dial value alongside the generalized `gradient`.

## Verification
Render a wordmark and a heading with a multi-stop, non-vertical gradient treatment and assert the emitted inline style is a clipped `linear-gradient` in the requested direction whose stops resolve to the palette-role custom properties at the expected positions. Assert an under-specified treatment (fewer than two stops) produces no gradient, and that `gold` still produces its fixed metallic-gold fill.
