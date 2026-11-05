---
uid: comment-1df35e94
id: COMMENT-5605
type: comment
title: Comment on epic EPIC-25
created_by: xgd
created_at: '2026-10-24T20:05:34.242787+00:00'
updated_at: '2026-10-25T00:25:10.030548+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: epic-4553b54e
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "e9e5d8aa-918f-4c39-ab29-1c6d83e279d7",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="e1606b6b-2a6e-4419-9d4f-784a25fde45f-user" -->

<!-- xgd-chat role="user" ts="2026-10-24T20:04:13.393411+00:00" -->
#### You
This ethic concerns a particular level of test that I would like to create for a couple of different reasons. Take a look at Doc 67, particularly the description of the motivation. Also look at the last few terms of the transcript of the discussion with epic 19. We just had a pretty disastrous first draft creation that has triggered six different new bugs.

This stage in the process where we create the first draft is a critical pivot point in the whole site creation. Getting this right will improve the quality of the final site, reduce the cost and impressed the customer more. It also represents an important test of the core aspects of the system. Is L one helping us to create the site we need? Is the principal/delegate model working well? Would we do significantly better if we used different models for the delegates?

I would like to test the quality of the first draft production. What's this would require is the creation of a test business that has the discovery work pre-populated. We could pull this from an existing example o business. This would allow me to significantly speed up this test because today I have to start from scratch and go through the entire discovery process.

So the goal for this epic is to be able to create a test business that is pre-populated with discovery from an existing business. i.e. create_test_business ("Dina's Diner"). And then to trigger the consultant to create the first draft (that part can be done manually but it needs to be possible).

I think the UX should be a new option on the provisioning pop up that allows me to make a business a first draft test and select a business to populate the discovery from. Selecting this option should automatically prepend First-Draft-Test to the business name.

Can you investigate the feasability of the data copy involved, please?

<!-- xgd-turn id="e1606b6b-2a6e-4419-9d4f-784a25fde45f-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-24T20:11:26.022078+00:00" -->
#### Claude
I've read DOC-67 and the end of the EPIC-19 transcript. Next I'm tracing where a site's discovery data is stored, so I can see what a copy would need to move.

Discovery so far: the site plan is a `plan` ticket in each business's own ticket store. I'm now listing the other per-business stores: the chat, the KB, assets and the remaining ticket types.

`copy.ts` already moves one business's site, references and chats between the local and deployed builders, and `chat-copy.ts` looks related. Reading both.

Two things decide how hard the copy is: whether attachment blobs are keyed per tenant in R2, and which plan fields hold ticket uids that would need remapping. Checking both.

Dina's own history turns out to be the main obstacle. Before writing up, I'm confirming which popup is the "provisioning pop up".

The copy is feasible. The data is easy to find and mostly already has copy code. The hard part is that a live business isn't a clean discovery snapshot, and Dina's history can't be cut back into one. I've written the findings into EPIC-25's body and kept your title.

## What "discovery" is, and where it lives
Nearly all of it sits in the source business's own ticket store, in four ticket types:

- **The plan:** stages, brief, decisions, asks, comparison sites, story board and public details.
- **Uploads and photos:** the files themselves plus the AI-written text describing each one. That text travels with the copy, so nothing is re-described.
- **Comparison sites:** each captured site with your likes and dislikes.
- **The conversation:** each chat and its transcript.

The site itself doesn't need copying. Provisioning already creates a fresh starter site, and the first draft gets built into that. The consultant's knowledge base is built from the same four types, so it follows on its own.

## What already exists
- **Provisioning** already creates the business, membership, entitlement, starter site and seeded plan (`provisionBusiness`, `identity.ts:778`).
- **Moving a conversation** already works. `chat-copy.ts` (from REQ-294) moves a business's chats to another business, re-pointing them at the destination's business and site and dropping anything tied to the old runtime.
- **What's new is the rest:** a copy for the plan, uploads and comparison sites. The plan stores ids of comparison sites, which change when copied, so the copy has to rewrite them.
- **Files have to be copied byte for byte.** The file store is split per business, so a copy can't just point at the source's files.

## Size of Dina's Diner (local dev)
- 1 plan, 11 uploads, 4 comparison sites, 9 chats.
- 395 attached files, about 102 MB, of which 88 MB is the four captured comparison sites.

That's too many file reads and writes to trust to one request. The copy needs to run in chunks or be able to resume. That's doable.

## The hard part: Dina is past discovery
- **Her business is mid-build.** "First draft" and "Refining" are both in progress, with 5 revision rounds, a critic review, and builder and critic chats.
- **Her history has no clean point to cut at:**
  - "Getting to know you" was done at 01:12;
  - the first build ran at **01:18**;
  - "Looking at other sites" was done at **03:03**.

  Cutting at 01:18 loses the comparison work, and cutting at 03:03 keeps two hours of building. The interleaving predates the stage-order rule that has since landed.
- **The plan's history is only partial.** The change log keeps the plan's settings at each version but not its text. The decision log is in that text, so it can't be rolled back.

## Recommendation
1. **Copy from a frozen discovery snapshot, not a live business.** That also makes runs repeatable. If the source keeps changing between runs, comparing delegate models doesn't mean much.
2. **Make the snapshot once per example business.** Run discovery to the end of "Looking at other sites" and stop. For Dina that's one more discovery pass, or trimming her current data by hand. After that, each test costs a copy, not a conversation.
3. **What the copy does:**
   - put every stage from "First draft" on back to not started;
   - drop critiques and build milestones;
   - copy only the site and business chats, not the builder or critic chats.
4. **Keep the `First-Draft-Test` prefix out of the site.** The starter site's page title takes the business name. If the prefix goes on the business name, it ends up in the draft and in what the consultant reads. The prefix should go on the business record only. The site and the plan's public details keep the source's name.

## Decisions for you
- Snapshot-then-copy (my recommendation), or copy from a live business with a best-effort reset?
- Is asking the consultant in chat to build the first draft enough, or should provisioning start it?
- Do you want each run to record what you'd compare models on: the model used for each role, the spend, and the critic's verdict? That would be a second child ticket.

Once you've answered those, I'll split this into child tickets.

<!-- xgd-turn id="56bc2b0e-1852-48e8-9fed-bb66de50d89b-user" -->

<!-- xgd-chat role="user" ts="2026-10-24T20:15:03.560323+00:00" -->
#### You
here is my proposal (1) copy the entire targe business (2) delete the site contents and replace it with the blank site initial state.

This will not be exactly the same as reverting the business to the state it was in but I think its gooed enough

<!-- xgd-turn id="41d6609d-16ef-4c82-bc42-ad2810fa7f0e-user" -->

<!-- xgd-chat role="user" ts="2026-10-24T20:17:02.220414+00:00" -->
#### You
here is my proposal (1) copy the entire targe business (2) delete the site contents and replace it with the blank site initial state.

This will not be exactly the same as reverting the business to the state it was in but I think its gooed enough

The point is this does not have to reflect a re-run of exactly that business as it was then. This produces (1) sufficient content for us to build a first draft and (2) unless we start reediting these old test businesses this is reproducible.

<!-- xgd-turn id="41d6609d-16ef-4c82-bc42-ad2810fa7f0e-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-24T20:17:30.500414+00:00" -->
#### Claude
Agreed. Both requirements are about what the copy gives us, not about rewinding to the past, and copying the whole business and then blanking the site meets both. It's also simpler than anything I suggested. I've recorded it as the decision in EPIC-25 and replaced my snapshot recommendation with it.

To make the copy work with a blank site, I'd add three small things, also written into EPIC-25:

1. **Reset the plan.** Put every stage from "First draft" on back to not started, and clear the build milestones and the critique. Otherwise the consultant faces a blank site while the plan says the first draft was built 5 rounds ago, and it will most likely carry on refining instead of drafting.
2. **Copy only what the consultant works from.** That means the plan, uploads, comparison sites and chats, but not people, contacts, domains or sending settings. Dina is fictional, but a test copy of a real business should never be able to email its customers.
3. **Keep the prefix out of the site.** `First-Draft-Test` goes on the business record only. The site's page title and the plan's public details keep the source's name, or the prefix ends up in the draft.

**One thing to accept knowingly:** the copied conversation includes what happened after Dina's first draft, including your feedback on it. The consultant can read that, so a test draft may be better than a true cold first draft would be. You've said that's good enough. I'd still leave out the builder and critic chats, since they're about the old site and add nothing.

**Starting the draft** is manual: open the test business and ask the consultant for the first draft.

This fits in one child request of about 8 points. The work is:
- the provisioning option and the source picker;
- the copy, done in chunks for the roughly 100 MB of files;
- the site blank and the plan reset.

Shall I create it?

<!-- xgd-turn id="c3a1a026-0391-4cf2-8d41-825fe295b717-user" -->

<!-- xgd-chat role="user" ts="2026-10-24T20:20:49.006890+00:00" -->
#### You
Please create the ticket (I will build it - you are an EPIC you do not implement tickets)

<!-- xgd-turn id="c3a1a026-0391-4cf2-8d41-825fe295b717-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-24T20:21:30.046939+00:00" -->
#### Claude
I've created **REQ-450** (`request-a589df82`): "Provisioning: first-draft test business copied from an existing business". It's at `draft`, 8 points, under EPIC-25, and EPIC-25 now lists it as a child.

**The behaviour the ticket specifies:**
- **The popup:** "Provision a business" gains a "First-draft test" option and a picker for the source business. The new business's name gets the `First-Draft-Test ` prefix.
- **The copy:** the source's plan, uploads, comparison sites and site and business chats are copied whole, with their files. Ticket ids in the plan are rewritten to the copies, and the copy is chunked and can be resumed.
- **Blank site:** the source's site isn't copied, so the test business keeps the blank starter site.
- **Plan reset:** "First draft" and every stage after it go back to not started, and build milestones, critique, readiness and `looked_at` are cleared. Discovery is kept as it was.
- **Not copied:** builder and critic chats, and people, contacts, domains and sending settings.
- **Name:** the site title and public details carry the source's name. The prefix appears only on the business record.
- **Source:** it is never written to.
- **Starting the draft** is manual.

The test plan names UATs `test_UAT_FC_REQ-450_*` and covers each of those points, including that an interrupted copy can be re-run without duplicates and that the source is unchanged afterwards.

**Two things to check before you build:**
- **Repeat runs need distinct names.** The existing uniqueness rule refuses a name the account already holds, so a second `First-Draft-Test Dina's Diner` will need a suffix.
- **Copy sources only on the same environment.** Dina's Diner lives in the local dev store (`biz_5fc6adae…`), so make test copies on dev. Copying across environments isn't covered.

<!-- xgd-turn id="97a998ce-a54d-46da-b78b-57a0712dbaf8-user" -->

<!-- xgd-chat role="user" ts="2026-10-25T00:20:34.726050+00:00" -->
#### You
I am trying the capability out - one slightly odd feature is that the ENTIRE chat history is included. Do you think it could be truncated to before the turn that includes "See the first draft" ( that line might not be available for some of the older sites but nevertheless - if its there we could consider truncating to that point right?

<!-- xgd-turn id="97a998ce-a54d-46da-b78b-57a0712dbaf8-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-25T00:22:00.033327+00:00" -->
#### Claude
Yes, truncating at that turn works for Dina. But the transcript is only one of three places the consultant remembers the later work, and all three need cutting at the same point.

**The cut point exists for Dina.** Her site chat has the line at 01:24:18: "Dina, the first draft is ready: [See the first draft]". The current hand-over text is "Your first draft is ready: have a look" (`plan-core.ts:1291`), so the cut needs to match the link to `#show=draft`, not the wording. Both versions contain that link.

- **Before it** (about 30 of 54 turns): discovery, plus the catering-page discussion that ran while the first build was going. That's all useful material for a draft.
- **After it:** the later work, starting with the "Building the first draft… / See the first draft" message itself. Dropping that is right, because the test site is blank.

**Three records hold that memory, and all three should be cut at the same timestamp:**

1. **The chat transcript.** Drop the turn containing the link and everything after it.
2. **The tool transcript** (274 KB for Dina). Every tool call is stamped with a time and a turn, so drop calls at or after the cut. Otherwise the knowledge base can still surface the builds and critiques.
3. **The standing note: the biggest leak.** It's handed to the consultant on every turn, and Dina's copy is pure post-draft state: "Dina called the draft UGLY… BLOCKED… Next: t5, then Colours & fonts". Truncating the transcript leaves that note intact, so the consultant would still carry on refining. It can be restored, because each note write is recorded in the tool transcript. Dina's last one before the cut was at 01:24:06, 12 seconds before the line. Restore the note from the last write before the cut, or leave it empty if there was none.

**Sites without the line:** fall back to the plan's `first_pass_at` milestone. The host records it when the first builder session that wrote the site completes, so older sites have it too. Dina's is 01:18:43, close to the line. If a site has neither, copy the history whole, as REQ-450 does now.

**A smaller leftover:** decisions recorded after the cut stay in the plan. They carry timestamps, so they could be cut the same way, but I'd leave that unless it shows up in a test.

**Where to put it:** this extends REQ-450, but REQ-450 is at `ready_to_reconcile`, so the dispatcher may pick it up at any moment. Two options:

- **Hold REQ-450** (move it back to `free_coded` yourself) and add this to its body.
- **File a follow-up child** under EPIC-25.

Which do you want? I'll write it up once you choose.

<!-- xgd-turn id="3424537a-a5ec-4c1a-93b9-8b7b3c0fcca6-user" -->

<!-- xgd-chat role="user" ts="2026-10-25T00:23:38.531405+00:00" -->
#### You
File a follow up please?

**A smaller leftover:** decisions recorded after the cut stay in the plan. They carry timestamps, so they could be cut the same way, but I'd leave that unless it shows up in a test. <-- if its easy to do lets cut these too

<!-- xgd-turn id="3424537a-a5ec-4c1a-93b9-8b7b3c0fcca6-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-25T00:25:06.140404+00:00" -->
#### Claude
Checking that decisions really carry the timestamps a cut needs, both in the plan's decision fields and in the decision log in its body.

I've filed **REQ-455** (`request-b077e25f`): "Provisioning: first-draft test copies history only up to the source's first-draft hand-over". It's at `draft`, 5 points, under EPIC-25, with REQ-450 marked as coming first, and EPIC-25 now lists it.

**Where the history is cut:**
1. At the hand-over turn: the first consultant turn that links to the draft. The cut matches the `#show=draft` link rather than the wording, so it catches both the older "See the first draft" and today's "Your first draft is ready: have a look".
2. If that turn isn't there, at the plan's `first_pass_at` milestone.
3. If neither exists, nothing is cut and the full history is copied.

The popup's completion message says which cut was used.

**What's cut, all at that one moment:**
- **Chat transcript:** the hand-over turn and every later turn are dropped.
- **Tool transcript:** tool calls at or after the cut are dropped.
- **Standing note:** replaced with the note as it was at the cut, taken from the last note write before it.
- **Chat ledger:** entries written after the cut are dropped.
- **Plan decisions:** cut too, as you asked. It was easy enough because the plan's change log records each version's decisions, so it can be rewound to the cut. Decision-log entries in the plan's text are numbered in the order they were written, so later ones can be removed by number.
- **Plan stages:** re-settled by the host's own rules afterwards, so a discovery stage whose facts no longer hold doesn't read as done.

**What this means for Dina:**
- She keeps decisions 1–5, recorded by 01:24:06.
- Decision 6 goes, and it is the direction she hearted at 03:03. So the test business gets the direction only as *proposed*, not as chosen.
- Decision 7 (catering parked) goes too.

That's faithful to the moment of the hand-over, because in her run the direction was agreed only after the first draft. It also means "Looking at other sites" may read as not finished. If you'd rather keep the direction, it can be exempted, but that's a choice for you.

The test plan names UATs `test_UAT_FC_REQ-455_*` and covers each of these, plus both wordings of the hand-over line and the source being left unchanged.

One correction: EPIC-25's child list had REQ-450 as `draft`. I've updated it to `ready_to_reconcile`.

<!-- xgd-chat-end -->