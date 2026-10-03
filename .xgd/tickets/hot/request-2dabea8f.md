---
uid: request-2dabea8f
id: REQ-367
type: request
title: 'Platform console: open any business, with an operator banner'
created_by: EPIC-23
created_at: '2026-10-03T18:32:31.746993+00:00'
updated_at: '2026-10-03T19:22:02.532365+00:00'
completed_at: null
last_field_updated: status
status: free_coded
fields:
  epic_parent: epic-ee37a03f
  priority: medium
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-912e3194
  commits:
  - working_sha: 55151f5b31e954ce9d09f3cab1e935c6533c4d89
    reconcile_sha: null
    main_sha: null
  - working_sha: b85535f67246164b18a07910286c0a5fe97f0f15
    reconcile_sha: null
    main_sha: null
  version: 0.2.447
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

## What landed (v1, 2026-10-03)

- **Open control.** Every row of the platform console list has an `Open` link to
  `/b/<business>/` (the business id URL-encoded). It is a real anchor in the same
  tab, and clicking it does not also select the row.
- **The page URL names the business.** The builder reads `/b/<id>` from its own
  page URL at boot, scopes its first `/api/businesses` request to it, and opens on
  that business. A link that names one of the operator's own businesses also opens
  it, ahead of the remembered selection. `/api/businesses` is now sent under the
  current business prefix. Unscoped, it behaves exactly as before.
- **`/api/businesses` reports `entered: {id, name} | null`.** It is non-null exactly
  when the business in scope is not one of the caller's memberships, which is the
  hosting bypass. It sits beside `businesses` and never inside it: the switcher's
  list stays the operator's own memberships.
- **Switcher.** The entered business is listed first, as the current entry,
  labelled "<name> (entered as platform operator)". Switching to any other business
  removes it, so the switcher cannot re-enter it. Re-entering means using the
  console's Open control again, which is the audited act.
- **Banner.** Above the shell, so it shows on every tab: "You are in <name> as
  platform operator." It has a "Back to <own business>" button. That button goes to
  the operator's first selectable own business, the one a plain fresh mount would
  open. If the operator has no such business, the button is left out. Leaving the
  entered business, by the banner button or the switcher, removes the banner and
  rewrites the page URL to `/`. A reload then opens the operator's own business
  rather than silently re-entering. The entered business is never written to the
  remembered selection.
- **Audit.** Loading the builder page (`/b/<id>/`) inside a business the operator
  does not hold writes one `operator.entered` event to `contact_events`, the
  immutable spine. The event is filed on the **operator's own contact**, in the
  operator's own business, with `ref` = the entered business and
  `detail: {business, name}`. *Who* is the contact and *when* is `occurred_at`. API
  calls made from inside are not entries and record nothing. Opening a business the
  operator holds records nothing. The write is awaited, so the page is not served
  without its record. The timeline labels the event "Entered a business as platform
  operator".
- **Unchanged, as decided.** The bypass still returns `role: null`, so
  owner-gated controls stay closed inside: `canInvite` is false and adding a
  contact returns 403. The console stays reachable from inside, because its gate
  reads the operator's own admission. Non-operators following the same link get
  403, and nothing is recorded.

### Design decisions made during implementation

- **The page load is the entry.** Auditing every bypass-scoped request would put
  one row per API call on the spine. The only way into someone else's business is
  loading the page under its prefix, so recording that load gives exactly one row
  per entry.
- **The audit lives on the operator's contact, not the customer's business.** That
  keeps the record in the operator's own business, and `contact_events` is
  permanent. The REQ-235 activity log is pruned, so it was rejected for an audit
  record.
- **`entered` is decided by "the scope is not a membership"** (`enteredBusiness` in
  `scope.ts`), not by a second read of `platform_operator`. `scope.ts` stays that
  column's only reader.

## Test plan

UATs, one per rule above:

- `tests/test_UAT_FC_REQ-367_enter_business.workers.test.ts` drives the worker's own
  `fetch` with real D1 and a real Access token. It covers:
  - the link lands the operator in the business, which is reported as `entered`;
  - each page load is audited on the operator's own contact, and API calls are not;
  - opening a held business is neither entered nor audited;
  - a customer cannot open another business (403, nothing recorded);
  - owner controls stay shut inside;
  - the console stays reachable from inside.
- `tests/test_UAT_FC_REQ-367_open_any_business.test.ts` mounts the real chrome in
  jsdom. It covers:
  - every console row links into its business;
  - an entered business opens, is marked in the switcher, and has the banner on
    every tab with a way back;
  - the way back, and switching away with the switcher, both leave the entered
    business for good, and it is never remembered;
  - a held business draws no banner;
  - the boot reads the business from the page URL.