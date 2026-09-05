-- REQ-188 — the pipeline is an axis of its own, and it is STORED ([[DOC-44]] §4).
--
-- WHAT WAS WRONG. The User tab derived one label from two timestamps: null
-- `invited_at` read as Contact, a set one as Invited, and `tos_accepted_at` as
-- Member. Two faults in one line. *Contact* is the entity — every row in this
-- table is one ([[DOC-44]] §2) — so using it as a value made it mean both "the
-- population" and "a row with nothing else true", which is how a query comes to
-- exclude customers from the contact list. And membership is an ACCESS fact
-- while invited is a PIPELINE fact ([[DOC-44]] §3): they are independent, all
-- four combinations occur, and a single line cannot hold a member who was never
-- invited or a lead who is neither.
--
-- SO THE STAGE GETS A COLUMN AND MEMBERSHIP KEEPS ITS TIMESTAMP. `tos_accepted_at`
-- already answers "can this contact sign in", exactly and legally, and needs
-- nothing added. What had no representation at all is where the relationship
-- stands, and [[DOC-44]] §4 says why it must not be inferred from which stamps
-- happen to be set: that works for two values and turns every later stage into a
-- new column plus an ordering rule nobody can see. `invited_at` records WHEN we
-- asked; this records WHETHER they are in that state.
--
-- `lead` IS THE DEFAULT AND THE INITIAL VALUE ([[DOC-44]] §4, decided
-- 2026-09-05). It commits to marginally more commercial intent than a contact
-- who merely wrote in, which was the argument against it; it wins on being the
-- word every operator already knows, and a stage name is read far more often
-- than it is reasoned about.
--
-- NO CHECK CONSTRAINT, for the reason 0004 gives about `plan` and `status`: the
-- set grows ([[DOC-44]] §4 names only two values and says so), and adding the
-- third must be a code change rather than a migration.
--
-- THE BACKFILL DERIVES ONCE, WHICH IS NOT THE THING RULED OUT. Deriving at READ
-- time is what makes the stage invisible and unextendable; deriving once, here,
-- to seed a column that is authoritative from then on is the only way an existing
-- row can carry the fact at all. After this runs nothing reads a timestamp to
-- decide a stage.
--
-- NO `IF NOT EXISTS`, and it cannot have one — SQLite has no conditional
-- `ALTER TABLE`. 0007 records the same thing: `wrangler d1 migrations apply`
-- never re-runs an applied migration, and a re-run failing loudly on a duplicate
-- column is the correct answer to "this database is not in the state you think".
ALTER TABLE users ADD COLUMN pipeline_stage TEXT NOT NULL DEFAULT 'lead';

UPDATE users SET pipeline_stage = 'invited' WHERE invited_at IS NOT NULL;

-- Read by the facet's "who did I ask who never came", which is the one question
-- the pipeline axis exists to make askable. Scoped by tenant first because every
-- read of this table already is — a people list that left the business out is
-- not a query this schema wants to make cheap.
CREATE INDEX IF NOT EXISTS idx_users_tenant_stage ON users (tenant_id, pipeline_stage);
