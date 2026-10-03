---
uid: request-2dabea8f
id: REQ-367
type: request
title: 'Platform console: open any business, with an operator banner'
created_by: EPIC-23
created_at: '2026-10-03T18:32:31.746993+00:00'
updated_at: '2026-10-03T18:32:31.746993+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  epic_parent: epic-ee37a03f
  priority: medium
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-912e3194
---

Child of [[EPIC-23]]. The epic holds the cross-feature context and the decisions log.

# Impersonation → "open any business" from the console (platform operator only)

### Decision (2026-10-03): v1 is a console Open control, not full impersonation

The operator can already **enter** any business. `scope.ts:415` lets a
`platform_operator` resolve a scope for any business that has a grant and is
active, with no membership. What is missing is **navigation**:

- The business selector lists only `admission.businesses`, which comes from
  membership rows.
- The console lists every site and its business, but has no way to open the
  app in one.
- So there is no route by which the operator actually reaches someone else's
  business.

**What the operator gets:**

- **An Open control on every business in the platform console.** It is a link
  or button on each row of the console list (`builder/platform-sites.js`).
- Pressing it opens the builder app scoped to that business (`/b/<id>`). This
  is the same view the selector gives for an owned business.
- **Getting back is the existing selector.** It still lists the operator's own
  businesses, so switching back is one choice. The console stays reachable
  throughout, because the console gate reads the operator's own admission and
  that admission has not changed.
- **A visible reminder.** While the open business is one the operator holds no
  membership on, every page shows a banner: "You are in <business> as platform
  operator". It also offers a way back to their own business.
- **The selector shows the entered business.** That business is not in the
  operator's membership list. The selector shows it as the current entry,
  marked as entered rather than owned, until the operator switches away.

**What this deliberately is not:**

- It does not act as a **user**. The operator sees the **business** as it is,
  not a particular person's selector, profile portal or account pages.
- Entering through the bypass returns `role: null` (`scope.ts:412`). So
  **owner-gated controls stay closed in v1** while the operator is inside, for
  example adding or inviting contacts. These are the `ownsBusiness` checks at
  `router.ts:4015-4764`.
- **Target, after v1 (decided 2026-10-03): the platform operator can do
  everything in any business.** That includes every owner-gated control. v1
  ships navigation only. Opening the owner gates to the operator is a
  follow-up, and it must go through the hosting capability
  (`platform_operator`), not through a fake `owner` membership.
- **Audit.** Each entry to a business without a membership leaves an audit
  event: who entered it and when.

### Deferred: full user impersonation

Acting as a specific **user** is parked until the console Open control proves
insufficient. That means seeing their selector, their profile portal and their
account pages. If it comes back, these are the findings for it:

- Identity resolves cookie → session subject → primary email → `admit()`
  (`index.ts:463-518`). That chain is the seam where a subject would be
  substituted.
- `sessions` is a pinned copy of the `auth-passwordless` schema
  (`test_UAT_FC_REQ-202_passwordless_schema`). Impersonation state would need
  its own table, keyed by `origin_id`.
- The console gate and the impersonation controls must read the **actor**, not
  the subject. Otherwise impersonating locks the operator out of the console.


## Test plan

UATs `test_UAT_FC_<TICKET-ID>_*`, one per rule above: the happy path, plus each refusal the body names.