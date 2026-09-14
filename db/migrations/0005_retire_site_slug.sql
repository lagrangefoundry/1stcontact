-- [[REQ-236]] — retire `sites.slug`. A site is addressed by its key.

-- WHY THERE IS A FILE AT ALL RATHER THAN AN EDIT TO `0001_baseline.sql`. The
-- baseline has been applied to the local and the remote database, and
-- `wrangler d1 migrations apply` records what it has run — so an edit reaches
-- neither. It would also leave both databases holding `slug TEXT NOT NULL` with
-- no default while the store had stopped writing it, and the first symptom of
-- that is every `createDraft` failing on a constraint nobody can see from the
-- code. The four statements below are the same four against a database created
-- an hour ago and one created from scratch after this lands.
--
-- WHY NOT A CREATE-COPY-DROP-RENAME REBUILD, WHICH IS WHAT `0002` DOES. `0002`
-- rebuilds `sessions`, which nothing references. `sites` is referenced by
-- `site_pages`, `site_assets`, `site_changes` and `site_revisions`, and SQLite
-- rewrites foreign-key clauses across a table rename — so a rebuild here is a
-- correctness question about four other tables rather than about this one.
-- `DROP COLUMN` touches only the column, and is available because the one index
-- that used it is dropped first.

-- FIRST, BECAUSE `DROP COLUMN` REFUSES AN INDEXED COLUMN. This is the index that
-- made a chosen name unique inside a business, which is the constraint that made
-- the slug a key doing an attribute's job ([[DOC-45]] §6).
DROP INDEX IF EXISTS idx_sites_tenant_slug;

ALTER TABLE sites DROP COLUMN slug;

-- WHAT THE PORTAL IS FOUND BY NOW ([[REQ-236]]). `/account` serves a portal a
-- business may author into its own store, and it was found under the reserved
-- slug `portal` — a magic name a customer could have collided with, and one that
-- cannot survive the column above. `kind` is a closed enum the CODE declares:
-- it is not typed by anyone, it addresses nothing on its own, and the site is
-- still named by its key alone.
--
-- DEFAULTED RATHER THAN BACKFILLED. No database holds an authored portal —
-- nothing in the product creates one — so every existing row is a `site` and
-- there is no `slug = 'portal'` case to carry across. Reading the old column to
-- decide would also make this statement unreadable against a database that never
-- had it.
ALTER TABLE sites ADD COLUMN kind TEXT NOT NULL DEFAULT 'site';

-- REPLACES THE INDEX DROPPED ABOVE, and not only in name. Every `sites` read is
-- now `WHERE tenant_id = ?` with a key or a kind beside it — the business's own
-- site, the business's portal, the erasure enumeration — and the unique index
-- was silently serving all of them. Without this they become table scans.
CREATE INDEX IF NOT EXISTS idx_sites_tenant_kind ON sites (tenant_id, kind);
