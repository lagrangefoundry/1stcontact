---
uid: comment-7796efec
id: COMMENT-5833
type: comment
title: Comment on goal GOAL-50
created_by: xgd
created_at: '2026-10-29T21:09:26.409293+00:00'
updated_at: '2026-11-02T22:35:36.955101+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: goal-7c5b4afb
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "a219a5da-a98f-4be4-9718-3dba55cd734a",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="21ca5fea-ab71-4957-8187-b39fed454362-user" -->

<!-- xgd-chat role="user" ts="2026-10-29T21:05:37.911694+00:00" -->
#### You
I'm rediscovering goals. You are a session attached to GOAL-50.

Lets talk about the state of readiness of 1c for beta launch.

I have been working extensively with EPIC-19 on the UX for the site creation. It still needs some final testing but I think it is close. Beta test inviting was tested but should be re-tested Need to test the experience of selecting an internal domain and publishing to it. Need to go through a full site creation in production

 What have I not thought of?

<!-- xgd-turn id="21ca5fea-ab71-4957-8187-b39fed454362-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-29T21:18:50.839058+00:00" -->
#### Claude
I checked GOAL-50 and its sub-goals, then went looking in the code for the gaps. Your list (finish EPIC-19, re-test invites, publish to an internal domain, one full site build in production) covers the main path. These are what's missing, roughly in priority order:

## Blockers: things that hurt you or a tester on day one

1. **The terms of service are still placeholder Latin text.** `TERMS_TEXT` in `apps/control-app/src/terms.ts` is lorem ipsum. The only real copy is the beta-review clause. DOC-5 rule 26 says the terms must name the AI and media providers the product uses, and the beta clause already says sessions are reviewed. Testers will be asked to accept placeholder text. You need real terms and a privacy notice (data kept, retention, deletion) before the first invite goes out.
2. **I found no spending limit per tester.** EPIC-20 started with an hour of builder chat costing $20. I found no per-account cap on AI spend in `apps/` or `packages/`. REQ-409 is about budgets per task, not per account. One keen or careless tester, or a loop, could run up a large bill overnight. You want at least a daily cap per account and an alert to you.
3. **No real-time alert when something breaks for a tester.** EPIC-15 (synthetic flow monitoring) is underway, and EPIC-18 (logging) is a draft with an empty body. If a tester's turn errors at 11pm, how do you find out? Some alert to you on unhandled worker errors, turns that fail, and stuck builders is the minimum.
4. **Backups and restore.** Is D1 Time Travel on? Is R2 backed up? Have you actually rolled back a database once? I only found `bin/copy-to-cloud` and `bin/copy-from-cloud`. The first time a migration goes wrong with real tester data in it is a bad time to find out.

## Should do: tests on your list that aren't there yet

5. **Sign-up from a cold start.** Use a brand-new email you've never used before, ideally on a phone, through invite → magic link → terms → first site. Your own accounts have state that hides problems.
6. **Email deliverability.** Do magic links land in the inbox or in spam on Gmail and Outlook? Is SPF/DKIM/DMARC right for the sending domain? What happens if the link is opened on a different device from the one that asked for it, or after it expires?
7. **Several testers at the same time.** Cohort-zero sessions may overlap. Check worker CPU limits, model rate limits, and the parallel-builder rules from EPIC-24 with two or three accounts running together.
8. **The full publish loop, including going back.** Publish, edit, re-publish, then roll back a revision. Also check that the live site works on a phone and that its contact form actually delivers a lead.
9. **Deploying while a tester is mid-session.** `bin/deploy` restarts services. What does a tester mid-turn see? You'll want to ship fixes during beta, so you need to know whether that's safe at any time or only in a quiet window.
10. **A way for the support side to see what a tester sees.** EPIC-23 (open any business from the console) is underway. It's very useful when a tester says "it's broken".

## Process decisions rather than code

11. **The feedback loop itself.** EPIC-28 is underway. Is the Feedback button live, and do you have a daily routine for reviewing what comes in?
12. **What counts as a successful beta?** Decide in advance what would make you widen access versus stop and fix. That's also what lets GOAL-50 be closed.
13. **Tester expectations and leaving.** Testers should know it's free during beta, that their data might be reset, and how to export or delete their data and site when they leave (DOC-5 rule 26 says early).
14. **Domains.** Internal-domain publishing is on your list. Decide whether a tester may point their own real domain at you during beta. GOAL-49 already flags the risk: a tester who loses their email is a beta that ends early. The simplest rule is "internal domains only for cohort zero".
15. **Kill switches.** Can you turn off one tester, or all AI calls, quickly without a deploy?

Items 1–4 are the ones I'd treat as blocking the first invite. The rest can run alongside cohort zero. I haven't changed anything. If you like, I can add this as a checklist to the GOAL-50 body, or file items 1–4 as separate tickets.

<!-- xgd-turn id="a55305f4-d735-4d11-aab9-e14146dc3905-user" -->

<!-- xgd-chat role="user" ts="2026-10-30T00:42:41.366869+00:00" -->
#### You
- **The terms of service are still placeholder Latin text.** `TERMS_TEXT` in `apps/control-app/src/terms.ts` is lorem ipsum. The only real copy is the beta-review clause. DOC-5 rule 26 says the terms must name the AI and media providers the product uses, and the beta clause already says sessions are reviewed. Testers will be asked to accept placeholder text. You need real terms and a privacy notice (data kept, retention, deletion) before the first invite goes out. <-- I created EPIC-29 and REQ-488. Ultimately we need to support the t&C of our customers too but that is not for beta
  
- **I found no spending limit per tester.** EPIC-20 started with an hour of builder chat costing $20. I found no per-account cap on AI spend in `apps/` or `packages/`. REQ-409 is about budgets per task, not per account. One keen or careless tester, or a loop, could run up a large bill overnight. You want at least a daily cap per account and an alert to you. <-- Epic -20 is working on this
  
- **No real-time alert when something breaks for a tester.** EPIC-15 (synthetic flow monitoring) is underway, and EPIC-18 (logging) is a draft with an empty body. If a tester's turn errors at 11pm, how do you find out? Some alert to you on unhandled worker errors, turns that fail, and stuck builders is the minimum. <-- too bad for now they email me - we have the design but monitoring comes a little later
  
- **Backups and restore.** Is D1 Time Travel on? Is R2 backed up? Have you actually rolled back a database once? I only found `bin/copy-to-cloud` and `bin/copy-from-cloud`. The first time a migration goes wrong with real tester data in it is a bad time to find out. <-- we do have versioning but this is probably something that EPIC-16 should take on. I will start that
  
  Help me track the following tests I want to do:
  
  1. sign in from a cold start
  2. end to end site creation in production
  3. doing a deploy during 2
  4. Beta invite
  
  **Kill switches.** Can you turn off one tester, or all AI calls, quickly without a deploy? <-- help me answerr this one - I think I can turn off their site, and I am the only one who can create sites.

<!-- xgd-turn id="a55305f4-d735-4d11-aab9-e14146dc3905-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-30T00:43:45.852166+00:00" -->
#### Claude
I've checked how a tester can be shut off. Now I'll add the test tracker to GOAL-50.

I've added a **Beta launch checks** section to the GOAL-50 body, with your four tests as tick-boxes. Your original text is still there.

1. **Sign in from a cold start:** a brand-new email, ideally on a phone. Check the mail lands in the inbox rather than spam, and try the link on another device and an expired or reused link.
2. **End-to-end site creation in production:** through to publishing on a 1stc.site subdomain, then check the live site on a phone and that its contact form delivers a lead.
3. **Deploy during test 2:** run `bin/deploy --env production` while a builder turn is running. Note whether the turn finishes, errors or hangs, and whether a reload recovers. The answer tells you whether you can ship fixes during beta sessions or only when nobody is building.
4. **Beta invite re-test:** from the console invite through to the tester's first turn.

## Kill switches

I read this from the code; none of it is tested yet.

- **One tester: yes, no deploy needed.** On the People tab, setting their status to anything but active signs them out immediately and blocks them from signing back in. I haven't checked whether a builder turn they already started keeps running to the end.
- **One business: yes.** Revoking its grant leaves the person able to sign in but with nothing they can open.
- **All AI calls: there's no switch in the product.** Two ways to do it without a code deploy:
  - **Anthropic console.** Disable the API key, or set a spend limit. A spend limit also works as a hard cost ceiling until EPIC-20 adds per-account caps, so I'd set one before beta.
  - **Remove the key from production:** `wrangler secret delete ANTHROPIC_API_KEY --env production`. The builder then shows its "no key" message.

## You're not the only one who can create sites

When someone accepts the terms and doesn't already own a business, 1c automatically gives them a starter business and site with an access grant that never expires (REQ-203). Testers own their business, so they can invite contacts from their own People tab. Those contacts get a business and the builder as soon as they accept the terms.

That means testers can bring in more builder users, each spending AI tokens, without you knowing. Revoking grants and suspending people still works on them. If you want to close this off before beta, the simplest fix is to provision a business only for people you invited from the console. Say if you want a ticket for that.

<!-- xgd-turn id="8b8a7d04-6b68-4ee7-9d14-0c0a3acfea27-user" -->

<!-- xgd-chat role="user" ts="2026-10-30T00:46:15.719083+00:00" -->
#### You
Can you create TODO tickets for those test actions on me please?

<!-- xgd-turn id="8b8a7d04-6b68-4ee7-9d14-0c0a3acfea27-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-30T00:47:07.357822+00:00" -->
#### Claude
I've created four to-do tickets for you, all marked high priority:

| Ticket | Check |
|---|---|
| **TODO-13** | Sign in from a cold start, using a new email, ideally on a phone |
| **TODO-14** | Full site creation in production, published to an internal domain |
| **TODO-15** | Deploy to production while a builder turn is running (do it during TODO-14) |
| **TODO-16** | Re-test the beta invite |

Each ticket says what to check and when it counts as done. Each also says to tick the matching box on GOAL-50 with the date, and to file anything that fails against the epic it belongs to. GOAL-50 now names each to-do next to its check.

To-do tickets have no assignee field. They are all your-task to-dos, though, and the system only uses that type for your own tasks.

<!-- xgd-turn id="71d1204d-bc77-409c-952d-57a0cee81888-user" -->

<!-- xgd-chat role="user" ts="2026-10-30T00:47:31.835109+00:00" -->
#### You
When someone accepts the terms and doesn't already own a business, 1c automatically gives them a starter business and site with an access grant that never expires (REQ-203). Testers own their business, so they can invite contacts from their own People tab. Those contacts get a business and the builder as soon as they accept the terms. <-- no only level 1 users get businesses, only I can invite them

<!-- xgd-turn id="71d1204d-bc77-409c-952d-57a0cee81888-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-30T00:48:17.190718+00:00" -->
#### Claude
You're right, and I've fixed the note on GOAL-50.

When someone signs in to the builder, 1c only looks them up among your own users, the ones you invite from the console (`identity.ts:1087`, in `admit`). A contact a tester invites from their People tab belongs to the tester's business, so they can never sign in to the builder. They can't accept the terms or be given a business either.

So only you can bring in new builder users. That's one less beta risk. The rest of the GOAL-50 body, including the links to TODO-13 to TODO-16, is unchanged.

<!-- xgd-turn id="c68db6b7-c2cf-4584-88e5-b7cc95acc37d-user" -->

<!-- xgd-chat role="user" ts="2026-10-30T01:26:19.119201+00:00" -->
#### You
FYI I created GOAL-54 to help us track things we are deferring to launch

<!-- xgd-turn id="c68db6b7-c2cf-4584-88e5-b7cc95acc37d-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-30T01:26:40.663175+00:00" -->
#### Claude
I've read GOAL-54. Three of the things you deferred earlier in this conversation aren't on it yet:

- **Your customers' own terms and conditions on their sites.** You said 1c will need to support these but not for beta. GOAL-54 item 3 covers a lawyer reviewing *our* terms for both customer tiers, but not this feature.
- **Real-time alerts when something breaks.** For beta, testers email you. The monitoring design exists, but alerting is planned for later.
- **Data export alongside account closure.** Item 2 covers deletion after the 30-day period. DOC-5 rule 26 pairs deletion with export.

The spending cap (EPIC-20) and backups (EPIC-16) sound like beta work, so I've left them off.

Do you want me to add those three to GOAL-54?

<!-- xgd-turn id="9f09647e-d93d-4d69-9805-a4cc4055d193-user" -->

<!-- xgd-chat role="user" ts="2026-10-30T15:52:40.693960+00:00" -->
#### You
Yes

<!-- xgd-turn id="9f09647e-d93d-4d69-9805-a4cc4055d193-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-30T15:53:08.692250+00:00" -->
#### Claude
I've added the three items to GOAL-54 as launch blockers 4–6. Your three items and the Notes section are unchanged.

4. **Customers' own terms and conditions.** A level 1 customer can publish their own T&Cs to their level 2 customers. Item 3 covers 1st Contact's own terms; this one covers the customer's. I also wrote that 1c records the level 2 customers' acceptance on the customer's site. That was my addition, not something you said, so remove it if it's wrong.
5. **Real-time alerting.** You hear about unhandled worker errors, failed builder turns and stuck builders without a tester having to email you. It points to EPIC-15 and EPIC-18 for the design.
6. **Data export.** Users can export their data and their site, alongside deletion in item 2. This is the DOC-5 privacy commitment.

<!-- xgd-turn id="6568c2de-6bf1-496f-ae46-ba59715b6a18-user" -->

<!-- xgd-chat role="user" ts="2026-10-30T17:55:29.341118+00:00" -->
#### You
Please create a TODO for me to review the outcome of REQ-488 see that the docs are presented correctly, 
read them
accept them
see the data showing acceptances with version and date in the UI <-- can you actually check for me that a UI for this exists it should be in contacts

<!-- xgd-turn id="6568c2de-6bf1-496f-ae46-ba59715b6a18-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-30T17:56:29.640152+00:00" -->
#### Claude
A UI exists: the contact detail page has an **Agreements** section. Now I'm checking whether it shows the document version, here and on the REQ-488 branch.

I've created **TODO-17** (high priority) with your four review steps: check the documents display correctly, read them, accept them, then find the acceptances in Contacts.

**Is there a UI for this in Contacts? Yes, but it won't show the version.**

- When you open a person in Contacts, their detail has an **Agreements** section (`builder/people.js`, `describeAcceptance`). Each row shows only three things: the document name, "Agreed" or "Withdrawn", and the date.
- The **version isn't shown**. Each acceptance record stores which document ticket was accepted (`documentUid`), but the page never displays it.
- **REQ-488 doesn't ask for it either.** Its acceptance criteria cover recording the acceptance against the document ticket, not showing the version in Contacts.
- **Today, terms acceptance doesn't appear there at all.** It's still stored in the old `users.tos_*` columns, which only the "Terms accepted" date column reads. REQ-488 moves it into the records the Agreements section reads, so it will appear once REQ-488 lands.
- **REQ-488 has no code yet.** It's in progress, but its branch `free-REQ-488` has no code changes.

So step 4 of TODO-17 will fail on the version as REQ-488 currently stands, and I've noted that in the to-do.

The fix is small: add a line to REQ-488's body saying each Agreements row shows the document's version date, linked to `/terms/<version>` and so on. Do you want me to add that to REQ-488? The REQ-488 session would then build it.

<!-- xgd-turn id="a0a3f94d-1ac7-463a-a36b-fdc0849989a8-user" -->

<!-- xgd-chat role="user" ts="2026-10-30T18:11:10.511207+00:00" -->
#### You
sure

<!-- xgd-turn id="a0a3f94d-1ac7-463a-a36b-fdc0849989a8-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-30T18:13:36.504779+00:00" -->
#### Claude
Now updating TODO-17's note so it no longer says step 4 will fail.

I've added the requirement to REQ-488 and updated TODO-17 to match.

**REQ-488:**
- **A new requirement** in the acceptance-records section: each row in a contact's Agreements section shows the date of the document version they accepted, linked to that version's page (`/terms/<version>`, `/privacy/<version>`, `/beta-terms/<version>`). Rows for a customer's own documents show no version, because those documents don't carry one.
- **A new test, 6a:** after someone accepts, their Agreements section in People shows each document's version date, linked to its page.

**TODO-17:** the note that said step 4 would fail now says REQ-488 requires the version. If you don't see a version when you do step 4, REQ-488 missed it.

REQ-488 is being built right now in its own session. That session may have read the ticket before I changed it, and I haven't told it. When it reports back, ask whether it picked up the Contacts version line.

<!-- xgd-turn id="aa275b0a-6b88-41df-acd1-5f58af1b2e29-user" -->

<!-- xgd-chat role="user" ts="2026-10-30T18:29:06.657682+00:00" -->
#### You
Please review the open goals in GOAL 1-11 and review whether these are still open and need attention. Should they be done before beta or before launch? Make them children of GOAL-50 or  54 respectively and add their content to the body

<!-- xgd-turn id="aa275b0a-6b88-41df-acd1-5f58af1b2e29-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-30T18:32:58.018102+00:00" -->
#### Claude
Reading GOAL-1–11 and matching them against current epics and code; GOAL-8 and GOAL-9 don't exist. Checking what's actually built for CRM, payments, portal and monitoring next.

I've reviewed GOAL-1 to GOAL-11 and moved the open ones under GOAL-50 or GOAL-54. Each parent's body now has a section summarising the goals I moved under it and their current state. I removed the moved goals from GOAL-1's child list, so none has two parents. I didn't change the moved goals themselves.

| Goal | Still open? | Where it went | Why |
|---|---|---|---|
| **GOAL-1** 1stcontact app | No, already abandoned (GOAL-50 replaced it) | Nowhere | — |
| **GOAL-2** Site (the builder) | Yes, underway | **GOAL-50 (beta)** | It's the product testers use. Its sub-goals (GOAL-16 to GOAL-20) are older names for work now tracked under GOAL-48, EPIC-19, EPIC-22 and EPIC-16. |
| **GOAL-3** Web monitoring | Yes | **GOAL-54 (launch)** | The full check list and the customer's Monitoring tab are launch work. Basic flow monitoring (EPIC-15) and DNS checks (EPIC-7) already sit under GOAL-49, which supports beta but doesn't block it. |
| **GOAL-4** CRM | Yes | **GOAL-50 (beta)** | Most of it is built: People, lead capture from forms, the Agreements section, the activity log. Launch check 2 tests a form delivering a lead. The lead pipeline (Inquiry → Quote → Booked …) isn't built and isn't needed for beta. Export and deletion are already launch blockers on GOAL-54. |
| **GOAL-5** Payments | Yes, no Stripe code yet | **GOAL-54 (launch)** | This is launch blocker 1. GOAL-11 (Subscriptions) and GOAL-12 (Invoicing) stay under it. |
| **GOAL-6** Marketing brainstorm | Parked, deliberately | **Left under GOAL-1** | DOC-4 defers marketing until customers ask for it, so it's neither beta nor launch work. |
| **GOAL-7** XGD website | Yes | No change | It's already under GOAL-48, inside GOAL-50. |
| **GOAL-8, GOAL-9** | — | — | These tickets don't exist. |
| **GOAL-10** User portal | Yes | **GOAL-54 (launch)** | Testers already have sign-in and Settings. Account closure, data export and billing views, all launch work, will appear here. |
| **GOAL-11** Subscriptions | Yes | Under GOAL-5, so under GOAL-54 | — |

Several of these goals still describe a state that is now out of date. GOAL-2 says the builder comes later, and GOAL-4 and GOAL-10 say "no code exists". I noted this in the parents' summaries rather than editing the goals.

Decisions for you:
- **GOAL-6:** abandon it, or leave it parked under GOAL-1?
- **Other GOAL-1 children:** GOAL-33 (Knowledge management), GOAL-37 (Asset and background upload) and GOAL-40 (Open design questions) are still under GOAL-1. Do you want them reviewed the same way?

<!-- xgd-turn id="768558bf-51e7-4dbb-8c60-2defe98781b5-user" -->

<!-- xgd-chat role="user" ts="2026-10-31T00:43:33.349239+00:00" -->
#### You
oops that was a typo I meant to ask if you can review TODO-1-11

Can you do that  first and then lets return to the goals - we need a big consolidation of goals...but help me with the TODOs first

<!-- xgd-turn id="768558bf-51e7-4dbb-8c60-2defe98781b5-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-31T00:47:00.699403+00:00" -->
#### Claude
Checking DNS for TODO-6 (wildcard, CAA) and whether TODO-1/TODO-3 have equivalents in the xgd repo.

Writing the results into GOAL-50 and GOAL-54 now.

I've reviewed TODO-1 to TODO-11. TODO-2, TODO-4 and TODO-7 don't exist, and TODO-9 and TODO-11 are already done. That leaves six open.

| To-do | Still open? | Before beta or launch | What I did |
|---|---|---|---|
| **TODO-5** Resend setup | Partly. Mail has been live since 2026-09-07 (its own notes; I didn't re-check) | **Beta:** rewrite 1c's own invite email, since it's the first thing a tester reads and TODO-16 re-tests it. **Launch:** register in Google Postmaster Tools, and move DMARC to `quarantine` | Child of **GOAL-50** |
| **TODO-6** 1stc.site housekeeping | Partly. **Done:** wildcard DNS resolves, reserved labels and the unique label index are in code, labels can be revoked | **Beta:** submit to the Public Suffix List. 1stc.site isn't on it yet, and acceptance takes weeks. **Launch:** CAA record (none exists), registrar lock/WHOIS/ownership (not checked), the custom-domain redirect decision, a guard against label squatting | Child of **GOAL-50**; the launch part is also listed in GOAL-54 |
| **TODO-10** Card numbers and other personal data in uploaded documents | Yes. Nothing in the upload path detects them | **Launch.** Testers know what they're uploading, but the public won't. DOC-5 forbids storing card data or sending private data to AI providers | Child of **GOAL-54** |
| **TODO-8** Remove the orphan "papers" page from the XGD site | Couldn't verify. The site is no longer in local storage, so you'd need to look in the builder | Neither: low-priority site cleanup | Left where it is |
| **TODO-1** matrix_refactor treats a missing report as "all done" | Looks still present: the same pattern is still in `structural_validation.py` | Neither: it's an xgd bug, not 1c | Left where it is |
| **TODO-3** a spawned xgd session got no task in its prompt | Not diagnosed | Neither: also an xgd bug | Left where it is |

TODO-1 and TODO-3 belong in the xgd repo, not 1c's ticket store. Do you want me to file them there as bugs and close them here?

I didn't revert last turn's goal changes. GOAL-2 and GOAL-4 are now under GOAL-50, GOAL-3, GOAL-5 and GOAL-10 are under GOAL-54, and both bodies have sections about them. I can undo that before we start the goal consolidation, or keep it as the starting point. Which would you prefer?

<!-- xgd-turn id="fb007687-0200-42a9-a805-45507c5c1b1b-user" -->

<!-- xgd-chat role="user" ts="2026-10-31T00:58:09.469833+00:00" -->
#### You
No they are refering to the website for xgd built on first contact

<!-- xgd-turn id="fb007687-0200-42a9-a805-45507c5c1b1b-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-31T00:58:22.576614+00:00" -->
#### Claude
I don't think TODO-1 and TODO-3 are about the XGD website. Both describe faults in the xgd toolchain itself, which turned up while xgd was running its workflows on 1c:

- **TODO-1** is about xgd's `matrix_refactor` workflow during a regression run on 1c. A step that merges overlapping parts of the capability matrix reported "done" after resolving 0 of 8 overlaps. The fault is in `xgd_source/quality/structural_validation.py` (around lines 515–544), in the xgd repo.
- **TODO-3** is about xgd's reconcile of REQ-132. It started a Claude session whose prompt had the background material but no actual task, so the session had to work out what it was meant to do.

Neither mentions the XGD site, its pages or the builder. The to-do that is about the XGD website built on 1c is **TODO-8**, the orphan "papers" page.

Did you mean TODO-8? If you did mean TODO-1 and TODO-3, tell me what you have in mind and I'll look again. For now I've left all three where they were.

<!-- xgd-turn id="e3fff28b-d35a-40a4-bdd8-22f874607bc8-user" -->

<!-- xgd-chat role="user" ts="2026-10-31T01:00:29.087339+00:00" -->
#### You
yes I meant I think we can close all of them please

<!-- xgd-turn id="e3fff28b-d35a-40a4-bdd8-22f874607bc8-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-31T01:02:18.724048+00:00" -->
#### Claude
Closed all three; the explanatory comment failed on a flag, fixing that now.

I've closed TODO-1, TODO-3 and TODO-8. To-dos can't be marked abandoned, so they're set to **won't do** instead. Each has a note saying you closed it on 2026-10-30 in this review, and that the work was not done.

That leaves three of TODO-1 to TODO-11 open, all now under the two goals:
- **TODO-5**: under GOAL-50 (rewrite the invite email before beta)
- **TODO-6**: under GOAL-50 (submit 1stc.site to the Public Suffix List before beta)
- **TODO-10**: under GOAL-54 (card numbers and other personal data in uploaded documents, by launch)

Ready for the goal consolidation when you are. Do you want to keep my earlier goal moves as the starting point, or start from how they were?

<!-- xgd-turn id="073775dc-a612-4281-856b-76607ddf4bbd-user" -->

<!-- xgd-chat role="user" ts="2026-10-31T21:14:31.335048+00:00" -->
#### You
Is there anything left to do on "TODO-5"

<!-- xgd-turn id="073775dc-a612-4281-856b-76607ddf4bbd-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-31T21:16:49.039124+00:00" -->
#### Claude
Checking whether the Resend bounce webhook was ever built, since TODO-5's "done when" list depends on it.

Yes. Three things are still outstanding on TODO-5, and one of them wasn't on its own "still open" list.

**1. The Resend webhook isn't connected. This affects beta.** The receiving code exists in `apps/control-app/src/email-webhook.ts` at `/api/email/webhook`, and it needs a Worker secret called `EMAIL_WEBHOOK_SECRET`. The production Worker has no such secret; its only secrets are `ANTHROPIC_API_KEY`, `CLOUDFLARE_DNS_TOKEN`, `FAL_KEY`, `OPENAI_API_KEY` and `RESEND_API_KEY`. Without the secret the endpoint refuses every request, so if Resend is sending events, each one is rejected. Sent mail therefore never changes to "delivered" or "bounced", and People never shows a bounced address (REQ-198). The 2026-09-07 note covered sections 1, 2 and 6 of the ticket and never got to section 5. To fix it:
- In Resend, add a webhook to `https://<control-app host>/api/email/webhook` for delivered, bounced and complained events.
- Copy the signing secret (`whsec_…`), then run `wrangler secret put EMAIL_WEBHOOK_SECRET --env production` from `apps/control-app`.
- Send yourself an invite and check it changes to "delivered".

**2. Rewrite the invite email. This affects beta.** It should name who is inviting, say what 1st Contact is, end with a signature and have a footer. That's writing, not code. The template lives in 1st Contact's own business store, not this repo, so I can't tell from here whether you've already done it. TODO-16 (re-test the beta invite) will show the result either way.

**3. Two launch items:**
- Register `1stcontact.io` in Google Postmaster Tools.
- Move DMARC to `p=quarantine`. It is still `p=none` with reports going to `dmarc@1stcontact.io`; I checked DNS just now. Only make this change once the reports show clean alignment.

**One check I couldn't do from here:** the ticket also asks for a test send to both Gmail and Outlook, confirming `spf=pass dkim=pass dmarc=pass` in each one's headers. Nothing records that this was done. It takes a few minutes, and it's worth doing after the SPF problems the ticket describes.

I haven't changed TODO-5. Do you want me to add the webhook finding to the ticket so it doesn't get lost?

<!-- xgd-turn id="d375a38a-1b8a-42a9-93f4-030bed8a0cd1-user" -->

<!-- xgd-chat role="user" ts="2026-11-02T22:33:14.877476+00:00" -->
#### You
ok lets talk about hitting this goal can you read your epics and their transcripts and look at their children. I am about to load up the first pieces of the implementation to see how they look

<!-- xgd-turn id="d375a38a-1b8a-42a9-93f4-030bed8a0cd1-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-02T22:35:21.624751+00:00" -->
#### Claude
I've mapped GOAL-50's tree. Now finding each epic's children, which link by a parent field rather than a list.

Nearly every child is `ready_to_reconcile`, meaning it's built and waiting to be reconciled, not still open. Now reading the latest turns of each epic's transcript.

Newer tickets link through `parent_uid`, so I'm re-scanning with that included and grouping by status.

Only EPIC-19 has open work. Checking the other beta epics' latest turns and the launch-check to-dos.

Beta now depends almost entirely on EPIC-19 and the four launch checks. Every other beta epic has its work built. One caveat applies throughout: `ready_to_reconcile` means a ticket was coded and committed. It doesn't mean you've tested it, and that's what you're about to do.

**Built (all children coded):**
- **EPIC-20, spend cap.** REQ-489 caps each business at $100 for its lifetime and stops it without warning. The Operator Console can override the limit per business.
- **EPIC-28, beta feedback.** The Feedback button (REQ-479) and each tester's session timeline (REQ-480).
- **EPIC-29, legal.** Terms, privacy notice and beta terms come from doc tickets, with versioned acceptance (REQ-488). TODO-17, your end-to-end review of it, is still open.
- **EPIC-23.** Open any business from the console (REQ-367), plus delegate access and multiple login emails.
- **EPIC-24.** Builders running in parallel.
- **EPIC-16.** Deployment tooling (34 tickets) and EPIC-22's Debug tab.

**EPIC-19 (Web Builder Experience), still moving.** You were testing it in that session up to an hour ago.
- **In progress:** REQ-627, long work part 2. Each builder pass becomes its own durable step. Part 1 (REQ-624) is built. Run launch check 3, deploying during a live build (TODO-15), after REQ-627 lands; it's the change that check exercises.
- **Built, not yet reconciled:**
  - REQ-459: the working line updates in place and ends as a summary.
  - REQ-478: the Look summary rename.
  - BUG-305: polish on the first draft.
  - REQ-619: input questions.
  - BUG-326: a rejection binds every later builder brief.
- **Filed today from your testing, all drafts and all high priority:**
  - BUG-329: picking several files for an upload uploads only the first.
  - BUG-330: comparison captures fail on bot-check pages, get stuck loading, and break on a video with no poster.
  - BUG-331: the Look summary is unreadable, and a headline you give in chat isn't recorded as yours.

**Launch checks.** TODO-13 to TODO-16 are all still open, and none has been run.

**Gaps with no ticket, or not yet done:**
1. **Resend webhook secret.** Production has no `EMAIL_WEBHOOK_SECRET`, so no sent mail ever shows as delivered or bounced. This is the TODO-5 finding from last time.
2. **Backups and restore.** In the GOAL-50 discussion you said EPIC-16 would take this on, but I found no ticket for it. Before testers' data goes in, check that D1 Time Travel works by actually restoring once.
3. **Terms version.** The harassment and doxing clause is in DOC-80, which is still a draft. Publishing it makes everyone accept the terms again. Publish it before the first invite so testers only accept once.
4. **The invite email rewrite (TODO-5)** and **submitting 1stc.site to the Public Suffix List (TODO-6)**. The list takes weeks to accept a domain, so the submission is only worth doing if it's sent soon.
5. **Alerting.** EPIC-18 is still an empty draft. You decided testers would email you instead, which is fine as long as that's deliberate.

**Suggested order once your current pieces look right:**
1. Fix BUG-329 to BUG-331.
2. Land REQ-627.
3. Publish DOC-80.
4. Deploy to production.
5. Run the launch checks: TODO-13 (sign-in), then TODO-16 (invite), TODO-14 (full site build) and TODO-15 (deploy during a live build).

Do you want me to record the gaps list in GOAL-50's body, and open a backups ticket under EPIC-16?

<!-- xgd-chat-end -->