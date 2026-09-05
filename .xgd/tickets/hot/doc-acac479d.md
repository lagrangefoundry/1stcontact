---
uid: doc-acac479d
id: DOC-43
type: doc
title: 'Data design: keys, uniqueness, and what a column cannot promise'
created_by: xgd
created_at: '2026-09-05T21:34:17.874184+00:00'
updated_at: '2026-09-05T21:34:17.874184+00:00'
completed_at: null
last_field_updated: created_at
status: open
fields:
  doc_kind: architecture
---

# Data design: keys, uniqueness, and what a column cannot promise

## Why this document exists

The identity schema (`0004`) was written well and got one thing wrong that cost
several tickets to unpick: it made an email address the identity of a person.
That was not carelessness — it is the most natural thing to write, it works
perfectly until someone has two addresses, and by then the mistake is load
bearing.

[[REQ-190]] and [[REQ-191]] fix it while the only rows anywhere are test data.
This document is the part that outlives them: the rules that would have prevented
it, stated so the next table does not have to rediscover them.

Each section states a rule, the reason it is a rule *here*, and a **falsifier** —
the thing you would find in the code if the rule had been broken. The falsifiers
are the useful part; a principle nobody can check is a preference.

## 1. Data is never a key

A key is a surrogate the system mints and never shows meaning through. Anything a
human chose, typed, or might change — an address, a slug, a business name, a
phone number — is an **attribute**, and attributes get renamed.

The cost of getting this wrong is not inconvenience, it is representational: if
the address is the key then a person *is* their address, so two addresses is two
people who can never be reconciled, and changing the address changes who they
are. No amount of application code recovers from that; the model simply cannot
hold the fact.

The tell is that the mistake always looks like a saving at the time. `UNIQUE
(tenant_id, email)` removes a join and reads like a statement of fact — one
address, one person — which is true right up until it is the thing preventing you
from recording reality.

**Falsifier:** a primary key, unique index, or foreign key whose value a user
could edit.

## 2. Keys are random, not derived

A hash of the row's data is data-as-key wearing a disguise. `sha256(email)` still
changes when the address changes and still says two addresses are two people; it
has bought obfuscation and no independence.

The key must have **no relationship to its contents at all**. `newId`
(`identity.ts:357`) is the primitive: 128 bits from `crypto.getRandomValues`,
hex, with a type prefix for legibility in logs.

**Falsifier:** an id computed from any column of its own row.

## 3. One key, used everywhere, because it is unguessable

An unguessable key can be the join key *and* the value in the URL, the API
response and the object-store prefix. That is one column doing one job in several
places, which is simpler than a private key plus a public one and has fewer ways
to be got wrong.

The alternative forces a second column. An incrementing key cannot appear on a
multi-tenant surface: `/b/2/`, `/b/3/` walks every other business on the
deployment and turns an authorisation refusal into an existence check. A sequence
also leaks how many customers there are and in what order they arrived, which is
commercially legible to anyone who signs up twice.

So the sequence is not rejected on taste. It is rejected because it would need a
random column beside it anyway, and then there are two.

**Falsifier:** an integer sequence as a primary key; or a key that is safe in a
join but must be hidden in a response.

## 4. Uniqueness has a scope, and the scope is a decision

Two constraints are easy to run together and are not the same:

- **the key's uniqueness**, which is global and free — a random id needs no scope
- **a data constraint's uniqueness**, which is a product decision with a blast
  radius

Making a *data* value globally unique asserts that the value identifies one thing
across the whole deployment. On a multi-tenant surface that is rarely what you
mean, and it has a failure mode worse than being wrong: **a failed insert is an
existence oracle.** A global unique index on email would let Alice discover that
some other business on the platform already knows an address, by trying to add
it. [[DOC-38]] §7.2 refuses a global content address for blob keys on exactly this
argument, and an address identifies a person more directly than a file does.

Here the scope is the tenant. [[DOC-42]] §1 has the same human as a member of 1st
Contact and a contact of Alice's Plumbing — two unrelated rows, deliberately
([[CHAT-36]]).

**Falsifier:** a unique index on a data column with no tenant in it; or a
uniqueness scope nobody can say the reason for.

## 5. A column is a promise of exactly one

`email TEXT` does not mean "the email". It means *this person has one address,
now and forever*. Where that promise is false — and for contact details it is
almost always false — the attribute is a **table**.

Addresses, phone numbers and names are all multi-valued in reality. The product
is called 1st Contact; the representation of a contact is the one place this rule
is least affordable to break.

**Falsifier:** a column holding something a person could plausibly have two of.
Or a `_2` suffix, which is the same mistake with the discussion already lost.

## 6. "Current" and "history" are different shapes

Multi-valued does not imply one shape. Two cases look alike and are not:

- **Several, one of them current** — email addresses. A `is_primary` flag, with
  exactly one true per owner.
- **A succession over time** — names. A validity interval, because the question
  is not only *which is current* but *what were they called when this invoice was
  issued*.

Choosing the flag where you needed the interval loses the past silently; choosing
the interval where a flag would do buys date arithmetic on every read. Decide
which question the data will be asked ([[CHAT-38]]).

**Falsifier:** a history table with no interval; or an `is_current` flag on
something whose past is load bearing.

## 7. Invariants belong to the schema

If the rule is "exactly one primary address per person", that is a partial unique
index — `CREATE UNIQUE INDEX … ON user_emails (user_id) WHERE is_primary = 1` —
and not a check in the function that happens to write the row.

Same for normalisation. `normaliseEmail` casefolds because SQLite's default
collation is byte-exact, so a differently-cased address is a second person
`admit` never finds (`0005` records this). A convention every writer must
remember is a convention that eventually is not remembered; store the normalised
form and let the constraint mean what it is there to mean.

An invariant the code maintains is an invariant that eventually is not
maintained, and the failure is silent because the code that broke it also looked
correct.

**Falsifier:** a comment explaining a rule the schema does not enforce.

## 8. Names are attributes; they are also not identifiers

`tenants.id` should be opaque and `tenants.name` should hold "1st Contact", where
it can change. This is rule 1 applied, but it earns its own line because the
temptation is different: an id that reads as a word is *pleasant*, and it makes
logs legible, and it is the reason `'1stcontact'` is a primary key today.

The exception is deployment configuration. `TENANT_ID` names a business in a
`.toml` file because it is a fact about the deployment rather than a row
([[DOC-42]] §2, [[REQ-180]] D5). Configuration is edited by an operator, not
migrated.

**Falsifier:** a key you can read and guess the meaning of, outside deployment
config.

## 9. Keys escape the database

Changing a key is not only a data migration. In this system a key appears in:

- **R2 object keys** — `t/<tenant>/blob/<sha256>` ([[DOC-38]] §7.2),
  `draft/<tenant>/<slug>/assets/…`
- **URLs** — `/b/<businessId>/…` ([[REQ-168]])
- **erasure**, which is implemented by deleting under a tenant prefix
  ([[DOC-37]]) and is therefore a correctness path rather than a naming one

Choose keys knowing they will end up in all three. This is the strongest
practical argument for rule 2: a random key is safe everywhere it leaks, and a
derived one is not.

**Falsifier:** a key change whose plan mentions only SQL.

## 10. Withdrawal is not deletion

When access is revoked, the row stays and gains `status` and `revoked_at`
(`revokeGrant`, `people.ts:512`). The history of what someone was promised, and
when it stopped being honoured, is the thing anyone investigating a refusal
actually wants; a deleted row takes the answer with it.

This is distinct from **erasure**, which is a person's right over their own data
([[DOC-37]]) and does delete. Withdrawal is an act by the business about access;
erasure is an act by the person about themselves. Do not implement one with the
other.

**Falsifier:** a `DELETE` on a table recording a grant, a membership or a
transition.

## 11. States of one row, not tables per state

A contact who is invited and then signs up is **one row in three states**
([[DOC-42]] §9, [[REQ-188]]) — not a contacts table and a members table. Two
tables for one population means two lists that can disagree about a person who is
both, and a promotion that inserts rather than updates, which is how one human
becomes two records with the same address.

**Falsifier:** two tables whose rows describe the same kind of thing at different
points in its life.

## 12. Absent configuration fails loudly

`store.ts` refuses to construct when `TENANT_ID` is unset rather than defaulting,
because a defaulted tenant id is a misconfigured Worker with **write** access to
whichever account happens to carry that name. `d1r2SiteStore` refuses an
unregistered tenant at construction for the same reason.

A default is a guess, and a guess about which customer's data to write into is
not one to make quietly.

**Falsifier:** `?? 'default'`, or any fallback value on an identifier that scopes
access.
