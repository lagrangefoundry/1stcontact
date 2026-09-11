---
uid: story-a7a12d81
id: STORY-127
type: story
title: 'Material Blob Storage: The Client''s Attached Bytes, In A Store The Public
  Site Has No Reach Into'
created_by: xgd
created_at: '2026-09-02T00:16:45.252755+00:00'
updated_at: '2026-09-10T02:22:30.107444+00:00'
completed_at: null
last_field_updated: uat_coverage
status: completed
fields:
  intent_uid: request-13a5e206
  capability_uid: capability-dfb0a4ff
  story_kind: upgrade
  story_points: 2
  uat_coverage: pass
  updated_by:
  - bundle-87be4669
---

## Story

**As a** client who hands the platform confidential material — brand guidelines, positioning
papers, competitor captures — to build a site from,
**I want** the bytes attached to that material kept in a store of the platform's own, scoped to my
account and located by the record that names them, which the part of the platform that serves the
public internet has no way to reach,
**so that** a document I gave in confidence cannot become a public URL through a routing mistake,
one record's bytes can be moved or thrown away without breaking another record that happens to hold
the same file, and another account's identical file is a separate object it has no way to address.

## Description

Client material is a record *and* bytes. The record — what the material is, who owns it, whether
it may be republished — is a ticket. This story is the other half: where the bytes go.

**A store of its own, and that is the substance.** The platform already has a store of bytes: the
one the public site is served from, by path, to anyone who asks. Attachment bytes are the opposite
kind of object. Keeping both in one store would leave only routing code between a client's
confidential document and a public URL, so the boundary is a whole separate store rather than a
naming convention inside the shared one. A convention is enforced by whoever remembers it; a store
the public-facing half of the platform is not given access to is enforced by that absence. This is
the same class of mistake the platform already paid for once, where a sandbox deploy shared a
keyspace with a real site and could overwrite its published bytes — but the failure mode here is
disclosure rather than overwrite, and a prefix is not enough for disclosure.

**Attaching, and reading back what was attached.** Bytes attached to a ticket produce an attachment
record that names them — the digest of the content and the size — and that is listed back under the
ticket it belongs to. The record is what makes the bytes findable and checkable; it hangs off its
parent the same way a comment does, so there is no second lifecycle to keep in step.

**Addressing is derived from the attachment record and scoped to the account.** Bytes live at a
location composed of the account the store handle is scoped to and the record that names them, so
one record owns exactly one stored object. Identical bytes attached twice are therefore stored
twice — even inside one account — and two accounts attaching the same file get two locations,
neither reachable from the other's. Deriving the location from the content instead would collapse
those copies into one, and that is the trade deliberately refused: an object shared between two
records cannot be moved to the trash without breaking whichever sibling still names it, and moving
it is exactly what makes deletion revoke reach. The digest stays on the record as an **integrity**
field rather than as the address — identical content still hashes identically, which is what makes
a stored object checkable against the bytes that were attached.

The account component of the location comes from the handle and is never supplied by a caller, so
no one can place bytes into, or fetch bytes from, another account's namespace. A shared global
address would be both an existence oracle across the account barrier and an obstacle to erasing one
account's material without touching another's.

**The configuration says so twice.** The deployment configuration declares this store for the local
half and again for the deployed half — a named deployment environment inherits nothing — and in
neither half is it the store the public site is served from.

In scope: attaching bytes and listing them back; the store those bytes land in and its separation
from the public site's; record-derived, account-scoped addressing and the integrity digest that
travels beside it; and the configuration that declares the separate store on both deployment halves.

Out of scope: refusing to build a store when the deployment gives bytes nowhere to go (a criterion
on this capability's store story); any surface for downloading or serving attached bytes back to a
caller; ingestion, which is what would create material and attach files to it; erasure of a
client's material; and the vocabulary of material types, which is a separate story on this
capability.

## Technical Context

- **Depends on the wired store** (STORY-126, this capability): attaching happens through the same
  single wiring point that binds the account into the handle, so the account prefix on a byte
  location comes from the same validated identifier as the account filter on a row. The refusal to
  build a store at all when there is nowhere to put bytes belongs to that story (AC-1482), not to
  this one; this story assumes a store that built.
- **The separation claim is the one nothing else makes.** A general criterion elsewhere in the
  matrix already requires that every declared binding is repeated under the named deployment
  environment (STORY-125 / AC-1341), and the site store's own configuration criterion is being
  generalised to pair each declared target across both halves (AC-1398, upgraded under this same
  intent). Neither says a second store exists, nor why it must not be the one the public site is
  served from. The criteria here therefore lead with the separation (AC-1489) and re-pin the
  repetition specifically (AC-1490), which is the convention this repository already follows for the
  site store's bindings.
- **The disclosure claim was mutation-tested rather than argued.** Pointing the store's byte layer
  at the public site's store fails AC-1487, which is how it is known to be an assertion and not a
  comment. It is checked against real object stores inside the runtime environment — both are
  declared to the test harness deliberately, so what is proved is where the bytes actually went
  rather than what the configuration claims.
- **An operator obligation no criterion can carry.** The material store must be created in the
  hosting account before the next production deploy. The local runtime conjures it on demand and
  the platform does not, so its absence is invisible in every test and appears only in production.
  Recorded on the intent and here; not assertable.

## Reconciliation Decisions

- **Addressing is record-derived, and the dedup consequence is withdrawn** (decided at
  reconciliation, 2026-09-10, superseding the 2026-09-01 decision recorded below): REQ-161 names
  this change explicitly and states the restatement. The store this capability attaches through
  gave up content-derived addressing deliberately — a stored object shared between two records
  cannot be moved to the trash without breaking whichever sibling still names it, and moving it is
  what makes deletion actually revoke reach — so bytes are located by the attachment record's own
  identity inside the account's namespace, and identical bytes attached twice are two stored
  objects even within one account. AC-1488 is restated accordingly: the dedup-within-an-account
  clause is removed as false, the cross-account isolation half is kept unchanged, and the digest is
  restated as an integrity field. AC-1487's address composition and AC-1486's naming of the digest
  follow the same correction; the claims those criteria exist for — the bytes are in the material
  store and are not in the public site's, and one account cannot address another's — are untouched.
  The defect this surfaced (reads composed from the digest resolved to nothing, every time) was
  invisible until a surface finally read a blob back, which is why it survived two intents.
- **The attachment record's digest and size** (decided at reconciliation, 2026-09-01): the
  intent asks that attachment operations work through the wired store and that addressing be
  derived rather than chosen by a caller, but is silent on what the record hands back. The landed
  code returns a record carrying the content digest and the byte count. Formalized as AC-1486,
  because every other claim in this story — isolation, one record one object, and the disclosure
  check itself — is only observable if the record names its bytes; without it the store's own
  placement decisions could not be checked from outside.
- **Identical bytes across two accounts** (decided at reconciliation, 2026-09-01): the intent gives
  the reason for prefixing locations by account (an existence oracle across the barrier, and
  erasure) but its acceptance list asserts the barrier only on rows. The landed code asserts the
  byte half too: two accounts attaching the same file get one digest and two absolute locations.
  Formalized as AC-1488, because the row barrier and the byte barrier are separate mechanisms and
  proving one proves nothing about the other. *(The dedup-within-an-account half stated alongside
  it on 2026-09-01 is withdrawn — see the 2026-09-10 decision above.)*

## Dependencies

- Plan item 1 — STORY-126 (Product Ticket Store), for the wired, account-scoped store these
  attachment operations run through.

## Story Points

2