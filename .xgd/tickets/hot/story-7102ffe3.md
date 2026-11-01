---
uid: story-7102ffe3
id: STORY-160
type: story
title: 'Business Scope: Every Request Operates Exactly One Business, Chosen By Who
  The Caller Is'
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T10:24:38.913681+00:00'
updated_at: '2026-11-01T10:36:57.370885+00:00'
completed_at: null
last_field_updated: status
status: completed
fields:
  intent_uid: bundle-94dbe947
  capability_uid: capability-e5939ceb
  story_kind: feature
  story_points: 3
---

## Story
**As an** operator who holds one or more businesses, **I want** every builder request to operate on exactly one business that I'm entitled to, and to name which one, **so that** I never see, edit, or chat against another business's sites, transcripts, or material, even when I switch between my own businesses or share a server with other customers.

## Description
Before this change, the business a request operated on came from a deployment variable, so every logged-in person was served the same tenant. With this capability, the business comes from the caller's verified identity and admission list:

- A request may name its target business with a `/b/<businessId>/…` path prefix. The prefix is stripped before routing, so every existing route works under it unchanged. Relative sub-resources such as preview images inherit it automatically.
- A named target is honoured only if the caller holds a live, entitled membership on it. Otherwise it is refused. It is never swapped for some other business the caller can reach.
- A request with no target goes to the caller's first admissible business, meaning the first one that is selectable. It never goes to the platform's own business by default.
- A `platform_admin` may enter any existing business without a membership. The bypass covers membership only: lapsed entitlement and deactivation still refuse.
- Loopback dev-open (no Access configured) has no identity to resolve from. It operates the configured platform business and ignores any target.
- An admitted account with nothing selectable, such as one whose grants have all lapsed, still gets the builder chrome and the businesses listing. Any route that needs a business gives a distinct 403 that points at the switcher.
- Per-business isolation reaches every business-held store: sites, the ticket store (chat transcripts, uploaded material, project corpus), project-KB indexes, and the cached chat host.
- The live operator keeps access to the existing `1stcontact` business through an idempotent migration.

**In scope:** target resolution and refusal, the no-target fallback, admin bypass, dev-open scope, isolation across stores and chat hosts, the no-business refusal, and the operator migration.
**Out of scope:** the switcher UI that sends the prefix (REQ-179), the businesses listing endpoint's contents (REQ-180), admission/membership/grant semantics themselves (plan item 6, DOC-42 admission), seat invites into an existing business (REQ-170).

## Technical Context
- Intent: REQ-168 "The tenant comes from the identity, not from the configuration" (body plus chat COMMENT-2139, where the operator approved "path prefix + first-admissible"). The REQ-178 straggler is commit fa0b857, "membership admits, entitlement does not" (DOC-42 §10.1).
- Code evidence: `apps/control-app/src/scope.ts` (`resolveScope`, `splitBusinessPrefix`, `ScopeRefusedError`, `NoBusinessError`, `UnscopedError`); `index.ts` (fetch handler: `refused()` / `noBusiness()` responses); `router.ts` (`requireScope()`, per-scope chat host map); store openers in `store.ts`, `tickets.ts`, `knowledge.ts`, `ai.ts`; migration `0005_operator_membership.sql`.
- FC evidence: `tests/test_UAT_FC_REQ-168_scope.workers.test.ts`, `tests/test_UAT_FC_REQ-168_single_reader.test.ts`, `tests/test_UAT_FC_REQ-178_lapsed_session.workers.test.ts`.
- Depends on admission (CAP-114: who is admitted, which businesses are selectable and why) and on the access gate (CAP-103). This story owns only the step that turns an admission into one business.
- Architecture policy #26 (attach account/site IDs to all customer records) and #21 (authentication separated from authorisation): the target in the URL is not a credential. Access authenticates, and resolution authorises the target on every request.
- A refused target returns the same uniform denied message as an admission refusal. The specific reason (`unknown_business` / `not_a_member` / `no_entitlement`) goes only to the invocation log, so the response can't be used as an existence oracle over businesses.

## Reconciliation Decisions
- **Target ignored on dev-open** (decided at reconciliation, 2026-11-01): REQ-168's "What the implementation added" section states this explicitly. The code resolves to the configured platform business whatever the request names. Formalized as the dev-open AC.
- **Empty scope refused by openers under a non-configuration error** (decided at reconciliation, 2026-11-01): intent's implementation addendum names this behaviour. It supersedes REQ-162's `TenantNotConfiguredError` assertion for an unscoped ticket store. Formalized as the empty-scope AC.
- **Failed chat-host build is evicted** (decided at reconciliation, 2026-11-01): the implementation addendum states it. Formalized within the chat-host isolation AC, so that a transient failure doesn't poison a business for the isolate's lifetime.
- **Nothing selectable → null scope → 403 "No business on this account can be opened…", logged `no_entitlement`** (decided at reconciliation, 2026-11-01): REQ-168 assumed an `ok` admission always had a selectable business. The REQ-178 straggler (fa0b857, DOC-42 §10.1) removed that guarantee. The commit message states the intended behaviour: the chrome and `/api/businesses` keep answering, business-scoped routes give a 403 (not a 503) with their own message, and the event is logged as `no_entitlement`. Formalized as two ACs, since the chrome/listing staying available and the business-scoped refusal are separately observable.
- **Resume after membership expiry** (decided at reconciliation, 2026-11-01): REQ-168 says "A UAT opens a session, expires the membership, and asserts the resume is refused rather than answered from the warm host". No such UAT exists in the FC evidence. Formalized as an AC so that regression adds the evidence. The code path is admission on every request plus the per-scope chat host.

## Dependencies
Plan item 4 (prior story in this reconciliation).

## Story Points
3