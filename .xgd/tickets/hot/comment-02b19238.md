---
uid: comment-02b19238
id: COMMENT-5838
type: comment
title: Comment on epic EPIC-29
created_by: xgd
created_at: '2026-10-29T23:35:13.589538+00:00'
updated_at: '2026-11-07T23:43:47.305788+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: epic-e3db69b8
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "eae99f9b-9f22-4f66-b84e-ccecf31866e1",
  "role": "chat2",
  "backend": "claude_code+km",
  "filter_tool_use": false,
  "backend_ref": "28b440b6-1f6d-4066-a626-523574496641",
  "chat_ticket_uid": "epic-e3db69b8"
}
-->

<!-- xgd-chat role="user" ts="2026-10-29T23:35:08Z" -->
#### You
Goal: create the text for our initial T&C rollout. International beta: testers in Ireland, UK, possibly other EU states. No lawyer yet: (1) review existing companies' T&C to list conditions local regulation requires, (2) find open-source/stock T&C to start from, (3) draft from 2 informed by 1. A couple of dozen people, known personally, unpaid, so low risk. Output: a doc ticket we can copy into the site.

<!-- xgd-chat role="assistant" ts="2026-10-29T23:35:08Z" -->
#### Claude
Found the REQ-169 mechanism (versioned acceptance, builder blocked until accepted), but the text is lorem ipsum and plain paragraphs only; REQ-479's beta review clause is real. Recommended Basecamp's CC BY 4.0 policies as the free base (US-centric, needs UK/EU overlays); paid UK alternatives are Docue, Accounts-OS, Sprintlaw. Listed coverage: identity, free beta as-is, magic-link accounts, age, user content licence and rights warranty, AI disclosure (AI Act Art 50 since 2026-08-02), acceptable use, DSA notice-and-action, mandatory liability carve-outs, termination and export, governing law with consumer carve-out (Rome I), changes. Plus a separate GDPR Art 13 privacy notice. Asked about the entity and jurisdiction, consumer vs business testers, providers, and one vs two docs.

<!-- xgd-chat role="user" ts="2026-10-29T23:35:08Z" -->
#### You
Upgrade the format to MD. Start with US; for Ireland the EU rules. Drop 'and in business' (support projects and charities). Entity: Lagrange Foundry LLC. Where does a band or musician fall? Pull providers from code. Two documents, both explicitly versioned, extend acceptance to both, store all versions, with doc tickets as source of truth pulled by build scripts. Aside: our customers need T&C too; should we give them a Basecamp starting point?

<!-- xgd-chat role="assistant" ts="2026-10-29T23:35:08Z" -->
#### Claude
Keep 18+ (GDPR child-consent ages vary). A gigging band or working musician is a trader; a hobby band or personal project is a consumer; a charity isn't a consumer. So write consumer-safe terms throughout. GDPR applies via Art 3(2); Art 27 representative exemption arguable, flag for lawyer. Providers from code: Cloudflare, Anthropic, OpenAI (images), fal.ai (video), Resend; fonts self-hosted. Proposed mechanism: one doc ticket per published version, build bundles all versions, /terms /privacy plus /<version> archive, safe MD renderer, one interstitial ('agree to Terms, have read Privacy Notice', since privacy is not consent), append-only legal_acceptances table replacing tos_* columns. Customer side: not Basecamp (wrong shape); generate privacy notice, business-identity notice and later sales terms from structured site facts. We are the clients' processor, so our terms need Art 28 terms.

<!-- xgd-chat role="user" ts="2026-10-29T23:35:08Z" -->
#### You
California. Yes, client photos go to both OpenAI and fal. Yes, feedback goes to GitHub. Create an EPIC for this area including customer T&C/Privacy: standard terms they can add to or replace, modular based on the features the site uses.

<!-- xgd-chat role="user" ts="2026-10-29T23:52:41Z" -->
#### You
Address c/o California Registered Agent Inc., Sacramento. legal@ is fine. Retention must be fully automated if promised. Beta terms as a third doc.

<!-- xgd-chat role="assistant" ts="2026-10-29T23:52:41Z" -->
#### Claude
No deletion epic exists (DOC-37 is design only), so drafts promise on-request deletion within one month only. Filed DOC-76 Terms, DOC-77 Privacy, DOC-78 Beta Terms; REQ-488 updated for three documents and withdrawal.

<!-- xgd-turn id="8bd4106b-a6a6-4dbe-845a-1ac9d789514a-user" -->

<!-- xgd-chat role="user" ts="2026-10-30T00:36:46.759618+00:00" -->
#### You
Do you have REQ-448 as a child?

I want to agree on the expected functionality here. This is fairly complicated.  I would like you to be responsible for the legal documents and associated user experience and automation.  As with all our functionality here in first contact we have two levels of user. Well three if you include me and my employees.  Me and my employees are first contact operators we are level zero users  The customers of first contacts are level one users  The users of our customers sites, the customers of our customers are level two users.  Many of our requirements apply almost identically for level one and level two customers.  One of the things that you are going to be responsible for is the presentation of the terms and conditions, the acceptance of the terms and conditions and the storage of the acceptance. Note that a user accepts a particular version of the documents that they are presented with and if we upgrade the document they need to be prompted to accept again. Users who have not accepted the terms and conditions cannot use the product functionality.  This same mechanism should apply for level two customers just as it does to level one customers.  Additionally for level one customers we will create a mechanism to automatically generate a simple first draft of their terms and conditions and privacy statement based on the functionality that they are using and the regions that they are in.  The mechanism that we are describing should allow support for additional documents, for example during the beta phase we will need to support acceptance of the beta terms  In the short term the requirements are to support terms and conditions a privacy statement and the beta test terms so three documents as they said we stole the version that is being supported the page presenting the terms and conditions should show links to each of these documents and check boxes next to the links clicking on the link will open the document. These are marked down documents. The viewer for the documents also has a checkbox to allow the document to be accepted.  This is the standard format that is presented to level two users. Although note that there is no beta terms for level two users. The acceptance of level two users needs to be stored as well.   The final piece of functionality that I have in mind for this epic is to create the technology to automatically delete account data 30 days after a user has left the site. The ability to delete an account already exists so this should not be too difficult. Once we have implemented it we need to put the information that this will happen into the terms and conditions.  Short term we are interested in terms and conditions for the beta test customers that is our priority. The other functionality we can work through and create closer to the time.

<!-- xgd-cli-session ts="2026-10-30T00:42:05Z" model="claude-opus-5-5" continued_from="dashboard" -->
*Captured by CLI Claude — paraphrased reconstruction from session memory, not raw capture.*

<!-- xgd-chat role="user" ts="2026-10-30T00:42:05Z" -->
#### You
Asked whether REQ-448 is a child. Set scope: three user levels (L0 operators, L1 clients, L2 clients' customers). Epic owns presentation, acceptance and storage of versioned documents for L1 and L2 alike; a new version forces re-acceptance; no acceptance means no product functionality. Extensible document set (Terms, Privacy, Beta now; no Beta Terms at L2). Acceptance page: a link and checkbox per document; the Markdown viewer has an accept checkbox too. Later: generated first-draft client T&C/privacy by features and regions; automated deletion 30 days after a user leaves (deletion assumed to exist), then stated in the terms. Priority: beta terms for L1.

<!-- xgd-chat role="assistant" ts="2026-10-30T00:42:05Z" -->
#### Claude
REQ-448 is not a child (it is the design-system request under another epic); the only child is REQ-488. Recorded the agreed scope in EPIC-29 and changed REQ-488's interstitial to the per-document checkbox page, built as one component reusable at L2. Correction: account deletion is not built; the portal's Delete account control only explains erasure (REQ-183 §4.2) and DOC-37 is design only, so automated deletion is new work. L2 gating applies to signed-in portal features; public forms stay login-free (DOC-5 #22). Open: what 'left' means for the 30-day clock, and whether L2 erasure follows the same rule given we are the client's processor.

<!-- xgd-turn id="8bd4106b-a6a6-4dbe-845a-1ac9d789514a-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-30T00:42:21.775888+00:00" -->
#### Claude
Checking whether account deletion really exists already (the portal comment suggests it doesn't).

Epic updated. Now aligning REQ-488's acceptance page with the checkbox design you described.

**REQ-448 is not a child of this epic.** It's the design-system request and belongs to another epic. EPIC-29 has one child, **REQ-488**, the legal-documents mechanism. You may have meant that one, since the numbers are close.

I've written the scope you described into EPIC-29 and changed REQ-488 to match. Here's what's now recorded, so you can confirm or correct it:

**Three levels of user**
- **Level 0:** you and your staff.
- **Level 1:** your clients.
- **Level 2:** your clients' customers.
- Levels 1 and 2 use the same mechanism; only the set of documents differs.

**1. Versioned acceptance (levels 1 and 2)**
- Each business has a list of required documents, stored as data so documents can be added or withdrawn.
  - Level 1 today: Terms, Privacy Notice and Beta Terms.
  - Level 2: the client's own Terms and Privacy Notice, with no Beta Terms.
- A user accepts a specific version of each document. Publishing a new version makes them accept again.
- Until they have accepted every current version, the product is blocked:
  - Level 1: the builder.
  - Level 2: the signed-in parts of a client site (the portal). Public contact forms stay login-free, as the architecture policy requires, so a visitor can always send an enquiry.
- Every acceptance is stored at both levels: who, which exact version, when, and the wording shown. This builds on the acceptance records from REQ-240, which already work for both your clients and their customers, so there's no second system.

**2. The acceptance page (same at both levels)**
- Each document is a link with a checkbox next to it.
- The link opens the Markdown document in a viewer that has its own checkbox. Ticking either one ticks both.
- Continue only works once every box is ticked.
- The Privacy Notice box says "I have read", not "I agree", because our legal basis for using people's data isn't their consent.
- REQ-488 builds the page and viewer as one component that level 2 can reuse later, but only ships the level 1 use now.

**3. Generated first drafts for clients (later):** draft Terms and Privacy Notice based on the features the site uses and the regions the client works in. The client can add to them or replace them, and the published result becomes that site's level 2 document set.

**4. Automated deletion after 30 days (later) — one correction:** account deletion is **not built yet**. The portal's "Delete account" button only explains what deletion means and how to ask for it, and DOC-37 is a design only. So this is new work: real deletion first, then the 30-day scheduled job, and only then a new version of the Terms that promises it.

**Priority:** the level 1 beta now, which means REQ-488 plus the drafts DOC-76, DOC-77 and DOC-78. Everything else comes later.

Two questions are recorded on the epic:
1. **What counts as "left the site", so the 30-day clock can start?** Only when someone closes their account? Or also a beta account that goes inactive, or is never used, after some period?
2. **Deletion for level 2:** for client sites we handle the data on the client's behalf, so the client decides what happens to it. Should the same 30-day rule apply to their customers by default?

<!-- xgd-turn id="6b3120b7-bc84-4819-afba-c8f3a5b795ed-user" -->

<!-- xgd-chat role="user" ts="2026-10-30T00:45:03.576893+00:00" -->
#### You
1. Account closing - I don't know if we even have a UI for that today
   2. Yes keep it simple - one day we may get a user who wants 90 days and then we can implement it for them

<!-- xgd-chat role="user" ts="2026-10-30T00:45:28Z" -->
#### You
1. Account closing: not sure there is a UI for that today. 2. Yes, keep it simple: same 30 days at level 2; if a client one day wants 90 days we implement it for them.

<!-- xgd-chat role="assistant" ts="2026-10-30T00:45:28Z" -->
#### Claude
Confirmed no close-account control exists: the portal panel says it does not close the account and to ask us. Recorded: the 30-day clock starts when the user closes their account; workstream 4 = close-account control + DOC-37 erasure + 30-day job, with panel copy changed alongside. Level 2 uses the same fixed 30 days; no per-client setting until asked.

<!-- xgd-turn id="6b3120b7-bc84-4819-afba-c8f3a5b795ed-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-30T00:45:37.225023+00:00" -->
#### Claude
Confirmed: the portal has a "Closing your account" panel, but it says "This page does not close your account on its own. Ask us and we will do it." Recording the answers in the epic now.

I've recorded both decisions on EPIC-29 in place of the open questions:

1. **There's no way to close an account in the product today.** The portal has a "Closing your account" panel, but it says "This page does not close your account on its own. Ask us and we will do it." So the 30-day clock starts when a user closes their account, and inactivity alone never starts it. Closing removes access straight away; the data is deleted 30 days later. That means the deletion work needs three pieces:
   - a real close-account button in the portal;
   - code that actually deletes the account's data (DOC-37 is only a design so far);
   - a scheduled job that runs that deletion 30 days after closing.

   The panel's wording changes in the same piece of work, so it never promises more than the code does.

2. **Level 2 uses the same 30 days for every client**, with no per-client setting. If a client ever wants 90 days, we add it for them then.

This is all later work. Nothing changes for the beta: the draft documents still promise only deletion on request within one month. The current priority is still REQ-488 and the three draft documents (DOC-76, DOC-77, DOC-78).

<!-- xgd-turn id="d4d82655-fe20-44d1-a998-0237dd102289-user" -->

<!-- xgd-chat role="user" ts="2026-10-31T17:57:03.406483+00:00" -->
#### You
Can we add something to the Terms on abusive behavior? I am thinking of the Alex Jones campaign against the Sandyhook parents. Doxing, bullying etc should not be permitted

<!-- xgd-turn id="d4d82655-fe20-44d1-a998-0237dd102289-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-31T18:01:50.363652+00:00" -->
#### Claude
Drafting the new clause into the Terms now; it adds a section on harassment, bullying and doxing.

Now I'll note it on the epic.

I've added a section on harassment, bullying and doxing to the Terms. It's in a new version, **DOC-80 (Terms of Service 2026-10-31)**, which I've left as a **draft**. The published 2026-10-30 version (DOC-76) is unchanged, because users accept one specific version and the Terms promise that every past version stays available.

**What's new in section 6, "Things you must not do":** a subsection saying 1st Contact is for presenting yourself or your organisation, not for attacking other people. It bans using your site, its forms, the emails it sends or the AI assistants to:
- harass, bully, threaten or intimidate anyone, or encourage or organise other people to do it;
- **dox** anyone: publish someone's home address, phone number, workplace, school, family or other personal details, or piece them together from different sources, to expose, find or target them;
- **target a real person with false claims.** The example is the Sandy Hook pattern, written without naming it: telling people that the victims or bereaved families of a tragedy are lying, are actors, or staged it;
- **send people after someone**, by urging visitors to contact, confront, follow or investigate a particular private person;
- publish intimate images of anyone without their consent;
- demean someone because of who they are, such as their race, religion, sexual orientation or disability.

It also says:
- **AI-made material counts too.** The ban applies whether you write the material yourself or ask an AI assistant to make it.
- **Criticism stays allowed.** Honest reviews, fair criticism, satire and public-interest reporting are fine, including about businesses and public figures. "Turning your site against a person is not."
- **We can act at once.** For harassment and doxing we may remove the content or suspend the account straight away and talk to the user afterwards, instead of warning first. We may close the account if the breach is serious or repeated.

**Section 7** is now "Reporting illegal or abusive content". Anyone can report content that breaks section 6. Someone who is being harassed, or whose personal details have been published, doesn't need to show that it's illegal, and we deal with their report first.

I've noted DOC-80 on EPIC-29.

**Decision for you:** publishing DOC-80 (changing its `legal_status` to `published`) makes every level 1 user accept the Terms again. If no beta user has accepted the 2026-10-30 version yet, I can put this text into DOC-76 instead and delete DOC-80, so no one has to accept twice. Which do you want?

<!-- xgd-turn id="e2be13e2-f36b-4758-9853-06d5cfe387f0-user" -->

<!-- xgd-chat role="user" ts="2026-11-03T18:04:33.394171+00:00" -->
#### You
Please review the transcript of EPIC-9 and its notes on your ticket. we have firmed up some decisions about content deletion and cancellation that need to be added to the ToS can you update them creating a new version please? Will that propagate to the site with bin/build and bin/deploy? Will customers who have already accepted be asked to sign the new ToS?

<!-- xgd-turn id="e2be13e2-f36b-4758-9853-06d5cfe387f0-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-03T18:07:58.924151+00:00" -->
#### Claude
Reading EPIC-9's decisions and REQ-640's spec for the Terms, then I'll draft the new version and check how publishing reaches the site.

Now drafting. First checking DOC-37's exact deletion timing, since EPIC-9's transcript and REQ-640 word the 30-day clock slightly differently.

Drafting the new Terms version now: DOC-80's text plus the EPIC-9 deletion, retention and cancellation changes.

Section numbering is unchanged, so references from the Beta Terms still hold. Creating the new draft version ticket.

Now recording it on EPIC-29 (appending, existing body kept).

I've written the new Terms of Service version as **DOC-84 (Terms of Service 2026-11-03)** and left it as a **draft**. It contains everything from DOC-80, including the harassment and doxing section, plus the deletion and cancellation decisions from EPIC-9. DOC-80 is now replaced. It was never published, so nobody accepted it; it stays a draft and should never be published. Section numbers are unchanged, so the Beta Terms' references to them still work.

**What's new:**
- **Section 8 (your site's own legal duties):**
  - Payments taken through a client's site go through the client's own Stripe account.
  - We keep our own record of each of those payments for disputes.
  - There's a sentence clients can put in their own privacy notice to tell buyers this.
  - Subscriptions a client sells are on the client's own terms.
- **Section 9, point 7 (handling a client's customer data):**
  - Deleting a contact, or closing the account, is the client's instruction to delete. The information is hidden at once and deleted 30 days later.
  - The exception is payment records. We keep them for 7 years as the controller of our own copy, with the buyer reduced to name and billing address, and use them only for disputes and legal requirements.
- **Section 12, new part on closing an account:**
  - Nothing renews, and a term already paid for runs to its end.
  - The account is hidden when it's closed, or when the paid term ends if that's later.
  - Content is deleted 30 days after that.
  - Payment records, both what the client paid us and their own sales, are kept for 7 years from each payment. Clients are offered an export of their sales records before closing.
  - Deletion can be delayed while a dispute, chargeback or unpaid balance is open. The reason is recorded and reviewed at least every 180 days.
  - Domains are kept until they're transferred out or lapse.
- **Section 12, new part on cancelling a paid plan:**
  - Outside a cooling-off period, cancelling stops renewal and there's no refund.
  - Inside one, the plan ends at once and the unused part is refunded automatically. The periods are the first 14 days, 14 days after each renewal of a plan of a year or more, and 14 days after a trial converts to paid.
  - The cooling-off periods apply to everyone, and any extra rights a user has under local law are kept.

I've noted all this on EPIC-29.

**Your questions:**

1. **Does it reach the site with `bin/build` and `bin/deploy`?** Yes, but only once you publish it. `bin/build` reads the legal document tickets and bundles every published version; drafts are skipped. So set DOC-84's `legal_status` to `published`, then build and deploy. When you do, change its `legal_version` to the actual publication date.

2. **Will people who already accepted have to accept again?** Yes. The check compares the version each person accepted with the current version of each document. Anyone who accepted the 2026-10-30 Terms will see the acceptance page, with only the Terms box to tick, next time they open the app. A builder tab that's already open will show errors until it's reloaded (a known quirk, BUG-317).

**Before you publish:**
- **Privacy Notice:** DOC-84 refers to it for what we keep, and it still says "deleted within one month". The new Privacy Notice version hasn't been drafted yet; I can draft it next. Publish the two together so people accept once, not twice.
- **Timing:** EPIC-9 says not before the first live payment, and only after a lawyer has checked:
  - that we can keep our own copy of a business's sales records;
  - the cooling-off wording, and when the UK rule on cooling-off after renewals comes into force;
  - the clause asking buyers to confirm the service starts straight away.

<!-- xgd-turn id="c70a5240-c92c-4775-85cb-d36173435dca-user" -->

<!-- xgd-chat role="user" ts="2026-11-03T18:15:12.381379+00:00" -->
#### You
please make the privacy notice changes

please ignore EPIC-9 on publishing dates - there is no downside to publishing early terms that apply to payments obviously are not ineffect in advance of taking payments.

I would like to publish this now so its done

<!-- xgd-turn id="c70a5240-c92c-4775-85cb-d36173435dca-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-03T18:16:49.612437+00:00" -->
#### Claude
Drafting the Privacy Notice version now (REQ-640 §2).

Both drafts exist. Publishing them now, then checking the build accepts them.

The build will pick these up: no two published versions share a date, and DOC-84 and DOC-85 are now the newest Terms and Privacy Notice. Recording on EPIC-29.

I've written the Privacy Notice changes and published both documents. They reach the live site at your next production build and deploy. I haven't deployed: a deploy ships everything else currently on `xgd-working` as well, so I've left that step to you. From the main checkout:

```
bin/build
bin/deploy --env production
```

**What's published:**
- **DOC-84, Terms of Service 2026-11-03:** the draft from earlier, now published. DOC-80 is replaced and stays an unpublished draft.
- **DOC-85, Privacy Notice 2026-11-03**, which changes the 2026-10-30 version as follows:
  - **Section 2:** a new "Payments" category. It covers billing name and address and payment records, and says card details stay with Stripe. It gives the legal grounds for keeping them: the contract, our legal duty to keep tax records, and our interest in handling disputes.
  - **Section 4:** Stripe is added to the provider table. Payments made to a business through its site go through that business's own Stripe account, not ours.
  - **Section 6:** "deleted within one month" is replaced with:
    - information is hidden straight away and deleted 30 days later, or 30 days after a paid term ends;
    - payment records are kept for 7 years, reduced to name and billing address;
    - deletion can be delayed during a dispute, chargeback or unpaid balance, with each delay reviewed at least every 180 days;
    - when a business closes, its domains are kept and it's offered a copy of its sales records first.
  - **Section 9:** buyers on client sites are told we keep our own record of their payment for 7 years, and that we're responsible for that record.
  - I've left out the permanent fingerprint that keeps a deleted email off future mailing lists, because it doesn't exist in code yet.

**Checked:** I read the ticket list the way the build does. There are no duplicate published versions, and DOC-84 and DOC-85 are now the current Terms and Privacy Notice, so the build will accept them.

**After the deploy:** every client sees the acceptance page once, with the Terms and Privacy Notice boxes to tick. The Beta Terms haven't changed, so that box won't appear. A builder tab that's already open will show errors until it's reloaded.

I've recorded on EPIC-29 that you chose to publish now, replacing EPIC-9's timing. A lawyer's review of both documents before the paid launch is still listed as outstanding.

<!-- xgd-turn id="c7afbc49-f579-448b-85d1-56fdcd7e9fec-user" -->

<!-- xgd-chat role="user" ts="2026-11-03T21:24:09.800717+00:00" -->
#### You
Is there more work for 640 to do?

<!-- xgd-turn id="c7afbc49-f579-448b-85d1-56fdcd7e9fec-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-03T21:24:41.184820+00:00" -->
#### Claude
Yes, one thing: **the portal's "Closing your account" page** (section 1 of REQ-640). It hasn't been started. The ticket is still a draft with no commits, and the page still has the old wording.

The rest of REQ-640 is done: the Privacy Notice changes (section 2) and the Terms changes (section 3) are what we just published as DOC-85 and DOC-84.

**What the portal page still needs:**
- **Payment records:** "Your invoices and payments, with you reduced to the least the law allows" becomes specific: kept for 7 years from each payment, with you reduced to your name and billing address.
- **A line on delays:** deletion can be paused while a dispute, chargeback or unpaid balance is open.
- **Timing:** what you've paid for runs to the end of its term, and deletion happens 30 days after your request, or 30 days after the term ends if that's later.
- **Tests** that check the page shows these statements.

The page's current wording is vaguer than the new Privacy Notice, but not wrong, so this isn't urgent. It's code, so it belongs in REQ-640's own session, not this one.

I've added a note to REQ-640 saying sections 2 and 3 are done and published, only the portal page is left, and its wording should match the new Privacy Notice's section 6. Its session can pick up the scope from that note.

<!-- xgd-turn id="851bdf44-c24e-49f2-b65e-8d042dd782b9-user" -->

<!-- xgd-chat role="user" ts="2026-11-03T21:25:26.955942+00:00" -->
#### You
Can you update 640 to make its oustanding scope clear and correct?

<!-- xgd-turn id="851bdf44-c24e-49f2-b65e-8d042dd782b9-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-03T21:26:14.171270+00:00" -->
#### Claude
I've rewritten REQ-640 so that only the portal page is left to do. Its new body has:

- **Outstanding scope:** the "Closing your account" panel in `apps/control-app/src/portal.ts`, which a client's customers see. Its wording must match the published Privacy Notice (DOC-85), and where the ticket and DOC-85 disagree, DOC-85 wins. Four changes:
  1. Payment records are kept for 7 years from each payment, reduced to name and billing address. The reason given becomes both the law's record-keeping rules and disputes; today the page gives only the law.
  2. Add the timing: information is hidden as soon as deletion is asked for and deleted 30 days later. If something already paid for is still running, the 30 days start when its term ends.
  3. Add a line saying deletion can be paused while a dispute, chargeback or unpaid balance is open.
  4. Keep the closing sentence, "the three above are the whole of the difference", accurate after those additions.
- **Unchanged:** "Ask us and we will do it", the email-fingerprint item, and the existing rule that checks the page's wording.
- **Done:** the Privacy Notice and Terms changes are recorded as published (DOC-85 and DOC-84), with your decision to publish early. The portal change has no timing gate.
- **Out of scope:** the legal documents, building the 30-day deletion job and dispute holds, and a self-serve close-account button.
- **Test plan:** tests that the page shows each new statement, and that "Ask us and we will do it" is still there.

Two things for you:

1. **The title** still says "portal, privacy notice and terms", which is no longer accurate. I left it because titles are yours. I'd suggest "Portal: Closing your account page matches the deletion lifecycle".
2. **The page already promises something that isn't built.** It lists "a one-way fingerprint of your email address" as something kept after deletion. That fingerprint doesn't exist in code yet, which is why I left it out of the Privacy Notice. The page has said this since before REQ-640, and the ticket's earlier wording said to leave it alone, so I've kept it unchanged. It does conflict with the rule that the page never describes something that doesn't exist. Do you want REQ-640 to remove it until the fingerprint is built?

<!-- xgd-turn id="fa927587-48e6-4c83-b954-5206796451dc-user" -->

<!-- xgd-chat role="user" ts="2026-11-07T18:02:42.367483+00:00" -->
#### You
ok please read the last two or three turns of EPIC-9. We are now in the ecommerce business and our customer's sites need terms of sale and a privacy notice.

I'd like to take a step back and use this usecase to drive a more general architecture/product feature.

All our sites need T&C. I would like to supply them with a "reasonable starting point". Before we scale I will get lawyers to review all our legal terms but for now lets do the best we can.

1. I would like us to create appropriate legal content for a site based on the features they switch on
T&C, Privacy notice, Terms of sale etc. If they have members then the members explicitly accept the terms, if they don't the terms are just visible. If they have a mailing list for example then appropriate language would be added.
2. So we need modular legal notice components that can be plugged together
3. We need to handle the situation where site features change and language could be added or removed
4. We need an interface - a "Legal" tab maybe? where the site owner can review the legal terms and edit them (in md). Note there are two kinds of change (1) wholesale replacement (2) small language change. The question is what happens to our modular additions if the user edits, the first case is easy - they are 100% on their own. The second case is harder because in principle we could still add stuff. Suggestion: if they edit the doc we no longer touch it but we create instead an arrea underneath with additions (or subtractions) that we would have made that they can choose to paste in? <-- for now if they edit they are on their own.

Thoughts?

<!-- xgd-turn id="fa927587-48e6-4c83-b954-5206796451dc-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-07T18:04:13.902156+00:00" -->
#### Claude
Reading the code to see how site features, generated pages and acceptance work today, so the proposal fits what exists.

Your four points hold together, and most of the machinery already exists. EPIC-29 workstream 3 already describes this feature ("modular documents generated from the features a site actually uses"), so it fits under this epic. Here's how I'd shape it.

## What already exists
- **A safe document page and acceptance page** (`legal-pages.ts`). It was written to serve both our clients and their customers: nothing in it names 1st Contact.
- **Per-business acceptance records** (`acceptances.ts`, REQ-240). Each business's documents are tickets in its own store, and each acceptance records which version was agreed to. A client's Terms can go through the same code as ours.
- **A safe Markdown renderer** (`renderLegalMarkdown`), so owner-written Markdown stays inside the security policy.
- **Feature checks the platform already makes**, such as `canTakePayments`/`canSell`, which already trigger a site rebuild when they change.

## The design I'd propose

**1. Modules are standard text, filled in by code, not written by AI.** Each module is a versioned doc ticket, like DOC-84. It declares:
- which document it goes into: Terms of use, Privacy notice, Terms of sale, or Member terms;
- where it goes in that document;
- the feature that switches it on;
- the blanks it needs filled, such as legal name, address, returns window or shipping zones.

Building a document is then the same every time: the active modules, filled in with the business's details. The big benefit is that **the lawyer reviews the module library once, not every site.** If an AI wrote each site's terms, every site would be a separate legal question.

**2. Features are detected from the site, never ticked on a "legal" list.** A separate list would drift away from what the site actually does. The module triggers are a fixed set the code checks:
- the site has a contact form;
- it collects mailing-list sign-ups;
- it sells (`canSell`);
- it has members who sign in;
- it embeds video or maps from other companies;
- the business's region (UK/EU first).

**3. Three things change a document, and all of them re-run the build:**
- the site's features change;
- the business's details change;
- **we change the module library**, for example after a lawyer revision or when we add a new provider.

The third is easy to forget. Each client's privacy notice must list the companies that process data for us. That list should come from the same source as DOC-85's provider table, so adding a provider updates every client's notice.

**4. Documents are rebuilt when the site is published, not on every edit.** That's when a feature actually goes live, so the text and the feature arrive together. It also stops a new version appearing each time someone toggles something in the builder. If the result differs from the live version, it becomes a new version, the owner is told, and the footer links point to it.

**5. Members accept, everyone else just sees the documents.** Members accept through the existing acceptance page. Visitors get footer links, and at checkout one line above the pay button: "By paying you agree to our Terms of sale". The version shown is recorded on the order, and the confirmation email carries a lasting copy.

My suggestion here: **only make members accept the Terms again when the Terms change.** A privacy notice is information you give people, not something they consent to. If members had to re-accept it, adding a mailing list would put every member through the acceptance page again.

**6. Editing (your point 4):** I agree with "if they edit, they're on their own" for now, with two cheap additions that cover most of what you're after:
- **Business details are a form, not Markdown.** Most "small language changes" will really be the returns window, the address or the delivery note. Editing those in a form doesn't take the document out of our hands, which handles most of your case (2).
- **An edited document still gets a warning.** When a document is edited, we save the list of modules that were active at that moment. If a later publish would add or remove a module, the Legal tab says so, for example: "Your site now collects mailing-list sign-ups. Our standard privacy notice would add this section." It also offers "Go back to the standard version". The dangerous case is an edited privacy notice that never mentions a mailing list added later, and this catches it without trying to merge text. Your paste-in area is the natural next step and costs little once this exists.

Whether a document is "standard" or "edited" is tracked **per document**, so editing the Terms of sale leaves the Privacy notice standard.

**7. The Legal tab** has:
- a list of the site's documents, each showing whether it's standard or edited, which features added which sections, the live version and its history;
- a Markdown editor and preview;
- the business details form;
- the warnings from point 6.

The pages themselves are static on the published site (for example `/legal/privacy` and `/legal/terms-of-sale`), with footer links added automatically.

**8. Checkout requirement:** with standard documents this is always met, because the Terms of sale appear as soon as the site sells. For an edited document I'd warn rather than block, since the owner has taken it on themselves.

## What I'd file
Your rule is to fold rather than split, so one REQ under EPIC-29 replacing workstream 3. It would cover the module format, building the documents, publishing them as site pages with footer links, the checkout line and the copy in the confirmation email, member acceptance, and the Legal tab. The module texts would be doc tickets drafted in this session. The first set would cover the shop and contact forms, since that's what's needed now.

## Questions for you
1. **Members:** do client sites have signed-in members today beyond the portal, or is that coming?
2. **Publishing standard changes:** should a changed standard document go live automatically when the site is published (I'd recommend this, with a notice to the owner), or wait for the owner's approval?
3. **Member re-acceptance:** OK to require it for Terms changes only, not Privacy notice changes?
4. **Regions:** UK/EU wording only at first, and add US/California later?

Once you've answered, I'll write it into EPIC-29 and file the REQ.

<!-- xgd-turn id="624b7535-87dd-4855-bb70-e001ef72bce6-user" -->

<!-- xgd-chat role="user" ts="2026-11-07T18:12:36.533590+00:00" -->
#### You
Actually we are also designing a Messages tab EPIC-30 I wonder if these could be combined "Messages" with "Emails" and "Legal" as modes?

**Members:** do client sites have signed-in members today beyond the portal, or is that coming? <-- what do you mean "beyond the portal" - we now have ecom so client sites have real customers. The goal is for them to have mailing lists, subscriptions potentially paywall content too all of that would be accessible to signed in users

2 - yes the consultant needs to make this clear to the user
3 - if you consider that to be correct - why do they need to accept Privacy terms in the first place then? Do we have an obligation to inform them of changes - how is that done?
4 Lets do US, UK and EU on first release please

<!-- xgd-turn id="624b7535-87dd-4855-bb70-e001ef72bce6-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-07T18:13:48.290608+00:00" -->
#### Claude
Yes, I'd combine them. A Legal mode is mostly a Messages item with different rules, and the two need each other: a changed legal document is often something a business has to tell its customers about, and Messages is how it would tell them.

## One tab, two modes

EPIC-30's Messages tab is already most of what Legal needs:
- the same three panes: list, detail with preview, and an AI assistant;
- Markdown text shown through the safe renderer;
- versions kept as tickets, with the newest live and old ones kept, so an order or acceptance can point at the exact words it was given;
- per-business copy, with 1st Contact as just another business.

Building it twice would be the split that DOC-40 warns against. What Legal adds:
- **Standard or edited:** whether we still keep the document up to date, or the owner has taken it over;
- **What switched each section on**, and the warning when an edited document falls behind the site's features;
- **A business details form** (legal name, address, returns window), shared with Emails, which needs the same details for footers and unsubscribe lines;
- **Published as site pages** with footer links, which also appear in the Page menu, like the shop's order pages;
- **Acceptance**, for documents members must agree to.

The two modes link up through one new message. "We've updated our privacy notice" would be an Emails item whose trigger is a changed legal document (see question 3).

One reservation: legal pages aren't really messages. "Messages" with "Emails" and "Legal" modes still reads clearly to me, so I wouldn't rename the tab. This changes EPIC-30's tab design, so I'd record it on both epics.

## Your answers

**1. Members.** By "beyond the portal" I meant that today the only signed-in area for a business's customers is the portal. Your answer makes **sign-in on the client's site** a feature the modules respond to. Once it exists, it brings in:
- Member terms, accepted when someone creates an account;
- mailing-list wording;
- subscription terms, with auto-renewal and cancellation wording;
- access to members-only content.

Each of these is a module, switched on by the matching feature.

**2. Standard changes go live when the site is published, and the consultant explains them.** Agreed. Before the publish, the consultant tells the owner which legal sections are being added or removed and why.

**3. Why accept a privacy notice at all? You don't have to, and I'd stop asking for it.** This is my understanding, not legal advice:
- **Under GDPR and UK GDPR,** a privacy notice is information you must give people when you collect their data (Articles 13 and 14). It isn't something they agree to.
  - Where consent is needed, such as marketing emails, it has to be separate and specific.
  - The UK regulator (ICO) warns against treating "accept our privacy policy" as consent.
  - So ticking a box adds nothing legally. What matters is being able to show the notice was provided.
- **In the US,** the California law on online privacy policies (CalOPPA) requires the policy to be posted where people can easily find it. Acceptance isn't required. The things that do benefit from a click-to-agree are the **Terms**: dispute rules, limits on liability, subscription conditions.

So I'd recommend:
- **record that the privacy notice was shown**, and which version, without asking anyone to accept it;
- **accept the Terms only.**

This also applies to **our own** acceptance page (REQ-488), which currently makes our clients accept the Privacy Notice. Changing that would be a small separate ticket for you to decide on.

**Telling people about changes: yes, there's an obligation, and it depends on the kind of change.**

| Change | What's required (my understanding) | How we'd do it |
|---|---|---|
| Minor wording, or a section that only affects new sign-ups (e.g. adding a mailing list) | Update the page, with its date and version history | Automatic at publish. No email, because existing people aren't affected |
| Material change affecting people already on file (a new provider, a new use of their data, a longer retention period) | Tell them before it takes effect. GDPR requires notice before data is used for a new purpose. The ICO and the US FTC both expect material changes to be actively communicated, not just posted | The **"we've updated our privacy notice" email** in Messages, sent to the business's contacts before the change takes effect |
| Using data people already gave for a materially different purpose | Usually needs **consent**. The FTC treats quietly changing terms to cover past data as deceptive | Not automated: the consultant flags it and the owner decides |
| Terms change for members | Material changes need fresh acceptance | The acceptance page the next time they sign in |
| Terms of sale | Each order is governed by the version shown at checkout | Version recorded on the order |
| Subscription terms | Notice before the next renewal: US auto-renewal laws (federal ROSCA, California's auto-renewal law) and the UK DMCC Act | A Messages email before renewal. **Needs the lawyer** |

For standard documents, **we mark which module changes count as material**, since we write the modules. Adding a provider is material; rewording isn't. For an edited document, the owner sets a "tell people about this change" switch, with the consultant's advice.

**4. US, UK and EU in the first release.** Agreed. Two things shape the US modules:
- **Most US state privacy laws don't apply to small businesses.** CCPA/CPRA starts at roughly $25M revenue or 100,000 consumers. CalOPPA, though, applies to any site collecting personal information from Californians, so the US base module follows CalOPPA, including its "Do Not Track" statement.
- **US-specific modules:**
  - **CAN-SPAM** for mailing lists: a postal address and an unsubscribe link in every email (that's a required placeholder in Emails);
  - the **FTC Mail Order Rule** for shops: ship within the stated time, or 30 days if none is stated, and tell the buyer about delays;
  - **auto-renewal law** for subscriptions;
  - **no 14-day right to cancel**, so the returns policy is the business's own choice, taken from a business detail.

**Which law applies depends on the buyer as well as the business.** EU consumer law protects EU buyers when a business sells to them, even if the business is in the US. So the facts the modules use are the business's country **plus where it sells**, and the shop's shipping zones already tell us that. A US shop shipping to Ireland gets the EU cancellation module.

## Next step
If you agree with combining the tabs and dropping privacy acceptance, I'll:
- write this design into EPIC-29;
- note on EPIC-30 that its tab gains a Legal mode and a "legal document changed" message;
- file one REQ for the feature;
- draft the first module texts as doc tickets: base modules for each region, plus contact form, shop, mailing list, member sign-in and subscriptions.

I haven't changed any tickets yet, so you can still change any of this.

<!-- xgd-turn id="a3a612be-979b-432a-a50c-123325bd3c8f-user" -->

<!-- xgd-chat role="user" ts="2026-11-07T18:20:00.138567+00:00" -->
#### You
Does legal need an AI assistant? It could answer questions but it cannot edit thee text right?

<!-- xgd-turn id="a3a612be-979b-432a-a50c-123325bd3c8f-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-07T18:20:23.300910+00:00" -->
#### Claude
Yes, I'd give Legal an assistant, but one that can't write clause text. That limit is the right call, not just a safe one.

**Why it shouldn't edit the wording:**
- **Each site's text should be reviewable.** The point of modules is that a lawyer reviews our library once. If the assistant rewrote clauses, every site would carry legal text nobody reviewed.
- **Liability is clearer.** If an owner rewrites a clause, it's plainly their own wording. If our AI writes it at their request, it's our wording on their site, which looks like giving legal advice. In the US, giving legal advice without being a lawyer is a real risk area for document-drafting services.
- **AI is confidently wrong about the law.** Wording that sounds right but misstates an obligation is worse than our plain standard text.

**What it can do, which is most of what owners will ask for:**
- **Explain.** What a section means, why it's there, and which feature added it. We'd write a short plain-English note alongside each module, so its answers come from our text and not from memory.
- **Change the business details,** using the same form owners use. "Our returns window is 30 days" or "we've moved" updates the detail and rebuilds the document, which stays standard. That's the common kind of small change, done without the owner ever taking the document over.
- **Say what a feature change will do,** for example "adding a mailing list adds this section to your privacy notice". This is how the consultant explains standard changes before a publish (your answer 2).
- **Help with the "we've updated our privacy notice" email,** in Emails mode, where it's allowed to write. That's the business's own message, not legal text.
- **Report a missing clause to us** when an owner needs something our modules don't cover. It files a request for the module library through the existing development-ticket tool, so the gap is fixed once for everyone.
- **Say plainly that it isn't a lawyer,** and suggest one for anything specific to the owner's situation.

**What it can't do:** change the document's wording, or take a document over from standard for the owner. If an owner wants different wording, they edit it themselves in the Markdown editor.

**How it fits the shared tab:** it's the same Messages assistant, with fewer tools in Legal mode. In Emails it can write message text; in Legal it can only change business details and explain. Limiting it by which tools it has follows the consultant's design (goal plus toolkit), and is more reliable than a rule telling it not to edit.

I'll include this in the EPIC-29 write-up. Are you happy with the earlier two points: one Messages tab with Emails and Legal modes, and members no longer accepting the privacy notice? Once you confirm, I'll update EPIC-29 and EPIC-30 and file the REQ.

<!-- xgd-turn id="d713df94-5a0f-4e0d-8ed0-4522ea922fb8-user" -->

<!-- xgd-chat role="user" ts="2026-11-07T21:22:19.468941+00:00" -->
#### You
Paperwork tab is in place - can you review and create tickets for the legal mode please

<!-- xgd-turn id="d713df94-5a0f-4e0d-8ed0-4522ea922fb8-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-07T21:25:32.750327+00:00" -->
#### Claude
Looking at what the Paperwork tab is and which tickets built it.

Reviewed the tab and its tickets; checking what business details the shop already holds before I write the tickets.

Writing the two tickets now.

Both tickets are filed. Now updating EPIC-29 (appending, not replacing) and noting the change on EPIC-30.

I've reviewed the Paperwork tab and filed two tickets for Legal mode under EPIC-29. Both are drafts and each needs its own session to build it.

## What Legal mode does today (REQ-661 and REQ-662)
- It only works for the 1st Contact business. It lists our Terms, Privacy Notice and Beta Terms, every published version, and how many people have accepted the current version, only an older one, or none. **A client business sees no documents**, because client documents don't exist yet.
- It's read-only: our documents are still edited as doc tickets and published by the build. Drafts don't appear.
- The Legal assistant can only view, as we agreed.
- The Privacy Notice is already a "read" document rather than an "agree" one: the checkbox says "I have read", not "I agree". But changing it still makes everyone tick again.
- **There are no seller details anywhere yet** (legal name, address, returns window). Terms of sale can't be written without them, so the new tickets add them.

## The tickets

**REQ-665: client legal documents built from site features** (20 points)
- **Modules:** standard text, filled in by code and never written by AI. Each is chosen by what the site does: has a contact form, collects mailing-list sign-ups, sells, has signed-in customers, embeds media from other companies.
- **Regions:** US, UK and EU, decided by the business's country plus where it ships.
- **Business details form:** changing a detail keeps the document standard.
- **Standard or "Edited by you", per document.** An edited document gets a warning when it's missing a section the site now needs, and a "Go back to the standard version" button.
- **Static pages on the site** (`/legal/...`) with footer links added automatically.
- **Rebuilt when the site is published,** with the consultant explaining the changes first.
- **The list of companies processing data comes from the same source as DOC-85's provider table,** so adding a provider updates every client's notice.
- **The Legal assistant can now change business details,** but still can't change document text.

**REQ-666: terms at checkout, member acceptance and change notices** (13 points, after REQ-665)
- **Checkout:** one line above the pay button, with no tick box. The versions shown are recorded on the order, and the confirmation email links to that exact version.
- **No Buy button until the seller details are filled in.** An edited Terms of sale gets a warning, not a block.
- **Signed-in customers** agree to the Terms and mark the Privacy notice as read. They accept again only when the Terms change materially.
- **A "We've updated our privacy notice" email,** an ordinary Paperwork message, goes to contacts before a material privacy change takes effect.
- This ticket also has to update one line in the Legal assistant's instructions: "publishing makes everyone accept again" will no longer be true.

## Updated
- **EPIC-29:** I added a section with both tickets and your decisions, kept the rest of the body, and listed both tickets as children.
- **EPIC-30:** I added a note that the Legal assistant gains one write (business details) and Email mode gains one message.

## Still open
1. **The module texts.** REQ-665 needs the first set of module texts as doc tickets: a base for each region, contact form, shop, mailing list, signed-in customers and embedded media. That's writing, so it belongs in this session. Shall I start drafting them?
2. **Our own acceptance page.** Should it stop requiring a tick for our Privacy Notice? It isn't in either ticket until you decide.

<!-- xgd-turn id="bdc45a18-3d69-4db6-add1-5bbf67307324-user" -->

<!-- xgd-chat role="user" ts="2026-11-07T21:31:28.661649+00:00" -->
#### You
can 665 and 666 run in parallel?

<!-- xgd-turn id="bdc45a18-3d69-4db6-add1-5bbf67307324-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-07T21:32:02.746160+00:00" -->
#### Claude
Not really. I'd run them one after the other: REQ-665 first, then REQ-666.

**Why REQ-666 depends on REQ-665:**
- **The documents don't exist until REQ-665 builds them.** REQ-666 records which version of each document was shown at checkout, links that version from the confirmation email, and asks signed-in customers to accept it. All of that needs REQ-665's per-business document versions.
- **The seller details come from REQ-665.** REQ-666's rule that the Buy button stays off without a legal name, address and contact email checks the business details form REQ-665 adds.
- **"Material" is defined by REQ-665.** REQ-666 decides whether people must accept again, or get the privacy email, from the material flag on REQ-665's modules and on its owner edits.
- **They change the same files.** Both edit the Legal assistant's instructions and tools: REQ-665 adds setting business details, and REQ-666 replaces "publishing makes everyone accept again". Both also edit the acceptance and legal-document code. That instruction file has been awkward to merge before.

**How you could overlap them, if time matters:** I'd add the shared data shapes to both tickets now:
- the business details record;
- a published document version: document, version id, page address, "agree" or "read", material, publication date.

REQ-666 could then start once REQ-665 has committed those, with its tests adding documents straight to the store. Whichever ticket merges second adapts to the other. That saves part of REQ-666's time, but costs a merge between two branches changing the same files.

**My recommendation:** run them in order. REQ-665 is the bigger one (20 points), so start it now, and use this session to draft the module texts alongside it. REQ-665's tests need those texts, so drafting them is the work that really can happen in parallel. Shall I start on them?

<!-- xgd-turn id="0b30aef5-47a7-475f-927b-d14d64da9811-user" -->

<!-- xgd-chat role="user" ts="2026-11-07T23:42:39.870983+00:00" -->
#### You
Please review the questions in REQ-666 I resolved on with it but there are others

<!-- xgd-turn id="0b30aef5-47a7-475f-927b-d14d64da9811-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-07T23:43:46.704456+00:00" -->
#### Claude
The questions aren't in the ticket body, so I'm reading REQ-666's own chat.

I've read REQ-666's chat. You've settled question 1: client-site sign-in gets its own REQ, built first. **That ticket hasn't been filed yet.** REQ-666's chat ends with you asking for it, so it still has to be created, either in REQ-666's session or here if you want. The other three questions, with my recommendations:

## 2. How the 30-day privacy notice period works: agree, with one change

I agree with:
- 30 days, as a platform setting the owner can't change, until the lawyer confirms it;
- the email going out in small batches from the 10-minute job, recorded on each contact, never sent all at once during a publish.

**The change:** put the new version live straight away. Don't hold the old one back for 30 days.
- **The problem with holding it back:** a material change usually comes from a feature that goes live at that same publish, such as a new mailing list or a new provider. If the old notice stays up for 30 days, everyone who gives their data during that time is given a notice that doesn't describe what happens to it. That's a worse breach than the one the delay avoids.
- **What I'd do instead:**
  - The new version goes live at publish, so anyone giving data from then on is told the truth.
  - The page says: "Updated <date>. If you were already our customer, these changes apply to your existing information from <date + 30>."
  - The email to existing contacts says the same.
- **This also removes the daily job** that would have swapped the version on its date, and with it one moving part.
- **What it can't do:** the code can't actually stop a new provider from handling existing contacts' data during those 30 days. That goes on the lawyer's list, not into the code.
- **Who receives it:** every contact with an email address, **including people who have unsubscribed from the mailing list**. It's a service notice, not marketing. Contacts who are deleted, hidden, or whose email has bounced don't get it.

## 3. Turning Buy off without a published Terms of sale: agree, and require the Privacy notice too
- No Buy button unless the site has a published Terms of sale **and** a published Privacy notice. That's what I proposed originally.
- **What this means for you:** all 30 module texts (DOC-87 to DOC-116) are drafts. REQ-665's session wrote them, and none is published. **When REQ-666 lands, Buy turns off on every selling site, including your test shop**, until they're published.
- Reviewing and publishing them is this epic's work. I'd like to go through all 30 in this session first, checking them against the US, UK and EU points we agreed and against DOC-84 and DOC-85, and then you publish. That can happen while REQ-666 is being built.

## 4. The smaller decisions: agree with all four, with one refinement
- **Seller details come from REQ-665's business details form.** Yes.
- **The server records the versions in force when checkout starts,** not versions sent by the page. Yes. A publish during someone's checkout is a rare edge case and fine to accept.
- **A permanent page for every published version** (e.g. `/legal/terms-of-sale/v3`). Yes. It keeps working without any live service, which matches the rule that published sites don't depend on compute.
- **The switch on an owner's edit:** the switch should depend on the document, and be **off by default**, with the Legal assistant advising.
  - **Terms of use / Member terms:** "Ask signed-in customers to accept again".
  - **Privacy notice:** "Tell people about this change".
  - **Terms of sale:** no switch. Each order is already tied to the version shown at checkout.

## Also for REQ-666
- **One line in the Legal assistant's instructions** still says "publishing makes everyone accept again". It needs to say that people accept again only after a material change to the Terms.
- **Items 4 and 5** (member acceptance, and accepting again) wait for the sign-in REQ, as you decided. Items 1–3, 6 and 7 can be built now.

If you agree, I'll write these answers into REQ-666's body so its session builds from the ticket rather than the chat. Shall I also start reviewing the module texts?

<!-- xgd-chat-end -->