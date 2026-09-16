---
uid: request-59caea02
id: REQ-260
type: request
title: 'Assistant DNS tools: reads, a closed set of guarded mutations, the change
  card, and undo'
created_by: EPIC-5
created_at: '2026-09-16T03:35:59.036137+00:00'
updated_at: '2026-09-16T03:35:59.036137+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: medium
  story_points: 8
  depends_on:
  - request-616e56ac
  - request-7334f1da
  epic_parent: epic-c5175c8f
  auto_merge_back: true
  needs_review: false
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

## Undo

**Snapshot the affected records before each mutation; restore on undo.** Cheap,
because the snapshot apparatus has to exist anyway for preservation, and bounded,
because an operation touches a named set of records rather than a zone.

**Two different rollbacks, and conflating them is how the easy one gets deferred
behind the hard one:**

- **Per-change undo, inside an active zone** — this ticket. What the card's
  `Undo` points at.
- **Mid-cutover rollback** — [[EPIC-5]]'s open question 3, and already narrowed:
  with the pending zone populated before the nameserver pair is shown, a *failed*
  cutover leaves the customer resolving from their old nameservers with nothing
  lost. Only a completed-then-wrong cutover needs it. **Not this ticket, and not
  blocking it.**

Undo has a horizon — a record changed three weeks and four changes ago does not
restore cleanly, and pretending otherwise is worse than refusing. Past the
horizon the honest answer is a support path.

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
- A mutation with no snapshot, and therefore no undo.
- An undo that silently does nothing past its horizon rather than saying so.
- A second external-DNS reader rather than ticket A's.
