-- REQ-162 — the product ticket store (DOC-38 §6, DOC-10 §8).
--
-- The site store (0001/0002) holds *sites*: page definitions, `site.json`,
-- published revisions. This is the other half of the platform's memory — every
-- piece of client material, every capture bundle, every design brief, and every
-- chat session, as a ticket. Until now none of it had anywhere to live.
--
-- THE DDL IS THE COMPONENT'S, TRANSCRIBED — NOT AUTHORED HERE.
-- `@lagrangefoundry/ticketing` owns this schema and exports it as
-- `SCHEMA_STATEMENTS`, an ordered list applied via `db.batch()`. Wrangler's
-- migration runner reads `.sql` files off disk and cannot import a JS constant,
-- so the statements are copied here — and a copy is a fork unless something
-- checks it. `test_UAT_FC_REQ-162_ticket_schema` asserts every statement in
-- `SCHEMA_STATEMENTS` appears below, so an upstream schema change fails this
-- repository's suite instead of silently leaving the deployed database a
-- version behind.
--
-- `IF NOT EXISTS` throughout, exactly as upstream writes it: the component's
-- own `applySchema` is idempotent and re-running it against a migrated database
-- must stay a no-op.

-- Ticket data. `uid` is globally unique and OPAQUE — `tenant_id` is a separate
-- column and is never parsed out of it (DOC-8 §6.4/§12.7). `fields` and `links`
-- are opaque JSON text; `body` is a text column (R2 offloading is deferred).
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

-- The control-plane tenant registry (DOC-8 §6.2).
--
-- IT ALREADY EXISTS, and that is the one place this migration is not a
-- transcription. `0001_site_store.sql` created `tenants` for the site store, so
-- the statement above it is a NO-OP here — `IF NOT EXISTS` sees the site
-- store's table and leaves it alone, INCLUDING its lack of a `config` column.
--
-- That is not a cosmetic difference. `Accessor.putTenant` INSERTs `config`, so
-- without the ALTER below the first tenant registration through the ticket
-- store fails with `no such column: config` — a schema drift that the migration
-- appears to have fixed and has not. The ALTER is unconditional because the
-- migration order is not in doubt: 0001 always runs first and always creates
-- the column-less table.
--
-- ONE REGISTRY, NOT TWO. The site store and the ticket store answer to the same
-- `tenants` table on purpose. The tenant is the hard information barrier
-- (DOC-10 §4.1) and a deployment must not be able to hold a tenant that one
-- store considers active and the other has never heard of.
CREATE TABLE IF NOT EXISTS tenants (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'active',
  config     TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL
);

-- The reconciliation described above. NOT NULL is legal on an added column
-- because a non-null default is supplied, which is also what backfills the
-- rows 0001 already wrote.
ALTER TABLE tenants ADD COLUMN config TEXT NOT NULL DEFAULT '{}';


-- Per-(tenant, type) human-id counters (DOC-8 §6.4). Incremented atomically so
-- two tickets can never collide on a human id (e.g. `MAT-1`).
CREATE TABLE IF NOT EXISTS counters (
  tenant_id TEXT    NOT NULL,
  type      TEXT    NOT NULL,
  value     INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (tenant_id, type)
);


-- The change log (REQ-136 / DOC-24 §6). One row per ticket write, inserted in
-- the **same batch** as the write itself — which is what makes the log the
-- storage layer's own product rather than something a caller has to remember to
-- keep in step (DOC-24 §2, principle 2).
--
-- `seq` is the global monotonic cursor DOC-8 Appendix G pre-authorises,
-- alongside the per-ticket `version` that stays CAS-only. AUTOINCREMENT rather
-- than a bare rowid because pruning deletes rows, and a reused id would hand two
-- different writes the same cursor position.
--
-- `changed` carries the PRIOR values of the fields that moved — the one thing
-- that cannot be recovered after the fact. `after` carries the filterable
-- surface, so `enter`/`exit` classification is a pure function of a single row.
-- Bodies are in neither: a log carrying bodies would be larger than the store
-- (DOC-24 §6.2).
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

-- The tail read: `seq > cursor` within one tenant's scope.
CREATE INDEX IF NOT EXISTS idx_ticket_changes_tenant_seq
  ON ticket_changes (tenant_id, seq);

-- Exactly one record per write, enforced by the schema. A write produces exactly
-- one new `version` for its ticket, so `(tenant_id, uid, version)` identifies it
-- uniquely. The writer inserts `OR IGNORE` against this index, which is what
-- makes a lost compare-and-set race unable to log a second record for a version
-- another writer already logged.
CREATE UNIQUE INDEX IF NOT EXISTS idx_ticket_changes_write
  ON ticket_changes (tenant_id, uid, version);

-- The retention floor (DOC-24 §6.4). Pruning deletes rows; this remembers how
-- far it got, so a consumer whose cursor predates the window is told `reset`
-- rather than served a partial history it cannot tell from a complete one.
CREATE TABLE IF NOT EXISTS ticket_change_floor (
  tenant_id      TEXT PRIMARY KEY,
  pruned_through INTEGER NOT NULL DEFAULT 0
);
