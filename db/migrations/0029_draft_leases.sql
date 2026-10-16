-- [[REQ-397]] — ONE AGENT PER DRAFT FILE AT A TIME.
--
-- A row is one draft file held by one session: the site file `site.json`, a
-- page `home.json` (the whole page, or the frame of a decomposed one), a
-- section `home.json#hero`, or an asset `assets/logo.svg`. A write to a file
-- held by somebody else is refused. `holder` is the session id holding it.
--
-- A LEASE, NOT A LOCK. `expires_at` moves forward each time the holder acts;
-- a session that dies or is aborted without releasing stops renewing, and its
-- rows stop counting once they expire. Expired rows are deleted lazily on the
-- next acquire. Times are epoch milliseconds.
--
-- NOT THE SOURCE OF TRUTH FOR ANY CONTENT, and losing every row loses nothing
-- but the coordination: the draft itself is untouched.
CREATE TABLE IF NOT EXISTS draft_leases (
  site_id     TEXT    NOT NULL,
  file        TEXT    NOT NULL,
  holder      TEXT    NOT NULL,
  acquired_at INTEGER NOT NULL,
  expires_at  INTEGER NOT NULL,
  PRIMARY KEY (site_id, file),
  FOREIGN KEY (site_id) REFERENCES sites (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS draft_leases_holder ON draft_leases (site_id, holder);
