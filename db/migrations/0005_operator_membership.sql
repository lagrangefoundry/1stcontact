-- REQ-168 — the operator keeps the business they already have.
--
-- WHAT THIS REPAIRS, AND WHY IT IS THE SAME TICKET. Every site in this
-- deployment lives in the tenant `1stcontact`, because `TENANT_ID` named it and
-- every read used that var. REQ-168 moves the scope onto the caller's identity,
-- so the operator's next login resolves through `memberships` — and there is no
-- membership row joining them to `1stcontact`. The builder would come up empty:
-- not broken, not erroring, just a correct answer to the wrong question. The
-- ticket that breaks it is the ticket that repairs it.
--
-- `provisionInvite` CANNOT DO THIS. It always mints `newId('acct')` and creates
-- the business it just named, which is right for an invite and useless here: the
-- business already exists and is the one thing that must not change. Adding an
-- `accountId` option to the invite would be the seat capability — a second person
-- joining an existing business — which DOC-40 §9 leaves undefined and REQ-170
-- owns. An unreachable code path carrying no refusal is worse than a migration.
--
-- IDEMPOTENT, BY `WHERE NOT EXISTS` RATHER THAN BY `INSERT OR IGNORE`. The two
-- are not the same promise. `OR IGNORE` relies on a unique index existing over
-- exactly the columns that make the row a duplicate; `users` has one on
-- (tenant_id, email) and `entitlements` deliberately has none on account_id,
-- because an account accumulates grants (0004). So the condition is written out,
-- and re-running this migration against a database that already has the rows
-- changes nothing — which is what `wrangler d1 migrations apply` needs from it in
-- preview and in production alike.
--
-- THE USER ROW IS LOOKED UP RATHER THAN ASSUMED. If the operator was ever
-- invited, their `users` row exists with an id nobody here can predict, so the
-- membership and the grant are inserted FROM a select over `users` rather than
-- against a hardcoded id. That is also what makes the three statements agree with
-- each other when only some of them have run before.
--
-- `platform_admin` IS LEFT AT 0. The ambient flag is DOC-40 §6 and REQ-170's
-- `PLATFORM_ADMINS` env var is its seed; granting it here would decide that
-- ticket's bootstrapping question from inside a data migration, where nobody
-- would look for it.

-- The business itself, in case a fresh database is being brought up from empty.
-- `forTenant` refuses an unregistered tenant, so a membership pointing at one is
-- a row that can never be used.
INSERT OR IGNORE INTO tenants (id, name, status, created_at)
VALUES ('1stcontact', '1st Contact', 'active', strftime('%Y-%m-%dT%H:%M:%fZ', 'now'));

-- The person. Casefolded on the way in for the reason `normaliseEmail` gives:
-- `idx_users_tenant_email` is byte-exact, so a differently-cased row here would
-- be a second person that `admit` would never find.
INSERT INTO users (id, tenant_id, email, status, platform_admin, invited_at, created_at, updated_at, fields)
SELECT
  'usr_operator_1stcontact',
  '1stcontact',
  'martin-github@westhead.me',
  'active',
  0,
  strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
  strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
  strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
  '{}'
WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE tenant_id = '1stcontact' AND email = 'martin-github@westhead.me'
);

-- The join, which is the row this migration exists for.
INSERT INTO memberships (id, user_id, account_id, role, status, granted_by, granted_at)
SELECT
  'mem_operator_1stcontact',
  u.id,
  '1stcontact',
  'owner',
  'active',
  'REQ-168',
  strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
FROM users u
WHERE u.tenant_id = '1stcontact'
  AND u.email = 'martin-github@westhead.me'
  AND NOT EXISTS (
    SELECT 1 FROM memberships m WHERE m.user_id = u.id AND m.account_id = '1stcontact'
  );

-- AND THE GRANT, WITHOUT WHICH THE MEMBERSHIP IS DECORATIVE. `admit` refuses a
-- business with no active entitlement covering now — that is DOC-40 §5's whole
-- point — so a membership on its own would leave the operator refused at the door
-- with `no_entitlement` rather than served an empty builder. Open-ended
-- (`ends_at` NULL): a dated grant on the platform's own business would expire the
-- operator out of their own deployment at a wall-clock time nobody chose.
INSERT INTO entitlements (id, account_id, email, plan, source, status, starts_at, ends_at, granted_by, note, created_at, updated_at)
SELECT
  'ent_operator_1stcontact',
  '1stcontact',
  'martin-github@westhead.me',
  'pro',
  'admin_grant',
  'active',
  strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
  NULL,
  'REQ-168',
  'The operator''s own access to the platform business, seeded by REQ-168.',
  strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
  strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE NOT EXISTS (
  SELECT 1 FROM entitlements
  WHERE account_id = '1stcontact' AND email = 'martin-github@westhead.me' AND status = 'active'
);
