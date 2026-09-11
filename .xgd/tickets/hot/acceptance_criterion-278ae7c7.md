---
uid: acceptance_criterion-278ae7c7
id: AC-1648
type: acceptance_criterion
title: The packed module is written on every application build, and an unbuilt knowledge
  base reads as an explicit absence rather than a missing module
created_by: martin-github@westhead.me
created_at: '2026-09-11T02:56:37.993713+00:00'
updated_at: '2026-09-11T02:56:37.993713+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-c4f329d3
  kind: behavior
  regression_only: false
---

## Criterion

The packed module is written on **every** build of the deployable application, whether or not a knowledge base has been built, and when none has been built it reads as an explicit *nothing* rather than as a missing module.

This unconditionality is load-bearing rather than tidy. The generated directory is not in version control, so a fresh checkout has no such module until a build writes one, and the runtime reaches it by a static import. A module written only when a knowledge base existed would therefore fail to **resolve** on any checkout that had never built one — turning a missing capability into a build that does not compile, which is a far worse failure than the one it was avoiding.

So the absent case is a value the runtime can branch on, and its type declaration is written beside it so the deployable still typechecks. That value is exactly what lets a host with no knowledge base degrade to an assistant with no knowledge tools instead of to a boot failure.

Reading a tree in which nothing has been built yields that same absence rather than an error, for the same reason: an operator who has never run the build gets an assistant that knows its tools and not the design documents, which is a degradation and not a fault.

## Verification

Run the application build's knowledge-base step against a checkout that has no built knowledge base, into an empty generated directory. Assert the module file exists anyway, that its content states the absence explicitly as a value rather than omitting the export, and that its type declaration is written beside it. Separately, read an unbuilt knowledge-base tree directly and assert it yields the absence rather than throwing.
