---
uid: request-3bc4b835
id: REQ-167
type: request
title: 'Identity: the invite provisions the account, login binds it'
created_by: xgd
created_at: '2026-09-01T00:50:39.990490+00:00'
updated_at: '2026-09-01T00:50:39.990490+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: high
  story_points: 3
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-6477139e
---

# Identity: the invite provisions the account, login binds it

## The gap

`access.ts` verifies a Cloudflare Access JWT on every request and produces a
verified email address. Nothing is done with it. There is no record that a
person exists, no account they own, and no rule about who may enter — the
builder serves whoever passes the hostname gate, into the single tenant named by
`TENANT_ID`.

Onboarding external people needs all three: a user record, an account, and an
entitlement that decides admission. [[DOC-40]] is the model; this ticket is its
first implementation.

## Migration `0004_identity.sql`

Three tables, in the control-plane database beside `tenants`.

```sql
CREATE TABLE IF NOT EXISTS users (
  id             TEXT PRIMARY KEY,
  tenant_id      TEXT NOT NULL,
  email          TEXT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'active',
  display_name   TEXT,
  platform_admin INTEGER NOT NULL DEFAULT 0,
  tos_version    TEXT,
  tos_accepted_at TEXT,
  invited_at     TEXT,
  first_seen_at  TEXT,
  last_seen_at   TEXT,
  created_at     TEXT NOT NULL,
  updated_at     TEXT NOT NULL,
  fields         TEXT NOT NULL DEFAULT '{}'
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_tenant_email ON users (tenant_id, email);

CREATE TABLE IF NOT EXISTS memberships (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL,
  account_id TEXT NOT NULL,
  role       TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'active',
  granted_by TEXT,
  granted_at TEXT NOT NULL,
  expires_at TEXT,
  revoked_at TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_memberships_user_account ON memberships (user_id, account_id);
CREATE INDEX IF NOT EXISTS idx_memberships_account ON memberships (account_id);

CREATE TABLE IF NOT EXISTS entitlements (
  id           TEXT PRIMARY KEY,
  account_id   TEXT,
  email        TEXT,
  plan         TEXT NOT NULL,
  source       TEXT NOT NULL,
  status       TEXT NOT NULL,
  starts_at    TEXT NOT NULL,
  ends_at      TEXT,
  subscription_ref TEXT,
  granted_by   TEXT,
  note         TEXT,
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_entitlements_account ON entitlements (account_id, status);
CREATE INDEX IF NOT EXISTS idx_entitlements_email ON entitlements (email);
```

`IF NOT EXISTS` throughout, per this repository's migration convention (0003).

**`plan` and `status` carry no CHECK constraint, deliberately.** Adding
`'warning'` when billing lands, or `'trial'` when self-signup lands, must be a
code change and not a schema migration — see [[DOC-40]] §5. A UAT asserts the DDL
contains no CHECK on either column, because the constraint is the kind of thing
a later hand adds for tidiness without seeing what it costs.

**Entitlement carries both `account_id` and `email`.** `email` is the claim key
for a grant made before an account exists; today's admin flow always fills
`account_id` as well, and both are kept because the email is also the audit
record of who the grant was made to.

**There is no unique index on `entitlements.account_id`.** An account
accumulates grants over its life and effective access is the best active grant
covering now. A unique index would encode the single-row assumption this model
exists to avoid.

## Provisioning happens at invite

One function creates the whole set, transactionally where D1 allows:

- `users` row in the platform tenant, `invited_at` stamped, `first_seen_at` null
- `tenants` row — the account — with an **opaque** id of the form `acct_<random>`
- `memberships` row, role `owner`
- `entitlements` row, `plan='pro'`, `source='admin_grant'`, `status='active'`,
  `starts_at` and `ends_at` supplied by the caller
- the account's starter site (see [[REQ-D]] for its content)

**The account id is never derived from the email, the name, or anything a human
chose.** A tenant id appears in R2 keys and is therefore permanent; a readable
one becomes wrong the first time someone renames their company. The human label
goes in `tenants.name`. A UAT asserts the generated id is not a function of the
invite's inputs.

**Re-inviting an existing email is not a second account.** The unique index on
`(tenant_id, email)` refuses it; the operation reports the existing user rather
than failing obscurely on a constraint.

## Login binds, and does not provision

The request path, after `access.ts` has produced a verified email:

1. Look up the user by `(platform tenant, email)`. **No row → deny.** Nothing is
   created. Self-signup is [[DOC-40]] §5's later branch and is explicitly not
   built here.
2. Stamp `first_seen_at` if null, and `last_seen_at` always.
3. Resolve the account from `memberships`. No active membership → deny.
4. Resolve the entitlement: the best grant for that account with
   `status='active'`, `starts_at <= now`, and `ends_at` either null or `> now`.
   None → deny.
5. Serve.

### Denial says which thing failed, to the operator and not to the caller

The deny page tells the visitor their access has ended and to get in touch. It
does not distinguish "no such user" from "expired grant" — that difference is an
account-existence oracle to anyone who can pass OTP, which is anyone. The
distinction is logged.

### Expiry must actually expire

A grant given a bounded date whose expiry is never evaluated is worse than an
open-ended one, because it was promised as bounded. **A UAT sets `ends_at` in
the past and asserts the login is refused**; another sets it in the future and
asserts admission. This is the single most likely silent failure in the ticket:
the code path that never runs during the alpha is the one that was promised.

`revoked_at` and `status='revoked'` refuse independently of dates.

## Not in scope

Self-signup, trials, subscriptions, discounts, the warning period, read-only
access on expiry, and time-boxed support memberships. All are [[DOC-40]] §5 and
§6, and all land on this schema without changing it.