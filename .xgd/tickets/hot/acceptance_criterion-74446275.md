---
uid: acceptance_criterion-74446275
id: AC-1119
type: acceptance_criterion
title: The weights a run offers are the faces the site declares for the first family
  of its stack, in union with the weight the run already carries
created_by: xgd
created_at: '2026-08-12T18:08:13.664290+00:00'
updated_at: '2026-08-16T06:55:55.230923+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-37a3921b
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

The weights a run offers are the faces the site declares **for that run's
family** — the served glyphs the page ships — in union with the weight the run is
already set in. Nothing else is offered: a weight the site serves no face for is
not refused by the browser but *synthesised*, smeared by the rasteriser and
differently in every engine, so it is a safe-looking value the page cannot
honour.

Two properties of that list carry the criterion, and neither is a nicety:

- **The family is matched on the first family of the run's stack, not on the
  stack whole.** A run asks for a fallback chain — "Satoshi, Helvetica Neue,
  Arial, sans-serif" — while a declared face names one bare family, "Satoshi".
  Comparing the two whole is not a near miss but a guaranteed one: it would find
  no faces anywhere and withdraw the weight control from every run on the site,
  silently and with nothing to notice.
- **The run's own weight is always among its options**, declared or not. A
  chooser whose options omit its own value presents the first option as selected,
  so someone who opened the form to fix the words and saved would silently
  re-weight the heading. A run set in a weight its own site never served is the
  common case rather than a corner — it is how real pages are captured.

A weight the region did not offer is refused at the field, in a message naming
the value asked for, with the draft unchanged. A weight it did offer is applied,
and the stored run carries it.

## Verification

Seed a page declaring several faces for one family, with runs asking for that
family as a multi-name stack. Assert a run set in a declared weight offers
exactly the declared weights, in a stable order. Assert a run set in a weight the
page declares no face for offers those weights plus its own, and reports its own
as the current value. Submit a weight in neither set and assert it is refused
naming the value, with the draft unchanged; submit one that is offered and assert
the stored definition carries it.