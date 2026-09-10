---
uid: acceptance_criterion-9287f523
id: AC-1455
type: acceptance_criterion
title: The log-retention declaration is not a binding, so the environment-repetition
  check's binding set is unchanged
created_by: xgd
created_at: '2026-08-31T17:18:04.547059+00:00'
updated_at: '2026-09-10T05:01:42.459895+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-d5167ced
  kind: behavior
  regression_only: false
---

## Criterion

The log-retention declaration is not a binding, and the check that requires every named
environment to repeat the top level's bindings does not count it as one — neither at the top level
nor under the named production environment.

A binding is identified **structurally**, as any declared block that names a binding, precisely so
that a binding kind introduced later is covered without the check being edited. The cost of that
generality is that any *non*-binding block added to the configuration must stay invisible to it.
Were retention to be miscounted, the criteria that assert the binding set under the production
environment would begin failing on a declaration that binds nothing — a false report about the
configuration whose correctness they exist to guard.

## Verification

Parse the operator surface's deployment configuration and read the binding set for the top level
and for the named production environment. Neither set contains any entry derived from the
retention declaration, and neither of retention's own keys appears among either level's variables.
The named production environment's binding set is **identical to the top level's**, and both are
non-empty — so the assertion is not vacuously satisfied by a reader that returns nothing.

The identity is asserted as a set relation between the two levels, never as equality against an
enumerated snapshot of today's bindings. Naming the bindings that happen to be declared now would
make this criterion fail the next time an unrelated intent adds one — the very failure mode it
exists to warn about, arriving from the opposite direction — and the story this criterion serves
requires only that non-binding declarations not join the sets the repetition check enumerates, not
that those sets hold any particular members. Which bindings must be present, and that each is
repeated under the named environment, belong to AC-1341; restating them here would make this
criterion fail for that criterion's reason rather than for its own.

A negative control confirms the reader is not simply blind to unfamiliar tables: a block that
*does* name a binding is counted from the top level and reported missing when the named
environment omits it, which is what makes retention's invisibility a property of the declaration
rather than of the parser.
