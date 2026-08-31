---
uid: acceptance_criterion-44b0be07
id: AC-1401
type: acceptance_criterion
title: The operator's builder command is a transport over the one route table, defaulting
  to the local simulated store
created_by: xgd
created_at: '2026-08-31T10:12:54.410560+00:00'
updated_at: '2026-08-31T10:30:56.787614+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-e674c60a
  kind: behavior
  regression_only: false
---

## Criterion

The operator's builder command is a **transport**, not a second origin. It starts
the real runtime — the same route table, the same edit operations, the same
render, over the same store port — and reports where it is listening. It does not
stand up a route table of its own, and there is no route it answers that the
deployed workspace answers differently.

By default it runs against a **locally simulated** store, and reaching the
deployed store is an explicit flag: a development loop that writes to production
by default is one keystroke away from losing a site, so the safe target is the
one you get for free. The command says which of the two it is using.

The same property holds for the second front door the workspace keeps for driving
itself over ordinary HTTP: it converts a local request into the request the route
table takes, hands it over, and returns the response unchanged. One route table,
one set of edit operations, one render, two front doors — and no route
intercepted on the way past by either of them, because an intercepted route is
the one place two front doors can disagree about what a route *is*.

## Verification

Drive a representative set of routes through the local front door and through the
deployed runtime, and assert the same request produces the same status,
content type and shape of answer from both — including at least one route that
reads the store, one that writes, and one that renders.

Assert the local front door defines no route of its own beyond the capabilities
the deployed runtime genuinely does not have, and that it intercepts none that
the route table already answers.

Start the operator's command with no target flag and assert it reports the local
simulated store; start it with the flag that reaches the deployed store and assert
it reports that instead, distinguishably. Assert the default is the local one.