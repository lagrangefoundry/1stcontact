---
uid: comment-6c14b90b
id: COMMENT-2612
type: comment
title: Comment on bug BUG-78
created_by: xgd
created_at: '2026-09-10T21:43:34.354314+00:00'
updated_at: '2026-09-10T22:09:27.233442+00:00'
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

<!-- xgd-chat-end -->