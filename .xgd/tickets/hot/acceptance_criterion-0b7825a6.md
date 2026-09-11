---
uid: acceptance_criterion-0b7825a6
id: AC-1691
type: acceptance_criterion
title: An image is described by what it depicts, in the words someone would search
  by, and never by its filename
created_by: martin-github@westhead.me
created_at: '2026-09-11T04:22:58.078049+00:00'
updated_at: '2026-09-11T04:22:58.078049+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-4cabde9a
  kind: behavior
  regression_only: false
---

## Criterion

An image is described by **what it depicts**, not by what it is called.

When an image describer is configured:

- the body carries the ordinary words for what the image shows — subject, setting, time of day,
  who is in it — such that an image named `IMG_4821.jpg` showing a restaurant kitchen in the
  evening is described in those terms and not by its filename;
- the title is the description's own opening line rather than the filename;
- where the description arrives as an opening line and further sentences, **both** reach the
  body: a description reduced to its title alone is never produced;
- the recorded outcome is the described outcome and the recorded describer identifies the model
  that produced it;
- the image is offered for description under its **own declared type**, never re-labelled as
  another.

## Verification

With a describer configured to return a known title line and a known description, hand the step
an image whose filename shares no words with either. Assert the body contains distinctive words
from the description, the title equals the description's opening line, the outcome is described,
the describer records the responding model's identity, and the describer was offered the image's
declared type. Repeat with a describer returning a single paragraph and assert the body is that
paragraph rather than empty.
