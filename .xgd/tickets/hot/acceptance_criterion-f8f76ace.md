---
uid: acceptance_criterion-f8f76ace
id: AC-2409
type: acceptance_criterion
title: Invite is enabled only with a checked selection, prefills subject and body
  from the business's invite template with that template's resolved sender shown read-only,
  and sends one message per recipient
created_by: workflow:fix_reconciliation_review/builder
created_at: '2026-11-08T08:03:54.784814+00:00'
updated_at: '2026-11-08T08:03:54.784814+00:00'
completed_at: null
last_field_updated: created_at
status: active
fields:
  story_uid: story-7b1025b8
  kind: behavior
  regression_only: false
---

## Criterion

Replaces AC-2337, whose sender clause REQ-205 (bundle-c0301347) retracted. Every other clause carries over unchanged.

Every Contacts tab row carries a checkbox. The **Invite** control acts on the
checked set: it is disabled (not hidden) while nothing is checked, and enabled with
one or more. Pressing it opens a modal laid out as a message — From, Subject,
To-List, Body:

- **From** is the `invite` template's resolved sender: the template's own `from`
  when it declares one (the seeded invite declares `1st Contact <invite@1stcontact.io>`),
  otherwise the deployment's `MAIL_FROM` (AC-2371). It is shown as text and is not
  editable. A `from` supplied in the send request is ignored, and every message goes
  out from that same resolved sender;
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
modal with a draft whose `from` is the invite template's address. Assert From is
non-editable text equal to that address, Subject and Body equal the draft's copy,
the To-List shows both addresses on separate lines with the explanatory hover on its
label, and the button reads `Send 2`. In a business with no `invite` template, call
`GET /api/people/invite`. Assert it answers the default copy with `from` equal to
the seeded invite's address, and that the template now exists. Send to two contacts
with a recording mail port and a spoofed `from` in the request body. Assert two
messages were recorded, each with exactly one recipient, both from the seeded
invite's address and neither from the spoofed one.
