---
uid: request-7af3f4e4
id: REQ-186
type: request
title: 'The invite: the verb that turns a contact into a member'
created_by: xgd
created_at: '2026-09-05T18:26:53.840793+00:00'
updated_at: '2026-09-05T18:26:53.840793+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: high
  story_points: 2
  auto_merge_back: true
  needs_review: false
---

# The invite: the verb that turns a contact into a member

## The gap

No running surface can create a person. There is no invite route, no `1c`
identity command, and `provisionInvite` has no caller outside `tests/`. The one
provisioning control that is reachable, `POST /api/admin/businesses`
([[REQ-180]] D2), adds a business to an account that must **already exist** and
answers `{"error":"No account with that email address."}` otherwise.

So every person in the system today arrived by a migration (`0005`) or a test
fixture. [[REQ-170]] says this plainly in its own *Not done*: *"The invite. The
tab reads and edits; it does not yet provision."* This is that ticket.

Verified against a running stack on 2026-09-05: inviting by hand — a single
`INSERT` into `users` — was the **only** step in the whole [[DOC-42]] §1 example
that had no surface. Everything downstream of it already works.

## One button, both levels

[[DOC-42]] §3: a level is a position, not a property. The invite is therefore not
two features. It writes into **the business you are in**, and which level that
makes is a fact about where you were standing:

- Invited from the **1st Contact** Users tab → a member of 1st Contact. Alice.
- Invited from **Alice's** Users tab → a member of Alice's Plumbing. Bob.

Same control, same code, same row shape. A UAT asserts the two paths differ only
in `users.tenant_id`, because a `level` column or a branch on which level a row
belongs to is §3's falsifier.

## It composes with the control that already exists

The tab already carries **Provision a business** — 1st Contact's fulfilment
action, gated on [[DOC-42]] §7's two conditions. Together:

| | |
| --- | --- |
| Invite | a level-2 customer — a member, with a portal |
| Invite **+** Provision a business | a level-1 customer — a member who also gets the app |

That is `provisionInvite` decomposed into the two steps [[DOC-42]] §9 describes,
and it is why that function becomes redundant rather than reachable: it does both
at once, which is the shape that cannot express Bob. **This ticket deletes
`provisionInvite`** once the button lands — a test-only entry point kept "in case"
is the legacy mode CLAUDE.md forbids.

Proven end to end on 2026-09-05 with the invite faked by hand: Alice appears in
the Users tab, **Provision a business** creates Alice's Plumbing, Alice logs in,
accepts terms, sees exactly one business — hers — reaches her own portal at
`/account`, and is 404'd from the fulfilment route. A UAT drives that sequence.

## A transition, not a creation

[[DOC-42]] §9: contact and member are one population in two states, and the invite
is the verb that moves a row across. So the invite **updates** — it sets
`invited_at` on the row the `(tenant_id, email)` index already decides
(`0004:61`) — and inserts only when there is no such row.

This is the section's own falsifier: *"an invite that inserts rather than
updates"*. The failure mode is a captured contact who is later invited becoming a
second row with a duplicate address, which is the exact case [[DOC-40]] cites as
the reason contacts and users are one table. A UAT captures a contact, invites
the same address, and asserts one row with `invited_at` now set.

Email is casefolded through `normaliseEmail` on the way in, for the reason
`0005` records: `idx_users_tenant_email` is byte-exact, so a differently-cased
row is a second person `admit` would never find.

## Who may invite

[[DOC-42]] §7 condition 1 alone: **you are an owner of this business** —
`ownsBusiness`, uniform, true of Alice on hers.

**Not `ownsPlatformBusiness`.** That is the gate on the fulfilment control, and
reusing it here is the one mistake this ticket is most likely to make: it would
mean only 1st Contact can invite anyone, which forecloses level 2 entirely and is
§7's falsifier — a generic "admin extension" mechanism standing in for a
capability every business owner needs. A UAT asserts Alice may invite into her
own business and may not invite into 1st Contact's.

Refusal follows the surrounding convention: 403 for a business the caller may not
operate, because that is an answer about them.

## The invite writes no entitlement

[[DOC-42]] §5: the Portal is what membership **is**, not a grant. An invited person
reaches their own payments, details and delete button by virtue of holding a row
at all. A UAT asserts the invite writes no `entitlements` row — §5's falsifier is
"an entitlement row created for every member and revoked for none", and the
concrete hazard is that a grant which can be absent produces a person who can log
in but cannot reach their own erasure control ([[DOC-37]]).

Access to the *app* is a separate grant, written by **Provision a business**,
which is exactly the §5 line: a fact about this person's relationship with this
business needs no grant; something the business provides does.

## No mail is sent

There is no mail infrastructure in this repository and this ticket does not add
any. The invite is a database transition; the person is admitted the next time
they pass the front door. Naming this is the point — an "invite" that silently
sends nothing is a feature an operator will assume exists and will not check.
Delivery is its own ticket when there is a sender to write it against.

## Not in scope

- **Level 2 login.** A member of a customer's business **cannot sign in today**,
  and the invite does not change that. `admit` resolves identity with
  `findUser(env, platformTenant, email)`, so a row in Alice's tenant is `no_user`
  and refused — verified 2026-09-05: Bob, seeded into Alice's business, lists
  correctly on her Users tab as a Member and is answered 403 at `/account`. What
  this ticket delivers at level 2 is the row and its representation; the door is a
  separate and larger change, because it is also an Access question — Bob
  authenticates at Alice's domain, which no Access application covers
  ([[REQ-147]]). Recorded here because it is not written down anywhere else; it
  needs its own ticket and is not blocked by this one.
- **`display_name` editing** — [[REQ-183]] §5, a different ticket.
- **Phone-only contacts** — [[DOC-42]] §4.1 records that `users.email` is
  `NOT NULL` and no `phone` column exists, so a contact reachable only by phone is
  unrepresentable. Unchanged here.

## Acceptance

- a person invited from the Users tab appears in that tab as **Member**
- the same invite from two different businesses differs only in `users.tenant_id`
- inviting an address that is already a contact of that business updates one row
  and does not insert a second
- an owner may invite into their own business; a non-owner is refused 403
- the invite writes no `entitlements` row
- the [[DOC-42]] §1 sequence runs: invite Alice, provision her a business, Alice
  signs in and reaches only her own business and her own portal
- `provisionInvite` no longer exists
