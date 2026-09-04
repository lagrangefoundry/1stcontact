---
uid: acceptance_criterion-fd8c9969
id: AC-1550
type: acceptance_criterion
title: An image is described by what it depicts, in the words someone would search
  by
created_by: xgd
created_at: '2026-09-04T04:12:31.123279+00:00'
updated_at: '2026-09-04T04:23:06.463196+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-724e4e8c
  kind: behavior
  regression_only: false
---

## Criterion

An image is described by what it *depicts*, in the ordinary words someone would search by, and that
description becomes the material's body — so a photograph named `IMG_4821.jpg` is retrievable by
"the kitchen at dusk".

The resulting record states:

- a description containing the depicted content, not merely the filename,
- a title drawn from the same single act of looking that produced the description — one look per
  image, never a second call to title it,
- an outcome of "a real description",
- a producer naming the model that answered.

The image's declared type reaches whatever looks at it intact, and where the look returns only a
single passage that passage becomes the description rather than being consumed as a title and
leaving the body empty.

## Verification

Ingest an image with a supplied describer that returns a known title-and-description answer. Assert
the created material's description contains the depicted words, its title is the answer's title, its
outcome is the real-description value, its producer is the answering model's identifier, and the
describer was invoked exactly once with the image's declared content type. Repeat with a describer
returning a single passage and no title, and assert the description is non-empty and carries that
passage.