---
uid: acceptance_criterion-c1839219
id: AC-2337
type: acceptance_criterion
title: Invite is enabled only with a checked selection, prefills subject and body
  from the business's invite template with From read-only, and sends one message per
  recipient so no recipient sees another's address
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-07T07:23:02.829253+00:00'
updated_at: '2026-11-07T08:05:53.813455+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-7b1025b8
  kind: behavior
  regression_only: false
---

## Criterion

Every Contacts tab row carries a checkbox. The **Invite** control acts on the
checked set: it is disabled (not hidden) while nothing is checked, and enabled with
one or more. Pressing it opens a modal laid out as a message — From, Subject,
To-List, Body:

- **From** is the deployment's sending address, shown as text and not editable;
  a `from` supplied in the send request is ignored and every message goes out
  from the deployment's sending address;
- **Subject** and **Body** are prefilled from the business's `invite` template,
  which `GET /api/people/invite` returns; a business that has never had an `invite`
  template is given the default when the modal opens;
- **To-List** lists the selected contacts' addresses one per line, read-only, with
  a contact that has no address shown as such rather than omitted; the label is
  `To-List:` and carries a hover explaining that each contact gets their own
  message and nobody is shown anybody else's address;
- the affirmative button names how many messages it will send (`Send N`).

Inviting N contacts produces N outgoing messages, each with exactly one recipient;
no outgoing message carries more than one recipient.

## Verification

Render the tab with three contacts. Assert Invite is present and disabled; tick one
and assert it is enabled; untick and assert disabled again. Tick two and open the
modal: assert From is non-editable text equal to the deployment's sending address,
Subject and Body equal the `invite` template's copy, the To-List shows both
addresses on separate lines with the explanatory hover on its label, and the
button reads `Send 2`. In a business with no `invite` template, call
`GET /api/people/invite` and assert it answers the default copy and that the
template now exists. Send to the two with a recording mail port and a `from` in the
request body: assert two messages were recorded, each with exactly one recipient,
both from the deployment's sending address.