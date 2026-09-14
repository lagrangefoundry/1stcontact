-- [[REQ-244]] — the per-contact link a gated download's mail carries.
--
-- WHY THERE IS A SIXTH FILE AT ALL, on `0004`'s reasoning. `0001_baseline.sql`
-- declares this table too, which is what a database created from scratch gets.
-- The live database ran `0001` months ago and will never run it again —
-- `wrangler d1 migrations apply` records what it has run — so editing the
-- baseline reaches nothing already deployed. This file is the half that reaches
-- it, and `IF NOT EXISTS` makes it a no-op on the databases the updated baseline
-- already created. There is no data to copy and no table to rebuild.

-- A GRANT SAYS "THIS PERSON MAY SEE WHAT THIS FORM PROMISED", AND NOTHING ELSE
-- ([[REQ-244]] §2). It is NOT a credential: it opens no session, names no
-- membership, and reaches nothing but one page and the artifacts that page
-- lists. A sign-up link is the opposite kind of thing — it creates a member, so
-- it expires and is single-use, which is what `login_tokens` above already does.
-- The two have opposite rules and are deliberately two tables rather than one
-- with a `purpose` column, because one column is all it takes for somebody to
-- make the rules the same.
--
-- IT DOES NOT EXPIRE. Delivery is at-most-once ever and there is no public
-- re-send path, so an expired link is a dead end at exactly the thing the
-- contact came for. What the token protects is a whitepaper, and the attribution
-- it buys is worth more than the secrecy an expiry would add.
--
-- `business_id` IS DERIVED FROM THE CONTACT AND NEVER SUPPLIED, exactly as it is
-- on `contact_events` and `user_acceptances`: every write is
-- `INSERT ... SELECT ... FROM users`, so a grant cannot be filed under a business
-- its contact does not belong to. It is stored rather than joined for because
-- every read is scoped by it, and a scope that needed a join is a scope somebody
-- eventually writes without.
--
-- `site_id` AND `instance_id` NAME THE FORM AND NOT ITS ARTIFACTS. What the page
-- lists is read from the site's live published definition at the moment it is
-- opened, so there is one answer to *what does this form promise* rather than a
-- denormalised copy here free to drift from it.
CREATE TABLE IF NOT EXISTS asset_grants (
  id          TEXT PRIMARY KEY,
  contact_id  TEXT NOT NULL,
  business_id TEXT NOT NULL,
  site_id     TEXT NOT NULL,
  instance_id TEXT NOT NULL,
  created_at  TEXT NOT NULL,
  -- A withdrawal that refuses independently of any date — the shape
  -- `memberships.revoked_at` already uses. There is no operator surface for it
  -- yet; the gate enforces it, so the surface is additive when erasure arrives.
  revoked_at  TEXT,
  FOREIGN KEY (contact_id) REFERENCES users (id) ON DELETE CASCADE
);

-- ONE LIVE GRANT PER (CONTACT, SITE, FORM), ENFORCED BY THE SCHEMA. A second
-- submission of the same form by the same person reuses the link rather than
-- minting a second one: the page is the same page, and two tokens for it would
-- be two answers to the question the token exists to answer.
--
-- PARTIAL, OVER THE LIVE ROWS ONLY. A revoked grant stays in the table — it is
-- the record of a link that was issued — and must not stop a later one being
-- issued for the same form.
CREATE UNIQUE INDEX IF NOT EXISTS idx_asset_grants_live
  ON asset_grants (contact_id, site_id, instance_id) WHERE revoked_at IS NULL;

-- "EVERY LINK THIS BUSINESS HAS ISSUED", which is what a revocation surface and
-- an erasure pass will both ask. Scoped by business first because every read of
-- this table is.
CREATE INDEX IF NOT EXISTS idx_asset_grants_business
  ON asset_grants (business_id, contact_id);
