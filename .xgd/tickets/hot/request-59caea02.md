---
uid: request-59caea02
id: REQ-260
type: request
title: 'Assistant DNS tools: reads, a closed set of guarded mutations, the change
  card, and undo'
created_by: EPIC-5
created_at: '2026-09-16T03:35:59.036137+00:00'
updated_at: '2026-09-18T00:07:21.721987+00:00'
completed_at: null
last_field_updated: story_points
status: free_coded
fields:
  priority: medium
  story_points: 8
  depends_on:
  - request-616e56ac
  - request-7334f1da
  epic_parent: epic-c5175c8f
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-79754521
  commits:
  - working_sha: ebed8798158890038eab2d9b41f389a2ea74872d
    reconcile_sha: null
    main_sha: null
  - working_sha: 07de4ed60803296442a0f066054f18ae127984c1
    reconcile_sha: null
    main_sha: null
  version: 0.2.245
---

## What this is

**The assistant's DNS tools, the constraints that make them safe, and the undo.**

Three parts, and the order matters because only one of them is actually a safety
mechanism:

1. **Read tools** — the assistant can see a domain's live DNS and explain it.
2. **A closed set of typed mutations**, each with its safety rule in code.
3. **A card in the chat that says what is being done, in their words, with an
   undo** — and which is *not* a confirmation.

## The card is not a confirmation, and that is the whole design decision

The obvious shape is: the assistant proposes a DNS change, a card pops up, the
customer clicks accept, the change applies. The assistant cannot write directly.
That sounds safe and it is not, for a reason [[EPIC-5]] already settled in bold
about a different screen:

> *a confirmation step they cannot meaningfully perform is worse than none — it
> launders our error into their approval.*

That argument killed the pre-cutover confirmation gate. It applies unchanged one
layer down. **The operator's own statement of the problem is the decisive
evidence**: *"the user is (in general) a tech novice and honestly DNS is something
I use so infrequently and which is so arcane — I would just accept what the AI
said too."* If the person who owns the product would rubber-stamp it, a customer
certainly will, and the click records consent that was never informed. The first
time we break someone's mail, the audit trail will show they approved it. That
will be true and worthless.

**But the operator's actual reason for wanting the card was not consent** — it was
*"at least this way it's clear to the user what is going on."* That is visibility,
it is worth having, and it does not require a decision from someone who cannot
make one. So the card stays and changes what it is:

- **Not** — *Approve: add TXT `v=spf1 include:amazonses.com ~all` to
  `send.alicesplumbing.com`?* → `Yes` / `No`
- **But** — *I'm setting up email sending on your domain. Your existing email with
  Microsoft isn't affected.* → `Undo`

Present tense. Their nouns. A brake rather than a gate. It delivers the
visibility, the audit record and the commit point the undo anchors on, without
pretending the click was informed. It is *"notify in their language, do not ask in
ours"* applied to mutation.

**It also rate-limits the assistant**, which the confirmation was doing
incidentally and which is worth keeping deliberately: a card per change means six
changes are six cards, not one silent cascade.

## Where the safety actually comes from

**The constraints in code, which hold whether or not anybody clicks.** A card
prevents nothing that a confidently-worded wrong proposal would not get past.
These prevent it:

- **SPF merges, never appends.** Two `v=spf1` records on one name is a hard
  failure that breaks all mail from that name, and it is the single most common
  way this goes wrong — [[TODO-5]] records it happening to us twice, once by
  pasting a field label into the value and once by deleting a load-bearing record
  on a different name. **Same name → merge. Different names → leave both.**
  `MAIL.md:105-123` is the worked example and states the rule the same way:
  *"Merge on the apex; never delete `send.`'s."*
- **`_dmarc` only when absent, and only at `p=none`.** Never tighten a policy on
  a domain we did not start from zero. Publishing a policy on a domain that
  already sends from Mailchimp or Microsoft 365 starts binning *their* mail.
- **MX, SPF, DMARC and DKIM are privileged**: readable freely, not casually
  replaceable.
- **Every mutation writes the declared target [[EPIC-7]] checks against**, and
  opens the propagation suppression window — *"I just changed this, expect it to
  be wrong until T"*. That handoff is the one interface between these epics and
  it is specified here, consumed there.

**Build these before the card.** The card is presentation; this is the product.

## A closed set of operations, not a record editor

**We need less than "the AI can edit DNS" implies.** A general proposal
capability is an unbounded surface with an unbounded failure mode, and the changes
actually wanted are small and enumerable:

- attach a domain / enable sending — ticket C's operations, reached
  conversationally
- add a third-party verification `TXT` (Search Console, a booking system, a
  payment provider)
- point a subdomain at something the customer already runs
- repair a preservation miss — a DKIM selector the probe did not know, a record
  the sweep did not carry forward

Each is a typed operation with its own safety rule and its own sentence in the
card. **The assistant picks from the list; it does not compose record edits.**
Smaller build, and each dangerous case gets individual attention instead of one
generic guardrail standing in for all of them.

A generic *"set record of type T on name N to value V"* tool is a falsifier.

## The read half is nearly free, and the write half needs a mechanism that does not exist

`tools/generate/src/cli/ai/toolbox.ts` already has the shape: **the surface
declares the whole API and the grant narrows it** (DOC-30, `toolbox.ts:110`).
*"Read freely, cannot write"* is exactly what a grant expresses, so the read tools
need no new machinery — declare the surface over ticket A's resolver, grant the
read operations, done.

**There is no notion of a propose-don't-execute or confirmation-gated operation
anywhere in the toolbox today** — `toolbox-core.ts` has no concept of a privileged
or deferred op. That mechanism is new, and it is the bulk of this ticket. It is
worth noticing that the asymmetry runs the helpful way: the tools that let the
assistant *diagnose* a customer's DNS problem — which is the capability with the
most support value and the least risk — are the cheap ones, and they can ship
ahead of any mutation at all.

## Undo, and the state check that is the whole of its safety

**Every operation records the before-set and the after-set. Undo refuses unless
the zone still matches the after-set.** Compare-and-swap, on DNS.

**This replaces the idea of a time horizon rather than supplementing it.** An
earlier draft of this ticket said undo expires — that a record changed three weeks
and four operations ago does not restore cleanly. That is a proxy for the real
question and a bad one in both directions: a record nothing has touched for a year
reverts perfectly safely, and a record something else changed ten minutes ago does
not. **The question is not how old the change is, it is whether anything has
happened to those records since — and that is answerable exactly.** The operator's
framing is the one that holds: *"undo needs to preserve the new and the old state,
and check that the new state is what it is expecting before reverting to the old."*

The scenario it exists for is a customer returning to a year-old conversation,
pressing a button they do not remember, with four intervening changes they never
saw. Without the check that silently reverts DNS to a state that was correct a
year ago. **The check turns that from data loss into a sentence.**

### Four properties it needs to actually work

**Per-operation, and all-or-nothing.** An operation touches a *set* of records, so
the entry holds the before-set and the after-set and compares the set. **If any
one member has drifted, the whole undo refuses.** A partial revert is worse than
none — half-reverting an SPF merge yields a record that was correct at no point in
time.

**The comparison is semantic, or the feature fails the other way.** Cloudflare
normalises TXT quoting, trailing dots on `MX` and `CNAME` targets, and case. A
byte-exact compare reports drift where nothing changed, undo then refuses always,
and it is **useless rather than dangerous — which is the failure mode nobody
notices until the day they need it.** Compare normalised
`(name, type, value, ttl, proxied)`. **Not Cloudflare record ids**: a record
deleted and recreated with an identical value takes a new id and has not drifted.

**Drift does not only come from us.** The zone is in our account so the customer
cannot touch it, but three other sources can: a later operation of our own, an
operator working by hand in the dashboard — which [[REQ-257]]'s drift check already
assumes will happen — and **DKIM key rotation by Resend, which changes
`resend._domainkey` with nobody here doing anything at all.** That last one makes
the check earn its keep without any mistake having been made.

**The refusal is a sentence, not a dead end.** *"I can't undo this — your email
settings have changed since then"*, what is different, and a route to a human.
Same standard as every other customer-facing string here: their nouns, and never a
record type.

### Undo is itself a change

It writes a new entry, opens its own suppression window, and is visible on the same
surface. Otherwise the history lies about what the zone has been, and an undo
cannot be undone.

### Where the button lives

**The chat is the wrong durable home, and the year-later scenario is why.** The
check prevents corruption; it does not make *scroll back through a year-old
conversation* a path anybody takes. So the card carries `Undo` **while it is the
most recent change to those records**, and the durable home is a **DNS change
history** on the settings surface — which is also what makes the card's visibility
claim survive the chat scrolling away.

### Who may press it, and what a member sees instead

**Undo is the account holder's.** Changing the domain is already theirs — a
member who cannot attach a domain cannot un-attach one either, and the history is
readable by anyone who can see the settings pane because *seeing what was done*
is the visibility this ticket is for. A member therefore gets the list and no
button, plus the sentence saying who to ask. **No control at all rather than one
that refuses**, which is the shape the domain section above it already uses: a
button that exists only to say no teaches the customer they did something wrong
when they did not.

**The empty state is a sentence too.** A business whose domain we have never
changed reads *nothing has been changed yet* rather than an empty box, for the
same reason every other refusal here is a sentence.

**And the list is cleared before the next business's read.** One business's
history drawn under another business's heading is the one thing this pane must
never do, and a slow read during a switch is exactly how it would happen.

### Two rollbacks, and conflating them defers the easy one behind the hard one

- **Per-operation undo, inside an active zone** — this ticket, as above.
- **Mid-cutover rollback** — [[EPIC-5]]'s open question 3, already narrowed: with
  the pending zone populated before the nameserver pair is shown, a *failed*
  cutover leaves the customer resolving from their old nameservers with nothing
  lost. Only a completed-then-wrong cutover needs it. **Not this ticket, and not
  blocking it.**

## How the card gets from the change to the conversation

The card is drawn from a **signal the turn emits at the moment the change lands**,
and it is a third kind beside the two the conversation already emits for site and
business writes. The difference is what it carries:

- Those two carry a **count** — *something moved, go and re-read* — because the
  pane beside the conversation is an ordinary caller of the same routes and a
  payload it rendered instead would make the assistant the pane's writer.
- This one carries the **sentence**, because the sentence is the whole of what a
  card is. A summary rebuilt later from a record diff is a sentence nobody wrote,
  and it would be written in our nouns rather than theirs.

**One signal per change**, which is where *six changes are six cards* is actually
enforced. **A turn that only read the domain emits none** — the diagnostic half
is free and silent, and a customer who asked a question is not shown a notice
about a change that did not happen. **And the signal is machinery**: it leaves no
trace in the prose, or the client would be told the same thing twice in two
different voices.

**The pane follows the card.** The history section six inches to the left re-reads
when a change is announced and again when an undo is pressed, so the two halves of
one screen never disagree about what has been done.

**The surface is absent where there is nothing to manage.** A deployment with no
DNS credential does not compose these tools at all, rather than composing them and
refusing — the manual is projected from what is granted, so the assistant does not
know they exist and cannot propose, apologise for, or probe for them.

**A reading never carries key material.** A signing key is reported as whose it is
— the selector and the provider, which is what a diagnosis is made of — and never
as its value, which is a page of base64 that would spend the context window and
could be read out to a client by mistake.

## Not in scope

- **The nameserver-change experience, the snapshot-and-sweep for a live business**
  → ticket D, parked. This ticket's repair operations assume a zone we already
  hold and serve.
- **Whether records are still correct tomorrow** → [[EPIC-7]]. This ticket
  declares targets and opens suppression windows; that one compares reality to
  them.
- **Mid-cutover rollback** — see above.
- **How much the assistant may change unsupervised once a domain is live and
  serving a real business** — [[EPIC-5]]'s open question 2, unanswered. This
  ticket's closed operation set narrows it but does not settle it, and the card
  makes every change visible in the meantime.

## Depends on

Ticket A (the resolver and the Cloudflare client) and ticket C (the operations the
first two conversational verbs reach).

## Falsifiers

- A card that asks the customer to approve a DNS record, a record type, or a
  record value.
- A generic set-a-record tool.
- A safety rule enforced by the card rather than by code — i.e. one that can be
  bypassed by a caller that does not render a card.
- An SPF change that appends a second `v=spf1` on one name, or that deletes
  `send.`'s record while merging the apex.
- `_dmarc` written where one exists, or written at anything other than `p=none`.
- A mutation that does not write the declared target or open the suppression
  window.
- A mutation that records no before-set and after-set, and therefore has no undo.
- An undo that applies without first comparing live state to the recorded
  after-set.
- An undo that applies to the records that still match while refusing the ones
  that drifted.
- Drift decided by comparing Cloudflare record ids, or by an unnormalised string
  compare.
- An undo that expires on elapsed time rather than on drift.
- An undo refusal the customer cannot act on, or one that names a record type.
- An undo that is not itself recorded as a change.
- A second external-DNS reader rather than ticket A's.