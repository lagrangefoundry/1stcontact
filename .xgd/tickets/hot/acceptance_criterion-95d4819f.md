---
uid: acceptance_criterion-95d4819f
id: AC-2585
type: acceptance_criterion
title: Hosted consultant offers library tools in separate ReadLibrary and PlaceOnSite
  groups; 1c CLI consultant offers none
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-09T23:18:51.508811+00:00'
updated_at: '2026-11-09T23:18:51.508811+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-a0b20525
  kind: behavior
  regression_only: false
---

## Criterion

**Hosted conversation.** A hosted assistant conversation (the control app, which holds the business's ticket store) offers the model the tools `list_library`, `get_library_item` and `place_on_site`. They are declared in two capability groups:
- `ReadLibrary` contains `list_library` and `get_library_item`, and has effect read.
- `PlaceOnSite` contains `place_on_site`, and has effect write.

Both groups are granted by the surface's own grant, with no entry in the repository's instance grant file.

**Local `1c` CLI.** A consultant built by the local CLI, which has no ticket store, offers none of these three tools. Its other site-editing tools are unchanged.

## Verification

Build the hosted consultant with a ticket store and inspect the tool list it sends to the model. Assert that all three tools are present and that each one's group membership and effect match the grouping above.

Build the CLI consultant without a ticket store. Assert that no `library` tools are present and that the existing site tools (for example `list_assets`) still are.
