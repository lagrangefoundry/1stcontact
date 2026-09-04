---
uid: acceptance_criterion-7178e04b
id: AC-1505
type: acceptance_criterion
title: Membership is taken from the knowledge base's own declaration, whatever it
  currently requires
created_by: xgd
created_at: '2026-09-04T02:26:52.327629+00:00'
updated_at: '2026-09-04T02:41:25.463090+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-0d7d3aad
  kind: behavior
  regression_only: false
---

## Criterion

What a generated reference must say about itself to belong to the knowledge base is taken from the knowledge base's own declaration, whatever that declaration currently requires — including requiring nothing. Changing how the knowledge base decides membership changes what the next build's generated references assert, with no change to how they are produced.

A generated document that asserted a fixed, remembered membership rule would fall out of the knowledge base — written, indexed, and never searched — on the day the rule moved, with no error. That day has already come once.

## Verification

Declare a knowledge base whose membership rule differs from the current one (a different document type and a different required marker). Produce the references against that declaration and assert their metadata satisfies the declared rule and carries none of the previous rule's markers. Repeat against a declaration that restricts nothing and assert the references are still produced and still members.