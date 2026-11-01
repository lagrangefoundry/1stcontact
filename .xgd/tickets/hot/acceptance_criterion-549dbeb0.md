---
uid: acceptance_criterion-549dbeb0
id: AC-2110
type: acceptance_criterion
title: The consultant writes the conversation's ledger into the chat ticket's body
  and names the ticket for retrieval, through a ledger operation that can reach only
  this conversation's ticket
created_by: xgd
created_at: '2026-11-01T09:27:32.418261+00:00'
updated_at: '2026-11-01T09:51:03.662120+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-a58a0974
  kind: behavior
  regression_only: false
---

## Criterion

Where the conversation is homed in a `chat` ticket (the deployed runtime), the consultant is offered a dedicated **ledger** surface with two write operations, granted with the surface:

- **record a decision** — takes what was decided and why (both required), optionally what was considered and rejected, and whether it is still open. It appends one entry to the chat ticket's body under a heading `### Decision <n>`, numbered from the entries the body already holds, so a resumed conversation continues the numbering and never replaces what is there. The entry carries the decision, a **Why** line, a **Considered and rejected** line only when alternatives were given, and an *open* marker only when the decision is open. It reports how many decisions the ledger now holds and the engagement's current title. A count is taken only from headings at the start of a line, so a decision whose prose contains the phrase does not inflate it;
- **name the engagement** — replaces the chat ticket's title (the session identifier the archive minted) with a retrieval-oriented name, and is safe to call again.

The operations take no ticket, site or path argument: they reach this conversation's own ticket and nothing else, and nothing on the ledger surface changes the site.

Failures are reported as themselves:

- a decision written while the ledger moved underneath it is refused as a **clash to retry**, and nothing already recorded is lost;
- any other write failure is reported as that failure, not as a clash;
- a session that reaches the ledger before its chat ticket exists is refused by name (no ledger yet), telling the consultant to state the decision in its reply and record it later.

Where there is no ticket store to write to (the operator's command line), the ledger surface is **absent**: the session starts and runs with no ledger operations rather than failing.

## Verification

On the deployed runtime, against a chat ticket for the session: record a decision and read the ticket — its body holds `### Decision 1` with the decision and its Why line. Record a second: it is `### Decision 2`, appended after the first. Record into a body whose decision text contains `### Decision 9` mid-line: the next entry is still numbered from line-start headings only. Interleave a competing body write between read and write: the call is refused as a clash, and both the competing content and the earlier entries survive. Make the store fail for an unrelated reason: that failure is reported, not a clash. With no chat ticket yet: the call is refused as no-ledger. Name the engagement: the ticket's title is the given name, no longer the session id. On the command-line host, the offered tools include no ledger operation and the session still takes a turn. No ledger operation declares a site, ticket or path parameter.