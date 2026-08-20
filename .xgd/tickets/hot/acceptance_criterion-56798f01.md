---
uid: acceptance_criterion-56798f01
id: AC-1354
type: acceptance_criterion
title: Each entry point names its store once at start-up, and the assistant's tool
  adapter edits through the one it named
created_by: xgd
created_at: '2026-08-20T15:59:43.588551+00:00'
updated_at: '2026-08-20T21:48:32.121601+00:00'
completed_at: null
last_field_updated: body
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

**The single-naming half is structural**, as the import claim beside it is: assert that each of the
three entry points constructs the filesystem adapter in exactly one place, and that it is
constructed nowhere in any module beneath them — every layer below accepts an injected store
rather than making one, so a store handed in is the store used and no code path chooses between
adapters at runtime.

**The behavioural half drives the assistant's tool adapter end to end against an injected store**:
apply a copy edit and assert it reads back with the change count advanced; add an asset from a
real source file and assert its bytes land in the store under the name given; and invoke that same
asset add with a source path that does not exist, asserting the refusal carries the not-found
code, the path it names, and the hint — identical to the command line's refusal for the same
input.

**Bind the operations directly; do not route this through the adapter's construction helper.** The
helper that assembles the assistant's toolbox names the filesystem adapter *after* spreading the
options it was handed, so a store passed in is silently overridden and a test routed through it
would run on the filesystem — a false green on the one criterion whose whole point is that no
filesystem is reached. The operations are exported on their own, separately from the toolbox
class, for exactly this reason; bind them to a site with an injected store and exercise them
there. That override is the helper's *intended* behaviour at that entry point — it is precisely
where the filesystem adapter is named once, as this criterion requires — so it constrains how the
criterion is verified and is not a defect to be repaired in production code.
