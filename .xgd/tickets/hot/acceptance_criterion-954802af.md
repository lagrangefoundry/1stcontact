---
uid: acceptance_criterion-954802af
id: AC-2054
type: acceptance_criterion
title: The preamble the model receives names a consultant and never the old role word,
  asks it to form and state a view, to say when a request would make the site worse
  and to settle an open question rather than build past it, and still carries the
  closed-vocabulary constraint
created_by: xgd
created_at: '2026-10-28T04:10:00.139275+00:00'
updated_at: '2026-10-30T20:02:45.497651+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-a58a0974
  kind: behavior
  regression_only: false
---

## Criterion
The system text the model actually receives on a turn — as assembled by the
host, not as a constant read back — tells the assistant it is a consultant
working on a site its client owns, and does not contain the role's former name
anywhere. It tells the assistant that it was engaged for its judgement, to form
a view and state it, to say so when what the client has asked for would make
the site worse, and never to build past an open question and leave it unmade.
It still carries the closed-vocabulary constraint unchanged: the assistant
cannot write HTML, CSS or JavaScript, a page is written in its own closed
vocabulary, and a change that is not well-formed in it is refused whole. The
person the site belongs to is called the client, not the user.

## Verification
Against the real builder origin with only the model client doubled, run one
turn and capture the system text of the first model request. It contains
"consultant"; it does not match the former role name case-insensitively; it
mentions judgement, "would make the site worse" and "never build past an open
question"; and it contains "closed vocabulary" and "you cannot write HTML, CSS
or JavaScript". The preamble as received — from "You are a design consultant"
to "only when your client decides to publish." — contains "client" as a word
and does not match "user" as a word case-insensitively.
