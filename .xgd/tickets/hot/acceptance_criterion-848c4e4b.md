---
uid: acceptance_criterion-848c4e4b
id: AC-933
type: acceptance_criterion
title: A rendered page emits no colour custom property, and exactly one colour system
  survives
created_by: xgd
created_at: '2026-08-06T20:50:32.681464+00:00'
updated_at: '2026-08-08T00:43:59.391868+00:00'
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
Nothing the renderer emits declares or references a colour custom property. A
rendered page's stylesheets — the site's theme stylesheet, the document's own L1
stylesheet, and the CSS a behavior module ships — carry **no `--color-*`
declaration and no `var(--color-…)` reference**. Colour reaches the page only as
a literal value re-derived by the sole emitter from the L1 document's own typed
colour axes.

There is consequently exactly **one** colour system, not one plus a retired one:

- the site's **theme tokens carry no colour group at all** — the closed set of
  colour roles that was once part of the token surface is gone, so the emitted
  theme stylesheet declares its typography, spacing, radius, shadow, container
  and breakpoint properties and no colour property;
- there is **no scheme-conditioned colour override**: the emitted stylesheet
  carries no `prefers-color-scheme` block re-declaring colour roles, and the
  generator exposes no hook to supply one. A later dark mode is designed against
  the colour model that survived, not resurrected from the one that did not;
- a **module colour is a hex literal and nothing else**. A colour-role *name*
  where a module expects a colour is rejected by content validation with a
  message naming the field, and a non-literal that reaches the renderer anyway is
  **dropped rather than emitted** — a gradient stop that is not a literal drops
  the whole gradient rather than painting a colour the author never chose, so the
  sink stays fail-closed;
- a **left-bar callout** takes its bar from the current text colour. Its marker
  vocabulary survives as a closed *emphasis* set, and no per-name colour rule is
  emitted for it.

## Verification
Generate the theme stylesheet from the full default token surface and assert it
matches no `--color-` and contains no `prefers-color-scheme` block, while still
declaring the non-colour groups. Render a page end to end and assert no emitted
stylesheet — theme, document, or module — contains `--color-` or
`var(--color-`. Submit a module text run whose colour is a role name and observe
a validation error naming the field; render one and observe no colour
declaration emitted; render a gradient one of whose stops is a role name and
observe no gradient emitted. Inspect the callout stylesheet and observe the bar
takes the current colour with no per-name colour rule.