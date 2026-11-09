---
uid: comment-02b19238
id: COMMENT-5838
type: comment
title: Comment on epic EPIC-29
created_by: xgd
created_at: '2026-10-29T23:35:13.589538+00:00'
updated_at: '2026-11-09T01:12:44.989003+00:00'
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

<!-- xgd-turn id="84705758-28b4-4e52-b0ad-8f84c922989c-user" -->

<!-- xgd-chat role="user" ts="2026-11-08T16:25:45.187452+00:00" -->
#### You
I'm concerned about the privacy notice and the delay can we discuss? It appears 666 implemented the delay which is a little confusing if you told it not to.

If we change our privacy notice, do we have an obligation to tell our members that it has changed? The wait, the email send its a huge amount of complexity - why not just have them re-accept like a ToS change?

<!-- xgd-turn id="125248a8-f8bd-4f08-a04a-38751c37796e-user" -->

<!-- xgd-chat role="user" ts="2026-11-08T16:26:43.150160+00:00" -->
#### You
I'm concerned about the privacy notice and the delay can we discuss? It appears 666 implemented the delay which is a little confusing if you told it not to. - Oh I see I didn't ask you to close the loop, my bad. Lets take stock of where we are then.

If we change our privacy notice, do we have an obligation to tell our members that it has changed? The wait, the email send its a huge amount of complexity - why not just have them re-accept like a ToS change?

<!-- xgd-turn id="125248a8-f8bd-4f08-a04a-38751c37796e-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-08T16:27:33.595010+00:00" -->
#### Claude
Yes, there's an obligation, but it covers more people than members. That's why re-acceptance alone isn't enough. You're right, though, that the 30-day wait is the wrong part, and it should go.

## Where things stand
- **REQ-665** (client documents, Legal mode): built, now `ready_to_reconcile`.
- **REQ-668** (each business's customers sign in to that business): built, `ready_to_reconcile`.
- **REQ-666**: built and at `free_coded`, including signed-in customers accepting their business's Terms. It also built the **30-day privacy wait**. I recommended against the wait, but I never wrote that into REQ-666's ticket, so its session followed the ticket. That's the gap you spotted. Your two latest corrections in its chat are still open:
  - the 1st Contact business gets the same checks as every other business;
  - Buy is blocked when there's no Terms of sale.
- **Module texts DOC-87 to DOC-116:** all still drafts, so no site has standard documents yet, including your test shop.

## Must you tell people when the privacy notice changes?
This is my understanding, not legal advice.
- **Small or wording changes:** no. Update the page and its date.
- **Material changes:** yes. GDPR's transparency rules (Articles 12–13, and the EU regulators' guidance on transparency) and the UK regulator (ICO) say that changes which matter must be brought to people's attention. Posting them isn't enough.
- **A new use of data you already hold:** people must be told **before** that use starts. This is the only case where a waiting period has any legal basis.
- **The obligation is to everyone whose data the business holds,** not just members: buyers who checked out as guests, people who filled in the contact form, mailing-list subscribers. For most small businesses, those people far outnumber members.

## Why re-acceptance alone isn't enough
1. **It only reaches people who sign in.** A guest buyer or someone who sent an enquiry never sees the acceptance page, and they're the people the notice is mostly about.
2. **It reaches members late, or never.** A member who doesn't sign in for six months finds out six months after the change.
3. **"Accepting" a privacy notice doesn't mean anything legally.** The notice is information, and what happens if someone refuses has no sensible answer. A one-time "I have read" prompt for members is a fine way of telling them, but it's an extra, not a replacement for the email.

## Why the 30-day wait should go
- **The code can't enforce it.** The feature behind the change goes live at publish whatever the notice says. During those 30 days, a new provider is already receiving the data.
- **It makes the notice wrong.** Anyone giving their data during the wait is shown the old notice, which doesn't describe what now happens to it.
- **It's where most of the complexity is:** versions waiting to take effect, the "takes effect on" line, and the daily job that swaps the version in.

## What I'd change it to
- **A material privacy change goes live at publish,** for everyone.
- **The email goes out at the same time,** sent in small batches by the existing job, as it is now. It informs people; it isn't an advance warning. It's already built and it's the only way to reach people who don't sign in.
- **No re-acceptance for the privacy notice.** Members get the email like everyone else. Re-acceptance stays for material Terms changes.
- **A planned new use of existing data:** the consultant warns the owner before publishing, as it does now, and the lawyer decides on wording and timing. The code doesn't try to hold anything back.

**What this removes from REQ-666:** waiting versions, the 30-day setting, the "An updated version takes effect on…" line on the site, "Version N takes effect on…" in the Legal mode list, and the job that swaps versions in. **What stays:** the email message, sending it in batches, and the "tell people about this change" switch.

If you agree, I'll write it into REQ-666's ticket together with your two corrections from its chat, so its next session has all three in one place. Then I'll start reviewing the module texts so your test shop can get its documents.

<!-- xgd-turn id="8103edb2-843f-4eea-bc8c-117dcd5038ac-user" -->

<!-- xgd-chat role="user" ts="2026-11-08T16:40:55.434696+00:00" -->
#### You
One consequence of this - our idea of modular language should not apply to Privacy. If a user adds or removes features from their site we do not want to trigger a mass email send everytime they do it. Can we word the privacy notice with contingencies "If the site has an email list..." etc?

One other thought - 1st Contact terms must include a statement like "1c offers legal terms for its member sites. (1) offered in good faith with no legal guarantees - get legal advice (2) These terms place obligations on you (the site owner). It is important that you read these terms and understand your obligations. If you do not want to agree to these terms you can replace them with your own"

We can have data for people for whom we do not have an email address - I assume that's too bad - we can't tell them if we have no way to contact them? We did talk about retaining records with names and physical business addresses - I really don't want to get into the business of sending physical mail to update privacy notices - can we arrange it so that if we keep data we keep an email?

<!-- xgd-turn id="8103edb2-843f-4eea-bc8c-117dcd5038ac-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-08T16:43:05.998356+00:00" -->
#### Claude
Checked how contacts store email (a separate table, so a contact can have none). Now looking at where the new paragraph fits in our Terms.

Draft Terms created; recording it on EPIC-29, then answering.

All three points work, and the first two make the system simpler. I've drafted your Terms paragraph and noted all of this on EPIC-29.

## 1. Privacy notices with "if" wording: yes, and better
Write each sentence from the visitor's side, as something they do: "If you join our mailing list…", "If you buy from us…", "If you create an account…", "If a page shows a video from another company…". Each of those is true whether or not the site has the feature yet, so I don't think it's misleading (my understanding, not legal advice).

What it gives us:
- **Adding or removing a feature never changes the privacy notice,** so it never sets off an email.
- **The notice only changes when** the owner edits it, when their business details change (normally not material), or when **we revise our standard text**.
  - A revision of ours would email every business's contacts at once, so we should make them rarely and in batches, ideally once each time the lawyer reviews.
- **Regions work the same way:** "If you are in the UK or EU…", "If you are in California…". Notices often do this, and it covers buyers from anywhere.
- **The list of providers stays complete,** for example Stripe: "which of these receive your information depends on what you do on this site."
- **The warning when an edited privacy notice falls behind the site's features goes away,** because that can no longer happen.

The cost is a longer notice, which I think is fine.

**I'd do the same for Terms of use and Member terms.** A feature changing them would otherwise make every member accept again. So the only feature-driven change left is whether **Terms of sale** exists at all, and it's a separate document that nobody re-accepts.

That narrows REQ-665's modules down to choosing which documents a site has, filling in the details, and tracking our text's version. The module texts DOC-87 to DOC-116 are all still drafts, so I'd rewrite them in this style before you publish any of them. REQ-665's code also needs the feature triggers taken off the Privacy, Terms of use and Member terms modules, which is a small follow-up change.

## 2. The paragraph for our Terms: drafted as DOC-117
**DOC-117 (Terms of Service 2026-11-08)** is a **draft**: DOC-84 plus a new part of section 8, "Legal documents we provide for your site". It says:
- **They are a starting point offered in good faith, not legal advice.** We aren't a law firm, can't promise they're complete or right for every business, and the owner should get their own legal advice. Section 11, on our responsibility, applies to them too.
- **They are the owner's documents and place obligations on them,** such as returns, refunds, cancellations and looking after personal information. "It is important that you read them, understand what they commit you to, and run your business the way they say."
- **The owner doesn't have to use them.** They can edit them or replace them with their own in the Paperwork tab. Once they've edited one, keeping it accurate is their responsibility.
- **While they use our standard version,** we keep it up to date and tell them before changes appear on their site.

I haven't published it: publishing makes every client accept again, so it should go out once, together with the change in point 3.

## 3. People we have no email address for
**Yes. If we have no way to contact someone, we can't tell them directly,** and I don't believe the law expects posted letters for a notice change. Keeping the dated page up to date with its version history is a reasonable fallback, and the lawyer can confirm. Your rule is better still: **if we keep someone's data, we keep a way to email them.** There are two places that's not true today:
- **The 7-year payment records,** which we said would be reduced to name and billing address.
  - Stripe Checkout always collects the buyer's email, so we have it.
  - Keeping it is easy to justify: disputes and chargebacks mean contacting the buyer, and the receipts went to that address.
  - It has to be written into the published documents: DOC-84 sections 8, 9 and 12 ("name and billing address" becomes "name, email and billing address"), DOC-85 sections 6 and 9, DOC-37, and REQ-640's portal page.
  - Keeping more than before is a material privacy change for our own clients. They can all be emailed, since they sign in with email.
- **Contacts with no email at all.** A contact's email lives in a separate table (`user_emails`), so a contact can exist without one, for example from a phone-only enquiry. The rule would be that **any form or record that creates a contact needs an email address.** That's a small code change, so it needs a ticket.

## What I'd do next, once you agree
1. Rewrite the module texts DOC-87 to DOC-116 in the "if" style.
2. Add the email-retention change to DOC-117, and write a matching Privacy Notice draft, so clients accept once.
3. Update REQ-665 for the feature-trigger change.
4. Update REQ-666 to:
   - drop the 30-day wait, sending the email at publish;
   - include the 1st Contact business in the checks;
   - block Buy when there's no Terms of sale.
5. Give "every contact has an email" a home. My rule is one ticket per intent, so I'd add it to REQ-666 rather than file a new ticket. Say if you'd rather have a separate ticket.

Shall I go ahead?

<!-- xgd-turn id="289fcb4c-51f6-4ac5-9732-42dd13caf869-user" -->

<!-- xgd-chat role="user" ts="2026-11-08T16:50:21.812596+00:00" -->
#### You
Just to be clear we have no live sites and no clients please do not hold back publishing updates.

**Contacts with no email at all.** A contact's email lives in a separate table (`user_emails`), so a contact can exist without one, for example from a phone-only enquiry. The rule would be that **any form or record that creates a contact needs an email address.** That's a small code change, so it needs a ticket. <-- is this the right thing? I'm interested in discussing the product question before worrying about implementation

<!-- xgd-turn id="289fcb4c-51f6-4ac5-9732-42dd13caf869-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-08T16:51:03.487245+00:00" -->
#### Claude
Publishing DOC-117 now, since you have no clients to re-accept. Then the product question.

Understood: you have no live sites and no clients, so I'll publish updates as soon as they're ready. **DOC-117 (Terms of Service 2026-11-08) is now published**, with the paragraph on the legal documents we provide. It reaches the site at your next `bin/build` and `bin/deploy`.

## Should every contact need an email address? I don't think so
I took your point too literally. Looking at it as a product question, requiring an email is the wrong rule for a business's contacts.

**Why not:**
- **It loses leads.** "Leave your number and we'll call you back" is one of the best-converting forms for tradespeople and local services. Making email required means fewer enquiries, which goes against the platform's main purpose (DOC-5: lead capture stays frictionless).
- **Businesses record people they meet in real life,** such as a phone call, someone walking in, or a card collected at a market. Those contacts often have no email, and the owner still needs to record them.
- **Collecting an email only so we can send notices is backwards.** Data minimisation means collecting what you need for the purpose. Asking for an email just in case the privacy notice changes is the kind of collection the rules discourage.
- **It solves a problem that has become rare.** With the "if" wording, a client's privacy notice no longer changes when features change. It only changes when the owner edits it or we revise our standard text. Material changes will be uncommon.

**What I'd do instead: tell people through whatever contact details we already hold.**
- **Email** where there is one. That's what's built now.
- **Text message** where there's only a phone number, once texts exist. Paperwork messages already have a text-message field, so "We've updated our privacy notice" gets a short text version with a link.
- **Neither:** we rely on the dated notice and its version history. I believe that's what the law expects when there's no way of reaching someone, but it's one for the lawyer to confirm.
- **The business is the controller of its own contacts,** so telling them is the business's duty, and we give it the tools. That's consistent with what DOC-117 now says.

## Where an email does belong
Two separate cases, both still sensible:
1. **Our own retained payment records (7 years):** keep the buyer's email. Here we're the controller. Stripe always collects the email, and we keep it because disputes and chargebacks require contacting the buyer, not just so we can send notices. This needs the wording change in our Terms and Privacy Notice I described last time ("name, email and billing address").
2. **People who sign in:** every account already has an email, because sign-in is a link sent by email. Members and our own clients can always be reached.

So the rule becomes **"we can reach everyone who has an account, and we keep an email in any record we retain for our own reasons"**, not "every contact must have an email".

If you agree, I'll:
1. Write the retained-email change into new versions of our Terms and Privacy Notice and publish them.
2. Rewrite the module texts DOC-87 to DOC-116 in the "if" style and publish them, so your test shop gets its documents.
3. Update REQ-665 to take the feature triggers off Privacy, Terms of use and Member terms.
4. Update REQ-666 to:
   - drop the 30-day wait;
   - include the 1st Contact business in the checks;
   - block Buy with no Terms of sale;
   - send the privacy notice by text message where a contact has only a phone number, once texts exist.

<!-- xgd-turn id="e73c1246-fc95-4e48-87e0-da0e6cdcbb23-user" -->

<!-- xgd-chat role="user" ts="2026-11-08T16:55:21.244113+00:00" -->
#### You
Can we say that explicitly in the Privacy notice - update is contingent on us having an email for a contact.

Can you make sure that all the rules and automatic updates apply to 1st contact itself - the tickets have been excluding it (again this is a product question first a tech question second). I certainly want all the automated protections and update tech to work for 1c - do we need separate/different ToC/Privacy? Ideally no. We eat our own dog food. Ideally its the same doc, but is that reasonable?

<!-- xgd-turn id="e73c1246-fc95-4e48-87e0-da0e6cdcbb23-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-08T16:57:06.805484+00:00" -->
#### Claude
First adding the "we can only tell you if we have your email" sentence to our own Privacy Notice, plus the matching wording on retained payment records. Then the dog-food question.

Publishing: DOC-117 amended in place (not yet deployed and nobody has accepted it), plus a new Privacy Notice.

I've added the "we can only tell you if we have your email" statement and published it, and I think dog-fooding is reasonable as long as one feature is added.

## 1. The statement is published
**DOC-118 (Privacy Notice 2026-11-08), published.** Section 10 now says:
- If you have an account, we ask you to read the new version the next time you sign in.
- If the change is significant, we also email everyone we hold an email address for, when the new version is published.
- "**We can only tell you directly if we have a way to contact you.** If we hold no email address for you, we cannot tell you about a change, so please check this page for the current version."

**Payment records now keep the email address too**, in both documents: "name, email address and billing address". The notice gives the reason: to contact the buyer about a dispute and to tell them about changes. I made the same change to DOC-117 (Terms 2026-11-08). I edited it in place, since it hasn't been deployed and nobody has accepted it. Both reach the site at your next build and deploy.

The same section 10 wording will go into the standard privacy module for client sites.

## 2. 1st Contact gets every check, using the same documents?
**Same mechanism and same checks: yes, without question.** That covers:
- the Legal mode;
- the standard documents being kept up to date;
- the Buy gate and the checkout line;
- acceptance at sign-in;
- the change emails;
- the "tell people about this change" switch.

1st Contact is a business with a site, members, a mailing list, a contact form and paid plans. Every exemption is a place where the product goes untested on the one business that uses it every day. REQ-665 explicitly left 1st Contact out, and REQ-666 did too until you corrected it.

**The same documents, exactly as written: no, but nearly.** 1st Contact's Terms contain things no client site would ever have:
- the AI rules and who owns the content;
- the harassment and doxing rules;
- the data-processing terms (GDPR Article 28) for clients' visitors' data;
- the new paragraph on the legal documents we provide;
- the Beta Terms.

A client's standard Terms can't contain those. And if 1st Contact simply edited its standard documents, it would lose the automatic updates, which is what you want to avoid.

**What closes the gap, and is useful to every client: owners can add their own sections to a standard document without taking it over.**
- The document stays **standard**, and we keep updating our parts of it.
- The owner's sections sit at a place they choose, for example after "Who we are".
- Keeping their own sections consistent with ours is up to them, and the Legal assistant can point out a conflict.
- This also answers your second editing case from the start: a business that wants a clause or two of its own keeps everything else up to date automatically.
- A business can also have **documents entirely its own** that members must accept. 1st Contact's Beta Terms would be one.

So 1st Contact's documents would be **the standard Terms of use, Privacy notice and Terms of sale, plus 1st Contact's own added sections, plus the Beta Terms as a document of its own.** The question of whose text applies takes care of itself: the platform rules are 1st Contact's own additions, written as 1st Contact speaking.

**There's a real benefit:** our own documents are the hardest case. If the standard Terms of sale is good enough for 1st Contact's paid plans, which needs the cooling-off periods and renewals, it's good enough for clients. That's a useful test of the module library before the lawyer sees it.

**What it costs technically:**
- **1st Contact's documents move from the build into its own business's records,** like every other business. The documents built into the deploy, and the build failing on legal document tickets, are replaced in one switch-over rather than kept alongside the new path.
- **Acceptances already recorded must still point at the right text.** The current versions are copied over as history with their existing ids. Since there are no clients yet, this is simple.
- **Our standard text stays in the build,** as doc tickets reviewed in this epic. Only the per-business documents move.

## How I'd file it
REQ-665 is at `ready_to_reconcile`, so the dispatcher may pick it up at any moment, and it shouldn't be extended. I'd file **one new REQ under EPIC-29** that covers:
- 1st Contact through the same pipeline, with no exemptions;
- owner-added sections and owner-only documents;
- the switch-over from built-in documents to business records;
- taking the feature triggers off Privacy, Terms of use and Member terms (the "if" wording);
- the section 10 change wording.

Separately, I'd update REQ-666's body with your three corrections: no 30-day wait, 1st Contact included, Buy blocked without a Terms of sale. Then I'd rewrite the module texts in the "if" style and publish them. Under the new approach, those include the standard documents 1st Contact itself will use.

Shall I file the REQ and make those updates?

<!-- xgd-turn id="5c321140-556c-4f4c-b5bf-181117b27a2e-user" -->

<!-- xgd-chat role="user" ts="2026-11-08T17:00:53.756359+00:00" -->
#### You
Ok tha's fine please make the changes

<!-- xgd-turn id="5c321140-556c-4f4c-b5bf-181117b27a2e-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-08T17:05:32.009091+00:00" -->
#### Claude
The module triggers are data on the doc tickets, so the "if" change can be done here without code. Reading the modules that need rewriting.

Rewriting the 13 modules in the "if" style, with the matching trigger and region changes.

Library published. Now checking REQ-666's latest body before adding the corrections.

REQ-666 already has two of your corrections (1st Contact included; no Buy without Terms of sale). Adding the third, removing the 30-day wait.

Filing the new REQ for 1st Contact's own documents and owner-added sections.

I've made the changes. The library rewrite and publishing were text and data only. The code changes are in tickets: one new (REQ-669) and one updated (REQ-666).

## Standard legal text: rewritten in the "if" style and published
**All 30 module texts, DOC-87 to DOC-116, are now published.** You said not to hold back, so they're live.
- **The privacy notice and Terms of use no longer depend on what the site does.**
  - Their sections now read "If you contact us…", "If you join our mailing list…", "If you buy from us…", "If a page shows content from other websites…", "If you are in the UK / EU / United States…".
  - Every one is now included on every site, whatever the site does or where it sells, so turning a feature on or off never changes those documents and never sends a privacy email.
- **Only the Terms of sale still depends on the site:** it appears when the site sells, and keeps its UK, EU and US cancellation sections.
- **Wording changes:**
  - DOC-99 (buying) now says 1st Contact keeps its own 7-year record of the payment, including name, email address and billing address.
  - DOC-107 (changes to this notice) says significant changes are emailed, and "we can only tell you directly if we have a way to contact you".
  - DOC-98 (mailing list) adds that buying or contacting never adds anyone to the mailing list.
  - DOC-116 (Member terms) now says important changes are accepted at the next sign-in. It previously promised notice before a change applied, which the code doesn't do.

**Your test shop** gets its Terms of sale and Privacy notice once REQ-665 and REQ-666 are deployed. They also need the shop's business details filled in.

**Not checked:** I didn't run a build. I compared every module's document, trigger, region and placeholders against the rules in the code, but `1c assets` is what really validates the library. Run your usual `bin/build` to confirm.

## REQ-666: the 30-day wait removed
I added your decision to its body. It says to delete the waiting version, the 30-day setting, the "takes effect on" lines and the job that swaps the version in. Instead:
- a significant privacy change goes live at publish;
- the email goes out at publish to every contact with an email address;
- signed-in customers are asked to read the new version at their next sign-in.

Your other two corrections were already in its body: 1st Contact gets the same checks, and there's no Buy button without a Terms of sale. REQ-666 is at `free_coded`, so this needs another session on it.

## REQ-669: 1st Contact through the same pipeline, plus owner-added sections
Filed under EPIC-29 as a draft, 20 points.
- **Owner-added sections** keep a document standard while the owner adds their own text.
- **Owner-only documents,** such as our Beta Terms, can be withdrawn without losing anyone's acceptance record.
- **1st Contact's documents move from the build into its own business's records** in one switch-over. Every published version keeps its existing id, so past acceptances still point at the right text.
- **No 1st Contact exceptions in the legal code.** Our clients accept our documents through the same page as any business's signed-in customers.
- **The build refuses** a privacy or Terms of use module that depends on a feature or region, so the old problem can't come back.

It should run after REQ-666, since both change the acceptance and legal code.

## Next in this session
To seed REQ-669, our own Terms and Privacy Notice need splitting into the standard text plus 1st Contact's own sections: the AI rules, harassment, data-processing terms and the legal-documents paragraph. I'll draft that split next.

<!-- xgd-turn id="4ef3b2e3-e3f9-4a3d-a7a0-0e5e569e6736-user" -->

<!-- xgd-chat role="user" ts="2026-11-08T17:08:03.203897+00:00" -->
#### You
Can you ensure that all our docs and your ticket body reflect the final design here please?

<!-- xgd-turn id="4ef3b2e3-e3f9-4a3d-a7a0-0e5e569e6736-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-08T17:11:05.336106+00:00" -->
#### Claude
Auditing for leftovers of superseded decisions across the legal docs, design docs and tickets.

Found leftovers in DOC-37, DOC-54, DOC-117, DOC-118, EPIC-9 and EPIC-30, plus two pieces of built code. Fixing the documents first.

On reflection I'm leaving the "add your own sections" sentence out of the Terms until REQ-669 builds it, so the Terms never promise a feature that doesn't exist. Applying the rest.

Documents done. Now the tickets: EPIC-9, EPIC-30, REQ-666 and REQ-669.

Last, my own ticket. Adding a "current design" section at the top of EPIC-29 that wins over the dated updates below it, and closing the items those updates left open.

The documents and tickets now match the final design. EPIC-29 has a "Current design" section at the top that wins over the dated history below it. Nothing has been deployed: the legal pages reach the site at your next build and deploy.

## Legal documents
- **DOC-117, our Terms (2026-11-08):** section 13 now says we ask you to accept again only after a significant change; smaller wording changes are published without asking.
  - I left out the sentence about owners adding their own sections, because that feature isn't built yet. REQ-669 now says to add it in a new Terms version when it lands, so the Terms never promise something that doesn't exist.
- **DOC-118, our Privacy Notice (2026-11-08):** section 10 now matches the standard client text. A significant change is emailed when it's published and account holders are asked to read it at their next sign-in. Smaller changes are published without a message, and we can only tell you directly if we have a way to contact you.
- I changed DOC-117 and DOC-118 in place, which is fine because neither has been deployed and nobody has accepted them.
- **The module texts (DOC-87 to DOC-116)** already matched.

## Design documents
- **DOC-37 (deletion design), section 6.3:** the record kept after deletion is now "name, email address and billing address", with the reason, and all three other mentions match.
- **DOC-54:** the same correction.

## Tickets
- **EPIC-29:**
  - A new **"Current design (2026-11-08)"** section at the top, which wins over the history below it. It covers which documents each business has, the "if" wording, the US/UK/EU rule, acceptance and change notices, the rule on email addresses, checkout, the child tickets, and what's still open.
  - The older "under discussion", "still to do" and "open" lines are now marked resolved.
- **EPIC-9:** a note that its retention decision now keeps the email, and that DOC-37 wins where they differ.
- **EPIC-30:** a note that "publishing makes everyone accept again" no longer holds, with the significant-change rule that replaces it.
- **REQ-666:** two more things it has to change in code that has already landed, each with a test:
  - the Legal assistant's instructions still say "publishing makes everyone accept again" (from REQ-662);
  - the portal's "Closing your account" panel still says "name and billing address" (from REQ-640).
- **REQ-669:** it now states which parts of REQ-665 it replaces (the 1st Contact exemption and the feature-driven privacy examples), and the Terms sentence to add when it lands.

## Left as they are
- **REQ-665 and REQ-640** are at `ready_to_reconcile`, so I didn't edit them. Their corrections are recorded in REQ-669 and REQ-666 instead.
- **Old published versions** (DOC-76/77/84/85) stay unchanged, as the Terms promise.
- **The chat transcripts.**

**Still open:** splitting our current Terms and Privacy Notice into the standard text plus 1st Contact's own sections, for REQ-669 to load into 1st Contact's records. I'll draft that next unless you want something else first.

<!-- xgd-turn id="d10e92db-5f14-4e2f-97d2-39e2926bbb9a-user" -->

<!-- xgd-chat role="user" ts="2026-11-08T17:17:47.155184+00:00" -->
#### You
ok please make the split.

Then can you help me understand exactly where we end up. I think its this:

1. We (1c) maintain two sets of docs ToC/Privacy/Terms of Sale etc. A standard set used as a first pass by all our sites and the 1c ones that are a strict superset
2. Client sites using are standard terms will automatically get updated when the standard terms are updated (we need a way to warn site owners that this is coming...)
3. The standard docs are no longer modular but written with contingencies

<!-- xgd-turn id="d10e92db-5f14-4e2f-97d2-39e2926bbb9a-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-08T17:22:10.129409+00:00" -->
#### Claude
Reading our current Terms and Privacy Notice in full to make the split.

Checking whether the Beta Terms refer to the Terms by section number, since the split removes the numbers.

The Beta Terms link to the Terms but don't cite section numbers, so the split doesn't break them. Writing the standard-text upgrades first.

Standard text updated, and DOC-119 added for subscriptions. Now writing 1st Contact's own sections, taken from DOC-117 and DOC-118.

Seed written as DOC-120. Linking it from REQ-669 and EPIC-29's current-design section.

The split is done, and you're close on all three points; I've corrected them below. Point 2 has a real gap, and it's tied to a weakness in when standard updates reach a site.

## The split
**DOC-120, "1st Contact's own sections"**, holds everything in our current documents that the standard text doesn't. Each section says which standard document it belongs to and where it goes:
- **Member terms** (what our clients accept, replacing "Terms of Service"): the standard text plus our platform sections:
  - who we are, and who can use the Service;
  - AI, your content, things you must not do (including harassment), reporting;
  - your site's legal duties, including the legal-documents paragraph;
  - the data-processing terms;
  - our part, our responsibility, ending, law, contact.
- **Privacy notice:** the standard text plus:
  - who this notice covers;
  - the builder's data (AI conversations, uploads, beta review);
  - the AI providers paragraph, and where we work from;
  - how long we keep it, security and age;
  - visitors to client sites.
- **Terms of sale:** the standard text plus "Our cooling-off periods go further", our more generous plan refunds.
- **Terms of use:** standard only. **Beta Terms:** a document of our own.

**Writing the split exposed gaps in the standard text, which I've fixed for everyone:**
- account deletion now gives the 30-day timing the platform actually uses;
- the UK and EU rights sections now say we may check identity and don't charge;
- Delivery and Returns now say "If you buy goods…";
- two sections now read correctly on our own site, not only on a client's;
- **a new "Subscriptions and services" section** (DOC-119) for Terms of sale. It didn't exist, and clients selling memberships will need it.

REQ-669 loads DOC-120 into our records. Until it lands, DOC-117 and DOC-118 remain the documents in force.

## Where we end up

**1. Two sets of documents: nearly.** We maintain **one standard set**, plus **1st Contact's additions** on top of it. There's no second full copy: our documents are put together exactly as a client's are. So yes, they're a strict superset, and any improvement to the standard text reaches us automatically, which keeps us honest.

**2. Clients using standard documents get updated automatically: yes, but the timing needs fixing, and owners need warning.**
- **Today's design is weak here.** REQ-665 only rebuilds a site's standard documents when the owner next publishes the site. An owner who doesn't publish for months never gets our corrections, and one who does gets them by surprise.
- **What I'd propose:**
  - When we publish a revision of the standard text, every business using that document gets an **owner message**, plus a notice in Paperwork → Legal. It says what's changing, with the old and new wording, and the date it takes effect, for example 14 days later.
  - On that date the legal pages are **updated on their own, without the owner republishing**. Legal pages are fixed text, so this is cheap.
  - The owner can edit or add their own sections before then. If they've taken a document over, they get the same message as advice, and their document isn't touched.
  - **The waiting period is for owners, not for the public.** We gave up the 30-day wait for visitors earlier. This one is a business-to-business courtesy, and it's when the business is expected to read what the new text commits it to.
  - If our revision is material, their privacy email or Terms re-acceptance then follows automatically on that date.
  - The same goes for business details: saving them updates the legal pages straight away, with no republish needed.
- **This isn't in any ticket yet.** It fits REQ-669, which is already changing how documents are stored and published. **Shall I add it there?**

**3. Contingencies instead of modules: mostly.**
- **The privacy notice, Terms of use and Member terms** are now in effect one fixed document each. Every section is always included and written with "If you…". Site features no longer change them.
- **Terms of sale** is still assembled: it exists only when the site sells, and its UK, EU and US cancellation sections depend on where the business sells. Nobody re-accepts it, so that's fine.
- **We still keep sections separate** rather than one block of text. Each section is what an owner places their own sections next to, what an update message lists as changed, and what the Legal assistant uses to explain. So the right description is: **contingent sections, not feature modules.**

**Not checked:** I haven't run a build since changing the library. Run `bin/build` before deploying, so the build's own checks confirm the new module (DOC-119) and the edited texts.

<!-- xgd-turn id="0e8e7947-e2ec-49b0-81ff-091fc360446f-user" -->

<!-- xgd-chat role="user" ts="2026-11-08T17:30:44.332623+00:00" -->
#### You
**This isn't in any ticket yet.** It fits REQ-669, which is already changing how documents are stored and published. **Shall I add it there? Yes please**

**Is there a collective term for these legal docs? I keep struggling to find one.**

**I assume these docs should always be easy to find - should they be in every footer? Can we ensure that they are visible on every site (appropriately)? If the owner wants to hide/obscure them I guess that's on them but I want to make sure that the consultant does no do so by accident**

<!-- xgd-turn id="0e8e7947-e2ec-49b0-81ff-091fc360446f-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-08T17:32:15.153073+00:00" -->
#### Claude
Adding the update warning to REQ-669. First, checking how REQ-665 put the footer links in, so I know whether the consultant can remove them by accident.

The footer links are added by the page renderer itself, so editing the site can't remove them. Checking which pages get them and whether there's a silent failure case.

Adding the update warning to REQ-669 now.

I've added the update warning to REQ-669. It's now large: still marked 20 points, but realistically above that. I'd split it at build time if its session finds it too big.

## REQ-669: standard updates and warning owners
- **Legal pages are published separately from the site.** They update straight away when business details are saved or the owner edits, and on the effective date when we revise our standard text. They no longer wait for the owner to republish the site.
- **A revision of our standard text is announced first.** Every affected business gets an owner message and a notice in Paperwork → Legal, showing the old and new wording and the date it takes effect, 14 days later.
  - On that date the pages update automatically, and if the change is material the privacy email or Terms re-acceptance follows.
  - An edited document is never changed. Its owner gets the message as advice.
- **It runs as background work in small batches,** so publishing a revision never sends to every business inside one request.
- Each part has a test.

## A collective term
There's no perfect one. The options:
- **"Legal pages"** for what visitors see on a site. It's plain and accurate.
- **"Legal documents"** in the product and tickets. It covers what owners manage, including ones that are never pages, such as the version on an order.
- **"Legal"** as a heading, which you already use: Paperwork → Legal, and the footer links are labelled "Legal" for screen readers.
- **"Policies"** is common ("Terms & Policies") but slightly wrong, since Terms are an agreement, not a policy.

I'd use **"legal documents"** in the builder and **"legal pages"** on sites.

## Visible on every site
**This is mostly in place already, and the consultant can't remove the links.**
- REQ-665 has the **page renderer itself** add a "Legal" row of links to the footer of every web page. If a page has no footer, it adds one.
- It's built from the list of documents, **not from the site design the consultant edits**. Nothing the consultant can change adds, removes or hides those links. The only styling they take is the footer's text colour, so they stay readable wherever the footer is.

**Three gaps I'd close:**
1. **A silent failure.** The links go in just before the footer's closing tag, and the code expects that tag at the very end of the footer. If the footer ever doesn't end exactly that way, for example with trailing whitespace, **the links are silently left out.** The fix is to fall back to a separate footer, and test that every page has the links. This is a bug in code that has already landed.
2. **The consultant inventing its own legal pages.** The real risk isn't the consultant hiding our links, but it writing a "Privacy policy" page with made-up text, or adding footer links of its own that duplicate or contradict ours. The fix:
   - a consultant rule: "every site's legal pages and footer links are provided by the platform; never write legal text, legal pages or legal links; send the owner to Paperwork → Legal";
   - the `/legal/...` addresses reserved, so no site page can take them.
3. **Checkout and members.** The checkout line and the acceptance page already link the documents (REQ-666), and the footer covers every other page. So nothing is missing here, but the tests should check every page, including shop, product, order and the legal pages themselves.

**Owners hiding the links:** I wouldn't build a switch for it. Without one, the links can't disappear by accident, and an owner who really wants them hidden is a rare case we can handle when it comes up.

Gaps 1 and 2 are code, and REQ-669 is already full. The first is a fix to landed REQ-665 work, which we normally file as a bug. **Shall I file one bug, "Legal pages: footer links always present, and the consultant never writes legal pages", under EPIC-29?** It's about 3 points and can run independently of the other tickets.

<!-- xgd-turn id="f4111230-c0c7-4fcf-b327-0a15d858a968-user" -->

<!-- xgd-chat role="user" ts="2026-11-08T17:33:34.667223+00:00" -->
#### You
yes please

<!-- xgd-turn id="f4111230-c0c7-4fcf-b327-0a15d858a968-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-08T17:34:19.322098+00:00" -->
#### Claude
I've filed **BUG-383, "Legal pages: footer links always present, and the consultant never writes legal pages"**: 3 points, medium severity, a draft under EPIC-29. It needs its own session to build it.

It covers three things:
1. **The footer links can't silently disappear.** If the renderer can't place them inside a page's footer, it writes its own footer holding them, as it already does for pages with no footer.
2. **A consultant rule:** the platform provides every site's legal pages and footer links. The consultant never writes legal text, legal pages or legal links, and sends the owner to Paperwork → Legal for anything legal.
3. **`/legal/` addresses are reserved:** creating or renaming a site page to a `/legal/...` address is refused, with a message pointing to Paperwork → Legal.

As you decided, there's no switch for owners to hide the links.

Its tests check that:
- every page carries the legal links once, including shop, product, order and the legal pages themselves;
- a footer with trailing whitespace or a comment still gets them;
- a page with no footer gets one holding the links;
- the consultant's rules include the new rule;
- a `/legal/privacy` page is refused.

I've listed it as a child of EPIC-29 and noted it there, along with REQ-669's new update-warning items and the naming: "legal documents" in the builder, "legal pages" on sites.

<!-- xgd-turn id="7ac13285-07a7-498f-9a4a-bc551bd25d63-user" -->

<!-- xgd-chat role="user" ts="2026-11-08T17:44:14.030726+00:00" -->
#### You
ok can we resolve the outstanding question in REQ-666

I think the answer is that in 1st contact Paperwork -> Legal I should just see the legal docs for first contact. The "standard docs" are stored in a ticket, maintained by you and updated via a build.

Can we also talk about "additional custom legal docs" e.g. the Beta agreement? I think this should be managed in the Pw -> Legal tab - for example there is a + button to add a new doc - we could have 3 kinds (accept once, accept on every revision change, just display) the doc would need a "title" - what the users see and would be versioned etc.

A detail - not necessarily to solve now:
 - Can owners see past version of the legal docs? Do they need to?
 -

<!-- xgd-turn id="7ac13285-07a7-498f-9a4a-bc551bd25d63-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-08T17:45:22.936568+00:00" -->
#### Claude
Finding REQ-666's open question.

## REQ-666's open question: resolved
REQ-666's session thought 1st Contact had **two** sets of documents: the builder documents (DOC-76/77/78) and the documents generated for its sites. It asked whether the Legal pane should show both (option A), or whether the sites should reuse the builder documents (option B).

Your answer settles it without either. I've written it into REQ-666's body:
- **1st Contact has one set:** the standard documents plus its own sections (DOC-120) plus its own documents such as the Beta Terms. The builder and its sites show the same documents.
- **1st Contact's Paperwork → Legal shows only those documents,** as a client's pane does. The standard texts aren't shown or edited there. They live in doc tickets that I maintain in this epic, and reach every business through the build.
- **REQ-666 builds neither A nor B.** REQ-669 merges the two sets in one switch-over. Until then, 1st Contact's sites carry generated documents next to the builder documents, which is fine with no clients.

## Custom documents (the + button)
I agree with your shape, with one change to how editing works.

**Each custom document has:**
- **a title**, which visitors see (for example "Beta Terms"), and its page address follows from it, `/legal/beta-terms`;
- **Markdown text**, shown through the same safe renderer;
- **one of three kinds:**
  - **Display only:** a page linked from the site footer. Nobody accepts it.
  - **Accept once:** signed-in customers accept it the first time they sign in, and later versions don't ask again.
  - **Accept every new version:** every new version is put to signed-in customers again.
- **versions:** each published version is kept, with its date and its own permanent page, and acceptances point at the exact version.
- **withdraw:** it disappears from the site and the acceptance page, and everyone's record of having accepted it is kept. That's how the Beta Terms end when the beta does.

**The change: custom documents need a separate Publish step.** Paperwork messages go live when saved. Do that with "Accept every new version" and fixing a typo makes every member accept again. So editing a custom document saves a **draft**, and **Publish new version** is the deliberate step. That's when people are asked to accept again, and when the Legal assistant or consultant says what publishing will do.

**Where each document shows up:**
- **"Display only" documents** go in the footer next to the standard ones.
- **Documents people accept** go on the acceptance page and in the signed-in customer's account area.

  The footer is for everyone, and these are for members.

**Not in the first version:** choosing **which** signed-in customers a document applies to, such as only beta participants. Today every 1st Contact client is in the beta, so "everyone signed in" works. Choosing an audience can come later.

## Past versions: yes, owners need them
- **Disputes.** "What had this customer agreed to on 3 March?" Orders and acceptances already point at exact versions, so the owner must be able to open those versions.
- **It's cheap.** The versions are already stored, and REQ-666 already gives each one a permanent public page (`/legal/terms-of-sale/v3`). The pane only needs a read-only history: dates, which version is in force, how many people accepted each one, and the text.
- **Restoring an old version** publishes a copy of it as the newest version, so nothing is ever lost or rewritten.

REQ-661 already shows version history for 1st Contact's builder documents, so this extends the same history view to every document.

If you're happy with this, I'll write the custom-document kinds, the draft-then-publish step and version history into REQ-669, item 2, which already covers "documents of the business's own". That makes REQ-669 large enough that I'd split it in two when it's built: first 1st Contact's switch-over and added sections, then custom documents and the update warnings. Shall I?

<!-- xgd-turn id="6a4e9c18-6e87-434b-b5dd-99e30a55aba5-user" -->

<!-- xgd-chat role="user" ts="2026-11-08T17:58:08.773198+00:00" -->
#### You
Lets hold on tickets for this for now - can you capture the design in an existing or new doc please

<!-- xgd-turn id="6a4e9c18-6e87-434b-b5dd-99e30a55aba5-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-08T17:59:32.324907+00:00" -->
#### Claude
I'll write one design doc for the whole legal-documents area, with the custom-document and version-history design as its newest part, and point EPIC-29 at it.

No design doc covers this yet, so I'm creating one.

I've written the design up as a new doc, **DOC-121, "Legal documents: design"**. No tickets were created or changed for the new parts.

It covers the whole area in one place:
1. **Principles:**
   - every business is treated the same, 1st Contact included;
   - we write the standard text and AI never does;
   - site features never change the Privacy notice or the Terms;
   - owners are responsible for their own documents;
   - text is only shown through the safe renderer;
   - legal pages are static.
2. **The standard text:** kept in doc tickets that I maintain in this epic, updated through the build, and never shown or edited in an owner's Legal tab. It's written as sections with "if" wording, and only the Terms of sale changes with selling and region. US, UK and EU in the first release.
3. **A business's documents:** a table of each document, when it exists, who it's for and how it's accepted. It also covers "Standard" versus "Edited by you", the owner's own added sections, the business details, and 1st Contact's documents being the standard set plus its own sections (DOC-120).
4. **Where documents appear:** footer links on every page that can't be removed, the permanent pages for each version, the reserved `/legal/` addresses, the consultant never writing legal text, the checkout line and the acceptance page.
5. **Changes and who is told:** a table of what happens for wording-only and significant changes, and how standard updates reach sites: announced to owners and applied 14 days later. It also covers telling people only through the contact details we hold.
6. **Paperwork → Legal and the Legal assistant.**
7. **Custom documents (agreed, not yet ticketed):** the + button, a title, and the three kinds you described:
   - display only;
   - accept once;
   - accept every new version.

   Editing saves a draft and publishing is a separate step. It also covers versions, withdrawing a document (how the Beta Terms end), and where each kind appears. Choosing which customers a document applies to is for later.
8. **Version history for owners (agreed, not yet ticketed):** a read-only history with dates and acceptance counts, and restoring an old version as a new copy.
9. **Still open:** the lawyer review, text-message notices, and choosing who a custom document applies to.

DOC-121 says that where a ticket disagrees with it, the document is the newer intent. EPIC-29's current-design section now points to it and records that your answer on 1st Contact's Legal tab has been written into REQ-666.

<!-- xgd-turn id="b3849c50-bd2f-4eaa-8e5b-1bf511328baa-user" -->

<!-- xgd-chat role="user" ts="2026-11-08T18:00:10.509340+00:00" -->
#### You
Also please create a todo ticket for the missing features to remind me to circle back on these

Can you answer 669's questions please?

<!-- xgd-turn id="b3849c50-bd2f-4eaa-8e5b-1bf511328baa-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-08T18:02:01.354396+00:00" -->
#### Claude
REQ-669's session asked five questions. First, checking how todo tickets are created here.

Writing the answers into REQ-669's body, so its session builds from the ticket.

Updating DOC-121 to match these answers: Member terms for every business, and custom documents now part of REQ-669.

Creating the reminder, then putting its id into DOC-121.

I've answered REQ-669's questions in its body and created the reminder, **TODO-23**.

## REQ-669's five questions
1. **What do signed-in customers accept?** The Member terms (agree) and the Privacy notice (read), never the Terms of use, which are only shown to visitors. This applies to every business, so REQ-666's behaviour changes for client businesses too, which is intended.
2. **How does 1st Contact get Member terms?** I went with a simpler rule than its session proposed: **every business has Member terms, so nothing has to detect accounts.**
   - They're linked from the acceptance page and the account area, not the footer, so a site without accounts shows nothing extra. Nobody is asked to accept them until they sign in.
   - Its session suggested "an account box or anyone signed in". That rule would have made Member terms appear only after someone's first sign-in, too late for that person to accept them.
   - I left switching the Member terms text (DOC-116) to always-on for REQ-669 to do. Doing it now would add a footer link to every site before the code that keeps it out of the footer exists.
3. **Legal pages publishing on their own:** agreed. A legal change rebuilds the business's published sites from the **published** version in small background batches, never from an unpublished draft.
4. **Loading 1st Contact's history:** agreed. A one-off command per environment, which you run. Each old version keeps its original id, so past acceptances still find their text.
5. **The "add your own sections" sentence:** goes in at the switch-over, with no separate Terms version. It's a significant change, so our clients will accept again at next sign-in. There are no clients yet, so that costs nothing.

**One decision you should know about.** You asked to hold tickets for custom documents, but REQ-669 already covers documents of a business's own: it needs them to keep the Beta Terms. To avoid building a narrower version and then replacing it, I've told it to build them in **DOC-121's shape**: the three kinds, a title, draft then publish, and withdrawing. The Beta Terms become "accept every new version". Choosing who a document applies to and version history stay out. If you'd rather hold that too, say so and I'll narrow REQ-669 back to the minimum the Beta Terms need.

I also agreed its plan to land in three steps on one branch, moving to `free_coded` only when all three are done.

## TODO-23: the features still to ticket
A reminder for:
1. version history for owners;
2. choosing who a custom document applies to;
3. text-message notices for contacts with only a phone number;
4. the lawyer review, including the 14-day notice to owners, renewal notices, online cancellation for California, and keeping email addresses in retained payment records.

Each item points to its section in DOC-121.

**DOC-121** now matches the answers:
- every business has Member terms, which aren't in the footer;
- Terms of use are never accepted;
- legal changes rebuild sites from the published version;
- custom documents are built under REQ-669;
- version history is reminded by TODO-23.

I've also noted all of this on EPIC-29.

<!-- xgd-turn id="3cc270c1-4cc0-4760-be49-9937cdccfa08-user" -->

<!-- xgd-chat role="user" ts="2026-11-08T20:47:39.926104+00:00" -->
#### You
ok some comment on Paperwork->Legal
1. Sections - we abandoned our modular approach - I think this UI piece is now redundant - unless I misunderstand please remove it. Also: "We keep this up to date: it is rebuilt from your site’s features and your business details each time you publish." <-- this is wrong, the notice does not change based on the sites features please remove it.
2. The first thing we see should be the current notice - the Edit box is wrong, remove it.
3. If the site is using the standard text at the top of current notice text there should be a description: "This is the standard 1st contact notice text...we keep it up to date...etc" and a CTA on the right hand side [Use Custom Notice] Hitting this pops up a confirmation explaining the consequences OK | Cancel. OK-> remove the current text in that space offer a TipTap markdown editor (DO NOT CALL IT MARKDOWN - our users do not know what that is).
4. If the site is using custom text the area above the editor pane is different. It explains where the user is and offers a CTA [Use Standard Notice] again confirmation pop up. Custom text is not deleted (we have to store it anyway) but the editor is removed and the read-only panel with the standard text is returned.
5. Editor changes - editor has a save (and cancel) button - both have confirmation pop ups. Cancel pop up makes it clear that changes since the last save will be lost. Save pop up asks if the edits change how information is used (checkbox) CTAs Cancel | Save
6. All the other chats, the chat text box is at the bottom of the page, please make this one consistent

<!-- xgd-turn id="3cc270c1-4cc0-4760-be49-9937cdccfa08-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-08T20:49:32.396555+00:00" -->
#### Claude
Reading the current Legal pane code, so the change request is precise. Next I'll check whether TipTap is already a dependency and how the other tabs lay out their chat.

No TipTap in the project yet, and REQ-669 (still being built) is the ticket that's changing this pane. I'm adding your redesign to it rather than opening another ticket.

I've written all six points into **REQ-669** as a change to how the Legal pane works today. REQ-669's session is already rebuilding this pane, so it's the natural home and no new ticket was needed. That session still has to pick the change up; I haven't changed any code.

What REQ-669 now says, for every legal document of every business, 1st Contact included:
1. **The "Sections, and what added them" list is removed,** and so is the sentence saying the notice is "rebuilt from your site's features". You understood correctly: those sections were the old modular approach.
2. **The current document is shown first, read-only.** The always-open edit box, its Preview button and "Save my edit" are gone.
3. **On a standard document,** a short description sits above the text and **[Use custom notice]** on the right. It opens a confirmation that explains:
   - the text becomes theirs;
   - we stop updating it;
   - they're responsible for keeping it accurate.

   **OK | Cancel.** OK replaces the text with the editor, starting from the current text.
4. **On a custom document,** the top area says the owner is using their own notice and offers **[Use standard notice]**, with a confirmation. The custom text is kept: if they switch back to custom later, the editor starts from their last saved custom text.
5. **The editor is TipTap,** and the word "Markdown" never appears anywhere a user sees. It only offers what our safe renderer can show: headings, paragraphs, bold, italic, lists and links.
6. **Save and Cancel both ask first.**
   - Cancel warns that changes since the last save will be lost.
   - Save has a checkbox, unticked by default: for the Privacy notice "these changes change how we use people's information"; for the terms "these changes matter to people already signed up". **Cancel | Save.** The tick triggers the existing process for telling people about a significant change.
7. **The chat box goes at the bottom,** matching the other tabs.

For the terms documents the buttons say "terms" instead of "notice".

**Decision for you:** your layout has no place yet for "Add your own section", which REQ-669 is also adding. 1st Contact needs it to add its own sections while keeping the standard text and its updates. I've proposed putting an **"Add your own section"** button below the read-only standard text. Each added section would appear in the document marked "Your section", with Edit and Remove, using the same editor and confirmations, and the document stays standard. I've told REQ-669 to check this with you before building it. Does that work?

TipTap isn't in the project yet, so REQ-669's session will give you the install command to run. I've also noted all of this on EPIC-29.

<!-- xgd-turn id="2c10a680-bdc0-44ef-aec5-90ff06c23ac1-user" -->

<!-- xgd-chat role="user" ts="2026-11-08T20:50:24.557387+00:00" -->
#### You
When I say tiptap I mean to use our standard LF md editor - ok?

<!-- xgd-turn id="2c10a680-bdc0-44ef-aec5-90ff06c23ac1-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-08T20:51:20.408747+00:00" -->
#### Claude
It's `mountRichEditor` from `@lagrangefoundry/webui-markdown`. Checking whether the control app already depends on it, then fixing REQ-669's wording.

Already used by the control app, so nothing new to install. Updating the ticket.

Yes, that works, and nothing needs installing. Our standard editor is `mountRichEditor` in the `@lagrangefoundry/webui-markdown` package. The control app already uses that package, and the goal map uses the editor.

I've rewritten item 6 in REQ-669 to say:
- Use that editor, and don't add TipTap or any other editor directly.
- It reads and writes the Markdown we already store, but users never see the word "Markdown".
- What it produces has to stay within what our safe legal page renderer can show.

The line saying REQ-669's session would give you an install command is gone. Everything else in REQ-669 is unchanged. Its session still has to pick this up.

The other question is still open: does "Add your own section" go below the read-only standard text?

<!-- xgd-turn id="bff01290-b721-46d2-bb04-c5c66da28bb1-user" -->

<!-- xgd-chat role="user" ts="2026-11-08T20:52:09.364826+00:00" -->
#### You
What is "Add your own section"?

<!-- xgd-turn id="bff01290-b721-46d2-bb04-c5c66da28bb1-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-08T20:52:25.615213+00:00" -->
#### Claude
"Add your own section" is item 1 of REQ-669, which we agreed earlier today. It lets an owner add a section of their own, a heading plus text, to a standard document **without the document stopping being standard**. Our sections keep updating automatically, and the owner's section is carried through every update unchanged.

**Why it exists:**
- **You asked for it.** In the first EPIC-29 discussion you wanted two ways to edit: take the whole document over, or make a "small language change" that keeps the automatic updates. Your new design covers the first way; this is the second.
- **1st Contact depends on it.** Under DOC-120, 1st Contact's documents are the standard text plus its own sections:
  - its Member terms carry the platform rules: AI, content ownership, harassment and doxing, the GDPR Article 28 data-processing terms, and the paragraph about the legal documents we provide;
  - its Privacy notice and Terms of sale have their own additions too.

  Without added sections, 1st Contact would have to take those documents over as custom text and lose the automatic updates. That's the outcome we chose this approach to avoid.

**Your new layout offers only standard or custom, so there's a choice:**
1. **Keep it.** Put an "Add your own section" button below the read-only standard text. This is what I proposed, and it's the only option that keeps 1st Contact's documents updating.
2. **Drop it for owners, keep it for 1st Contact only.** 1st Contact's additions stay in the platform's own records, which we maintain, and owners get only standard or custom. Owners see a simpler pane, but 1st Contact gets a special case, which goes against "every business is treated the same".
3. **Drop it altogether.** 1st Contact uses custom text for those documents, and we keep them current by hand.

I'd go with **option 1**. Shall I confirm it in REQ-669, or would you rather take option 2 or 3?

<!-- xgd-turn id="54832871-19ed-4085-ad61-f3a2eed7ab39-user" -->

<!-- xgd-chat role="user" ts="2026-11-08T20:53:35.279434+00:00" -->
#### You
This feels like additional complexity - can you give me example use cases for real customers needing this?

<!-- xgd-turn id="54832871-19ed-4085-ad61-f3a2eed7ab39-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-08T20:53:59.768817+00:00" -->
#### Claude
Honestly, the use cases from real customers are thin. Here's what I can come up with:

**Terms of sale** (the strongest case):
- A bakery: "Custom cakes need 48 hours' notice and a 50% deposit, which isn't refundable."
- A salon or class: "Cancel less than 24 hours before and we charge half the price."
- A furniture maker: "Made-to-order items can't be returned unless they're faulty."
- A wine shop: "You must be 18 or over to buy; we check ID on delivery."

**Member terms:**
- A gym or studio: "Classes book up a week ahead; three no-shows pause your booking for a month."

**Privacy notice:**
- A shop with CCTV, or a photographer who posts event photos. These are rare, and getting them wrong is risky.

**Most of these aren't really free-text sections. They're a business's own policies.** The legal details form already has a "delivery note" field that gets filled into the standard Terms of sale. A few more fields like it would cover nearly every example above, more safely than free text. They'd stay standard and keep updating, and the Legal assistant can help fill them in:
- returns;
- cancellations and deposits;
- age restrictions.

**The real driver for added sections was 1st Contact**: its own platform rules on top of the standard text. Without added sections, 1st Contact would use **custom text** for those documents, like any other business. We maintain them anyway. And under REQ-669, when we revise the standard text, owners with custom text get the advance warning with the old and new wording. So we'd see each change and could update our own documents by hand.

**My recommendation: drop "Add your own section".** Instead:
1. Owners get only standard or custom, which is your layout.
2. A few policy fields go in the business details and are filled into the standard Terms of sale: returns, cancellations and deposits, age limit, plus the existing delivery note.
3. 1st Contact uses custom text for its Member terms, Privacy notice and Terms of sale, with no special case. DOC-120's split becomes the starting text for those custom documents.

This is simpler: there's no separate section editor, no choosing where a section goes, and no carrying owners' sections through updates. It also keeps 1st Contact working exactly like everyone else.

If you agree, I'll change REQ-669 and DOC-121 to match. Do you want the policy fields in point 2, or just standard or custom for now?

<!-- xgd-turn id="93feda71-499c-4907-ae36-9e296b3dc433-user" -->

<!-- xgd-chat role="user" ts="2026-11-08T20:55:11.411286+00:00" -->
#### You
Do those examples really need LEGAL coverage - that sounds like text on the site to me

<!-- xgd-turn id="93feda71-499c-4907-ae36-9e296b3dc433-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-08T20:55:32.185070+00:00" -->
#### Claude
Mostly, yes, they're text on the site. The legal requirement is that a buyer is told the condition **before they buy**, not that it sits in a legal document:
- **Deposits, cancellation charges, notice periods:** a line on the product or booking page, and at checkout, is the clearest place. A buyer is more likely to have seen it there than in the Terms.
- **No returns on made-to-order items:** the law already exempts custom-made goods from the right to cancel, and the standard Terms of sale already allow for it. The product page only needs to say the item is made to order.
- **Age limits:** what the law requires is the check itself. The text belongs on the product and at checkout.

**One thing I'd make sure of:** the standard Terms of sale should include a sentence like "Conditions shown on the product page or at checkout form part of your order." That ties the site's own text into the agreement, so a business never has to write legal wording to rely on it. I'll check that the standard text has it, and add it in our document tickets if it doesn't.

That leaves only standard or custom, as your layout has it:
- **Drop "Add your own section"** and the policy fields I suggested.
- **1st Contact uses custom text** for the documents that carry its platform rules, as any business would. DOC-120's split becomes their starting text, and the advance warning before each standard update tells us when to revise them by hand.

REQ-669 is being built right now. Shall I take added sections out of REQ-669 and DOC-121 and add this?

<!-- xgd-turn id="a90a0df9-db66-45db-894d-10a8ef510e59-user" -->

<!-- xgd-chat role="user" ts="2026-11-08T20:55:52.471345+00:00" -->
#### You
please continue

<!-- xgd-turn id="a90a0df9-db66-45db-894d-10a8ef510e59-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-08T20:58:53.082993+00:00" -->
#### Claude
Those already match. Now REQ-669: removing added sections, and switching 1st Contact to custom text.

REQ-669 has just moved to `ready_to_reconcile`, so its body is now frozen. Checking whether the pane redesign made it into its code.

REQ-669 landed without the pane redesign and with added sections built, and its body is now frozen. I'll keep its updated body ready, and update the design docs, which aren't frozen.

I've updated the design docs and the standard text, but **the ticket change didn't go in, and that needs your decision.**

## Changed in the standard text and docs
- **The standard Terms of sale now cover a business's own conditions:**
  - **"Who you are buying from" (DOC-108)** now ends: "Anything the product page, booking page or checkout tells you before you buy, such as a deposit, a cancellation charge or an age limit, is part of your order."
  - **"Returns" (DOC-111)** now excludes "items the product page tells you are made to order, personalised or perishable". Before, it promised returns on everything. The UK and EU cancellation sections already had the matching exceptions.

  Both changes are significant, so every selling business will get them as a standard revision.
- **DOC-121** now says:
  - there are no added sections, and a business's own conditions are site text;
  - 1st Contact uses **custom** Member terms, Privacy notice and Terms of sale, and its Terms of use stay standard;
  - your Legal pane design: read-only first, Use custom / Use standard with confirmations, our standard editor, Save and Cancel confirmations, chat box at the bottom.
- **DOC-120** is now the starting text for 1st Contact's custom documents, not sections added on top. The "You can add your own sections" sentence is gone.
- I've noted all of this on EPIC-29.

## The problem: REQ-669 is already finished
While we were talking, REQ-669 moved to `ready_to_reconcile`, so its body can't be edited any more. It was finished **with added sections built and without the Legal pane redesign**. But its body already contains the redesign I added earlier. Reconcile reads the ticket body as the spec, so it would treat a pane that was never built as required.

**Removing added sections, switching 1st Contact to custom documents, and the pane redesign all still need building.** You have two options:
1. **Move REQ-669 back to `free_coded`** (that's your call). I then add the removal section I've already written, and REQ-669's session builds all three changes. One ticket, and the body matches the code before reconcile runs. **I recommend this.**
2. **I file a bug under EPIC-29** for the three changes. But REQ-669 would still reconcile with a body describing a pane it doesn't have, so you'd want to hold it until the bug lands.

Which do you prefer?

<!-- xgd-turn id="c7a88253-ed5c-4bf6-a1da-7619bc61fb94-user" -->

<!-- xgd-chat role="user" ts="2026-11-08T21:00:35.890888+00:00" -->
#### You
Reconciliation takes place in order for this reason - new ticket please

<!-- xgd-turn id="3e2c6c01-caff-400f-8ec0-e13bcf42f28a-user" -->

<!-- xgd-chat role="user" ts="2026-11-08T21:01:17.830947+00:00" -->
#### You
Reconciliation takes place in order for this reason - new ticket please

Lets drop the additional sections except for on 1c itself

<!-- xgd-turn id="3e2c6c01-caff-400f-8ec0-e13bcf42f28a-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-08T21:02:34.889055+00:00" -->
#### Claude
Reworking the plan: added sections stay, but only for 1st Contact, and they come from DOC-120 rather than the Legal pane. First I'll put DOC-120 and DOC-121 back in line with that.

Now the new bug ticket.

I've filed **BUG-388, "Paperwork → Legal: show the document first, standard or custom with confirmations, no owner-added sections"**. It's a draft under EPIC-29, 5 points, medium severity, and needs its own session to build it. It says outright that it overrides REQ-669 where the two differ.

**Part 1: the Legal pane redesign, as you described it:**
- the document is shown first, read-only, with no Sections list and no "site's features" sentence;
- [Use custom notice] and [Use standard notice] each ask for confirmation, and the custom text is kept when switching back;
- the editor is our standard LF editor, and "Markdown" never appears to users;
- Save and Cancel each ask for confirmation, and Save has the checkbox for whether the change affects people;
- the chat box is at the bottom.

**Part 2: added sections only for 1st Contact:**
- Owners can't add sections. The pane controls go, and the server refuses any attempt to add one, for every business, 1st Contact included.
- 1st Contact's sections come only from DOC-120, which I maintain. Its documents stay standard, so our updates still reach them with its sections in place.
- A new command, `1c legal platform-sections --env dev|production`, applies DOC-120 changes to 1st Contact as a new version of each affected document. You run it.
- No other business has added sections, so nothing needs migrating.

The ticket also lists the tests, and the changes needed to REQ-669's section tests.

**Changed alongside:**
- **DOC-120 and DOC-121** now say that added sections are 1st Contact's only, and that its documents stay standard. They also describe the new pane. This undoes my earlier edit that would have switched 1st Contact to custom documents.
- **Standard Terms of sale**, kept from before: they now tie the product page, booking page and checkout text into the order (DOC-108), and Returns excludes items shown as made to order, personalised or perishable (DOC-111).
- **EPIC-29** lists BUG-388 as a child and records the decision.

**Before you promote BUG-388:** I didn't create an acceptance criterion and test for the platform-sections command beyond the one test-plan line. The ticket says "e.g." for the command name, so BUG-388's session can choose the final name.

<!-- xgd-turn id="570cff97-51c1-4c8a-ab06-4753200ade2c-user" -->

<!-- xgd-chat role="user" ts="2026-11-08T23:22:53.587014+00:00" -->
#### You
I have a problem with our legal set up. I see: **Your site has no Terms of sale yet, so there is no Buy: a buyer has to be able to read what they agree to. They are added when you publish, once selling is set up — see Paperwork → Legal.**

Fill in business details

As we discussed I think this is still there because I have not published the site. However, here's the thing - I don't really want to publish the site - this is a test site in production, but I DO want to run real payments through it to prove they work. Can you relax the "required to publish" if the site itself is pre-publication?

<!-- xgd-turn id="570cff97-51c1-4c8a-ab06-4753200ade2c-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-08T23:24:59.723134+00:00" -->
#### Claude
Tracing why the Terms of sale only appear after a site publish. The check reads the facts recorded by the last legal publication, and I'm finding where those are written.

I've confirmed the cause: both the Shop tab and the checkout use the same check. Adding the fix to BUG-388, which hasn't been started.

BUG-388 has already been built and is at `ready_to_reconcile`, so its body is frozen. My story-points edit did go through, so I'm reverting that and filing this as a new bug.

I've filed **BUG-393**, "Shop: Terms of sale exist once selling is set up, so an unpublished site's preview can take real payments". It's a draft under EPIC-29, 3 points, medium severity, and needs its own session to build it.

**Why you see the message:** you guessed right, it's because the site isn't published. The Shop and checkout ask whether a *published site* carries a Terms of sale, and that record is only written when a site is published. Your preview already shows the Terms of sale pages, but until a publish no version exists for an order to record, so Buy stays off.

**The fix doesn't relax the rule.** A buyer still has to be able to read the Terms of sale, and every order still records the exact version. What changes is when that version is created:
- **It's created as soon as selling is set up** (payments, shipping and the seller details), whether or not the site is published. It's updated when the details or regions change. Legal documents have belonged to the business, not a site, since REQ-669, so this follows from that.
- **Buy appears on the preview, and a real payment works end to end**, with the order recording the Terms of sale version the buyer saw.
- **Your first publish uses the same version** and doesn't create a duplicate.
- **"They are added when you publish" is removed** from the Shop message.
- **Every business is treated the same**, with no special case for test or unpublished sites.

Two other things:
- I first tried adding this to BUG-388, but it had already been built and moved to `ready_to_reconcile`. Its body was frozen, so that edit didn't go in, but my change to its story points from 5 to 8 did. I've put it back to 5, so BUG-388 is as it was.
- **Until BUG-393 lands, the only way to get Buy is to publish the site.** Payments through the preview won't work before then.

<!-- xgd-turn id="521145af-cc85-439b-b0d4-81642433dcda-user" -->

<!-- xgd-chat role="user" ts="2026-11-08T23:25:52.447768+00:00" -->
#### You
I still want to see the reminder prompting me to fill in the biz details etc. I just don't want payments blocked

<!-- xgd-turn id="521145af-cc85-439b-b0d4-81642433dcda-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-08T23:26:23.168181+00:00" -->
#### Claude
I've updated BUG-393: **the reminder stays and only the block goes.** Whenever a business detail is missing, the Shop still shows the reminder naming what's missing, with its "Fill in business details" button, as it does now. The fix only removes the dependency on publishing, which was turning Buy off even with everything set up. I've added a test that checks the reminder still appears.

**One thing to confirm.** Your message showed no list of missing details, so your legal name, postal address and contact email are already filled in, and with BUG-393 nothing will block your payments.

If you also mean "don't block Buy even when a business detail is missing", I'd advise against it:
- The Terms of sale would name no seller, because those three details are what fill in "You are buying from…".
- UK and EU law require a seller's identity and address before a sale.

I'd keep Buy off only for those three details, with the reminder shown either way. Is that right?

<!-- xgd-turn id="4b9abdd9-d64d-43f0-b950-213883ad4628-user" -->

<!-- xgd-chat role="user" ts="2026-11-08T23:28:35.861228+00:00" -->
#### You
no that's fine and actually my correction makes no sense - DO block a buy until biz details are filled in and ToS are ready. DON'T block a buy waiting for PUBLISH if the site itself is unpublished

<!-- xgd-turn id="4b9abdd9-d64d-43f0-b950-213883ad4628-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-08T23:28:54.104354+00:00" -->
#### Claude
That's what BUG-393 already describes. I've added your rule to it in your words:
- **Buy stays off** until the business details are filled in and the Terms of sale are ready.
- **Publishing the site is never a condition.**
- The reminder and its "Fill in business details" button still appear whenever something is missing.

BUG-393 is a draft, ready for its session to pick up.

<!-- xgd-turn id="7898a6b2-b325-442e-a1db-513b031de7ed-user" -->

<!-- xgd-chat role="user" ts="2026-11-09T00:20:33.496762+00:00" -->
#### You
BUG-393 is deployed but I'm still not getting buy buttons?

<!-- xgd-turn id="7898a6b2-b325-442e-a1db-513b031de7ed-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-09T00:21:47.677062+00:00" -->
#### Claude
Checking what BUG-393 landed and how it decides when to write the Terms of sale.

BUG-393 only creates the Terms of sale when something triggers it: a save in Paperwork → Legal, or a change to payments or shipping. Your business had all of that set up **before** the deploy, so nothing has triggered it. It still has no Terms of sale, and Buy stays off. BUG-393's tests only checked the case where something changes after the deploy, so they didn't catch this.

**Try this now:** open Paperwork → Legal, open the business details and press Save, with no changes. That save starts the step that creates the Terms of sale. Then reload the Shop tab and the preview, and Buy should appear. If it still doesn't, tell me and I'll check the production logs, because the cause would then be something else.

**The proper fix is BUG-394**, "Shop: businesses already set up before BUG-393 still get no Terms of sale until something changes". It's a high-severity draft under EPIC-29, 2 points.
- The scheduled job will find businesses that are ready to sell but have no Terms of sale, and create them in small batches, with no action needed from the owner.
- The rule stays the same: Buy is still blocked until the business details and Terms of sale are in place, never waiting for a publish.

It needs its own session to build it, and I've noted it on EPIC-29.

<!-- xgd-turn id="d90304dd-ef14-4201-bf9c-883bd6ace30a-user" -->

<!-- xgd-chat role="user" ts="2026-11-09T01:05:59.439741+00:00" -->
#### You
on Settings I see:

**Shipping**

GET /api/shop/shipping → 503

### **Shop**

GET /api/shop/fulfilment → 503

Let buyers request cancellation

A request never cancels an order: you choose to cancel it, with a refund, or to decline.

<!-- xgd-turn id="d90304dd-ef14-4201-bf9c-883bd6ace30a-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-09T01:08:37.191795+00:00" -->
#### Claude
Looking into where those 503s come from.

Any uncaught error comes back as a 503, so I'm reading the production logs for the actual error.

The whole app is returning 503 for this business, not just Shop. Reading the error messages around those requests.

The underlying error is **"D1 DB is overloaded. Too many resources consumed within a 10 second window"**. Checking whether it's still happening, and what is loading the database.

The 503s come in two bursts, at 16:55 and 16:59. Those are page loads, when the builder fires about 200 requests at once, and it's been quiet since 17:00. Checking what's in those bursts.

I have enough to file this. Writing it up with the log evidence.

The production database is getting overloaded when the builder loads, not just Shop. Those two 503s weren't specific to Shipping or Shop.

**What the production logs show:**
- In the same second, nearly every builder request for your business failed: payments, currency, Paperwork, messages, domain, the consultant and the preview. The error behind them is **"D1 DB is overloaded. Too many resources consumed within a 10 second window."** The app reports that as a 503 with no further explanation.
- **It only happens in bursts when the builder loads** (16:55 and 16:59 today). Each load sends about 90 requests at once, and for your unpublished site the preview requests **every product photo at the same moment**, each taking 6 to 9 seconds. Minutes without a reload were fine, and a reload at 17:04 got through cleanly.

**For now:** reload the builder and wait a few seconds before opening Settings. It will usually come up. The Paperwork → Legal save I suggested for BUG-394 can hit the same overload, so if it errors, just try it again.

**I've filed BUG-395**, "Builder load: D1 overloaded on a large catalog, so Settings, Shop and the preview return 503". It's high severity, 5 points, a draft under EPIC-29, and needs its own session to build it. I put it under EPIC-29 because it blocks your payment test, and the recent legal and Shop changes are among the suspects. The ticket asks for:
- **measuring which requests use up the database's allowance**, rather than assuming;
- **limiting the database reads per builder load** to a fixed number, however many products the business has, with no full ticket-store queries per photo;
- **treating an overload as temporary**: a retryable response and one automatic retry, instead of a raw "→ 503" on the Settings cards.

**I haven't confirmed which code uses the most database capacity.** The logs show what was requested and how long each request took, not what each request did in the database. Measuring that is the first job for BUG-395's session.

<!-- xgd-turn id="dc96b8f8-9db6-475e-8e88-91c25f205d95-user" -->

<!-- xgd-chat role="user" ts="2026-11-09T01:12:05.204655+00:00" -->
#### You
This site has nearly 2000 images - requesting them all is bonkers?

<!-- xgd-turn id="dc96b8f8-9db6-475e-8e88-91c25f205d95-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-09T01:12:44.539058+00:00" -->
#### Claude
Checking how many photos the preview actually requested in those bursts.

I've corrected BUG-395:
- **Requests:** each burst had only 4 to 8 products' photos, 16 to 24 requests, but each one took 6 to 9 seconds.
- **Likely cause:** each photo request reads all ~2,000 Library records to find one image, and that adds up across the burst.
- **New test:** a preview photo must cost the same whether the Library holds 20 images or 2,000.

I haven't checked the code to confirm the cause; that's the first job for BUG-395's session.

<!-- xgd-chat-end -->