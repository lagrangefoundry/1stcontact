---
uid: acceptance_criterion-56798f01
id: AC-1354
type: acceptance_criterion
title: Each entry point names its store once at start-up, and the assistant's tool
  adapter edits through the one it named
created_by: xgd
created_at: '2026-08-20T15:59:43.588551+00:00'
updated_at: '2026-08-20T16:00:06.922984+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-3f4a5f2b
  kind: behavior
  regression_only: false
---

## Criterion

Nothing chooses a store at runtime. Each entry point names the store once, at start-up, and
everything downstream simply takes what it was given:

- the command line names it once, where it builds the options every edit command runs under;
- the builder origin names it once per context, and its preview of a draft renders through that
  same one;
- the assistant's tool adapter names it once, where its editing surface is constructed.

No command, route or tool operation below those three detects a store, selects between stores, or
falls back to one: none of them can tell which it got, and there is no mode to be in.

The assistant's tool adapter drives a real edit through the store it was given — a copy edit
lands and reads back, and the change count advances with it — and adds an asset by reading the
operator's source file *itself* and handing bytes across, because a path on the operator's disk
is a source outside the site and means nothing to a store. A source file that does not exist is
refused there with the envelope that refusal has always carried: the same code, the same path,
and the same hint the command line produces for the same input.

## Verification

Assert that each of the three entry points constructs its store in exactly one place and that
every layer beneath it accepts an injected store rather than constructing one — a store handed in
is the store used, and no code path chooses between adapters at runtime. Then drive the
assistant's tool adapter end to end against an injected store: apply a copy edit and assert it
reads back with the change count advanced; add an asset from a real source file and assert its
bytes land in the store under the name given; and invoke that same asset add with a source path
that does not exist, asserting the refusal carries the not-found code, the path it names, and the
hint — identical to the command line's refusal for the same input.