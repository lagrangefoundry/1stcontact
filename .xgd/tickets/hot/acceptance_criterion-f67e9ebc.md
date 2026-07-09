---
uid: acceptance_criterion-f67e9ebc
id: AC-507
type: acceptance_criterion
title: Theme palette accepts optional secondary/neutralCool/accent-light/deep/mid
  roles emitted as colour custom properties
created_by: xgd
created_at: '2026-07-09T21:57:59.307984+00:00'
updated_at: '2026-07-09T21:57:59.307984+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-a224111f
  kind: behavior
  regression_only: false
---

## Criterion
The theme palette accepts optional `secondary`, `neutralCool`, `accentLight`, `accentDeep`, and `accentMid` roles in addition to the base roles. `secondary`, `neutralCool`, `accentLight`, and `accentDeep` are backfilled from framework defaults, so their `--color-secondary`, `--color-neutral-cool`, `--color-accent-light`, and `--color-accent-deep` custom properties are always emitted even when omitted. `accentMid` is optional and emitted as `--color-accent-mid` only when the site declares it. Every role name is kebab-cased in its emitted custom property. All roles are optional, so pre-existing themes without them still validate; the resulting `--color-<role>` properties are the closed set of stop/accent roles a gradient or callout treatment may reference (`primary`, `accent`, `secondary`, `muted`, `neutral-cool`, `accent-light`, `accent-deep`, `accent-mid`).

## Verification
Generate theme CSS from a palette that omits the optional roles and assert `--color-secondary`, `--color-neutral-cool`, `--color-accent-light`, and `--color-accent-deep` are still emitted (from defaults) while `--color-accent-mid` is absent. Generate CSS from a palette that declares all five and assert each is emitted with its kebab-cased `--color-<role>` name. Assert a theme omitting all of them still validates.
