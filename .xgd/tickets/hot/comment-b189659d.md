---
uid: comment-b189659d
id: COMMENT-7952
type: comment
title: Comment on request REQ-666
created_by: xgd
created_at: '2026-11-07T22:47:58.645700+00:00'
updated_at: '2026-11-08T01:33:21.512956+00:00'
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

<!-- xgd-turn id="93073262-2b08-4b8d-8f7c-2effbba4cc58-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-08T01:33:20.082051+00:00" -->
#### Claude
Going ahead with items 1–3, 6 and 7 on my recommendations. Items 4–5 wait for REQ-668. The ticket stays at `free_coding` and the work stays on the branch until everything is done. Starting with the order email and message triggers.

Design is set; now checking how the existing shop tests set up a selling business. The new Buy gate will change what that setup needs.

Checkout tests each build their own shop, so the seller-details gate means updating each one. Now checking how REQ-665's tests supply the legal module library.

The Buy gate will cover seller details only; I'll explain why when I report back. Now reading how the checkout page's controls render, to place the legal line just above the payment form.

Placing the legal line and versioned pages in the site render now. Reading the rest of REQ-665's render changes.

The design is settled; starting to code. First, the database migration for the order's document versions and the privacy-notice send queue.

Writing the migration (`0058_legal_notices.sql`) and registering it in the test database factory.

Migration done. Next, the core change in `client-legal.ts`: material flags, notice periods and archived versions.

Writing the `client-legal.ts` changes now: version material flag, upcoming versions with effective dates, archived version pages, due-date flip, and what's on the site for the checkout.

Type errors are as expected. Now the render side: archived version pages, plus the links the checkout line uses.

Adding the legal line to the checkout page now. Checking the available type roles first.

Now wiring the router: recording notices at publish, the full legal pages on rebuilds, and the owner's "tell people" flag on edits.

Writing `legal-notices.ts`. It queues privacy notices at publish, sends them in batches from the scheduled job, and puts the new version on the site when its date comes.

Now the two message changes: the new "We've updated our privacy notice" message, and the Terms of sale link plus cancellation summary in the order confirmation.

Now the confirmation email itself, in `order-emails.ts`.

Now `orders.ts`: the seller-details gate at checkout, and the two version columns written onto the order.

The control app typechecks. Next: wire the scheduled job, then the Shop tab and Legal pane changes.

Cron is wired. Now the Shop tab: it should say which seller details are missing, and warn when the Terms of sale are edited.

The Shop tab is done. Now the Legal pane: the "tell people about this change" switch on an edit, and the "takes effect on" line.

The Legal pane is done. Now item 7: what the consultant and the Legal assistant tell the owner.

Feature code is in place and typechecks. Now running the existing suites this touches, starting with REQ-665's.

REQ-665's suites pass. Next, the shop and checkout suites, which the seller-details gate is expected to break.

As expected, 40 fail. Confirming the cause is the seller-details gate and not something else:

Not the gate, as it turns out. `ticketStoreFor` throws when the BLOBS binding is missing, and these suites run without one. Checking whether a store can be opened read-only without it:

The REQ-665 publish step reads the same store, so these suites may already fail on xgd-working. Running BUG-372 in the main checkout to get a baseline:

Baseline passes, so the failure is mine. Checking where the BLOBS binding comes from in that suite:

One left: REQ-643's UAT pins the exact shape of `/api/shop/selling`, which REQ-666 extends. Updating its expectation and recording the supersession on the ticket.

Running the message, Paperwork and checkout-page suites next.

Existing suites pass (the two skipped files were skipped before my change too). Now writing REQ-666's own UATs, modelled on REQ-665's test rig.

Writing the REQ-666 suite. Checking how REQ-665's suite addresses published pages first.

Now writing the suite file.

Running the new suite:

Two pass. Debugging the first failure: Buy doesn't come back after the details are filled in and the site republished.

All five REQ-666 UATs pass. Now jsdom UATs for the Shop tab's prompt and warning and the Legal pane's "tell people" switch, modelled on existing builder tests.

The webui suites skip in a worktree because `@lagrangefoundry` isn't reachable from here. Linking it, as the setup notes say:

Now writing the builder UATs:

Both builder UATs pass. Launching the full workers and node suites in the background to look for regressions elsewhere:

While those run, I'll update the ticket body. First checking how this repo bumps its version:

Writing the implementation record into the ticket body, keeping the existing text:

Ticket body updated. Checking on the background suite runs:

While the suites run, committing the work so far to the branch:

Committed on the branch as `5055a8c44d`. Waiting for the background suites to finish:

Background check: per a memory note updated by another session, REQ-668 (sign-in per business) landed on 2026-11-08. That unblocks items 4–5. First, the suite results:

REQ-668 is on xgd-working. While the suites finish, reading REQ-668's acceptance-gate change, which items 4–5 build on:

Reading the acceptance page builder and wording:

Waiting for the suites before merging xgd-working in. A merge now would change files under the running tests.

Workers suite finished. Its failures:

325 failures, nearly all in suites far from this change (reconciliation, consultant runtime). A pattern that wide may be environmental. Reading the actual error messages to check:

These two tests build the shop inventory from `{ DB, SITES }` only, and the inventory now reads seller details from the business's store. Giving their `shopEnv` the BLOBS binding:

Same failures on xgd-working for all but two files: BUG-230 and REQ-222 pass there. Re-running those two on the branch on their own, since the full run was under parallel load:

Both pass now. The node suite has finished as well; its failures:

Counts match the baseline. A static guard can stay red with the same count while also naming a new file, so checking whether my files appear in their messages:

The `REQ-666` marker matches the worktree path in every stack trace. Rerunning the check with file names only:

No node failure names a REQ-666 file. Same check over the workers run:

Those four are already fixed. Failures that surface only as an HTTP 500 hide their stack, so one more baseline: the suites failing with 500s or 503s.

Clean merge. Refreshing the generated files, then reading how REQ-668's tests drive a client business's contact through sign-in and the gate:

REQ-668's harness has everything items 4–5 need. Checking whether any test pins the acceptance key list before I add a Member terms key:

Adding a key is safe. Writing the client business's acceptance gate (`client-terms.ts`):

`client-terms.ts` needs `legalOnSite` to return the site as well. Updating it and its caller in `orders.ts`:

Typechecks. Next, item 7's re-acceptance part: the pre-publish summary should say when signed-in customers will be asked to accept again.

Writing the UATs for items 4–5 on REQ-668's harness. Checking the site-address helper first:

Now writing the member-acceptance suite:

The starter site has nothing built yet, so there's nothing to publish. Giving Alice a seeded site with real content instead:

Progress: the acceptance itself records correctly. After it, though, requests come back with a different refusal, "1st Contact cannot open this for you". Finding where that comes from:

All three pass. Re-running the sign-in, terms gate, acceptance, portal and legal suites around this change:

No summary printed, so the run probably hit the time limit. Splitting it into two batches:

The only failure (REQ-204 `the_chrome_is_told_nothing…`) also fails on xgd-working. Second batch:

Nothing flagged. Items 1–7 are now all built, so "everything is done" holds. Updating the ticket body for items 4–5 before landing:

Committing items 4–5 on the branch:

Landing the work now. First bringing in the latest xgd-working and bumping the version:

Only tickets came in, and it still typechecks. Bumping the version, after checking that nobody has claimed 0.2.821:

Overlay check: nothing to change. Moving the ticket to `free_coded` with the four REQ-666 commits (merge commits left out):

The shell passed all four SHAs as one argument. Passing them separately:

Landed and at `free_coded`. Saving one test-harness lesson from this session to memory:

REQ-666 is built and on xgd-working, and the ticket is at `free_coded`. REQ-668's per-business sign-in landed from another session while I worked, so I built items 4–5 as well; with all seven items done, I moved the ticket on. I haven't promoted it to ready_to_reconcile; that's yours.

**What it does now:**
1. **Checkout:** one line above the payment form, "By paying you agree to our Terms of sale. See our Privacy notice.", with no tick box. Both names link to the live pages. The order records the two version uids the server knows are on the site.
2. **Confirmation email:** links the exact Terms of sale version at `/legal/terms-of-sale/v<N>`. Every published version now stays on the site as its own static page, so the link keeps working after newer versions. UK and EU buyers also get the 14-day cancellation summary (platform wording, for the lawyer).
3. **Seller details:** Buy and checkout stay off until the legal name, postal address and contact email are filled in. The Shop tab names what's missing and links to Paperwork → Legal. An edited Terms of sale gets a warning, not a block.
4. **Signed-in customers:** a client business's contact gets that business's acceptance page: Terms of use (and Member terms) to agree to, Privacy notice as "I have read". Acceptances are recorded on their contact; Member terms use a new key, `member_terms_accepted`.
5. **Re-acceptance:** asked again only when a version since the accepted one is material. Wording-only changes ask nobody, and the Privacy notice is never re-asked.
6. **Privacy changes:** a material change waits 30 days with the old version live, its page saying when the new one takes effect. The 10-minute scheduled job emails "We've updated our privacy notice" to the business's contacts in batches, once each, then puts the new version on the site. Adding a mailing list sends nothing. Owner edits have a "tell people about this change" checkbox.
7. **Assistants:** the summary the consultant must read out before publishing, and the Legal assistant's instructions, now say when a publish will email contacts or ask customers to accept again, and flag that using existing data for a new purpose usually needs consent.

**Three decisions to check:**
- **No Buy block when there's no Terms of sale yet.** This differs from what I proposed earlier. REQ-665's module texts (DOC-87..116) are all drafts, so blocking would have switched off every client shop until you publish them. The checkout line just leaves out a document the site doesn't have.
- **The 1st Contact business is left out of all of this**, as REQ-665 left it: no seller check, no client documents.
- **I changed `admit` in `identity.ts`.** After accepting their business's Terms, a client business's customer counts as a member who operates no business, which `admit` used to refuse. They are now let into their portal. A suspended contact is still refused, and they still only reach their own business's records. It's a small change, but it's in the sign-in code, so it's worth a look.

**Tests:**
- 10 new UATs pass: `test_UAT_FC_REQ-666_legal_in_use`, `_member_acceptance` and `_shop_and_legal_pane`.
- The sign-in, acceptance, portal, Paperwork, shop and REQ-665 suites pass. The one exception, a REQ-204 sign-out test, fails on xgd-working too.
- The full runs show about 325 workers failures and about 600 more in the node run, all in suites not related to this ticket. Every suite I baselined fails identically on xgd-working, and none of the failure messages name a file from this ticket.
- I updated six other tickets' UATs: REQ-643's exact `/api/shop/selling` response now includes the three new fields, and REQ-633, REQ-647, REQ-222 and BUG-230's test setups now include the ticket-store binding (BLOBS) that the seller check needs. The ticket body lists the decisions above, the behaviour each superseded ticket now has, and every UAT.

The four commits are `5055a8c44d`, `27ac75c2ca`, `2c64130b94` and `6499527fa5` (version 0.2.821). The branch has been merged and removed.

<!-- xgd-chat-end -->