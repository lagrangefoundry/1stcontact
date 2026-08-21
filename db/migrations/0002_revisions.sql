-- REQ-149 — publishing in the cloud: the revision record, and who owns a
-- published address.
--
-- WHAT CHANGED IN THE MODEL. Until now a published revision existed only as
-- `sites/<slug>/manifest.json` in R2, written by `1c deploy` from an operator's
-- laptop. That object is GONE. D1 is the only record of what is published, R2
-- holds bytes and nothing authoritative, and the two can no longer disagree
-- about which revision is live because only one of them has an opinion.
--
-- LIVE IS DERIVED, NEVER STORED. There is no `live` column and no head pointer
-- anywhere below: the live revision is the highest `id` for a site, exactly as
-- DOC-12 §4 specifies ("No `head` field — live = highest id"). REQ-7 dropped a
-- `published_revision_id` column for this reason and REQ-149 declines to
-- reintroduce it in a new spelling. A stored pointer is a second place for one
-- fact to live, and the manifest is being deleted for precisely that.

-- The draft's lineage pointer — the DOC-12 `.draft-base.json` sidecar, as a
-- column. Distinct from "the live revision" and only usually equal to it: a
-- checkout of an older revision re-parents the draft onto THAT one, and the
-- difference is what the next publish records as `based_on`.
ALTER TABLE sites ADD COLUMN base_revision INTEGER;

-- One row per published revision. Immutable once written: nothing updates a
-- row here, and the only DELETE is the one that drops a whole site.
CREATE TABLE IF NOT EXISTS site_revisions (
  tenant_id    TEXT NOT NULL,
  slug         TEXT NOT NULL,
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
  -- by its id, and every R2 key and public URL is built from that. This answers
  -- the question the change list cannot: are these the same bytes?
  sha          TEXT NOT NULL,
  PRIMARY KEY (tenant_id, slug, id),
  FOREIGN KEY (tenant_id, slug) REFERENCES sites (tenant_id, slug) ON DELETE CASCADE
);

-- WHO OWNS A PUBLIC ADDRESS (REQ-149 D2).
--
-- The draft side is tenanted to the bone — `draft/<tenant>/<slug>/…` in R2, every
-- row above keyed `(tenant_id, slug)` — so two accounts may each own a site
-- called `home` and neither can see the other's. The PUBLISHED side has no
-- tenant anywhere: `/site/<slug>/` is the public URL grammar and
-- `sites/<slug>/rev/NNNN/…` is the layout beneath it.
--
-- That was safe while the only writer was `1c deploy` on one operator's laptop.
-- It stops being safe the moment the writer is a multi-tenant Worker: tenant B
-- publishing `home` would overwrite tenant A's live site, silently and
-- completely.
--
-- THE PRIMARY KEY IS THE GUARANTEE. Not a check in application code that a later
-- caller could forget — the database refuses the second claim, so the first
-- publish of a slug wins and every later one by another account is turned away
-- before a byte is written.
--
-- Deliberately NOT solved by putting the tenant in the R2 key or the URL. That
-- would change every published address to protect against something a single
-- unique index prevents outright. Per-tenant hostnames are the real long-term
-- answer (DOC-12 §9) and remain purely additive to this.
CREATE TABLE IF NOT EXISTS published_sites (
  slug               TEXT PRIMARY KEY,
  tenant_id          TEXT NOT NULL,
  first_published_at TEXT NOT NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE
);

-- public-site resolves a slug with no tenant in hand, so it reaches the revision
-- rows THROUGH this table. Indexed for that join rather than left to a scan.
CREATE INDEX IF NOT EXISTS published_sites_tenant ON published_sites (tenant_id, slug);
