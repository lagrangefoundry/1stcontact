---
uid: acceptance_criterion-a7e49359
id: AC-2252
type: acceptance_criterion
title: The Their name pane edits name parts and shows the greeting; clearing every
  part leaves the person with no name
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-04T16:30:38.604658+00:00'
updated_at: '2026-11-04T19:42:48.393229+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-a55c2f35
  kind: behavior
  regression_only: false
---

## Criterion

A contact's detail has a **Their name** section offering editing on each of the
seven name parts — Name, Known as, Title, Given name, Middle names, Family name,
Suffix — committing one part at a time as a correction, with the other parts left
as they were. A locked **Greeting** row shows *Hi <known as>,*, falling back to the
given name and then the displayed name, never including a title, and reads
*No name yet* when there is nothing to greet. A locked **Formerly** row shows the
former names that were genuine changes. A **Record a name change** control opens a
dialog prefilled with the current parts that saves all of them at once as a
change. Clearing every part leaves the person with no current name, and the list
then reads *No name yet* for them. Clearing the displayed name while another part
remains is refused with a message beside the field, and the name is unchanged.

## Verification

Mount the Contacts panel against a transport that applies the record route's name rules (one part patched at a time, a missing reason is a correction, only `changed` keeps a former name, the route's refusal sentence when the displayed name is cleared while a part remains, no name when every part is cleared). For a
person named "Robert Smith" with given name "Robert", assert the Greeting reads
"Hi Robert,"; set Known as to "Bob" and assert it reads "Hi Bob,", that only the
known-as part was sent, and that a Title never appears in the greeting. Record a
name change through the dialog and assert every part was sent marked changed and
the Formerly row shows the previous displayed name. Clear the displayed name while
Known as is set and assert the refusal message and the unchanged name. Clear every
part and assert the person has no current name and the list row reads "No name
yet".

The route half is driven against the real record route in workerd against real D1: clearing the displayed name while Known as is set is refused with a 400 carrying the sentence and leaves the name unchanged, and clearing every part leaves no current name and the list reports none.
