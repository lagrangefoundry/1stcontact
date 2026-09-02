---
uid: acceptance_criterion-24cd21ca
id: AC-1398
type: acceptance_criterion
title: Both deployment halves declare the same database and bucket, and the schema
  is applied before upload with a rehearsal that changes nothing
created_by: xgd
created_at: '2026-08-31T09:48:12.827758+00:00'
updated_at: '2026-09-02T00:44:06.502367+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-fde7370b
  kind: behavior
  regression_only: false
---

## Criterion

The store's database and object-store bindings are available to the deployed application in both
deployment halves, and its schema is in place before the application that assumes it is uploaded.

- The bindings are declared for the default configuration **and repeated for the named production
  environment**, because a named environment inherits neither variables nor bindings. **Each
  declared binding names the same target in both halves** — the database binding the same
  database, and every object-store binding the same bucket as the binding of that name in the
  other half.
- That pairing is **by binding name, not by counting** occurrences across the configuration. A
  count — "there are two bucket names and they are identical" — states the same thing only while
  the application declares a single bucket, and becomes *wrong* rather than merely imprecise the
  moment a second, correctly declared binding is added: two different buckets, each correctly
  repeated, fail both the count and the one-distinct-value form of the claim. Stated per binding,
  it holds for however many bindings the configuration declares.
- The declaration states where the schema lives, and that location holds the schema.
- The deploy applies the schema to the remote database before it uploads the application, and a
  non-zero result aborts that upload — a running application that assumes a column which does not
  exist yet fails at request time, on real traffic, with an error naming the database rather than
  the deploy that caused it.
- The schema step is genuinely runnable by the deploy rather than present but never executed: an
  unrunnable step is skipped silently and the deploy reports success having migrated nothing.
- A rehearsal of the deploy **changes nothing** — it reports what it would apply and confirms it
  can reach the remote database, so a missing binding, a wrong database name or an expired
  credential is caught by the rehearsal rather than by the real thing.
- The step applies only to the application that has a database binding; against an application
  that has none it exits without doing anything rather than failing there.

## Verification

Inspect the deployed application's configuration in both halves: each declares both bindings, and
pairing the two halves' declarations by binding name shows each binding naming one and only one
target across them — the database binding one database, each object-store binding one bucket —
with no assertion made about how many bindings there are. The declared schema location contains
the schema. Confirm the schema step is executable by the deploy. Run the deploy's rehearsal mode
and observe that it reports the migrations it would apply and makes no change; run it against an
application with no database binding and observe it does nothing and succeeds.
