---
uid: request-ee6ed740
id: REQ-199
type: request
title: 'The Contacts tab: add a Lead, invite a selection, and see what was sent'
created_by: xgd
created_at: '2026-09-06T00:02:09.757977+00:00'
updated_at: '2026-09-06T20:55:49.282909+00:00'
completed_at: null
last_field_updated: body
status: free_coding
fields:
  priority: high
  story_points: 3
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-3dd62296
---

**Design ref:** [[CHAT-39]]. Depends on [[REQ-196]], [[REQ-197]], [[REQ-198]], and on the
schema rebaseline ([[REQ-190]], [[REQ-191]]).

## Add is the fundamental act, and it does not exist

The tab can invite and cannot add. `invitePerson` is insert-or-update: it is the
only way to create a contact, so creating one necessarily also asks them to sign
up. That collapses two different acts, and the one it loses is the more basic —
**most contacts are never invited at all**.

So the tab gets a `+` control that adds a contact and does nothing else. The new
row is a **Lead** ([[DOC-44]] §4), which is the initial value of the pipeline axis
and is what a contact we hold an address for and nothing else is.

**Two functions, not one with a flag.** `addContact` creates and leaves the
pipeline at Lead; `invitePerson` transitions an existing contact to Invited and
sends mail. A single function taking `alsoInvite` would make the difference
between "I am recording somebody" and "I am emailing a stranger" a boolean, which
is the kind of parameter that eventually defaults wrong.

## Invite becomes a selection, not a form

Each row carries a checkbox. **Invite** acts on the checked set and is disabled
while nothing is checked — disabled rather than absent, so the control teaches
what it needs.

## The invite modal

| Field | Behaviour |
| --- | --- |
| From | `no-reply@1stcontact.io`, **display only** |
| Subject | prefilled from the `invite` template, editable for this send |
| To-List | the selected contacts' addresses, one per line |
| Body | prefilled from the `invite` template, editable for this send |

**From is not editable.** An arbitrary sender address fails DKIM and lands the
message in spam, so offering the field would offer a way to break delivery
silently.

**Edits are for this send and are never written back to the template.** Editing a
template is a different act with a different surface ([[REQ-197]]); a modal that
quietly rewrote the template would let a one-off change to one invite alter what
every later invite says.

**`To-List:` and not `To:`, with a hover that explains why.** These go out as N
separate messages, one per recipient. The reason is not technical: contacts must
not be given each other's email addresses, and a single message with several
recipients would disclose the whole list to every one of them. The label is
unusual on purpose and the tooltip is what makes it legible rather than a typo.

**Falsifier:** more than one recipient on a single outgoing message.

## Which address it goes to

The contact's **primary** address, and nothing else. [[REQ-191]] gives a contact
several addresses and enforces exactly one primary by partial unique index, so
"the default address" is a fact the schema guarantees rather than a rule this tab
maintains.

**A contact with no primary address refuses and is not sent to.** It must not fall
back to "the first one" or "the oldest": picking silently is how a message goes to
somebody's decommissioned work address and nobody finds out. The refusal names the
contact, and the other selected contacts still send.

## What the operator sees afterwards

- inviting moves the pipeline value Lead → **Invited** ([[REQ-188]]) and never to
  Member; membership is the person's own act
- each contact's detail pane lists the messages sent to them ([[REQ-198]]),
  most recent first
- a contact whose address has **bounced** is distinguishable in the list itself,
  not only in the detail pane — a bad address is the most valuable signal the beta
  produces and it is worthless if it takes a click to find

## What this does not do

- no address management UI; the primary is whatever the schema says
- no template editing
- no per-recipient personalisation beyond the templates' own tokens
- no re-send control; re-inviting is selecting and pressing Invite again, which
  [[REQ-198]] records as a second message
- no import, no CSV, no bulk add

## Acceptance

- a `+` control adds a contact from an address and an optional name, and the new
  contact's pipeline value is **Lead**
- adding does not send mail and does not set `invited_at`
- `addContact` and `invitePerson` are separate functions and neither takes a flag
  selecting the other's behaviour
- every row carries a checkbox; **Invite** is disabled with none checked and
  enabled with one or more
- the invite modal shows From as display-only text, and Subject and Body prefilled
  from the `invite` template
- editing Subject or Body in the modal changes what is sent and leaves the
  template ticket unchanged
- the recipient field is labelled `To-List:` and carries a hover explaining that
  each contact receives their own message and that addresses are not shared
- inviting N contacts produces N messages, each with exactly one recipient
- each message goes to that contact's primary address
- a selected contact with no primary address is refused by name, and the remaining
  selected contacts are still sent to
- inviting moves a Lead to Invited, and never sets the Member axis
- the detail pane lists that contact's messages with subject, date and status
- a contact with a bounced address is visibly distinguishable in the list
## What the shape forced, beyond the two acts

Written down because each of these is a decision the implementation had to make
and none of them is derivable from the sections above.

**The affirmative button counts its recipients — `Send N`.** The dialog acts on a
selection rather than on a form, so the one number an operator wants before
pressing it is how many strangers this mails. A button that said `Send` would put
that number nowhere.

**A per-contact report, and the selection clears only once something was sent.**
Every selected contact gets a line — sent, failed, or refused with the reason —
and the dialog stays open on top of it. An operator who has just refused two rows
out of ten needs the ten still checked to fix the two.

**An empty selection is refused, not answered.** `POST /api/people/invite` with no
ids is `400`. The button is disabled with nothing checked, so a POST with none is
a client out of step, and a `200` with an empty list would report a send that
never happened.

**A `from` in the request body is ignored.** The sending address is the
deployment's `MAIL_FROM`. A field a client could set and the server quietly
honoured is what makes display-only a convention of one client rather than a fact;
not reading it at all is what makes it true.

**`{{cta_url}}` is this origin's front door, resolved from the request.** That is
where an invitee has to arrive — Access identifies them, admission runs, the terms
interstitial catches them. A configured constant would be a second answer to
*where is this deployment*, and a `wrangler dev` session would get it wrong in the
one way nobody sees: an invite whose only link goes to production.

**The edit is held to the template's declared tokens ([[REQ-197]]).** The
declaration travels with the draft and comes back with the send, so a body the
operator has rewritten without `{{cta_url}}` is refused and nothing goes out.
Deleting the link produces a mail with a dead button and looks entirely normal to
whoever receives it.

**Opening the modal seeds the `invite` template if the business has never had
one.** That is a write on a GET, and it is deliberate: the first invite in a fresh
deployment must not fail for want of content nobody knew they had to write.

**The pipeline moves on the attempt, not on the provider's answer.** `sent` and
`failed` both move Lead → Invited, because a message the provider refused is still
an invite this business made and [[REQ-198]]'s record carries the failure where it
can be read. A contact *refused* for having no primary address is not moved —
nothing was attempted for them at all.

**One send is sequential, not concurrent.** A provider that rate-limits a burst
answers with a refusal recorded against a contact whose address was perfectly
fine, which reads as *their mailbox rejected us* and is nothing of the kind.

**The composition has a file.** `invites.ts` is where `templates.ts`,
`mail.ts`, `messages.ts` and `people.ts` meet, so the sequence has one home rather
than being smeared across the route table. The mail port is passed in and never
imported, which is what keeps [[REQ-196]]'s falsifier — *a code path where running
the tests can send mail* — closed from this side.

## What this changed elsewhere

**The account fixture adds rather than invites.** `inviteAccount` — the test seed
for "an account that exists, entitled, with a site" — went through the old
insert-or-update `invitePerson`, so every suite that needed a person also stamped
`invited_at` as a side effect. It now calls `addContact`, which is what those
suites actually wanted; the one case whose subject *is* the distinction
([[REQ-170]]) performs the second act explicitly.

**The invite is the first product path that writes a ticket from inside the
Worker.** [[REQ-198]]'s message record is a ticket, so pressing Invite exercises
the deployed migration's transcription of the ticket store's schema — including
its change journal, which the store writes in the same batch as the ticket itself.
A transcription that has fallen behind the component refuses the write outright,
and the symptom is an invite that fails for a reason that has nothing to do with
mail.

## Further acceptance

- the affirmative button in the invite modal names how many messages it will send
- every selected contact gets an outcome line, and the selection survives a send
  in which nothing was sent
- inviting with an empty selection is refused rather than answered as a no-op
- a `from` sent in the request body does not change who the message is from
- the invite's link is the origin the request arrived on
- an edited body that no longer carries the template's declared `{{cta_url}}` is
  refused and no message is sent
- a business that has never had an `invite` template is given the default when the
  modal is opened
- a send the provider refused still moves the contact to Invited and is recorded
  as `failed`; a contact refused for having no address is not moved
- the message record written by an invite lands with its change-journal row
