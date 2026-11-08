---
uid: comment-ea665834
id: COMMENT-7956
type: comment
title: Comment on request REQ-668
created_by: xgd
created_at: '2026-11-07T23:43:37.392402+00:00'
updated_at: '2026-11-08T00:56:12.471437+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-cc75a2f2
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "84811ad9-b2b6-4073-8abf-ed3861275b98",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-cli-session ts="2026-11-07T23:43:33Z" model="claude-opus-5-5" continued_from="new" -->
*Captured by CLI Claude — paraphrased reconstruction from session memory, not raw capture.*

<!-- xgd-chat role="assistant" ts="2026-11-07T23:43:33Z" -->
#### Claude
While scoping REQ-666 (member acceptance on client sites) I said a client business has no signed-in customers: signInTenant and admit only look people up in the TENANT_ID business, and guardTerms always shows 1st Contact's documents.

<!-- xgd-chat role="user" ts="2026-11-07T23:43:33Z" -->
#### You
that sounds inaccurate can you check. 1stcontact is a first contact business. All businesses have exactly the same set of sign in and customer features as 1c

<!-- xgd-chat role="assistant" ts="2026-11-07T23:43:33Z" -->
#### Claude
Right about the design: contacts, invites (minted in scope.businessId) and the portal (portalBusinessId, REQ-183 D2) are already relative to the business. The gap is narrower: signInTenant ignores the host and returns TENANT_ID (its comment says a second entry goes there when customer hosts arrive), admit and sessionIdentity search only TENANT_ID, so Bob invited by Alice's Plumbing gets a link but redemption refuses him; guardTerms shows only 1st Contact's documents. Fixing it means sign-in resolves the business from the site it started on, and the gate reads that business's documents. Open cost: one browser holds one session cookie.

<!-- xgd-chat role="user" ts="2026-11-07T23:43:33Z" -->
#### You
Do we already have an EPIC for sign in?

<!-- xgd-chat role="assistant" ts="2026-11-07T23:43:33Z" -->
#### Claude
No. Sign-in was built as requests (REQ-202, REQ-482, REQ-200, REQ-475) for 1st Contact's own contacts. DOC-45 (open) defines site_domains and §10 names an authenticated surface on a customer's host as a design fork; REQ-258 built host->site for public bytes only. EPIC-30 and EPIC-14 mention sign-in only as an email.

<!-- xgd-chat role="user" ts="2026-11-07T23:43:33Z" -->
#### You
ok I think it needs an REQ that references the design please - that is an important gap that should be filled before you work on your piece - can you create that ticket?

<!-- xgd-turn id="1fe370fb-ec78-453c-b560-5f2f698e8d46-user" -->

<!-- xgd-chat role="user" ts="2026-11-08T00:02:25.403040+00:00" -->
#### You
Triggered by: martin-github@westhead.me

Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
If this bug is a dupe, please close it as wont_fix with an explanation in its body referencing the duplicate

<!-- xgd-turn id="1fe370fb-ec78-453c-b560-5f2f698e8d46-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-08T00:04:51.237559+00:00" -->
#### Claude
Reading the sign-in code to work out how the business can be resolved before I raise the open decisions with you.

Still mapping the code (portal's business resolution and host→site lookup) so I can put concrete questions to you.

I have five questions before I start coding. The ticket lists three open decisions, and reading the code turned up two more.

**What the code already gives us**
- Every session and every sign-in token names a person by `users.id`, which is unique across all businesses, and that row carries the business they belong to (`tenant_id`). So redeeming a link and reading a session can take the business from the person. They don't need the host.
- Only *sending* a link needs to know the business up front. The send route already checks a return address against `site_domains` (REQ-482), so the site the sign-in started on is already known there.
- The portal already renders for `admission.user.tenant_id` (REQ-183 D2), so Bob's portal is Alice's Plumbing as soon as he's admitted.

**Questions**

1. **How the business is chosen when a link is sent.** I'd use the host of the checked return address: host → site → business, per DOC-45 §3. The builder host, the apex, or no return address means 1st Contact, with no code checking which business it is. One consequence: a client's customer has to start from that business's site or from an invite. Typing `app.1stcontact.io/sign-in` directly only ever reaches 1st Contact's contacts. OK?

2. **Sessions in one browser.** Taking the business from the person gives your recommended behaviour for free. A session belongs to one business, and signing in to another business in the same browser replaces it. OK?

3. **Where it lives.** It stays on `app.1stcontact.io` for v1, as the ticket recommends. Moving to the customer's own host waits for the custom-domain identity design. OK?

4. **The terms gate for a client business's contact, until REQ-666 lands.** I recommend checking that contact against their own business's documents. Today that set is empty, so there's no gate. The accept route also never creates a business for them; today it would, because the gate assumes everyone accepting is signing up to 1st Contact. The alternative is to refuse these contacts until REQ-666 provides the documents.

5. **Where Bob lands.** An invite, or a sign-in that recorded no return address, currently lands on `/`. That's the builder, and Bob has no business there to open. I'd send a person with no business they can operate to the portal instead. 1st Contact's own invitees keep today's route (terms, then a new business is created for them). OK?

If you're happy with all five recommendations, just say so and I'll write them into the ticket and start coding.

<!-- xgd-turn id="b4f81a3e-e834-463c-b366-b6fe2d15cf4a-user" -->

<!-- xgd-chat role="user" ts="2026-11-08T00:16:47.731842+00:00" -->
#### You
Triggered by: martin-github@westhead.me

Your ticket has been updated to answer the questions that you asked. Please reread it and determine if you are ready to code

<!-- xgd-turn id="b4f81a3e-e834-463c-b366-b6fe2d15cf4a-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-08T00:56:09.741142+00:00" -->
#### Claude
The ticket now answers all five questions, so I'm ready to code. Setting status and cutting the branch.

Writing the code now: admit takes the business, sessions take it from the person, and sending a link takes it from the return address.

Now `signInBusiness` in sign-in-return.ts.

Next is the terms gate, which checks a contact against their own business's documents.

The code is in place. Now updating the tests that call the changed signatures, then typechecking.

Typecheck is clean. Now writing the UATs, modelled on the existing sign-in and two-business suites.

Writing the UAT file now. It has six cases matching the ticket's test plan.

Five of six pass. The sixth fails only on my guess at what `/` serves. Fixing that assertion.

All six pass. Running the adjacent sign-in, session, terms, portal and invite suites for regressions.

The run swept in more files than I listed, and a few failures look like they could be mine. Checking the identity-related ones first.

These look stale (a `users.email` column that no longer exists, `invitePerson` not exported). To confirm they're pre-existing, I'll run the same failing files on the unchanged xgd-working checkout.

All 23 also fail on the unchanged code. Two show slightly higher counts on my branch (BUG-149 3 vs 1, description-digest 7 vs 6), so I'm re-running those alone.

Those match baseline when run alone, so they're load-flaky, not regressions. Running the related non-workers suites, including the source-scanning ones.

All 43 pass. Next is the version bump and commit. Checking how this project bumps its version.

Committing the code first, then I'll update the ticket body and merge back.

Committed. Now adding a "What landed" section to the ticket and keeping the existing body.

Ticket updated. Now lock, merge, bump the version and fast-forward, following the order my notes say works.

Merged xgd-working into the branch cleanly. Re-checking typecheck and my UATs on the merged tree before bumping.

One test failed after the merge. Looking at which one.

That passes. I don't trust the earlier broad run, since it should have caught this, so I'm re-running the targeted suites explicitly.

The shell passed the file list as one argument. Re-running with it split properly.

That one also fails on unchanged xgd-working: another ticket added an `entered` key, so it isn't mine. Committing the REQ-482 test update and the version bump, then fast-forwarding into xgd-working.

xgd-working moved on in the meantime. Pulling it into the branch again, then fast-forwarding.

Landed. Moving the ticket to free_coded.

The ticket is at free_coded. Adding a note about the REQ-482 change to the body, then cleaning up the branch.

The sign-in memory is now out of date, so I'm rewriting it.

REQ-668 is done: a client business's contacts can now sign in to that business. The code is merged into xgd-working (2 commits, version 0.2.820), the ticket is at `free_coded`, and the branch is cleaned up.

**What changed**
- **Sending a link:** the business comes from where the sign-in started. A client site's host leads to its site and then that site's business, and an apex address under `/site/<key>/` does the same. The builder host, the apex's own pages, Access, or no return address all mean 1st Contact. The person is looked up in that business only, and the message goes into that business's history.
- **Redeeming a link and reading a session:** these no longer depend on the host. The business comes from the person the credential names. So Bob, invited by Alice's Plumbing, gets in. The same address in two businesses gets two separate sessions, and signing in to one never signs them in as the other. `signInTenant` is deleted.
- **Admission:** `admit` now looks a person up in the business their session belongs to. Access still means 1st Contact.
- **Terms gate:** a contact is only asked for their own business's documents. A client business's contact is never shown 1st Contact's terms. If they post the accept route anyway, nothing is recorded and no business is created for them.
- **Landing:** someone with no membership anywhere who opens `/` is sent to their portal. Members still land in the builder, and a recorded return address still takes priority.

**Tests**
- My new suite, `tests/test_UAT_FC_REQ-668_every_business_signs_in.workers.test.ts`, has six cases matching the ticket's test plan, and all pass.
- In the 25 related sign-in, session, terms, portal and invite suites, 227 of 228 tests pass. The one failure, `REQ-204 …the_chrome_is_told_nothing…`, fails the same way on xgd-working without my change. Another ticket added an `entered` key to the businesses response.
- In my first broad run, 23 other files also failed on xgd-working without my change.

**One change you should know about.** REQ-482 had a test that signed a 1st Contact member in from their own business's site. Under decision 1, a sign-in from that site is for that business's contacts, so that member now gets no link. I changed that test case to use one of that business's own contacts; what it checks (the sign-in comes back to the bound host) is unchanged. In practice, an owner who presses "Sign in" on their own site's account box gets nothing. They sign in through 1st Contact's pages. I've noted this in the ticket body.

The ticket body now has a "What landed" section describing the final code.

<!-- xgd-chat-end -->