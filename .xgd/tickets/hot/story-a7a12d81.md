---
uid: story-a7a12d81
id: STORY-127
type: story
title: 'Material Blob Storage: The Client''s Attached Bytes, In A Store The Public
  Site Has No Reach Into'
created_by: xgd
created_at: '2026-09-02T00:16:45.252755+00:00'
updated_at: '2026-09-04T05:18:22.106103+00:00'
completed_at: null
last_field_updated: status
status: updated
fields:
  intent_uid: request-13a5e206
  capability_uid: capability-dfb0a4ff
  story_kind: upgrade
  story_points: 2
---

## Story

**As a** client who hands the platform confidential material — brand guidelines, positioning
papers, competitor captures — to build a site from,
**I want** the bytes attached to that material kept in a store of the platform's own, scoped to my
account and addressed by the record that owns them, which the part of the platform that serves the
public internet has no way to reach,
**so that** a document I gave in confidence cannot become a public URL through a routing mistake,
deleting one piece of my material actually takes its bytes away rather than leaving them reachable
through a sibling record, another account's identical file is still a separate object rather than
one we unknowingly share, and the surface that shows me my own file can actually fetch it back.

## Description

Client material is a record *and* bytes. The record — what the material is, who owns it, whether
it may be republished — is a ticket. This story is the other half: where the bytes go, and how
they come back.

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
record that names them — the content digest and the size — and that is listed back under the ticket
it belongs to. The record is what makes the bytes findable and checkable; it hangs off its parent
the same way a comment does, so there is no second lifecycle to keep in step. Bytes are read back
*through that record*: given the record, the store's own scoped byte handle returns the bytes it
owns, and a record whose bytes are gone is reported as bytes that went missing rather than as a
record that never existed.

**One record owns one stored object, and the address is the record's own identity.** The bytes
attached to a record are stored under that record's own identifier inside the account's namespace.
The content digest stays on the record, but as an integrity field rather than as the address: it is
what proves the bytes are the bytes, not what says where they are. This is deliberate, and it is
what deletion needs. Addressing by content would make one stored object the shared property of every
record that happened to hold the same file, and a shared object cannot be moved to the trash without
breaking whichever sibling record still names it — and moving it is exactly what makes deleting a
client's material actually revoke reach rather than merely hide a row. So the same file handed over
twice is two records and two stored objects, within one account as well as across two. Identical
bytes still produce an identical digest on both records; what they no longer produce is one object.

**The account is never chosen by the caller.** The address is prefixed by the account the store
handle is bound to, so two accounts attaching byte-for-byte identical content get the same digest on
their records and two different absolute locations, and no caller can place bytes into, or read them
out of, another account's namespace — whether by mistake or by naming the address. A globally shared
address would be both an existence oracle across the account barrier and an obstacle to erasing one
account's material without touching another's.

**The configuration says so twice.** The deployment configuration declares this store for the local
half and again for the deployed half — a named deployment environment inherits nothing — and in
neither half is it the store the public site is served from.

In scope: attaching bytes and listing them back; reading the bytes back through the record that owns
them; the store those bytes land in and its separation from the public site's; record-scoped,
account-prefixed addressing with the digest retained for integrity; and the configuration that
declares the separate store on both deployment halves.

Out of scope: refusing to build a store when the deployment gives bytes nowhere to go (a criterion
on this capability's store story); the HTTP surfaces that serve a client their own file or promote it
onto a site (the Library and promotion stories); ingestion, which is what would create material and
attach files to it; erasure of a client's material; and the vocabulary of material types, which is a
separate story on this capability.

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
  byte half too. Formalized as AC-1488, because the row barrier and the byte barrier are separate
  mechanisms and proving one proves nothing about the other.
- **Addressing moved from the content digest to the owning record, and dedup is withdrawn**
  (decided at reconciliation, 2026-09-03, REQ-161): the intent behind this story asked for
  content-derived addressing and named cheap duplicate storage as one of its benefits. The ticketing
  component this store is built on subsequently gave content-addressing up *deliberately and for a
  stated reason* — a stored object shared between two records cannot be moved to the trash without
  breaking whichever sibling still names it, and moving it is what makes deletion revoke reach — and
  REQ-161 states that supersession explicitly, restating this story's addressing criteria rather
  than treating the change as a defect. So this is later intent overriding earlier intent, not code
  contradicting intent. AC-1486 and AC-1488 are restated accordingly: the digest is retained on the
  record as an integrity field, the address is the record's own identifier under the account prefix,
  and one record owns exactly one stored object. The claims that carried the story's actual value —
  bytes in the private store and never the public one (AC-1487), and one account unable to address
  another's bytes (AC-1487/AC-1488) — are unchanged. Both suites were already failing against the
  landed component before REQ-161; the matrix, not the code, was the thing out of date.
- **Reading bytes back through the owning record** (decided at reconciliation, 2026-09-03,
  REQ-161): the intent for this story described attaching and listing and was silent on retrieval,
  because at the time nothing read a blob back — which is exactly why the addressing error was
  invisible for two intents. Formalized as a criterion now, because "the bytes are in the private
  store under the account's prefix" is unfalsifiable from the record alone if the record's stated
  address cannot be used to fetch them, and because the surfaces that show a client their own file
  are built entirely on this one operation. The criterion covers reading back through the record and
  the honest failure when the bytes are absent; the HTTP routes that expose it belong to the Library
  and promotion stories.

## Dependencies

- Plan item 1 — STORY-126 (Product Ticket Store), for the wired, account-scoped store these
  attachment operations run through.

## Story Points

2