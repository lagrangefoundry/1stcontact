---
uid: request-cf08927d
id: REQ-305
type: request
title: The image ladder must stream renditions and refuse on bytes, not subrequests
created_by: EPIC-16
created_at: '2026-09-22T23:12:52.642548+00:00'
updated_at: '2026-09-22T23:27:16.998113+00:00'
completed_at: null
last_field_updated: status
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