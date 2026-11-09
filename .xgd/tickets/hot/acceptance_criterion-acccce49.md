---
uid: acceptance_criterion-acccce49
id: AC-2586
type: acceptance_criterion
title: On the deployed host the consultant can read, but never write, this business's
  tickets — including earlier conversations and their transcripts — and nothing beyond
  this business
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-09T23:31:43.013893+00:00'
updated_at: '2026-11-09T23:31:43.013893+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-a58a0974
  kind: behavior
  regression_only: false
---

## Criterion
On the deployed (Worker) host, the consultant is offered the shared ticket
surface with **only its read group** granted. Within a session it can:

- read any ticket in this business's own store by its identifier — including a
  `chat` ticket that holds an earlier conversation (its title and its ledger
  body);
- read that earlier conversation's **transcript**, which is held as a
  `chat_transcript` comment on the chat ticket;
- query this business's tickets by predicate (for example `type=material`) and
  get the matching records back.

Every ticket in the session's own store is reachable; there is no narrower
allow-list (not "the picture catalogue only"). The reach into earlier
conversations is intended, not incidental.

The write group is **withheld**: none of the ticket-write operations appears in
the tools the consultant is offered, and a write operation named explicitly
anyway is answered with a refusal the model can read, and the ticket it named is
left unchanged.

Reach stops at the business. A ticket belonging to another business is refused
from this business's session even when its identifier is correct, and a
reference naming another project is refused. The grant is carried by the
surface itself, not written into the role's instance configuration file — that
file grants the consultant `l1` and `fidelity` and nothing else.

## Verification
Build a session for a tenant over a real tenant-bound ticket store through the
production wiring. Assert the granted groups are exactly the read group; the
offered tools contain every read-group tool and no write-group tool; a
`TicketUpdate` by name renders a refusal and the ticket title is unchanged;
`TicketGet` on a prior `chat` ticket returns its title and ledger text;
`TicketComments` returns its `chat_transcript` text; `TicketQuery
type=material` returns an uploaded material. Create a ticket under a second
tenant: its own session reads it, the first tenant's session is refused and does
not echo its title. `TicketGet` on `ticket://lagrangefoundry/xgd/REQ-52` is
refused. `instances.json`'s consultant entry has keys exactly `fidelity`, `l1`.
