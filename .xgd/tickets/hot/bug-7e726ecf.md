---
uid: bug-7e726ecf
id: BUG-95
type: bug
title: The capture path reads a stored form under current rules whatever version it
  was written at
created_by: EPIC-10
created_at: '2026-09-15T19:45:15.667229+00:00'
updated_at: '2026-09-15T19:46:03.689781+00:00'
completed_at: null
last_field_updated: body
status: draft
fields:
  priority: medium
  severity: high
  epic_parent: epic-d6d7ea63
  auto_merge_back: true
  needs_review: false
---

## Symptom

The XGD home page's `signup` form is stored as `contact-form` **v5** while the catalogue is at
v7 and every other instance on the site has moved. Nothing has told anybody, and the capture
path reads it anyway — under v7's rules.

For this particular instance the outcome is benign: it declares no asset and no template, and
v7 reads that as *capture and send nothing*, which is what a waitlist form should do. The
defect is that the benign outcome is a coincidence.

## Root cause

**Migration is an explicit act. Reading is not.**

`upgradeSiteModules` is invoked from exactly two places — an API route and a CLI command,
read-only unless `--write`. Nothing runs it on read, on publish, or on submission, and that is
defensible: an upgrade can drop config keys, so it should not happen silently.

But the capture path never asks what version it is reading. `instancesOf`
(`apps/control-app/src/lead.ts:308`) returns the raw stored modules, and `formDefinitionOf`
reads `instance.config` directly. `instance.version` is not consulted anywhere in the file.

So between the day a module gains a version and the day somebody runs the upgrade, **stored
data in an old shape is interpreted by new code**.

For `contact-form` that window has a concrete, silent failure in it. A v5 instance declares its
download as `asset` / `assetName` / `assetUrl` — three sibling strings. v7's `assetsIn` reads
`config.assets`, a list, finds nothing, and v7 reads an absent `template` as *send nothing*. A
v5 form that has been gating a download therefore stops delivering, reports success to the
visitor, and records a contact.

That is precisely the failure `contactFormV6ToV7` was written to prevent — its own header calls
it *"an artifact somebody asked for silently never arriving, which is the exact failure
`renderCopy`'s refusals exist to prevent, arriving through the door nobody was watching."* The
migration is correct and does not run.

## Fix

The capture path must not interpret a stored instance under rules it was not written for. Two
acceptable shapes:

1. **Upgrade in memory at read.** Apply `upgradeInstance` to the stored module before reading
   its config, changing nothing in the store. The reader then always sees the current shape,
   and the persisted upgrade stays the explicit act it is today.
2. **Refuse to guess.** Report a version mismatch as its own outcome, so a form whose stored
   shape is stale fails loudly instead of capturing-and-not-sending.

(1) is preferred: it makes the behaviour correct rather than merely visible, and the migration
functions already exist and are tested.

Either way, `instance.version` stops being a field nothing reads.

## Test plan

`tests/test_UAT_FC_BUG-95_stored_version.test.ts`:

- **The silent failure, asserted directly**: a `contact-form` stored at v5 carrying
  `asset`/`assetName`/`assetUrl` delivers its download on submission. Today it delivers
  nothing and reports success.
- A v5 instance carrying no asset still sends nothing — the benign case stays benign, and the
  fix does not invent a delivery.
- A v6 instance carrying assets sends, per `contactFormV6ToV7`'s rule that it names `asset`.
- The store is not rewritten by a read: after a submission, the stored instance is still at the
  version it was, byte for byte.
- An instance at the current version takes no upgrade path at all.
- A module type the catalogue does not know is left alone rather than thrown on, matching
  `upgradePageModules`'s existing rule.
- The XGD shape: home's v5 waitlist form and whitepapers' v7 gated form on one site both behave
  correctly on the same submission path.
