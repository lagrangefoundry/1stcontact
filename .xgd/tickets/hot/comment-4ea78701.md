---
uid: comment-4ea78701
id: COMMENT-2289
type: comment
title: Comment on request REQ-191
created_by: xgd
created_at: '2026-09-06T18:09:47.321070+00:00'
updated_at: '2026-09-06T18:28:40.624661+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-2e50962c
  kind: chat_transcript
---

<!-- xgd-turn id="2e14b9ae-8a41-4e81-9bdf-b22f84a01480-user" -->

<!-- xgd-chat role="user" ts="2026-09-06T18:09:17.635961+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="2e14b9ae-8a41-4e81-9bdf-b22f84a01480-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-06T18:28:39.357780+00:00" -->
#### Claude
Now let me look at people.ts (peopleOf / personDetail) and the invite.

Now let me rewrite that block with a Python edit script.

Now update the header note in the baseline about siblings, then move to `identity.ts`.

Now `ensurePlatformOperator`, `findUser`, and `findAccount`.

Now the invite and `setPersonRecord`.

Now the builder detail panel — show the other addresses.

Now update the existing tests that write `users.email` directly.

Now add the imports those files need and fix the `.bind()` arities.

Now let me write the new UATs for REQ-191.

Now run the workers suite for the identity tests.

Now the jsdom UAT for the "Other addresses" section.

Now let me update the ticket body with what landed, then bump the version and commit.

Now merge back into `xgd-working` under the lock.

Done. REQ-191 is at `free_coded` with commit `0b89a18e8f` merged into `xgd-working`.

## What landed

**Schema** (`db/migrations/0001_baseline.sql`, edited in place per the ticket's sequencing):
- `user_emails` — opaque key, `user_id` FK with `ON DELETE CASCADE`, carried `tenant_id`, `UNIQUE (tenant_id, email)`, and `CREATE UNIQUE INDEX … ON user_emails (user_id) WHERE is_primary = 1`.
- Casefolding is `CHECK (email = lower(trim(email)) AND email <> '')` — a forgotten `normaliseEmail` is now a failed write, not a person `admit` never finds.
- `users.email`, `idx_users_tenant_email`, `entitlements.email`, `idx_entitlements_email` all dropped.

**Rewired:** `admit`/`findUser` resolve through *any* of a person's addresses and present the primary one; `invitePerson` matches on any address (and writes person + first address as one batch); `ensurePlatformOperator` resolves the key from `user_emails` and writes both rows; `setPersonRecord` rewrites the primary row; `personDetail` returns `emails`; `provisionBusiness` lost its `email` arg.

**UI:** the detail pane gets a read-only *Other addresses* section, shown only when there are some — without it a second address exists in the database and nowhere on screen.

## Decisions I made rather than asking

- **`entitlements.email` dropped outright.** The ticket says it "names a key instead" and `account_id` already exists; the audit half is `granted_by` plus the membership written in the same batch.
- **`email` is nullable** on `UserRow`/`Person`/`BusinessesPayload.account` — a phone-only contact is exactly the shape [[DOC-42]] §4.1 names, and `''` would hide it.
- **No add-an-address surface.** The ticket defers that to REQ-189 or later, so the second address is seeded in tests via the same statement builder the invite uses. That's the honest shape, but it does mean nothing in the product yet *creates* the multi-address case the model now supports.

## Two existing assertions I had to change

- REQ-167's *plan and status carry no check constraint* was written file-wide; narrowed to the `entitlements` table, since `user_emails.email` declares one deliberately and it's about normalisation, not a closed value set.
- REQ-190's single-opaque-key census gains `user_emails`.

## Tests

Full workers project: 402 passed, 11 failed — all 11 in `REQ-158_system_kb` / `REQ-160_two_kb_session`, which I confirmed fail identically with my changes stashed (a worktree KB-bundle artefact, not this work). New: 12 workerd UATs against real D1 and 3 jsdom UATs, plus every identity/people/baseline node suite green.

<!-- xgd-chat-end -->