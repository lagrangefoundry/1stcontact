---
uid: request-53ddfe1f
id: REQ-266
type: request
title: Published revisions are immutable by enforcement, not by convention
created_by: EPIC-17
created_at: '2026-09-17T21:34:35.066365+00:00'
updated_at: '2026-09-17T21:34:35.066365+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: high
  epic_parent: epic-bed5a03b
  auto_merge_back: true
  needs_review: false
---

## What this is

A published revision is **fixed in time and immutable**. Today that is a
property the publish path *respects*; this makes it a property the store
*guarantees*.

The distinction is [[DOC-2]]'s: security and reliability posture is a property of
the substrate, not of the code that happens to be careful. Everything below was
found by the [[EPIC-17]] threat-model pass (§4a) and the motivating requirement
is the operator's, stated there:

> *The draft is expendable. What we can restore is the published site — that
> should be fixed in time and immutable. That is something we should enforce.*

Recovery follows from immutability and is the reason it matters: check out
revision N and publish it forward. The schema already anticipated exactly this —
`based_on` exists *"so that a forward-only rollback is self-documenting"*
([[DOC-12]] §4, `0001_baseline.sql:210-213`).

## What already exists and is not to be rebuilt

- **Forward-only numbering.** `site_revisions` has `PRIMARY KEY (site_id, id)`
  and the comment *"Monotonic per site, and forward-only. Never reused, never
  renumbered."* (`0001_baseline.sql:203-223`).
- **Live is derived, never stored.** `liveRevisionOf` takes the highest id
  ([[DOC-12]] §4), so there is no pointer an attacker or a bug could repoint.
- **A frozen definition travels with every render.** `source/` beside `out/`, so
  a revision is complete rather than only its output (`d1r2-store.ts:796-801`).
- **A digest is already computed and stored.** `sha` = `snapshotSha(draft)`
  (`publish.ts:322`), a SHA-256 over a canonical listing — `canonicalJson` for
  `site.json` and pages, `byteKey` for assets, sorted, so iteration order cannot
  perturb it (`revision-model.ts:158-220`). The schema annotates it *"AUDIT, NOT
  ADDRESSING… are these the same bytes?"*
- **`checkoutRevision` works**, including its refusal of a dirty draft unless
  forced (`publish.ts:354`).
- **The precedent for enforcement.** `contact_events` is the one table in the
  schema with an immutability trigger, and its reasoning is this ticket's:
  *"a correction is an appended event that supersedes, never an edit of the row
  that was wrong"* (`0001_baseline.sql:706-713`).

None of that changes. This ticket adds enforcement around it.

## What is wrong today

Four gaps, none of them a live exploit path — the publish path is the only
writer of a revision and it behaves — and all four the difference between
respected and guaranteed.

1. **Nothing forbids rewriting a revision row.** No trigger, no constraint. An
   `UPDATE` to `sha`, `published_by` or `changes` succeeds.
2. **The bytes are written before the constraint that would refuse them.**
   `writeRevision` `put`s every object into `published/<site>/<id>/` and *then*
   `INSERT`s the row whose primary key would have rejected a duplicate id
   (`d1r2-store.ts:788-862`). `put` overwrites. So the guard that exists is
   evaluated after the damage it would have prevented.
3. **The digest is never verified.** `readRevision` reads the row for existence
   (`SELECT id`) and the objects for content, and compares nothing
   (`d1r2-store.ts:866`). The detector is built, stored, and unwired.
4. **Two publishes can claim the same revision id.** `nextRevisionOf(history)`
   is read-then-write with no lock (`publish.ts:316`). Both write into the same
   prefix — interleaving two drafts' bytes into one revision — and then one
   `INSERT` wins. The survivor's `sha` matches neither, which nothing notices
   because of (3).

## The behaviour

### 1. A revision row cannot be rewritten

A `BEFORE UPDATE` trigger on `site_revisions` raises `ABORT`, on the
`contact_events` pattern and for the same reason. There is no legitimate update:
every field is a fact about a publish that already happened.

A correction is a new revision, which is what forward-only numbering is for.

### 2. The revision id is claimed before any byte is written

The id is reserved in a **separate** `site_revision_claims (site_id, id,
claimed_at)` table with `PRIMARY KEY (site_id, id)`, inserted **first**. Only
then are the R2 objects written. The `site_revisions` row is still inserted
**last**.

Why a separate table rather than a state column on the revision row: a
completion flag would mean `site_revisions` had to accept an `UPDATE`, which
would put a hole in §1 exactly the size of the thing it is guarding. Keeping the
claim elsewhere lets the revision row stay insert-only and absolute.

This preserves the existing and correct property that **the log can never name a
revision that serves a 404** (`d1r2-store.ts:846-850`) — the row still lands
after the bytes — while making the *claim* precede them.

`nextRevisionOf` considers the union of both tables, so an abandoned claim is
never handed out again.

### 3. A claimed-or-published revision prefix is never written into

`writeRevision` refuses when the id it was given already has a completed
revision row, before any `put`. Defence in depth for §2: the claim resolves the
race, and this refuses the write even if some future caller arrives with an id
it did not claim.

### 4. A revision is verified against its own digest

`readRevision` recomputes `snapshotSha` over what it read and compares it to the
row's `sha`. A mismatch is a **refusal**, not a warning and not a silent pass —
serving or checking out bytes that do not match the record is the failure this
whole ticket is about.

Because the digest is already canonical over exactly `StoredSnapshot`, which is
exactly `readRevision`'s return type, this is one comparison and no new
canonicalisation.

`checkoutRevision` inherits it by calling `readRevision`, which is the path that
matters: **a restore must not restore tampered bytes.**

### 5. Integrity is checkable over a whole site, not only on read

One operation that walks every revision of a site, recomputes each digest, and
reports mismatches — so the question *"is our published history intact?"* has an
answer that does not require someone to check out each revision by hand. Whether
it is also scheduled is out of scope here.

### 6. Deletion is not in scope, and that is deliberate

`UPDATE` rewrites history; `DELETE` removes it, and removing it is a legitimate
operation that [[DOC-37]] erasure will eventually require. A `DELETE` trigger
would therefore have to model teardown, and today nothing performs one: `forget()`
is the only code that deletes a revision row and it **has no caller anywhere in
the product** ([[EPIC-17]] §4a).

So instead of a trigger this ticket asserts the absence: a UAT walks the source
and fails if any path other than `forget()` deletes from `site_revisions` — the
same idiom as the assertion that `env.TENANT_ID` has no reader outside
`scope.ts` and `identity.ts` ([[REQ-168]]).

## What this fixes that was filed separately

[[EPIC-17]] §5 item 5c proposed a Durable Object to serialize publishing
([[DOC-1]] §7). §2 above resolves the *corruption* half of that race in the
store — the loser of the claim fails before writing a byte — so what remains for
a DO is ordering and queueing, not integrity. It stays worth building and stops
being urgent.

## What is deliberately not here

- **No draft restore point.** A draft is working state and is expendable; that
  is the operator's line and [[EPIC-17]] §4a records why the earlier framing was
  withdrawn.
- **No route or UI for restore.** `checkoutRevision` needs a product path over
  the D1/R2 store; that is its own ticket ([[EPIC-17]] §5 item 5b) and it depends
  on this one, not the reverse.
- **No R2-side retention or bucket lock.** A platform-level control worth
  evaluating, and not a substitute for the store guaranteeing its own invariant.
- **No scheduled integrity sweep.** §5 supplies the operation; scheduling it is
  an operations decision.

## How this is proven

UATs named `test_UAT_FC_<this ticket>_*`, each tracing to a clause above:

1. an `UPDATE` to any field of a published revision row is refused (§1);
2. `writeRevision` called with an id that already has a completed revision
   writes **no object** and refuses (§2, §3) — asserted on the bucket, not only
   on the return value;
3. two concurrent publishes produce two distinct revisions, or one publish and
   one refusal, and never one revision holding a mix (§2);
4. a revision whose stored object is altered after publish fails `readRevision`
   and fails `checkoutRevision` (§4);
5. an unaltered revision verifies, so §4 is not simply refusing everything (§4);
6. the site-wide integrity walk names exactly the altered revision (§5);
7. no source path outside `forget()` deletes from `site_revisions` (§6).

The falsifier for the whole ticket: **alter a published revision's bytes in the
bucket and have anything in the product serve, check out, or report them as
sound.**
