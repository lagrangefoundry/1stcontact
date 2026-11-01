---
uid: story-a55c2f35
id: STORY-164
type: story
title: Contacts tab — editing a contact's grants and record
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T19:31:42.865017+00:00'
updated_at: '2026-11-01T22:21:07.188166+00:00'
completed_at: null
last_field_updated: body
status: completed
fields:
  intent_uid: bundle-39edf66d
  capability_uid: capability-e5939ceb
  story_kind: feature
  story_points: 3
---


## Story
**As an** owner of a business, **I want** to correct who one of my contacts is, and (as the 1st Contact operator) open and withdraw the grants they hold and provision them a business from their detail, **so that** the record of my business's people stays accurate, the history of what access was given is kept, and no customer can grant themselves access.

## Description
This is the write side of the Contacts tab (plan item 3, story-0034d937, is the read side). It covers:

- **Who they are.** In a contact's detail, only **Email** and **Name** can be edited. Everything the system recorded is locked: Pipeline (stage), Access, May sign in, Invited at, First seen, Last seen, Terms accepted, Created. The authoritative write is an owner-gated patch of email and/or display name for one person in the business the caller is scoped to.
- **Grants.** Grants are **the 1st Contact operator's tool** (REQ-183 §6: "REQ-170 is the operator's tool: every account, every grant"). `POST /api/grants` and `POST /api/grants/revoke` are gated on the fulfilment-operator condition (`ownsPlatformBusiness`). Every other caller is refused 403 and nothing is written, including the scoped business's own owner (AC-2200). The operator opens a dated grant. It must name the business it is about, its source is always `admin_grant`, and the subject account is optional. The operator can also withdraw a grant from the detail's business table. The Withdraw control is rendered only when `canFulfil` is true. Withdrawing marks the grant `revoked` and stamps when; the row stays, so the history of what was given is kept. The access check is unchanged, because revoked grants are already excluded. **Both acts are confined to the scope** (AC-2233): the business named, or the business of the grant withdrawn, must be one that someone in the scoped business holds a membership on. Otherwise the request is refused 400 and nothing is written ("No such business among these contacts." / "No such grant."). A grant refusal is a 400 carrying its sentence, never a 500 (AC-2198, AC-2199).
- **Login status.** The server keeps its capability to suspend or restore a person's login. `POST /api/people/status` is gated on owning the scoped business (`ownsBusiness`), and a non-owner is refused 403 (AC-2200). With BUG-54's locked `status`, no UI control binds to it.
- **Provision a business.** For a holder of the fulfilment condition (owns this business AND this business's product is businesses), the detail shows a "Provision a business" control under "Add a business". It opens a dialog that asks for a business name and submits the contact's own address, so the operator never retypes it.

**Out of scope:** reading and listing people (story-0034d937), the invite (REQ-186 invite story), contact axes (REQ-188), removing a business, and support-access grants.

## Technical Context
- Intent: REQ-170 (body, the 2026-09-04 revision, and "What was implemented"), BUG-54 (whole ticket incl. "As landed"), REQ-186 ("The fulfilment control was dead code"). Migration `0008_entitlement_revocation` adds the nullable `entitlements.revoked_at`.
- The record route is gated on DOC-42 §7's first condition, *you own this business*, and NOT on the platform-business condition. Every business owner can correct their own people. The refusal is 403, not the fulfilment route's hiding 404.
- Not-found and not-yours give the same 404. This is the non-oracle rule the person-detail read already keeps.
- There is one definition of an email shape, shared by the panel (inline refusal) and the server (authoritative refusal). Rule: exactly one `@`, a non-empty local part, a domain of at least two non-empty dot-separated labels, and no whitespace.
- Identity is `(tenant_id, email)`. So a duplicate is checked within a business only, and addresses are casefolded so admission can still find the person.
- The fulfilment route re-checks its own gate. Not rendering the control is not the gate. The route belongs to story-387c9dfe (Business Fulfilment).
- Security policy: the write surface accepts only typed scalar fields. Observed columns (`status`, `pipeline_stage`, `invited_at`, `tos_accepted_at`, stamps) are ignored if sent.

## Reconciliation Decisions
- **Patch semantics on the record write** (decided at reconciliation, 2026-11-01): intent says the route "writes email and/or display_name". The landed code treats an absent key as "leave alone", turns an empty name into "no name", and refuses a body that changes nothing. Formalized because the panel commits one field at a time, and whole-record semantics would write stale values back. Formalized as AC-2193.
- **Observed fields ignored by the server** (decided at reconciliation, 2026-11-01): BUG-54 locks these fields in the UI. The "As landed" notes add the server half. Formalized in AC-2193, because locking the boxes alone is only a client-side guarantee.
- **The server keeps login suspension with no UI binding** (decided at reconciliation, 2026-11-01): BUG-54 explicitly keeps the status route and removes the panel binding. Formalized as a server AC (a suspended person is refused sign-in; restoring re-admits them). AC-2201 also asserts the panel offers no suspend control.
- **The panel shows the stored value after a save** (decided at reconciliation, 2026-11-01): intent is silent. The code puts the server-normalised row back into the pane (a typed `Sarah@…` is shown as `sarah@…`). Formalized in AC-2189.
- **Grant routes were ungated; now resolved** (flagged at reconciliation, 2026-11-01, then resolved in two steps). REQ-170's 2026-09-04 revision says *"The gate that matters is at the API"*. REQ-180 says a customer-reachable route that "mints a live `pro` grant to whoever asks" is exactly what must not exist.
  - *As first landed:* `POST /api/grants`, `POST /api/grants/revoke` and `POST /api/people/status` applied no ownership check.
  - *Code override report-4f1b02e8:* gated all three on `ownsBusiness(scope.businessId)`. The reconciliation review judged that wrong for the grant routes (override_misjudged report-fb9c667a). It let every customer owner mint a live `pro` grant onto their own business, and, because `body.businessId` and the revoked id were unscoped, onto any business. That contradicts REQ-183 §6 and REQ-180 D2.
  - *Now (BUNDLE-36 review fix, 2026-11-01):* the grant routes are gated on `ownsPlatformBusiness`, the operator's condition and the same one the add-a-business route uses. They also require the named business, or the revoked grant's business, to lie within the scope (`businessInScope` / `grantBusinessInScope` in `people.ts`). The panel's Withdraw control renders only on `canFulfil`.
  - *The status route keeps `ownsBusiness`.* Suspending a login is an owner act on the owner's own people, not a grant of access.
  - Formalized as AC-2200 (restated) and AC-2233 (new).
- **Grant refusals are 400, not 500; now resolved** (flagged at reconciliation, 2026-11-01). REQ-170 says *"a grant that names no business is refused"*, and the surrounding convention maps operator errors to 400 with a sentence (invalid invite and invalid person record both do). `InvalidGrantError` is now mapped to 400 carrying its sentence. That covers a grant naming no business, or no plan, and a revoke of an unknown or out-of-scope id. Pinned by AC-2198, AC-2199 and AC-2233.

## Dependencies
- Plan item 3: story-0034d937 (Contacts tab — the people of a business)

## Story Points
3