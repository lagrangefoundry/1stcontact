---
uid: epic-45f2e9a6
id: EPIC-7
type: epic
title: DNS checks and monitoring (start of monitoring and notification)
created_by: CHAT-48
created_at: '2026-09-12T20:49:25.030239+00:00'
updated_at: '2026-09-12T20:49:54.610298+00:00'
completed_at: null
last_field_updated: body
status: draft
fields:
  priority: medium
---

## What the client asked for

> "That could be the start of our 'monitoring' feature set. In fact maybe we
> don't need a state machine at all - the checks are cheap...maybe we have a
> regular DNS check - I guess we do need the ability to tell 'monitoring' that
> the state has changed and will expected to be wrong for [propagation interval]"
>
> "DNS checks and monitoring (start of a monitoring and notification function)"

## The principle

**Reality is compared against a declared target, on a schedule, and somebody is
told when they differ.**

That sentence is deliberately not about DNS. DNS is the first checker; the shape
outlives it.

## The state machine was considered and rejected, correctly

The original proposal was a per-domain state machine — pending, propagating,
active, error, expiring. The client's counter is right and it is the cheapness of
the checks that kills it: if you can just *look*, you do not need to remember
where you thought you were. A state machine that mirrors an observable fact is a
second source of truth that can be wrong about the first.

**One thing survives, and it is not state — it is a target.** To check DNS you
must know what the records are *supposed* to be, or monitoring can only report
what is, never whether it is wrong. So:

- **A declared target per domain**, written by the DNS management epic on every
  mutation. Config, not lifecycle.
- **A suppression window** — "I just changed this, expect wrong until T" — so a
  cutover does not fire alarms for the entire propagation interval.

That is a config row and a timestamp. It collapses the client's original items
2–5 into *"write the target, then let monitoring say when reality matches it"*,
which is also why those flows stopped needing individual completion logic.

The suppression window is the **single interface** between the DNS and registrar
epics and this one. It is specified by them and consumed here, and it is what
stops the first real customer cutover from paging somebody at 2am.

## Build the shape generically, even with one checker

The client's own framing — *"start of a monitoring and notification function"* —
is the instruction. If this is built as DNS-specific it will be rewritten the
first time anything else needs watching, and the sibling monitoring-tab epic
already names the second consumer (Google metrics).

The generic shape is three parts:

- **Target** — what should be true, and who declared it.
- **Checker** — a scheduled function that observes reality and returns a verdict.
  DNS resolution is the first. Certificate expiry, domain expiry, HTTP
  reachability and mail deliverability are all the same shape.
- **Notification** — what happens on a verdict change, with severity, routing
  (operator vs customer) and suppression.

Notification is the part most likely to be under-built, and the part that
determines whether any of this is worth having. A check nobody is told about is
a log line.

## What gets checked first

1. **Nameserver delegation** — are the domain's NS records ours yet? This is what
   turns the cutover experience from "come back later" into "done".
2. **The records we declared** — A/AAAA/CNAME for the site, and the preserved
   mail records from the DNS epic's snapshot. A record that silently reverted is
   the failure this catches.
3. **Certificate validity and expiry** — ours to renew, so ours to watch.
4. **Domain expiry**, reading the registrar epic's data. Escalating, and starting
   far earlier than feels necessary, because the recovery cost after lapse is an
   order of magnitude higher than the renewal.
5. **Mail deliverability** — SPF/DKIM/DMARC still resolving and still aligned.
   [[TODO-5]] is the case for this: on our *own* domain, two separate mail
   failures were live and nothing anywhere reported them. Once we are the ones
   who moved a customer's DNS, that silence becomes our fault.

## Routing: who hears about it

Most verdicts are for **us**, not the customer. A customer told "your DKIM
selector stopped resolving" can do nothing with it except worry. The rule:

- **Customer** hears things they can act on, or must legally know — the ICANN
  verification deadline, a failed renewal card.
- **We** hear everything else, and fix it before it becomes a question.

This is the same judgement as the DNS epic's preservation-not-confirmation rule,
applied to output rather than input.

## Boundaries

- **Declaring targets** → DNS management epic writes them; this epic only reads.
- **Renewal dates and lock state** → registrar epic owns the data.
- **The surface anyone looks at** → monitoring tab epic. This epic produces
  verdicts and notifications; it does not draw.
- **`1stc.site` apex reputation** ([[TODO-6]] §6) is a check that belongs here
  once there is anything to protect.

## Open questions

1. **Check frequency and cost** — cheap is not free at customer scale, and
   Workers have their own limits. What is the interval, and does it vary by
   check?
2. **Where does state live** — D1, or a Durable Object per domain?
3. **Flapping.** DNS during propagation is legitimately inconsistent between
   resolvers. How many consecutive failures before a verdict changes?
4. **Which resolver do we trust?** Checking against one recursive resolver tells
   you about that resolver, not about the internet.

## Children

None yet.


## Siblings

The six epics scoped together in [[CHAT-48]]. Three are surfaces and three are
capabilities, and the split is deliberate: a surface renders what a capability
computes, and never computes it a second time.

| Epic | | |
| --- | --- | --- |
| [[EPIC-4]] | Settings tab | business, site and subdomain (1stc.site) management |
| [[EPIC-5]] | DNS management | nameservers, records, and AI tools |
| [[EPIC-6]] | Registrar management | purchase, transfer, renewal |
| [[EPIC-7]] | DNS checks and monitoring | the check/notify engine | ← **this epic**
| [[EPIC-8]] | Monitoring tab | site health and site metrics |
| [[EPIC-9]] | Billing and payments | Stripe, subscriptions, invoices |

**Surfaces:** [[EPIC-4]], [[EPIC-8]], and [[EPIC-9]]'s (contested — see that
ticket).
**Capabilities:** [[EPIC-5]], [[EPIC-6]], [[EPIC-7]].

**The one cross-epic interface** is the propagation suppression window:
[[EPIC-5]] and [[EPIC-6]] tell [[EPIC-7]] *"I just changed this, expect it to be
wrong until T"*. Specified by the writers, consumed by the checker. Nothing else
crosses.

**Also see** [[TODO-6]] — `1stc.site` housekeeping, whose PSL submission has a
multi-week lead time and no shortcut, so it wants starting before any of this.
