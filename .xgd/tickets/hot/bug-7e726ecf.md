---
uid: bug-7e726ecf
id: BUG-95
type: bug
title: The capture path reads a stored form under current rules whatever version it
  was written at
created_by: EPIC-10
created_at: '2026-09-15T19:45:15.667229+00:00'
updated_at: '2026-09-20T18:30:53.149858+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  priority: medium
  severity: high
  epic_parent: epic-d6d7ea63
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-def246ab
  commits:
  - working_sha: 0cf4779053cf1ee796ca93d738c7b371c84471fe
    reconcile_sha: null
    main_sha: null
  version: 0.2.205
  story_points: 3
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

## What was implemented

Shape (1), as a new `currentShapeOf` in `apps/control-app/src/lead.ts`. `formDefinitionOf`
matches the named instance as before and then carries it to the catalogue's current contract
**before a line of its config is read** — so every reading below it (the field list, `assetsIn`,
`acceptsIn`, the template key) is unambiguously the current version's.

Decisions made in the course of it:

- **It reuses `upgradePageModules` rather than restating any of its rules.** That function
  already leaves a type the catalogue has never heard of alone instead of throwing, and that is
  exactly the rule wanted here; a second implementation would be free to disagree with the
  first. Exported from `@1stcontact/framework/worker` for precisely this class of caller, so
  nothing new had to be made reachable.
- **Only the instance being read is carried, not the whole page.** A migration that cannot
  produce a valid instance throws. A page-wide pass would let one broken *sibling* take down a
  submission to a form that is perfectly well formed, and the caller has already picked the one
  instance whose config it is about to interpret.
- **Anything not recognisably a pinned instance (`id`, `type`, integer `version`) is passed
  through untouched**, on `instancesOf`'s own reasoning: this reads whatever a frozen revision
  holds, including — on a bad day — something that is not a module at all.
- **A migration that genuinely cannot run still throws**, and is not caught. Catching it and
  returning `null` would reproduce the defect this ticket is about: the contact is captured, the
  visitor is told it worked, and nothing is sent. This is fix-shape (2) surviving inside
  fix-shape (1), for the cases where (1) cannot apply. It matches what [[BUG-91]] already does
  for the render path, on the same guarantee — [[BUG-85]] made a declared migration the
  precondition for a version bump and `missingMigrations` enforces it in CI, so this is
  unreachable for any catalogue-known type that has not been written by a newer build.
- **Nothing is written.** The store keeps its pin until an ordinary edit rewrites the page or an
  operator runs `1c module upgrade --write`, which goes on reporting these instances as stale
  because they are.

This is the same answer [[BUG-91]] gave the *render* path in `assembleSite`, applied to the
*capture* path, which does not go through `assembleSite` — it reads pages straight out of
`readRevision` / `readPages`.

### Supersession: `test_UAT_FC_REQ-241_a_revision_published_before_this_ticket_still_resolves`

That UAT asserted the **opposite** of this fix: that a v5 form carrying the old triple captures
and deliberately does *not* deliver, on the reasoning that the triple is not the v6 contract and
that teaching the receiver to read both shapes would be the legacy-alias mode this codebase
refuses outright.

The first half of that reasoning is right and the conclusion does not follow. Nothing here reads
two shapes: the instance is carried across its own declared, tested migrations and then exactly
one shape — v7's — is read, so the alias never exists. What the old reading actually shipped was
the silent non-delivery above. **The assertion is inverted by this ticket and the test now
asserts delivery.** No AC exists for it yet (it is still an `FC_`-named test), so no acceptance
criterion is invalidated — but reconciliation should treat BUG-95 as authoritative over
REQ-241 on this specific point.

### Test-fixture changes (`tests/support/lead-site.ts`)

The fixture had to be able to write stored shapes the current contract no longer produces, and
had to be faithful enough for those shapes to survive a migration:

- **`SeedForm.storedVersion`** — pin an instance at 5, 6 or 7. The config is written in *that*
  version's shape: below v7 there is no `template` key, because v7 invented it, so a fixture
  writing one would seed a revision no store has ever held and would do the migration's job for
  it. Defaults to 5 with `legacyAsset` and 7 otherwise, matching every existing caller.
- **`sendsTemplateOf`** — email pages are materialised for the message a form *sends* rather
  than the key its stored config spells, because a pre-v7 instance names none and sends `asset`
  all the same. Without this a legacy form would resolve a message its site does not hold,
  report `no_template`, and mail nobody — the fixture quietly asserting the very silence this
  ticket exists to end.
- **Every seeded instance now carries its required `form` slot.** It wrote `slots: {}`; nothing
  read it, because the receiver reads config and never slots, so it cost nothing until the
  receiver started carrying instances across migrations and `upgradeInstance` validated what it
  produced. Every real `contact-form` in both stores carries this slot, so the fixture now
  writes what they write.
- **`SeedFormOptions.alsoModules`** — further stored modules on the page, verbatim, so a test
  can seed a module type the catalogue has never heard of.

## Test plan

`tests/test_UAT_FC_BUG-95_stored_version.workers.test.ts` — inside workerd, against a real D1
carrying `db/migrations` and a real R2 bucket, reading module instances out of a real frozen
`site_revisions` snapshot:

- **The silent failure, asserted directly**: a `contact-form` stored at v5 carrying
  `asset`/`assetName`/`assetUrl` delivers its download on submission, and the mail names the
  artifact — the name lives in `assetName`, a key no v7 contract declares, so a message carrying
  it can only have come through the migration. Today it delivers nothing and reports success.
- A v5 instance carrying no asset still sends nothing — the benign case stays benign, and the
  fix does not invent a delivery.
- A v6 instance carrying assets sends, per `contactFormV6ToV7`'s rule that it names `asset`.
- The store is not rewritten by a read: after a submission, the stored instance is still at the
  version it was, byte for byte — not merely still pinned at v5, since the triple quietly
  becoming a list would be the same defect wearing the store's clothes.
- An instance at the current version takes no upgrade path at all: it delivers as it always did
  and its stored bytes are unchanged. Every live site is this shape, so the whole of what this
  change owes them is to be invisible.
- A module type the catalogue does not know is left alone rather than thrown on, matching
  `upgradePageModules`'s existing rule — the submission captures rather than 500s, because a
  lead lost to a throw is a worse answer than the one this ticket started from.
- The XGD shape: home's v5 waitlist form and whitepapers' v7 gated form on one site both behave
  correctly on the same submission path, because the version is a property of the *instance* and
  not of the site.

Regression scope: full workers suite (963 tests) and the full default suite. Two failures in the
default suite (`bug32-webui-scope-rebrand`, `test_UAT_FC_BUG-67_backend_settings`) are
pre-existing and reproduce unchanged on `xgd-working`.