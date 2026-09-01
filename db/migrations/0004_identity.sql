-- REQ-167 — identity, accounts and entitlement ([[DOC-40]]).
--
-- WHAT WAS MISSING. `access.ts` verifies a Cloudflare Access JWT on every
-- request and produces a verified email address, and nothing was done with it:
-- no record that a person exists, no account they own, and no rule about who may
-- enter. The builder served whoever passed the hostname gate, into the single
-- tenant named by `TENANT_ID`. Onboarding one external person needs all three of
-- the tables below; onboarding a second needs them to be separate tables.
--
-- THREE NOUNS, AND THE JOIN IS ITS OWN ROW ([[DOC-40]] §2). A *user* is a person,
-- identified by a verified email, scoped to a tenant. An *account* is a tenant —
-- the unit of isolation, already registered by `0001_site_store.sql` and not
-- re-declared here. A *membership* says this person may operate that account.
-- The join is a row rather than an `account_id` column on the user because an
-- agency account is several memberships against one account, and a column would
-- make that a migration.
--
-- CONTACTS ARE USERS. A contact captured by a customer's site is a `users` row in
-- that customer's tenant with no authentication fields set — not a second table.
-- A contact later invited to a portal must not become a *different* record with a
-- duplicate email, and `idx_users_tenant_email` is the one place identity is
-- decided for both cases.
--
-- `IF NOT EXISTS` throughout, per this repository's migration convention (0003).

-- The person. `tenant_id` is the tenant this identity belongs to: for a builder
-- user that is the PLATFORM's own tenant, and for a contact captured by a
-- customer's form it is that customer's.
--
-- `platform_admin` IS AMBIENT AND THAT IS THE POINT ([[DOC-40]] §6). It works
-- before any membership row exists and it cannot lock its holder out of the
-- system that grants it. Time-boxed `support` membership rows are the auditable
-- alternative and `memberships` carries `expires_at` for them from day one; they
-- are not built now because during the alpha the operator and the administrator
-- are the same person.
--
-- `fields` is an opaque JSON bag, the same escape valve the ticket store's own
-- rows carry: a per-user fact that is not worth a column and not worth a
-- migration has somewhere to go.
CREATE TABLE IF NOT EXISTS users (
  id             TEXT PRIMARY KEY,
  tenant_id      TEXT NOT NULL,
  email          TEXT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'active',
  display_name   TEXT,
  platform_admin INTEGER NOT NULL DEFAULT 0,
  tos_version    TEXT,
  tos_accepted_at TEXT,
  invited_at     TEXT,
  first_seen_at  TEXT,
  last_seen_at   TEXT,
  created_at     TEXT NOT NULL,
  updated_at     TEXT NOT NULL,
  fields         TEXT NOT NULL DEFAULT '{}'
);

-- Identity is decided HERE, once, for builder users and captured contacts alike.
-- Scoped to the tenant rather than global: two unrelated customers may each hold
-- a contact with the same email address, and a global unique index would make
-- one of them unrepresentable.
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_tenant_email ON users (tenant_id, email);

-- The join. `expires_at` is what a time-boxed support grant will use; `revoked_at`
-- is a withdrawal that refuses independently of any date.
CREATE TABLE IF NOT EXISTS memberships (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL,
  account_id TEXT NOT NULL,
  role       TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'active',
  granted_by TEXT,
  granted_at TEXT NOT NULL,
  expires_at TEXT,
  revoked_at TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_memberships_user_account ON memberships (user_id, account_id);
CREATE INDEX IF NOT EXISTS idx_memberships_account ON memberships (account_id);

-- A GRANT OF A PLAN, FOR A PERIOD, FROM A SOURCE ([[DOC-40]] §5) — not a boolean
-- on an account, and not a column billing overwrites.
--
-- `plan` AND `status` CARRY NO CHECK CONSTRAINT, DELIBERATELY. Adding `'warning'`
-- when billing lands, or `'trial'` when self-signup lands, must be a code change
-- and not a schema migration. A `CHECK (status IN (...))` is exactly the kind of
-- tidiness a later hand adds without seeing what it costs, so a UAT asserts this
-- file declares none on either column.
--
-- BOTH `account_id` AND `email`. The email is the claim key for a grant made
-- before an account exists, and it is also the audit record of who the grant was
-- made to; today's admin flow fills both.
--
-- ACCESS AND MONEY ARE SEPARATE. There is no `discount_pct` here and there will
-- not be one: a comped grant is an entitlement with no subscription, a
-- discounted one is a subscription that also produces an entitlement, and
-- collapsing the two would force the access check to understand pricing.
CREATE TABLE IF NOT EXISTS entitlements (
  id           TEXT PRIMARY KEY,
  account_id   TEXT,
  email        TEXT,
  plan         TEXT NOT NULL,
  source       TEXT NOT NULL,
  status       TEXT NOT NULL,
  starts_at    TEXT NOT NULL,
  ends_at      TEXT,
  subscription_ref TEXT,
  granted_by   TEXT,
  note         TEXT,
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL
);

-- NOT UNIQUE ON `account_id`, and that is the model rather than an omission. An
-- account accumulates grants over its life — comped, then trial, then
-- subscription — and effective access is the best active grant covering now. A
-- unique index would encode the single-row assumption this design exists to
-- avoid.
CREATE INDEX IF NOT EXISTS idx_entitlements_account ON entitlements (account_id, status);
CREATE INDEX IF NOT EXISTS idx_entitlements_email ON entitlements (email);
