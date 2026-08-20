---
uid: acceptance_criterion-cf26bae1
id: AC-1290
type: acceptance_criterion
title: Every boolean flag the CLI reads is registered — the set is derived from the
  CLI source, not restated
created_by: xgd
created_at: '2026-08-20T04:14:22.133484+00:00'
updated_at: '2026-08-20T04:14:22.133484+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-e15a19ef
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
The set of flag names the `1c` CLI reads as boolean toggles is registered in one
place (`BOOLEAN_FLAGS`, consulted by `parseArgs` ahead of the command switch),
and that registry is complete with respect to the CLI source at all times.

Completeness is asserted by **deriving** the boolean reads from the CLI source
and requiring the derived set to equal the registry — not by restating the
registry as a literal, which pins the set only to itself. The derivation counts
every truthiness form the CLI actually uses: `flags.x === true`, a bare
`if (flags.x)`, `!flags.x`, `Boolean(flags.x)`, short-circuit (`flags.x && …`),
and a ternary condition (`flags.x ? … : …`). Reads that are `typeof`-guarded as
strings or handed to a parser are value-taking and are excluded.

Consequently, a boolean flag added to any verb without being registered fails a
test rather than a user's invocation. This is the failure mode that actually
occurs: six flags (`collapse`, `clusters`, `edit`, `dry-run`, `prune`, `apply`)
drifted behind the CLI, and `--assign` — read as a bare `if (flags.assign)` —
then survived a sweep that recognised only the `=== true` form, each reopening
REQ-58's `Missing required <slug>` fault through a different verb.

## Verification
Read the CLI source, extract every `flags.<name>` / `flags['<name>']` read in a
boolean context by the forms above, and assert the resulting set equals
`BOOLEAN_FLAGS` exactly. Confirm the assertion is load-bearing by removing a
member from the registry while its boolean read remains in the CLI: the
derivation must go red. Each registered member is separately proved to preserve
`<slug>` as a positional in both flag orders.
