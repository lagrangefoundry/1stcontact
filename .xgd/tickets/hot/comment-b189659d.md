---
uid: comment-b189659d
id: COMMENT-7952
type: comment
title: Comment on request REQ-666
created_by: xgd
created_at: '2026-11-07T22:47:58.645700+00:00'
updated_at: '2026-11-08T17:47:07.909470+00:00'
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

<!-- xgd-turn id="3b9c8191-54d6-4490-bfe3-da2c45fe097c-user" -->

<!-- xgd-chat role="user" ts="2026-11-08T16:19:27.009809+00:00" -->
#### You
**The 1st Contact business is left out of all of this**, as REQ-665 left it: no seller check, no client documents. <-- no 1stcontact is a 1stcontact site I use the technology I built and I get the benefit of checks that I built

**No Buy block when there's no Terms of sale yet.** This differs from what I proposed earlier. REQ-665's module texts (DOC-87..116) are all drafts, so blocking would have switched off every client shop until you publish them. The checkout line just leaves out a document the site doesn't have. <-- no we have one test ecom site that needs to have documents added. Please close this gap

<!-- xgd-turn id="3b9c8191-54d6-4490-bfe3-da2c45fe097c-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-08T16:46:47.332894+00:00" -->
#### Claude
Typechecks. Now the Shop tab says when the missing Terms of sale is what's keeping Buy off:

Adding the helper call to each suite's `aShop`, just before it publishes:

Checking where the import landed in each file. A multi-line import block would break if the line went inside it:

These suites' control-app env has no BLOBS binding: the platform exemption used to skip the store read. Adding it where it's missing:

Removing the two site-side exemptions. The Paperwork pane and the Legal assistant for 1st Contact stay as they are; that's the question I'll put to you at the end.

Now moving each suite's `readyToSell` call to just after its own first publish, passing the suite's env:

All 38 pass. Now the REQ-665 and REQ-666 suites. REQ-665 has a "1st Contact business left unchanged" test that the router change could break:

Passing. With 1st Contact's details now writable, the Legal pane should show it the Business details form too. Checking how the pane builds its list:

Adding Business details to 1st Contact's Legal pane: the platform overview carries the details, and the pane shows the form whenever the overview has them.

The Legal assistant gets the same treatment: its business-details operations are offered to 1st Contact too.

Works for 1st Contact as well. Typechecking, then re-running the Paperwork suites, which have 1st Contact cases:

Everything passes. Extending the jsdom UATs: the Shop tab's no-Terms-of-sale prompt, and Business details in 1st Contact's Legal pane.

While it runs, updating the ticket body for both corrections:

As expected, 24 new failures in 10 files. They're suites that publish or preview as the 1st Contact business with no BLOBS binding, which used to skip the store. Confirming they're all BLOBS:

All 500s. Adding the BLOBS binding, which every deployment has, to the env literals in those ten suites:

REQ-148's `served_bytes` failure was in the first run too, so it predates this. Checking BUG-327's `draft_differs_indicator`:

`/api/publish/status` now includes `legal` for 1st Contact as well, and this UAT pins the exact shape. Updating it:

Passing. Now the node and jsdom tests that exercise the render's Buy logic, the Shop tab and the Paperwork pane:

Those all pass; the skipped ones are browser tests that need `pnpm test:browser`. A final check on the REQ-666 suites and the sign-in and terms suites after the router change:

All pass. Committing, bumping the version and landing on xgd-working:

Landed on xgd-working and recorded on the ticket. Cleaning up the branch:

Saving the correction as feedback for future sessions:

I've made both corrections; they're on xgd-working and REQ-666 is back at `free_coded`, now with six commits (version 0.2.822).

**1. No Terms of sale on the site, no Buy.**
- **The check:** Buy and checkout now need a Terms of sale on the published site as well as the seller details. The Shop tab says what's missing, the owner's preview says why checkout is refused, and the consultant's readiness lists "Terms of sale on your site".
- **First-publish fix:** without one, a new shop's first publish would have shown no Buy, because the Terms of sale are only written as that publish finishes. The page now checks whether it carries the Terms of sale page itself, so Buy appears in the same publish that adds them.
- **A side effect to know about:** the Terms of sale arrive at a publish, like every standard document under REQ-665. A shop that starts selling through a later Save (adding shipping, connecting Stripe) gets Buy at its next publish, not on the Save. The Shop tab says so. REQ-642 and REQ-643 each had a UAT asserting Buy on the Save alone; those now publish first.
- **For your test shop:** until DOC-87..116 are published, nothing generates a Terms of sale, so no shop shows Buy. Publish the modules and then publish the site.

**2. 1st Contact now gets the same checks as any business.**
- Its shop has the seller-details and Terms of sale checks, the checkout line, and the versions recorded on orders.
- Its sites get their legal documents built at publish, with pages, footer links and archived versions. I removed REQ-665's 1st Contact exemptions to do this.
- Paperwork → Legal now gives 1st Contact a Business details form, and the Legal assistant can set those details too.
- Its builder documents (DOC-76/77/78, accepted when signing in to the builder) are unchanged and still can't be edited there.

**Decision for you:** Paperwork → Legal for 1st Contact still lists only those builder documents, not the Terms of use, Privacy notice and Terms of sale its own sites now get. Should its pane show both sets, or should 1st Contact's sites reuse DOC-76/77 as their Terms and Privacy instead of generating their own?

**Tests:**
- REQ-666 now has 15 UATs. The new ones cover a selling site with no Terms of sale, 1st Contact getting the same checks, the Shop tab's new message, and 1st Contact's Business details form.
- A full workers run showed 24 new failures. All were suites that publish as 1st Contact without the BLOBS (ticket store) binding, which every deployment has; they pass now with it added, and one UAT pinning the exact publish-status shape now allows the new `legal` field. The other failures are the same as before this change.
- The shop suites now set up selling through a shared helper, `tests/support/shop-legal.ts` (`readyToSell`). It fills in the details through the real form write and publishes once with a one-module library.

<!-- xgd-turn id="eac009c1-45e1-4d00-affc-0b944ab728dd-user" -->

<!-- xgd-chat role="user" ts="2026-11-08T17:07:42.922277+00:00" -->
#### You
there were some updates to your requirements - please can you chececk your ticket and implement the changes

<!-- xgd-turn id="eac009c1-45e1-4d00-affc-0b944ab728dd-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-08T17:19:44.151104+00:00" -->
#### Claude
Rewriting the facts records and the publish plan without the upcoming versions:

Now rewriting the publish plan and the legal pages, with no notice period:

Now `legal-notices.ts`: the send now happens at publish, with no due date to apply, and bounced or complained contacts are skipped.

Adding migration 0059 to drop the notice-period columns and their index:

Now the message, the re-read rule and the pane. The message loses its `effective_date`:

Typechecks. Now the UATs. Reading the current privacy-change tests:

Rewriting the privacy-change UATs for the new decision: live at publish, emailed then, and suspended or bounced contacts skipped. Checking the record-and-bounce helpers first:

Writing the new privacy-change UATs:

Updating the member-acceptance UAT: a significant Privacy change now asks signed-in customers to read it again.

Running the REQ-666 suites, and the REQ-660 message suite since the trigger changed:

All pass. Re-running the shop, sign-in and publish suites against the reworked publish plan:

All pass. Updating the ticket's implementation record for item 6 to the new behaviour:

The ticket has more below the decision section. Reading the tail:

Nothing pins those texts, so I can change them directly. Updating the priming, the Legal surface overview and the portal panel:

Writing a UAT for these wording changes:

Passing. Fixing the test names to the usual `REQ-666` form, then re-running the Legal assistant suites that read the priming:

Only the consultant is over, at 201,083, the same figure as before this change; the legal role is within budget. Updating the ticket's implementation record:

Committing, bumping the version and landing:

Other work has landed on xgd-working since (it's at 0.2.825). Checking whether the merge brought in code:

Only tickets and the version came in. Bumping to 0.2.826 and landing:

I've made the changes from the ticket's two new sections. They're on xgd-working and REQ-666 is back at `free_coded` (version 0.2.826).

**No notice period for privacy changes:**
- **Live at publish:** a significant Privacy notice change now goes live at its publish, for everyone. I removed the 30-day wait completely: no waiting version, no "takes effect on" line on the site or in the Legal pane, and no scheduled swap. Migration `0059` drops the two date columns from the notices table.
- **The email:** "We've updated our privacy notice" goes out when the version is published, in batches from the existing 10-minute job. The message now says "The new version is now in effect." and no longer names a date.
- **Who gets it:** every contact with an email address, including people unsubscribed from the mailing list.
- **Who's skipped:** contacts that aren't active, and contacts whose mail bounced or who reported it as spam.
  - There is no separate "deleted" or "hidden" contact state yet, so "not active" covers suspended and removed contacts.
  - I also skip spam complaints. That matches how lead mail is suppressed today.
- **Signed-in customers** are asked to read the Privacy notice again ("I have read") at their next sign-in, but only after a significant change. A wording-only change asks nothing and sends nothing.

**Wording that had already landed:**
- **Legal assistant:** its instructions now state the significant-change rule instead of "publishing makes everyone accept again". I renamed that rule to `significant-change-rule`.
- **Portal:** the "Closing your account" panel now says payment records keep your name, email address and billing address. REQ-640's test was updated to match.

**Tests:**
- REQ-666's UATs are rewritten for the new behaviour. They cover a wording-only change sending nothing, and a significant change going live at once and reaching the unsubscribed contact but not the suspended or bounced ones. They also cover signed-in customers re-reading the Privacy notice, and a new file `test_UAT_FC_REQ-666_final_wording.test.ts` checks the new wording.
- Those pass, along with the shop, sign-in, publish, Paperwork and REQ-640 suites I re-ran.
- The prompt-budget test still fails for the consultant at 201,083 against a 191,200 budget. That's unchanged from before; the Legal assistant's prompt is within its budget.

I updated the ticket body's implementation record to match. Your question from last time is still open: Paperwork → Legal for 1st Contact lists only its builder documents, not the documents its own sites now get.

<!-- xgd-turn id="18e42f73-fe57-46ea-99bb-79d54e3dcd00-user" -->

<!-- xgd-chat role="user" ts="2026-11-08T17:31:56.436890+00:00" -->
#### You
I updated the ticket body's implementation record to match. Your question from last time is still open: Paperwork → Legal for 1st Contact lists only its builder documents, not the documents its own sites now get. <-- what is open I don't understand

<!-- xgd-turn id="18e42f73-fe57-46ea-99bb-79d54e3dcd00-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-08T17:32:32.850716+00:00" -->
#### Claude
**What's in the pane now.** 1st Contact now has two sets of legal documents, and Paperwork → Legal shows only one of them:

1. **Its builder documents.** These are the Terms of Service, Privacy Notice and Beta Terms (DOC-76/77/78). Your clients accept them when they sign in to the builder. You write them as doc tickets, and Paperwork → Legal shows them read-only, as before.
2. **Its sites' documents.** Since my change on 2026-11-08, publishing one of 1st Contact's own sites (your test shop, say) builds legal documents from the module library, exactly as it does for a client. That gives a Terms of use, a Privacy notice and, once it sells, a Terms of sale, each served on that site at `/legal/…`.

So when 1st Contact sells, its shop runs on a Terms of sale and a Privacy notice you can't see, edit or check the history of in the builder. A client business can do all of that for its own documents.

There's also a duplication. 1st Contact would have two different privacy notices: DOC-77 for builder accounts and the generated one on its sites, plus two sets of terms.

**What needs deciding is how to fix that.** Two options:

- **A. Show both sets in 1st Contact's Legal pane.** The builder documents stay read-only as now, and the site documents get Standard / Edited by you, editing and history, like a client's. This is the same technology, with no special case, but you keep two privacy notices for one business.
- **B. 1st Contact's sites use its builder documents (DOC-76/77) as their Terms and Privacy.** The module library then builds only what 1st Contact doesn't already have, which is the Terms of sale (and Member terms). The pane shows those beside the builder documents. You get one privacy notice and one set of terms for 1st Contact, at the cost of one special case: "use the hand-written document where one exists".

I'd recommend **B**. It keeps one privacy notice for 1st Contact, and the special case is narrow: it only covers documents you've already written by hand.

Until you decide, the pane works but doesn't show 1st Contact's site documents. The selling checks you asked for already apply to 1st Contact. Tell me A or B and I'll build it under REQ-666.

<!-- xgd-turn id="6921f8db-636b-431f-821c-3326c1628d11-user" -->

<!-- xgd-chat role="user" ts="2026-11-08T17:46:25.450897+00:00" -->
#### You
The answer is in your ticket body

<!-- xgd-turn id="6921f8db-636b-431f-821c-3326c1628d11-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-08T17:47:07.160971+00:00" -->
#### Claude
Sorry, I missed that. The answer is in the ticket's "Resolved 2026-11-08" section: neither A nor B.

- **One set of documents:** 1st Contact gets a single set, the standard documents plus its own added sections (DOC-120) and its Beta Terms. Its clients accept them in the builder and its sites show them. REQ-669 makes that change in one go.
- **The pane stays as it is:** it shows only 1st Contact's own documents, as a client's pane shows only theirs. The standard module texts stay in doc tickets and arrive through the build.
- **Nothing to build in REQ-666:** until REQ-669 lands, 1st Contact's sites show generated standard documents alongside the builder documents. You've accepted that while there are no clients.

So nothing is open. I've updated the one line in the implementation record that still called it an open question, so it now points to the resolution and REQ-669. That was a ticket edit only; there are no code changes, and REQ-666 stays at `free_coded`.

<!-- xgd-chat-end -->