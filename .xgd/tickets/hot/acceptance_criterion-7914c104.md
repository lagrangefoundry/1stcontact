---
uid: acceptance_criterion-7914c104
id: AC-2188
type: acceptance_criterion
title: In a contact's detail, Who they are offers editing on Email and Name only;
  the eight observed fields are locked
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T19:32:56.316731+00:00'
updated_at: '2026-11-01T20:02:35.025637+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-a55c2f35
  kind: behavior
  regression_only: false
---

## Criterion
When a contact's detail opens in the Contacts tab, the **Who they are** section shows ten fields. Exactly two offer an editing affordance: **Email** and **Name**. The other eight are locked: Pipeline, Access, May sign in, Invited at, First seen, Last seen, Terms accepted, Created. A locked cell shows its value and has no editing affordance. Clicking a locked cell opens no input control, and no viewer-level override makes it editable.

## Verification
Mount the Contacts panel against a transport that returns one person, open their detail, and inspect the Who they are section. Assert that Email and Name carry the editing affordance and open an input when activated. For each of the eight locked fields, assert it has no affordance and that clicking it leaves no input open.