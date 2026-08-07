---
uid: story-8685be2d
id: STORY-92
type: story
title: 'Font provenance: every font file in the project is accounted for, and an unresolved
  licence cannot ship as product'
created_by: xgd
created_at: '2026-08-06T03:29:03.843623+00:00'
updated_at: '2026-08-07T15:52:04.577082+00:00'
completed_at: null
last_field_updated: capability_uid
status: completed
fields:
  intent_uid: bundle-ee56a66e
  capability_uid: capability-b4ac88fc
  story_kind: feature
  story_points: 3
---

## Story
**As a** maintainer of the platform, **I want** every font file in the project to
carry a recorded provenance and licence, with a check that fails when bytes are
unaccounted for or when a site that ships across customer domains uses a face
whose product-redistribution question is unanswered, **so that** a licence
obligation is discovered at the moment a font is taken rather than after it has
been served from ten thousand customer sites.

## Description
This story documents the project's **font provenance record** and the **check
that enforces it**. Before this work there was no record of where any font came
from or what its licence permitted: every font in the repo had arrived as a side
effect of a capture bundle, mirroring a third party's serving infrastructure,
and nothing anywhere stated whether those bytes could be used, self-hosted, or
shipped as part of the product.

**Provenance is a separate question from binding.** The substrate already binds a
family handle to the file that serves it — that is about pixels. This capability
is about obligations: origin, licence terms, and what those terms permit. The two
travel on the same file and have entirely different answers.

**The load-bearing distinction is between two questions.** *"May we use this on a
site we run ourselves"* and *"may we ship this across ten thousand customer
sites"* have different answers, because commercial webfont licences are
per-licensee — an agency or hosting platform is typically barred from buying one
and sharing it across client sites. So the record carries a **three-state** answer
to the second question: settled yes, settled no, and **asked but not yet
answered**. A boolean cannot tell "we checked and the answer is no" apart from
"nobody has asked", and those need different follow-up. Every gate treats the
unresolved state as *no*, which is what forces the second question to be answered
when a font is taken rather than discovered later.

**A site declares which question it is asking.** A site the platform builds and
serves itself is held to the looser bar — a free font with an unresolved product
question is fine there. A site asserting it ships as part of the product across
customer domains is held to the strict one. The marker is part of the validated
site contract, and its absence means the looser bar.

**Provenance is demanded of the file, not of the reference to it.** Joining only
what a page references leaves invisible exactly the class that matters most: a
capture bundle mirrors a third party's fonts into the repo, and those bytes are
present whether or not any page points at them — with precisely the redistribution
status least likely to be clear. So the check scans the source trees on disk as
well as the references, and unaccounted bytes fail it. That turns "the existing
fonts are recorded" from a state someone asserted once into a live gate holding in
both directions.

**Registration is provenance, not approval.** A recorded family with outstanding
licence work warns and passes — that is exactly the state a font legitimately sits
in while cleared for this repo and not yet cleared for the product. Forcing a
premature yes/no would make the record dishonest. The blocking gate is the
redistribution answer alone.

**In scope.** The record's contract and its validation; the four ways a font can
fail the check (a referenced family nothing accounts for, a family recorded but
this file not listed, bytes on disk nothing records, and a product-distributed
site referencing a face whose redistribution is not settled yes); the advisory
warning channel; the distribution marker; the report and its machine-readable
form; and the record's own integrity being a hard error rather than a vacuous
pass.

**Out of scope.** There is deliberately **no acquisition verb** — no command that
downloads a font and registers it. The gap this work closed is *tracking*, not
automation, and a download command is only useful once the font menu it would draw
from exists. Also out of scope: licence purchasing workflows, per-foundry OEM
negotiation, and any enforcement on a published page at serving time. This is a
build-time compliance boundary.

## Technical Context
- **Intent/implementation divergence — the acquisition path.** The intent ticket's
  gap statement opens by naming *"no font-acquisition path"*, but the operator
  direction and every one of the intent's own acceptance items are about tracking.
  No acquisition verb was built, and the intent records that as a deliberate
  omission. This story is scoped to what the operator directed, not to the
  ticket's opening sentence.
- **Divergence — invalid site definitions are skipped by the reference join.** A
  site whose definition does not currently validate is passed over rather than
  thrown on, so a font-licence gate never becomes the thing reporting an unrelated
  schema error. The consequence is that a broken site's *references* are not
  gated; its font *files* are still caught by the on-disk scan. The intent is
  silent on this. No criterion below asserts it, but regression should surface it
  if the trade-off is later judged wrong.
- **Divergence — two permissions are recorded but not gated.** The record carries
  answers for commercial use and self-hosting alongside product redistribution,
  but only the redistribution answer is enforced today. The other two are
  provenance a human reads. The intent describes all three as recorded and names
  only redistribution as the gate, so this is consistent — noted because a reader
  may expect three gates and finds one.
- **Divergence — the pass line under-describes the pass.** The report's closing
  line speaks only of referenced fonts being registered, while the pass it
  announces also covers the on-disk scan. Cosmetic; the criteria below are written
  against what the check actually decides.
- Scan scope differs by direction and deliberately so: the reference join reads
  the site trees, while the on-disk scan covers the whole storage area minus
  derived render output and vendored dependency trees — so capture reference
  mirrors, which no site references, are still held to account.
- The record is a project-level artifact; the font files themselves remain
  per-site so a site stays self-contained and portable. The record is the index
  over them, not their home.
- The record's schema and validator live with the site-definition schemas rather
  than with the command, so the contract has one canonical home and the command is
  only the enforcement half.
- Backfill state at the time of writing: 23 files across 10 families in two
  provenance classes — deliberately downloaded (authored) and capture-derived —
  with seven families carrying open licence actions that warn and pass. Those
  counts are repo state, not capability surface; no criterion is written against
  them, only against the gate that keeps them honest.
- Site definition data is not capability surface. No criterion is written against
  any particular site's fonts.

## Dependencies
None.

## Story Points
3