---
uid: comment-7b97c125
id: COMMENT-4830
type: comment
title: Comment on epic EPIC-23
created_by: xgd
created_at: '2026-10-03T17:57:02.385659+00:00'
updated_at: '2026-10-03T18:19:14.424051+00:00'
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

<!-- xgd-chat-end -->