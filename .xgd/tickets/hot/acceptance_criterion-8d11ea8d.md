---
uid: acceptance_criterion-8d11ea8d
id: AC-722
type: acceptance_criterion
title: 'The behavior contract is published under the Behavior* names with an atomic
  kind: ''behavior'' discriminant'
created_by: xgd
created_at: '2026-07-24T22:42:02.804554+00:00'
updated_at: '2026-08-09T05:40:35.325714+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-179b8c06
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
The behavior-module contract is published under the `Behavior*` names, and every
module in the catalog declares the discriminant `kind: 'behavior'`.

- Importing from the framework package root resolves the behavior contract type,
  its config-field spec and config-field-type, its slot spec and slot value, its
  instance shape, its catalog-entry (definition) type, its conformance
  declaration, the conformance-obligation union, the validation-error shape, and
  the compile-time meta assertion — together with the three validators
  `validateBehaviorConfig`, `validateBehaviorSlots`, and `validateBehaviorInstance`.
- Every entry in the resolvable module catalog carries `kind: 'behavior'`; no
  catalog entry declares `kind: 'capability'`.
- The rename is **atomic**: no `Capability*` back-compat alias is published from
  the package root, and no `'capability'` discriminant survives anywhere in the
  contract or the catalog. An author or generator still using the pre-rename
  names fails to resolve rather than silently diverging (CLAUDE.md: no legacy
  modes).

This is a rename of the identifiers only — every behavioural obligation the other
ACs of this story assert is unchanged by it.

## Verification
Resolve the contract types and the three validators from the framework package
root and assert they are the `Behavior*` family; drive a real survivor module's
config and slots through the renamed validators and assert the same accept/reject
outcomes the typed-contract and slot-security ACs already require. Enumerate the
module catalog and assert every meta's `kind` is exactly `'behavior'`. Assert no
`Capability*` alias is exported from the package root.

(Absorbs the free-coding UATs `test_UAT_FC_REQ-87_behavior_meta_rename_validators_drive_the_contract`
and `test_UAT_FC_REQ-87_discriminant_atomic_kind_is_behavior` in
`tests/req87-behavior-rename.test.ts`, both of which pass on this branch.)