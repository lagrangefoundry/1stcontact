---
uid: comment-7b97c125
id: COMMENT-4830
type: comment
title: Comment on epic EPIC-23
created_by: xgd
created_at: '2026-10-03T17:57:02.385659+00:00'
updated_at: '2026-11-09T06:19:57.622212+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: epic-ee37a03f
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "502dbcd7-2ce5-476a-9933-2f5aa4c989b5",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="85898c02-6d70-4335-9063-e23c3e43d528-user" -->

<!-- xgd-chat role="user" ts="2026-10-03T17:54:47.287002+00:00" -->
#### You
This Epic is for two related features:
impersonation and delegate user access.

Impersonation is a super-user feature (basically me today). It will allow my user to "impersonate" any user on the platform so I see the platform as if I was them. We used to have this feature on Ning a social media site. Ideally this feature goes further than logging me in as the user - my super user status is retained, my access the to platform console is retained so I can easily switch back to me, or to anyone else.

The impersonation interface should be on the platform console page.

When impersonating it would be good if there was some visiual reminder (like a banner on every page) that I am in impersonation mode.

Multi-email is straightforward. It means that as an account owner I can add additional emails (and remove) which can be used to log in to the account. At least one validated (user has logged in from it at least once) email needs to be retained. This is configured in the profile portal

Delegate user means that as a business owner I can invite other people to manage the business. This would work from the contacts page. It is a special kind of invite. The invited user has to sign on to the platform (thereby creating and account). In V1 they get full access to the business. The only restriction is they do not have control of the delegation feature. In future versions delegate access may be controlled on a per tab basis. A delegate will see and can switch to the businesses they have delegated access to in the business selector along side any that they own.

<!-- xgd-turn id="85898c02-6d70-4335-9063-e23c3e43d528-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-03T18:10:17.794403+00:00" -->
#### Claude
Still waiting on the code map. Meanwhile I've confirmed that memberships, contacts-as-users and the platform-admin split (REQ-185) are already in place.

Waiting for the code-map agent to finish. Then I'll draft the epic body.

<br>

user_emails already exists, which changes how big multi-email is.

Still waiting on the code-map agent. In the meantime I found an existing contacts-tab Invite (REQ-199) that the delegate invite would sit beside.

Writing up the epic body now from what I've found. The code-map agent's results will go into it as they arrive.

The code map is back. It changes four parts of the draft, so I'll fold those in.

I've written up EPIC-23. It has a new title, "Identity: impersonation, multiple login emails, and delegate access", and is still at `draft`. You said two features but described three, so all three are in it. I haven't created child tickets yet, because the open questions below decide what goes in them.

**What the code already supports:**
- **Multiple emails are half-built.** The table of a person's addresses (`user_emails`) already allows several per person. Sign-in already accepts a link sent to any of them (`sessions.ts:348`). What's missing:
  - Nothing records whether an address has been validated, so "keep at least one validated" can't be enforced yet. Sign-in links don't even record which address they were sent to.
  - The profile portal (`/account`) is read-only, and nobody can edit their own profile anywhere today. This would be its first editable surface.
- **Delegates fit the existing memberships table.** A delegate would be a new role value, `delegate`, alongside the only role used today, `owner`. Two snags:
  - The existing contacts-tab Invite doesn't grant access to the business. When it's accepted, it creates a new business for the invitee. A delegate invite needs to do the opposite.
  - Contacts are stored per business, but sign-in only works for platform-level users. So the delegate invite has to find or create a platform user for the contact's email.
- **Nine owner-only checks need sorting.** Nine routes currently require `owner`. Each one has to be marked as open to delegates or kept for owners (delegation management). Delegates of the 1st Contact business itself would not get the platform console.
- **Impersonation is the one real design decision.** Today you can already enter any business, but only as yourself. Impersonating means the session holds two people: you (the actor) and the user (the subject). The platform console check and the start/switch/stop controls look at you; everything else looks at the user. That's what keeps your console and lets you switch without signing in again.
  - I've proposed storing this in a new table rather than adding a column to `sessions`, because that table's schema is pinned by a test against the auth component.
  - The console currently lists only sites, not users, so it also needs a way to find a user.

**Questions for you:**
1. **Impersonation limits.** Should it expire on its own? My proposal: it lasts as long as your session, with no separate timer in v1. Should anything be refused while impersonating? My proposal: removing a login email and deleting the account.
2. **Primary email.** Does the owner choose which address is primary (where platform mail goes), or is it automatically the first validated one?
3. **Delegate limits.** My proposal: delegates can't see the owner's account pages (billing, the owner's profile). They also can't delete the business or change its plan or payment, on top of not managing delegates. Agreed?
4. **Delegate with no business of their own.** Confirm they get an account but no starter business.

**Children:** I'm proposing three tickets, one per feature. None blocks another, and they can land in any order. Say the word and I'll create them.

<!-- xgd-turn id="8f7df6e5-584f-4575-b3d3-317262fda6ec-user" -->

<!-- xgd-chat role="user" ts="2026-10-03T18:17:39.372958+00:00" -->
#### You
**Impersonation is the one real design decision.** Today you can already enter any business, but only as yourself. <-- I was not aware of this. This may be sufficient but there is a navigation issue - I have no way to open businesses other than my own. That could be solved with a console control - I can see all the businesses listed, I just need a link/button that will let me open the app in that business.

Contacts are stored per business, but sign-in only works for platform-level users. So the delegate invite has to find or create a platform user for the contact's email. <-- that's ok, there is a missing UI - the business owner needs to be able to manually add contacts - once they can they just add the delegate email to their contacts list and send the invite.

<!-- xgd-turn id="8f7df6e5-584f-4575-b3d3-317262fda6ec-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-03T18:19:11.729030+00:00" -->
#### Claude
Rewriting section 1 around the console "Open" control, and noting add-contact in section 3.

I've updated EPIC-23 with both changes.

**Impersonation becomes "Open business" from the console.** Full impersonation is parked, and the epic keeps the design notes in case it comes back. v1 is:
- An **Open** control on every business row in the platform console. It opens the app scoped to that business.
- While you're in a business you don't belong to, a banner on every page says so and gives you a way back. The business selector shows that business as the current one, marked as entered rather than owned.
- Getting back is just the normal selector, since it still lists your own businesses.
- The console stays available the whole time. Your own sign-in never changes, so the console check still sees you.
- Each entry is recorded in the audit log.

One consequence to decide on. When you enter a business you're not a member of, you have no role there, so the owner-only controls stay closed. That covers adding and inviting contacts, and the other people actions (nine checks in `router.ts`). You'd see the business but not act as its owner. Is that enough for support, or should those controls open to you too?

**Adding contacts may already exist.** The Contacts list has a small **+** button ("Add a contact", `builder/people.js:1082`), backed by a working add endpoint. It only shows to an owner of the business. So either:
- you were in a business you don't own (for example, entered as operator, which is exactly the case above), or
- the + is too easy to miss.

Which is it? If it's discoverability, that fix goes into the delegates ticket.

The delegate flow in the epic now reads: add the person as a contact, then **Make delegate** on them.

**Still open from last time:**
- Who chooses the primary email?
- Should delegates be kept off the owner's account pages and away from plan, payment and deleting the business?
- Should a delegate's new account come with no starter business?

The three proposed child tickets are now Console "Open business", Login emails, and Delegates. I'll create them once you've answered these.

<!-- xgd-turn id="50658cd7-a16a-4bb2-9592-12db2aaea1e7-user" -->

<!-- xgd-chat role="user" ts="2026-10-03T18:25:44.238194+00:00" -->
#### You
recorded in the audit log.

One consequence to decide on. When you enter a business you're not a member of, you have no role there, so the owner-only controls stay closed. That covers adding and inviting contacts, and the other people actions (nine checks in `router.ts`). You'd see the business but not act as its owner. Is that enough for support, or should those controls open to you too? <-- superuser needs to be able to do everything, but not necessarily in v1

**Still open from last time:** - Who chooses the primary email? - Should delegates be kept off the owner's account pages and away from plan, payment and deleting the business? - Should a delegate's new account come with no starter business?

What do you mean by primary email?'

Delegates are delegated to a business NOT an account.

Everyone gets a started business but for delegates they may not pay to run it (which is fine). A nice feature would be for the business selection to default to a delegated business if the business they own is not published. Also the selector should be clear about which businesses are owned vs delegated

<!-- xgd-turn id="50658cd7-a16a-4bb2-9592-12db2aaea1e7-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-03T18:26:50.138312+00:00" -->
#### Claude
I've recorded all of these in EPIC-23:
- **Superuser can do everything in any business. That's the target, not v1.** v1 ships the console **Open** control only, so the owner-only controls stay closed when you enter a business you're not a member of. Opening them comes later, through your platform-operator flag rather than a fake owner membership.
- **Delegates are delegated to a business, not an account.** They get nothing on the owner's account: no billing, no profile, no other businesses. Inside the business they can do everything except manage delegation.
  - The business's plan, payment and delete controls don't exist as per-business controls yet, so v1 doesn't need to decide them. They're parked until billing lands.
- **Everyone gets a starter business, delegates included.** Accepting a delegate invite runs the normal onboarding, which creates their own account and starter business, and also adds the delegate membership. It's fine if they never pay for their own.
- **The selector marks each business as owned or delegated.**
- **The default business prefers a delegated one.** If the delegate has no remembered selection and their own business isn't published, the app opens their delegated business instead. A remembered selection always wins. I've defined "published" as at least one live site; the child ticket will check that against how publishing actually works.

**What I meant by primary email:** each person's addresses include exactly one marked primary. The database allows only one. It isn't about sign-in, because a sign-in link works for any of your addresses. It matters in two places:

1. **Where the platform writes to you.** Invites, notices and alerts have to go to a single address.
2. **Who you appear as.** The current sign-in resolves to your primary address, and that's the email shown on your profile and in the console.

So once you have several addresses, something has to decide which one is primary. The options are:
- **(a)** Automatic: your first validated address, i.e. the one you signed up with, unless you remove it.
- **(b)** A "make primary" control next to each validated address on your profile.

I'd go with (b), defaulting to (a). It's a small addition, and without it you'd have no way to move your mail off an old address short of removing it.

Once you've picked, I'll create the three child tickets: Console "Open business", Login emails, and Delegates.

<!-- xgd-turn id="72178db9-5047-41ee-ae87-49169af6af11-user" -->

<!-- xgd-chat role="user" ts="2026-10-03T18:31:23.247605+00:00" -->
#### You
Yeah make it b please - it should default to the first you entered, but you can choose a different one.

<!-- xgd-turn id="72178db9-5047-41ee-ae87-49169af6af11-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-03T18:33:22.373513+00:00" -->
#### Claude
Created the three children; now linking them in the epic's children list.

Option (b) is in the epic: your primary email defaults to the first address you entered, and a **Make primary** control lets you choose another. Only validated addresses can be made primary, and you can't remove the primary until another address is primary.

I've created the three child tickets. Each is at `draft`, linked to EPIC-23, and holds its full section of the epic:

| Ticket | Scope |
|---|---|
| **REQ-367** | Platform console: an **Open** control on each business, a banner while you're in a business you don't belong to, an audit entry each time you open one. In v1 you can look but not use owner-only controls; full superuser access comes later. |
| **REQ-368** | Profile portal: add and remove login emails, track whether each is validated, Make primary, and never remove the last validated address. |
| **REQ-369** | Delegates: the `delegate` role, Make delegate on a contact, accepting the invite (which also creates their own starter business), and revoking. Plus the owner-only route review, the owned/delegated marks in the selector, and defaulting to a delegated business when the delegate's own isn't published. |

None of them blocks another, so they can land in any order. Each one gets built in its own ticket session; this epic session doesn't write code.

One question is still open in REQ-369. You said there's no way to add contacts, but the Contacts list already has a small **+** button ("Add a contact") that only shows to the business owner. Can you not see it, or is it missing something you need? If it's just too easy to miss, making it more visible goes into REQ-369.

<!-- xgd-turn id="1f8428f0-b4f3-4b50-9837-d95c4e05ba27-user" -->

<!-- xgd-chat role="user" ts="2026-11-08T00:13:31.310120+00:00" -->
#### You
Can you own REQ-668 and answer the questions in its transcript. Please put the answers in its ticket body.

<!-- xgd-turn id="1f8428f0-b4f3-4b50-9837-d95c4e05ba27-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-08T00:15:27.251147+00:00" -->
#### Claude
Reading DOC-45 §10 and the `site_domains` lookup to check the answers against the design. Then I'll write them into REQ-668.

Writing the five answers into REQ-668's body now. They replace its "Open decisions" section; nothing else in the body changes.

Adding two test-plan bullets so decisions 4 and 5 each have a UAT behind them.

I've answered REQ-668's five questions in its ticket body. They replace its "Open decisions" section, and the rest of the body is unchanged. I accepted all five recommendations. Reading the code changed one answer: question 1 had to be widened.

1. **The business is chosen from where the sign-in started.** The return address the send route already checks names a site, and that site's business is the one used (host → site → business).
   - **What I added:** client pages may still be served under the apex at `1stcontact.io/site/<key>/`. A host lookup alone would send those sign-ins to 1st Contact, so a return address there resolves through the site key instead.
   - **How a client's customer gets in:** only from that business's site or from an invite it sent. Typing `app.1stcontact.io/sign-in` directly reaches only 1st Contact's contacts.
   - **Redeeming the link and reading the session** don't need the host, because the person's record already names their business.
2. **One session per business per browser.** Signing in to another business replaces the current session. The cost is that someone who owns a 1st Contact business and is also Alice's Plumbing's customer gets signed out of the builder when they sign in to Alice's portal. I've recorded that as accepted.
3. **It stays on `app.1stcontact.io` for v1.** One added rule: nothing may assume the portal is on the business's own site, so a later move to the customer's own domain stays easy.
4. **The terms gate shows each contact their own business's documents.** A client business's contact is never asked to accept 1st Contact's. Until REQ-666 lets businesses publish their own documents, those contacts see no gate. Accepting never creates a business for them; only 1st Contact's own new contacts get a starter business. I rejected refusing them until REQ-666 lands, because REQ-666 needs them admitted to build on.
5. **Someone with no business they can operate lands on their portal.** "Operate" means holding an owner role, or delegate once REQ-369 lands. Members still land in the builder, and a recorded return address still wins.

I also added two items to the test plan, one each for decisions 4 and 5. No code was changed. REQ-668 is still at `draft`, so its own session can start building whenever you're ready.

<!-- xgd-turn id="f9e8e9e1-8f8f-4fb9-8790-206eb3ce2b56-user" -->

<!-- xgd-chat role="user" ts="2026-11-08T16:29:21.642753+00:00" -->
#### You
668 is implemented - can you summarize what happens now. I think that previously all members were associated with 1stcontact - not sure how we got there. Each business has its own contact list and its members log on to that business. Is this what we implemented?

<!-- xgd-turn id="f9e8e9e1-8f8f-4fb9-8790-206eb3ce2b56-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-08T16:30:08.887583+00:00" -->
#### Claude
Mostly yes. Each business now has its own contact list, and its customers sign in to that business. But business owners are still contacts of 1st Contact, and that's by design, not a leftover. REQ-668 is at `ready_to_reconcile`, and my summary comes from its "What landed" section plus a quick read of `onboarding.ts`.

**There are two separate things:**
- **Being a contact** is who you are and whose list you're on. Every person record belongs to exactly one business.
- **Being a member** is which business you operate. That's a membership row, the `owner` role today and `delegate` once REQ-369 lands.

**Why owners are 1st Contact's contacts:** 1st Contact is a business, and its customers are business owners. So Alice is a contact of 1st Contact who holds an owner membership of Alice's Plumbing. Bob, Alice's customer, is a contact of Alice's Plumbing and holds no membership anywhere. This is the design in DOC-40 §2.1. Signing up confirms it in the code: Alice accepts 1st Contact's invite as one of 1st Contact's contacts, and onboarding creates her business with an owner membership for her.

**What the code did before REQ-668:** the stored data was already per business, but sign-in only ever looked people up in 1st Contact's list. Owners and delegates could sign in. Bob could be sent an invite by Alice's Plumbing but was refused when he used it. That's the "everyone belongs to 1st Contact" behaviour you were seeing.

**What happens now:**
- **Sending a link:** the business comes from where the sign-in started. A client site's own address, or an address under `1stcontact.io/site/<key>/`, means that site's business. Anywhere else means 1st Contact: the builder, 1st Contact's own pages, or no return address. The person is looked up in that business's list only.
- **Redeeming the link and the session** take the business from the person's own record, not from the host.
- **Terms:** a contact only owes their own business's documents. Bob is never shown 1st Contact's terms, and accepting never creates a business for him. Until REQ-666 lets businesses publish their own documents, client contacts see no terms gate.
- **Landing:**
  - Someone with no membership, like Bob, lands on their portal instead of the builder.
  - Members still land in the builder.
  - A recorded return address still wins.
- **Same address in two businesses:** that's two separate people with separate sign-ins, and you can be signed in to only one business per browser at a time.

One consequence to know about: Alice signs in to the builder from 1st Contact's pages. Her own site's account box signs in Alice's Plumbing's customers, not her. If she's also on her own business's contact list, signing in there makes her that contact and replaces her builder session. REQ-668 records this as replacing one older REQ-482 test.

<!-- xgd-turn id="28f9e10b-3329-4e10-bd09-6244b83f7947-user" -->

<!-- xgd-chat role="user" ts="2026-11-08T16:42:32.222898+00:00" -->
#### You
I see and just to double check Alice alice@example.com can be a member of mulitple businesses?

<!-- xgd-turn id="28f9e10b-3329-4e10-bd09-6244b83f7947-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-08T16:43:11.441990+00:00" -->
#### Claude
Checking the memberships table definition to confirm one person can hold several.

Yes. Alice is one person, a single contact in 1st Contact's list, and she can hold memberships in as many businesses as she likes:

- **The table allows it.** Each row in `memberships` links one person to one business with a role. Nothing limits a person to one row (`db/migrations/0001_baseline.sql:836`).
- **The selector uses it.** The business selector lists every business Alice has a membership in (`identity.ts:1485`).
- **Roles can mix.** She can own Alice's Plumbing and be a delegate of Carol's Bakery, now that the delegate work in `delegates.ts` has landed.

All of this runs under her one 1st Contact sign-in, so switching between those businesses is just the selector, with no new sign-in.

Being a customer is different from being a member. If Carol's Bakery adds alice@example.com as a customer, that creates a separate contact record in Carol's list. Signing in as that customer replaces her builder session, because a browser holds a session for one business at a time.

<!-- xgd-turn id="51d751fe-4816-473e-a908-b3411053a478-user" -->

<!-- xgd-chat role="user" ts="2026-11-08T16:57:52.961069+00:00" -->
#### You
Not quite what I am asking - that is level 1 users.

Lets say Alice is a L1 customer but she can also be a member of Bob's site - her membership of bob's site is completely unconnected to her membership of 1c - jsut happens to use the same email address

<!-- xgd-turn id="51d751fe-4816-473e-a908-b3411053a478-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-08T16:58:11.961139+00:00" -->
#### Claude
Yes, that's what REQ-668 implemented. Alice's place in 1st Contact and her membership of Bob's site are two separate records that happen to share an address.

- **Two separate person records.** Her 1st Contact record and her Bob's-site record are different rows, each belonging to its own business. Email uniqueness is per business: the index is on (business, email), `db/migrations/0001_baseline.sql:499`. The same address can therefore appear in any number of businesses without them ever linking.
- **Two separate sign-ins.** Starting from Bob's site signs her in as Bob's member and opens Bob's portal. Starting from 1st Contact's pages or the builder signs her in as 1st Contact's customer and opens her builder. One of REQ-668's UATs covers exactly this: the same address in two businesses gets two sign-ins, and neither session admits the other contact.
- **Nothing carries across.** Bob sees only his member record. Changes to her 1st Contact profile don't touch it, and that includes the extra login emails coming in REQ-368.

The only practical overlap is that one browser holds one session. Signing in to Bob's site signs her out of the builder in that browser, and the other way round. A second browser or a private window keeps both open.

<!-- xgd-turn id="6289ba6a-d165-4e8c-a837-c505abb8e7df-user" -->

<!-- xgd-chat role="user" ts="2026-11-08T17:02:48.319441+00:00" -->
#### You
The only practical overlap is that one browser holds one session. Signing in to Bob's site signs her out of the builder in that browser, and the other way round. A second browser or a private window keeps both open. <-- ok this is a problem. These signins need to be completely independent. I need to be able to be signed in to Bob's Salon and 1stcontact at the same time - they are unrelated sites.

<!-- xgd-turn id="6289ba6a-d165-4e8c-a837-c505abb8e7df-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-08T17:03:22.776231+00:00" -->
#### Claude
You're right, and that's my mistake. Decision 2 in REQ-668 ("a session belongs to one business, signing in to another replaces it") was my call, made while you'd handed the questions to me. It's the wrong rule for unrelated businesses.

**What the fix would be:** one browser can be signed in to several businesses at once, each completely independently.
- The browser holds a separate session for each business. Today there's one cookie on `app.1stcontact.io`; this would be one cookie per business, or one per business's path.
- Every signed-in page knows which business it belongs to from its address. The builder and console belong to 1st Contact. Bob's Salon's portal has Bob's business in its URL. Each page reads only that business's session.
- Signing in or out of one business never touches the other. Alice stays in her builder while signed in to Bob's Salon, and signing out of Bob's leaves her builder session alone.
- Everything else REQ-668 did stays: separate person records, the business chosen from where sign-in started, and the per-business terms gate.

The longer-term route is moving each business's portal onto its own domain, which separates the cookies for free. That still waits on the custom-domain sign-in design, so a session per business on the shared host is the v1 fix.

**Where it goes is your call.** REQ-668 is at `ready_to_reconcile`, so the dispatcher may reconcile it at any moment.
- **(a) A new bug ticket for the fix.** REQ-668 reconciles as it is, and the bug changes decision 2. This is what I'd recommend, since it's a fix to work that has already landed.
- **(b) Pull REQ-668 back to `free_coded`** and extend it. That has to happen before the dispatcher picks it up.

Either way I'd also correct decision 2 in REQ-668's body so it doesn't pin the wrong rule. Which do you want?

<!-- xgd-turn id="35b256e1-5ea7-4214-b4ef-267494883932-user" -->

<!-- xgd-chat role="user" ts="2026-11-08T17:04:09.356565+00:00" -->
#### You
I think this deserves a new ticket - glad we caught this one

<!-- xgd-turn id="35b256e1-5ea7-4214-b4ef-267494883932-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-08T17:05:20.870977+00:00" -->
#### Claude
Filing the bug now, then correcting decision 2 in REQ-668.

REQ-668's body is frozen now that it's queued for reconcile, so I'll try adding the correction as a comment instead.

I've filed **BUG-382**, "Sign-in: sessions for unrelated businesses replace each other in one browser". It's at `draft` with high severity, and I linked it under EPIC-23 because it's identity work.

**What it says:**
- **The cause:** the accounts host has one session cookie, so each new sign-in overwrites it. The portal also sits at one fixed `/account` path that doesn't say which business it's for.
- **The fix:** one browser holds a separate session for each business.
  - Every signed-in page belongs to one business, named in its address, and reads only that business's session. The builder and console are 1st Contact's; a client business's portal URL names that business.
  - Signing in or out of one business never touches another's session.
  - Everything else from REQ-668 stays as it is.
- **Suggested mechanism, not binding:** a cookie per business and a portal URL that carries the business. Moving each portal onto its own domain stays deferred.
- **Test plan:** four UATs:
  - the same address signed in to 1st Contact and a client business at once, both working;
  - signing out of one leaves the other working;
  - a page for a business with no session counts as signed out for that business only;
  - one business's session is never accepted on another business's page.

**On REQ-668:** I couldn't correct decision 2 in its body. It's queued for reconcile, and the body is frozen at that point. I added a note (COMMENT-8014) saying decision 2 is overruled, pointing to BUG-382, and asking reconcile not to pin "signing in replaces the other session" as an acceptance criterion. Comments rank below the body for reconcile, so the old decision could still end up pinned. If it does, BUG-382 supersedes it when it lands.

BUG-382 is ready to build in its own session.

<!-- xgd-turn id="d852e78a-6c0a-498e-8a55-d2ae5abd7715-user" -->

<!-- xgd-chat role="user" ts="2026-11-09T06:10:33.495456+00:00" -->
#### You
I am FREQUENTLY getting yellow pop up that asks me to "Sign in again" whe I click the CTA I do not have to prove any credentials but the whoole builder has to reload which takes 30 sec +

<!-- xgd-turn id="d852e78a-6c0a-498e-8a55-d2ae5abd7715-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-09T06:13:17.464986+00:00" -->
#### Claude
Looking into it: the notice comes from the builder's one fetch wrapper, which treats *any* failed request as "session ended". Checking what could be failing.

Promising lead: sessions use token rotation. Reading that.

Pulling the last few hours of production 401s and failed requests from Workers Logs to see what the builder actually got.

Very few 401s. Instead, the builder's own calls are failing a lot: 500s on `await-turn`, 503s on many reads, and many "canceled" requests. Checking what those errors are.

I found the cause. Your session isn't ending at all. The builder raises "Sign in again" whenever any request fails to reach the server, even for a moment, and one background request is now always open.

**What the logs show.** I pulled production Workers Logs for the last few hours:
- Before your reloads at 21:36 and 22:09 there was no 401, no 500, and no refusal of any kind.
- The only events at those moments are the builder's open requests being cut off by the reload itself.
- In 12 hours there were only 8 real 401s.

So the banner came from a request that failed inside the browser and never reached the server.

**Why it happens.**
- Every builder request goes through one helper, `send` in `apps/control-app/src/builder/api.js:125`. If a request fails outright, with no response at all, `send` immediately shows "The builder could not reach the server — your session may have ended. Sign in again". It treats that as the most likely sign of an expired sign-in.
- Since BUG-348 (landed 4 Nov), the chat panel keeps a request to `/api/ai/await-turn` open around the clock, so it can follow turns it didn't start. That loop is built to retry on failure (`chat.js:1448`).
- By the time the loop retries, `send` has already put the banner up. Any small network hiccup triggers it: the laptop waking from sleep, a Wi-Fi change, a dropped connection.
- That matches what you see. The reload asks for no credentials because the session was fine all along.

Your tab-change reporting already avoids the banner for exactly this reason, but the new background loop doesn't.

**The fix I'd scope:** a failed request on its own should never claim the session ended. Before showing the banner, `send` should check the session with one quick call:
- If that call gets a 401, show the banner as now.
- If it doesn't, treat the failure as a passing network problem. The calling code handles it itself, and the background loop just retries quietly.

**The 30-second reload is a second problem.** Right after your 22:09 reload, the preview requests took about 8 seconds each and returned 500s. Several settings reads also got 503 "store busy". That's what makes the reload so slow. I'd put it in the same ticket as a second part, since it's the other half of what you're hitting. A separate ticket is fine too.

Do you want me to file this as a new bug under EPIC-23? This session only files tickets when you say so. It would be built in its own session.

<!-- xgd-turn id="512f4947-10e4-4dd4-a016-15142d78f875-user" -->

<!-- xgd-chat role="user" ts="2026-11-09T06:19:11.421542+00:00" -->
#### You
yes please

<!-- xgd-turn id="512f4947-10e4-4dd4-a016-15142d78f875-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-09T06:19:54.898582+00:00" -->
#### Claude
I've filed **BUG-399**, "Builder: a dropped request shows 'Sign in again' though the session is fine". It's under EPIC-23 at `draft`, high severity.

**What's in it:**
- **Evidence:** production logs show no 401 or server error before your reloads at 21:36 and 22:09. The failure happened in the browser and never reached the server.
- **Cause:**
  - The builder shows the sign-in notice whenever any request fails outright. That made sense when Cloudflare Access guarded the builder, but REQ-475 made the builder public at the edge.
  - Since BUG-348 (4 Nov), the chat panel keeps a request open all the time to follow turns it didn't start. Any network hiccup now turns into "Sign in again".
- **Part A of the fix:** when a request fails, the builder first checks the session with one quick call.
  - Only a 401 shows the notice.
  - If the session is fine, the failure goes back to the code that made the request, and the background loop retries quietly.
  - If the network is down altogether, there's still no sign-in notice. A small "Connection lost, retrying" strip is optional.
  - Real 401s and the operator console behave as they do now.
- **Part B of the fix:** the slow reload. After your 22:09 reload, the draft previews took about 8 seconds each and returned 500s, and several settings reads got 503 "store busy". Part B is to find and fix why a fresh builder load does that.
- **Test plan:** six tests:
  - a failed request with a live session shows no notice;
  - a failed request with an ended session shows it;
  - a failed request with the network down shows no notice;
  - the background loop rides out a failure;
  - a plain 401 still shows the notice at once;
  - one test pinning the slow-reload cause.

BUG-399 is ready to build in its own session. Until it lands, the notice will keep appearing, and reloading is safe: no sign-in is needed.

<!-- xgd-chat-end -->