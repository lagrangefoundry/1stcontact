-- [[REQ-258]] — which of a site's hosts is *the* address. [[DOC-45]] §4.

-- WHY THERE IS A FILE AT ALL rather than an edit to `0008_site_domains.sql`:
-- that migration has been applied to the local and the remote database and
-- `wrangler d1 migrations apply` records what it has run, so an edit reaches
-- neither. Same reasoning as `0005`, `0007`, `0008`, `0009` and `0010`.

-- WHY A COLUMN IS NEEDED AT ALL, when `0008` deliberately added none.
-- `site_domains` maps host to site and stops, and that is complete for exactly
-- as long as one site has one host. This ticket makes two hosts reach one site
-- in the ordinary case rather than the exotic one: the serving mechanism writes
-- the apex AND `www`, because a customer who types `www.alicesplumbing.com`
-- into a browser must not meet a certificate error. The moment both resolve,
-- something has to say which one is the address — for the redirect between
-- them, for the URL a mailed link is composed from, and so a search engine is
-- not handed the same site twice under two names.
--
-- [[DOC-45]] §4's *"a site has exactly one address"* is a statement about the
-- CANONICAL one and never about how many hosts resolve. This column is the
-- difference between those two sentences, written down.
--
-- A BOOLEAN AND NOT A `redirects_to` HOST. A column holding another row's
-- `host` would be a pointer spelled as data — the value it names is one this
-- table already stores, so the two could disagree, and renaming is impossible
-- anyway ([[REQ-238]]: there is no update path on `host`). A flag says the one
-- thing that is actually being recorded, and the redirect target is derived by
-- asking which of this site's live hosts carries it.
--
-- DEFAULT 1, WHICH IS THE ONLY DEFAULT THAT CANNOT BREAK AN EXISTING ROW.
-- Every row in this table today is a site's only address, so every one of them
-- IS the canonical one; a default of 0 would mark them all non-canonical and
-- the serving path would 301 each of them to nothing.
ALTER TABLE site_domains ADD COLUMN canonical INTEGER NOT NULL DEFAULT 1;

-- ONE CANONICAL ADDRESS PER LIVE SITE — the integrity backstop, and the WEAKER
-- of the two statements of the rule exactly as `0007`'s and `0008`'s partial
-- indexes are. The code (`apps/control-app/src/hostname.ts`) demotes the
-- previous canonical row in the same operation that promotes the new one; what
-- this index buys is that a write which somehow bypassed that code still cannot
-- leave a site with two addresses that each claim to be the address — which
-- would make *"redirect the others to it"* resolvable only by whichever row the
-- database returned first.
--
-- PARTIAL, ON `active`, for `idx_site_domains_site_platform`'s reason exactly.
-- A revoked row leaves this index while staying in the table, so revoking a
-- site's canonical address lets the next one be promoted rather than leaving
-- the site permanently unable to hold one.
CREATE UNIQUE INDEX IF NOT EXISTS idx_site_domains_site_canonical
  ON site_domains (site_id)
  WHERE canonical = 1 AND status = 'active';
