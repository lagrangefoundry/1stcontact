---
uid: comment-73cb53a4
id: COMMENT-8019
type: comment
title: Comment on request REQ-669
created_by: xgd
created_at: '2026-11-08T17:45:33.110297+00:00'
updated_at: '2026-11-08T18:27:05.507899+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-d71a191f
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "e853b694-2540-4cee-be05-f0739ef8c7af",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="0dc33d92-cc21-41fa-a37a-1dfc0dfe064c-user" -->

<!-- xgd-chat role="user" ts="2026-11-08T17:44:45.251548+00:00" -->
#### You
Triggered by: martin-github@westhead.me

Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
If this bug is a dupe, please close it as wont_fix with an explanation in its body referencing the duplicate

<!-- xgd-turn id="0dc33d92-cc21-41fa-a37a-1dfc0dfe064c-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-08T17:50:01.643984+00:00" -->
#### Claude
Not a duplicate. Reading the current legal pipeline (REQ-665/666 code) now, before I plan the change.

Still mapping the code: now reading the platform's separate terms gate, the legal pages and the Paperwork routes.

Checking how 1stcontact.io itself is served, since the cutover moves 1st Contact's legal pages onto its own site.

I need your answers to a few questions before I write code. This is not a duplicate: no other ticket covers owner-added sections or moving 1st Contact's documents off the build. The ticket is still at `draft`, and I haven't cut a branch.

I read the current legal code end to end (`client-legal.ts`, `client-terms.ts`, `terms.ts`, `paperwork-legal.ts`, the module library, the publish path) and DOC-120. Five questions change what gets built. Each has my recommendation, so "yes to all" is a fine answer.

**1. What do signed-in customers accept: Terms of use, or Member terms?**
DOC-120 says a 1st Contact client accepts the Member terms, the Privacy notice (read) and the Beta Terms, but not the Terms of use. Today every client business's signed-in customers are asked for the Terms of use *and* the Member terms. To avoid a 1st Contact branch, the rule has to change for every business. *Recommend:* where the site has Member terms, signed-in customers agree to those; the Terms of use are only asked for when it has none. This changes REQ-666's behaviour for client businesses.

**2. How does 1st Contact get Member terms at all?**
Member terms appear when a site has an account module on a page. 1st Contact's clients sign in at the builder's door, not through an account box on 1stcontact.io, so detection from the pages would never give 1st Contact Member terms. *Recommend:* treat "has signed-in customers" as true when a site has an account module **or** the business has anyone who has signed in. Every business uses the same rule, and 1st Contact meets the second half.

**3. What does "legal pages are published on their own" (item 7) mean in practice?**
Today the legal pages are written into the site snapshot when the site is published, and the footer links to them are in that snapshot too.
- *Recommend:* after a legal change, rebuild each of the business's published sites from its **published** definition (the owner's draft is never published by this). It runs as background work in small batches, on the existing rebuild path.
- The alternative is serving `/legal/*` from separate stored pages outside the snapshot. That breaks when Terms of sale appears or goes, because the footer links would then be wrong.

**4. How should 1st Contact's history and DOC-120 be loaded, per environment?**
The cutover removes 1st Contact's documents from the build, so the past versions (DOC-76…118), DOC-120's sections and its business details must be written into 1st Contact's records once.
- *Recommend:* a one-off command (`1c legal seed-platform --env dev|production`) that reads those doc tickets and writes the records. You run it once per environment when this lands; I'll hand you the exact command.
- The record store assigns its own ids, so each old version will also carry its original doc uid. An acceptance naming DOC-84 then still finds DOC-84's text.

**5. Should the new "You can add your own sections" sentence go in at the cutover?**
That sentence belongs to Member terms §8, and after the cutover the "Legal documents we provide for your site" paragraph is one of 1st Contact's own added sections. *Recommend:* include the sentence in that section at the cutover, since the feature exists from that moment, and skip the separate Terms of Service version. Note this is a material change: every 1st Contact client will be asked to accept the new Member terms at their next sign-in. The ticket's test plan already expects that.

**On size:** this is well over 20 points, especially with items 7–9. I'll keep it as one ticket with several commits on one branch, landing in three steps:
1. The library refusal (5–6), owner-added sections (1) and owner-only documents (2).
2. 1st Contact's cutover, the seed and the redirects from the old addresses (3–4).
3. Separate legal publishing and revision announcements with the 14-day notice (7–9).

I'll merge back and move it to `free_coded` only when all three are done.

<!-- xgd-turn id="24f23500-06ac-40a4-8cc2-3e570d3c54b4-user" -->

<!-- xgd-chat role="user" ts="2026-11-08T18:27:03.509340+00:00" -->
#### You
Triggered by: martin-github@westhead.me

Your ticket has been updated to answer the questions that you asked. Please reread it and determine if you are ready to code

<!-- xgd-chat-end -->