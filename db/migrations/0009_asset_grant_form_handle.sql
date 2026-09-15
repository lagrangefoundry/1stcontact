-- [[BUG-93]] — a grant names a FORM, and a form is a page and an instance on it.

-- WHY THERE IS A FILE AT ALL rather than an edit to `0001_baseline.sql`: the
-- baseline has been applied to the local and the remote database and
-- `wrangler d1 migrations apply` records what it has run, so an edit reaches
-- neither. Same reasoning as `0005`, `0007` and `0008` — and here it decides the
-- shape of the statement as well as its existence. The baseline creates this
-- column as `instance_id` and always will, on a fresh database as on a deployed
-- one, so a rename is correct exactly once against either and needs no guard.

-- WHAT THE COLUMN HOLDS CHANGED, SO ITS NAME DID. `asset_grants` was keyed on a
-- bare component id, which cannot name a form: an id is unique on ONE page and
-- the same name is legal on the next, so a grant minted for the whitepapers
-- `signup` and one minted for the home page's `signup` were the same row under
-- `idx_asset_grants_live`, opening whichever definition the receiver resolved
-- first. The value is now `<pageId>:<instanceId>` — the same handle the form
-- puts on the wire — and a column still called `instance_id` would be a second,
-- silently wrong answer to *what is in here*.
--
-- SQLITE CARRIES THE RENAME INTO EVERY INDEX THAT NAMES THE COLUMN, so
-- `idx_asset_grants_live` keeps its (contact, site, form) uniqueness across this
-- statement without being dropped and rebuilt.
--
-- THE ROWS ALREADY IN THE TABLE ARE NOT BACKFILLED, deliberately. They hold bare
-- instance ids minted before the handle named a page, and the page each one
-- meant is exactly the question that cannot be answered — answering it is the
-- defect this fixes, performed once more in SQL. They are a handful of rows in a
-- development store; a contact who submits the form again is minted a live grant
-- under the real handle, and the stale rows open nothing.
ALTER TABLE asset_grants RENAME COLUMN instance_id TO form_handle;
