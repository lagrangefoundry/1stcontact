---
uid: comment-02b19238
id: COMMENT-5838
type: comment
title: Comment on epic EPIC-29
created_by: xgd
created_at: '2026-10-29T23:35:13.589538+00:00'
updated_at: '2026-11-03T21:26:16.062378+00:00'
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
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-cli-session ts="2026-10-29T23:35:08Z" model="claude-opus-5-5" continued_from="dashboard" -->
*Captured by CLI Claude — paraphrased reconstruction from session memory, not raw capture.*

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

<!-- xgd-chat-end -->