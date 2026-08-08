---
uid: acceptance_criterion-16b17ff4
id: AC-844
type: acceptance_criterion
title: A link paints from the substrate rather than from user-agent link chrome, and
  an authored colour or underline still wins
created_by: xgd
created_at: '2026-08-06T02:48:12.043662+00:00'
updated_at: '2026-08-08T00:43:31.492071+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-2e4e2c45
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
A linked node presents with no default underline and with the surrounding text
colour rather than the browser's own link colouring, so a designed call to action
does not acquire browser chrome by becoming navigable. The substrate's neutralising
of that chrome is a baseline, not an override: a node that authors its own text
colour or its own underline presents the authored value.

## Verification
Publish a page with a linked run that authors no colour and no underline; assert
the published stylesheet suppresses the default underline and inherits the text
colour for that node. Publish a second page whose linked run authors a specific
colour and an underline; assert the published stylesheet resolves to the authored
colour and the authored underline for that node.