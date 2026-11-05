---
uid: acceptance_criterion-598ae471
id: AC-2329
type: acceptance_criterion
title: A site that declares accounts carries account-chrome with every state in its
  published bytes; a site that does not carries none
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-05T21:26:07.515541+00:00'
updated_at: '2026-11-05T21:26:07.515541+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-179b8c06
  kind: behavior
  regression_only: false
---

## Criterion
Whether a site has accounts is something the **site declares**, once, in its own
definition (`config.capabilities.accounts`). It is never derived from whether
the business has any members yet: the first member signs up *by using* the Sign
In control, so a derived flag would hide it exactly when it is needed.

- **Declared:** a page that binds `account-chrome` to an L1 slot publishes the
  chrome into that slot, with **all three states present in the published
  bytes**: the signed-out Sign In control, the signed-in portal link, and the
  builder ("My businesses") link. The module root says which state is current;
  as published (no session known) it says **signed out**. The states that are not
  current are hidden by the module's own state rules, not by anything L1 authors.
  The builder link is a third state of its own, shown only when the page marks
  the signed-in person as operating at least one business. That is a fact about
  the person, not about the site.
- **Not declared**, or declared `false`: the same page publishes **nothing** for
  that instance. No control leads a visitor of a brochure site to a dead end.
- The capability record is **closed**: a key that is not a capability the
  platform ships (e.g. a misspelt `acounts`) fails site validation. It is not
  silently ignored.
- Nothing in the published chrome varies by **which site or which business**
  it is rendered for. Two sites with the same config, slots and capability
  render the same chrome, and the module has no branch naming a site, tenant
  or business.

## Observable at
The published HTML for a page on a site with and without the declaration, and
the result of validating a site definition.
