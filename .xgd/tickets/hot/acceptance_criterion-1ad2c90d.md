---
uid: acceptance_criterion-1ad2c90d
id: AC-2189
type: acceptance_criterion
title: Confirming an edit to Email or Name in the panel saves that one field and then
  shows the stored value
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T19:32:59.009799+00:00'
updated_at: '2026-11-01T20:02:34.797146+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-a55c2f35
  kind: behavior
  regression_only: false
---

## Criterion
When the operator confirms an edit to Name, or to Email with a well-formed address, the panel sends a save for that person containing **only the changed field**. A Name edit carries no email key, and an Email edit carries no name key. When the save succeeds, the cell shows the value the server returned, not the value typed. For example, an address typed `Sarah@Example.com` and stored casefolded is shown as `sarah@example.com`. The contacts list is then re-read so it agrees with the pane.

## Verification
Drive the panel through its transport seam: edit Name and confirm, then assert the transport received exactly `{displayName: <typed>}` for that person id. Edit Email to a mixed-case well-formed address with a transport that returns it lowercased, and assert the cell then reads the lowercased value and the list was re-fetched.