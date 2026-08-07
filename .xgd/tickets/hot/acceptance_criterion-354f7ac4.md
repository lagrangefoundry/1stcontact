---
uid: acceptance_criterion-354f7ac4
id: AC-1015
type: acceptance_criterion
title: Both install faults are reported together in one refusal, not one at a time
created_by: xgd
created_at: '2026-08-07T03:13:03.696072+00:00'
updated_at: '2026-08-07T23:11:07.218805+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-e15a19ef
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

When an installed tree exhibits both faults at once — a required declared package
that does not resolve *and* a lockfile the tree was never installed at — the
single refusal states both, each as its own line naming its own fact.

The operator therefore learns the whole state of the tree from one run, rather
than fixing one fault only to be told about the next on the retry.

## Verification
Run a gated command against a tree that is simultaneously missing a required
package and carrying an installed snapshot that differs from the committed
lockfile. Confirm one refusal is produced and that it names both the
unresolvable package and the lockfile mismatch.