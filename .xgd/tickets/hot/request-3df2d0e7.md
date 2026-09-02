---
uid: request-3df2d0e7
id: REQ-180
type: request
title: 'The account surface: the businesses endpoint, the customer portal, and the
  Business vocabulary'
created_by: xgd
created_at: '2026-09-02T23:15:34.866461+00:00'
updated_at: '2026-09-02T23:16:55.211566+00:00'
completed_at: null
last_field_updated: body
status: draft
fields:
  priority: medium
  story_points: 5
  auto_merge_back: true
  needs_review: false
---

# The account surface: the businesses endpoint, the customer portal, and the Business vocabulary

## What this covers

Three things that all follow from [[DOC-40]] §2 splitting the account from the
business, and that share one decision. They are one ticket because getting the
middle one wrong makes the other two wasted work — see *Splitting* at the end.

1. The endpoint that tells the browser which businesses an account may operate.
2. The **account** surface itself — plan, invoices, details.
3. The user-facing vocabulary: **Business**.

## 1. The businesses endpoint

[[REQ-178]] makes `Admission` carry the set. This exposes it:

- `GET` returning, per business: opaque id, `tenants.name`, whether it is
  selectable, and — for a lapsed one — enough to say *why* without saying more
  than the operator is owed.
- Authorised by the same Access-verified identity every other route uses. It
  returns **only** businesses the caller holds a live membership for; a caller
  naming another account's business gets the same answer as one naming a
  business that does not exist.

It is the contract [[REQ-179]]'s switcher reads. Either ticket may land it, on
the [[REQ-170]]/[[REQ-161]] precedent for `webui-list-detail`.

## 2. The account surface is the customer portal

**This is the decision the ticket exists to force, and it should be made before
any of it is built.**

[[DOC-40]] §2.1: 1st Contact is built as a 1st Contact business. A customer of
ours is a `users` row in the platform tenant — already true in `identity.ts` —
with a billing relationship and a login. That is precisely what *their* customers
will be to *them*. So the surface showing an account its plan, its invoices and
its details is **the customer portal of the 1st Contact site**, and not a builder
page.

The consequence is the whole of [[DOC-40]] §2.1's leverage argument:

- Built as a portal, it is one feature serving both levels, and our customers get
  it when we do.
- Built as a builder page, it is the *named failure mode* of §2.1 rule 1 — the
  bespoke admin billing page — and the portal gets built a second time later, by
  someone who has to reverse-engineer what this one decided.

What follows from taking the portal reading:

- It renders through the site pipeline against the platform business, not as
  another `apps/control-app` builder route.
- It is reached from the avatar ([[REQ-179]]) — chrome that links out, rather
  than a tab that owns a surface.
- Its capabilities are portal capabilities from the start: *see my plan*, *see
  what I have been charged*, *change my details*. Anything that is only ever true
  of 1st Contact's own account belongs in the admin console ([[REQ-170]])
  instead, and the line between them is worth drawing once, here.
- **Adding a business** is an account-level action and lands here, on
  [[REQ-178]]'s `provisionBusiness`.

Deferred deliberately: the portal our customers give their customers is not built
by this ticket. What this ticket owes is that building it later requires no
second implementation of what it does build.

## 3. The vocabulary is Business

The tenant is a **Business** everywhere a person can read it: the switcher, the
account surface, the admin console, error copy, help text.

It is not a brand and not a workspace. *Brand* names why two are separate but
reads wrong next to what one actually holds — a brand does not have a calendar,
and "your brand's customers" is a phrase this product would have to say on every
screen. *Workspace* claims nothing, which is the wrong claim for software whose
pitch is that it runs your business.

**The schema keeps `tenant_id`.** This is a label decision, not a rename:
`tenant_id` appears in R2 keys and in every store handle, and renaming a column
to match a word buys a migration for nothing. The rule is that `tenant` is
internal vocabulary and never reaches a screen — [[DOC-40]] §2 states the pairing
and this ticket applies it.

## Acceptance

- The endpoint returns exactly the caller's live-membership businesses; a
  cross-account request is indistinguishable from a nonexistent one.
- Lapsed businesses appear, marked, with a reason.
- The account surface renders against the platform business through the site
  pipeline, and no billing or plan view exists as a builder-only route.
- Adding a business from the account surface goes through `provisionBusiness`.
- No user-visible string in the builder, the account surface or the admin console
  says "tenant"; `tenant_id` is untouched in the schema.

## Splitting

Item 2 is the large one and the only one carrying an open decision. If the
portal reading is confirmed, item 2 is worth its own ticket and this one keeps 1
and 3; if it is rejected, that rejection needs recording against [[DOC-40]] §2.1
because it costs the leverage argument that section is built on. Either way the
decision comes first — it is cheap now and expensive after the surface exists.
