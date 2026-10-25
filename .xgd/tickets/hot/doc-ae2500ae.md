---
uid: doc-ae2500ae
id: DOC-54
type: doc
title: 'The test gutter: how manufactured traffic is marked, hidden, and collected'
created_by: EPIC-15
created_at: '2026-09-17T04:32:20.771169+00:00'
updated_at: '2026-09-17T21:19:42.370572+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  doc_kind: architecture
  epic_parent: epic-312f9446
---


**Audience: whoever builds or reviews a write path, a read path, or a probe.** This
document carries `doc_kind: architecture`, so it is excluded from the production
system KB and is not written for the builder AI.

**Scope: the gutter, and nothing else.** [[EPIC-15]] holds the wider design — probes,
platform and per-business tiers, where monitoring executes, verdict storage. None of
that is here. What is here is everything needed to make the *existing* implementation
and the epics on deck testable, which on audit turned out to be the four mechanisms,
a run id, and one customer-facing affordance.

---

## 0. Why this exists

The product's promise is that a business's site *works* — pages served, forms
submitting, email arriving, payments taking. The only test that can prove a form works
is one that fills it in. That test writes to production: a real contact, a real
acceptance, a real event, a real message.

So the thing standing between "we can prove it works" and "we have polluted the
customer's record" is a contract about manufactured traffic. The client's framing, and
the standing rule everything below serves:

> **We are building for testability out of the gate.** Not testable once someone adds
> tests — every surface ships with the affordances a test needs, at the time the
> surface is built.

The urgency is specific and is not about monitoring. **A marker retrofitted onto
records that already exist is a marker with a hole in it.** Every read written before
the flag existed reads unfiltered, and nobody notices, because a bot lead looks
exactly like a lead. Each week this is deferred adds surfaces that will need
retrofitting.

The audit in [[EPIC-15]] §6 found the live surface is small — one flow is built end to
end — which is what makes doing this now cheap and doing it later expensive.

---

## 1. Requirements

Five, each stated as a property with the observation that would falsify it. A
requirement without a falsifier is an aspiration.

### R1 — Traffic is marked as test, in flight

Manufactured traffic carries a **signed marker** from the moment it enters the system,
on the request itself rather than on a distinct route.

- It is **unforgeable**: HMAC under a platform secret, time-bounded, verified
  server-side, never trusted from a payload alone.
- It carries a **run id** identifying the probe run that produced it (§2.2).
- It reaches any entry point — form post, inbound email, webhook — because a separate
  test route would be a second code path, and a second code path tests itself rather
  than the product.

> **Falsified by:** a request that can assert test status without the secret; a test
> that reaches the system by a route real traffic does not use.

### R2 — The data it produces is marked as test, at rest

Every record manufactured traffic creates carries the mark, and **no call site
supplies it**.

- Where a request context exists, the write layer takes it from there.
- Where one does not — an async continuation, a webhook arriving thirty seconds later
  — it is **derived from the parent record**. An event on a synthetic contact is
  synthetic because the contact is.
- There is no default of `false`. An unmarked write in a marked context is a defect,
  not a fallback.

> **Falsified by:** a record produced by marked traffic that reads as real. This is the
> worst failure in the document — see §2.9.

### R3 — Test data is excluded from every production read

Not "from the list view". From every view, count, aggregate, export, metric, feed and
AI context a customer can reach.

- **Default-deny**, structurally, at the read layer. Seeing test data requires asking
  for it by a differently-named route.
- **Notifications are suppressed**, by the rule in §2.8.

> **Falsified by:** any number, list or message a customer can reach that is affected
> by manufactured traffic.

### R4 — Test data is collected

Two passes, and the second must not depend on the first.

- **On verification**: the probe reads back what it produced, asserts, and deletes.
  Delete on pass; **retain on fail**, because the partial record is the diagnostic.
- **On a schedule**: a sweep that collects marked rows past a horizon, keyed on the
  row alone and **ignorant of run ids**.

> **Falsified by:** a marked row older than its class's timeout whose probe reached a
> terminal verdict; a sweep whose correctness depends on a run registry being intact.

### R5 — A business can delete a contact

An ordinary, customer-facing delete, removing the contact and everything filed under
them.

This is a requirement of *this* document rather than of the Contacts surface because
testability is why it is being pulled forward. It replaces a mechanism (§2.8) and it
is the same code as R4's collector (§2.7).

> **Falsified by:** a delete that leaves the event spine intact — the *"we deleted them
> but kept the history"* mistake `0001_baseline.sql` explicitly warns about.

### Non-requirements, recorded so they are not re-proposed

- **No separate test route or test handler.** R1.
- **No short-circuiting on the marker.** The mark changes what is *written* and what is
  *shown*, never what is *executed*. A path that skips work when marked is a path the
  test does not test.
- **No initiator class on the marker.** Proposed for a customer-initiated forwarding
  test and withdrawn; see §2.8.
- **No test-only database or environment for this.** Staging is [[EPIC-16]]'s and
  solves a different problem — see §4.

---

## 2. The architecture

### 2.1 The marker

A signed token on the request. Minimum payload: the **run id**, an **issued-at**, and
whatever scope limits it (site key or business). Signed with a platform secret;
verified at the boundary; rejected if unsigned, malformed, or outside its time window.

**A rejected marker does not reject the request.** It degrades to ordinary traffic and
the record is written **real**. That is the safe direction: the attack worth closing is
*marking real traffic as test*, because a caller who could do that could make a
competitor's leads vanish from their own dashboard. Refusing the submission instead
would turn a signing bug into lost customer data.

### 2.2 The run id, and why a boolean is not enough

R4 says *check the data and delete it*. That is impossible unless the probe can find
the rows it produced — and **it cannot learn them from the response**. The public
capture endpoint answers with *"the one frozen acknowledgement whatever it says"*
([[REQ-223]] §2), deliberately, so that no outcome leaks to an anonymous caller. No
identifier crosses back.

So every record a run writes carries that run's id, and both verification and
collection become *"the rows stamped `run`"*. With a boolean alone, verification is a
guess and collection degrades to a time sweep.

**What the id is: `newId('run')`, the existing minter.** The client's instinct — a
short opaque hash, never a sequence — is already the house rule, and
`tools/generate/src/store/ids.ts` is *"the one minter of opaque keys"* ([[REQ-190]]):
`<prefix>_<32 hex>`, 128 bits from a CSPRNG. Two things it settles:

- **Do not mint a shorter variant.** That module's own rule is that *"the system mints
  it stops being a property the moment there are two of them."* A second id format for
  runs would be that second minter.
- **It is deliberately not a digest.** *"A hash of the row's data is data-as-key wearing
  a disguise."* Read the client's "hash" as *opaque, fixed-length, unguessable*, which
  is what this produces — not as content-derived, which it warns against.

The one constraint this document adds: the id may travel in an email local part, so it
must be safe there. `newId`'s `[a-z]+_[0-9a-f]{32}` is — `bfm+run_<32 hex>@…` is 40
characters against a 64-character limit. If a shorter form is ever wanted for log
legibility, that is display truncation, never a second identifier.

**How it travels: inside the signed marker, everywhere a marker can ride the request.**
An earlier draft offered the reserved address as an alternative *"so the capture path
needs no extra wire field"* — **which was wrong**: the marker has to be on the request
regardless, for R1's signature check, so there is no field to save. Carrying the run id
inside the signed token is strictly better, because it is then signed: a run id cannot
be swapped for another run's.

**The reserved address carries it only where the envelope is the sole channel** — an
inbound email probe, where there is no request to attach a marker to. Not an
alternative: a different channel, with its own carrier, for the same id.

### 2.3 Where the marker enters

**`apps/public-site/src/lead.ts`**, and mechanism R1 needs no new concept there.
`RESERVED_FIELDS` already exists: wire-level machine artefacts — a honeypot trap, a
Turnstile token, the form-instance handle — stripped before anything reaches the
record, on the stated reasoning that storing them *"would put three machine artefacts
in a contact's provenance beside the words a person typed."*

The marker is exactly that kind of artefact and belongs in exactly that list. What is
new is the signature check, not the plumbing.

**The one interface change** is the RPC seam. `LeadIntakeBinding.captureLead(spec)` —
which carries `siteKey`, `formHandle`, `fields` and `submittedAt` — gains the verified
mark. [[REQ-223]] §3.2 made this an RPC entrypoint with no URL that reaches it, so the
mark cannot be injected past the boundary that verifies it.

### 2.4 The mark at rest

A **`synthetic`** column, `NOT NULL DEFAULT 0`, plus the run id. `NOT NULL` is not
tidiness: a nullable flag makes an unstamped row ambiguous under three-valued logic,
and ambiguity in a delete predicate (§2.7) is how a real contact gets collected.

**Not a field inside a JSON bag.** D1 cannot index into one, and this predicate is on
every read.

**On the contact *and* on the event — both, and therefore never a join.** A synthetic
contact implies its events, so the event column is redundant in the common case. It is
carried anyway for two reasons: the derivation below makes it nearly free, and the
alternative is a join to `users` in the hot read path to answer a predicate that every
read asks. A column is paid once at write; a join is paid on every page load.

**Migration `0013`** (0012 is the current head), across the four tables the capture
chain writes:

| Table | Written by |
|---|---|
| `users` | `people.ts` — `addContact` |
| `contact_events` | `events.ts` — `recordEvent` |
| `user_acceptances` | `acceptances.ts` — `recordAcceptance` |
| `asset_grants` | `grants.ts` — `grantFor` |

Message tickets (`messages.ts` — `sendRecordedEmail`) carry it in the ticket record.

**The derivation rule is already implemented, structurally.** `recordEvent` inserts:

```sql
INSERT INTO contact_events (id, contact_id, business_id, kind, …)
SELECT ?, u.id, u.tenant_id, ?, … FROM users u WHERE …
```

`business_id` is *derived from the contact and never supplied* — the baseline schema
states this as the reason an event cannot be filed under a business its contact does
not belong to. **`synthetic` rides the same `SELECT` as `u.synthetic`.** So R2's
hardest case — an async continuation with no request context — is answered by a
pattern already in the code rather than by a new one.

The rule in full: *in-flight mark where there is one, parent's mark where there is
not, never a default of false.*

### 2.5 Blobs

R2 storage in a bucket has no `WHERE` clause, so the mark goes in the **key, as a
reserved prefix** — not in object metadata. A prefix makes the exclusion visible in the
key, makes the sweep a prefix listing, and makes an accidental exposure greppable.

The blob sweep is therefore a listing plus a per-object timestamp check rather than a
predicate, which is different mechanics for the same rule.

### 2.6 Reads

The surface is small, and `Scope` is why.

`people.ts` holds every contact read: **`peopleOf`**, **`personOf`**,
**`personDetail`**, **`contactChangeHead`**, **`contactsChangedSince`**. They are
reached from three call sites in `router.ts` — the people list, the contact detail, and
the change poller.

Every one already takes `Scope`, a deliberately single-field interface
(`{ businessId }`) threaded through the whole application. **`Scope` grows the field**
— decided, and it amends rather than ignores that interface's written rationale, which
argues against a *discriminated union* over a second variant that will never exist, not
against a second field carrying an independent fact. Visibility is exactly such a fact:
orthogonal to which business is being read, asked by every read, and catastrophic to
forget. **The gutter rides `Scope`**,
which obtains the property `tickets.ts` describes for `forTenant` —

> *tenancy is bound into the handle, never passed per call … the scoped handle is also
> terminal*

— without inventing a second handle. That is the reason R3 is a small change rather
than a sweep, and it is the strongest available answer to the "thirty call sites,
twenty-nine of which remember" failure.

The alternative — a predicate threaded *beside* `Scope` through the same call sites —
was rejected: it reaches every place the field would have reached and relies on each
one remembering, which is the convention-not-mechanism failure wearing a disguise.

**The matrix** the client named is `builder/people-axes.js` ([[DOC-44]] §3,
[[REQ-188]]) — the Lead/Member axes. It renders from `peopleOf`'s output, so filtering
at `peopleOf` should cover it. **Confirm by test rather than by reading**: an
assumption about which reads are downstream of which is exactly what this document
distrusts.

### 2.7 Collection

**Pass one — verify and delete, and it is one statement.** The schema already
cascades: `user_acceptances`, `asset_grants` and `contact_events` each declare
`FOREIGN KEY (contact_id) REFERENCES users (id) ON DELETE CASCADE`, and the baseline
deliberately leaves `DELETE` alone on the event spine so erasure ([[DOC-37]]) can reach
it. **Deleting a synthetic contact takes the whole chain.** This is also R5's
statement, which is why they are one piece of work.

Delete on pass, retain on fail.

**Pass two — the periodic sweep, whose entire value is that it depends on none of pass
one's state.**

- **It keys on the row, never on a run registry**: `synthetic = 1 AND created_at <
  horizon`, and nothing else. The moment it joins to a table of known runs, a lost run
  row means orphans that live forever — precisely what it exists to catch. It must
  collect rows from a run nobody remembers, a probe since deleted, a run id in a format
  no longer written, or a path that stamped `synthetic` and forgot the run id.
- **Its horizon is a floor above every per-class TTL**, generously so. Human-confirmed
  probes measure their lifecycle in days, and a sweep that outran them would delete the
  evidence a probe was still waiting on. It is leak collection, not lifecycle
  management, and can afford to be slow.
- **It takes failure scaffolding once the horizon passes.** A month-old failure will
  not be debugged; the verdict survives, and the verdict is what has evidential value.

**A non-empty sweep is a bug report, not hygiene.** If pass one works, pass two takes
nothing, every time. Every row it takes means a run leaked — crashed between writing
and verifying, stamped without a run id, verification never ran. The count is a health
metric for the gutter itself and belongs somewhere visible. **Expected harvest is
zero.**

**The discipline to copy rather than reinvent** is the one cron already running
(`index.ts`'s `scheduled`, [[REQ-231]], `17 4 * * *`, sweeping sessions). Its docstring
states both halves:

> *IT REPORTS RATHER THAN RETURNS … the invocation log … is where a sweep that has
> quietly been taking nothing for a month is visible.*
>
> *IT DOES NOT SWALLOW A FAILURE. A throw here marks the invocation failed, which is
> what makes a broken sweep visible in the dashboard rather than only in a log line
> nobody reads.*

A garbage collector that silently stopped looks exactly like a system with no garbage.
That recursion is already solved here; the synthetic sweep is a second sweep in the
same handler under the same rules.

**Safety, because this is a scheduled `DELETE` holding production credentials:**

- `synthetic NOT NULL DEFAULT 0` (§2.4).
- **Bounded per invocation**, so a predicate bug leaks damage slowly rather than
  instantly.
- **Refuses an implausible harvest.** Expected count is zero-to-a-handful; a sweep about
  to take ten thousand contacts has a broken predicate, not a backlog. Stopping and
  shouting is correct and is cheaper to write than to recover from.

### 2.8 Notification suppression, and the rule that replaced an exception

**Suppression keys on the record, not on the traffic.** A notification fires because a
contact event happened; if that event is synthetic, it is suppressed, in one place —
[[EPIC-14]]'s audience resolver, since the declaration carries the mark. Traffic that
produces no contact event has nothing to decide.

This replaced an earlier design in which the marker carried an initiator class
(`platform` vs `customer`), needed because [[EPIC-5]]'s forwarding test is synthetic
traffic whose delivery to the business is the entire point. **Withdrawn**, on the
client's analysis:

> The site owner is not a contact of her own site. She is a contact of 1st Contact.

The test message is addressed *to* her business from a sender matching no contact, so
it lands where [[EPIC-13]] already sends unmatched inbound mail — *"a pending /
unidentified state in the contact list rather than a mail surface"*. It creates no
contact, no timeline entry and no metric. There is nothing to suppress, and the rule
never engages. Landing there is arguably the feature: seeing the test arrive, having
travelled the real path, is the end-to-end confidence the button exists to give.

The remaining case — a *"test my contact form"* feature, which genuinely would create a
lead on the business's own site — is handled by **R5 rather than by a mechanism**. Let
the test lead be an ordinary lead; give the business a delete button. They see
everything and clean up themselves. Transparency beats concealment: a test that leaves
no trace has to be taken on faith, while one that lands visibly and is removed proves
two things instead of one.

### 2.9 The failure this architecture cannot catch

Stated plainly so the sweep is not over-trusted.

**The sweep collects rows that were marked and not reaped. It cannot see rows that were
never marked.** A write path that stamped neither flag nor run id produced something
indistinguishable from real data, and nothing downstream will ever find it.

That is R2's failure, and it is why R2 must be *structural* — derived from context and
parent, never passed by a caller. Every other mechanism here can survive being a
convention that someone occasionally forgets. R2 cannot.

---

## 3. Implications for clients

"Client" here means a caller — the code that will have to live with this.

### If you write a record a probe can reach

Take the mark from the write layer's context, or derive it from the parent. **Do not
add a parameter for it.** A flag a caller passes is a flag a caller omits, and the
omission is silent. If your write genuinely has neither context nor parent, that is a
design problem to raise rather than a case to default to `false`.

### If you read records for a customer

You get exclusion for free, provided you read through the scoped path. If you write SQL
that reaches a gutter-bearing table without it, you have created an unfiltered read and
it will show bot traffic on a customer's screen.

**Aggregates, counts and exports are the ones that get forgotten**, because they do not
look like "views". A bot that opens and clicks 100% of thirty messages a month wrecks a
reported open rate, and the number is wrong in the flattering direction — which is the
hardest kind of wrong to notice.

### If you add a table that hangs off a contact

Add the column, and cascade from `users` as the existing three do. Without the cascade,
R4 and R5 both silently leave your rows behind.

### If you write blobs

Reserved key prefix, per §2.5. Not metadata.

### If you declare a notification

Nothing, provided you declare rather than send. The suppression is the resolver's
(§2.8). If you reach for a mailer directly you have bypassed it.

### Per epic

| Epic | State | What it inherits |
|---|---|---|
| [[EPIC-10]] Forms | done | The live surface. The capture chain is where all of this first lands. |
| [[EPIC-11]] Activity log | REQ-235 draft | **The cheapest possible moment.** `contact_events` is already written and no customer surface reads it yet. The column now is free; after the timeline is built it is the retrofit this document exists to prevent. |
| [[EPIC-13]] Email | underway | Largest future consumer. Message tickets and blobs; the forwarding test is the first customer-initiated probe. |
| [[EPIC-14]] Notifications | draft | Owns §2.8's resolver rule. |
| [[EPIC-9]] Billing | draft | New tables hang off contacts; §3 applies. Payments' own synthetic path is [[EPIC-15]]'s open question, not this document's. |
| [[EPIC-8]] Monitoring tab | draft | Renders verdicts; must not render synthetic records. |
| [[EPIC-16]] Staging/deploy | draft | Needs no gutter (separate database) but imposes a service-token auth seam on probes — [[BUG-59]]'s `SERVICE_TOKEN_IDENTITIES` already does the mapping. |

---

## 4. Sequencing

The client's order, and the reason it is not merely politeness:

**1. Get [[EPIC-10]] working and tested first.** It landed recently and is untested.
**You cannot prove guttering is transparent unless the ungutted flow is known-good** —
with the capture chain unverified, a failure after the gutter is threaded through it is
ambiguous between the two. Establishing the baseline is what makes the gutter's
assertions mean anything, because you will know the records *would* have appeared.

**2. Add the gutter.** R1–R5.

**3. Add production tests**, proving two *distinct* claims that are easy to conflate:

- **It still works** — the gutter did not break capture. A regression assertion on
  [[EPIC-10]].
- **The tests are transparent** — the gutter hid what it should. A new assertion.

**The minimal proving set is five assertions**, each falsifying a different mechanism,
so that nothing in §1 is taken on trust:

1. A marked submission **runs the full path** and produces the records — falsifies a
   short-circuit (R1).
2. Those records **appear in no customer read** — list, detail, change feed, axes (R3).
3. An event on a synthetic contact **is synthetic with no caller passing a flag** —
   falsifies R2's derivation, the leak-prone half.
4. A **forged or unsigned** marker is refused and the record is written **real** —
   falsifies the attack that matters, and §2.1's safe-direction rule.
5. Collection **removes the synthetic records and leaves the real ones** — R4, in two
   halves: verification collects and the sweep then finds nothing; and a row written
   without verification *is* taken by the sweep.

This is deliberately not a suite. It is the smallest set that leaves no mechanism
unproven.

---

## 5. Not in this document

Held by [[EPIC-15]], and none of it is a prerequisite for the above: the probes
themselves; the platform / per-business / post-deploy tiers; canary sites; where
monitoring executes and the dead-man's switch; verdict storage and history; the email
round trip; the payments synthetic path; inbox-placement measurement.

The gutter is the only part that gets more expensive by being deferred, which is the
whole of why it is separable.

---

## 6. Open decisions

**Resolved 2026-09-16, recorded here so the reasoning is not re-derived:**

- **`Scope` grows the field** (§2.6). The predicate-alongside alternative is rejected.
- **`synthetic` is on the contact and on the event** (§2.4). Both, so the read filter
  is never a join.
- **The run id is `newId('run')` and rides inside the signed marker** (§2.2); the
  reserved address carries it only where an envelope is the sole channel. The earlier
  "saves a wire field" argument for the address was wrong.

**Still open, and none of them gate the first code — they are constants better tuned
with the thing in front of you:**

1. **TTL values per probe class**, and the sweep's horizon above them. §2.7.
2. **The implausible-harvest threshold**, and whether it is absolute or a proportion of
   live rows. §2.7.
3. **Where the sweep's count surfaces** — invocation log is day one; [[EPIC-8]] is the
   eventual home if it is a gutter health metric.

---

## 7. Related

| | |
|---|---|
| [[EPIC-15]] | Basic flow monitoring — the parent, and everything in §5 |
| [[EPIC-10]] | Forms — the live surface, and step 1 of §4 |
| [[EPIC-11]] | Activity log — `contact_events`, written but not yet read |
| [[EPIC-13]] | Email — message bodies, blobs, the forwarding test |
| [[EPIC-14]] | Notifications — owns §2.8's resolver |
| [[EPIC-16]] | Staging and automated deploy — the auth seam |
| [[DOC-37]] | Erasure — R5 and §2.7 share its delete path |
| [[DOC-44]] | The Contact — the axes §2.6 must also filter |
| [[REQ-223]] | Lead capture — the RPC seam and the frozen acknowledgement |
| [[REQ-231]] | The cron whose sweep discipline §2.7 copies |
| [[BUG-59]] | `SERVICE_TOKEN_IDENTITIES` — how a machine caller gets an identity |
