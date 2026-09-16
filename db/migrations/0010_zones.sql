-- [[REQ-257]] — the zones this deployment manages DNS for. [[EPIC-5]]'s floor.

-- WHY THERE IS A FILE AT ALL rather than an edit to `0001_baseline.sql`: the
-- baseline has been applied to the local and the remote database and
-- `wrangler d1 migrations apply` records what it has run, so an edit reaches
-- neither. Same reasoning as `0005`, `0007`, `0008` and `0009`.

-- WHAT THIS TABLE IS FOR, and it is not "a cache of Cloudflare". Cloudflare
-- already holds every zone in the account and will happily list them; what it
-- cannot hold is WHOSE each one is. In its model every zone in the account is
-- equally ours — that is the whole point of the arrangement — so there is no
-- field on a zone meaning *this belongs to customer 47* and no way to derive
-- one. The association is a fact we record, and this table is where it is
-- recorded.
--
-- WHICH MAKES `origin` THE LOAD-BEARING COLUMN. The only reliable source for
-- whose a zone is, is HOW IT GOT HERE, and each of the three customer routes
-- carries an account identity at the moment it happens: we registered it and
-- somebody paid; they pointed nameservers at us while logged in; an operator
-- attached an existing one by hand. `origin` is written once, at that moment,
-- and is never derived afterwards — a zone whose origin was inferred by reading
-- something back from Cloudflare is [[REQ-257]]'s first falsifier.
--
-- AND IT IS WHAT OFFBOARDING READS. A domain we registered leaves differently
-- from one the customer pointed at us, and a zone with no origin recorded
-- cannot be offboarded safely at all.
CREATE TABLE IF NOT EXISTS zones (
  -- 128 bits from a CSPRNG (`newId`, `tools/generate/src/store/ids.ts`),
  -- prefixed `zon` so a value read in a log says which table it came from.
  --
  -- OURS AND NEVER CLOUDFLARE'S. `cf_zone_id` below is a perfectly good unique
  -- identifier and using it as the key would be data-as-key wearing a vendor's
  -- badge ([[REQ-190]]): it is a value somebody else mints, it changes when a
  -- zone is deleted and re-added — which is exactly what [[EPIC-5]]'s on-ramp 3
  -- requires — and it would put a migration between us and a second DNS
  -- provider.
  id           TEXT PRIMARY KEY,
  -- WHOSE THIS ZONE IS, BY ACCOUNT KEY, OR NULL.
  --
  -- ACCOUNT-SCOPED AND NOT BUSINESS-SCOPED, and `entitlements` already argues
  -- it: that table is account-scoped because payment is an account concern, and
  -- a domain is a thing somebody paid for. A business is where sites live; an
  -- account is where money and assets live. So the POOL is the account's, and
  -- the ASSIGNMENT — this host reaches that site — lands in `site_domains`,
  -- which is per site.
  --
  -- NULL MEANS UNATTRIBUTED, WHICH MEANS SELECTABLE BY NOBODY. Default closed:
  -- every selection query names an account, so a row that names none is
  -- returned to no customer. That is a guard and it also buys the drift check —
  -- a zone somebody added by hand in the dashboard has no row here at all, and
  -- the diff is what asks a human to say whose it is.
  --
  -- NOT A FOREIGN KEY, matching every other cross-table reference in this
  -- schema.
  account_id   TEXT,
  -- THE APEX, AND THE WHOLE OF IT. `alicesplumbing.com`, never a label and
  -- never a subdomain: a Cloudflare zone is an apex and its whole subtree, so a
  -- column holding anything narrower would be describing something that is not
  -- a zone.
  apex         TEXT NOT NULL,
  -- CLOUDFLARE'S OWN ID, which is what every API call this deployment makes
  -- against the zone is addressed by. An ATTRIBUTE and not the key — see `id`.
  cf_zone_id   TEXT NOT NULL,
  -- THE NAMESERVER PAIR CLOUDFLARE ASSIGNED, as JSON.
  --
  -- STORED BECAUSE IT IS WHAT WE SHOWED THEM. The customer pasted these two
  -- names into a registrar control panel, and a later *"is it done yet"* is
  -- answered by comparing what the domain's delegation says now against the
  -- pair we told them to use. Re-reading the pair from Cloudflare would answer
  -- a different question — *what would we assign today* — and the two differ
  -- precisely in the case that matters, a zone deleted and re-added.
  --
  -- JSON AND NOT TWO COLUMNS. Cloudflare assigns two today and the number is
  -- theirs to change; `ns1`/`ns2` would make a third a migration.
  assigned_ns  TEXT NOT NULL DEFAULT '[]',
  -- HOW THIS ZONE GOT HERE — see the table comment, which is where the argument
  -- for this column lives.
  --
  -- `registered` | `nameserver` | `operator` | `platform`. A CLOSED ENUM THE
  -- CODE DECLARES, like `sites.kind` in `0005` and `site_domains.kind` in
  -- `0008`: SQLite would enforce a CHECK and then a fifth origin would be a
  -- migration rather than a constant.
  --
  -- `platform` IS NOT A CUSTOMER'S AND IS THE REASON THE GUARD EXISTS.
  -- `1stc.site` and `1stcontact.io` live in the same Cloudflare account and
  -- appear in any naive zone listing; `1stc.site` in particular carries EVERY
  -- customer's platform hostname, so attributing it to one account would hand
  -- that account the whole namespace. The refusal is in code (`zones.ts`) and
  -- not a convention an operator is trusted to observe.
  origin       TEXT NOT NULL,
  -- `pending` | `active` | `released` | `revoked`.
  --
  -- IT MIRRORS CLOUDFLARE'S RATHER THAN INVENTING A PARALLEL ONE. Cloudflare
  -- already runs the state machine — `pending` until the delegation points at
  -- the assigned pair, `active` once it observes that it does — and it observes
  -- it from a position we do not have. A second, independently computed notion
  -- of activeness is a second thing that can be wrong, and the one that would
  -- be wrong is ours.
  --
  -- `released` AND `revoked` ARE DECLARED AND NOT WRITTEN by [[REQ-257]],
  -- exactly as `site_domains.kind`'s `custom` is declared and not implemented in
  -- `0008`. A `pending` claim that never sees a nameserver change is `released`
  -- after a bounded window (ticket D); a zone taken off a site by its owner is
  -- the release control (ticket C). What this migration owes them is that the
  -- column admits the value, so neither lands as a migration.
  status       TEXT NOT NULL,
  -- WHEN THE ASSOCIATION WAS MADE — the claim, the purchase, or the operator's
  -- decision. Always present: a row exists because something happened.
  claimed_at   TEXT NOT NULL,
  -- WHEN CLOUDFLARE FIRST REPORTED IT ACTIVE, or NULL while it has not.
  --
  -- A SEPARATE COLUMN AND NOT A DERIVATION FROM `status`, because the two
  -- answer different questions and only one of them survives a later status
  -- change: *"has this zone ever served"* is what an offboarding path and a
  -- support conversation both want, and a zone that goes `active` and later
  -- `revoked` still has.
  activated_at TEXT
);

-- THE AUTHORITY, on `0008`'s reasoning exactly. Cloudflare allows one zone per
-- apex per account, so two rows for one apex is a state the upstream it mirrors
-- cannot be in — and a second claimant meets a refusal that came from the
-- database rather than from a check that raced. `zones.ts` reports what this
-- index decided; it does not decide it first and hope.
--
-- NOT PARTIAL ON `status`, which is the difference from `0008`'s
-- `idx_site_domains_site_platform` and is deliberate. A `released` zone is one
-- Cloudflare no longer holds, so the apex genuinely is available again — but the
-- row stays, and the next claim on that apex is a new row, which this index
-- would refuse. That is the correct refusal for now: re-claiming an apex this
-- deployment released is a support path with an operator behind it, and the
-- alternative — letting a second row appear the moment the first says
-- `released` — would make `zoneByApex` return two rows and have to pick one.
CREATE UNIQUE INDEX IF NOT EXISTS idx_zones_apex ON zones (apex);

-- WHAT THE SELECTOR READS ([[REQ-259]]): every zone belonging to one account.
-- One account may hold several domains, and the pool is what the customer
-- chooses from, so this is on the hot path of the one screen that lists them.
CREATE INDEX IF NOT EXISTS idx_zones_account ON zones (account_id);
