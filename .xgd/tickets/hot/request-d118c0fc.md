---
uid: request-d118c0fc
id: REQ-251
type: request
title: 'The hostname assistant: reconcile the surface with the built experience, and
  keep the pane and the chat in step'
created_by: EPIC-5
created_at: '2026-09-15T23:21:45.479150+00:00'
updated_at: '2026-09-16T00:56:02.876088+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  priority: medium
  depends_on:
  - request-692325d3
  epic_parent: epic-c5175c8f
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-02eb714e
  commits:
  - working_sha: 5800000879da29a3dccbdd131aa1e804b41f09f6
    reconcile_sha: null
    main_sha: null
  version: 0.2.210
  story_points: 5
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
---

## What is being built (implementation plan, this session)

### 1. The settings turn announces its own writes, and the pane re-reads

`business_changed` — a second event kind beside `site_changed`, emitted by the
settings branch of `streamPrompt`, carrying `{at, changes}` and nothing else.

**Derived, not declared**, for exactly BUG-43's argument. The site's signal is
arithmetic over `store.counter(slug)`; a settings session has no store and no
counter, so the equivalent is a count of **write operations that actually
returned**. The set of write operations is read out of the declaration's own
`effect: "write"` entries rather than listed by hand — so a future settings
operation is announced the day it is declared, and no operation can be announced
that did not run, or announced twice.

It is a NEW KIND AND NOT `site_changed`. A settings session has no site, and a
pane wired to reload a preview frame on the site's signal must not be made to do
so by a business write.

The client half follows the site chat's shape exactly: `chat.js` gains
`onBusinessChanged`, observed in the same stream wrapper that already observes
`site_changed` and stopping there, so the signal leaves no trace in the
transcript and a throwing host does not take the turn with it. `app.js` hands
`settingsChat` the one line the site chat has had all along.

### 2. What "re-read" means, precisely

The pane re-reads **the record**, and the assistant does not write to the pane.
Two facts are re-read because the assistant can change both:

- **the address**, through the same `/api/hostname` read the tab already makes on
  open. This is the one that matters: a pane still showing an empty box for an
  address that now exists is an invitation to choose a name that has been chosen,
  behind a claim that is permanent.
- **the business name**, so the field and the switcher follow a rename made in
  the conversation beside them — the same crossing `onRenamed` already prevents
  when the rename is made in the field. It is read out of `/api/businesses`,
  which the shell already calls; no new route is added for it.

**A re-read that finds nothing changed changes nothing on screen.** A customer
half-way through typing a candidate, whose assistant answered a question in the
meantime, keeps what they typed — a refresh that emptied the box would be this
ticket's own bug arriving from the other direction.

### 3. The declaration and the pane say the same words

Reconciled against [[REQ-249]]'s shipped copy, and tied to it by test rather than
by restatement: the pane's exported sentences are imported and their distinctive
phrases are required to appear in the declaration, so a later rewrite of either
turns the other red.

- **`free web address`** is what the model calls it to the customer. `domain` is
  kept for the thing [[EPIC-6]] will sell them, and appears nowhere else.
- **Three refusals, three sentences.** `taken` leads to trying another; `reserved`
  says it is kept for 1st Contact itself and to change the word; `invalid` says
  the rule that was broken, as the route states it.
- **The whole host, always** — `alice.1stc.site`, never `alice`.
- **For your business, not for this site** — the claim is a business's one
  address, and the declaration is corrected to say so.
- **The race sentence** — *"went while you were deciding"*, said the same way in
  both places.

### 4. Driving it

An end-to-end suite takes real turns through the Worker's own route table over a
real D1 with the deployed schema, with the Anthropic client as the only double —
the arrangement [[REQ-239]]'s suite already uses. This is the first time any of
the three address operations has been called through the shipped host at all.

It covers: all three operations reaching the wire and no site operation beside
them; several checks in one turn, writing and holding nothing; each of the three
refusals coming back as an ANSWER rather than a tool failure; a claim landing in
the record; a claim that lost the race refused as an ordinary outcome with the
business left free to try again; and a second claim refused, naming the one held.

**What a scripted model cannot prove**, said plainly: that the model *chooses* to
check several candidates before speaking, or *declines* to claim when told "just
pick one". Those are properties of a model's judgement, and the declaration is
where they are asked for. What this suite proves is that every one of those
behaviours is *reachable* and behaves correctly when taken — which is the half
that was unobserved.

## Test plan

| Suite | Proves |
| --- | --- |
| `test_UAT_FC_REQ-251_the_assistant_takes_an_address.workers.test.ts` | Section 4 — the three operations driven end to end through the real host |
| `test_UAT_FC_REQ-251_the_pane_follows_the_assistant.test.ts` | Sections 1 and 2 — the signal, the re-read, and the half-typed candidate left alone |
| `test_UAT_FC_REQ-251_one_set_of_rules.test.ts` | Section 3 — the declaration and the pane tied to one vocabulary |
---

## What shipped

Commit `5800000879` (version `0.2.210`), merged into `xgd-working` as `bf384e9f97`.

### 1. `business_changed` — the settings turn announces its own writes

A second event kind beside `site_changed`, emitted by the settings branch of
`streamPrompt` and carrying `{at, changes}`.

**Derived, not declared**, for BUG-43's argument exactly. The site's signal is
arithmetic over `store.counter(slug)`; a business is not a store and has no
counter, so the equivalent is a count of write operations that actually
*returned* — maintained by a hook `settings-core.ts` installs on each write op,
and installed in `buildBusiness` where the business is in hand. **Which
operations are writes is read out of the declaration's own `effect: "write"`
entries** rather than listed beside it, so a future settings operation is
announced the day it is declared. A refused claim announces nothing, because the
count is taken after the operation returns.

A NEW KIND AND NOT `site_changed`: a settings session has no site, and the host
that consumes the site's signal answers it by reloading a preview frame.

`chat.js`'s stream wrapper now observes both kinds through one `Map` — a `Map`
and not an object index, because the key is a string off the wire and
`constructor` would otherwise resolve to something on `Object.prototype`. The
signal still leaves no trace in the transcript and a throwing host still does not
take the turn with it. `app.js` hands `settingsChat` the one line the site chat
has had since BUG-43.

### 2. The pane re-reads

`settings.reload()` — the pane goes back to the record, and the assistant does
not write to the pane. Both facts, because the assistant can change both:

- **the address**, through the same `/api/hostname` read the tab makes on open;
- **the business name**, through `fetchBusinessRecord` over `/api/businesses` —
  the list the shell already fetches, so **no new route was added**. A rename made
  in the conversation moves the field and, through the existing `onRenamed`, the
  switcher.

**A re-read that finds no news changes nothing on screen.** The hostname section
gained `refresh()` — distinct from `setAddresses()`, which a business *switch*
calls and which is right to draw from nothing — and it acts only on a difference.
A customer half-way through typing a candidate keeps it when the assistant
renames the business beside them. Falsified: made unconditional, that case goes
red.

### 3. The declaration says what the field says

Reconciled against [[REQ-249]]'s shipped copy and **tied to it by test** — the
pane's exported sentences are imported and their distinctive phrases required to
appear in the declaration, so a rewrite of either turns the other red.

- **`free web address`** is the noun the model says out loud; the rule is stated
  in the overview. `domain` is now used only where a customer-owned domain is
  meant — asserted as a window around every occurrence, not as a global count.
- **Three refusals, three destinations**: taken leads to another name, reserved to
  a different word (every decoration of a kept word is kept too), invalid to a fix
  of the same name.
- **The whole host, always** — `alice.1stc.site`, never `alice`.
- **For the business, not for this site** — `claim_hostname` was framed as the
  site's address and now says what is actually enforced.
- **The race sentence** — *"went while you were deciding"*, now said the same way
  in both places.

**Two structural names were deliberately left as `hostname`** — the `absences`
headings [[REQ-238]] pins, and `hostname_label`. The rule this ticket adds is
about `domain`; `hostname` remains the declaration's own word for what the
operations are called, which the overview now says explicitly. Renaming those
headings would have broken [[REQ-238]]'s evidence for no gain.

### 4. Driving it

Twelve cases take real turns through the Worker's route table over real D1 with
the deployed schema, the Anthropic client the only double. **None of the three
address operations had ever been called through the shipped host.** This is the
first time several candidates are checked in one turn, the first time each of the
three refusals is produced, and the first time the race and the second claim exist
at all — the race is *produced* rather than described, by landing a rival's claim
in the gap between the model's check call and its claim call.

**The limit, stated:** a scripted model cannot prove that the model *chooses* to
check several candidates before speaking, or *declines* to claim when told "just
pick one". Those are properties of judgement, asked for in the declaration's
`sequences` and `absences` (both strengthened here — the *"just pick one"* case is
now answered explicitly). What the suite proves is that every one of those
behaviours is reachable and correct when taken.

## Tests

| Suite | Cases |
| --- | --- |
| `test_UAT_FC_REQ-251_the_assistant_takes_an_address.workers.test.ts` | 12 |
| `test_UAT_FC_REQ-251_the_pane_follows_the_assistant.test.ts` | 10 |
| `test_UAT_FC_REQ-251_one_set_of_rules.test.ts` | 10 |

Every claim was falsified against the bug: removing the `app.js` hook reds 4;
making `refresh` unconditional reds the half-typed-candidate case; suppressing the
host's signal reds 2; counting reads as writes reds the read-only case.

**Regression:** 527 passing across all 64 test files that import anything this
commit touched. One pre-existing failure in `test_UAT_FC_BUG-67_backend_settings`
(`rejects a malformed document at install`), confirmed failing on a clean tree
before this work and unrelated to it.

**Merge note:** [[REQ-250]] landed on `xgd-working` mid-session and also added a
method to `hostname.js` (`reveal()`). The conflict was additive and both methods
were kept; the version bump was re-based above [[REQ-250]]'s to `0.2.210`.