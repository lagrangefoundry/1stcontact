---
uid: acceptance_criterion-7b488315
id: AC-1055
type: acceptance_criterion
title: A conversation identifier that names no site this account holds is refused
  before anything is streamed, and starts no conversation
created_by: xgd
created_at: '2026-08-10T08:35:48.124047+00:00'
updated_at: '2026-08-31T17:33:22.292648+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-a58a0974
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

The origin answers a turn only for a conversation identifier that names a site
**the caller's account actually holds**. The identifier is resolved against
durable storage, not against anything the process that issued it happens to
remember, so the same answer is given by any process at any time.

- An identifier of the form the origin derives for a site the account holds
  **resolves, and its turn is answered.** It is the only thing a client carries
  between opening a conversation and speaking in it, so refusing it would refuse
  every turn.
- An identifier that names no site this account holds is **refused**: one that
  was fabricated, one naming a site that does not exist, one naming a site only
  another account holds, one carrying no derivable site name at all (unprefixed,
  or the prefix with nothing after it), and one carrying path-traversal
  characters. There is no separate sanitising step to get wrong — the identifier
  is looked up, and a miss is a miss.

A refusal arrives before anything of the assistant's is streamed, and is never
dressed as the assistant having tried and failed: no fabricated apology is
placed in the conversation. Where the origin answers a turn with a status code
the refusal is a plain not-found answer and not an event stream; where every
turn is answered as a stream it is the origin's own explanatory message followed
by the completion that releases the caller. Either way no conversation is
created, no transcript storage appears, and no site is written.

## Verification

Without opening a conversation, submit a turn carrying each of:

- an identifier of the form the origin derives for a site the account holds — it
  resolves and the turn is answered, with no refusal;
- a fabricated identifier;
- one naming a site that does not exist;
- one with no derivable site name;
- one containing path-traversal characters.

Each of the last four is refused — as a plain structured not-found answer, with
no event stream, on the origin that answers turns with a status code, and as the
origin's own message ahead of the completion on the origin that always streams.
After each, no transcript storage exists and every site's draft is unchanged.
Finally, submit the first identifier against an account that does not hold that
site: it is refused there, so the resolution is scoped to the account and not
merely to the name.
