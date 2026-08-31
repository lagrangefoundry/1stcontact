---
uid: story-17ba490e
id: STORY-122
type: story
title: 'Site Locale Identity: A Site Says Where It Is, And Every Page Declares It'
created_by: xgd
created_at: '2026-08-31T12:27:25.034269+00:00'
updated_at: '2026-08-31T12:33:33.153587+00:00'
completed_at: null
last_field_updated: status
status: completed
fields:
  intent_uid: bundle-b3b7c399
  capability_uid: capability-bcbcdaf1
  story_kind: feature
  story_points: 2
---

## Story

**As a** business owner whose site is being built for me, **I want** my site to
record where my business actually is — its country, and where that is not enough,
its language, currency and timezone — **so that** every page it publishes declares
the right language and reading direction, every part of the site that needs to
know reads the same answer, and nothing about my business is guessed and then
frozen into a page I cannot take back.

## Description

A site declares its location as structured configuration: a country code, and
optionally a locale, a currency and a timezone. The last three derive from the
country through a platform derivation table covering 66 countries, each derived
value individually overridable. They remain four separate values rather than one
because they correlate without determining each other — the same currency in two
locales gives a different symbol placement and different separators, so no single
value could express both.

Both of the platform's render paths emit the document's language and text
direction from that one resolution, so they cannot drift apart. Direction is
decided by the script subtag when the locale carries one and by the language
subtag otherwise — the only way two scripts of one language are both right.

A site that declares nothing resolves to the region-free language. That is the
value the hardcoded literal used to be, and it is the honest one: a country
nobody stated must not become a region nobody stated, and the language attribute
is what a screen reader uses to choose pronunciation and what a search index
reads. Currency and timezone take no such care, because there is no region-free
currency and no region-free clock — the default country answers for them or
nothing does.

Anything the platform cannot honestly derive is refused: an unsupported country,
a POSIX-spelled locale, a lowercase currency code or an unknown zone id is a
validation error at a machine-readable path, never a silent fall back to one
country's defaults. The platform's own derivation table is held to exactly the
same validation a site's declaration is, so a mistyped row fails when it is added
rather than when a customer in that country signs up.

The resolved locale identity reaches behavior modules as part of their render
input, so the modules that need it read one answer rather than each deriving its
own.

Alongside the identity, a page slug that is *exactly* a locale segment is
reserved. The match is anchored whole and case-insensitive against the entire
ISO 639-1 language registry, with the numeric region form reserved and the
four-letter script subtag deliberately not — four-letter tails are ordinary
English words and plausible page slugs. The refusal names why the slug is refused
and offers two working alternatives, because a validation failure that reads as
arbitrary gets worked around rather than obeyed.

**In scope**: the declared fields and their derivation; the language and
direction both render paths emit; the locale identity handed to behavior modules;
validation of a site's declaration and of the derivation table; the locale-shaped
slug reservation.

**Out of scope**: turning values into text — formatting money and instants is a
separate capability that reads this one; multilingual sites, which are deferred;
and adopting any locale path prefix. The slug reservation protects the shape
without committing the platform to using it.

## Technical Context

The capability exists ahead of the features that consume it, deliberately. A
published revision is an immutable snapshot: a wrong language attribute or a
colliding slug is baked into artifacts that inbound links and search rankings
already point at, and fixing the renderer does not fix a published artifact.
At implementation time there were zero published revisions, which is the whole
reason the operator did this then rather than when it became obviously needed.

Adding a country is a data edit — one row in the derivation table — not a code
change. A country spanning several civil zones carries one explicit,
documented pick (its largest-population civil zone), which a site overrides by
declaring its own timezone.

Locale validation is well-formedness, not registry membership, for the language
tag: an unrecognised language subtag is far more likely to be a real minority
language than a typo. A timezone is checked against the runtime's own tz
database rather than a pattern or a checked-in list, because the database is the
authority and it changes on its own schedule.

The slug reservation sits on the page's slug field, so it reaches every writer
that validates a site — the command line, the assistant's authoring surface and
the store loader alike — without any of them being changed.

The resolved locale identity is consumed by the Money & Time Formatting Seam
(plan item 11), which reads it rather than re-deriving one.

## Reconciliation Decisions

- **The derivation table is validated as site configuration** (decided at
  reconciliation, 2026-08-31): REQ-151's stated acceptance criteria cover a
  *site's* declaration and are silent on the platform's own country table; the
  landed code and its test hold every row of that table to the same validation a
  site's declaration receives, and assert that each row resolves back to itself.
  Formalised as an AC because the failure mode it forecloses — a mistyped zone or
  a lowercase currency discovered only when a customer in that country signs up —
  is a user-visible defect with a longer feedback loop than anything else in this
  story, and because "adding a country is a one-row data edit" is only a safe
  claim if the row is checked. Formalised as AC-1435.

- **The slug reservation is asserted at an authoring entry point, not only at the
  schema** (decided at reconciliation, 2026-08-31): REQ-153's acceptance criteria
  state the refusal as a validation outcome; its test plan additionally proves the
  guard is *reachable* from the page-creation command and leaves no half-written
  page behind. The AC is stated at the authoring boundary rather than at the
  validator, because a reservation that exists in a schema no writer reaches is
  indistinguishable from one that does not exist. Formalised as AC-1436.

- **No-regression covers published revisions, not just drafts** (decided at
  reconciliation, 2026-08-31): REQ-153 AC-3 says "both existing sites still
  validate"; the landed test validates every stored site's draft *and every
  published revision*, since a frozen revision could not be rescued by an edit.
  Folded into the no-regression AC, stated over stored sites generally rather
  than over two named ones, so it cannot pass vacuously or go stale. Formalised
  as part of AC-1428.

**No intent/code contradiction was found.** The one apparent tension —
REQ-151's "what to change" says the country defaults to `US` (which would derive
`en-US`) while its AC-1 asks for `en` when nothing is declared — is resolved
explicitly in the ticket's own implementation record: a declared `US` is a fact
about the business and derives `en-US`; declaring nothing is the absence of that
fact and resolves to the region-free `en`. Both readings are honoured and the
ACs below follow that resolution.

## Dependencies

None.

## Story Points

2