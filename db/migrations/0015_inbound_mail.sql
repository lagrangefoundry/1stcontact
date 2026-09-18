-- [[REQ-267]] — INBOUND MAIL: what the pipeline needs that no table holds yet.
--
-- Two things, and neither is the message. The message is a ticket in the
-- business's own ticket store ([[REQ-162]]) — the same store that already holds
-- captures, briefs and outbound messages — because a body is a document and
-- documents live there. What the RELATIONAL schema has to answer is the two
-- questions a ticket cannot: where a business's mail is forwarded to, and which
-- senders it has stopped wanting to be asked about.

-- ---------------------------------------------------------------------------
-- Where a business's mail goes after we have recorded it
-- ---------------------------------------------------------------------------
--
-- THE PROMISE THIS COLUMN KEEPS IS *never break the business's mail*. Capture is
-- the product on top of forwarding, not instead of it: a message is recorded and
-- then forwarded, and a capture that throws still forwards ([[REQ-267]] §2).
-- Without somewhere to read the destination from, the deployed pipeline would
-- record faithfully and swallow every message — which is the one failure a
-- business cannot forgive.
--
-- A COLUMN ON `sending_domains` AND NOT A TABLE OF ITS OWN. Forwarding is a
-- property of the DOMAIN, exactly as sending is, and `0012` already argued that
-- case for this table against both `site_domains` (which holds hosts) and
-- `zones` (which belong to the account). One domain, one destination, one row.
--
-- NULL IS ORDINARY AND MEANS "NOBODY HAS SAID YET". The message is still
-- recorded; the forward is skipped and the skip is reported. The SURFACE that
-- sets it — the forwarding table, destination verification, catch-all — is
-- ticket 2 of [[EPIC-13]]'s cut and is deliberately not here; what is here is the
-- place it will write to, so ticket 1's pipeline is whole rather than
-- structurally unable to forward.
ALTER TABLE sending_domains ADD COLUMN forward_to TEXT;

-- ---------------------------------------------------------------------------
-- A sender this business has decided it does not want triaging again
-- ---------------------------------------------------------------------------
--
-- WHY IT PERSISTS. A discard that does not stick re-surfaces the same sender
-- every day and trains the client to ignore the queue, which costs them the one
-- message in a hundred that mattered.
--
-- PER BUSINESS AND PER ADDRESS ([[REQ-267]] §6). Not per domain: a discard is a
-- judgement about a correspondent, and a domain-wide one would silence a
-- colleague of the person who was actually unwanted.
--
-- IT SUPPRESSES THE QUEUE AND NOTHING ELSE. A discarded sender's later mail is
-- still recorded and still forwarded — the business's mail is never broken by a
-- triage decision — it simply does not ask to be triaged again.
CREATE TABLE IF NOT EXISTS inbound_suppressions (
  id          TEXT PRIMARY KEY,
  business_id TEXT NOT NULL,
  -- Normalised through `normaliseEmail`, the one normaliser ([[DOC-44]]), so a
  -- discard of `Sarah@…` silences `sarah@…` — which is the same person and is
  -- what the operator meant.
  address     TEXT NOT NULL,
  created_at  TEXT NOT NULL,
  -- UNDOING IT IS A CONTROL, AND IT IS NOT ERASURE ([[REQ-267]] §6). The
  -- messages a suppression hid were never deleted, so restoring the sender
  -- brings them back rather than reconstructing them. The shape
  -- `memberships.revoked_at` and `asset_grants.revoked_at` already use.
  revoked_at  TEXT
);

-- ONE LIVE SUPPRESSION PER (BUSINESS, ADDRESS), ENFORCED BY THE SCHEMA. Two rows
-- would be two answers to "is this sender suppressed", and the read would depend
-- on which one it happened to find. PARTIAL, over the live rows only: a revoked
-- suppression stays as the record of a decision that was taken and must not stop
-- a later one.
CREATE UNIQUE INDEX IF NOT EXISTS idx_inbound_suppressions_live
  ON inbound_suppressions (business_id, address) WHERE revoked_at IS NULL;
