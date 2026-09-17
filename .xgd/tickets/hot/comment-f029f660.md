---
uid: comment-f029f660
id: COMMENT-3026
type: comment
title: Comment on epic EPIC-15
created_by: xgd
created_at: '2026-09-17T02:42:17.757214+00:00'
updated_at: '2026-09-17T03:12:11.080060+00:00'
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

<!-- xgd-chat-end -->