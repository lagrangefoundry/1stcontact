---
uid: acceptance_criterion-7820683f
id: AC-1341
type: acceptance_criterion
title: Every Worker's named environment repeats every top-level variable and binding,
  with bindings found structurally
created_by: xgd
created_at: '2026-08-20T05:31:46.270991+00:00'
updated_at: '2026-08-31T12:11:34.153570+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-d5167ced
  kind: behavior
  regression_only: false
---

## Criterion

For **every** Worker in the tree and **every** named deployment environment it declares, each
variable and each binding declared for the default environment is also declared for that named
environment — because a named environment inherits neither. Bindings are identified **structurally**
— any declared block carrying a binding name, identified by its kind and that name — rather than
from an enumerated list of block kinds, so a binding kind introduced later is covered without the
check being edited. An omission is reported naming the Worker, the environment, and each missing
variable or binding, and states why it matters: the deployed Worker would see none of them.

Every Worker declares a production environment, and the control application's production
environment carries the configuration it needs — the class of omission that made a first deploy
answer its own service-unavailable response to every request.

The rule carries exactly **one stated exception**, and the exception is named in the check itself
rather than left as a gap in the report. A variable whose purpose is to relax a security control
for local development is **not** required to be repeated: its absence from the named environment is
precisely what keeps the relaxation out of a deployed Worker, so demanding its repetition would
invert the rule. The exception is identified by name and one variable only; a second top-level
variable added later is still required to be repeated, and the report still names it if it is not.

## Verification

Run the check across every Worker in the tree: no omission is reported, each Worker declares a
production environment, and the control application's production environment declares the
configuration its deployed form needs. Then feed the check the exact configuration that shipped
before the fix — an origin variable and a storage binding declared only at the top level: it
reports both as missing from the production environment, identifying the binding by kind and name.
Feed it the corrected form and confirm it reports nothing missing.

Confirm the exception is exactly one variable wide: with the local-development relaxation variable
declared at the top level and absent from the named environment, the check reports nothing missing;
with any other top-level variable removed from the named environment, the check still reports that
one by name.
