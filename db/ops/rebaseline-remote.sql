-- Rebaseline the REMOTE D1 (EPIC-16).
--
-- WHY. Production applied `0001_baseline.sql` at 2026-09-06 17:39:19, and the
-- file was edited twelve times afterwards — the baseline's own header says its
-- siblings "EDIT IT RATHER THAN FOLLOW IT", on the stated premise that it "has
-- never been applied". It had. `d1_migrations` records the NAME, so wrangler
-- will never re-run it, and 0002 opens with `ALTER TABLE sessions RENAME TO
-- sessions_pre_rotation` against a database whose baseline predates `sessions`.
-- There is no forward path: the applied migration and the file on disk are
-- different schemas under one name.
--
-- WHY A WIPE IS THE MECHANISM. The remote database holds 0 sites, 0 users,
-- 0 revisions and one vestigial tenant row. This is REQ-190's own argument
-- verbatim — "there is no real data anywhere, so the remote database is wiped
-- rather than migrated" — and it is the last moment it will be true for free.
--
-- WHAT IS NOT DROPPED. `_cf_KV` is Cloudflare's, and `sqlite_sequence` is
-- SQLite's own and is managed by the engine.
--
-- AFTER THIS RUNS, `d1_migrations` is gone, so
--   npx wrangler d1 migrations apply DB --remote
-- replays 0001…0018 from empty. That chain is verified to apply clean from an
-- empty database.

DROP TABLE IF EXISTS site_assets;
DROP TABLE IF EXISTS site_changes;
DROP TABLE IF EXISTS site_pages;
DROP TABLE IF EXISTS site_revisions;
DROP TABLE IF EXISTS sites;
DROP TABLE IF EXISTS memberships;
DROP TABLE IF EXISTS entitlements;
DROP TABLE IF EXISTS counters;
DROP TABLE IF EXISTS tickets;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS tenants;
DROP TABLE IF EXISTS d1_migrations;
