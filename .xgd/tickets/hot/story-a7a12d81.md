---
uid: story-a7a12d81
id: STORY-127
type: story
title: 'Material Blob Storage: The Client''s Attached Bytes, In A Store The Public
  Site Has No Reach Into'
created_by: xgd
created_at: '2026-09-02T00:16:45.252755+00:00'
updated_at: '2026-09-02T00:26:35.494661+00:00'
completed_at: null
last_field_updated: status
status: completed
fields:
  intent_uid: request-13a5e206
  capability_uid: capability-dfb0a4ff
  story_kind: feature
  story_points: 2
---

## Story

**As a** client who hands the platform confidential material — brand guidelines, positioning
papers, competitor captures — to build a site from,
**I want** the bytes attached to that material kept in a store of the platform's own, addressed
by their content and scoped to my account, which the part of the platform that serves the public
internet has no way to reach,
**so that** a document I gave in confidence cannot become a public URL through a routing mistake,
the same file handed over twice costs one stored copy, and another account's identical file is
still a separate object rather than one we unknowingly share.

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
record that names them — the content address and the size — and that is listed back under the
ticket it belongs to. The record is what makes the bytes findable and checkable; it hangs off its
parent the same way a comment does, so there is no second lifecycle to keep in step.

**Addressing is derived from the content and scoped to the account.** The same bytes always resolve
to the same address, so one file attached twice within an account is one stored object. The address
is also prefixed by the account, so two accounts uploading identical bytes get the same content
address on their records and two different absolute locations — dedup within an account, isolation
across them. A globally shared address would be both an existence oracle across the account barrier
and an obstacle to erasing one account's material without touching another's.

**The configuration says so twice.** The deployment configuration declares this store for the local
half and again for the deployed half — a named deployment environment inherits nothing — and in
neither half is it the store the public site is served from.

In scope: attaching bytes and listing them back; the store those bytes land in and its separation
from the public site's; content-derived, account-scoped addressing; and the configuration that
declares the separate store on both deployment halves.

Out of scope: refusing to build a store when the deployment gives bytes nowhere to go (a criterion
on this capability's store story); any surface for downloading or serving attached bytes back to a
caller; ingestion, which is what would create material and attach files to it; erasure of a
client's material; and the vocabulary of material types, which is a separate story on this
capability.

## Technical Context

- **Depends on the wired store** (STORY-126, this capability): attaching happens through the same
  single wiring point that binds the account into the handle, so the account prefix on a byte
  address comes from the same validated identifier as the account filter on a row. The refusal to
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

- **The attachment record's content address and size** (decided at reconciliation, 2026-09-01): the
  intent asks that attachment operations work through the wired store and that addressing be
  content-derived, but is silent on what the record hands back. The landed code returns a record
  carrying the content digest and the byte count. Formalized as AC-1486, because every other claim in
  this story — dedup, isolation, and the disclosure check itself — is only observable if the address
  of the bytes is on the record; without it the store's own placement decisions could not be checked
  from outside.
- **Identical bytes across two accounts** (decided at reconciliation, 2026-09-01): the intent gives
  the reason for prefixing addresses by account (an existence oracle across the barrier, and
  erasure) but its acceptance list asserts the barrier only on rows. The landed code asserts the
  byte half too: two accounts attaching the same file get one content address and two absolute
  locations. Formalized as AC-1488, because the row barrier and the byte barrier are separate
  mechanisms and proving one proves nothing about the other. The dedup-within-an-account half of
  that criterion is a direct consequence of content-derived addressing that the landed suite does
  not yet exercise on its own; it is stated because it is the property the addressing exists for.

## Dependencies

- Plan item 1 — STORY-126 (Product Ticket Store), for the wired, account-scoped store these
  attachment operations run through.

## Story Points

2