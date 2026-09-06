---
uid: comment-d079cf1f
id: COMMENT-2292
type: comment
title: Comment on request REQ-194
created_by: xgd
created_at: '2026-09-06T18:29:31.343201+00:00'
updated_at: '2026-09-06T19:33:16.644858+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-4a4ca4a1
  kind: chat_transcript
---

<!-- xgd-turn id="a55482b8-2615-4a9f-8e93-c2bfa4b33080-user" -->

<!-- xgd-chat role="user" ts="2026-09-06T18:29:07.962560+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="a55482b8-2615-4a9f-8e93-c2bfa4b33080-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-06T18:59:47.831513+00:00" -->
#### Claude
Now let me read the core identity code.

I have the picture. Let me set up the branch and start.

Good, baseline is green. Now the schema.

Now I'll write the schema changes.

Now the `users.account_id` column, `tenants.owner_account_id`, the entitlements index, and the reminted platform key.

Now the prefix remint — `acct_` for businesses becomes `biz_`.

Now `identity.ts` — the account row, the minter, and provisioning.

Now `ensurePlatformOperator` and `findAccount`.

Now the stale `acct_` prose in identity.ts and scope.ts, plus the AdmittedBusiness doc.

Now `people.ts` — invite mints an account, `Person.accountId`, and grants keyed by account.

Now `invitePerson` must mint an account with the new contact.

Now the router: admin provisioning route and the businesses payload.

Now the chrome and the framework portal module.

Now the framework `account-portal` client.

Now update the test fixtures and existing UATs that the model change touches.

Now let me typecheck and run the identity suites to see what breaks.

Now let me run the full suite to find the rest of the fallout.

I'll write the new UATs while that runs.

Now the node-side UAT.

Now the payload rename in existing UATs, and the portal / baseline assertions.

Now the remaining workers suites.

Now a full run to confirm only the pre-existing failures remain.

<!-- xgd-turn id="62427919-2fc2-4146-a9ac-91042add1e1b-user" -->

<!-- xgd-chat role="user" ts="2026-09-06T19:12:39.102317+00:00" -->
#### You
please complete the free-coding of this ticket

Project note (additive — does not override the above):
Please be aware that in this current chat environment, background jobs die. Please be sure to run any tests in the foreground.

<!-- xgd-turn id="62427919-2fc2-4146-a9ac-91042add1e1b-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-06T19:33:16.599299+00:00" -->
#### Claude
Now people.ts — six conflicts.

Now the REQ-193 payload assertions that my rename broke.

Now confirming the remaining failures are pre-existing on `xgd-working`.

Now the version bump and final commit.

Now merging back into `xgd-working` under the lock.

REQ-194 is free-coded and merged into `xgd-working`.

## What landed

**Schema** (`db/migrations/0001_baseline.sql`)
- `accounts` — the payer, opaque `acct_` key, `tenant_id` for where it's known, `name`, `status`, `fields`.
- `users.account_id` — `NOT NULL`, FK to `accounts`. Many-to-one, defaulting to one-to-one.
- `tenants.owner_account_id` — a business names its owner. Null on the platform business, deliberately.
- `idx_entitlements_account` — the index REQ-184 declined while nothing read it.
- Business ids reminted `acct_` → `biz_`; `acct_` is freed for the noun that owns it.

**Code**
- `findAccount` returns an account, not a `UserRow`.
- `invitePerson` / `ensurePlatformOperator` mint an account beside the person.
- `provisionBusiness` takes an `accountId`, refuses one that doesn't exist or holds nobody, and writes a membership for *every* person on the owning account — the positive form of the ticket's `LIMIT 1` falsifier.
- `grantsFor` looks up by account key rather than person id; the capacity grant keeps its `NULL` subject.
- `/api/businesses` reports `person`, named from the REQ-193 name table.
- `db/dev-seed.sql` mints four accounts and points all three of Alice's businesses at hers.

**Evidence** — 15 UATs across `tests/test_UAT_FC_REQ-194_accounts.test.ts` and `.workers.test.ts`.

## Merge

The branch was 81 commits behind and crossed REQ-193 (names off `users`) and REQ-195 (`contact_events`). Resolved by hand — the `Person` payload now carries `accountId` beside `name`/`formerNames`, and the users INSERT keeps `account_id` while dropping `display_name`.

## Tests

Typecheck clean. Full suite: **2902 passed, 17 failed**. All failures pre-existing — the five knowledge suites (REQ-123, REQ-158, REQ-160, `reconciliation-assistant-conversation-knowledge`, `bug32-webui-scope-rebrand`) fail identically on `xgd-working`; `req115-builder-shell` and `REQ-150_plain_vite_bootstrap` are parallel-load flakes that pass in isolation and `req115` also fails on `xgd-working`.

## One correction I made to the ticket

The body said `entitlements.account_id` **is populated**. It isn't, and shouldn't be — provisioning still writes the capacity grant with a `NULL` subject, because a business's plan is the business's, not its inviter's personally. What changed is what a *non-null* value means: it names an `accounts` key now. I've reworded the body and the SQL prose accordingly, and added language for four behaviours the UATs assert that the body didn't yet motivate (the `NOT NULL` refusal, membership-for-every-person, the unowned platform business, and provisioning's two refusals).

Ticket is at `free_coded`, `story_points: 5`, version `0.2.114`, three SHAs recorded. Branch cleaned. Promotion to `ready_to_reconcile` is yours.

<!-- xgd-chat-end -->