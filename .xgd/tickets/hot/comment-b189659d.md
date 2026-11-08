---
uid: comment-b189659d
id: COMMENT-7952
type: comment
title: Comment on request REQ-666
created_by: xgd
created_at: '2026-11-07T22:47:58.645700+00:00'
updated_at: '2026-11-08T00:03:07.393685+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-fc2557ae
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "2150f243-0ed7-4fe9-ad0d-9e6417c03cb8",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="bb0c5596-e9bb-47ad-85aa-b612899cfc60-user" -->

<!-- xgd-chat role="user" ts="2026-11-07T22:47:02.946838+00:00" -->
#### You
Triggered by: martin-github@westhead.me

Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
If this bug is a dupe, please close it as wont_fix with an explanation in its body referencing the duplicate

<!-- xgd-turn id="bb0c5596-e9bb-47ad-85aa-b612899cfc60-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-07T22:51:41.767524+00:00" -->
#### Claude
Reading REQ-666 and REQ-665's landed code to plan the build. It isn't a duplicate. REQ-665 has landed (ready_to_reconcile), so its dependency is met.

Branch `free-REQ-666` is cut and the ticket is at free_coding. Next I'm mapping the checkout, order, sign-in and message code that this change touches.

Now reading the checkout page module (the framework's checkout component and its client script).

Still mapping the code. The open question is how a client site's customers sign in today, since item 4 depends on it.

I've stopped before writing any code because two parts of the ticket don't fit what's built. The branch `free-REQ-666` is cut and the ticket is at `free_coding`. It isn't a duplicate: REQ-665 has landed and nothing else covers this.

**1. Items 4–5 (signed-in customers) have nothing to hook into yet.** A client business has no signed-in customers today. Sign-in and admission only ever look people up in 1st Contact's own customer list. So someone who signs in through a client site's account box becomes a 1st Contact customer and gets 1st Contact's acceptance page. A client business's own contacts can't sign in at all, so there's no "first sign-in on a client site" to show its Terms on.
- **I recommend** moving items 4–5 to a later ticket that lands with client-site accounts (mailing lists, subscriptions, members-only content).
- **The alternative** is building client-business sign-in here. That is a separate piece of security work and much bigger than this ticket.

**2. How the privacy notice period works (item 6). I'd build it this way unless you say otherwise:**
- At publish, a material Privacy change writes the new version with an effective date 30 days ahead. 30 is a platform setting the owner can't change, pending the lawyer.
- The site keeps the current version live. That page shows "An updated version takes effect on <date>" with a link to the new text.
- The existing daily scheduled job puts the new version on the site when its date arrives.
- "We've updated our privacy notice" goes to every contact of the business with an email address. It goes out in small batches from the 10-minute scheduled job, recorded per contact, not all at once during the publish. The architecture rules forbid an unbounded fan-out inside a request.

**3. The standard documents are invisible until the module texts are published.** REQ-665's module texts (DOC-87 to DOC-116) are all still `draft`. Until you publish them, no client business has a Terms of sale or Privacy notice. When a selling site has no Terms of sale, I'd **turn Buy off** and have the Shop tab say so, rather than show a checkout line linking to a page that doesn't exist. The UATs will set up published modules themselves.

**4. Smaller calls I'll make unless you object:**
- **Legal details:** the seller-details gate reads the legal name, address and email from the business details form REQ-665 added.
- **Versions on the order:** the order records the document versions the server knows are on that site at the moment checkout starts. It doesn't trust versions sent from the page.
- **Old versions stay readable:** every published version is kept as its own fixed page on the site (e.g. `/legal/terms-of-sale/v3`). The confirmation email's link therefore keeps working after a newer version is published, and no live service is involved.
- **"Material" for edits:** when the owner saves an edited Terms or Privacy notice, the editor gets a "tell people about this change" switch. That switch marks the edit as material.

Reply with your answers, or "go with your recommendations", and I'll build 1–3, 6 and 7, plus 4–5 if you want sign-in built here.

<!-- xgd-turn id="7f9d572e-0713-4fc2-a208-90b88d36b4aa-user" -->

<!-- xgd-chat role="user" ts="2026-11-07T23:35:04.438685+00:00" -->
#### You
1. that sounds inaccurate can you check. 1stcontact is a first contact business. All businesses have exactly the same set of sign in and customer features as 1c

<!-- xgd-turn id="7f9d572e-0713-4fc2-a208-90b88d36b4aa-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-07T23:36:39.038976+00:00" -->
#### Claude
I've re-checked against the code; summary to follow. Last thing: looking for any test that shows a client business's contact getting signed in.

You were right about the design and I put it badly. Every business does have 1st Contact's customer features, and nothing in the stored data treats a client business differently:

- Contacts are one table that differs only by business (REQ-186's UAT checks Alice and Bob's rows field by field).
- An owner's invite mints the link in their own business (`router.ts:5971`, `scope.businessId`).
- The portal belongs to the business the person is a contact of (`portalBusinessId`, REQ-183 D2).

What I should have said is narrower: **sign-in can't yet tell which business someone is signing into.** That's specific code, not a missing client feature:

- **`signInTenant`** (`sessions.ts:315`) ignores the host and always returns 1st Contact's business id, the one set in the deployment configuration. Its comment says this is "where a second entry goes when customer hosts arrive".
- **`admit`** (`identity.ts:1081`) and **`sessionIdentity`** (`sessions.ts:721`) only look the person up in 1st Contact's business. Bob, invited by Alice's Plumbing, gets a valid link, but redeeming it finds no one, so he isn't let in.
- **`guardTerms`** (`terms.ts:265`) always shows 1st Contact's own Terms, Privacy and Beta Terms, whoever is signing in.

So item 4 needs two things:
1. **Sign-in resolves the right business.** The sign-in box on Alice's site would say which site it's on, the link would be minted in her business, and the login check and session lookup would use that business. The cost is that one browser can hold only one session cookie, so a person can't be signed in to two businesses at once.
2. **The acceptance gate reads that business's own documents.** Bob would accept Alice's Member terms and read her Privacy notice, with the record going to the acceptance registry on his contact. Material Terms changes (item 5) then reuse the existing "outstanding" check.

**Decision for you:** should I build the sign-in change (1) inside REQ-666? It touches the authentication core and is sizeable. The alternative is a separate ticket for it, while I build REQ-666's acceptance gate and re-acceptance against it.

Questions 2–4 from my last message still stand: the 30-day notice mechanics, turning Buy off when there's no Terms of sale, and the smaller calls. Answer those, or say "go with your recommendations", and I'll start coding. Nothing is written yet; the branch `free-REQ-666` is cut.

<!-- xgd-turn id="7f9aad1e-81a1-479f-bdd8-c3b18da9b1d3-user" -->

<!-- xgd-chat role="user" ts="2026-11-07T23:40:47.922216+00:00" -->
#### You
Do we already have an EPIC for sign in?

<!-- xgd-turn id="7f9aad1e-81a1-479f-bdd8-c3b18da9b1d3-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-07T23:41:18.551175+00:00" -->
#### Claude
No. There's no epic for sign-in, and nothing open covers letting a client business's customers sign in.

I listed every epic and searched the open tickets:

- **The sign-in work so far was done as separate requests**, not under a sign-in epic: REQ-202 (the sign-in surface), REQ-482 (land back on the page sign-in started from), REQ-200 (the account box on published sites) and REQ-475 (operator sign-in). These made sign-in work for 1st Contact's own customers only.
- **DOC-45 (site addressing, open)** defines `site_domains`, which maps a web address to a site. The comment in `signInTenant` names it as where sign-in would learn which business an address belongs to. REQ-258 built that mapping for serving published pages; nothing uses it for sign-in yet.
- **No other epic covers it.** EPIC-30 (Paperwork) and EPIC-14 (Notifications) mention sign-in only as an email they send. EPIC-29 calls the signed-in features of a client site "level 2" but doesn't plan how its customers would sign in.

So "sign-in works the same for every business" has no home today. You could open a new epic for it, or give it a request under EPIC-29, with REQ-666's member acceptance waiting on it. I'll create whichever you choose; I won't open a ticket unless you ask.

<!-- xgd-turn id="41d17100-2f19-4313-8921-ff309c583a13-user" -->

<!-- xgd-chat role="user" ts="2026-11-07T23:42:08.910881+00:00" -->
#### You
ok I think it needs an REQ that references the design please - that is an important gap that should be filled before you work on your piece - can you create that ticket?

<!-- xgd-turn id="41d17100-2f19-4313-8921-ff309c583a13-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-07T23:43:56.831634+00:00" -->
#### Claude
I'm writing the ticket now. It references the design docs DOC-40 §2.1, DOC-42 §2–3 and DOC-45 §3/§10, plus the code gap I found.

Created REQ-668. Now recording our design discussion on it and noting the dependency on REQ-666.

I created **REQ-668: "Sign-in: every business's customers sign in to that business"** (`request-cc75a2f2`). It's at `draft`, priority high, 8 points.

**The design it references:**
- **DOC-40** §2.1: the platform is a 1st Contact business, so Bob signs in to Alice's Plumbing and reaches his portal.
- **DOC-42** §2–3: there is no platform tenant, and a level is a position, not a property.
- **DOC-45** §3 (a web address leads to a site, and the site to its business) and §10 (signed-in pages on a customer's own domain).

**What's in the body:**
- **The code gap:** `signInTenant`, `admit` and `sessionIdentity` all use one business. An owner's invite link is minted in the owner's business but refused when Bob uses it, and a client site's account box can't say which business it's for.
- **Five behaviours:** sign-in uses the business of the site it started on; the link, admission and session all use that business; Bob reaches Alice's Plumbing's portal; one email address can be a separate contact in two businesses; and rate limits, single-use links, landing back where sign-in started (REQ-482) and the sign-in message (REQ-660) stay as they are.
- **A test plan** with four UATs.

**Two decisions are open in REQ-668**, each with my recommendation:
- **Where a client business's signed-in pages live.** For v1, keep them on `app.1stcontact.io` and work out the business from the site sign-in started on.
- **Whether one browser can be signed in to two businesses at once.** For v1, no: signing in to a second business replaces the first session.

It also says REQ-666 owns which legal documents a client business's contact is asked to accept.

I also recorded our discussion as a transcript comment on REQ-668. REQ-666's body now says it depends on REQ-668, which must land before items 4–5 (member acceptance and re-acceptance) are built.

I can start REQ-666's other items now (the checkout line, confirmation email copy, Buy-button gate, privacy change notices and what the consultant says), or wait for REQ-668. If I start, I'm still waiting on your answers to questions 2–4 from earlier (the notice-period mechanics, Buy off without a Terms of sale, the smaller calls), or "go with your recommendations".

<!-- xgd-turn id="93073262-2b08-4b8d-8f7c-2effbba4cc58-user" -->

<!-- xgd-chat role="user" ts="2026-11-08T00:03:01.132922+00:00" -->
#### You
Go ahead but stay in free-coding until everything is done

<!-- xgd-chat-end -->