---
uid: acceptance_criterion-8d11ea8d
id: AC-722
type: acceptance_criterion
title: 'The behavior contract is published under the Behavior* names with an atomic
  kind: ''behavior'' discriminant'
created_by: xgd
created_at: '2026-07-24T22:42:02.804554+00:00'
updated_at: '2026-08-31T11:05:03.847416+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-179b8c06
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
The behavior-module contract is published under the `Behavior*` names, every
module in the catalog declares the discriminant `kind: 'behavior'`, and **a
behavior's component is a plain typed function from props to markup**.

- Importing from the framework package root resolves the behavior contract type,
  its **component type** (a function taking the behavior's props and returning
  the markup string) and its **props type**, its config-field spec and
  config-field-type, its slot spec and slot value, its instance shape, its
  catalog-entry (definition) type, its conformance declaration, the
  conformance-obligation union, the validation-error shape, and the compile-time
  meta assertion — together with the three validators
  `validateBehaviorConfig`, `validateBehaviorSlots`, and `validateBehaviorInstance`.
- Resolving **any** catalogued behavior by its id and version yields a component
  that is an ordinary function: calling it with a props value returns the markup
  it contributes, with no container to construct, no build transform to run, and
  nothing to await. There is no component-factory type from a build framework in
  the published contract.
- **The lookup itself is the only mechanism, and it is not per-module.** Both
  survivors — the one three real sites mount and the one no site mounts — resolve
  through the same catalog lookup to the same kind of artifact, so nothing is
  special-cased for the module that happens to be in use. A catalog entry with no
  component bound to it fails at catalog construction, naming the behavior, rather
  than surfacing later as an unrenderable page.
- Because the component carries no build-time precondition, the catalog is
  resolvable from the platform's portable framework entry point — the surface a
  runtime with no filesystem imports — and the render resolves modules through it
  directly rather than taking a resolver as an injected seam. The seam remains
  available for test-only catalogs, but the production default is the catalog
  itself.
- Every entry in the resolvable module catalog carries `kind: 'behavior'`; no
  catalog entry declares `kind: 'capability'`.
- The rename is **atomic**: no `Capability*` back-compat alias is published from
  the package root, and no `'capability'` discriminant survives anywhere in the
  contract or the catalog. An author or generator still using the pre-rename
  names fails to resolve rather than silently diverging (CLAUDE.md: no legacy
  modes).

The naming half is a rename of identifiers only, and the artifact half changes
what a module *ships*, not what an instance is written against — every
behavioural obligation the other ACs of this story assert is unchanged by both,
and neither bumps a module version.

## Verification
Resolve the contract types and the three validators from the framework package
root and assert they are the `Behavior*` family; drive a real survivor module's
config and slots through the renamed validators and assert the same accept/reject
outcomes the typed-contract and slot-security ACs already require. For **each**
catalogued behavior id, resolve it at its latest version and assert the component
is a function that returns markup when called with a bare props value — no
container, no await, no transform — so the mechanism is shown to be shared rather
than per-module. Assert no build-framework component-factory type is published
from the package root, and that the same resolution succeeds when importing
through the portable framework entry point. Enumerate the module catalog and
assert every meta's `kind` is exactly `'behavior'`. Assert no `Capability*` alias
is exported from the package root.

(Absorbs the free-coding UATs `test_UAT_FC_REQ-87_behavior_meta_rename_validators_drive_the_contract`
and `test_UAT_FC_REQ-87_discriminant_atomic_kind_is_behavior` in
`tests/req87-behavior-rename.test.ts`, both of which pass on this branch.)
