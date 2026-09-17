-- REQ-266 — A PUBLISHED REVISION IS IMMUTABLE BY ENFORCEMENT, NOT BY CONVENTION.
--
-- The draft is expendable; the published site is what can be restored, and a
-- restore is only worth anything if what it restores is what was published. Both
-- halves of that were true of the code and of neither the schema nor the order
-- the store wrote in: nothing forbade an `UPDATE` to a revision row, and the
-- bytes of a revision landed BEFORE the primary key that would have refused a
-- duplicate id was ever evaluated. This file closes the first half; `d1r2-store`
-- closes the second, using the table below.
--
-- THE DISTINCTION IS DOC-2's. Security and reliability posture is a property of
-- the substrate, not of the code that happens to be careful — and an invariant
-- the code maintains is an invariant that eventually is not maintained
-- (DOC-45 §7). This is the same argument `contact_events_are_immutable` already
-- makes one table over, in the same words, for the same reason.

-- ---------------------------------------------------------------------------
-- The revision id, reserved before a single byte is written
-- ---------------------------------------------------------------------------
--
-- WHY A CLAIM EXISTS AT ALL. `nextRevisionOf` is a read of the log followed by a
-- write into the prefix that read named, with nothing in between. Two publishes
-- of one site could therefore both mint id N, both `put` into
-- `sites/<site>/rev/000N/`, and interleave two drafts into one revision — after
-- which one `INSERT` wins, its `sha` describes neither draft, and the primary
-- key that would have caught the collision is evaluated long after the damage.
-- Claiming the id FIRST moves the refusal to the front: the loser fails before
-- it writes anything, and there is no half-revision to notice later.
--
-- WHY A SEPARATE TABLE RATHER THAN A STATE COLUMN ON `site_revisions`. A
-- completion flag would mean the revision row had to accept an `UPDATE`, which
-- is precisely the hole the trigger below exists to close, cut to exactly the
-- size of the thing it is guarding. Keeping the claim somewhere else lets the
-- revision row stay insert-only and absolute.
--
-- AN ABANDONED CLAIM IS NEVER RECYCLED, and that is the intended behaviour
-- rather than a leak. A publish that claimed N and then died leaves N unusable
-- forever; the next publish takes N+1. Forward-only numbering already promises
-- ids are "never reused, never renumbered" — a gap in the sequence is what that
-- promise looks like when a publish fails, and handing N out again would mean a
-- second writer walking into a prefix the first one may have already put into.
--
-- IT CASCADES FROM `sites` LIKE EVERY OTHER CHILD TABLE, so `forget()` reaches
-- it and a dropped site leaves no claims behind to refuse a future id.
CREATE TABLE IF NOT EXISTS site_revision_claims (
  site_id    TEXT NOT NULL,
  -- The id being reserved. Compared against `site_revisions.id` by a UNION, so
  -- the next id is one past the highest EITHER table has ever seen.
  id         INTEGER NOT NULL,
  claimed_at TEXT NOT NULL,
  PRIMARY KEY (site_id, id),
  FOREIGN KEY (site_id) REFERENCES sites (id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------------
-- A revision row cannot be rewritten
-- ---------------------------------------------------------------------------
--
-- THERE IS NO LEGITIMATE UPDATE. Every column is a fact about a publish that
-- already happened: when it happened, who did it, what it said, what it
-- descended from, what changed, and the digest of what it froze. A correction is
-- a NEW revision, which is what forward-only numbering is for.
--
-- UPDATE ONLY, AND DELETE DELIBERATELY LEFT ALONE — the same carve-out
-- `contact_events` makes and for a related reason. Erasure (DOC-37) has to be
-- able to remove a business's published history, and the cascade from `sites`
-- above is how it reaches these rows; a trigger that forbade DELETE would have
-- to model teardown as well. What is forbidden here is REWRITING a fact, which
-- is the only thing an append-only log cannot survive. The absence of any other
-- deleter is asserted from the source instead, by
-- `test_UAT_FC_REQ-266_only_forget_deletes_a_revision`.
--
-- LAST STATEMENT IN THE FILE, which is what the test harness's `atHead` marker
-- asks about.
CREATE TRIGGER IF NOT EXISTS site_revisions_are_immutable
BEFORE UPDATE ON site_revisions
BEGIN
  SELECT RAISE(ABORT, 'site_revisions is append-only');
END;
