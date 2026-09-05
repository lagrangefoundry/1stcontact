---
uid: request-7af3f4e4
id: REQ-186
type: request
title: 'The invite: the verb that turns a contact into a member'
created_by: xgd
created_at: '2026-09-05T18:26:53.840793+00:00'
updated_at: '2026-09-05T18:48:51.799117+00:00'
completed_at: null
last_field_updated: story_points
status: free_coded
fields:
  priority: high
  story_points: 3
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-a289690d
  commits:
  - working_sha: 27345a60cb6accf3402aa0ad2248b1321fd11ef9
    reconcile_sha: null
    main_sha: null
  version: 0.2.73
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
belongs to is §3's falsifier — so the same UAT also reads the `users` schema back
and asserts no such column exists. A second UAT reads the two businesses' people
lists and asserts Bob is in hers and not in ours, which is the same claim from the
reading side.

## It composes with the control that already exists

The tab carries **Provision a business** — 1st Contact's fulfilment action, gated
on [[DOC-42]] §7's two conditions. Together:

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

### The composition has to be reachable, so two adjacent things are repaired

Wiring the invite showed that the composition this section describes was not
actually performable in the running product. Both repairs are part of this ticket
because without them the sentence above is false on screen:

- **The fulfilment control was dead code.** [[REQ-170]] wrote it behind an
  `onFulfil` callback that nothing ever passed, so `canFulfil` was reported, the
  route existed, and the button could never render. It is wired here — a dialog
  taking the business name and posting the account's own address, so the operator
  never retypes an address they are looking at into a permanent `tenants` row. An
  unwired hook reads as "supported" and is not, which is the shape CLAUDE.md
  forbids for the same reason it forbids the retained legacy path.
- **The detail pane never rendered.** `list-detail` calls
  `openDetail(item, tabController)` and reads `descriptor.element` off what comes
  back; the panel's `openDetail` was `async` and treated the second argument as a
  view to append into. The component therefore mounted its empty placeholder and
  the append threw into an unhandled rejection — a blank pane for every person,
  with nothing on screen saying why. It now builds its element synchronously and
  fills it asynchronously, which is what the Library panel beside it already does.
  A UAT asserts the pane has content, because "no error" was already true.

## A transition, not a creation

[[DOC-42]] §9: contact and member are one population in two states, and the invite
is the verb that moves a row across. So the invite **updates** — it sets
`invited_at` on the row the `(tenant_id, email)` index already decides
(`0004:61`) — and inserts only when there is no such row.

This is the section's own falsifier: *"an invite that inserts rather than
updates"*. The failure mode is a captured contact who is later invited becoming a
second row with a duplicate address, which is the exact case [[DOC-40]] cites as
the reason contacts and users are one table. A UAT captures a contact, invites
the same address, and asserts one row with `invited_at` now set — and that it is
the *same* row id, because replacing the row would move the person rather than
promote them.

Email is casefolded through `normaliseEmail` on the way in, for the reason
`0005` records: `idx_users_tenant_email` is byte-exact, so a differently-cased
row is a second person `admit` would never find.

Two consequences of "transition", both asserted:

- **`invited_at` is not restamped** for someone already invited. It records *when*
  this person was invited, so overwriting it on a second press falsifies the one
  fact the invite exists to write. Re-inviting a member is a no-op that reports
  the member, not an error — the operator asked for a state the system is in.
- **`display_name` is filled in and never overwritten.** A name typed at the
  invite is a courtesy for a row that has none; editing an existing one is
  [[REQ-183]] §5's surface, and letting the invite do it would give the tab a
  second, undeclared way to rename a person.

The result reports `created` — whether a row was *inserted* — rather than whether
the person is now a member, because both branches leave a member behind and the
operator's question at the moment they press the button is *did I add someone, or
promote someone you already knew about*. The dialog says which, in those words.
A flag that answered `true` in both cases would make the contact→member
transition invisible at exactly the surface that performs it.

## Who may invite

[[DOC-42]] §7 condition 1 alone: **you are an owner of this business** —
`ownsBusiness`, uniform, true of Alice on hers.

**Not `ownsPlatformBusiness`.** That is the gate on the fulfilment control, and
reusing it here is the one mistake this ticket is most likely to make: it would
mean only 1st Contact can invite anyone, which forecloses level 2 entirely and is
§7's falsifier — a generic "admin extension" mechanism standing in for a
capability every business owner needs. A UAT asserts Alice may invite into her
own business and may not invite into 1st Contact's, and a second asserts that
holding `platform_operator` — which opens a business you hold no membership on
([[DOC-42]] §8) — does not thereby make you its owner and does not admit an
invite into it.

Refusal follows the surrounding convention: 403 for a business the caller may not
operate, because that is an answer about them. It is **not** the 404 the
fulfilment route answers: that one hides because an unprivileged caller asking
whether an *administrative* surface exists is owed nothing, and this surface is
not administrative — every business owner has it, so its existence is no secret.

**The dev-open loopback path is refused too**, and a UAT says so. That branch
skips Access and `admit` entirely, so there is nobody there to own anything; a
door onto creating people that opens only when authentication is switched off is
a shape that reads as a feature and would eventually be relied upon. It is the
same argument `/api/admin/businesses` already makes for itself.

An invite carrying no address is 400 rather than the 500 an uncaught throw would
become — an empty box is the operator's mistake, and "the builder broke" sends
them back to retry the one thing that cannot work.

`GET /api/people` reports **`canInvite` alongside `canFulfil`** — two flags,
because they are two conditions. `canInvite` is *you own this business* and is
true of every owner; `canFulfil` adds *this business's product is businesses* and
is true only of ours. Collapsing them into one is precisely how the invite would
end up gated on being 1st Contact. Both are conveniences for the chrome and
neither is the gate; each route asks its own question again for itself.

## The invite writes no entitlement

[[DOC-42]] §5: the Portal is what membership **is**, not a grant. An invited person
reaches their own payments, details and delete button by virtue of holding a row
at all. A UAT asserts the invite writes no `entitlements` row — §5's falsifier is
"an entitlement row created for every member and revoked for none", and the
concrete hazard is that a grant which can be absent produces a person who can log
in but cannot reach their own erasure control ([[DOC-37]]). It writes no
`memberships` row either: that is the right to *run* a business, which is a
different act and usually a different business ([[DOC-42]] §4).

Access to the *app* is a separate grant, written by **Provision a business**,
which is exactly the §5 line: a fact about this person's relationship with this
business needs no grant; something the business provides does.

One observable consequence, asserted rather than left implicit: an account
invited into 1st Contact and given no business is refused `no_membership` at the
door. That is the composition being load-bearing rather than a gap in it —
`admit` requires a relationship with something, the invite deliberately writes
none, and so the invite makes the member while the business makes the app
reachable. Getting only one of the two is a visible, nameable state rather than a
silent one. (Level-1 read-only-on-lapse is [[DOC-42]] §10.1 and is not this
ticket.)

## No mail is sent

There is no mail infrastructure in this repository and this ticket does not add
any. The invite is a database transition; the person is admitted the next time
they pass the front door. Naming this is the point — an "invite" that silently
sends nothing is a feature an operator will assume exists and will not check.
Delivery is its own ticket when there is a sender to write it against.

Because that is the point, **the dialog says it in words** and a UAT asserts the
sentence is there. A control labelled "Invite" that explains nothing will be read
as having sent something.

## `provisionInvite` becomes a test fixture, not a deletion with a crater

`provisionInvite` is the opening line of twelve suites — "an account that exists,
entitled, with a site". Deleting it outright means rewriting a hundred call sites
into three calls each, which buys noise. So the composite moves to
`tests/support/invite-account.ts` as `inviteAccount`, written as the two shipped
calls in order, so a change to either is felt there rather than routed around.
The composite shape leaves production code, which is the whole point of deleting
it; what survives is a fixture, where a fixture belongs.

The three [[REQ-167]] cases that asserted the *composite's* own semantics are
retargeted rather than left pointing at a fixture:

- the rows an account needs now come from `invitePerson` + `provisionBusiness`
  called explicitly, which is the decomposition this ticket describes;
- casefolding-at-the-door stays [[REQ-167]]'s, asserted through `admit`;
  casefolding-at-the-invite becomes this ticket's;
- the unconfigured-`TENANT_ID` refusal moves onto `admit`, because the invite is
  scoped by its caller's business and needs no platform tenant of its own — the
  door is where that refusal now lives.

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
- **Styling.** [[REQ-170]] shipped this tab with no `builder-people__*` rules at
  all, leaning on the shared components' own defaults. The new controls do the
  same rather than opening a stylesheet nothing else on the tab uses.

## Acceptance

- a person invited from the Users tab appears in that tab as **Member**
- the same invite from two different businesses differs only in `users.tenant_id`,
  and the schema carries no level to branch on
- inviting an address that is already a contact of that business updates one row
  and does not insert a second
- a re-invite does not restamp `invited_at` and does not rename anyone
- an owner may invite into their own business; a non-owner is refused 403, as is
  the dev-open loopback path; an empty address is 400
- `GET /api/people` reports `canInvite` and `canFulfil` separately
- the invite writes no `entitlements` row and no `memberships` row
- the tab's invite control is with the list controls, is absent for someone who
  does not own the business, and says no message is sent
- the tab's detail pane renders, and the fulfilment control in it is reachable
- the [[DOC-42]] §1 sequence runs: invite Alice, provision her a business, Alice
  signs in and reaches only her own business and her own portal
- `provisionInvite` no longer exists