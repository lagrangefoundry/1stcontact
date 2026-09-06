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
-- ITS SIBLINGS EDIT IT RATHER THAN FOLLOW IT. REQ-191 (`user_emails`) and
-- REQ-193 (`user_names`) have, and REQ-194 (`accounts`) and REQ-195
-- (`contact_events`) will, land in THIS file. Editing a baseline that has never been applied is not a second
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
  -- THE ACCOUNT THAT OWNS THIS BUSINESS (REQ-194, DOC-40 §2).
  --
  -- OWNERSHIP USED TO BE INFERRED FROM `memberships`, which is a join saying who
  -- may OPERATE a business and answers a different question: an account may put
  -- several people on one business, and reading "the first membership row" as the
  -- owner makes the payer whichever of them was written first. The business names
  -- its owner here, once, and `memberships` goes back to meaning only what it says.
  --
  -- NULL IS THE PLATFORM BUSINESS AND NOTHING ELSE. 1st Contact is not somebody's
  -- product — it is the thing whose product is businesses (DOC-42 §8) — so the row
  -- seeded at the bottom of this file names no owner. Setting one from
  -- `ensurePlatformOperator` would make "who owns 1st Contact" mean "who logged in
  -- first", which is worse than saying nothing.
  owner_account_id TEXT,
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

-- THE TICKET CHANGE LOG (REQ-201, upstream REQ-136, DOC-24 §2), transcribed
-- from `SCHEMA_STATEMENTS` like everything above it.
--
-- IT IS WRITTEN BY THE STORAGE LAYER, IN THE SAME BATCH AS THE WRITE IT
-- DESCRIBES, and that placement is the whole reason it is a table rather than an
-- in-process registry. The Library's most interesting writes are not made by the
-- Library — an AI description lands from `describeCapture` after the upload has
-- returned, and from a background re-describe pass after that — so the only
-- place that can see every write is the one every writer goes through.
--
-- `changed` CARRIES PRIOR VALUES, which is the one thing unrecoverable after the
-- fact: `after` plus the `from` side of each changed path IS the before-image, so
-- deciding whether a write moved a ticket into or out of a subscriber's set is a
-- pure function of one row and never a second read.
--
-- NO BODIES IN EITHER COLUMN. A body change is recorded as presence, because a
-- log carrying bodies would be larger than the store it describes — which is why
-- REQ-201's Library re-reads the one open item when an event names `body`
-- instead of painting a payload that does not exist.
CREATE TABLE IF NOT EXISTS ticket_changes (
  seq       INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id TEXT    NOT NULL,
  uid       TEXT    NOT NULL,
  human_id  TEXT,
  type      TEXT    NOT NULL,
  version   INTEGER NOT NULL,
  at        TEXT    NOT NULL,
  cause     TEXT    NOT NULL,
  changed   TEXT    NOT NULL DEFAULT '{}',
  after     TEXT
);

-- The tail read: `seq > cursor` within ONE tenant's scope. A subscription is a
-- read, so it is scoped exactly as every other read is (DOC-8 §6.6) — this index
-- is the shape that makes the scoped tail cheap as well as correct.
CREATE INDEX IF NOT EXISTS idx_ticket_changes_tenant_seq
  ON ticket_changes (tenant_id, seq);
-- EXACTLY ONE RECORD PER WRITE, ENFORCED BY THE SCHEMA. A write produces exactly
-- one new `version` for its ticket, so `(tenant_id, uid, version)` identifies it
-- uniquely and the writer's `INSERT OR IGNORE` cannot log a second record for a
-- version another writer already logged.
CREATE UNIQUE INDEX IF NOT EXISTS idx_ticket_changes_write
  ON ticket_changes (tenant_id, uid, version);

-- The retention floor (DOC-24 §6.4). Pruning deletes rows; this remembers how
-- far it got, so a consumer whose cursor predates the window is told `reset` —
-- and re-reads its set — rather than being served a partial history it cannot
-- tell from a complete one.
CREATE TABLE IF NOT EXISTS ticket_change_floor (
  tenant_id      TEXT PRIMARY KEY,
  pruned_through INTEGER NOT NULL DEFAULT 0
);

-- ---------------------------------------------------------------------------
-- Identity
-- ---------------------------------------------------------------------------

-- THE PAYER, AND THE OWNER OF BUSINESSES (REQ-194, DOC-40 §2, DOC-42 §6).
--
-- IT DID NOT EXIST, AND THE ABSENCE WAS LOAD BEARING RATHER THAN COSMETIC. The
-- account was simplified down to "a `users` row" — `findAccount` returned a
-- person, `/api/businesses` reported a person under the label `account`, and a
-- business was owned by whoever happened to hold the first membership row on it.
-- That reading cannot express what DOC-42 §6 requires: an entitlement grants an
-- ACCOUNT access to a THING, and one account may hold several people.
--
-- IT IS SCOPED TO A BUSINESS, LIKE EVERY OTHER IDENTITY ROW. "Account" is
-- relative to the business it is an account of (DOC-42 §6): Alice is an account
-- of 1st Contact, and Bob is an account of Alice's Plumbing. Defining it as "a
-- row in the platform's own tenant" would make it platform-only vocabulary,
-- which is DOC-40 §2.1 rule 1's named failure mode arriving one table lower
-- down.
--
-- `name` IS THE BILLING LABEL AND MAY BE NULL. It is the entity a receipt is
-- addressed to — "Lagrange Foundry Ltd" — which is not a person's name and is
-- not known when a contact is first captured. Null means nobody has named it.
--
-- IT CARRIES NO FOREIGN KEY TO `tenants`, matching `users`, `memberships` and
-- `entitlements`, and for the reason a key on `tenants.owner_account_id` would
-- make plain: the two tables reference each other, so one of the constraints has
-- to be the one that is written down and the other the one that is not. Neither
-- is more true than the other, so this file states neither and the UATs drive
-- the pair instead.
CREATE TABLE IF NOT EXISTS accounts (
  id         TEXT PRIMARY KEY,
  tenant_id  TEXT NOT NULL,
  name       TEXT,
  -- 'active' or anything else, exactly like `users.status`. Unconstrained TEXT
  -- so a state added when billing lands is a code change and not a migration.
  status     TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  -- The same escape valve `users` and the ticket store's rows carry: a per-account
  -- fact not worth a column and not worth a migration (a VAT number, a billing
  -- address) has somewhere to go until it earns one.
  fields     TEXT NOT NULL DEFAULT '{}'
);

-- Every account of one business, which is what an operator surface lists.
CREATE INDEX IF NOT EXISTS idx_accounts_tenant ON accounts (tenant_id);

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
-- `user_emails` below.
--
-- AND THE NAME IS NOT HERE EITHER (REQ-193). It was `display_name TEXT` — one
-- nullable free-text field with no given name to sort by, no honorific to open a
-- letter with, and no record that a name ever changed. It is `user_names` below.
-- The two are the same defect twice, differing only in the axis they are
-- multi-valued along: an address is several AT ONCE, a name is several OVER TIME.
CREATE TABLE IF NOT EXISTS users (
  id             TEXT PRIMARY KEY,
  tenant_id      TEXT NOT NULL,
  -- THE ACCOUNT THIS CONTACT BELONGS TO (REQ-194). NOT NULL, because every
  -- contact belongs to one: `invitePerson` and `ensurePlatformOperator` mint an
  -- account alongside the person, so there is no row here that names none and no
  -- reader has a missing case to handle.
  --
  -- MANY-TO-ONE, DEFAULTING TO ONE-TO-ONE. v1 puts exactly one contact on each
  -- account and nothing adds a second — but a second is a `users` row carrying an
  -- `account_id` that already exists, which is why this is a column on the person
  -- rather than a person on the account. Adding the second person later is a row,
  -- not a migration, and that is the whole of what REQ-194 buys.
  --
  -- SO NOTHING MAY READ IT AS ONE-TO-ONE. A `LIMIT 1` over an account's people,
  -- or a foreign key pointing at a person where the payer is meant, is the defect
  -- this column exists to remove — see `provisionBusiness`, which writes a
  -- membership for EVERY person on the owning account.
  account_id     TEXT NOT NULL,
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
  fields         TEXT NOT NULL DEFAULT '{}',
  -- The one foreign key REQ-194 writes down. It is a parent-child edge with no
  -- cycle in it, exactly like `user_emails` -> `users`, so it can be enforced
  -- where the `tenants` <-> `accounts` pair above could not be.
  FOREIGN KEY (account_id) REFERENCES accounts (id)
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

-- ---------------------------------------------------------------------------
-- The event spine
-- ---------------------------------------------------------------------------

-- WHAT HAPPENED TO A CONTACT, ONE ROW PER FACT (REQ-195, DOC-44 §4.1).
--
-- WHY A TABLE AND NOT A `source` COLUMN ON `users`. DOC-44 §4.1 settled that the
-- pipeline stage over-claims unless we record where a contact came from, and the
-- cheap answer fails on the example that motivated it: somebody who joined the
-- mailing list and LATER booked a consultation has two entry facts, and a column
-- keeps one. Both are events. Store the events and provenance is the earliest
-- row, every later signal survives, and the stage becomes something a rule can
-- derive rather than something a hand must remember to set.
--
-- IT IS IMMUTABLE, AND THAT IS THE WHOLE DISCIPLINE. An event says *this
-- happened, at this time*. Anything that CHANGES is state and lives elsewhere —
-- which earns its keep immediately on email: a message's delivery outcome moves
-- (queued, sent, delivered, bounced), so the message is a record with mutable
-- state and the events are `email.sent`, `email.delivered`, `email.bounced` —
-- three rows, not one row rewritten three times. Written the other way round the
-- timeline silently loses the bounce the moment a retry succeeds.
--
-- SO THERE IS NO `status` COLUMN HERE, and its absence is a falsifier rather
-- than an omission. A status on an event is the invitation to rewrite it.
--
-- `occurred_at` AND `recorded_at` ARE BOTH NEEDED. An imported contact's
-- mailing-list signup happened before we knew of it, and a bounce webhook
-- arrives after the bounce. One column would make an import read as a flood of
-- activity today, which is the reading a timeline exists to prevent.
--
-- `kind` IS A DOTTED STRING AND CARRIES NO CHECK. DOC-44 §4 says the set of
-- things that can happen to a contact grows; a constraint that has to be
-- migrated for every new one is a constraint that will be worked around. The
-- names live in `apps/control-app/src/builder/contact-events.js`, in one place,
-- where an unknown value still renders.
--
-- `ref` POINTS AT A DETAIL RECORD WHERE ONE EXISTS and is null where the event
-- is the whole fact. `list.joined` needs no detail row; `email.sent` names the
-- `email` ticket carrying what was actually sent (REQ-198). It is deliberately
-- unindexed: nothing reads events BY ref yet, and an index with no reader is a
-- guess at a query nobody has written.
--
-- `business_id` IS DERIVED FROM THE CONTACT AND NEVER SUPPLIED. Every insert is
-- `INSERT ... SELECT ... FROM users` (`contactEventInsert`), so an event cannot
-- be filed under a business its contact does not belong to. It is stored rather
-- than joined for because every read of this table is scoped by it, and a scope
-- that needed a join is a scope somebody eventually writes without.
CREATE TABLE IF NOT EXISTS contact_events (
  id          TEXT PRIMARY KEY,
  contact_id  TEXT NOT NULL,
  business_id TEXT NOT NULL,
  kind        TEXT NOT NULL,
  occurred_at TEXT NOT NULL,
  recorded_at TEXT NOT NULL,
  ref         TEXT,
  detail      TEXT NOT NULL DEFAULT '{}',
  FOREIGN KEY (contact_id) REFERENCES users (id) ON DELETE CASCADE
);

-- The timeline: one contact's history, scoped by business, in the order it
-- happened. `occurred_at` and not `recorded_at`, because the sequence a reader
-- wants is the sequence of events and not the sequence of our learning of them.
CREATE INDEX IF NOT EXISTS idx_contact_events_contact
  ON contact_events (business_id, contact_id, occurred_at);

-- "Every address that bounced this week", and every question of that shape.
-- The delivery TRANSITIONS are rows here even though the message itself is a
-- ticket (REQ-198), so the question is answered by an index over this table
-- rather than by scanning ticket fields.
CREATE INDEX IF NOT EXISTS idx_contact_events_kind
  ON contact_events (business_id, kind, occurred_at);

-- IMMUTABILITY IS THE SCHEMA'S, NOT THE APPLICATION'S. `events.ts` exports no
-- update path, but an invariant the code maintains is an invariant that
-- eventually is not maintained (DOC-45 §7) — and this failure is silent, because
-- an event edited in place leaves a timeline that reads perfectly and is untrue.
-- The database refuses instead.
--
-- UPDATE ONLY, AND DELETE DELIBERATELY LEFT ALONE. Erasure is a person's right
-- over their own data (DOC-37) and it has to reach these rows; a trigger that
-- forbade DELETE would break the cascade above and make the event spine the one
-- place a "we deleted them but kept the history" mistake could hide. What is
-- forbidden is REWRITING a fact, which is the only thing an append-only log
-- cannot survive. A correction is an appended event that supersedes, never an
-- edit of the row that was wrong.
CREATE TRIGGER IF NOT EXISTS contact_events_are_immutable
BEFORE UPDATE ON contact_events
BEGIN
  SELECT RAISE(ABORT, 'contact_events is append-only');
END;

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
-- NULL means "a per-business capacity grant with no subject", which is what
-- provisioning still writes and what makes a business's plan the business's
-- rather than its inviter's personally.
--
-- WHAT REQ-194 CHANGED IS WHAT A NON-NULL VALUE MEANS. REQ-184 held the column
-- open as an empty chair because there was no account to seat in it; the
-- subject is now an `accounts` key, so a grant naming one is reachable by that
-- key rather than by the person id an account used to be confused with.
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

-- AND ONE ON THE SUBJECT, NOW THAT THERE IS A READER (REQ-194). REQ-184 declined
-- this deliberately — "an index without a reader is a guess at a query nobody has
-- written" — and the guess is no longer needed: the detail pane asks for every
-- grant naming one account, which is `WHERE account_id = ?` and is run once per
-- person an operator opens.
CREATE INDEX IF NOT EXISTS idx_entitlements_account ON entitlements (account_id);

-- ---------------------------------------------------------------------------
-- The one seeded row
-- ---------------------------------------------------------------------------
--
-- THE PLATFORM BUSINESS, AND NOTHING ELSE. `TENANT_ID` names it and
-- `forTenant` refuses an unregistered tenant, so without this row a fresh
-- deployment answers every request from the one path that still reads the var
-- with `UnknownTenantError`.
--
-- ITS PREFIX SAYS `biz` AND NOT `acct` (REQ-194). `newId('acct')` minted BUSINESS
-- ids, so every business on the deployment read `acct_…` while the noun that
-- prefix names had no table at all. Now that accounts exist and carry keys of
-- their own, an id reading `acct_` in a log has to mean an account — so businesses
-- were reminted under `biz_` and the prefix was freed for the thing it names. The
-- hex is unchanged: a key is opaque, and reusing the digits keeps this row
-- recognisably the same business across the rename.
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
  'biz_51a6746495c8057e886ff98d4208e6b9',
  '1st Contact',
  'active',
  '{}',
  strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
);
