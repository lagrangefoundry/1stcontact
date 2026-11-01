---
uid: acceptance_criterion-38cac6f2
id: AC-2094
type: acceptance_criterion
title: A conversation with no live turn is not rejoined; a failed rejoin leaves the
  pane usable; a transport without rejoin support still mounts
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T03:06:14.307080+00:00'
updated_at: '2026-11-01T03:06:14.307080+00:00'
completed_at: null
last_field_updated: created_at
status: active
fields:
  story_uid: story-7f437d57
  kind: behavior
  regression_only: false
---

## Criterion

Rejoining is something the pane does for the operator without being asked, so it never
costs them anything.

- **No turn in progress, no rejoin.** A conversation that is not reported as live is
  shown from its transcript alone, with every turn, including a final assistant turn, as
  a finished message. The pane does not ask for the rest of a reply.
- **A failed rejoin costs only the rest of that reply.** If rejoining cannot start or
  breaks part-way, the transcript already painted stays as it is, no error is raised
  from the pane and no failure note is shown to the operator, and the pane stays usable:
  it can still be switched to another conversation and the operator can still type.
- **A transport that cannot rejoin still works.** A pane mounted with a transport that
  offers sending but not rejoining mounts and shows the transcript of a live conversation
  as finished messages, as it did before rejoining existed, and never attempts a rejoin.
- **An assistant that cannot run is still explained.** When the conversation is both
  live and reported as unable to run, the reason is still shown in the pane alongside the
  history.

## Verification

Open the pane on a conversation not reported as live whose transcript ends with an
assistant turn, and confirm no rejoin is requested and every turn is a finished message.
Open it on a live conversation with a rejoin that fails immediately, and separately with
one that fails after some text. In both cases confirm no exception escapes, no failure
note appears, the painted transcript is intact, and the pane can then be handed another
conversation. Mount the pane with a transport that has no rejoin and give it a live
conversation. Confirm it mounts, shows the transcript, and no rejoin is attempted.
