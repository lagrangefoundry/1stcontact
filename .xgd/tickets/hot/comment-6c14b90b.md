---
uid: comment-6c14b90b
id: COMMENT-2612
type: comment
title: Comment on bug BUG-78
created_by: xgd
created_at: '2026-09-10T21:43:34.354314+00:00'
updated_at: '2026-09-10T22:23:19.881528+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-f6c3fedf
  kind: chat_transcript
---

<!-- xgd-turn id="a1e0ed38-410f-4e2b-b7af-13567f01ff10-user" -->

<!-- xgd-chat role="user" ts="2026-09-10T21:43:19.110475+00:00" -->
#### You
The email capture module on 1st contact homepage "Apply to join the early beta" is raising an error when I hit it it says "Could not reach the server. Please try again."

<!-- xgd-turn id="a1e0ed38-410f-4e2b-b7af-13567f01ff10-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-10T21:48:00.675529+00:00" -->
#### Claude
I've traced it. Here's what's happening.

Diagnosed. BUG-78 is written up — no code yet, because the fix is a scope decision.

**What's wrong.** The form is the `contact-form` module (`beta-form`) on the `1stcontact` home page, configured with:

```
"action": "https://app.1stcontact.io/beta-apply"
```

That address can't work, for two independent reasons:

1. **`/beta-apply` doesn't exist.** `control-app`'s router serves `/`, `/index` and `/api/*`. The string `beta-apply` appears nowhere in the repo. It was never built.
2. **`app.1stcontact.io` is entirely behind Cloudflare Access.** `client.js` sends a cross-origin JSON `fetch`, which needs a CORS preflight first. I checked it just now: the `OPTIONS` preflight comes back **403 from Access with no `Access-Control-Allow-Origin`** (and a plain `GET` 302s to the Access login origin). So `fetch()` *rejects* rather than returning a status — which is precisely the `catch` branch that prints "Could not reach the server. Please try again."

The no-JS fallback is no better: a native POST would land on the Access login redirect.

**The real gap.** This isn't specific to our homepage. There is no form-submission endpoint anywhere in the product — `public-site` answers any non-GET with 405 by construction, and `control-app` is gated. That's exactly what DOC-47 records: *"there is no 1st Contact inbox behind the form yet."* The homepage was configured as though one existed.

**Same page, same cause:** `account-chrome` is configured with `signIn: "https://app.1stcontact.io/auth/request-link"` — also a route that doesn't exist, also behind Access. The Sign in dialog will fail identically.

**How do you want this fixed?**

- **A — content only, no code.** Stop promising a destination that isn't there: an email address on the page, or point the action at a mailbox you already have. Honest today, captures nobody.
- **B — build the endpoint.** A public POST handler in `public-site` (not behind Access, and *same origin as the page*, so no preflight at all), landing the submission as a `lead` contact in that site's tenant. That's the generic enquiry-landing capability DOC-47 lists as missing; it needs spam handling (the honeypot already renders, the Turnstile mount is present but unwired) and rate limiting. This is a feature, not a bug fix — arguably its own REQ.
- **C — narrow B**, apex site only.

My recommendation: **B**, because the beta form is the one thing our own shop window exists to do and A leaves it collecting nothing — but it's genuinely bigger than a bug, so tell me whether you want it under BUG-78 or split. And say whether the sign-in URL comes with it.

<!-- xgd-turn id="9662df59-a4e2-44f4-954c-7937ca7a870b-user" -->

<!-- xgd-chat role="user" ts="2026-09-10T21:50:00.455991+00:00" -->
#### You
I think B but I don't understand C?

<!-- xgd-turn id="9662df59-a4e2-44f4-954c-7937ca7a870b-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-10T21:54:03.347630+00:00" -->
#### Claude
Fair question — let me answer that first, then get moving on B.

**C** was the same endpoint but deliberately crippled to one site: it would only accept submissions for the apex (our own `1stcontact` site, named by `APEX_SITE_KEY`), and any form on a customer's published site would still get nothing. The appeal is that it's less code — no deciding *which* tenant a submission belongs to, because there's only ever one. The cost is that it's the literalism trap: an endpoint shaped around our own homepage that has to be rebuilt properly the first time a customer wants a working contact form. Since `public-site` already resolves a site key from the URL for every request it serves, B barely costs more than C. So C isn't worth having, and you picked the right one.

Let me read the design record before I write anything.

Two things worth knowing before I write code:

<!-- xgd-turn id="da9b5eac-472d-4b88-bec3-de3db1d4dce2-user" -->

<!-- xgd-chat role="user" ts="2026-09-10T22:09:27.008813+00:00" -->
#### You
Lets take a step back and talk about requirements rather than implementation for a moment.

both the email capture form AND the sign in form are behavior modules, right? Both need to work, we built part of then because we did not have email wired up, we do now, so we need endpoints for both.

We also need appropriate security solutions so that they do not become spam relays or DOC attack surfaces.

<!-- xgd-turn id="da9b5eac-472d-4b88-bec3-de3db1d4dce2-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-10T22:11:03.186347+00:00" -->
#### Claude
Stepping back is right — and one premise needs correcting before we build on it. Let me check two things first.

Both are behavior modules, yes — `contact-form` and `account-chrome`, and both post their JSON to a URL held in module config. But they are not in the same state, and the difference changes what we have to build.

## Where each one actually stands

**Sign-in is built.** `/sign-in` exists (REQ-202) and is not a stub: CORS preflight, a per-subject rate limit of 5/hour, mail through the wired mailer and templates, and the message recorded against the contact. It was finished *after* email landed. Two things are wrong with it, neither a missing endpoint:

- the homepage config says `https://app.1stcontact.io/auth/request-link`, a route that has never existed — REQ-200 set it to `/sign-in`, and something later replaced that with an invented URL;
- in production Cloudflare Access blocks `/sign-in` at the edge anyway. I checked: `GET` → 302 to the Access login, `OPTIONS` preflight → 403. Same for `/api/email/webhook`.

**Email capture has no endpoint at all.** That one is a real build.

So the Access point deserves emphasis: there are already two routes in the codebase written to sit ahead of the gate (the delivery webhook, the four sign-in routes) and *neither is reachable in production*. Whatever we build for capture lands behind the same wall. The bypass policy is owed today, before any of this.

## The security requirement that shapes the design

The two endpoints differ on one axis that decides everything else: **does it send mail to an address the caller supplies?**

Sign-in does send mail — but `subjectFor` only resolves addresses **already in the database**, and an unknown address gets nothing, indistinguishably. That is what stops it being a relay: the worst an attacker achieves is mailing someone we already know, five times an hour. `sessions.ts` names Turnstile's absence there as a deliberate decision resting on exactly that.

Capture cannot use that defence — accepting unknown addresses *is the feature*. So I'd propose one invariant across both, rather than two rulebooks:

> **A public endpoint may only cause mail to be sent to an address the database already holds.**

Sign-in already satisfies it. Capture satisfies it by *not* mailing the submitter at all — no confirmation, no double opt-in — and by sending any notification to the business's own address, which we hold. The moment we add a confirmation email to the submitter, we have built an open relay to arbitrary victims, and it stops being fixable by rate limiting.

The rest follows from that:

- **Turnstile stops being optional for capture.** Sign-in's argument for skipping it doesn't transfer, because capture has no known-address rule to lean on. This is REQ-7's unwired mount — the markup is already rendered.
- **Rate limiting must key on something the caller cannot vary.** Sign-in counts per subject, which works because the subject pre-exists. Everything a capture submission carries is caller-chosen, so the cap has to be per site and per IP. Note the tension: a per-site cap is itself a denial-of-service against the customer — fill the bucket, real enquiries get refused — which is another reason the sharp instrument needs to be Turnstile and the cap a backstop.
- **Body and field caps enforced before parsing**, so a large body is refused rather than read.
- **One frozen acknowledgement**, so capture can't be used to test whether an address is already a contact — the property sign-in already has.
- **Submitted text never reaches mail headers**, and is escaped in any body. A form field is attacker-controlled content arriving in something we send.
- **Mail quota is a shared resource.** If every capture notifies the owner, a flood burns provider quota and the first thing that breaks is sign-in.
- **Consent provenance.** The tenant is IE, we're storing an address off a public form, and `contact_events` is append-only and already carries a `detail` blob — recording what the person was shown and when costs nothing now and is unreconstructable later.

## What I need from you

1. **Does an enquiry notify the business owner, or only appear in the contacts list?** DOC-47 warns that a form which posts nowhere visible is the worst outcome — a row in a list nobody logs into is a soft version of that.
2. **Turnstile now, or honeypot plus rate limit and accept the spam?** Wiring it needs Cloudflare keys and reopens REQ-7.
3. **Scope.** BUG-78 is currently the diagnosis. Cleanest split I see: BUG-78 keeps the two content fixes and the Access policy; the capture endpoint becomes its own REQ, since it's a capability with its own acceptance criteria. Say the word and I'll write both up — I won't file anything until you do.

<!-- xgd-turn id="8b165770-6441-4fc1-aa8e-e02e510066ad-user" -->

<!-- xgd-chat role="user" ts="2026-09-10T22:23:19.613414+00:00" -->
#### You
Unfortunately, if you read our documentation and look at the XGD draft site you will see that email capture needs to send links to the White papers, to the email address that was captured.

1. I think notifications as a feature in its own right for now just update the contact database
2. Can you tell me exactly what turnstile and honey pot do? Are these cloud flare features or new dependencies? I was expecting that Cloudflare could provide us with the necessary rate limiting etc.

Once we have clarity on these design decisions we should determine whether that is the need for additional tickets

<!-- xgd-chat-end -->