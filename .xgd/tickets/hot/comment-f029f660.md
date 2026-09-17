---
uid: comment-f029f660
id: COMMENT-3026
type: comment
title: Comment on epic EPIC-15
created_by: xgd
created_at: '2026-09-17T02:42:17.757214+00:00'
updated_at: '2026-09-17T03:44:41.244331+00:00'
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

<!-- xgd-chat-end -->