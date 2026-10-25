---
uid: comment-def246ab
id: COMMENT-3005
type: comment
title: Comment on bug BUG-95
created_by: xgd
created_at: '2026-09-15T21:51:15.732614+00:00'
updated_at: '2026-09-15T22:14:10.393001+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-7e726ecf
  kind: chat_transcript
---

<!-- xgd-turn id="c1af503a-9230-46e0-abac-b2b1e449d2f8-user" -->

<!-- xgd-chat role="user" ts="2026-09-15T21:50:31.719805+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="c1af503a-9230-46e0-abac-b2b1e449d2f8-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-15T22:14:09.792016+00:00" -->
#### Claude
I'll start by reading the ticket to understand what's being asked.

Ticket is clear and well-specified. One judgement call I'll flag rather than block on: the fix deliberately reverses an existing UAT (`test_UAT_FC_REQ-241_a_revision_published_before_this_ticket_still_resolves`), which currently asserts that a v5 form *does not* deliver. BUG-95 names that exact behaviour as the defect, so I'll supersede it and record that in the body.

Starting the free-coding flow.

Now the code change in `lead.ts`:

Now the fixture, so it can seed v5/v6 instances faithfully (with a real `form` slot, as every real stored instance carries):

Now wire `sendsTemplateOf` into email-page materialisation and add `alsoModules` to the page:

Now the UAT file:

Now update the REQ-241 UAT that asserts the superseded behaviour:

Full workers suite green (963 tests). Now the node and default suites:

Now update the ticket body to cover the implemented shape — including the supersession, which the original body didn't name:

Now bump the version and commit:

Done. BUG-95 is at `free_coded`, commit `0cf4779053` merged into `xgd-working`, version `0.2.205`.

## What I built

**`currentShapeOf` in `apps/control-app/src/lead.ts`** — `formDefinitionOf` now matches the named instance and carries it to the catalogue's current contract *before* a line of its config is read. Every reading below it (fields, `assetsIn`, `acceptsIn`, `template`) is unambiguously the current version's, whatever version the frozen revision holds. Nothing is written; the store keeps its pin.

Implementation decisions worth surfacing:

- **Reuses `upgradePageModules`** rather than restating any rule — including "a type the catalogue has never heard of is left alone". It was already exported from `@1stcontact/framework/worker` for exactly this class of caller, so nothing new had to be made reachable.
- **Carries only the matched instance, not the page.** A failing migration throws; a page-wide pass would let one broken sibling take down a submission to a well-formed form.
- **A migration that genuinely cannot run still throws, uncaught.** Catching it and returning `null` would reproduce the defect — contact captured, visitor told it worked, nothing sent. This is the ticket's fix-shape (2) surviving inside fix-shape (1). Same stance `assembleSite` already takes for the render path (BUG-91).

## The one thing that needs your eye

I inverted an existing UAT. `test_UAT_FC_REQ-241_a_revision_published_before_this_ticket_still_resolves` asserted that a v5 form deliberately does *not* deliver, reasoning that reading both shapes would be the legacy-alias mode this codebase refuses. Nothing here reads two shapes — the instance crosses its declared migrations and then exactly one shape is read — so that alias never exists, and what the old reading shipped was the silent non-delivery. It's still an `FC_`-named test so no AC is invalidated, but the supersession is written into the ticket body so reconciliation treats BUG-95 as authoritative on that point.

## Evidence

`tests/test_UAT_FC_BUG-95_stored_version.workers.test.ts` — 7 cases in workerd against real D1/R2, reading out of a real frozen `site_revisions` snapshot. Verified RED: with the fix reverted, the three delivery cases fail; the other four are invariants (benign case stays benign, current version unaffected, unknown type not thrown on, XGD's mixed-version shape).

Regression: full workers suite 963/963 pass; full default suite 4222 pass with 2 failures (`bug32-webui-scope-rebrand`, `BUG-67_backend_settings`) that I confirmed reproduce unchanged on `xgd-working` — pre-existing and unrelated. `pnpm -r build` clean.

Fixture changes to `tests/support/lead-site.ts`: `storedVersion` (pin at 5/6/7, config written in that version's shape), email pages materialised for the message a form *sends* rather than the key its config spells, every seeded instance now carries its required `form` slot as every real stored one does, and `alsoModules` for seeding a non-form module.

<!-- xgd-chat-end -->