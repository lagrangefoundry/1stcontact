---
uid: acceptance_criterion-46566362
id: AC-2218
type: acceptance_criterion
title: Pressing Delete account reveals the erasure explanation; Close folds it away
  again
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T20:16:12.086811+00:00'
updated_at: '2026-11-01T20:16:12.086811+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-83ff6262
  kind: behavior
  regression_only: false
---

## Criterion
With scripting enabled, the portal page shows a control labelled "Delete account" with aria-expanded="false", and the erasure explanation is hidden. Pressing it shows the explanation, headed "Closing your account", and sets aria-expanded="true". The explanation contains: a "What is destroyed" section (email address, name, phone number, enquiries, list membership, source, sessions, assistant conversations), and a "What survives, and why each one is for you" section listing exactly three survivors, each with its reason: a one-way fingerprint of the email address, the dates permission was given and withdrawn, and invoices and payments reduced to the legal minimum. A "Close" control inside the explanation hides it again and sets the reveal control back to aria-expanded="false".

## Verification
Load the rendered page in a DOM with the module's client running. Assert the initial hidden state, press Delete account and assert the headings, the three survivors with their reasons and the aria state, then press Close and assert it is hidden again.
