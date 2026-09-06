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
-- ITS SIBLINGS EDIT IT RATHER THAN FOLLOW IT. REQ-191 (`user_emails`), REQ-193
-- (`user_names`), REQ-194 (`accounts`) and REQ-195 (`contact_events`) land in
-- THIS file. Editing a baseline that has never been applied is not a second
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
-- THE ADDRESS IS STILL A COLUMN HERE, AND THAT IS REQ-191's, NOT THIS TICKET'S.
-- `UNIQUE (tenant_id, email)` makes the address the person — one human, one
-- address, and changing it mutates the key `admit` resolves them through.
-- REQ-191 moves it to `user_emails` and drops the column, editing THIS FILE.
--
-- THE NAME IS NO LONGER A COLUMN HERE, AND THAT IS REQ-193's ARRIVING. It was
-- `display_name TEXT` — one nullable free-text field with no given name to sort
-- by, no honorific to open a letter with, and no record that a name ever
-- changed. It is `user_names` below.
CREATE TABLE IF NOT EXISTS users (
  id             TEXT PRIMARY KEY,
  tenant_id      TEXT NOT NULL,
  email          TEXT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'active',
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

-- Identity is decided HERE, once, for builder users and captured contacts alike.
-- Scoped to the business rather than global: two unrelated customers may each
-- hold a contact with the same address, and a global unique index would make one
-- of them unrepresentable — and would tell one business that another already
-- knows that address.
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_tenant_email ON users (tenant_id, email);

-- Read by the pipeline facet's "who did I ask who never came". Scoped by business
-- first because every read of this table already is.
CREATE INDEX IF NOT EXISTS idx_users_tenant_stage ON users (tenant_id, pipeline_stage);

-- A PERSON'S NAME, WHICH IS A TABLE AND EVERY PART OF WHICH IS OPTIONAL
-- (REQ-193, CHAT-38). The product is called 1st Contact; if it cannot hold a
-- person's name correctly it is broken at the first thing it does.
--
-- NAMES ARE TEMPORAL WHERE ADDRESSES ARE PLURAL, and the two tables look alike
-- enough that the difference is worth stating here rather than being inferred
-- from the absent column. An address is multi-valued NOW — several at once, one
-- of them primary. A name is multi-valued over TIME — exactly one current, and a
-- history that has to be searchable. So this table carries no `is_primary`, and
-- the partial unique index that would enforce *one primary address* enforces
-- *one current name* instead. Same pattern, same enforcement by constraint
-- rather than by application code, one axis removed.
--
-- "LEGAL NAME" VERSUS "WHAT THEY GO BY" IS NOT A SECOND ROW. It looks like
-- concurrent multiplicity and is not: you always know which of the two you want,
-- so it is two columns — `display_name` and `known_as`. A `kind` column that only
-- ever holds one of two values and is always filtered to a specific one is a
-- table pretending to be columns.
--
-- `display_name` IS STORED AND NEVER ASSEMBLED, and it is the only NOT NULL
-- field here. Everything else is a parse of it, kept for salutation and sorting,
-- and allowed to be empty. Rendering a name by concatenating parts is where the
-- internationalisation horror stories actually come from — mononyms (Prince,
-- Sukarno), family-name-first cultures, Spanish double surnames, patronymics —
-- and storing what to show is correct for all of them with no cultural logic at
-- all. It is also why this table can stop at seven parts instead of modelling
-- the world.
--
-- NOTHING ELSE IS NOT NULL, AND THAT IS LOAD-BEARING. A required `family_name`
-- makes a mononym unrepresentable.
--
-- `middle_names` AND NOT A MIDDLE INITIAL: an initial costs the same bytes and
-- carries strictly less — `M.` derives from `Michael`, never the reverse.
-- `suffix` IS FREE TEXT, which dissolves the *do we need 2nd, 3rd, 4th* question
-- and carries post-nominals (`PhD`, `MBE`, `RN`) in the same field; what it must
-- never become is an enum of {Jr, Sr}. `title` IS FREE TEXT AND NEVER REQUIRED,
-- because no enum survives `Dr`, `Rev`, `Cpt`, `Prof`, `Rt Hon` — and because a
-- Mr/Mrs/Ms picker asks a customer for gender and marital status this product
-- has no purpose for, which is unnecessary data under UK and EU minimisation and
-- the classic way to give offence at first contact.
--
-- THERE IS NO `sort_name`. Sorting is `COALESCE(family_name, display_name)`,
-- imperfect for *van der Berg* and accepted: a third representation of the same
-- fact is a third thing nobody maintains.
--
-- `superseded_reason` EXISTS BEFORE ANYTHING READS IT, and that is deliberate.
-- Two supersessions identical in this schema are completely different facts.
-- `corrected` means the old value was never right — a typo, an autocorrect,
-- `Marting` — kept for audit, never searched, never displayed. `changed` means a
-- genuine former name: searchable, and displayable as *formerly*. Getting it
-- wrong in the safe direction leaves a stale typo out of a search; getting it
-- wrong the other way surfaces a deadname, or greets somebody by a name they
-- deliberately left behind. `corrected` IS THE DEFAULT, because corrections are
-- common and accidental where name changes are rare and deliberate — so the
-- common case and the safe case are the same case, and a supersession recorded
-- with no reason at all is treated as a correction.
--
-- HISTORY IS DATA AND NOT A TRAIL, which is why it lives here rather than in an
-- audit log: the operator needs to FIND a person by the name they used to have —
-- *Sarah Jones; oh, she is Sarah Patel now* — and a log is not indexed for that.
--
-- THE TEXT IS REDACTABLE AND THE ROW IS NOT. Erasure (DOC-37) reaches names, and
-- what it removes is the text; the row and its timeline stay, so the record that
-- a name changed on a date survives the removal of what it was.
--
-- ONE COST THIS LEAVES IN PLACE, written down before somebody meets it in the
-- wild: names hang off `users`, which is tenant-scoped, so Bob-of-Alice's-Plumbing
-- and Bob-of-1st-Contact hold different name rows and a marriage is an update
-- once per business that knows him. That follows from DOC-42 §1 and is not a
-- defect.
CREATE TABLE IF NOT EXISTS user_names (
  id                TEXT PRIMARY KEY,
  user_id           TEXT NOT NULL,
  display_name      TEXT NOT NULL,
  known_as          TEXT,
  title             TEXT,
  given_name        TEXT,
  middle_names      TEXT,
  family_name       TEXT,
  suffix            TEXT,
  created_at        TEXT NOT NULL,
  updated_at        TEXT NOT NULL,
  -- Null while current. The partial index below is what makes that mean
  -- something.
  superseded_at     TEXT,
  -- 'corrected' or 'changed'. Null is read as 'corrected' — see above.
  superseded_reason TEXT,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- EXACTLY ONE CURRENT NAME PER PERSON, ENFORCED HERE AND NOT IN CODE. A second
-- live row is a database error rather than a list that silently picks one.
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_names_current
  ON user_names (user_id) WHERE superseded_at IS NULL;

-- The history read: every name this person has held, current or not.
CREATE INDEX IF NOT EXISTS idx_user_names_user ON user_names (user_id);

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
-- `email` NAMES ITS SUBJECT BY ADDRESS, which is a string foreign key to a
-- person and is REQ-191's to remove.
--
-- ACCESS AND MONEY ARE SEPARATE. There is no `discount_pct` here and there will
-- not be one: a comped grant is an entitlement with no subscription, a
-- discounted one is a subscription that also produces an entitlement, and
-- collapsing the two would force the access check to understand pricing.
CREATE TABLE IF NOT EXISTS entitlements (
  id           TEXT PRIMARY KEY,
  business_id  TEXT NOT NULL,
  account_id   TEXT,
  email        TEXT,
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
CREATE INDEX IF NOT EXISTS idx_entitlements_email ON entitlements (email);

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
