---
uid: story-5349d01f
id: STORY-94
type: story
title: 'Publish a site to shared storage: one revision-minting publish, driven from
  the builder and the command line'
created_by: xgd
created_at: '2026-08-06T18:38:28.628910+00:00'
updated_at: '2026-11-09T06:19:12.872497+00:00'
completed_at: null
last_field_updated: story_kind
status: updated
fields:
  intent_uid: bundle-e0143ffa
  capability_uid: capability-a12e557f
  story_kind: upgrade
  story_points: 3
  updated_by:
  - bundle-b3b7c399
  - bundle-5052a63c
  uat_coverage: pass
---

## Story

**As a** site operator, **I want** publishing to freeze my draft as a numbered
revision and put its rendered output into shared storage — from the builder's
toolbar or from one command — with every photograph also prepared at the widths
a visitor's screen actually needs, **so that** someone other than me can see the
site, pressing publish twice costs nothing, nothing I published before is ever
destroyed, and visitors are not made to download pixels they cannot see.

## Description

This story is the operator half of delivery — the act of shipping. The visitor
half (what a URL serves) is a separate story in the same capability.

Publishing no longer happens on the operator's machine. It happens wherever the
site's storage is: the builder's publish call and the command line are two
callers of one publish, and that publish reaches storage only through the store
port, so it runs against the operator's filesystem and against the cloud store
without knowing which it was handed.

In scope:

- **One publish, two front doors.** The builder's publish request and the
  operator's publish command produce the same store state from the same draft.
  There is exactly one implementation and no second handler behind the builder's
  route — the local transport used to answer publish itself, and that was the
  one route where the two front doors disagreed about what a route does. The one
  stated divergence is the image width ladder below: only a deployment with the
  image-transform binding supplies one, so the command line publishes exactly as
  it did before the ladder existed (REQ-222).
- **No filesystem on the cloud path.** Minting the revision, freezing the
  definition, rendering, and recording the entry all happen through storage
  verbs, so the whole publish runs inside the edge runtime.
- **Validate first, write nothing on failure.** An invalid draft publishes
  nothing at all — not a revision, not a log entry, not a byte of output — and
  the failure names which fields are wrong rather than reporting "publish
  failed".
- **An unchanged draft mints nothing.** Publishing a draft that matches the live
  revision returns the live revision and records no new one, because publish is
  a toolbar button and buttons get pressed twice. Re-publishing unchanged with a
  new message therefore changes nothing, message included.
- **The artifact is complete.** What is stored is both the rendered output *and*
  the frozen definition it was rendered from. This is now load-bearing for a
  different reason than it was: the mutable draft lives in the database, so the
  frozen definition beside the render is the only copy of what the site looked
  like at that revision — which is what makes a checkout possible at all.
- **History is readable and forward-only.** Every revision carries its lineage,
  message, author, per-path change list and an audit digest. Checking out an
  earlier revision re-parents the draft onto it rather than rewinding the log, so
  the next publish mints a new highest revision and records what it descended
  from. A revision is never removed, renumbered or reused.
- **Nothing is claimed on publish (REQ-190).** A site is published at its own
  opaque key, not at its slug, so publishing records no claim, consults no claim,
  and cannot be refused because another business uses the same slug. Two
  businesses can each publish a site called `home`, and each publish lands at
  that site's own address.
- **A new account's starter site is visibly unnamed.** Provisioning a business
  gives it one starter site whose slug is `unnamed` and whose displayed name is
  `Unnamed`, the same word for every account. It is a prompt to name the site,
  not a reserved word: it is unique only within the business, so every account
  can publish its starter without colliding, and renaming it is an ordinary slug
  change.
- **Publish builds the image width ladder (REQ-222).** On the platform publish,
  every raster still in the revision's assets (JPEG, PNG, WebP, AVIF) is measured
  and prepared at the conventional widths 320, 640, 960, 1280, 1600 and 1920
  that lie *strictly below* its own width, through the Cloudflare Images binding,
  during the publish — nothing is resized on request, ever. The original is the
  top rung, so nothing is ever upscaled; a picture no wider than the smallest
  rung, an SVG, a GIF, or anything the transform cannot measure gets no ladder
  and is served exactly as it is. A rendition keeps its source's format.
  Renditions are written into the revision's own rendered output, under a
  derived-assets segment, and never into the frozen definition, so a checkout
  never sees them. The ladder is found by walking the revision's assets, not the
  document, so a picture placed as a background qualifies exactly as one placed
  as an image.
- **A republish of an unchanged picture transforms nothing.** Renditions are
  content-addressed on the source picture's bytes and the width (and so on the
  recipe, which promotion has already applied to those bytes), and a
  tenant-scoped cache held outside anything a URL can reach is consulted before
  any transform. A cache hit is copied into the new revision.
- **The draft gets no ladder.** The builder's draft and edit channels never
  receive renditions; they serve the working picture, and the request-time render
  is unchanged.
- **No binding, no ladder, and an otherwise unchanged publish.** Where the
  deployment has no Images binding — and on the command line against the
  operator's disk — the publish builds no renditions and is byte-for-byte the
  publish it was before; it is never refused for want of one.

Out of scope: what a URL serves — including where the live revision is read from,
how the builder's published view reaches it, and how renditions are cached by the
visitor — belongs to the serving story in the same capability. How the rendered
page *names* the renditions (`srcset`, `sizes`, typed sources, background rules,
intrinsic dimensions), the ladder's concurrency and budget, and the publish's
progress reporting belong to the other stories REQ-222 touches. Per-account
hostnames and custom domains remain deferred.

## Technical Context

- **Publishing is a sequence over storage verbs, not a storage verb.** The store
  port carries the storage a publish needs — read the log, freeze a revision with
  its content, read one back, read and set the draft's lineage pointer — and the
  order those happen in lives in exactly one place above the port. Putting a
  publish verb *on* the port would have put the sequence inside every adapter,
  making "one implementation" something to maintain rather than something that
  cannot be otherwise.
- **The change list is canonical, not byte-for-byte.** Two stores hold the same
  definition in different shapes, so comparing what each happens to serialise to
  would make "did this page change?" depend on which store answered. Comparison
  is over the definition with keys ordered, which is what makes "the same publish
  produces the same store state on either store" true rather than approximately
  true.
- **The audit digest is not an address.** A revision is named by its number, and
  every stored key and public URL is built from that. The digest answers only the
  question a change list cannot — are these the same bytes? — across two stores.
- **What was removed, and why it was removed rather than ported.** The
  content-addressed deploy command is gone entirely, and with it: the draft and
  published deploy channels, snapshot identity as a digest of contents, the
  per-store-tree deploy index and its concurrent-writer refusal, the "shipped but
  not publicly reachable" report, the dry run, and the prune. Shipping a
  revision's bytes and recording it live is what publish itself now does with
  both storage bindings in hand. Prune has no home once the command is gone;
  bytes orphaned by an interrupted publish are unreachable, because the recorded
  revision is what vouches for them, and cost only storage.
- **Draft preview snapshots are dropped, not ported.** The shareable
  digest-addressed draft links were backed by the per-site index that has been
  deleted, so they could not remain while revisions moved without leaving exactly
  the half-migrated split the project forbids. The builder's own draft preview is
  unaffected; sharing a draft returns later as a builder control.
- **The ladder is an optional argument to the one publish (REQ-222).** The
  policy — which widths, what a rendition is called, when a transform is skipped
  — lives once, above the store port, in worker-safe code; the platform supplies
  only a decoder (the Images binding) and a bucket to cache in. The ladder is not
  a verb on the store: a store holds bytes, and the filesystem adapter must not
  need an image pipeline to be one. Code evidence: `tools/generate/src/publish/ladder.ts`,
  `apps/control-app/src/image-ladder.ts`, the `/api/publish` route in
  `apps/control-app/src/router.ts`.
- **The cap is ours, not the transform's.** The rungs are capped from the
  measured width before any transform is requested; the transform is also asked
  never to enlarge. Local emulation and the real binding differ on whether they
  will upscale, so making the cap ours is what makes them agree by construction.
- **Renditions size the promoted bytes.** The ladder sizes whatever bytes
  promotion left in the site's assets. Until REQ-229 makes promotion apply the
  recipe, those are the uncropped original — every rung correct, of the bytes
  that are there.

## Reconciliation Decisions

Recorded 2026-08-31 during reconciliation of BUNDLE-20 (REQ-149). These formalise
behaviour the implementation settled where the intent was silent, and are
decisions taken now rather than open questions.

1. **A publish against the operator's filesystem store also refreshes the local
   published output directory**, at the path the local serve, screenshot and
   fidelity loops already read, and the publish command reports that location.
   The intent specified where a revision is frozen and did not say what happens
   to the operator's local rendered tree; keeping the local loop fed is what the
   implementation chose, and it is observable at the command line, so it is
   stated in AC rather than left to be discovered.
2. **The publish command's no-op is reported distinctly** — an unchanged draft is
   reported as already published at its existing revision, rather than printing a
   revision number an operator would reasonably read as newly minted. The intent
   named the no-op; it did not name how it reads.
3. **Assets travel into both halves of a revision.** The frozen definition holds
   the asset bytes as they were, and the rendered output carries its own copy, so
   a published page whose images resolved only while the draft still held them
   cannot decay. The intent said the artifact is complete; which halves carry
   assets was left open.

4. **The superseded first-claim criterion is retired, not rewritten**
   (decided at reconciliation, BUNDLE-37, 2026-11-04). REQ-190 deletes the claim
   table, the claimed-slug refusal and its 409 outright ("deleted, not
   relaxed"), so AC-1422 is marked superseded by BUNDLE-37 and its replacement
   asserts the opposite outcome.
5. **The starter slug is `unnamed`, not `home`** (decided at reconciliation,
   BUNDLE-37, 2026-11-04). The reconciliation plan's draft criterion said the
   starter is "named home". REQ-190's own free-coding section explicitly rejects
   `home` in favour of `unnamed` / `Unnamed`, and the code matches it, so the
   intent governs and the criterion says `unnamed`. Starter provisioning sits
   here because its published-collision property is what REQ-190 changed.
   Provisioning itself and the BUG-51 guard stay STORY-121's.

Recorded 2026-11-08 during reconciliation of BUNDLE-43 (REQ-222):

6. **The ladder manifest is a render input, not a stored record** (settled at
   ladder level 1). The reconciliation plan said the publish "records a ladder
   manifest … through the store port". REQ-222's body says the opposite and the
   code agrees: *"the manifest is a render input, and the document stays innocent
   of delivery."* What crosses the store port is the rendition *bytes*, beside the
   rendered output, on the cloud, filesystem and in-memory stores alike; the
   manifest, with each picture's measured width and height, goes only into the
   render. The criterion is written that way.
7. **The command line builds no ladder, and that divergence is stated** (settled
   at level 1). REQ-222: *"`1c publish` renders exactly as it does today, and the
   ticket says so … acceptable **only** because it is stated: a divergence
   discovered later reads as a bug in the port."* The one-publish criterion
   (AC-1418) still holds for the same inputs; only the platform route supplies a
   ladder.
8. **A source exactly at a conventional width gets that width as its original,
   not as a rendition** (level 1). REQ-222 says the ladder is every conventional
   width *strictly below* the source's own, so a 320px picture gets no ladder.
9. **A rung that fails to render is dropped; the rest of the ladder and the
   publish stand** (decided now, 2026-11-08). REQ-222 covers a picture that
   cannot be measured ("no ladder rather than a failed publish") and is silent
   on a single rung failing after measurement. The code drops that rung only, and
   the page never names a rendition the revision does not hold. The same
   reasoning — one awkward picture costs its own ladder and nobody else's —
   applies, so it is formalised.
10. **A failed write to the rendition cache does not fail the publish**
    (decided now, 2026-11-08). The intent is silent. The rendition is already in
    hand and still lands in the revision; the cost is a slower next publish. It
    is not separately observable to a client, so it is recorded here and not
    given its own criterion.

## Dependencies

The store port and its cloud adapter (the revision storage verbs are part of that
port), and the builder origin that hosts the publish route. The Images binding
declared for the control app (REQ-219) for the width ladder. Pairs with the
serving story, which reads what this one records.

## Story Points

3
