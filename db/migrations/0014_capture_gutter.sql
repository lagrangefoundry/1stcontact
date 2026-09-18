-- [[REQ-267]] / [[DOC-54]] §2.4 — THE TEST GUTTER'S MARK, AT REST.
--
-- The product's promise is that a business's site WORKS, and the only test that
-- can prove a form works is one that fills it in. That test writes to
-- production: a real contact, a real acceptance, a real event, a real message.
-- What stands between "we can prove it works" and "we have polluted the
-- customer's record" is a mark on the row.
--
-- WHY NOW, AHEAD OF ANYTHING THAT READS THE SPINE. A marker retrofitted onto
-- rows that already exist is a marker with a hole in it — every read written
-- before the flag existed reads unfiltered, and nobody notices, because a bot
-- lead looks exactly like a lead. [[REQ-235]] is about to build the timeline and
-- [[REQ-267]] is about to start writing to it, so this is the last moment the
-- columns are free.
--
-- WHY A FILE rather than an edit to the baseline: every migration here has been
-- applied to the local and the remote database and `wrangler d1 migrations
-- apply` records what it has run, so an edit reaches neither. Same reasoning as
-- `0005` through `0013`.
--
-- The ticket calls this migration `0013`. That number was taken by [[REQ-266]]'s
-- revision-immutability trigger between the ticket being written and this file
-- being cut; the number is bookkeeping and the content is what the ticket
-- specifies.

-- ---------------------------------------------------------------------------
-- The four tables the capture chain writes
-- ---------------------------------------------------------------------------
--
-- `NOT NULL DEFAULT 0` IS NOT TIDINESS. A nullable flag makes an unstamped row
-- ambiguous under three-valued logic, and ambiguity in the reaper's delete
-- predicate is how a real contact gets collected. Every existing row is real,
-- which is true and is what the default says.
--
-- THE RUN ID IS NULLABLE, and that asymmetry is deliberate. `synthetic` answers
-- a question every read asks and must never be unknown; the run id answers
-- "which probe run produced this", which a real row has no answer to. A row that
-- is synthetic with no run id is a leak the sweep still collects — which is
-- exactly why the sweep keys on the flag and never on a run registry
-- ([[DOC-54]] §2.7).
--
-- NOT A FIELD INSIDE A JSON BAG. D1 cannot index into one, and this predicate is
-- on every read.
ALTER TABLE users ADD COLUMN synthetic INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN run_id TEXT;

-- ON THE EVENT AS WELL AS THE CONTACT, AND THEREFORE NEVER A JOIN. A synthetic
-- contact implies its events, so this column is redundant in the common case. It
-- is carried anyway because the alternative is a join to `users` in the hot read
-- path to answer a predicate every timeline read asks — and because a synthetic
-- message from a REAL contact's address is a row whose mark comes from the
-- traffic rather than from the parent ([[REQ-267]] §7). A column is paid once at
-- write; a join is paid on every page load.
ALTER TABLE contact_events ADD COLUMN synthetic INTEGER NOT NULL DEFAULT 0;
ALTER TABLE contact_events ADD COLUMN run_id TEXT;

ALTER TABLE user_acceptances ADD COLUMN synthetic INTEGER NOT NULL DEFAULT 0;
ALTER TABLE user_acceptances ADD COLUMN run_id TEXT;

ALTER TABLE asset_grants ADD COLUMN synthetic INTEGER NOT NULL DEFAULT 0;
ALTER TABLE asset_grants ADD COLUMN run_id TEXT;

-- ---------------------------------------------------------------------------
-- The run registry — what makes a marker verifiable at all
-- ---------------------------------------------------------------------------
--
-- WHY THE INBOUND CHANNEL NEEDS ONE AND THE REQUEST PATH DOES NOT. A request
-- carries a SIGNED marker ([[DOC-54]] §2.1): unforgeable, time-bounded, verified
-- against a platform secret. An email address carries no signature — a local
-- part is an unsigned bearer string that travels through SMTP hops and spam
-- filters in the clear. Two of §2.1's three checks therefore have no carrier
-- here, and the replacement is a lookup: the run id must name a run that exists
-- and is still open.
--
-- WITHOUT THE WINDOW A LEAKED RUN ID IS A PERMANENT MAKE-MY-MAIL-INVISIBLE
-- TOKEN for anyone who ever saw one, and "mark real traffic as test" is the
-- attack [[DOC-54]] §2.1 names as the one worth closing — a caller who could do
-- it could make a competitor's leads vanish from their own dashboard.
--
-- PLATFORM-LEVEL AND NOT PER BUSINESS. A run is a probe run; it may touch
-- several businesses and it belongs to none of them.
CREATE TABLE IF NOT EXISTS synthetic_runs (
  -- `newId('run')` — the one minter ([[REQ-190]]), never a second shorter
  -- format. `run_<32 hex>` is 36 characters, which is what makes
  -- `bfm+run_<32 hex>@…` fit inside a 64-character local part with room to spare.
  id         TEXT PRIMARY KEY,
  opened_at  TEXT NOT NULL,
  -- WHEN THE WINDOW SHUTS. A stamp rather than a duration, so "is this run open"
  -- is one comparison at the door and does not depend on when anybody read the
  -- row. A run whose window has closed is indistinguishable, to the marker
  -- check, from one that never existed — which is the answer both deserve.
  closes_at  TEXT NOT NULL,
  -- What the run was for, for a human reading the table months later. Never read
  -- by code.
  note       TEXT
);
