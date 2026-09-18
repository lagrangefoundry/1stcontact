-- [[REQ-260]] — every DNS change this product makes, and what it takes to undo
-- one. The assistant's mutations, and the card's anchor.

-- WHY THERE IS A FILE AT ALL rather than an edit to an earlier migration: every
-- one of them has been applied to the local and the remote database and
-- `wrangler d1 migrations apply` records what it has run, so an edit reaches
-- neither. Same reasoning as `0005`, `0007`, `0008`, `0009`, `0010`, `0011` and
-- `0012`.

-- WHAT THIS TABLE IS FOR, and it is three things at once.
--
-- IT IS THE UNDO. An operation touches a SET of records, so the row holds the
-- set as it was (`before_set`) and the set as this operation left it
-- (`after_set`), and undo is compare-and-swap over the second before restoring
-- the first. That is the whole of its safety: it is not a time horizon, because
-- elapsed time is a proxy for the real question in both directions — a record
-- nothing has touched for a year reverts perfectly safely, and one something
-- else changed ten minutes ago does not.
--
-- IT IS THE CUSTOMER-FACING HISTORY. The card in the conversation scrolls away;
-- `summary` is the sentence it said, in their nouns, and the settings surface
-- reads it back. Which is why the sentence is STORED rather than composed at
-- read time from the record set: a sentence rebuilt later from a diff is a
-- sentence nobody wrote, and the one the customer was shown is the one the
-- history owes them.
--
-- AND IT IS [[EPIC-7]]'s HANDOFF. `after_set` is the DECLARED TARGET — what
-- this product believes those records should say — and `suppressed_until` is the
-- propagation window: *"I just changed this, expect the world to disagree until
-- T"*. Specified here, consumed there. Nothing in this repository reads them for
-- that purpose yet, and the column exists so that when something does, it is
-- reading a value that was written at the moment of the change rather than
-- inferred afterwards.
CREATE TABLE IF NOT EXISTS dns_changes (
  -- 128 bits from a CSPRNG (`newId`), prefixed `dnc` so a value read in a log
  -- says which table it came from.
  id              TEXT PRIMARY KEY,
  -- WHOSE CHANGE THIS IS. A business, like `sending_domains` and for its reason:
  -- the zone is an asset of the ACCOUNT, and configuring what it says is the
  -- business's doing. The history the customer reads is their business's.
  business_id     TEXT NOT NULL,
  -- THE ZONE THE RECORDS LIVE IN — ours (`zones.id`), never Cloudflare's, on
  -- `0012`'s reasoning about vendor ids.
  zone_id         TEXT NOT NULL,
  -- WHICH OF THE CLOSED SET THIS WAS — `allow_sender`, `add_verification`,
  -- `point_subdomain`, `restore_signing_key`, `publish_dmarc_monitoring`, and
  -- `undo` for the entry an undo writes about itself.
  --
  -- A CLOSED ENUM THE CODE DECLARES, like `zones.origin`: SQLite would enforce a
  -- CHECK and then a sixth operation would be a migration rather than a constant.
  operation       TEXT NOT NULL,
  -- WHAT THE CUSTOMER WAS TOLD, in their nouns. Never a record type — if a
  -- customer is being shown one, we have failed ([[REQ-259]]).
  summary         TEXT NOT NULL,
  -- THE RECORDS AS THEY WERE, normalised, as JSON. An entry with no prior
  -- reading at a name is that name absent, which is what makes undo able to
  -- DELETE a record this operation created rather than only to restore one.
  before_set      TEXT NOT NULL DEFAULT '[]',
  -- THE RECORDS AS THIS OPERATION LEFT THEM, normalised, as JSON. Undo compares
  -- the live zone to this and refuses unless every member still matches.
  --
  -- NORMALISED AND NEVER CLOUDFLARE'S RECORD IDS. Cloudflare normalises TXT
  -- quoting, trailing dots and case, and a record deleted and recreated with an
  -- identical value takes a new id and has not drifted — so a byte-exact or
  -- id-based compare reports drift where nothing changed, undo then refuses
  -- always, and the feature is useless rather than dangerous, which is the
  -- failure mode nobody notices until the day they need it.
  after_set       TEXT NOT NULL DEFAULT '[]',
  -- WHEN THE WORLD MAY BE EXPECTED TO AGREE — the propagation suppression
  -- window's end. See the table comment.
  suppressed_until TEXT NOT NULL,
  -- THE CHANGE THIS ONE UNDID, or NULL. An undo IS a change: it writes its own
  -- row, opens its own window, and appears in the same history — otherwise the
  -- history lies about what the zone has been, and an undo cannot be undone.
  undoes          TEXT,
  -- WHEN THIS CHANGE WAS UNDONE, or NULL. A change is undoable once; the second
  -- press is refused with a sentence rather than replaying a restore against a
  -- zone that already holds it.
  undone_at       TEXT,
  created_at      TEXT NOT NULL
);

-- WHAT THE HISTORY AND THE CARD BOTH READ BY: one business's changes, newest
-- first.
CREATE INDEX IF NOT EXISTS idx_dns_changes_business ON dns_changes (business_id, created_at);

-- WHAT [[EPIC-7]] WILL READ BY: every declared target in one zone.
CREATE INDEX IF NOT EXISTS idx_dns_changes_zone ON dns_changes (zone_id, created_at);
