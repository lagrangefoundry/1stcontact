---
uid: acceptance_criterion-69a7cff0
id: AC-2574
type: acceptance_criterion
title: Undeclared behavior config keys and slot names are refused at write, naming
  the key and the declared set; a stored instance with one still renders
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-09T22:52:22.406021+00:00'
updated_at: '2026-11-09T22:52:22.406021+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-179b8c06
  kind: behavior
  regression_only: false
---

## Criterion
**A behavior instance's config and slots are closed sets at the write
boundary.**

- Writing a behavior instance (for example through `configure_component` or any
  other edit verb that sets an instance) whose `config` carries a key the
  behavior does not declare is refused. The refusal names the offending key and
  lists the declared config keys (for example: config key `account` is not
  declared, declared: `signIn`, `portal`, …). Nothing is stored.
- A slot name the behavior does not declare is refused the same way, naming the
  slot and listing the declared slots.
- Declared keys and slots continue to validate exactly as before; an instance
  using only declared names is accepted.
- **Isolation:** an instance already stored with an undeclared config key or
  slot still renders. The stray key is ignored at render, and the page is not
  broken by it.

## Observable at
The result of an edit command writing a behavior instance (refusal message and
the unchanged stored definition), and the rendered page of a site whose stored
definition already carries a stray key.
