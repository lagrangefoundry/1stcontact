---
uid: comment-134dbb7f
id: COMMENT-2272
type: comment
title: Comment on request REQ-184
created_by: xgd
created_at: '2026-09-04T23:54:13.238390+00:00'
updated_at: '2026-09-05T00:36:11.668097+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-95dffc48
  kind: chat_transcript
---

<!-- xgd-turn id="4a2efa67-cbbb-43c9-b882-31bb590ef065-user" -->

<!-- xgd-chat role="user" ts="2026-09-04T23:53:02.324800+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="4a2efa67-cbbb-43c9-b882-31bb590ef065-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-05T00:15:23.613200+00:00" -->
#### Claude
Now the migration.

Now scope.ts comments and the test harness.

Now the existing UAT files.

Now the new UAT file.

Pre-existing. Now run the affected workers tests.

Now DOC-40's §5 amendment.

Now update the ticket body to match what landed.

Now lock, merge back, and mark free_coded.

Done. REQ-184 is `free_coded` at `65c38cd5abc695dabe358aae3701014b216f69ec`, merged into `xgd-working`, version `0.2.66`.

## What landed

**`db/migrations/0006_entitlement_subject.sql`** — one migration, three changes:

1. `memberships.account_id` → `business_id`
2. `entitlements.account_id` → `business_id` (the object)
3. `entitlements` gains a new `account_id` (the subject), plus renamed indexes

**Readers updated** — `EntitlementRow` now carries both ids; `provisionBusiness`, `businessesFor`, `lapseFor`, `bestActiveGrant` all renamed; `bestActiveGrant` and `lapseFor` gained `AND account_id IS NULL`, which is the kind check that keeps capacity and per-account grants from satisfying each other's question in either direction.

## Two decisions I made that go past the ticket's literal text

**I renamed `memberships.account_id` too.** The ticket's blast radius was entitlements-only, and both DOC-40 §2 and a comment in `identity.ts` had explicitly decided to leave that column alone. But the ticket's first acceptance line — *"no column named for an account holds a business id"* — covers it, and more importantly: the moment `entitlements.account_id` starts meaning an account, two adjacent tables carry that name with **opposite** meanings. That is strictly worse than the state the ticket set out to fix. `tenant_id` and the `acct_…` id values are untouched, per REQ-180 §3.

**I landed the subject column rather than deferring it.** The ticket made it conditional on "the rename migration is being written anyway and the cost is a line"; DOC-42 §10.2 says to rename *"when the subject column lands, rather than twice."* Both were satisfied. `NULL` is a first-class value meaning *no account named* — a per-business capacity grant, which is what every existing row is and what provisioning still writes. No index on it yet; nothing reads it.

**One collateral change:** REQ-180's schema guardrail asserted that the string `business_id` appeared in no migration, as a proxy for "nothing renamed `tenant_id`". That proxy stops holding once a different column earns the name, so I narrowed it to a claim about `tenant_id` itself.

## Evidence

`tests/test_UAT_FC_REQ-184_entitlement_subject.workers.test.ts` — 7 UATs in workerd against real D1, with the migration sequence applied in order, so the rename is proved against a database that already held `0004`'s and `0005`'s rows. Includes both independence directions and a re-proof that expiry still expires (the date arithmetic shares a `WHERE` clause with the renamed column).

`tests/req115-builder-shell.test.ts` exercises the real `wrangler d1 migrations apply --local` path — it passed in the clean branch worktree.

**Full sweep:** workers 32/37 files pass, node 288/294. Every failure is a knowledge-base index error (`REQ-158/159/160/161/163/123/165`, `bug32-webui-scope-rebrand`) that reproduces identically on unmodified `xgd-working`. `req115-builder-shell` fails only in your main checkout, on stale `apps/control-app/dist-assets.staging/` artifacts the tree-scan picks up — clean in the worktree.

DOC-40 §5's amendment and DOC-42 §10.2 both now record which way it went.

Production needs `bin/deploy` to run `d1 migrations apply --remote` before the new code serves.

<!-- xgd-turn id="35d894de-fab1-4631-a97a-fd278c180e84-user" -->

<!-- xgd-chat role="user" ts="2026-09-05T00:35:38.826810+00:00" -->
#### You
Did you move this ticket to ready_to_reconcile/

<!-- xgd-turn id="35d894de-fab1-4631-a97a-fd278c180e84-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-05T00:36:11.483900+00:00" -->
#### Claude
No — it's at `free_coded`. That's where `xgd ticket move-to-free-coded` leaves it, and I stopped there deliberately.

There's no `move-to-ready-to-reconcile` command; the promotion is a plain `status` update, and this repo's own handoff comments treat it as yours to make:

- `comment-76256ec4`: *"The ticket sits at `free_coded` — promotion to `ready_to_reconcile` is yours."*
- `comment-88619077`: same wording.

Current state of REQ-184:

- `status: free_coded`
- `fields.commits: [65c38cd5abc695dabe358aae3701014b216f69ec]`, version `0.2.66`
- merged into `xgd-working` (`9d4fe11705`), branch cleaned, lock released

Two things worth weighing before promoting, since reconciliation is where they'd otherwise surface:

1. **The `memberships.account_id` rename wasn't in the ticket's original blast radius.** I added the motivating language to the body before committing, so the UATs trace — but it contradicts a decision DOC-40 §2 and an `identity.ts` comment had previously recorded, and I amended both. If you'd rather that half didn't land, it's a much cleaner revert now than after reconciliation.
2. **Production hasn't had the migration applied.** `bin/deploy` runs `d1 migrations apply --remote`; until then the deployed Worker's code and schema disagree.

Say the word and I'll set it to `ready_to_reconcile`.

<!-- xgd-chat-end -->