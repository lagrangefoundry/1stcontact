---
uid: story-a55c2f35
id: STORY-164
type: story
title: Contacts tab — editing a contact's grants and record
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T19:31:42.865017+00:00'
updated_at: '2026-11-01T20:02:30.975199+00:00'
completed_at: null
last_field_updated: status
status: completed
fields:
  intent_uid: bundle-39edf66d
  capability_uid: capability-e5939ceb
  story_kind: feature
  story_points: 3
---

## Story
**As an** owner of a business, **I want** to correct who one of my contacts is, open and withdraw the grants they hold, and (for 1st Contact) provision them a business from their detail, **so that** the record of my business's people stays accurate and the history of what access was given is kept.

## Description
This is the write side of the Contacts tab (plan item 3, story-0034d937, is the read side). It covers:

- **Who they are.** In a contact's detail, only **Email** and **Name** can be edited. Everything the system recorded is locked: Pipeline (stage), Access, May sign in, Invited at, First seen, Last seen, Terms accepted, Created. The authoritative write is an owner-gated patch of email and/or display name for one person in the business the caller is scoped to.
- **Grants.** An operator opens a dated grant. It must name the business it is about, its source is always `admin_grant`, and the subject account is optional. An operator can also withdraw a grant from the detail's business table. Withdrawing marks the grant `revoked` and stamps when; the row stays, so the history of what was given is kept. The access check is unchanged, because revoked grants are already excluded.
- **Login status.** The server keeps its capability to suspend or restore a person's login. With BUG-54's locked `status`, no UI control binds to it.
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
- **CODE-ISSUE: grant routes are not owner-gated** (flagged at reconciliation, 2026-11-01). REQ-170's 2026-09-04 revision says *"The gate that matters is at the API"*. REQ-180 (router comment on the admin businesses path) says a customer-reachable route that "mints a live `pro` grant to whoever asks" is exactly what must not exist. As landed, `POST /api/grants`, `POST /api/grants/revoke` and `POST /api/people/status` apply no ownership check (the record and invite routes do): any admitted caller can open or revoke any grant by id, or suspend a person in their scoped business. The AC follows intent: a caller who does not own the business they are scoped to is refused 403, and no grant row or person status changes. Formalized as AC-2200. For fix_uat_coverage's code-issue lever.
- **CODE-ISSUE: a refused grant is a 500** (flagged at reconciliation, 2026-11-01). REQ-170 says *"a grant that names no business is refused"*, and the surrounding convention maps operator errors to 400 with a sentence (invalid invite and invalid person record both do). The grant refusal error is never mapped, so a grant naming no business (or no plan), and a revoke of an unknown id, reach the generic 500. AC-2198 and AC-2199 pin 400 with the message. For fix_uat_coverage's code-issue lever.

## Dependencies
- Plan item 3: story-0034d937 (Contacts tab — the people of a business)

## Story Points
3