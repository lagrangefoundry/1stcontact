---
uid: story-aacb7060
id: STORY-143
type: story
title: 'Site-Asset Promotion: Only Material The Client May Publish Reaches Their Public
  Site'
created_by: martin-github@westhead.me
created_at: '2026-09-11T05:02:09.778452+00:00'
updated_at: '2026-11-09T23:42:36.329114+00:00'
completed_at: null
last_field_updated: status
status: updated
fields:
  intent_uid: bundle-87be4669
  capability_uid: capability-20802191
  story_kind: upgrade
  story_points: 5
  updated_by: bundle-5607a08d
---

## Story

**As a** client of the caretaker platform, **I want** a file I meant for my website to land in
my site's asset library the moment I hand it over — and anything I gave the platform only to
read, or anything the platform mirrored from somebody else's website, to be incapable of
getting there at all — **so that** my own pictures are usable on my pages straight away, the
platform knows exactly which of my sites each file is on, and nothing I do not hold the rights
to is ever published under my own domain.

## Description

Putting a piece of the client's material into a site's asset library is the single most
damaging action available in the platform: it takes something private and makes it servable to
the public internet under the client's own domain, which is how third-party copyright gets
published by accident. This story is the gate in front of that action, the act itself, and the
record the act leaves behind.

The gate is a property of the material's own rights record, not of which surfaces happen to be
wired: material whose record does not permit republishing cannot be promoted by any caller,
and no caller can assert its way past it, because the decision is read from the record rather
than from an argument. Material the client handed over as background, only for the platform to
read, therefore cannot reach a published site at all — it is refused mechanically rather than
merely not routed.

**The same rule holds at the door that has no record to read.** A whole site can also be
copied up from a local draft — `1c push`, and the `POST /api/import` route it posts to. Bytes
arriving that way carry no material record, so the gate above has nothing to consult. A
subresource mirrored from a captured third-party page into a local draft could therefore reach
a client's site with no rights record at all (BUG-84). That door is now gated by one rule:
**bytes this system mirrored from a captured page may not enter a site's assets.** Identity is
the sha256 of the bytes. The copy into a draft destroys every other link back to the capture,
so the same bytes under any name are refused, and different bytes under a captured name are
not. Every mirrored subresource counts, not only pictures, because a third party's stylesheet or
licensed webfont is the same act as their photograph. The refusal has no override, as the
promotion refusal has none: an escape hatch on a rights gate is the gate not existing.

The rule is enforced at both halves of that door, because each half holds evidence the other
cannot see. `1c push` checks against the operator's own capture bundles and refuses before
anything is uploaded. This half catches a capture taken on a laptop, which never reaches cloud
storage. The import route checks against the requesting business's own cloud capture bundles
and answers 403 before any draft exists, so a request posted by hand is refused too. That 403
stays distinct from the 409 the same route gives for "you would replace builder changes",
which `--force` answers. One business's captures never decide what another business may
publish.

Promotion is a **copy across the storage boundary**, not a reference to the private bytes. The
site's asset library and the client's private material live in separate stores precisely
because one of them is reachable by the public internet and the other is not; a promoted asset
is a second copy that lives on the public side, while the original stays private. That copy is
the act: taking something private and making it publishable is a real decision, and the byte
copy is that decision made honest.

Promotion lands an asset **by the same add path every other asset takes** — an operator import,
an assistant edit — under one set of rules about names, and leaves the same note in the site's
draft change journal that every other asset write leaves. The assistant is therefore told, on
its next turn, that a picture arrived, rather than having to notice it.

Two properties protect what is already live. Promotion **never overwrites** an asset already on
the site — a picture the visitor sees today cannot be silently replaced by a client dropping a
second file of the same name — so a free name is chosen and the name actually used is reported
back. And a promotion that cannot complete **does not lose the file**: by the time placement
runs the material is already stored, described and findable, so a failure to place is reported
as a named placement failure on an otherwise successful hand-over rather than as "your upload
failed", which would be both untrue and unrecoverable.

**Placement is a recorded fact, written only when it is true.** A material carries the list of
the client's sites it has been placed on. A site is added to that list only once a promotion
onto it has actually landed — never because a site happened to be open when the file was handed
over, never for a file handed over as background, and never for a promotion that failed. Placing
the same material on the same site again records it once; placing it on two of the client's
sites records both, because one file may legitimately back several of a client's sites. The
site that was open at hand-over is an instruction to promotion, not a label stored on the
material.

**In scope**: the rights gate, the byte copy into the site's asset library through the ordinary
asset-add path and its journal note, free-name selection and the reported name, the immediate
placement of a file handed over for a selected site, the placement record that promotion writes,
what the client is told when placement fails, and the capture-mirrored-bytes gate on the
seed/push door (`1c push` and `POST /api/import`).

**Out of scope**, each covered by its own story: the ingestion pipeline that creates the
material and its bytes (STORY-140); how the file is described (STORY-141); the declared field
vocabulary the rights record is written in, including the role the client supplies (STORY-128);
the browser overlay whose two areas are where a client states what a file is for (STORY-145);
what a site's asset library contains and how it is listed (STORY-102); and how the Library
displays placement (STORY-144). Also out of scope, per BUG-84: whether the seed/push door,
`write_image` or `add_asset` mint catalogue items, and whether capture-bundle members become
catalogue items (REQ-228 Halves B and D); BUG-51's builder-change conflict on the import route,
which this story only keeps distinct; and cleanup of the already-landed dev-fixture row, which
is an operator task.

## Technical Context

- The two stores are separate on purpose (architecture policy: R2 for blobs, with the public
  site served from its own store). The client's material store is one the Worker serving the
  public internet holds no binding for. A site asset that merely pointed at the private bytes
  would therefore be unresolvable — and making it resolve would mean granting the public
  Worker reach into the private store, which is the disclosure the boundary exists to prevent.
  The copy is a consequence of that boundary, not a convenience.
- Promotion goes through the site asset store's ordinary add path (CAP-88 / STORY-102), so a
  promoted asset lands by the same route an operator import or an edit lands one, under one set
  of rules about names, and makes the same draft-journal entry (BUG-45). The asset carries only
  its bytes: the site keeps no registry and no alt text for an asset (BUG-44, STORY-102); the
  material's description stays on the material, where the assistant reads it to write alt text
  onto the image element that places the picture.
- Placement is the material's `placed_on` field — a list of site slugs, declared as part of the
  material/reference vocabulary and not required. It replaced the retired `site_slug`, which
  recorded the site open at upload and was misread as placement (BUG-47). Hand-overs, whether
  dropped or fetched on the client's behalf, write no site field at all; a fetch forwards no
  site, since fetched material is never republishable and can never be promoted.
- The rights record promotion reads is written at ingestion from provenance and never from a
  question put to the client (STORY-140, STORY-128). The rights question is answered once,
  where it can be answered, and the dangerous action is forbidden outright instead.
- Reading the material's own bytes goes through the account-bound handle, so promotion cannot
  address another account's bytes even with a correctly-formed key (STORY-127).
- The intent shipped this gate deliberately ahead of any caller — "implement the function with
  its refusal now, so REQ-161 wires a surface to something already safe" — which is why the
  refusal is observable both on its own and through the platform's material entry point.
- Accepted by BUG-47, stated by its operator and not criteria here: **no backfill** — material
  carrying the retired field gains no placement and reads as unplaced until something places
  it, because upload context cannot be told apart from a landed promotion; and **placement is
  recorded, not verified** — an asset later removed from a site still leaves that site in the
  material's list.
- **Seed/push gate (BUG-84).** There is one predicate over the `ReferenceStore` port with two
  adapters. The CLI passes the filesystem adapter over `storage/references/`. The import route
  passes the R2 adapter bound to the requesting business by `forTenant`, so the business barrier
  is inherited rather than re-enforced. The scan covers only each bundle's `assets/` prefix. The
  bundle's derived members run to tens of megabytes and are never copied into a draft, so
  reading them per import would put Worker limits between the operator and their push. The
  incoming assets are hashed first, so a payload with no assets touches no store and a business
  with no captures costs one empty listing. A deployment with no `BLOBS` binding has no
  reference store and the route proceeds unchecked. `PushOptions.references` is required, so a
  caller cannot forget the gate. A caller with no bundles passes a store that lists none.
- **Known consequence accepted by BUG-84's operator:** `bin/publish` with no slugs named now
  stops at any `1c repro` reproduction in `storage/sites/`, naming the file and its bundle,
  because a reproduction was never publishable. The reproduction keeps rendering locally.

## Reconciliation Decisions

- **Promotion copies the bytes rather than referencing them** (decided at reconciliation,
  2026-09-10): REQ-163's decisions section says promotion "writes a `site_assets` row pointing
  at the existing blob". The same ticket's own "What was built" section withdraws that with its
  reason — the public site's asset reads resolve against the public store alone, so a row
  pointing into the private store would not resolve, and making it resolve would hand the
  public Worker a binding on the private bucket. The later passage is the operator correcting
  the earlier one, so the criteria assert a copy. Stated as an observable property (the asset
  reads back from the site, the material remains private) rather than as a storage mechanism,
  so a reimplementation that honours the boundary another way still satisfies it.

- **Material with no bytes attached is refused** (decided at reconciliation, 2026-09-10): the
  intent names only the rights refusal. The landed gate also refuses a material that has no
  file attached to it, saying there is nothing to publish. Formalized as an AC because the
  alternative — an asset appearing in the site's library with no bytes behind it — is a broken
  picture on a live page, and because it is the same failure the pipeline's ordering property
  exists to make unobservable.

- **The reported placement failure names no platform secret** (decided at reconciliation,
  2026-09-10): the intent asks only that a failure be "reported in the envelope rather than
  turned into a 500". The landed path also scrubs the reason before it leaves the platform.
  Formalized as a clause of the failure criterion, because this is the one shape that looks
  like it escapes the origin's redaction guarantee — a successful response carrying a message
  from a caught failure — so leaving it unasserted would leave the guarantee with a hole
  exactly where it is least obvious.

- **Re-promotion to a site already listed records it once** (decided at reconciliation,
  2026-10-25, BUNDLE-32): BUG-47 names multi-site placement and success-only recording; the
  implementation also unions rather than appends, and its own write-up gives the reason (a
  client dragging the same logo again). Formalized in the placement criterion, because a list
  claiming two placements where there is one would make every reader of it overstate.

- **The seed/push refusal names an offending asset, not necessarily every one** (decided at
  reconciliation, 2026-11-09, BUNDLE-44): BUG-84 asks that "the refusal names the offending
  asset and the bundle member it mirrors". The plan's draft wording said "each offending asset".
  The landed gate stops at the first match, and its write-up says why: one match is enough to
  refuse the push, and stopping early bounds the cost by the first offending member rather than
  by the size of the reference store. The criteria therefore require at least one offending
  asset to be named, with its bundle and member, and do not require an exhaustive list.

- **`--force` does not reach the gate on the CLI either** (decided at reconciliation,
  2026-11-09, BUNDLE-44): BUG-84 states the no-override rule for the gate as a whole. The CLI
  refuses while reading the draft, before `--force` is even put on the request, so the CLI
  criterion asserts it as well.

- **Code issue: the CLI reports the import route's 403 with Cloudflare Access advice**
  (flagged at reconciliation, 2026-11-09, BUNDLE-44, for `fix_uat_coverage`): BUG-84 says the
  rights refusal and BUG-51's conflict "must stay distinguishable". It also says the operator is
  to be told which file and where it came from, "rather than that the push was refused". When
  the Worker half refuses (a capture that lives only in the business's cloud bundles), the
  push client lumps every 403 in with Access refusals. It appends advice to set an Access service
  token, which tells the operator to fix credentials that are fine. The response body still
  names the asset and bundle, so the criteria are met. The appended advice misleads, and the
  client should tell the rights 403 apart from an Access 403, e.g. by the body's `asset` field.
  This is not formalized as a criterion. It is recorded so the CLI message can be corrected.

## Dependencies

STORY-140 (Ingestion) — promotion reads a material record and its bytes, which ingestion
creates. Plan item 7. The seed/push gate reads capture bundles through the reference store
port, which the capture pipeline populates.

## Story Points

5