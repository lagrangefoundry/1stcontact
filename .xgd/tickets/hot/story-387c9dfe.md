---
uid: story-387c9dfe
id: STORY-162
type: story
title: 'Business Fulfilment: Only The Operator Adds A Business, And A Business Arrives
  Whole'
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T11:56:27.726698+00:00'
updated_at: '2026-11-01T21:36:01.578771+00:00'
completed_at: null
last_field_updated: body
status: updated
fields:
  intent_uid: bundle-94dbe947
  capability_uid: capability-e5939ceb
  story_kind: upgrade
  story_points: 2
  updated_by:
  - bundle-39edf66d
---

## Story
**As** the 1st Contact operator, meaning an owner of the 1st Contact business, **I want** to add a business to an existing customer account from my own signed-in session, with that business arriving complete and immediately operable, **so that** I can fulfil a customer's order for another business while no customer can mint themselves a free live plan before billing exists.

## Description
Adding a business is 1st Contact filling an order: our own product-fulfilment action, not a self-serve control. REQ-180 §2 originally placed "add a business" on the account surface. D2 reversed that. We are pre-billing and pre-proper access control, and adding a business writes a live `pro` grant, so any customer-reachable path to it is an unbounded free-plan mint (DOC-40 §9 item 4). **The operator adds businesses.**

**The fulfilment privilege is two conditions, not a flag (DOC-42 §7, REQ-185):** *you are an owner of this business* and *this business's product is businesses*. Today the second condition picks out the 1st Contact business, so holding the privilege means holding an `owner` membership on the 1st Contact business. Ownership is expressed the same way for every business. Owning the 1st Contact business is an `owner` membership exactly like a customer owning theirs, and a caller cannot tell the two apart. The separate hosting capability (`platform_operator`, entering a business without a membership) confers no ownership and does not open this gate.

In scope:
- An operator-only add-a-business action that names an existing account by email and a business name, and creates the business through the same single provisioning operation (`provisionBusiness`) every business is created by.
- A business and its tenant come into existence as one operation: the business record, the account owner's `owner` membership, a live grant recording which operator granted it, and a starter site. It is all or nothing, verified through admission (what the product reads), not by reading tables back.
- An account's first business is provisioned through that same operation, as a separate step after the invite (REQ-186): the invite writes the person and no business, so an invited account with no business yet is refused `no_membership` at the door, and once its first business is provisioned it is admitted with exactly that one. First and added businesses are indistinguishable afterwards.
- Everyone who is not an owner of the 1st Contact business is answered as if the surface does not exist. That includes ordinary admitted customers, a `platform_operator` with no owner membership there, and the unauthenticated loopback dev door.
- Ownership asked uniformly. "Is this person an owner here" and "may this person enter a business they are not a member of" are answered by different facts, and no single check answers both.
- Guards that keep the gate from becoming a generic administrator mechanism (A1), keep "the platform's own tenant" out of the model (A3), and keep the hosting column to its single reader.

Out of scope:
- Any self-serve "add a business" button, route, or creation contract in the chrome.
- The admin console (REQ-170), which will call this contract rather than reimplement it.
- The hosting bypass itself and the `PLATFORM_ADMINS` break-glass seed (Business Scope story, STORY-160).
- The customer portal (REQ-183).

## Technical Context
- Intent: REQ-180 D2, D3, amendments A1 and A3 (commits 7b17517, dfb55c6; 89fae47 is a version bump). REQ-185 (bundle-39edf66d, commit 2103d2e), "`platform_admin` is two capabilities wearing one flag". Model: DOC-40 §2.1 rule 1, §6, §9; DOC-42 §2, §7, §8, §10.3.
- Entry point: `POST /api/admin/businesses` in `apps/control-app/src/router.ts`. Admission is resolved in `index.ts` ahead of routing. The route consults only the admission, not the resolved scope. On success it delegates to REQ-178's `provisionBusiness` and nothing else. There is no one-call invite-plus-business function: REQ-186 deleted `provisionInvite`. The invite (`invitePerson`, `people.ts`) writes only the person, and an account's first business comes from `provisionBusiness` like every other. Test suites seed an account through the `tests/support/invite-account.ts` fixture, which is those two shipped calls in order.
- **The gate is product fulfilment, not administration (A1), and since REQ-185 it is spelled as its two conditions.** The route calls `ownsPlatformBusiness(env, admission)` (`identity.ts`). That is `ownsBusiness(admission, <platform business>)`, which checks the admission's businesses for `role === 'owner'` and touches no table. It does not read `platform_operator`. Both predicates live in `identity.ts` because "which business's product is businesses" is `TENANT_ID`, and REQ-168 left that variable two readers. `GET /api/people` reports `canFulfil` from the same predicate as a chrome convenience. It is not the gate.
- **`platform_operator` has exactly one reader:** scope entry without a membership (`scope.ts`, Business Scope story STORY-160). The column's declaration, SQL writing it, and comments are not reads. The column was `platform_admin` with two readers (scope entry and this gate) until `db/migrations/0007_platform_operator.sql` renamed it. No `isAdmin`/`requireAdmin`-shaped predicate exists anywhere.
- **No platform-tenant concept (A3).** Outside REQ-168's two `TENANT_ID` readers (`identity.ts`, `scope.ts`), nothing names or tests "the platform's own tenant". There is no `platformTenant`/`PLATFORM_ACCOUNT`-style name, no `isPlatform`-style predicate, and no comparison of a business id against the deployment's slug. This extends the D5 vocabulary guard (word rule owned by plan item 7) to the concept.
- Relation to sibling capabilities: admission and lapse derivation belong to the Accounts, Membership & Entitlement admission story (plan item 4). Scope entry and the break-glass seed belong to STORY-160 (plan item 5).
- FC evidence: `tests/test_UAT_FC_REQ-180_admin_adds_a_business.workers.test.ts`, `tests/test_UAT_FC_REQ-180_fulfilment_gate.test.ts`, `tests/test_UAT_FC_REQ-180_business_vocabulary.test.ts` (concept-rule cases only), `tests/test_UAT_FC_REQ-185_platform_operator.workers.test.ts` (separation and indistinguishability cases).
- UAT setup: `tests/test_reconciliation_business_fulfilment.workers.test.ts` seeds the operator through `ensurePlatformOperator` (the path `PLATFORM_ADMINS` takes) and accounts through the `inviteAccount` fixture.

## Reconciliation Decisions
- **Refusal is 404 "Not found.", not the 403 every other refusal uses** (decided at reconciliation, 2026-11-01): D2's body says the route is "refused with the same single message every other refusal uses". The landed code answers 404 because a 403 answers "does an administrative surface exist" with *yes*. This was reported to the operator in the REQ-180 chat at landing, and amendment A1 then states "`POST /api/admin/businesses` is right and stays exactly as it is" and "no endpoint changes shape". The later amendment ratifies the 404, so it is formalized as intent, not flagged as a contradiction.
- **The loopback dev-open door is refused** (decided at reconciliation, 2026-11-01): intent is silent on dev-open. The code refuses it because there is no admission, so nobody owns anything. A loopback door onto account provisioning would come to be relied on. Formalized as its own AC.
- **An unknown account is reported plainly** (decided at reconciliation, 2026-11-01): intent says the route "names an existing account by email" but does not say what happens when there is none. The code answers 404 with `No account with that email address.` because the oracle argument that silences other refusals does not apply to someone who already holds the privilege. Formalized as an AC.
- **Missing account email or name is a 400** (decided at reconciliation, 2026-11-01): intent is silent. The code rejects blank or missing `accountEmail`/`name` with 400 before any write, so the operator can tell an omitted field from a broken builder. Formalized as an AC.
- **The grant records who added the business** (decided at reconciliation, 2026-11-01): intent is silent on audit. The code writes the operator's email as the grant's `granted_by`, in line with DOC-5 policy 26 (maintain audit events). It is formalized inside the one-operation AC.
- **The chrome exposes no creation contract** (decided at reconciliation, 2026-11-01): D2 says there is "no button, no customer-reachable route". The businesses payload the browser reads carries exactly `account` and `businesses`. This is formalized as the positive observable of that absence.
- **"Fulfilment privilege" now means owner of the 1st Contact business** (decided at reconciliation, 2026-11-01): REQ-185 replaces the flag with DOC-42 §7's two conditions. Existing ACs that say "holding the fulfilment privilege" keep that wording, and it is defined in the Description as an `owner` membership on the business whose product is businesses. The ACs are not reworded one by one.

## Dependencies
- Plan item 4 (Admission after DOC-42: membership admits, lapse reasons). Success is verified through admission's selectable/lapse view.
- Plan item 5 / STORY-160 (Business Scope), which owns `platform_operator`, the only reader of the hosting column, and the `PLATFORM_ADMINS` seed that writes the owner membership this gate reads.

## Story Points
2