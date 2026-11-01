---
uid: acceptance_criterion-964bcad3
id: AC-2226
type: acceptance_criterion
title: The portal offers no add-business, plan, charges, details-editing or export
  surface and never says "tenant"
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T20:16:23.353914+00:00'
updated_at: '2026-11-01T20:26:43.102631+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-83ff6262
  kind: behavior
  regression_only: true
---

## Criterion
No visible text or control on the portal page (default or as delivered by the module) offers to add or create a business, shows a plan or charges, edits the account's name or details, or exports data. No user-visible string on the portal page, including any text written by its client, contains the word "tenant" (case-insensitive).

## Verification
Render /account, press Delete account, and fill the account facts. Scan all visible text and control labels for add-business, plan, charges, billing, invoice listing, edit-details and export affordances, and for /tenant/i. Assert none are found.