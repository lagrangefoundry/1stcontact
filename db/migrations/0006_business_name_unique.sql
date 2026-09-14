-- [[REQ-237]] — a business name is unique within the account that owns it.

-- WHY THERE IS A FILE AT ALL rather than an edit to `0001_baseline.sql`: the
-- baseline has been applied to the local and the remote database and
-- `wrangler d1 migrations apply` records what it has run, so an edit reaches
-- neither. Same reasoning as `0005`.

-- THE CONSTRAINT IS PER OWNING ACCOUNT, NEVER GLOBAL. Two accounts may each hold
-- a business called `Unnamed business`; one account may not hold two, because the
-- switcher would then draw two rows a person cannot tell apart. Across accounts
-- the name means nothing — a business is addressed by `tenants.id` and by nothing
-- else ([[REQ-190]], [[REQ-236]]) — so a global claim would refuse a real business
-- its real name for no benefit to anybody.
--
-- THE PLATFORM BUSINESS IS EXEMPT, AND THAT IS A DECISION RATHER THAN AN
-- ACCIDENT OF SQLITE. `tenants.owner_account_id` is NULL for 1st Contact and for
-- nothing else (`0001_baseline.sql`), and SQLite treats NULLs in a unique index
-- as distinct from each other — so the exemption costs nothing to have. It is
-- stated here so that a later reader who makes NULLs comparable knows what they
-- would be changing.
--
-- `lower(name)` AND NOT `name`, because exact-string uniqueness would admit
-- `Cole's Bakery` beside `cole's bakery` and put two indistinguishable rows in
-- one switcher — which is the failure this index exists to prevent.
--
-- IT IS THE INTEGRITY BACKSTOP AND NOT THE RULE. SQLite's `lower()` folds ASCII
-- only, and it cannot collapse an internal run of whitespace at all. The rule
-- lives in `apps/control-app/src/business.ts` — Unicode case-folding over a name
-- whose whitespace was already collapsed on the way in — and it is deliberately
-- NEVER WEAKER than this index: every pair this index would refuse, the code
-- refuses first and with a sentence naming the other business. What this buys is
-- that a write which somehow bypassed that code still cannot leave two rows a
-- person would read as the same business.
CREATE UNIQUE INDEX IF NOT EXISTS idx_tenants_owner_name
  ON tenants (owner_account_id, lower(name));
