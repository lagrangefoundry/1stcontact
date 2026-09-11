---
uid: acceptance_criterion-59fbb23d
id: AC-1654
type: acceptance_criterion
title: The client's own knowledge base is declared, and its corpus is exactly the
  four kinds of client material
created_by: martin-github@westhead.me
created_at: '2026-09-11T03:30:20.680161+00:00'
updated_at: '2026-09-11T03:43:40.801250+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-5281f009
  kind: behavior
  regression_only: false
---

## Criterion

The product declares a knowledge base for the client's own knowledge alongside
the shipped one, and its corpus is exactly the four kinds of record a site is
made from: the conversations held with the client, the material they uploaded,
the reference sites captured on their behalf, and the brief recording what was
decided.

The set is exact in both directions. A fifth kind admitted here would put records
the client never offered as knowledge in front of the assistant; a missing fourth
would make a whole class of what they gave us unfindable, with nothing to notice —
the search simply returns less.

## Verification

Read the declaration the product ships and assert the client knowledge base is
present and that its corpus names precisely those four record kinds — no more, no
fewer. Then open the knowledge base as a host does and assert the corpus it
reports is the same set (see the criterion on the declaration being the thing
actually selected).