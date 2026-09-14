-- [[REQ-238]] — the host→site mapping table. [[DOC-45]] §5, verbatim.

-- WHY THERE IS A FILE AT ALL rather than an edit to `0001_baseline.sql`: the
-- baseline has been applied to the local and the remote database and
-- `wrangler d1 migrations apply` records what it has run, so an edit reaches
-- neither. Same reasoning as `0005` and `0007`.

-- THE HOST IS AN ATTRIBUTE WITH A UNIQUE INDEX AND NEVER A PRIMARY KEY, and
-- that is [[REQ-190]]'s rule surviving contact with the one value on this
-- product that genuinely is globally unique. `alice.1stc.site` is a name
-- somebody chose and typed, so it is an attribute; DNS is a global namespace
-- whether we like it or not, so it also has to be unique. Both facts are true
-- and they are recorded separately — a surrogate `id` the system mints, and an
-- index that refuses a second row for one host. Keying the table by `host`
-- instead would have been the same constraint with the rule broken for free.
--
-- A MAPPING TABLE WITH TWO ROWS FOR ONE HOST IS SIMPLY BROKEN, which is the
-- whole argument for the index. A request arrives carrying exactly one `Host:`
-- header and the answer has to be exactly one site; two rows makes "which site
-- is this" resolvable only by whichever the database returned first.
--
-- AND IT IS THE AUTHORITY, NOT A BACKSTOP. [[REQ-238]] states the race in the
-- terms this index settles: two customers may check `alice` in the same second
-- and both be told yes, because a check reserves nothing. The loser is refused
-- at the moment of claiming, BY THIS INDEX, and told *"that one went while you
-- were deciding"*. That is the opposite direction from
-- `0007_business_name_unique.sql`, where the code refuses first and the index
-- exists so a write that bypassed the code still cannot corrupt the table.
-- Here the index decides and the code reports what it decided.
CREATE TABLE IF NOT EXISTS site_domains (
  -- 128 bits from a CSPRNG (`newId`, `tools/generate/src/store/ids.ts`),
  -- prefixed `dom` so a value read in a log says which table it came from.
  id         TEXT PRIMARY KEY,
  -- THE SITE THIS HOST REACHES, BY ITS KEY. [[DOC-45]] §3 — a host names a
  -- SITE. [[DOC-45]] §11 item 4 asked whether the `1stc.site` label was per
  -- site or per business and [[EPIC-4]] settled it *per business, one at a
  -- time*; those two are not in tension, because "at most one" is a rule about
  -- how many rows a business may hold and this column is about what a row
  -- points at. With one site per business the distinction is not observable,
  -- and it becomes observable the day a site selector lands — at which point
  -- this column already says the right thing and the rule is the one that
  -- moves.
  --
  -- NOT A FOREIGN KEY, matching every other cross-table reference in this
  -- schema. The `sites` row is the site's own; a host outliving the site it
  -- named is a revocation question rather than a referential one, and it is
  -- answered by `status` below.
  site_id    TEXT NOT NULL,
  -- THE WHOLE HOST AND NEVER THE LABEL. `alice.1stc.site`, not `alice`. The
  -- column has to hold a custom domain too ([[EPIC-6]]), and a schema that
  -- stored the label would need a second column saying which apex to append —
  -- which is a join between two columns to answer the question a request asks
  -- in one string. It is also what the customer is shown and is choosing, and
  -- storing the thing they were shown is what makes "the choice is final" a
  -- statement about a value rather than about a rendering of one.
  host       TEXT NOT NULL,
  -- `platform` — a label under this product's own apex — or `custom`, a domain
  -- the business owns ([[EPIC-6]], not built). A CLOSED ENUM THE CODE
  -- DECLARES, like `sites.kind` in `0005`: SQLite would enforce a CHECK and
  -- then a third kind would be a migration rather than a constant.
  --
  -- THE COLUMN EXISTS SO THE PUBLISH GATE CAN BE WRITTEN OVER KINDS RATHER
  -- THAN OVER THIS ONE. *"Does this site have at least one address"* is the
  -- question, and `if (!hostname) refuse` becomes a wrong refusal the day
  -- custom domains land. One kind is implemented today; the check already does
  -- not name it.
  kind       TEXT NOT NULL,
  -- `active`, or `revoked`.
  --
  -- REVOCATION IS WHY THIS IS HERE AND IT IS NOT SPECULATIVE ([[TODO-6]] §2:
  -- *"Revocation must exist from day one"*). Finality is what creates the need:
  -- an owner cannot change their own hostname, so a hostname that has to go —
  -- a bank's name, a government's, ours — can only go by our hand. EVERY READ
  -- IS FILTERED TO `active`; the column without the filter would be decoration.
  --
  -- THE ROW STAYS, WHICH IS HOW NOTHING IS EVER RE-ISSUED. A revoked host is
  -- still a row, so the unique index still refuses it to the next person who
  -- asks — the same property that makes a CLAIMED host permanent, obtained
  -- from the same index rather than from a second list of burnt names.
  status     TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL
);

-- THE AUTHORITY. See the table comment: this is what decides a race between two
-- claims, and the loser's refusal is a report of what this index said.
CREATE UNIQUE INDEX IF NOT EXISTS idx_site_domains_host ON site_domains (host);

-- ONE LIVE PLATFORM ADDRESS PER SITE — the integrity backstop, and deliberately
-- the WEAKER of the two statements of the rule, exactly as
-- `0007_business_name_unique.sql` is. [[EPIC-4]] settled [[DOC-45]] §11 item 4
-- as *per business, one at a time*, and a business may eventually hold several
-- sites — so the rule the CODE enforces (`apps/control-app/src/hostname.ts`,
-- over the business) refuses strictly more than this index does. What this buys
-- is that a write which somehow bypassed that code still cannot leave one site
-- answering to two platform addresses, which is [[DOC-45]] §4's *"a site has
-- exactly one address"* made unbreakable rather than merely intended.
--
-- PARTIAL, ON `active`, WHICH IS WHAT MAKES REVOCATION SURVIVABLE. A revoked
-- row leaves this index while staying in the table — so the business can claim
-- a replacement, and the host it lost is still refused to everybody by the
-- unique index above. Without the predicate, revoking a hostname would leave a
-- business permanently unable to publish.
CREATE UNIQUE INDEX IF NOT EXISTS idx_site_domains_site_platform
  ON site_domains (site_id)
  WHERE kind = 'platform' AND status = 'active';

-- WHAT THE PUBLISH GATE READS. Every publish asks whether the site it is about
-- to freeze has an address, so this is on the hot path of the one operation a
-- customer waits on. Without it that is a table scan of every host ever issued.
CREATE INDEX IF NOT EXISTS idx_site_domains_site ON site_domains (site_id);
