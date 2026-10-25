---
uid: request-9ae1dee9
id: REQ-344
type: request
title: The consultant is told how full its context is
created_by: EPIC-19
created_at: '2026-09-28T19:38:18.843706+00:00'
updated_at: '2026-09-28T22:00:35.449103+00:00'
completed_at: null
last_field_updated: status
status: abandoned
fields:
  epic_parent: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  priority: medium
---

Parent: [[EPIC-19]] (Finding 14.13). Design: [[DOC-61]] §F2, item 1.

## What changes

The site consultant is told how full its context is, before it decides what to do.
Every turn after the first carries the occupancy figure, the window, the proportion
and the room left — the same entry the settings assistant already gets.

## Why this is one line

The gauge is **built and shipped upstream**. `budgetProvider` (LF REQ-169,
`components/ai/js/src/defaults.js`) renders occupancy, window, percentage and
remaining; it returns `null` when nothing has been measured, so the entry *and* its
separator disappear on a first turn rather than reading zero. `manager.js:861` puts
`occupancyTokens` and `contextWindow` into the turn context **before** the turn runs,
for the reason this ticket exists — *"the whole failure is that cost is invisible at
the moment of choosing, so the figure has to be in the priming the model reads before
it decides what to do, not in a report it gets afterwards."*

`tools/generate/src/cli/ai/priming.json` names the entry in `settings_reminders` and
**not** in `reminders`. So the settings assistant has a fuel gauge and the site
consultant does not — the role that said, in the words quoted in [[REQ-284]]:

> I get no warning. This is the part I would most want you to know. I do not
> experience the cutoff. […] Right now I am driving with no fuel gauge.

[[REQ-284]] does not close this. Its commit prices *looking* and rewrites the
`interrupted-turn` advice; it adds no gauge entry. Checked against the commit, not
inferred from the title.

## Scope

Add the `session-budget` entry (provider `session.budget`) to `reminders` in
`priming.json`. Nothing else. No `.ts` change if the provider is already registered
for this role's runtime — verify that first, and if it is not, the registration is one
argument, as [[REQ-284]] found for its own provider.

**Out of scope:** the frozen-inside-a-turn problem. The figure this delivers is what
the *previous* turn's last request carried, which is [[DOC-61]] §2's live-occupancy
item and belongs to the upstream loop ticket. This ships the gauge that exists.

## Test plan

- A consultant session's rendered reminder text **names the occupancy figure** once a
  turn has been measured, and the numbers it carries are the session's own.
- A consultant session's **first** turn renders no gauge entry and no orphan separator
  — the `null` path, which is what stops a gauge reading zero from claiming room.
- The settings assistant's reminder is unchanged.


## Experience design

This delivers **§6 — *what each AI experiences*: the consultant can see its own context pressure** of [[DOC-62]] — *Building a site with two AIs: the client, the
consultant and the interrogator*. [[DOC-61]] is the mechanism half and scopes this
ticket; DOC-62 is why it matters and what the session is supposed to feel like on both
sides. A UAT here should be readable as a claim about that experience.


## ABANDONED (2026-09-28) — the gauge answers a misdiagnosis

Raised by the operator on the day this was filed, and the objection is right:

> That is NOT the gauge we discussed — we talked about managing the number of tool
> iterations and feeding that back to whoever was making the calls in the results. We have
> technology for rolling the chat history window AND keeping two forms of summary, all of
> which is available in chunk level search to the AI — what would it do with its context
> size?

**Nothing, is the honest answer.** The context window is a **host-managed** resource and
every mechanism that manages it is either shipped or decided:

- LF REQ-168 bounds a warm conversation in flight and re-seeds a cold one from a window —
  the history rolls;
- [[REQ-283]] keeps **two** forms of memory, a bounded standing frame (`fields.frame`,
  rewritten in place) and an append-only ledger (the chat ticket body), so what must
  survive is preserved deliberately rather than by luck;
- the ledger body is KB-indexed at chunk level, so what falls out of the window is still
  reachable by search;
- `_compactionDue` acts on occupancy without asking the model.

So there is **no cliff for the model to steer away from**, and a percentage in front of it
buys no decision. Worse, it invites **false economy**: a session told it is at 60% skips a
screenshot it should take, to protect a resource it does not manage and cannot release.

**And the failure this was sold as fixing has a different cause.** Finding 5 took the
consultant's *"the turn simply ends […] indistinguishable from having finished"* and
attributed it to context exhaustion. The code says otherwise: the silent-stop path in
`runToolLoop` is **iteration-cap exhaustion** — `maxIter` falls out of the `for` and yields
`doneEvent` — with the wall-clock timeout as the other exit. Neither is a context event. The
gauge was an answer to a symptom whose cause we had not yet found.

**What survives.** The model-facing instrument for cost is the **price of the call it is
about to make**, at the point of the call — which [[REQ-284]] already shipped. The
host-facing instrument is the meter on iterations and clock, which is LF REQ-181. Occupancy
was removed from that ticket's scope for the same reason this one is abandoned.

Nothing here to implement. The one-line configuration change is **not** made: the site
consultant does not get the `session-budget` entry. If occupancy ever becomes model-facing
again it will be because a decision was found that depends on it, and that decision will be
named in the ticket.