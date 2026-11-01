---
uid: story-387c9dfe
id: STORY-162
type: story
title: 'Business Fulfilment: Only The Operator Adds A Business, And A Business Arrives
  Whole'
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T11:56:27.726698+00:00'
updated_at: '2026-11-01T12:03:11.505973+00:00'
completed_at: null
last_field_updated: status
status: completed
fields:
  intent_uid: bundle-94dbe947
  capability_uid: capability-e5939ceb
  story_kind: feature
  story_points: 2
---

## Story
**As** the 1st Contact operator, **I want** to add a business to an existing customer account from my own signed-in session, with that business arriving complete and immediately operable, **so that** I can fulfil a customer's order for another business while no customer can mint themselves a free live plan before billing exists.

## Description
Adding a business is 1st Contact filling an order — our own product-fulfilment action — not a self-serve control. REQ-180 §2 originally placed "add a business" on the account surface; D2 reversed that: we are pre-billing and pre-proper access control, and adding a business writes a live `pro` grant, so any customer-reachable path to it is an unbounded free-plan mint (DOC-40 §9 item 4). **The operator adds businesses.**

In scope:
- An operator-only add-a-business action that names an existing account by email and a business name, and creates the business through the same single provisioning operation account creation uses.
- A business and its tenant come into existence as one operation: the business record, the account owner's `owner` membership, a live grant recording which operator granted it, and a starter site — all or nothing, verified through admission (what the product reads), not by reading tables back.
- Creating an account already provisions its first business through that same operation, so invited and added businesses are indistinguishable afterwards and the operator never does it twice.
- Everyone without the fulfilment privilege — ordinary admitted customers, and the unauthenticated loopback dev door — is answered as if the surface does not exist.
- Guards that keep the gate from becoming a generic administrator mechanism (A1) and keep "the platform's own tenant" out of the model (A3).

Out of scope:
- Any self-serve "add a business" button, route, or creation contract in the chrome.
- The admin console (REQ-170), which will call this contract rather than reimplement it.
- Splitting the `platform_admin` column into its two capabilities (REQ-185 / DOC-42 §10.3).
- The customer portal (REQ-183).

## Technical Context
- Intent: REQ-180 D2, D3, amendments A1 and A3 (commits 7b17517, dfb55c6; 89fae47 is a version bump). Model: DOC-40 §2.1 rule 1, §6, §9; DOC-42 §2, §7, §8, §10.3.
- Entry point: `POST /api/admin/businesses` in `apps/control-app/src/router.ts`. Admission is resolved in `index.ts` ahead of routing; the route consults only the admission (the flag is ambient by design, DOC-40 §6), not the resolved scope. On success it delegates to REQ-178's `provisionBusiness` and nothing else; the invite path (`provisionInvite`) goes through the same function.
- **The gate is product fulfilment, not administration (A1).** Its stated reason is DOC-42 §7's two conditions: *you are an owner of this business* and *this business's product is businesses*. Today those select exactly the set `platform_admin` selects, so the flag is how they are spelled. `platform_admin` has exactly two readers: scope entry without a membership (`scope.ts`, delegated to the Business Scope story, STORY-160 — special because 1st Contact *hosts* the others, DOC-42 §8) and this fulfilment gate (`router.ts`). The column's declaration, SQL writing it, and comments are not reads. No `isAdmin`/`requireAdmin`-shaped predicate exists anywhere.
- **No platform-tenant concept (A3).** Outside REQ-168's two `TENANT_ID` readers (`identity.ts`, `scope.ts`), nothing names or tests "the platform's own tenant" — no `platformTenant`/`PLATFORM_ACCOUNT`-style name, no `isPlatform`-style predicate, and no comparison of a business id against the deployment's slug. This extends the D5 vocabulary guard (word rule owned by plan item 7) to the concept.
- Relation to sibling capabilities: admission and lapse derivation belong to the Accounts, Membership & Entitlement admission story (plan item 4); scope entry belongs to STORY-160 (plan item 5).
- FC evidence: `tests/test_UAT_FC_REQ-180_admin_adds_a_business.workers.test.ts`, `tests/test_UAT_FC_REQ-180_fulfilment_gate.test.ts`, `tests/test_UAT_FC_REQ-180_business_vocabulary.test.ts` (concept-rule cases only).

## Reconciliation Decisions
- **Refusal is 404 "Not found.", not the 403 every other refusal uses** (decided at reconciliation, 2026-11-01): D2's body says the route is "refused with the same single message every other refusal uses". The landed code answers 404 because a 403 answers "does an administrative surface exist" with *yes*. This was reported to the operator in the REQ-180 chat at landing, and amendment A1 then states "`POST /api/admin/businesses` is right and stays exactly as it is" and "no endpoint changes shape". The later amendment ratifies the 404, so it is formalized as intent, not flagged as a contradiction.
- **The loopback dev-open door is refused** (decided at reconciliation, 2026-11-01): intent is silent on dev-open. The code refuses it because there is no admission, so there is nobody holding the privilege. A loopback door onto account provisioning would come to be relied on. Formalized as its own AC.
- **An unknown account is reported plainly** (decided at reconciliation, 2026-11-01): intent says the route "names an existing account by email" but does not say what happens when there is none. The code answers 404 with `No account with that email address.` because the oracle argument that silences other refusals does not apply to someone who already holds the privilege. Formalized as an AC.
- **Missing account email or name is a 400** (decided at reconciliation, 2026-11-01): intent is silent. The code rejects blank or missing `accountEmail`/`name` with 400 before any write, so the operator can tell an omitted field from a broken builder. Formalized as an AC.
- **The grant records who added the business** (decided at reconciliation, 2026-11-01): intent is silent on audit. The code writes the operator's email as the grant's `granted_by`, in line with DOC-5 policy 26 (maintain audit events). It is formalized inside the one-operation AC.
- **The chrome exposes no creation contract** (decided at reconciliation, 2026-11-01): D2 says there is "no button, no customer-reachable route". The businesses payload the browser reads carries exactly `account` and `businesses`. This is formalized as the positive observable of that absence.

## Dependencies
- Plan item 4 (Admission after DOC-42: membership admits, lapse reasons). Success is verified through admission's selectable/lapse view.
- Plan item 5 / STORY-160 (Business Scope), the other reader of `platform_admin`.

## Story Points
2