-- [[REQ-368]] — WHICH OF A PERSON'S ADDRESSES HAS PROVED IT REACHES THEM.
--
-- A person may now add and remove the addresses they sign in with, from the
-- profile portal. Every address in `user_emails` already signs in (`subjectFor`
-- resolves through any of them), so what was missing is the fact that one of
-- them has actually been used: VALIDATED means at least one sign-in has completed
-- through a link mailed to that address. The portal keeps at least one validated
-- address, and only a validated address may be primary.
--
-- `verified_at` IS STAMPED ONCE AND NEVER CLEARED. It records that the address
-- was proved, at the first sign-in through it; a later sign-in proves nothing new.
ALTER TABLE user_emails ADD COLUMN verified_at TEXT;

-- EXISTING ADDRESSES ARE VALIDATED WHERE THE PERSON HAS ALREADY SIGNED IN.
-- `first_seen_at` is stamped by `admit`, which only runs for a verified identity
-- (a redeemed link or an Access token), and before this ticket nobody could hold
-- a second address of their own — so a person who has been seen was seen through
-- their primary. Without this every existing account would start with nothing
-- validated, and could neither choose a primary nor remove an address until they
-- signed in again.
UPDATE user_emails
SET verified_at = (SELECT u.first_seen_at FROM users u WHERE u.id = user_emails.user_id)
WHERE is_primary = 1
  AND verified_at IS NULL
  AND EXISTS (SELECT 1 FROM users u WHERE u.id = user_emails.user_id AND u.first_seen_at IS NOT NULL);

-- WHICH ADDRESS A SIGN-IN LINK WAS MAILED TO, held beside the component's own
-- `login_tokens` rather than inside it. `login_tokens` is the `auth-passwordless`
-- component's schema, transcribed (see 0001), and it holds no address on
-- purpose; a host column there would be a fork of somebody else's table. So the
-- host records the address it mailed, keyed by the token, and reads it back when
-- that token is redeemed — which is the moment the address is proved.
--
-- THE ROW LIVES NO LONGER THAN ITS TOKEN. It is deleted when the token is
-- redeemed, swept with the component's own purge once the token is gone, and
-- cascades away with the address if the address is removed first.
CREATE TABLE IF NOT EXISTS login_token_addresses (
  token_id   TEXT PRIMARY KEY,
  email_id   TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (email_id) REFERENCES user_emails (id) ON DELETE CASCADE
);
