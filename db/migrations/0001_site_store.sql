-- REQ-143 — the site store in D1 (DOC-12 §7 phase 2).
--
-- WHAT LIVES HERE AND WHAT DOES NOT. Page definitions and `site.json` are small,
-- structured and transactional, so they are rows. Asset *bytes* are not: they
-- live in R2 and this schema holds only the pointer to them. Revision snapshots
-- likewise stay in R2, where `1c deploy` already writes them.
--
-- TENANCY IS A COLUMN, NOT A NAMING CONVENTION (DOC-10 §4.1). `tenant_id` is on
-- every row and is part of every primary key. The tenant is the account and is
-- the hard information barrier; a site is an object *inside* a tenant, selected
-- by `slug`, and is not a tenant of its own. Two accounts may therefore each own
-- a site called `home` without colliding, and a query that forgets its tenant
-- cannot silently see across the barrier — the store binds the scope into the
-- handle at construction so no call site is trusted to remember it.

CREATE TABLE IF NOT EXISTS tenants (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  -- 'active' or anything else. A tenant that is not active is a validation
  -- error at handle construction, never a handle that quietly reads nothing.
  status     TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sites (
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
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (tenant_id, slug),
  FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE
);

-- One row per page, mirroring the file-backed store's one file per page
-- (DOC-12 §3). That split is not really about files — it is the store's unit of
-- change — so it survives the move into rows unchanged, and a page edit updates
-- one row rather than rewriting the whole definition.
CREATE TABLE IF NOT EXISTS site_pages (
  tenant_id TEXT NOT NULL,
  slug      TEXT NOT NULL,
  -- The store key (`home.json`), never a path: it carries no directory
  -- component, and load order is the sort order of these names.
  name      TEXT NOT NULL,
  page      TEXT NOT NULL,
  PRIMARY KEY (tenant_id, slug, name),
  FOREIGN KEY (tenant_id, slug) REFERENCES sites (tenant_id, slug) ON DELETE CASCADE
);

-- Asset METADATA. The bytes are the R2 object at `r2_key`; this row is what
-- makes the asset listable and typed without a bucket listing on every request.
CREATE TABLE IF NOT EXISTS site_assets (
  tenant_id    TEXT NOT NULL,
  slug         TEXT NOT NULL,
  name         TEXT NOT NULL,
  r2_key       TEXT NOT NULL,
  content_type TEXT NOT NULL,
  size         INTEGER NOT NULL,
  PRIMARY KEY (tenant_id, slug, name),
  FOREIGN KEY (tenant_id, slug) REFERENCES sites (tenant_id, slug) ON DELETE CASCADE
);

-- The draft change journal, one row per record rather than one JSON blob per
-- site. The blob would be rewritten on every keystroke-settle and would grow to
-- the window's full size in one column; rows let an append be an INSERT and let
-- the window be enforced by a DELETE of what aged out.
CREATE TABLE IF NOT EXISTS site_changes (
  tenant_id TEXT NOT NULL,
  slug      TEXT NOT NULL,
  at        INTEGER NOT NULL,
  record    TEXT NOT NULL,
  PRIMARY KEY (tenant_id, slug, at),
  FOREIGN KEY (tenant_id, slug) REFERENCES sites (tenant_id, slug) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS site_changes_at ON site_changes (tenant_id, slug, at);
