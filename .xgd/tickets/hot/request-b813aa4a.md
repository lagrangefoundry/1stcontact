---
uid: request-b813aa4a
id: REQ-179
type: request
title: The business selector is shell chrome, not a tab's toolbar
created_by: xgd
created_at: '2026-09-02T23:15:33.822429+00:00'
updated_at: '2026-09-02T23:16:24.203092+00:00'
completed_at: null
last_field_updated: body
status: draft
fields:
  priority: high
  story_points: 2
  auto_merge_back: true
  needs_review: false
---

# The business selector is shell chrome, not a tab's toolbar

## The gap

The site selector is an action in the **site tab's toolbar**
(`apps/control-app/src/builder/app.js:106,115,147`), so it scopes one tab. Every
other tab either ignores it or reaches for it sideways — `app.js:214,231,253,305`
all call `panel.getSite()` to borrow the site tab's selection.

That is the per-tab model, and it does not survive the tab set the product is
growing into. [[DOC-40]] §2 makes the **business** the unit everything belongs
to: CRM, marketing, monitoring, payments, scheduling and the library are all
scoped to it. A person's jobs cross those tabs — *a lead came in from the contact
form, is the form still working, did they pay* is one job over three tabs and one
business — and a selector that must be re-set per tab makes the common path the
painful one.

## The selector moves up

One control, in the shell's chrome, applying to every tab:

- **Header left: the business switcher.** Lists what [[REQ-178]]'s `Admission`
  returned, labelled by `tenants.name`, with lapsed businesses shown and
  unselectable.
- **Header right: the account**, behind the avatar — *not* a tab. It is the one
  surface that is not business-scoped ([[REQ-180]]), and putting it in the tab
  strip would make it the only place where the selector silently does not apply.
  A control that is present and ignored reads as a bug.
- **The tab strip stays uniformly business-scoped**, with no exception to
  explain.

`app.js:158` currently records the rule this ticket replaces — *"the toolbar's
selector is the one place a site is chosen, and a second control would…"* — and
that comment is the design record, so it is rewritten rather than deleted. The
rule it protects (**one** place a scope is chosen, never two) is exactly the rule
this ticket keeps; only the place changes.

## v1: selecting a business selects its site

A business has exactly one site in v1 ([[DOC-40]] §2.3), so the switcher yields
both. The chat pane, the preview, uploads and the palette stop asking the site
tab what is selected and read the shell's scope instead.

This is deliberately **not** a second selector. When several sites per business
arrive, a site selector belongs inside the site tab, subordinate to this one —
and at that point `panel.getSite()` becomes meaningful again, one level down.
Nothing here should make that harder.

## Persistence

The selection survives a reload, so a returning operator lands where they left.
The value is per account and belongs with the existing `STORAGE_KEYS`
namespacing; the server-side half — resolution accepting the target and
authorising it — is [[REQ-168]], and this ticket sends it rather than deciding
it. A stored selection naming a business the account can no longer operate falls
back to the first admissible one rather than erroring.

## Acceptance

- The selector renders in shell chrome and is visible from every tab.
- Changing it re-scopes every mounted tab, not just the site tab.
- No tab reads `panel.getSite()` to discover the scope.
- The account surface is reachable from the avatar and is absent from the tab
  strip.
- A stored selection for a business the account cannot operate falls back
  silently to an admissible one.
- With one business, the switcher is present but claims no more chrome than the
  name — the modal case is one, and it must not look like an unmade choice.

## Ordering

Depends on [[REQ-178]] for the set and on [[REQ-180]] for the endpoint that
serves it. If this lands first it owns a minimal version of that endpoint, on the
[[REQ-170]]/[[REQ-161]] precedent for `webui-list-detail`: whichever ticket
arrives first adds it, a UAT asserts it exists either way, and neither ordering
leaves it out.
