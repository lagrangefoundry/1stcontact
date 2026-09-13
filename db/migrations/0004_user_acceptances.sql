-- [[REQ-240]] — what a contact has agreed to, as queryable state.
--
-- WHY THERE IS A FOURTH FILE AT ALL, on `0002` and `0003`'s reasoning.
-- `0001_baseline.sql` now declares this table, which is what a database created
-- from scratch gets. The live database ran `0001` months ago and will never run
-- it again — `wrangler d1 migrations apply` records what it has run — so editing
-- the baseline reaches nothing already deployed. This file is the half that
-- reaches it, and `IF NOT EXISTS` makes it a no-op on the databases the updated
-- baseline already created. There is no data to copy and no table to rebuild.
--
-- NOT `users.fields`, WHICH IS THE ALTERNATIVE THIS REPLACES. That bag is the
-- escape valve for a per-user fact not worth a column, and "everyone in this
-- business with `newsletter` true" is the query that eventually sends a
-- newsletter — D1 cannot index into a JSON column. Columns are equally wrong,
-- because a business's acceptance set is open-ended.
--
-- ONE ROW PER (CONTACT, KEY), CARRYING THE CURRENT VALUE. The history is
-- `contact_events`, which is append-only; this is the state, and state is the
-- thing that changes. Two representations of one fact would be one of them being
-- wrong.
--
-- `business_id` IS DERIVED FROM THE CONTACT AND NEVER SUPPLIED, exactly as it is
-- on `contact_events`: every write is `INSERT ... SELECT ... FROM users`, so a
-- row cannot be filed under a business its contact does not belong to. It is
-- stored rather than joined for because every read is scoped by it, and a scope
-- that needed a join is a scope somebody eventually writes without.
--
-- `document_uid` IS A TICKET UID AND NOT A VERSION STRING ([[REQ-240]] §3). What
-- has to be recoverable months afterwards is WHICH DOCUMENT they agreed to, and
-- a ticket resolves to the immutable stored text while a number needs somebody
-- to map it back. It is null for a preference, which is versioned by nothing.
--
-- THERE IS NO `type` COLUMN. The type of a key is code — `builder/acceptances.js`
-- — and a copy of it here would be a second answer free to disagree with the one
-- every writer branches on. A `request` key is representable in this table in
-- exactly the sense that any undeclared string is: the write path refuses it.
CREATE TABLE IF NOT EXISTS user_acceptances (
  id             TEXT PRIMARY KEY,
  contact_id     TEXT NOT NULL,
  business_id    TEXT NOT NULL,
  acceptance_key TEXT NOT NULL,
  -- The current value, and the only mutable fact here. `CHECK` rather than
  -- convention: a third value would be a state every reader has to have an
  -- opinion about and none of them has one.
  granted        INTEGER NOT NULL CHECK (granted IN (0, 1)),
  -- Which document ticket, for a document acceptance. Null for a preference.
  document_uid   TEXT,
  -- When this value was set — the moment the act happened, not when the row was
  -- touched. `updated_at` is the audit fact and moves for any write.
  set_at         TEXT NOT NULL,
  created_at     TEXT NOT NULL,
  updated_at     TEXT NOT NULL,
  FOREIGN KEY (contact_id) REFERENCES users (id) ON DELETE CASCADE
);

-- ONE ROW PER PERSON PER KEY, ENFORCED BY THE SCHEMA. The write is an upsert on
-- this index, so "set the newsletter" is one statement rather than a read
-- followed by a decision two concurrent writers make differently.
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_acceptances_contact_key
  ON user_acceptances (contact_id, acceptance_key);

-- "EVERY CONTACT IN THIS BUSINESS WITH `newsletter` TRUE" — the query that
-- eventually sends a newsletter, and the reason this is a table at all. Scoped
-- by business first because every read of this table is, then by key, then by
-- value, which is the order the question is asked in.
CREATE INDEX IF NOT EXISTS idx_user_acceptances_business_key
  ON user_acceptances (business_id, acceptance_key, granted);
