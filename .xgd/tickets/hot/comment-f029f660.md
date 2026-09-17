---
uid: comment-f029f660
id: COMMENT-3026
type: comment
title: Comment on epic EPIC-15
created_by: xgd
created_at: '2026-09-17T02:42:17.757214+00:00'
updated_at: '2026-09-17T04:32:53.897193+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: epic-312f9446
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "92c89a37-b6fa-4aa3-8a8b-ae514426e445",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="656148ba-1f14-44b4-ab25-5f7fdc8bd38c-user" -->

<!-- xgd-chat role="user" ts="2026-09-17T02:41:35.685322+00:00" -->
#### You
Part of our contract to the user has to be that their site is guaranteed to be working. That means not just that the webpages are accessible, but that the email is delivering and receiving and the web forms are working, including payments. To this and one of our important requirements is basic flow monitoring (BFM). This epic is related to epic eight. Epic eight is the front end and visibility to the user it will contain things like Google analytics and possibly SEO/SEM statistics things like that. This ticket is the technical implementation of the site functional tests that will be running continuously. We can discuss the use of the parties such as ping but I'm not sure if those are really going to help us that much.

One of the court goals here is to design test guttering into the product from the outset (now) so that testing doesn't become an ad on later. Examples of guttering are that we want to test the white paper sign-up flow. However, we want to do it in a way that the system recognizes the traffic as test traffic and does not add it to the Contacts page, list it in the matrix etc.

Please read the chat entitled "Email receipt" - transcript is in a comment

BFM needs to be thought of as:
- platform tests - we can have a small set of example sites that demonstrate all the features of the platform
- per business tests - fewer, less frequent 
- continuous monitoring and to be run after a deployment

In that chat session I did talk about tracing email all the way to a thirdparty inbox, but that might be overkill we will have fairly sophisticated email routing capabilities it may be enough to send the email out into the world and have it come back into our system.

For these tests we will clearly need a cloud setup - maybe it should be - or some of it should be outside of Cloudflare - for obvious outage reasons

<!-- xgd-turn id="656148ba-1f14-44b4-ab25-5f7fdc8bd38c-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-17T02:48:50.776190+00:00" -->
#### Claude
I'll read the ticket and the referenced transcript first.

I have the full picture. Writing the epic now.

EPIC-15 is written up. No code changed, so no branch or commit — this is ticket content only.

**Title:** *Basic flow monitoring: synthetic traffic that proves the flows, and the gutter that hides it* · priority high · status stays `draft`.

## What I found in recon that shaped it

- **`bin/smoke` already exists** (`tools/generate/bin/smoke.mjs`, REQ-144) — post-deploy assertions against a live origin, invoked by hand at the end of `bin/deploy`. It's the right idea executed once. The epic makes post-deploy an *invocation mode* of the same probe definitions rather than a parallel implementation.
- **EPIC-7 is already the generic check/notify engine** — target → checker → verdict → notification, and it explicitly instructs "build the shape generically, even with one checker". So BFM is a checker family inside it, not a second engine. **But** BFM needs three things EPIC-7 would not build if it's built DNS-shaped: checkers that are *two-phase and async* (send now, verdict at T+4m), checkers that *write to production*, and checkers that *run off-Worker*. **That's the time-sensitive item — it costs nothing today and a rewrite if it's asked late.**
- **`tickets.ts`'s `forTenant` is the precedent for the gutter.** Tenancy here is structural — stamped on every read, and the handle is terminal, so no call site gets the chance to forget. Synthetic filtering should use exactly that mechanism, not a convention thirty views remember to apply.
- **Zero `synthetic` marker exists** in the data model today, and one cron exists (session purge). Nothing runs outside Cloudflare.

## Where I landed on your three questions

**Third parties like Pingdom** — buy the outermost layer, build the flows. They're good at the one thing we can't do (being somewhere else), which covers the dead-man's switch and genuinely-outside HTTP for £10–20/mo. They can't hold our auth, drive a six-component form chain, read a mailbox or ask Stripe about a connected account. I decomposed "outside Cloudflare" into four requirements with different prices — most execution can stay in-stack; the *alarm path* and the *heartbeat* are what must not.

**Email round trip** — your instinct is right, out-and-back into our system is enough, with one cheap caveat: a loop that starts and ends inside our infrastructure shares fate with it and can't see the last hop. One bot mailbox on a provider we don't run closes both, and gives a free lower-bound spam signal. That's one account, not the seed panel CHAT-54 was heading toward.

**"Guaranteed working"** — I recorded the honest version, since DOC-46 §5 forbids claiming what we can't back: *if your site stops working, we know before you do, and we can show you the evidence either way.* Still a real differentiator, and it makes probe history a product artifact rather than an ops log.

One correction worth flagging: **Stripe test mode is a separate environment, not a sandbox overlay on live** — you can't run a test transaction through live keys, so a synthetic payment on the real path isn't available. The epic redirects to `charges_enabled`/`requirements` per connected account, which catches the actual failure mode anyway.

**My suggestion for the first child:** the gutter primitive — `synthetic` column, signed marker, default-excluding read handle — not a probe. Six epics are waiting on the contract, and it's the thing that gets more expensive every week.

Want me to raise the three checker requirements on EPIC-7 directly, so they're visible to whoever builds it?

<!-- xgd-turn id="940106e6-c50f-430b-8dd2-5109614bf522-user" -->

<!-- xgd-chat role="user" ts="2026-09-17T03:12:10.794554+00:00" -->
#### You
One correction worth flagging: **Stripe test mode is a separate environment, not a sandbox overlay on live** — you can't run a test transaction through live keys, so a synthetic payment on the real path isn't available. The epic redirects to `charges_enabled`/`requirements` per connected account, which catches the actual failure mode anyway. <-- there's a whole discussion to have about this I don't think we should try to close the conversation down with a single sentence. We could include test credentials in production for the purposes of testing. It does open other failure possibilities but it would mean that the real code path loaded into production would get a full test service. Alternatives would be to have a test credit card loaded up and run small payments perhaps just auth and cancel. But we haven't built the payment system yet let's just take on board that we needed full synthetic test path available.

**My suggestion for the first child:** the gutter primitive — `synthetic` column, signed marker, default-excluding read handle — not a probe. Six epics are waiting on the contract, and it's the thing that gets more expensive every week. <--you are suggesting that we store the synthetic rows and just don't show them? That sounds like it could bloat. Would we garbage collect them later? What if we just didn't store the synthetics but validated they arrived some other way

<!-- xgd-turn id="940106e6-c50f-430b-8dd2-5109614bf522-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-17T03:15:17.196995+00:00" -->
#### Claude
Both are fair pushes. Let me look at the exact blocks I need to rework.

Now the edits.

Both reworked in the epic. Here's where each landed.

## Payments — reopened, not closed

Replaced with a requirement plus an open design question, framed the way you put it: *we need a full synthetic test path available*, and since nothing is built yet the useful output is a constraint that reaches EPIC-9 **before it designs credential handling**.

The one hard fact that constrains all options: test and live are separate ID spaces that can't reference each other, and they deliver webhooks with **different signing secrets** — so any design has to know which mode a request is in before it can even verify the callback.

Your two options are recorded as **complementary, not alternatives**, and they map onto the tier split the epic already has:

- **Test credentials in production, selected by the marker** — buys the most: the deployed code path runs end to end with nothing stubbed, including capture and the full webhook round trip, at zero cost so it can run at canary frequency. Costs: credential selection becomes a code path whose dangerous failure is *silent* (test key picked for a real customer → money never moves, record says it did), and it can only reach the canary tier, because test-mode objects can't reference a live connected account.
- **Auth-and-void on live keys** — and your instinct to prefer auth/cancel over charge/refund is the better call for a reason worth having explicit: **a void leaves no processing fee behind, a refund does.** It's also the only shape that can run against a *real* connected account, so it's the per-business tier's answer.

Likely resolution: A for canary, B per-business. Recorded as a recommendation for EPIC-9 to test, not a decision taken.

One consequence worth noting — this promotes the unforgeable marker from tidiness to **load-bearing for money**. It's now the only input allowed to credential selection.

## Storage — your challenge sharpened the design

The short answer is that you're right about the leak and I had it as one bullet among nine; it's now co-equal with the read filter. But *not writing* doesn't survive: **you cannot test a write path without writing.** A probe that stops before the INSERT skips constraint checks, tenancy stamping, the event append, and whatever the last migration changed — which is most of what breaks, and all of what breaks silently. And "validate some other way" isn't not-storing, it's storing *somewhere else*, which leaves the real table unexercised and creates a second write path.

The distinction that does hold is the one you were reaching for: **the transactional write** (must happen, real table, real constraints) versus **the durable historical record** (must not). So: **write real, reap hard** — scaffolding with a TTL in days, while the *verdict* is what's kept long-term. Deleting the scaffolding costs no evidence.

Then the finding that most reduces the bloat surface: **tenancy already gutters most of it.** The canary tier is a separate business with its own `tenant_id`, and `forTenant` is terminal — a customer's reads are structurally incapable of returning a canary row. Since canary is deliberately where the *high-frequency* traffic lives, the flagged-and-filtered path only ever carries the thin per-business tier, ~1 probe/business/day. Sized: 1000 businesses on a 7-day TTL ≈ 56k rows, noise against D1.

The bloat actually worth watching isn't rows — it's **R2 message bodies** and **the embedding corpus** (`knowledge.ts` embeds tickets, so a synthetic message costs money per message *and* pollutes retrieval).

Consequence for the first child: the gutter primitive is now **four** things, not three — marker, column, read handle, **and the reaper**. A marker without a TTL is a slow leak with a clean conscience.

<!-- xgd-turn id="57c1df5e-eddc-4597-b4ad-132d7e3263e6-user" -->

<!-- xgd-chat role="user" ts="2026-09-17T03:23:30.039829+00:00" -->
#### You
ok good - so we need garbage collection too. So in general:

1) standard mechanism to mark test traffic as test inflight
2) standard mechanism to mark test data (from that traffic) as test and code that adds that mark when writing the row/ticket/blob etc
3) standard rules to ensure that test data is excluded from all standard production queries
4) garbage collection that ensures that test data is cleaned up after a test is complete and the results are checked - perhaps it happens at the same time - check the data and delete it

Note: I am just about to add an epic for automated deployment that will likely use these tests. I think we will need a production environment (eventually)

<!-- xgd-turn id="57c1df5e-eddc-4597-b4ad-132d7e3263e6-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-17T03:25:37.659262+00:00" -->
#### Claude
Environments grounded: `bin/deploy` already takes `--env` (defaults to `production`), but only `[env.production]` is actually defined — the seam exists, the second environment doesn't. Now restructuring §1 around your four mechanisms.

Your four mechanisms are now the normative form of §1, quoted verbatim with what each requires in this codebase underneath. Three things came out of writing them up that weren't in my earlier version:

**Your GC refinement is better than what I had, and it replaces it.** Verify-and-delete as one step makes steady-state synthetic volume *the number of probes in flight* rather than *days of accumulated debris* — that removes the bloat question rather than managing it. But it doesn't remove the sweeper, and the two cases where it doesn't are worth designing for: **delete on pass, retain on fail** (the partial record is the diagnostic — how far the flow got is most of what makes "your form is broken" actionable), and orphans from probes that never returned a verdict at all. So: lifecycle-driven collection, time-based backstop. Falsifier: a synthetic row older than the longest probe timeout whose probe passed.

**(2) has a non-obvious half that's where a naive implementation leaks.** Async continuations have no request context — a delivery webhook arriving 30s later is a different request carrying no marker. It knows it's synthetic because the *record it attaches to* is. So the rule is: in-flight marker where there is one, parent's flag where there isn't, never a default of false. The precedent is exact — `contact_events.business_id` is already "derived from the contact and never supplied," every insert an `INSERT ... SELECT`. Same mechanism, same reason.

Also on (2): **blobs have no `WHERE` clause**, so the mark goes in the R2 key as a reserved prefix, not object metadata — which makes the GC sweep a prefix listing and an accidental exposure greppable.

**(3) and (4) turn out to be coupled in a useful way.** Since verification is a read of synthetic rows, the "show synthetic" escape hatch has *exactly one legitimate caller* — the verifier. That means any other consumer of it is a bug detectable by inspection, which is the strongest guarantee available for a rule otherwise enforced by discipline.

## On deployment and environments

Grounded this before writing it: `bin/deploy` already takes `--env`, defaults to `production`, and documents `--env staging` in its own usage — but only `[env.production]` is defined in either `wrangler.toml`. **The seam exists, the environment doesn't**, so a second one is configuration rather than architecture.

The warning I'd most want in front of the deployment epic: **staging probes cannot be the deploy gate.** Staging has different DNS, no real MX, test ESP credentials, no real connected accounts — so the flows BFM exists for are *precisely the ones that differ between environments*. Staging probes catch code regressions and are structurally incapable of catching config and integration failures. A deployment epic will be tempted to conflate them because it's much cheaper, and the failure is silent: a green gate that never tested the thing that breaks.

Corollary: **the canary tier is not a staging environment.** It's real production, real DNS, real credentials, against sites we happen to own — which is what makes synthetic traffic there both safe and meaningful. So the gate is two-phase, and only the second phase needs the rollback story.

I've added a Boundaries entry pointing deploy/rollback/progressive-rollout at your new epic, and left it unnamed since you haven't cut it yet — say the word once it has an ID and I'll link it both ways.

<!-- xgd-turn id="141fc69a-e45f-4a73-aa16-d73af5e8bc9e-user" -->

<!-- xgd-chat role="user" ts="2026-09-17T03:44:40.612604+00:00" -->
#### You
Please note the last turn of EPIC-5 it adds a nuance to our requirement for a very specific email test case. Also note EPIC-16.

What I would like you to do next is to review the existing epics and their children and the broader state of the implementation (use of epics is recent). And figure out where this Epic needs to impose requirements and modify things that have been built.

Note: I do not want to invest much time today in a comprehensive test suite. However, I do want the guttering and some minimal tests to prove that the guttering works. So our short term focus is around the placement of guttering and sufficient tests to show it performs as intended. And the urgency is to build it and insert it as a requirement before it becomes an after thought

<!-- xgd-turn id="141fc69a-e45f-4a73-aa16-d73af5e8bc9e-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-17T03:48:22.997880+00:00" -->
#### Claude
Both noted. Now the survey — epics, children, and where the write paths actually are.

Full picture. Writing the audit into the epic.

Audit is in the epic as §6. Headline: **the surface is much smaller than the epic's framing implies, because only one flow is built end to end.** Your "place the guttering, don't build a suite" scoping is realistic as a day's work.

## Where it lands

| Epic | State | What EPIC-15 imposes |
|---|---|---|
| **EPIC-10** Forms | done, REQ-240–245 reconciled | **The entire live gutter surface** — the capture chain is the only end-to-end write path in production, and it's your worked example |
| **EPIC-11** Activity log | draft, REQ-235 draft | **The best possible moment** — see below |
| **EPIC-13** Email | underway, no children | Biggest future consumer; contract applies as written |
| EPIC-16 | draft | Consumes probes; imposes an auth seam back on us |
| EPIC-9/14/8/7/6 | unbuilt | Nothing to retrofit |
| EPIC-1/4/5/12 | done | No contact-record writes — out of scope |

**EPIC-11 is the timing find.** `contact_events` is already being *written* by the capture path, and no customer surface *reads* it yet. A column now is free; a column after REQ-235 builds the timeline is precisely the retrofit this epic exists to prevent.

## Two mechanisms already exist in shape

**(1) needs no new concept.** `public-site/src/lead.ts` already has `RESERVED_FIELDS` — trap, Turnstile token, form handle — stripped before anything reaches the record, on the stated reasoning that storing them *"would put three machine artefacts in a contact's provenance beside the words a person typed."* The marker is exactly that kind of artefact. What's new is the signature check, not the plumbing.

**(2)'s derivation rule is already implemented.** `recordEvent` inserts `SELECT ?, u.id, u.tenant_id, … FROM users u` — `business_id` derived from the contact, never supplied. `synthetic` rides the same SELECT as `u.synthetic`. So the async-continuation case I flagged last turn — a webhook 30s later with no request context — is answered by a pattern already in the code.

**And the reads are few:** `peopleOf` / `personOf` / `personDetail` / `contactChangeHead` / `contactsChangedSince`, from three `router.ts` call sites. All already take `Scope`, a one-field interface threaded everywhere — so the gutter rides `Scope` and gets the `forTenant` property without inventing a handle. The matrix you named is `builder/people-axes.js`, which renders from `peopleOf`'s output, so filtering there should cover it — worth confirming by test rather than by reading.

Sized: **migration 0013, one RPC field, five write paths, five read paths.**

## The two nuances you pointed at

**EPIC-5's last turn forces the marker to carry an initiator class, not a boolean** — `platform` vs `customer`. The forwarding test is synthetic traffic whose entire point is that a human receives it. If that distinction is inferred downstream instead of signed at origin, the softening that lets the forwarding test through is the same hole a daily bot enquiry walks through.

It also breaks uniform GC: a probe waiting on a human click has a lifecycle of days, not seconds. So **TTL is a property of the probe class**, and *"no answer yet"* is a third verdict state — rendering an unread inbox red trains everyone to ignore the indicator.

**EPIC-16 §5 imposes an auth seam back on us**: staging behind Access means probes need to carry a service token. `SERVICE_TOKEN_IDENTITIES` (BUG-59) already does the mapping, so it's a seam not a build — but it has to land before the probe interface settles.

## Proposed first build

Four mechanisms at their smallest honest size, plus five assertions, each falsifying a different mechanism:

1. A marked submission runs the **full path** and produces records — falsifies a short-circuit
2. Those records appear in **no customer read** — list, detail, change feed, axes
3. An event on a synthetic contact is synthetic **with no caller passing a flag** — the leak-prone half
4. A **forged** marker is refused and the record is written **real** — the attack that matters
5. Collection removes synthetic records and **leaves the real ones**

Everything else — probes, tiers, external execution, verdict storage — waits.

I haven't cut the child ticket; this session is scoped to EPIC-15 and you've said you have enough on deck. Say the word and I'll scope it, cut the branch, and build it.

<!-- xgd-turn id="adfeeadf-978c-4a19-ba5b-dd8349f0df8b-user" -->

<!-- xgd-chat role="user" ts="2026-09-17T04:04:17.140283+00:00" -->
#### You
**EPIC-5's last turn forces the marker to carry an initiator class, not a boolean** — `platform` vs `customer`. The forwarding test is synthetic traffic whose entire point is that a human receives it. If that distinction is inferred downstream instead of signed at origin, the softening that lets the forwarding test through is the same hole a daily bot enquiry walks through. <-- you know, we may be overthinking this. The site owner in this context is not a contact. They are a contact of 1c but NOT of their site - which is where they are running the test. We have discussed a little in I think epic 13 is it the email one, about the need for a "inbox" for messages that are not associated with a contact. This test message would be an example of just that. Is it so bad if this message ends up in that bucket? I don't think so in fact it could be considered a feature it would be confidence building for the user that the system was working end to end. So maybe we can relax on this nuance.

ok so I think the next step is a design document that captures the requirements, the architectural solution and the implications for clients.

Epic 10 has landed but its still fresh and untested - I think the order of business will be to get what we have working there first and then add the guttering and create the production tests so that we can prove that it still works and that the tests are transparent to the user. 

Thoughts? Ready to draft the doc?

<!-- xgd-turn id="adfeeadf-978c-4a19-ba5b-dd8349f0df8b-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-17T04:05:57.028318+00:00" -->
#### Claude
Your analysis is better than mine. Let me check one thing before I agree in writing.

Confirmed — EPIC-13 §: *"a pending/unidentified state in the contact list rather than a mail surface, where triage is promote-to-contact."* Your argument holds exactly. Recording the relaxation.

You're right, and the withdrawal makes the design smaller rather than just looser. Recorded.

**The general rule that replaces it is better than the exception it replaces: suppression keys on the record, not on the traffic.** A notification fires because a contact event happened; if that event is synthetic, suppress it. Traffic that produces no contact event has nothing to decide. One rule instead of two marker classes, and it sits where the notification is declared rather than in the signed payload.

I also recorded what would bring the class back, so it isn't re-derived: a *"test my contact form"* feature. That one genuinely does create a lead on Alice's own site, and she plausibly *should* get the "new enquiry" notification, because that notification is most of what she's testing. Nothing on the board asks for it. One small addition to your point — the triage entry should be dismissible on confirmation, or the queue accumulates one message per config change and becomes a queue nobody reads.

## On the ordering — agreed, and for a reason worth stating

EPIC-10 first isn't just sequencing politeness. **You can't prove guttering is transparent unless the ungutted flow is known-good.** With the capture chain fresh and untested, a failure after we add the gutter is ambiguous — is it the gutter or the chain it's threaded through? Establishing the baseline first is what makes assertion #2 ("these records appear in no customer read") mean something, because you'll know the records *would* have appeared.

And your phrasing contains two distinct claims worth keeping separate in the doc: **that it still works** (the gutter didn't break capture) and **that the tests are transparent** (the gutter hid what it should). Different failures, different evidence — the first is a regression on EPIC-10, the second is a new assertion.

## Ready to draft — here's the shape I'd propose

A DOC under EPIC-15 (next id would be DOC-54), structured to your three asks:

1. **Requirements** — the four mechanisms as normative statements, each with its falsifier. Plus the two boundaries that keep scope honest: platform-initiated vs the record-keyed suppression rule above, and *"write real, reap hard"*.
2. **Architecture** — the marker's shape and signing; where it enters (`RESERVED_FIELDS` in `public-site/src/lead.ts`); the one RPC field on `captureLead`; the five write paths and how the flag reaches each (supplied at `addContact`, derived everywhere else via the `INSERT ... SELECT` pattern already in `recordEvent`); the five read paths and the `Scope` carry; migration 0013 across four tables; collection as verify-and-delete with a per-class TTL backstop.
3. **Implications for clients** — and I'd read "clients" as *callers*, since that's where the cost lands: what a new write path must do, what a new read path gets for free, what the R2 key prefix rule means for blobs, and the one genuinely invasive consequence — that `Scope` grows a second field and every construction site sees it.

Plus a short **sequencing** section carrying your ordering and the baseline argument.

Two things I'd want to settle in the drafting rather than guess:

- **Does `Scope` grow a field, or does the synthetic predicate ride separately?** Adding to `Scope` gets the `forTenant` property — impossible to forget — but `Scope` is currently a deliberate one-field interface with a written rationale for being exactly that. I lean toward adding it and amending the rationale; worth your call since it touches everything.
- **Whether the doc covers only the gutter, or the whole of BFM.** I'd scope it to the gutter — it's what's being built, and a doc covering probes and tiers would be design fiction for months. The epic already holds the wider picture.

Say go and I'll draft it. Since this session is scoped to EPIC-15 and you've been holding ticket count down, confirm you want it cut as a DOC ticket rather than appended to the epic.

<!-- xgd-turn id="17472641-b4a0-434a-b4f5-5d414597660f-user" -->

<!-- xgd-chat role="user" ts="2026-09-17T04:15:35.605175+00:00" -->
#### You
I also recorded what would bring the class back, so it isn't re-derived: a *"test my contact form"* feature. <-- short term lets not try to be clever we will give the user a "delete contact" feature - that way they see everything and clean up is their problem.

Add it to scope - I want to be clear we are building for testability out of the gate

The doc should cover everything that will be needed to build testability into the existing implementation and the epics on deck - if that is just gutters then thats all it needs to cover...

<!-- xgd-turn id="17472641-b4a0-434a-b4f5-5d414597660f-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-17T04:17:21.740823+00:00" -->
#### Claude
Let me check two things that determine whether the doc is "just gutters."

Two findings that change the design. Updating scope.

Added, and your call turns out to pay for itself twice.

**Delete-contact and the synthetic collector are the same statement.** `user_acceptances`, `asset_grants` and `contact_events` all declare `FOREIGN KEY (contact_id) REFERENCES users (id) ON DELETE CASCADE`, and the baseline deliberately leaves `DELETE` alone on the event spine so erasure can reach it. So collecting a synthetic contact *is* deleting the contact. Building the customer-facing affordance builds mechanism (4)'s collector — and a collector exercised by hand daily is one that works when the scheduler needs it.

Beyond that: it's a feature customers need anyway (mistypes, duplicates, DOC-37 erasure), and transparency genuinely beats concealment here — a customer-initiated test that leaves no trace is one she has to take on faith, whereas one that lands visibly and is hers to remove is evidence, and removing it proves a second thing works. There's no `deleteContact` today, so it's new, but small.

I've also stated *built for testability out of the gate* as a standing rule at the head of Scope rather than leaving it implicit in the gutter section — every surface ships with the affordances a test needs, at the time it's built.

## On "if that is just gutters, that's all it needs to cover"

Mostly yes — with **one genuine addition I found while checking, and it's load-bearing.**

**The gutter needs a run id, not just a boolean.** Mechanism (4) is *check the data and delete it* — which is impossible unless the probe can find the rows it produced. It can't: the public capture endpoint answers with *"the one frozen acknowledgement whatever it says"* (REQ-223 §2), deliberately, so no identifier crosses back to the caller. Every record a run writes has to carry that run's id, and then verification and collection are both "the rows stamped `run`". With a boolean alone, collection degrades to a TTL sweep and verification becomes a guess — which quietly undoes the improvement you made to GC two turns ago.

Likely transport: `bfm+<run>@<reserved domain>`, so the capture path needs no extra wire field and flows that mint no contact carry it explicitly. That's a design-doc decision; the *requirement* is the run id.

The only other non-gutter item on the board is **EPIC-16's service-token auth seam** for probing a private staging environment — already recorded, and it's a seam rather than a build since `SERVICE_TOKEN_IDENTITIES` exists.

Everything else that makes this testable is already house pattern: injectable `fetchImpl` (`resolver.ts`), the `SendEmail` port behind `mailerFor`, and the RPC seam at `captureLead`.

So the doc covers: the four mechanisms, the run id, delete-contact, the auth seam, and what each of the epics on deck inherits. That's the whole of it.

**Ready to draft.** One confirmation needed: cut it as a DOC ticket under EPIC-15 (next id DOC-54), or append to the epic? You've been holding ticket count down, so I won't create it without your say-so.

<!-- xgd-turn id="7397aeb2-504c-4882-831f-d4074525d50b-user" -->

<!-- xgd-chat role="user" ts="2026-09-17T04:21:58.176072+00:00" -->
#### You
With a boolean alone, collection degrades to a TTL sweep and verification becomes a guess — which quietly undoes the improvement you made to GC two turns ago. <-- 

Check needs a run id, agreed
Delete on success only - leave on fail - agreed
But also - can we talk about a periodic sweep that captures anything that's missed regardless of run number?

<!-- xgd-turn id="7397aeb2-504c-4882-831f-d4074525d50b-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-17T04:23:26.468666+00:00" -->
#### Claude
Yes — and it's a genuinely different mechanism from what's in there now, not a bigger version of it. The property that matters: **it must not key on the run registry at all.**

Recorded. Yes to the sweep, and the design turns on one property: **it keys on the row, never on a run registry.** `synthetic = 1 AND created_at < horizon`, nothing else. The moment it joins to a table of known runs, a lost run row means orphans that live forever — which is exactly what it exists to catch. It has to be able to collect rows from a run nobody remembers, a probe since deleted, a run id in a format we no longer write, or a path that stamped `synthetic` and forgot the run id.

**Its horizon is a floor above every per-class TTL, generously so** — the human-confirmed probes run for days, and a sweep that outran them would delete evidence a probe was still waiting on. It's leak collection, not lifecycle management, so it can afford to be slow. It takes failure scaffolding too once the horizon passes: a month-old failure won't be debugged, and the verdict survives regardless.

## The reframe worth having

**A non-empty sweep is a bug report, not hygiene.** If verify-and-delete is working, this pass takes nothing, every time. Every row it does take means a run leaked — crashed between writing and verifying, stamped without a run id, verification never ran. So the count is a health metric for the gutter itself and belongs somewhere visible. Expected harvest is zero; that's the falsifier.

## The recursion is already solved here

A collector that silently stopped looks exactly like a system with no garbage. The session-purge cron already states both halves of the answer in its docstring — it *"reports rather than returns"*, because the invocation log is *"where a sweep that has quietly been taking nothing for a month is visible"*, and it *"does not swallow a failure"*, so a throw marks the invocation failed and surfaces in the dashboard. Same handler, same discipline, second sweep.

## Safety, since this is a scheduled `DELETE` on production

- `synthetic` as **`NOT NULL DEFAULT 0`** — a nullable flag makes an unstamped row ambiguous under three-valued logic, and ambiguity in a delete predicate is how a real contact gets collected
- **Bounded per invocation**, so a predicate bug leaks damage slowly rather than instantly
- **It refuses an implausible harvest** — expected count is zero-to-a-handful, so a sweep about to take ten thousand contacts has a broken predicate, not a backlog. Stop and shout.

## One limit worth stating so the sweep isn't over-trusted

**It collects rows that were marked and not reaped. It cannot see rows that were never marked.** A write path that stamped neither flag nor run id produced something indistinguishable from real data, and no sweep will ever find it. That failure is mechanism (2)'s to prevent by being *structural* — derived from context and parent, never passed by a caller — which is the reason (2) is the one that can't be a convention.

It also gives assertion #5 two halves: run a probe, let verification collect it, assert the sweep finds nothing; then write a synthetic row, skip verification, assert the sweep takes it.

Still holding on the doc pending your call — DOC ticket under EPIC-15, or appended to the epic?

<!-- xgd-turn id="0dd06d55-d23c-424c-a490-cf3c10db3260-user" -->

<!-- xgd-chat role="user" ts="2026-09-17T04:29:44.661401+00:00" -->
#### You
Good please update the ticket and write the doc

<!-- xgd-turn id="0dd06d55-d23c-424c-a490-cf3c10db3260-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-17T04:32:53.455967+00:00" -->
#### Claude
Creating the doc.

DOC-54 created. Linking it from the epic.

Done. **DOC-54 — "The test gutter: how manufactured traffic is marked, hidden, and collected"** (`doc-ae2500ae`, `doc_kind: architecture`, child of EPIC-15). The epic is updated to carry the sweep design, the run id, delete-contact, the testability-out-of-the-gate rule, and links to the doc both ways.

## What's in the doc

**§1 Requirements** — five, each with the observation that falsifies it, because a requirement without a falsifier is an aspiration:

- **R1** traffic marked in flight — signed, unforgeable, carries a run id, rides the request not a route
- **R2** data marked at rest — derived from context or parent, never passed by a caller, no default of false
- **R3** excluded from every production read — not just list views; aggregates, exports, metrics, AI context
- **R4** collected — verify-and-delete on pass, retain on fail, plus the run-ignorant sweep
- **R5** a business can delete a contact

Plus the non-requirements, recorded so they aren't re-proposed: no separate test route, no short-circuit on the marker, no initiator class, no test-only environment for this.

**§2 Architecture** — against the code as it stands. The marker's shape and the safe-direction rule (a rejected marker degrades to real traffic rather than refusing the submission — a signing bug must not become lost customer data). The run id and why the frozen acknowledgement forces it. Entry via `RESERVED_FIELDS`, the one RPC field on `captureLead`. Migration 0013 across four tables, and the `INSERT … SELECT` derivation already in `recordEvent`. Blob key prefixes. Reads riding `Scope`. Collection in two passes with the cascade, the sweep, and the safety rules. Suppression keyed on the record, with the withdrawn initiator class recorded so it isn't re-derived.

**§2.9** states the failure the architecture *cannot* catch — the sweep collects rows that were marked and not reaped, never rows that were never marked. That's R2's failure, and it's why R2 is the one mechanism that can't be a convention.

**§3 Implications for clients** — read as *callers*, since that's where the cost lands: write a record, read for a customer, add a table hanging off a contact, write blobs, declare a notification. Plus a per-epic table. The line I'd most want read: aggregates and exports are the ones that get forgotten, because they don't look like "views".

**§4 Sequencing** — your order with the baseline argument, the two distinct claims (*it still works* vs *the tests are transparent*), and the five assertions.

**§6 Open decisions** — six, of which two matter before code: run id transport, and whether `Scope` grows a field. That second one is a real call — adding to `Scope` gets the impossible-to-forget property, but `Scope` is deliberately a one-field interface with a written rationale for being exactly that, which would need amending rather than ignoring.

Nothing is built. The epic records that the gutter work doesn't start until EPIC-10 is working and tested.

<!-- xgd-chat-end -->