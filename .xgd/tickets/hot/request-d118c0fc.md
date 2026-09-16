---
uid: request-d118c0fc
id: REQ-251
type: request
title: 'The hostname assistant: reconcile the surface with the built experience, and
  keep the pane and the chat in step'
created_by: EPIC-5
created_at: '2026-09-15T23:21:45.479150+00:00'
updated_at: '2026-09-15T23:21:45.479150+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: medium
  depends_on:
  - request-692325d3
  epic_parent: epic-c5175c8f
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-02eb714e
---

## What this is

The settings assistant can already check and claim hostnames. **This ticket is
not about exposing that.** It is about the two ways the assistant and the pane
beside it can now tell the customer different things, and about the fact that
nobody has watched the assistant do this once.

## What is already built, traced end to end

The availability operation is exposed to the model today, and a ticket to expose
it would be building what is there:

| | |
| --- | --- |
| `ai/settings-surface.json` | declares `read_addresses`, `check_hostname`, `claim_hostname` with their shapes and refusals |
| `ai/settings-core.ts:322-367` | implements all three |
| `ai/settings-core.ts:384` | installs them as own methods on `SettingsToolbox` |
| `ai/settings-core.ts:205` | grants `ReadAddresses` and `ClaimHostname` |
| `ai/host-core.ts:1060` | composes the toolbox; `box.schemas()` feeds the backend |
| `business.ts:425` | binds them to [[REQ-238]]'s real functions |

The declaration also already carries the behaviour that was asked for: a sequence
instructing the model to check *"as many candidates as it takes, and you may
check several before saying anything, so that what you offer is a short list of
names that are actually free"*, and an `absences` entry — *"Choosing a hostname
for them"* — forbidding it from claiming on the customer's behalf.

**None of it has been run.** The wiring is complete; the behaviour is unobserved.

## The pane and the chat are on screen together and do not know about each other

This is the substantive build, and it is a bug the Settings tab's own layout
creates. `app.js:917-923` mounts `settingsChat` into a split beside the settings
pane — both visible, both able to write the same record.

The site chat is given a way to tell its pane something happened:

```js
onSiteChanged: () => panel.reloadDocument()   // app.js:679
```

**`settingsChat` is given no equivalent.** It receives `storage` and `transport`
and nothing else. So when the assistant claims a hostname, or renames the
business, the pane six inches to its left goes on rendering what it read when the
tab opened — an empty text box for an address that now exists, or the old name.

That is not staleness anyone has to go looking for. **Both statements are on the
screen at the same time**, they contradict each other, and the customer has no way
to tell which one is true. A hostname is the worst possible field for this,
because the pane's version of the truth is an invitation to choose a name that
has already been chosen — and the claim behind it is permanent.

So: the settings chat reports what it changed, and the pane re-reads. The site
chat's hook is the shape to follow, for the reason [[REQ-239]] gives about one
API and two callers — the pane refreshing from the record is not the assistant
driving the pane.

## The declaration and the pane must say the same words

[[REQ-249]] settles the customer-facing vocabulary, and the declaration
predates it. Both describe the same rules to the same person, at the same moment,
in two different registers:

- **`free web address`, never `domain`** — [[REQ-249]]'s wording, and the reason is
  that [[EPIC-6]] is going to sell them a real domain.
- **Three distinct refusals** — taken, reserved and invalid say different things
  and lead somewhere different. The declaration's `errors` block already draws
  these lines; the check is that it draws them the same way the field does.
- **The whole host, always** — `alice.1stc.site` and never `alice`. Already in
  the declaration's `address` shape; restated because it is the rule the pane and
  the assistant most easily drift on.
- **For your business, not for this site.**
- **The race sentence** — *"that one went while you were deciding"* — said the
  same way in both places.

**Two statements of one set of rules drift.** The customer reads both at once
here, so a drift is not a tidiness problem: it is the field and the conversation
disagreeing in front of them, with nothing to break the tie.

## And somebody has to drive it

The verification is part of this ticket and not a follow-up:

- it checks several candidates before it speaks, rather than proposing one and
  finding out;
- it says the whole host back before the customer commits to anything;
- it does not claim on their behalf, including when they say *"just pick one"*;
- it distinguishes reserved from taken in what it says next;
- it handles the claim losing the race as an ordinary outcome, not a fault;
- and a claim it makes lands on the pane beside it without a reload.

## Depends on

**[[REQ-249]].** The vocabulary is reconciled against that ticket's copy,
and the pane refresh is a refresh of that ticket's section. Building this first
would mean reconciling against wording that does not exist yet.

## Not in scope

- **Any new operation on the surface.** All three exist.
- **Priming the chat from the pane's taken line.** That hand-off is [[REQ-249]]'s
  deliberate omission and stays omitted.
- **The site chat.** Its hook is the shape to copy and is not changed.

## Falsifiers

- A new tool, operation or group added for availability checking.
- A claim or rename made by the assistant that leaves the pane beside it showing
  the previous state.
- The pane refreshed by the assistant writing to it, rather than by re-reading
  the record.
- The word `domain` in the declaration's customer-facing prose.
- The declaration and [[REQ-249]]'s section stating a rule in terms that could send
  the customer two different ways.
- Shipping with the assistant's behaviour still unobserved.