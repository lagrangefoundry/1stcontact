-- REQ-184 — the entitlement's subject is the ACCOUNT; the column that said so
-- held a business ([[DOC-42]] §6, §10.2; [[DOC-40]] §5 as amended).
--
-- THE MODEL, IN ONE LINE. An entitlement grants an ACCOUNT access to a THING.
-- The subject is the account; the object — for 1st Contact's own product — is a
-- business. `0004` wrote a single column called `account_id` and put the OBJECT
-- in it, so the column named for the subject held the object and the subject had
-- no column at all.
--
-- WHY THE NAME WAS A LIVE BUG AND NOT A TIDINESS COMPLAINT. `account_id` tells
-- the next hand to put an account id in it. They would have, because the name
-- said to, and it would have HALF-WORKED: the row inserts, the grant attaches to
-- nothing that exists, and `bestActiveGrant` silently finds no grant for a
-- business that was supposed to have one. Nothing throws, and the first symptom
-- is a customer locked out of a business they paid for.
--
-- `memberships.account_id` IS RENAMED TOO, AND THAT IS REQUIRED RATHER THAN
-- TIDY. It has always held a business id ([[DOC-40]] §2 — "only the word
-- changed"), and leaving it alone was the right call while `account_id` meant a
-- business EVERYWHERE. The moment `entitlements.account_id` starts meaning an
-- account, two adjacent tables carry the same column name with opposite
-- meanings — which is strictly worse than the state this migration exists to
-- fix, and is exactly the trap that produces a silently-empty query.
--
-- `tenant_id` IS NOT TOUCHED, per [[REQ-180]] §3. That column is correct and
-- merely internal vocabulary; these two were WRONG.
--
-- NOT `IF NOT EXISTS` — SQLite has no such form for ALTER, and none is needed:
-- `wrangler d1 migrations apply` runs each file once against a database, and the
-- test harness applies the list once per suite against fresh storage.

-- The join says which BUSINESS a person may log in to ([[DOC-42]] §4).
ALTER TABLE memberships RENAME COLUMN account_id TO business_id;

-- SQLite rewrites index definitions on RENAME COLUMN, so these two still index
-- the right column and only their NAMES are now lies. Renaming an index means
-- dropping and recreating it; both are cheap and neither carries data.
DROP INDEX IF EXISTS idx_memberships_user_account;
DROP INDEX IF EXISTS idx_memberships_account;
CREATE UNIQUE INDEX IF NOT EXISTS idx_memberships_user_business ON memberships (user_id, business_id);
CREATE INDEX IF NOT EXISTS idx_memberships_business ON memberships (business_id);

-- The grant's OBJECT. Every row `0004` and `0005` wrote is a business-capacity
-- grant, so the rename is the whole of the data migration: no row moves, no row
-- is lost, and nothing has to be backfilled.
ALTER TABLE entitlements RENAME COLUMN account_id TO business_id;

-- And the grant's SUBJECT, which had no column. NULL means "no account named",
-- which is a per-BUSINESS CAPACITY grant — "Alice's Plumbing holds a pro plan" —
-- and is what every existing row is.
--
-- PER-BUSINESS CAPACITY AND PER-ACCOUNT ACCESS ARE DIFFERENT GRANTS, NOT ONE
-- GENERALISED ([[DOC-42]] §6). A capacity grant must not require re-granting
-- every member as they join, so the subject is an ADDITION and never a
-- replacement, and `NULL` is a first-class value rather than a missing one. The
-- capacity check therefore reads `business_id = ? AND account_id IS NULL`
-- (`bestActiveGrant`), so an account-subject grant cannot satisfy it and a
-- capacity grant cannot satisfy an account-subject lookup.
--
-- THE SUBJECT IS THE ACCOUNT, NOT THE PERSON. One user is one account today and
-- nothing may assert that this id IS a `users.id`, or an account with two people
-- on it becomes a migration instead of a row. "Account" is also relative to the
-- business: Bob is an account OF Alice's Plumbing, so a definition phrased as "a
-- `users` row in the 1st Contact business" is platform-only vocabulary and
-- breaks one level down.
--
-- NO INDEX ON IT YET, DELIBERATELY. Nothing reads it — the case that will is one
-- level down and does not exist ([[DOC-42]] §6: two members of one business, one
-- paying for gated content and one not). An index without a reader is a guess at
-- the shape of a query nobody has written.
ALTER TABLE entitlements ADD COLUMN account_id TEXT;

DROP INDEX IF EXISTS idx_entitlements_account;
CREATE INDEX IF NOT EXISTS idx_entitlements_business ON entitlements (business_id, status);
