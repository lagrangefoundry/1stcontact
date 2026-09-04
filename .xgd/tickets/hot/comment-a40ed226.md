---
uid: comment-a40ed226
id: COMMENT-2261
type: comment
title: Comment on request REQ-170
created_by: xgd
created_at: '2026-09-04T01:52:48.555922+00:00'
updated_at: '2026-09-04T01:56:29.709313+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-420e1a6e
  kind: chat_transcript
---

<!-- xgd-turn id="10e6ef8a-1677-4d86-84a6-bc3da93816fd-user" -->

<!-- xgd-chat role="user" ts="2026-09-04T01:52:32.280050+00:00" -->
#### You
please read the discussion in REQ-180 about the user portal.

This admin page has the same goals - there are two things here:
1) a site-owner portal for seeing their users
2) the portal needs to have the ability to be extended - the extension will be functionality specific to the 1stcontact site owner, specifically tools for mananging the 1c application.

Lets talk about if this is really one page or two?

<!-- xgd-turn id="10e6ef8a-1677-4d86-84a6-bc3da93816fd-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-04T01:56:29.556745+00:00" -->
#### Claude
Read REQ-180 (and REQ-183, which it split out), plus the current REQ-170 body. Here's where I land.

## First: "portal" is already taken, and by the other direction

REQ-183 claimed the word for an **account looking at itself** — my plan, my details, my delete button. What you're describing is the opposite arrow: an **owner looking at their people**. Both are "portals" in speech, and DOC-40 §2.1's table already asserts both diagonals of a 2×2:

|  | owner-facing (*my people*) | customer-facing (*my relationship with you*) |
|---|---|---|
| a customer's business | their contact list — deferred | the portal they give their customers — deferred |
| the platform business | **REQ-170** | **REQ-183** |

So REQ-170 and REQ-183 are different cells and stay separate tickets. REQ-183 §6 already draws that line ("the portal reads and never grants"; "the portal has no list of accounts") and it holds — an owner acting on their own people is other-regarding by construction, which is exactly why the no-granting rule doesn't reach it.

## Within REQ-170's cell: one page, not two

Your (1) and (2) are one surface with one seam. And the argument is §2.1 rule 1: an `/admin` route whose left list is "all accounts" is the same shape as the bespoke admin billing page REQ-180 refused. §2.1's table row 2 already commits us — *"our pipeline **is** the platform tenant's CRM"*.

But be precise about what's shared, because there's a weak version of this claim and a strong one:

- **Weak:** both pages mount `webui/list-detail` and `mountFields`. True, unremarkable, not an architecture.
- **Strong, and the one worth holding:** **the people list is tenant-parameterised from day one.** `users WHERE tenant_id = <current business>`, off the scoped handle, never `TENANT_ID`, never a platform special case. That's cheap now and expensive to retrofit, and it's the whole of the property §2.1 asks for.

Hang the decision on the query, not the layout.

## The seam is a parameter, not a framework

Both components already take everything needed — `list-detail` takes rows and columns, `mountFields` takes descriptors and a save callback. So the extension is three things:

- extra field descriptors (memberships → businesses → grants)
- extra actions (invite, grant, revoke, add-business)
- a gate

No plugin registry, no manifest, no extension-point object. If a manifest appears we've built a framework for one extension, which is its own failure mode.

## The tenancy barrier falls exactly on your seam — which is why the seam is real

The page **reads** inside one tenant. Every operator action that matters **escapes** it: `provisionInvite` writes a `users` row *and* a `tenants` row; a grant is written against a business that isn't this one.

So: reads stay scoped, always, for everyone. The extension's actions call the already-unscoped provisioning functions — REQ-178's `provisionBusiness`, and `POST /api/admin/businesses`, which REQ-180 already landed gated at `router.ts:964` with no UI. REQ-170 is the console that calls it rather than reimplements it.

And the navigation that makes this work without any cross-tenant read: the operator reaches a customer's grant **through the account that owns it** — account (a platform-tenant row) → memberships → business → grants. That's REQ-170's revision note ("entitlements are edited against a business, not against a person") made reachable without the page ever leaving its tenant. Seeing *inside* another business is DOC-40 §7's parked switcher and stays parked.

## Three things this changes in REQ-170 as written

1. **`/admin` is the wrong route and the wrong name.** It names the extension rather than the surface, and that naming is precisely what would ossify the platform-only reading. It should be an ordinary section showing the current business's people; the 1c toolkit appears when the current business is the platform one and the caller is `platform_admin`.

2. **"Gate before any admin asset is served" largely dissolves.** If the surface is generic, gating its assets is meaningless — everyone gets them. The gate that matters is at the API, where REQ-180 already put it. Keep asset gating only for genuinely admin-only markup, if any survives, and not as the primary control.

3. **The left list stops being *accounts* and becomes *people in this business*.** Still accounts for the platform business — ours happen to be accounts — but written as the specialisation, not the definition.

## The counterargument, honestly

A customer's contact and our account share email, created, name, and almost nothing else. If most of each page is extension, "one page" really means "both mount list-detail," and dressing that up as shared architecture is overselling. That's fair — which is why I'd rest the claim on the tenant-parameterised query and not on the layout. The query is genuinely one thing and genuinely expensive to retrofit.

## Two things I'd want you to decide

**A. Do customer businesses get the (empty) people surface today, or only the platform business?** Nothing captures contacts yet, so a customer's list is empty. Building it parameterised but only routing to it for the platform business gets the property without shipping a feature nobody can use — but it risks the generality being theoretical, never exercised, and quietly false by the time someone needs it. Routing it for everyone forces the generality to be real at the cost of an empty tab. I lean slightly to the first, with a UAT that mounts it against a second business so the parameterisation is exercised even where it isn't routed.

**B. What is it called?** "Portal" is spoken for. DOC-40 §2.1's own word is CRM. *People* reads right for a customer and slightly odd for us; *Accounts* reads right for us and wrong for them. I'd take the customer's word — the point of the whole exercise is that ours is the special case.

I'd keep it as one ticket, incidentally: the seam is a parameter, and splitting would put the surface in one ticket and its only current reason to exist in another.

Say which way you want A and B and I'll write the outcome into REQ-170.

<!-- xgd-chat-end -->