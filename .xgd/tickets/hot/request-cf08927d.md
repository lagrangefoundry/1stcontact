---
uid: request-cf08927d
id: REQ-305
type: request
title: The image ladder must stream renditions and refuse on bytes, not subrequests
created_by: EPIC-16
created_at: '2026-09-22T23:12:52.642548+00:00'
updated_at: '2026-09-22T23:39:55.541190+00:00'
completed_at: null
last_field_updated: body
status: free_coding
fields:
  priority: high
  epic_parent: epic-96d8aca6
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-1210d571
---

## Why

Two separate faults in `tools/generate/src/publish/ladder.ts`, both about the same blind spot.

**1. Every rendition is retained.** `buildImageLadder` accumulates into
`const derived = new Map<string, Uint8Array>()` (line 459) and holds the lot until
`writeRevision`. The multiplier is large: `DELIVERY_WIDTHS` is
`[320, 640, 960, 1280, 1600, 1920]` (`packages/framework/src/l1/delivery.ts:33`), and a JPEG or
PNG wider than 1920 gets six rungs in its own format plus seven in WebP —
`alternativeDeliveryWidthsFor` adds the source's own width, since an alternative format has no
free rung. **Thirteen renditions per photograph**, all in memory at once.

`derived` is retained for one reason: line 509 asks `derived.has(job.path)` to decide which
rungs landed, so an alternative format with fewer than two usable rungs can be dropped whole.
That question is about paths, not bytes.

**2. The size guard measures the wrong resource.** `LADDER_MAX_RENDITIONS = 1200` is derived
with real care from the platform's 10,000 subrequests per invocation at five subrequests per
rendition, deliberately leaving headroom for the rest of the publish. It is a good guard
against a failure that is not the one that occurs. Its own header reasons:

> At thirteen renditions for a full-ladder photograph it admits about 90 pictures — several
> times the 20–40 a photo-heavy small-business site holds … no ordinary client will ever meet
> this.

Ninety pictures is on the order of 270 MB of source in the draft snapshot alone — more than
twice the 128 MB isolate, before anything is resized. So the cap admits a site roughly an order
of magnitude past where memory dies, and the failure the module was explicitly built to prevent
— *"a publish that dies most of the way through with a platform error naming nothing the client
did"* — is exactly what happens, with `LadderTooLargeError` never firing.

The reasoning was careful about the limit it could see and silent about the one it could not.

## Required behaviour

1. **Renditions are not accumulated.** A rendition is rendered, written to its destination, and
   its buffer released. Ladder memory is bounded by the number of renditions in flight — which
   `LADDER_CONCURRENCY` already bounds — and not by the number the site needs.
2. The manifest is unchanged in content and ordering. Deciding which rungs landed, and dropping
   an alternative format with fewer than two of them, still works — from the set of paths
   written rather than from retained bytes.
3. **A publish that will exhaust memory is refused before it starts, in terms of the site.**
   The projected byte cost is checked alongside the projected rendition count, and whichever
   ceiling is reached first produces the refusal. The existing intent holds: refuse before
   writing anything, and name facts the client can act on.
4. The refusal names the site's own facts — how many pictures, how much they weigh, what the
   ceiling is — and a remedy the client can carry out. `LadderTooLargeError`'s present wording
   is the model: *"Removing some pictures, or replacing the largest with smaller ones, will let
   it publish."*
5. The subrequest guard is kept, not replaced. Both limits are real; a site can meet either.
6. The `held` short-circuit still works — renditions already present are not re-rendered, and
   the progress denominator still counts only outstanding work, so a republish still reports
   *"nothing to do"* rather than a fictional minute of resizing.
7. Progress reporting keeps its current shape and meaning.

## Scope

Where a streamed rendition is written, and how that interacts with revision storage, depends on
the outcome of the content-identity work on publish. The two can land in either order and
neither blocks the other; if content-addressing lands first, the destination is a
content-addressed blob and this ticket writes to it.

**Out of scope:** `DELIVERY_WIDTHS` itself, the choice of alternative format, and the delivery
policy generally. This ticket changes how the ladder is *executed and bounded*, not what it
decides to build.

## Acceptance

- Building a ladder for a photo-heavy site holds no more rendition bytes than its concurrency
  allows.
- A site whose ladder would exhaust memory is refused before any rendition is written, with a
  message naming the site's pictures and a remedy — not a platform error.
- A site within both ceilings publishes, and its manifest is byte-identical to what it would
  have been before this change.
- A republish with no image changes still renders nothing and reports nothing outstanding.
## Design decisions (as implemented)

**The sink, and what a build reports.** `buildImageLadder` takes an `open?: () =>
Promise<RenditionSink>` — a factory, not a sink, so nothing is opened until both
ceilings are cleared and a refusal costs nothing. Each rendition is rendered,
awaited through the sink, and released inside the job that produced it, so peak
rendition memory is `LADDER_CONCURRENCY` renditions regardless of the site's size.
`LadderBuild.derived: Map<string, Uint8Array>` becomes `LadderBuild.landed:
ReadonlySet<string>` — the paths that landed, which is the only thing deciding the
manifest ever needed. A rung the renderer could not produce is never written, as
well as never named. Absent `open`, the pipeline is unchanged with the write left
out, which is what a caller asking "what would this site's ladder be" wants.

**Where a rendition goes, and the revision lifecycle.** Content-addressed publish
has not landed, so the destination is the revision's own `out/`, as before. That
requires the destination to be open before the ladder renders, which the single
`writeRevision` call could not provide — so the port gains one verb:

- `SiteStore.beginRevision(site, id): Promise<RenditionSink>` — takes the revision
  id and opens its derived channel. `RevisionContent.derived` is removed;
  `writeRevision` is still the one act that makes a revision exist, and until its
  log entry lands what the sink wrote is unreachable bytes.
- `publishSite` reads `nextRevision` before the ladder rather than as the entry is
  assembled (`beginRevision` needs to know which revision it is opening). It is a
  read in every adapter and reserves nothing, and every non-ladder refusal is
  still upstream of it.
- A publish opens exactly one destination, whether or not the deployment can build
  renditions — the adapters also use this verb to make the destination ready, and
  a lifecycle that sometimes ran would be two lifecycles wearing one name.
- **D1/R2:** the [[REQ-266]] §2 revision-id claim moves from `writeRevision` into
  `beginRevision`. This is a strengthening, not a relocation: the front of the
  write is now `beginRevision`, so the loser of a race between two publishes of one
  site still writes nothing — and now fails before paying for a ladder rather than
  after. `writeRevision` keeps its own ownership and published-id refusals, so a
  caller arriving with an id it never minted is still refused before its first
  `put`.
- **Filesystem:** `beginRevision` is what empties `dist/published/`, because a
  rendition written before `writeRevision` would otherwise be deleted by it. The
  revision's own source directory is still emptied by `writeRevision`.
- **In-memory:** `beginRevision` creates the revision's derived map, which the
  sink fills; `derivedRevision` therefore answers an empty map for a publish that
  built nothing and `null` only for a revision that was never begun.

**The weight ceiling.** `LADDER_MAX_SOURCE_BYTES = 32 MiB` — the total source
weight of the pictures one publish will carry. Derived from the 128 MB isolate:
the publish holds the draft's sources and, after the first publish, the previous
revision's snapshot read for the diff, so the pictures are paid for roughly twice
before a transform runs; 32 MiB leaves half the isolate for the render, the
runtime and the handful of renditions in flight. It admits about forty web-prepared
pictures, twenty at 1.6 MB, ten camera originals at 3 MB — so a photo-heavy site
whose images went through any export step fits, and the site that uploaded forty
originals is refused in its own terms rather than dying.

It counts only the assets this module would ladder (`isLadderedAsset`), not the
whole asset library: a document weighs on the same isolate but is not something
the ladder decided to do anything with, and a refusal blaming a client's
photographs for a PDF's weight would name a remedy that does not work.

It is checked **first**, before any measurement, because it is `bytes.length` and
costs no round trip — so the cheapest refusal comes first and a site over both
ceilings is told the fact that was actually going to kill it.

**`LadderTooHeavyError`, a sibling of `LadderTooLargeError`.** Both limits are
real and a site can meet either — one bounds how many requests a publish makes,
the other how much it holds — so the subrequest guard is kept untouched rather
than folded into one number that would report the wrong fact about whichever bound
was looser. The new error names the site's own facts (how many pictures, what they
weigh in MB, what one publish can carry) and carries the same remedy sentence:
*"Removing some pictures, or replacing the largest with smaller ones, will let it
publish."*

## Test plan

New UATs in `tests/test_UAT_FC_REQ-305_streamed_ladder.test.ts`:

- `holds_no_more_rendition_bytes_than_its_concurrency_allows` — thirty pictures,
  390 renditions, 24 MB of ladder; the sizer and sink account for every buffer
  between existing and written, and the observed peak is `LADDER_CONCURRENCY`
  renditions.
- `the_sink_receives_exactly_the_renditions_the_manifest_names` and
  `a_rung_that_would_not_render_is_never_written`.
- `the_manifest_is_identical_whether_or_not_a_sink_is_open` — content and
  serialised ordering both.
- `refuses_a_site_whose_pictures_weigh_more_than_a_publish_can_hold` — the message
  names the count, the weight, the ceiling and the remedy; no measurement, no
  transform, no destination opened.
- `weighs_the_pictures_and_not_the_whole_asset_library`.
- `keeps_the_subrequest_ceiling_and_reports_the_one_a_site_meets_first`.
- `opens_the_destination_once_before_the_first_rendition_and_before_the_revision`,
  `a_publish_with_no_ladder_still_opens_exactly_one_destination`, and
  `a_publish_refused_by_weight_leaves_no_revision_and_opens_nothing`.
- `a_republish_reports_nothing_outstanding_and_names_the_same_renditions`.

Regression scope: the REQ-222 node and workerd ladder suites (updated for
`landed`), the REQ-266 immutability/claim suites, and the publish/store suites
that drive `writeRevision` through the fixture.
