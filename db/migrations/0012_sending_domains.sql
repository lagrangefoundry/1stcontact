-- [[REQ-259]] — a customer's domain, set up to send. The toggle's state.

-- WHY THERE IS A FILE AT ALL rather than an edit to an earlier migration: every
-- one of them has been applied to the local and the remote database and
-- `wrangler d1 migrations apply` records what it has run, so an edit reaches
-- neither. Same reasoning as `0005`, `0007`, `0008`, `0009`, `0010` and `0011`.

-- WHY THIS IS NOT A COLUMN ON `site_domains`. That table holds HOSTS — the apex
-- and its `www` are two rows, and a deeper label is a third — and sending is a
-- property of the DOMAIN, which is exactly one of them. A column there would
-- have to be nullable on every row but one and would leave "is sending on"
-- answerable differently depending on which of a site's rows you happened to
-- read.
--
-- AND IT IS NOT A COLUMN ON `zones` EITHER, for the opposite reason: a zone is
-- an asset of the ACCOUNT and exists before any site points at it, whereas
-- sending is configured by a business for its own mail and comes down when that
-- business releases the domain. Same subject, different lifecycle.
CREATE TABLE IF NOT EXISTS sending_domains (
  -- 128 bits from a CSPRNG (`newId`), prefixed `snd` so a value read in a log
  -- says which table it came from. Ours and never Resend's — `provider_id`
  -- below is a perfectly good unique value and using it as the key would be
  -- data-as-key wearing a vendor's badge ([[REQ-190]], and `0010`'s own note
  -- about `cf_zone_id`): it changes when a domain is deleted and re-registered,
  -- which is what a release followed by a re-attach actually does.
  id           TEXT PRIMARY KEY,
  -- WHOSE SENDING THIS IS. A business, not an account: the pool is the
  -- account's and the assignment is the business's ([[REQ-259]], `0010`).
  business_id  TEXT NOT NULL,
  -- THE ZONE THE RECORDS WERE WRITTEN INTO, so taking them down again does not
  -- have to re-derive which zone a domain belongs to at the moment the customer
  -- is least likely to forgive a mistake.
  zone_id      TEXT NOT NULL,
  -- THE DOMAIN ITSELF, whole and lower-cased. `alicesplumbing.com`.
  domain       TEXT NOT NULL,
  -- RESEND'S ID FOR THE REGISTRATION, or NULL before one exists. Every later
  -- call about this domain — verify, poll, unregister — is addressed by it.
  provider_id  TEXT,
  -- WHERE THE THIRD WAIT GOT TO: `pending`, `verified` or `failed`.
  --
  -- A COLUMN AND NOT A DERIVATION. Resend is the authority and is asked while
  -- the answer is `pending`, but a surface that had to reach a third party to
  -- draw itself would show a spinner every time somebody opened Settings — and
  -- would show nothing at all on a deployment whose key had been rotated.
  status       TEXT NOT NULL,
  -- DID WE WRITE THE `_dmarc` RECORD?
  --
  -- THE COLUMN THAT STOPS RELEASE DOING HARM. `_dmarc` is the one record in the
  -- set that can already exist, belonging to somebody else's sending — so it is
  -- written only when absent, and it is REMOVED only when this says we are the
  -- ones who wrote it. Without this flag, releasing a domain would delete a
  -- policy the customer's other provider depends on, silently, months later.
  dmarc_ours   INTEGER NOT NULL DEFAULT 0,
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL
);

-- ONE SENDING CONFIGURATION PER DOMAIN. Two rows for one domain would mean two
-- businesses each believing they had configured its mail, and the second one's
-- release would take the first one's records down.
CREATE UNIQUE INDEX IF NOT EXISTS idx_sending_domains_domain ON sending_domains (domain);

-- WHAT THE SURFACE AND THE SENDER BOTH READ BY. Both ask "what does this
-- business send as", and neither knows a domain before it has the answer.
CREATE INDEX IF NOT EXISTS idx_sending_domains_business ON sending_domains (business_id);
