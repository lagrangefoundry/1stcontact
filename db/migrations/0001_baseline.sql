-- REQ-190 — the baseline. One migration, the whole schema, keys done right.
--
-- WHY THIS FILE EXISTS INSTEAD OF A TENTH MIGRATION. D1 cannot alter a primary
-- key in place, so re-keying `sites` the incremental way is eight
-- create-copy-drop-rename rebuilds carrying data that does not exist. There is
-- no real data anywhere, so `0001`–`0009` are replaced by this file and the
-- remote database is wiped rather than migrated. `wrangler d1 migrations apply`
-- records what it has run, which is why the wipe is the mechanism and not a
-- convenience.
--
-- THE RULE THIS FILE IS THE STATEMENT OF: **no data field is ever a key.** A key
-- is a surrogate the system mints and never shows meaning through. An email
-- address, a site slug, a business name — anything a human chose, typed, or
-- might change — is an attribute, and attributes get renamed. Every primary key
-- below is 128 bits from a CSPRNG (`newId`, `tools/generate/src/store/ids.ts`),
-- prefixed so a value read in a log says which table it came from.
--
-- ORDINAL IS NOT IDENTITY, and the two integer columns that survive are not
-- exceptions to the rule but outside it. `site_revisions.id` is a POSITION in a
-- sequence — live is `MAX(id)` with no head pointer (DOC-12 §4) and the
-- published layout is `rev/0001` — and `site_changes.at` is the journal counter
-- the retention window is trimmed by. Randomising a position destroys the
-- ordering that is its entire meaning. `counters.value` is the same fact once
-- more. Where a number orders rather than names, it stays a number.
--
-- IT SEEDS NO PEOPLE. `0005` hardcoded one personal address into a migration
-- that ran in every environment forever; `ensurePlatformOperator` (REQ-185)
-- writes the same four rows from `PLATFORM_ADMINS` at admission time, works
-- before any row exists, and cannot be revoked by the database it repairs. Two
-- ways to create the same rows is the legacy path CLAUDE.md forbids, so only one
-- survives — and it is not this file. The single row seeded below is the
-- platform BUSINESS, because `TENANT_ID` names it and a handle against an
-- unregistered tenant is refused at construction.
--
-- ITS SIBLINGS EDIT IT RATHER THAN FOLLOW IT. REQ-191 (`user_emails`) has, and
-- REQ-193 (`user_names`), REQ-194 (`accounts`) and REQ-195 (`contact_events`)
-- will, land in THIS file. Editing a baseline that has never been applied is not a second
-- rebaseline, which is what "separable in review and in acceptance, not in
-- deployment" means in practice.

-- ---------------------------------------------------------------------------
-- Businesses
-- ---------------------------------------------------------------------------

-- The tenant registry, shared by the site store and the ticket store (DOC-8
-- §6.2, DOC-10 §4.1). ONE registry and not two, on purpose: the tenant is the
-- hard information barrier, and a deployment must not be able to hold a tenant
-- one store considers active and the other has never heard of.
--
-- `id` IS OPAQUE AND `name` IS THE BUSINESS. It used to be a chosen word —
-- `'1stcontact'` — which meant the business could never be renamed and that the
-- word propagated into every `tenant_id`, into R2 prefixes and into `/b/<id>/`
-- URLs. The business is *called* 1st Contact in `name`, where it can change, and
-- is *keyed* by a value with no relationship to what it is called.
CREATE TABLE IF NOT EXISTS tenants (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  -- 'active' or anything else. A tenant that is not active is a validation
  -- error at handle construction, never a handle that quietly reads nothing.
  status     TEXT NOT NULL DEFAULT 'active',
  -- The ticket store's per-tenant configuration bag (DOC-8 §6.2). Present from
  -- the start here; in the old sequence it arrived as an ALTER in `0003`
  -- because `0001` had created the table without it, and `Accessor.putTenant`
  -- INSERTs it.
  config     TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL
);

-- ---------------------------------------------------------------------------
-- Sites
-- ---------------------------------------------------------------------------

-- WHAT LIVES HERE AND WHAT DOES NOT. Page definitions and `site.json` are small,
-- structured and transactional, so they are rows. Asset *bytes* are not: they
-- live in R2 and this schema holds only the pointer to them. Revision snapshots
-- likewise stay in R2.
--
-- THE SITE HAS A KEY OF ITS OWN, AND THE SLUG IS AN ATTRIBUTE. It used to be
-- `PRIMARY KEY (tenant_id, slug)`, so renaming a site rewrote `site_pages`,
-- `site_assets`, `site_changes`, `site_revisions`, `published_sites` and every
-- R2 key it owned — and moving a site to another business was that same rewrite
-- plus an object-store copy. Both are now an UPDATE of one column, because the
-- site's own row is the ONLY place that records either fact.
--
-- `UNIQUE (tenant_id, slug)` PER BUSINESS, NEVER GLOBAL. The slug still has to
-- name at most one site inside the business that owns it, or the builder could
-- not address one. Across businesses it means nothing, which is what lets two
-- businesses each own — and each publish — a site called `home`.
CREATE TABLE IF NOT EXISTS sites (
  id         TEXT PRIMARY KEY,
  tenant_id  TEXT NOT NULL,
  slug       TEXT NOT NULL,
  -- `site.json` verbatim: everything except pages. NULL is a site whose
  -- definition has not been written yet, which `readSiteJson` reports as null.
  site_json  TEXT,
  -- The write version, bumped by every write. Read before a read-modify-write
  -- and passed back as `SiteWrite.expect` to make that write a compare-and-set.
  version    INTEGER NOT NULL DEFAULT 0,
  -- The journal's monotone counter. Deliberately separate from `version`: it
  -- moves only when a command records a change, and a write that journalled
  -- nothing must leave it exactly where it was.
  counter    INTEGER NOT NULL DEFAULT 0,
  -- Which published revision the current draft descends from (DOC-12 §4).
  -- Distinct from "the live revision" and only usually equal to it: a checkout
  -- of an older revision re-parents the draft onto THAT one, and the difference
  -- is what the next publish records as `based_on`.
  base_revision INTEGER,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_sites_tenant_slug ON sites (tenant_id, slug);

-- EVERY CHILD TABLE NAMES THE SITE AND NOTHING ELSE. No `tenant_id` appears
-- below this line, and its absence is the whole of what makes a move one column.
--
-- ISOLATION MOVED ONE LEVEL IN AND DID NOT WEAKEN. The store still binds the
-- business into the handle at construction; what the handle resolves is
-- slug -> `sites.id`, under `WHERE tenant_id = ?`. A site key is 128 random bits
-- and is obtainable only through that business-scoped lookup, so a query that
-- reaches another business's rows is not one somebody forgot to filter — it
-- needs a key the handle cannot produce.

-- One row per page, mirroring the file-backed store's one file per page
-- (DOC-12 §3). That split is the store's unit of change, so it survives the move
-- into rows unchanged: a page edit updates one row rather than rewriting the
-- whole definition.
CREATE TABLE IF NOT EXISTS site_pages (
  site_id   TEXT NOT NULL,
  -- The store key (`home.json`), never a path: it carries no directory
  -- component, and load order is the sort order of these names.
  name      TEXT NOT NULL,
  page      TEXT NOT NULL,
  PRIMARY KEY (site_id, name),
  FOREIGN KEY (site_id) REFERENCES sites (id) ON DELETE CASCADE
);

-- Asset METADATA. The bytes are the R2 object at `r2_key`; this row is what
-- makes the asset listable and typed without a bucket listing on every request.
CREATE TABLE IF NOT EXISTS site_assets (
  site_id      TEXT NOT NULL,
  name         TEXT NOT NULL,
  r2_key       TEXT NOT NULL,
  content_type TEXT NOT NULL,
  size         INTEGER NOT NULL,
  PRIMARY KEY (site_id, name),
  FOREIGN KEY (site_id) REFERENCES sites (id) ON DELETE CASCADE
);

-- The draft change journal, one row per record rather than one JSON blob per
-- site. The blob would be rewritten on every keystroke-settle and would grow to
-- the window's full size in one column; rows let an append be an INSERT and let
-- the window be enforced by a DELETE of what aged out.
--
-- `at` IS THE COUNTER, NOT A TIMESTAMP — see the header on ordinals.
CREATE TABLE IF NOT EXISTS site_changes (
  site_id   TEXT NOT NULL,
  at        INTEGER NOT NULL,
  record    TEXT NOT NULL,
  PRIMARY KEY (site_id, at),
  FOREIGN KEY (site_id) REFERENCES sites (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS site_changes_at ON site_changes (site_id, at);

-- One row per published revision. Immutable once written: nothing updates a row
-- here, and the only DELETE is the one that drops a whole site.
--
-- THERE IS NO `published_sites` TABLE ANY MORE, and its absence is REQ-190's
-- most visible result. It existed to make one data field — the slug — globally
-- unique, because `/site/<slug>/` carried no business and `public-site` had to
-- resolve a site from a name with no account attached to it. That made the
-- published slug the one namespace shared across every business on the
-- deployment: two customers could not both publish `home`, and the one who tried
-- second was told the name was taken, which is an existence oracle across the
-- barrier. The public address is the site's KEY now — `/site/<siteId>/`, the same
-- unguessable value the joins use — so there is nothing left to claim, no table
-- to claim it in, and no refusal to leak. Per-business hostnames (DOC-12 §9)
-- remain the readable answer and remain purely additive.
CREATE TABLE IF NOT EXISTS site_revisions (
  site_id      TEXT NOT NULL,
  -- Monotonic per site, and forward-only. Never reused, never renumbered.
  id           INTEGER NOT NULL,
  published_at TEXT NOT NULL,
  published_by TEXT,
  message      TEXT NOT NULL DEFAULT '',
  -- The revision this one descends from — set when the draft was checked out
  -- from a revision that was not the latest, which is what makes a forward-only
  -- rollback self-documenting (DOC-12 §4).
  based_on     INTEGER,
  -- The change list versus the previous live revision, as DOC-12 §4 defines it:
  -- {added, modified, removed}, each a sorted list of store paths.
  changes      TEXT NOT NULL,
  -- Digest of the frozen definition. AUDIT, NOT ADDRESSING — a revision is named
  -- by its id, and every R2 key is built from that. This answers the question the
  -- change list cannot: are these the same bytes?
  sha          TEXT NOT NULL,
  PRIMARY KEY (site_id, id),
  FOREIGN KEY (site_id) REFERENCES sites (id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------------
-- The ticket store
-- ---------------------------------------------------------------------------
--
-- THE DDL IS THE COMPONENT'S, TRANSCRIBED — NOT AUTHORED HERE.
-- `@lagrangefoundry/ticketing` owns this schema and exports it as
-- `SCHEMA_STATEMENTS`. Wrangler's migration runner reads `.sql` files off disk
-- and cannot import a JS constant, so the statements are copied here — and a
-- copy is a fork unless something checks it. `test_UAT_FC_REQ-162_ticket_schema`
-- asserts every statement in `SCHEMA_STATEMENTS` appears below, so an upstream
-- schema change fails this repository's suite instead of silently leaving the
-- deployed database a version behind.
--
-- ITS `tenants` STATEMENT IS A NO-OP HERE, and deliberately so. The component's
-- own CREATE is `IF NOT EXISTS` and the registry above already exists with the
-- `config` column it wants — which is why the old sequence's
-- `ALTER TABLE tenants ADD COLUMN config` is GONE rather than carried forward. In
-- one baseline there is no earlier migration to reconcile with, and re-adding a
-- column the table already has is an error, not a repair.
--
-- `uid` IS GLOBALLY UNIQUE AND OPAQUE — `tenant_id` is a separate column and is
-- never parsed out of it (DOC-8 §6.4/§12.7). `human_id` (`MAT-1`) is a LABEL and
-- not a key: it is indexed so a reference carrying either spelling can reach a
-- uid, and nothing is keyed by it.
CREATE TABLE IF NOT EXISTS tickets (
  uid        TEXT PRIMARY KEY,
  tenant_id  TEXT    NOT NULL,
  type       TEXT    NOT NULL,
  title      TEXT    NOT NULL,
  status     TEXT,
  human_id   TEXT,
  fields     TEXT    NOT NULL DEFAULT '{}',
  links      TEXT    NOT NULL DEFAULT '[]',
  body       TEXT    NOT NULL DEFAULT '',
  version    INTEGER NOT NULL DEFAULT 1,
  archived   INTEGER NOT NULL DEFAULT 0,
  created_at TEXT    NOT NULL,
  updated_at TEXT    NOT NULL
);

-- Scoped list/query lookups.
CREATE INDEX IF NOT EXISTS idx_tickets_tenant_type
  ON tickets (tenant_id, type);
-- Backs the version range-scan primitive (`version > cursor`) and cursor stability.
CREATE INDEX IF NOT EXISTS idx_tickets_tenant_version
  ON tickets (tenant_id, version);
CREATE INDEX IF NOT EXISTS idx_tickets_tenant_status
  ON tickets (tenant_id, status);
-- Backs human-id resolution (`resolve_id`): a reference may carry either id
-- spelling, and the human one has to reach a uid without a table scan.
CREATE INDEX IF NOT EXISTS idx_tickets_tenant_human_id
  ON tickets (tenant_id, human_id);

-- The control-plane tenant registry (DOC-8 §6.2), transcribed. Already created
-- above, with `config`; this statement is the no-op the header describes.
CREATE TABLE IF NOT EXISTS tenants (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'active',
  config     TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL
);

-- Per-(tenant, type) human-id counters (DOC-8 §6.4). Incremented atomically so
-- two tickets can never collide on a human id (e.g. `MAT-1`). `value` is an
-- ordinal, per the header.
CREATE TABLE IF NOT EXISTS counters (
  tenant_id TEXT    NOT NULL,
  type      TEXT    NOT NULL,
  value     INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (tenant_id, type)
);

-- ---------------------------------------------------------------------------
-- Identity
-- ---------------------------------------------------------------------------

-- A CONTACT, WHICH IS EVERY ROW IN THIS TABLE (DOC-44 §2). Some of them can sign
-- in and most cannot; that is `tos_accepted_at`, an ACCESS fact, and it is
-- independent of `pipeline_stage`, which is where the relationship stands.
--
-- `fields` is an opaque JSON bag, the same escape valve the ticket store's rows
-- carry: a per-user fact not worth a column and not worth a migration has
-- somewhere to go.
--
-- THE ADDRESS IS NOT HERE, AND ITS ABSENCE IS THE POINT (REQ-191). This table
-- used to carry `email TEXT NOT NULL` under `UNIQUE (tenant_id, email)`, which
-- made the address the PERSON: one human held exactly one, a second address was
-- a second human who could never be reconciled with the first, and changing
-- someone's address mutated the key `admit` resolved them through. Addresses are
-- `user_emails` below. `display_name` is the same defect awaiting REQ-193's
-- `user_names`.
CREATE TABLE IF NOT EXISTS users (
  id             TEXT PRIMARY KEY,
  tenant_id      TEXT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'active',
  display_name   TEXT,
  -- Entry to a business without a membership (DOC-40 §6, REQ-185). The ownership
  -- half is `memberships.role`; these are two independent facts and are asked by
  -- two different readers.
  platform_operator INTEGER NOT NULL DEFAULT 0,
  tos_version    TEXT,
  tos_accepted_at TEXT,
  invited_at     TEXT,
  -- WHERE THE RELATIONSHIP STANDS (DOC-44 §4, REQ-188), stored and not derived
  -- from which timestamps happen to be set. No CHECK: the set grows, and adding
  -- a stage must be a code change rather than a migration.
  pipeline_stage TEXT NOT NULL DEFAULT 'lead',
  first_seen_at  TEXT,
  last_seen_at   TEXT,
  created_at     TEXT NOT NULL,
  updated_at     TEXT NOT NULL,
  fields         TEXT NOT NULL DEFAULT '{}'
);

-- THE ADDRESSES A CONTACT IS REACHABLE AT (REQ-191). A person has as many as
-- they have; the table is the only place any of them is written, and the person
-- keeps the same key whichever one they are reached at.
--
-- `tenant_id` IS CARRIED FROM THE OWNING USER rather than joined for. It is here
-- so the uniqueness constraint below can be per business without a join, and it
-- is redundant with `users.tenant_id` in exactly the way an index is: derived,
-- and worth storing because a constraint has to be able to read it.
--
-- `is_primary`, NOT `default`, which is a reserved word in enough dialects to be
-- worth avoiding.
--
-- CASEFOLDED BY THE SCHEMA, NOT BY CONVENTION. `normaliseEmail` is a function
-- anyone can forget to call and this index is byte-exact, so a differently-cased
-- address would be a second person `admit` never finds. The CHECK refuses the
-- unnormalised form outright, so the constraint enforces what the convention
-- only intended — and a writer that forgets fails loudly at the write rather
-- than quietly at the next login.
CREATE TABLE IF NOT EXISTS user_emails (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL,
  tenant_id  TEXT NOT NULL,
  email      TEXT NOT NULL CHECK (email = lower(trim(email)) AND email <> ''),
  is_primary INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Identity is decided HERE, once, for builder users and captured contacts alike.
-- Scoped to the business rather than global: two unrelated customers may each
-- hold a contact with the same address, and a global unique index would make one
-- of them unrepresentable — and would tell one business that another already
-- knows that address, which is an existence oracle across the barrier.
--
-- THE KEY IS GLOBAL AND THE ADDRESS IS NOT, and the two constraints are easy to
-- run together. `id` is 128 random bits and needs no scope; the address means
-- one person only within the business that holds it.
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_emails_tenant_email
  ON user_emails (tenant_id, email);

-- EXACTLY ONE PRIMARY PER PERSON, ENFORCED BY THE SCHEMA. A partial unique index
-- over `user_id` where the flag is set says "at most one" in the one place that
-- cannot be forgotten; an invariant the application maintains is an invariant
-- that eventually is not maintained. Zero is representable and is what a person
-- with no address at all has.
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_emails_one_primary
  ON user_emails (user_id) WHERE is_primary = 1;

-- The reverse lookup: every address of one person, for the detail panel.
CREATE INDEX IF NOT EXISTS idx_user_emails_user ON user_emails (user_id);

-- Read by the pipeline facet's "who did I ask who never came". Scoped by business
-- first because every read of this table already is.
CREATE INDEX IF NOT EXISTS idx_users_tenant_stage ON users (tenant_id, pipeline_stage);

-- The join: which people may operate which businesses. `expires_at` is what a
-- time-boxed support grant will use; `revoked_at` is a withdrawal that refuses
-- independently of any date.
CREATE TABLE IF NOT EXISTS memberships (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL,
  business_id TEXT NOT NULL,
  role        TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'active',
  granted_by  TEXT,
  granted_at  TEXT NOT NULL,
  expires_at  TEXT,
  revoked_at  TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_memberships_user_business ON memberships (user_id, business_id);
CREATE INDEX IF NOT EXISTS idx_memberships_business ON memberships (business_id);

-- A GRANT OF A PLAN, FOR A PERIOD, FROM A SOURCE (DOC-40 §5) — not a boolean on
-- a business, and not a column billing overwrites.
--
-- `plan` AND `status` CARRY NO CHECK CONSTRAINT, DELIBERATELY. Adding 'warning'
-- when billing lands, or 'trial' when self-signup lands, must be a code change
-- and not a schema migration. A UAT asserts this file declares none on either.
--
-- `business_id` IS THE CAPACITY AND `account_id` IS THE SUBJECT (REQ-184).
-- `account_id` is NULL on every row today and means "a per-business capacity
-- grant with no subject" — an empty chair, correctly labelled. REQ-194 fills it.
--
-- IT NAMES ITS SUBJECT BY KEY AND NOT BY ADDRESS (REQ-191). There used to be an
-- `email` column beside `account_id`, which is a string foreign key to a person:
-- the same subject had two representations, an address change had two places to
-- land, and it could land in one. `account_id` is the only place a grant says
-- whose it is.
--
-- ACCESS AND MONEY ARE SEPARATE. There is no `discount_pct` here and there will
-- not be one: a comped grant is an entitlement with no subscription, a
-- discounted one is a subscription that also produces an entitlement, and
-- collapsing the two would force the access check to understand pricing.
CREATE TABLE IF NOT EXISTS entitlements (
  id           TEXT PRIMARY KEY,
  business_id  TEXT NOT NULL,
  account_id   TEXT,
  plan         TEXT NOT NULL,
  source       TEXT NOT NULL,
  status       TEXT NOT NULL,
  starts_at    TEXT NOT NULL,
  ends_at      TEXT,
  revoked_at   TEXT,
  subscription_ref TEXT,
  granted_by   TEXT,
  note         TEXT,
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL
);

-- NOT UNIQUE ON `business_id`, and that is the model rather than an omission. A
-- business accumulates grants over its life — comped, then trial, then
-- subscription — and effective access is the best active grant covering now.
CREATE INDEX IF NOT EXISTS idx_entitlements_business ON entitlements (business_id, status);

-- ---------------------------------------------------------------------------
-- The one seeded row
-- ---------------------------------------------------------------------------
--
-- THE PLATFORM BUSINESS, AND NOTHING ELSE. `TENANT_ID` names it and
-- `forTenant` refuses an unregistered tenant, so without this row a fresh
-- deployment answers every request from the one path that still reads the var
-- with `UnknownTenantError`.
--
-- THE ID IS A LITERAL TWO FILES MUST AGREE ON. It is minted once, here, and
-- copied into `apps/control-app/wrangler.toml` under BOTH `[vars]` and
-- `[env.production.vars]`, which does not inherit. Nothing about the value is
-- derivable, so nothing could notice them disagreeing except a check that
-- compares them — `test_UAT_FC_REQ-190_tenant_id_literal` is that check.
--
-- THE NAME IS DATA AND MAY CHANGE. `1st Contact` is what the business is called;
-- renaming it touches this row and nothing else in the schema.
INSERT OR IGNORE INTO tenants (id, name, status, config, created_at)
VALUES (
  'acct_51a6746495c8057e886ff98d4208e6b9',
  '1st Contact',
  'active',
  '{}',
  strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
);
